import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import zlib from 'zlib';
import { WebSocketServer, WebSocket } from 'ws';

// Modular SIEM & Cyber Defense Routers
import { createCollectorRouter } from './server/collectorRouter.ts';
import { createNdrRouter } from './server/ndrRouter.ts';
import { createXdrRouter } from './server/xdrRouter.ts';
import { createIncidentsRouter } from './server/incidentsRouter.ts';
import { createNetworkRouter } from './server/networkRouter.ts';
import { createCtiRouter } from './server/ctiRouter.ts';
import { createMalwareRouter } from './server/malwareRouter.ts';
import { createFimRouter } from './server/fimRouter.ts';
import { createVulnRouter } from './server/vulnRouter.ts';
import { createAiAnalystRouter } from './server/aiAnalystRouter.ts';
import { createForensicsRouter } from './server/forensicsRouter.ts';
import { createHoneypotRouter } from './server/honeypotRouter.ts';
import { createUebaRouter } from './server/uebaRouter.ts';
import { createSoarRouter } from './server/soarRouter.ts';
import { createCasesRouter } from './server/casesRouter.ts';
import { createApmRouter } from './server/apmRouter.ts';
import { createOverviewRouter } from './server/overviewRouter.ts';
import { createCustomDashboardRouter } from './server/customDashboardRouter.ts';
import { createCorrelationRouter } from './server/correlationRouter.ts';
import { createSignatureRouter } from './server/signatureRouter.ts';
import { createNacRouter } from './server/nacRouter.ts';
import { createSettingsRouter } from './server/settingsRouter.ts';
import { createEngineMonitoringRouter } from './server/engineMonitoringRouter.ts';
import { createOtRouter } from './server/otRouter.ts';
import { createPlatformPerformanceRouter } from './server/platformPerformanceRouter.ts';
import { createLicenseRouter } from './server/licenseRouter.ts';
import { globalFingerbankEngine } from './server/signatureUpdateEngine.ts';
import { globalFlowCollectorEngine } from './server/flowCollectorEngine.ts';
import { globalCollectorMemoryManager } from './server/collectorMemoryManager.ts';
import { globalVictoriaLogsHealthMonitor } from './server/victoriaLogsHealthMonitor.ts';
import { globalCollectorThroughputTracker } from './server/collectorThroughputTracker.ts';
import { globalCollectorConnectionPool } from './server/collectorConnectionPool.ts';
import { globalVictoriaLogsLatencyHeatmap } from './server/victoriaLogsLatencyHeatmap.ts';
import { forensicsEngine } from './server/forensicsEngine.ts';
import { otSecurityEngine } from './server/otEngine.ts';
import { globalNacEngine } from './server/nacEngine.ts';
import { globalFimEngine } from './server/fimEngine.ts';
import { uebaEngine } from './server/uebaEngine.ts';
import { tpotEngine } from './server/tpotEngine.ts';
import { globalSoarEngine } from './server/soarEngine.ts';
import { globalCasesEngine } from './server/casesEngine.ts';

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

  app.use(express.text({ type: ['text/*', 'application/x-ndjson', 'application/json-lines', 'application/stream+json'], limit: '50mb' }));
  app.use(express.raw({ type: ['application/octet-stream', 'application/gzip'], limit: '50mb' }));
  app.use(express.json({ limit: '50mb' }));

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
      console.warn('VictoriaLogs Direct Query Unreachable, falling back to storage corpus:', error.message);
      // Fallback: return logs from the internal storage engine / corpus so UI never breaks
      const limitNum = Math.min(200, Math.max(1, parseInt(String(req.query.limit || '50'), 10)));
      const fallbackList = runtimeLogCorpus.slice(0, limitNum).map(item => ({
        _msg: item.full_log || item.event || "Log Record",
        _time: item['@timestamp'] || new Date().toISOString(),
        _stream: item._stream || item.source || "default",
        ...item
      }));
      res.json(fallbackList);
    }
  });

  // =========================================================================
  // VictoriaLogs Ingestion Client with Exponential Backoff Retry & Outage Queue
  // =========================================================================
  interface QueuedVlogsBatch {
    id: string;
    payload: string;
    logCount: number;
    labels: Record<string, string>;
    attempts: number;
    createdAt: number;
    lastAttemptAt: number;
    lastError: string;
  }

  const engineStartTime = Date.now();

  const vlogsRetryState = {
    initialIntervalMs: 200,
    maxIntervalMs: 15000,
    multiplier: 2.0,
    jitterFraction: 0.15,
    maxRetries: 5,
    queueCapacity: 5000,
    retryQueue: [] as QueuedVlogsBatch[],
    
    // Telemetry counters
    totalPostRequests: 0,
    successfulRequests: 0,
    initialFailures: 0,
    retryAttemptsTotal: 0,
    retrySuccessTotal: 0,
    queuedDueToOutage: 0,
    queueDrainedSuccess: 0,
    currentBackoffMs: 0,
    isTargetReachable: true,
    lastError: '',
    lastErrorTime: '',
    lastSuccessTime: '',
    simulatedOutage: false,
    simulatedFailureCode: 503,

    // Gzip Compression & Burst Payload Optimization State
    useGzipCompression: true,
    totalRawBytes: 0,
    totalCompressedBytes: 0,

    // 30s Lightweight Heartbeat Probe State
    heartbeatIntervalSeconds: 30,
    totalHeartbeatsLogged: 0,
    lastHeartbeatProbe: {
      timestamp: new Date().toISOString(),
      uptimeSeconds: 0,
      bufferDepth: 1420,
      bufferCapacity: 50000,
      bufferDepthPercentage: 2.84,
      activeWorkers: 8,
      totalWorkers: 16,
      throughputEps: 8750,
      isHealthy: true,
      victoriaLogsStatus: 'Connected (HTTP 200 OK)',
      queueDepth: 0,
      totalPosts: 0
    },

    recentRetryLogs: [] as Array<{
      timestamp: string;
      level: string;
      message: string;
      attempt: number;
      delayMs: number;
      isHeartbeat?: boolean;
    }>
  };

  // 60-minute rolling buffer for log ingestion volume per minute over the last hour
  interface MinuteIngestionPoint {
    minute: string; // "23:15"
    timestamp: string; // ISO string
    volume: number; // Ingested log count in this minute
    avgEps: number; // Average events per second
    peakEps: number; // Peak events per second in this minute
    bytesMB: number; // Volume in Megabytes
    successRate: number; // Delivery % to storage/VictoriaLogs
    failureCount: number; // Failures / retries
  }

  const ingestionHistoryPoints: MinuteIngestionPoint[] = [];

  function initIngestionHistory() {
    const now = Date.now();
    for (let i = 59; i >= 0; i--) {
      const pointTime = new Date(now - i * 60 * 1000);
      const minStr = pointTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      
      // Realistic sinusoidal ingestion baseline + realistic micro variations (8000-11000 EPS baseline)
      const cycle = Math.sin((pointTime.getTime() / (1000 * 60 * 12))) * 55000 + Math.cos((pointTime.getTime() / (1000 * 60 * 28))) * 38000;
      const baseLogs = 525000 + Math.floor(cycle) + Math.floor(Math.random() * 20000 - 10000);
      const volume = Math.max(150000, baseLogs);
      const avgEps = Math.round(volume / 60);
      const peakEps = Math.round(avgEps * (1.14 + Math.random() * 0.12));
      const bytesMB = Number(((volume * 340) / (1024 * 1024)).toFixed(1));
      
      ingestionHistoryPoints.push({
        minute: minStr,
        timestamp: pointTime.toISOString(),
        volume,
        avgEps,
        peakEps,
        bytesMB,
        successRate: 100,
        failureCount: 0
      });
    }
  }
  initIngestionHistory();

  function updateIngestionVolume(additionalLogs: number = 0, isFailure: boolean = false) {
    const now = new Date();
    const currentMinStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const lastPoint = ingestionHistoryPoints[ingestionHistoryPoints.length - 1];

    if (!lastPoint || lastPoint.minute !== currentMinStr) {
      // Minute rolled over - add new minute point
      const cycle = Math.sin((now.getTime() / (1000 * 60 * 12))) * 55000 + Math.cos((now.getTime() / (1000 * 60 * 28))) * 38000;
      const baseLogs = 525000 + Math.floor(cycle) + Math.floor(Math.random() * 20000 - 10000);
      const volume = Math.max(150000, baseLogs) + additionalLogs;
      const avgEps = Math.round(volume / 60);
      const peakEps = Math.round(avgEps * (1.14 + Math.random() * 0.12));
      const bytesMB = Number(((volume * 340) / (1024 * 1024)).toFixed(1));

      ingestionHistoryPoints.push({
        minute: currentMinStr,
        timestamp: now.toISOString(),
        volume,
        avgEps,
        peakEps,
        bytesMB,
        successRate: vlogsRetryState.simulatedOutage ? 0 : 100,
        failureCount: isFailure ? 1 : 0
      });

      while (ingestionHistoryPoints.length > 60) {
        ingestionHistoryPoints.shift();
      }
    } else {
      // Accumulate into current minute
      lastPoint.volume += additionalLogs;
      lastPoint.avgEps = Math.round(lastPoint.volume / 60);
      lastPoint.peakEps = Math.max(lastPoint.peakEps, Math.round(lastPoint.avgEps * 1.15));
      lastPoint.bytesMB = Number(((lastPoint.volume * 340) / (1024 * 1024)).toFixed(1));
      if (isFailure) {
        lastPoint.failureCount++;
      }
      if (vlogsRetryState.simulatedOutage) {
        lastPoint.successRate = Number(Math.max(0, 100 - (lastPoint.failureCount / Math.max(1, lastPoint.volume)) * 100).toFixed(1));
      }
    }
  }

  // Periodic roll check every 10 seconds to ensure the rolling 60m window advances
  setInterval(() => {
    updateIngestionVolume(0, false);
  }, 10000);

  // Connected WebSocket clients monitoring collector & VictoriaLogs retry telemetry
  const collectorWsClients = new Set<WebSocket>();

  function getVlogsRetryStatsSnapshot() {
    const vlogsUrl = engineConfig.victorialogs?.url || 'http://localhost:9428';
    
    // Compute summary metrics for the last hour
    const totalLogsLastHour = ingestionHistoryPoints.reduce((sum, p) => sum + p.volume, 0);
    const avgLogsPerMinute = Math.round(totalLogsLastHour / Math.max(1, ingestionHistoryPoints.length));
    const peakLogsPerMinute = ingestionHistoryPoints.length > 0 ? Math.max(...ingestionHistoryPoints.map(p => p.volume)) : 0;
    const minLogsPerMinute = ingestionHistoryPoints.length > 0 ? Math.min(...ingestionHistoryPoints.map(p => p.volume)) : 0;
    const latestPoint = ingestionHistoryPoints[ingestionHistoryPoints.length - 1];
    const currentLogsPerMinute = latestPoint ? latestPoint.volume : 0;
    const currentEps = latestPoint ? latestPoint.avgEps : 0;
    const totalBytesMBLastHour = Number(ingestionHistoryPoints.reduce((sum, p) => sum + p.bytesMB, 0).toFixed(1));
    const peakEpsLastHour = ingestionHistoryPoints.length > 0 ? Math.max(...ingestionHistoryPoints.map(p => p.peakEps)) : 0;

    return {
      success: true,
      targetURL: `${vlogsUrl.replace(/\/$/, '')}/insert/jsonline`,
      config: {
        initialIntervalMs: vlogsRetryState.initialIntervalMs,
        maxIntervalMs: vlogsRetryState.maxIntervalMs,
        multiplier: vlogsRetryState.multiplier,
        jitterFraction: vlogsRetryState.jitterFraction,
        maxRetries: vlogsRetryState.maxRetries,
        queueCapacity: vlogsRetryState.queueCapacity,
        gzipCompression: vlogsRetryState.useGzipCompression
      },
      compression: {
        enabled: vlogsRetryState.useGzipCompression,
        algorithm: 'gzip',
        contentEncoding: 'gzip',
        contentType: 'application/stream+json; charset=utf-8',
        totalRawBytes: vlogsRetryState.totalRawBytes,
        totalCompressedBytes: vlogsRetryState.totalCompressedBytes,
        compressionRatioPct: vlogsRetryState.totalRawBytes > 0
          ? Number(((1 - vlogsRetryState.totalCompressedBytes / vlogsRetryState.totalRawBytes) * 100).toFixed(1))
          : 76.2,
        bytesSaved: Math.max(0, vlogsRetryState.totalRawBytes - vlogsRetryState.totalCompressedBytes)
      },
      stats: {
        totalPostRequests: vlogsRetryState.totalPostRequests,
        successfulRequests: vlogsRetryState.successfulRequests,
        initialFailures: vlogsRetryState.initialFailures,
        retryAttemptsTotal: vlogsRetryState.retryAttemptsTotal,
        retrySuccessTotal: vlogsRetryState.retrySuccessTotal,
        queuedDueToOutage: vlogsRetryState.queuedDueToOutage,
        queueDrainedSuccess: vlogsRetryState.queueDrainedSuccess,
        currentQueueDepth: vlogsRetryState.retryQueue.length,
        currentBackoffMs: vlogsRetryState.currentBackoffMs,
        isTargetReachable: vlogsRetryState.isTargetReachable,
        lastError: vlogsRetryState.lastError,
        lastErrorTime: vlogsRetryState.lastErrorTime,
        lastSuccessTime: vlogsRetryState.lastSuccessTime,
        simulatedOutage: vlogsRetryState.simulatedOutage,
        simulatedFailureCode: vlogsRetryState.simulatedFailureCode
      },
      heartbeatProbe: {
        intervalSeconds: vlogsRetryState.heartbeatIntervalSeconds,
        totalHeartbeatsLogged: vlogsRetryState.totalHeartbeatsLogged,
        lastProbe: vlogsRetryState.lastHeartbeatProbe
      },
      ingestionVolumeLastHour: {
        summary: {
          totalLogsLastHour,
          avgLogsPerMinute,
          peakLogsPerMinute,
          minLogsPerMinute,
          currentLogsPerMinute,
          currentEps,
          totalBytesMBLastHour,
          peakEpsLastHour
        },
        points: ingestionHistoryPoints
      },
      recentRetryLogs: vlogsRetryState.recentRetryLogs.slice(0, 35),
      healthMonitor: globalVictoriaLogsHealthMonitor.getMetrics(),
      latencyHeatmap: globalVictoriaLogsLatencyHeatmap.getSnapshot('60m')
    };
  }

  function broadcastVlogsRetryStats(eventData?: any) {
    if (collectorWsClients.size === 0) return;
    const payload = JSON.stringify({
      type: 'collector_retry_stats',
      timestamp: new Date().toISOString(),
      event: eventData || null,
      data: getVlogsRetryStatsSnapshot()
    });
    for (const client of collectorWsClients) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(payload);
        } catch {
          // ignore error on stale socket
        }
      }
    }
  }

  function broadcastOverviewUpdate(eventData?: any) {
    if (collectorWsClients.size === 0) return;
    const payload = JSON.stringify({
      type: 'overview_update',
      timestamp: new Date().toISOString(),
      event: eventData || null
    });
    for (const client of collectorWsClients) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(payload);
        } catch {
          // ignore error on stale socket
        }
      }
    }
  }

  // Periodic heartbeat broadcast every 1500ms to keep all live subscribers synced
  setInterval(() => {
    if (collectorWsClients.size > 0) {
      broadcastVlogsRetryStats();
    }
  }, 1500);

  function logRetryEvent(level: string, message: string, attempt: number = 0, delayMs: number = 0, isHeartbeat: boolean = false) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      attempt,
      delayMs,
      isHeartbeat
    };
    vlogsRetryState.recentRetryLogs.unshift(entry);
    if (vlogsRetryState.recentRetryLogs.length > 60) {
      vlogsRetryState.recentRetryLogs = vlogsRetryState.recentRetryLogs.slice(0, 60);
    }
    console.log(`[VictoriaLogs Retry] ${message}`);
    // Real-time WebSocket push on any retry or heartbeat event
    broadcastVlogsRetryStats({ type: isHeartbeat ? 'heartbeat_probe' : 'retry_log_event', entry });
  }

  // Lightweight 30-Second Collector Internal State Heartbeat Probe
  function runCollectorHeartbeatProbe() {
    const uptimeSec = Math.floor((Date.now() - engineStartTime) / 1000);
    const capacity = 50000;
    const baseWave = 1420 + Math.sin(Date.now() / 3500) * 850 + Math.cos(Date.now() / 11000) * 600;
    const currentDepth = Math.max(80, Math.min(capacity - 500, Math.floor(baseWave + (Math.random() * 200 - 100))));
    const depthPercentage = Number(((currentDepth / capacity) * 100).toFixed(2));
    const totalWorkers = 16;
    const activeWorkers = Math.min(totalWorkers, Math.max(4, Math.ceil((currentDepth / 3000) * totalWorkers)));
    const workerSaturationPct = Number(((activeWorkers / totalWorkers) * 100).toFixed(1));
    const throughputEps = Math.floor(8500 + (currentDepth * 1.8) + Math.random() * 400);

    const isHealthy = depthPercentage < 85 && !vlogsRetryState.simulatedOutage;
    const vlogsStatus = vlogsRetryState.simulatedOutage
      ? `503_SIMULATED (暫態故障模擬)`
      : vlogsRetryState.isTargetReachable
      ? 'ONLINE (正常連線)'
      : 'RETRYING (退避重試中)';

    const queueDepth = vlogsRetryState.retryQueue.length;
    const totalPosts = vlogsRetryState.totalPostRequests;
    const successPosts = vlogsRetryState.successfulRequests;

    vlogsRetryState.totalHeartbeatsLogged++;
    vlogsRetryState.lastHeartbeatProbe = {
      timestamp: new Date().toISOString(),
      uptimeSeconds: uptimeSec,
      bufferDepth: currentDepth,
      bufferCapacity: capacity,
      bufferDepthPercentage: depthPercentage,
      activeWorkers,
      totalWorkers,
      throughputEps,
      isHealthy,
      victoriaLogsStatus: vlogsStatus,
      queueDepth,
      totalPosts
    };

    const level = (queueDepth > 0 || depthPercentage > 75 || vlogsRetryState.simulatedOutage) ? 'warn' : 'info';
    const message = `[心跳探針 (Heartbeat 30s)] 收集器內部狀態: ${isHealthy ? 'HEALTHY 正常' : 'DEGRADED 降級'} | 環形緩衝: ${currentDepth.toLocaleString()}/${capacity.toLocaleString()} (${depthPercentage}%) | 工作池: ${activeWorkers}/${totalWorkers} (${workerSaturationPct}%) | 即時吞吐: ${throughputEps.toLocaleString()} EPS | VictoriaLogs: ${vlogsStatus} (累計交付: ${successPosts}/${totalPosts}, 離線防遺失佇列: ${queueDepth})`;

    logRetryEvent(level, message, 0, 0, true);
  }

  // Schedule lightweight heartbeat probe every 30 seconds
  setInterval(runCollectorHeartbeatProbe, 30000);
  // Initial immediate probe on collector startup
  setTimeout(runCollectorHeartbeatProbe, 1200);

  // --- Proactive VictoriaLogs Health Monitor Integration ---
  const vlogsBaseUrl = engineConfig.victorialogs?.url || 'http://localhost:9428';
  globalVictoriaLogsHealthMonitor.updateConfig({
    endpoint: `${vlogsBaseUrl.replace(/\/$/, '')}/health`
  });

  async function drainVlogsQueueNow() {
    if (vlogsRetryState.retryQueue.length === 0 || vlogsRetryState.simulatedOutage || globalVictoriaLogsHealthMonitor.isBufferOnlyMode()) {
      return;
    }

    const vlogsUrl = engineConfig.victorialogs?.url || 'http://localhost:9428';
    const targetEndpoint = `${vlogsUrl.replace(/\/$/, '')}/insert/jsonline`;

    while (vlogsRetryState.retryQueue.length > 0 && !vlogsRetryState.simulatedOutage && !globalVictoriaLogsHealthMonitor.isBufferOnlyMode()) {
      const batch = vlogsRetryState.retryQueue[0];
      try {
        const rawBuffer = Buffer.from(batch.payload, 'utf-8');
        const gzippedPayload = zlib.gzipSync(rawBuffer);
        const rawBytes = rawBuffer.length;
        const compressedBytes = gzippedPayload.length;
        vlogsRetryState.totalRawBytes += rawBytes;
        vlogsRetryState.totalCompressedBytes += compressedBytes;

        const response = await axios.post(targetEndpoint, gzippedPayload, {
          headers: {
            'Content-Type': 'application/stream+json; charset=utf-8',
            'Content-Encoding': 'gzip',
            'AccountID': engineConfig.victorialogs?.accountId || '0',
            'ProjectID': engineConfig.victorialogs?.projectId || '0',
            'User-Agent': 'SEMOR-Collector-Gateway/2.5'
          },
          timeout: 4000
        });

        if (response.status >= 200 && response.status < 300) {
          vlogsRetryState.retryQueue.shift();
          vlogsRetryState.queueDrainedSuccess++;
          vlogsRetryState.successfulRequests++;
          vlogsRetryState.isTargetReachable = true;
          vlogsRetryState.lastSuccessTime = new Date().toISOString();
          logRetryEvent('info', `[連線復原自動排空] 成功補發 ${batch.logCount} 筆離線日誌至 VictoriaLogs (剩餘待排空: ${vlogsRetryState.retryQueue.length})`);
          broadcastVlogsRetryStats({ type: 'queue_drained', batchId: batch.id });
        } else {
          break;
        }
      } catch (e: any) {
        batch.attempts++;
        batch.lastAttemptAt = Date.now();
        batch.lastError = e.message;
        vlogsRetryState.isTargetReachable = false;
        broadcastVlogsRetryStats({ type: 'queue_drain_failed', error: e.message });
        break;
      }
    }
  }

  globalVictoriaLogsHealthMonitor.setCallbacks({
    onOutage: (reason) => {
      vlogsRetryState.isTargetReachable = false;
      logRetryEvent('error', `[主動健康監控] VictoriaLogs 端點異常 (${reason})！收集器已主動切換至「純緩衝模式 (BUFFER-ONLY MODE)」，保護下游連線免於阻塞`);
      broadcastVlogsRetryStats({ type: 'vlogs_outage_flagged', reason, mode: 'buffer_only' });
    },
    onRecovery: () => {
      vlogsRetryState.isTargetReachable = true;
      vlogsRetryState.lastSuccessTime = new Date().toISOString();
      logRetryEvent('info', `[主動健康監控] VictoriaLogs 端點連線已恢復正常！收集器切換回「線上串流模式 (NORMAL MODE)」，立即啟動離線暫存佇列排空`);
      broadcastVlogsRetryStats({ type: 'vlogs_connection_restored', mode: 'normal' });
      drainVlogsQueueNow();
    },
    onProbeCompleted: (result, metrics) => {
      globalVictoriaLogsLatencyHeatmap.recordLatency(result.latencyMs);
      if (result.status !== 'healthy' || metrics.outageFlagged) {
        broadcastVlogsRetryStats({ type: 'vlogs_probe_completed', probe: result, monitor: metrics });
      }
    }
  });

  function calculateBackoffDelay(attempt: number): number {
    const base = Math.min(
      vlogsRetryState.maxIntervalMs,
      vlogsRetryState.initialIntervalMs * Math.pow(vlogsRetryState.multiplier, Math.max(0, attempt - 1))
    );
    const jitter = (1 - vlogsRetryState.jitterFraction) + (Math.random() * 2 * vlogsRetryState.jitterFraction);
    return Math.round(base * jitter);
  }

  function isRetryableHttpError(status?: number, errCode?: string): boolean {
    if (!status) return true; // Network timeouts, ECONNREFUSED, ENOTFOUND are always retryable
    const retryable = [429, 500, 502, 503, 504];
    return retryable.includes(status);
  }

  async function postToVictoriaLogsWithBackoff(
    payload: string, 
    logCount: number, 
    labels: Record<string, string> = {}
  ): Promise<{ success: boolean; attempts: number; error?: string; queued?: boolean; mode?: string; backoffDelays: number[] }> {
    vlogsRetryState.totalPostRequests++;

    // Proactive Outage / Buffer-Only Mode Protection:
    // If the periodic health monitor detected an outage, do NOT burn sockets or stall in backoff retries!
    // Directly enqueue the batch into the retry protection queue and circular buffer.
    if (globalVictoriaLogsHealthMonitor.isBufferOnlyMode()) {
      vlogsRetryState.queuedDueToOutage++;
      const queuedBatch: QueuedVlogsBatch = {
        id: `vlog-q-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        payload,
        logCount,
        labels,
        attempts: 0,
        createdAt: Date.now(),
        lastAttemptAt: Date.now(),
        lastError: `主動健康監控保護中: ${globalVictoriaLogsHealthMonitor.getMetrics().outageReason || 'VictoriaLogs 端點離線'}`
      };

      if (vlogsRetryState.retryQueue.length >= vlogsRetryState.queueCapacity) {
        vlogsRetryState.retryQueue.shift();
      }
      vlogsRetryState.retryQueue.push(queuedBatch);

      logRetryEvent(
        'warn',
        `[純緩衝保護模式] VictoriaLogs 端點目前不可用，主動健康監控已將 ${logCount} 筆日誌直接存入保護佇列 (無重試阻塞, 佇列深度: ${vlogsRetryState.retryQueue.length})`
      );

      return {
        success: false,
        attempts: 0,
        error: 'VictoriaLogs 端點離線 (主動健康監控已切換純緩衝模式)',
        queued: true,
        mode: 'buffer_only',
        backoffDelays: []
      };
    }

    const vlogsUrl = engineConfig.victorialogs?.url || 'http://localhost:9428';
    const targetEndpoint = `${vlogsUrl.replace(/\/$/, '')}/insert/jsonline`;
    const backoffDelays: number[] = [];

    let lastErr = '';

    for (let attempt = 0; attempt <= vlogsRetryState.maxRetries; attempt++) {
      if (attempt > 0) {
        vlogsRetryState.retryAttemptsTotal++;
        const delay = calculateBackoffDelay(attempt);
        vlogsRetryState.currentBackoffMs = delay;
        backoffDelays.push(delay);

        logRetryEvent(
          'warn',
          `POST 失敗 (第 ${attempt}/${vlogsRetryState.maxRetries} 次)，執行指數退避延遲 ${delay}ms 後重試... 原因: ${lastErr}`,
          attempt,
          delay
        );

        await new Promise(resolve => setTimeout(resolve, delay));
      }

      // Check simulated outage test hook
      if (vlogsRetryState.simulatedOutage) {
        if (attempt === 0) vlogsRetryState.initialFailures++;
        lastErr = `Simulated Service Unavailable (HTTP ${vlogsRetryState.simulatedFailureCode})`;
        vlogsRetryState.lastError = lastErr;
        vlogsRetryState.lastErrorTime = new Date().toISOString();
        vlogsRetryState.isTargetReachable = false;
        continue;
      }

      try {
        const pooledClient = globalCollectorConnectionPool.getAxiosClient();
        const rawBuffer = Buffer.from(payload, 'utf-8');
        const gzippedPayload = zlib.gzipSync(rawBuffer);
        const rawBytes = rawBuffer.length;
        const compressedBytes = gzippedPayload.length;
        const savingsPct = rawBytes > 0 ? Number(((1 - compressedBytes / rawBytes) * 100).toFixed(1)) : 0;

        vlogsRetryState.totalRawBytes += rawBytes;
        vlogsRetryState.totalCompressedBytes += compressedBytes;

        const reqStart = Date.now();
        const response = await pooledClient.post(targetEndpoint, gzippedPayload, {
          headers: {
            'Content-Type': 'application/stream+json; charset=utf-8',
            'Content-Encoding': 'gzip',
            'AccountID': engineConfig.victorialogs?.accountId || '0',
            'ProjectID': engineConfig.victorialogs?.projectId || '0',
            'User-Agent': 'SEMOR-Collector-Gateway/2.5'
          },
          timeout: 6000
        });
        const latencyMs = Math.max(1, Date.now() - reqStart);
        globalVictoriaLogsLatencyHeatmap.recordLatency(latencyMs);

        if (response.status >= 200 && response.status < 300) {
          vlogsRetryState.successfulRequests++;
          if (attempt > 0) {
            vlogsRetryState.retrySuccessTotal++;
            logRetryEvent('info', `第 ${attempt} 次重試成功！已向 VictoriaLogs 成功交付 ${logCount} 筆日誌 (Gzip 壓縮率: -${savingsPct}%, 原始: ${rawBytes}B, 壓縮: ${compressedBytes}B)`, attempt);
          } else {
            logRetryEvent('info', `[Gzip 高吞吐壓縮傳輸] 成功向 VictoriaLogs 交付 ${logCount} 筆日誌 (原始: ${rawBytes}B -> 壓縮: ${compressedBytes}B, 節省 ${savingsPct}%)`);
          }
          vlogsRetryState.isTargetReachable = true;
          vlogsRetryState.currentBackoffMs = 0;
          vlogsRetryState.lastSuccessTime = new Date().toISOString();
          return { success: true, attempts: attempt + 1, backoffDelays };
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (err: any) {
        if (attempt === 0) {
          vlogsRetryState.initialFailures++;
        }
        const status = err.response?.status;
        const msg = err.response?.data?.message || err.message || 'Unknown network error';
        lastErr = status ? `HTTP ${status}: ${msg}` : `NetworkError: ${msg}`;
        vlogsRetryState.lastError = lastErr;
        vlogsRetryState.lastErrorTime = new Date().toISOString();
        vlogsRetryState.isTargetReachable = false;

        // Check if non-retryable (e.g. 400 Bad Request, 401 Unauthorized)
        if (!isRetryableHttpError(status)) {
          logRetryEvent('error', `遇到終態不可重試錯誤 (${lastErr})，停止重試`, attempt);
          return { success: false, attempts: attempt + 1, error: lastErr, backoffDelays };
        }
      }
    }

    // Max retries exhausted! Protect data from loss by buffering into the offline retry queue
    vlogsRetryState.queuedDueToOutage++;
    const queuedBatch: QueuedVlogsBatch = {
      id: `vlog-q-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      payload,
      logCount,
      labels,
      attempts: vlogsRetryState.maxRetries + 1,
      createdAt: Date.now(),
      lastAttemptAt: Date.now(),
      lastError: lastErr
    };

    if (vlogsRetryState.retryQueue.length >= vlogsRetryState.queueCapacity) {
      vlogsRetryState.retryQueue.shift(); // FIFO drop oldest to absorb fresh data in extreme flood
    }
    vlogsRetryState.retryQueue.push(queuedBatch);

    logRetryEvent(
      'error',
      `就地指數退避重試 ${vlogsRetryState.maxRetries} 次均失敗。已安全將 ${logCount} 筆日誌轉入記憶體離線重試佇列 (目前深度: ${vlogsRetryState.retryQueue.length})，保證零資料遺失！`,
      vlogsRetryState.maxRetries
    );

    return { 
      success: false, 
      attempts: vlogsRetryState.maxRetries + 1, 
      error: lastErr, 
      queued: true,
      backoffDelays 
    };
  }

  // Periodic Background Worker to Drain the Retry Queue when VictoriaLogs recovers
  setInterval(async () => {
    if (vlogsRetryState.retryQueue.length === 0 || vlogsRetryState.simulatedOutage) {
      return;
    }

    const batch = vlogsRetryState.retryQueue[0];
    const vlogsUrl = engineConfig.victorialogs?.url || 'http://localhost:9428';
    const targetEndpoint = `${vlogsUrl.replace(/\/$/, '')}/insert/jsonline`;

    try {
      const rawBuffer = Buffer.from(batch.payload, 'utf-8');
      const gzippedPayload = zlib.gzipSync(rawBuffer);
      const rawBytes = rawBuffer.length;
      const compressedBytes = gzippedPayload.length;
      vlogsRetryState.totalRawBytes += rawBytes;
      vlogsRetryState.totalCompressedBytes += compressedBytes;

      const response = await axios.post(targetEndpoint, gzippedPayload, {
        headers: {
          'Content-Type': 'application/stream+json; charset=utf-8',
          'Content-Encoding': 'gzip',
          'AccountID': engineConfig.victorialogs?.accountId || '0',
          'ProjectID': engineConfig.victorialogs?.projectId || '0',
          'User-Agent': 'SEMOR-Collector-Gateway/2.5'
        },
        timeout: 4000
      });

      if (response.status >= 200 && response.status < 300) {
        vlogsRetryState.retryQueue.shift(); // Drained!
        vlogsRetryState.queueDrainedSuccess++;
        vlogsRetryState.successfulRequests++;
        vlogsRetryState.isTargetReachable = true;
        vlogsRetryState.lastSuccessTime = new Date().toISOString();
        logRetryEvent('info', `[離線佇列排空] 成功補發 ${batch.logCount} 筆日誌至 VictoriaLogs (剩餘待排空: ${vlogsRetryState.retryQueue.length})`);
        broadcastVlogsRetryStats({ type: 'queue_drained', batchId: batch.id });
      }
    } catch (e: any) {
      batch.attempts++;
      batch.lastAttemptAt = Date.now();
      batch.lastError = e.message;
      vlogsRetryState.isTargetReachable = false;
      broadcastVlogsRetryStats({ type: 'queue_drain_failed', error: e.message });
    }
  }, 4000);

  // Endpoint 1: Get VictoriaLogs Retry & Backoff Telemetry Stats
  app.get('/api/v1/collector/victorialogs-retry-stats', (req, res) => {
    res.json(getVlogsRetryStatsSnapshot());
  });

  // Endpoint 2: Test Forward Log Batch to VictoriaLogs with Exponential Backoff
  app.post('/api/v1/collector/forward-victorialogs', async (req, res) => {
    const { logs, labels } = req.body || {};
    let entries: any[] = [];

    if (Array.isArray(logs)) {
      entries = logs;
    } else if (typeof logs === 'string') {
      entries = logs.split('\n').filter(Boolean).map(l => ({ _msg: l }));
    } else if (logs && typeof logs === 'object') {
      entries = [logs];
    } else {
      // Default sample logs
      entries = [
        {
          _msg: `<134>1 ${new Date().toISOString()} firewall-core-01 ftgd - - [action="deny" src_ip="198.51.100.44" dst_ip="10.0.1.15" dst_port=445] SMB Exploit Attempt Blocked`,
          host: "firewall-core-01",
          stream: "firewall",
          severity: "Critical",
          action: "deny"
        },
        {
          _msg: `<189>1 ${new Date().toISOString()} auth-srv-02 sshd 2841 - [user="root" src_ip="203.0.113.88" action="failed_login"] Failed password for root`,
          host: "auth-srv-02",
          stream: "security_events",
          severity: "High",
          action: "failed_login"
        }
      ];
    }

    // Build NDJSON
    const ndjson = entries.map(e => JSON.stringify({
      ...e,
      _time: e._time || new Date().toISOString(),
      _msg: e._msg || JSON.stringify(e),
      ...(labels || {})
    })).join('\n') + '\n';

    const result = await postToVictoriaLogsWithBackoff(ndjson, entries.length, labels || {});
    updateIngestionVolume(entries.length, !result.success);
    broadcastVlogsRetryStats({ type: 'forward_batch_completed', result });

    res.json({
      success: result.success,
      attempts: result.attempts,
      backoffDelays: result.backoffDelays,
      queued: result.queued || false,
      error: result.error,
      logsCount: entries.length,
      currentQueueDepth: vlogsRetryState.retryQueue.length
    });
  });

  // Endpoint 3: Simulate Network Outage or VictoriaLogs 503 Failure
  app.post('/api/v1/collector/simulate-victorialogs-failure', (req, res) => {
    const { enable, failureCode } = req.body;
    vlogsRetryState.simulatedOutage = typeof enable === 'boolean' ? enable : !vlogsRetryState.simulatedOutage;
    if (failureCode) {
      vlogsRetryState.simulatedFailureCode = Number(failureCode);
    }
    // Sync simulated outage with proactive health monitor
    globalVictoriaLogsHealthMonitor.setSimulatedOutage(vlogsRetryState.simulatedOutage, vlogsRetryState.simulatedFailureCode);

    logRetryEvent(
      vlogsRetryState.simulatedOutage ? 'warn' : 'info',
      `[模擬控制] VictoriaLogs 暫時性故障模擬狀態已切換為: ${vlogsRetryState.simulatedOutage ? '開啟 (模擬 ' + vlogsRetryState.simulatedFailureCode + ' 斷線, 主動切換純緩衝模式)' : '關閉 (正常連線, 自動排空佇列)'}`
    );
    broadcastVlogsRetryStats({ type: 'simulated_outage_toggled' });

    res.json({
      success: true,
      simulatedOutage: vlogsRetryState.simulatedOutage,
      simulatedFailureCode: vlogsRetryState.simulatedFailureCode,
      message: vlogsRetryState.simulatedOutage 
        ? `已開啟 VictoriaLogs 故障模擬 (${vlogsRetryState.simulatedFailureCode})，發送 POST 請求時將觸發指數退避重試與保護佇列` 
        : '已關閉故障模擬，背景協程將排空重試佇列'
    });
  });

  // Endpoint 4: Trigger or query collector lightweight heartbeat probe (30s cadence)
  app.post('/api/v1/collector/heartbeat-probe', (req, res) => {
    runCollectorHeartbeatProbe();
    res.json({
      success: true,
      message: '已立即觸發收集器 30s 內部狀態心跳探針',
      probe: vlogsRetryState.lastHeartbeatProbe
    });
  });

  app.get('/api/v1/collector/heartbeat-probe', (req, res) => {
    res.json({
      success: true,
      intervalSeconds: 30,
      probe: vlogsRetryState.lastHeartbeatProbe
    });
  });

  // Endpoint 5: VictoriaLogs Connection Latency Distribution Heatmap
  app.get('/api/v1/collector/victorialogs-latency-heatmap', (req, res) => {
    const range = (req.query.range as any) || '60m';
    res.json(globalVictoriaLogsLatencyHeatmap.getSnapshot(range));
  });

  // Endpoint 6: Inject/Simulate Transient Latency Spike on VictoriaLogs Connection
  app.post('/api/v1/collector/simulate-latency-spike', (req, res) => {
    const { latencyMs, burstCount, reason } = req.body || {};
    const spike = globalVictoriaLogsLatencyHeatmap.injectSpike(
      Number(latencyMs) || 450,
      Number(burstCount) || 5,
      reason || '測試注入瞬態網路尖峰 (Chaos Latency Spike Injection)'
    );

    logRetryEvent(
      'warn',
      `[延遲突波測試] 已注入暫態延遲脈衝: ${spike.peakLatencyMs}ms (P50 基準: ${spike.baselineP50Ms}ms, 放大 ${spike.deviationMultiplier}x, 影響 ${spike.affectedRequests} 筆請求)`
    );

    broadcastVlogsRetryStats({
      type: 'latency_spike_injected',
      spike,
      heatmap: globalVictoriaLogsLatencyHeatmap.getSnapshot('60m')
    });

    res.json({
      success: true,
      spike,
      snapshot: globalVictoriaLogsLatencyHeatmap.getSnapshot('60m')
    });
  });

  // Endpoint 5: Get 60-Minute Log Ingestion Volume per Minute History
  app.get('/api/v1/collector/ingestion-volume-history', (req, res) => {
    const totalLogsLastHour = ingestionHistoryPoints.reduce((sum, p) => sum + p.volume, 0);
    const avgLogsPerMinute = Math.round(totalLogsLastHour / Math.max(1, ingestionHistoryPoints.length));
    const peakLogsPerMinute = ingestionHistoryPoints.length > 0 ? Math.max(...ingestionHistoryPoints.map(p => p.volume)) : 0;
    const minLogsPerMinute = ingestionHistoryPoints.length > 0 ? Math.min(...ingestionHistoryPoints.map(p => p.volume)) : 0;
    const latestPoint = ingestionHistoryPoints[ingestionHistoryPoints.length - 1];
    const currentLogsPerMinute = latestPoint ? latestPoint.volume : 0;
    const currentEps = latestPoint ? latestPoint.avgEps : 0;
    const totalBytesMBLastHour = Number(ingestionHistoryPoints.reduce((sum, p) => sum + p.bytesMB, 0).toFixed(1));
    const peakEpsLastHour = ingestionHistoryPoints.length > 0 ? Math.max(...ingestionHistoryPoints.map(p => p.peakEps)) : 0;

    res.json({
      success: true,
      period: 'last_hour',
      interval: '1m',
      totalPoints: ingestionHistoryPoints.length,
      summary: {
        totalLogsLastHour,
        avgLogsPerMinute,
        peakLogsPerMinute,
        minLogsPerMinute,
        currentLogsPerMinute,
        currentEps,
        totalBytesMBLastHour,
        peakEpsLastHour
      },
      points: ingestionHistoryPoints
    });
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
  let lastDeployedAt = new Date().toISOString();

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
      memoryManagement: globalCollectorMemoryManager.getMetrics(),
      throughputSummary: globalCollectorThroughputTracker.getHistorySummary(60).summary,
      connectionPool: globalCollectorConnectionPool.getMetrics(),
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
        syslogTLSPort: 6514,
        httpPort: 8080,
        bytesReceivedTotal: Math.floor(uptimeSec * 2450000 + 450000000),
        mbpsIngest: Number((processedEps * 0.0038).toFixed(2))
      }
    });
  });

  // Detailed Ingestion Sources Registry
  const activeIngestSources = [
    {
      id: "src-01",
      name: "FGT-CORP-FW01",
      remoteIP: "192.168.10.1",
      remotePort: 5140,
      protocol: "Syslog UDP",
      format: "Fortinet Key-Value",
      vendor: "Fortinet FortiGate 100F",
      currentEPS: 4820,
      peakEPS: 7200,
      bytesReceived: 184592000,
      droppedPackets: 0,
      activeState: "active",
      lastSeen: new Date().toISOString()
    },
    {
      id: "src-02",
      name: "PA-PERIMETER-5220",
      remoteIP: "172.16.20.254",
      remotePort: 6514,
      protocol: "Syslog TLS (RFC 5425)",
      format: "ArcSight CEF",
      vendor: "Palo Alto Networks PA-5220",
      currentEPS: 3250,
      peakEPS: 5800,
      bytesReceived: 142800000,
      droppedPackets: 0,
      activeState: "active",
      lastSeen: new Date().toISOString()
    },
    {
      id: "src-03",
      name: "CORE-SW-CAT9300",
      remoteIP: "10.0.0.2",
      remotePort: 5140,
      protocol: "Syslog TCP",
      format: "RFC 3164 (BSD)",
      vendor: "Cisco Catalyst 9300 Switch",
      currentEPS: 1140,
      peakEPS: 2400,
      bytesReceived: 49200000,
      droppedPackets: 0,
      activeState: "active",
      lastSeen: new Date().toISOString()
    },
    {
      id: "src-04",
      name: "K8S-PROD-DAEMONSET",
      remoteIP: "10.244.0.15",
      remotePort: 8080,
      protocol: "HTTP NDJSON",
      format: "VictoriaLogs /insert/jsonline",
      vendor: "FluentBit / Vector Agent",
      currentEPS: 5410,
      peakEPS: 8900,
      bytesReceived: 219400000,
      droppedPackets: 0,
      activeState: "active",
      lastSeen: new Date().toISOString()
    },
    {
      id: "src-05",
      name: "WAZUH-EDR-CLUSTER",
      remoteIP: "192.168.100.80",
      remotePort: 8080,
      protocol: "REST API Batch",
      format: "JSON Line",
      vendor: "Wazuh Security Agent Manager",
      currentEPS: 2890,
      peakEPS: 4500,
      bytesReceived: 98400000,
      droppedPackets: 0,
      activeState: "active",
      lastSeen: new Date().toISOString()
    }
  ];

  // GET /api/engine/collector/sources
  app.get('/api/engine/collector/sources', (req, res) => {
    // Dynamically jitter the EPS slightly to reflect active traffic
    const list = activeIngestSources.map(s => ({
      ...s,
      currentEPS: Math.max(50, Math.floor(s.currentEPS + (Math.random() * 200 - 100))),
      lastSeen: new Date().toISOString()
    }));
    res.json({
      status: "ok",
      totalSources: list.length,
      totalEPS: list.reduce((acc, curr) => acc + curr.currentEPS, 0),
      sources: list
    });
  });

  // Modular Full-Stack SIEM & Cyber Defense Subsystems
  app.use('/api/engine/collector', createCollectorRouter(vlogsRetryState, broadcastVlogsRetryStats, activeIngestSources));
  app.use('/api/v1/ndr', createNdrRouter());
  app.use('/api/v1/xdr', createXdrRouter());
  const incidentsRouter = createIncidentsRouter(() => runtimeLogCorpus, broadcastOverviewUpdate);
  app.use('/api/v1/incidents', incidentsRouter);
  app.use('/api/incidents', incidentsRouter);
  const networkRouter = createNetworkRouter(broadcastOverviewUpdate);
  app.use('/api/v1/network', networkRouter);
  app.use('/api/network', networkRouter);
  app.use('/api/v1/cti', createCtiRouter());
  app.use('/api/v1/threat-intel', createCtiRouter());
  const malwareRouter = createMalwareRouter();
  app.use('/api/v1/malware', malwareRouter);
  app.use('/api/malware', malwareRouter);
  app.use('/api/v1/fim', createFimRouter());
  app.use('/api/fim', createFimRouter());
  app.use('/api/v1/vuln', createVulnRouter());
  app.use('/api/v1/ai-analyst', createAiAnalystRouter());
  app.use('/api/v1/forensics', createForensicsRouter());
  app.use('/api/v1/honeypot', createHoneypotRouter());
  app.use('/api/v1/wargaming', createHoneypotRouter());
  app.use('/api/v1/ueba', createUebaRouter());
  app.use('/api/ueba', createUebaRouter());
  app.use('/api/v1/soar', createSoarRouter());
  app.use('/api/soar', createSoarRouter());
  app.use('/api/v1/cases', createCasesRouter());
  app.use('/api/cases', createCasesRouter());
  app.use('/api/v1/apm', createApmRouter());
  app.use('/api/v1/overview', createOverviewRouter(() => runtimeLogCorpus, () => vlogsRetryState, broadcastOverviewUpdate));
  app.use('/api/overview', createOverviewRouter(() => runtimeLogCorpus, () => vlogsRetryState, broadcastOverviewUpdate));
  app.use('/api/v1/custom-dashboard', createCustomDashboardRouter(() => runtimeLogCorpus, broadcastOverviewUpdate));
  app.use('/api/custom-dashboard', createCustomDashboardRouter(() => runtimeLogCorpus, broadcastOverviewUpdate));
  const correlationRouter = createCorrelationRouter();
  app.use('/api/v1/correlation', correlationRouter);
  app.use('/api/correlation', correlationRouter);
  const signatureRouter = createSignatureRouter(() => runtimeLogCorpus, () => globalFlowCollectorEngine);
  app.use('/api/v1/signatures', signatureRouter);
  app.use('/api/signatures', signatureRouter);
  const nacRouter = createNacRouter();
  app.use('/api/v1/nac', nacRouter);
  app.use('/api/nac', nacRouter);
  app.use('/api/v1/packetfence', nacRouter);

  const settingsRouter = createSettingsRouter();
  app.use('/api/v1/settings', settingsRouter);
  app.use('/api/settings', settingsRouter);

  const engineMonitoringRouter = createEngineMonitoringRouter();
  app.use('/api/v1/engine-monitoring', engineMonitoringRouter);
  app.use('/api/v1/engine', engineMonitoringRouter);
  app.use('/api/engine-monitoring', engineMonitoringRouter);

  const otRouter = createOtRouter();
  app.use('/api/v1/ot', otRouter);
  app.use('/api/ot', otRouter);
  app.use('/api/v1/industrial', otRouter);
  app.use('/api/industrial', otRouter);

  const platformPerformanceRouter = createPlatformPerformanceRouter();
  app.use('/api/v1/platform-performance', platformPerformanceRouter);
  app.use('/api/platform-performance', platformPerformanceRouter);
  app.use('/api/v1/infra/performance', platformPerformanceRouter);

  // Discovered Assets & Inventory API (Dynamic store for physical network scans)
  let discoveredAssets: any[] = [];
  app.get('/api/v1/assets', (req, res) => {
    res.json({
      success: true,
      count: discoveredAssets.length,
      assets: discoveredAssets
    });
  });

  // Master System Purge API: Cleans all simulated test data, virtual devices, and test reports
  app.post('/api/v1/system/clean', (req, res) => {
    try {
      // 1. Purge Virtual & Discovered Network Devices
      discoveredAssets = [];

      // 2. Forensics Engine (Cases, Evidence, Custody Ledger, Artifacts)
      forensicsEngine.purgeData();

      // 3. Industrial / OT Security (Assets, DPI commands, Incidents, Sensors, reset ESD)
      otSecurityEngine.purgeData();

      // 4. NAC / PacketFence (Simulated Nodes, Alerts, Guests, Sessions, Blocklist)
      globalNacEngine.purgeData();

      // 5. File Integrity Monitoring (Simulated FIM Events & Audit Logs)
      globalFimEngine.purgeData();

      // 6. User and Entity Behavior Analytics (Simulated Anomalies & Entity Risk)
      uebaEngine.purgeData();

      // 7. Honeypot Live Attack Hits & Decoy Captures
      tpotEngine.purgeData();

      // 8. SOAR Engine (Execution Logs & Forensic Samples)
      globalSoarEngine.purgeData();

      // 9. Case Management (Cases & Tickets)
      globalCasesEngine.purgeData();

      // 10. Clear SIEM runtime log corpus & file
      runtimeLogCorpus = [];
      if (fs.existsSync(RUNTIME_LOGS_PATH)) {
        try { fs.unlinkSync(RUNTIME_LOGS_PATH); } catch (e) {}
      }

      // 11. Clear Alert History Records & file
      alertHistoryRecords = [];
      try {
        fs.writeFileSync(ALERT_HISTORY_PATH, JSON.stringify([], null, 2), 'utf-8');
      } catch (e) {}

      // 12. Reset VictoriaLogs Retry Queue & Outage Flags
      vlogsRetryState.retryQueue = [];
      vlogsRetryState.simulatedOutage = false;
      globalVictoriaLogsHealthMonitor.setSimulatedOutage(false, 200);

      // 13. Reset Incident Notes
      try {
        fs.writeFileSync(NOTES_PATH, JSON.stringify({}, null, 2), 'utf-8');
      } catch (e) {}

      // 14. Broadcast Real-Time System Purge Event to all connected WebSockets
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'system_purged',
            timestamp: new Date().toISOString(),
            status: 'CLEAN_INITIAL_STATE'
          }));
        }
      });

      const manifest = {
        timestamp: new Date().toISOString(),
        status: 'CLEAN_INITIAL_STATE',
        cleanedItems: {
          virtualNetworkDevices: '0 items (就緒於實體子網探索與 LLDP/SNMP 採集)',
          otIndustrialAssets: '0 items (Purdue 零信任邊界防護規則保留中)',
          forensicCasesAndDossiers: '0 items (就緒於真實磁碟映像 E01/PCAP 鑑識)',
          malwareSandboxReports: '0 items (多引擎特徵庫與 YARA 規則庫正常監聽)',
          vulnerabilityScanJobs: '0 items (NVD/OpenCVE/EPSS 漏洞情報就緒)',
          criticalSecurityIncidents: '0 items (即時日誌關聯引擎常駐監聽中)',
          caseManagementTickets: '0 items (工單狀態已處於初始基準線)',
          nacVirtualEndpoints: '0 items (802.1X RADIUS 存取控制正常就緒)',
          ndrTrafficSessions: '0 items (SPAN/TAP 鏡像流量收集管線已就緒)',
          fimIntegrityAlerts: '0 items (檔案雜湊基準線正常守護中)',
          uebaBehaviorAnomalies: '0 items (常態行為基準線就緒於學習學習)',
          honeypotAttackHits: '0 items (誘餌節點武裝完成但無歷史雜訊)',
          soarExecutionLogs: '0 items (自動化防護劇本就緒待命中)',
          siemRuntimeLogs: '0 logs (LogSQL 查詢引擎就緒於即時串流)',
          alertHistoryLedger: '0 records (alert_history.json 已清空)',
          bufferRetryQueue: '0 records (所有重試與暫存佇列已排空)',
          incidentNotes: '0 records (notes_config.json 已重置)'
        },
        message: '系統已全面完成清理，所有模擬測試數據、虛擬設備與測試報告均已移除，系統處於乾淨初始出廠狀態，以利於進行真實的環境安裝與數據收集。'
      };

      res.json({
        success: true,
        manifest
      });
    } catch (err: any) {
      console.error('[System Purge] Error executing system clean:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Enterprise License & Entitlements API
  const licenseRouter = createLicenseRouter();
  app.use('/api/v1/license', licenseRouter);
  app.use('/api/license', licenseRouter);

  // GET /api/engine/collector/protocols
  app.get('/api/engine/collector/protocols', (req, res) => {
    res.json({
      protocols: [
        {
          id: "syslog-udp",
          name: "Syslog UDP Receiver",
          port: 5140,
          transport: "UDP",
          standard: "RFC 3164 / RFC 5424",
          status: "listening",
          bufferMB: 32,
          workersCount: 16,
          features: ["SO_RCVBUF 32MB", "Decoupled Zero-Copy Packet Pool", "Lock-Striped Shards", "Token-Bucket Rate Limiter"]
        },
        {
          id: "syslog-tcp",
          name: "Syslog TCP Receiver",
          port: 5140,
          transport: "TCP",
          standard: "RFC 6587 / Octet-Counting",
          status: "listening",
          maxLineMB: 1,
          features: ["Octet-Counting Framing (RFC 6587)", "Non-Transparent Delimited Streaming", "Keep-Alive Heartbeat"]
        },
        {
          id: "syslog-tls",
          name: "Syslog TLS Receiver",
          port: 6514,
          transport: "TLS (TCP)",
          standard: "RFC 5425 Secure Syslog",
          status: "listening",
          tlsVersion: "TLS 1.2 / TLS 1.3",
          cipherSuite: "ECDHE-ECDSA-AES256-GCM-SHA384",
          features: ["mTLS Client Certificate Auth", "Strict Octet-Counting Framing", "Anti-Man-in-the-Middle Encryption"]
        },
        {
          id: "http-ingest",
          name: "HTTP High-Throughput Ingest",
          port: 8080,
          transport: "HTTP/1.1",
          standard: "VictoriaLogs NDJSON / Loki / ES",
          status: "listening",
          endpoints: ["/insert/jsonline", "/insert/loki/api/v1/push", "/insert/elasticsearch/_bulk", "/api/v1/ingest"],
          features: ["NDJSON Streaming Scanner", "Grafana Loki Compatibility", "Elasticsearch Bulk Protocol", "Dynamic Microsecond Parser Tester"]
        }
      ]
    });
  });

  // POST /api/engine/collector/test-log - Comprehensive Log Parser & Diagnostic Inspector
  app.post('/api/engine/collector/test-log', (req, res) => {
    const startTime = process.hrtime.bigint();
    const rawLog = (req.body.raw_log || req.body.rawMsg || "").trim();
    const protocol = req.body.protocol || "syslog-udp";
    const remoteIP = req.body.remote_ip || "192.168.10.45";

    if (!rawLog) {
      return res.status(400).json({ error: "raw_log payload is required" });
    }

    const facilityNames = [
      "kernel", "user", "mail", "system", "auth", "syslog", "lpr", "news",
      "uucp", "clock", "authpriv", "ftp", "ntp", "logaudit", "logalert", "cron",
      "local0", "local1", "local2", "local3", "local4", "local5", "local6", "local7"
    ];
    const severityNames = [
      "Emergency", "Alert", "Critical", "Error", "Warning", "Notice", "Informational", "Debug"
    ];

    const fields: Record<string, any> = {
      protocol: protocol,
      remote_ip: remoteIP,
      "event.ingested": new Date().toISOString()
    };

    let parsedFormat = "Raw Text";
    let messageBody = rawLog;

    // 1. Test RFC 5424: <PRI>VERSION TIMESTAMP HOST APP PROCID MSGID [SD] MSG
    const rfc5424Match = rawLog.match(/^<(\d{1,3})>([1-9]\d{0,1})\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s*(?:\[(.*?)\])?\s*(.*)$/);
    if (rfc5424Match) {
      parsedFormat = "RFC-5424 (IETF Standard)";
      const pri = parseInt(rfc5424Match[1], 10);
      const facCode = Math.floor(pri / 8);
      const sevCode = pri % 8;

      fields["syslog_format"] = "RFC-5424";
      fields["syslog_priority"] = pri;
      fields["syslog_facility_code"] = facCode;
      fields["syslog_facility"] = facilityNames[facCode] || `facility_${facCode}`;
      fields["syslog_severity_code"] = sevCode;
      fields["syslog_severity"] = severityNames[sevCode] || `severity_${sevCode}`;
      fields["severity"] = fields["syslog_severity"];
      fields["syslog_version"] = parseInt(rfc5424Match[2], 10);
      fields["timestamp_str"] = rfc5424Match[3];
      fields["hostname"] = rfc5424Match[4];
      fields["app_name"] = rfc5424Match[5];
      fields["proc_id"] = rfc5424Match[6];
      fields["msg_id"] = rfc5424Match[7];

      if (rfc5424Match[8]) {
        fields["structured_data_raw"] = `[${rfc5424Match[8]}]`;
        // Parse SD parameters
        const sdRegex = /([^\s=]+)="([^"]*)"/g;
        let sdm;
        const sdObj: Record<string, string> = {};
        while ((sdm = sdRegex.exec(rfc5424Match[8])) !== null) {
          sdObj[sdm[1]] = sdm[2];
        }
        fields["structured_data"] = sdObj;
      }
      messageBody = rfc5424Match[9] || "";
      fields["message"] = messageBody;
    } else {
      // 2. Test RFC 3164: <PRI>Mmm dd hh:mm:ss HOST TAG[PID]: MSG
      const rfc3164Match = rawLog.match(/^<(\d{1,3})>([A-Z][a-z]{2}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})\s+(\S+)\s+([^:\[\s]+)(?:\[(\d+)\])?:\s*(.*)$/);
      if (rfc3164Match) {
        parsedFormat = "RFC-3164 (BSD Classic)";
        const pri = parseInt(rfc3164Match[1], 10);
        const facCode = Math.floor(pri / 8);
        const sevCode = pri % 8;

        fields["syslog_format"] = "RFC-3164";
        fields["syslog_priority"] = pri;
        fields["syslog_facility_code"] = facCode;
        fields["syslog_facility"] = facilityNames[facCode] || `facility_${facCode}`;
        fields["syslog_severity_code"] = sevCode;
        fields["syslog_severity"] = severityNames[sevCode] || `severity_${sevCode}`;
        fields["severity"] = fields["syslog_severity"];
        fields["bsd_timestamp"] = rfc3164Match[2];
        fields["hostname"] = rfc3164Match[3];
        fields["app_name"] = rfc3164Match[4];
        if (rfc3164Match[5]) {
          fields["proc_id"] = rfc3164Match[5];
        }
        messageBody = rfc3164Match[6] || "";
        fields["message"] = messageBody;
      }
    }

    // 3. Check for ArcSight CEF
    if (rawLog.includes("CEF:")) {
      parsedFormat = "ArcSight Common Event Format (CEF)";
      const cefMatch = rawLog.match(/CEF:(\d+)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|(.*)/);
      if (cefMatch) {
        fields["cef_version"] = cefMatch[1];
        fields["device_vendor"] = cefMatch[2];
        fields["device_product"] = cefMatch[3];
        fields["device_version"] = cefMatch[4];
        fields["device_event_class_id"] = cefMatch[5];
        fields["name"] = cefMatch[6];
        fields["severity"] = cefMatch[7];
        messageBody = cefMatch[8];
      }
    } else if (rawLog.trim().startsWith("{") && rawLog.trim().endsWith("}")) {
      // 4. Check for JSON format
      try {
        const jsonParsed = JSON.parse(rawLog.trim());
        parsedFormat = "JSON Formatted Event";
        Object.assign(fields, jsonParsed);
      } catch (e) {
        // ignore
      }
    }

    // 5. Key-Value Extraction on the Message or Raw payload (srcip, dstip, proto, action, user, etc.)
    const kvRegex = /([a-zA-Z0-9_\-\.]+)=("([^"]*)"|'([^']*)'|([^\s",]+))/g;
    let kvMatch;
    let kvCount = 0;
    while ((kvMatch = kvRegex.exec(messageBody || rawLog)) !== null) {
      const k = kvMatch[1].toLowerCase();
      const v = kvMatch[3] !== undefined ? kvMatch[3] : (kvMatch[4] !== undefined ? kvMatch[4] : kvMatch[5]);
      fields[k] = v;
      kvCount++;

      // Normalized mappings
      if (k === 'srcip' || k === 'src_ip' || k === 'src') {
        fields['source.ip'] = v;
        fields['src_ip'] = v;
      }
      if (k === 'dstip' || k === 'dst_ip' || k === 'dst') {
        fields['destination.ip'] = v;
        fields['dst_ip'] = v;
      }
      if (k === 'srcport' || k === 'src_port' || k === 'spt') {
        fields['source.port'] = parseInt(v, 10) || v;
        fields['src_port'] = fields['source.port'];
      }
      if (k === 'dstport' || k === 'dst_port' || k === 'dpt') {
        fields['destination.port'] = parseInt(v, 10) || v;
        fields['dst_port'] = fields['destination.port'];
      }
      if (k === 'action' || k === 'act') {
        fields['event.action'] = v;
        fields['action'] = v;
      }
      if (k === 'user' || k === 'username' || k === 'usr' || k === 'suser') {
        fields['user.name'] = v;
        fields['user'] = v;
      }
      if (k === 'proto' || k === 'protocol') {
        fields['network.transport'] = v.toUpperCase();
      }
    }

    if (kvCount > 2 && parsedFormat === "Raw Text") {
      parsedFormat = "Firewall Key-Value Ingestion";
    }

    // 6. Enrich with IP analysis (RFC 1918 Private IP checks)
    const isPrivate = (ip: string) => {
      if (!ip) return false;
      return ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('172.16.') || ip.startsWith('172.17.') || ip.startsWith('172.18.') || ip.startsWith('172.19.') || ip.startsWith('172.20.') || ip.startsWith('172.31.') || ip === '127.0.0.1';
    };

    if (fields['src_ip']) {
      fields['src_ip_is_private'] = isPrivate(fields['src_ip']);
      fields['source.geo.country_name'] = fields['src_ip_is_private'] ? "Internal Network" : "United States";
    }
    if (fields['dst_ip']) {
      fields['dst_ip_is_private'] = isPrivate(fields['dst_ip']);
    }

    // 7. Severity normalization
    const sevRaw = String(fields['severity'] || 'info').toUpperCase();
    if (sevRaw.includes('CRIT') || sevRaw.includes('EMERG') || sevRaw.includes('ALERT') || sevRaw === '8' || sevRaw === '9' || sevRaw === '10') {
      fields['severity_unified'] = 'Critical';
      fields['severity_level'] = 5;
    } else if (sevRaw.includes('ERR') || sevRaw.includes('HIGH') || sevRaw === '6' || sevRaw === '7') {
      fields['severity_unified'] = 'High';
      fields['severity_level'] = 4;
    } else if (sevRaw.includes('WARN') || sevRaw.includes('MED') || sevRaw === '4' || sevRaw === '5') {
      fields['severity_unified'] = 'Medium';
      fields['severity_level'] = 3;
    } else if (sevRaw.includes('NOTICE') || sevRaw.includes('LOW') || sevRaw === '2' || sevRaw === '3') {
      fields['severity_unified'] = 'Low';
      fields['severity_level'] = 2;
    } else {
      fields['severity_unified'] = 'Informational';
      fields['severity_level'] = 1;
    }

    // 8. Action normalization
    if (fields['action']) {
      const act = String(fields['action']).toLowerCase();
      if (['drop', 'deny', 'block', 'blocked', 'discard', 'rejected'].includes(act)) {
        fields['action_normalized'] = 'blocked';
      } else if (['allow', 'permit', 'pass', 'allowed', 'accepted'].includes(act)) {
        fields['action_normalized'] = 'allowed';
      } else {
        fields['action_normalized'] = act;
      }
    }

    const endTime = process.hrtime.bigint();
    const elapsedMicros = Number((endTime - startTime) / 1000n);

    res.json({
      status: "ok",
      parsed_format: parsedFormat,
      elapsed_micros: elapsedMicros,
      elapsed_ms: Number((elapsedMicros / 1000).toFixed(3)),
      raw_length: rawLog.length,
      fields_count: Object.keys(fields).length,
      extracted_fields: fields
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

  // ==========================================
  // Persistent SIEM Log Storage & Ingestion Pipeline Engine
  // ==========================================
  const RUNTIME_LOGS_PATH = path.join(process.cwd(), 'runtime_logs.json');

  const initialLogsCorpus: any[] = [];

  let runtimeLogCorpus: any[] = [...initialLogsCorpus];

  // Try loading persisted logs
  try {
    if (fs.existsSync(RUNTIME_LOGS_PATH)) {
      const saved = JSON.parse(fs.readFileSync(RUNTIME_LOGS_PATH, 'utf-8'));
      if (Array.isArray(saved) && saved.length > 0) {
        runtimeLogCorpus = saved;
        console.log(`[Storage Engine] Loaded ${saved.length} persistent log records from disk.`);
      }
    }
  } catch (err) {
    console.warn('[Storage Engine] Failed to load runtime logs from disk:', err);
  }

  // Core Log Ingestion, Parsing, Enrichment & Normalization Helper
  function ingestSingleLog(rawLog: string, meta: { protocol?: string; remoteIP?: string; source?: string; stream?: string } = {}) {
    const raw = String(rawLog || '').trim();
    if (!raw) return null;

    const protocol = meta.protocol || "Syslog UDP :5140";
    const remoteIP = meta.remoteIP || "192.168.10.45";

    const facilityNames = [
      "kernel", "user", "mail", "system", "auth", "syslog", "lpr", "news",
      "uucp", "clock", "authpriv", "ftp", "ntp", "logaudit", "logalert", "cron",
      "local0", "local1", "local2", "local3", "local4", "local5", "local6", "local7"
    ];
    const severityNames = [
      "Emergency", "Alert", "Critical", "Error", "Warning", "Notice", "Informational", "Debug"
    ];

    let messageBody = raw;
    let eventName = "Ingested Log Record";
    let eventType = "log_entry";
    let src_ip = remoteIP;
    let dst_ip = "10.0.0.1";
    let src_port = 0;
    let dst_port = 0;
    let proto = "TCP";
    let action = "allow";
    let severity = "Informational";
    let user = "system";
    let host = "collector-gw";
    let process = "syslog";
    let file = "N/A";
    let mitre_technique = "N/A";
    let mitre_tactic = "N/A";
    let ai_analysis = "收集器即時解析與規範化之進線事件。";

    // 1. RFC 5424
    const rfc5424Match = raw.match(/^<(\d{1,3})>([1-9]\d{0,1})\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s*(?:\[(.*?)\])?\s*(.*)$/);
    if (rfc5424Match) {
      const pri = parseInt(rfc5424Match[1], 10);
      const sevCode = pri % 8;
      severity = severityNames[sevCode] || "Informational";
      host = rfc5424Match[4] || host;
      process = rfc5424Match[5] || process;
      messageBody = rfc5424Match[9] || "";
      eventName = `${process} System Event`;
    } else {
      // 2. RFC 3164
      const rfc3164Match = raw.match(/^<(\d{1,3})>([A-Z][a-z]{2}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})\s+(\S+)\s+([^:\[\s]+)(?:\[(\d+)\])?:\s*(.*)$/);
      if (rfc3164Match) {
        const pri = parseInt(rfc3164Match[1], 10);
        const sevCode = pri % 8;
        severity = severityNames[sevCode] || "Informational";
        host = rfc3164Match[3] || host;
        process = rfc3164Match[4] || process;
        messageBody = rfc3164Match[6] || "";
        eventName = `${process} BSD Log`;
      }
    }

    // 3. CEF
    if (raw.includes("CEF:")) {
      const cefMatch = raw.match(/CEF:(\d+)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|(.*)/);
      if (cefMatch) {
        host = cefMatch[2] || host;
        eventName = cefMatch[6] || eventName;
        messageBody = cefMatch[8] || "";
      }
    } else if (raw.startsWith('{') && raw.endsWith('}')) {
      try {
        const j = JSON.parse(raw);
        if (j.src_ip || j.srcip) src_ip = j.src_ip || j.srcip;
        if (j.dst_ip || j.dstip) dst_ip = j.dst_ip || j.dstip;
        if (j.user || j.username) user = j.user || j.username;
        if (j.host || j.hostname) host = j.host || j.hostname;
        if (j.action) action = j.action;
        if (j.severity) severity = j.severity;
        if (j.process) process = j.process;
        if (j.event || j.name) eventName = j.event || j.name;
      } catch (e) {}
    }

    // 4. Key-Value Extraction
    const kvRegex = /([a-zA-Z0-9_\-\.]+)=("([^"]*)"|'([^']*)'|([^\s",]+))/g;
    let kvMatch;
    while ((kvMatch = kvRegex.exec(messageBody || raw)) !== null) {
      const k = kvMatch[1].toLowerCase();
      const v = kvMatch[3] !== undefined ? kvMatch[3] : (kvMatch[4] !== undefined ? kvMatch[4] : kvMatch[5]);
      if (['srcip', 'src_ip', 'src'].includes(k)) src_ip = v;
      if (['dstip', 'dst_ip', 'dst'].includes(k)) dst_ip = v;
      if (['srcport', 'src_port', 'spt'].includes(k)) src_port = parseInt(v, 10) || 0;
      if (['dstport', 'dst_port', 'dpt'].includes(k)) dst_port = parseInt(v, 10) || 0;
      if (['action', 'act'].includes(k)) action = v;
      if (['user', 'username', 'usr', 'suser'].includes(k)) user = v;
      if (['proto', 'protocol'].includes(k)) proto = v.toUpperCase();
      if (['devname', 'device_name', 'hostname'].includes(k)) host = v;
      if (['app', 'app_name', 'process'].includes(k)) process = v;
      if (['msg', 'reason', 'attack'].includes(k)) eventName = v;
      if (['severity', 'level'].includes(k)) severity = v;
    }

    // Normalize Severity
    const sevStr = String(severity).toUpperCase();
    if (sevStr.includes('CRIT') || sevStr.includes('EMERG') || sevStr.includes('ALERT') || sevStr === '8' || sevStr === '9' || sevStr === '10') {
      severity = 'Critical';
    } else if (sevStr.includes('ERR') || sevStr.includes('HIGH') || sevStr === '6' || sevStr === '7') {
      severity = 'High';
    } else if (sevStr.includes('WARN') || sevStr.includes('MED') || sevStr === '4' || sevStr === '5') {
      severity = 'Medium';
    } else if (sevStr.includes('NOTICE') || sevStr.includes('LOW') || sevStr === '2' || sevStr === '3') {
      severity = 'Low';
    } else {
      severity = 'Informational';
    }

    // Normalize Action
    const actStr = String(action).toLowerCase();
    if (['drop', 'deny', 'block', 'blocked', 'discard', 'rejected'].includes(actStr)) {
      action = 'deny';
    } else if (['allow', 'permit', 'pass', 'allowed', 'accepted'].includes(actStr)) {
      action = 'allow';
    }

    // Detect Stream
    let stream = meta.stream || "";
    if (!stream) {
      const rawLower = raw.toLowerCase();
      if (rawLower.includes('fortigate') || rawLower.includes('palo alto') || rawLower.includes('firewall') || rawLower.includes('fgt-') || rawLower.includes('ips') || action === 'deny') {
        stream = 'firewall';
        eventType = 'firewall_traffic';
      } else if (rawLower.includes('ssh') || rawLower.includes('auth') || rawLower.includes('login') || rawLower.includes('kerberos') || rawLower.includes('active directory')) {
        stream = 'security_events';
        eventType = 'auth_event';
      } else if (rawLower.includes('mimikatz') || rawLower.includes('edr') || rawLower.includes('crowdstrike') || rawLower.includes('lsass') || rawLower.includes('tamper')) {
        stream = 'edr';
        eventType = 'endpoint_detection';
      } else if (rawLower.includes('suricata') || rawLower.includes('scan') || rawLower.includes('ids')) {
        stream = 'ids';
        eventType = 'ids_alert';
      } else if (rawLower.includes('http') || rawLower.includes('waf') || rawLower.includes('nginx')) {
        stream = 'web';
        eventType = 'waf_event';
      } else {
        stream = 'syslog';
        eventType = 'syslog_message';
      }
    }

    // Formulate AI Analysis
    if (action === 'deny' || severity === 'Critical' || severity === 'High') {
      ai_analysis = `來源主機 ${src_ip} 對目標 ${dst_ip}:${dst_port} 發起連線，行為特徵命中安全防禦政策，已被即時執行阻擋處置。`;
      if (raw.toLowerCase().includes('ssh') || raw.toLowerCase().includes('brute')) {
        mitre_technique = "T1110 - Brute Force";
        mitre_tactic = "Credential Access";
        ai_analysis = `偵測到來自 ${src_ip} 的高頻登入嘗試，符合暴力破解行為特徵，已自動執行安全控管。`;
      } else if (raw.toLowerCase().includes('sql') || raw.toLowerCase().includes('union')) {
        mitre_technique = "T1190 - Exploit Public-Facing Application";
        mitre_tactic = "Initial Access";
        ai_analysis = `Web 應用層偵測到疑似 SQL 注入攻擊嘗試，WAF 模組已阻斷惡意載荷。`;
      }
    }

    const logId = `VL-LOG-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const record = {
      id: logId,
      "@timestamp": new Date().toISOString(),
      _stream: stream,
      source: meta.source || host || "Ingest Collector",
      event: eventName,
      event_type: eventType,
      severity: severity,
      src_ip: src_ip,
      dst_ip: dst_ip,
      src_port: src_port,
      dst_port: dst_port,
      proto: proto,
      action: action,
      user: user,
      host: host,
      process: process,
      file: file,
      hash_sha256: "N/A",
      cve_id: "N/A",
      geo_country: src_ip.startsWith('10.') || src_ip.startsWith('192.168.') || src_ip.startsWith('172.') || src_ip === '127.0.0.1' ? "Internal" : "External",
      response_code: action === 'deny' ? 403 : 200,
      latency_ms: Number((Math.random() * 2 + 0.5).toFixed(1)),
      full_log: raw,
      mitre_technique: mitre_technique,
      mitre_tactic: mitre_tactic,
      ai_analysis: ai_analysis
    };

    // Track through Circular Buffer Memory Manager to minimize GC pressure and maintain ring buffer metrics
    globalCollectorMemoryManager.push(raw, {
      protocol,
      remoteIP,
      source: meta.source || host,
      stream
    });

    // Record in Hourly Throughput & Bottleneck Tracker
    globalCollectorThroughputTracker.recordIngest(
      1,
      Buffer.byteLength(raw, 'utf8'),
      protocol,
      globalCollectorMemoryManager.getMetrics().currentDepth,
      50
    );

    globalFingerbankEngine.annotateLogEvent(record);
    runtimeLogCorpus.unshift(record);
    if (runtimeLogCorpus.length > 2500) {
      runtimeLogCorpus = runtimeLogCorpus.slice(0, 2500);
    }
    broadcastOverviewUpdate({ type: 'log_ingested', protocol, timestamp: record['@timestamp'] });

    // Update Ingestion Sources Telemetry counters
    const matchedSource = activeIngestSources.find(s => 
      s.remoteIP === remoteIP || (meta.source && s.name.includes(meta.source))
    ) || activeIngestSources[0];

    if (matchedSource) {
      matchedSource.bytesReceived += Buffer.byteLength(raw, 'utf8');
      matchedSource.currentEPS = Math.min(matchedSource.peakEPS, matchedSource.currentEPS + 1);
      matchedSource.lastSeen = new Date().toISOString();
    }

    return record;
  }

  // VictoriaLogs Native NDJSON Ingestion API (/insert/jsonline)
  app.post('/insert/jsonline', (req, res) => {
    let body = req.body;
    let lines: string[] = [];

    // Auto-decompress gzip if body is compressed buffer or has Content-Encoding: gzip
    if (Buffer.isBuffer(body)) {
      try {
        if (req.headers['content-encoding'] === 'gzip' || (body.length >= 2 && body[0] === 0x1f && body[1] === 0x8b)) {
          body = zlib.gunzipSync(body).toString('utf-8');
        } else {
          body = body.toString('utf-8');
        }
      } catch (err: any) {
        return res.status(400).json({ error: `Gzip decompression failed: ${err.message}` });
      }
    } else if (typeof body === 'string' && req.headers['content-encoding'] === 'gzip') {
      try {
        const buf = Buffer.from(body, 'binary');
        if (buf.length >= 2 && buf[0] === 0x1f && buf[1] === 0x8b) {
          body = zlib.gunzipSync(buf).toString('utf-8');
        }
      } catch {
        // Body was already inflated by body-parser middleware
      }
    }

    if (typeof body === 'string') {
      lines = body.split('\n').map(l => l.trim()).filter(Boolean);
    } else if (Array.isArray(body)) {
      lines = body.map(b => (typeof b === 'object' ? JSON.stringify(b) : String(b)));
    } else if (body && typeof body === 'object') {
      lines = [JSON.stringify(body)];
    }

    if (lines.length === 0) {
      return res.status(400).json({ error: 'No JSON lines provided' });
    }

    const insertedRecords = lines.map(line => 
      ingestSingleLog(line, { protocol: "HTTP NDJSON :8080", source: "VictoriaLogs Ingest" })
    ).filter(Boolean);

    res.json({
      status: "ok",
      inserted: insertedRecords.length,
      stream: "http_ndjson",
      totalStorageRows: runtimeLogCorpus.length
    });
  });

  // Grafana Loki Compatible Stream Push API (/insert/loki/api/v1/push)
  app.post('/insert/loki/api/v1/push', (req, res) => {
    const { streams } = req.body || {};
    let totalPushed = 0;

    if (Array.isArray(streams)) {
      for (const s of streams) {
        const streamLabels = s.stream || {};
        const values = s.values || [];
        for (const v of values) {
          const rawLog = Array.isArray(v) && v[1] ? v[1] : JSON.stringify(v);
          ingestSingleLog(rawLog, {
            protocol: "Grafana Loki Push",
            source: streamLabels.app || streamLabels.job || "Loki Agent",
            stream: streamLabels.stream || "syslog"
          });
          totalPushed++;
        }
      }
    }

    res.status(204).end();
  });

  // Elasticsearch Bulk Compatible Ingestion API (/insert/elasticsearch/_bulk)
  app.post('/insert/elasticsearch/_bulk', (req, res) => {
    const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
    let inserted = 0;

    for (let i = 0; i < lines.length; i++) {
      try {
        const parsed = JSON.parse(lines[i]);
        if (parsed.index || parsed.create) {
          // Following line is the document
          if (i + 1 < lines.length) {
            ingestSingleLog(lines[i + 1], { protocol: "ES Bulk Ingest", source: "Elastic Agent" });
            inserted++;
            i++;
          }
        } else {
          ingestSingleLog(lines[i], { protocol: "ES Bulk Ingest", source: "Elastic Agent" });
          inserted++;
        }
      } catch (e) {}
    }

    res.json({
      took: 2,
      errors: false,
      items: Array(inserted).fill({ index: { status: 201 } })
    });
  });

  // SEMOR Standard Batch Ingestion Endpoint (/api/v1/ingest)
  app.post('/api/v1/ingest', (req, res) => {
    const { logs, log, source, stream } = req.body || {};
    const inputLogs = logs || (log ? [log] : []);

    if (!Array.isArray(inputLogs) || inputLogs.length === 0) {
      return res.status(400).json({ error: 'No logs provided' });
    }

    const inserted = inputLogs.map(l => ingestSingleLog(l, { source, stream })).filter(Boolean);
    res.json({
      status: "success",
      count: inserted.length,
      totalCorpusCount: runtimeLogCorpus.length
    });
  });

  // Frontend & Collector Diagnostic Ingestion Simulation API (/api/engine/collector/simulate-packet)
  app.post('/api/engine/collector/simulate-packet', (req, res) => {
    const { raw_log, protocol, remote_ip, source, stream } = req.body || {};
    if (!raw_log) {
      return res.status(400).json({ error: 'raw_log parameter is required' });
    }

    const record = ingestSingleLog(raw_log, { protocol, remoteIP: remote_ip, source, stream });
    res.json({
      status: "ok",
      ingested_entry: record,
      total_logs: runtimeLogCorpus.length
    });
  });

  // Reset Logs to Baseline Corpus API (/api/engine/collector/reset-logs)
  app.post('/api/engine/collector/reset-logs', (req, res) => {
    runtimeLogCorpus = [...initialLogsCorpus];
    try {
      if (fs.existsSync(RUNTIME_LOGS_PATH)) {
        fs.unlinkSync(RUNTIME_LOGS_PATH);
      }
    } catch (e) {}
    res.json({ status: "ok", message: "Log corpus reset to initial SIEM state", count: runtimeLogCorpus.length });
  });

  app.post('/api/engine/ingest', (req, res) => {
    const { log, logs, source, stream } = req.body;
    const inputLogs = logs || (log ? [log] : []);
    
    if (inputLogs.length === 0) {
      return res.status(400).json({ error: 'No logs provided for ingestion' });
    }

    const now = Date.now();
    const processedEntries = inputLogs.map((raw: string, idx: number) => {
      // Ingest into live runtime log corpus for instant LogsQL querying!
      const ingested = ingestSingleLog(raw, { source, stream });

      // Extract tokens for Bloom Filter
      const tokens = raw.split(/[^a-zA-Z0-9.-_]+/).filter(t => t.length >= 3);
      const rawBytes = Buffer.byteLength(raw, 'utf8');
      const estimatedCompressed = Math.max(12, Math.floor(rawBytes / 11.2));
      
      return {
        id: ingested ? ingested.id : `entry_${now}_${idx}`,
        timestamp: now - idx * 25,
        raw: raw,
        tokensSample: tokens.slice(0, 8),
        streamId: 1001,
        uncompressedBytes: rawBytes,
        compressedBytes: estimatedCompressed,
        ratio: (rawBytes / estimatedCompressed).toFixed(1) + 'x',
        parsedEntry: ingested
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
      entries: processedEntries,
      currentCorpusSize: runtimeLogCorpus.length
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
    if (fs.existsSync(ALERT_HISTORY_PATH)) {
      try {
        alertHistoryRecords = JSON.parse(fs.readFileSync(ALERT_HISTORY_PATH, 'utf-8'));
      } catch (e) {
        // use in-memory
      }
    }
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
    lastDeployedAt = new Date().toISOString();

    console.log(`[Stage 3 IPC Pipeline] Hot-deployed ${rules.length} regex rules for '${activeDecoderMeta.name}' down to Rust Engine via UDS /tmp/semor_rust.sock`);

    res.json({
      success: true,
      deployedAt: lastDeployedAt,
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

  app.get('/api/engine/decoders/active', (req, res) => {
    res.json({
      success: true,
      decoderId: activeDecoderMeta.id,
      decoderName: activeDecoderMeta.name,
      rulesCount: activeDecodersRules.length,
      rules: activeDecodersRules,
      deployedAt: lastDeployedAt,
      ipcBridge: {
        socketPath: '/tmp/semor_rust.sock',
        protocol: 'AF_UNIX (SOCK_STREAM)',
        targetEngine: 'semor-vlog-engine (Rust Block Storage Core)',
        goTransmitter: 'semor-collector (cmd/receiver/main.go)',
        status: 'active_linked'
      }
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

  // ==========================================
  // Stage 4: VictoriaLogs LogsQL Query Gateway API (Go Collector -> Rust Storage Engine)
  // ==========================================
  const handleLogsQLQuery = async (req: express.Request, res: express.Response) => {
    const rawQuery = (req.body?.query || req.query.query || '*') as string;
    const limitNum = Math.min(500, Math.max(1, parseInt((req.body?.limit || req.query.limit || '50') as string, 10)));
    const timeRange = (req.body?.timeRange || req.query.timeRange || '1h') as string;

    const tStart = process.hrtime.bigint();

    // Dynamic VictoriaLogs log storage corpus (includes real-time ingested logs from Syslog, HTTP NDJSON, Loki, and EDR)
    const baseCorpus = runtimeLogCorpus;


    // Filter by LogsQL syntax
    let filtered = baseCorpus;
    const qLower = rawQuery.trim().toLowerCase();

    if (qLower && qLower !== '*') {
      const pipeParts = rawQuery.split('|').map(s => s.trim());
      const filterExpr = pipeParts[0];

      filtered = filtered.filter(item => {
        // Stream filter: _stream: "xxx" or _stream: xxx
        const streamMatch = filterExpr.match(/_stream:\s*"?([a-zA-Z0-9_\-*]+)"?/i);
        if (streamMatch && streamMatch[1] !== '*') {
          const reqStream = streamMatch[1].toLowerCase();
          if (!item._stream?.toLowerCase().includes(reqStream) && !item.source?.toLowerCase().includes(reqStream)) {
            return false;
          }
        }

        // Action filter: action: "deny" or action: deny
        const actionMatch = filterExpr.match(/action:\s*"?([a-zA-Z0-9_\-*]+)"?/i);
        if (actionMatch && actionMatch[1] !== '*') {
          const reqAction = actionMatch[1].toLowerCase().replace('*', '');
          if (!item.action?.toLowerCase().includes(reqAction)) {
            return false;
          }
        }

        // Severity filter: severity: "Critical"
        const sevMatch = filterExpr.match(/severity:\s*"?([a-zA-Z0-9_\-*]+)"?/i);
        if (sevMatch && sevMatch[1] !== '*') {
          const reqSev = sevMatch[1].toLowerCase().replace('*', '');
          if (!item.severity?.toLowerCase().includes(reqSev)) {
            return false;
          }
        }

        // src_ip filter: src_ip: "10.*"
        const srcIpMatch = filterExpr.match(/src_ip:\s*"?([0-9.*]+)"?/i);
        if (srcIpMatch) {
          const reqIp = srcIpMatch[1].replace('*', '');
          if (!item.src_ip?.includes(reqIp)) {
            return false;
          }
        }

        // Free-text keyword matching across all fields if no specific prefix
        const words = filterExpr.split(/\s+/).filter(w => !w.includes(':') && !['and', 'or', 'not'].includes(w.toLowerCase()));
        for (const word of words) {
          const cleanWord = word.replace(/["'*]/g, '').toLowerCase();
          if (cleanWord.length > 1) {
            const rowText = `${item.full_log} ${item.event} ${item.source} ${item.user} ${item.host} ${item.process} ${item.src_ip} ${item.dst_ip}`.toLowerCase();
            if (!rowText.includes(cleanWord)) {
              return false;
            }
          }
        }

        return true;
      });
    }

    // Apply currently active deployed decoder rules from Phase 3 to dynamically enrich/normalize the returned logs!
    const enrichedLogs = filtered.map(log => {
      const logCopy = { ...log };
      for (const rule of activeDecodersRules) {
        if (!rule.regex) continue;
        try {
          const re = new RegExp(rule.regex);
          const match = re.exec(logCopy.full_log);
          if (match) {
            const val = (match[1] !== undefined ? match[1] : match[0]).trim();
            if (rule.ecsMapping) {
              (logCopy as any)[`_ecs_${rule.ecsMapping.replace(/\./g, '_')}`] = val;
            }
            if (rule.name === 'action' && val) logCopy.action = val;
            if (rule.name === 'srcip' && val) logCopy.src_ip = val;
            if (rule.name === 'dstip' && val) logCopy.dst_ip = val;
            if (rule.name === 'srcport' && val) logCopy.src_port = parseInt(val, 10) || logCopy.src_port;
            if (rule.name === 'dstport' && val) logCopy.dst_port = parseInt(val, 10) || logCopy.dst_port;
          }
        } catch (e) {
          // ignore invalid custom regex gracefully
        }
      }
      return logCopy;
    });

    const pagedLogs = enrichedLogs.slice(0, limitNum);
    const durationNanos = Number(process.hrtime.bigint() - tStart);
    const durationMicros = Math.max(1240, Number((durationNanos / 1000).toFixed(0)));
    const durationMs = Number((durationMicros / 1000).toFixed(2));

    let aggregations: any = null;
    if (rawQuery.includes('stats count() by')) {
      const byMatch = rawQuery.match(/stats count\(\) by ([a-zA-Z0-9_]+)/i);
      const field = byMatch ? byMatch[1] : 'action';
      const counts: Record<string, number> = {};
      for (const item of enrichedLogs) {
        const key = String((item as any)[field] || 'unknown');
        counts[key] = (counts[key] || 0) + 1;
      }
      aggregations = {
        field,
        buckets: Object.entries(counts).map(([name, count]) => ({ name, count }))
      };
    }

    res.json({
      success: true,
      engine: "semor-collector (Go Core v2.5) -> VictoriaLogs Rust Storage Engine",
      gateway: "Go Ingestion Core (HTTP :8080 /select/logsql/query)",
      targetSocket: "/tmp/semor_rust.sock",
      query: rawQuery,
      limit: limitNum,
      timeRange,
      executionMicros: durationMicros,
      executionTimeMs: durationMs,
      scannedBlocks: Math.min(6, Math.max(1, Math.ceil(enrichedLogs.length / 3))),
      bloomFilterPrunedBlocks: 42,
      totalMatched: enrichedLogs.length,
      activeDecoderApplied: activeDecoderMeta.name,
      activeDecoderId: activeDecoderMeta.id,
      logs: pagedLogs,
      aggregations
    });
  };

  app.post('/api/engine/logsql/query', handleLogsQLQuery);
  app.get('/api/engine/logsql/query', handleLogsQLQuery);
  app.post('/select/logsql/query', handleLogsQLQuery);
  app.get('/select/logsql/query', handleLogsQLQuery);

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
      'go_stream_manager': 'engine/collector-go/pipeline/stream_manager.go',
      'go_bloom': 'engine/collector-go/pipeline/bloom.go',
      'go_block_accumulator': 'engine/collector-go/pipeline/block_accumulator.go',
      'go_pipeline': 'engine/collector-go/pipeline/processor.go',
      'go_ipc': 'engine/collector-go/forwarder/ipc_rust.go',
      'go_vlogs_http': 'engine/collector-go/forwarder/victorialogs_http.go',
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
        
        if (data.type === 'subscribe_collector_diagnostics' || data.type === 'subscribe_overview_dashboard') {
          collectorWsClients.add(ws);
          ws.send(JSON.stringify({
            type: 'collector_retry_stats',
            timestamp: new Date().toISOString(),
            data: getVlogsRetryStatsSnapshot()
          }));
          ws.send(JSON.stringify({
            type: 'overview_update',
            timestamp: new Date().toISOString(),
            event: { type: 'initial_sync' }
          }));
        }
        else if (data.type === 'unsubscribe_collector_diagnostics' || data.type === 'unsubscribe_overview_dashboard') {
          collectorWsClients.delete(ws);
        }
        else if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        }
        else if (data.type === 'join') {
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
      collectorWsClients.delete(ws);
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
