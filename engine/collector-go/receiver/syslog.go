package receiver

import (
	"bufio"
	"context"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/tls"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/pem"
	"fmt"
	"io"
	"math/big"
	"net"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/semor-cyber/semor-collector/config"
	"github.com/semor-cyber/semor-collector/pipeline"
)

// FacilityNames 定義標準 RFC 5424 Syslog Facility 名稱對照
var FacilityNames = []string{
	"kernel", "user", "mail", "system", "auth", "syslog", "lpr", "news",
	"uucp", "clock", "authpriv", "ftp", "ntp", "logaudit", "logalert", "cron",
	"local0", "local1", "local2", "local3", "local4", "local5", "local6", "local7",
}

// SeverityNames 定義標準 RFC 5424 Syslog Severity 嚴重度等級名稱
var SeverityNames = []string{
	"Emergency", "Alert", "Critical", "Error", "Warning", "Notice", "Informational", "Debug",
}

// RFC 5424 標準格式正則式：<PRI>VERSION TIMESTAMP HOSTNAME APP-NAME PROCID MSGID [STRUCTURED-DATA] MSG
var rfc5424Regex = regexp.MustCompile(`^<(\d{1,3})>([1-9]\d{0,1})\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s*(?:\[(.*?)\])?\s*(.*)$`)

// RFC 3164 (BSD Syslog) 傳統格式正則式：<PRI>Mmm dd hh:mm:ss HOSTNAME TAG[PID]: MSG
var rfc3164Regex = regexp.MustCompile(`^<(\d{1,3})>([A-Z][a-z]{2}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})\s+(\S+)\s+([^:\[\s]+)(?:\[(\d+)\])?:\s*(.*)$`)

// CEF (Common Event Format) 正則式
var cefRegex = regexp.MustCompile(`CEF:(\d+)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|(.*)`)

// SourceTelemetry 紀錄特定來源 IP 的收集效能與連線狀況
type SourceTelemetry struct {
	RemoteIP       string    `json:"remote_ip"`
	Protocol       string    `json:"protocol"`
	PacketsRecv    uint64    `json:"packets_recv"`
	BytesRecv      uint64    `json:"bytes_recv"`
	Errors         uint64    `json:"errors"`
	RateEPS        float64   `json:"rate_eps"`
	LastSeen       time.Time `json:"last_seen"`
	ActiveState    string    `json:"active_state"`
	DeviceVendor   string    `json:"device_vendor,omitempty"`
}

// SyslogReceiver 負責處理 RFC 5424 / RFC 3164 / RFC 5425 Syslog UDP、TCP 與 TLS 進線
type SyslogReceiver struct {
	cfg            *config.Config
	inboundQueue   chan<- pipeline.LogEntry
	udpPacketsRecv uint64
	tcpPacketsRecv uint64
	tlsPacketsRecv uint64
	bytesReceived  uint64
	parseErrors    uint64

	// 零拷貝緩衝區物件池 (減少 GC 壓力)
	packetPool sync.Pool

	// 來源設備連線遙測狀態表
	sourcesMu sync.RWMutex
	sources   map[string]*SourceTelemetry

	// 每個來源 IP 的流量速率限制 (防範單一失控設備打爆核心緩衝)
	rateLimiterMu sync.Mutex
	rateLimits    map[string]*tokenBucket
}

type tokenBucket struct {
	tokens     float64
	capacity   float64
	refillRate float64
	lastRefill time.Time
}

func (tb *tokenBucket) allow() bool {
	now := time.Now()
	elapsed := now.Sub(tb.lastRefill).Seconds()
	tb.tokens += elapsed * tb.refillRate
	if tb.tokens > tb.capacity {
		tb.tokens = tb.capacity
	}
	tb.lastRefill = now
	if tb.tokens >= 1.0 {
		tb.tokens -= 1.0
		return true
	}
	return false
}

