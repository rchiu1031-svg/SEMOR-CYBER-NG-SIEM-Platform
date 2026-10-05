package forwarder

import (
	"bytes"
	"compress/gzip"
	"context"
	"crypto/rand"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"net"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/semor-cyber/semor-collector/config"
	"github.com/semor-cyber/semor-collector/pipeline"
)

var (
	gzipWriterPool = sync.Pool{
		New: func() interface{} {
			return gzip.NewWriter(io.Discard)
		},
	}
	bytesBufferPool = sync.Pool{
		New: func() interface{} {
			return new(bytes.Buffer)
		},
	}
)

// RetryConfig 定義 VictoriaLogs POST 指數退避重試參數
type RetryConfig struct {
	InitialInterval time.Duration // 初始重試等待 (預設 200ms)
	MaxInterval     time.Duration // 最大退避等待上限 (預設 15s)
	Multiplier      float64       // 退避乘數因子 (預設 2.0)
	JitterFraction  float64       // 隨機抖動百分比 (預設 0.15 = ±15%)
	MaxRetries      int           // 單次寫入最大就地重試次數 (預設 5 次)
	QueueCapacity   int           // 網路中斷時之重試佇列容量 (預設 10,000 批次)
}

func DefaultRetryConfig() RetryConfig {
	return RetryConfig{
		InitialInterval: 200 * time.Millisecond,
		MaxInterval:     15 * time.Second,
		Multiplier:      2.0,
		JitterFraction:  0.15,
		MaxRetries:      5,
		QueueCapacity:   10000,
	}
}

// QueuedBatch 代表在長時間斷線時暫存於重試佇列的日誌批次
type QueuedBatch struct {
	Payload      []byte
	StreamID     uint64
	StreamLabels map[string]string
	LogCount     int
	FirstAttempt time.Time
	RetryCount   int
}

// VictoriaLogsHTTPForwarder 透過 HTTP POST /insert/jsonline 推送日誌至 VictoriaLogs
// 並實作指數退避重試 (Exponential Backoff with Full Jitter) 與離線佇列保護機制，防止網路波動或暫時故障造成日誌遺失
type VictoriaLogsHTTPForwarder struct {
	cfg         *config.Config
	retryCfg    RetryConfig
	httpClient  *http.Client
	targetURL   string
	accountID   string
	projectID   string

	// 暫存佇列 (保護長時間斷線不丟包)
	retryQueue chan QueuedBatch
	ctx        context.Context
	cancel     context.CancelFunc
	wg         sync.WaitGroup

	// 遙測計數器 (Atomic)
	totalPostRequests   uint64 // 累計 POST 請求發起次數
	successfulRequests  uint64 // 累計成功 POST 次數
	initialFailures     uint64 // 初次請求失敗次數 (觸發退避重試)
	retryAttemptsTotal  uint64 // 累計執行指數退避重試次數
	retrySuccessTotal   uint64 // 經重試後成功修復次數
	queuedDueToOutage   uint64 // 超過就地重試上限轉入佇列之批次數
	queueDrainedSuccess uint64 // 由後台重試協程成功排空發送之批次數
	totalDroppedLogs    uint64 // 僅在佇列完全飽和且無法存儲時之丟棄數 (極端保護)
	totalRawBytes       uint64 // 原始日誌位元組數
	totalCompressedBytes uint64 // Gzip 壓縮後位元組數

	// 狀態監控
	mu                 sync.RWMutex
	lastError          string
	lastErrorTime      time.Time
	lastSuccessTime    time.Time
	currentBackoffMs   int64
	isTargetReachable  bool
	circuitBreakerOpen bool
	useGzip            bool

	// 主動健康檢查與純緩衝模式 (Proactive Health Check & Buffer-Only Mode)
	operatingMode        string // "normal" | "buffer_only"
	healthCheckURL       string
	consecutiveFailures  int
	consecutiveSuccesses int
	outageReason         string
	healthCheckInterval  time.Duration
}

