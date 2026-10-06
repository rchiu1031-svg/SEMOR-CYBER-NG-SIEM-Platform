package receiver

import (
	"bufio"
	"bytes"
	"compress/gzip"
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

// HTTPReceiver 提供 RESTful 與 VictoriaLogs / Loki / Elasticsearch 相容寫入端點
type HTTPReceiver struct {
	cfg            *config.Config
	inboundQueue   chan<- pipeline.LogEntry
	pipeline       *pipeline.PipelineProcessor
	syslogRecv     *SyslogReceiver
	ndrRecv        *NDRReceiver
	xdrRecv        *XDRReceiver
	netMonRecv     *NetworkMonitorReceiver
	httpRequests   uint64
	logsIngested   uint64
	bytesIngested  uint64
	diagnosticRuns uint64
}

func NewHTTPReceiver(
	cfg *config.Config,
	inbound chan<- pipeline.LogEntry,
	pipe *pipeline.PipelineProcessor,
	syslogRecv *SyslogReceiver,
	ndrRecv *NDRReceiver,
	xdrRecv *XDRReceiver,
	netMonRecv *NetworkMonitorReceiver,
) *HTTPReceiver {
	return &HTTPReceiver{
		cfg:          cfg,
		inboundQueue: inbound,
		pipeline:     pipe,
		syslogRecv:   syslogRecv,
		ndrRecv:      ndrRecv,
		xdrRecv:      xdrRecv,
		netMonRecv:   netMonRecv,
	}
}

func (h *HTTPReceiver) Start() error {
	mux := http.NewServeMux()

	// 1. VictoriaLogs 標準 NDJSON 相容寫入端點 (/insert/jsonline)
	mux.HandleFunc("/insert/jsonline", h.handleVictoriaLogsInsert)

	// 2. Grafana Loki 相容接收端點 (/insert/loki/api/v1/push)
	mux.HandleFunc("/insert/loki/api/v1/push", h.handleLokiPush)

	// 3. Elasticsearch Bulk 相容接收端點 (/insert/elasticsearch/_bulk)
	mux.HandleFunc("/insert/elasticsearch/_bulk", h.handleElasticsearchBulk)

	// 4. SEMOR 專用批次接收端點 (/api/v1/ingest)
	mux.HandleFunc("/api/v1/ingest", h.handleBatchIngest)

	// 5. 解碼器熱重載端點 (/api/v1/decoders/deploy)
	mux.HandleFunc("/api/v1/decoders/deploy", h.handleDecoderDeploy)

	// 6. 即時日誌解析診斷與測試注入端點 (/api/v1/collector/test-log)
	mux.HandleFunc("/api/v1/collector/test-log", h.handleDiagnosticTestLog)

	// 7. NDR (Network Detection & Response) 網路流量專用寫入端點
	mux.HandleFunc("/insert/ndr/eve", h.handleNDREve)
	mux.HandleFunc("/insert/ndr/pcap", h.handleNDRPCAP)
	mux.HandleFunc("/api/v1/ndr/stats", h.handleNDRStats)

	// 8. XDR (Extended Detection & Response) 多層聯合分析寫入端點
	mux.HandleFunc("/insert/xdr/endpoint", h.handleXDREndpoint)
	mux.HandleFunc("/insert/xdr/identity", h.handleXDRIdentity)
	mux.HandleFunc("/insert/xdr/cloud", h.handleXDRCloud)
	mux.HandleFunc("/insert/xdr/perimeter", h.handleXDRPerimeter)
	mux.HandleFunc("/insert/honeypot/event", h.handleHoneypotEvent)
	mux.HandleFunc("/api/v1/xdr/stats", h.handleXDRStats)

	// 9. 網路效能與基礎架構監控 (NPM/NIM) 介面與 Trap 端點
	mux.HandleFunc("/insert/network/metrics", h.handleNetworkMetrics)
	mux.HandleFunc("/insert/network/trap", h.handleNetworkTrap)
	mux.HandleFunc("/insert/network/ping", h.handleNetworkPing)
	mux.HandleFunc("/api/v1/network/collector-stats", h.handleNetworkStats)

	// 10. 來源設備狀態與通訊錄 (/api/v1/collector/sources)
	mux.HandleFunc("/api/v1/collector/sources", h.handleSources)

	// 11. 收集器動態配置管理 (/api/v1/collector/config)
	mux.HandleFunc("/api/v1/collector/config", h.handleConfig)

	// 12. 健康狀態與遙測指標 (/api/v1/stats 與 /healthz)
	mux.HandleFunc("/api/v1/stats", h.handleStats)
	mux.HandleFunc("/healthz", h.handleHealthz)
	mux.HandleFunc("/metrics", h.handleStats)

	addr := fmt.Sprintf("0.0.0.0:%d", h.cfg.HTTPPort)
	fmt.Printf("[HTTP Receiver] API 服務就緒 %s (支援 /insert/jsonline, /insert/network/metrics, /insert/network/trap, /insert/ndr/*, /insert/xdr/*)\n", addr)

	server := &http.Server{
		Addr:         addr,
		Handler:      mux,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
	}

	go func() {
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			fmt.Printf("[HTTP Receiver] 錯誤: %v\n", err)
		}
	}()

	return nil
}

