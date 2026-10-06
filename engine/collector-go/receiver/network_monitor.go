package receiver

import (
	"bytes"
	"context"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"math"
	"net"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/semor-cyber/semor-collector/config"
	"github.com/semor-cyber/semor-collector/pipeline"
)

// ============================================================================
// Network Performance & Infrastructure Monitoring (NPM/NIM) Core Specifications:
// Protocols & Ingestion:
// 1. SNMP Trap (UDP 162 / 1162 - SNMPv1, SNMPv2c, SNMPv3 Trap & Inform)
// 2. MIB-II Interface Telemetry (ifInOctets, ifOutOctets, ifInErrors, ifOperStatus)
// 3. Active ICMP / Ping Latency & Jitter Synthetic Probing
// 4. RESTful Batch Interface Telemetry (/insert/network/metrics, /insert/network/trap, /insert/network/ping)
// Features: Dynamic Bandwidth Rate Computer, Counter Rollover Guard, Link Saturation Alert, Sliding-Window Flap Detection
// ============================================================================

// NetworkInterfaceMetric 代表單一網路設備介面流量與效能指標
type NetworkInterfaceMetric struct {
	TimestampNano     int64             `json:"timestamp_nano"`
	DeviceID          string            `json:"device_id"`
	DeviceName        string            `json:"device_name"`
	DeviceIP          string            `json:"device_ip"`
	DeviceType        string            `json:"device_type"` // "switch", "router", "firewall", "ap"
	InterfaceName     string            `json:"interface_name"`
	IfIndex           int               `json:"if_index"`
	OperStatus        string            `json:"oper_status"` // "up", "down", "testing"
	InOctets          uint64            `json:"in_octets"`
	OutOctets         uint64            `json:"out_octets"`
	InErrors          uint64            `json:"in_errors"`
	OutErrors         uint64            `json:"out_errors"`
	InDiscards        uint64            `json:"in_discards,omitempty"`
	OutDiscards       uint64            `json:"out_discards,omitempty"`
	SpeedBps          uint64            `json:"speed_bps"` // 100M, 1G, 10G, 40G, 100G
	InThroughputMbps  float64           `json:"in_throughput_mbps"`
	OutThroughputMbps float64           `json:"out_throughput_mbps"`
	UtilizationPct    float64           `json:"utilization_pct"` // 0.0 - 100.0%
	InErrorRate       float64           `json:"in_error_rate,omitempty"`
	OutErrorRate      float64           `json:"out_error_rate,omitempty"`
	LatencyMs         float64           `json:"latency_ms"`
	JitterMs          float64           `json:"jitter_ms,omitempty"`
	PacketLossPct     float64           `json:"packet_loss_pct"`
	IsFlapping        bool              `json:"is_flapping,omitempty"`
	FlapCount         uint32            `json:"flap_count,omitempty"`
	CPUUsage          float64           `json:"cpu_usage,omitempty"`
	RAMUsage          float64           `json:"ram_usage,omitempty"`
	Labels            map[string]string `json:"labels,omitempty"`
}

// SNMPTrapEvent 代表 SNMP Trap 異常告警事件
type SNMPTrapEvent struct {
	TimestampNano int64             `json:"timestamp_nano"`
	AgentIP       string            `json:"agent_ip"`
	TrapOID       string            `json:"trap_oid"`
	TrapType      string            `json:"trap_type"` // "linkDown", "linkUp", "warmStart", "coldStart", "authFailure", "enterpriseSpecific"
	Community     string            `json:"community,omitempty"`
	EnterpriseOID string            `json:"enterprise_oid,omitempty"`
	SpecificCode  int               `json:"specific_code,omitempty"`
	SysUpTime     uint64            `json:"sys_uptime,omitempty"`
	Severity      string            `json:"severity"` // "Critical", "High", "Warning", "Info"
	Message       string            `json:"message"`
	Variables     map[string]string `json:"variables,omitempty"`
}

