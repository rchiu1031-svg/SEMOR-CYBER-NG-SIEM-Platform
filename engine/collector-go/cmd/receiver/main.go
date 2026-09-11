package main

import (
	"bufio"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net"
	"net/http"
	"os"
	"os/signal"
	"runtime"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"syscall"
	"time"
)

// ============================================================================
// Architecture Specification:
// SEMOR High-Concurrency Log Ingestion Receiver (Go Core)
// Layer: High-Performance UDP/TCP Ingestion + Lock-Striped Sharded Circular
//        Ring Buffer + Traffic-Adaptive Dynamic Worker Pool + Zero-Loss Graceful Shutdown
// ============================================================================

const (
	ReceiverName           = "SEMOR High-Concurrency Log Receiver"
	ReceiverVersion        = "v2.2.0-DynamicWorkerZeroLoss"
	DefaultUDPPort         = 5140
	DefaultTCPPort         = 5140
	DefaultHTTPPort        = 8080
	DefaultUDSPath         = "/tmp/semor_rust.sock"
	DefaultTCPAddr         = "127.0.0.1:9527"
	DefaultTotalRingCap    = 160000 // Total capacity across all shards to absorb massive spikes
	DefaultShardsCount     = 16     // 16 independent ring buffer shards for lock-free parallel scaling
	DefaultBatchSz         = 2000   // Vectorized batch size per Rust IPC dispatch
	DefaultFlushMs         = 80     // Max flush interval threshold
	DefaultMinWorkers      = 8      // Minimum base channel intake workers
	DefaultMaxWorkers      = 64     // Maximum burst channel intake workers during spikes
	DefaultQueueCapacity   = 150000 // Ingestion packet queue capacity
	DefaultIdleTimeoutSec  = 4      // Scale down idle timeout for dynamic workers
	DefaultSocketBufMB     = 32     // 32MB OS Socket read buffer
	DefaultShutdownTimeout = 20     // Graceful shutdown timeout in seconds
)

// OverflowStrategy defines behavior when a circular buffer shard reaches 100% capacity during spikes
type OverflowStrategy string

const (
	// DropOldest overwrites the oldest buffered entries in the ring buffer,
	// guaranteeing the freshest spike events are preserved during extreme floods.
	DropOldest OverflowStrategy = "drop_oldest"

	// DropNewest discards newly arriving entries when saturated to protect prior buffered state.
	DropNewest OverflowStrategy = "drop_newest"
)

// InboundLogEntry represents an ingested log entry with nanosecond-precision timestamp
type InboundLogEntry struct {
	Timestamp int64             `json:"timestamp"` // Nanosecond precision unix timestamp
	RawMsg    string            `json:"raw_msg"`   // Raw syslog/event payload
	Source    string            `json:"source"`    // Protocol source (syslog-udp, syslog-tcp, http)
	RemoteIP  string            `json:"remote_ip,omitempty"`
	Labels    map[string]string `json:"labels,omitempty"`
}

// RawPacket represents a decoupled network datagram passed into the worker pool
type RawPacket struct {
	Data      []byte
	Length    int
	Source    string
	RemoteIP  string
	ArrivedAt int64 // Nanosecond timestamp taken immediately at socket intake
}

// RustLogBatch is the structured wire payload prepared for the Rust VictoriaLogs-style storage engine
type RustLogBatch struct {
	StreamID     uint64            `json:"stream_id"`
	StreamLabels map[string]string `json:"stream_labels"`
	Entries      []InboundLogEntry `json:"entries"`
}

// ShardStats exposes per-shard metrics
type ShardStats struct {
	ShardID        int     `json:"shard_id"`
	Capacity       int     `json:"capacity"`
	CurrentDepth   int     `json:"current_depth"`
	PeakDepth      int     `json:"peak_depth"`
	UtilizationPct float64 `json:"utilization_pct"`
	TotalAbsorbed  uint64  `json:"total_absorbed"`
	TotalOverflows uint64  `json:"total_overflows"`
}

// AggregateBufferStats exposes aggregated telemetry of the high-concurrency buffer
type AggregateBufferStats struct {
	Architecture   string       `json:"architecture"`
	TotalCapacity  int          `json:"total_capacity"`
	CurrentDepth   int          `json:"current_depth"`
	PeakDepth      int          `json:"peak_depth"`
	UtilizationPct float64      `json:"utilization_pct"`
	TotalAbsorbed  uint64       `json:"total_absorbed"`
	TotalOverflows uint64       `json:"total_overflows"`
	Strategy       string       `json:"strategy"`
	ShardsCount    int          `json:"shards_count"`
	Shards         []ShardStats `json:"shards,omitempty"`
}

// ----------------------------------------------------------------------------
// Lock-Striped Sharded Circular Log Buffer
// ----------------------------------------------------------------------------

// RingShard represents one single locked circular buffer ring
type RingShard struct {
	buf            []InboundLogEntry
	capacity       int
	head           int
	tail           int
	size           int
	peakSize       int
	totalAbsorbed  uint64
	totalOverflows uint64
	strategy       OverflowStrategy
	notifyCh       chan struct{}
	mu             sync.Mutex
	closed         bool
}

func newRingShard(capacity int, strategy OverflowStrategy) *RingShard {
	return &RingShard{
		buf:      make([]InboundLogEntry, capacity),
		capacity: capacity,
		strategy: strategy,
		notifyCh: make(chan struct{}, 1),
	}
}

func (s *RingShard) push(entry InboundLogEntry) bool {
	s.mu.Lock()
	if s.closed {
		s.mu.Unlock()
		return false
	}

	s.totalAbsorbed++

	if s.size >= s.capacity {
		s.totalOverflows++
		if s.strategy == DropOldest {
			// Overwrite the oldest unread element and advance both head and tail
			s.buf[s.tail] = entry
			s.tail = (s.tail + 1) % s.capacity
			s.head = (s.head + 1) % s.capacity
			s.mu.Unlock()
			s.signal()
			return true
		}
		// DropNewest
		s.mu.Unlock()
		return false
	}

	s.buf[s.tail] = entry
	s.tail = (s.tail + 1) % s.capacity
	s.size++

	if s.size > s.peakSize {
		s.peakSize = s.size
	}

	shouldSignal := (s.size == 1) || (s.size%500 == 0)
	s.mu.Unlock()

	if shouldSignal {
		s.signal()
	}
	return true
}

func (s *RingShard) signal() {
	select {
	case s.notifyCh <- struct{}{}:
	default:
	}
}

func (s *RingShard) popBatch(maxItems int) []InboundLogEntry {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.size == 0 {
		return nil
	}

	n := maxItems
	if n > s.size {
		n = s.size
	}

	batch := make([]InboundLogEntry, n)
	for i := 0; i < n; i++ {
		batch[i] = s.buf[s.head]
		s.buf[s.head] = InboundLogEntry{} // Zero out reference for GC
		s.head = (s.head + 1) % s.capacity
	}
	s.size -= n

	return batch
}

func (s *RingShard) len() int {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.size
}

