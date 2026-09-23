package pipeline

import (
	"fmt"
	"hash/fnv"
	"sort"
	"strings"
	"sync"
	"time"
)

// StreamID 代表依據 VictoriaLogs 設計模式生成的 64-bit 唯一串流雜湊標識
type StreamID uint64

// StreamLabels 包含一組低基數 (Low-Cardinality) 的串流標籤
// 例如: { "env": "production", "host": "fortigate-core-01", "app": "syslog", "stream": "firewall" }
type StreamLabels map[string]string

// CanonicalString 產生規範化的標籤字串，確保相同鍵值對必定產生相同字串
func (sl StreamLabels) CanonicalString() string {
	keys := make([]string, 0, len(sl))
	for k := range sl {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	var sb strings.Builder
	sb.WriteString("{")
	for i, k := range keys {
		if i > 0 {
			sb.WriteString(",")
		}
		sb.WriteString(fmt.Sprintf("%s=%q", k, sl[k]))
	}
	sb.WriteString("}")
	return sb.String()
}

// ComputeStreamID 採用 FNV-1a 64-bit 演算法對規範化標籤計算 StreamID
func ComputeStreamID(labels StreamLabels) StreamID {
	canonical := labels.CanonicalString()
	h := fnv.New64a()
	_, _ = h.Write([]byte(canonical))
	return StreamID(h.Sum64())
}

// StreamMetadata 紀錄串流的註冊資訊與統計
type StreamMetadata struct {
	ID          StreamID          `json:"stream_id"`
	Labels      StreamLabels      `json:"labels"`
	Canonical   string            `json:"canonical"`
	CreatedAt   time.Time         `json:"created_at"`
	TotalRows   uint64            `json:"total_rows"`
	TotalBytes  uint64            `json:"total_bytes"`
	TotalBlocks uint32            `json:"total_blocks"`
	LastSeen    time.Time         `json:"last_seen"`
}

// StreamManager 管理所有活動串流，遵循 VictoriaLogs 的 Stream Partitioning 設計模式
type StreamManager struct {
	mu      sync.RWMutex
	streams map[StreamID]*StreamMetadata
}

func NewStreamManager() *StreamManager {
	sm := &StreamManager{
		streams: make(map[StreamID]*StreamMetadata),
	}
	sm.initDefaultStreams()
	return sm
}

// initDefaultStreams 預載資安營運典型日誌串流
func (sm *StreamManager) initDefaultStreams() {
	defaultStreams := []StreamLabels{
		{"stream": "firewall", "vendor": "fortinet", "env": "prod"},
		{"stream": "security_events", "vendor": "active_directory", "env": "prod"},
		{"stream": "edr", "vendor": "crowdstrike", "env": "prod"},
		{"stream": "ids", "vendor": "suricata", "env": "prod"},
		{"stream": "web", "vendor": "nginx_waf", "env": "prod"},
		{"stream": "syslog", "vendor": "generic", "env": "prod"},
	}

	for _, labels := range defaultStreams {
		sm.GetOrCreateStream(labels)
	}
}

// GetOrCreateStream 取得或動態註冊日誌串流
func (sm *StreamManager) GetOrCreateStream(labels StreamLabels) *StreamMetadata {
	id := ComputeStreamID(labels)

	sm.mu.RLock()
	existing, ok := sm.streams[id]
	sm.mu.RUnlock()
	if ok {
		return existing
	}

	sm.mu.Lock()
	defer sm.mu.Unlock()

	// Double-check
	if existing, ok := sm.streams[id]; ok {
		return existing
	}

	meta := &StreamMetadata{
		ID:        id,
		Labels:    labels,
		Canonical: labels.CanonicalString(),
		CreatedAt: time.Now(),
		LastSeen:  time.Now(),
	}
	sm.streams[id] = meta
	return meta
}

// ExtractStreamLabelsFromLog 依據日誌內容與傳輸標頭推導適合的 VictoriaLogs 串流標籤
func ExtractStreamLabelsFromLog(rawLog string, sourceHost string, protocol string) StreamLabels {
	labels := StreamLabels{
		"env":  "production",
		"host": "unknown",
	}

	if sourceHost != "" {
		labels["host"] = strings.ToLower(sourceHost)
	}

	rawLower := strings.ToLower(rawLog)
	switch {
	case strings.Contains(rawLower, "fortigate") || strings.Contains(rawLower, "fgt") || strings.Contains(rawLower, "firewall"):
		labels["stream"] = "firewall"
		labels["vendor"] = "fortinet"
	case strings.Contains(rawLower, "palo alto") || strings.Contains(rawLower, "pan-os"):
		labels["stream"] = "firewall"
		labels["vendor"] = "paloalto"
	case strings.Contains(rawLower, "active directory") || strings.Contains(rawLower, "kerberos") || strings.Contains(rawLower, "4625") || strings.Contains(rawLower, "lsass"):
		labels["stream"] = "security_events"
		labels["vendor"] = "microsoft"
	case strings.Contains(rawLower, "crowdstrike") || strings.Contains(rawLower, "edr") || strings.Contains(rawLower, "mimikatz") || strings.Contains(rawLower, "vssadmin"):
		labels["stream"] = "edr"
		labels["vendor"] = "endpoint_security"
	case strings.Contains(rawLower, "suricata") || strings.Contains(rawLower, "ids") || strings.Contains(rawLower, "et scan"):
		labels["stream"] = "ids"
		labels["vendor"] = "suricata"
	case strings.Contains(rawLower, "nginx") || strings.Contains(rawLower, "waf") || strings.Contains(rawLower, "http"):
		labels["stream"] = "web"
		labels["vendor"] = "web_ingress"
	default:
		labels["stream"] = "syslog"
		labels["vendor"] = "generic"
	}

	if protocol != "" {
		labels["protocol"] = protocol
	}

	return labels
}

// ListStreams 列出所有已註冊的串流清單
func (sm *StreamManager) ListStreams() []*StreamMetadata {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	result := make([]*StreamMetadata, 0, len(sm.streams))
	for _, s := range sm.streams {
		result = append(result, s)
	}
	return result
}
