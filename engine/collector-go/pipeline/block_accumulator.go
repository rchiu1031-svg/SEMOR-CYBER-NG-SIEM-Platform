package pipeline

import (
	"context"
	"fmt"
	"sync"
	"sync/atomic"
	"time"
)

// VictoriaLogs 架構模式之區塊門檻常數
const (
	DefaultBlockMaxRows       = 4096                // 單個 Block 預設日誌行數
	DefaultBlockMaxBytes      = 2 * 1024 * 1024     // 單個 Block 預設未壓縮位元組上限 (2MB)
	DefaultBlockFlushInterval = 1000 * time.Millisecond // 單個 Block 最大停留逾時
)

// VictoriaBlockHeader 遵循 VictoriaLogs VBLK 二進位規範之標頭結構
type VictoriaBlockHeader struct {
	Magic            string   `json:"magic"`             // "VBLK"
	Version          uint16   `json:"version"`           // 2
	StreamID         StreamID `json:"stream_id"`
	PartID           string   `json:"part_id"`
	BlockID          uint32   `json:"block_id"`
	MinTimestamp     int64    `json:"min_timestamp"`     // 毫秒 / 奈秒
	MaxTimestamp     int64    `json:"max_timestamp"`     // 毫秒 / 奈秒
	RowsCount        uint32   `json:"rows_count"`
	UncompressedSize uint32   `json:"uncompressed_size"` // 位元組
	EstimatedCompSize uint32  `json:"estimated_comp_size"`
	BloomFilterBytes []byte   `json:"bloom_filter_bytes"`
	BloomTokensCount uint32   `json:"bloom_tokens_count"`
	CreatedAtNano    int64    `json:"created_at_nano"`
}

// VictoriaBlock 封裝完成且不可變 (Immutable) 的日誌區塊
type VictoriaBlock struct {
	Header       VictoriaBlockHeader `json:"header"`
	StreamLabels StreamLabels        `json:"stream_labels"`
	Entries      []LogEntry          `json:"entries"`
	RawPayload   []byte              `json:"raw_payload,omitempty"`
}

// StreamBlockBuffer 代表單一 Stream 在記憶體中累積中的活躍區塊緩衝區
type StreamBlockBuffer struct {
	mu                sync.Mutex
	streamID          StreamID
	labels            StreamLabels
	partID            string
	nextBlockID       uint32
	firstLogTime      time.Time
	minTimestamp      int64
	maxTimestamp      int64
	entries           []LogEntry
	uncompressedBytes uint32
	bloom             *FastTokenBloomFilter
}

func newStreamBlockBuffer(streamID StreamID, labels StreamLabels) *StreamBlockBuffer {
	now := time.Now()
	partID := fmt.Sprintf("part_%016x", now.UnixNano())
	return &StreamBlockBuffer{
		streamID:     streamID,
		labels:       labels,
		partID:       partID,
		nextBlockID:  0,
		firstLogTime: now,
		entries:      make([]LogEntry, 0, DefaultBlockMaxRows),
		bloom:        NewFastTokenBloomFilter(),
	}
}

// AppendLog 將單筆日誌寫入此 Stream 的活動緩衝區，並即時提取詞彙更新布隆過濾器
func (sbb *StreamBlockBuffer) AppendLog(entry LogEntry) bool {
	sbb.mu.Lock()
	defer sbb.mu.Unlock()

	rawLen := uint32(len(entry.RawMsg))
	if len(sbb.entries) == 0 {
		sbb.firstLogTime = time.Now()
		sbb.minTimestamp = entry.Timestamp
		sbb.maxTimestamp = entry.Timestamp
	} else {
		if entry.Timestamp < sbb.minTimestamp {
			sbb.minTimestamp = entry.Timestamp
		}
		if entry.Timestamp > sbb.maxTimestamp {
			sbb.maxTimestamp = entry.Timestamp
		}
	}

	sbb.entries = append(sbb.entries, entry)
	sbb.uncompressedBytes += rawLen

	// VictoriaLogs 設計模式：在收集入庫當下即時解構並填充布隆過濾器！
	sbb.bloom.AddTokensFromText(entry.RawMsg)

	// 檢查是否達到封塊條件
	isFull := len(sbb.entries) >= DefaultBlockMaxRows || sbb.uncompressedBytes >= DefaultBlockMaxBytes
	return isFull
}