// DiagnosticProbeRecord 代表主動式 ICMP Ping / RTT / Traceroute 診斷探針結果
type DiagnosticProbeRecord struct {
	TimestampNano int64    `json:"timestamp_nano"`
	TargetIP      string   `json:"target_ip"`
	TargetName    string   `json:"target_name"`
	ProbeType     string   `json:"probe_type"` // "icmp", "tcp_syn", "dns", "http"
	Status        string   `json:"status"`     // "reachable", "unreachable", "degraded"
	LatencyMs     float64  `json:"latency_ms"`
	MinLatencyMs  float64  `json:"min_latency_ms,omitempty"`
	MaxLatencyMs  float64  `json:"max_latency_ms,omitempty"`
	JitterMs      float64  `json:"jitter_ms,omitempty"`
	PacketLossPct float64  `json:"packet_loss_pct"`
	PacketsSent   int      `json:"packets_sent,omitempty"`
	PacketsRecv   int      `json:"packets_recv,omitempty"`
	Hops          []string `json:"hops,omitempty"`
	ErrorMsg      string   `json:"error_msg,omitempty"`
}

// NetworkMonitorReceiver 管理網路監控指標與 SNMP Trap 進線
type NetworkMonitorReceiver struct {
	cfg          *config.Config
	inboundQueue chan<- pipeline.LogEntry

	// 遙測計數器 (Atomic)
	metricsBatchesRecv  uint64
	interfaceStatsRecv  uint64
	snmpTrapsRecv       uint64
	pingProbesRecv      uint64
	saturatedLinksCount uint64
	linkFlapsDetected   uint64
	totalBytesRecv      uint64
	parseErrors         uint64

	// 緩衝區物件池
	trapBufferPool sync.Pool

	// 介面歷史計數器 (用於計算速率、利用率與狀態抖動)
	rateMu   sync.Mutex
	lastSeen map[string]*interfaceHistory
}

type interfaceHistory struct {
	timestamp         int64
	inOctets          uint64
	outOctets         uint64
	lastStatus        string
	statusTransitions []int64 // 滑動視窗時間戳記錄 (毫秒)
	emaInThroughput   float64
	totalFlaps        uint32
}

func NewNetworkMonitorReceiver(cfg *config.Config, inbound chan<- pipeline.LogEntry) *NetworkMonitorReceiver {
	return &NetworkMonitorReceiver{
		cfg:          cfg,
		inboundQueue: inbound,
		trapBufferPool: sync.Pool{
			New: func() interface{} {
				buf := make([]byte, 8192)
				return &buf
			},
		},
		lastSeen: make(map[string]*interfaceHistory, 2000),
	}
}

// StartSNMPTrapUDP 啟動 SNMP Trap (UDP 162/1162) 監聽器
func (nm *NetworkMonitorReceiver) StartSNMPTrapUDP(ctx context.Context, port int) error {
	addr := net.UDPAddr{
		Port: port,
		IP:   net.ParseIP("0.0.0.0"),
	}

	conn, err := net.ListenUDP("udp", &addr)
	if err != nil {
		return fmt.Errorf("監聽 SNMP Trap UDP 埠 %d 失敗: %w", port, err)
	}

	_ = conn.SetReadBuffer(4 * 1024 * 1024)
	fmt.Printf("[網路監控核心] SNMP Trap 服務就緒: 0.0.0.0:%d (核心緩衝: 4MB, 支援 SNMPv1/v2c/v3)\n", port)

	// 優雅關閉監聽 Goroutine
	go func() {
		<-ctx.Done()
		_ = conn.Close()
	}()

	go func() {
		defer conn.Close()
		for {
			select {
			case <-ctx.Done():
				return
			default:
				bufPtr := nm.trapBufferPool.Get().(*[]byte)
				buf := *bufPtr

				n, remoteAddr, err := conn.ReadFromUDP(buf)
				if err != nil {
					nm.trapBufferPool.Put(bufPtr)
					if ctx.Err() != nil {
						return
					}
					continue
				}

				atomic.AddUint64(&nm.snmpTrapsRecv, 1)
				atomic.AddUint64(&nm.totalBytesRecv, uint64(n))

				remoteIP := ""
				if remoteAddr != nil {
					remoteIP = remoteAddr.IP.String()
				}

				nm.parseSNMPTrap(buf[:n], remoteIP)
				nm.trapBufferPool.Put(bufPtr)
			}
		}
	}()

	return nil
}