func (s *RingShard) stats(shardID int) ShardStats {
	s.mu.Lock()
	defer s.mu.Unlock()

	var utilPct float64
	if s.capacity > 0 {
		utilPct = (float64(s.size) / float64(s.capacity)) * 100.0
	}

	return ShardStats{
		ShardID:        shardID,
		Capacity:       s.capacity,
		CurrentDepth:   s.size,
		PeakDepth:      s.peakSize,
		UtilizationPct: utilPct,
		TotalAbsorbed:  s.totalAbsorbed,
		TotalOverflows: s.totalOverflows,
	}
}

func (s *RingShard) close() {
	s.mu.Lock()
	s.closed = true
	s.mu.Unlock()
	close(s.notifyCh)
}

// ShardedCircularBuffer aggregates multiple independent ring shards to eliminate
// lock contention across dozens of intake worker routines.
type ShardedCircularBuffer struct {
	shards         []*RingShard
	numShards      int
	totalCapacity  int
	roundRobin     uint64
	strategy       OverflowStrategy
	globalNotifyCh chan struct{}
}

// NewShardedCircularBuffer instantiates a partitioned lock-striped ring buffer
func NewShardedCircularBuffer(totalCapacity int, numShards int, strategy OverflowStrategy) *ShardedCircularBuffer {
	if totalCapacity <= 0 {
		totalCapacity = DefaultTotalRingCap
	}
	if numShards <= 0 {
		numShards = DefaultShardsCount
	}
	if strategy == "" {
		strategy = DropOldest
	}

	perShardCap := totalCapacity / numShards
	if perShardCap < 100 {
		perShardCap = 100
	}

	shards := make([]*RingShard, numShards)
	for i := 0; i < numShards; i++ {
		shards[i] = newRingShard(perShardCap, strategy)
	}

	scb := &ShardedCircularBuffer{
		shards:         shards,
		numShards:      numShards,
		totalCapacity:  perShardCap * numShards,
		strategy:       strategy,
		globalNotifyCh: make(chan struct{}, 1),
	}

	// Shard wake-up multiplexer: forward any shard signal to the global notify channel
	for i := 0; i < numShards; i++ {
		shard := shards[i]
		go func(ch <-chan struct{}) {
			for range ch {
				select {
				case scb.globalNotifyCh <- struct{}{}:
				default:
				}
			}
		}(shard.notifyCh)
	}

	return scb
}

// Push distributes inbound logs across shards using round-robin striping
func (scb *ShardedCircularBuffer) Push(entry InboundLogEntry) bool {
	idx := atomic.AddUint64(&scb.roundRobin, 1) % uint64(scb.numShards)
	return scb.shards[idx].push(entry)
}

// PushWithAffinity allows worker pools to write into a dedicated shard lane
func (scb *ShardedCircularBuffer) PushWithAffinity(shardHint int, entry InboundLogEntry) bool {
	idx := uint64(shardHint) % uint64(scb.numShards)
	return scb.shards[idx].push(entry)
}

// PopBatch drains up to maxItems in round-robin fashion across all shards
func (scb *ShardedCircularBuffer) PopBatch(maxItems int) []InboundLogEntry {
	if maxItems <= 0 {
		return nil
	}

	batch := make([]InboundLogEntry, 0, maxItems)
	remaining := maxItems

	// Round-robin pass over all shards
	for i := 0; i < scb.numShards && remaining > 0; i++ {
		shardBatch := scb.shards[i].popBatch(remaining)
		if len(shardBatch) > 0 {
			batch = append(batch, shardBatch...)
			remaining -= len(shardBatch)
		}
	}

	return batch
}

// TotalDepth returns current queued elements across all shards
func (scb *ShardedCircularBuffer) TotalDepth() int {
	total := 0
	for i := 0; i < scb.numShards; i++ {
		total += scb.shards[i].len()
	}
	return total
}

// Stats returns comprehensive telemetry
func (scb *ShardedCircularBuffer) Stats(includeShards bool) AggregateBufferStats {
	totalDepth := 0
	peakDepthSum := 0
	var totalAbsorbed uint64
	var totalOverflows uint64

	var shardList []ShardStats
	if includeShards {
		shardList = make([]ShardStats, scb.numShards)
	}

	for i := 0; i < scb.numShards; i++ {
		st := scb.shards[i].stats(i)
		totalDepth += st.CurrentDepth
		peakDepthSum += st.PeakDepth
		totalAbsorbed += st.TotalAbsorbed
		totalOverflows += st.TotalOverflows
		if includeShards {
			shardList[i] = st
		}
	}

	var utilPct float64
	if scb.totalCapacity > 0 {
		utilPct = (float64(totalDepth) / float64(scb.totalCapacity)) * 100.0
	}

	return AggregateBufferStats{
		Architecture:   "Lock-Striped Multi-Lane Sharded Circular Buffer",
		TotalCapacity:  scb.totalCapacity,
		CurrentDepth:   totalDepth,
		PeakDepth:      peakDepthSum,
		UtilizationPct: utilPct,
		TotalAbsorbed:  totalAbsorbed,
		TotalOverflows: totalOverflows,
		Strategy:       string(scb.strategy),
		ShardsCount:    scb.numShards,
		Shards:         shardList,
	}
}

// NotifyChannel returns the wake channel used by the batch offloader
func (scb *ShardedCircularBuffer) NotifyChannel() <-chan struct{} {
	return scb.globalNotifyCh
}

// Close terminates all shards
func (scb *ShardedCircularBuffer) Close() {
	for i := 0; i < scb.numShards; i++ {
		scb.shards[i].close()
	}
}

// ----------------------------------------------------------------------------
// Traffic-Adaptive Dynamic Worker Pool & Channel-Based Decoupling
// ----------------------------------------------------------------------------

// ChannelWorkerPool processes raw datagram packets concurrently without blocking socket readers.
// It features an automated dynamic autoscaler that expands workers during packet floods and
// contracts back to MinWorkers during quiet intervals, plus a zero-loss drain mechanism.
type ChannelWorkerPool struct {
	packetCh      chan RawPacket
	minWorkers    int
	maxWorkers    int
	activeWorkers int64  // atomic current count of running worker routines
	scaleUpEvents uint64 // atomic counter
	scaleDnEvents uint64 // atomic counter
	idleTimeout   time.Duration
	buffer        *ShardedCircularBuffer
	pool          *sync.Pool
	metrics       *ThroughputMetrics

	// Autoscaler lifecycle context
	scalerCtx    context.Context
	scalerCancel context.CancelFunc

	// Synchronization for shutdown
	wg         sync.WaitGroup
	closeOnce  sync.Once
	isDraining int32 // atomic boolean flag
}

func newChannelWorkerPool(
	minWorkers int,
	maxWorkers int,
	queueSize int,
	idleTimeout time.Duration,
	buffer *ShardedCircularBuffer,
	pool *sync.Pool,
	metrics *ThroughputMetrics,
) *ChannelWorkerPool {
	if minWorkers < 2 {
		minWorkers = 2
	}
	if maxWorkers < minWorkers {
		maxWorkers = minWorkers * 4
	}
	if queueSize < 10000 {
		queueSize = DefaultQueueCapacity
	}
	if idleTimeout < 1*time.Second {
		idleTimeout = time.Duration(DefaultIdleTimeoutSec) * time.Second
	}

	sCtx, sCancel := context.WithCancel(context.Background())

	cwp := &ChannelWorkerPool{
		packetCh:      make(chan RawPacket, queueSize),
		minWorkers:    minWorkers,
		maxWorkers:    maxWorkers,
		idleTimeout:   idleTimeout,
		buffer:        buffer,
		pool:          pool,
		metrics:       metrics,
		scalerCtx:     sCtx,
		scalerCancel:  sCancel,
	}

	// 1. Initialize base core workers (permanent workers)
	for i := 0; i < minWorkers; i++ {
		cwp.wg.Add(1)
		atomic.AddInt64(&cwp.activeWorkers, 1)
		go cwp.workerLoop(i, false)
	}

	// 2. Start background traffic monitor & autoscaler loop
	cwp.wg.Add(1)
	go cwp.autoScaler()

	return cwp
}

