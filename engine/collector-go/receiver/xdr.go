package receiver

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/semor-cyber/semor-collector/config"
	"github.com/semor-cyber/semor-collector/pipeline"
)

// ============================================================================
// XDR (Extended Detection and Response) Core Specifications:
// Ingestion Layers:
// 1. Endpoint (EDR, Windows Sysmon, Linux Auditd, osquery, CrowdStrike, Defender)
// 2. Identity (Active Directory, Kerberos, Azure AD, Linux PAM, Okta)
// 3. Cloud / Workload (Kubernetes Audit, AWS CloudTrail, GCP Audit Logs)
// 4. Perimeter & Security Controls (WAF, NGFW, IPS, DLP)
// Features: MITRE ATT&CK Tagging, Asset/User Normalization, Process Lineage Tracking
// ============================================================================

// XDRTelemetryLayer defines the ingestion source layer
type XDRTelemetryLayer string

const (
	LayerEndpoint  XDRTelemetryLayer = "endpoint"
	LayerIdentity  XDRTelemetryLayer = "identity"
	LayerCloud     XDRTelemetryLayer = "cloud"
	LayerNetwork   XDRTelemetryLayer = "network"
	LayerPerimeter XDRTelemetryLayer = "perimeter"
)

// XDREventRecord represents a normalized cross-layer security event
type XDREventRecord struct {
	TimestampNano int64             `json:"timestamp_nano"`
	EventID       string            `json:"event_id"`
	Layer         XDRTelemetryLayer `json:"layer"`
	SensorID      string            `json:"sensor_id"`
	Hostname      string            `json:"hostname"`
	HostIP        string            `json:"host_ip"`
	Username      string            `json:"username,omitempty"`
	UserDomain    string            `json:"user_domain,omitempty"`

	// Process Execution details (EDR / Sysmon Event ID 1)
	ProcessName       string `json:"process_name,omitempty"`
	ProcessPath       string `json:"process_path,omitempty"`
	ProcessPID        uint32 `json:"process_pid,omitempty"`
	ProcessParentName string `json:"process_parent_name,omitempty"`
	ProcessParentPID  uint32 `json:"process_parent_pid,omitempty"`
	CommandLine       string `json:"command_line,omitempty"`
	FileHashSHA256    string `json:"file_hash_sha256,omitempty"`

	// Identity details (Logon / Auth events)
	LogonType        int    `json:"logon_type,omitempty"`
	AuthStatus       string `json:"auth_status,omitempty"` // "SUCCESS", "FAILURE"
	TargetService    string `json:"target_service,omitempty"`
	KerberosTicketID string `json:"kerberos_ticket_id,omitempty"`

	// Network correlation
	DstIP   string `json:"dst_ip,omitempty"`
	DstPort uint16 `json:"dst_port,omitempty"`

	// MITRE ATT&CK Classification
	MitreTactic    string `json:"mitre_tactic,omitempty"`
	MitreTechnique string `json:"mitre_technique,omitempty"`
	Severity       string `json:"severity"` // "Critical", "High", "Medium", "Low", "Info"
	Confidence     uint8  `json:"confidence"`
	ThreatTitle    string `json:"threat_title,omitempty"`
	ThreatDesc     string `json:"threat_desc,omitempty"`
	ActionTaken    string `json:"action_taken"` // "Alerted", "Blocked", "Quarantined", "Observed"

	RawEvent string            `json:"raw_event,omitempty"`
	Labels   map[string]string `json:"labels,omitempty"`
}

// XDRReceiver manages ingestion across Endpoint, Identity, Cloud, and Perimeter layers
type XDRReceiver struct {
	cfg          *config.Config
	inboundQueue chan<- pipeline.LogEntry

	// Telemetry Counters (Atomic)
	endpointEventsRecv  uint64
	identityEventsRecv  uint64
	cloudEventsRecv     uint64
	perimeterEventsRecv uint64
	totalBytesRecv      uint64
	criticalAlertsCount uint64
	correlationsTriggered uint64
	parseErrors         uint64

	// Deduplication cache
	eventMu   sync.RWMutex
	eventKeys map[string]time.Time
}