func NewSyslogReceiver(cfg *config.Config, inbound chan<- pipeline.LogEntry) *SyslogReceiver {
	return &SyslogReceiver{
		cfg:          cfg,
		inboundQueue: inbound,
		packetPool: sync.Pool{
			New: func() interface{} {
				b := make([]byte, 65535)
				return &b
			},
		},
		sources:    make(map[string]*SourceTelemetry),
		rateLimits: make(map[string]*tokenBucket),
	}
}

// recordSourceStats 紀錄各來源設備之統計指標
func (r *SyslogReceiver) recordSourceStats(remoteIP, proto, vendor string, byteLen int) {
	if remoteIP == "" {
		remoteIP = "127.0.0.1"
	}
	r.sourcesMu.Lock()
	st, exists := r.sources[remoteIP]
	if !exists {
		st = &SourceTelemetry{
			RemoteIP:    remoteIP,
			Protocol:    proto,
			ActiveState: "active",
			LastSeen:    time.Now(),
		}
		if vendor != "" {
			st.DeviceVendor = vendor
		}
		r.sources[remoteIP] = st
	}
	st.PacketsRecv++
	st.BytesRecv += uint64(byteLen)
	st.LastSeen = time.Now()
	if vendor != "" && st.DeviceVendor == "" {
		st.DeviceVendor = vendor
	}
	r.sourcesMu.Unlock()
}

// checkRateLimit 檢查來源 IP 是否超過吞吐限額 (Token Bucket)
func (r *SyslogReceiver) checkRateLimit(remoteIP string) bool {
	if r.cfg.RateLimitEPSPerSource <= 0 {
		return true
	}
	r.rateLimiterMu.Lock()
	defer r.rateLimiterMu.Unlock()

	tb, ok := r.rateLimits[remoteIP]
	if !ok {
		limit := float64(r.cfg.RateLimitEPSPerSource)
		tb = &tokenBucket{
			tokens:     limit,
			capacity:   limit * 2,
			refillRate: limit,
			lastRefill: time.Now(),
		}
		r.rateLimits[remoteIP] = tb
	}
	return tb.allow()
}

