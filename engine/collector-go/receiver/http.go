package receiver

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync/atomic"
	"time"

	"github.com/semor-cyber/semor-collector/config"
	"github.com/semor-cyber/semor-collector/pipeline"
)

// HTTPReceiver 提供 RESTful 與 VictoriaLogs-compatible 批次接收端點
type HTTPReceiver struct {
	cfg          *config.Config
	inboundQueue chan<- pipeline.LogEntry
	pipeline     *pipeline.PipelineProcessor
	httpRequests uint64
	logsIngested uint64
}

func NewHTTPReceiver(
	cfg *config.Config,
	inbound chan<- pipeline.LogEntry,
	pipe *pipeline.PipelineProcessor,
) *HTTPReceiver {
	return &HTTPReceiver{
		cfg:          cfg,
		inboundQueue: inbound,
		pipeline:     pipe,
	}
}

func (h *HTTPReceiver) Start() error {
	mux := http.NewServeMux()

	// 1. VictoriaLogs 標準 NDJSON 相容寫入端點 (/insert/jsonline)
	mux.HandleFunc("/insert/jsonline", h.handleVictoriaLogsInsert)

	// 2. SEMOR 專用批次接收端點 (/api/v1/ingest)
	mux.HandleFunc("/api/v1/ingest", h.handleBatchIngest)

	// 3. 解碼器熱重載端點 (/api/v1/decoders/deploy)
	mux.HandleFunc("/api/v1/decoders/deploy", h.handleDecoderDeploy)

	// 4. 健康狀態與遙測指標 (/api/v1/stats 與 /healthz)
	mux.HandleFunc("/api/v1/stats", h.handleStats)
	mux.HandleFunc("/healthz", h.handleHealthz)
	mux.HandleFunc("/metrics", h.handleStats)

	addr := fmt.Sprintf("0.0.0.0:%d", h.cfg.HTTPPort)
	fmt.Printf("[HTTP Receiver] API 服務就緒 %s (端點: /insert/jsonline, /api/v1/ingest, /api/v1/decoders/deploy)\n", addr)

	server := &http.Server{
		Addr:         addr,
		Handler:      mux,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	go func() {
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			fmt.Printf("[HTTP Receiver] 錯誤: %v\n", err)
		}
	}()

	return nil
}

// 支援 VictoriaLogs NDJSON 多行格式
func (h *HTTPReceiver) handleVictoriaLogsInsert(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	atomic.AddUint64(&h.httpRequests, 1)
	scanner := bufio.NewScanner(r.Body)
	defer r.Body.Close()

	count := 0
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if len(line) == 0 {
			continue
		}

		h.inboundQueue <- pipeline.LogEntry{
			Timestamp: time.Now().UnixMilli(),
			RawMsg:    line,
			Fields: map[string]interface{}{
				"protocol": "http-ndjson",
			},
		}
		count++
	}

	atomic.AddUint64(&h.logsIngested, uint64(count))
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(`{"status":"ok","inserted":` + fmt.Sprint(count) + `}`))
}

// 支援前端 UI 傳遞 JSON Batch
func (h *HTTPReceiver) handleBatchIngest(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	var payload struct {
		Stream map[string]string `json:"stream"`
		Logs   []string          `json:"logs"`
	}

	if err := json.Unmarshal(body, &payload); err != nil {
		// 嘗試解析為單一字串陣列
		var simpleLogs []string
		if err2 := json.Unmarshal(body, &simpleLogs); err2 == nil {
			payload.Logs = simpleLogs
		} else {
			http.Error(w, "Invalid JSON structure", http.StatusBadRequest)
			return
		}
	}

	for _, l := range payload.Logs {
		entry := pipeline.LogEntry{
			Timestamp: time.Now().UnixMilli(),
			RawMsg:    l,
			Fields: map[string]interface{}{
				"protocol": "http-batch",
			},
		}
		if len(payload.Stream) > 0 {
			entry.Fields["stream"] = payload.Stream
		}
		h.inboundQueue <- entry
	}

	atomic.AddUint64(&h.logsIngested, uint64(len(payload.Logs)))
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"success":  true,
		"ingested": len(payload.Logs),
	})
}

// 接收前端 UI 下發的熱載入解碼器規則
func (h *HTTPReceiver) handleDecoderDeploy(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Read Error", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	decoderID := r.URL.Query().Get("id")
	if decoderID == "" {
		decoderID = "default"
	}

	if err := h.pipeline.RegisterOrUpdateDecoder(decoderID, body); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_, _ = w.Write([]byte(`{"success":false,"error":"` + err.Error() + `"}`))
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_, _ = w.Write([]byte(`{"success":true,"deployed_id":"` + decoderID + `"}`))
}

func (h *HTTPReceiver) handleHealthz(w http.ResponseWriter, r *http.Request) {
	bufferDepth := 0
	bufferCapacity := h.cfg.ChannelCap
	// 安全採樣通道佇列深度
	if h.inboundQueue != nil {
		bufferDepth = len(h.inboundQueue)
	}

	saturation := float64(0)
	if bufferCapacity > 0 {
		saturation = float64(bufferDepth) / float64(bufferCapacity)
	}

	status := "healthy"
	if saturation > 0.85 {
		status = "degraded"
	}

	response := map[string]interface{}{
		"status": status,
		"service": "semor-collector-go",
		"uptime_ms": time.Now().UnixMilli(),
		"buffer": map[string]interface{}{
			"depth": bufferDepth,
			"capacity": bufferCapacity,
			"depth_percentage": saturation * 100.0,
		},
		"worker_pool": map[string]interface{}{
			"configured_workers": 16,
			"active_workers": 16,
			"saturation_ratio": saturation,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(response)
}

func (h *HTTPReceiver) handleStats(w http.ResponseWriter, r *http.Request) {
	bufferDepth := 0
	if h.inboundQueue != nil {
		bufferDepth = len(h.inboundQueue)
	}
	bufferCap := h.cfg.ChannelCap

	stats := map[string]interface{}{
		"http_requests": atomic.LoadUint64(&h.httpRequests),
		"logs_ingested": atomic.LoadUint64(&h.logsIngested),
		"buffer_depth":  bufferDepth,
		"buffer_capacity": bufferCap,
		"buffer_utilization": float64(bufferDepth) / float64(bufferCap) * 100.0,
		"timestamp":     time.Now().UnixMilli(),
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(stats)
}

func (h *HTTPReceiver) Stats() (requests uint64, logs uint64) {
	return atomic.LoadUint64(&h.httpRequests), atomic.LoadUint64(&h.logsIngested)
}
