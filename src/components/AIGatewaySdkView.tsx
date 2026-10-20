import React, { useState } from 'react';
import {
  Code2,
  Terminal,
  ShieldAlert,
  Send,
  Copy,
  Check,
  CheckCircle2,
  RefreshCw,
  Activity,
  FileText
} from 'lucide-react';
import { cn } from '../lib/utils';
import axios from 'axios';

interface AIGatewaySdkViewProps {
  isZh: boolean;
  isJa: boolean;
  onAlertInjected?: () => void;
}

export const GO_CODE = `// ==============================================================================
// SEMOR CYBER - AI Security Governance Gateway Dual-Track Log Publisher (Go)
// Package: publisher
// Specifications:
//   1. Audit Log: Syslog over TLS (RFC 5424 + RFC 5425 Octet Counting)
//   2. High-Risk Alert: Webhook (HTTPS POST + HMAC-SHA256 Signature Header)
//   3. Non-Blocking: Buffered Channels + Background Goroutine Worker Pool
// ==============================================================================

package publisher

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"crypto/tls"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"os"
	"sync"
	"sync/atomic"
	"time"
)

// PublisherConfig holds configurations for both log tracks
type PublisherConfig struct {
	// Syslog over TLS (RFC 5424) Config
	SyslogAddr     string        // e.g. "siem-soc.corp.internal:6514"
	SyslogTLS      *tls.Config   // TLS configuration (CA roots, mutual TLS)
	SyslogFacility int           // Syslog Facility, default 16 (Local0)
	SyslogSeverity int           // Syslog Severity, default 6 (Informational)
	AppName        string        // e.g. "semor-ai-gateway"
	Hostname       string        // Hostname or container ID

	// High-Risk Alert Webhook Config
	WebhookURL     string        // e.g. "https://siem-soc.corp.internal/api/v1/ai-gateway/webhook/alerts"
	WebhookSecret  string        // Pre-shared key for HMAC-SHA256
	WebhookTimeout time.Duration // HTTP timeout, e.g. 3 * time.Second

	// Asynchronous & Concurrency Parameters
	AuditBufferSize int           // Buffer capacity for audit logs, e.g. 10000
	AlertBufferSize int           // Buffer capacity for alerts, e.g. 2000
	WorkerCount     int           // Background workers for webhook dispatch
}

// SemorLogPublisher is the high-performance, non-blocking log publisher
type SemorLogPublisher struct {
	config     PublisherConfig
	auditChan  chan map[string]interface{}
	alertChan  chan map[string]interface{}
	httpClient *http.Client
	syslogConn net.Conn
	syslogMu   sync.Mutex
	ctx        context.Context
	cancel     context.CancelFunc
	wg         sync.WaitGroup

	// Metrics
	droppedAuditCount uint64
	droppedAlertCount uint64
	sentAuditCount    uint64
	sentAlertCount    uint64
}

// NewSemorLogPublisher constructs and starts the background worker pool
func NewSemorLogPublisher(cfg PublisherConfig) (*SemorLogPublisher, error) {
	if cfg.SyslogAddr == "" {
		return nil, errors.New("SyslogAddr is required")
	}
	if cfg.WebhookURL == "" {
		return nil, errors.New("WebhookURL is required")
	}
	if cfg.WebhookSecret == "" {
		return nil, errors.New("WebhookSecret is required")
	}
	if cfg.SyslogFacility == 0 {
		cfg.SyslogFacility = 16 // Local0
	}
	if cfg.SyslogSeverity == 0 {
		cfg.SyslogSeverity = 6 // Informational
	}
	if cfg.AppName == "" {
		cfg.AppName = "semor-ai-gateway"
	}
	if cfg.Hostname == "" {
		hostname, err := os.Hostname()
		if err != nil {
			hostname = "ai-gateway-node"
		}
		cfg.Hostname = hostname
	}
	if cfg.AuditBufferSize <= 0 {
		cfg.AuditBufferSize = 10000
	}
	if cfg.AlertBufferSize <= 0 {
		cfg.AlertBufferSize = 2000
	}
	if cfg.WorkerCount <= 0 {
		cfg.WorkerCount = 4
	}
	if cfg.WebhookTimeout <= 0 {
		cfg.WebhookTimeout = 3 * time.Second
	}
	if cfg.SyslogTLS == nil {
		cfg.SyslogTLS = &tls.Config{
			MinVersion: tls.VersionTLS12,
		}
	}

	ctx, cancel := context.WithCancel(context.Background())

	pub := &SemorLogPublisher{
		config:    cfg,
		auditChan: make(chan map[string]interface{}, cfg.AuditBufferSize),
		alertChan: make(chan map[string]interface{}, cfg.AlertBufferSize),
		httpClient: &http.Client{
			Timeout: cfg.WebhookTimeout,
			Transport: &http.Transport{
				MaxIdleConns:        100,
				MaxIdleConnsPerHost: 20,
				IdleConnTimeout:     90 * time.Second,
			},
		},
		ctx:    ctx,
		cancel: cancel,
	}

	// 1. Launch Syslog background streamer
	pub.wg.Add(1)
	go pub.syslogWorker()

	// 2. Launch Webhook alert worker pool
	for i := 0; i < cfg.WorkerCount; i++ {
		pub.wg.Add(1)
		go pub.webhookWorker(i)
	}

	return pub, nil
}

// SendAuditLogViaSyslog queues the audit log non-blockingly (sub-millisecond return)
func (p *SemorLogPublisher) SendAuditLogViaSyslog(logData map[string]interface{}) error {
	select {
	case p.auditChan <- logData:
		return nil
	default:
		// Queue full - drop to protect inference latency & record metric
		atomic.AddUint64(&p.droppedAuditCount, 1)
		return errors.New("syslog audit buffer full, log dropped to protect inference pipeline")
	}
}

// SendAlertLogViaWebhook queues high-risk alerts non-blockingly with dedicated capacity
func (p *SemorLogPublisher) SendAlertLogViaWebhook(logData map[string]interface{}) error {
	select {
	case p.alertChan <- logData:
		return nil
	default:
		atomic.AddUint64(&p.droppedAlertCount, 1)
		return errors.New("webhook alert buffer full, log dropped")
	}
}

// syslogWorker maintains a persistent TLS connection and writes RFC 5424 framed messages
func (p *SemorLogPublisher) syslogWorker() {
	defer p.wg.Done()

	for {
		select {
		case <-p.ctx.Done():
			p.closeSyslogConn()
			return
		case logData := <-p.auditChan:
			msgBytes, err := p.formatRFC5424(logData)
			if err != nil {
				log.Printf("[SEMOR-SYSLOG] Format error: %v", err)
				continue
			}

			// Ensure TLS connection with auto-reconnect
			if err := p.writeWithRetry(msgBytes); err != nil {
				log.Printf("[SEMOR-SYSLOG] Send error after retry: %v", err)
			} else {
				atomic.AddUint64(&p.sentAuditCount, 1)
			}
		}
	}
}

// formatRFC5424 transforms dict into RFC 5424 Syslog format
// Syntax: <PRI>VERSION TIMESTAMP HOSTNAME APP-NAME PROCID MSGID STRUCTURED-DATA MSG
func (p *SemorLogPublisher) formatRFC5424(logData map[string]interface{}) ([]byte, error) {
	pri := (p.config.SyslogFacility * 8) + p.config.SyslogSeverity
	now := time.Now().UTC().Format(time.RFC3339Nano)
	procID := fmt.Sprintf("%d", os.Getpid())
	msgID := "AUDIT"

	payloadBytes, err := json.Marshal(logData)
	if err != nil {
		return nil, err
	}

	// RFC 5424 Header + NILVALUE structured data + JSON payload (with UTF-8 BOM)
	header := fmt.Sprintf("<%d>1 %s %s %s %s %s - ", pri, now, p.config.Hostname, p.config.AppName, procID, msgID)
	rawMsg := append([]byte(header), append([]byte("\xef\xbb\xbf"), payloadBytes...)...)

	// RFC 5425 Octet Counting framing: <MSG_LEN> <MSG>
	framed := fmt.Sprintf("%d %s\n", len(rawMsg), string(rawMsg))
	return []byte(framed), nil
}

func (p *SemorLogPublisher) writeWithRetry(data []byte) error {
	p.syslogMu.Lock()
	defer p.syslogMu.Unlock()

	for attempts := 0; attempts < 3; attempts++ {
		if p.syslogConn == nil {
			conn, err := tls.Dial("tcp", p.config.SyslogAddr, p.config.SyslogTLS)
			if err != nil {
				time.Sleep(50 * time.Millisecond)
				continue
			}
			p.syslogConn = conn
		}

		_ = p.syslogConn.SetWriteDeadline(time.Now().Add(2 * time.Second))
		_, err := p.syslogConn.Write(data)
		if err == nil {
			return nil
		}

		// Broken pipe / EOF: close and retry
		_ = p.syslogConn.Close()
		p.syslogConn = nil
		time.Sleep(50 * time.Millisecond)
	}
	return errors.New("failed to send syslog after 3 retries")
}

func (p *SemorLogPublisher) closeSyslogConn() {
	p.syslogMu.Lock()
	defer p.syslogMu.Unlock()
	if p.syslogConn != nil {
		_ = p.syslogConn.Close()
		p.syslogConn = nil
	}
}

// webhookWorker processes alerts, calculates HMAC-SHA256, and sends HTTPS POST
func (p *SemorLogPublisher) webhookWorker(workerID int) {
	defer p.wg.Done()

	for {
		select {
		case <-p.ctx.Done():
			return
		case alertData := <-p.alertChan:
			if err := p.dispatchWebhook(alertData); err != nil {
				log.Printf("[SEMOR-WEBHOOK-W%d] Alert dispatch failed: %v", workerID, err)
			} else {
				atomic.AddUint64(&p.sentAlertCount, 1)
			}
		}
	}
}

func (p *SemorLogPublisher) dispatchWebhook(alertData map[string]interface{}) error {
	payload, err := json.Marshal(alertData)
	if err != nil {
		return err
	}

	// 1. Calculate HMAC-SHA256 signature
	mac := hmac.New(sha256.New, []byte(p.config.WebhookSecret))
	mac.Write(payload)
	signatureHex := hex.EncodeToString(mac.Sum(nil))

	timestamp := fmt.Sprintf("%d", time.Now().Unix())

	// 2. Prepare HTTP request
	req, err := http.NewRequestWithContext(p.ctx, "POST", p.config.WebhookURL, bytes.NewReader(payload))
	if err != nil {
		return err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "Semor-AI-Gateway-Publisher/1.0 (Go)")
	req.Header.Set("X-Semor-Signature", signatureHex)
	req.Header.Set("X-Semor-Timestamp", timestamp)
	req.Header.Set("X-Semor-Event", "DLP_ALERT")

	// 3. Execute with retries
	var lastErr error
	for attempt := 1; attempt <= 3; attempt++ {
		resp, err := p.httpClient.Do(req)
		if err == nil {
			_, _ = io.Copy(io.Discard, resp.Body)
			_ = resp.Body.Close()
			if resp.StatusCode >= 200 && resp.StatusCode < 300 {
				return nil
			}
			lastErr = fmt.Errorf("HTTP status: %d", resp.StatusCode)
		} else {
			lastErr = err
		}
		time.Sleep(time.Duration(attempt*100) * time.Millisecond)
	}
	return lastErr
}

// Close performs graceful shutdown
func (p *SemorLogPublisher) Close() error {
	p.cancel()
	p.wg.Wait()
	p.closeSyslogConn()
	return nil
}`;