func NewXDRReceiver(cfg *config.Config, inbound chan<- pipeline.LogEntry) *XDRReceiver {
	return &XDRReceiver{
		cfg:          cfg,
		inboundQueue: inbound,
		eventKeys:    make(map[string]time.Time, 10000),
	}
}

// IngestEndpointEvent 处理端點 EDR / Sysmon / osquery 事件
func (xdr *XDRReceiver) IngestEndpointEvent(payload []byte) error {
	var raw map[string]interface{}
	if err := json.Unmarshal(payload, &raw); err != nil {
		atomic.AddUint64(&xdr.parseErrors, 1)
		return err
	}

	atomic.AddUint64(&xdr.endpointEventsRecv, 1)
	atomic.AddUint64(&xdr.totalBytesRecv, uint64(len(payload)))

	nowNano := time.Now().UnixNano()
	hostname := getString(raw, "hostname", "host.name", "computer_name")
	if hostname == "" {
		hostname = "ENDPOINT-WORKSTATION"
	}
	hostIP := getString(raw, "host_ip", "host.ip", "ip")
	username := getString(raw, "username", "user.name", "user")
	procName := getString(raw, "process_name", "process.name", "image")
	cmdLine := getString(raw, "command_line", "process.command_line", "cmdline")
	parentName := getString(raw, "process_parent_name", "process.parent.name", "parent_image")
	sha256Hash := getString(raw, "file_hash_sha256", "process.hash.sha256", "sha256")

	// 啟發式 MITRE ATT&CK 端點技術關聯
	tactic := ""
	technique := ""
	severity := "Info"
	threatTitle := ""
	threatDesc := ""
	action := "Observed"
	confidence := uint8(50)

	lowerCmd := strings.ToLower(cmdLine)
	lowerProc := strings.ToLower(procName)

	if strings.Contains(lowerCmd, "mimikatz") || strings.Contains(lowerCmd, "sekurlsa") || strings.Contains(lowerCmd, "lsass") {
		tactic = "Credential Access"
		technique = "T1003.001 LSASS Memory"
		severity = "Critical"
		threatTitle = "記憶體認證憑證竊取攻擊 (Mimikatz / LSASS Access)"
		threatDesc = fmt.Sprintf("主機 %s (%s) 偵測到可疑程序嘗試讀取 LSASS 記憶體憑證", hostname, hostIP)
		action = "Blocked"
		confidence = 98
		atomic.AddUint64(&xdr.criticalAlertsCount, 1)
	} else if strings.Contains(lowerCmd, "vssadmin delete shadows") || strings.Contains(lowerCmd, "wbadmin delete catalog") {
		tactic = "Impact"
		technique = "T1490 Inhibit System Recovery"
		severity = "Critical"
		threatTitle = "勒索軟體暗殺磁碟陰影複製 (Ransomware Shadow Copy Deletion)"
		threatDesc = fmt.Sprintf("主機 %s 執行指令清空系統還原點與卷影備份", hostname)
		action = "Quarantined"
		confidence = 99
		atomic.AddUint64(&xdr.criticalAlertsCount, 1)
	} else if strings.Contains(lowerCmd, "powershell -enc") || strings.Contains(lowerCmd, "powershell -encodedcommand") {
		tactic = "Execution"
		technique = "T1059.001 PowerShell"
		severity = "High"
		threatTitle = "混淆 Base64 PowerShell 惡意腳本執行"
		threatDesc = fmt.Sprintf("主機 %s 透過父程序 %s 調用混淆編碼腳本", hostname, parentName)
		action = "Alerted"
		confidence = 88
	} else if strings.Contains(lowerProc, "certutil.exe") && strings.Contains(lowerCmd, "-urlcache") {
		tactic = "Defense Evasion"
		technique = "T1105 Ingress Tool Transfer"
		severity = "High"
		threatTitle = "利用原生白名單工具下載外掛 (LOLBAS Certutil Download)"
		action = "Alerted"
		confidence = 85
	}

	event := XDREventRecord{
		TimestampNano:     nowNano,
		EventID:           generateEventID(payload),
		Layer:             LayerEndpoint,
		SensorID:          "edr-agent-01",
		Hostname:          hostname,
		HostIP:            hostIP,
		Username:          username,
		ProcessName:       procName,
		ProcessPID:        uint32(getInt(raw, "process_pid", "process.pid", "pid")),
		ProcessParentName: parentName,
		CommandLine:       cmdLine,
		FileHashSHA256:    sha256Hash,
		MitreTactic:       tactic,
		MitreTechnique:    technique,
		Severity:          severity,
		Confidence:        confidence,
		ThreatTitle:       threatTitle,
		ThreatDesc:        threatDesc,
		ActionTaken:       action,
		RawEvent:          string(payload),
		Labels: map[string]string{
			"source":    "xdr",
			"layer":     "endpoint",
			"host":      hostname,
			"technique": technique,
		},
	}

	xdr.dispatchXDREvent(event)
	return nil
}