// parseSNMPTrap 解構 SNMP Trap PDU (支援標準 ASN.1/BER 二進位解碼與文字/JSON 相容格式)
func (nm *NetworkMonitorReceiver) parseSNMPTrap(data []byte, agentIP string) {
	if len(data) < 4 {
		atomic.AddUint64(&nm.parseErrors, 1)
		return
	}

	nowNano := time.Now().UnixNano()
	trap := SNMPTrapEvent{
		TimestampNano: nowNano,
		AgentIP:       agentIP,
		Variables:     make(map[string]string),
	}

	// 1. 嘗試快速檢測是否為 ASN.1/BER 編碼之二進位 SNMP 封包
	// SNMP 封包起始為 SEQUENCE (0x30)
	if data[0] == 0x30 && len(data) >= 12 {
		if nm.decodeBERPacket(data, &trap) {
			nm.emitTrapEvent(&trap)
			return
		}
	}

	// 2. 嘗試 JSON 格式解碼 (來自 REST API /insert/network/trap 或 Agent 轉發)
	if data[0] == '{' {
		if err := json.Unmarshal(data, &trap); err == nil {
			if trap.TimestampNano == 0 {
				trap.TimestampNano = nowNano
			}
			if trap.AgentIP == "" {
				trap.AgentIP = agentIP
			}
			if trap.Severity == "" {
				trap.Severity = "Warning"
			}
			nm.emitTrapEvent(&trap)
			return
		}
	}

	// 3. 文字/啟發式特徵匹配解碼 (Syslog 內嵌 SNMP Trap 或 Raw ASCII)
	rawStr := string(data)
	trap.TrapType = "enterpriseSpecific"
	trap.Severity = "Warning"
	trap.TrapOID = "1.3.6.1.6.3.1.1.5.3"
	trap.Message = fmt.Sprintf("收到來自 %s 之 SNMP 異常事件", agentIP)

	if strings.Contains(rawStr, "linkDown") || bytes.Contains(data, []byte{0x2b, 0x06, 0x01, 0x06, 0x03, 0x01, 0x01, 0x05, 0x03}) {
		trap.TrapType = "linkDown"
		trap.Severity = "Critical"
		trap.TrapOID = "1.3.6.1.6.3.1.1.5.3"
		trap.Message = fmt.Sprintf("網路設備 %s 實體介面發生 LinkDown (鏈路中斷)，請速檢查光纖模組與實體接線", agentIP)
		atomic.AddUint64(&nm.linkFlapsDetected, 1)
	} else if strings.Contains(rawStr, "linkUp") || bytes.Contains(data, []byte{0x2b, 0x06, 0x01, 0x06, 0x03, 0x01, 0x01, 0x05, 0x04}) {
		trap.TrapType = "linkUp"
		trap.Severity = "Info"
		trap.TrapOID = "1.3.6.1.6.3.1.1.5.4"
		trap.Message = fmt.Sprintf("網路設備 %s 介面 LinkUp 恢復正常連線", agentIP)
	} else if strings.Contains(rawStr, "coldStart") || bytes.Contains(data, []byte{0x2b, 0x06, 0x01, 0x06, 0x03, 0x01, 0x01, 0x05, 0x01}) {
		trap.TrapType = "coldStart"
		trap.Severity = "High"
		trap.TrapOID = "1.3.6.1.6.3.1.1.5.1"
		trap.Message = fmt.Sprintf("網路設備 %s 觸發冷啟動 (Cold Start / 重開機)", agentIP)
	} else if strings.Contains(rawStr, "warmStart") || bytes.Contains(data, []byte{0x2b, 0x06, 0x01, 0x06, 0x03, 0x01, 0x01, 0x05, 0x02}) {
		trap.TrapType = "warmStart"
		trap.Severity = "Info"
		trap.TrapOID = "1.3.6.1.6.3.1.1.5.2"
		trap.Message = fmt.Sprintf("網路設備 %s 觸發熱啟動 (Warm Start 軟重啟)", agentIP)
	} else if strings.Contains(rawStr, "authenticationFailure") || strings.Contains(rawStr, "authFailure") {
		trap.TrapType = "authFailure"
		trap.Severity = "High"
		trap.TrapOID = "1.3.6.1.6.3.1.1.5.5"
		trap.Message = fmt.Sprintf("網路設備 %s 遭遇未授權 SNMP 存取或 Community 密碼錯誤", agentIP)
	}

	trap.Variables["raw_len"] = fmt.Sprintf("%d bytes", len(data))
	nm.emitTrapEvent(&trap)
}