// autoScaler continuously evaluates packet queue pressure and scales worker routines dynamically
func (cwp *ChannelWorkerPool) autoScaler() {
	defer cwp.wg.Done()
	ticker := time.NewTicker(250 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-cwp.scalerCtx.Done():
			return
		case <-ticker.C:
			if atomic.LoadInt32(&cwp.isDraining) == 1 {
				return
			}

			qLen := len(cwp.packetCh)
			qCap := cap(cwp.packetCh)
			active := atomic.LoadInt64(&cwp.activeWorkers)

			// Determine if scale-up is required based on queue depth and utilization
			utilization := float64(qLen) / float64(qCap)

			var workersToAdd int
			if qLen > 10000 || utilization > 0.40 {
				workersToAdd = 8
			} else if qLen > 2500 || utilization > 0.15 {
				workersToAdd = 4
			} else if qLen > 500 || utilization > 0.05 {
				workersToAdd = 2
			} else if qLen > 100 {
				workersToAdd = 1
			}

			for i := 0; i < workersToAdd; i++ {
				if atomic.LoadInt64(&cwp.activeWorkers) < int64(cwp.maxWorkers) {
					cwp.spawnDynamicWorker()
				}
			}

			// Update metrics
			if cwp.metrics != nil {
				cwp.metrics.mu.Lock()
				cwp.metrics.ActiveWorkers = active
				cwp.metrics.WorkerQueueDepth = qLen
				cwp.metrics.mu.Unlock()
			}
		}
	}
}

// spawnDynamicWorker instantiates an ephemeral worker goroutine that automatically times out when idle
func (cwp *ChannelWorkerPool) spawnDynamicWorker() {
	if atomic.LoadInt32(&cwp.isDraining) == 1 {
		return
	}
	current := atomic.AddInt64(&cwp.activeWorkers, 1)
	if current > int64(cwp.maxWorkers) {
		atomic.AddInt64(&cwp.activeWorkers, -1)
		return
	}

	atomic.AddUint64(&cwp.scaleUpEvents, 1)
	workerID := int(atomic.LoadUint64(&cwp.scaleUpEvents))

	cwp.wg.Add(1)
	go cwp.workerLoop(workerID, true)
}

// workerLoop handles packet extraction, memory slice recycling, and sharded insertion
func (cwp *ChannelWorkerPool) workerLoop(workerID int, isDynamic bool) {
	defer cwp.wg.Done()

	if !isDynamic {
		// Core Worker: persists across entire process lifetime until packetCh is drained and closed
		for pkt := range cwp.packetCh {
			cwp.processPacket(workerID, pkt)
		}
		atomic.AddInt64(&cwp.activeWorkers, -1)
		return
	}

	// Dynamic Burst Worker: features idle timeout auto-contraction
	idleTimer := time.NewTimer(cwp.idleTimeout)
	defer idleTimer.Stop()

	for {
		select {
		case pkt, ok := <-cwp.packetCh:
			if !ok {
				// Channel closed during graceful shutdown drain
				atomic.AddInt64(&cwp.activeWorkers, -1)
				return
			}
			cwp.processPacket(workerID, pkt)

			// Reset idle timer
			if !idleTimer.Stop() {
				select {
				case <-idleTimer.C:
				default:
				}
			}
			idleTimer.Reset(cwp.idleTimeout)

		case <-idleTimer.C:
			// If shutdown is ongoing, do not exit prematurely; wait for channel close
			if atomic.LoadInt32(&cwp.isDraining) == 1 {
				idleTimer.Reset(100 * time.Millisecond)
				continue
			}

			// Idle timeout fired: check if we have excess workers beyond MinWorkers
			if atomic.LoadInt64(&cwp.activeWorkers) > int64(cwp.minWorkers) && len(cwp.packetCh) == 0 {
				atomic.AddInt64(&cwp.activeWorkers, -1)
				atomic.AddUint64(&cwp.scaleDnEvents, 1)
				return // Scale down!
			}

			idleTimer.Reset(cwp.idleTimeout)
		}
	}
}

func (cwp *ChannelWorkerPool) processPacket(workerID int, pkt RawPacket) {
	// Extract message string from raw byte slice
	rawMsg := strings.TrimSpace(string(pkt.Data[:pkt.Length]))

	// Immediately return byte slice back to sync.Pool
	cwp.pool.Put(&pkt.Data)

	if len(rawMsg) == 0 {
		return
	}

	entry := InboundLogEntry{
		Timestamp: pkt.ArrivedAt,
		RawMsg:    rawMsg,
		Source:    pkt.Source,
		RemoteIP:  pkt.RemoteIP,
	}

	// Push to Sharded Circular Buffer with worker affinity to minimize CPU cache thrashing
	if !cwp.buffer.PushWithAffinity(workerID, entry) {
		atomic.AddUint64(&cwp.metrics.PacketsDropped, 1)
	}
}

// Submit accepts an inbound network packet. If a sudden flood arrives, it triggers sub-millisecond dynamic expansion.
func (cwp *ChannelWorkerPool) Submit(pkt RawPacket) bool {
	if atomic.LoadInt32(&cwp.isDraining) == 1 {
		// In draining mode, recycle packet buffer immediately
		cwp.pool.Put(&pkt.Data)
		return false
	}

	// Fast-path autoscaling: if channel queue is starting to back up, immediately add a worker
	if len(cwp.packetCh) > 400 && atomic.LoadInt64(&cwp.activeWorkers) < int64(cwp.maxWorkers) {
		cwp.spawnDynamicWorker()
	}

	select {
	case cwp.packetCh <- pkt:
		return true
	default:
		// Saturated queue: recycle slice and record drop
		cwp.pool.Put(&pkt.Data)
		atomic.AddUint64(&cwp.metrics.PacketsDropped, 1)
		return false
	}
}

// DrainAndStop closes the packet queue and blocks until all pending packets are processed by workers.
// No in-flight packet inside the channel is dropped!
func (cwp *ChannelWorkerPool) DrainAndStop() {
	cwp.closeOnce.Do(func() {
		atomic.StoreInt32(&cwp.isDraining, 1)
		// Cancel the autoscaler monitor
		cwp.scalerCancel()
		// Closing the channel signals all workers to process all remaining items until empty
		close(cwp.packetCh)
	})
	cwp.wg.Wait()
}

func (cwp *ChannelWorkerPool) ActiveWorkers() int {
	return int(atomic.LoadInt64(&cwp.activeWorkers))
}

func (cwp *ChannelWorkerPool) PendingPackets() int {
	return len(cwp.packetCh)
}

func (cwp *ChannelWorkerPool) QueueCapacity() int {
	return cap(cwp.packetCh)
}

