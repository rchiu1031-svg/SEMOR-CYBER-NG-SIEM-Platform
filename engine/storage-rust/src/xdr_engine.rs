//! SEMOR XDR (Extended Detection and Response) 多層聯合分析與威脅關聯引擎 (Rust Core)
//!
//! 核心職責：
//! 1. 跨維度安全日誌擷取：Endpoint (EDR/Sysmon) + Identity (AD/IAM) + Cloud (K8s/Audit) + Network (NDR)
//! 2. 實體與資產行為圖譜 (Asset & Identity Graph Tracking)
//! 3. MITRE ATT&CK 滑動時間視窗跨層級攻擊鏈路關聯 (Multi-Stage Kill Chain Temporal Correlation)
//! 4. 產出置信度評分 (Confidence Score) 與自動化遏止建議 (Automated Remediation Playbook)
//! 5. 封裝 VictoriaLogs VBLK 二進位區塊，並填充布隆過濾器以利即時秒級鑑識調查。

use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, HashMap, HashSet};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, RwLock};
use std::time::{Duration, Instant};
use tracing::{debug, info, warn};

use crate::block::{BlockBuilder, VictoriaBlock};
use crate::storage::VictoriaStorageEngine;

/// 標準化 XDR 多層日誌事件
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct XdrEventRecord {
    pub timestamp_nano: i64,
    pub event_id: String,
    pub layer: String, // "endpoint", "identity", "cloud", "network", "perimeter"
    pub sensor_id: String,
    pub hostname: String,
    #[serde(default)]
    pub host_ip: String,
    #[serde(default)]
    pub username: Option<String>,
    #[serde(default)]
    pub process_name: Option<String>,
    #[serde(default)]
    pub command_line: Option<String>,
    #[serde(default)]
    pub file_hash_sha256: Option<String>,
    #[serde(default)]
    pub mitre_tactic: Option<String>,
    #[serde(default)]
    pub mitre_technique: Option<String>,
    pub severity: String, // "Critical", "High", "Medium", "Low", "Info"
    pub confidence: u8,
    #[serde(default)]
    pub threat_title: Option<String>,
    #[serde(default)]
    pub threat_desc: Option<String>,
    #[serde(default)]
    pub action_taken: String,
    #[serde(default)]
    pub labels: BTreeMap<String, String>,
}

/// 跨層級攻擊鏈路關聯事件 (XDR Correlated Incident)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct XdrCorrelationIncident {
    pub incident_id: String,
    pub title: String,
    pub severity: String,
    pub confidence_score: u8,
    pub status: String, // "Active_Investigating", "Contained", "Resolved"
    pub target_asset: String,
    pub target_user: String,
    pub started_at_nano: i64,
    pub updated_at_nano: i64,
    pub involved_layers: Vec<String>,
    pub kill_chain_phases: Vec<KillChainPhase>,
    pub recommended_action: String,
    pub ai_narrative: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KillChainPhase {
    pub phase: String,
    pub technique: String,
    pub detected_by: String,
    pub timestamp_nano: i64,
    pub detail: String,
}

/// 資產與主機關聯追蹤實體
#[derive(Debug, Clone)]
struct AssetTrackEntry {
    hostname: String,
    ip: String,
    first_seen: Instant,
    last_seen: Instant,
    users: HashSet<String>,
    recent_events: Vec<XdrEventRecord>,
    threat_score: u32,
}

/// XDR 關聯分析引擎主體
pub struct XdrEngine {
    storage: Arc<VictoriaStorageEngine>,
    asset_graph: RwLock<HashMap<String, AssetTrackEntry>>, // Key: hostname or IP
    active_incidents: RwLock<HashMap<String, XdrCorrelationIncident>>, // Key: incident_id

    // 遙測指標計數器 (Atomic)
    total_events_ingested: AtomicU64,
    endpoint_events: AtomicU64,
    identity_events: AtomicU64,
    cloud_events: AtomicU64,
    incidents_correlated: AtomicU64,
    critical_containments: AtomicU64,
}

impl XdrEngine {
    pub fn new(storage: Arc<VictoriaStorageEngine>) -> Self {
        XdrEngine {
            storage,
            asset_graph: RwLock::new(HashMap::with_capacity(20000)),
            active_incidents: RwLock::new(HashMap::with_capacity(5000)),
            total_events_ingested: AtomicU64::new(0),
            endpoint_events: AtomicU64::new(0),
            identity_events: AtomicU64::new(0),
            cloud_events: AtomicU64::new(0),
            incidents_correlated: AtomicU64::new(0),
            critical_containments: AtomicU64::new(0),
        }
    }