// IngestIdentityEvent 处理身分與認證事件 (Active Directory / Kerberos / Okta)
func (xdr *XDRReceiver) IngestIdentityEvent(payload []byte) error {
	var raw map[string]interface{}
	if err := json.Unmarshal(payload, &raw); err != nil {
		atomic.AddUint64(&xdr.parseErrors, 1)
		return err
	}

	atomic.AddUint64(&xdr.identityEventsRecv, 1)
	atomic.AddUint64(&xdr.totalBytesRecv, uint64(len(payload)))

	nowNano := time.Now().UnixNano()
	username := getString(raw, "username", "user.name", "target_user_name")
	userDomain := getString(raw, "domain", "user.domain", "target_domain_name")
	srcIP := getString(raw, "src_ip", "source.ip", "ip")
	logonType := getInt(raw, "logon_type", "winlog.event_data.LogonType")
	status := getString(raw, "status", "auth_status")
	if status == "" {
		status = "SUCCESS"
	}

	severity := "Info"
	tactic := ""
	technique := ""
	threatTitle := ""
	threatDesc := ""
	action := "Observed"
	confidence := uint8(60)

	// 檢測 Kerberoasting 請求高危險 SPN Ticket
	ticketOptions := getString(raw, "ticket_options", "ticket_encryption_type")
	if strings.Contains(ticketOptions, "0x17") || strings.Contains(strings.ToLower(ticketOptions), "rc4") {
		tactic = "Credential Access"
		technique = "T1558.003 Kerberoasting"
		severity = "High"
		threatTitle = "弱 RC4 雜湊 Kerberos 服務票證請求 (Kerberoasting)"
		threatDesc = fmt.Sprintf("帳號 %s 請求弱密鑰 SPN 票證，疑用於離線離散字典破解", username)
		action = "Alerted"
		confidence = 90
		atomic.AddUint64(&xdr.criticalAlertsCount, 1)
	}

	// 檢測多次登入失敗 (Brute Force / Password Spraying)
	failCount := getInt(raw, "failure_count", "attempts")
	if failCount >= 10 {
		tactic = "Credential Access"
		technique = "T1110.003 Password Spraying"
		severity = "High"
		threatTitle = "跨帳號分散式密碼噴灑碰撞攻擊 (Password Spray)"
		threatDesc = fmt.Sprintf("來源 IP %s 連續失敗嘗試超過 %d 次認證", srcIP, failCount)
		action = "Blocked"
		confidence = 92
	}

	event := XDREventRecord{
		TimestampNano:  nowNano,
		EventID:        generateEventID(payload),
		Layer:          LayerIdentity,
		SensorID:       "ad-identity-sensor",
		Hostname:       userDomain,
		HostIP:         srcIP,
		Username:       username,
		UserDomain:     userDomain,
		LogonType:      logonType,
		AuthStatus:     status,
		TargetService:  getString(raw, "service_name", "target_service"),
		MitreTactic:    tactic,
		MitreTechnique: technique,
		Severity:       severity,
		Confidence:     confidence,
		ThreatTitle:    threatTitle,
		ThreatDesc:     threatDesc,
		ActionTaken:    action,
		RawEvent:       string(payload),
		Labels: map[string]string{
			"source": "xdr",
			"layer":  "identity",
			"user":   username,
		},
	}

	xdr.dispatchXDREvent(event)
	return nil
}