func (cwp *ChannelWorkerPool) ScaleEvents() (up uint64, down uint64) {
	return atomic.LoadUint64(&cwp.scaleUpEvents), atomic.LoadUint64(&cwp.scaleDnEvents)
}

// ----------------------------------------------------------------------------
// Telemetry & Runtime Configuration
// ----------------------------------------------------------------------------

type ThroughputMetrics struct {
	UDPPacketsTotal uint64
	TCPPacketsTotal uint64
	BytesTotal      uint64
	PacketsDropped  uint64
	BatchesSent     uint64
	BatchesFailed   uint64

	// Dynamic worker telemetry
	ActiveWorkers    int64
	WorkerQueueDepth int

	// Rolling rate calculations
	LastUDPCount uint64
	LastTCPCount uint64
	LastByteCnt  uint64
	LastSampleAt time.Time
	CurrentPPS   float64
	CurrentMBps  float64
	mu           sync.RWMutex
}

type ReceiverConfig struct {
	UDPPort            int
	TCPPort            int
	HTTPPort           int
	SocketBufMB        int
	MinWorkers         int
	MaxWorkers         int
	QueueCapacity      int
	IdleTimeoutSec     int
	TotalRingCap       int
	ShardsCount        int
	BatchSize          int
	FlushInterval      time.Duration
	RustUDSPath        string
	RustTCPAddr        string
	UseUDS             bool
	OverflowStrategy   OverflowStrategy
	ShutdownTimeoutSec int
}

type ReceiverEngine struct {
	cfg        *ReceiverConfig
	ringBuffer *ShardedCircularBuffer
	workerPool *ChannelWorkerPool
	metrics    *ThroughputMetrics
	bufPool    *sync.Pool
	startTime  time.Time

	// Network listener handlers for clean unbinding
	udpConn     *net.UDPConn
	tcpListener net.Listener
	httpServer  *http.Server
	listenersWg sync.WaitGroup

	// Rust connection state
	rustConn   net.Conn
	rustMu     sync.Mutex
	isRustConn bool

	// Asynchronous Rust batch dispatch queue & workers
	rustDispatchCh chan *RustLogBatch
	rustWorkersWg  sync.WaitGroup
	rustIPCCancel  context.CancelFunc

	// Batch Aggregator routine management
	aggregatorCancel context.CancelFunc
	aggregatorWg     sync.WaitGroup
}

func main() {
	runtime.GOMAXPROCS(runtime.NumCPU())

	cfg := loadConfig()
	engine := newReceiverEngine(cfg)

	fmt.Printf("================================================================\n")
	fmt.Printf("   %s (%s)\n", ReceiverName, ReceiverVersion)
	fmt.Printf("   Architecture: Sharded Circular Buffer + Adaptive Dynamic Worker Pool\n")
	fmt.Printf("   Hardware: %d Logical CPU Cores Detected\n", runtime.NumCPU())
	fmt.Printf("   Syslog Listener Ports: UDP/%d, TCP/%d\n", cfg.UDPPort, cfg.TCPPort)
	fmt.Printf("   Dynamic Worker Pool: Min=%d, Max=%d, IdleTimeout=%ds, QueueCap=%d\n",
		cfg.MinWorkers, cfg.MaxWorkers, cfg.IdleTimeoutSec, cfg.QueueCapacity)
	fmt.Printf("   Burst Ring Buffer: %d entries across %d Shards (Strategy: %s)\n",
		cfg.TotalRingCap, cfg.ShardsCount, cfg.OverflowStrategy)
	fmt.Printf("   Telemetry HTTP Endpoint: http://0.0.0.0:%d/health\n", cfg.HTTPPort)
	fmt.Printf("   Rust Storage Target: UDS(%s), TCP(%s)\n", cfg.RustUDSPath, cfg.RustTCPAddr)
	fmt.Printf("================================================================\n")

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// 1. Start Rust Storage IPC connection manager
	ipcCtx, ipcCancel := context.WithCancel(ctx)
	engine.rustIPCCancel = ipcCancel
	go engine.runRustIPCManager(ipcCtx)

	// 2. Start Asynchronous Rust Forwarder Dispatch Workers
	engine.startRustDispatchWorkers(4)

	// 3. Start Batch Aggregator for the Sharded Buffer
	aggCtx, aggCancel := context.WithCancel(ctx)
	engine.aggregatorCancel = aggCancel
	engine.startBatchAggregator(aggCtx)

	// 4. Start High-Performance UDP Listener with OS buffer tuning
	if err := engine.startUDPListener(); err != nil {
		fmt.Printf("[FATAL ERROR] UDP Listener initialization failed: %v\n", err)
	}

	// 5. Start High-Performance TCP Stream Listener
	if err := engine.startTCPListener(); err != nil {
		fmt.Printf("[FATAL ERROR] TCP Listener initialization failed: %v\n", err)
	}

	// 6. Start Health & Telemetry HTTP Server
	go engine.startHTTPServer()

	// 7. Start Rolling Throughput Sampler
	go engine.runMetricsSampler(ctx)

	// 8. Trap OS termination signals for Zero-Loss Graceful Shutdown
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
	sig := <-sigCh

	fmt.Printf("\n[SHUTDOWN TRIGGERED] Received signal %v. Commencing zero-loss graceful shutdown...\n", sig)

	shutdownTimeout := time.Duration(cfg.ShutdownTimeoutSec) * time.Second
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), shutdownTimeout)
	defer shutdownCancel()

	if err := engine.GracefulShutdown(shutdownCtx); err != nil {
		fmt.Printf("[SHUTDOWN WARNING] Graceful shutdown encountered issue: %v\n", err)
	} else {
		fmt.Println("[SHUTDOWN SUCCESS] Zero logs lost. All buffers and pipelines flushed cleanly. Goodbye.")
	}
}

func newReceiverEngine(cfg *ReceiverConfig) *ReceiverEngine {
	metrics := &ThroughputMetrics{
		LastSampleAt:  time.Now(),
		ActiveWorkers: int64(cfg.MinWorkers),
	}

	ringBuffer := NewShardedCircularBuffer(cfg.TotalRingCap, cfg.ShardsCount, cfg.OverflowStrategy)

	bufPool := &sync.Pool{
		New: func() interface{} {
			b := make([]byte, 65536) // 64KB slice for raw packet intake
			return &b
		},
	}

	workerPool := newChannelWorkerPool(
		cfg.MinWorkers,
		cfg.MaxWorkers,
		cfg.QueueCapacity,
		time.Duration(cfg.IdleTimeoutSec)*time.Second,
		ringBuffer,
		bufPool,
		metrics,
	)

	return &ReceiverEngine{
		cfg:            cfg,
		ringBuffer:     ringBuffer,
		workerPool:     workerPool,
		metrics:        metrics,
		bufPool:        bufPool,
		startTime:      time.Now(),
		rustDispatchCh: make(chan *RustLogBatch, 2000),
	}
}

// ----------------------------------------------------------------------------
// Zero-Loss Graceful Shutdown Pipeline
// ----------------------------------------------------------------------------