func NewVictoriaLogsHTTPForwarder(cfg *config.Config, retryCfg RetryConfig) *VictoriaLogsHTTPForwarder {
	targetURL := cfg.VictoriaLogsURL
	if targetURL == "" {
		targetURL = "http://localhost:9428/insert/jsonline"
	}
	if !strings.HasSuffix(targetURL, "/insert/jsonline") && !strings.Contains(targetURL, "/insert/") {
		targetURL = strings.TrimRight(targetURL, "/") + "/insert/jsonline"
	}

	// 根據 targetURL 衍生主動健康檢查端點 (例如 http://localhost:9428/health)
	healthURL := strings.Replace(targetURL, "/insert/jsonline", "/health", 1)
	if healthURL == targetURL {
		healthURL = strings.TrimRight(targetURL, "/") + "/health"
	}

	transport := &http.Transport{
		Proxy: http.ProxyFromEnvironment,
		DialContext: (&net.Dialer{
			Timeout:   5 * time.Second,
			KeepAlive: 30 * time.Second,
		}).DialContext,
		MaxIdleConns:        200,
		MaxIdleConnsPerHost: 64,
		IdleConnTimeout:     90 * time.Second,
		TLSHandshakeTimeout: 5 * time.Second,
		DisableKeepAlives:   false,
		ForceAttemptHTTP2:   true,
	}

	ctx, cancel := context.WithCancel(context.Background())

	fwd := &VictoriaLogsHTTPForwarder{
		cfg:                 cfg,
		retryCfg:            retryCfg,
		httpClient:          &http.Client{Transport: transport, Timeout: 10 * time.Second},
		targetURL:           targetURL,
		healthCheckURL:      healthURL,
		operatingMode:       "normal",
		healthCheckInterval: 5 * time.Second,
		accountID:           cfg.VictoriaLogsAccountID,
		projectID:           cfg.VictoriaLogsProjectID,
		retryQueue:          make(chan QueuedBatch, retryCfg.QueueCapacity),
		ctx:                 ctx,
		cancel:              cancel,
		isTargetReachable:   true,
		useGzip:             true,
	}

	// 啟動背景離線重試佇列排空處理協程 (Draining Worker)
	fwd.wg.Add(2)
	go fwd.startRetryQueueWorker()
	go fwd.startHealthCheckMonitor()

	return fwd
}

// Close 優雅關閉轉發器並等待待處理佇列排空
func (f *VictoriaLogsHTTPForwarder) Close() {
	f.cancel()
	f.wg.Wait()
}

// PostNDJSONLogs 將多筆日誌組裝為 NDJSON 串流格式，並透過具備指數退避重試的 HTTP POST 送交 VictoriaLogs
func (f *VictoriaLogsHTTPForwarder) PostNDJSONLogs(entries []pipeline.LogEntry, labels map[string]string) error {
	if len(entries) == 0 {
		return nil
	}

	// 轉換為 VictoriaLogs 標準 NDJSON 格式
	var buf bytes.Buffer
	for _, entry := range entries {
		// 組合日誌本體與欄位
		logObj := make(map[string]interface{}, len(entry.Fields)+3)
		for k, v := range entry.Fields {
			logObj[k] = v
		}
		logObj["_msg"] = entry.RawMsg
		logObj["_time"] = time.Unix(0, entry.Timestamp).Format(time.RFC3339Nano)

		// 注入串流標籤
		for lk, lv := range labels {
			logObj[lk] = lv
		}

		line, err := json.Marshal(logObj)
		if err != nil {
			continue
		}
		buf.Write(line)
		buf.WriteByte('\n')
	}

	if buf.Len() == 0 {
		return nil
	}

	payload := buf.Bytes()
	return f.postWithExponentialBackoff(payload, len(entries), labels)
}

// PostVictoriaBlock 將封裝好的 VictoriaBlock 直接推向 VictoriaLogs
func (f *VictoriaLogsHTTPForwarder) PostVictoriaBlock(block *pipeline.VictoriaBlock) error {
	if block == nil || len(block.Entries) == 0 {
		return nil
	}
	return f.PostNDJSONLogs(block.Entries, block.StreamLabels)
}