// decodeBERPacket 解析 ASN.1/BER 編碼之 SNMP Trap 封包
func (nm *NetworkMonitorReceiver) decodeBERPacket(data []byte, trap *SNMPTrapEvent) bool {
	pos := 0
	// 檢查 Outer SEQUENCE
	if pos >= len(data) || data[pos] != 0x30 {
		return false
	}
	pos++
	_, n := readBERLength(data[pos:])
	pos += n

	// 1. 版本 Version (INTEGER: 0x02)
	if pos >= len(data) || data[pos] != 0x02 {
		return false
	}
	pos++
	vLen, n := readBERLength(data[pos:])
	pos += n
	if pos+vLen > len(data) {
		return false
	}
	version := 0
	for i := 0; i < vLen; i++ {
		version = (version << 8) | int(data[pos+i])
	}
	pos += vLen

	// 2. 社群字串 Community (OCTET STRING: 0x04)
	if pos < len(data) && data[pos] == 0x04 {
		pos++
		cLen, n := readBERLength(data[pos:])
		pos += n
		if pos+cLen <= len(data) {
			trap.Community = string(data[pos : pos+cLen])
			pos += cLen
		}
	}

	// 3. PDU Tag: 0xa4 (SNMPv1 Trap), 0xa7 (SNMPv2c Trap), 0xa6 (InformRequest)
	if pos >= len(data) {
		return false
	}
	pduTag := data[pos]
	pos++
	_, n = readBERLength(data[pos:])
	pos += n

	switch pduTag {
	case 0xa4: // SNMPv1 Trap-PDU
		// Enterprise OID (OBJECT IDENTIFIER: 0x06)
		if pos < len(data) && data[pos] == 0x06 {
			pos++
			oidLen, n := readBERLength(data[pos:])
			pos += n
			if pos+oidLen <= len(data) {
				trap.EnterpriseOID = decodeOID(data[pos : pos+oidLen])
				pos += oidLen
			}
		}
		// Agent Address (NetworkAddress: 0x40)
		if pos < len(data) && data[pos] == 0x40 {
			pos++
			ipLen, n := readBERLength(data[pos:])
			pos += n
			if ipLen == 4 && pos+4 <= len(data) {
				trap.AgentIP = net.IP(data[pos : pos+4]).String()
			}
			pos += ipLen
		}
		// Generic Trap (INTEGER: 0x02)
		if pos < len(data) && data[pos] == 0x02 {
			pos++
			gLen, n := readBERLength(data[pos:])
			pos += n
			genericType := 6
			if gLen > 0 && pos < len(data) {
				genericType = int(data[pos])
				pos += gLen
			}
			switch genericType {
			case 0:
				trap.TrapType = "coldStart"
				trap.Severity = "High"
				trap.TrapOID = "1.3.6.1.6.3.1.1.5.1"
				trap.Message = fmt.Sprintf("網路設備 %s 觸發冷啟動 (Cold Start)", trap.AgentIP)
			case 1:
				trap.TrapType = "warmStart"
				trap.Severity = "Info"
				trap.TrapOID = "1.3.6.1.6.3.1.1.5.2"
				trap.Message = fmt.Sprintf("網路設備 %s 觸發熱啟動 (Warm Start)", trap.AgentIP)
			case 2:
				trap.TrapType = "linkDown"
				trap.Severity = "Critical"
				trap.TrapOID = "1.3.6.1.6.3.1.1.5.3"
				trap.Message = fmt.Sprintf("網路設備 %s 實體介面發生 LinkDown (鏈路中斷)", trap.AgentIP)
				atomic.AddUint64(&nm.linkFlapsDetected, 1)
			case 3:
				trap.TrapType = "linkUp"
				trap.Severity = "Info"
				trap.TrapOID = "1.3.6.1.6.3.1.1.5.4"
				trap.Message = fmt.Sprintf("網路設備 %s 介面 LinkUp 恢復正常連線", trap.AgentIP)
			case 4:
				trap.TrapType = "authFailure"
				trap.Severity = "High"
				trap.TrapOID = "1.3.6.1.6.3.1.1.5.5"
				trap.Message = fmt.Sprintf("網路設備 %s 遭遇 SNMP 驗證失敗 (authFailure)", trap.AgentIP)
			default:
				trap.TrapType = "enterpriseSpecific"
				trap.Severity = "Warning"
				trap.TrapOID = trap.EnterpriseOID
				trap.Message = fmt.Sprintf("網路設備 %s 觸發廠商自訂 SNMP Trap", trap.AgentIP)
			}
		}
		return true

	case 0xa7, 0xa6: // SNMPv2c Trap / InformRequest
		// Skip Request ID (0x02), Error Status (0x02), Error Index (0x02)
		for step := 0; step < 3 && pos < len(data); step++ {
			if data[pos] == 0x02 {
				pos++
				skipLen, n := readBERLength(data[pos:])
				pos += n + skipLen
			}
		}

		// VarBindList (SEQUENCE: 0x30)
		if pos < len(data) && data[pos] == 0x30 {
			trap.TrapType = "snmpV2Trap"
			trap.Severity = "Warning"
			trap.TrapOID = "1.3.6.1.6.3.1.1.5"
			trap.Message = fmt.Sprintf("網路設備 %s 接收到 SNMPv2 Trap 事件", trap.AgentIP)

			// 快速掃描內嵌 OID
			if bytes.Contains(data[pos:], []byte{0x2b, 0x06, 0x01, 0x06, 0x03, 0x01, 0x01, 0x05, 0x03}) {
				trap.TrapType = "linkDown"
				trap.Severity = "Critical"
				trap.TrapOID = "1.3.6.1.6.3.1.1.5.3"
				trap.Message = fmt.Sprintf("網路設備 %s 實體介面發生 LinkDown (鏈路中斷)", trap.AgentIP)
				atomic.AddUint64(&nm.linkFlapsDetected, 1)
			} else if bytes.Contains(data[pos:], []byte{0x2b, 0x06, 0x01, 0x06, 0x03, 0x01, 0x01, 0x05, 0x04}) {
				trap.TrapType = "linkUp"
				trap.Severity = "Info"
				trap.TrapOID = "1.3.6.1.6.3.1.1.5.4"
				trap.Message = fmt.Sprintf("網路設備 %s 介面 LinkUp 恢復連線", trap.AgentIP)
			}
			return true
		}
	}

	return false
}

