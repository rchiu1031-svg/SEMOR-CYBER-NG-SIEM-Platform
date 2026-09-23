package pipeline

import (
	"encoding/json"
	"net"
	"regexp"
	"strings"
	"sync"
	"sync/atomic"
	"time"
)

// LogEntry 代表單筆進線日誌
type LogEntry struct {
	Timestamp int64                  `json:"timestamp"` // Unix timestamp in nanoseconds
	RawMsg    string                 `json:"raw_msg"`
	Fields    map[string]interface{} `json:"fields,omitempty"`
}

// LogBatch 代表傳送給 Rust 儲存核心的批次資料塊前導結構
type LogBatch struct {
	StreamID     uint64            `json:"stream_id"`
	StreamLabels map[string]string `json:"stream_labels"`
	Entries      []LogEntry        `json:"entries"`
}

// DecoderField 定義來自前端 UI 解碼器的欄位規則
type DecoderField struct {
	Name       string `json:"name"`
	RegexStr   string `json:"regex"`
	Type       string `json:"type"`
	ECSMapping string `json:"ecsMapping"`
}

// CompiledDecoderRule 編譯後之解碼器快取
type CompiledDecoderRule struct {
	Name   string
	Regex  *regexp.Regexp
	Type   string
	ECSKey string
}

// PipelineProcessor 管理動態解碼規則與處理管線
type PipelineProcessor struct {
	mu           sync.RWMutex
	decoders     map[string][]CompiledDecoderRule
	totalParsed  uint64
	totalDropped uint64
	parseErrors  uint64
}

func NewPipelineProcessor() *PipelineProcessor {
	return &PipelineProcessor{
		decoders: make(map[string][]CompiledDecoderRule),
	}
}

// RegisterOrUpdateDecoder 接受由前端 UI 下發之熱更新規則
func (p *PipelineProcessor) RegisterOrUpdateDecoder(decoderID string, rawRules []byte) error {
	var fields []DecoderField
	if err := json.Unmarshal(rawRules, &fields); err != nil {
		return err
	}

	compiled := make([]CompiledDecoderRule, 0, len(fields))
	for _, f := range fields {
		if f.RegexStr == "" {
			continue
		}
		re, err := regexp.Compile(f.RegexStr)
		if err != nil {
			continue // 容錯跳過語法無效正則
		}
		compiled = append(compiled, CompiledDecoderRule{
			Name:   f.Name,
			Regex:  re,
			Type:   f.Type,
			ECSKey: f.ECSMapping,
		})
	}

	p.mu.Lock()
	p.decoders[decoderID] = compiled
	p.mu.Unlock()

	return nil
}

// ProcessAndExtract 針對原始日誌執行規則匹配，提取結構化欄位並標準化 ECS
func (p *PipelineProcessor) ProcessAndExtract(rawMsg string, activeDecoderID string) LogEntry {
	atomic.AddUint64(&p.totalParsed, 1)

	now := time.Now().UnixNano()
	entry := LogEntry{
		Timestamp: now,
		RawMsg:    rawMsg,
		Fields:    make(map[string]interface{}),
	}

	// 1. 若為 JSON 格式日誌，先行解構
	trimmed := strings.TrimSpace(rawMsg)
	if strings.HasPrefix(trimmed, "{") && strings.HasSuffix(trimmed, "}") {
		var jsonMap map[string]interface{}
		if err := json.Unmarshal([]byte(trimmed), &jsonMap); err == nil {
			for k, v := range jsonMap {
				entry.Fields[k] = v
			}
		}
	}

	// 2. 套用目前生產生效之解碼器正則規則
	p.mu.RLock()
	rules, exists := p.decoders[activeDecoderID]
	p.mu.RUnlock()

	if exists && len(rules) > 0 {
		for _, rule := range rules {
			matches := rule.Regex.FindStringSubmatch(rawMsg)
			if len(matches) > 1 {
				val := matches[1]
				entry.Fields[rule.Name] = val
				if rule.ECSKey != "" {
					entry.Fields[rule.ECSKey] = val
				}
			} else if len(matches) == 1 {
				val := matches[0]
				entry.Fields[rule.Name] = val
			}
		}
	}

	// 3. 欄位補強與標準化 (IP 屬性分析、嚴重度歸一化)
	p.enrichAndNormalize(&entry)

	return entry
}

// enrichAndNormalize 規範化 IP 地址類型、嚴重等級與事件類別
func (p *PipelineProcessor) enrichAndNormalize(entry *LogEntry) {
	fields := entry.Fields

	// 1. IP 屬性富化 (區分內部網段與境外/公開 IP)
	if srcIPVal, ok := fields["src_ip"]; ok {
		if ipStr, ok := srcIPVal.(string); ok {
			fields["src_ip_is_private"] = isPrivateIP(ipStr)
		}
	}
	if dstIPVal, ok := fields["dst_ip"]; ok {
		if ipStr, ok := dstIPVal.(string); ok {
			fields["dst_ip_is_private"] = isPrivateIP(ipStr)
		}
	}

	// 2. 嚴重度等級歸一化 (Unified Severity: Critical, High, Medium, Low, Informational)
	if sevVal, ok := fields["severity"]; ok {
		sevStr := strings.ToUpper(strings.TrimSpace(sevVal.(string)))
		switch {
		case strings.Contains(sevStr, "CRIT") || strings.Contains(sevStr, "EMERG") || strings.Contains(sevStr, "ALERT"):
			fields["severity_unified"] = "Critical"
			fields["severity_level"] = 5
		case strings.Contains(sevStr, "ERR") || strings.Contains(sevStr, "HIGH"):
			fields["severity_unified"] = "High"
			fields["severity_level"] = 4
		case strings.Contains(sevStr, "WARN") || strings.Contains(sevStr, "MED"):
			fields["severity_unified"] = "Medium"
			fields["severity_level"] = 3
		case strings.Contains(sevStr, "NOTICE") || strings.Contains(sevStr, "LOW"):
			fields["severity_unified"] = "Low"
			fields["severity_level"] = 2
		default:
			fields["severity_unified"] = "Informational"
			fields["severity_level"] = 1
		}
	} else {
		fields["severity_unified"] = "Informational"
		fields["severity_level"] = 1
	}

	// 3. 規範化 action
	if actVal, ok := fields["action"]; ok {
		actStr := strings.ToLower(strings.TrimSpace(actVal.(string)))
		switch actStr {
		case "drop", "deny", "block", "rejected", "blocked", "discard":
			fields["action_normalized"] = "blocked"
		case "allow", "permit", "pass", "accepted", "allowed":
			fields["action_normalized"] = "allowed"
		default:
			fields["action_normalized"] = actStr
		}
	}
}

// isPrivateIP 檢查是否為 RFC 1918 私有 IP (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 127.0.0.1)
func isPrivateIP(ipStr string) bool {
	ip := net.ParseIP(ipStr)
	if ip == nil {
		return false
	}
	return ip.IsPrivate() || ip.IsLoopback()
}

// Stats 輸出管線處理統計資訊
func (p *PipelineProcessor) Stats() (parsed uint64, dropped uint64, errs uint64) {
	return atomic.LoadUint64(&p.totalParsed),
		atomic.LoadUint64(&p.totalDropped),
		atomic.LoadUint64(&p.parseErrors)
}