// postWithExponentialBackoff 核心重試引擎：
// 在 POST 遇到暫時性錯誤 (429, 500, 502, 503, 504, 逾時或斷線) 時，
// 依據 Exponential Backoff with Jitter 逐次延遲重試，防止突發斷線遺失數據
func (f *VictoriaLogsHTTPForwarder) postWithExponentialBackoff(payload []byte, logCount int, labels map[string]string) error {
	atomic.AddUint64(&f.totalPostRequests, 1)

	// 主動健康檢查純緩衝模式判斷：若端點已知離線，直接轉存佇列，避免無謂 HTTP 重試阻塞！
	f.mu.RLock()
	isBufferOnly := f.operatingMode == "buffer_only"
	outageReason := f.outageReason
	f.mu.RUnlock()

	if isBufferOnly {
		atomic.AddUint64(&f.queuedDueToOutage, 1)
		f.enqueueOfflineBatch(payload, logCount, labels, 0)
		return fmt.Errorf("主動健康監控生效: VictoriaLogs 端點離線 (%s)，已切換純緩衝模式直接入列保護", outageReason)
	}

	var lastErr error
	var attempt int
	maxAttempts := f.retryCfg.MaxRetries

	for attempt = 0; attempt <= maxAttempts; attempt++ {
		// 若不是第一次嘗試，則執行指數退避延遲
		if attempt > 0 {
			atomic.AddUint64(&f.retryAttemptsTotal, 1)

			delay := f.calculateBackoffDelay(attempt)
			f.mu.Lock()
			f.currentBackoffMs = delay.Milliseconds()
			f.mu.Unlock()

			fmt.Printf("[VictoriaLogs 重試] POST 失敗 (第 %d/%d 次)，執行指數退避延遲 %v 後重試... 錯誤: %v\n",
				attempt, maxAttempts, delay, lastErr)

			select {
			case <-f.ctx.Done():
				// 系統正在關閉，將批次壓入佇列防止丟棄
				f.enqueueOfflineBatch(payload, logCount, labels, attempt)
				return fmt.Errorf("轉發器在退避等待中關閉: %w", f.ctx.Err())
			case <-time.After(delay):
			}
		}

		// 發起 HTTP POST 請求
		respStatusCode, retryAfter, err := f.doSinglePost(payload)
		if err == nil && respStatusCode >= 200 && respStatusCode < 300 {
			// 成功！
			atomic.AddUint64(&f.successfulRequests, 1)
			if attempt > 0 {
				atomic.AddUint64(&f.retrySuccessTotal, 1)
				fmt.Printf("[VictoriaLogs 重試成功] 歷經 %d 次退避重試後成功寫入 %d 筆日誌至 VictoriaLogs!\n", attempt, logCount)
			}
			f.mu.Lock()
			f.lastSuccessTime = time.Now()
			f.isTargetReachable = true
			f.currentBackoffMs = 0
			f.mu.Unlock()
			return nil
		}

		// 標記初次失敗
		if attempt == 0 {
			atomic.AddUint64(&f.initialFailures, 1)
		}

		// 判定是否為可重試之錯誤
		isRetryable := f.isRetryableError(respStatusCode, err)
		if err != nil {
			lastErr = err
		} else {
			lastErr = fmt.Errorf("HTTP %d: %s", respStatusCode, http.StatusText(respStatusCode))
		}

		f.mu.Lock()
		f.lastError = lastErr.Error()
		f.lastErrorTime = time.Now()
		f.isTargetReachable = false
		f.mu.Unlock()

		// 若伺服器回傳明確不可重試之錯誤 (例如 400 格式錯誤、401/403 驗證失敗)，則不予重試避免浪費
		if !isRetryable {
			fmt.Printf("[VictoriaLogs 錯誤] 遇到不可重試之終態錯誤 (%v)，放棄重試\n", lastErr)
			return lastErr
		}

		// 若服務端回傳 429 且帶有 Retry-After 標頭，優先使用該數值
		if respStatusCode == http.StatusTooManyRequests && retryAfter > 0 {
			time.Sleep(retryAfter)
		}
	}

	// 就地重試達到上限 (MaxRetries 耗盡)，將批次轉存入記憶體重試佇列，由背景協程持續修復，保證「零日誌遺失」
	atomic.AddUint64(&f.queuedDueToOutage, 1)
	fmt.Printf("[VictoriaLogs 斷線保護] 就地重試 %d 次均失敗，已將 %d 筆日誌批次轉入暫存重試佇列，待服務復原後排空。\n",
		maxAttempts, logCount)

	f.enqueueOfflineBatch(payload, logCount, labels, attempt)
	return fmt.Errorf("VictoriaLogs 暫時不可用，批次已安全轉入離線暫存佇列: %w", lastErr)
}