// readBERLength 解析 ASN.1 BER 長度欄位
func readBERLength(b []byte) (length int, bytesRead int) {
	if len(b) == 0 {
		return 0, 0
	}
	if b[0] < 0x80 {
		return int(b[0]), 1
	}
	numBytes := int(b[0] & 0x7f)
	if len(b) < 1+numBytes {
		return 0, 1
	}
	res := 0
	for i := 0; i < numBytes; i++ {
		res = (res << 8) | int(b[1+i])
	}
	return res, 1 + numBytes
}

// decodeOID 將二進位 OID 解碼為標準十進位點分格式 (如 1.3.6.1.6.3.1.1.5.3)
func decodeOID(b []byte) string {
	if len(b) == 0 {
		return ""
	}
	var parts []string
	first := int(b[0])
	parts = append(parts, fmt.Sprintf("%d", first/40), fmt.Sprintf("%d", first%40))

	val := 0
	for i := 1; i < len(b); i++ {
		val = (val << 7) | int(b[i]&0x7f)
		if (b[i] & 0x80) == 0 {
			parts = append(parts, fmt.Sprintf("%d", val))
			val = 0
		}
	}
	return strings.Join(parts, ".")
}

// emitTrapEvent 將結構化 Trap 事件轉為 LogEntry 並注入佇列
func (nm *NetworkMonitorReceiver) emitTrapEvent(trap *SNMPTrapEvent) {
	trapJSON, _ := json.Marshal(trap)
	entry := pipeline.LogEntry{
		Timestamp: trap.TimestampNano,
		RawMsg:    string(trapJSON),
		Fields: map[string]interface{}{
			"source":         "network_monitor",
			"telemetry_type": "snmp_trap",
			"agent_ip":       trap.AgentIP,
			"trap_type":      trap.TrapType,
			"trap_oid":       trap.TrapOID,
			"severity":       trap.Severity,
			"message":        trap.Message,
		},
	}

	select {
	case nm.inboundQueue <- entry:
	default:
		atomic.AddUint64(&nm.parseErrors, 1)
	}
}