    /// 接收單一 XDR 事件並推進資產圖譜與滑動視窗關聯
    pub fn process_event(&self, event: &XdrEventRecord) -> Option<XdrCorrelationIncident> {
        self.total_events_ingested.fetch_add(1, Ordering::Relaxed);
        match event.layer.as_str() {
            "endpoint" => { self.endpoint_events.fetch_add(1, Ordering::Relaxed); },
            "identity" => { self.identity_events.fetch_add(1, Ordering::Relaxed); },
            "cloud" => { self.cloud_events.fetch_add(1, Ordering::Relaxed); },
            _ => {}
        }

        let now = Instant::now();
        let asset_key = if !event.hostname.is_empty() {
            event.hostname.clone()
        } else if !event.host_ip.is_empty() {
            event.host_ip.clone()
        } else {
            "UNKNOWN-ASSET".to_string()
        };

        // 1. 更新資產狀態圖譜
        let mut graph = self.asset_graph.write().unwrap();
        let entry = graph.entry(asset_key.clone()).or_insert_with(|| AssetTrackEntry {
            hostname: event.hostname.clone(),
            ip: event.host_ip.clone(),
            first_seen: now,
            last_seen: now,
            users: HashSet::new(),
            recent_events: Vec::with_capacity(32),
            threat_score: 0,
        });

        entry.last_seen = now;
        if let Some(ref u) = event.username {
            entry.users.insert(u.clone());
        }

        // 2. 滑動時間視窗剪枝：僅保留 15 分鐘以內之近期安全事件
        entry.recent_events.push(event.clone());
        entry.recent_events.retain(|e| {
            let diff_sec = (event.timestamp_nano - e.timestamp_nano) / 1_000_000_000;
            diff_sec.abs() < 900 // 15 分鐘滑動視窗
        });

        // 3. 多階段 Kill Chain 跨層級關聯檢查
        self.evaluate_correlation(&asset_key, entry)
    }

    /// 跨層級關聯邏輯：當單一資產/使用者在 15 分鐘內跨足 2 個以上不同攻擊階段或多層級感測器時，合成 XDR 警報鏈
    fn evaluate_correlation(&self, asset_key: &str, asset: &mut AssetTrackEntry) -> Option<XdrCorrelationIncident> {
        let mut detected_phases: HashMap<String, KillChainPhase> = HashMap::new();
        let mut layers_set: HashSet<String> = HashSet::new();

        for ev in &asset.recent_events {
            layers_set.insert(ev.layer.clone());

            if let Some(ref tactic) = ev.mitre_tactic {
                if !tactic.is_empty() {
                    let phase = KillChainPhase {
                        phase: tactic.clone(),
                        technique: ev.mitre_technique.clone().unwrap_or_else(|| "T1000 Unknown".to_string()),
                        detected_by: format!("{}: {}", ev.layer, ev.sensor_id),
                        timestamp_nano: ev.timestamp_nano,
                        detail: ev.threat_desc.clone().unwrap_or_else(|| ev.threat_title.clone().unwrap_or_default()),
                    };
                    detected_phases.insert(tactic.clone(), phase);
                }
            }
        }

        // 當觸發 2 個以上不同 MITRE Tactic 階段或涉及 LSASS / Ransomware 等高危攻擊時
        let phase_count = detected_phases.len();
        let has_critical = asset.recent_events.iter().any(|e| e.severity == "Critical");

        if phase_count >= 2 || (phase_count >= 1 && has_critical) {
            let incident_id = format!("XDR-INC-{:x}", chrono::Utc::now().timestamp_millis());
            let phases_vec: Vec<KillChainPhase> = detected_phases.into_values().collect();
            let involved_layers: Vec<String> = layers_set.into_iter().collect();

            let confidence = std::cmp::min(99, 70 + (phase_count as u8 * 8) + (involved_layers.len() as u8 * 5));
            let severity = if has_critical || phase_count >= 3 {
                "Critical".to_string()
            } else {
                "High".to_string()
            };

            let target_user = asset.users.iter().next().cloned().unwrap_or_else(|| "SYSTEM".to_string());
            let title = format!(
                "XDR 多層複合威脅攻擊鏈 (Kill Chain: {} 階段連鎖, 涉資產: {})",
                phase_count, asset_key
            );

            let recommended_action = if severity == "Critical" {
                "isolate_host".to_string()
            } else {
                "quarantine_user".to_string()
            };

            let narrative = format!(
                "XDR 關聯引擎於資產 {} 上識別到跨層級進階威脅活動。涵蓋感測維度 [{}]，歷經 {} 個攻擊階段，置信度達 {}%。建議立即對主機實施網路微隔離。",
                asset_key,
                involved_layers.join(", "),
                phase_count,
                confidence
            );

            let incident = XdrCorrelationIncident {
                incident_id: incident_id.clone(),
                title,
                severity: severity.clone(),
                confidence_score: confidence,
                status: "Active_Investigating".to_string(),
                target_asset: asset_key.to_string(),
                target_user,
                started_at_nano: asset.recent_events.first().map(|e| e.timestamp_nano).unwrap_or(0),
                updated_at_nano: asset.recent_events.last().map(|e| e.timestamp_nano).unwrap_or(0),
                involved_layers,
                kill_chain_phases: phases_vec,
                recommended_action,
                ai_narrative: narrative,
            };

            self.incidents_correlated.fetch_add(1, Ordering::Relaxed);
            if severity == "Critical" {
                self.critical_containments.fetch_add(1, Ordering::Relaxed);
            }

            let mut incidents_map = self.active_incidents.write().unwrap();
            incidents_map.insert(incident_id, incident.clone());

            return Some(incident);
        }

        None
    }

