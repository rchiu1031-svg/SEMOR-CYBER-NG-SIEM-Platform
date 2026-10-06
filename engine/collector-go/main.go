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

	// 3. 初始化 VictoriaLogs 串流管理器與區塊聚合器 (Stream Partitioner & VictoriaBlock Accumulator)
	streamMgr := pipeline.NewStreamManager()
	blockAccumulator := pipeline.NewBlockAccumulator(streamMgr, 2000)
	go blockAccumulator.StartAutoFlusher(ctx, time.Duration(cfg.BatchTimeout)*time.Millisecond)

	// 4. 初始化 Rust 儲存核心 IPC 轉發器 (UDS / TCP)
	rustForwarder := forwarder.NewRustIPCForwarder(cfg)
	if err := rustForwarder.Connect(); err != nil {
		fmt.Printf("[IPC Forwarder] 提示: 尚未連接至 Rust 核心 (將於後台持續待命重連): %v\n", err)
	} else {
		fmt.Printf("[IPC Forwarder] 已成功連結 Rust 儲存核心通道 (UDS: %s)\n", cfg.RustEngineUDSPath)
	}

	// 5. 初始化 VictoriaLogs HTTP 上游轉發器 (具備指數退避重試與離線暫存佇列保護)
	var vlogsHTTPForwarder *forwarder.VictoriaLogsHTTPForwarder
	if cfg.EnableVictoriaLogsHTTP {
		retryCfg := forwarder.RetryConfig{
			InitialInterval: time.Duration(cfg.RetryInitialMs) * time.Millisecond,
			MaxInterval:     time.Duration(cfg.RetryMaxMs) * time.Millisecond,
			Multiplier:      2.0,
			JitterFraction:  0.15,
			MaxRetries:      cfg.RetryMaxAttempts,
			QueueCapacity:   10000,
		}
		vlogsHTTPForwarder = forwarder.NewVictoriaLogsHTTPForwarder(cfg, retryCfg)
		defer vlogsHTTPForwarder.Close()
		fmt.Printf("[VictoriaLogs HTTP] 已啟動指數退避重試轉發器 -> %s (初始退避: %dms, 最大退避: %dms, 最大重試: %d 次)\n",
			cfg.VictoriaLogsURL, cfg.RetryInitialMs, cfg.RetryMaxMs, cfg.RetryMaxAttempts)
	}

	// 6. 啟動 VictoriaLogs 設計模式之串流分流與區塊打包聚合 Goroutine
	go startVictoriaBlockAggregator(ctx, inboundQueue, pipeProcessor, blockAccumulator, rustForwarder, vlogsHTTPForwarder)

	// 7. 啟動 Syslog 接收器 (UDP + TCP + RFC-5425 TLS)
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

	// 8. 啟動 NDR (Network Detection & Response) 網路流量與探針接收器 (NetFlow, sFlow, PCAP, Suricata EVE)
	ndrRecv := receiver.NewNDRReceiver(cfg, inboundQueue)
	if cfg.NDREnabled {
		if err := ndrRecv.StartNetFlowUDP(ctx, cfg.NDRNetFlowUDPPort); err != nil {
			fmt.Printf("[錯誤] 啟動 NetFlow 接收器失敗: %v\n", err)
		}
		if err := ndrRecv.StartSFlowUDP(ctx, cfg.NDRsFlowUDPPort); err != nil {
			fmt.Printf("[錯誤] 啟動 sFlow 接收器失敗: %v\n", err)
		}
	}

	// 9. 啟動 XDR (Extended Detection & Response) 多層聯合分析接收器 (EDR, AD/Identity, Cloud/K8s)
	xdrRecv := receiver.NewXDRReceiver(cfg, inboundQueue)

	// 10. 啟動 網路效能與基礎架構監控接收器 (SNMP MIB-II, SNMP Trap, Ping RTT)
	netMonRecv := receiver.NewNetworkMonitorReceiver(cfg, inboundQueue)
	if cfg.NetworkMonitorEnabled {
		if err := netMonRecv.StartSNMPTrapUDP(ctx, cfg.SNMPTrapUDPPort); err != nil {
			fmt.Printf("[錯誤] 啟動 SNMP Trap 接收器失敗: %v\n", err)
		}
	}

	// 11. 啟動 HTTP 接收器 (支援 /insert/jsonline, /insert/ndr/*, /insert/xdr/*, /insert/network/*, /api/v1/collector/test-log)
	httpRecv := receiver.NewHTTPReceiver(cfg, inboundQueue, pipeProcessor, syslogRecv, ndrRecv, xdrRecv, netMonRecv)
	if err := httpRecv.Start(); err != nil {
		fmt.Printf("[錯誤] 啟動 HTTP 接收器失敗: %v\n", err)
	}

	// 12. 定期輸出 VictoriaLogs 架構模式與指數退避重試遙測日誌
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
				sBlocks, sRows, uncomp, comp, ratio := blockAccumulator.Telemetry()
				ndrStats := ndrRecv.Telemetry()
				xdrStats := xdrRecv.Telemetry()
				netStats := netMonRecv.Telemetry()
				queueLen := len(inboundQueue)

				fmt.Printf("[VictoriaLogs 遙測] 佇列: %d/%d | 封塊數: %d | 累計行數: %d | 未壓縮: %.2f MB | 預估壓縮: %.2f MB (%s) | 轉發Rust: %d (批次: %d, 失敗: %d, 連線: %t)\n",
					queueLen, cfg.ChannelCap, sBlocks, sRows, float64(uncomp)/(1024*1024), float64(comp)/(1024*1024), ratio, sent, batches, failed, isConn)

				if vlogsHTTPForwarder != nil {
					rt := vlogsHTTPForwarder.Telemetry()
					fmt.Printf("                   └─ [HTTP 指數退避重試] POST發起: %d (成功: %d, 初態失敗: %d) | 重試次數: %d (重試成功: %d) | 離線佇列: %d/%d (已排空: %d) | 目前退避: %dms | 連線可達: %t\n",
						rt.TotalPostRequests, rt.SuccessfulRequests, rt.InitialFailures, rt.RetryAttemptsTotal, rt.RetrySuccessTotal, rt.CurrentQueueDepth, rt.QueueCapacity, rt.QueueDrainedSuccess, rt.CurrentBackoffMs, rt.IsReachable)
				}

				fmt.Printf("                   └─ 協定進線: Syslog(UDP:%d, TCP:%d, TLS:%d) | HTTP日誌: %d (請求:%d) | 錯誤: %d | 實體位元組: %.2f MB\n",
					uRecv, tRecv, tlsRecv, httpLogs, httpReq, errs, float64(bytesTotal)/(1024*1024))

				fmt.Printf("                   └─ NDR 網路鑑識: NetFlow:%v筆 | sFlow:%v筆 | Suricata EVE:%v筆 | PCAP訊框:%v | 威脅攔截:%v件\n",
					ndrStats["netflow_flows"], ndrStats["sflow_samples"], ndrStats["suricata_events"], ndrStats["pcap_frames"], ndrStats["threats_detected"])

				fmt.Printf("                   └─ XDR 聯防分析: 端點EDR:%v | 身分AD:%v | 雲原生K8s:%v | 重大警報:%v | 關聯觸發:%v件\n",
					xdrStats["endpoint_events"], xdrStats["identity_events"], xdrStats["cloud_events"], xdrStats["critical_alerts"], xdrStats["correlations_triggered"])

				fmt.Printf("                   └─ 網路基礎監控: 介面統計:%v筆 | SNMP Trap:%v件 | 飽和鏈路:%v條 | 鏈路抖動Flap:%v次\n",
					netStats["interface_stats"], netStats["snmp_traps"], netStats["saturated_links"], netStats["link_flaps"])
			}
		}
	}()

	// 優雅關閉監聽
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
	<-sigCh

	fmt.Println("\n[系統關閉] 正在清理緩衝區並將所有活動串流封塊 (Seal VictoriaBlocks)...")
	cancel()
	blockAccumulator.FlushAll()
	time.Sleep(500 * time.Millisecond)
	fmt.Println("[系統關閉] 關閉完成。")
}