// IngestMetricsBatch 接收批次介面流量與效能遙測 JSON
func (nm *NetworkMonitorReceiver) IngestMetricsBatch(payload []byte) error {
	var metrics []NetworkInterfaceMetric
	if err := json.Unmarshal(payload, &metrics); err != nil {
		// 嘗試反序列化單筆
		var single NetworkInterfaceMetric
		if errSingle := json.Unmarshal(payload, &single); errSingle != nil {
			atomic.AddUint64(&nm.parseErrors, 1)
			return err
		}
		metrics = []NetworkInterfaceMetric{single}
	}

	atomic.AddUint64(&nm.metricsBatchesRecv, 1)
	atomic.AddUint64(&nm.interfaceStatsRecv, uint64(len(metrics)))
	atomic.AddUint64(&nm.totalBytesRecv, uint64(len(payload)))

	nowNano := time.Now().UnixNano()
	nowMs := nowNano / 1e6

	for i := range metrics {
		m := &metrics[i]
		if m.TimestampNano == 0 {
			m.TimestampNano = nowNano
		}

		key := fmt.Sprintf("%s:%s", m.DeviceIP, m.InterfaceName)
		nm.rateMu.Lock()
		hist, exists := nm.lastSeen[key]
		if !exists {
			hist = &interfaceHistory{
				timestamp:         m.TimestampNano,
				inOctets:          m.InOctets,
				outOctets:         m.OutOctets,
				lastStatus:        m.OperStatus,
				statusTransitions: make([]int64, 0, 10),
			}
			nm.lastSeen[key] = hist
		} else {
			// 1. 介面抖動與 Link Flap 滑動視窗追蹤 (60秒視窗)
			if hist.lastStatus != "" && hist.lastStatus != m.OperStatus {
				hist.statusTransitions = append(hist.statusTransitions, nowMs)
				hist.lastStatus = m.OperStatus
				hist.totalFlaps++
			}

			// 清理超過 60 秒 (60,000ms) 的舊躍遷歷史
			cutoffMs := nowMs - 60000
			idx := 0
			for ; idx < len(hist.statusTransitions); idx++ {
				if hist.statusTransitions[idx] >= cutoffMs {
					break
				}
			}
			if idx > 0 {
				hist.statusTransitions = hist.statusTransitions[idx:]
			}

			if len(hist.statusTransitions) >= 3 {
				m.IsFlapping = true
				m.FlapCount = uint32(len(hist.statusTransitions))
				atomic.AddUint64(&nm.linkFlapsDetected, 1)
			}

			// 2. 64-bit / 32-bit Octets 計數器 Delta 頻寬速率計算 (含 Rollover Guard)
			dtSec := float64(m.TimestampNano-hist.timestamp) / 1e9
			if dtSec > 0.001 && dtSec < 300.0 {
				var deltaIn, deltaOut uint64

				// InOctets 溢位處理 (32-bit rollover 或重置檢測)
				if m.InOctets >= hist.inOctets {
					deltaIn = m.InOctets - hist.inOctets
				} else if hist.inOctets <= math.MaxUint32 && m.InOctets <= math.MaxUint32 {
					// 32-bit counter rollover
					deltaIn = (math.MaxUint32 - hist.inOctets) + m.InOctets
				} else {
					// 設備計數器被重置
					deltaIn = m.InOctets
				}

				// OutOctets 溢位處理
				if m.OutOctets >= hist.outOctets {
					deltaOut = m.OutOctets - hist.outOctets
				} else if hist.outOctets <= math.MaxUint32 && m.OutOctets <= math.MaxUint32 {
					deltaOut = (math.MaxUint32 - hist.outOctets) + m.OutOctets
				} else {
					deltaOut = m.OutOctets
				}

				m.InThroughputMbps = (float64(deltaIn) * 8.0) / (dtSec * 1e6)
				m.OutThroughputMbps = (float64(deltaOut) * 8.0) / (dtSec * 1e6)

				// 計算頻寬利用率
				if m.SpeedBps > 0 {
					maxSpeedMbps := float64(m.SpeedBps) / 1e6
					maxThroughput := m.InThroughputMbps
					if m.OutThroughputMbps > maxThroughput {
						maxThroughput = m.OutThroughputMbps
					}
					m.UtilizationPct = (maxThroughput / maxSpeedMbps) * 100.0
					if m.UtilizationPct > 100.0 {
						m.UtilizationPct = 100.0
					}
				}

				// 錯誤率計算
				if deltaIn > 0 && m.InErrors > 0 {
					m.InErrorRate = (float64(m.InErrors) / float64(deltaIn)) * 1000.0
				}
				if deltaOut > 0 && m.OutErrors > 0 {
					m.OutErrorRate = (float64(m.OutErrors) / float64(deltaOut)) * 1000.0
				}
			}

			hist.timestamp = m.TimestampNano
			hist.inOctets = m.InOctets
			hist.outOctets = m.OutOctets
		}
		nm.rateMu.Unlock()

		// 判定鏈路飽和 (Saturation Alert >= 85%)
		if m.UtilizationPct >= 85.0 {
			atomic.AddUint64(&nm.saturatedLinksCount, 1)
		}

		mJSON, _ := json.Marshal(m)
		entry := pipeline.LogEntry{
			Timestamp: m.TimestampNano,
			RawMsg:    string(mJSON),
			Fields: map[string]interface{}{
				"source":          "network_monitor",
				"telemetry_type":  "network_metric",
				"device_id":       m.DeviceID,
				"device_ip":       m.DeviceIP,
				"interface_name":  m.InterfaceName,
				"oper_status":     m.OperStatus,
				"utilization_pct": m.UtilizationPct,
				"throughput_in":   m.InThroughputMbps,
				"throughput_out":  m.OutThroughputMbps,
				"latency_ms":      m.LatencyMs,
				"is_flapping":     m.IsFlapping,
			},
		}

		select {
		case nm.inboundQueue <- entry:
		default:
			atomic.AddUint64(&nm.parseErrors, 1)
		}
	}

	return nil
}