// SealAndReset 封裝當前緩衝區為不可變 VictoriaBlock，並清空緩衝區等待新區塊
func (sbb *StreamBlockBuffer) SealAndReset() *VictoriaBlock {
	sbb.mu.Lock()
	defer sbb.mu.Unlock()

	if len(sbb.entries) == 0 {
		return nil
	}

	blockID := sbb.nextBlockID
	sbb.nextBlockID++

	rawTotal := sbb.uncompressedBytes
	estimatedComp := rawTotal / 11 // 預估 ZSTD 11x 壓縮比
	if estimatedComp < 64 {
		estimatedComp = 64
	}

	header := VictoriaBlockHeader{
		Magic:             "VBLK",
		Version:           2,
		StreamID:          sbb.streamID,
		PartID:            sbb.partID,
		BlockID:           blockID,
		MinTimestamp:      sbb.minTimestamp,
		MaxTimestamp:      sbb.maxTimestamp,
		RowsCount:         uint32(len(sbb.entries)),
		UncompressedSize:  rawTotal,
		EstimatedCompSize: estimatedComp,
		BloomFilterBytes:  sbb.bloom.Bytes(),
		BloomTokensCount:  sbb.bloom.TokensCount(),
		CreatedAtNano:     time.Now().UnixNano(),
	}

	block := &VictoriaBlock{
		Header:       header,
		StreamLabels: sbb.labels,
		Entries:      make([]LogEntry, len(sbb.entries)),
	}
	copy(block.Entries, sbb.entries)

	// 重設緩衝區
	sbb.entries = sbb.entries[:0]
	sbb.uncompressedBytes = 0
	sbb.bloom = NewFastTokenBloomFilter()
	sbb.firstLogTime = time.Now()

	return block
}

// ShouldFlushByTimeout 檢查是否超過時間視窗該強制 Seal
func (sbb *StreamBlockBuffer) ShouldFlushByTimeout(timeout time.Duration) bool {
	sbb.mu.Lock()
	defer sbb.mu.Unlock()

	if len(sbb.entries) == 0 {
		return false
	}
	return time.Since(sbb.firstLogTime) >= timeout
}

// BlockAccumulator 管理所有串流的 VictoriaBlock 聚合、封塊與落盤調度
type BlockAccumulator struct {
	mu           sync.RWMutex
	streamMgr    *StreamManager
	buffers      map[StreamID]*StreamBlockBuffer
	sealedBlocks chan *VictoriaBlock

	// 統計遙測指標
	totalSealedBlocks uint64
	totalSealedRows   uint64
	totalUncompBytes  uint64
	totalCompBytes    uint64
}

func NewBlockAccumulator(sm *StreamManager, blockQueueCap int) *BlockAccumulator {
	if blockQueueCap <= 0 {
		blockQueueCap = 1000
	}
	return &BlockAccumulator{
		streamMgr:    sm,
		buffers:      make(map[StreamID]*StreamBlockBuffer),
		sealedBlocks: make(chan *VictoriaBlock, blockQueueCap),
	}
}

// IngestLog 接收已解析之單筆日誌，依 StreamID 分流並壓入對應串流緩衝區
func (ba *BlockAccumulator) IngestLog(entry LogEntry, labels StreamLabels) {
	streamMeta := ba.streamMgr.GetOrCreateStream(labels)
	streamID := streamMeta.ID

	buf := ba.getOrCreateBuffer(streamID, labels)
	isFull := buf.AppendLog(entry)

	atomic.AddUint64(&streamMeta.TotalRows, 1)
	atomic.AddUint64(&streamMeta.TotalBytes, uint64(len(entry.RawMsg)))

	if isFull {
		if block := buf.SealAndReset(); block != nil {
			ba.emitSealedBlock(block, streamMeta)
		}
	}
}

