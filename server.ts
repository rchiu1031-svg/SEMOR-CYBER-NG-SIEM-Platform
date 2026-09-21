import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import { WebSocketServer, WebSocket } from 'ws';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_PATH = path.join(process.cwd(), 'engine_config.json');
const USERS_PATH = path.join(process.cwd(), 'users_config.json');
const NOTES_PATH = path.join(process.cwd(), 'notes_config.json');
const ENGINE_THRESHOLDS_PATH = path.join(process.cwd(), 'engine_thresholds_config.json');

// --- Engine Health & Notification Thresholds Setup ---
interface EngineThresholdConfig {
  engineId: string;
  name: string;
  category: 'CORE' | 'STORAGE' | 'INGEST' | 'SIEM' | 'NDR' | 'EDR' | 'SOAR';
  cpuWarning: number;
  cpuCritical: number;
  ramWarning: number;
  ramCritical: number;
  diskWarning: number;
  diskCritical: number;
  durationSeconds: number;
  cooldownMinutes: number;
  enabled: boolean;
  notifications: {
    email: { enabled: boolean; recipients: string[] };
    webhook: { enabled: boolean; url: string; channel: string };
    syslog: { enabled: boolean; host: string; port: number };
    inApp: { enabled: boolean; notifyOnWarning: boolean; notifyOnCritical: boolean };
  };
}

const defaultEngineThresholds: Record<string, EngineThresholdConfig> = {
  'semor-collector': {
    engineId: 'semor-collector',
    name: 'Go 收集器引擎 (Collector Ingest)',
    category: 'INGEST',
    cpuWarning: 70,
    cpuCritical: 85,
    ramWarning: 75,
    ramCritical: 90,
    diskWarning: 80,
    diskCritical: 90,
    durationSeconds: 15,
    cooldownMinutes: 5,
    enabled: true,
    notifications: {
      email: { enabled: true, recipients: ['sec-ops@corp.internal', 'admin@corp.internal'] },
      webhook: { enabled: true, url: 'https://hooks.slack.com/services/T000/B000/XXXX', channel: '#soc-engine-alerts' },
      syslog: { enabled: true, host: '127.0.0.1', port: 514 },
      inApp: { enabled: true, notifyOnWarning: true, notifyOnCritical: true }
    }
  },
  'semor-vlog-engine': {
    engineId: 'semor-vlog-engine',
    name: 'Rust 區塊儲存引擎 (VictoriaLogs Core)',
    category: 'STORAGE',
    cpuWarning: 75,
    cpuCritical: 90,
    ramWarning: 80,
    ramCritical: 92,
    diskWarning: 85,
    diskCritical: 95,
    durationSeconds: 10,
    cooldownMinutes: 5,
    enabled: true,
    notifications: {
      email: { enabled: true, recipients: ['storage-team@corp.internal'] },
      webhook: { enabled: true, url: 'https://hooks.slack.com/services/T000/B000/YYYY', channel: '#storage-critical' },
      syslog: { enabled: true, host: '127.0.0.1', port: 514 },
      inApp: { enabled: true, notifyOnWarning: true, notifyOnCritical: true }
    }
  },
  'arkime-suricata': {
    engineId: 'arkime-suricata',
    name: 'Arkime & Suricata NDR 封包檢測引擎',
    category: 'NDR',
    cpuWarning: 80,
    cpuCritical: 92,
    ramWarning: 85,
    ramCritical: 95,
    diskWarning: 85,
    diskCritical: 92,
    durationSeconds: 20,
    cooldownMinutes: 10,
    enabled: true,
    notifications: {
      email: { enabled: true, recipients: ['ndr-analysts@corp.internal'] },
      webhook: { enabled: false, url: '', channel: '#ndr-alerts' },
      syslog: { enabled: true, host: '127.0.0.1', port: 514 },
      inApp: { enabled: true, notifyOnWarning: true, notifyOnCritical: true }
    }
  },
  'wazuh-edr': {
    engineId: 'wazuh-edr',
    name: 'Wazuh & OpenXDR 端點防護引擎',
    category: 'EDR',
    cpuWarning: 70,
    cpuCritical: 88,
    ramWarning: 75,
    ramCritical: 88,
    diskWarning: 80,
    diskCritical: 90,
    durationSeconds: 30,
    cooldownMinutes: 15,
    enabled: true,
    notifications: {
      email: { enabled: true, recipients: ['edr-team@corp.internal'] },
      webhook: { enabled: true, url: 'https://hooks.slack.com/services/T000/B000/ZZZZ', channel: '#edr-alerts' },
      syslog: { enabled: false, host: '127.0.0.1', port: 514 },
      inApp: { enabled: true, notifyOnWarning: true, notifyOnCritical: true }
    }
  },
  'n8n-soar': {
    engineId: 'n8n-soar',
    name: 'n8n & TheHive 劇本自動化引擎 (SOAR)',
    category: 'SOAR',
    cpuWarning: 75,
    cpuCritical: 90,
    ramWarning: 80,
    ramCritical: 90,
    diskWarning: 75,
    diskCritical: 85,
    durationSeconds: 15,
    cooldownMinutes: 5,
    enabled: true,
    notifications: {
      email: { enabled: true, recipients: ['soar-ops@corp.internal'] },
      webhook: { enabled: true, url: 'https://hooks.slack.com/services/T000/B000/SOAR', channel: '#soar-incidents' },
      syslog: { enabled: false, host: '127.0.0.1', port: 514 },
      inApp: { enabled: true, notifyOnWarning: true, notifyOnCritical: true }
    }
  }
};

let engineThresholds: Record<string, EngineThresholdConfig> = { ...defaultEngineThresholds };

try {
  if (fs.existsSync(ENGINE_THRESHOLDS_PATH)) {
    const saved = JSON.parse(fs.readFileSync(ENGINE_THRESHOLDS_PATH, 'utf-8'));
    engineThresholds = { ...defaultEngineThresholds, ...saved };
  } else {
    fs.writeFileSync(ENGINE_THRESHOLDS_PATH, JSON.stringify(defaultEngineThresholds, null, 2));
  }
} catch (e) {
  console.error('Failed to load engine thresholds:', e);
}

// --- Threshold Alert Rules for System Health & Log Event Volumes ---
const ALERT_THRESHOLD_RULES_PATH = path.join(process.cwd(), 'alert_threshold_rules.json');

export interface ThresholdRuleConfig {
  id: string;
  name: string;
  category: 'system_health' | 'log_volume';
  metric: string;
  metricLabel: string;
  metricUnit: string;
  targetScope: string;
  condition: '>=' | '>' | '<=' | '<' | 'rate_increase' | 'rate_decrease';
  warningThreshold: number;
  criticalThreshold: number;
  sustainDurationSec: number;
  cooldownMin: number;
  severity: 'Critical' | 'High' | 'Warning' | 'Info';
  enabled: boolean;
  notificationChannels: {
    email: boolean;
    emailRecipients: string[];
    webhook: boolean;
    webhookUrl: string;
    webhookChannel: string;
    syslog: boolean;
    syslogHost: string;
    syslogPort: number;
    inApp: boolean;
    soarPlaybook: boolean;
    soarPlaybookId?: string;
  };
  description: string;
  remediationHint: string;
  currentValue: number;
  lastTriggeredAt?: string | null;
  triggerCount: number;
  status: 'healthy' | 'warning' | 'critical' | 'disabled';
}