// handleVictoriaLogsInsert 支援 VictoriaLogs NDJSON 多行格式 (含 Gzip 壓縮自動解壓縮)
func (h *HTTPReceiver) handleVictoriaLogsInsert(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	atomic.AddUint64(&h.httpRequests, 1)

	var reader io.Reader = r.Body
	defer r.Body.Close()

	if strings.EqualFold(r.Header.Get("Content-Encoding"), "gzip") {
		gzReader, err := gzip.NewReader(r.Body)
		if err != nil {
			http.Error(w, fmt.Sprintf("Gzip decode error: %v", err), http.StatusBadRequest)
			return
		}
		defer gzReader.Close()
		reader = gzReader
	}

	scanner := bufio.NewScanner(reader)
	// 支援高達 10MB 單行日誌
	buf := make([]byte, 64*1024)
	scanner.Buffer(buf, 10*1024*1024)

	count := 0
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if len(line) == 0 {
			continue
		}

		atomic.AddUint64(&h.bytesIngested, uint64(len(line)))
		h.inboundQueue <- pipeline.LogEntry{
			Timestamp: time.Now().UnixNano(),
			RawMsg:    line,
			Fields: map[string]interface{}{
				"protocol": "http-ndjson",
			},
		}
		count++
	}

	atomic.AddUint64(&h.logsIngested, uint64(count))
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(fmt.Sprintf(`{"status":"ok","inserted":%d}`, count)))
}

// handleLokiPush 支援 Grafana Loki 推送格式
func (h *HTTPReceiver) handleLokiPush(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	atomic.AddUint64(&h.httpRequests, 1)
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	atomic.AddUint64(&h.bytesIngested, uint64(len(body)))

	type lokiStream struct {
		Stream map[string]string `json:"stream"`
		Values [][]string        `json:"values"`
	}
	type lokiPayload struct {
		Streams []lokiStream `json:"streams"`
	}

	var payload lokiPayload
	if err := json.Unmarshal(body, &payload); err == nil && len(payload.Streams) > 0 {
		count := 0
		for _, st := range payload.Streams {
			for _, val := range st.Values {
				if len(val) >= 2 {
					msg := val[1]
					fields := map[string]interface{}{
						"protocol": "http-loki",
					}
					for k, v := range st.Stream {
						fields["loki."+k] = v
					}
					h.inboundQueue <- pipeline.LogEntry{
						Timestamp: time.Now().UnixNano(),
						RawMsg:    msg,
						Fields:    fields,
					}
					count++
				}
			}
		}
		atomic.AddUint64(&h.logsIngested, uint64(count))
		w.WriteHeader(http.StatusNoContent)
		return
	}

	w.WriteHeader(http.StatusOK)
}

// handleElasticsearchBulk 支援 Logstash / Filebeat Elasticsearch _bulk 寫入
func (h *HTTPReceiver) handleElasticsearchBulk(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	atomic.AddUint64(&h.httpRequests, 1)
	scanner := bufio.NewScanner(r.Body)
	defer r.Body.Close()

	count := 0
	isActionLine := true
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if len(line) == 0 {
			continue
		}

		if isActionLine {
			// 跳過 index / create 操作指示行
			isActionLine = false
			continue
		}

		// 資料實體行
		isActionLine = true
		atomic.AddUint64(&h.bytesIngested, uint64(len(line)))
		h.inboundQueue <- pipeline.LogEntry{
			Timestamp: time.Now().UnixNano(),
			RawMsg:    line,
			Fields: map[string]interface{}{
				"protocol": "http-es-bulk",
			},
		}
		count++
	}

	atomic.AddUint64(&h.logsIngested, uint64(count))
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(fmt.Sprintf(`{"took":2,"errors":false,"items":[],"count":%d}`, count)))
}