// IngestPingResult 接收主動 ICMP Ping / Traceroute 診斷探針結果
func (nm *NetworkMonitorReceiver) IngestPingResult(payload []byte) error {
	var probeData DiagnosticProbeRecord
	if err := json.Unmarshal(payload, &probeData); err != nil {
		// 支援自由欄位 JSON 格式相容
		var mapData map[string]interface{}
		if errMap := json.Unmarshal(payload, &mapData); errMap != nil {
			atomic.AddUint64(&nm.parseErrors, 1)
			return err
		}
		probeData = DiagnosticProbeRecord{
			TargetIP:   fmt.Sprintf("%v", mapData["target"]),
			TargetName: fmt.Sprintf("%v", mapData["target_name"]),
			ProbeType:  fmt.Sprintf("%v", mapData["type"]),
			Status:     fmt.Sprintf("%v", mapData["status"]),
		}
	}

	atomic.AddUint64(&nm.pingProbesRecv, 1)
	atomic.AddUint64(&nm.totalBytesRecv, uint64(len(payload)))

	nowNano := time.Now().UnixNano()
	if probeData.TimestampNano == 0 {
		probeData.TimestampNano = nowNano
	}

	recordJSON, _ := json.Marshal(probeData)
	entry := pipeline.LogEntry{
		Timestamp: probeData.TimestampNano,
		RawMsg:    string(recordJSON),
		Fields: map[string]interface{}{
			"source":         "network_monitor",
			"telemetry_type": "diagnostic_probe",
			"target":         probeData.TargetIP,
			"target_name":    probeData.TargetName,
			"probe_type":     probeData.ProbeType,
			"status":         probeData.Status,
			"latency_ms":     probeData.LatencyMs,
			"jitter_ms":      probeData.JitterMs,
			"packet_loss":    probeData.PacketLossPct,
		},
	}

	select {
	case nm.inboundQueue <- entry:
	default:
		atomic.AddUint64(&nm.parseErrors, 1)
	}

	return nil
}