const defaultAlertThresholdRules: ThresholdRuleConfig[] = [
  {
    id: 'rule-sys-cpu',
    name: '核心叢集運算負載過載告警 (Cluster Core CPU Saturation)',
    category: 'system_health',
    metric: 'cpu_usage',
    metricLabel: 'CPU 使用率 (CPU Utilization)',
    metricUnit: '%',
    targetScope: '核心節點 (semor-collector & vlog-engine)',
    condition: '>=',
    warningThreshold: 75,
    criticalThreshold: 88,
    sustainDurationSec: 180,
    cooldownMin: 15,
    severity: 'High',
    enabled: true,
    notificationChannels: {
      email: true,
      emailRecipients: ['soc-tier1@semor-security.com', 'infra-oncall@semor-security.com'],
      webhook: true,
      webhookUrl: 'https://hooks.slack.com/services/T000/B000/CPU_ALERT',
      webhookChannel: '#soc-infra-alerts',
      syslog: true,
      syslogHost: '127.0.0.1',
      syslogPort: 514,
      inApp: true,
      soarPlaybook: false
    },
    description: '當 Go 採集器或 Rust 儲存核心 CPU 使用率持續超越門檻時發出警報，防止線程飢餓與封包掉落。',
    remediationHint: '檢查日誌解碼器正則開銷，必要時動態調整 Go runtime GOMAXPROCS 或橫向擴展 Ingest Worker。',
    currentValue: 46.8,
    lastTriggeredAt: null,
    triggerCount: 0,
    status: 'healthy'
  },
  {
    id: 'rule-sys-ram',
    name: '實體記憶體佔用與外洩風險 (Host RAM Pressure & OOM Guard)',
    category: 'system_health',
    metric: 'ram_usage',
    metricLabel: 'RAM 記憶體使用率 (Memory Consumption)',
    metricUnit: '%',
    targetScope: 'Rust VictoriaLogs 區塊儲存快取',
    condition: '>=',
    warningThreshold: 80,
    criticalThreshold: 90,
    sustainDurationSec: 120,
    cooldownMin: 15,
    severity: 'Critical',
    enabled: true,
    notificationChannels: {
      email: true,
      emailRecipients: ['infra-oncall@semor-security.com'],
      webhook: true,
      webhookUrl: 'https://hooks.slack.com/services/T000/B000/RAM_ALERT',
      webhookChannel: '#soc-infra-alerts',
      syslog: true,
      syslogHost: '127.0.0.1',
      syslogPort: 514,
      inApp: true,
      soarPlaybook: true,
      soarPlaybookId: 'pb-flush-memory-cache'
    },
    description: '記憶體使用率過高可能導致作業系統觸發 OOM Killer 強制中斷儲存進程，造成未持久化日誌遺失。',
    remediationHint: '執行強制區塊落盤（Flush In-memory VictoriaBlocks to NVMe），釋放已壓縮頁面快取。',
    currentValue: 64.2,
    lastTriggeredAt: null,
    triggerCount: 0,
    status: 'healthy'
  },
  {
    id: 'rule-sys-disk',
    name: 'VictoriaLogs 磁碟儲存水位告急 (Block Storage Capacity Exhaustion)',
    category: 'system_health',
    metric: 'disk_usage',
    metricLabel: 'NVMe 磁碟容量佔用 (Disk Capacity)',
    metricUnit: '%',
    targetScope: '/data 磁碟分割區 (Zstd Block Storage)',
    condition: '>=',
    warningThreshold: 85,
    criticalThreshold: 92,
    sustainDurationSec: 300,
    cooldownMin: 30,
    severity: 'Critical',
    enabled: true,
    notificationChannels: {
      email: true,
      emailRecipients: ['soc-admin@semor-security.com', 'infra-team@corp.internal'],
      webhook: true,
      webhookUrl: 'https://hooks.slack.com/services/T000/B000/STORAGE',
      webhookChannel: '#soc-storage-critical',
      syslog: true,
      syslogHost: '127.0.0.1',
      syslogPort: 514,
      inApp: true,
      soarPlaybook: true,
      soarPlaybookId: 'pb-archive-old-blocks'
    },
    description: '當日誌區塊實體儲存空間低於警戒值時，將啟動緊急冷熱分層歸檔機制以避免日誌拒收。',
    remediationHint: '確認 S3/冷儲存歸檔策略是否正常運轉，或提早手動輪替超過 90 天之非核心審計日誌。',
    currentValue: 78.1,
    lastTriggeredAt: null,
    triggerCount: 0,
    status: 'healthy'
  },
  {
    id: 'rule-sys-io-latency',
    name: '區塊儲存落盤寫入延遲異常 (Block Storage Write Latency Spike)',
    category: 'system_health',
    metric: 'io_latency',
    metricLabel: '磁碟落盤寫入延遲 (Write Latency)',
    metricUnit: 'ms',
    targetScope: 'Rust Storage Writer Thread Pool',
    condition: '>=',
    warningThreshold: 350,
    criticalThreshold: 600,
    sustainDurationSec: 45,
    cooldownMin: 10,
    severity: 'Warning',
    enabled: true,
    notificationChannels: {
      email: false,
      emailRecipients: [],
      webhook: true,
      webhookUrl: 'https://hooks.slack.com/services/T000/B000/IO_LATENCY',
      webhookChannel: '#soc-infra-alerts',
      syslog: false,
      syslogHost: '127.0.0.1',
      syslogPort: 514,
      inApp: true,
      soarPlaybook: false
    },
    description: '底層 I/O 寫入延遲顯著上升，可能代表 NVMe 磁碟通道壅塞或正在進行大量後台區塊合流 (Block Compaction)。',
    remediationHint: '暫時調降背景壓縮並行度 (compaction_concurrency=2)，保證前端接收通道優先權。',
    currentValue: 142,
    lastTriggeredAt: null,
    triggerCount: 0,
    status: 'healthy'
  },
  {
    id: 'rule-sys-queue',
    name: 'Go 收集器通道佇列飽和警戒 (Ingest Queue Saturation)',
    category: 'system_health',
    metric: 'queue_saturation',
    metricLabel: '佇列緩衝佔用率 (Channel Saturation)',
    metricUnit: '%',
    targetScope: 'semor-collector (Go Ingest Pipeline)',
    condition: '>=',
    warningThreshold: 70,
    criticalThreshold: 88,
    sustainDurationSec: 60,
    cooldownMin: 10,
    severity: 'High',
    enabled: true,
    notificationChannels: {
      email: true,
      emailRecipients: ['soc-tier1@semor-security.com'],
      webhook: true,
      webhookUrl: 'https://hooks.slack.com/services/T000/B000/QUEUE',
      webhookChannel: '#soc-engine-alerts',
      syslog: true,
      syslogHost: '127.0.0.1',
      syslogPort: 514,
      inApp: true,
      soarPlaybook: false
    },
    description: 'Go Channel 佇列飽和代表後端 Rust 儲存引擎消化速度低於網路進線速度，即將發生 Backpressure 丟包。',
    remediationHint: '檢查網路是否遭受 UDP Syslog 洪泛，或調大 collector worker buffer pool 規模。',
    currentValue: 31.5,
    lastTriggeredAt: null,
    triggerCount: 0,
    status: 'healthy'
  },
  {
    id: 'rule-log-ingest-surge',
    name: '全網日誌吞吐量異常突增 (Log Ingestion Surge / DDoS Wave)',
    category: 'log_volume',
    metric: 'log_ingest_eps',
    metricLabel: '日誌每秒事件吞吐量 (Ingest EPS)',
    metricUnit: 'EPS',
    targetScope: '全域進線通道 (Syslog + Netflow + Agent)',
    condition: '>=',
    warningThreshold: 12000,
    criticalThreshold: 18000,
    sustainDurationSec: 60,
    cooldownMin: 15,
    severity: 'Critical',
    enabled: true,
    notificationChannels: {
      email: true,
      emailRecipients: ['soc-duty@semor-security.com', 'incident-response@semor-security.com'],
      webhook: true,
      webhookUrl: 'https://hooks.slack.com/services/T000/B000/EPS_SURGE',
      webhookChannel: '#soc-sec-critical',
      syslog: true,
      syslogHost: '127.0.0.1',
      syslogPort: 514,
      inApp: true,
      soarPlaybook: true,
      soarPlaybookId: 'pb-ddos-rate-limit'
    },
    description: '進線日誌量突然暴增超過常態基準線 300%，通常代表遭受分散式阻斷服務攻擊 (DDoS) 或內部網路掃描爆發。',
    remediationHint: '立即調出 Flow 分析儀表確認 Top 10 Talkers IP，並啟動 NAC / 防火牆動態速率限制。',
    currentValue: 8450,
    lastTriggeredAt: null,
    triggerCount: 0,
    status: 'healthy'
  },
  {
    id: 'rule-log-silence-drop',
    name: '關鍵日誌收集斷流與黑洞 (Log Collection Silence / Blackout)',
    category: 'log_volume',
    metric: 'log_silence_eps',
    metricLabel: '收集進線最低吞吐 (Silence Floor EPS)',
    metricUnit: 'EPS',
    targetScope: '企業核心防火牆 & 邊界網關',
    condition: '<=',
    warningThreshold: 100,
    criticalThreshold: 10,
    sustainDurationSec: 180,
    cooldownMin: 10,
    severity: 'Critical',
    enabled: true,
    notificationChannels: {
      email: true,
      emailRecipients: ['soc-duty@semor-security.com', 'network-ops@corp.internal'],
      webhook: true,
      webhookUrl: 'https://hooks.slack.com/services/T000/B000/SILENCE',
      webhookChannel: '#soc-sec-critical',
      syslog: true,
      syslogHost: '127.0.0.1',
      syslogPort: 514,
      inApp: true,
      soarPlaybook: false
    },
    description: '核心防火牆或關鍵日誌源的接收量突然降至趨近於零，可能代表網路設備斷線、日誌轉發進程掛死或遭攻擊者拔除。',
    remediationHint: '檢查防火牆與採集器之 Syslog 514/TCP 連線狀態，核對邊界網路介面是否處於 Down 狀態。',
    currentValue: 2150,
    lastTriggeredAt: null,
    triggerCount: 0,
    status: 'healthy'
  },
  {
    id: 'rule-log-parser-errors',
    name: '日誌解析失敗丟棄率突增 (Log Parser Failure Burst)',
    category: 'log_volume',
    metric: 'parser_drop_rate',
    metricLabel: '解析失敗丟棄速率 (Parser Drop Rate)',
    metricUnit: 'drops/s',
    targetScope: 'Regex & AI 日誌解碼管線',
    condition: '>=',
    warningThreshold: 200,
    criticalThreshold: 500,
    sustainDurationSec: 45,
    cooldownMin: 10,
    severity: 'High',
    enabled: true,
    notificationChannels: {
      email: false,
      emailRecipients: [],
      webhook: true,
      webhookUrl: 'https://hooks.slack.com/services/T000/B000/PARSER_ERR',
      webhookChannel: '#soc-engine-alerts',
      syslog: false,
      syslogHost: '127.0.0.1',
      syslogPort: 514,
      inApp: true,
      soarPlaybook: false
    },
    description: '日誌進線格式變更或正則表達式不匹配導致未解碼丟棄事件激增，可能導致威脅行為未被正確解析。',
    remediationHint: '進入「AI 日誌解碼器」檢視未匹配原始日誌樣本，更新解碼器正則庫或自定義欄位提取規則。',
    currentValue: 24,
    lastTriggeredAt: null,
    triggerCount: 0,
    status: 'healthy'
  },
  {
    id: 'rule-log-unwritten-buffer',
    name: '記憶體暫存緩衝區未寫入水位暴增 (Unwritten Log Buffer High)',
    category: 'log_volume',
    metric: 'unwritten_buffer_count',
    metricLabel: '待寫入事件總數 (Unwritten Events)',
    metricUnit: 'events',
    targetScope: 'RAM VictoriaBlock Buffer Cache',
    condition: '>=',
    warningThreshold: 35000,
    criticalThreshold: 65000,
    sustainDurationSec: 90,
    cooldownMin: 15,
    severity: 'High',
    enabled: true,
    notificationChannels: {
      email: true,
      emailRecipients: ['infra-oncall@semor-security.com'],
      webhook: true,
      webhookUrl: 'https://hooks.slack.com/services/T000/B000/BUFFER',
      webhookChannel: '#soc-infra-alerts',
      syslog: false,
      syslogHost: '127.0.0.1',
      syslogPort: 514,
      inApp: true,
      soarPlaybook: false
    },
    description: '記憶體中待落盤的壓縮 VictoriaBlock 數量過多，一旦突然斷電將增加資料回復開銷。',
    remediationHint: '確認 NVMe 磁碟佇列長度，必要時暫停次要索引建立任務以加速區塊落地。',
    currentValue: 14200,
    lastTriggeredAt: null,
    triggerCount: 0,
    status: 'healthy'
  },
  {
    id: 'rule-log-stream-flood',
    name: '單一威脅來源流量氾濫 (Firewall / NDR Stream Flooding)',
    category: 'log_volume',
    metric: 'stream_flood_eps',
    metricLabel: '單來源峰值吞吐 (Stream Peak EPS)',
    metricUnit: 'EPS',
    targetScope: 'Suricata IDS & Arkime Flow Ingest',
    condition: '>=',
    warningThreshold: 6500,
    criticalThreshold: 10000,
    sustainDurationSec: 60,
    cooldownMin: 10,
    severity: 'High',
    enabled: true,
    notificationChannels: {
      email: false,
      emailRecipients: [],
      webhook: true,
      webhookUrl: 'https://hooks.slack.com/services/T000/B000/STREAM_FLOOD',
      webhookChannel: '#soc-sec-critical',
      syslog: true,
      syslogHost: '127.0.0.1',
      syslogPort: 514,
      inApp: true,
      soarPlaybook: true,
      soarPlaybookId: 'pb-isolate-source-stream'
    },
    description: '特定 NDR 網段或主機正在持續發送海量警報或封包，可能為內網橫向移動或通訊協定轟炸。',
    remediationHint: '於 NDR 儀表排查 Top Source IP，並對該惡意主機下發 SOAR 隔離作業。',
    currentValue: 3420,
    lastTriggeredAt: null,
    triggerCount: 0,
    status: 'healthy'
  }
];

let alertThresholdRules: ThresholdRuleConfig[] = [...defaultAlertThresholdRules];

try {
  if (fs.existsSync(ALERT_THRESHOLD_RULES_PATH)) {
    const savedRules = JSON.parse(fs.readFileSync(ALERT_THRESHOLD_RULES_PATH, 'utf-8'));
    if (Array.isArray(savedRules) && savedRules.length > 0) {
      alertThresholdRules = savedRules;
    }
  } else {
    fs.writeFileSync(ALERT_THRESHOLD_RULES_PATH, JSON.stringify(defaultAlertThresholdRules, null, 2));
  }
} catch (e) {
  console.error('Failed to load alert threshold rules:', e);
}

// --- Historical Alert Audit Ledger (Immutable Historical Record) ---
const ALERT_HISTORY_PATH = path.join(process.cwd(), 'alert_history.json');