// IngestCloudEvent 处理雲原生與容器稽核日誌 (K8s Audit / AWS CloudTrail)
func (xdr *XDRReceiver) IngestCloudEvent(payload []byte) error {
	var raw map[string]interface{}
	if err := json.Unmarshal(payload, &raw); err != nil {
		atomic.AddUint64(&xdr.parseErrors, 1)
		return err
	}

	atomic.AddUint64(&xdr.cloudEventsRecv, 1)
	atomic.AddUint64(&xdr.totalBytesRecv, uint64(len(payload)))

	nowNano := time.Now().UnixNano()
	namespace := getString(raw, "namespace", "k8s.namespace.name")
	podName := getString(raw, "pod", "k8s.pod.name")
	verb := getString(raw, "verb", "event.action")
	user := getString(raw, "user", "user.name")

	severity := "Info"
	tactic := ""
	technique := ""
	threatTitle := ""
	threatDesc := ""
	action := "Observed"
	confidence := uint8(60)

	// 檢測危險 Pod 容器提權 (Privileged Pod Creation)
	if (verb == "create" || verb == "update") && strings.Contains(string(payload), "\"privileged\":true") {
		tactic = "Privilege Escalation"
		technique = "T1611 Escape to Host"
		severity = "Critical"
		threatTitle = "建立具備主機特權容器 (Privileged Container Escape Attempt)"
		threatDesc = fmt.Sprintf("使用者 %s 在命名空間 %s 中請求建立 privileged=true 特權容器 %s", user, namespace, podName)
		action = "Blocked"
		confidence = 96
		atomic.AddUint64(&xdr.criticalAlertsCount, 1)
	}

	event := XDREventRecord{
		TimestampNano:  nowNano,
		EventID:        generateEventID(payload),
		Layer:          LayerCloud,
		SensorID:       "k8s-audit-sensor-prod",
		Hostname:       podName,
		Username:       user,
		TargetService:  namespace,
		MitreTactic:    tactic,
		MitreTechnique: technique,
		Severity:       severity,
		Confidence:     confidence,
		ThreatTitle:    threatTitle,
		ThreatDesc:     threatDesc,
		ActionTaken:    action,
		RawEvent:       string(payload),
		Labels: map[string]string{
			"source":    "xdr",
			"layer":     "cloud",
			"namespace": namespace,
		},
	}

	xdr.dispatchXDREvent(event)
	return nil
}

