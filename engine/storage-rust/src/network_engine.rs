//! SEMOR 網路效能與基礎架構監控核心 (Rust Network Performance & Topology Core)
//!
//! 核心職責：
//! 1. 高精確網路介面吞吐率計算 (Octets Counter Delta / Delta-T Bandwidth Computer with Rollover Guard)
//! 2. 鏈路飽和度與流量微突發偵測 (Bandwidth Saturation & Microburst EMA Detection)
//! 3. 實體介面抖動與 Link Flap 滑動視窗狀態機追蹤 (60s Sliding-Window Flapping Detection)
//! 4. SNMP Trap (LinkDown/LinkUp, ColdStart, Thermal) 異常事件即時落盤與快篩
//! 5. 主動 ICMP / RTT 診斷探針評估與封裝
//! 6. 封裝 VictoriaLogs VBLK 二進位區塊 (Stream 9201/9202/9203) 並填充布隆過濾器以利拓撲與指標秒級查詢。

use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, HashMap};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, RwLock};
use std::time::{Duration, Instant};
use tracing::{debug, info, warn};

use crate::block::{BlockBuilder, VictoriaBlock};
use crate::storage::VictoriaStorageEngine;

/// 標準化介面流量與運作指標
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkMetricRecord {
    pub timestamp_nano: i64,
    pub device_id: String,
    pub device_name: String,
    pub device_ip: String,
    pub device_type: String, // "switch", "router", "firewall", "ap"
    pub interface_name: String,
    pub if_index: i32,
    pub oper_status: String, // "up", "down", "testing"
    pub in_octets: u64,
    pub out_octets: u64,
    pub in_errors: u64,
    pub out_errors: u64,
    #[serde(default)]
    pub in_discards: Option<u64>,
    #[serde(default)]
    pub out_discards: Option<u64>,
    pub speed_bps: u64,
    #[serde(default)]
    pub in_throughput_mbps: f64,
    #[serde(default)]
    pub out_throughput_mbps: f64,
    #[serde(default)]
    pub utilization_pct: f64,
    #[serde(default)]
    pub in_error_rate: Option<f64>,
    #[serde(default)]
    pub out_error_rate: Option<f64>,
    #[serde(default)]
    pub latency_ms: f64,
    #[serde(default)]
    pub jitter_ms: Option<f64>,
    #[serde(default)]
    pub packet_loss_pct: f64,
    #[serde(default)]
    pub is_flapping: Option<bool>,
    #[serde(default)]
    pub flap_count: Option<u32>,
    #[serde(default)]
    pub cpu_usage: Option<f64>,
    #[serde(default)]
    pub ram_usage: Option<f64>,
    #[serde(default)]
    pub labels: BTreeMap<String, String>,
}

/// SNMP Trap 異常事件記錄
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SnmpTrapRecord {
    pub timestamp_nano: i64,
    pub agent_ip: String,
    pub trap_oid: String,
    pub trap_type: String,
    #[serde(default)]
    pub community: Option<String>,
    #[serde(default)]
    pub enterprise_oid: Option<String>,
    #[serde(default)]
    pub specific_code: Option<i32>,
    #[serde(default)]
    pub sys_uptime: Option<u64>,
    pub severity: String,
    pub message: String,
    #[serde(default)]
    pub variables: BTreeMap<String, String>,
}

/// 主動式診斷探針記錄
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiagnosticProbeRecord {
    pub timestamp_nano: i64,
    pub target_ip: String,
    pub target_name: String,
    pub probe_type: String,
    pub status: String,
    pub latency_ms: f64,
    #[serde(default)]
    pub min_latency_ms: Option<f64>,
    #[serde(default)]
    pub max_latency_ms: Option<f64>,
    #[serde(default)]
    pub jitter_ms: Option<f64>,
    pub packet_loss_pct: f64,
    #[serde(default)]
    pub packets_sent: Option<i32>,
    #[serde(default)]
    pub packets_recv: Option<i32>,
    #[serde(default)]
    pub hops: Vec<String>,
    #[serde(default)]
    pub error_msg: Option<String>,
}

/// 介面歷史計數器 (用於 Delta 速率精算、滑動視窗 Flapping 與微突發追蹤)
#[derive(Debug, Clone)]
struct InterfaceHistory {
    last_timestamp_nano: i64,
    last_in_octets: u64,
    last_out_octets: u64,
    last_status: String,
    status_transitions: Vec<Instant>, // 60秒滑動視窗狀態跳變歷史
    ema_in_throughput: f64,           // 指數移動平均吞吐 (用於微突發判斷)
    total_flaps: u32,
}

/// 網路監控效能與拓撲引擎
pub struct NetworkEngine {
    storage: Arc<VictoriaStorageEngine>,
    interface_states: RwLock<HashMap<String, InterfaceHistory>>, // Key: device_ip:interface_name