// handleBatchIngest 支援前端 UI 傳遞 JSON Batch
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

	atomic.AddUint64(&h.httpRequests, 1)
	atomic.AddUint64(&h.bytesIngested, uint64(len(body)))

	var rawLogs []string
	if err := json.Unmarshal(body, &rawLogs); err == nil {
		for _, raw := range rawLogs {
			h.inboundQueue <- pipeline.LogEntry{
				Timestamp: time.Now().UnixNano(),
				RawMsg:    raw,
				Fields: map[string]interface{}{
					"protocol": "http-batch",
				},
			}
		}
		atomic.AddUint64(&h.logsIngested, uint64(len(rawLogs)))
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"status":   "success",
			"ingested": len(rawLogs),
		})
		return
	}

	var singleLog map[string]interface{}
	if err := json.Unmarshal(body, &singleLog); err == nil {
		rawStr, _ := json.Marshal(singleLog)
		h.inboundQueue <- pipeline.LogEntry{
			Timestamp: time.Now().UnixNano(),
			RawMsg:    string(rawStr),
			Fields:    singleLog,
		}
		atomic.AddUint64(&h.logsIngested, 1)
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{"status": "success"})
		return
	}

	http.Error(w, "Invalid JSON format", http.StatusBadRequest)
}

// handleDecoderDeploy 前端熱下發解碼器規則
func (h *HTTPReceiver) handleDecoderDeploy(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	decoderID := r.URL.Query().Get("decoder_id")
	if decoderID == "" {
		decoderID = "default"
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Cannot read payload", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	if err := h.pipeline.RegisterOrUpdateDecoder(decoderID, body); err != nil {
		http.Error(w, fmt.Sprintf("編譯規則失敗: %v", err), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"status":     "deployed",
		"decoder_id": decoderID,
		"timestamp":  time.Now().UnixMilli(),
	})
}

// handleDiagnosticTestLog 即時解析測試端點，供 UI 即時預覽各協議解碼效果
func (h *HTTPReceiver) handleDiagnosticTestLog(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	start := time.Now()
	atomic.AddUint64(&h.diagnosticRuns, 1)

	type testReq struct {
		RawLog    string `json:"raw_log"`
		Protocol  string `json:"protocol"`
		RemoteIP  string `json:"remote_ip"`
		DecoderID string `json:"decoder_id"`
	}

	var req testReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}

	if req.Protocol == "" {
		req.Protocol = "syslog-diagnostic"
	}
	if req.RemoteIP == "" {
		req.RemoteIP = "127.0.0.1"
	}

	// 1. 執行 Syslog RFC 5424 / RFC 3164 / CEF 解構
	parsedEntry := h.syslogRecv.ParseSyslogMessage(req.RawLog, req.Protocol, req.RemoteIP)

	// 2. 執行 Pipeline 規則匹配與 ECS 規範化
	enrichedEntry := h.pipeline.ProcessAndExtract(req.RawLog, req.DecoderID)

	// 合併欄位
	for k, v := range enrichedEntry.Fields {
		parsedEntry.Fields[k] = v
	}

	elapsedMicros := time.Since(start).Microseconds()

	resp := map[string]interface{}{
		"status":          "ok",
		"elapsed_micros":  elapsedMicros,
		"elapsed_ms":      float64(elapsedMicros) / 1000.0,
		"raw_log":         req.RawLog,
		"protocol":        req.Protocol,
		"parsed_format":   parsedEntry.Fields["syslog_format"],
		"fields_count":    len(parsedEntry.Fields),
		"extracted_entry": parsedEntry,
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(resp)
}

// handleSources 回傳當前所有來源設備連線遙測資料
func (h *HTTPReceiver) handleSources(w http.ResponseWriter, r *http.Request) {
	sources := h.syslogRecv.GetSourcesTelemetry()
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"status":        "ok",
		"total_sources": len(sources),
		"sources":       sources,
	})
}

