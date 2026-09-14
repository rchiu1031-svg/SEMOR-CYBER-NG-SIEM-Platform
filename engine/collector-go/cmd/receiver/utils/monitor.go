package utils

import (
	"context"
	"fmt"
	"math"
	"sync"
	"sync/atomic"
	"time"
)

// FillRateAlertSeverity indicates the severity level of a fill-rate bottleneck anomaly
type FillRateAlertSeverity string

const (
	SeverityNormal   FillRateAlertSeverity = "NORMAL"
	SeverityInfo     FillRateAlertSeverity = "INFO"
	SeverityWarning  FillRateAlertSeverity = "WARNING"
	SeverityCritical FillRateAlertSeverity = "CRITICAL"
)

// BottleneckDiagnosis provides actionable root-cause analysis before saturation
type BottleneckDiagnosis struct {
	Timestamp            time.Time             `json:"timestamp"`
	Severity             FillRateAlertSeverity `json:"severity"`
	FillRateEPS          float64               `json:"fill_rate_eps"`          // Items/sec being ingested
	DrainRateEPS         float64               `json:"drain_rate_eps"`         // Items/sec being consumed by workers
	NetAccumulationRate  float64               `json:"net_accumulation_rate"`  // fill_rate - drain_rate
	FillVelocityRatio    float64               `json:"fill_velocity_ratio"`    // fill_rate / max(1, drain_rate)
	CurrentDepth         int                   `json:"current_depth"`
	TotalCapacity        int                   `json:"total_capacity"`
	UtilizationPct       float64               `json:"utilization_pct"`
	WorkerSaturationPct  float64               `json:"worker_saturation_pct"`
	WorkerSaturationThresh float64             `json:"worker_saturation_thresh"`
	TimeToSaturationSec  float64               `json:"time_to_saturation_sec"` // Estimated seconds until 100% capacity at current fill-rate
	ActiveWorkers        int                   `json:"active_workers"`
	MaxWorkers           int                   `json:"max_workers"`
	IsEarlyBottleneck    bool                  `json:"is_early_bottleneck"`    // True if fill-rate indicates danger BEFORE worker pool saturates
	Recommendation       string                `json:"recommendation"`
}

// CircularBufferProvider abstracts depth and capacity queries from any circular buffer
type CircularBufferProvider interface {
	TotalDepth() int
	TotalCapacity() int
}

// WorkerPoolProvider abstracts worker pool active count and max worker limits
type WorkerPoolProvider interface {
	ActiveWorkers() int
	MaxWorkers() int
}

// MonitorConfig defines configuration parameters for real-time fill-rate evaluation
type MonitorConfig struct {
	SampleInterval            time.Duration // Sampling window (e.g., 200ms - 1s)
	WindowSlots               int           // Number of rolling window history slots (e.g. 10)
	WorkerSaturationThreshold float64       // e.g. 0.80 (80% worker pool utilization)
	HighWatermarkRatio        float64       // e.g. 0.70 (70% buffer depth threshold)
	SurgeVelocityThreshold    float64       // e.g. 1.25 (Fill rate > 125% of Drain rate triggers early warning)
}

// DefaultMonitorConfig returns production defaults tuned for high-throughput packet ingest
func DefaultMonitorConfig() MonitorConfig {
	return MonitorConfig{
		SampleInterval:            250 * time.Millisecond,
		WindowSlots:               12,   // 12 * 250ms = 3.0s rolling moving average
		WorkerSaturationThreshold: 80.0, // 80% worker pool saturation threshold
		HighWatermarkRatio:        75.0, // 75% buffer capacity limit
		SurgeVelocityThreshold:    1.25, // Fill rate 25% faster than drain rate
	}
}

// BufferSample stores a single observation snapshot
type BufferSample struct {
	Timestamp      time.Time
	TotalAbsorbed  uint64
	TotalDrained   uint64
	CurrentDepth   int
	TotalCapacity  int
	ActiveWorkers  int
	MaxWorkers     int
}