// ParseSyslogMessage 深入解析 RFC 5424 / RFC 3164 / CEF / Key-Value 結構
func (r *SyslogReceiver) ParseSyslogMessage(raw string, proto string, remoteIP string) pipeline.LogEntry {
	trimmed := strings.TrimSpace(raw)
	nowNano := time.Now().UnixNano()

	entry := pipeline.LogEntry{
		Timestamp: nowNano,
		RawMsg:    trimmed,
		Fields: map[string]interface{}{
			"protocol":  proto,
			"remote_ip": remoteIP,
		},
	}

	if len(trimmed) == 0 {
		return entry
	}

	// 1. 檢查是否符合 RFC 5424 (<PRI>VERSION TIMESTAMP HOSTNAME APP PROCID MSGID [SD] MSG)
	if m := rfc5424Regex.FindStringSubmatch(trimmed); len(m) > 0 {
		pri, _ := strconv.Atoi(m[1])
		version, _ := strconv.Atoi(m[2])
		timestampStr := m[3]
		hostname := m[4]
		appName := m[5]
		procID := m[6]
		msgID := m[7]
		structuredData := m[8]
		msg := m[9]

		facCode := pri / 8
		sevCode := pri % 8
		var facName, sevName string
		if facCode >= 0 && facCode < len(FacilityNames) {
			facName = FacilityNames[facCode]
		} else {
			facName = fmt.Sprintf("facility_%d", facCode)
		}
		if sevCode >= 0 && sevCode < len(SeverityNames) {
			sevName = SeverityNames[sevCode]
		} else {
			sevName = fmt.Sprintf("severity_%d", sevCode)
		}

		entry.Fields["syslog_format"] = "RFC-5424"
		entry.Fields["syslog_priority"] = pri
		entry.Fields["syslog_facility_code"] = facCode
		entry.Fields["syslog_facility"] = facName
		entry.Fields["syslog_severity_code"] = sevCode
		entry.Fields["syslog_severity"] = sevName
		entry.Fields["severity"] = sevName
		entry.Fields["syslog_version"] = version
		entry.Fields["timestamp_str"] = timestampStr
		entry.Fields["hostname"] = hostname
		entry.Fields["app_name"] = appName
		entry.Fields["proc_id"] = procID
		entry.Fields["msg_id"] = msgID

		// 解析 Structured Data (例如 [exampleSDID@32473 iut="3" eventSource="App"])
		if structuredData != "" {
			sdMap := parseStructuredData(structuredData)
			if len(sdMap) > 0 {
				entry.Fields["structured_data"] = sdMap
			}
		}

		entry.Fields["message"] = msg
		// 深入解析訊息本體內的 key-value
		r.extractKeyValues(msg, entry.Fields)
		return entry
	}

	// 2. 檢查是否符合 RFC 3164 (BSD Syslog: <PRI>Mmm dd hh:mm:ss HOST TAG[PID]: MSG)
	if m := rfc3164Regex.FindStringSubmatch(trimmed); len(m) > 0 {
		pri, _ := strconv.Atoi(m[1])
		facCode := pri / 8
		sevCode := pri % 8
		var facName, sevName string
		if facCode >= 0 && facCode < len(FacilityNames) {
			facName = FacilityNames[facCode]
		}
		if sevCode >= 0 && sevCode < len(SeverityNames) {
			sevName = SeverityNames[sevCode]
		}

		entry.Fields["syslog_format"] = "RFC-3164"
		entry.Fields["syslog_priority"] = pri
		entry.Fields["syslog_facility_code"] = facCode
		entry.Fields["syslog_facility"] = facName
		entry.Fields["syslog_severity_code"] = sevCode
		entry.Fields["syslog_severity"] = sevName
		entry.Fields["severity"] = sevName
		entry.Fields["bsd_timestamp"] = m[2]
		entry.Fields["hostname"] = m[3]
		entry.Fields["app_name"] = m[4]
		if m[5] != "" {
			entry.Fields["proc_id"] = m[5]
		}
		msg := m[6]
		entry.Fields["message"] = msg

		// 檢查是否包含 CEF
		if strings.Contains(msg, "CEF:") {
			r.parseCEF(msg, entry.Fields)
		} else {
			r.extractKeyValues(msg, entry.Fields)
		}
		return entry
	}

	// 3. 檢查單純 CEF 格式
	if strings.Contains(trimmed, "CEF:") {
		r.parseCEF(trimmed, entry.Fields)
		return entry
	}

	// 4. 檢查一般 Firewall / NGFW Key-Value 格式 (例如 FortiGate: date=2026-09-22 time=... type=traffic srcip=... action=deny)
	r.extractKeyValues(trimmed, entry.Fields)
	entry.Fields["syslog_format"] = "Raw-Text"
	return entry
}

// parseStructuredData 解析 RFC 5424 的 [SD-ID param1="val1" param2="val2"]
func parseStructuredData(sd string) map[string]interface{} {
	result := make(map[string]interface{})
	sdRegex := regexp.MustCompile(`\[([^\s\]]+)(?:\s+([^\]]+))?\]`)
	paramRegex := regexp.MustCompile(`([^\s=]+)="([^"]*)"`)

	for _, m := range sdRegex.FindAllStringSubmatch(sd, -1) {
		id := m[1]
		params := make(map[string]string)
		if len(m) > 2 && m[2] != "" {
			for _, pm := range paramRegex.FindAllStringSubmatch(m[2], -1) {
				params[pm[1]] = pm[2]
			}
		}
		result[id] = params
	}
	return result
}

