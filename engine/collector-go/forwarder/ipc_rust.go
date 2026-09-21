package forwarder

import (
	"encoding/json"
	"fmt"
	"net"
	"sync"
	"sync/atomic"
	"time"

	"github.com/semor-cyber/semor-collector/config"
	"github.com/semor-cyber/semor-collector/pipeline"
)

// RustIPCForwarder 負責將 Go 收集器批次日誌送交 Rust 核心儲存引擎
type RustIPCForwarder struct {
	cfg          *config.Config
	conn         net.Conn
	mu           sync.Mutex
	isConnected  bool
	totalSent    uint64
	totalBatches uint64
	totalFailed  uint64
}

func NewRustIPCForwarder(cfg *config.Config) *RustIPCForwarder {
	return &RustIPCForwarder{
		cfg: cfg,
	}
}

// Connect 建立與 Rust VictoriaLogs-Style 儲存守護進程之連接
func (f *RustIPCForwarder) Connect() error {
	f.mu.Lock()
	defer f.mu.Unlock()

	var conn net.Conn
	var err error

	if f.cfg.UseUDS {
		conn, err = net.DialTimeout("unix", f.cfg.RustEngineUDSPath, 2*time.Second)
	} else {
		conn, err = net.DialTimeout("tcp", f.cfg.RustEngineTCPAddr, 2*time.Second)
	}

	if err != nil {
		f.isConnected = false
		return fmt.Errorf("無法連線至 Rust 儲存核心: %w", err)
	}

	f.conn = conn
	f.isConnected = true
	return nil
}

// SendBatch 批次寫入日誌資料塊
func (f *RustIPCForwarder) SendBatch(batch *pipeline.LogBatch) error {
	if batch == nil || len(batch.Entries) == 0 {
		return nil
	}

	payload, err := json.Marshal(batch)
	if err != nil {
		return err
	}
	payload = append(payload, '\n') // 以換行符分隔 Frame

	f.mu.Lock()
	defer f.mu.Unlock()

	if !f.isConnected || f.conn == nil {
		// 嘗試即時自動重連
		if err := f.reconnectLocked(); err != nil {
			atomic.AddUint64(&f.totalFailed, uint64(len(batch.Entries)))
			return err
		}
	}

	// 設定 3 秒寫入超時，避免 I/O 阻塞整個管線
	_ = f.conn.SetWriteDeadline(time.Now().Add(3 * time.Second))
	_, err = f.conn.Write(payload)
	if err != nil {
		f.isConnected = false
		_ = f.conn.Close()
		atomic.AddUint64(&f.totalFailed, uint64(len(batch.Entries)))
		return fmt.Errorf("批次推送至 Rust 儲存引擎失敗: %w", err)
	}

	atomic.AddUint64(&f.totalSent, uint64(len(batch.Entries)))
	atomic.AddUint64(&f.totalBatches, 1)
	return nil
}

// DeployRules 將來自前台標註的 Regex 規則以 JSON 下發至 Rust 儲存核心
func (f *RustIPCForwarder) DeployRules(rawRulesJSON []byte) error {
	if len(rawRulesJSON) == 0 {
		return nil
	}

	payload := make([]byte, len(rawRulesJSON)+1)
	copy(payload, rawRulesJSON)
	payload[len(rawRulesJSON)] = '\n' // 換行符分隔 Frame

	f.mu.Lock()
	defer f.mu.Unlock()

	if !f.isConnected || f.conn == nil {
		if err := f.reconnectLocked(); err != nil {
			return fmt.Errorf("無法建立 UDS 連線以部署 Regex 規則: %w", err)
		}
	}

	_ = f.conn.SetWriteDeadline(time.Now().Add(3 * time.Second))
	_, err := f.conn.Write(payload)
	if err != nil {
		f.isConnected = false
		_ = f.conn.Close()
		return fmt.Errorf("透過 UDS 下發 Regex 規則失敗: %w", err)
	}

	return nil
}

func (f *RustIPCForwarder) reconnectLocked() error {
	var conn net.Conn
	var err error

	if f.cfg.UseUDS {
		conn, err = net.DialTimeout("unix", f.cfg.RustEngineUDSPath, 1*time.Second)
	} else {
		conn, err = net.DialTimeout("tcp", f.cfg.RustEngineTCPAddr, 1*time.Second)
	}

	if err != nil {
		f.isConnected = false
		return err
	}

	f.conn = conn
	f.isConnected = true
	return nil
}

// Telemetry 回報即時傳輸計量給 UI
func (f *RustIPCForwarder) Telemetry() (sent uint64, batches uint64, failed uint64, isConn bool) {
	return atomic.LoadUint64(&f.totalSent),
		atomic.LoadUint64(&f.totalBatches),
		atomic.LoadUint64(&f.totalFailed),
		f.isConnected
}