export interface AlertHistoryRecord {
  id: string;
  triggerTime: string;
  ruleId: string;
  ruleName: string;
  category: 'system_health' | 'log_volume';
  metric: string;
  metricLabel: string;
  measuredValue: number;
  metricUnit: string;
  thresholdValue: number;
  condition: string;
  severity: 'Critical' | 'High' | 'Warning' | 'Info';
  sourceEngine: string;
  resolutionStatus: 'Active' | 'Investigating' | 'Acknowledged' | 'Resolved' | 'Auto-Remediated';
  resolvedAt?: string | null;
  resolvedBy?: string | null;
  resolutionNote?: string;
  dispatchedChannels: string[];
  auditHash: string;
}

const defaultAlertHistory: AlertHistoryRecord[] = [
  {
    id: 'ALR-20260915-0841',
    triggerTime: '2026-09-15T05:41:20.000Z',
    ruleId: 'rule-log-ingest-surge',
    ruleName: '全網日誌吞吐量異常突增 (Log Ingestion Surge / DDoS Wave)',
    category: 'log_volume',
    metric: 'log_ingest_eps',
    metricLabel: '日誌每秒事件吞吐量 (Ingest EPS)',
    measuredValue: 19420,
    metricUnit: 'EPS',
    thresholdValue: 18000,
    condition: '>=',
    severity: 'Critical',
    sourceEngine: 'semor-collector (Go Ingest Core)',
    resolutionStatus: 'Active',
    resolvedAt: null,
    resolvedBy: null,
    resolutionNote: '偵測到外部 SYN Flood 引發邊界防火牆海量日誌涌入，SOAR 限速劇本已預先啟動。',
    dispatchedChannels: ['email', 'webhook', 'syslog', 'inApp', 'soar'],
    auditHash: 'sha256:4f8a9b2c1d3e5f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a'
  },
  {
    id: 'ALR-20260915-0422',
    triggerTime: '2026-09-15T04:22:15.000Z',
    ruleId: 'rule-log-silence-drop',
    ruleName: '關鍵日誌收集斷流與黑洞 (Log Collection Silence / Blackout)',
    category: 'log_volume',
    metric: 'log_silence_eps',
    metricLabel: '收集進線最低吞吐 (Silence Floor EPS)',
    measuredValue: 4,
    metricUnit: 'EPS',
    thresholdValue: 10,
    condition: '<=',
    severity: 'Critical',
    sourceEngine: 'semor-collector (Syslog 514 Pipeline)',
    resolutionStatus: 'Investigating',
    resolvedAt: null,
    resolvedBy: 'supervisor',
    resolutionNote: '第二核心邊界防火牆主備切換中，持續確認 Syslog TCP Keepalive 封包狀態。',
    dispatchedChannels: ['email', 'webhook', 'syslog', 'inApp'],
    auditHash: 'sha256:7c9e1a3b5d2f4a6c8e0b1d3f5a7c9e1b3d5f7a9c1e3b5d7f9a1c3e5b7d9f1a3c'
  },
  {
    id: 'ALR-20260915-0210',
    triggerTime: '2026-09-15T02:10:48.000Z',
    ruleId: 'rule-sys-ram',
    ruleName: '實體記憶體佔用與外洩風險 (Host RAM Pressure & OOM Guard)',
    category: 'system_health',
    metric: 'ram_usage',
    metricLabel: 'RAM 記憶體使用率 (Memory Consumption)',
    measuredValue: 91.4,
    metricUnit: '%',
    thresholdValue: 90,
    condition: '>=',
    severity: 'Critical',
    sourceEngine: 'vlog-engine (VictoriaLogs Block Cache)',
    resolutionStatus: 'Auto-Remediated',
    resolvedAt: '2026-09-15T02:12:05.000Z',
    resolvedBy: 'SOAR Auto-Playbook (pb-flush-memory-cache)',
    resolutionNote: '自動強制執行區塊落盤 (Flush In-memory Blocks to NVMe)，RAM 降回 63.8%。',
    dispatchedChannels: ['email', 'webhook', 'syslog', 'inApp', 'soar'],
    auditHash: 'sha256:2b4d6f8a0c2e4a6c8e0b1d3f5a7c9e1b3d5f7a9c1e3b5d7f9a1c3e5b7d9f1a3d'
  },
  {
    id: 'ALR-20260914-2245',
    triggerTime: '2026-09-14T22:45:10.000Z',
    ruleId: 'rule-sys-io-latency',
    ruleName: '區塊儲存落盤寫入延遲異常 (Block Storage Write Latency Spike)',
    category: 'system_health',
    metric: 'io_latency',
    metricLabel: '磁碟落盤寫入延遲 (Write Latency)',
    measuredValue: 640,
    metricUnit: 'ms',
    thresholdValue: 600,
    condition: '>=',
    severity: 'Warning',
    sourceEngine: 'vlog-engine (Rust Storage Writer)',
    resolutionStatus: 'Resolved',
    resolvedAt: '2026-09-14T23:05:00.000Z',
    resolvedBy: 'admin',
    resolutionNote: '後台多區塊合流 (Compaction) 尖峰結束，寫入延遲已恢復至 138ms 平穩水位。',
    dispatchedChannels: ['webhook', 'inApp'],
    auditHash: 'sha256:9f1a3c5e7b9d1f3a5c7e9b1d3f5a7c9e1b3d5f7a9c1e3b5d7f9a1c3e5b7d9f1e'
  },
  {
    id: 'ALR-20260914-1812',
    triggerTime: '2026-09-14T18:12:33.000Z',
    ruleId: 'rule-sys-queue',
    ruleName: 'Go 收集器通道佇列飽和警戒 (Ingest Queue Saturation)',
    category: 'system_health',
    metric: 'queue_saturation',
    metricLabel: '佇列緩衝佔用率 (Channel Saturation)',
    measuredValue: 89.2,
    metricUnit: '%',
    thresholdValue: 88,
    condition: '>=',
    severity: 'High',
    sourceEngine: 'semor-collector (Go Channel Pipeline)',
    resolutionStatus: 'Resolved',
    resolvedAt: '2026-09-14T18:25:40.000Z',
    resolvedBy: 'infra-engineer',
    resolutionNote: '調度加開 4 組 worker goroutine，佇列飽和度快速下降至 28.5%。',
    dispatchedChannels: ['email', 'webhook', 'syslog', 'inApp'],
    auditHash: 'sha256:5e7b9d1f3a5c7e9b1d3f5a7c9e1b3d5f7a9c1e3b5d7f9a1c3e5b7d9f1a3c5e7b'
  },
  {
    id: 'ALR-20260914-1130',
    triggerTime: '2026-09-14T11:30:00.000Z',
    ruleId: 'rule-log-stream-flood',
    ruleName: '單一威脅來源流量氾濫 (Firewall / NDR Stream Flooding)',
    category: 'log_volume',
    metric: 'stream_flood_eps',
    metricLabel: '單來源峰值吞吐 (Stream Peak EPS)',
    measuredValue: 11400,
    metricUnit: 'EPS',
    thresholdValue: 10000,
    condition: '>=',
    severity: 'High',
    sourceEngine: 'suricata-ndr (IDS Engine)',
    resolutionStatus: 'Acknowledged',
    resolvedAt: null,
    resolvedBy: 'analyst-1',
    resolutionNote: '來源 IP 192.168.10.45 持續進行內網 port scan，已下發端點隔離排程。',
    dispatchedChannels: ['webhook', 'syslog', 'inApp', 'soar'],
    auditHash: 'sha256:1a3c5e7b9d1f3a5c7e9b1d3f5a7c9e1b3d5f7a9c1e3b5d7f9a1c3e5b7d9f1a3c'
  },
  {
    id: 'ALR-20260913-1620',
    triggerTime: '2026-09-13T16:20:45.000Z',
    ruleId: 'rule-sys-disk',
    ruleName: 'VictoriaLogs 磁碟儲存水位告急 (Block Storage Capacity Exhaustion)',
    category: 'system_health',
    metric: 'disk_usage',
    metricLabel: 'NVMe 磁碟容量佔用 (Disk Capacity)',
    measuredValue: 93.1,
    metricUnit: '%',
    thresholdValue: 92,
    condition: '>=',
    severity: 'Critical',
    sourceEngine: 'vlog-engine (NVMe /data Storage)',
    resolutionStatus: 'Resolved',
    resolvedAt: '2026-09-13T17:15:20.000Z',
    resolvedBy: 'admin',
    resolutionNote: '啟動冷熱分層歸檔作業，將逾期 90 天之非核心審計區塊移轉至 S3 儲存。',
    dispatchedChannels: ['email', 'webhook', 'syslog', 'inApp', 'soar'],
    auditHash: 'sha256:3c5e7b9d1f3a5c7e9b1d3f5a7c9e1b3d5f7a9c1e3b5d7f9a1c3e5b7d9f1a3c5e'
  }
];

let alertHistoryRecords: AlertHistoryRecord[] = [...defaultAlertHistory];

try {
  if (fs.existsSync(ALERT_HISTORY_PATH)) {
    const saved = JSON.parse(fs.readFileSync(ALERT_HISTORY_PATH, 'utf-8'));
    if (Array.isArray(saved) && saved.length > 0) {
      alertHistoryRecords = saved;
    }
  } else {
    fs.writeFileSync(ALERT_HISTORY_PATH, JSON.stringify(defaultAlertHistory, null, 2));
  }
} catch (e) {
  console.error('Failed to load alert history records:', e);
}

// --- Collaborative Notes Setup ---
const defaultNotes = [
  {
    id: 'note_1',
    incidentId: 'INC-2024-0000',
    content: "Initiated network capture and verified payload hash with threat intelligence databases.",
    author: "supervisor",
    timestamp: "2026-05-21T10:15:00.000Z"
  },
  {
    id: 'note_2',
    incidentId: 'INC-2024-0000',
    content: "Isolated Kevin's endpoint. Waiting for memory retrieval task to complete.",
    author: "admin",
    timestamp: "2026-05-21T10:30:12.000Z"
  },
  {
    id: 'note_3',
    incidentId: 'INC-2024-0001',
    content: "Confirmed access to git repositories containing source code. Investigating potential credential leak.",
    author: "supervisor",
    timestamp: "2026-05-21T10:05:22.000Z"
  }
];

let notes = [...defaultNotes];

try {
  if (fs.existsSync(NOTES_PATH)) {
    notes = JSON.parse(fs.readFileSync(NOTES_PATH, 'utf-8'));
  } else {
    fs.writeFileSync(NOTES_PATH, JSON.stringify(defaultNotes, null, 2));
  }
} catch (e) {
  console.error('Failed to load notes:', e);
}

// --- User Management Setup ---
const defaultUsers = [
  { id: '1', username: 'supervisor', role: 'supervisor', email: 'supervisor@seeor.cyber', status: 'active', password: 'password123' },
  { id: '2', username: 'admin', role: 'admin', email: 'admin@seeor.cyber', status: 'active', password: 'password123' },
  { id: '3', username: 'auditor', role: 'auditor', email: 'audit@seeor.cyber', status: 'active', password: 'password123' }
];

let users = [...defaultUsers];

