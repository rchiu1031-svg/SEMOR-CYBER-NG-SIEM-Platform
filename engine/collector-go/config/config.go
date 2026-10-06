package config

import (
	"os"
	"strconv"
)

// Config 定義 SEMOR Go 收集器所有可配置參數
type Config struct {
	// Syslog 接收埠設定
	SyslogUDPPort         int
	SyslogTCPPort         int
	SyslogTLSPort         int // RFC 5425 Syslog over TLS (預設 6514)
	UDPBufferSize         int // 放大核心 Buffer 防止爆發遺失 (預設 32MB)
	RateLimitEPSPerSource int // 單一來源 IP 限速 EPS (0 代表不限速，預設 50000)

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

	// VictoriaLogs HTTP 上游轉發與指數退避重試配置
	EnableVictoriaLogsHTTP bool   // 是否啟動 HTTP 寫入轉發至 VictoriaLogs (預設 true)
	VictoriaLogsURL        string // VictoriaLogs HTTP POST 位址 (如 http://localhost:9428/insert/jsonline)
	VictoriaLogsAccountID  string // 帳號 ID (Multi-tenant 支援)
	VictoriaLogsProjectID  string // 專案 ID
	RetryInitialMs         int    // 初始退避毫秒 (預設 200ms)
	RetryMaxMs             int    // 最大退避毫秒 (預設 15000ms)
	RetryMaxAttempts       int    // 最大就地重試次數 (預設 5 次)

	// 前端 UI 平台控制與設定回呼
	WebUIAPIURL string

	// NDR (Network Detection & Response) 網路流量與探針設定
	NDREnabled        bool // 預設 true
	NDRNetFlowUDPPort int  // NetFlow v5 / IPFIX UDP 監聽埠 (預設 2055)
	NDRsFlowUDPPort   int  // sFlow v5 UDP 監聽埠 (預設 6343)
}

func LoadConfig() *Config {
	return &Config{
		SyslogUDPPort:          getEnvInt("SYSLOG_UDP_PORT", 5140),
		SyslogTCPPort:          getEnvInt("SYSLOG_TCP_PORT", 5140),
		SyslogTLSPort:          getEnvInt("SYSLOG_TLS_PORT", 6514),
		UDPBufferSize:          getEnvInt("UDP_BUFFER_SIZE_MB", 32) * 1024 * 1024,
		RateLimitEPSPerSource:  getEnvInt("RATE_LIMIT_EPS_PER_SOURCE", 50000),
		HTTPPort:               getEnvInt("COLLECTOR_HTTP_PORT", 8080),
		BatchSize:              getEnvInt("BATCH_SIZE", 2000),
		BatchTimeout:           getEnvInt("BATCH_TIMEOUT_MS", 250),
		ChannelCap:             getEnvInt("CHANNEL_CAPACITY", 50000),
		RustEngineUDSPath:      getEnvString("RUST_UDS_PATH", "/tmp/semor_rust.sock"),
		RustEngineTCPAddr:      getEnvString("RUST_TCP_ADDR", "127.0.0.1:9527"),
		UseUDS:                 getEnvBool("USE_UDS", true),
		EnableVictoriaLogsHTTP: getEnvBool("ENABLE_VICTORIALOGS_HTTP", true),
		VictoriaLogsURL:        getEnvString("VICTORIALOGS_URL", "http://localhost:9428/insert/jsonline"),
		VictoriaLogsAccountID:  getEnvString("VICTORIALOGS_ACCOUNT_ID", "0"),
		VictoriaLogsProjectID:  getEnvString("VICTORIALOGS_PROJECT_ID", "0"),
		RetryInitialMs:         getEnvInt("RETRY_INITIAL_MS", 200),
		RetryMaxMs:             getEnvInt("RETRY_MAX_MS", 15000),
		RetryMaxAttempts:       getEnvInt("RETRY_MAX_ATTEMPTS", 5),
		WebUIAPIURL:            getEnvString("WEB_UI_URL", "http://localhost:3000"),
		NDREnabled:             getEnvBool("NDR_ENABLED", true),
		NDRNetFlowUDPPort:      getEnvInt("NDR_NETFLOW_UDP_PORT", 2055),
		NDRsFlowUDPPort:        getEnvInt("NDR_SFLOW_UDP_PORT", 6343),
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