// handleConfig 回傳與動態更新收集器配置
func (h *HTTPReceiver) handleConfig(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if r.Method == http.MethodGet {
		_ = json.NewEncoder(w).Encode(h.cfg)
		return
	}

	if r.Method == http.MethodPost {
		var newCfg config.Config
		if err := json.NewDecoder(r.Body).Decode(&newCfg); err != nil {
			http.Error(w, "Bad Request", http.StatusBadRequest)
			return
		}
		if newCfg.BatchSize > 0 {
			h.cfg.BatchSize = newCfg.BatchSize
		}
		if newCfg.BatchTimeout > 0 {
			h.cfg.BatchTimeout = newCfg.BatchTimeout
		}
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"status": "updated",
			"config": h.cfg,
		})
		return
	}

	http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
}

func (h *HTTPReceiver) handleStats(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	udp, tcp, tlsRecv, bytesTotal, errs := h.syslogRecv.Stats()
	parsed, dropped, _ := h.pipeline.Stats()

	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"http_requests":      atomic.LoadUint64(&h.httpRequests),
		"logs_ingested":      atomic.LoadUint64(&h.logsIngested),
		"bytes_ingested":     atomic.LoadUint64(&h.bytesIngested),
		"diagnostic_runs":    atomic.LoadUint64(&h.diagnosticRuns),
		"syslog_udp_packets": udp,
		"syslog_tcp_packets": tcp,
		"syslog_tls_packets": tlsRecv,
		"syslog_total_bytes": bytesTotal,
		"syslog_errors":      errs,
		"pipeline_parsed":    parsed,
		"pipeline_dropped":   dropped,
		"timestamp":          time.Now().UnixMilli(),
	})
}

func (h *HTTPReceiver) handleHealthz(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte("ok"))
}

// handleNDREve 處理 Suricata EVE JSON 或 Zeek 網路串流
func (h *HTTPReceiver) handleNDREve(w http.ResponseWriter, r *http.Request) {
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

	if r.Header.Get("Content-Encoding") == "gzip" || (len(body) >= 2 && body[0] == 0x1f && body[1] == 0x8b) {
		gz, gzErr := gzip.NewReader(bytes.NewReader(body))
		if gzErr == nil {
			decompressed, readErr := io.ReadAll(gz)
			_ = gz.Close()
			if readErr == nil {
				body = decompressed
			}
		}
	}

	if h.ndrRecv != nil {
		lines := bytes.Split(body, []byte("\n"))
		count := 0
		for _, line := range lines {
			if len(bytes.TrimSpace(line)) > 0 {
				if err := h.ndrRecv.IngestSuricataEVE(line); err == nil {
					count++
				}
			}
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"status":           "ok",
			"events_processed": count,
		})
		return
	}
	http.Error(w, "NDR Receiver not initialized", http.StatusServiceUnavailable)
}

// handleNDRPCAP 處理二進位 PCAP 訊框串流上傳
func (h *HTTPReceiver) handleNDRPCAP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}
	defer r.Body.Close()

	if h.ndrRecv != nil {
		frames, err := h.ndrRecv.IngestPCAPStream(r.Body)
		if err != nil && frames == 0 {
			http.Error(w, fmt.Sprintf("PCAP parse error: %v", err), http.StatusBadRequest)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"status":          "ok",
			"frames_ingested": frames,
		})
		return
	}
	http.Error(w, "NDR Receiver not initialized", http.StatusServiceUnavailable)
}

// handleNDRStats 輸出 NDR 收集即時遙測
func (h *HTTPReceiver) handleNDRStats(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if h.ndrRecv != nil {
		_ = json.NewEncoder(w).Encode(h.ndrRecv.Telemetry())
		return
	}
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"status": "ndr_disabled"})
}

// handleXDREndpoint 接收端點 EDR / Windows Sysmon / osquery 事件 (支援 Gzip 壓縮)
func (h *HTTPReceiver) handleXDREndpoint(w http.ResponseWriter, r *http.Request) {
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

	if r.Header.Get("Content-Encoding") == "gzip" || (len(body) >= 2 && body[0] == 0x1f && body[1] == 0x8b) {
		gz, gzErr := gzip.NewReader(bytes.NewReader(body))
		if gzErr == nil {
			decompressed, readErr := io.ReadAll(gz)
			_ = gz.Close()
			if readErr == nil {
				body = decompressed
			}
		}
	}

	if h.xdrRecv != nil {
		if err := h.xdrRecv.IngestEndpointEvent(body); err != nil {
			http.Error(w, fmt.Sprintf("XDR parse error: %v", err), http.StatusBadRequest)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"status": "ok", "layer": "endpoint"})
		return
	}
	http.Error(w, "XDR Receiver not initialized", http.StatusServiceUnavailable)
}