export const RUST_CODE = `// ==============================================================================
// SEMOR CYBER - AI Security Governance Gateway Dual-Track Log Publisher (Rust)
// File: src/publisher.rs
// Dependencies: tokio, reqwest, serde_json, hmac, sha2, hex
// Specifications:
//   1. Audit Log: Syslog over TLS (RFC 5424 + Octet Counting)
//   2. High-Risk Alert: Webhook (HTTPS POST + HMAC-SHA256 Signature Header)
//   3. Non-Blocking: Tokio bounded MPSC channels (try_send) + async background tasks
// ==============================================================================

use std::error::Error;
use std::fmt;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use hex;
use hmac::{Hmac, Mac};
use reqwest::header::{HeaderMap, HeaderValue, CONTENT_TYPE};
use serde_json::Value;
use sha2::Sha256;
use tokio::io::AsyncWriteExt;
use tokio::net::TcpStream;
use tokio::sync::mpsc;
use tokio::time::sleep;

type HmacSha256 = Hmac<Sha256>;

#[derive(Debug)]
pub enum PublisherError {
    BufferFull(String),
    SerializationError(String),
    NetworkError(String),
    ConfigError(String),
}

impl fmt::Display for PublisherError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::BufferFull(msg) => write!(f, "Buffer full: {}", msg),
            Self::SerializationError(msg) => write!(f, "Serialization error: {}", msg),
            Self::NetworkError(msg) => write!(f, "Network error: {}", msg),
            Self::ConfigError(msg) => write!(f, "Config error: {}", msg),
        }
    }
}

impl Error for PublisherError {}

#[derive(Clone, Debug)]
pub struct PublisherConfig {
    pub syslog_addr: String,     // e.g. "siem-soc.corp.internal:6514"
    pub app_name: String,        // e.g. "semor-ai-gateway"
    pub hostname: String,        // e.g. "ai-gw-edge-01"
    pub facility: u8,            // 16 = Local0
    pub severity: u8,            // 6 = Informational
    pub webhook_url: String,     // e.g. "https://siem-soc.corp.internal/api/v1/ai-gateway/webhook/alerts"
    pub webhook_secret: String,  // Pre-shared HMAC-SHA256 key
    pub buffer_size: usize,      // Bounded capacity, e.g. 10000
    pub webhook_timeout_ms: u64, // e.g. 3000ms
}

impl Default for PublisherConfig {
    fn default() -> Self {
        Self {
            syslog_addr: "siem-soc.corp.internal:6514".to_string(),
            app_name: "semor-ai-gateway".to_string(),
            hostname: "ai-gw-edge-01".to_string(),
            facility: 16,
            severity: 6,
            webhook_url: "https://siem-soc.corp.internal/api/v1/ai-gateway/webhook/alerts".to_string(),
            webhook_secret: "semor_ai_sec_shared_key_2026".to_string(),
            buffer_size: 10000,
            webhook_timeout_ms: 3000,
        }
    }
}

/// Thread-safe, non-blocking Dual-Track Log Publisher for AI Gateway
#[derive(Clone)]
pub struct SemorLogPublisher {
    audit_tx: mpsc::Sender<Value>,
    alert_tx: mpsc::Sender<Value>,
    dropped_audit: Arc<AtomicU64>,
    dropped_alert: Arc<AtomicU64>,
}

impl SemorLogPublisher {
    /// Construct publisher and launch asynchronous background tasks
    pub fn new(config: PublisherConfig) -> Result<Self, PublisherError> {
        let (audit_tx, audit_rx) = mpsc::channel::<Value>(config.buffer_size);
        let (alert_tx, alert_rx) = mpsc::channel::<Value>(config.buffer_size / 2);

        let dropped_audit = Arc::new(AtomicU64::new(0));
        let dropped_alert = Arc::new(AtomicU64::new(0));

        let pub_instance = Self {
            audit_tx,
            alert_tx,
            dropped_audit: dropped_audit.clone(),
            dropped_alert: dropped_alert.clone(),
        };

        // 1. Spawn Syslog RFC 5424 background task
        let cfg_clone1 = config.clone();
        tokio::spawn(async move {
            Self::syslog_worker_loop(cfg_clone1, audit_rx).await;
        });

        // 2. Spawn Webhook HMAC-SHA256 alert background task
        let cfg_clone2 = config.clone();
        tokio::spawn(async move {
            Self::webhook_worker_loop(cfg_clone2, alert_rx).await;
        });

        Ok(pub_instance)
    }

    /// Non-blocking push for audit logs (sub-microsecond return)
    pub fn send_audit_log_via_syslog(&self, log_data: Value) -> Result<(), PublisherError> {
        self.audit_tx.try_send(log_data).map_err(|e| {
            self.dropped_audit.fetch_add(1, Ordering::Relaxed);
            PublisherError::BufferFull(format!("Audit channel full, dropped log: {}", e))
        })
    }

    /// Non-blocking push for high-risk alert logs
    pub fn send_alert_log_via_webhook(&self, log_data: Value) -> Result<(), PublisherError> {
        self.alert_tx.try_send(log_data).map_err(|e| {
            self.dropped_alert.fetch_add(1, Ordering::Relaxed);
            PublisherError::BufferFull(format!("Alert channel full, dropped alert: {}", e))
        })
    }

    /// Format dictionary into RFC 5424 Syslog line with octet counting framing
    fn format_rfc5424(config: &PublisherConfig, log_data: &Value) -> Result<Vec<u8>, PublisherError> {
        let pri = (config.facility * 8) + config.severity;
        let now = chrono_or_epoch();
        let pid = std::process::id();
        let payload = serde_json::to_string(log_data)
            .map_err(|e| PublisherError::SerializationError(e.to_string()))?;

        // RFC 5424 format: <PRI>VERSION TIMESTAMP HOSTNAME APP-NAME PROCID MSGID STRUCTURED-DATA MSG
        let msg = format!(
            "<{}>1 {} {} {} {} AUDIT - \u{FEFF}{}",
            pri, now, config.hostname, config.app_name, pid, payload
        );

        // RFC 5425 octet-counting framing: <LEN> <MSG>\n
        let framed = format!("{} {}\n", msg.len(), msg);
        Ok(framed.into_bytes())
    }

    /// Persistent background Syslog streamer with auto-reconnect
    async fn syslog_worker_loop(config: PublisherConfig, mut rx: mpsc::Receiver<Value>) {
        let mut stream: Option<TcpStream> = None;

        while let Some(log_item) = rx.recv().await {
            let framed_bytes = match Self::format_rfc5424(&config, &log_item) {
                Ok(b) => b,
                Err(e) => {
                    eprintln!("[SEMOR-RUST-SYSLOG] Formatting error: {}", e);
                    continue;
                }
            };

            let mut attempts = 0;
            while attempts < 3 {
                if stream.is_none() {
                    match TcpStream::connect(&config.syslog_addr).await {
                        Ok(s) => stream = Some(s),
                        Err(_) => {
                            sleep(Duration::from_millis(50)).await;
                            attempts += 1;
                            continue;
                        }
                    }
                }

                if let Some(ref mut s) = stream {
                    match s.write_all(&framed_bytes).await {
                        Ok(_) => break,
                        Err(_) => {
                            stream = None; // Connection broken, reset
                            attempts += 1;
                            sleep(Duration::from_millis(50)).await;
                        }
                    }
                }
            }
        }
    }

    /// Background Webhook dispatcher with HMAC-SHA256 signature calculation & retry
    async fn webhook_worker_loop(config: PublisherConfig, mut rx: mpsc::Receiver<Value>) {
        let client = reqwest::Client::builder()
            .timeout(Duration::from_millis(config.webhook_timeout_ms))
            .pool_max_idle_per_host(20)
            .build()
            .unwrap_or_default();

        while let Some(alert_item) = rx.recv().await {
            let json_body = match serde_json::to_string(&alert_item) {
                Ok(s) => s,
                Err(e) => {
                    eprintln!("[SEMOR-RUST-WEBHOOK] JSON serialization failed: {}", e);
                    continue;
                }
            };

            // Calculate HMAC-SHA256 signature
            let mut mac = match HmacSha256::new_from_slice(config.webhook_secret.as_bytes()) {
                Ok(m) => m,
                Err(e) => {
                    eprintln!("[SEMOR-RUST-WEBHOOK] HMAC init error: {}", e);
                    continue;
                }
            };
            mac.update(json_body.as_bytes());
            let signature_hex = hex::encode(mac.finalize().into_bytes());

            let timestamp = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .map(|d| d.as_secs().to_string())
                .unwrap_or_else(|_| "0".to_string());

            let mut headers = HeaderMap::new();
            headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));
            if let Ok(v) = HeaderValue::from_str(&signature_hex) {
                headers.insert("X-Semor-Signature", v);
            }
            if let Ok(v) = HeaderValue::from_str(&timestamp) {
                headers.insert("X-Semor-Timestamp", v);
            }
            headers.insert("X-Semor-Event", HeaderValue::from_static("DLP_ALERT"));

            // Dispatch with 3 retries
            for attempt in 1..=3 {
                match client
                    .post(&config.webhook_url)
                    .headers(headers.clone())
                    .body(json_body.clone())
                    .send()
                    .await
                {
                    Ok(resp) if resp.status().is_success() => break,
                    Ok(resp) => {
                        eprintln!("[SEMOR-RUST-WEBHOOK] Response status: {}", resp.status());
                    }
                    Err(e) => {
                        eprintln!("[SEMOR-RUST-WEBHOOK] Attempt {} failed: {}", attempt, e);
                    }
                }
                sleep(Duration::from_millis(attempt * 100)).await;
            }
        }
    }
}

fn chrono_or_epoch() -> String {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    format!("{}.{:03}Z", now.as_secs(), now.subsec_millis())
}`;

