package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"runtime"
	"syscall"
	"time"

	"github.com/semor-cyber/semor-collector/config"
	"github.com/semor-cyber/semor-collector/forwarder"
	"github.com/semor-cyber/semor-collector/pipeline"
	"github.com/semor-cyber/semor-collector/receiver"
)

const (
	AppName    = "SEMOR Log Ingestion Engine (Go Collector)"
	AppVersion = "v2.0.0-SyslogTLS-VectorizedPipeline"
)

func main() {
	fmt.Printf("========================================================\n")
	fmt.Printf("   %s\n", AppName)
	fmt.Printf("   架構模式: VictoriaLogs High-Throughput Pipeline + RFC 5424/5425\n")
	fmt.Printf("   版本: %s (CPU 核心數: %d)\n", AppVersion, runtime.NumCPU())
	fmt.Printf("========================================================\n")

	cfg := config.LoadConfig()
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// 1. 初始化核心記憶體通道環 (Channel Ring Buffer)
	inboundQueue := make(chan pipeline.LogEntry, cfg.ChannelCap)

	// 2. 初始化規則處理管線 (可接收前端 UI 下發熱更新 Regex 與 ECS 規範化)
	pipeProcessor := pipeline.NewPipelineProcessor()

	// 3. 初始化 Rust 儲存核心 IPC 轉發器 (UDS / TCP)
	rustForwarder := forwarder.NewRustIPCForwarder(cfg)
	if err := rustForwarder.Connect(); err != nil {
		fmt.Printf("[IPC Forwarder] 提示: 尚未連接至 Rust 核心 (將於後台持續待命重連): %v\n", err)
	} else {
		fmt.Printf("[IPC Forwarder] 已成功連結 Rust 儲存核心通道 (UDS: %s)\n", cfg.RustEngineUDSPath)
	}

	// 4. 啟動批次聚合與轉發器 Goroutine
	go startBatchAggregator(ctx, cfg, inboundQueue, pipeProcessor, rustForwarder)

	// 5. 啟動 Syslog 接收器 (UDP + TCP + RFC-5425 TLS)
	syslogRecv := receiver.NewSyslogReceiver(cfg, inboundQueue)
	numUDPWorkers := runtime.NumCPU() * 2
	if err := syslogRecv.StartUDP(ctx, numUDPWorkers); err != nil {
		fmt.Printf("[錯誤] 啟動 UDP 接收器失敗: %v\n", err)
	}
	if err := syslogRecv.StartTCP(ctx); err != nil {
		fmt.Printf("[錯誤] 啟動 TCP 接收器失敗: %v\n", err)
	}
	if err := syslogRecv.StartTLS(ctx); err != nil {
		fmt.Printf("[錯誤] 啟動 TLS 接收器失敗: %v\n", err)
	}

	// 6. 啟動 HTTP 接收器 (支援 /insert/jsonline, /insert/loki, /insert/elasticsearch/_bulk 與 /api/v1/collector/test-log)
	httpRecv := receiver.NewHTTPReceiver(cfg, inboundQueue, pipeProcessor, syslogRecv)
	if err := httpRecv.Start(); err != nil {
		fmt.Printf("[錯誤] 啟動 HTTP 接收器失敗: %v\n", err)
	}

	// 7. 定期輸出效能遙測日誌
	go func() {
		ticker := time.NewTicker(5 * time.Second)
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				uRecv, tRecv, tlsRecv, bytesTotal, errs := syslogRecv.Stats()
				httpReq, httpLogs := httpRecv.Stats()
				sent, batches, failed, isConn := rustForwarder.Telemetry()
				queueLen := len(inboundQueue)

				fmt.Printf("[遙測報告] 佇列暫存: %d/%d | Syslog(UDP:%d, TCP:%d, TLS:%d) | HTTP日誌: %d (請求: %d) | 轉發Rust: %d (批次: %d, 失敗: %d, 連線: %t) | 解析錯誤: %d | 接收位元組: %.2f MB\n",
					queueLen, cfg.ChannelCap, uRecv, tRecv, tlsRecv, httpLogs, httpReq, sent, batches, failed, isConn, errs, float64(bytesTotal)/(1024*1024))
			}
		}
	}()

	// 優雅關閉監聽
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
	<-sigCh

	fmt.Println("\n[系統關閉] 正在清理緩衝區並關閉 SEMOR 收集器...")
	cancel()
	time.Sleep(500 * time.Millisecond)
	fmt.Println("[系統關閉] 關閉完成。")
}

// startBatchAggregator 依筆數或超時門檻打包 Block 並發送至 Rust
func startBatchAggregator(
	ctx context.Context,
	cfg *config.Config,
	inbound <-chan pipeline.LogEntry,
	pipe *pipeline.PipelineProcessor,
	fwd *forwarder.RustIPCForwarder,
) {
	ticker := time.NewTicker(time.Duration(cfg.BatchTimeout) * time.Millisecond)
	defer ticker.Stop()

	batchEntries := make([]pipeline.LogEntry, 0, cfg.BatchSize)

	flush := func() {
		if len(batchEntries) == 0 {
			return
		}

		batch := &pipeline.LogBatch{
			StreamID: 1001, // 預設 StreamID，由 Stream Manager 動態指派
			StreamLabels: map[string]string{
				"env":    "production",
				"source": "semor-gateway",
			},
			Entries: make([]pipeline.LogEntry, len(batchEntries)),
		}
		copy(batch.Entries, batchEntries)
		batchEntries = batchEntries[:0] // 重設緩衝區

		// 非同步送出避免阻塞讀取
		go func(b *pipeline.LogBatch) {
			if err := fwd.SendBatch(b); err != nil {
				// 記錄錯誤，由 Forwarder 統計 failed 計數
			}
		}(batch)
	}

	for {
		select {
		case <-ctx.Done():
			flush()
			return
		case entry := <-inbound:
			// 套用動態正規化
			processed := pipe.ProcessAndExtract(entry.RawMsg, "default")
			// 合併既有欄位
			for k, v := range entry.Fields {
				if _, exists := processed.Fields[k]; !exists {
					processed.Fields[k] = v
				}
			}
			batchEntries = append(batchEntries, processed)

			if len(batchEntries) >= cfg.BatchSize {
				flush()
			}
		case <-ticker.C:
			if len(batchEntries) > 0 {
				flush()
			}
		}
	}
}