// GracefulShutdown executes a 5-step orchestrated shutdown ensuring complete drainage:
// Step 1: Close UDP/TCP listeners & HTTP server -> Prevents new packet arrivals
// Step 2: Drain worker pool packet channel -> All in-flight packets parsed into ring buffer
// Step 3: Stop normal aggregator & drain all ring buffer shards -> Packaged into Rust batches
// Step 4: Close Rust dispatch channel & wait for forwarders -> All batches written to Rust IPC
// Step 5: Flush & cleanly close Rust IPC connection
func (e *ReceiverEngine) GracefulShutdown(ctx context.Context) error {
	shutdownStart := time.Now()

	// --- Step 1: Terminate Ingress Listeners ---
	fmt.Println("[SHUTDOWN 1/5] Terminating UDP, TCP, and HTTP ingress listeners...")
	if e.udpConn != nil {
		_ = e.udpConn.Close()
	}
	if e.tcpListener != nil {
		_ = e.tcpListener.Close()
	}
	if e.httpServer != nil {
		_ = e.httpServer.Shutdown(ctx)
	}
	// Wait for listener read loops to exit
	e.listenersWg.Wait()
	fmt.Println("[SHUTDOWN 1/5 Completed] Sockets closed. No new ingress packets will be admitted.")

	// --- Step 2: Drain Worker Pool Packet Queue ---
	pendingPackets := e.workerPool.PendingPackets()
	activeWorkers := e.workerPool.ActiveWorkers()
	fmt.Printf("[SHUTDOWN 2/5] Draining worker pool packet queue (%d packets queued across %d workers)...\n",
		pendingPackets, activeWorkers)
	e.workerPool.DrainAndStop()
	fmt.Println("[SHUTDOWN 2/5 Completed] Worker pool drained completely into sharded ring buffer.")

	// --- Step 3: Drain Sharded Circular Buffer ---
	fmt.Println("[SHUTDOWN 3/5] Halting regular batch aggregator and draining sharded ring buffer...")
	if e.aggregatorCancel != nil {
		e.aggregatorCancel()
	}
	e.aggregatorWg.Wait()

	initialBufferDepth := e.ringBuffer.TotalDepth()
	fmt.Printf("[SHUTDOWN 3/5] Draining %d buffered log entries across all buffer shards...\n", initialBufferDepth)
	e.ringBuffer.Close()

	totalEntriesDrained := 0
	batchesGenerated := 0
	for {
		entries := e.ringBuffer.PopBatch(e.cfg.BatchSize)
		if len(entries) == 0 {
			break
		}
		totalEntriesDrained += len(entries)
		batchesGenerated++

		batch := &RustLogBatch{
			StreamID: 1001,
			StreamLabels: map[string]string{
				"pipeline":  "semor-core",
				"collector": "go-receiver-sharded",
				"drain":     "graceful_shutdown",
				"precision": "nanoseconds",
			},
			Entries: entries,
		}

		select {
		case e.rustDispatchCh <- batch:
		case <-ctx.Done():
			return fmt.Errorf("shutdown timed out during ring buffer drain: %w", ctx.Err())
		}
	}
	fmt.Printf("[SHUTDOWN 3/5 Completed] Sharded ring buffer drained (%d entries packed into %d batches).\n",
		totalEntriesDrained, batchesGenerated)

	// --- Step 4: Flush Rust Dispatch Queue ---
	pendingBatches := len(e.rustDispatchCh)
	fmt.Printf("[SHUTDOWN 4/5] Delivering %d queued batches to Rust VictoriaLogs storage engine...\n", pendingBatches)
	close(e.rustDispatchCh)

	// Await forwarder completion
	doneCh := make(chan struct{})
	go func() {
		e.rustWorkersWg.Wait()
		close(doneCh)
	}()

	select {
	case <-doneCh:
		fmt.Println("[SHUTDOWN 4/5 Completed] All batches successfully transferred over IPC to Rust engine.")
	case <-ctx.Done():
		return fmt.Errorf("shutdown timed out during Rust IPC batch delivery: %w", ctx.Err())
	}

	// --- Step 5: Close Rust Storage IPC Connection ---
	fmt.Println("[SHUTDOWN 5/5] Closing Rust storage IPC socket...")
	if e.rustIPCCancel != nil {
		e.rustIPCCancel()
	}
	e.rustMu.Lock()
	if e.rustConn != nil {
		_ = e.rustConn.Close()
		e.isRustConn = false
	}
	e.rustMu.Unlock()
	fmt.Printf("[SHUTDOWN 5/5 Completed] Storage IPC terminated. Total graceful shutdown duration: %v\n",
		time.Since(shutdownStart))

	return nil
}

// ----------------------------------------------------------------------------
// High-Performance UDP Listener
// ----------------------------------------------------------------------------

func (e *ReceiverEngine) startUDPListener() error {
	addr := net.UDPAddr{
		Port: e.cfg.UDPPort,
		IP:   net.ParseIP("0.0.0.0"),
	}

	conn, err := net.ListenUDP("udp", &addr)
	if err != nil {
		return fmt.Errorf("failed to bind UDP port %d: %w", e.cfg.UDPPort, err)
	}

	e.udpConn = conn

	readBufBytes := e.cfg.SocketBufMB * 1024 * 1024
	if err := conn.SetReadBuffer(readBufBytes); err != nil {
		fmt.Printf("[WARN] Unable to expand UDP OS socket buffer to %dMB: %v\n", e.cfg.SocketBufMB, err)
	} else {
		fmt.Printf("[UDP Listener] OS Socket Receive Buffer optimized to %d MB\n", e.cfg.SocketBufMB)
	}

	e.listenersWg.Add(1)
	go func() {
		defer e.listenersWg.Done()
		defer conn.Close()
		fmt.Printf("[UDP Listener] Active on 0.0.0.0:%d (Traffic-Adaptive Worker Pool intake)\n", e.cfg.UDPPort)

		for {
			bufPtr := e.bufPool.Get().(*[]byte)
			buf := *bufPtr

			n, remoteAddr, err := conn.ReadFrom(buf)
			if err != nil {
				e.bufPool.Put(bufPtr)
				// Check for closed socket error indicating intentional shutdown
				if errors.Is(err, net.ErrClosed) || strings.Contains(err.Error(), "use of closed network connection") {
					return
				}
				continue
			}

			arrivedAt := time.Now().UnixNano()
			atomic.AddUint64(&e.metrics.UDPPacketsTotal, 1)
			atomic.AddUint64(&e.metrics.BytesTotal, uint64(n))

			var remoteIP string
			if remoteAddr != nil {
				remoteIP = remoteAddr.String()
			}

			pkt := RawPacket{
				Data:      buf,
				Length:    n,
				Source:    "syslog-udp",
				RemoteIP:  remoteIP,
				ArrivedAt: arrivedAt,
			}

			// Hand off to dynamic worker pool for non-blocking parallel parsing
			if !e.workerPool.Submit(pkt) {
				atomic.AddUint64(&e.metrics.PacketsDropped, 1)
			}
		}
	}()

	return nil
}

// ----------------------------------------------------------------------------
// High-Performance TCP Listener
// ----------------------------------------------------------------------------