// BufferFillRateMonitor calculates real-time fill-rate, drain-rate, and velocity ratios
// of the circular buffer, predicting buffer exhaustion before worker pool saturation occurs.
type BufferFillRateMonitor struct {
	mu           sync.RWMutex
	cfg          MonitorConfig
	bufProvider  CircularBufferProvider
	poolProvider WorkerPoolProvider

	// Atomic telemetry metrics for lock-free reader access
	atomicFillRate     uint64 // Encoded as math.Float64bits
	atomicDrainRate    uint64 // Encoded as math.Float64bits
	atomicNetRate      uint64 // Encoded as math.Float64bits
	atomicTimeToFullMs int64  // Milliseconds to buffer saturation (-1 if stable/draining)
	atomicSeverity     int32  // Enum mapped to int32

	// Cumulative counters for differential rate calculations
	cumulativePushed  uint64
	cumulativeDrained uint64

	// Ring buffer of historical sample points for moving-average smoothing
	samples      []BufferSample
	sampleIdx    int
	sampleCount  int

	// Latest evaluated diagnosis
	lastDiagnosis BottleneckDiagnosis

	// Alert listener callbacks
	alertListeners []func(BottleneckDiagnosis)

	ctx    context.Context
	cancel context.CancelFunc
	wg     sync.WaitGroup
}

// NewBufferFillRateMonitor initializes a real-time fill-rate bottleneck detector
func NewBufferFillRateMonitor(
	buf CircularBufferProvider,
	pool WorkerPoolProvider,
	cfg MonitorConfig,
) *BufferFillRateMonitor {
	if cfg.SampleInterval <= 0 {
		cfg.SampleInterval = 250 * time.Millisecond
	}
	if cfg.WindowSlots <= 0 {
		cfg.WindowSlots = 12
	}
	if cfg.WorkerSaturationThreshold <= 0 {
		cfg.WorkerSaturationThreshold = 80.0
	}
	if cfg.HighWatermarkRatio <= 0 {
		cfg.HighWatermarkRatio = 75.0
	}
	if cfg.SurgeVelocityThreshold <= 0 {
		cfg.SurgeVelocityThreshold = 1.25
	}

	ctx, cancel := context.WithCancel(context.Background())

	m := &BufferFillRateMonitor{
		cfg:          cfg,
		bufProvider:  buf,
		poolProvider: pool,
		samples:      make([]BufferSample, cfg.WindowSlots),
		ctx:          ctx,
		cancel:       cancel,
	}

	// Set initial values
	atomic.StoreInt64(&m.atomicTimeToFullMs, -1)

	return m
}

// RecordPush notes that N items have been admitted to the circular buffer
func (m *BufferFillRateMonitor) RecordPush(count uint64) {
	atomic.AddUint64(&m.cumulativePushed, count)
}

// RecordDrain notes that N items have been drained from the circular buffer
func (m *BufferFillRateMonitor) RecordDrain(count uint64) {
	atomic.AddUint64(&m.cumulativeDrained, count)
}

// RegisterAlertListener attaches a callback triggered when severe bottleneck anomalies are detected
func (m *BufferFillRateMonitor) RegisterAlertListener(cb func(BottleneckDiagnosis)) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.alertListeners = append(m.alertListeners, cb)
}

// Start spawns the background sampling and real-time fill-rate calculation loop
func (m *BufferFillRateMonitor) Start() {
	m.wg.Add(1)
	go m.sampleLoop()
}

// Stop terminates the monitoring loop cleanly
func (m *BufferFillRateMonitor) Stop() {
	m.cancel()
	m.wg.Wait()
}

// sampleLoop captures periodic depth snapshots and calculates rates
func (m *BufferFillRateMonitor) sampleLoop() {
	defer m.wg.Done()
	ticker := time.NewTicker(m.cfg.SampleInterval)
	defer ticker.Stop()

	for {
		select {
		case <-m.ctx.Done():
			return
		case now := <-ticker.C:
			m.evaluate(now)
		}
	}
}

