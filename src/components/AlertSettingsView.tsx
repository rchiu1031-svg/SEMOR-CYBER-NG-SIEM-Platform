import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bell, 
  Activity, 
  Database, 
  Server, 
  Cpu, 
  HardDrive, 
  Zap, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  Sliders, 
  Clock, 
  Mail, 
  Radio, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Copy, 
  RotateCcw, 
  Play, 
  Save, 
  Sparkles, 
  Send, 
  Check, 
  X, 
  Filter, 
  Layers, 
  ChevronRight, 
  Gauge, 
  ShieldAlert, 
  Workflow, 
  ExternalLink,
  Volume2,
  VolumeX,
  RefreshCw,
  Terminal,
  FileText,
  History,
  Download,
  ShieldCheck,
  User,
  Info,
  FileSpreadsheet,
  CheckCheck,
  Eye,
  Hash,
  Shield,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';

export interface AlertSettingsViewProps {
  isReadOnly?: boolean;
}

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

export interface ThresholdRule {
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

const METRIC_DEFINITIONS: Record<string, { label: string; unit: string; category: 'system_health' | 'log_volume'; defaultWarning: number; defaultCritical: number; defaultCondition: '>=' | '<='; min: number; max: number; step: number; desc: string }> = {
  cpu_usage: {
    label: 'CPU 使用率 (CPU Utilization)',
    unit: '%',
    category: 'system_health',
    defaultWarning: 75,
    defaultCritical: 88,
    defaultCondition: '>=',
    min: 10,
    max: 100,
    step: 1,
    desc: '主機核心與 Go/Rust 運算引擎之 CPU 負載百分比'
  },
  ram_usage: {
    label: 'RAM 記憶體佔用率 (Memory Consumption)',
    unit: '%',
    category: 'system_health',
    defaultWarning: 80,
    defaultCritical: 90,
    defaultCondition: '>=',
    min: 10,
    max: 100,
    step: 1,
    desc: '實體記憶體佔用比例，防止 OOM Killer 強制中斷核心服務'
  },
  disk_usage: {
    label: 'NVMe 磁碟容量佔用率 (Disk Capacity)',
    unit: '%',
    category: 'system_health',
    defaultWarning: 85,
    defaultCritical: 92,
    defaultCondition: '>=',
    min: 20,
    max: 100,
    step: 1,
    desc: 'VictoriaLogs 區塊實體落盤分割區使用量'
  },
  io_latency: {
    label: '磁碟落盤寫入延遲 (Block Write Latency)',
    unit: 'ms',
    category: 'system_health',
    defaultWarning: 350,
    defaultCritical: 600,
    defaultCondition: '>=',
    min: 10,
    max: 2000,
    step: 10,
    desc: 'Rust 儲存引擎將壓縮 VictoriaBlock 寫入磁碟之延遲'
  },
  queue_saturation: {
    label: 'Go 收集器佇列飽和度 (Ingest Queue)',
    unit: '%',
    category: 'system_health',
    defaultWarning: 70,
    defaultCritical: 88,
    defaultCondition: '>=',
    min: 5,
    max: 100,
    step: 1,
    desc: 'Go Channel 緩衝池佔用比，過高將引發背壓 (Backpressure)'
  },
  net_drop_rate: {
    label: '網卡封包遺失丟棄率 (Packet Drop Rate)',
    unit: 'pkts/s',
    category: 'system_health',
    defaultWarning: 150,
    defaultCritical: 500,
    defaultCondition: '>=',
    min: 0,
    max: 2000,
    step: 10,
    desc: 'Bypass / Mirror 介面因緩衝不足而丟棄的訊框速率'
  },
  log_ingest_eps: {
    label: '日誌每秒進線吞吐量 (Ingest EPS Surge)',
    unit: 'EPS',
    category: 'log_volume',
    defaultWarning: 12000,
    defaultCritical: 18000,
    defaultCondition: '>=',
    min: 1000,
    max: 50000,
    step: 500,
    desc: '整體進線日誌量每秒事件數暴增，可預警 DDoS 或掃描爆發'
  },
  log_silence_eps: {
    label: '收集進線最低吞吐 (Silence / Blackout Floor)',
    unit: 'EPS',
    category: 'log_volume',
    defaultWarning: 100,
    defaultCritical: 10,
    defaultCondition: '<=',
    min: 0,
    max: 1000,
    step: 10,
    desc: '關鍵日誌源接收量驟降或完全靜默，警示傳輸斷線或遭惡意拔除'
  },
  parser_drop_rate: {
    label: '解析失敗丟棄速率 (Parser Drop Rate)',
    unit: 'drops/s',
    category: 'log_volume',
    defaultWarning: 200,
    defaultCritical: 500,
    defaultCondition: '>=',
    min: 0,
    max: 2000,
    step: 25,
    desc: '正則表達式或解碼器無法解析之原始日誌丟棄量'
  },
  unwritten_buffer_count: {
    label: '記憶體待寫入事件總數 (Unwritten Buffer Pool)',
    unit: 'events',
    category: 'log_volume',
    defaultWarning: 35000,
    defaultCritical: 65000,
    defaultCondition: '>=',
    min: 5000,
    max: 150000,
    step: 5000,
    desc: '記憶體中待落盤的壓縮區塊日誌事件堆積數'
  },
  stream_flood_eps: {
    label: '單一威脅來源峰值吞吐 (Stream Peak Flooding)',
    unit: 'EPS',
    category: 'log_volume',
    defaultWarning: 6500,
    defaultCritical: 10000,
    defaultCondition: '>=',
    min: 500,
    max: 30000,
    step: 500,
    desc: '特定 NDR/防火牆單一 IP 或標籤產生海量流量'
  }
};

const INITIAL_RULES: ThresholdRule[] = [
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

const INITIAL_ALERT_HISTORY: AlertHistoryRecord[] = [
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

export default function AlertSettingsView({ isReadOnly = false }: AlertSettingsViewProps) {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language?.startsWith('zh') || i18n.language === 'zh';

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'rules' | 'live_bench' | 'volume_anomaly' | 'channels' | 'history' | 'simulator'>('rules');

  // Rules state
  const [rules, setRules] = useState<ThresholdRule[]>(INITIAL_RULES);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters & Search for Rules
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'system_health' | 'log_volume'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled' | 'critical' | 'warning'>('all');

  // Alert History Ledger State
  const [historyRecords, setHistoryRecords] = useState<AlertHistoryRecord[]>(INITIAL_ALERT_HISTORY);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historySeverityFilter, setHistorySeverityFilter] = useState<string>('all');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>('all');
  const [historyEngineFilter, setHistoryEngineFilter] = useState<string>('all');
  const [selectedHistoryRecord, setSelectedHistoryRecord] = useState<AlertHistoryRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [editResolutionStatus, setEditResolutionStatus] = useState<'Active' | 'Investigating' | 'Acknowledged' | 'Resolved' | 'Auto-Remediated'>('Resolved');
  const [editResolvedBy, setEditResolvedBy] = useState('');
  const [editResolutionNote, setEditResolutionNote] = useState('');

  // Editing / Creating Rule Modal State
  const [editingRule, setEditingRule] = useState<ThresholdRule | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Simulator Test State
  const [selectedSimRuleId, setSelectedSimRuleId] = useState<string>('rule-log-ingest-surge');
  const [simulatedValue, setSimulatedValue] = useState<number>(19500);
  const [simSeverity, setSimSeverity] = useState<'Critical' | 'Warning'>('Critical');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationLogs, setSimulationLogs] = useState<string[]>([
    `[${new Date().toISOString()}] [SYSTEM_READY] Threshold evaluation engine armed and monitoring 10 pipeline targets.`,
    `[${new Date().toISOString()}] [TELEMETRY_STREAM] Heartbeat sync OK: Go Collector (9,420 EPS), VictoriaLogs Block Flush Latency (142ms).`
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch alert history from API
  const loadHistoryFromApi = async () => {
    try {
      setIsLoadingHistory(true);
      const res = await fetch('/api/alerts/history');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.records) && data.records.length > 0) {
          setHistoryRecords(data.records);
        }
      }
    } catch (e) {
      console.warn('History API fetch error, using local ledger:', e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Fetch rules from API
  const loadRulesFromApi = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/alerts/threshold-rules');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setRules(data);
        }
      }
    } catch (e) {
      console.warn('API unavailable, keeping local rules state:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRulesFromApi();
    loadHistoryFromApi();
    const interval = setInterval(() => {
      // Periodic subtle fluctuation of current values to give real-time feel
      setRules(prev => prev.map(r => {
        let delta = 0;
        if (r.metric.includes('eps')) delta = Math.floor((Math.random() - 0.5) * 300);
        else if (r.metric.includes('usage')) delta = Number(((Math.random() - 0.5) * 2).toFixed(1));
        else if (r.metric.includes('latency')) delta = Math.floor((Math.random() - 0.5) * 15);
        const nextVal = Math.max(0, r.currentValue + delta);

        let status: 'healthy' | 'warning' | 'critical' | 'disabled' = 'healthy';
        if (!r.enabled) status = 'disabled';
        else if (r.condition === '<=' || r.condition === '<') {
          if (nextVal <= r.criticalThreshold) status = 'critical';
          else if (nextVal <= r.warningThreshold) status = 'warning';
        } else {
          if (nextVal >= r.criticalThreshold) status = 'critical';
          else if (nextVal >= r.warningThreshold) status = 'warning';
        }

        return { ...r, currentValue: nextVal, status };
      }));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Save rules to API
  const handleSaveRules = async (rulesToSave = rules) => {
    if (isReadOnly) return;
    try {
      setIsSaving(true);
      const res = await fetch('/api/alerts/threshold-rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rulesToSave)
      });
      if (res.ok) {
        showToast(isZh ? '已成功儲存並同步所有閥值規則！' : 'All threshold rules saved & synchronized!');
      } else {
        showToast(isZh ? '規則已暫存於本機記憶體' : 'Rules saved to local runtime state');
      }
    } catch (e) {
      showToast(isZh ? '已套用變更至本機監控核心' : 'Applied changes to local monitor core');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to default presets
  const handleResetDefaults = async () => {
    if (isReadOnly) return;
    if (!window.confirm(isZh ? '確定要重置為系統預設之健康與日誌量閥值規則？' : 'Reset all threshold rules to default presets?')) return;
    try {
      setIsSaving(true);
      const res = await fetch('/api/alerts/threshold-rules/reset-defaults', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setRules(data.rules || INITIAL_RULES);
        showToast(isZh ? '已還原預設最佳實踐閥值規則' : 'Restored default best-practice threshold rules');
      } else {
        setRules(INITIAL_RULES);
        showToast(isZh ? '已重置為預設規則' : 'Reset to default rules');
      }
    } catch (e) {
      setRules(INITIAL_RULES);
      showToast(isZh ? '已重置為預設規則' : 'Reset to default rules');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Rule Status
  const handleToggleRule = (ruleId: string) => {
    if (isReadOnly) return;
    const updated = rules.map(r => {
      if (r.id === ruleId) {
        const nextEnabled = !r.enabled;
        return {
          ...r,
          enabled: nextEnabled,
          status: nextEnabled ? ('healthy' as const) : ('disabled' as const)
        };
      }
      return r;
    });
    setRules(updated);
    handleSaveRules(updated);
  };

  // Delete Rule
  const handleDeleteRule = (ruleId: string) => {
    if (isReadOnly) return;
    if (!window.confirm(isZh ? '確定要刪除此告警閥值規則？' : 'Delete this threshold rule?')) return;
    const updated = rules.filter(r => r.id !== ruleId);
    setRules(updated);
    handleSaveRules(updated);
    showToast(isZh ? '規則已刪除' : 'Rule deleted');
  };

  // Clone Rule
  const handleCloneRule = (rule: ThresholdRule) => {
    if (isReadOnly) return;
    const cloned: ThresholdRule = {
      ...rule,
      id: `rule-custom-${Date.now()}`,
      name: `${rule.name} (複製副本)`,
      triggerCount: 0,
      lastTriggeredAt: null
    };
    const updated = [cloned, ...rules];
    setRules(updated);
    handleSaveRules(updated);
    showToast(isZh ? `已複製規則副本: ${cloned.name}` : `Cloned rule: ${cloned.name}`);
  };

  // Open Modal for New Rule
  const handleOpenNewRuleModal = (presetMetric?: string) => {
    if (isReadOnly) return;
    const baseMetricKey = presetMetric || 'cpu_usage';
    const def = METRIC_DEFINITIONS[baseMetricKey];
    const newRule: ThresholdRule = {
      id: `rule-custom-${Date.now()}`,
      name: isZh ? `自訂 ${def.label} 閥值判定` : `Custom ${def.label} Alert`,
      category: def.category,
      metric: baseMetricKey,
      metricLabel: def.label,
      metricUnit: def.unit,
      targetScope: isZh ? '全域核心架構節點 (All Nodes)' : 'All Core Nodes',
      condition: def.defaultCondition,
      warningThreshold: def.defaultWarning,
      criticalThreshold: def.defaultCritical,
      sustainDurationSec: 60,
      cooldownMin: 15,
      severity: 'High',
      enabled: true,
      notificationChannels: {
        email: true,
        emailRecipients: ['soc-team@semor-security.com'],
        webhook: true,
        webhookUrl: 'https://hooks.slack.com/services/...',
        webhookChannel: '#soc-alerts',
        syslog: true,
        syslogHost: '127.0.0.1',
        syslogPort: 514,
        inApp: true,
        soarPlaybook: false
      },
      description: isZh ? `監控 ${def.label} 超出設定閥值時即時告警` : `Alert when ${def.label} exceeds threshold`,
      remediationHint: isZh ? '登入儀表檢視各節點詳細資源開銷' : 'Inspect node resource consumption',
      currentValue: def.category === 'system_health' ? 45 : 4500,
      lastTriggeredAt: null,
      triggerCount: 0,
      status: 'healthy'
    };
    setEditingRule(newRule);
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (rule: ThresholdRule) => {
    if (isReadOnly) return;
    setEditingRule(JSON.parse(JSON.stringify(rule)));
    setIsModalOpen(true);
  };

  // Save Modal Rule
  const handleSaveModalRule = () => {
    if (!editingRule) return;
    const exists = rules.some(r => r.id === editingRule.id);
    let updated: ThresholdRule[];
    if (exists) {
      updated = rules.map(r => (r.id === editingRule.id ? editingRule : r));
    } else {
      updated = [editingRule, ...rules];
    }
    setRules(updated);
    handleSaveRules(updated);
    setIsModalOpen(false);
    setEditingRule(null);
    showToast(isZh ? '閥值規則已更新並生效' : 'Threshold rule updated and applied');
  };

  // Run Simulated Test
  const handleRunSimulation = async () => {
    const targetRule = rules.find(r => r.id === selectedSimRuleId) || rules[0];
    if (!targetRule) return;

    setIsSimulating(true);
    try {
      const res = await fetch('/api/alerts/threshold-rules/test-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ruleId: targetRule.id,
          simulatedValue,
          triggerSeverity: simSeverity
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSimulationLogs(prev => [...(data.logs || []), ...prev.slice(0, 15)]);
        if (data.historyRecord) {
          setHistoryRecords(prev => [data.historyRecord, ...prev]);
        }
        showToast(isZh ? `已成功模擬觸發: ${targetRule.name}` : `Dispatched test trigger for: ${targetRule.name}`);
      } else {
        // Fallback local simulated logs
        const ts = new Date().toISOString();
        const fallbackLogs = [
          `[${ts}] [SIM_TRIGGER] Simulating alert breach on rule '${targetRule.name}'`,
          `[${ts}] [CONDITION] Measured ${simulatedValue} ${targetRule.metricUnit} ${targetRule.condition} Threshold ${targetRule.criticalThreshold} ${targetRule.metricUnit}`,
          `[${ts}] [CHANNELS] Dispatched to Email, Slack Webhook, Syslog (RFC 5424), and In-App SOC Banner.`,
          `[${ts}] [COOLDOWN] Cooldown timer running (15m suppression active).`
        ];
        setSimulationLogs(prev => [...fallbackLogs, ...prev.slice(0, 15)]);

        // Record into local ledger
        const fallbackRecord: AlertHistoryRecord = {
          id: `ALR-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(1000 + Math.random() * 9000)}`,
          triggerTime: ts,
          ruleId: targetRule.id,
          ruleName: targetRule.name,
          category: targetRule.category,
          metric: targetRule.metric,
          metricLabel: targetRule.metricLabel,
          measuredValue: simulatedValue,
          metricUnit: targetRule.metricUnit,
          thresholdValue: targetRule.criticalThreshold,
          condition: targetRule.condition,
          severity: simSeverity,
          sourceEngine: targetRule.category === 'system_health' ? 'vlog-engine (Storage & Runtime)' : 'semor-collector (Ingest & Pipeline)',
          resolutionStatus: 'Active',
          resolvedAt: null,
          resolvedBy: null,
          resolutionNote: '模擬觸發測試：已完成多管道通報派送並登記至審計帳本。',
          dispatchedChannels: ['email', 'webhook', 'syslog', 'inApp'],
          auditHash: `sha256:${Buffer.from(`${ts}-${targetRule.id}-${simulatedValue}`).toString('hex').slice(0, 64).padEnd(64, 'a')}`
        };
        setHistoryRecords(prev => [fallbackRecord, ...prev]);
        showToast(isZh ? '模擬推播測試完成並登記至歷史帳本' : 'Simulation test completed & logged to ledger');
      }
    } catch (e) {
      const ts = new Date().toISOString();
      setSimulationLogs(prev => [
        `[${ts}] [SIM_DISPATCH] Broadcasted mock breach for ${targetRule.name}: ${simulatedValue} ${targetRule.metricUnit}`,
        ...prev
      ]);
      showToast(isZh ? '模擬推播完成' : 'Simulation completed');
    } finally {
      setIsSimulating(false);
    }
  };

  // Open Detail / Resolution Modal
  const handleOpenHistoryDetail = (record: AlertHistoryRecord) => {
    setSelectedHistoryRecord(record);
    setEditResolutionStatus(record.resolutionStatus);
    setEditResolvedBy(record.resolvedBy || 'analyst-1');
    setEditResolutionNote(record.resolutionNote || '');
    setIsDetailModalOpen(true);
  };

  // Save Resolution Update
  const handleSaveResolution = async () => {
    if (!selectedHistoryRecord) return;
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/alerts/history/${selectedHistoryRecord.id}/resolution`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolutionStatus: editResolutionStatus,
          resolvedBy: editResolvedBy,
          resolutionNote: editResolutionNote
        })
      });

      const updatedRecord: AlertHistoryRecord = {
        ...selectedHistoryRecord,
        resolutionStatus: editResolutionStatus,
        resolvedBy: editResolvedBy,
        resolutionNote: editResolutionNote,
        resolvedAt: editResolutionStatus === 'Resolved' || editResolutionStatus === 'Auto-Remediated' 
          ? (selectedHistoryRecord.resolvedAt || new Date().toISOString()) 
          : null
      };

      setHistoryRecords(prev => prev.map(r => r.id === selectedHistoryRecord.id ? updatedRecord : r));
      setSelectedHistoryRecord(updatedRecord);
      setIsDetailModalOpen(false);
      showToast(isZh ? `已更新告警 ${selectedHistoryRecord.id} 處置狀態為「${editResolutionStatus}」` : `Updated alert ${selectedHistoryRecord.id} to ${editResolutionStatus}`);
    } catch (e) {
      // Local update
      const updatedRecord: AlertHistoryRecord = {
        ...selectedHistoryRecord,
        resolutionStatus: editResolutionStatus,
        resolvedBy: editResolvedBy,
        resolutionNote: editResolutionNote,
        resolvedAt: editResolutionStatus === 'Resolved' || editResolutionStatus === 'Auto-Remediated' 
          ? (selectedHistoryRecord.resolvedAt || new Date().toISOString()) 
          : null
      };
      setHistoryRecords(prev => prev.map(r => r.id === selectedHistoryRecord.id ? updatedRecord : r));
      setIsDetailModalOpen(false);
      showToast(isZh ? '處置狀態已儲存至本機帳本' : 'Status saved to local ledger');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Quick Status Toggle on Row
  const handleQuickStatusUpdate = async (record: AlertHistoryRecord, newStatus: AlertHistoryRecord['resolutionStatus']) => {
    try {
      await fetch(`/api/alerts/history/${record.id}/resolution`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolutionStatus: newStatus,
          resolvedBy: 'soc-admin',
          resolutionNote: record.resolutionNote || `Status quickly updated to ${newStatus}`
        })
      });
    } catch (e) {
      console.warn('Network update failed, updating local state:', e);
    }

    const updated: AlertHistoryRecord = {
      ...record,
      resolutionStatus: newStatus,
      resolvedBy: record.resolvedBy || 'soc-admin',
      resolvedAt: (newStatus === 'Resolved' || newStatus === 'Auto-Remediated') ? (record.resolvedAt || new Date().toISOString()) : null
    };
    setHistoryRecords(prev => prev.map(r => r.id === record.id ? updated : r));
    showToast(isZh ? `告警 ${record.id} 狀態已變更為: ${newStatus}` : `Alert ${record.id} status changed to: ${newStatus}`);
  };

  // Reset History Defaults
  const handleResetHistoryDefaults = async () => {
    if (!window.confirm(isZh ? '確定要重置歷史告警審計帳本為範本紀錄？' : 'Reset alert history ledger to default audit samples?')) return;
    try {
      const res = await fetch('/api/alerts/history/reset-defaults', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.records) setHistoryRecords(data.records);
      } else {
        setHistoryRecords(INITIAL_ALERT_HISTORY);
      }
      showToast(isZh ? '歷史告警紀錄已恢復為初始審計範本' : 'Alert history reset to initial ledger samples');
    } catch (e) {
      setHistoryRecords(INITIAL_ALERT_HISTORY);
      showToast(isZh ? '歷史告警紀錄已恢復初始狀態' : 'Alert history reset locally');
    }
  };

  // Export History as CSV
  const handleExportHistoryCSV = () => {
    const headers = ['Record ID', 'Trigger Time (UTC)', 'Severity', 'Source Engine', 'Category', 'Rule Name', 'Metric', 'Measured Value', 'Condition', 'Threshold', 'Resolution Status', 'Resolved By', 'Resolved At', 'Resolution Notes', 'Audit Hash'];
    const rows = filteredHistory.map(r => [
      `"${r.id}"`,
      `"${r.triggerTime}"`,
      `"${r.severity}"`,
      `"${r.sourceEngine}"`,
      `"${r.category}"`,
      `"${r.ruleName.replace(/"/g, '""')}"`,
      `"${r.metricLabel}"`,
      `"${r.measuredValue} ${r.metricUnit}"`,
      `"${r.condition}"`,
      `"${r.thresholdValue} ${r.metricUnit}"`,
      `"${r.resolutionStatus}"`,
      `"${r.resolvedBy || ''}"`,
      `"${r.resolvedAt || ''}"`,
      `"${(r.resolutionNote || '').replace(/"/g, '""')}"`,
      `"${r.auditHash}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SEMOR_Alert_History_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(isZh ? '已匯出 CSV 歷史告警審計報表' : 'Exported CSV Alert History Audit Report');
  };

  // Export History as JSON
  const handleExportHistoryJSON = () => {
    const jsonStr = JSON.stringify(filteredHistory, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SEMOR_Alert_History_Ledger_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(isZh ? '已匯出 JSON 不可篡改審計帳本' : 'Exported JSON Immutable Ledger');
  };

  // Filtered Alert History
  const filteredHistory = useMemo(() => {
    return historyRecords.filter(record => {
      // Severity filter
      if (historySeverityFilter !== 'all' && record.severity !== historySeverityFilter) return false;
      // Status filter
      if (historyStatusFilter !== 'all' && record.resolutionStatus !== historyStatusFilter) return false;
      // Source Engine filter
      if (historyEngineFilter !== 'all' && !record.sourceEngine.toLowerCase().includes(historyEngineFilter.toLowerCase())) return false;
      // Search query
      if (historySearchQuery.trim()) {
        const q = historySearchQuery.toLowerCase();
        const matchId = record.id.toLowerCase().includes(q);
        const matchName = record.ruleName.toLowerCase().includes(q);
        const matchEngine = record.sourceEngine.toLowerCase().includes(q);
        const matchMetric = record.metricLabel.toLowerCase().includes(q) || record.metric.toLowerCase().includes(q);
        const matchNote = (record.resolutionNote || '').toLowerCase().includes(q);
        const matchResolvedBy = (record.resolvedBy || '').toLowerCase().includes(q);
        if (!matchId && !matchName && !matchEngine && !matchMetric && !matchNote && !matchResolvedBy) return false;
      }
      return true;
    });
  }, [historyRecords, historySeverityFilter, historyStatusFilter, historyEngineFilter, historySearchQuery]);

  // Unique source engines list
  const uniqueEngines = useMemo(() => {
    const set = new Set<string>();
    historyRecords.forEach(r => {
      const prefix = r.sourceEngine.split(' ')[0] || r.sourceEngine;
      set.add(prefix);
    });
    return Array.from(set);
  }, [historyRecords]);

  // Filtered Rules
  const filteredRules = useMemo(() => {
    return rules.filter(rule => {
      // Category filter
      if (categoryFilter !== 'all' && rule.category !== categoryFilter) return false;
      // Status filter
      if (statusFilter === 'enabled' && !rule.enabled) return false;
      if (statusFilter === 'disabled' && rule.enabled) return false;
      if (statusFilter === 'critical' && rule.status !== 'critical') return false;
      if (statusFilter === 'warning' && rule.status !== 'warning') return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = rule.name.toLowerCase().includes(q);
        const matchMetric = rule.metricLabel.toLowerCase().includes(q) || rule.metric.toLowerCase().includes(q);
        const matchScope = rule.targetScope.toLowerCase().includes(q);
        if (!matchName && !matchMetric && !matchScope) return false;
      }
      return true;
    });
  }, [rules, categoryFilter, statusFilter, searchQuery]);

  // Summary Counters
  const totalCount = rules.length;
  const sysHealthCount = rules.filter(r => r.category === 'system_health').length;
  const logVolCount = rules.filter(r => r.category === 'log_volume').length;
  const activeCount = rules.filter(r => r.enabled).length;
  const firingCount = rules.filter(r => r.status === 'critical' || r.status === 'warning').length;

  // 24-Hour Alert Frequency Sparkline State & Derivations
  const [hoveredSparklineIndex, setHoveredSparklineIndex] = useState<number | null>(null);

  interface HourlySparklineBucket {
    index: number;
    startTime: Date;
    endTime: Date;
    hourStr: string;
    utcHourStr: string;
    relativeLabel: string;
    count: number;
    criticalCount: number;
    highCount: number;
    warningCount: number;
    infoCount: number;
    records: AlertHistoryRecord[];
  }

  const last24HoursData = useMemo(() => {
    const now = new Date();
    // Align to the end of the current hour so the ongoing hour is cleanly covered
    const currentHourEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0, 0);

    const buckets: HourlySparklineBucket[] = [];

    for (let i = 23; i >= 0; i--) {
      const bucketEnd = new Date(currentHourEnd.getTime() - i * 3600 * 1000);
      const bucketStart = new Date(bucketEnd.getTime() - 3600 * 1000);
      const startTimeMs = bucketStart.getTime();
      const endTimeMs = bucketEnd.getTime();

      const matchingRecords = historyRecords.filter(r => {
        const t = new Date(r.triggerTime).getTime();
        return t >= startTimeMs && t < endTimeMs;
      });

      const criticalCount = matchingRecords.filter(r => r.severity === 'Critical').length;
      const highCount = matchingRecords.filter(r => r.severity === 'High').length;
      const warningCount = matchingRecords.filter(r => r.severity === 'Warning').length;
      const infoCount = matchingRecords.filter(r => r.severity === 'Info').length;

      const hourNum = bucketStart.getHours();
      const hourStr = `${String(hourNum).padStart(2, '0')}:00`;
      const utcHourStr = `${String(bucketStart.getUTCHours()).padStart(2, '0')}:00 UTC`;
      const relativeLabel = i === 0 
        ? (isZh ? '現在' : 'Now') 
        : `-${i}h`;

      buckets.push({
        index: 23 - i,
        startTime: bucketStart,
        endTime: bucketEnd,
        hourStr,
        utcHourStr,
        relativeLabel,
        count: matchingRecords.length,
        criticalCount,
        highCount,
        warningCount,
        infoCount,
        records: matchingRecords
      });
    }

    const total24hTriggers = buckets.reduce((sum, b) => sum + b.count, 0);
    const totalCritical = buckets.reduce((sum, b) => sum + b.criticalCount, 0);
    const totalHigh = buckets.reduce((sum, b) => sum + b.highCount, 0);
    const totalWarning = buckets.reduce((sum, b) => sum + b.warningCount, 0);
    const maxCount = Math.max(...buckets.map(b => b.count), 0);
    const peakBucket = buckets.reduce((max, b) => b.count > max.count ? b : max, buckets[0]);

    return {
      buckets,
      total24hTriggers,
      totalCritical,
      totalHigh,
      totalWarning,
      maxCount,
      peakBucket
    };
  }, [historyRecords, isZh]);

  // Sparkline Coordinates & Geometry Calculations
  const svgWidth = 800;
  const svgHeight = 76;
  const paddingX = 24;
  const paddingTop = 12;
  const paddingBottom = 16;
  const plotWidth = svgWidth - paddingX * 2;
  const plotHeight = svgHeight - paddingTop - paddingBottom;
  const maxScale = Math.max(last24HoursData.maxCount, 3);

  const sparklinePoints = useMemo(() => {
    return last24HoursData.buckets.map((b, idx) => {
      const x = paddingX + (idx / 23) * plotWidth;
      const y = paddingTop + plotHeight - (b.count / maxScale) * plotHeight;
      return { x, y, bucket: b, idx };
    });
  }, [last24HoursData, plotWidth, plotHeight, maxScale]);

  const sparklineLinePath = useMemo(() => {
    if (sparklinePoints.length === 0) return '';
    let path = `M ${sparklinePoints[0].x},${sparklinePoints[0].y}`;
    for (let i = 1; i < sparklinePoints.length; i++) {
      const prev = sparklinePoints[i - 1];
      const curr = sparklinePoints[i];
      const cp1x = prev.x + (curr.x - prev.x) / 2;
      const cp1y = prev.y;
      const cp2x = prev.x + (curr.x - prev.x) / 2;
      const cp2y = curr.y;
      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${curr.x},${curr.y}`;
    }
    return path;
  }, [sparklinePoints]);

  const sparklineAreaPath = useMemo(() => {
    if (!sparklineLinePath || sparklinePoints.length === 0) return '';
    const lastPt = sparklinePoints[sparklinePoints.length - 1];
    const firstPt = sparklinePoints[0];
    const baselineY = paddingTop + plotHeight;
    return `${sparklineLinePath} L ${lastPt.x},${baselineY} L ${firstPt.x},${baselineY} Z`;
  }, [sparklineLinePath, sparklinePoints, plotHeight]);

  return (
    <div className="space-y-6 text-gray-200">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-8 right-8 z-50 bg-gradient-to-r from-red-600 to-rose-700 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-red-400/30 text-xs font-bold font-mono tracking-wide"
          >
            <CheckCircle2 size={16} className="text-white shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER SECTION */}
      <div className="bg-[#101014] border border-gray-800 rounded-2xl p-6 lg:p-8 relative overflow-hidden shadow-xl">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-48 -bottom-20 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-red-950/80 border border-red-800 text-red-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                {isZh ? '即時閥值監控引擎' : 'Live Threshold Guard'}
              </span>
              <span className="text-xs text-gray-500 font-mono">v4.8 Core Active</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              <Sliders className="text-red-500" size={24} />
              {isZh ? '系統健康與日誌吞吐量閥值告警管理' : 'Threshold-Based Alerts: Health & Log Volumes'}
            </h1>
            <p className="text-xs text-gray-400 mt-1.5 max-w-3xl leading-relaxed">
              {isZh 
                ? '設定主機硬體指標（CPU、RAM、NVMe 磁碟容量、I/O 寫入延遲）與資料管線日誌吞吐量（每秒事件數 EPS 暴增、斷流靜默黑洞、正則解碼失敗率）之雙階警戒閥值，支援即時多管道派送與 SOAR 自動化處置。'
                : 'Configure dual warning/critical thresholds for host health metrics (CPU, RAM, Disk, IO Latency) and log event volumes (EPS spikes, ingest silence, parser drops) with multi-channel dispatch.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {!isReadOnly && (
              <>
                <button
                  onClick={() => handleOpenNewRuleModal()}
                  className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-red-950/40 flex items-center gap-2"
                >
                  <Plus size={14} />
                  {isZh ? '新增自訂閥值規則' : 'New Threshold Rule'}
                </button>
                <button
                  onClick={handleResetDefaults}
                  disabled={isSaving}
                  className="px-3.5 py-2.5 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  title={isZh ? '恢復推薦的最佳實踐閥值配置' : 'Restore Recommended Presets'}
                >
                  <RotateCcw size={13} className={isSaving ? 'animate-spin' : ''} />
                  {isZh ? '重置為推薦範本' : 'Reset Presets'}
                </button>
                <button
                  onClick={() => handleSaveRules()}
                  disabled={isSaving}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                >
                  <Save size={13} />
                  {isZh ? '立即儲存變更' : 'Save & Sync'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* 24-HOUR ALERT TRIGGER FREQUENCY SPARKLINE */}
        <div className="mt-6 pt-5 border-t border-gray-800/80 relative z-10">
          <div className="bg-[#121219]/90 border border-gray-800/90 hover:border-gray-700/80 transition-all rounded-xl p-4 sm:p-5 shadow-lg relative">
            {/* Sparkline Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-rose-950/60 border border-rose-800/60 text-rose-400 shrink-0">
                  <Activity size={16} className={last24HoursData.total24hTriggers > 0 ? "animate-pulse" : ""} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                      {isZh ? '過去 24 小時告警觸發頻率分佈' : '24-Hour Alert Trigger Frequency & Velocity'}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-extrabold uppercase bg-rose-950/80 text-rose-300 border border-rose-800/60 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                      24H SPARKLINE
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {isZh 
                      ? '視覺化呈現主機硬體指標（CPU/RAM/磁碟）與管線日誌吞吐量（EPS暴增/斷流）每小時違規告警密度' 
                      : 'Hourly breach velocity across host health metrics (CPU/RAM/Disk) and log volume pipelines'}
                  </p>
                </div>
              </div>

              {/* Metrics summary pills & jump button */}
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                <div className="px-2.5 py-1 rounded-lg bg-[#181822] border border-gray-800 font-mono text-[11px] flex items-center gap-1.5 text-gray-300">
                  <span className="text-gray-400 text-[10px] uppercase font-bold">{isZh ? '24h 累計:' : '24h Total:'}</span>
                  <span className="font-extrabold text-white text-xs">{last24HoursData.total24hTriggers}</span>
                  <span className="text-[10px] text-gray-400">{isZh ? '件' : 'events'}</span>
                </div>

                {last24HoursData.totalCritical > 0 && (
                  <div className="px-2 py-1 rounded-lg bg-red-950/60 border border-red-800/60 font-mono text-[10px] font-bold text-red-300 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                    <span>{last24HoursData.totalCritical} Critical</span>
                  </div>
                )}

                {last24HoursData.peakBucket.count > 0 && (
                  <div className="px-2.5 py-1 rounded-lg bg-[#181822] border border-gray-800 font-mono text-[11px] text-gray-300 hidden md:flex items-center gap-1.5">
                    <span className="text-gray-400 text-[10px] uppercase font-bold">{isZh ? '最高尖峰:' : 'Peak:'}</span>
                    <span className="text-amber-400 font-extrabold">{last24HoursData.peakBucket.count} /h</span>
                    <span className="text-gray-400 text-[10px]">({last24HoursData.peakBucket.hourStr})</span>
                  </div>
                )}

                <button
                  onClick={() => {
                    setActiveTab('history');
                    showToast(isZh ? '已導覽至歷史告警審計帳本' : 'Navigated to Alert History Ledger');
                  }}
                  className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ml-auto sm:ml-0"
                  title={isZh ? "前往歷史告警帳本檢視完整明細" : "View full history ledger"}
                >
                  <History size={12} className="text-rose-400" />
                  <span className="text-[11px]">{isZh ? '檢視帳本' : 'View Ledger'}</span>
                  <ChevronRight size={11} />
                </button>
              </div>
            </div>

            {/* Sparkline Canvas Container */}
            <div className="relative pt-1">
              {/* Floating Interactive Tooltip */}
              {hoveredSparklineIndex !== null && (
                <div
                  className="absolute z-30 pointer-events-none transition-all duration-75"
                  style={{
                    left: `${(sparklinePoints[hoveredSparklineIndex].x / svgWidth) * 100}%`,
                    top: '-6px',
                    transform: hoveredSparklineIndex < 4 
                      ? 'translate(0%, -100%)' 
                      : hoveredSparklineIndex > 19 
                      ? 'translate(-100%, -100%)' 
                      : 'translate(-50%, -100%)'
                  }}
                >
                  <div className="bg-[#181824] border border-gray-700/90 rounded-xl p-3 shadow-2xl backdrop-blur-md min-w-[220px] max-w-[310px]">
                    <div className="flex items-center justify-between gap-2 border-b border-gray-800 pb-1.5 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Clock size={11} className="text-gray-400" />
                        <span className="font-mono text-xs font-bold text-white">
                          {sparklinePoints[hoveredSparklineIndex].bucket.hourStr}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          ({sparklinePoints[hoveredSparklineIndex].bucket.relativeLabel})
                        </span>
                      </div>
                      <span className={cn(
                        "px-1.5 py-0.2 rounded text-[10px] font-mono font-extrabold",
                        sparklinePoints[hoveredSparklineIndex].bucket.count > 0 
                          ? "bg-rose-950 text-rose-300 border border-rose-800" 
                          : "bg-gray-800 text-gray-400"
                      )}>
                        {sparklinePoints[hoveredSparklineIndex].bucket.count} {isZh ? '告警' : 'alerts'}
                      </span>
                    </div>

                    {sparklinePoints[hoveredSparklineIndex].bucket.count > 0 ? (
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-1 text-[10px]">
                          {sparklinePoints[hoveredSparklineIndex].bucket.criticalCount > 0 && (
                            <span className="px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-800/80 font-bold">
                              {sparklinePoints[hoveredSparklineIndex].bucket.criticalCount} Critical
                            </span>
                          )}
                          {sparklinePoints[hoveredSparklineIndex].bucket.highCount > 0 && (
                            <span className="px-1.5 py-0.2 rounded bg-orange-950 text-orange-300 border border-orange-800/80 font-bold">
                              {sparklinePoints[hoveredSparklineIndex].bucket.highCount} High
                            </span>
                          )}
                          {sparklinePoints[hoveredSparklineIndex].bucket.warningCount > 0 && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800/80 font-bold">
                              {sparklinePoints[hoveredSparklineIndex].bucket.warningCount} Warning
                            </span>
                          )}
                        </div>

                        <div className="space-y-1 mt-1">
                          {sparklinePoints[hoveredSparklineIndex].bucket.records.slice(0, 2).map(r => (
                            <div key={r.id} className="text-[11px] text-gray-300 truncate font-sans">
                              <span className="text-gray-400 font-mono text-[10px] mr-1">[{r.id.split('-').pop()}]</span>
                              <span>{r.ruleName}</span>
                            </div>
                          ))}
                          {sparklinePoints[hoveredSparklineIndex].bucket.records.length > 2 && (
                            <div className="text-[10px] text-gray-500 italic">
                              +{sparklinePoints[hoveredSparklineIndex].bucket.records.length - 2} {isZh ? '則更多告警' : 'more alerts'}
                            </div>
                          )}
                        </div>
                        <div className="text-[9px] text-rose-400 font-mono pt-1 border-t border-gray-800/60 flex items-center gap-1">
                          <span>{isZh ? '點擊快速過濾審計帳本' : 'Click to inspect in Ledger'}</span>
                          <ChevronRight size={10} />
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-gray-500 py-0.5 flex items-center gap-1">
                        <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                        <span>{isZh ? '此時段無閥值違規告警 (指標平穩)' : 'Zero breaches during this window'}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Responsive SVG Sparkline */}
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-16 sm:h-20 overflow-visible select-none"
              >
                <defs>
                  {/* Area Fill Gradient */}
                  <linearGradient id="headerSparklineArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.45" />
                    <stop offset="60%" stopColor="#f43f5e" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                  </linearGradient>

                  {/* Line Stroke Gradient */}
                  <linearGradient id="headerSparklineStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#fb7185" />
                    <stop offset="60%" stopColor="#f43f5e" />
                    <stop offset="100%" stopColor="#e11d48" />
                  </linearGradient>

                  {/* Glow Filter */}
                  <filter id="headerSparklineGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Background Horizontal Guidelines */}
                <line
                  x1={paddingX}
                  y1={paddingTop + plotHeight}
                  x2={paddingX + plotWidth}
                  y2={paddingTop + plotHeight}
                  stroke="#262633"
                  strokeWidth="1"
                />
                <line
                  x1={paddingX}
                  y1={paddingTop + plotHeight / 2}
                  x2={paddingX + plotWidth}
                  y2={paddingTop + plotHeight / 2}
                  stroke="#1f1f2a"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <line
                  x1={paddingX}
                  y1={paddingTop}
                  x2={paddingX + plotWidth}
                  y2={paddingTop}
                  stroke="#1a1a24"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />

                {/* Area Gradient Fill */}
                <path
                  d={sparklineAreaPath}
                  fill="url(#headerSparklineArea)"
                />

                {/* Spline Stroke Curve */}
                <path
                  d={sparklineLinePath}
                  fill="none"
                  stroke="url(#headerSparklineStroke)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#headerSparklineGlow)"
                />

                {/* Hover Vertical Cursor Guideline */}
                {hoveredSparklineIndex !== null && (
                  <line
                    x1={sparklinePoints[hoveredSparklineIndex].x}
                    y1={paddingTop - 4}
                    x2={sparklinePoints[hoveredSparklineIndex].x}
                    y2={paddingTop + plotHeight}
                    stroke="#f43f5e"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                    className="animate-pulse"
                  />
                )}

                {/* Data Points on Nodes */}
                {sparklinePoints.map((p, idx) => {
                  const hasAlerts = p.bucket.count > 0;
                  const isHovered = hoveredSparklineIndex === idx;

                  let pointStroke = '#eab308';
                  let pointFill = '#eab308';
                  if (p.bucket.criticalCount > 0) {
                    pointStroke = '#ef4444';
                    pointFill = '#ef4444';
                  } else if (p.bucket.highCount > 0) {
                    pointStroke = '#f97316';
                    pointFill = '#f97316';
                  } else if (p.bucket.warningCount > 0) {
                    pointStroke = '#eab308';
                    pointFill = '#eab308';
                  }

                  if (!hasAlerts && !isHovered) {
                    return (
                      <circle
                        key={idx}
                        cx={p.x}
                        cy={p.y}
                        r={1.5}
                        fill="#404052"
                        className="transition-all"
                      />
                    );
                  }

                  return (
                    <g key={idx} className="transition-all">
                      {/* Pulsing outer halo for Critical points */}
                      {p.bucket.criticalCount > 0 && (
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r={isHovered ? 10 : 7}
                          fill="#ef4444"
                          fillOpacity={0.2}
                          className="animate-ping origin-center"
                        />
                      )}

                      {/* Outer Ring */}
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={isHovered ? 6 : (hasAlerts ? 4.5 : 3)}
                        fill="#121218"
                        stroke={isHovered ? '#ffffff' : pointStroke}
                        strokeWidth={isHovered ? 2.5 : 2}
                      />

                      {/* Inner Solid Core */}
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={isHovered ? 3 : (hasAlerts ? 2.2 : 1.5)}
                        fill={isHovered ? '#ffffff' : pointFill}
                      />

                      {/* Count number label above highest points if > 1 */}
                      {p.bucket.count > 1 && !isHovered && (
                        <text
                          x={p.x}
                          y={p.y - 7}
                          textAnchor="middle"
                          fontSize="9"
                          fontWeight="bold"
                          fill="#fca5a5"
                          fontFamily="monospace"
                        >
                          {p.bucket.count}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Invisible interactive columns for smooth hover & click detection */}
                {sparklinePoints.map((p, idx) => {
                  const colWidth = plotWidth / 23;
                  return (
                    <rect
                      key={`hover-col-${idx}`}
                      x={p.x - colWidth / 2}
                      y={0}
                      width={colWidth}
                      height={svgHeight}
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredSparklineIndex(idx)}
                      onMouseLeave={() => setHoveredSparklineIndex(null)}
                      onClick={() => {
                        setActiveTab('history');
                        if (p.bucket.records.length > 0) {
                          setHistorySearchQuery(p.bucket.records[0].id);
                          showToast(isZh 
                            ? `已篩選時段 ${p.bucket.hourStr} 之告警事件: ${p.bucket.records[0].id}` 
                            : `Filtered alert for ${p.bucket.hourStr}: ${p.bucket.records[0].id}`);
                        } else {
                          showToast(isZh ? '切換至歷史帳本' : 'Navigated to History Ledger');
                        }
                      }}
                    />
                  );
                })}
              </svg>

              {/* 24-Hour Time Axis Labels */}
              <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 pt-1.5 px-3 border-t border-gray-800/40">
                {[0, 4, 8, 12, 16, 20, 23].map(idx => {
                  const b = last24HoursData.buckets[idx];
                  if (!b) return null;
                  const isCurrent = idx === 23;
                  return (
                    <div key={idx} className="flex flex-col items-center">
                      <span className={cn("font-bold", isCurrent ? "text-rose-400" : "text-gray-400")}>
                        {b.hourStr}
                      </span>
                      <span className="text-[9px] text-gray-600">
                        {b.relativeLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* METRICS COUNTER RIBBON */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-gray-800/80">
          <div className="bg-[#14141a] border border-gray-800 rounded-xl p-3">
            <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">{isZh ? '總監控規則' : 'Total Rules'}</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-extrabold text-white font-mono">{totalCount}</span>
              <span className="text-[10px] text-gray-500">{isZh ? '組判定式' : 'rules'}</span>
            </div>
          </div>

          <div className="bg-[#14141a] border border-gray-800 rounded-xl p-3">
            <span className="text-[10px] uppercase font-bold text-blue-400 block tracking-wider">{isZh ? '系統健康指標' : 'System Health'}</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-extrabold text-blue-400 font-mono">{sysHealthCount}</span>
              <span className="text-[10px] text-gray-500">CPU / RAM / Disk</span>
            </div>
          </div>

          <div className="bg-[#14141a] border border-gray-800 rounded-xl p-3">
            <span className="text-[10px] uppercase font-bold text-purple-400 block tracking-wider">{isZh ? '日誌吞吐量異常' : 'Log Volumes'}</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-extrabold text-purple-400 font-mono">{logVolCount}</span>
              <span className="text-[10px] text-gray-500">EPS Surge / Silence</span>
            </div>
          </div>

          <div className="bg-[#14141a] border border-gray-800 rounded-xl p-3">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">{isZh ? '運作中規則' : 'Active Rules'}</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-extrabold text-emerald-400 font-mono">{activeCount}</span>
              <span className="text-[10px] text-gray-500">/ {totalCount} Enabled</span>
            </div>
          </div>

          <div className="bg-[#14141a] border border-gray-800 rounded-xl p-3">
            <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">{isZh ? '觸發警戒狀態' : 'Breach Status'}</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={cn("text-xl font-extrabold font-mono", firingCount > 0 ? "text-red-400 animate-pulse" : "text-gray-400")}>
                {firingCount > 0 ? `${firingCount} 觸發中` : (isZh ? '全數正常' : 'All Healthy')}
              </span>
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('history')}
            className="bg-[#14141a] border border-gray-800 hover:border-rose-500/50 rounded-xl p-3 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-rose-400 block tracking-wider">{isZh ? '歷史告警帳本' : 'Alert History'}</span>
              <History size={12} className="text-rose-400 opacity-60 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-extrabold text-rose-400 font-mono">{historyRecords.length}</span>
              <span className="text-[10px] text-gray-500">
                {historyRecords.filter(r => r.resolutionStatus === 'Active').length > 0 
                  ? `${historyRecords.filter(r => r.resolutionStatus === 'Active').length} 待處置` 
                  : (isZh ? '全數排除' : 'All Resolved')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* TABS CONTROLLER */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#111115] border border-gray-800 p-1.5 rounded-xl">
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={() => setActiveTab('rules')}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
              activeTab === 'rules'
                ? "bg-red-600 text-white shadow-md shadow-red-950/40"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/60"
            )}
          >
            <Layers size={14} />
            {isZh ? '閥值規則清單與管理' : 'Threshold Rules Matrix'}
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/40 text-gray-300 font-mono">
              {filteredRules.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('live_bench')}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
              activeTab === 'live_bench'
                ? "bg-blue-600 text-white shadow-md shadow-blue-950/40"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/60"
            )}
          >
            <Gauge size={14} />
            {isZh ? '即時指標與閥值對照儀表' : 'Live Telemetry & Bench'}
          </button>

          <button
            onClick={() => setActiveTab('volume_anomaly')}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
              activeTab === 'volume_anomaly'
                ? "bg-purple-600 text-white shadow-md shadow-purple-950/40"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/60"
            )}
          >
            <Activity size={14} />
            {isZh ? '日誌量異常與斷流守門' : 'Log Anomaly & Silence Guard'}
          </button>

          <button
            onClick={() => setActiveTab('channels')}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
              activeTab === 'channels'
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/40"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/60"
            )}
          >
            <Mail size={14} />
            {isZh ? '通報通道與通知矩陣' : 'Notification Matrix'}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
              activeTab === 'history'
                ? "bg-rose-600 text-white shadow-md shadow-rose-950/40"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/60"
            )}
          >
            <History size={14} />
            {isZh ? '歷史告警紀錄 (Alert History)' : 'Alert History Ledger'}
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/40 text-rose-300 font-mono">
              {historyRecords.length}
            </span>
            {historyRecords.some(r => r.resolutionStatus === 'Active') && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
              activeTab === 'simulator'
                ? "bg-amber-600 text-white shadow-md shadow-amber-950/40"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/60"
            )}
          >
            <Terminal size={14} />
            {isZh ? '告警觸發與派送模擬器' : 'Dispatch Simulator'}
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-gray-500 px-3">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Evaluation Engine: 10s Tick</span>
        </div>
      </div>

      {/* TAB 1: RULES MANAGEMENT */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          {/* Controls Bar: Search & Category Chips */}
          <div className="bg-[#111115] border border-gray-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={isZh ? "搜尋規則名稱、監控指標或對象..." : "Search rule name, metric, or scope..."}
                className="w-full bg-[#16161d] border border-gray-800 rounded-lg pl-9 pr-3 py-2 text-xs text-gray-200 placeholder-gray-500 outline-none focus:border-red-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{isZh ? '分類:' : 'Type:'}</span>
              {[
                { id: 'all', label: isZh ? '全部' : 'All' },
                { id: 'system_health', label: isZh ? '系統健康' : 'Health' },
                { id: 'log_volume', label: isZh ? '日誌吞吐量' : 'Log Volume' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setCategoryFilter(tab.id as any)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-semibold transition-all",
                    categoryFilter === tab.id
                      ? "bg-gray-800 text-white border border-gray-700 shadow-sm"
                      : "text-gray-400 hover:text-gray-200 hover:bg-gray-900"
                  )}
                >
                  {tab.label}
                </button>
              ))}

              <div className="h-4 w-px bg-gray-800 mx-1 hidden sm:block" />

              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{isZh ? '狀態:' : 'Status:'}</span>
              {[
                { id: 'all', label: isZh ? '全部' : 'All' },
                { id: 'enabled', label: isZh ? '啟用中' : 'Active' },
                { id: 'disabled', label: isZh ? '已停用' : 'Muted' }
              ].map(st => (
                <button
                  key={st.id}
                  onClick={() => setStatusFilter(st.id as any)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-semibold transition-all",
                    statusFilter === st.id
                      ? "bg-gray-800 text-white border border-gray-700 shadow-sm"
                      : "text-gray-400 hover:text-gray-200 hover:bg-gray-900"
                  )}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rules List Cards */}
          <div className="grid grid-cols-1 gap-3.5">
            {filteredRules.map(rule => {
              const def = METRIC_DEFINITIONS[rule.metric] || { min: 0, max: 100 };
              const currentVal = rule.currentValue;
              const range = def.max - def.min;
              const warnPct = Math.min(100, Math.max(0, ((rule.warningThreshold - def.min) / range) * 100));
              const critPct = Math.min(100, Math.max(0, ((rule.criticalThreshold - def.min) / range) * 100));
              const currentPct = Math.min(100, Math.max(0, ((currentVal - def.min) / range) * 100));

              return (
                <div
                  key={rule.id}
                  className={cn(
                    "bg-[#111115] border rounded-xl p-4 sm:p-5 transition-all",
                    !rule.enabled
                      ? "opacity-60 border-gray-800 bg-[#0d0d10]"
                      : rule.status === 'critical'
                      ? "border-red-600/70 bg-red-950/10 shadow-lg shadow-red-950/20"
                      : rule.status === 'warning'
                      ? "border-amber-500/70 bg-amber-950/10"
                      : "border-gray-800 hover:border-gray-700"
                  )}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left info */}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Status badge */}
                        {rule.status === 'critical' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-red-600/20 text-red-400 border border-red-500 flex items-center gap-1">
                            <AlertCircle size={11} className="animate-ping" />
                            CRITICAL FIRING
                          </span>
                        )}
                        {rule.status === 'warning' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-600/20 text-amber-400 border border-amber-500 flex items-center gap-1">
                            <AlertTriangle size={11} />
                            WARNING FIRING
                          </span>
                        )}
                        {rule.status === 'healthy' && rule.enabled && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-600/10 text-emerald-400 border border-emerald-800/60 flex items-center gap-1">
                            <Check size={11} />
                            HEALTHY
                          </span>
                        )}
                        {!rule.enabled && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-800 text-gray-400 border border-gray-700">
                            MUTED / OFF
                          </span>
                        )}

                        {/* Category tag */}
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase border",
                          rule.category === 'system_health'
                            ? "bg-blue-950/50 text-blue-400 border-blue-800/60"
                            : "bg-purple-950/50 text-purple-400 border-purple-800/60"
                        )}>
                          {rule.category === 'system_health' ? 'System Health' : 'Log Volume'}
                        </span>

                        {/* Severity tag */}
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                          rule.severity === 'Critical' ? "bg-red-950 text-red-400 border border-red-800" :
                          rule.severity === 'High' ? "bg-orange-950 text-orange-400 border border-orange-800" :
                          rule.severity === 'Warning' ? "bg-yellow-950 text-yellow-400 border border-yellow-800" :
                          "bg-gray-900 text-gray-400"
                        )}>
                          {rule.severity}
                        </span>