// handleXDRIdentity 接收身分與認證事件 (Active Directory / Kerberos / IAM, 支援 Gzip 壓縮)
func (h *HTTPReceiver) handleXDRIdentity(w http.ResponseWriter, r *http.Request) {
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

	if r.Header.Get("Content-Encoding") == "gzip" || (len(body) >= 2 && body[0] == 0x1f && body[1] == 0x8b) {
		gz, gzErr := gzip.NewReader(bytes.NewReader(body))
		if gzErr == nil {
			decompressed, readErr := io.ReadAll(gz)
			_ = gz.Close()
			if readErr == nil {
				body = decompressed
			}
		}
	}

	if h.xdrRecv != nil {
		if err := h.xdrRecv.IngestIdentityEvent(body); err != nil {
			http.Error(w, fmt.Sprintf("Identity event parse error: %v", err), http.StatusBadRequest)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"status": "ok", "layer": "identity"})
		return
	}
	http.Error(w, "XDR Receiver not initialized", http.StatusServiceUnavailable)
}

// handleXDRCloud 接收雲原生與 K8s 稽核事件 (支援 Gzip 壓縮)
func (h *HTTPReceiver) handleXDRCloud(w http.ResponseWriter, r *http.Request) {
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

	if r.Header.Get("Content-Encoding") == "gzip" || (len(body) >= 2 && body[0] == 0x1f && body[1] == 0x8b) {
		gz, gzErr := gzip.NewReader(bytes.NewReader(body))
		if gzErr == nil {
			decompressed, readErr := io.ReadAll(gz)
			_ = gz.Close()
			if readErr == nil {
				body = decompressed
			}
		}
	}

	if h.xdrRecv != nil {
		if err := h.xdrRecv.IngestCloudEvent(body); err != nil {
			http.Error(w, fmt.Sprintf("Cloud event parse error: %v", err), http.StatusBadRequest)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"status": "ok", "layer": "cloud"})
		return
	}
	http.Error(w, "XDR Receiver not initialized", http.StatusServiceUnavailable)
}

// handleXDRPerimeter 接收邊界與安全控制設備事件 (NGFW / WAF / VPN / IPS, 支援 Gzip 壓縮)
func (h *HTTPReceiver) handleXDRPerimeter(w http.ResponseWriter, r *http.Request) {
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

	if r.Header.Get("Content-Encoding") == "gzip" || (len(body) >= 2 && body[0] == 0x1f && body[1] == 0x8b) {
		gz, gzErr := gzip.NewReader(bytes.NewReader(body))
		if gzErr == nil {
			decompressed, readErr := io.ReadAll(gz)
			_ = gz.Close()
			if readErr == nil {
				body = decompressed
			}
		}
	}

	if h.xdrRecv != nil {
		if err := h.xdrRecv.IngestPerimeterEvent(body); err != nil {
			http.Error(w, fmt.Sprintf("Perimeter event parse error: %v", err), http.StatusBadRequest)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"status": "ok", "layer": "perimeter"})
		return
	}
	http.Error(w, "XDR Receiver not initialized", http.StatusServiceUnavailable)
}

// handleHoneypotEvent 接收主動防禦蜜罐誘捕事件 (HoneyCreds, Decoy Services, 支援 Gzip 壓縮)
func (h *HTTPReceiver) handleHoneypotEvent(w http.ResponseWriter, r *http.Request) {
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

	if r.Header.Get("Content-Encoding") == "gzip" || (len(body) >= 2 && body[0] == 0x1f && body[1] == 0x8b) {
		gz, gzErr := gzip.NewReader(bytes.NewReader(body))
		if gzErr == nil {
			decompressed, readErr := io.ReadAll(gz)
			_ = gz.Close()
			if readErr == nil {
				body = decompressed
			}
		}
	}

	if h.xdrRecv != nil {
		if err := h.xdrRecv.IngestDeceptionEvent(body); err != nil {
			http.Error(w, fmt.Sprintf("Honeypot event parse error: %v", err), http.StatusBadRequest)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"status": "ok", "layer": "honeypot"})
		return
	}
	http.Error(w, "XDR Receiver not initialized", http.StatusServiceUnavailable)
}