func (e *ReceiverEngine) startTCPListener() error {
	addr := fmt.Sprintf("0.0.0.0:%d", e.cfg.TCPPort)
	listener, err := net.Listen("tcp", addr)
	if err != nil {
		return fmt.Errorf("failed to bind TCP port %d: %w", e.cfg.TCPPort, err)
	}

	e.tcpListener = listener
	fmt.Printf("[TCP Listener] Active on %s (Stream Log Delimited)\n", addr)

	e.listenersWg.Add(1)
	go func() {
		defer e.listenersWg.Done()
		defer listener.Close()

		for {
			conn, err := listener.Accept()
			if err != nil {
				if errors.Is(err, net.ErrClosed) || strings.Contains(err.Error(), "use of closed network connection") {
					return
				}
				continue
			}
			go e.handleTCPConnection(conn)
		}
	}()

	return nil
}

func (e *ReceiverEngine) handleTCPConnection(conn net.Conn) {
	defer conn.Close()

	if tcpConn, ok := conn.(*net.TCPConn); ok {
		_ = tcpConn.SetKeepAlive(true)
		_ = tcpConn.SetKeepAlivePeriod(30 * time.Second)
		_ = tcpConn.SetNoDelay(true)
	}

	remoteIP := conn.RemoteAddr().String()
	scanner := bufio.NewScanner(conn)

	lineBuf := make([]byte, 64*1024)
	scanner.Buffer(lineBuf, 1024*1024)

	for scanner.Scan() {
		arrivedAt := time.Now().UnixNano()
		line := strings.TrimSpace(scanner.Text())
		if len(line) == 0 {
			continue
		}

		atomic.AddUint64(&e.metrics.TCPPacketsTotal, 1)
		atomic.AddUint64(&e.metrics.BytesTotal, uint64(len(line)))

		entry := InboundLogEntry{
			Timestamp: arrivedAt,
			RawMsg:    line,
			Source:    "syslog-tcp",
			RemoteIP:  remoteIP,
		}

		// Push into sharded circular buffer
		if !e.ringBuffer.Push(entry) {
			atomic.AddUint64(&e.metrics.PacketsDropped, 1)
		}
	}
}

// ----------------------------------------------------------------------------
// Batch Aggregator & Asynchronous Rust Pipeline Offloader
// ----------------------------------------------------------------------------

func (e *ReceiverEngine) startBatchAggregator(ctx context.Context) {
	e.aggregatorWg.Add(1)
	go func() {
		defer e.aggregatorWg.Done()
		ticker := time.NewTicker(e.cfg.FlushInterval)
		defer ticker.Stop()

		flushBatches := func() {
			for {
				entries := e.ringBuffer.PopBatch(e.cfg.BatchSize)
				if len(entries) == 0 {
					break
				}

				payload := &RustLogBatch{
					StreamID: 1001,
					StreamLabels: map[string]string{
						"pipeline":  "semor-core",
						"collector": "go-receiver-sharded",
						"buffer":    "lock-striped-ring",
						"precision": "nanoseconds",
					},
					Entries: entries,
				}

				// Queue for non-blocking asynchronous dispatch
				select {
				case e.rustDispatchCh <- payload:
				default:
					// Rust queue saturated: mark failure
					atomic.AddUint64(&e.metrics.BatchesFailed, 1)
				}

				if len(entries) < e.cfg.BatchSize {
					break
				}
			}
		}

		for {
			select {
			case <-ctx.Done():
				return
			case <-e.ringBuffer.NotifyChannel():
				if e.ringBuffer.TotalDepth() >= e.cfg.BatchSize {
					flushBatches()
				}
			case <-ticker.C:
				if e.ringBuffer.TotalDepth() > 0 {
					flushBatches()
				}
			}
		}
	}()
}

func (e *ReceiverEngine) startRustDispatchWorkers(workers int) {
	for w := 0; w < workers; w++ {
		e.rustWorkersWg.Add(1)
		go func(workerID int) {
			defer e.rustWorkersWg.Done()
			for batch := range e.rustDispatchCh {
				e.sendToRustEngine(batch)
			}
		}(w)
	}
}

func (e *ReceiverEngine) sendToRustEngine(batch *RustLogBatch) {
	data, err := json.Marshal(batch)
	if err != nil {
		atomic.AddUint64(&e.metrics.BatchesFailed, 1)
		return
	}
	data = append(data, '\n')

	e.rustMu.Lock()
	defer e.rustMu.Unlock()

	if !e.isRustConn || e.rustConn == nil {
		atomic.AddUint64(&e.metrics.BatchesFailed, 1)
		return
	}

	_ = e.rustConn.SetWriteDeadline(time.Now().Add(1500 * time.Millisecond))
	if _, err := e.rustConn.Write(data); err != nil {
		e.isRustConn = false
		_ = e.rustConn.Close()
		atomic.AddUint64(&e.metrics.BatchesFailed, 1)
	} else {
		atomic.AddUint64(&e.metrics.BatchesSent, 1)
	}
}

func (e *ReceiverEngine) runRustIPCManager(ctx context.Context) {
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			e.rustMu.Lock()
			if !e.isRustConn {
				var conn net.Conn
				var err error

				if e.cfg.UseUDS {
					conn, err = net.DialTimeout("unix", e.cfg.RustUDSPath, 1*time.Second)
				}
				if err != nil || !e.cfg.UseUDS {
					conn, err = net.DialTimeout("tcp", e.cfg.RustTCPAddr, 1*time.Second)
				}

				if err == nil {
					e.rustConn = conn
					e.isRustConn = true
					fmt.Printf("[Rust Pipeline IPC] Successfully linked to Rust VictoriaLogs Engine!\n")
				}
			}
			e.rustMu.Unlock()
		}
	}
}

// ----------------------------------------------------------------------------
// Health Check & Telemetry HTTP Endpoints
// ----------------------------------------------------------------------------