// startVictoriaBlockAggregator 實作 VictoriaLogs 核心設計模式：
// 1. 低基數 _stream 標籤分流 (Stream Partitioning)
// 2. 記憶體區塊累積與詞彙布隆過濾器即時建立 (In-Memory Token Bloom Filter Pre-computation)
// 3. 達標封塊 (4096 行或時間逾時) 生成不可變 VictoriaBlock，零中斷送交儲存引擎
func startVictoriaBlockAggregator(
	ctx context.Context,
	inbound <-chan pipeline.LogEntry,
	pipe *pipeline.PipelineProcessor,
	acc *pipeline.BlockAccumulator,
	fwd *forwarder.RustIPCForwarder,
	vlogsHTTP *forwarder.VictoriaLogsHTTPForwarder,
) {
	// 背景協程：監聽已封裝完成的 VictoriaBlocks 並透過 IPC 與 HTTP (具備指數退避重試) 送出
	go func() {
		for block := range acc.SealedBlocksChan() {
			if block != nil {
				// 1. 本地 Rust 儲存引擎 IPC
				_ = fwd.SendVictoriaBlock(block)

				// 2. 外部/上游 VictoriaLogs HTTP POST (指數退避重試保護)
				if vlogsHTTP != nil {
					_ = vlogsHTTP.PostVictoriaBlock(block)
				}
			}
		}
	}()

	for {
		select {
		case <-ctx.Done():
			return
		case entry, ok := <-inbound:
			if !ok {
				return
			}
			// 1. 動態規則解構與 ECS 欄位標準化
			processed := pipe.ProcessAndExtract(entry.RawMsg, "default")
			for k, v := range entry.Fields {
				if _, exists := processed.Fields[k]; !exists {
					processed.Fields[k] = v
				}
			}

			// 2. 依據日誌特徵與連線資訊萃取低基數 Stream 標籤
			hostStr := ""
			if h, exists := processed.Fields["host"]; exists {
				hostStr = fmt.Sprintf("%v", h)
			}
			protoStr := "syslog"
			if p, exists := processed.Fields["protocol"]; exists {
				protoStr = fmt.Sprintf("%v", p)
			}
			streamLabels := pipeline.ExtractStreamLabelsFromLog(processed.RawMsg, hostStr, protoStr)

			// 3. 壓入對應串流之 VictoriaBlock 聚合器
			acc.IngestLog(processed, streamLabels)
		}
	}
}