// ExecuteActivePingProbe 執行即時主動式網路探針 (TCP/ICMP 連通性與 RTT 評估)
func (nm *NetworkMonitorReceiver) ExecuteActivePingProbe(target string, timeout time.Duration) DiagnosticProbeRecord {
	start := time.Now()
	record := DiagnosticProbeRecord{
		TimestampNano: start.UnixNano(),
		TargetIP:      target,
		ProbeType:     "tcp_syn",
		Status:        "unreachable",
		PacketsSent:   1,
	}

	// 嘗試 TCP 探針 (標準 80, 443 或目標指定埠)
	host := target
	if !strings.Contains(host, ":") {
		host = net.JoinHostPort(target, "443")
	}

	conn, err := net.DialTimeout("tcp", host, timeout)
	rtt := time.Since(start)
	if err != nil {
		// 備援嘗試埠 80
		start80 := time.Now()
		host80 := net.JoinHostPort(target, "80")
		conn80, err80 := net.DialTimeout("tcp", host80, timeout)
		if err80 == nil {
			_ = conn80.Close()
			record.Status = "reachable"
			record.LatencyMs = float64(time.Since(start80).Microseconds()) / 1000.0
			record.PacketsRecv = 1
			record.PacketLossPct = 0.0
		} else {
			record.ErrorMsg = err.Error()
			record.PacketLossPct = 100.0
		}
	} else {
		_ = conn.Close()
		record.Status = "reachable"
		record.LatencyMs = float64(rtt.Microseconds()) / 1000.0
		record.PacketsRecv = 1
		record.PacketLossPct = 0.0
	}

	payload, _ := json.Marshal(record)
	_ = nm.IngestPingResult(payload)
	return record
}

// Telemetry 輸出網路監控收集核心即時指標
func (nm *NetworkMonitorReceiver) Telemetry() map[string]interface{} {
	nm.rateMu.Lock()
	activeCount := len(nm.lastSeen)
	nm.rateMu.Unlock()

	return map[string]interface{}{
		"metrics_batches":     atomic.LoadUint64(&nm.metricsBatchesRecv),
		"interface_stats":     atomic.LoadUint64(&nm.interfaceStatsRecv),
		"snmp_traps":          atomic.LoadUint64(&nm.snmpTrapsRecv),
		"ping_probes":         atomic.LoadUint64(&nm.pingProbesRecv),
		"saturated_links":     atomic.LoadUint64(&nm.saturatedLinksCount),
		"link_flaps":          atomic.LoadUint64(&nm.linkFlapsDetected),
		"active_interfaces":   activeCount,
		"total_bytes_mb":      float64(atomic.LoadUint64(&nm.totalBytesRecv)) / (1024 * 1024),
		"parse_errors":        atomic.LoadUint64(&nm.parseErrors),
	}
}

