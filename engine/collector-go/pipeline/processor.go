package pipeline

import (
	"encoding/json"
	"regexp"
	"sync"
	"time"
)

// LogEntry 代表單筆進線日誌
type LogEntry struct {
	Timestamp int64                  `json:"timestamp"` // Unix timestamp in milliseconds
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

// ProcessAndExtract 針對原始日誌執行規則匹配，提取結構化欄位
func (p *PipelineProcessor) ProcessAndExtract(rawMsg string, activeDecoderID string) LogEntry {
	p.mu.RLock()
	rules, exists := p.decoders[activeDecoderID]
	p.mu.RUnlock()

	now := time.Now().UnixMilli()
	entry := LogEntry{
		Timestamp: now,
		RawMsg:    rawMsg,
		Fields:    make(map[string]interface{}),
	}

	if !exists || len(rules) == 0 {
		return entry
	}

	for _, rule := range rules {
		matches := rule.Regex.FindStringSubmatch(rawMsg)
		if len(matches) > 1 {
			// 若有 capture group 優先取 group 1
			entry.Fields[rule.Name] = matches[1]
			if rule.ECSKey != "" {
				entry.Fields[rule.ECSKey] = matches[1]
			}
		} else if len(matches) == 1 {
			entry.Fields[rule.Name] = matches[0]
		}
	}

	return entry
}