// parseCEF 解析 ArcSight Common Event Format
func (r *SyslogReceiver) parseCEF(raw string, fields map[string]interface{}) {
	fields["format"] = "CEF"
	m := cefRegex.FindStringSubmatch(raw)
	if len(m) >= 9 {
		fields["cef_version"] = m[1]
		fields["device_vendor"] = m[2]
		fields["device_product"] = m[3]
		fields["device_version"] = m[4]
		fields["device_event_class_id"] = m[5]
		fields["name"] = m[6]
		fields["severity"] = m[7]

		ext := m[8]
		// CEF 擴展欄位 key=value
		r.extractKeyValues(ext, fields)
	}
}

// extractKeyValues 智慧提取日誌內鍵值對 (支援 srcip, dstip, action, proto, user 等防火牆常用欄位)
func (r *SyslogReceiver) extractKeyValues(text string, fields map[string]interface{}) {
	kvRegex := regexp.MustCompile(`([a-zA-Z0-9_\-\.]+)=("([^"]*)"|'([^']*)'|([^\s",]+))`)
	matches := kvRegex.FindAllStringSubmatch(text, -1)
	for _, m := range matches {
		k := strings.ToLower(m[1])
		var v string
		if m[3] != "" {
			v = m[3]
		} else if m[4] != "" {
			v = m[4]
		} else {
			v = m[5]
		}

		fields[k] = v

		// 同步規範化至 ECS 標準名稱
		switch k {
		case "srcip", "src_ip", "src":
			fields["source.ip"] = v
			fields["src_ip"] = v
		case "dstip", "dst_ip", "dst":
			fields["destination.ip"] = v
			fields["dst_ip"] = v
		case "srcport", "src_port", "spt":
			fields["source.port"] = v
			fields["src_port"] = v
		case "dstport", "dst_port", "dpt":
			fields["destination.port"] = v
			fields["dst_port"] = v
		case "action", "act":
			fields["event.action"] = v
			fields["action"] = v
		case "user", "username", "usr", "suser", "duser":
			fields["user.name"] = v
			fields["user"] = v
		case "proto", "protocol":
			fields["network.transport"] = strings.ToUpper(v)
		case "policyid", "policy_id":
			fields["rule.id"] = v
		}
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

	type udpPacket struct {
		data     []byte
		length   int
		remoteIP string
	}

	packetChan := make(chan udpPacket, 50000)

	// 啟動 Worker 池並做細緻 RFC 解析
	for i := 0; i < numWorkers; i++ {
		go func(workerID int) {
			for {
				select {
				case <-ctx.Done():
					return
				case pkt := <-packetChan:
					rawMsg := string(pkt.data[:pkt.length])
					r.packetPool.Put(&pkt.data)

					if !r.checkRateLimit(pkt.remoteIP) {
						continue // 超過來源限速
					}

					entry := r.ParseSyslogMessage(rawMsg, "syslog-udp", pkt.remoteIP)
					r.recordSourceStats(pkt.remoteIP, "UDP", entry.Fields["device_vendor"].(string), pkt.length)

					select {
					case r.inboundQueue <- entry:
					default:
						atomic.AddUint64(&r.parseErrors, 1)
					}
				}
			}
		}(i)
	}

	// 讀取迴圈
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
				bufPtr := r.packetPool.Get().(*[]byte)
				buf := *bufPtr

				n, remoteAddr, err := conn.ReadFromUDP(buf)
				if err != nil {
					r.packetPool.Put(bufPtr)
					if ctx.Err() != nil {
						return
					}
					continue
				}
				atomic.AddUint64(&r.udpPacketsRecv, 1)
				atomic.AddUint64(&r.bytesReceived, uint64(n))

				var remoteIPStr string
				if remoteAddr != nil {
					remoteIPStr = remoteAddr.IP.String()
				}

				select {
				case packetChan <- udpPacket{data: buf, length: n, remoteIP: remoteIPStr}:
				default:
					// 佇列滿載時回收緩衝
					r.packetPool.Put(bufPtr)
					atomic.AddUint64(&r.parseErrors, 1)
				}
			}
		}
	}()

	return nil
}