    // 遙測計數器 (Atomic)
    total_metrics_ingested: AtomicU64,
    total_traps_received: AtomicU64,
    total_probes_received: AtomicU64,
    saturated_links_detected: AtomicU64,
    link_flaps_detected: AtomicU64,
    microbursts_detected: AtomicU64,
}

impl NetworkEngine {
    pub fn new(storage: Arc<VictoriaStorageEngine>) -> Self {
        NetworkEngine {
            storage,
            interface_states: RwLock::new(HashMap::with_capacity(5000)),
            total_metrics_ingested: AtomicU64::new(0),
            total_traps_received: AtomicU64::new(0),
            total_probes_received: AtomicU64::new(0),
            saturated_links_detected: AtomicU64::new(0),
            link_flaps_detected: AtomicU64::new(0),
            microbursts_detected: AtomicU64::new(0),
        }
    }

    /// 處理單一介面指標並計算速率、利用率、微突發與狀態抖動
    pub fn process_metric(&self, metric: &mut NetworkMetricRecord) {
        self.total_metrics_ingested.fetch_add(1, Ordering::Relaxed);
        let key = format!("{}:{}", metric.device_ip, metric.interface_name);
        let now = Instant::now();

        let mut states = self.interface_states.write().unwrap();
        let history = states.entry(key).or_insert_with(|| InterfaceHistory {
            last_timestamp_nano: metric.timestamp_nano,
            last_in_octets: metric.in_octets,
            last_out_octets: metric.out_octets,
            last_status: metric.oper_status.clone(),
            status_transitions: Vec::with_capacity(10),
            ema_in_throughput: 0.0,
            total_flaps: 0,
        });

        // 1. Link Flapping 滑動視窗狀態震盪檢測 (60 秒滑動視窗)
        if !history.last_status.is_empty() && history.last_status != metric.oper_status {
            history.status_transitions.push(now);
            history.last_status = metric.oper_status.clone();
            history.total_flaps += 1;
        }

        // 清理超過 60 秒的舊躍遷記錄
        let cutoff = now.checked_sub(Duration::from_secs(60)).unwrap_or(now);
        history.status_transitions.retain(|&t| t >= cutoff);

        if history.status_transitions.len() >= 3 {
            metric.is_flapping = Some(true);
            metric.flap_count = Some(history.status_transitions.len() as u32);
            self.link_flaps_detected.fetch_add(1, Ordering::Relaxed);
        } else {
            metric.is_flapping = Some(false);
            metric.flap_count = Some(history.status_transitions.len() as u32);
        }

        // 2. 64-bit / 32-bit Octets Delta 頻寬速率計算 (含 Rollover 防護)
        let dt_sec = (metric.timestamp_nano - history.last_timestamp_nano) as f64 / 1e9;
        if dt_sec > 0.001 && dt_sec < 300.0 {
            let delta_in = if metric.in_octets >= history.last_in_octets {
                metric.in_octets - history.last_in_octets
            } else if history.last_in_octets <= u32::MAX as u64 && metric.in_octets <= u32::MAX as u64 {
                (u32::MAX as u64 - history.last_in_octets) + metric.in_octets
            } else {
                metric.in_octets
            };

            let delta_out = if metric.out_octets >= history.last_out_octets {
                metric.out_octets - history.last_out_octets
            } else if history.last_out_octets <= u32::MAX as u64 && metric.out_octets <= u32::MAX as u64 {
                (u32::MAX as u64 - history.last_out_octets) + metric.out_octets
            } else {
                metric.out_octets
            };

            metric.in_throughput_mbps = (delta_in as f64 * 8.0) / (dt_sec * 1e6);
            metric.out_throughput_mbps = (delta_out as f64 * 8.0) / (dt_sec * 1e6);

            // 頻寬利用率
            if metric.speed_bps > 0 {
                let max_mbps = metric.speed_bps as f64 / 1e6;
                let max_cur = metric.in_throughput_mbps.max(metric.out_throughput_mbps);
                metric.utilization_pct = ((max_cur / max_mbps) * 100.0).clamp(0.0, 100.0);
            }

            // 流量微突發 (Microburst) 偵測：突發吞吐 > 3.5倍 EMA 平滑值
            if history.ema_in_throughput > 5.0 && metric.in_throughput_mbps > history.ema_in_throughput * 3.5 {
                self.microbursts_detected.fetch_add(1, Ordering::Relaxed);
            }
            history.ema_in_throughput = 0.85 * history.ema_in_throughput + 0.15 * metric.in_throughput_mbps;

            // 錯誤率
            if delta_in > 0 && metric.in_errors > 0 {
                metric.in_error_rate = Some((metric.in_errors as f64 / delta_in as f64) * 1000.0);
            }
            if delta_out > 0 && metric.out_errors > 0 {
                metric.out_error_rate = Some((metric.out_errors as f64 / delta_out as f64) * 1000.0);
            }
        }

        history.last_timestamp_nano = metric.timestamp_nano;
        history.last_in_octets = metric.in_octets;
        history.last_out_octets = metric.out_octets;

        // 3. 鏈路飽和告警 (>= 85%)
        if metric.utilization_pct >= 85.0 {
            self.saturated_links_detected.fetch_add(1, Ordering::Relaxed);
        }
    }