// handleXDRStats 輸出 XDR 多層次遙測指標
func (h *HTTPReceiver) handleXDRStats(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if h.xdrRecv != nil {
		_ = json.NewEncoder(w).Encode(h.xdrRecv.Telemetry())
		return
	}
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"status": "xdr_disabled"})
}

// handleNetworkMetrics 接收網路介面流量與效能遙測 (SNMP MIB-II / Telemetry Streaming, 支援 Gzip 壓縮)
func (h *HTTPReceiver) handleNetworkMetrics(w http.ResponseWriter, r *http.Request) {
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

	// 支援 Gzip 壓縮自動解壓
	if r.Header.Get("Content-Encoding") == "gzip" || (len(body) >= 2 && body[0] == 0x1f && body[1] == 0x8b) {
		gz, gzErr := gzip.NewReader(bytes.NewReader(body))
		if gzErr == nil {
			decompressed, readErr := io.ReadAll(gz)
			_ = gz.Close()
			if readErr == nil {
				body = decompressed
			}
		}
	}

	if h.netMonRecv != nil {
		if err := h.netMonRecv.IngestMetricsBatch(body); err != nil {
			http.Error(w, fmt.Sprintf("Network metrics parse error: %v", err), http.StatusBadRequest)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"status": "ok", "telemetry": "interface_metrics"})
		return
	}
	http.Error(w, "Network Monitor Receiver not initialized", http.StatusServiceUnavailable)
}

// handleNetworkTrap 接收 HTTP 格式化 SNMP Trap 告警 (支援 Gzip 壓縮)
func (h *HTTPReceiver) handleNetworkTrap(w http.ResponseWriter, r *http.Request) {
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

	if r.Header.Get("Content-Encoding") == "gzip" || (len(body) >= 2 && body[0] == 0x1f && body[1] == 0x8b) {
		gz, gzErr := gzip.NewReader(bytes.NewReader(body))
		if gzErr == nil {
			decompressed, readErr := io.ReadAll(gz)
			_ = gz.Close()
			if readErr == nil {
				body = decompressed
			}
		}
	}

	if h.netMonRecv != nil {
		h.netMonRecv.parseSNMPTrap(body, r.RemoteAddr)
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"status": "ok", "telemetry": "snmp_trap"})
		return
	}
	http.Error(w, "Network Monitor Receiver not initialized", http.StatusServiceUnavailable)
}

// handleNetworkPing 接收主動 ICMP Ping / Traceroute 診斷探針結果 (支援 Gzip 壓縮)
func (h *HTTPReceiver) handleNetworkPing(w http.ResponseWriter, r *http.Request) {
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

	if r.Header.Get("Content-Encoding") == "gzip" || (len(body) >= 2 && body[0] == 0x1f && body[1] == 0x8b) {
		gz, gzErr := gzip.NewReader(bytes.NewReader(body))
		if gzErr == nil {
			decompressed, readErr := io.ReadAll(gz)
			_ = gz.Close()
			if readErr == nil {
				body = decompressed
			}
		}
	}

	if h.netMonRecv != nil {
		if err := h.netMonRecv.IngestPingResult(body); err != nil {
			http.Error(w, fmt.Sprintf("Ping parse error: %v", err), http.StatusBadRequest)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"status": "ok", "telemetry": "diagnostic_probe"})
		return
	}
	http.Error(w, "Network Monitor Receiver not initialized", http.StatusServiceUnavailable)
}

// handleNetworkStats 輸出網路監控收集核心即時指標
func (h *HTTPReceiver) handleNetworkStats(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if h.netMonRecv != nil {
		_ = json.NewEncoder(w).Encode(h.netMonRecv.Telemetry())
		return
	}
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"status": "network_monitor_disabled"})
}

func (h *HTTPReceiver) Stats() (requests uint64, logs uint64) {
	return atomic.LoadUint64(&h.httpRequests), atomic.LoadUint64(&h.logsIngested)
}