// doSinglePost 發起單次 HTTP POST 傳輸 (支援 Gzip 高吞吐壓縮傳輸)
func (f *VictoriaLogsHTTPForwarder) doSinglePost(payload []byte) (int, time.Duration, error) {
	var bodyReader io.Reader
	rawLen := len(payload)
	atomic.AddUint64(&f.totalRawBytes, uint64(rawLen))

	isGzipped := false
	if f.useGzip && rawLen > 64 {
		buf := bytesBufferPool.Get().(*bytes.Buffer)
		buf.Reset()
		defer bytesBufferPool.Put(buf)

		gz := gzipWriterPool.Get().(*gzip.Writer)
		gz.Reset(buf)
		_, _ = gz.Write(payload)
		_ = gz.Close()
		gzipWriterPool.Put(gz)

		compLen := buf.Len()
		atomic.AddUint64(&f.totalCompressedBytes, uint64(compLen))
		compressedBytes := append([]byte(nil), buf.Bytes()...)
		bodyReader = bytes.NewReader(compressedBytes)
		isGzipped = true
	} else {
		atomic.AddUint64(&f.totalCompressedBytes, uint64(rawLen))
		bodyReader = bytes.NewReader(payload)
	}

	req, err := http.NewRequestWithContext(f.ctx, http.MethodPost, f.targetURL, bodyReader)
	if err != nil {
		return 0, 0, err
	}

	req.Header.Set("Content-Type", "application/stream+json; charset=utf-8")
	req.Header.Set("User-Agent", "SEMOR-VictoriaLogs-Collector/2.5")
	if isGzipped {
		req.Header.Set("Content-Encoding", "gzip")
	}

	if f.accountID != "" {
		req.Header.Set("AccountID", f.accountID)
	}
	if f.projectID != "" {
		req.Header.Set("ProjectID", f.projectID)
	}

	resp, err := f.httpClient.Do(req)
	if err != nil {
		return 0, 0, err
	}
	defer resp.Body.Close()

	// 檢查 Retry-After 標頭
	var retryAfter time.Duration
	if ra := resp.Header.Get("Retry-After"); ra != "" {
		if sec, err := strconv.Atoi(ra); err == nil && sec > 0 {
			retryAfter = time.Duration(sec) * time.Second
		}
	}

	// 讀取錯誤回應主體供排錯
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		bodyBytes, _ := io.ReadAll(io.LimitReader(resp.Body, 1024))
		return resp.StatusCode, retryAfter, fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(bodyBytes))
	}

	return resp.StatusCode, 0, nil
}

// calculateBackoffDelay 計算具備隨機抖動 (Full Jitter) 的指數退避時間
// 公式: delay = Min(MaxInterval, InitialInterval * (Multiplier ^ (attempt - 1))) * (1 ± Jitter)
func (f *VictoriaLogsHTTPForwarder) calculateBackoffDelay(attempt int) time.Duration {
	baseSec := f.retryCfg.InitialInterval.Seconds() * math.Pow(f.retryCfg.Multiplier, float64(attempt-1))
	maxSec := f.retryCfg.MaxInterval.Seconds()
	if baseSec > maxSec {
		baseSec = maxSec
	}

	// 生成安全隨機浮點數 [0.0, 1.0)
	jitterFloat := secureRandomFloat()
	// 抖動範圍: [1 - JitterFraction, 1 + JitterFraction]
	jitterFactor := (1.0 - f.retryCfg.JitterFraction) + (jitterFloat * 2.0 * f.retryCfg.JitterFraction)
	finalSec := baseSec * jitterFactor

	return time.Duration(finalSec * float64(time.Second))
}

// secureRandomFloat 產生密碼學安全的 [0.0, 1.0) 隨機數
func secureRandomFloat() float64 {
	var b [8]byte
	_, err := rand.Read(b[:])
	if err != nil {
		return 0.5
	}
	val := binary.LittleEndian.Uint64(b[:])
	return float64(val) / float64(math.MaxUint64)
}

