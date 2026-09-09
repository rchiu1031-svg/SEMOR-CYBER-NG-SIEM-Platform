package config

import (
	"os"
	"strconv"
)

// Config 定義 SEMOR Go 收集器所有可配置參數
type Config struct {
	// Syslog 接收埠設定
	SyslogUDPPort int
	SyslogTCPPort int
	UDPBufferSize int // 放大核心 Buffer 防止爆發遺失 (預設 32MB)

	// HTTP 批次接收服務
	HTTPPort int

	// 轉發緩衝區設定
	BatchSize    int // 每批次筆數 (預設 2,000)
	BatchTimeout int // 毫秒 (預設 250ms)
	ChannelCap   int // 記憶體佇列容量 (預設 50,000)

	// 對接底層 Rust VictoriaLogs 儲存核心通訊位址
	RustEngineUDSPath string // Unix Domain Socket 位址 (如 /tmp/semor_rust.sock)
	RustEngineTCPAddr string // TCP 備援位址 (如 127.0.0.1:9527)
	UseUDS            bool

	// 前端 UI 平台控制與設定回呼
	WebUIAPIURL string
}

func LoadConfig() *Config {
	return &Config{
		SyslogUDPPort:     getEnvInt("SYSLOG_UDP_PORT", 5140),
		SyslogTCPPort:     getEnvInt("SYSLOG_TCP_PORT", 5140),
		UDPBufferSize:     getEnvInt("UDP_BUFFER_SIZE_MB", 32) * 1024 * 1024,
		HTTPPort:          getEnvInt("COLLECTOR_HTTP_PORT", 8080),
		BatchSize:         getEnvInt("BATCH_SIZE", 2000),
		BatchTimeout:      getEnvInt("BATCH_TIMEOUT_MS", 250),
		ChannelCap:        getEnvInt("CHANNEL_CAPACITY", 50000),
		RustEngineUDSPath: getEnvString("RUST_UDS_PATH", "/tmp/semor_rust.sock"),
		RustEngineTCPAddr: getEnvString("RUST_TCP_ADDR", "127.0.0.1:9527"),
		UseUDS:            getEnvBool("USE_UDS", true),
		WebUIAPIURL:       getEnvString("WEB_UI_URL", "http://localhost:3000"),
	}
}

func getEnvString(key, fallback string) string {
	if v, exists := os.LookupEnv(key); exists {
		return v
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if v, exists := os.LookupEnv(key); exists {
		if i, err := strconv.Atoi(v); err == nil {
			return i
		}
	}
	return fallback
}

func getEnvBool(key string, fallback bool) bool {
	if v, exists := os.LookupEnv(key); exists {
		if b, err := strconv.ParseBool(v); err == nil {
			return b
		}
	}
	return fallback
}