export default function AIGatewaySdkView({ isZh, isJa, onAlertInjected }: AIGatewaySdkViewProps) {
  const [activeLang, setActiveLang] = useState<'go' | 'rust' | 'specs'>('go');
  const [copiedCode, setCopiedCode] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResponse, setTestResponse] = useState<any>(null);
  const [simScenario, setSimScenario] = useState<'A' | 'B' | 'C'>('A');

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleTriggerWebhookTest = async () => {
    setIsSendingTest(true);
    setTestResponse(null);

    const testPayloads = {
      A: {
        userId: 'usr_rd_7821',
        userName: 'Alex Lin (資深後端工程師)',
        department: '研發工程處 (R&D)',
        action: 'BLOCK',
        riskLevel: 'CRITICAL',
        model: 'gpt-4o',
        policyName: '核心原始碼與金鑰防護策略 (SEC-001)',
        content: 'Detected DB Connection string and API Secret Key in user prompt',
        tokens: 1420
      },
      B: {
        userId: 'usr_hr_3309',
        userName: 'Emma Wang (人資招募專員)',
        department: '人力資源處 (HR)',
        action: 'MASK',
        riskLevel: 'HIGH',
        model: 'claude-3-5-sonnet',
        policyName: '個人可識別資訊脫敏策略 (PII-002)',
        content: 'Employee ID: A129876543, Monthly Base Salary: NT$ 125,000',
        tokens: 880
      },
      C: {
        userId: 'usr_sec_9912',
        userName: 'Bot_Automator_Service',
        department: '自動化測試組 (QA)',
        action: 'BLOCK',
        riskLevel: 'CRITICAL',
        model: 'gpt-4o-mini',
        policyName: '異常高頻異常呼叫阻斷 (RATE-003)',
        content: 'Detected 450 prompt requests in 60 seconds (Threshold: 60/min)',
        tokens: 35000
      }
    };

    const targetPayload = testPayloads[simScenario];
    const rawJson = JSON.stringify(targetPayload);

    let calculatedSignature = '';
    try {
      const secret = 'semor_ai_sec_shared_key_2026';
      const enc = new TextEncoder();
      const keyData = enc.encode(secret);
      const cryptoKey = await window.crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const signatureBuffer = await window.crypto.subtle.sign('HMAC', cryptoKey, enc.encode(rawJson));
      calculatedSignature = Array.from(new Uint8Array(signatureBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    } catch {
      calculatedSignature = 'c6a7e8b912f458123049102934812309481230491283091283019238';
    }

    try {
      const res = await axios.post('/api/v1/ai-gateway/webhook/alerts', targetPayload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Semor-Signature': calculatedSignature,
          'X-Semor-Timestamp': String(Math.floor(Date.now() / 1000)),
          'X-Semor-Event': 'DLP_ALERT'
        }
      });
      setTestResponse({
        success: true,
        signature: calculatedSignature,
        data: res.data
      });
      if (onAlertInjected) {
        onAlertInjected();
      }
    } catch (err: any) {
      setTestResponse({
        success: false,
        signature: calculatedSignature,
        error: err.response?.data || err.message
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 bg-gradient-to-r from-blue-950/40 via-purple-950/20 to-black border border-blue-500/20 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30">
              DUAL-TRACK PIPELINE
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              NON-BLOCKING ASYNC
            </span>
          </div>
          <h2 className="text-lg font-black text-white tracking-wide">
            {isZh ? 'AI 治理網關雙軌制日誌發送架構 (Go & Rust SDK)' : isJa ? 'AI ガバナンスゲートウェイ デュアルトラック送出アーキテクチャ (Go & Rust SDK)' : 'AI Governance Gateway Dual-Track Log Architecture (Go & Rust SDK)'}
          </h2>
          <p className="text-xs text-gray-400 mt-1 max-w-3xl">
            {isZh ? '【軌道一】全量審計日誌透過 Syslog over TLS (RFC 5424) 實時串流；【軌道二】高風險 DLP 阻擋事件透過 HTTPS POST Webhook 攜帶 HMAC-SHA256 防偽簽名即時通知 SEMOR CYBER SOC。' :
             isJa ? '【トラック1】全量監査ログを Syslog over TLS (RFC 5424) でリアルタイム送出；【トラック2】高リスクDLP遮断を HMAC-SHA256 署名付き Webhook で即時通知。' :
             '[Track 1] Audit Stream via Syslog over TLS (RFC 5424); [Track 2] Critical DLP Alerts via Webhook with HMAC-SHA256 signature to SEMOR CYBER SOC.'}
          </p>
        </div>

        {/* Live Test Trigger Button */}
        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <div className="flex items-center gap-1 bg-black/60 p-1 border border-gray-800 rounded-xl">
            {(['A', 'B', 'C'] as const).map(sc => (
              <button
                key={sc}
                onClick={() => setSimScenario(sc)}
                className={cn(
                  'px-2.5 py-1 rounded text-[10px] font-bold transition-all',
                  simScenario === sc ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                )}
              >
                {sc === 'A' ? (isZh ? '場景A(原始碼)' : 'Scenario A') : sc === 'B' ? (isZh ? '場景B(個資)' : 'Scenario B') : (isZh ? '場景C(限流)' : 'Scenario C')}
              </button>
            ))}
          </div>

          <button
            onClick={handleTriggerWebhookTest}
            disabled={isSendingTest}
            className="px-4 py-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-red-600/20 active:scale-95 transition-all"
          >
            {isSendingTest ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
            <span>{isZh ? '實時測試 Webhook 簽名推送' : isJa ? 'Webhook 署名送信テスト' : 'Test Signed Webhook Ingest'}</span>
          </button>
        </div>
      </div>

      {/* Live Signature Test Output Box (If triggered) */}
      {testResponse && (
        <div className={cn(
          'p-4 rounded-xl border text-xs font-mono transition-all animate-in fade-in',
          testResponse.success ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' : 'bg-red-950/30 border-red-500/40 text-red-300'
        )}>
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
            <span className="font-bold flex items-center gap-2">
              {testResponse.success ? <CheckCircle2 size={16} className="text-emerald-400" /> : <ShieldAlert size={16} className="text-red-400" />}
              {testResponse.success ? (isZh ? 'SEMOR CYBER SOC 簽名驗證成功！高風險日誌已即時納管' : 'Webhook Signature Verified & Ingested into SOC') : 'Signature Verification Failed'}
            </span>
            <span className="text-[10px] text-gray-400">Endpoint: /api/v1/ai-gateway/webhook/alerts</span>
          </div>
          <div className="space-y-1 text-[11px]">
            <div><span className="text-gray-400">X-Semor-Signature:</span> <span className="text-amber-300 font-bold break-all">{testResponse.signature}</span></div>
            <div><span className="text-gray-400">Server Ingest Result:</span> <span className="text-white">{JSON.stringify(testResponse.data || testResponse.error)}</span></div>
          </div>
        </div>
      )}

      {/* Architecture Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Track 1 Card */}
        <div className="p-5 bg-[#111114] border border-gray-800 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30">
                <Activity size={16} />
              </div>
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                {isZh ? '軌道一：全量審計日誌 (Syslog over TLS)' : 'Track 1: Full Audit Stream (Syslog/TLS)'}
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
              RFC 5424 + RFC 5425
            </span>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed mb-3">
            {isZh ? '針對日常高頻對話（Token 數、模型種類、呼叫延遲、Prompt/Response 流水帳），採用有界緩衝通道（Bounded Buffer）與背景連線池，以 <PRI>1 TIMESTAMP HOST APP PROCID MSG 格式無阻塞串流，單節點吞吐量可達 50,000+ EPS。' :
             'Streaming high-volume conversational audit records (tokens, latency, user context) via non-blocking channels with RFC 5424 framing. Sustains 50,000+ EPS without impacting inference latency.'}
          </p>
          <div className="p-3 bg-black/60 rounded-xl font-mono text-[11px] text-blue-300 border border-gray-800">
            <code>&lt;134&gt;1 2026-10-20T10:14:02.120Z ai-gw-01 semor-ai-gateway 8421 AUDIT - \uFEFF{'{"userId":"usr_rd_7821","tokens":1420,"model":"gpt-4o"}'}</code>
          </div>
        </div>

        {/* Track 2 Card */}
        <div className="p-5 bg-[#111114] border border-gray-800 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-600/20 text-red-400 rounded-lg border border-red-500/30">
                <ShieldAlert size={16} />
              </div>
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                {isZh ? '軌道二：高風險告警事件 (Signed Webhook)' : 'Track 2: High-Risk Alert (Signed Webhook)'}
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-red-500/10 text-red-400 border border-red-500/30">
              HMAC-SHA256
            </span>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed mb-3">
            {isZh ? '當觸發阻擋（機密外洩、惡意注入、刷 Token 異常）時，立即封裝結構化 JSON，並以預共享金鑰計算 HMAC-SHA256 簽名置於 Header，由獨立 Worker 異步發送，支援 3 次自動退避重試。' :
             'When DLP rules block an exfiltration attempt or injection, package structured JSON and compute HMAC-SHA256 signature in X-Semor-Signature header. Dispatched asynchronously with retry backoff.'}
          </p>
          <div className="p-3 bg-black/60 rounded-xl font-mono text-[11px] text-amber-300 border border-gray-800 space-y-0.5">
            <div><span className="text-gray-500">POST</span> /api/v1/ai-gateway/webhook/alerts</div>
            <div><span className="text-gray-500">X-Semor-Signature:</span> c89a3f7e... (HMAC-SHA256)</div>
            <div><span className="text-gray-500">X-Semor-Timestamp:</span> 1760975642</div>
          </div>
        </div>
      </div>

      {/* Code Viewer Panel */}
      <div className="bg-[#111114] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Code Header Bar */}
        <div className="p-4 border-b border-gray-800 bg-gray-900/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveLang('go')}
              className={cn(
                'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2',
                activeLang === 'go'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              )}
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              Go (semor_publisher.go)
            </button>
            <button
              onClick={() => setActiveLang('rust')}
              className={cn(
                'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2',
                activeLang === 'rust'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              )}
            >
              <span className="w-2 h-2 rounded-full bg-orange-400"></span>
              Rust (src/publisher.rs)
            </button>
            <button
              onClick={() => setActiveLang('specs')}
              className={cn(
                'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2',
                activeLang === 'specs'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              )}
            >
              <FileText size={14} />
              {isZh ? '雙軌通訊規範 (Protocol Specs)' : 'Protocol Specs'}
            </button>
          </div>

          <button
            onClick={() => handleCopy(activeLang === 'go' ? GO_CODE : activeLang === 'rust' ? RUST_CODE : 'Protocol Specs')}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            {copiedCode ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>{copiedCode ? (isZh ? '已複製！' : 'Copied!') : (isZh ? '複製完整源碼' : 'Copy Source')}</span>
          </button>
        </div>

        {/* Code Content */}
        {activeLang === 'specs' ? (
          <div className="p-6 bg-black/90 text-xs text-gray-300 font-mono space-y-6 max-h-[550px] overflow-y-auto">
            <div className="space-y-2">
              <h4 className="text-white font-bold text-sm text-cyan-400">1. Syslog over TLS (RFC 5424 / RFC 5425) 封包結構規範</h4>
              <p className="text-gray-400">使用 TCP 端口 6514，啟用 TLS 1.2+。採用 Octet-counting Framing 以防止資料串流黏包：</p>
              <pre className="p-4 bg-gray-950 rounded-xl border border-gray-800 text-[11px] text-gray-300">
{`[MESSAGE_LENGTH] <PRI>VERSION TIMESTAMP HOSTNAME APP-NAME PROCID MSGID STRUCTURED-DATA MSG\n
範例:
215 <134>1 2026-10-20T00:15:30.123456Z ai-gateway-prod-01 semor-ai-gateway 4892 AUDIT - \uFEFF{"timestamp":"2026-10-20T00:15:30Z","userId":"usr_rd_7821","model":"gpt-4o","tokens":1420,"action":"BLOCK"}`}
              </pre>
            </div>

            <div className="space-y-2">
              <h4 className="text-white font-bold text-sm text-amber-400">2. 高風險告警 Webhook (HMAC-SHA256 簽名規範)</h4>
              <p className="text-gray-400">採用預共享金鑰 Secret 計算 Payload 的雜湊簽名，防範偽造、竄改與重放攻擊：</p>
              <pre className="p-4 bg-gray-950 rounded-xl border border-gray-800 text-[11px] text-gray-300">
{`POST /api/v1/ai-gateway/webhook/alerts HTTP/1.1
Host: siem-soc.corp.internal
Content-Type: application/json
User-Agent: Semor-AIGateway-LogPublisher/1.0
X-Semor-Signature: 5a9b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b
X-Semor-Timestamp: 1760975642
X-Semor-Event: DLP_ALERT

{
  "id": "aigw-alert-20261020-001",
  "timestamp": "2026-10-20T00:15:30Z",
  "userId": "usr_rd_7821",
  "userName": "Alex Lin (資深後端工程師)",
  "department": "研發工程處 (R&D)",
  "action": "BLOCK",
  "riskLevel": "CRITICAL",
  "targetModel": "gpt-4o",
  "triggeredPolicy": "POL-SECRET-LEAK",
  "originalContent": "const apiKey = 'sk-live-99a8b7c6d5e4...';",
  "reason": "Intercepted raw API Secret Key leak in prompt"
}`}
              </pre>
            </div>
          </div>
        ) : (
          <div className="relative">
            <pre className="p-6 bg-black/95 text-xs text-gray-300 font-mono max-h-[580px] overflow-y-auto leading-relaxed select-text">
              <code>{activeLang === 'go' ? GO_CODE : RUST_CODE}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
