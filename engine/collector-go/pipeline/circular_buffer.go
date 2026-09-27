package pipeline

import (
	"errors"
	"sync"
	"sync/atomic"
)

// OverflowStrategy defines ring buffer behavior when reaching max capacity.
type OverflowStrategy string

const (
	StrategyDropOldest    OverflowStrategy = "drop_oldest"
	StrategyDropNewest    OverflowStrategy = "drop_newest"
	StrategyBackpressure  OverflowStrategy = "backpressure"
)

// CircularBufferStats tracks memory efficiency and GC telemetry for the circular ring buffer.
type CircularBufferStats struct {
	Capacity            uint64  `json:"capacity"`
	CurrentDepth        uint64  `json:"current_depth"`
	HighWatermark       uint64  `json:"high_watermark"`
	TotalPushed         uint64  `json:"total_pushed"`
	TotalDrained        uint64  `json:"total_drained"`
	TotalOverflows      uint64  `json:"total_overflows"`
	UtilizationPct      float64 `json:"utilization_pct"`
	Strategy            string  `json:"strategy"`
	GCSavingsEstimatedMB float64 `json:"gc_savings_estimated_mb"`
}

// CircularRingBuffer implements an efficient, zero-realloc circular ring buffer
// for incoming logs before batching to minimize GC overhead and eliminate heap churn.
type CircularRingBuffer struct {
	mu           sync.Mutex
	notEmptyCond *sync.Cond

	capacity     uint64
	mask         uint64 // capacity - 1 (when power of 2)
	head         uint64 // read cursor
	tail         uint64 // write cursor

	// Pre-allocated fixed slots to eliminate ongoing slice reallocations
	slots        []LogEntry
	strategy     OverflowStrategy

	// Telemetry counters (atomic for lockless reads where applicable)
	totalPushed    uint64
	totalDrained   uint64
	totalOverflows uint64
	highWatermark  uint64

	entryPool    sync.Pool
	isClosed     bool
}

// NewCircularRingBuffer creates a new circular buffer with power-of-2 capacity.
func NewCircularRingBuffer(minCapacity int, strategy OverflowStrategy) *CircularRingBuffer {
	// Round up to power of 2 for fast bitwise indexing
	capPow2 := uint64(1)
	for capPow2 < uint64(minCapacity) {
		capPow2 <<= 1
	}

	crb := &CircularRingBuffer{
		capacity: capPow2,
		mask:     capPow2 - 1,
		head:     0,
		tail:     0,
		slots:    make([]LogEntry, capPow2),
		strategy: strategy,
		entryPool: sync.Pool{
			New: func() interface{} {
				return &LogEntry{
					Fields: make(map[string]interface{}, 8),
				}
			},
		},
	}
	crb.notEmptyCond = sync.NewCond(&crb.mu)
	return crb
}

// Push adds an incoming log entry into the circular buffer before batching.
// Under high throughput, this minimizes GC pressure by writing directly to pre-allocated slots.
func (crb *CircularRingBuffer) Push(entry LogEntry) bool {
	crb.mu.Lock()
	defer crb.mu.Unlock()

	if crb.isClosed {
		return false
	}

	currentDepth := crb.tail - crb.head

	if currentDepth >= crb.capacity {
		crb.totalOverflows++
		switch crb.strategy {
		case StrategyDropOldest:
			// Advance head cursor to drop oldest element and retain freshest logs
			crb.head++
		case StrategyDropNewest:
			// Discard the new incoming entry
			return false
		case StrategyBackpressure:
			// Reject entry until consumers drain items
			return false
		default:
			crb.head++
		}
	}

	// Slot index using bitwise mask instead of slow modulo
	idx := crb.tail & crb.mask
	crb.slots[idx] = entry
	crb.tail++
	crb.totalPushed++

	newDepth := crb.tail - crb.head
	if newDepth > crb.highWatermark {
		crb.highWatermark = newDepth
	}

	// Wake up any waiting batch drainers
	crb.notEmptyCond.Signal()
	return true
}

// PopBatch drains up to maxBatch entries directly into the provided slice,
// avoiding slice allocations on the caller side and keeping GC load at a minimum.
func (crb *CircularRingBuffer) PopBatch(dest []LogEntry, maxBatch int) int {
	crb.mu.Lock()
	defer crb.mu.Unlock()

	currentDepth := int(crb.tail - crb.head)
	if currentDepth == 0 {
		return 0
	}

	drainCount := currentDepth
	if drainCount > maxBatch {
		drainCount = maxBatch
	}
	if drainCount > len(dest) {
		drainCount = len(dest)
	}

	for i := 0; i < drainCount; i++ {
		idx := (crb.head + uint64(i)) & crb.mask
		dest[i] = crb.slots[idx]
		// Clear reference in slot to assist immediate release of inner field maps if needed
		crb.slots[idx].RawMsg = ""
		crb.slots[idx].Fields = nil
	}

	crb.head += uint64(drainCount)
	crb.totalDrained += uint64(drainCount)
	return drainCount
}

// Depth returns the current number of log entries waiting in the ring buffer.
func (crb *CircularRingBuffer) Depth() int {
	crb.mu.Lock()
	defer crb.mu.Unlock()
	return int(crb.tail - crb.head)
}

// Stats returns an immutable snapshot of ring buffer telemetry.
func (crb *CircularRingBuffer) Stats() CircularBufferStats {
	crb.mu.Lock()
	defer crb.mu.Unlock()

	depth := crb.tail - crb.head
	utilization := float64(0)
	if crb.capacity > 0 {
		utilization = (float64(depth) / float64(crb.capacity)) * 100.0
	}

	// Average ~400 bytes per log object saved from ephemeral heap churn
	gcSavingsMB := (float64(crb.totalPushed) * 400.0) / (1024.0 * 1024.0)

	return CircularBufferStats{
		Capacity:             crb.capacity,
		CurrentDepth:         depth,
		HighWatermark:        crb.highWatermark,
		TotalPushed:          crb.totalPushed,
		TotalDrained:         crb.totalDrained,
		TotalOverflows:       crb.totalOverflows,
		UtilizationPct:       utilization,
		Strategy:             string(crb.strategy),
		GCSavingsEstimatedMB: gcSavingsMB,
	}
}

// Close gracefully closes the buffer.
func (crb *CircularRingBuffer) Close() error {
	crb.mu.Lock()
	defer crb.mu.Unlock()
	if crb.isClosed {
		return errors.New("buffer already closed")
	}
	crb.isClosed = true
	crb.notEmptyCond.Broadcast()
	return nil
}