// IngestPerimeterEvent 處理邊界與網路安全控制設備事件 (NGFW / WAF / VPN / IPS / Proxy)
func (xdr *XDRReceiver) IngestPerimeterEvent(payload []byte) error {
	var raw map[string]interface{}
	if err := json.Unmarshal(payload, &raw); err != nil {
		atomic.AddUint64(&xdr.parseErrors, 1)
		return err
	}

	atomic.AddUint64(&xdr.perimeterEventsRecv, 1)
	atomic.AddUint64(&xdr.totalBytesRecv, uint64(len(payload)))

	nowNano := time.Now().UnixNano()
	srcIP := getString(raw, "src_ip", "source_ip", "client_ip")
	dstIP := getString(raw, "dst_ip", "dest_ip", "destination_ip")
	dstPort := uint16(getInt(raw, "dst_port", "dest_port", "port"))
	action := getString(raw, "action", "status")
	vendor := getString(raw, "vendor", "device_vendor")
	threatName := getString(raw, "threat_name", "attack", "signature")

	severity := "Info"
	tactic := ""
	technique := ""
	threatTitle := ""
	threatDesc := ""
	actionTaken := "Observed"
	confidence := uint8(65)

	lowerPayload := strings.ToLower(string(payload))
	if strings.Contains(lowerPayload, "sql injection") || strings.Contains(lowerPayload, "sqli") || strings.Contains(lowerPayload, "union select") {
		tactic = "Initial Access"
		technique = "T1190 Exploit Public-Facing Application"
		severity = "Critical"
		threatTitle = "邊界 WAF 攔截 SQL 注入滲透 (SQL Injection Exploit)"
		threatDesc = fmt.Sprintf("來自 %s 攻擊來源針對 %s:%d 嘗試執行 SQL 注入資料庫探測", srcIP, dstIP, dstPort)
		actionTaken = "Blocked"
		confidence = 95
		atomic.AddUint64(&xdr.criticalAlertsCount, 1)
	} else if strings.Contains(lowerPayload, "log4j") || strings.Contains(lowerPayload, "jndi:ldap") {
		tactic = "Initial Access"
		technique = "T1190 Exploit Public-Facing Application"
		severity = "Critical"
		threatTitle = "Log4Shell 遠端程式碼執行攻擊 (CVE-2021-44228 JNDI RCE)"
		threatDesc = fmt.Sprintf("邊界 NGFW 阻斷來自 %s 針對內部服務之 JNDI 反向注入", srcIP)
		actionTaken = "Blocked"
		confidence = 99
		atomic.AddUint64(&xdr.criticalAlertsCount, 1)
	} else if strings.Contains(lowerPayload, "vpn brute force") || strings.Contains(lowerPayload, "failed vpn login") {
		tactic = "Credential Access"
		technique = "T1110 Brute Force"
		severity = "High"
		threatTitle = "SSL-VPN 外網閘道暴力猜解碰撞攻擊"
		threatDesc = fmt.Sprintf("邊界 VPN 閘道偵測到來自 %s 之頻繁認證失誤", srcIP)
		actionTaken = "Alerted"
		confidence = 88
	}

	event := XDREventRecord{
		TimestampNano:  nowNano,
		EventID:        generateEventID(payload),
		Layer:          LayerPerimeter,
		SensorID:       fmt.Sprintf("%s-perimeter-gw", vendor),
		Hostname:       "BORDER-GATEWAY-FIREWALL",
		HostIP:         srcIP,
		DstIP:          dstIP,
		DstPort:        dstPort,
		MitreTactic:    tactic,
		MitreTechnique: technique,
		Severity:       severity,
		Confidence:     confidence,
		ThreatTitle:    threatTitle,
		ThreatDesc:     threatDesc,
		ActionTaken:    actionTaken,
		RawEvent:       string(payload),
		Labels: map[string]string{
			"source": "xdr",
			"layer":  "perimeter",
			"action": action,
		},
	}

	xdr.dispatchXDREvent(event)
	return nil
}