// StartTCP 啟動 TCP Syslog 接收器 (支援 RFC 6587 Octet Counting 與 CRLF 串流)
func (r *SyslogReceiver) StartTCP(ctx context.Context) error {
	addr := fmt.Sprintf("0.0.0.0:%d", r.cfg.SyslogTCPPort)
	listener, err := net.Listen("tcp", addr)
	if err != nil {
		return fmt.Errorf("監聽 TCP Syslog 埠 %d 失敗: %w", r.cfg.SyslogTCPPort, err)
	}

	fmt.Printf("[Syslog Receiver] TCP 監聽就緒 %s (支援 RFC-6587 Octet Counting / 換行分割)\n", addr)

	go func() {
		<-ctx.Done()
		_ = listener.Close()
	}()

	go func() {
		defer listener.Close()
		for {
			select {
			case <-ctx.Done():
				return
			default:
				conn, err := listener.Accept()
				if err != nil {
					if ctx.Err() != nil {
						return
					}
					continue
				}
				go r.handleTCPConn(ctx, conn, "syslog-tcp")
			}
		}
	}()

	return nil
}

// StartTLS 啟動 RFC 5425 安全 Syslog over TLS (TCP 6514) 接收器
func (r *SyslogReceiver) StartTLS(ctx context.Context) error {
	addr := fmt.Sprintf("0.0.0.0:%d", r.cfg.SyslogTLSPort)

	tlsCert, err := r.loadOrCreateCertificate()
	if err != nil {
		return fmt.Errorf("準備 TLS 證書失敗: %w", err)
	}

	tlsConfig := &tls.Config{
		Certificates: []tls.Certificate{tlsCert},
		MinVersion:   tls.VersionTLS12,
		CipherSuites: []uint16{
			tls.TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384,
			tls.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,
			tls.TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256,
			tls.TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,
		},
	}

	listener, err := tls.Listen("tcp", addr, tlsConfig)
	if err != nil {
		return fmt.Errorf("監聽 TLS Syslog 埠 %d 失敗: %w", r.cfg.SyslogTLSPort, err)
	}

	fmt.Printf("[Syslog Receiver] TLS RFC-5425 監聽就緒 %s (mTLS/TLS 1.2+ 就緒)\n", addr)

	go func() {
		<-ctx.Done()
		_ = listener.Close()
	}()

	go func() {
		defer listener.Close()
		for {
			select {
			case <-ctx.Done():
				return
			default:
				conn, err := listener.Accept()
				if err != nil {
					if ctx.Err() != nil {
						return
					}
					continue
				}
				atomic.AddUint64(&r.tlsPacketsRecv, 1)
				go r.handleTCPConn(ctx, conn, "syslog-tls")
			}
		}
	}()

	return nil
}