    /// 批次寫入 XDR 事件至 VictoriaLogs 儲存核心 (封裝成高效能壓縮 Block)
    pub fn ingest_event_batch(&self, events: &[XdrEventRecord]) -> Result<usize> {
        if events.is_empty() {
            return Ok(0);
        }

        let stream_id = 9101u64; // XDR 全域串流 ID
        let part_tag = format!("xdr_part_{:x}", chrono::Utc::now().timestamp_nanos_opt().unwrap_or(0));
        let mut builder = BlockBuilder::new(stream_id, &part_tag, 1, 4096, 2 * 1024 * 1024);
        let count = events.len();

        for event in events {
            // 執行多層聯合關聯
            let _ = self.process_event(event);

            // 序列化為 NDJSON 格式
            let json_line = serde_json::to_string(event)?;
            builder.add_row(event.timestamp_nano, &json_line);

            // 注入重要識別特徵至 Bloom Filter (支援即時快速檢索)
            builder.bloom_filter.insert(&event.hostname);
            builder.bloom_filter.insert(&event.layer);
            builder.bloom_filter.insert(&event.severity);
            if !event.host_ip.is_empty() {
                builder.bloom_filter.insert(&event.host_ip);
            }
            if let Some(ref u) = event.username {
                builder.bloom_filter.insert(u);
            }
            if let Some(ref proc) = event.process_name {
                builder.bloom_filter.insert(proc);
            }
            if let Some(ref sha) = event.file_hash_sha256 {
                builder.bloom_filter.insert(sha);
            }
            if let Some(ref tech) = event.mitre_technique {
                builder.bloom_filter.insert(tech);
            }
        }

        if !builder.is_empty() {
            let block = builder.build()?;
            self.storage.append_block(&block)?;
        }

        Ok(count)
    }

    /// 輸出 XDR 引擎即時統計資訊
    pub fn telemetry(&self) -> serde_json::Value {
        let total = self.total_events_ingested.load(Ordering::Relaxed);
        let endpoint = self.endpoint_events.load(Ordering::Relaxed);
        let identity = self.identity_events.load(Ordering::Relaxed);
        let cloud = self.cloud_events.load(Ordering::Relaxed);
        let incidents = self.incidents_correlated.load(Ordering::Relaxed);
        let critical = self.critical_containments.load(Ordering::Relaxed);
        let active_assets = self.asset_graph.read().map(|g| g.len()).unwrap_or(0);
        let active_incidents_cnt = self.active_incidents.read().map(|i| i.len()).unwrap_or(0);

        serde_json::json!({
            "total_events_ingested": total,
            "endpoint_events": endpoint,
            "identity_events": identity,
            "cloud_events": cloud,
            "active_tracked_assets": active_assets,
            "active_incidents": active_incidents_cnt,
            "incidents_correlated": incidents,
            "critical_containments": critical,
            "engine_status": "ONLINE_CORRELATING"
        })
    }
}