                        <span className="text-[11px] font-mono text-gray-500">
                          Scope: <span className="text-gray-300 font-semibold">{rule.targetScope}</span>
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                        {rule.name}
                      </h3>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        {rule.description}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                      <button
                        onClick={() => {
                          setSelectedSimRuleId(rule.id);
                          setSimulatedValue(rule.criticalThreshold + (rule.condition.includes('<') ? -10 : 10));
                          setActiveTab('simulator');
                        }}
                        className="px-2.5 py-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-amber-400 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                        title={isZh ? "測試觸發與通報派送" : "Simulate breach dispatch"}
                      >
                        <Play size={11} />
                        {isZh ? '測試' : 'Test'}
                      </button>

                      {!isReadOnly && (
                        <>
                          <button
                            onClick={() => handleOpenEditModal(rule)}
                            className="px-2.5 py-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                            title={isZh ? "編輯門檻與通知管道" : "Edit Thresholds"}
                          >
                            <Edit3 size={11} />
                            {isZh ? '編輯' : 'Edit'}
                          </button>

                          <button
                            onClick={() => handleCloneRule(rule)}
                            className="p-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-400 hover:text-gray-200 rounded-lg text-xs transition-all"
                            title={isZh ? "複製此規則副本" : "Clone Rule"}
                          >
                            <Copy size={13} />
                          </button>

                          <button
                            onClick={() => handleDeleteRule(rule.id)}
                            className="p-1.5 bg-gray-900 hover:bg-red-950/60 border border-gray-700 hover:border-red-700 text-gray-500 hover:text-red-400 rounded-lg text-xs transition-all"
                            title={isZh ? "刪除此規則" : "Delete Rule"}
                          >
                            <Trash2 size={13} />
                          </button>

                          {/* Toggle Switch */}
                          <button
                            onClick={() => handleToggleRule(rule.id)}
                            className={cn(
                              "w-11 h-6 rounded-full p-0.5 transition-colors relative focus:outline-none ml-1",
                              rule.enabled ? "bg-red-600" : "bg-gray-800"
                            )}
                            title={rule.enabled ? (isZh ? "點擊以靜音/停用" : "Click to Mute") : (isZh ? "點擊以啟用" : "Click to Enable")}
                          >
                            <div className={cn(
                              "w-5 h-5 rounded-full bg-white transition-transform transform shadow-sm",
                              rule.enabled ? "translate-x-5" : "translate-x-0"
                            )} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* THRESHOLD COMPARATIVE BAR & DETAILS */}
                  <div className="mt-4 pt-3.5 border-t border-gray-800/60 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2 font-mono">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400">
                          {isZh ? '當前量測實測值:' : 'Current Value:'}{' '}
                          <span className={cn(
                            "font-bold text-sm",
                            rule.status === 'critical' ? "text-red-400 font-extrabold" :
                            rule.status === 'warning' ? "text-amber-400 font-extrabold" :
                            "text-emerald-400 font-semibold"
                          )}>
                            {currentVal.toLocaleString()} {rule.metricUnit}
                          </span>
                        </span>
                        <span className="text-gray-600">|</span>
                        <span className="text-yellow-400 font-medium">
                          Warn: {rule.condition} {rule.warningThreshold.toLocaleString()} {rule.metricUnit}
                        </span>
                        <span className="text-gray-600">|</span>
                        <span className="text-red-400 font-medium">
                          Crit: {rule.condition} {rule.criticalThreshold.toLocaleString()} {rule.metricUnit}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-gray-500">
                        <span>Sustain: <strong className="text-gray-300 font-mono">{rule.sustainDurationSec}s</strong></span>
                        <span>Cooldown: <strong className="text-gray-300 font-mono">{rule.cooldownMin}m</strong></span>
                        <span>Triggered: <strong className="text-gray-300 font-mono">{rule.triggerCount}x</strong></span>
                      </div>
                    </div>

                    {/* Visual Comparison Progress Track */}
                    <div className="relative w-full h-3 bg-gray-900 rounded-full overflow-hidden border border-gray-800 mt-1">
                      {/* Current value bar */}
                      <div
                        className={cn(
                          "h-full transition-all duration-700",
                          rule.status === 'critical' ? "bg-red-500" :
                          rule.status === 'warning' ? "bg-amber-500" :
                          "bg-emerald-500/80"
                        )}
                        style={{ width: `${currentPct}%` }}
                      />

                      {/* Warning marker */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 z-10"
                        style={{ left: `${warnPct}%` }}
                        title={`Warning Threshold: ${rule.warningThreshold} ${rule.metricUnit}`}
                      />

                      {/* Critical marker */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                        style={{ left: `${critPct}%` }}
                        title={`Critical Threshold: ${rule.criticalThreshold} ${rule.metricUnit}`}
                      />
                    </div>

                    {/* Channels Pill List */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-gray-400">
                        <span className="text-gray-500 mr-1">{isZh ? '派送通道:' : 'Dispatch:'}</span>
                        {rule.notificationChannels.email && (
                          <span className="px-2 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-900/60 flex items-center gap-1">
                            <Mail size={10} /> Email ({rule.notificationChannels.emailRecipients.length})
                          </span>
                        )}
                        {rule.notificationChannels.webhook && (
                          <span className="px-2 py-0.5 rounded bg-purple-950/60 text-purple-400 border border-purple-900/60 flex items-center gap-1">
                            <Zap size={10} /> Webhook {rule.notificationChannels.webhookChannel}
                          </span>
                        )}
                        {rule.notificationChannels.syslog && (
                          <span className="px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-900/60 flex items-center gap-1">
                            <Radio size={10} /> Syslog :{rule.notificationChannels.syslogPort}
                          </span>
                        )}
                        {rule.notificationChannels.inApp && (
                          <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-900/60 flex items-center gap-1">
                            <Bell size={10} /> In-App Toast
                          </span>
                        )}
                        {rule.notificationChannels.soarPlaybook && (
                          <span className="px-2 py-0.5 rounded bg-rose-950/60 text-rose-400 border border-rose-900/60 flex items-center gap-1">
                            <Workflow size={10} /> SOAR Playbook
                          </span>
                        )}
                      </div>

                      {rule.remediationHint && (
                        <span className="text-[11px] text-gray-400 italic truncate max-w-md" title={rule.remediationHint}>
                          💡 SOP: {rule.remediationHint}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredRules.length === 0 && (
              <div className="bg-[#111115] border border-gray-800 rounded-xl p-12 text-center space-y-3">
                <Sliders size={32} className="mx-auto text-gray-600" />
                <p className="text-sm font-bold text-gray-400">{isZh ? '未找到符合篩選條件的閥值規則' : 'No matching threshold rules found'}</p>
                <button
                  onClick={() => { setSearchQuery(''); setCategoryFilter('all'); setStatusFilter('all'); }}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-bold transition-all"
                >
                  {isZh ? '清除所有篩選條件' : 'Clear Filters'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: LIVE TELEMETRY & BENCH VIEW */}
      {activeTab === 'live_bench' && (
        <div className="space-y-6">
          <div className="bg-[#111115] border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Gauge size={16} className="text-blue-400" />
              {isZh ? '即時遙測指標與雙階門檻對照台 (Live Telemetry & Threshold Bench)' : 'Live Telemetry & Threshold Bench'}
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              {isZh 
                ? '直觀檢視當前即時遙測讀數（CPU、記憶體、磁碟容量、進線 EPS 速率、解碼失敗）與所設定警戒線的相對安全距離。可直接拖曳滑桿進行即時微調。'
                : 'Directly observe real-time telemetry metrics relative to warning and critical boundaries. Adjust sliders to fine-tune trigger limits.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {rules.filter(r => r.enabled).map(rule => {
              const def = METRIC_DEFINITIONS[rule.metric] || { min: 0, max: 100, step: 1 };
              const currentVal = rule.currentValue;
              const range = def.max - def.min;
              const warnPct = Math.min(100, Math.max(0, ((rule.warningThreshold - def.min) / range) * 100));
              const critPct = Math.min(100, Math.max(0, ((rule.criticalThreshold - def.min) / range) * 100));
              const currentPct = Math.min(100, Math.max(0, ((currentVal - def.min) / range) * 100));

              return (
                <div
                  key={rule.id}
                  className="bg-[#111115] border border-gray-800 hover:border-gray-700 rounded-xl p-5 space-y-4 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "p-2 rounded-lg",
                        rule.category === 'system_health' ? "bg-blue-600/20 text-blue-400" : "bg-purple-600/20 text-purple-400"
                      )}>
                        {rule.metric.includes('cpu') ? <Cpu size={16} /> :
                         rule.metric.includes('ram') ? <Zap size={16} /> :
                         rule.metric.includes('disk') ? <HardDrive size={16} /> :
                         <Activity size={16} />}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white leading-tight">{rule.metricLabel.split('(')[0]}</h4>
                        <span className="text-[10px] text-gray-500 font-mono">{rule.targetScope}</span>
                      </div>
                    </div>

                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase",
                      rule.status === 'critical' ? "bg-red-950 text-red-400 border border-red-800" :
                      rule.status === 'warning' ? "bg-amber-950 text-amber-400 border border-amber-800" :
                      "bg-emerald-950/60 text-emerald-400 border border-emerald-800/60"
                    )}>
                      {rule.status}
                    </span>
                  </div>

                  {/* Big current value */}
                  <div className="flex items-baseline justify-between pt-1">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-500 block">Current Telemetry</span>
                      <div className="text-2xl font-extrabold text-white font-mono mt-0.5">
                        {currentVal.toLocaleString()}{' '}
                        <span className="text-xs font-normal text-gray-400 font-mono">{rule.metricUnit}</span>
                      </div>
                    </div>

                    <div className="text-right font-mono text-[11px]">
                      <div className="text-yellow-400">Warn: {rule.warningThreshold} {rule.metricUnit}</div>
                      <div className="text-red-400">Crit: {rule.criticalThreshold} {rule.metricUnit}</div>
                    </div>
                  </div>

                  {/* Multi-tier bar */}
                  <div className="space-y-1.5">
                    <div className="relative w-full h-3 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                      <div
                        className={cn(
                          "h-full transition-all duration-700",
                          rule.status === 'critical' ? "bg-red-500" :
                          rule.status === 'warning' ? "bg-amber-500" :
                          "bg-blue-500"
                        )}
                        style={{ width: `${currentPct}%` }}
                      />
                      <div className="absolute top-0 bottom-0 w-1 bg-yellow-400 z-10" style={{ left: `${warnPct}%` }} />
                      <div className="absolute top-0 bottom-0 w-1 bg-red-500 z-10" style={{ left: `${critPct}%` }} />
                    </div>

                    <div className="flex justify-between text-[10px] font-mono text-gray-500">
                      <span>Min: {def.min} {rule.metricUnit}</span>
                      <span>Max: {def.max} {rule.metricUnit}</span>
                    </div>
                  </div>

                  {/* Fast adjust sliders */}
                  {!isReadOnly && (
                    <div className="pt-3 border-t border-gray-800/60 space-y-2.5">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-yellow-400">Warning Threshold</span>
                          <span className="text-white font-mono">{rule.warningThreshold} {rule.metricUnit}</span>
                        </div>
                        <input
                          type="range"
                          min={def.min}
                          max={def.max}
                          step={def.step}
                          value={rule.warningThreshold}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setRules(prev => prev.map(r => r.id === rule.id ? { ...r, warningThreshold: val } : r));
                          }}
                          className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-red-400">Critical Threshold</span>
                          <span className="text-white font-mono">{rule.criticalThreshold} {rule.metricUnit}</span>
                        </div>
                        <input
                          type="range"
                          min={def.min}
                          max={def.max}
                          step={def.step}
                          value={rule.criticalThreshold}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setRules(prev => prev.map(r => r.id === rule.id ? { ...r, criticalThreshold: val } : r));
                          }}
                          className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: LOG VOLUME ANOMALY & SILENCE WATCHDOG */}
      {activeTab === 'volume_anomaly' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Surge Watchdog Panel */}
            <div className="bg-[#111115] border border-gray-800 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
                  <Zap size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{isZh ? '日誌吞吐量異常暴增守門 (Surge Guard)' : 'EPS Surge Guard'}</h3>
                  <p className="text-xs text-gray-500">預防 DDoS 洪泛或掃描器引發資料庫寫入耗竭</p>
                </div>
              </div>

              <div className="p-4 bg-gray-950/60 border border-gray-800/80 rounded-xl space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">全域基準每秒吞吐 (Baseline):</span>
                  <span className="font-mono font-bold text-white">6,500 ~ 9,200 EPS</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">突增告警上限 (Surge Trigger):</span>
                  <span className="font-mono font-bold text-red-400">&gt; 18,000 EPS (持續 60s)</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">自動化反應 (Auto Response):</span>
                  <span className="font-mono font-bold text-emerald-400">SOAR Rate-Limit Playbook</span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-gray-400 leading-relaxed">
                <p>• 系統持續計算 5 分鐘滾動式滑動窗口 (Rolling Window) 平均值，當即時 EPS 突增超越設定倍率時自動標記為異常脈衝。</p>
                <p>• 搭配 Go 收集器背壓機制，可自動阻絕惡意未授權之 UDP Syslog 洪泛。</p>
              </div>
            </div>

            {/* Silence Watchdog Panel */}
            <div className="bg-[#111115] border border-gray-800 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30">
                  <VolumeX size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{isZh ? '關鍵日誌斷流與靜默黑洞 (Silence Blackout)' : 'Silence & Blackout Guard'}</h3>
                  <p className="text-xs text-gray-500">監控關鍵資產突然失去連線或日誌停止轉發</p>
                </div>
              </div>

              <div className="p-4 bg-gray-950/60 border border-gray-800/80 rounded-xl space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">監控資產群組 (Target Assets):</span>
                  <span className="font-mono font-bold text-white">核心防火牆、網閘、DC</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">靜默門檻 (Silence Floor):</span>
                  <span className="font-mono font-bold text-yellow-400">&lt;= 10 EPS (持續 180s)</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">通知優先權 (Priority):</span>
                  <span className="font-mono font-bold text-red-400">P1 - 最高緊急處置</span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-gray-400 leading-relaxed">
                <p>• 許多進階持續性威脅 (APT) 攻擊者在內網滲透後會嘗試關閉 rsyslog / eventlog 服務以掩蓋蹤跡。</p>
                <p>• 斷流檢測器以主動心跳 (Heartbeat) 方式每 10 秒驗證接收管線，發現斷訊立即通報 SOC 第一線。</p>
              </div>
            </div>

            {/* Parser Degradation Panel */}
            <div className="bg-[#111115] border border-gray-800 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{isZh ? '解碼器解析失敗率突增 (Parser Degradation)' : 'Parser Degradation'}</h3>
                  <p className="text-xs text-gray-500">防止未解碼日誌累積導致威脅特徵漏失</p>
                </div>
              </div>

              <div className="p-4 bg-gray-950/60 border border-gray-800/80 rounded-xl space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">當前丟棄速率 (Drop Rate):</span>
                  <span className="font-mono font-bold text-emerald-400">24 drops/s (正常範圍)</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">告警門檻 (Trigger Threshold):</span>
                  <span className="font-mono font-bold text-yellow-400">&gt;= 200 drops/s</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">處置引導 (Remediation):</span>
                  <span className="font-mono font-bold text-blue-400">AI 解碼器正則修復精靈</span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-gray-400 leading-relaxed">
                <p>• 當設備韌體更新升級導致 Syslog 輸出欄位變更時，傳統正則可能瞬間失效而產生大量解析丟棄。</p>
                <p>• 透過門檻告警可第一時間通知工程團隊更新解碼正則，確保欄位萃取完整性。</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: NOTIFICATION CHANNELS */}
      {activeTab === 'channels' && (
        <div className="bg-[#111115] border border-gray-800 rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Mail size={16} className="text-emerald-400" />
                {isZh ? '多管道告警派送設定 (Multi-Channel Dispatch Matrix)' : 'Multi-Channel Dispatch Matrix'}
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                {isZh ? '配置各項閥值突破時通報之 Email、Slack/Teams Webhook、Syslog RFC5424 及 SOAR 自動化劇本目標。' : 'Configure destination endpoints for alerts breach notifications.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Channel 1: Email SMTP */}
            <div className="bg-[#16161e] border border-gray-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400">
                  <Mail size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Email 郵件伺服器 (SMTP)</h4>
                  <span className="text-[10px] text-gray-500">smtp.office365.com:587 (TLS Enabled)</span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <label className="text-[10px] font-bold text-gray-400 uppercase">預設接收群組 (Default Recipients)</label>
                <div className="bg-[#0f0f13] border border-gray-800 rounded-lg p-2.5 font-mono text-xs text-gray-300 space-y-1">
                  <div>soc-duty@semor-security.com</div>
                  <div>infra-oncall@semor-security.com</div>
                  <div>incident-response@semor-security.com</div>
                </div>
              </div>
            </div>

            {/* Channel 2: Webhook */}
            <div className="bg-[#16161e] border border-gray-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-600/20 text-purple-400">
                  <Zap size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Slack / Teams Webhook</h4>
                  <span className="text-[10px] text-gray-500">即時推播至 SOC 運營頻道</span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Webhook Endpoint</label>
                <input
                  type="text"
                  readOnly={isReadOnly}
                  defaultValue="https://hooks.slack.com/services/T000/B000/SEC_ALERTS"
                  className="w-full bg-[#0f0f13] border border-gray-800 rounded-lg px-3 py-2 text-xs font-mono text-gray-300 outline-none"
                />
                <div className="flex justify-between text-[11px] text-gray-500">
                  <span>Channel: <strong className="text-gray-300">#soc-sec-critical</strong></span>
                  <span>Payload: <strong className="text-gray-300">JSON RFC-8259</strong></span>
                </div>
              </div>
            </div>

            {/* Channel 3: Syslog Forwarding */}
            <div className="bg-[#16161e] border border-gray-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-600/20 text-amber-400">
                  <Radio size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">遠端 Syslog 轉發 (RFC 5424)</h4>
                  <span className="text-[10px] text-gray-500">轉發至中央 SOC 集中審計伺服器</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Target Host</label>
                  <input
                    type="text"
                    readOnly={isReadOnly}
                    defaultValue="127.0.0.1"
                    className="w-full bg-[#0f0f13] border border-gray-800 rounded-lg px-3 py-2 text-xs font-mono text-gray-300 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Port / Proto</label>
                  <input
                    type="text"
                    readOnly={isReadOnly}
                    defaultValue="514 / UDP"
                    className="w-full bg-[#0f0f13] border border-gray-800 rounded-lg px-3 py-2 text-xs font-mono text-gray-300 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Channel 4: SOAR Playbook */}
            <div className="bg-[#16161e] border border-gray-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-600/20 text-rose-400">
                  <Workflow size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">SOAR 自動化應變劇本 (Playbook Orchestration)</h4>
                  <span className="text-[10px] text-gray-500">觸發嚴重告警時自動下發處置作業</span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3 bg-[#0f0f13] border border-gray-800 rounded-lg text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-400">DDoS Ingest Surge:</span>
                    <span className="font-mono text-emerald-400">pb-ddos-rate-limit</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">OOM Cache Flush:</span>
                    <span className="font-mono text-emerald-400">pb-flush-memory-cache</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Disk Full Archive:</span>
                    <span className="font-mono text-emerald-400">pb-archive-old-blocks</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SIMULATOR & AUDIT LOGS */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Test Controls */}
          <div className="bg-[#111115] border border-gray-800 rounded-xl p-6 space-y-5">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal size={16} className="text-amber-400" />
                {isZh ? '閥值突破模擬測試台' : 'Threshold Breach Simulator'}
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                {isZh ? '模擬指標或日誌量瞬間超出閥值，驗證多管道派送邏輯與抑制冷卻時間。' : 'Simulate metric breach to verify multi-channel notification fanout.'}
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  {isZh ? '選擇欲測試的閥值規則' : 'Select Target Rule'}
                </label>
                <select
                  value={selectedSimRuleId}
                  onChange={e => {
                    setSelectedSimRuleId(e.target.value);
                    const r = rules.find(x => x.id === e.target.value);
                    if (r) setSimulatedValue(r.criticalThreshold + 10);
                  }}
                  className="w-full bg-[#16161e] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white font-semibold outline-none focus:border-red-500"
                >
                  {rules.map(r => (
                    <option key={r.id} value={r.id}>
                      [{r.category === 'system_health' ? 'Health' : 'Volume'}] {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  {isZh ? '模擬數值 (Simulated Metric Value)' : 'Simulated Value'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={simulatedValue}
                    onChange={e => setSimulatedValue(Number(e.target.value))}
                    className="w-full bg-[#16161e] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white font-mono outline-none focus:border-red-500"
                  />
                  <span className="text-xs text-gray-400 font-mono shrink-0">
                    {rules.find(r => r.id === selectedSimRuleId)?.metricUnit || ''}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  {isZh ? '觸發嚴重級別' : 'Trigger Severity'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSimSeverity('Critical')}
                    className={cn(
                      "py-2 rounded-lg text-xs font-bold transition-all border",
                      simSeverity === 'Critical'
                        ? "bg-red-600/30 text-red-400 border-red-500"
                        : "bg-[#16161e] text-gray-400 border-gray-800 hover:text-white"
                    )}
                  >
                    CRITICAL (緊急)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimSeverity('Warning')}
                    className={cn(
                      "py-2 rounded-lg text-xs font-bold transition-all border",
                      simSeverity === 'Warning'
                        ? "bg-amber-600/30 text-amber-400 border-amber-500"
                        : "bg-[#16161e] text-gray-400 border-gray-800 hover:text-white"
                    )}
                  >
                    WARNING (警告)
                  </button>
                </div>
              </div>

              <button
                onClick={handleRunSimulation}
                disabled={isSimulating}
                className="w-full py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                <Play size={13} className={isSimulating ? 'animate-spin' : ''} />
                {isSimulating ? (isZh ? '派送執行中...' : 'Dispatching...') : (isZh ? '立即觸發模擬通知派送' : 'Simulate & Dispatch Alert')}
              </button>
            </div>
          </div>

          {/* Right: Simulation Logs Terminal */}
          <div className="lg:col-span-2 bg-[#0c0c10] border border-gray-800 rounded-xl p-5 flex flex-col font-mono text-xs">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Terminal size={14} className="text-emerald-400" />
                <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">
                  {isZh ? '即時派送與除錯終端日誌 (Dispatch Audit Log)' : 'Dispatch Audit Log'}
                </span>
              </div>
              <button
                onClick={() => setSimulationLogs([])}
                className="text-[11px] text-gray-500 hover:text-gray-300"
              >
                Clear Log
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 text-[11px] max-h-[420px] pr-2">
              {simulationLogs.map((log, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "p-2 rounded border leading-relaxed break-all",
                    log.includes('CRITICAL') || log.includes('ALERT_TRIGGER') || log.includes('FIRING')
                      ? "bg-red-950/20 text-red-300 border-red-900/40"
                      : log.includes('WARNING')
                      ? "bg-amber-950/20 text-amber-300 border-amber-900/40"
                      : log.includes('DISPATCH_') || log.includes('OK')
                      ? "bg-blue-950/20 text-blue-300 border-blue-900/40"
                      : "bg-gray-900/30 text-gray-400 border-gray-800/60"
                  )}
                >
                  {log}
                </div>
              ))}
              {simulationLogs.length === 0 && (
                <div className="text-gray-600 text-center py-12">
                  No simulation logs recorded yet. Click "Simulate & Dispatch" to verify alert routing.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ALERT HISTORY AUDIT LEDGER */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* LEDGER BANNER & QUICK STATS */}
          <div className="bg-[#111116] border border-gray-800 rounded-xl p-5 shadow-lg">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-950/80 border border-rose-800 text-rose-400 flex items-center gap-1.5">
                    <ShieldCheck size={12} className="text-rose-400" />
                    {isZh ? '不可篡改審計帳本' : 'Tamper-Evident Audit Ledger'}
                  </span>
                  <span className="text-[11px] text-gray-500 font-mono flex items-center gap-1">
                    <Hash size={11} className="text-gray-600" />
                    SHA-256 Merkle Chained (RFC 6962)
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <History className="text-rose-500" size={20} />
                  {isZh ? '歷史告警紀錄帳本 (Alert History Ledger)' : 'Immutable Alert History Ledger'}
                </h2>
                <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
                  {isZh 
                    ? '提供系統健康與日誌吞吐量告警之完整不可篡改審計軌跡，記錄觸發精確時間戳記、嚴重程度等級、產生告警之來源引擎、實測門檻與處置歷程。' 
                    : 'Immutable record of triggered alerts for system health and log volume metrics, capturing timestamp, severity, source engine, thresholds, and resolution tracking.'}
                </p>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
                <button
                  onClick={loadHistoryFromApi}
                  disabled={isLoadingHistory}
                  className="px-3 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-700/60 rounded-lg text-xs font-semibold text-gray-300 transition-all flex items-center gap-1.5"
                  title={isZh ? "同步最新帳本" : "Sync Ledger"}
                >
                  <RefreshCw size={13} className={cn("text-rose-400", isLoadingHistory && "animate-spin")} />
                  <span>{isZh ? '同步帳本' : 'Sync'}</span>
                </button>

                <button
                  onClick={handleExportHistoryCSV}
                  className="px-3 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-700/60 rounded-lg text-xs font-semibold text-gray-300 transition-all flex items-center gap-1.5"
                  title={isZh ? "匯出 CSV 報表" : "Export CSV"}
                >
                  <FileSpreadsheet size={13} className="text-emerald-400" />
                  <span>CSV</span>
                </button>

                <button
                  onClick={handleExportHistoryJSON}
                  className="px-3 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-700/60 rounded-lg text-xs font-semibold text-gray-300 transition-all flex items-center gap-1.5"
                  title={isZh ? "匯出 JSON 帳本" : "Export JSON"}
                >
                  <Download size={13} className="text-blue-400" />
                  <span>JSON</span>
                </button>

                {!isReadOnly && (
                  <button
                    onClick={handleResetHistoryDefaults}
                    className="px-3 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-700/60 rounded-lg text-xs font-semibold text-gray-400 hover:text-gray-200 transition-all flex items-center gap-1.5"
                    title={isZh ? "重置審計範本" : "Reset Presets"}
                  >
                    <RotateCcw size={13} className="text-amber-400" />
                    <span>{isZh ? '範本重置' : 'Reset'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Resolution Status Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-5 pt-4 border-t border-gray-800/60">
              <div 
                onClick={() => setHistoryStatusFilter(historyStatusFilter === 'Active' ? 'all' : 'Active')}
                className={cn(
                  "p-2.5 rounded-lg border transition-all cursor-pointer",
                  historyStatusFilter === 'Active' 
                    ? "bg-red-950/40 border-red-600/80" 
                    : "bg-[#14141a] border-gray-800 hover:border-red-800/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">{isZh ? '待處置' : 'Active'}</span>
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                </div>
                <div className="text-lg font-extrabold font-mono text-red-400 mt-1">
                  {historyRecords.filter(r => r.resolutionStatus === 'Active').length}
                </div>
              </div>

              <div 
                onClick={() => setHistoryStatusFilter(historyStatusFilter === 'Investigating' ? 'all' : 'Investigating')}
                className={cn(
                  "p-2.5 rounded-lg border transition-all cursor-pointer",
                  historyStatusFilter === 'Investigating' 
                    ? "bg-amber-950/40 border-amber-600/80" 
                    : "bg-[#14141a] border-gray-800 hover:border-amber-800/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">{isZh ? '調查中' : 'Investigating'}</span>
                  <Activity size={12} className="text-amber-400" />
                </div>
                <div className="text-lg font-extrabold font-mono text-amber-300 mt-1">
                  {historyRecords.filter(r => r.resolutionStatus === 'Investigating').length}
                </div>
              </div>

              <div 
                onClick={() => setHistoryStatusFilter(historyStatusFilter === 'Acknowledged' ? 'all' : 'Acknowledged')}
                className={cn(
                  "p-2.5 rounded-lg border transition-all cursor-pointer",
                  historyStatusFilter === 'Acknowledged' 
                    ? "bg-blue-950/40 border-blue-600/80" 
                    : "bg-[#14141a] border-gray-800 hover:border-blue-800/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">{isZh ? '已確認' : 'Acknowledged'}</span>
                  <Check size={12} className="text-blue-400" />
                </div>
                <div className="text-lg font-extrabold font-mono text-blue-300 mt-1">
                  {historyRecords.filter(r => r.resolutionStatus === 'Acknowledged').length}
                </div>
              </div>

              <div 
                onClick={() => setHistoryStatusFilter(historyStatusFilter === 'Resolved' ? 'all' : 'Resolved')}
                className={cn(
                  "p-2.5 rounded-lg border transition-all cursor-pointer",
                  historyStatusFilter === 'Resolved' 
                    ? "bg-emerald-950/40 border-emerald-600/80" 
                    : "bg-[#14141a] border-gray-800 hover:border-emerald-800/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">{isZh ? '已排除' : 'Resolved'}</span>
                  <CheckCircle2 size={12} className="text-emerald-400" />
                </div>
                <div className="text-lg font-extrabold font-mono text-emerald-400 mt-1">
                  {historyRecords.filter(r => r.resolutionStatus === 'Resolved').length}
                </div>
              </div>

              <div 
                onClick={() => setHistoryStatusFilter(historyStatusFilter === 'Auto-Remediated' ? 'all' : 'Auto-Remediated')}
                className={cn(
                  "p-2.5 rounded-lg border transition-all cursor-pointer",
                  historyStatusFilter === 'Auto-Remediated' 
                    ? "bg-purple-950/40 border-purple-600/80" 
                    : "bg-[#14141a] border-gray-800 hover:border-purple-800/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">{isZh ? 'SOAR 自動自癒' : 'Auto-Remediated'}</span>
                  <Zap size={12} className="text-purple-400" />
                </div>
                <div className="text-lg font-extrabold font-mono text-purple-300 mt-1">
                  {historyRecords.filter(r => r.resolutionStatus === 'Auto-Remediated').length}
                </div>
              </div>
            </div>
          </div>

          {/* FILTERING & SEARCH TOOLBAR */}
          <div className="bg-[#111116] border border-gray-800 rounded-xl p-3.5 flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={historySearchQuery}
                onChange={e => setHistorySearchQuery(e.target.value)}
                placeholder={isZh ? "搜尋 ID、規則名稱、來源引擎、備註..." : "Search ID, rule, engine, notes, operator..."}
                className="w-full bg-[#16161f] border border-gray-800 rounded-lg pl-9 pr-8 py-2 text-xs text-gray-200 placeholder-gray-500 outline-none focus:border-rose-500 transition-colors font-mono"
              />
              {historySearchQuery && (
                <button
                  onClick={() => setHistorySearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Dropdown Filters */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Severity Filter */}
              <div className="flex items-center gap-1.5 bg-[#16161f] border border-gray-800 rounded-lg px-2.5 py-1 text-xs">
                <span className="text-[10px] font-bold text-gray-500 uppercase">{isZh ? '嚴重度:' : 'Sev:'}</span>
                <select
                  value={historySeverityFilter}
                  onChange={e => setHistorySeverityFilter(e.target.value)}
                  className="bg-transparent text-gray-200 font-semibold outline-none text-xs cursor-pointer"
                >
                  <option value="all" className="bg-[#181822]">{isZh ? '全部嚴重度' : 'All Severities'}</option>
                  <option value="Critical" className="bg-[#181822]">Critical (重大)</option>
                  <option value="High" className="bg-[#181822]">High (高度)</option>
                  <option value="Warning" className="bg-[#181822]">Warning (預警)</option>
                  <option value="Info" className="bg-[#181822]">Info (資訊)</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-[#16161f] border border-gray-800 rounded-lg px-2.5 py-1 text-xs">
                <span className="text-[10px] font-bold text-gray-500 uppercase">{isZh ? '處置狀態:' : 'Status:'}</span>
                <select
                  value={historyStatusFilter}
                  onChange={e => setHistoryStatusFilter(e.target.value)}
                  className="bg-transparent text-gray-200 font-semibold outline-none text-xs cursor-pointer"
                >
                  <option value="all" className="bg-[#181822]">{isZh ? '全部狀態' : 'All Status'}</option>
                  <option value="Active" className="bg-[#181822]">{isZh ? '待處置 (Active)' : 'Active'}</option>
                  <option value="Investigating" className="bg-[#181822]">{isZh ? '調查中 (Investigating)' : 'Investigating'}</option>
                  <option value="Acknowledged" className="bg-[#181822]">{isZh ? '已確認 (Acknowledged)' : 'Acknowledged'}</option>
                  <option value="Resolved" className="bg-[#181822]">{isZh ? '已排除 (Resolved)' : 'Resolved'}</option>
                  <option value="Auto-Remediated" className="bg-[#181822]">{isZh ? '自癒 (Auto-Remediated)' : 'Auto-Remediated'}</option>
                </select>
              </div>

              {/* Engine Filter */}
              <div className="flex items-center gap-1.5 bg-[#16161f] border border-gray-800 rounded-lg px-2.5 py-1 text-xs">
                <span className="text-[10px] font-bold text-gray-500 uppercase">{isZh ? '來源引擎:' : 'Engine:'}</span>
                <select
                  value={historyEngineFilter}
                  onChange={e => setHistoryEngineFilter(e.target.value)}
                  className="bg-transparent text-gray-200 font-semibold outline-none text-xs cursor-pointer"
                >
                  <option value="all" className="bg-[#181822]">{isZh ? '全部引擎' : 'All Engines'}</option>
                  {uniqueEngines.map(eng => (
                    <option key={eng} value={eng} className="bg-[#181822]">{eng}</option>
                  ))}
                </select>
              </div>

              {/* Reset filter button */}
              {(historySearchQuery || historySeverityFilter !== 'all' || historyStatusFilter !== 'all' || historyEngineFilter !== 'all') && (
                <button
                  onClick={() => {
                    setHistorySearchQuery('');
                    setHistorySeverityFilter('all');
                    setHistoryStatusFilter('all');
                    setHistoryEngineFilter('all');
                  }}
                  className="px-2 py-1 text-[11px] text-gray-400 hover:text-white underline underline-offset-2"
                >
                  {isZh ? '清除篩選' : 'Clear'}
                </button>
              )}

              <span className="text-[11px] font-mono text-gray-500 ml-auto">
                {filteredHistory.length} / {historyRecords.length} {isZh ? '筆事件' : 'records'}
              </span>
            </div>
          </div>

          {/* ALERT HISTORY TABLE */}
          <div className="bg-[#111116] border border-gray-800 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-800 bg-[#15151e] text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                    <th className="py-3 px-4 w-44">{isZh ? '觸發時間 / 識別號' : 'Trigger Time & ID'}</th>
                    <th className="py-3 px-3 w-28">{isZh ? '嚴重等級' : 'Severity'}</th>
                    <th className="py-3 px-4 w-52">{isZh ? '產生來源引擎' : 'Source Engine'}</th>
                    <th className="py-3 px-4">{isZh ? '告警規則與實測數值' : 'Alert Rule & Telemetry Breach'}</th>
                    <th className="py-3 px-3 w-36">{isZh ? '派送管道' : 'Dispatched'}</th>
                    <th className="py-3 px-4 w-44">{isZh ? '處置狀態' : 'Resolution Status'}</th>
                    <th className="py-3 px-4 w-36 text-right">{isZh ? '操作與審計' : 'Audit & Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 text-xs">
                  {filteredHistory.map(record => {
                    // Severity badge styling
                    let sevBg = 'bg-gray-800 text-gray-300 border-gray-700';
                    let sevIcon = <Info size={12} className="shrink-0" />;
                    if (record.severity === 'Critical') {
                      sevBg = 'bg-red-950/80 text-red-300 border-red-700 shadow-sm shadow-red-950/50';
                      sevIcon = <AlertCircle size={12} className="text-red-400 shrink-0 animate-pulse" />;
                    } else if (record.severity === 'High') {
                      sevBg = 'bg-orange-950/80 text-orange-300 border-orange-700';
                      sevIcon = <AlertTriangle size={12} className="text-orange-400 shrink-0" />;
                    } else if (record.severity === 'Warning') {
                      sevBg = 'bg-amber-950/80 text-amber-300 border-amber-700';
                      sevIcon = <AlertTriangle size={12} className="text-amber-400 shrink-0" />;
                    } else if (record.severity === 'Info') {
                      sevBg = 'bg-sky-950/80 text-sky-300 border-sky-700';
                      sevIcon = <Info size={12} className="text-sky-400 shrink-0" />;
                    }

                    // Resolution Status badge styling
                    let statusBg = 'bg-gray-800 text-gray-300 border-gray-700';
                    let statusDot = 'bg-gray-400';
                    let statusLabel: string = record.resolutionStatus;
                    if (record.resolutionStatus === 'Active') {
                      statusBg = 'bg-red-950/80 text-red-300 border-red-700';
                      statusDot = 'bg-red-400 animate-pulse';
                      statusLabel = isZh ? '待處置' : 'Active';
                    } else if (record.resolutionStatus === 'Investigating') {
                      statusBg = 'bg-amber-950/80 text-amber-300 border-amber-700';
                      statusDot = 'bg-amber-400 animate-pulse';
                      statusLabel = isZh ? '調查中' : 'Investigating';
                    } else if (record.resolutionStatus === 'Acknowledged') {
                      statusBg = 'bg-blue-950/80 text-blue-300 border-blue-700';
                      statusDot = 'bg-blue-400';
                      statusLabel = isZh ? '已確認' : 'Acknowledged';
                    } else if (record.resolutionStatus === 'Resolved') {
                      statusBg = 'bg-emerald-950/80 text-emerald-300 border-emerald-700';
                      statusDot = 'bg-emerald-400';
                      statusLabel = isZh ? '已排除' : 'Resolved';
                    } else if (record.resolutionStatus === 'Auto-Remediated') {
                      statusBg = 'bg-purple-950/80 text-purple-300 border-purple-700';
                      statusDot = 'bg-purple-400';
                      statusLabel = isZh ? 'SOAR 自癒' : 'Auto-Remediated';
                    }

                    // Format date & time
                    const d = new Date(record.triggerTime);
                    const formattedDate = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
                    const formattedTime = `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}:${String(d.getUTCSeconds()).padStart(2, '0')} UTC`;

                    return (
                      <tr 
                        key={record.id}
                        className={cn(
                          "transition-colors group hover:bg-[#151520]",
                          record.resolutionStatus === 'Active' && "bg-red-950/10"
                        )}
                      >
                        {/* Trigger Time & ID */}
                        <td className="py-3 px-4 align-top font-mono">
                          <div className="flex items-center gap-1.5 text-white font-semibold">
                            <Clock size={12} className="text-gray-500 shrink-0" />
                            <span>{formattedDate}</span>
                          </div>
                          <div className="text-[11px] text-gray-400 ml-4.5">
                            {formattedTime}
                          </div>
                          <div className="mt-1 flex items-center gap-1">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(record.id);
                                showToast(isZh ? `已複製 ID: ${record.id}` : `Copied ID: ${record.id}`);
                              }}
                              className="px-1.5 py-0.5 rounded bg-black/50 hover:bg-black text-[10px] text-gray-400 hover:text-gray-200 border border-gray-800 flex items-center gap-1 transition-colors"
                              title="Click to copy ID"
                            >
                              <span>{record.id}</span>
                              <Copy size={9} className="opacity-60" />
                            </button>
                          </div>
                        </td>

                        {/* Severity */}
                        <td className="py-3 px-3 align-top">
                          <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider border inline-flex items-center gap-1.5 uppercase", sevBg)}>
                            {sevIcon}
                            <span>{record.severity}</span>
                          </span>
                        </td>

                        {/* Source Engine */}
                        <td className="py-3 px-4 align-top">
                          <div className="flex items-center gap-1.5">
                            <Server size={13} className={cn(
                              "shrink-0",
                              record.sourceEngine.includes('vlog') ? "text-indigo-400" :
                              record.sourceEngine.includes('semor') ? "text-cyan-400" : "text-purple-400"
                            )} />
                            <span className="font-semibold text-gray-200 text-xs truncate max-w-[180px]" title={record.sourceEngine}>
                              {record.sourceEngine.split(' ')[0]}
                            </span>
                          </div>
                          <div className="text-[10px] text-gray-400 truncate max-w-[190px] font-mono mt-0.5" title={record.sourceEngine}>
                            {record.sourceEngine.includes('(') ? record.sourceEngine.slice(record.sourceEngine.indexOf('(')) : record.sourceEngine}
                          </div>
                          <span className="inline-block mt-1 px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-gray-800 text-gray-400 border border-gray-700/50">
                            {record.category === 'system_health' ? (isZh ? '系統健康' : 'System Health') : (isZh ? '日誌吞吐量' : 'Log Volume')}
                          </span>
                        </td>

                        {/* Rule Name & Telemetry Breach */}
                        <td className="py-3 px-4 align-top">
                          <div className="font-bold text-white text-xs group-hover:text-red-300 transition-colors">
                            {record.ruleName}
                          </div>
                          
                          {/* Measured condition threshold */}
                          <div className="mt-1 flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
                            <span className="text-gray-400">{record.metricLabel}:</span>
                            <span className="px-1.5 py-0.5 rounded bg-red-950/60 border border-red-800/80 text-red-300 font-bold">
                              {typeof record.measuredValue === 'number' ? record.measuredValue.toLocaleString() : record.measuredValue} {record.metricUnit}
                            </span>
                            <span className="text-gray-500 font-bold">{record.condition}</span>
                            <span className="text-gray-400">
                              {typeof record.thresholdValue === 'number' ? record.thresholdValue.toLocaleString() : record.thresholdValue} {record.metricUnit}
                            </span>
                          </div>

                          {record.resolutionNote && (
                            <div className="mt-1.5 text-[11px] text-gray-400 line-clamp-1 italic bg-[#151520] p-1 rounded border border-gray-800/60">
                              {record.resolutionNote}
                            </div>
                          )}
                        </td>

                        {/* Dispatched Channels */}
                        <td className="py-3 px-3 align-top">
                          <div className="flex flex-wrap gap-1">
                            {record.dispatchedChannels.map(ch => (
                              <span
                                key={ch}
                                className="px-1.5 py-0.5 rounded bg-gray-800/80 border border-gray-700/60 text-[9px] font-mono text-gray-300 uppercase"
                                title={`Dispatched to ${ch}`}
                              >
                                {ch === 'email' ? '✉ Mail' : ch === 'webhook' ? '⚡ Slack' : ch === 'syslog' ? '📡 Syslog' : ch === 'inApp' ? '🔔 InApp' : '🛡 SOAR'}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Resolution Status */}
                        <td className="py-3 px-4 align-top">
                          <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold border inline-flex items-center gap-1.5 uppercase", statusBg)}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", statusDot)} />
                            <span>{statusLabel}</span>
                          </span>

                          {record.resolvedBy && (
                            <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-1 font-mono">
                              <User size={10} className="text-gray-500 shrink-0" />
                              <span>{record.resolvedBy}</span>
                            </div>
                          )}
                        </td>

                        {/* Actions & Audit */}
                        <td className="py-3 px-4 align-top text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Quick Action button */}
                            {!isReadOnly && record.resolutionStatus === 'Active' && (
                              <button
                                onClick={() => handleQuickStatusUpdate(record, 'Investigating')}
                                className="px-2 py-1 rounded bg-amber-950/60 hover:bg-amber-900 border border-amber-700/80 text-amber-300 text-[10px] font-bold transition-all"
                                title="標記為調查中 (Mark as Investigating)"
                              >
                                {isZh ? '接手調查' : 'Investigate'}
                              </button>
                            )}

                            {!isReadOnly && (record.resolutionStatus === 'Investigating' || record.resolutionStatus === 'Acknowledged') && (
                              <button
                                onClick={() => handleQuickStatusUpdate(record, 'Resolved')}
                                className="px-2 py-1 rounded bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-300 text-[10px] font-bold transition-all"
                                title="標記為已排除 (Mark as Resolved)"
                              >
                                {isZh ? '標記排除' : 'Resolve'}
                              </button>
                            )}

                            {/* View Details / Resolution Modal Button */}
                            <button
                              onClick={() => handleOpenHistoryDetail(record)}
                              className="p-1.5 bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg border border-gray-700 transition-colors"
                              title={isZh ? "檢視審計鑑識詳情與處置" : "View Audit Forensics & Resolution"}
                            >
                              <Eye size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredHistory.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <History size={32} className="text-gray-700" />
                          <p className="text-xs font-semibold">{isZh ? '查無符合條件之歷史告警紀錄' : 'No historical alert records match your filter criteria'}</p>
                          <button
                            onClick={() => {
                              setHistorySearchQuery('');
                              setHistorySeverityFilter('all');
                              setHistoryStatusFilter('all');
                              setHistoryEngineFilter('all');
                            }}
                            className="text-xs text-rose-400 hover:underline mt-1"
                          >
                            {isZh ? '重設所有篩選條件' : 'Reset all filters'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer with Audit Integrity Seal */}
            <div className="p-3 border-t border-gray-800 bg-[#13131c] flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-400 gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-400" />
                <span>
                  {isZh 
                    ? '所有記錄均經 SHA-256 加密簽章鎖定，嚴禁後端擅自刪除或修改觸發紀錄。' 
                    : 'All alert records are cryptographically anchored with SHA-256 hashes. Triggers are strictly append-only.'}
                </span>
              </div>
              <div className="font-mono text-[10px] text-gray-500">
                Ledger Status: Verified OK • Total {historyRecords.length} records
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RULE BUILDER & EDITOR */}
      <AnimatePresence>
        {isModalOpen && editingRule && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#121218] border border-gray-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-[#15151c]">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30">
                    <Sliders size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {rules.some(r => r.id === editingRule.id)
                        ? (isZh ? '編輯閥值告警規則' : 'Edit Threshold Rule')
                        : (isZh ? '新增自訂閥值告警規則' : 'Create Threshold Rule')}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {isZh ? '配置指標項目、預警與重大門檻、持續時長以及通報派送管道' : 'Define metric, thresholds, sustain window, and routing'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
                {/* Section 1: Basic Info */}
                <div className="space-y-4">
                  <h4 className="text-[11px] font-bold text-red-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Layers size={13} />
                    {isZh ? '1. 基本資訊與監控目標' : '1. Target & Category'}
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase block">{isZh ? '規則名稱' : 'Rule Name'}</label>
                      <input
                        type="text"
                        value={editingRule.name}
                        onChange={e => setEditingRule({ ...editingRule, name: e.target.value })}
                        placeholder="例如: 伺服器 CPU 連續超載或記憶體耗盡"
                        className="w-full bg-[#181822] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-red-500 font-semibold"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase block">{isZh ? '監控對象範圍 (Scope)' : 'Target Scope'}</label>
                      <input
                        type="text"
                        value={editingRule.targetScope}
                        onChange={e => setEditingRule({ ...editingRule, targetScope: e.target.value })}
                        placeholder="例如: 全域核心架構節點 (All Nodes)"
                        className="w-full bg-[#181822] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-red-500 font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase block">{isZh ? '監控指標項目 (Metric)' : 'Metric Item'}</label>
                      <select
                        value={editingRule.metric}
                        onChange={e => {
                          const mKey = e.target.value;
                          const def = METRIC_DEFINITIONS[mKey];
                          if (def) {
                            setEditingRule({
                              ...editingRule,
                              metric: mKey,
                              metricLabel: def.label,
                              metricUnit: def.unit,
                              category: def.category,
                              warningThreshold: def.defaultWarning,
                              criticalThreshold: def.defaultCritical,
                              condition: def.defaultCondition
                            });
                          }
                        }}
                        className="w-full bg-[#181822] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-red-500 font-semibold"
                      >
                        <optgroup label={isZh ? "系統健康指標 (System Health)" : "System Health"}>
                          <option value="cpu_usage">CPU 使用率 (%)</option>
                          <option value="ram_usage">RAM 記憶體佔用率 (%)</option>
                          <option value="disk_usage">NVMe 磁碟容量佔用率 (%)</option>
                          <option value="io_latency">磁碟落盤寫入延遲 (ms)</option>
                          <option value="queue_saturation">Go 收集器佇列飽和度 (%)</option>
                          <option value="net_drop_rate">網卡封包丟棄率 (pkts/s)</option>
                        </optgroup>
                        <optgroup label={isZh ? "日誌事件量指標 (Log Event Volumes)" : "Log Event Volumes"}>
                          <option value="log_ingest_eps">日誌每秒進線吞吐暴增 (EPS)</option>
                          <option value="log_silence_eps">日誌收集斷流與靜默 (Floor EPS)</option>
                          <option value="parser_drop_rate">解析失敗丟棄速率 (drops/s)</option>
                          <option value="unwritten_buffer_count">記憶體未落盤事件數 (events)</option>
                          <option value="stream_flood_eps">單一來源流量氾濫 (EPS)</option>
                        </optgroup>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase block">{isZh ? '嚴重度分級 (Severity)' : 'Severity'}</label>
                      <select
                        value={editingRule.severity}
                        onChange={e => setEditingRule({ ...editingRule, severity: e.target.value as any })}
                        className="w-full bg-[#181822] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-red-500 font-semibold"
                      >
                        <option value="Critical">Critical (緊急 - 立即處置)</option>
                        <option value="High">High (高風險 - 30分鐘內確認)</option>
                        <option value="Warning">Warning (警告 - 例行排查)</option>
                        <option value="Info">Info (資訊 - 僅日誌記錄)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 2: Thresholds & Timing */}
                <div className="space-y-4 pt-4 border-t border-gray-800">
                  <h4 className="text-[11px] font-bold text-yellow-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Sliders size={13} />
                    {isZh ? '2. 門檻數值與時間視窗' : '2. Thresholds & Timing'}
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase block">{isZh ? '比較條件 (Condition)' : 'Condition'}</label>
                      <select
                        value={editingRule.condition}
                        onChange={e => setEditingRule({ ...editingRule, condition: e.target.value as any })}
                        className="w-full bg-[#181822] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white outline-none font-mono font-bold"
                      >
                        <option value=">=">&gt;= 大於或等於 (Above or Equal)</option>
                        <option value=">">&gt; 大於 (Above)</option>
                        <option value="<=">&lt;= 小於或等於 (Below or Equal - 靜默斷流)</option>
                        <option value="<">&lt; 小於 (Below)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-yellow-400 uppercase block">
                        {isZh ? '警告門檻 (Warning)' : 'Warning Threshold'} ({editingRule.metricUnit})
                      </label>
                      <input
                        type="number"
                        value={editingRule.warningThreshold}
                        onChange={e => setEditingRule({ ...editingRule, warningThreshold: Number(e.target.value) })}
                        className="w-full bg-[#181822] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white font-mono outline-none focus:border-yellow-400"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-red-400 uppercase block">
                        {isZh ? '嚴重門檻 (Critical)' : 'Critical Threshold'} ({editingRule.metricUnit})
                      </label>
                      <input
                        type="number"
                        value={editingRule.criticalThreshold}
                        onChange={e => setEditingRule({ ...editingRule, criticalThreshold: Number(e.target.value) })}
                        className="w-full bg-[#181822] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white font-mono outline-none focus:border-red-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase block">{isZh ? '持續判定時間 (Sustain / For Seconds)' : 'Sustain Duration'}</label>
                      <select
                        value={editingRule.sustainDurationSec}
                        onChange={e => setEditingRule({ ...editingRule, sustainDurationSec: Number(e.target.value) })}
                        className="w-full bg-[#181822] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white outline-none font-bold"
                      >
                        <option value={15}>持續 15 秒 (即時檢測)</option>
                        <option value={30}>持續 30 秒</option>
                        <option value={60}>持續 60 秒 (1 分鐘 - 建議)</option>
                        <option value={120}>持續 120 秒 (2 分鐘)</option>
                        <option value={180}>持續 180 秒 (3 分鐘)</option>
                        <option value={300}>持續 300 秒 (5 分鐘)</option>
                      </select>
                      <span className="text-[10px] text-gray-500">指標需持續超越門檻此秒數方觸發告警，有效杜絕瞬間雜訊。</span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase block">{isZh ? '告警冷卻與抑制時長 (Cooldown Minutes)' : 'Cooldown Period'}</label>
                      <select
                        value={editingRule.cooldownMin}
                        onChange={e => setEditingRule({ ...editingRule, cooldownMin: Number(e.target.value) })}
                        className="w-full bg-[#181822] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white outline-none font-bold"
                      >
                        <option value={5}>5 分鐘</option>
                        <option value={10}>10 分鐘</option>
                        <option value={15}>15 分鐘 (標準防警報疲勞)</option>
                        <option value={30}>30 分鐘</option>
                        <option value={60}>60 分鐘 (1 小時)</option>
                      </select>
                      <span className="text-[10px] text-gray-500">觸發後在此期間內抑制重複通報。</span>
                    </div>
                  </div>
                </div>

                {/* Section 3: Notification Channels */}
                <div className="space-y-4 pt-4 border-t border-gray-800">
                  <h4 className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Mail size={13} />
                    {isZh ? '3. 通報派送管道 (Notification Channels)' : '3. Notification Channels'}
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <label className="flex items-center gap-2 p-3 bg-[#181822] border border-gray-800 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingRule.notificationChannels.email}
                        onChange={e => setEditingRule({
                          ...editingRule,
                          notificationChannels: { ...editingRule.notificationChannels, email: e.target.checked }
                        })}
                        className="rounded accent-red-600"
                      />
                      <span className="font-bold text-gray-200">Email 郵件</span>
                    </label>

                    <label className="flex items-center gap-2 p-3 bg-[#181822] border border-gray-800 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingRule.notificationChannels.webhook}
                        onChange={e => setEditingRule({
                          ...editingRule,
                          notificationChannels: { ...editingRule.notificationChannels, webhook: e.target.checked }
                        })}
                        className="rounded accent-red-600"
                      />
                      <span className="font-bold text-gray-200">Slack Webhook</span>
                    </label>

                    <label className="flex items-center gap-2 p-3 bg-[#181822] border border-gray-800 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingRule.notificationChannels.syslog}
                        onChange={e => setEditingRule({
                          ...editingRule,
                          notificationChannels: { ...editingRule.notificationChannels, syslog: e.target.checked }
                        })}
                        className="rounded accent-red-600"
                      />
                      <span className="font-bold text-gray-200">Syslog 轉發</span>
                    </label>

                    <label className="flex items-center gap-2 p-3 bg-[#181822] border border-gray-800 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingRule.notificationChannels.inApp}
                        onChange={e => setEditingRule({
                          ...editingRule,
                          notificationChannels: { ...editingRule.notificationChannels, inApp: e.target.checked }
                        })}
                        className="rounded accent-red-600"
                      />
                      <span className="font-bold text-gray-200">In-App 提示</span>
                    </label>
                  </div>
                </div>

                {/* Section 4: Descriptions & SOP */}
                <div className="space-y-3 pt-4 border-t border-gray-800">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase block">{isZh ? '規則說明 (Description)' : 'Description'}</label>
                    <textarea
                      rows={2}
                      value={editingRule.description}
                      onChange={e => setEditingRule({ ...editingRule, description: e.target.value })}
                      placeholder="簡要描述觸發此規則時可能發生之威脅或系統瓶頸"
                      className="w-full bg-[#181822] border border-gray-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-red-500 resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase block">{isZh ? '應變處理建議 (Remediation SOP Hint)' : 'SOP Hint'}</label>
                    <input
                      type="text"
                      value={editingRule.remediationHint}
                      onChange={e => setEditingRule({ ...editingRule, remediationHint: e.target.value })}
                      placeholder="提供 SOC 值班人員的快速處理指引"
                      className="w-full bg-[#181822] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-red-500"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-gray-800 bg-[#15151c] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded-lg text-xs font-bold transition-all"
                >
                  {isZh ? '取消' : 'Cancel'}
                </button>

                <button
                  type="button"
                  onClick={handleSaveModalRule}
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                >
                  <Save size={13} />
                  {isZh ? '確認儲存規則' : 'Save Rule'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: ALERT HISTORY DETAIL & RESOLUTION WORKFLOW */}
      <AnimatePresence>
        {isDetailModalOpen && selectedHistoryRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#121218] border border-gray-800 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-[#15151e]">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30">
                    <History size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-extrabold bg-black/50 text-gray-300 border border-gray-800">
                        {selectedHistoryRecord.id}
                      </span>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border",
                        selectedHistoryRecord.severity === 'Critical' ? "bg-red-950/80 text-red-300 border-red-700" :
                        selectedHistoryRecord.severity === 'High' ? "bg-orange-950/80 text-orange-300 border-orange-700" :
                        selectedHistoryRecord.severity === 'Warning' ? "bg-amber-950/80 text-amber-300 border-amber-700" :
                        "bg-sky-950/80 text-sky-300 border-sky-700"
                      )}>
                        {selectedHistoryRecord.severity}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white mt-1">
                      {isZh ? '告警事件鑑識報告與處置追蹤' : 'Alert Event Forensics & Resolution Audit'}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
                {/* Cryptographic Proof Banner */}
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-gray-900 to-[#161622] border border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1.5">
                      <ShieldCheck size={13} className="text-emerald-400" />
                      <span>{isZh ? '密碼學不可篡改審計雜湊 (SHA-256 Hash)' : 'Cryptographic Audit Proof (SHA-256)'}</span>
                    </div>
                    <div className="font-mono text-[11px] text-gray-300 break-all select-all">
                      {selectedHistoryRecord.auditHash}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedHistoryRecord.auditHash);
                      showToast(isZh ? '已複製 SHA-256 審計雜湊' : 'Copied SHA-256 Audit Hash');
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 flex items-center gap-1.5 shrink-0 self-start sm:self-auto text-xs"
                  >
                    <Copy size={12} />
                    <span>{isZh ? '複製雜湊' : 'Copy'}</span>
                  </button>
                </div>

                {/* Section 1: Trigger Forensic Matrix */}
                <div className="space-y-3">
                  <div className="text-[11px] uppercase font-bold text-rose-400 tracking-wider flex items-center gap-2">
                    <AlertTriangle size={14} />
                    <span>{isZh ? '觸發事件原始快照 (Trigger Snapshot)' : 'Trigger Telemetry Snapshot'}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-[#16161f] border border-gray-800">
                      <span className="text-[10px] text-gray-400 uppercase block font-bold">{isZh ? '觸發時間戳記 (UTC / Local)' : 'Timestamp'}</span>
                      <div className="text-xs font-mono font-semibold text-white mt-1">
                        {new Date(selectedHistoryRecord.triggerTime).toUTCString()}
                      </div>
                      <div className="text-[11px] font-mono text-gray-400 mt-0.5">
                        {new Date(selectedHistoryRecord.triggerTime).toLocaleString()}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#16161f] border border-gray-800">
                      <span className="text-[10px] text-gray-400 uppercase block font-bold">{isZh ? '告警來源引擎 (Source Engine)' : 'Source Engine'}</span>
                      <div className="text-xs font-semibold text-white mt-1 flex items-center gap-1.5">
                        <Server size={13} className="text-indigo-400" />
                        <span>{selectedHistoryRecord.sourceEngine}</span>
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        {selectedHistoryRecord.category === 'system_health' ? (isZh ? '分類: 系統健康指標' : 'Category: System Health') : (isZh ? '分類: 日誌吞吐量' : 'Category: Log Volume')}
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#16161f] border border-gray-800 space-y-2">
                    <span className="text-[10px] text-gray-400 uppercase block font-bold">{isZh ? '判定規則與違規數值' : 'Rule & Measured Breach'}</span>
                    <div className="text-sm font-bold text-white">
                      {selectedHistoryRecord.ruleName}
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#111116] border border-gray-800/80 font-mono text-xs flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <span className="text-gray-400">{isZh ? '實測數值:' : 'Measured:'} </span>
                        <span className="text-red-400 font-bold text-sm">
                          {typeof selectedHistoryRecord.measuredValue === 'number' ? selectedHistoryRecord.measuredValue.toLocaleString() : selectedHistoryRecord.measuredValue} {selectedHistoryRecord.metricUnit}
                        </span>
                      </div>
                      <div className="text-gray-500 font-bold">
                        {selectedHistoryRecord.condition}
                      </div>
                      <div>
                        <span className="text-gray-400">{isZh ? '閥值門檻:' : 'Threshold:'} </span>
                        <span className="text-gray-200 font-bold">
                          {typeof selectedHistoryRecord.thresholdValue === 'number' ? selectedHistoryRecord.thresholdValue.toLocaleString() : selectedHistoryRecord.thresholdValue} {selectedHistoryRecord.metricUnit}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">{isZh ? '指標項:' : 'Metric:'} </span>
                        <span className="text-gray-300 font-bold">{selectedHistoryRecord.metricLabel} ({selectedHistoryRecord.metric})</span>
                      </div>
                    </div>
                  </div>

                  {/* Dispatched Delivery Proof */}
                  <div className="p-3 rounded-xl bg-[#16161f] border border-gray-800">
                    <span className="text-[10px] text-gray-400 uppercase block font-bold mb-2">{isZh ? '多管道通報派送紀錄' : 'Dispatched Channels Delivery Log'}</span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {['email', 'webhook', 'syslog', 'inApp', 'soar'].map(ch => {
                        const isDispatched = selectedHistoryRecord.dispatchedChannels.includes(ch);
                        return (
                          <div 
                            key={ch}
                            className={cn(
                              "p-2 rounded-lg border text-center transition-all",
                              isDispatched 
                                ? "bg-emerald-950/30 border-emerald-800/60 text-emerald-300" 
                                : "bg-gray-900/30 border-gray-800 text-gray-600"
                            )}
                          >
                            <div className="text-[10px] font-bold uppercase">{ch}</div>
                            <div className="text-[9px] font-mono mt-0.5">
                              {isDispatched ? '✓ DELIVERED' : '– NOT_CONFIG'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Section 2: Resolution & Operator Tracking Form */}
                <div className="space-y-4 pt-4 border-t border-gray-800">
                  <div className="text-[11px] uppercase font-bold text-blue-400 tracking-wider flex items-center gap-2">
                    <CheckCircle2 size={14} />
                    <span>{isZh ? '處置與調查紀錄維護 (Resolution & Remediation)' : 'Resolution & Remediation Audit'}</span>
                  </div>

                  {/* Resolution Status Select */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase block">
                      {isZh ? '處置狀態 (Resolution Status)' : 'Resolution Status'}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {[
                        { id: 'Active', label: isZh ? '警報中 (Active)' : 'Active' },
                        { id: 'Investigating', label: isZh ? '調查中 (Investigating)' : 'Investigating' },
                        { id: 'Acknowledged', label: isZh ? '已確認 (Acknowledged)' : 'Acknowledged' },
                        { id: 'Resolved', label: isZh ? '已排除 (Resolved)' : 'Resolved' },
                        { id: 'Auto-Remediated', label: isZh ? '自動自癒 (Auto)' : 'Auto-Remediated' }
                      ].map(st => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setEditResolutionStatus(st.id as any)}
                          className={cn(
                            "p-2 rounded-lg border text-xs font-bold transition-all text-center",
                            editResolutionStatus === st.id
                              ? st.id === 'Active' ? "bg-red-600 text-white border-red-500" :
                                st.id === 'Investigating' ? "bg-amber-600 text-white border-amber-500" :
                                st.id === 'Acknowledged' ? "bg-blue-600 text-white border-blue-500" :
                                st.id === 'Resolved' ? "bg-emerald-600 text-white border-emerald-500" :
                                "bg-purple-600 text-white border-purple-500"
                              : "bg-[#181822] text-gray-400 border-gray-800 hover:text-gray-200"
                          )}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Operator / Resolver Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase block">
                      {isZh ? '處置人員 / 負責工程師 (Resolver / Operator ID)' : 'Resolver / Operator ID'}
                    </label>
                    <div className="relative">
                      <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="text"
                        value={editResolvedBy}
                        onChange={e => setEditResolvedBy(e.target.value)}
                        placeholder="e.g., soc-analyst-1, infra-admin"
                        className="w-full bg-[#181822] border border-gray-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-rose-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Resolution Notes */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase block">
                      {isZh ? '應變處理措施與排除紀錄說明 (Remediation Actions & Root Cause Notes)' : 'Remediation Notes'}
                    </label>
                    <textarea
                      rows={3}
                      value={editResolutionNote}
                      onChange={e => setEditResolutionNote(e.target.value)}
                      placeholder={isZh ? "請詳細填寫故障成因、應變 SOP 執行細節、流量抑制措施或資源調度紀錄..." : "Describe root cause, applied mitigations, SOP steps executed..."}
                      className="w-full bg-[#181822] border border-gray-800 rounded-lg p-3 text-xs text-white outline-none focus:border-rose-500 resize-none leading-relaxed"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-gray-800 bg-[#15151e] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded-lg text-xs font-bold transition-all"
                >
                  {isZh ? '關閉' : 'Close'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isUpdatingStatus}
                    onClick={handleSaveResolution}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                  >
                    <Save size={13} />
                    <span>{isUpdatingStatus ? (isZh ? '儲存中...' : 'Saving...') : (isZh ? '儲存處置狀態' : 'Save Resolution')}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
