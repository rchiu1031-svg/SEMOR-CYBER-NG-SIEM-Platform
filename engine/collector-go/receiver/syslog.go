package receiver

import (
	"bufio"
	"context"
	"fmt"
	"net"
	"strings"
	"sync/atomic"
	"time"

	"github.com/semor-cyber/semor-collector/config"
	"github.com/semor-cyber/semor-collector/pipeline"
)

// SyslogReceiver 負責處理 RFC 5424 / RFC 3164 Syslog UDP 與 TCP 進線
type SyslogReceiver struct {
	cfg            *config.Config
	inboundQueue   chan<- pipeline.LogEntry
	udpPacketsRecv uint64
	tcpPacketsRecv uint64
	bytesReceived  uint64
}

func NewSyslogReceiver(cfg *config.Config, inbound chan<- pipeline.LogEntry) *SyslogReceiver {
	return &SyslogReceiver{
		cfg:          cfg,
		inboundQueue: inbound,
	}
}

// StartUDP 啟動多 Worker UDP 接收器，避免單一核心被封包擠爆
func (r *SyslogReceiver) StartUDP(ctx context.Context, numWorkers int) error {
	addr := net.UDPAddr{
		Port: r.cfg.SyslogUDPPort,
		IP:   net.ParseIP("0.0.0.0"),
	}

	conn, err := net.ListenUDP("udp", &addr)
	if err != nil {
		return fmt.Errorf("監聽 UDP Syslog 埠 %d 失敗: %w", r.cfg.SyslogUDPPort, err)
	}

	// 關鍵巨量優化：放大核心 Socket 接收緩衝至設定值 (預設 32MB)
	if err := conn.SetReadBuffer(r.cfg.UDPBufferSize); err != nil {
		fmt.Printf("[警告] 無法擴大 UDP Socket 接收緩衝: %v\n", err)
	}

	fmt.Printf("[Syslog Receiver] UDP 監聽就緒 0.0.0.0:%d (核心緩衝: %d MB, 工作協程數: %d)\n",
		r.cfg.SyslogUDPPort, r.cfg.UDPBufferSize/(1024*1024), numWorkers)

	// 使用封包通訊佇列分散給各個工作協程解包
	packetChan := make(chan []byte, 10000)

	// 啟動 Worker 池
	for i := 0; i < numWorkers; i++ {
		go func(workerID int) {
			for {
				select {
				case <-ctx.Done():
					return
				case raw := <-packetChan:
					msg := strings.TrimSpace(string(raw))
					if len(msg) > 0 {
						r.inboundQueue <- pipeline.LogEntry{
							Timestamp: time.Now().UnixMilli(),
							RawMsg:    msg,
							Fields: map[string]interface{}{
								"protocol": "syslog-udp",
							},
						}
					}
				}
			}
		}(i)
	}

	// 讀取迴圈
	go func() {
		defer conn.Close()
		buf := make([]byte, 65535)

		for {
			select {
			case <-ctx.Done():
				return
			default:
				n, _, err := conn.ReadFrom(buf)
				if err != nil {
					continue
				}
				atomic.AddUint64(&r.udpPacketsRecv, 1)
				atomic.AddUint64(&r.bytesReceived, uint64(n))

				data := make([]byte, n)
				copy(data, buf[:n])

				select {
				case packetChan <- data:
				default:
					// 佇列滿載降級丟棄避免崩潰
				}
			}
		}
	}()

	return nil
}

// StartTCP 啟動 TCP Syslog 接收器
func (r *SyslogReceiver) StartTCP(ctx context.Context) error {
	addr := fmt.Sprintf("0.0.0.0:%d", r.cfg.SyslogTCPPort)
	listener, err := net.Listen("tcp", addr)
	if err != nil {
		return fmt.Errorf("監聽 TCP Syslog 埠 %d 失敗: %w", r.cfg.SyslogTCPPort, err)
	}

	fmt.Printf("[Syslog Receiver] TCP 監聽就緒 %s\n", addr)

	go func() {
		defer listener.Close()
		for {
			select {
			case <-ctx.Done():
				return
			default:
				conn, err := listener.Accept()
				if err != nil {
					continue
				}
				go r.handleTCPConn(ctx, conn)
			}
		}
	}()

	return nil
}

func (r *SyslogReceiver) handleTCPConn(ctx context.Context, conn net.Conn) {
	defer conn.Close()
	scanner := bufio.NewScanner(conn)
	// 支援最長單行日誌 1MB
	buf := make([]byte, 64*1024)
	scanner.Buffer(buf, 1024*1024)

	for scanner.Scan() {
		select {
		case <-ctx.Done():
			return
		default:
			line := strings.TrimSpace(scanner.Text())
			if len(line) == 0 {
				continue
			}
			atomic.AddUint64(&r.tcpPacketsRecv, 1)
			atomic.AddUint64(&r.bytesReceived, uint64(len(line)))

			r.inboundQueue <- pipeline.LogEntry{
				Timestamp: time.Now().UnixMilli(),
				RawMsg:    line,
				Fields: map[string]interface{}{
					"protocol": "syslog-tcp",
				},
			}
		}
	}
}

func (r *SyslogReceiver) Stats() (udp uint64, tcp uint64, bytes uint64) {
	return atomic.LoadUint64(&r.udpPacketsRecv),
		atomic.LoadUint64(&r.tcpPacketsRecv),
		atomic.LoadUint64(&r.bytesReceived)
}