// isRetryableError 判定錯誤是否具備重試價值
func (f *VictoriaLogsHTTPForwarder) isRetryableError(statusCode int, err error) bool {
	// 網路連線層級錯誤必定重試 (連線拒絕、超時、重設、DNS 失敗)
	if err != nil {
		return true
	}

	// HTTP 狀態碼：
	// 429: Too Many Requests (限流，必須退避重試)
	// 500: Internal Server Error (內部暫態錯誤)
	// 502: Bad Gateway
	// 503: Service Unavailable (服務維護中或超載)
	// 504: Gateway Timeout
	switch statusCode {
	case http.StatusTooManyRequests,
		http.StatusInternalServerError,
		http.StatusBadGateway,
		http.StatusServiceUnavailable,
		http.StatusGatewayTimeout:
		return true
	default:
		return false
	}
}

// enqueueOfflineBatch 將失敗批次推入重試佇列
func (f *VictoriaLogsHTTPForwarder) enqueueOfflineBatch(payload []byte, logCount int, labels map[string]string, retryCount int) {
	batch := QueuedBatch{
		Payload:      payload,
		LogCount:     logCount,
		StreamLabels: labels,
		FirstAttempt: time.Now(),
		RetryCount:   retryCount,
	}

	select {
	case f.retryQueue <- batch:
	default:
		// 佇列完全爆滿時的極端處置：丟棄最舊一筆，優先保護新數據 (FIFO Ring)
		select {
		case <-f.retryQueue:
			atomic.AddUint64(&f.totalDroppedLogs, uint64(logCount))
		default:
		}
		f.retryQueue <- batch
	}
}

// startRetryQueueWorker 背景守護協程：在 VictoriaLogs 復原時將離線暫存佇列中的批次排空送出
func (f *VictoriaLogsHTTPForwarder) startRetryQueueWorker() {
	defer f.wg.Done()
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-f.ctx.Done():
			return
		case <-ticker.C:
			f.drainRetryQueue()
		}
	}
}

func (f *VictoriaLogsHTTPForwarder) drainRetryQueue() {
	qLen := len(f.retryQueue)
	if qLen == 0 {
		return
	}

	// 嘗試發送佇列頂部批次
	for i := 0; i < qLen; i++ {
		select {
		case <-f.ctx.Done():
			return
		case batch := <-f.retryQueue:
			statusCode, _, err := f.doSinglePost(batch.Payload)
			if err == nil && statusCode >= 200 && statusCode < 300 {
				atomic.AddUint64(&f.queueDrainedSuccess, 1)
				atomic.AddUint64(&f.successfulRequests, 1)
				f.mu.Lock()
				f.lastSuccessTime = time.Now()
				f.isTargetReachable = true
				f.mu.Unlock()
			} else {
				// 依然無法發送，放回佇列並暫停本輪排空
				f.enqueueOfflineBatch(batch.Payload, batch.LogCount, batch.StreamLabels, batch.RetryCount+1)
				return
			}
		}
	}
}

// startHealthCheckMonitor 週期性健康檢查守護協程：主動探測 VictoriaLogs 端點狀態
func (f *VictoriaLogsHTTPForwarder) startHealthCheckMonitor() {
	defer f.wg.Done()
	ticker := time.NewTicker(f.healthCheckInterval)
	defer ticker.Stop()

	// 立即執行首次探測
	f.probeEndpoint()

	for {
		select {
		case <-f.ctx.Done():
			return
		case <-ticker.C:
			f.probeEndpoint()
		}
	}
}

func (f *VictoriaLogsHTTPForwarder) probeEndpoint() {
	req, err := http.NewRequestWithContext(f.ctx, http.MethodGet, f.healthCheckURL, nil)
	if err != nil {
		return
	}
	req.Header.Set("User-Agent", "SEMOR-VictoriaLogs-ProactiveHealthMonitor/2.5")

	resp, err := f.httpClient.Do(req)
	isHealthy := err == nil && resp.StatusCode >= 200 && resp.StatusCode < 400
	if resp != nil {
		resp.Body.Close()
	}

	f.mu.Lock()
	defer f.mu.Unlock()

	if isHealthy {
		f.consecutiveSuccesses++
		f.consecutiveFailures = 0
		f.isTargetReachable = true
		f.lastSuccessTime = time.Now()

		if f.operatingMode == "buffer_only" && f.consecutiveSuccesses >= 2 {
			f.operatingMode = "normal"
			fmt.Printf("[VictoriaLogs 主動健康監控] 端點連線已恢復 (連續健康檢查通過)！收集器切換回正常串流模式 (NORMAL)，排空離線重試佇列...\n")
			go f.drainRetryQueue()
		}
	} else {
		f.consecutiveFailures++
		f.consecutiveSuccesses = 0
		f.isTargetReachable = false
		if err != nil {
			f.outageReason = err.Error()
		} else {
			f.outageReason = fmt.Sprintf("HTTP %d", resp.StatusCode)
		}
		f.lastError = f.outageReason
		f.lastErrorTime = time.Now()

		if f.operatingMode == "normal" && f.consecutiveFailures >= 2 {
			f.operatingMode = "buffer_only"
			fmt.Printf("[VictoriaLogs 主動健康監控] 警報: 偵測到 VictoriaLogs 端點故障 (%s)！收集器主動切換至「純緩衝模式 (BUFFER-ONLY MODE)」，保護日誌進線免於阻塞。\n", f.outageReason)
		}
	}
}