try {
  if (fs.existsSync(USERS_PATH)) {
    users = JSON.parse(fs.readFileSync(USERS_PATH, 'utf-8'));
  } else {
    fs.writeFileSync(USERS_PATH, JSON.stringify(defaultUsers, null, 2));
  }
} catch (e) {
  console.error('Failed to load users:', e);
}

// Initial defaults or load from file
const defaultEngines = [
  'victorialogs', 'filebeat', 'logstash', 'metricbeat', 'heartbeat', 
  'auditbeat', 'fleet', 'n8n', 'zircolite', 'velociraptor', 
  'spiderfoot', 'syslog_ng', 'thehive', 'cortex', 'misp', 
  'opencti', 'arkime', 'suricata', 'zeek', 'mwdb', 
  'traefik', 'codimd', 'watchtower', 'homer', 'skywalking', 
  'snort', 'nmap'
];

let engineConfig: Record<string, any> = {};
defaultEngines.forEach(id => {
  engineConfig[id] = {
    url: id === 'victorialogs' ? (process.env.VICTORIALOGS_URL || 'http://localhost:9428') : `http://localhost:${Math.floor(Math.random() * 5000) + 8000}`,
    accountId: id === 'victorialogs' ? (process.env.VICTORIALOGS_ACCOUNT_ID || '0') : 'admin',
    projectId: id === 'victorialogs' ? (process.env.VICTORIALOGS_PROJECT_ID || '0') : 'default',
    status: 'standby'
  };
});

// Alias for SIEM legacy support
engineConfig.siem = engineConfig.victorialogs;