    /// 批次寫入網路指標至 VictoriaLogs 儲存核心 (封裝成高效能壓縮 Block, Stream ID 9201)
    pub fn ingest_metrics_batch(&self, metrics: &mut [NetworkMetricRecord]) -> Result<usize> {
        if metrics.is_empty() {
            return Ok(0);
        }

        let stream_id = 9201u64; // Network Monitoring 全域串流 ID
        let part_tag = format!("net_part_{:x}", chrono::Utc::now().timestamp_nanos_opt().unwrap_or(0));
        let mut builder = BlockBuilder::new(stream_id, &part_tag, 1, 4096, 2 * 1024 * 1024);
        let count = metrics.len();

        for m in metrics.iter_mut() {
            self.process_metric(m);

            let json_line = serde_json::to_string(m)?;
            builder.add_row(m.timestamp_nano, &json_line);

            // 注入關鍵檢索特徵至 Bloom Filter
            builder.bloom_filter.insert(&m.device_id);
            builder.bloom_filter.insert(&m.device_ip);
            builder.bloom_filter.insert(&m.device_name);
            builder.bloom_filter.insert(&m.interface_name);
            builder.bloom_filter.insert(&m.oper_status);
        }

        if !builder.is_empty() {
            let block = builder.build()?;
            self.storage.append_block(&block)?;
        }

        Ok(count)
    }

    /// 寫入單一 SNMP Trap 事件 (Stream ID 9202)
    pub fn ingest_trap(&self, trap: &SnmpTrapRecord) -> Result<()> {
        self.total_traps_received.fetch_add(1, Ordering::Relaxed);
        let stream_id = 9202u64; // SNMP Trap 專用串流 ID
        let part_tag = format!("trap_part_{:x}", chrono::Utc::now().timestamp_nanos_opt().unwrap_or(0));
        let mut builder = BlockBuilder::new(stream_id, &part_tag, 1, 1024, 1024 * 1024);

        let json_line = serde_json::to_string(trap)?;
        builder.add_row(trap.timestamp_nano, &json_line);

        builder.bloom_filter.insert(&trap.agent_ip);
        builder.bloom_filter.insert(&trap.trap_oid);
        builder.bloom_filter.insert(&trap.trap_type);
        builder.bloom_filter.insert(&trap.severity);

        let block = builder.build()?;
        self.storage.append_block(&block)?;
        Ok(())
    }

    /// 寫入主動診斷探針記錄 (Stream ID 9203)
    pub fn ingest_probe(&self, probe: &DiagnosticProbeRecord) -> Result<()> {
        self.total_probes_received.fetch_add(1, Ordering::Relaxed);
        let stream_id = 9203u64; // 網路診斷探針專用串流 ID
        let part_tag = format!("probe_part_{:x}", chrono::Utc::now().timestamp_nanos_opt().unwrap_or(0));
        let mut builder = BlockBuilder::new(stream_id, &part_tag, 1, 1024, 1024 * 1024);

        let json_line = serde_json::to_string(probe)?;
        builder.add_row(probe.timestamp_nano, &json_line);

        builder.bloom_filter.insert(&probe.target_ip);
        builder.bloom_filter.insert(&probe.target_name);
        builder.bloom_filter.insert(&probe.probe_type);
        builder.bloom_filter.insert(&probe.status);

        let block = builder.build()?;
        self.storage.append_block(&block)?;
        Ok(())
    }

    /// 輸出網路監控引擎即時統計資訊
    pub fn telemetry(&self) -> serde_json::Value {
        let total = self.total_metrics_ingested.load(Ordering::Relaxed);
        let traps = self.total_traps_received.load(Ordering::Relaxed);
        let probes = self.total_probes_received.load(Ordering::Relaxed);
        let saturated = self.saturated_links_detected.load(Ordering::Relaxed);
        let flaps = self.link_flaps_detected.load(Ordering::Relaxed);
        let bursts = self.microbursts_detected.load(Ordering::Relaxed);
        let active_interfaces = self.interface_states.read().map(|s| s.len()).unwrap_or(0);

        serde_json::json!({
            "total_metrics_ingested": total,
            "total_traps_received": traps,
            "total_probes_received": probes,
            "saturated_links_detected": saturated,
            "link_flaps_detected": flaps,
            "microbursts_detected": bursts,
            "active_monitored_interfaces": active_interfaces,
            "engine_status": "ONLINE_TELEMETRY_POLLING"
        })
    }
}