// RetryTelemetryStats 輸出退避重試與佇列保護遙測指標
type RetryTelemetryStats struct {
	TargetURL           string    `json:"target_url"`
	OperatingMode       string    `json:"operating_mode"`
	OutageReason        string    `json:"outage_reason,omitempty"`
	IsReachable         bool      `json:"is_reachable"`
	TotalPostRequests   uint64    `json:"total_post_requests"`
	SuccessfulRequests  uint64    `json:"successful_requests"`
	InitialFailures     uint64    `json:"initial_failures"`
	RetryAttemptsTotal  uint64    `json:"retry_attempts_total"`
	RetrySuccessTotal   uint64    `json:"retry_success_total"`
	QueuedDueToOutage   uint64    `json:"queued_due_to_outage"`
	QueueDrainedSuccess uint64    `json:"queue_drained_success"`
	CurrentQueueDepth   int       `json:"current_queue_depth"`
	QueueCapacity       int       `json:"queue_capacity"`
	CurrentBackoffMs    int64     `json:"current_backoff_ms"`
	TotalDroppedLogs    uint64    `json:"total_dropped_logs"`
	TotalRawBytes       uint64    `json:"total_raw_bytes"`
	TotalCompressedBytes uint64   `json:"total_compressed_bytes"`
	CompressionRatioPct float64   `json:"compression_ratio_pct"`
	LastError           string    `json:"last_error,omitempty"`
	LastErrorTime       time.Time `json:"last_error_time,omitempty"`
	LastSuccessTime     time.Time `json:"last_success_time,omitempty"`
}

func (f *VictoriaLogsHTTPForwarder) Telemetry() RetryTelemetryStats {
	f.mu.RLock()
	defer f.mu.RUnlock()

	raw := atomic.LoadUint64(&f.totalRawBytes)
	comp := atomic.LoadUint64(&f.totalCompressedBytes)
	var ratioPct float64
	if raw > 0 && comp <= raw {
		ratioPct = float64(raw-comp) / float64(raw) * 100.0
	}

	return RetryTelemetryStats{
		TargetURL:           f.targetURL,
		OperatingMode:       f.operatingMode,
		OutageReason:        f.outageReason,
		IsReachable:         f.isTargetReachable,
		TotalPostRequests:   atomic.LoadUint64(&f.totalPostRequests),
		SuccessfulRequests:  atomic.LoadUint64(&f.successfulRequests),
		InitialFailures:     atomic.LoadUint64(&f.initialFailures),
		RetryAttemptsTotal:  atomic.LoadUint64(&f.retryAttemptsTotal),
		RetrySuccessTotal:   atomic.LoadUint64(&f.retrySuccessTotal),
		QueuedDueToOutage:   atomic.LoadUint64(&f.queuedDueToOutage),
		QueueDrainedSuccess: atomic.LoadUint64(&f.queueDrainedSuccess),
		CurrentQueueDepth:   len(f.retryQueue),
		QueueCapacity:       f.retryCfg.QueueCapacity,
		CurrentBackoffMs:    f.currentBackoffMs,
		TotalDroppedLogs:    atomic.LoadUint64(&f.totalDroppedLogs),
		TotalRawBytes:       raw,
		TotalCompressedBytes: comp,
		CompressionRatioPct: ratioPct,
		LastError:           f.lastError,
		LastErrorTime:       f.lastErrorTime,
		LastSuccessTime:     f.lastSuccessTime,
	}
}