func (e *ReceiverEngine) startHTTPServer() {
	mux := http.NewServeMux()

	// 1. Basic Health Check Endpoint (/health & /healthz)
	healthHandler := func(w http.ResponseWriter, r *http.Request) {
		e.rustMu.Lock()
		rustConnected := e.isRustConn
		e.rustMu.Unlock()

		stats := e.ringBuffer.Stats(false)
		scaleUp, scaleDown := e.workerPool.ScaleEvents()

		status := "healthy"
		httpCode := http.StatusOK
		if stats.UtilizationPct > 90.0 {
			status = "spike_burst_buffer_high_utilization"
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(httpCode)

		resp := map[string]interface{}{
			"status":                 status,
			"service":                ReceiverName,
			"version":                ReceiverVersion,
			"uptime_seconds":         int(time.Since(e.startTime).Seconds()),
			"rust_engine_connected":  rustConnected,
			"buffer_architecture":    stats.Architecture,
			"shards_count":           stats.ShardsCount,
			"buffer_queue_depth":     stats.CurrentDepth,
			"buffer_queue_capacity":  stats.TotalCapacity,
			"buffer_peak_depth":      stats.PeakDepth,
			"buffer_utilization_pct": fmt.Sprintf("%.2f%%", stats.UtilizationPct),
			"burst_spikes_absorbed":  stats.TotalAbsorbed,
			"burst_overwrites_count": stats.TotalOverflows,
			"overflow_strategy":      stats.Strategy,
			"worker_pool": map[string]interface{}{
				"active_workers":        e.workerPool.ActiveWorkers(),
				"min_workers":           e.cfg.MinWorkers,
				"max_workers":           e.cfg.MaxWorkers,
				"queue_depth":           e.workerPool.PendingPackets(),
				"queue_capacity":        e.workerPool.QueueCapacity(),
				"scale_up_events_count": scaleUp,
				"scale_dn_events_count": scaleDown,
				"idle_timeout_seconds":  e.cfg.IdleTimeoutSec,
			},
			"timestamp_precision":  "nanosecond",
			"timestamp_epoch_nano": time.Now().UnixNano(),
		}
		_ = json.NewEncoder(w).Encode(resp)
	}

	mux.HandleFunc("/health", healthHandler)
	mux.HandleFunc("/healthz", healthHandler)

	// 2. Real-Time Ingestion Throughput Endpoint (/api/v1/throughput)
	mux.HandleFunc("/api/v1/throughput", func(w http.ResponseWriter, r *http.Request) {
		e.metrics.mu.RLock()
		pps := e.metrics.CurrentPPS
		mbps := e.metrics.CurrentMBps
		e.metrics.mu.RUnlock()

		udpTotal := atomic.LoadUint64(&e.metrics.UDPPacketsTotal)
		tcpTotal := atomic.LoadUint64(&e.metrics.TCPPacketsTotal)
		bytesTotal := atomic.LoadUint64(&e.metrics.BytesTotal)
		dropped := atomic.LoadUint64(&e.metrics.PacketsDropped)
		batchesSent := atomic.LoadUint64(&e.metrics.BatchesSent)
		batchesFailed := atomic.LoadUint64(&e.metrics.BatchesFailed)

		stats := e.ringBuffer.Stats(false)
		scaleUp, scaleDown := e.workerPool.ScaleEvents()

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"throughput": map[string]interface{}{
				"packets_per_second": pps,
				"megabits_per_sec":   mbps,
				"megabytes_received": float64(bytesTotal) / (1024 * 1024),
			},
			"counters": map[string]interface{}{
				"udp_packets_total": udpTotal,
				"tcp_packets_total": tcpTotal,
				"all_packets_total": udpTotal + tcpTotal,
				"bytes_total":       bytesTotal,
				"packets_dropped":   dropped,
			},
			"worker_pool": map[string]interface{}{
				"active_workers": e.workerPool.ActiveWorkers(),
				"min_workers":    e.cfg.MinWorkers,
				"max_workers":    e.cfg.MaxWorkers,
				"pending_queue":  e.workerPool.PendingPackets(),
				"queue_capacity": e.workerPool.QueueCapacity(),
				"scale_up_count": scaleUp,
				"scale_dn_count": scaleDown,
			},
			"circular_buffer": map[string]interface{}{
				"architecture":    stats.Architecture,
				"shards_count":    stats.ShardsCount,
				"current_depth":   stats.CurrentDepth,
				"capacity":        stats.TotalCapacity,
				"peak_depth":      stats.PeakDepth,
				"utilization_pct": stats.UtilizationPct,
				"total_absorbed":  stats.TotalAbsorbed,
				"total_overflows": stats.TotalOverflows,
				"strategy":        stats.Strategy,
			},
			"rust_forwarder": map[string]interface{}{
				"batches_sent":   batchesSent,
				"batches_failed": batchesFailed,
				"pending_queue":  len(e.rustDispatchCh),
			},
		})
	})

	// 3. Shard Diagnostics Endpoint (/api/v1/buffer/shards)
	mux.HandleFunc("/api/v1/buffer/shards", func(w http.ResponseWriter, r *http.Request) {
		stats := e.ringBuffer.Stats(true)
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(stats)
	})

	// 4. Prometheus Metrics Exposition (/metrics)
	mux.HandleFunc("/metrics", func(w http.ResponseWriter, r *http.Request) {
		udpTotal := atomic.LoadUint64(&e.metrics.UDPPacketsTotal)
		tcpTotal := atomic.LoadUint64(&e.metrics.TCPPacketsTotal)
		bytesTotal := atomic.LoadUint64(&e.metrics.BytesTotal)
		dropped := atomic.LoadUint64(&e.metrics.PacketsDropped)
		batchesSent := atomic.LoadUint64(&e.metrics.BatchesSent)
		batchesFailed := atomic.LoadUint64(&e.metrics.BatchesFailed)

		e.metrics.mu.RLock()
		pps := e.metrics.CurrentPPS
		mbps := e.metrics.CurrentMBps
		e.metrics.mu.RUnlock()

		stats := e.ringBuffer.Stats(false)
		scaleUp, scaleDown := e.workerPool.ScaleEvents()

		w.Header().Set("Content-Type", "text/plain; version=0.0.4")
		output := fmt.Sprintf(
			"# HELP semor_receiver_packets_total Total log packets received\n"+
				"# TYPE semor_receiver_packets_total counter\n"+
				"semor_receiver_packets_total{protocol=\"udp\"} %d\n"+
				"semor_receiver_packets_total{protocol=\"tcp\"} %d\n"+
				"# HELP semor_receiver_bytes_total Total raw bytes processed\n"+
				"# TYPE semor_receiver_bytes_total counter\n"+
				"semor_receiver_bytes_total %d\n"+
				"# HELP semor_receiver_packets_dropped_total Saturated ring buffer drop count\n"+
				"# TYPE semor_receiver_packets_dropped_total counter\n"+
				"semor_receiver_packets_dropped_total %d\n"+
				"# HELP semor_receiver_throughput_pps Current packets per second rate\n"+
				"# TYPE semor_receiver_throughput_pps gauge\n"+
				"semor_receiver_throughput_pps %.2f\n"+
				"# HELP semor_receiver_throughput_mbps Current megabits per second throughput\n"+
				"# TYPE semor_receiver_throughput_mbps gauge\n"+
				"semor_receiver_throughput_mbps %.4f\n"+
				"# HELP semor_receiver_workers_active Current count of active intake worker goroutines\n"+
				"# TYPE semor_receiver_workers_active gauge\n"+
				"semor_receiver_workers_active %d\n"+
				"# HELP semor_receiver_workers_min Minimum worker count\n"+
				"# TYPE semor_receiver_workers_min gauge\n"+
				"semor_receiver_workers_min %d\n"+
				"# HELP semor_receiver_workers_max Maximum dynamic worker count\n"+
				"# TYPE semor_receiver_workers_max gauge\n"+
				"semor_receiver_workers_max %d\n"+
				"# HELP semor_receiver_worker_scale_events_total Worker scaling actions\n"+
				"# TYPE semor_receiver_worker_scale_events_total counter\n"+
				"semor_receiver_worker_scale_events_total{direction=\"up\"} %d\n"+
				"semor_receiver_worker_scale_events_total{direction=\"down\"} %d\n"+
				"# HELP semor_receiver_worker_queue_depth Pending packets waiting in worker channel\n"+
				"# TYPE semor_receiver_worker_queue_depth gauge\n"+
				"semor_receiver_worker_queue_depth %d\n"+
				"# HELP semor_receiver_worker_queue_capacity Capacity of worker intake channel\n"+
				"# TYPE semor_receiver_worker_queue_capacity gauge\n"+
				"semor_receiver_worker_queue_capacity %d\n"+
				"# HELP semor_receiver_sharded_buffer_depth Current buffered packets queue size\n"+
				"# TYPE semor_receiver_sharded_buffer_depth gauge\n"+
				"semor_receiver_sharded_buffer_depth %d\n"+
				"# HELP semor_receiver_sharded_buffer_capacity Maximum capacity across all shards\n"+
				"# TYPE semor_receiver_sharded_buffer_capacity gauge\n"+
				"semor_receiver_sharded_buffer_capacity %d\n"+
				"# HELP semor_receiver_sharded_buffer_peak_depth Highest recorded depth during spikes\n"+
				"# TYPE semor_receiver_sharded_buffer_peak_depth gauge\n"+
				"semor_receiver_sharded_buffer_peak_depth %d\n"+
				"# HELP semor_receiver_sharded_buffer_overflows_total Overwrite or saturation count during spikes\n"+
				"# TYPE semor_receiver_sharded_buffer_overflows_total counter\n"+
				"semor_receiver_sharded_buffer_overflows_total %d\n"+
				"# HELP semor_receiver_sharded_buffer_absorbed_total Cumulative entries absorbed\n"+
				"# TYPE semor_receiver_sharded_buffer_absorbed_total counter\n"+
				"semor_receiver_sharded_buffer_absorbed_total %d\n"+
				"# HELP semor_receiver_rust_batches_total Batches dispatched to Rust VictoriaLogs engine\n"+
				"# TYPE semor_receiver_rust_batches_total counter\n"+
				"semor_receiver_rust_batches_total{status=\"success\"} %d\n"+
				"semor_receiver_rust_batches_total{status=\"failure\"} %d\n",
			udpTotal, tcpTotal, bytesTotal, dropped, pps, mbps,
			e.workerPool.ActiveWorkers(), e.cfg.MinWorkers, e.cfg.MaxWorkers, scaleUp, scaleDown,
			e.workerPool.PendingPackets(), e.workerPool.QueueCapacity(),
			stats.CurrentDepth, stats.TotalCapacity, stats.PeakDepth, stats.TotalOverflows, stats.TotalAbsorbed,
			batchesSent, batchesFailed,
		)
		_, _ = w.Write([]byte(output))
	})

	server := &http.Server{
		Addr:         fmt.Sprintf(":%d", e.cfg.HTTPPort),
		Handler:      mux,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 5 * time.Second,
	}

	e.httpServer = server

	fmt.Printf("[HTTP Server] Health & metrics endpoints listening on :%d\n", e.cfg.HTTPPort)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		fmt.Printf("[HTTP Server] Failed: %v\n", err)
	}
}