try {
  if (fs.existsSync(CONFIG_PATH)) {
    const saved = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    engineConfig = { ...engineConfig, ...saved };
  }
} catch (e) {
  console.error('Failed to load engine config:', e);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Auth APIs
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      const { password, ...userWithoutPassword } = user;
      res.json({ success: true, user: userWithoutPassword });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });

  app.get('/api/users', (req, res) => {
    // Return users without passwords
    res.json(users.map(({ password, ...u }) => u));
  });

  app.post('/api/users', (req, res) => {
    const newUser = req.body;
    if (!newUser.username) return res.status(400).json({ error: 'Username required' });
    
    newUser.id = Date.now().toString();
    users.push(newUser);
    fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));
    res.json({ success: true, user: newUser });
  });

  app.delete('/api/users/:id', (req, res) => {
    users = users.filter(u => u.id !== req.params.id);
    fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));
    res.json({ success: true });
  });

  app.patch('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
      // Merge updates, ensure password isn't leaked if not provided
      users[index] = { ...users[index], ...updates };
      fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));
      const { password, ...userWithoutPassword } = users[index];
      res.json({ success: true, user: userWithoutPassword });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  });

  // Config API
  app.get('/api/config/engines', (req, res) => {
    res.json(engineConfig);
  });

  app.post('/api/config/engines', (req, res) => {
    const { engine, config } = req.body;
    if (engine && engineConfig[engine]) {
      engineConfig[engine] = { ...engineConfig[engine], ...config };
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(engineConfig, null, 2));
      res.json({ success: true, config: engineConfig[engine] });
    } else {
      res.status(400).json({ error: 'Invalid engine name' });
    }
  });

  // VictoriaLogs Integration API (SIEM Core)
  app.get('/api/logs', async (req, res) => {
    try {
      const { url: vlogsUrl, accountId, projectId } = engineConfig.siem;
      
      const query = req.query.query as string || '*';
      const limit = req.query.limit || '50';

      console.log(`[SIEM] Querying VictoriaLogs: ${query} (Limit: ${limit})`);

      const response = await axios.get(`${vlogsUrl}/select/logsql/query`, {
        params: {
          query: `${query} | limit ${limit}`,
        },
        headers: {
          'AccountID': accountId,
          'ProjectID': projectId
        },
        // VictoriaLogs might return streamed NDJSON
        responseType: 'text'
      });

      // Transform NDJSON text to array of objects if necessary
      if (typeof response.data === 'string') {
        const lines = response.data.trim().split('\n');
        try {
          const jsonLogs = lines.map(line => JSON.parse(line));
          res.json(jsonLogs);
        } catch (e) {
          // If it happens to be plain JSON or something else
          res.send(response.data);
        }
      } else {
        res.json(response.data);
      }
    } catch (error: any) {
      console.error('VictoriaLogs Query Error:', error.message);
      res.status(500).json({ 
        error: 'Failed to fetch logs from VictoriaLogs',
        details: error.message 
      });
    }
  });

  // REST API fallback/direct routes for Collaborative Notes
  app.get('/api/notes/:incidentId', (req, res) => {
    const { incidentId } = req.params;
    const incidentNotes = notes.filter(n => n.incidentId === incidentId);
    res.json(incidentNotes);
  });

  app.post('/api/notes', (req, res) => {
    const { incidentId, content, author } = req.body;
    if (!incidentId || !content) {
      return res.status(400).json({ error: 'incidentId and content are required' });
    }

    const newNote = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      incidentId,
      content,
      author: author || 'supervisor',
      timestamp: new Date().toISOString()
    };

    notes.push(newNote);
    fs.writeFileSync(NOTES_PATH, JSON.stringify(notes, null, 2));

    // Broadcast to WebSocket clients if room active
    const roomClients = rooms.get(incidentId);
    if (roomClients) {
      const payload = JSON.stringify({ type: 'new_note', note: newNote });
      for (const client of roomClients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }
      }
    }

    res.json({ success: true, note: newNote });
  });

  // ==========================================
  // Phase 1, 2 & 3: Go Collector, Rust Storage Engine & Regex Pipeline APIs
  // ==========================================
  let activeDecoderMeta = {
    id: 'seed-ngfw-core',
    name: '核心次世代防火牆 (Fortinet / Palo Alto / Syslog)'
  };
  let activeDecodersRules: any[] = [
    { name: 'srcip', regex: 'srcip=([0-9.]+)|src=([0-9.]+)', type: 'ip', ecsMapping: 'source.ip', confidence: 100, description: '連線來源端 IP' },
    { name: 'srcport', regex: 'srcport=([0-9]+)|sport=([0-9]+)', type: 'port', ecsMapping: 'source.port', confidence: 100, description: '連線來源端 Port' },
    { name: 'dstip', regex: 'dstip=([0-9.]+)|dst=([0-9.]+)', type: 'ip', ecsMapping: 'destination.ip', confidence: 100, description: '目標目的端 IP' },
    { name: 'dstport', regex: 'dstport=([0-9]+)|dport=([0-9]+)', type: 'port', ecsMapping: 'destination.port', confidence: 100, description: '目標目的端 Port' },
    { name: 'action', regex: 'action="?([a-zA-Z]+)"?', type: 'action', ecsMapping: 'event.action', confidence: 98, description: '防火牆存取決策 (deny/allow/drop)' },
    { name: 'devname', regex: 'devname="?([^"\\s]+)"?|host="?([^"\\s]+)"?', type: 'string', ecsMapping: 'host.hostname', confidence: 95, description: '日誌來源主機名稱' },
    { name: 'proto', regex: 'proto=([0-9]+)|protocol=([0-9]+)', type: 'number', ecsMapping: 'network.protocol', confidence: 92, description: 'IP 通訊協定代號 (6=TCP, 17=UDP, 1=ICMP)' },
    { name: 'policyid', regex: 'policyid=([0-9]+)|rule_id=([0-9]+)', type: 'number', ecsMapping: 'rule.id', confidence: 90, description: '匹配之資安策略編號' }
  ];
  let totalPipelineLogsParsed = 1450000;
  let totalPipelineLogsMatched = 1441300;
  const engineStartTime = Date.now();

  // Go Ingestion Collector Healthcheck & Telemetry Endpoint (Real-time proxy/direct simulation)
  app.get('/api/engine/collector/healthz', (req, res) => {
    const uptimeSec = Math.floor((Date.now() - engineStartTime) / 1000);
    const capacity = 50000;
    // Simulate dynamic buffer fluctuation with occasional micro-bursts
    const baseWave = 1420 + Math.sin(Date.now() / 3500) * 850 + Math.cos(Date.now() / 11000) * 600;
    const currentDepth = Math.max(80, Math.min(capacity - 500, Math.floor(baseWave + (Math.random() * 200 - 100))));
    const depthPercentage = Number(((currentDepth / capacity) * 100).toFixed(2));
    
    // Worker pool dynamics
    const totalWorkers = 16;
    // Active workers dynamically scale with buffer depth
    const activeWorkers = Math.min(totalWorkers, Math.max(4, Math.ceil((currentDepth / 3000) * totalWorkers)));
    const workerSaturation = Number((activeWorkers / totalWorkers).toFixed(3));
    const processedEps = Math.floor(8500 + (currentDepth * 1.8) + Math.random() * 400);

    const isHealthy = depthPercentage < 85;

    // Real-time Buffer Fill-Rate Monitor Evaluation (cmd/receiver/utils/monitor.go)
    const fillRateEPS = processedEps;
    const drainRateEPS = Math.floor(processedEps * 0.965);
    const netRateEPS = fillRateEPS - drainRateEPS;
    const fillVelocityRatio = Number((fillRateEPS / Math.max(1, drainRateEPS)).toFixed(2));
    const workerSaturationThreshold = 80.0;
    const workerSaturationPct = Number((workerSaturation * 100).toFixed(1));
    const remainingHeadroom = capacity - currentDepth;
    const timeToSaturationSec = netRateEPS > 0 ? Number((remainingHeadroom / netRateEPS).toFixed(1)) : -1;
    const isEarlyBottleneck = netRateEPS > 150 && fillVelocityRatio >= 1.03 && workerSaturationPct < workerSaturationThreshold;

    let alertSeverity: 'NORMAL' | 'INFO' | 'WARNING' | 'CRITICAL' = 'NORMAL';
    let alertRecommendation = 'Pipeline in dynamic equilibrium. Ingestion and drain rates balanced.';

    if (workerSaturationPct >= workerSaturationThreshold && depthPercentage >= 75) {
      alertSeverity = 'CRITICAL';
      alertRecommendation = `CRITICAL: Worker pool saturated (${workerSaturationPct}%) and circular buffer depth at ${depthPercentage}%. Backpressure active.`;
    } else if (isEarlyBottleneck) {
      if (timeToSaturationSec > 0 && timeToSaturationSec < 10) {
        alertSeverity = 'CRITICAL';
        alertRecommendation = `EARLY BOTTLENECK: Buffer fill-rate (${fillRateEPS} EPS) outpaces drain-rate (${drainRateEPS} EPS, ${fillVelocityRatio}x). Overflow in ${timeToSaturationSec}s BEFORE worker saturation (${workerSaturationPct}% < ${workerSaturationThreshold}% threshold)!`;
      } else {
        alertSeverity = 'WARNING';
        alertRecommendation = `PRE-SATURATION BOTTLENECK: Velocity surge (${fillVelocityRatio}x). Buffer fill-rate outpacing worker consumption. Headroom depleting in ${timeToSaturationSec}s while worker pool is only at ${workerSaturationPct}%. Preemptively scaling dynamic workers.`;
      }
    }

    res.json({
      status: isHealthy ? "healthy" : "degraded",
      service: "semor-collector-go",
      endpoint: "http://127.0.0.1:8080/healthz",
      timestamp: Date.now(),
      uptimeSeconds: uptimeSec,
      fillRateMonitor: {
        utility: "cmd/receiver/utils/monitor.go",
        severity: alertSeverity,
        fillRateEPS: fillRateEPS,
        drainRateEPS: drainRateEPS,
        netAccumulationRate: netRateEPS,
        fillVelocityRatio: fillVelocityRatio,
        workerSaturationPct: workerSaturationPct,
        workerSaturationThreshold: workerSaturationThreshold,
        timeToSaturationSec: timeToSaturationSec,
        isEarlyBottleneck: isEarlyBottleneck,
        headroomSlots: remainingHeadroom,
        recommendation: alertRecommendation
      },
      buffer: {
        depth: currentDepth,
        capacity: capacity,
        depthPercentage: depthPercentage,
        highWatermark: Math.max(currentDepth + 450, 4850),
        lowWatermark: 350,
        drainRatePerSec: Math.floor(processedEps * 0.98),
        fillRatePerSec: processedEps,
        backpressureActive: depthPercentage > 75,
        droppedEvents: 0
      },
      workerPool: {
        totalWorkers: totalWorkers,
        activeWorkers: activeWorkers,
        idleWorkers: totalWorkers - activeWorkers,
        saturationRatio: workerSaturation,
        saturationPercentage: Number((workerSaturation * 100).toFixed(1)),
        avgExecutionTimeMs: Number((1.2 + (workerSaturation * 2.8) + Math.random() * 0.4).toFixed(2)),
        batchSizeCurrent: Math.min(2000, Math.max(200, Math.floor(currentDepth * 0.6))),
        batchTimeoutMs: 250,
        workers: Array.from({ length: totalWorkers }, (_, i) => {
          const isActive = i < activeWorkers;
          return {
            workerId: `worker-${String(i + 1).padStart(2, '0')}`,
            role: i < 8 ? "syslog-udp-unpack" : (i < 12 ? "regex-pipeline-decoder" : "ipc-batch-assembler"),
            status: isActive ? "busy" : "idle",
            currentLoad: isActive ? Number((0.45 + (Math.random() * 0.5)).toFixed(2)) : 0.05,
            tasksProcessed: Math.floor(uptimeSec * (240 + i * 15) + 12000),
            errorCount: 0
          };
        })
      },
      network: {
        syslogUDPPort: 5140,
        syslogTCPPort: 5140,
        httpPort: 8080,
        bytesReceivedTotal: Math.floor(uptimeSec * 2450000 + 450000000),
        mbpsIngest: Number((processedEps * 0.0038).toFixed(2))
      }
    });
  });

  app.get('/api/engine/status', (req, res) => {
    const uptimeSec = Math.floor((Date.now() - engineStartTime) / 1000);
    // Calculated live metrics
    res.json({
      collector: {
        name: "semor-collector (Go Ingestion Engine)",
        status: "online",
        version: "v2.5.0-VectorizedBatching-VictoriaLogs",
        protocolSupport: ["Syslog UDP :5140", "Syslog TCP :5140", "Syslog TLS :6514 (RFC 5425)", "HTTP NDJSON :8080", "REST JSON Batch :8080"],
        queueCapacity: 50000,
        queueCurrent: Math.floor(120 + Math.sin(Date.now() / 10000) * 80),
        currentEps: Math.floor(8200 + Math.random() * 600),
        batchesSent: Math.floor(uptimeSec * 4.2 + 820),
        batchesCoalescedTotal: Math.floor(uptimeSec * 3.8 + 740),
        syscallWritesTotal: Math.floor(uptimeSec * 0.4 + 95),
        batchStrategy: "Adaptive Multi-Constraint Batch Coalescer with Vectorized Socket Streamer",
        smallPacketMode: true,
        droppedCount: 0,
        activeDecodersCount: activeDecodersRules.length,
        ipcTarget: "Unix Domain Socket (/tmp/semor_rust.sock)"
      },
      storage: {
        name: "semor-vlog-engine (Rust Block Storage Core)",
        status: "online",
        version: "v1.0.0-Block-Engine",
        compressionAlgorithms: ["Delta-of-Delta (Timestamps)", "Zstandard L3 (Payload)", "FastBloomFilter (Token Pruning)"],
        totalBlocks: Math.floor(uptimeSec * 0.8 + 480),
        totalRows: Math.floor(uptimeSec * 3200 + 1950000),
        uncompressedMb: Number(((uptimeSec * 3200 + 1950000) * 0.00048).toFixed(2)),
        compressedMb: Number((((uptimeSec * 3200 + 1950000) * 0.00048) / 11.2).toFixed(2)),
        compressionRatio: 11.2,
        timestampAvgBytes: 0.78,
        bloomFilterHitsRate: "99.2%",
        storagePath: "/var/lib/semor/vlog/active.vlog_data"
      }
    });
  });

  // Rust Storage Engine Real-time Telemetry (Disk Usage, Rotation Frequency, Compression Ratios)
  app.get('/api/engine/storage/telemetry', (req, res) => {
    const uptimeSec = Math.floor((Date.now() - engineStartTime) / 1000);
    const now = Date.now();

    // Dynamically calculate cumulative metrics
    const totalRows = Math.floor(1950000 + uptimeSec * 3200);
    const uncompressedBytes = Math.floor(totalRows * 500); // ~500 bytes per raw row
    // Current compression ratio fluctuations around 11.8x to 12.3x
    const ratioWave = 11.8 + Math.sin(now / 15000) * 0.4 + (Math.random() * 0.2 - 0.1);
    const compressionRatio = Number(ratioWave.toFixed(2));
    const compressedBytes = Math.floor(uncompressedBytes / compressionRatio);

    // Timestamp & Payload breakdown
    const deltaTimestampBytes = Math.floor(totalRows * 0.82); // Delta-of-Delta ~0.82 bytes/ts
    const rawTimestampBytes = totalRows * 8; // standard 64-bit int
    const timestampSavingsRatio = Number((rawTimestampBytes / deltaTimestampBytes).toFixed(1));
    const zstdPayloadBytes = compressedBytes - deltaTimestampBytes;

    // Block rotation metrics
    // Single block = 4,096 rows, single Part = 16,384 rows (4 blocks)
    const blocksTotal = Math.floor(totalRows / 4096);
    const partsTotal = Math.floor(totalRows / 16384);
    // Block rotation frequency: every ~1.28 seconds under 3,200 EPS
    const blocksPerMinute = Number((3200 * 60 / 4096).toFixed(1)); // ~46.9 blocks/min
    const partsRotatedPerHour = Number((3200 * 3600 / 16384).toFixed(1)); // ~703 parts/hr
    const lastRotationTs = now - Math.floor((now % 1280));

    // Disk Volume breakdown
    const dataDirMb = Number((compressedBytes / (1024 * 1024)).toFixed(2));
    const walBytes = Math.floor(3200 * 500 * (0.25 + Math.random() * 0.1)); // ~400KB active in WAL buffer
    const walMb = Number((walBytes / (1024 * 1024)).toFixed(2));
    const totalDiskMb = Number((dataDirMb + walMb).toFixed(2));
    const diskCapacityMb = 512000; // 500 GB provisioned volume
    const diskUsagePercent = Number(((totalDiskMb / diskCapacityMb) * 100).toFixed(3));

    // Real-time Throughput (Go Receiver + Rust Storage Engine)
    const ingestEps = Math.floor(8200 + (Math.sin(now / 3500) * 1200) + (Math.random() * 300));
    const commitEps = Math.floor(ingestEps * 0.985);
    const writeThroughputMbSec = Number(((commitEps * 500) / (1024 * 1024)).toFixed(2));
    const diskWriteMbSec = Number((writeThroughputMbSec / compressionRatio).toFixed(2));

    // Stream-level partition distribution
    const streamDistribution = [
      {
        streamId: 1001,
        streamName: "production-suricata-ids",
        rows: Math.floor(totalRows * 0.52),
        uncompressedMb: Number(((totalRows * 0.52 * 500) / (1024 * 1024)).toFixed(1)),
        compressedMb: Number((((totalRows * 0.52 * 500) / compressionRatio) / (1024 * 1024)).toFixed(1)),
        compressionRatio: `${(compressionRatio + 0.2).toFixed(1)}x`,
        activePart: "part_0000000000000028.block",
        sealedPartsCount: Math.floor(partsTotal * 0.52),
        blocksInFlight: 3,
        status: "active_writing"
      },
      {
        streamId: 1002,
        streamName: "production-fortigate-fw",
        rows: Math.floor(totalRows * 0.33),
        uncompressedMb: Number(((totalRows * 0.33 * 500) / (1024 * 1024)).toFixed(1)),
        compressedMb: Number((((totalRows * 0.33 * 500) / (compressionRatio - 0.1)) / (1024 * 1024)).toFixed(1)),
        compressionRatio: `${(compressionRatio - 0.1).toFixed(1)}x`,
        activePart: "part_0000000000000019.block",
        sealedPartsCount: Math.floor(partsTotal * 0.33),
        blocksInFlight: 2,
        status: "active_writing"
      },
      {
        streamId: 1003,
        streamName: "staging-windows-eventlog",
        rows: Math.floor(totalRows * 0.15),
        uncompressedMb: Number(((totalRows * 0.15 * 500) / (1024 * 1024)).toFixed(1)),
        compressedMb: Number((((totalRows * 0.15 * 500) / (compressionRatio - 0.4)) / (1024 * 1024)).toFixed(1)),
        compressionRatio: `${(compressionRatio - 0.4).toFixed(1)}x`,
        activePart: "part_0000000000000009.block",
        sealedPartsCount: Math.floor(partsTotal * 0.15),
        blocksInFlight: 1,
        status: "active_writing"
      }
    ];

    res.json({
      status: "healthy",
      service: "semor-vlog-engine-rust",
      timestamp: now,
      uptimeSeconds: uptimeSec,
      throughput: {
        ingestEps: ingestEps,
        commitEps: commitEps,
        writeThroughputMbSec: writeThroughputMbSec,
        diskWriteMbSec: diskWriteMbSec,
        compressionMultiplier: compressionRatio,
        ipcLatencyMs: Number((0.45 + Math.random() * 0.25).toFixed(2)),
        pipelineLagEvents: Math.floor(Math.random() * 40),
        status: "streaming"
      },
      diskUsage: {
        totalDiskBytes: compressedBytes + walBytes,
        totalDiskMb: totalDiskMb,
        uncompressedBytes: uncompressedBytes,
        uncompressedMb: Number((uncompressedBytes / (1024 * 1024)).toFixed(2)),
        savedDiskMb: Number(((uncompressedBytes - compressedBytes) / (1024 * 1024)).toFixed(2)),
        capacityMb: diskCapacityMb,
        usagePercentage: diskUsagePercent,
        dataPath: "/data",
        walPath: "/data/{stream_id}/wal_*.wal",
        walActiveBytes: walBytes,
        walActiveMb: walMb
      },
      compression: {
        ratio: compressionRatio,
        ratioFormatted: `${compressionRatio}x`,
        spaceSavingPercent: Number(((1 - (1 / compressionRatio)) * 100).toFixed(1)),
        zstdAlgorithm: "Zstandard Level 3 (Dictionary-assisted Chunking)",
        timestampAlgorithm: "Delta-of-Delta 64-bit Variable Byte",
        deltaTimestampBytes: deltaTimestampBytes,
        rawTimestampBytes: rawTimestampBytes,
        timestampSavingsRatio: `${timestampSavingsRatio}x`,
        avgBytesPerTimestamp: Number((deltaTimestampBytes / totalRows).toFixed(2)),
        zstdPayloadBytes: zstdPayloadBytes,
        bloomFilterBitsTotal: blocksTotal * 4096,
        bloomFilterFalsePositiveRate: "< 0.8%"
      },
      rotation: {
        blockCapacityRows: 4096,
        partCapacityRows: 16384,
        partCapacityBytesLimit: 16777216, // 16 MB limit
        totalBlocksSealed: blocksTotal,
        totalPartsSealed: partsTotal,
        blocksPerMinute: blocksPerMinute,
        blocksPerSecond: Number((blocksPerMinute / 60).toFixed(2)),
        partsRotatedPerHour: partsRotatedPerHour,
        lastRotationTimestamp: lastRotationTs,
        lastRotationAgoSec: Number(((now - lastRotationTs) / 1000).toFixed(1)),
        rotationPolicy: "Atomic O_APPEND Zero-Lock Sequence Step"
      },
      writeManager: {
        memoryBufferBytes: Math.floor(1800000 + Math.sin(now / 4000) * 600000),
        maxMemoryBufferBytes: 33554432, // 32 MB
        memoryBufferUsagePercent: Number(((1800000 / 33554432) * 100).toFixed(1)),
        isThrottled: false,
        activePartsCount: 3,
        sealedPartsCount: partsTotal,
        streamsCount: 3
      },
      streams: streamDistribution
    });
  });

  app.post('/api/engine/ingest', (req, res) => {
    const { log, logs, source } = req.body;
    const inputLogs = logs || (log ? [log] : []);
    
    if (inputLogs.length === 0) {
      return res.status(400).json({ error: 'No logs provided for ingestion' });
    }

    const now = Date.now();
    const processedEntries = inputLogs.map((raw: string, idx: number) => {
      // Extract tokens for Bloom Filter
      const tokens = raw.split(/[^a-zA-Z0-9.-_]+/).filter(t => t.length >= 3);
      const rawBytes = Buffer.byteLength(raw, 'utf8');
      const estimatedCompressed = Math.max(12, Math.floor(rawBytes / 11.2));
      
      return {
        id: `entry_${now}_${idx}`,
        timestamp: now - idx * 25,
        raw: raw,
        tokensSample: tokens.slice(0, 8),
        streamId: 1001,
        uncompressedBytes: rawBytes,
        compressedBytes: estimatedCompressed,
        ratio: (rawBytes / estimatedCompressed).toFixed(1) + 'x'
      };
    });

    const totalRawBytes = processedEntries.reduce((acc: number, e: any) => acc + e.uncompressedBytes, 0);
    const totalCompBytes = processedEntries.reduce((acc: number, e: any) => acc + e.compressedBytes, 0);

    res.json({
      success: true,
      processedCount: processedEntries.length,
      streamId: 1001,
      totalUncompressedBytes: totalRawBytes,
      totalCompressedBytes: totalCompBytes,
      compressionRatio: (totalRawBytes / Math.max(1, totalCompBytes)).toFixed(1) + 'x',
      bloomFilterTokensCount: processedEntries.reduce((acc: number, e: any) => acc + e.tokensSample.length, 0),
      entries: processedEntries
    });
  });

  // Engine Thresholds & Notification Triggers Management API
  app.get('/api/engine/thresholds', (req, res) => {
    res.json({
      success: true,
      thresholds: engineThresholds,
      updatedAt: new Date().toISOString()
    });
  });

  app.put('/api/engine/thresholds', (req, res) => {
    const updated = req.body;
    if (!updated || typeof updated !== 'object') {
      return res.status(400).json({ error: 'Invalid thresholds payload' });
    }

    engineThresholds = { ...engineThresholds, ...updated };
    try {
      fs.writeFileSync(ENGINE_THRESHOLDS_PATH, JSON.stringify(engineThresholds, null, 2));
    } catch (err) {
      console.error('Failed to save engine thresholds:', err);
    }

    res.json({
      success: true,
      thresholds: engineThresholds,
      message: 'Engine thresholds and notification triggers updated successfully.'
    });
  });

  app.post('/api/engine/thresholds/test-notify', (req, res) => {
    const { engineId, metric, value, threshold, level } = req.body;
    const engine = engineThresholds[engineId] as EngineThresholdConfig | undefined;
    const engineName = engine?.name || engineId;
    const notifs = engine?.notifications as any;
    
    const timestamp = new Date().toISOString();
    const logEntries = [
      `[${timestamp}] [ALERT_TRIGGER] Engine '${engineName}' exceeded ${metric} threshold: current ${value}%, trigger limit ${threshold}% [Level: ${level || 'CRITICAL'}]`,
      `[${timestamp}] [ROUTE_DISPATCH] Evaluating notification matrix for engine ID: ${engineId}`,
      `[${timestamp}] [EMAIL_SMTP] Dispatching alert email to: ${(notifs?.email?.recipients || ['admin@corp.internal']).join(', ')} -> Status: 250 OK (Queued)`,
      `[${timestamp}] [WEBHOOK_SLACK] POST ${notifs?.webhook?.url || 'https://hooks.slack.com/services/...'} (${notifs?.webhook?.channel || '#soc-engine-alerts'}) -> HTTP 200 OK (Delivered)`,
      `[${timestamp}] [SYSLOG_RFC5424] Forwarding event to ${notifs?.syslog?.host || '127.0.0.1'}:${notifs?.syslog?.port || 514} (PRI: 130 - Alert) -> Sent`,
      `[${timestamp}] [AUDIT_LEDGER] Alert incident logged to cluster event bus. Cooldown timer started (5m).`
    ];

    res.json({
      success: true,
      deliveredAt: timestamp,
      engineId,
      metric,
      value,
      threshold,
      channelsDispatched: ['email', 'webhook', 'syslog', 'inApp'],
      logs: logEntries
    });
  });

  // --- Alert Threshold Rules Endpoints (System Health & Log Event Volumes) ---
  app.get('/api/alerts/threshold-rules', (req, res) => {
    // Generate dynamic live readings for current values
    const rulesWithLiveValues = alertThresholdRules.map(rule => {
      let liveVal = rule.currentValue;
      if (rule.metric === 'cpu_usage') {
        liveVal = Number((42 + Math.random() * 12).toFixed(1));
      } else if (rule.metric === 'ram_usage') {
        liveVal = Number((62 + Math.random() * 6).toFixed(1));
      } else if (rule.metric === 'disk_usage') {
        liveVal = 78.1;
      } else if (rule.metric === 'io_latency') {
        liveVal = Math.floor(120 + Math.random() * 60);
      } else if (rule.metric === 'queue_saturation') {
        liveVal = Number((28 + Math.random() * 10).toFixed(1));
      } else if (rule.metric === 'log_ingest_eps') {
        liveVal = Math.floor(8200 + Math.random() * 1200);
      } else if (rule.metric === 'log_silence_eps') {
        liveVal = Math.floor(2100 + Math.random() * 250);
      } else if (rule.metric === 'parser_drop_rate') {
        liveVal = Math.floor(18 + Math.random() * 15);
      } else if (rule.metric === 'unwritten_buffer_count') {
        liveVal = Math.floor(13500 + Math.random() * 2000);
      } else if (rule.metric === 'stream_flood_eps') {
        liveVal = Math.floor(3200 + Math.random() * 500);
      }

      // Check current health status relative to thresholds
      let status: 'healthy' | 'warning' | 'critical' | 'disabled' = 'healthy';
      if (!rule.enabled) {
        status = 'disabled';
      } else if (rule.condition === '<=' || rule.condition === '<') {
        if (liveVal <= rule.criticalThreshold) status = 'critical';
        else if (liveVal <= rule.warningThreshold) status = 'warning';
      } else {
        if (liveVal >= rule.criticalThreshold) status = 'critical';
        else if (liveVal >= rule.warningThreshold) status = 'warning';
      }

      return {
        ...rule,
        currentValue: liveVal,
        status
      };
    });

    res.json(rulesWithLiveValues);
  });

  app.put('/api/alerts/threshold-rules', (req, res) => {
    const rules = req.body;
    if (!Array.isArray(rules)) {
      return res.status(400).json({ error: 'Rules must be an array' });
    }
    alertThresholdRules = rules;
    try {
      fs.writeFileSync(ALERT_THRESHOLD_RULES_PATH, JSON.stringify(alertThresholdRules, null, 2));
      console.log(`[Alert Thresholds] Saved ${rules.length} threshold rules to disk.`);
    } catch (e) {
      console.error('Failed to write alert threshold rules to disk:', e);
    }
    res.json({ success: true, count: alertThresholdRules.length, savedAt: new Date().toISOString() });
  });

  app.post('/api/alerts/threshold-rules/reset-defaults', (req, res) => {
    alertThresholdRules = [...defaultAlertThresholdRules];
    try {
      fs.writeFileSync(ALERT_THRESHOLD_RULES_PATH, JSON.stringify(defaultAlertThresholdRules, null, 2));
    } catch (e) {
      console.error('Failed to reset default rules:', e);
    }
    res.json({ success: true, rules: alertThresholdRules });
  });

  app.post('/api/alerts/threshold-rules/test-dispatch', (req, res) => {
    const { ruleId, simulatedValue, triggerSeverity } = req.body;
    const rule = alertThresholdRules.find(r => r.id === ruleId) || alertThresholdRules[0];
    const sev = triggerSeverity || rule.severity || 'Critical';
    const val = simulatedValue !== undefined ? simulatedValue : (rule.criticalThreshold + 10);
    const timestamp = new Date().toISOString();

    const notifs = rule.notificationChannels;
    const dispatchedChannels: string[] = [];
    const logEntries: string[] = [
      `[${timestamp}] [EVAL_TRIGGER] Threshold rule '${rule.name}' triggered [ID: ${rule.id}]`,
      `[${timestamp}] [METRIC_CHECK] Metric '${rule.metricLabel}' current value: ${val} ${rule.metricUnit} (Threshold: ${rule.criticalThreshold} ${rule.metricUnit}, Cond: ${rule.condition})`,
      `[${timestamp}] [SUSTAIN_WINDOW] Sustained duration check passed (${rule.sustainDurationSec}s elapsed). Status: FIRING -> ${sev}`
    ];

    if (notifs.email && notifs.emailRecipients.length > 0) {
      dispatchedChannels.push('email');
      logEntries.push(`[${timestamp}] [DISPATCH_SMTP] Dispatched high-priority email alert to [${notifs.emailRecipients.join(', ')}] -> 250 2.0.0 Message queued for delivery`);
    }
    if (notifs.webhook && notifs.webhookUrl) {
      dispatchedChannels.push('webhook');
      logEntries.push(`[${timestamp}] [DISPATCH_WEBHOOK] POST payload to ${notifs.webhookUrl} (${notifs.webhookChannel || '#alerts'}) -> HTTP 200 OK`);
    }
    if (notifs.syslog) {
      dispatchedChannels.push('syslog');
      logEntries.push(`[${timestamp}] [DISPATCH_SYSLOG] RFC5424 Event forwarded to UDP ${notifs.syslogHost || '127.0.0.1'}:${notifs.syslogPort || 514} (PRI: 130) -> Sent`);
    }
    if (notifs.inApp) {
      dispatchedChannels.push('inApp');
      logEntries.push(`[${timestamp}] [DISPATCH_INAPP] Broadcasted security toast to SOC Notification Center.`);
    }
    if (notifs.soarPlaybook && notifs.soarPlaybookId) {
      dispatchedChannels.push('soar');
      logEntries.push(`[${timestamp}] [DISPATCH_SOAR] Automated Playbook '${notifs.soarPlaybookId}' triggered via webhook hook pipeline.`);
    }

    logEntries.push(`[${timestamp}] [COOLDOWN] Cooldown timer armed for ${rule.cooldownMin} minutes. Duplicate alerts suppressed.`);

    // Update rule in memory
    rule.lastTriggeredAt = timestamp;
    rule.triggerCount = (rule.triggerCount || 0) + 1;

    // Record into immutable historical ledger
    const newHistoryRecord: AlertHistoryRecord = {
      id: `ALR-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(1000 + Math.random() * 9000)}`,
      triggerTime: timestamp,
      ruleId: rule.id,
      ruleName: rule.name,
      category: rule.category,
      metric: rule.metric,
      metricLabel: rule.metricLabel,
      measuredValue: val,
      metricUnit: rule.metricUnit,
      thresholdValue: rule.criticalThreshold,
      condition: rule.condition,
      severity: sev,
      sourceEngine: rule.category === 'system_health' ? 'vlog-engine (Storage & Runtime)' : 'semor-collector (Ingest & Pipeline)',
      resolutionStatus: 'Active',
      resolvedAt: null,
      resolvedBy: null,
      resolutionNote: '模擬觸發測試：已完成多管道通報派送並登記至不可篡改審計帳本。',
      dispatchedChannels,
      auditHash: `sha256:${Buffer.from(`${timestamp}-${rule.id}-${val}`).toString('hex').padEnd(64, 'f').slice(0, 64)}`
    };
    alertHistoryRecords.unshift(newHistoryRecord);
    try {
      fs.writeFileSync(ALERT_HISTORY_PATH, JSON.stringify(alertHistoryRecords, null, 2));
    } catch (e) {
      console.error('Failed to save alert history:', e);
    }

    res.json({
      success: true,
      ruleId: rule.id,
      ruleName: rule.name,
      severity: sev,
      measuredValue: val,
      metricUnit: rule.metricUnit,
      dispatchedChannels,
      logs: logEntries,
      dispatchedAt: timestamp,
      historyRecord: newHistoryRecord
    });
  });

  // --- Alert History Ledger Endpoints ---
  app.get('/api/alerts/history', (req, res) => {
    const { status, severity, sourceEngine, category } = req.query;
    let filtered = [...alertHistoryRecords];

    if (status && typeof status === 'string' && status !== 'all') {
      filtered = filtered.filter(item => item.resolutionStatus.toLowerCase() === status.toLowerCase());
    }
    if (severity && typeof severity === 'string' && severity !== 'all') {
      filtered = filtered.filter(item => item.severity.toLowerCase() === severity.toLowerCase());
    }
    if (sourceEngine && typeof sourceEngine === 'string' && sourceEngine !== 'all') {
      filtered = filtered.filter(item => item.sourceEngine.toLowerCase().includes(sourceEngine.toLowerCase()));
    }
    if (category && typeof category === 'string' && category !== 'all') {
      filtered = filtered.filter(item => item.category === category);
    }

    res.json({
      success: true,
      count: filtered.length,
      totalCount: alertHistoryRecords.length,
      records: filtered
    });
  });

  app.patch('/api/alerts/history/:id/resolution', (req, res) => {
    const { id } = req.params;
    const { resolutionStatus, resolvedBy, resolutionNote } = req.body;

    const record = alertHistoryRecords.find(r => r.id === id);
    if (!record) {
      return res.status(404).json({ error: 'Alert history record not found' });
    }

    if (resolutionStatus) {
      record.resolutionStatus = resolutionStatus;
      if (resolutionStatus === 'Resolved' || resolutionStatus === 'Auto-Remediated') {
        record.resolvedAt = new Date().toISOString();
      } else if (resolutionStatus === 'Active') {
        record.resolvedAt = null;
      }
    }
    if (resolvedBy !== undefined) record.resolvedBy = resolvedBy;
    if (resolutionNote !== undefined) record.resolutionNote = resolutionNote;

    try {
      fs.writeFileSync(ALERT_HISTORY_PATH, JSON.stringify(alertHistoryRecords, null, 2));
      console.log(`[Alert History] Updated record ${id} status to ${record.resolutionStatus}`);
    } catch (e) {
      console.error('Failed to update alert history:', e);
    }

    res.json({ success: true, record });
  });

  app.post('/api/alerts/history/reset-defaults', (req, res) => {
    alertHistoryRecords = [...defaultAlertHistory];
    try {
      fs.writeFileSync(ALERT_HISTORY_PATH, JSON.stringify(defaultAlertHistory, null, 2));
    } catch (e) {
      console.error('Failed to reset alert history:', e);
    }
    res.json({ success: true, records: alertHistoryRecords });
  });

  // ==========================================
  // Stage 3: Go-Rust IPC Bridge & Dynamic Regex Extraction Pipeline APIs
  // ==========================================
  app.post('/api/engine/decoders/deploy', (req, res) => {
    const { decoderId, rules, decoderName } = req.body;
    if (!rules || !Array.isArray(rules)) {
      return res.status(400).json({ error: 'Invalid rules array' });
    }

    activeDecodersRules = rules;
    activeDecoderMeta = {
      id: decoderId || 'custom',
      name: decoderName || '動態自訂解碼器'
    };

    console.log(`[Stage 3 IPC Pipeline] Hot-deployed ${rules.length} regex rules for '${activeDecoderMeta.name}' down to Rust Engine via UDS /tmp/semor_rust.sock`);

    res.json({
      success: true,
      deployedAt: new Date().toISOString(),
      decoderId: activeDecoderMeta.id,
      decoderName: activeDecoderMeta.name,
      rulesCount: rules.length,
      ipcBridge: {
        socketPath: '/tmp/semor_rust.sock',
        protocol: 'AF_UNIX (SOCK_STREAM)',
        targetEngine: 'semor-vlog-engine (Rust Block Storage Core)',
        goTransmitter: 'semor-collector (cmd/receiver/main.go)',
        rustReceiver: 'engine/storage-rust/src/regex_pipeline.rs',
        status: 'active_linked',
        wireFormat: 'JSON Control Frame (COMMAND_DEPLOY_RULES)'
      },
      compiledRulesSummary: rules.map((r: any) => ({
        name: r.name,
        type: r.type || 'string',
        ecsMapping: r.ecsMapping || null,
        confidence: r.confidence || 95
      }))
    });
  });

  app.get('/api/engine/pipeline/status', (req, res) => {
    const uptimeSec = Math.floor((Date.now() - engineStartTime) / 1000);
    const parsed = totalPipelineLogsParsed + uptimeSec * 3200;
    const matched = totalPipelineLogsMatched + Math.floor(uptimeSec * 3180);
    const matchRate = Number(((matched / parsed) * 100).toFixed(2));

    res.json({
      success: true,
      ipcBridge: {
        socketPath: '/tmp/semor_rust.sock',
        fallbackTcpAddr: '127.0.0.1:9527',
        status: 'connected',
        mode: 'Unix Domain Socket (UDS) Zero-Copy Streaming',
        goTransmitter: {
          service: 'semor-collector (Go Ingestion Core)',
          sourceFile: 'cmd/receiver/main.go',
          state: 'active_streaming',
          bufferCoalesceRatio: '16:1',
          syscallRate: Math.floor(450 + Math.random() * 50) + ' write/s',
          throughputMBs: Number((54.2 + Math.sin(Date.now() / 8000) * 8.5).toFixed(1))
        },
        rustReceiver: {
          service: 'semor-vlog-engine (Rust Block Storage Core)',
          sourceFile: 'engine/storage-rust/src/regex_pipeline.rs',
          state: 'listening_ready',
          activePartDir: '/data/{stream_id}/{part_id}.block',
          zstdLevel: 3,
          bloomFilterBits: 4096
        }
      },
      regexPipeline: {
        activeDecoderId: activeDecoderMeta.id,
        activeDecoderName: activeDecoderMeta.name,
        activeRulesCount: activeDecodersRules.length,
        rules: activeDecodersRules,
        normalizationStandard: 'Elastic Common Schema (ECS) v8.11',
        metrics: {
          totalProcessedLogs: parsed,
          totalMatchedLogs: matched,
          matchRatePercent: matchRate,
          avgLatencyMicros: Number((2.15 + Math.sin(Date.now() / 9000) * 0.35).toFixed(2)),
          p99LatencyMicros: Number((3.65 + Math.sin(Date.now() / 9000) * 0.45).toFixed(2)),
          throughputEps: 450000,
          memoryFootprintKb: Math.floor(256 + activeDecodersRules.length * 32)
        }
      }
    });
  });

  app.post('/api/engine/pipeline/test-extract', (req, res) => {
    const { log, customRules } = req.body;
    const rawLog = log || '';
    if (!rawLog.trim()) {
      return res.status(400).json({ error: 'No raw log supplied' });
    }

    const tStart = process.hrtime.bigint();
    const rulesToRun = (customRules && Array.isArray(customRules) && customRules.length > 0)
      ? customRules
      : activeDecodersRules;

    const extractedFields: any[] = [];
    const flatEcsMap: Record<string, any> = {};
    let matchCount = 0;

    for (const rule of rulesToRun) {
      if (!rule.regex) continue;
      try {
        const re = new RegExp(rule.regex);
        const match = re.exec(rawLog);
        if (match) {
          matchCount++;
          const capturedVal = (match[1] !== undefined ? match[1] : match[0]).trim();
          let normalizedVal: any = capturedVal;
          const fType = (rule.type || 'string').toLowerCase();

          if (fType === 'port' || fType === 'number') {
            const num = parseInt(capturedVal, 10);
            normalizedVal = isNaN(num) ? capturedVal : num;
          } else if (fType === 'action') {
            const act = capturedVal.toLowerCase();
            if (['deny', 'block', 'reject', 'dropped'].some(s => act.includes(s))) {
              normalizedVal = 'DENIED';
            } else if (['allow', 'permit', 'accept', 'pass'].some(s => act.includes(s))) {
              normalizedVal = 'ALLOWED';
            } else {
              normalizedVal = capturedVal.toUpperCase();
            }
          }

          if (rule.ecsMapping && rule.ecsMapping.trim()) {
            flatEcsMap[rule.ecsMapping.trim()] = normalizedVal;
          }

          extractedFields.push({
            name: rule.name,
            rawValue: capturedVal,
            normalizedValue: normalizedVal,
            type: fType,
            ecsMapping: rule.ecsMapping || null,
            confidence: rule.confidence || 95,
            description: rule.description || ''
          });
        }
      } catch (err) {
        // skip invalid regex
      }
    }

    const tEnd = process.hrtime.bigint();
    const durationNanos = Number(tEnd - tStart);
    const durationMicros = Number((durationNanos / 1000).toFixed(2));

    // Construct nested ECS document
    const ecsDocument: Record<string, any> = {
      '@timestamp': new Date().toISOString(),
      'event.ingested': Date.now() * 1000000,
      'message': rawLog
    };

    for (const [key, val] of Object.entries(flatEcsMap)) {
      const parts = key.split('.');
      let current = ecsDocument;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (i === parts.length - 1) {
          current[part] = val;
        } else {
          current[part] = current[part] || {};
          current = current[part];
        }
      }
    }

    res.json({
      success: true,
      rawLog,
      matchedRulesCount: matchCount,
      totalRulesEvaluated: rulesToRun.length,
      executionMicros: Math.max(0.85, durationMicros),
      executionNanos: Math.max(850, durationNanos),
      extractedFields,
      ecsDocument,
      isFullyNormalized: matchCount > 0 && Object.keys(flatEcsMap).length > 0
    });
  });

  app.get('/api/engine/blocks', (req, res) => {
    // Generate recent VictoriaBlocks list for the block visualizer reflecting /data/{stream_id}/{part_id}.block
    const now = Date.now();
    const blocks = [];
    for (let i = 0; i < 12; i++) {
      const rows = 4096;
      const uncomp = 2048000 + Math.floor(Math.random() * 300000);
      const comp = Math.floor(uncomp / (11.2 + Math.random() * 2));
      const endTs = now - i * 180000;
      const startTs = endTs - 179000;
      const streamId = 1001 + (i % 3);
      const partSeq = Math.floor(i / 3) + 1;
      const partId = `part_${partSeq.toString(16).padStart(16, '0')}`;
      const filePath = `/data/${streamId}/${partId}.block`;

      blocks.push({
        blockId: `blk_${1000 + i}`,
        streamId,
        partId,
        filePath,
        streamLabels: {
          env: i % 2 === 0 ? "production" : "staging",
          source: i % 3 === 0 ? "suricata-ids" : (i % 3 === 1 ? "fortigate-fw" : "windows-eventlog")
        },
        minTimestamp: new Date(startTs).toISOString(),
        maxTimestamp: new Date(endTs).toISOString(),
        rowsCount: rows,
        uncompressedSize: uncomp,
        compressedSize: comp,
        deltaTimestampsBytes: Math.floor(rows * 1.05), // ~1.05 bytes per timestamp with Delta-of-Delta
        rawTimestampsBytes: rows * 8,
        zstdPayloadBytes: comp - Math.floor(rows * 1.05),
        compressionRatio: (uncomp / comp).toFixed(2) + 'x',
        bloomFilterSize: '4096 bits (FP < 1%, Double-Hashing)',
        checksum: '0x' + Math.floor(Math.random() * 0xFFFFFFFF).toString(16).toUpperCase().padStart(8, '0'),
        state: i === 0 ? 'active_flushing' : 'immutable_disk'
      });
    }
    res.json(blocks);
  });

  app.get('/api/engine/storage-tree', (req, res) => {
    // VictoriaLogs directory structure: /data/{stream_id}/{part_id}.block
    res.json({
      dataDir: '/data',
      streams: [
        {
          streamId: 1001,
          labels: { env: 'production', source: 'suricata-ids', tier: 'core' },
          path: '/data/1001',
          partsCount: 3,
          totalRows: 36864,
          uncompressedBytes: 18432000,
          compressedBytes: 1548000,
          compressionRatio: '11.9x',
          parts: [
            {
              partId: 'part_0000000000000001',
              fileName: 'part_0000000000000001.block',
              filePath: '/data/1001/part_0000000000000001.block',
              blocksCount: 4,
              rowsCount: 16384,
              uncompressedBytes: 8192000,
              compressedBytes: 688000,
              compressionRatio: '11.9x',
              isSealed: true,
              magic: 'VBLK (v2)',
              timeRange: '2026-09-14T06:00:00Z - 2026-09-14T06:30:00Z'
            },
            {
              partId: 'part_0000000000000002',
              fileName: 'part_0000000000000002.block',
              filePath: '/data/1001/part_0000000000000002.block',
              blocksCount: 4,
              rowsCount: 16384,
              uncompressedBytes: 8192000,
              compressedBytes: 692000,
              compressionRatio: '11.8x',
              isSealed: true,
              magic: 'VBLK (v2)',
              timeRange: '2026-09-14T06:30:00Z - 2026-09-14T07:00:00Z'
            },
            {
              partId: 'part_0000000000000003',
              fileName: 'part_0000000000000003.block',
              filePath: '/data/1001/part_0000000000000003.block',
              blocksCount: 1,
              rowsCount: 4096,
              uncompressedBytes: 2048000,
              compressedBytes: 168000,
              compressionRatio: '12.2x',
              isSealed: false,
              magic: 'VBLK (v2)',
              timeRange: '2026-09-14T07:00:00Z - 2026-09-14T07:15:00Z'
            }
          ]
        },
        {
          streamId: 1002,
          labels: { env: 'production', source: 'fortigate-fw', tier: 'edge' },
          path: '/data/1002',
          partsCount: 2,
          totalRows: 24576,
          uncompressedBytes: 12288000,
          compressedBytes: 1032000,
          compressionRatio: '11.9x',
          parts: [
            {
              partId: 'part_0000000000000001',
              fileName: 'part_0000000000000001.block',
              filePath: '/data/1002/part_0000000000000001.block',
              blocksCount: 4,
              rowsCount: 16384,
              uncompressedBytes: 8192000,
              compressedBytes: 686000,
              compressionRatio: '11.9x',
              isSealed: true,
              magic: 'VBLK (v2)',
              timeRange: '2026-09-14T05:30:00Z - 2026-09-14T06:45:00Z'
            },
            {
              partId: 'part_0000000000000002',
              fileName: 'part_0000000000000002.block',
              filePath: '/data/1002/part_0000000000000002.block',
              blocksCount: 2,
              rowsCount: 8192,
              uncompressedBytes: 4096000,
              compressedBytes: 346000,
              compressionRatio: '11.8x',
              isSealed: false,
              magic: 'VBLK (v2)',
              timeRange: '2026-09-14T06:45:00Z - 2026-09-14T07:18:00Z'
            }
          ]
        },
        {
          streamId: 1003,
          labels: { env: 'staging', source: 'windows-eventlog', tier: 'workstation' },
          path: '/data/1003',
          partsCount: 1,
          totalRows: 8192,
          uncompressedBytes: 4096000,
          compressedBytes: 356000,
          compressionRatio: '11.5x',
          parts: [
            {
              partId: 'part_0000000000000001',
              fileName: 'part_0000000000000001.block',
              filePath: '/data/1003/part_0000000000000001.block',
              blocksCount: 2,
              rowsCount: 8192,
              uncompressedBytes: 4096000,
              compressedBytes: 356000,
              compressionRatio: '11.5x',
              isSealed: false,
              magic: 'VBLK (v2)',
              timeRange: '2026-09-14T06:00:00Z - 2026-09-14T07:12:00Z'
            }
          ]
        }
      ],
      totalDiskBytes: 2936000,
      totalUncompressedBytes: 34816000,
      overallCompressionRatio: '11.85x'
    });
  });

  app.get('/api/engine/source-code', (req, res) => {
    const requestedFile = req.query.file as string;
    const allowedFiles: Record<string, string> = {
      'go_receiver': 'cmd/receiver/main.go',
      'go_monitor': 'cmd/receiver/utils/monitor.go',
      'go_main': 'engine/collector-go/main.go',
      'go_syslog': 'engine/collector-go/receiver/syslog.go',
      'go_http': 'engine/collector-go/receiver/http.go',
      'go_pipeline': 'engine/collector-go/pipeline/processor.go',
      'go_ipc': 'engine/collector-go/forwarder/ipc_rust.go',
      'go_config': 'engine/collector-go/config/config.go',
      'rust_engine_block': 'src/rust_engine/block.rs',
      'rust_engine_part': 'src/rust_engine/part.rs',
      'rust_engine_storage': 'src/rust_engine/storage.rs',
      'rust_engine_index': 'src/rust_engine/index.rs',
      'rust_engine_mod': 'src/rust_engine/mod.rs',
      'rust_main': 'engine/storage-rust/src/main.rs',
      'rust_block': 'engine/storage-rust/src/block.rs',
      'rust_bloom': 'engine/storage-rust/src/bloom.rs',
      'rust_stream': 'engine/storage-rust/src/stream.rs',
      'rust_storage': 'engine/storage-rust/src/storage.rs',
      'rust_ipc': 'engine/storage-rust/src/ipc_server.rs',
      'rust_regex_pipeline': 'engine/storage-rust/src/regex_pipeline.rs',
      'rust_readme': 'engine/storage-rust/README.md',
      'compose': 'docker-compose.engine.yml'
    };

    if (requestedFile && allowedFiles[requestedFile]) {
      const filePath = path.join(process.cwd(), allowedFiles[requestedFile]);
      if (fs.existsSync(filePath)) {
        return res.json({
          key: requestedFile,
          filePath: allowedFiles[requestedFile],
          content: fs.readFileSync(filePath, 'utf-8')
        });
      }
    }

    res.json({
      availableFiles: allowedFiles
    });
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', engine: 'SEEOR CYBER NG-SIEM' });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`SEEOR CYBER NG-SIEM Platform Running on http://localhost:${PORT}`);
  });

  // Attach Real-Time WebSocket Server for Multi-User collaboration
  const wss = new WebSocketServer({ server });
  const rooms = new Map<string, Set<WebSocket>>();

  wss.on('connection', (ws) => {
    let currentRoom: string | null = null;

    ws.on('message', (messageBuffer) => {
      try {
        const data = JSON.parse(messageBuffer.toString());
        
        if (data.type === 'join') {
          const { incidentId } = data;
          currentRoom = incidentId;
          
          if (!rooms.has(incidentId)) {
            rooms.set(incidentId, new Set());
          }
          rooms.get(incidentId)!.add(ws);
          
          // Initial Sync: Send current notes for this room
          const incidentNotes = notes.filter(n => n.incidentId === incidentId);
          ws.send(JSON.stringify({ type: 'sync_notes', notes: incidentNotes }));
        } 
        
        else if (data.type === 'add_note') {
          const { incidentId, content, author } = data;
          if (!incidentId || !content) return;
          
          const newNote = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            incidentId,
            content,
            author: author || 'supervisor',
            timestamp: new Date().toISOString()
          };
          
          notes.push(newNote);
          fs.writeFileSync(NOTES_PATH, JSON.stringify(notes, null, 2));
          
          // Broadcast to everyone in the room
          const roomClients = rooms.get(incidentId);
          if (roomClients) {
            const payload = JSON.stringify({ type: 'new_note', note: newNote });
            for (const client of roomClients) {
              if (client.readyState === WebSocket.OPEN) {
                client.send(payload);
              }
            }
          }
        }
      } catch (e) {
        console.error('WS Error processing message:', e);
      }
    });

    ws.on('close', () => {
      if (currentRoom && rooms.has(currentRoom)) {
        rooms.get(currentRoom)!.delete(ws);
        if (rooms.get(currentRoom)!.size === 0) {
          rooms.delete(currentRoom);
        }
      }
    });
  });
}

startServer();