func (ba *BlockAccumulator) getOrCreateBuffer(id StreamID, labels StreamLabels) *StreamBlockBuffer {
	ba.mu.RLock()
	buf, ok := ba.buffers[id]
	ba.mu.RUnlock()
	if ok {
		return buf
	}

	ba.mu.Lock()
	defer ba.mu.Unlock()

	if buf, ok = ba.buffers[id]; ok {
		return buf
	}

	buf = newStreamBlockBuffer(id, labels)
	ba.buffers[id] = buf
	return buf
}

func (ba *BlockAccumulator) emitSealedBlock(block *VictoriaBlock, meta *StreamMetadata) {
	atomic.AddUint64(&ba.totalSealedBlocks, 1)
	atomic.AddUint64(&ba.totalSealedRows, uint64(block.Header.RowsCount))
	atomic.AddUint64(&ba.totalUncompBytes, uint64(block.Header.UncompressedSize))
	atomic.AddUint64(&ba.totalCompBytes, uint64(block.Header.EstimatedCompSize))
	atomic.AddUint32(&meta.TotalBlocks, 1)

	select {
	case ba.sealedBlocks <- block:
	default:
		// 若下游阻塞，非同步送出保護入庫管線
		go func() {
			ba.sealedBlocks <- block
		}()
	}
}

// StartAutoFlusher 啟動定時封塊常駐協程，防止低頻 Stream 日誌滯留記憶體過久
func (ba *BlockAccumulator) StartAutoFlusher(ctx context.Context, interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			ba.FlushAll()
			return
		case <-ticker.C:
			ba.flushExpiredBuffers(interval)
		}
	}
}

func (ba *BlockAccumulator) flushExpiredBuffers(timeout time.Duration) {
	ba.mu.RLock()
	buffers := make([]*StreamBlockBuffer, 0, len(ba.buffers))
	for _, b := range ba.buffers {
		buffers = append(buffers, b)
	}
	ba.mu.RUnlock()

	for _, buf := range buffers {
		if buf.ShouldFlushByTimeout(timeout) {
			if block := buf.SealAndReset(); block != nil {
				ba.emitSealedBlock(block, ba.streamMgr.GetOrCreateStream(buf.labels))
			}
		}
	}
}

// FlushAll 在收集器優雅關閉時強制將所有緩衝區中的日誌 Seal
func (ba *BlockAccumulator) FlushAll() {
	ba.mu.RLock()
	defer ba.mu.RUnlock()

	for _, buf := range ba.buffers {
		if block := buf.SealAndReset(); block != nil {
			ba.emitSealedBlock(block, ba.streamMgr.GetOrCreateStream(buf.labels))
		}
	}
}

// SealedBlocksChan 取得已封裝不可變 VictoriaBlock 的消費通道
func (ba *BlockAccumulator) SealedBlocksChan() <-chan *VictoriaBlock {
	return ba.sealedBlocks
}

// Telemetry 輸出 VictoriaLogs 區塊聚合器即時效能統計
func (ba *BlockAccumulator) Telemetry() (blocks, rows, uncomp, comp uint64, ratio string) {
	b := atomic.LoadUint64(&ba.totalSealedBlocks)
	r := atomic.LoadUint64(&ba.totalSealedRows)
	u := atomic.LoadUint64(&ba.totalUncompBytes)
	c := atomic.LoadUint64(&ba.totalCompBytes)

	rVal := "1.0x"
	if c > 0 {
		rVal = fmt.Sprintf("%.1fx", float64(u)/float64(c))
	}
	return b, r, u, c, rVal
}