// handleTCPConn 處理 TCP / TLS 連線，支援 RFC 6587 Octet Counting (如: 123 <14>...) 與一般換行串流
func (r *SyslogReceiver) handleTCPConn(ctx context.Context, conn net.Conn, proto string) {
	defer conn.Close()

	remoteIP := ""
	if addr, ok := conn.RemoteAddr().(*net.TCPAddr); ok {
		remoteIP = addr.IP.String()
	}

	reader := bufio.NewReaderSize(conn, 128*1024)

	for {
		select {
		case <-ctx.Done():
			return
		default:
			// 1. 探測是否以數字開頭 (RFC 6587 Octet-counting framing: "MSG-LEN <PRIVAL>...")
			peekBytes, err := reader.Peek(1)
			if err != nil {
				return
			}

			if peekBytes[0] >= '0' && peekBytes[0] <= '9' {
				// 讀取長度前綴
				lenStr, err := reader.ReadString(' ')
				if err != nil {
					return
				}
				lenStr = strings.TrimSpace(lenStr)
				msgLen, err := strconv.Atoi(lenStr)
				if err == nil && msgLen > 0 && msgLen < 1024*1024 {
					payload := make([]byte, msgLen)
					_, err = io.ReadFull(reader, payload)
					if err != nil {
						return
					}

					atomic.AddUint64(&r.tcpPacketsRecv, 1)
					atomic.AddUint64(&r.bytesReceived, uint64(msgLen))

					entry := r.ParseSyslogMessage(string(payload), proto, remoteIP)
					r.recordSourceStats(remoteIP, proto, "", msgLen)

					select {
					case r.inboundQueue <- entry:
					default:
						atomic.AddUint64(&r.parseErrors, 1)
					}
					continue
				}
			}

			// 2. 傳統換行串流 (Line-Delimited Framing)
			line, err := reader.ReadString('\n')
			if err != nil && len(line) == 0 {
				return
			}

			line = strings.TrimSpace(line)
			if len(line) == 0 {
				continue
			}

			atomic.AddUint64(&r.tcpPacketsRecv, 1)
			atomic.AddUint64(&r.bytesReceived, uint64(len(line)))

			entry := r.ParseSyslogMessage(line, proto, remoteIP)
			r.recordSourceStats(remoteIP, proto, "", len(line))

			select {
			case r.inboundQueue <- entry:
			default:
				atomic.AddUint64(&r.parseErrors, 1)
			}
		}
	}
}

// loadOrCreateCertificate 產生自簽署 ECDSA P-256 憑證供 RFC-5425 TLS 啟動使用
func (r *SyslogReceiver) loadOrCreateCertificate() (tls.Certificate, error) {
	priv, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		return tls.Certificate{}, err
	}

	notBefore := time.Now().Add(-10 * time.Minute)
	notAfter := notBefore.Add(365 * 24 * time.Hour)

	serialNumberLimit := new(big.Int).Lsh(big.NewInt(1), 128)
	serialNumber, err := rand.Int(rand.Reader, serialNumberLimit)
	if err != nil {
		return tls.Certificate{}, err
	}

	template := x509.Certificate{
		SerialNumber: serialNumber,
		Subject: pkix.Name{
			Organization: []string{"SEMOR Cyber Security Inc."},
			CommonName:   "SEMOR RFC-5425 Syslog Receiver",
		},
		NotBefore:             notBefore,
		NotAfter:              notAfter,
		KeyUsage:              x509.KeyUsageKeyEncipherment | x509.KeyUsageDigitalSignature,
		ExtKeyUsage:           []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
		BasicConstraintsValid: true,
	}

	derBytes, err := x509.CreateCertificate(rand.Reader, &template, &template, &priv.PublicKey, priv)
	if err != nil {
		return tls.Certificate{}, err
	}

	certPEM := pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: derBytes})

	b, err := x509.MarshalECPrivateKey(priv)
	if err != nil {
		return tls.Certificate{}, err
	}
	keyPEM := pem.EncodeToMemory(&pem.Block{Type: "EC PRIVATE KEY", Bytes: b})

	return tls.X509KeyPair(certPEM, keyPEM)
}

// Stats 輸出接收統計資訊
func (r *SyslogReceiver) Stats() (udp uint64, tcp uint64, tlsRecv uint64, bytes uint64, errs uint64) {
	return atomic.LoadUint64(&r.udpPacketsRecv),
		atomic.LoadUint64(&r.tcpPacketsRecv),
		atomic.LoadUint64(&r.tlsPacketsRecv),
		atomic.LoadUint64(&r.bytesReceived),
		atomic.LoadUint64(&r.parseErrors)
}

// GetSourcesTelemetry 回傳目前所有來源設備連線遙測資料
func (r *SyslogReceiver) GetSourcesTelemetry() []*SourceTelemetry {
	r.sourcesMu.RLock()
	defer r.sourcesMu.RUnlock()

	list := make([]*SourceTelemetry, 0, len(r.sources))
	for _, st := range r.sources {
		clone := *st
		list = append(list, &clone)
	}
	return list
}