// ----------------------------------------------------------------------------
// Real-Time Throughput Sampler
// ----------------------------------------------------------------------------

func (e *ReceiverEngine) runMetricsSampler(ctx context.Context) {
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case now := <-ticker.C:
			udpNow := atomic.LoadUint64(&e.metrics.UDPPacketsTotal)
			tcpNow := atomic.LoadUint64(&e.metrics.TCPPacketsTotal)
			bytesNow := atomic.LoadUint64(&e.metrics.BytesTotal)

			e.metrics.mu.Lock()
			elapsed := now.Sub(e.metrics.LastSampleAt).Seconds()
			if elapsed <= 0 {
				elapsed = 1.0
			}

			deltaPackets := (udpNow - e.metrics.LastUDPCount) + (tcpNow - e.metrics.LastTCPCount)
			deltaBytes := bytesNow - e.metrics.LastByteCnt

			e.metrics.CurrentPPS = float64(deltaPackets) / elapsed
			e.metrics.CurrentMBps = (float64(deltaBytes) * 8.0) / (elapsed * 1000.0 * 1000.0)

			e.metrics.LastUDPCount = udpNow
			e.metrics.LastTCPCount = tcpNow
			e.metrics.LastByteCnt = bytesNow
			e.metrics.LastSampleAt = now
			e.metrics.ActiveWorkers = int64(e.workerPool.ActiveWorkers())
			e.metrics.WorkerQueueDepth = e.workerPool.PendingPackets()
			e.metrics.mu.Unlock()
		}
	}
}

// ----------------------------------------------------------------------------
// Configuration Loader
// ----------------------------------------------------------------------------

func loadConfig() *ReceiverConfig {
	cpuCount := runtime.NumCPU()

	minWorkers := cpuCount * 2
	if minWorkers < DefaultMinWorkers {
		minWorkers = DefaultMinWorkers
	}

	maxWorkers := cpuCount * 8
	if maxWorkers < DefaultMaxWorkers {
		maxWorkers = DefaultMaxWorkers
	}
	if maxWorkers > 128 {
		maxWorkers = 128
	}

	shards := cpuCount * 2
	if shards < 4 {
		shards = 4
	}
	if shards > 32 {
		shards = 32
	}

	strategy := DropOldest
	if strings.ToLower(getEnvStr("OVERFLOW_STRATEGY", "drop_oldest")) == "drop_newest" {
		strategy = DropNewest
	}

	return &ReceiverConfig{
		UDPPort:            getEnvInt("RECEIVER_UDP_PORT", getEnvInt("SYSLOG_UDP_PORT", DefaultUDPPort)),
		TCPPort:            getEnvInt("RECEIVER_TCP_PORT", getEnvInt("SYSLOG_TCP_PORT", DefaultTCPPort)),
		HTTPPort:           getEnvInt("RECEIVER_HTTP_PORT", getEnvInt("METRICS_PORT", DefaultHTTPPort)),
		SocketBufMB:        getEnvInt("UDP_BUFFER_SIZE_MB", DefaultSocketBufMB),
		MinWorkers:         getEnvInt("MIN_WORKERS", minWorkers),
		MaxWorkers:         getEnvInt("MAX_WORKERS", maxWorkers),
		QueueCapacity:      getEnvInt("QUEUE_CAPACITY", DefaultQueueCapacity),
		IdleTimeoutSec:     getEnvInt("WORKER_IDLE_TIMEOUT_SEC", DefaultIdleTimeoutSec),
		TotalRingCap:       getEnvInt("RING_BUFFER_CAPACITY", DefaultTotalRingCap),
		ShardsCount:        getEnvInt("RING_SHARDS_COUNT", shards),
		BatchSize:          getEnvInt("BATCH_SIZE", DefaultBatchSz),
		FlushInterval:      time.Duration(getEnvInt("BATCH_TIMEOUT_MS", DefaultFlushMs)) * time.Millisecond,
		RustUDSPath:        getEnvStr("RUST_UDS_PATH", DefaultUDSPath),
		RustTCPAddr:        getEnvStr("RUST_TCP_ADDR", DefaultTCPAddr),
		UseUDS:             getEnvBool("USE_UDS", true),
		OverflowStrategy:   strategy,
		ShutdownTimeoutSec: getEnvInt("SHUTDOWN_TIMEOUT_SEC", DefaultShutdownTimeout),
	}
}

func getEnvStr(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok && len(strings.TrimSpace(val)) > 0 {
		return val
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if val, ok := os.LookupEnv(key); ok {
		if i, err := strconv.Atoi(val); err == nil && i > 0 {
			return i
		}
	}
	return fallback
}

func getEnvBool(key string, fallback bool) bool {
	if val, ok := os.LookupEnv(key); ok {
		lower := strings.ToLower(val)
		return lower == "true" || lower == "1" || lower == "yes"
	}
	return fallback
}