// IngestDeceptionEvent 處理密罐誘捕 (Honeypot Deception Grid) 誘捕互動事件
func (xdr *XDRReceiver) IngestDeceptionEvent(payload []byte) error {
	var raw map[string]interface{}
	if err := json.Unmarshal(payload, &raw); err != nil {
		atomic.AddUint64(&xdr.parseErrors, 1)
		return err
	}

	atomic.AddUint64(&xdr.perimeterEventsRecv, 1)
	atomic.AddUint64(&xdr.criticalAlertsCount, 1)
	atomic.AddUint64(&xdr.totalBytesRecv, uint64(len(payload)))

	nowNano := time.Now().UnixNano()
	decoyName := getString(raw, "decoy_name", "name")
	decoyType := getString(raw, "decoy_type", "type")
	attackerIP := getString(raw, "attacker_ip", "src_ip")
	capturedCred := getString(raw, "credentials", "username")

	event := XDREventRecord{
		TimestampNano:  nowNano,
		EventID:        generateEventID(payload),
		Layer:          LayerPerimeter,
		SensorID:       "deception-honeygrid-sensor",
		Hostname:       decoyName,
		HostIP:         attackerIP,
		Username:       capturedCred,
		MitreTactic:    "Lateral Movement",
		MitreTechnique: "T1021 Remote Services (Deception Triggered)",
		Severity:       "Critical",
		Confidence:     100, // 蜜罐互動可信度為 100% 絕對確定
		ThreatTitle:    fmt.Sprintf("主動防禦蜜罐誘捕警報: %s (%s)", decoyName, decoyType),
		ThreatDesc:     fmt.Sprintf("攻擊者 %s 觸碰並嘗試登入誘捕節點 %s，已擷取誘餌憑證", attackerIP, decoyName),
		ActionTaken:    "Quarantined",
		RawEvent:       string(payload),
		Labels: map[string]string{
			"source":     "honeypot",
			"deception":  "true",
			"decoy_type": decoyType,
		},
	}

	xdr.dispatchXDREvent(event)
	return nil
}

// dispatchXDREvent 將 XDR 事件標準化打包送入核心佇列
func (xdr *XDRReceiver) dispatchXDREvent(event XDREventRecord) {
	eventJSON, err := json.Marshal(event)
	if err != nil {
		return
	}

	entry := pipeline.LogEntry{
		Timestamp: event.TimestampNano,
		RawMsg:    string(eventJSON),
		Fields: map[string]interface{}{
			"source":          "xdr",
			"telemetry_type":  "xdr_event",
			"layer":           string(event.Layer),
			"hostname":        event.Hostname,
			"username":        event.Username,
			"severity":        event.Severity,
			"mitre_tactic":    event.MitreTactic,
			"mitre_technique": event.MitreTechnique,
			"threat_title":    event.ThreatTitle,
			"action_taken":    event.ActionTaken,
		},
	}

	select {
	case xdr.inboundQueue <- entry:
	default:
		atomic.AddUint64(&xdr.parseErrors, 1)
	}
}

// Telemetry 輸出 XDR 收集即時指標
func (xdr *XDRReceiver) Telemetry() map[string]interface{} {
	return map[string]interface{}{
		"endpoint_events":        atomic.LoadUint64(&xdr.endpointEventsRecv),
		"identity_events":        atomic.LoadUint64(&xdr.identityEventsRecv),
		"cloud_events":           atomic.LoadUint64(&xdr.cloudEventsRecv),
		"perimeter_events":       atomic.LoadUint64(&xdr.perimeterEventsRecv),
		"total_bytes_mb":         float64(atomic.LoadUint64(&xdr.totalBytesRecv)) / (1024 * 1024),
		"critical_alerts":        atomic.LoadUint64(&xdr.criticalAlertsCount),
		"correlations_triggered": atomic.LoadUint64(&xdr.correlationsTriggered),
		"parse_errors":           atomic.LoadUint64(&xdr.parseErrors),
	}
}

// ============================================================================
// Internal Helper Utilities
// ============================================================================

func getString(m map[string]interface{}, keys ...string) string {
	for _, k := range keys {
		if v, ok := m[k]; ok {
			if s, ok := v.(string); ok && s != "" {
				return s
			}
		}
	}
	return ""
}

func getInt(m map[string]interface{}, keys ...string) int {
	for _, k := range keys {
		if v, ok := m[k]; ok {
			switch num := v.(type) {
			case float64:
				return int(num)
			case int:
				return num
			case int64:
				return int(num)
			}
		}
	}
	return 0
}

func generateEventID(data []byte) string {
	sum := sha256.Sum256(data)
	return fmt.Sprintf("xdr-%s", hex.EncodeToString(sum[:8]))
}