// evaluate takes an instantaneous snapshot and computes the differential fill-rate
func (m *BufferFillRateMonitor) evaluate(now time.Time) {
	depth := 0
	capacity := 1
	if m.bufProvider != nil {
		depth = m.bufProvider.TotalDepth()
		capacity = m.bufProvider.TotalCapacity()
		if capacity <= 0 {
			capacity = 1
		}
	}

	activeWorkers := 0
	maxWorkers := 1
	if m.poolProvider != nil {
		activeWorkers = m.poolProvider.ActiveWorkers()
		maxWorkers = m.poolProvider.MaxWorkers()
		if maxWorkers <= 0 {
			maxWorkers = 1
		}
	}

	pushed := atomic.LoadUint64(&m.cumulativePushed)
	drained := atomic.LoadUint64(&m.cumulativeDrained)

	currentSample := BufferSample{
		Timestamp:     now,
		TotalAbsorbed: pushed,
		TotalDrained:  drained,
		CurrentDepth:  depth,
		TotalCapacity: capacity,
		ActiveWorkers: activeWorkers,
		MaxWorkers:    maxWorkers,
	}

	m.mu.Lock()

	// Store in ring buffer of samples
	prevIdx := (m.sampleIdx - 1 + m.cfg.WindowSlots) % m.cfg.WindowSlots
	hasPrev := m.sampleCount > 0
	prevSample := m.samples[prevIdx]

	m.samples[m.sampleIdx] = currentSample
	m.sampleIdx = (m.sampleIdx + 1) % m.cfg.WindowSlots
	if m.sampleCount < m.cfg.WindowSlots {
		m.sampleCount++
	}

	m.mu.Unlock()

	if !hasPrev {
		return
	}

	// Calculate delta duration
	elapsedSec := now.Sub(prevSample.Timestamp).Seconds()
	if elapsedSec <= 0.001 {
		elapsedSec = m.cfg.SampleInterval.Seconds()
	}

	// 1. Calculate Instantaneous & Moving Rates
	var fillRate float64
	var drainRate float64

	// If explicit Push/Drain counters are wired, use differential counters;
	// otherwise, approximate from depth change + known worker throughput
	if pushed > 0 || drained > 0 {
		deltaPushed := float64(pushed - prevSample.TotalAbsorbed)
		deltaDrained := float64(drained - prevSample.TotalDrained)
		fillRate = deltaPushed / elapsedSec
		drainRate = deltaDrained / elapsedSec
	} else {
		// Fallback: derive net depth velocity
		deltaDepth := float64(depth - prevSample.CurrentDepth)
		netVelocity := deltaDepth / elapsedSec
		// If buffer grows, fillRate exceeds drainRate
		drainRate = float64(activeWorkers) * 500.0 // Estimated baseline worker capacity
		fillRate = drainRate + netVelocity
		if fillRate < 0 {
			fillRate = 0
		}
	}

	netRate := fillRate - drainRate
	var velocityRatio float64
	if drainRate > 0 {
		velocityRatio = fillRate / drainRate
	} else if fillRate > 0 {
		velocityRatio = 999.0
	} else {
		velocityRatio = 1.0
	}

	// 2. Buffer Utilization & Worker Pool Saturation
	utilizationPct := (float64(depth) / float64(capacity)) * 100.0
	workerSaturationPct := (float64(activeWorkers) / float64(maxWorkers)) * 100.0

	// 3. Time To Saturation (TTS) in seconds
	// Headroom = remaining buffer slots before 100% capacity
	remainingSlots := capacity - depth
	var timeToSaturationSec float64 = -1.0
	if netRate > 0 && remainingSlots > 0 {
		timeToSaturationSec = float64(remainingSlots) / netRate
	} else if remainingSlots <= 0 {
		timeToSaturationSec = 0.0
	}

	// 4. Bottleneck & Threat Evaluation
	// EARLY BOTTLENECK CONDITION:
	// A bottleneck is developing when the circular buffer fill-rate significantly outpaces
	// the drain rate (velocityRatio > threshold AND netRate > 0), EVEN BEFORE the worker
	// pool has reached its max saturation threshold (e.g. Workers at 50% but buffer rising fast).
	isEarlyBottleneck := false
	severity := SeverityNormal
	recommendation := "Pipeline in dynamic equilibrium. Ingestion and drain rates balanced."

	if workerSaturationPct >= m.cfg.WorkerSaturationThreshold && utilizationPct >= m.cfg.HighWatermarkRatio {
		severity = SeverityCritical
		recommendation = fmt.Sprintf("CRITICAL: Worker pool saturated (%.1f%%) and circular buffer filling (%.1f%%). Triggering backpressure & dropping policies.",
			workerSaturationPct, utilizationPct)
	} else if netRate > 500 && velocityRatio >= m.cfg.SurgeVelocityThreshold {
		// Fill rate is outpacing drain rate before workers hit saturation!
		isEarlyBottleneck = true
		if timeToSaturationSec > 0 && timeToSaturationSec < 5.0 {
			severity = SeverityCritical
			recommendation = fmt.Sprintf("EARLY BOTTLENECK ALERT: Buffer fill-rate (%.0f EPS) outpaces drain-rate (%.0f EPS, %.2fx surge). Buffer will overflow in %.1fs BEFORE worker pool reaches saturation!",
				fillRate, drainRate, velocityRatio, timeToSaturationSec)
		} else if timeToSaturationSec > 0 && timeToSaturationSec < 15.0 {
			severity = SeverityWarning
			recommendation = fmt.Sprintf("PRE-SATURATION BOTTLENECK: High fill-rate velocity (%.2fx). Worker pool at %.1f%% (under %.1f%% threshold), but buffer head-room depleting in %.1fs. Scaling workers preemptively.",
				velocityRatio, workerSaturationPct, m.cfg.WorkerSaturationThreshold, timeToSaturationSec)
		} else {
			severity = SeverityInfo
			recommendation = fmt.Sprintf("TRAFFIC SPIKE DETECTED: Fill rate (%.0f EPS) is %.2fx of drain rate. Monitoring headroom.",
				fillRate, velocityRatio)
		}
	} else if utilizationPct > 60.0 && workerSaturationPct < m.cfg.WorkerSaturationThreshold {
		// Buffer is deep, but workers are NOT saturated -> indicates a worker dispatch / scheduling lag or lock contention!
		isEarlyBottleneck = true
		severity = SeverityWarning
		recommendation = fmt.Sprintf("LOCK/SCHEDULER BOTTLENECK: Buffer depth at %.1f%% while worker pool saturation is only %.1f%%. Worker lock contention or micro-batch dispatch delay detected.",
			utilizationPct, workerSaturationPct)
	}

	diagnosis := BottleneckDiagnosis{
		Timestamp:              now,
		Severity:               severity,
		FillRateEPS:            math.Round(fillRate*10) / 10,
		DrainRateEPS:           math.Round(drainRate*10) / 10,
		NetAccumulationRate:    math.Round(netRate*10) / 10,
		FillVelocityRatio:      math.Round(velocityRatio*100) / 100,
		CurrentDepth:           depth,
		TotalCapacity:          capacity,
		UtilizationPct:         math.Round(utilizationPct*100) / 100,
		WorkerSaturationPct:    math.Round(workerSaturationPct*10) / 10,
		WorkerSaturationThresh: m.cfg.WorkerSaturationThreshold,
		TimeToSaturationSec:    math.Round(timeToSaturationSec*10) / 10,
		ActiveWorkers:          activeWorkers,
		MaxWorkers:             maxWorkers,
		IsEarlyBottleneck:      isEarlyBottleneck,
		Recommendation:         recommendation,
	}

	// Update atomic cache
	atomic.StoreUint64(&m.atomicFillRate, math.Float64bits(diagnosis.FillRateEPS))
	atomic.StoreUint64(&m.atomicDrainRate, math.Float64bits(diagnosis.DrainRateEPS))
	atomic.StoreUint64(&m.atomicNetRate, math.Float64bits(diagnosis.NetAccumulationRate))
	if timeToSaturationSec >= 0 {
		atomic.StoreInt64(&m.atomicTimeToFullMs, int64(timeToSaturationSec*1000))
	} else {
		atomic.StoreInt64(&m.atomicTimeToFullMs, -1)
	}

	m.mu.Lock()
	m.lastDiagnosis = diagnosis
	listeners := make([]func(BottleneckDiagnosis), len(m.alertListeners))
	copy(listeners, m.alertListeners)
	m.mu.Unlock()

	// Notify listeners if severity is Warning or Critical
	if severity == SeverityWarning || severity == SeverityCritical {
		for _, listener := range listeners {
			go listener(diagnosis)
		}
	}
}

// CurrentDiagnosis returns the latest evaluated bottleneck diagnosis
func (m *BufferFillRateMonitor) CurrentDiagnosis() BottleneckDiagnosis {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.lastDiagnosis
}

// FillRate returns instantaneous fill-rate in EPS without locking
func (m *BufferFillRateMonitor) FillRate() float64 {
	bits := atomic.LoadUint64(&m.atomicFillRate)
	return math.Float64frombits(bits)
}

// DrainRate returns instantaneous drain-rate in EPS without locking
func (m *BufferFillRateMonitor) DrainRate() float64 {
	bits := atomic.LoadUint64(&m.atomicDrainRate)
	return math.Float64frombits(bits)
}

// TimeToSaturationSec returns seconds until buffer overflows, or -1 if stable
func (m *BufferFillRateMonitor) TimeToSaturationSec() float64 {
	ms := atomic.LoadInt64(&m.atomicTimeToFullMs)
	if ms < 0 {
		return -1.0
	}
	return float64(ms) / 1000.0
}
