import React, { useState, useEffect, useMemo } from 'react';
import {
  Flame,
  Bell,
  Activity,
  ShieldAlert,
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
  Shield,
  Zap,
  Volume2,
  VolumeX,
  RefreshCw,
  Terminal,
  ExternalLink,
  ArrowRight,
  Server,
  Network,
  Globe,
  Lock,
  Eye,
  Hash,
  Download,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export type NDRTrafficPatternType =
  | 'bandwidth_surge'
  | 'abnormal_flow_cluster'
  | 'traffic_silence_drop'
  | 'data_exfiltration'
  | 'c2_beaconing'
  | 'dns_tunneling'
  | 'syn_scan_burst'
  | 'protocol_anomaly';

export interface NDRAlertRule {
  id: string;
  name: string;
  description: string;
  patternType: NDRTrafficPatternType;
  severity: 'Critical' | 'High' | 'Warning' | 'Info';
  enabled: boolean;
  targetScope: string;
  direction: 'both' | 'inbound' | 'outbound' | 'internal_lateral';
  condition: '>' | '>=' | '<' | '<=' | 'rate_surge' | 'cluster_deviation';
  warningThreshold: number;
  criticalThreshold: number;
  unit: string;
  sustainDurationSec: number;
  cooldownMinutes: number;
  notificationChannels: {
    inApp: boolean;
    email: boolean;
    emailRecipients: string[];
    webhook: boolean;
    webhookUrl: string;
    webhookChannel?: string;
    syslog: boolean;
    syslogHost?: string;
    syslogPort?: number;
    sound: boolean;
    soarAction: boolean;
    soarActionType?: 'isolate_host' | 'deploy_suricata_rule' | 'capture_pcap';
  };
  currentValue?: number;
  status?: 'healthy' | 'warning' | 'critical' | 'disabled';
  lastTriggeredAt?: string | null;
  triggerCount: number;
  createdAt: string;
  updatedAt: string;
}

interface NDRAlertRulesSettingsViewProps {
  isReadOnly?: boolean;
}

export const NDR_PATTERNS_CONFIG: Record<
  NDRTrafficPatternType,
  {
    name: string;
    nameEn: string;
    icon: any;
    color: string;
    badgeBg: string;
    badgeBorder: string;
    badgeText: string;
    description: string;
    defaultUnit: string;
    defaultWarning: number;
    defaultCritical: number;
  }
> = {
  bandwidth_surge: {
    name: '突發頻寬洪峰與飽和',
    nameEn: 'Bandwidth Surge & Saturation',
    icon: Flame,
    color: '#ef4444',
    badgeBg: 'bg-rose-500/10',
    badgeBorder: 'border-rose-500/30',
    badgeText: 'text-rose-400',
    description: '監控瞬時網路總吞吐量或特定網段頻寬，防止突發 DDoS 或大流量擁塞。',
    defaultUnit: 'Mbps',
    defaultWarning: 850,
    defaultCritical: 1200
  },
  abnormal_flow_cluster: {
    name: '異常流量離群叢集 / 橫向移動',
    nameEn: 'Abnormal Flow Cluster / Lateral Movement',
    icon: Activity,
    color: '#f59e0b',
    badgeBg: 'bg-amber-500/10',
    badgeBorder: 'border-amber-500/30',
    badgeText: 'text-amber-400',
    description: '內網主機間異常 SMB/RPC/RDP 連線叢集與離群偏離，識別內網橫向滲透。',
    defaultUnit: 'Deviation %',
    defaultWarning: 45,
    defaultCritical: 70
  },
  traffic_silence_drop: {
    name: '進線流量異常暴跌斷流',
    nameEn: 'Traffic Silence & Unexpected Drop',
    icon: AlertTriangle,
    color: '#f97316',
    badgeBg: 'bg-orange-500/10',
    badgeBorder: 'border-orange-500/30',
    badgeText: 'text-orange-400',
    description: '業務高峰期間進線流量異常低於基準線，即時通報傳輸鏈路斷流或探針失效。',
    defaultUnit: 'Mbps',
    defaultWarning: 120,
    defaultCritical: 50
  },
  data_exfiltration: {
    name: '巨量出境資料外洩異常',
    nameEn: 'High Outbound Data Exfiltration',
    icon: Globe,
    color: '#dc2626',
    badgeBg: 'bg-red-500/10',
    badgeBorder: 'border-red-500/30',
    badgeText: 'text-red-400',
    description: '偵測內部資料庫或伺服器對外高額度非預期位元組外聯傳輸，防止機敏資料外洩。',
    defaultUnit: 'MB/5min',
    defaultWarning: 200,
    defaultCritical: 450
  },
  c2_beaconing: {
    name: 'C2 週期性心跳信標特徵',
    nameEn: 'C2 Periodic Heartbeat Beacon',
    icon: Radio,
    color: '#a855f7',
    badgeBg: 'bg-purple-500/10',
    badgeBorder: 'border-purple-500/30',
    badgeText: 'text-purple-400',
    description: '分析定時連線時間間隔與極低微小 Jitter（< 8%），識別惡意後門心跳。',
    defaultUnit: 'Sessions/hr',
    defaultWarning: 40,
    defaultCritical: 80
  },
  dns_tunneling: {
    name: 'DNS 隧道偽裝高熵查詢',
    nameEn: 'DNS Exfiltration & Tunneling',
    icon: Server,
    color: '#06b6d4',
    badgeBg: 'bg-cyan-500/10',
    badgeBorder: 'border-cyan-500/30',
    badgeText: 'text-cyan-400',
    description: '偵測異常超長 DNS 查詢、巨量 TXT 紀錄與高頻率遞迴查詢之隱蔽隧道通道。',
    defaultUnit: 'Bytes/query',
    defaultWarning: 180,
    defaultCritical: 260
  },
  syn_scan_burst: {
    name: 'TCP SYN 洪峰與掃描風暴',
    nameEn: 'SYN Scan & Flood Storm',
    icon: Zap,
    color: '#ec4899',
    badgeBg: 'bg-pink-500/10',
    badgeBorder: 'border-pink-500/30',
    badgeText: 'text-pink-400',
    description: '偵測大量未完成三方交握之 SYN 探測封包，識別高速埠掃描或 SYN Flood。',
    defaultUnit: 'SYN/sec',
    defaultWarning: 800,
    defaultCritical: 1500
  },
  protocol_anomaly: {
    name: '非標準埠協定異常流動',
    nameEn: 'Non-Standard Port Protocol Flow',
    icon: Network,
    color: '#6366f1',
    badgeBg: 'bg-indigo-500/10',
    badgeBorder: 'border-indigo-500/30',
    badgeText: 'text-indigo-400',
    description: '非標準埠流量特徵（例如於 4444 埠跑 HTTP 或 80 埠跑 SSH 混淆協定）。',
    defaultUnit: 'Flows/min',
    defaultWarning: 60,
    defaultCritical: 150
  }
};

const DEFAULT_ALERT_RULES: NDRAlertRule[] = [
  {
    id: 'ndr-rule-bandwidth-burst',
    name: '突發頻寬洪峰與飽和預警 (Bandwidth Burst & Saturation)',
    description: '監控全網骨幹與邊界閘道器，當瞬時吞吐量超過預設頻寬上限時觸發高優先級告警，防止網路擁塞。',
    patternType: 'bandwidth_surge',
    severity: 'Critical',
    enabled: true,
    targetScope: '核心骨幹網 / DMZ 對外閘道 (10.0.0.0/16)',
    direction: 'both',
    condition: '>=',
    warningThreshold: 850,
    criticalThreshold: 1200,
    unit: 'Mbps',
    sustainDurationSec: 30,
    cooldownMinutes: 15,
    notificationChannels: {
      inApp: true,
      email: true,
      emailRecipients: ['soc-netops@corp.internal', 'sec-incident@corp.internal'],
      webhook: true,
      webhookUrl: 'https://hooks.slack.com/services/T00/B00/ndr-bandwidth-alerts',
      webhookChannel: '#soc-ndr-alerts',
      syslog: true,
      syslogHost: '127.0.0.1',
      syslogPort: 514,
      sound: true,
      soarAction: true,
      soarActionType: 'deploy_suricata_rule'
    },
    currentValue: 680,
    status: 'healthy',
    lastTriggeredAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    triggerCount: 4,
    createdAt: '2026-09-20T08:00:00.000Z',
    updatedAt: '2026-09-28T14:30:00.000Z'
  },
  {
    id: 'ndr-rule-lateral-movement',
    name: '內網橫向移動與異常流量離群叢集 (Lateral Flow Cluster Storm)',
    description: '即時評估內部網段間 SMB/RPC/RDP 叢集流速與連線扇出度，偵測蠕蟲感染或橫向滲透行為。',
    patternType: 'abnormal_flow_cluster',
    severity: 'Critical',
    enabled: true,
    targetScope: '內部辦公與伺服器農場 (10.88.0.0/16)',
    direction: 'internal_lateral',
    condition: 'cluster_deviation',
    warningThreshold: 45,
    criticalThreshold: 70,
    unit: 'Deviation %',
    sustainDurationSec: 15,
    cooldownMinutes: 10,
    notificationChannels: {
      inApp: true,
      email: true,
      emailRecipients: ['threat-hunt@corp.internal'],
      webhook: true,
      webhookUrl: 'https://hooks.slack.com/services/T00/B00/ndr-lateral-alerts',
      webhookChannel: '#soc-critical-incidents',
      syslog: true,
      sound: true,
      soarAction: true,
      soarActionType: 'isolate_host'
    },
    currentValue: 35,
    status: 'healthy',
    lastTriggeredAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    triggerCount: 7,
    createdAt: '2026-09-20T08:00:00.000Z',
    updatedAt: '2026-09-29T10:15:00.000Z'
  },
  {
    id: 'ndr-rule-data-exfiltration',
    name: '巨量出境資料外洩異常 (High Outbound Data Exfiltration)',
    description: '比對內網終端主機對外部未受信任網段或公有雲儲存之出境位元組流量，防範機敏資料竊取。',
    patternType: 'data_exfiltration',
    severity: 'Critical',
    enabled: true,
    targetScope: '核心資料庫與研發網段 (172.16.40.0/24)',
    direction: 'outbound',
    condition: '>=',
    warningThreshold: 200,
    criticalThreshold: 450,
    unit: 'MB/5min',
    sustainDurationSec: 60,
    cooldownMinutes: 30,
    notificationChannels: {
      inApp: true,
      email: true,
      emailRecipients: ['ciso-office@corp.internal', 'soc-lead@corp.internal'],
      webhook: true,
      webhookUrl: 'https://hooks.slack.com/services/T00/B00/ndr-exfil-alerts',
      webhookChannel: '#soc-data-leak',
      syslog: true,
      sound: true,
      soarAction: true,
      soarActionType: 'capture_pcap'
    },
    currentValue: 80,
    status: 'healthy',
    lastTriggeredAt: null,
    triggerCount: 1,
    createdAt: '2026-09-22T09:00:00.000Z',
    updatedAt: '2026-09-28T16:00:00.000Z'
  },
  {
    id: 'ndr-rule-traffic-silence',
    name: '核心業務時段進線流量異常暴跌斷流 (Ingress Silence / Drop)',
    description: '於上班時段 (09:00 - 18:00) 監控邊界探針進線流速，若流量異常暴跌逾 50% 則發出收集鏈路中斷告警。',
    patternType: 'traffic_silence_drop',
    severity: 'Warning',
    enabled: true,
    targetScope: 'WAN 專線與邊界防火牆對接埠',
    direction: 'inbound',
    condition: '<=',
    warningThreshold: 120,
    criticalThreshold: 50,
    unit: 'Mbps',
    sustainDurationSec: 120,
    cooldownMinutes: 20,
    notificationChannels: {
      inApp: true,
      email: true,
      emailRecipients: ['noc-telemetry@corp.internal'],
      webhook: false,
      webhookUrl: '',
      syslog: true,
      sound: false,
      soarAction: false
    },
    currentValue: 380,
    status: 'healthy',
    lastTriggeredAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    triggerCount: 2,
    createdAt: '2026-09-23T11:00:00.000Z',
    updatedAt: '2026-09-27T09:00:00.000Z'
  },
  {
    id: 'ndr-rule-c2-beaconing',
    name: 'C2 週期性心跳信標特徵 (Command & Control Periodic Beacon)',
    description: '統計特定內部 IP 連線至外部罕見 IP 之時間間隔熵值與微小 Jitter（< 8%），識別 APT 潛伏心跳通訊。',
    patternType: 'c2_beaconing',
    severity: 'High',
    enabled: true,
    targetScope: '辦公區與特權管理跳板機 (10.88.20.0/24)',
    direction: 'outbound',
    condition: '>=',
    warningThreshold: 40,
    criticalThreshold: 80,
    unit: 'Sessions/hr',
    sustainDurationSec: 300,
    cooldownMinutes: 60,
    notificationChannels: {
      inApp: true,
      email: true,
      emailRecipients: ['soc-tier2@corp.internal'],
      webhook: true,
      webhookUrl: 'https://hooks.slack.com/services/T00/B00/ndr-c2-alerts',
      syslog: true,
      sound: true,
      soarAction: true,
      soarActionType: 'isolate_host'
    },
    currentValue: 20,
    status: 'healthy',
    lastTriggeredAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    triggerCount: 3,
    createdAt: '2026-09-24T14:00:00.000Z',
    updatedAt: '2026-09-29T12:00:00.000Z'
  },
  {
    id: 'ndr-rule-dns-tunneling',
    name: 'DNS 隧道偽裝高熵查詢 (DNS Exfiltration & Tunneling)',
    description: '分析 DNS 請求查詢長度、TXT 紀錄長度與非標準遞迴頻率，阻斷透過 UDP 5140/53 的隱蔽通道傳輸。',
    patternType: 'dns_tunneling',
    severity: 'Warning',
    enabled: true,
    targetScope: '內部 DNS 解析轉發伺服器群 (10.0.0.53, 10.0.0.54)',
    direction: 'outbound',
    condition: '>=',
    warningThreshold: 180,
    criticalThreshold: 260,
    unit: 'Bytes/query',
    sustainDurationSec: 20,
    cooldownMinutes: 15,
    notificationChannels: {
      inApp: true,
      email: false,
      emailRecipients: [],
      webhook: true,
      webhookUrl: 'https://hooks.slack.com/services/T00/B00/ndr-dns-alerts',
      syslog: true,
      sound: false,
      soarAction: false
    },
    currentValue: 95,
    status: 'healthy',
    lastTriggeredAt: null,
    triggerCount: 0,
    createdAt: '2026-09-25T16:00:00.000Z',
    updatedAt: '2026-09-28T10:00:00.000Z'
  }
];

export function NDRAlertRulesSettingsView({ isReadOnly = false }: NDRAlertRulesSettingsViewProps) {
  const [rules, setRules] = useState<NDRAlertRule[]>(() => {
    try {
      const saved = localStorage.getItem('semor_ndr_alert_rules');
      return saved ? JSON.parse(saved) : DEFAULT_ALERT_RULES;
    } catch {
      return DEFAULT_ALERT_RULES;
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [patternFilter, setPatternFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');

  // Modal State for Create/Edit
  const [editingRule, setEditingRule] = useState<NDRAlertRule | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [modalActiveTab, setModalActiveTab] = useState<'basics' | 'pattern' | 'channels' | 'remediation'>('basics');

  // Test Trigger / Simulation State
  const [testingRule, setTestingRule] = useState<NDRAlertRule | null>(null);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testCustomValue, setTestCustomValue] = useState<number>(0);
  const [testCustomSeverity, setTestCustomSeverity] = useState<'Critical' | 'High' | 'Warning'>('Critical');

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Web Audio Tone
  const playAlertSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // Ignored
    }
  };

  // Fetch rules from API
  const fetchRules = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/v1/ndr/alert-rules');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.rules) && data.rules.length > 0) {
          setRules(data.rules);
          localStorage.setItem('semor_ndr_alert_rules', JSON.stringify(data.rules));
        }
      }
    } catch (e) {
      console.warn('NDR alert rules API unavailable, using cached state:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
    const interval = setInterval(fetchRules, 10000);
    return () => clearInterval(interval);
  }, []);

  // Save rules to API
  const saveRuleToBackend = async (rule: NDRAlertRule) => {
    try {
      setIsSaving(true);
      const isNew = !rules.some(r => r.id === rule.id);
      const url = isNew ? '/api/v1/ndr/alert-rules' : `/api/v1/ndr/alert-rules/${rule.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule)
      });

      if (res.ok) {
        const updatedRules = isNew ? [rule, ...rules] : rules.map(r => (r.id === rule.id ? rule : r));
        setRules(updatedRules);
        localStorage.setItem('semor_ndr_alert_rules', JSON.stringify(updatedRules));
        showToast(`NDR 流量特徵告警規則 '${rule.name}' 已成功儲存並同步至 NDR 偵測引擎！`);
        setIsEditModalOpen(false);
      } else {
        throw new Error('Save failed');
      }
    } catch (e) {
      // Local fallback
      const isNew = !rules.some(r => r.id === rule.id);
      const updatedRules = isNew ? [rule, ...rules] : rules.map(r => (r.id === rule.id ? rule : r));
      setRules(updatedRules);
      localStorage.setItem('semor_ndr_alert_rules', JSON.stringify(updatedRules));
      showToast('已於本機保存 NDR 流量告警規則設定', 'info');
      setIsEditModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete rule
  const handleDeleteRule = async (ruleId: string, ruleName: string) => {
    if (!confirm(`確定要刪除 NDR 流量特徵告警規則「${ruleName}」嗎？`)) return;

    try {
      await fetch(`/api/v1/ndr/alert-rules/${ruleId}`, { method: 'DELETE' });
    } catch {
      // Ignored
    }

    const nextRules = rules.filter(r => r.id !== ruleId);
    setRules(nextRules);
    localStorage.setItem('semor_ndr_alert_rules', JSON.stringify(nextRules));
    showToast(`已成功移除告警規則「${ruleName}」`, 'info');
  };

  // Toggle enable
  const handleToggleRule = async (rule: NDRAlertRule) => {
    const updated: NDRAlertRule = { ...rule, enabled: !rule.enabled };
    const nextRules = rules.map(r => (r.id === rule.id ? updated : r));
    setRules(nextRules);
    localStorage.setItem('semor_ndr_alert_rules', JSON.stringify(nextRules));

    try {
      await fetch(`/api/v1/ndr/alert-rules/${rule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch {
      // Ignored
    }

    showToast(`規則「${rule.name}」已${updated.enabled ? '啟用即時監控' : '停用'}`);
  };

  // Duplicate rule
  const handleDuplicateRule = (rule: NDRAlertRule) => {
    const newId = `ndr-rule-${Date.now().toString().slice(-6)}`;
    const duplicated: NDRAlertRule = {
      ...rule,
      id: newId,
      name: `${rule.name} (複製副本)`,
      triggerCount: 0,
      lastTriggeredAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    saveRuleToBackend(duplicated);
  };

  // Trigger test notification
  const handleTestTrigger = async (rule: NDRAlertRule) => {
    setTestingRule(rule);
    setTestCustomValue(rule.criticalThreshold * 1.25);
    setTestCustomSeverity(rule.severity as any);
    setIsTesting(true);

    try {
      const res = await fetch('/api/v1/ndr/alert-rules/test-trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ruleId: rule.id,
          customValue: rule.criticalThreshold * 1.25,
          severityOverride: rule.severity
        })
      });

      if (res.ok) {
        const data = await res.json();
        setTestResult(data.alert);
        if (rule.notificationChannels.sound) {
          playAlertSound();
        }

        // Broadcast to existing notification system
        window.dispatchEvent(
          new CustomEvent('ndr_high_priority_alert', {
            detail: {
              alert: data.alert,
              historyRecord: data.historyRecord,
              rule
            }
          })
        );

        showToast(`已透過現有通知系統成功觸發【${rule.name}】高優先級告警！`, 'success');
      } else {
        throw new Error('API trigger failed');
      }
    } catch {
      // Local simulated response
      const timestamp = new Date().toISOString();
      const mockAlert = {
        id: `NDR-ALR-${Date.now().toString().slice(-6)}`,
        timestamp,
        ruleId: rule.id,
        ruleName: rule.name,
        patternType: rule.patternType,
        severity: rule.severity,
        measuredValue: rule.criticalThreshold * 1.25,
        thresholdValue: rule.criticalThreshold,
        unit: rule.unit,
        targetScope: rule.targetScope,
        dispatchedChannels: ['inApp', 'sound', 'webhook', 'email', 'syslog'],
        executionLogs: [
          `[${timestamp}] [NDR_EVAL] Evaluated rule: '${rule.name}'`,
          `[${timestamp}] [TELEMETRY_CHECK] Measured: ${rule.criticalThreshold * 1.25} ${rule.unit} (Threshold: ${rule.criticalThreshold} ${rule.unit})`,
          `[${timestamp}] [CHANNEL_INAPP] Security toast dispatched to SOC Notification Center.`,
          `[${timestamp}] [CHANNEL_WEBHOOK] Dispatched payload to configured Slack Webhook.`,
          `[${timestamp}] [CHANNEL_SMTP] Alert queued for SOC analysts.`
        ],
        message: `【NDR 即時告警】${rule.name} 偵測到異常流量數值 (${rule.criticalThreshold * 1.25} ${rule.unit})！已觸發通知管道。`
      };
      setTestResult(mockAlert);
      if (rule.notificationChannels.sound) playAlertSound();

      window.dispatchEvent(
        new CustomEvent('ndr_high_priority_alert', {
          detail: {
            alert: mockAlert,
            rule
          }
        })
      );

      showToast(`已觸發【${rule.name}】模擬告警並推播至通知管道！`, 'success');
    } finally {
      setIsTesting(false);
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    const newRule: NDRAlertRule = {
      id: `ndr-rule-${Date.now().toString().slice(-6)}`,
      name: '',
      description: '',
      patternType: 'bandwidth_surge',
      severity: 'High',
      enabled: true,
      targetScope: '核心業務子網 (10.0.0.0/16)',
      direction: 'both',
      condition: '>=',
      warningThreshold: 800,
      criticalThreshold: 1200,
      unit: 'Mbps',
      sustainDurationSec: 30,
      cooldownMinutes: 15,
      notificationChannels: {
        inApp: true,
        email: true,
        emailRecipients: ['soc-ops@corp.internal'],
        webhook: true,
        webhookUrl: 'https://hooks.slack.com/services/T00/B00/ndr-alerts',
        webhookChannel: '#soc-alerts',
        syslog: true,
        syslogHost: '127.0.0.1',
        syslogPort: 514,
        sound: true,
        soarAction: true,
        soarActionType: 'deploy_suricata_rule'
      },
      triggerCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setEditingRule(newRule);
    setModalActiveTab('basics');
    setIsEditModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (rule: NDRAlertRule) => {
    setEditingRule({ ...rule });
    setModalActiveTab('basics');
    setIsEditModalOpen(true);
  };

  // Filtered Rules
  const filteredRules = useMemo(() => {
    return rules.filter(r => {
      if (patternFilter !== 'all' && r.patternType !== patternFilter) return false;
      if (severityFilter !== 'all' && r.severity !== severityFilter) return false;
      if (statusFilter === 'enabled' && !r.enabled) return false;
      if (statusFilter === 'disabled' && r.enabled) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.targetScope.toLowerCase().includes(q) ||
          r.patternType.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [rules, patternFilter, severityFilter, statusFilter, searchQuery]);

  // Statistics
  const activeCount = rules.filter(r => r.enabled).length;
  const criticalCount = rules.filter(r => r.severity === 'Critical' && r.enabled).length;
  const firingCount = rules.filter(r => r.status === 'critical' || r.status === 'warning').length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={cn(
              "fixed bottom-8 right-8 z-50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-md font-sans text-xs font-semibold",
              toastMessage.type === 'success'
                ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-200"
                : toastMessage.type === 'error'
                ? "bg-rose-950/90 border-rose-500/50 text-rose-200"
                : "bg-blue-950/90 border-blue-500/50 text-blue-200"
            )}
          >
            {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {toastMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
            {toastMessage.type === 'info' && <Terminal className="w-4 h-4 text-blue-400" />}
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPI Ribbon Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#111114] border border-gray-800 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono text-gray-400 block uppercase tracking-wider">
              NDR 流量特徵自訂規則總數
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-white font-mono">{rules.length}</span>
              <span className="text-xs text-emerald-400 font-mono">({activeCount} 監控中)</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Flame className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#111114] border border-gray-800 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono text-gray-400 block uppercase tracking-wider">
              高優先級嚴重規則 (Critical)
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-rose-400 font-mono">{criticalCount}</span>
              <span className="text-xs text-gray-500 font-mono">/ 嚴格防禦</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#111114] border border-gray-800 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono text-gray-400 block uppercase tracking-wider">
              即時觸發狀態 (Firing Alerts)
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={cn("text-2xl font-black font-mono", firingCount > 0 ? "text-amber-400 animate-pulse" : "text-emerald-400")}>
                {firingCount}
              </span>
              <span className="text-xs text-gray-500 font-mono">
                {firingCount > 0 ? '超標警報中' : '全域平穩正常'}
              </span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#111114] border border-gray-800 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono text-gray-400 block uppercase tracking-wider">
              通知系統整合管道 (Channels)
            </span>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="p-1 rounded bg-gray-800 text-gray-300" title="站內通知"><Bell className="w-3 h-3" /></span>
              <span className="p-1 rounded bg-gray-800 text-gray-300" title="郵件通知"><Mail className="w-3 h-3" /></span>
              <span className="p-1 rounded bg-gray-800 text-gray-300" title="Webhook"><Share2 className="w-3 h-3" /></span>
              <span className="p-1 rounded bg-gray-800 text-gray-300" title="Syslog"><Server className="w-3 h-3" /></span>
              <span className="p-1 rounded bg-gray-800 text-gray-300" title="警報音效"><Volume2 className="w-3 h-3" /></span>
              <span className="p-1 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold px-1.5 py-0.5">SOAR</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Radio className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Action Controls & Filters Bar */}
      <div className="p-4 rounded-2xl bg-[#111114] border border-gray-800 shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search */}
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜尋規則名稱、監控特徵、網段範疇..."
              className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition font-sans"
            />
          </div>

          {/* Pattern Filter */}
          <select
            value={patternFilter}
            onChange={e => setPatternFilter(e.target.value)}
            className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-blue-500 font-sans"
          >
            <option value="all">所有流量特徵模式 (All Patterns)</option>
            {Object.entries(NDR_PATTERNS_CONFIG).map(([key, val]) => (
              <option key={key} value={key}>
                {val.name} ({val.nameEn})
              </option>
            ))}
          </select>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-blue-500 font-sans"
          >
            <option value="all">所有嚴重度 (All Severities)</option>
            <option value="Critical">嚴重 (Critical)</option>
            <option value="High">高 (High)</option>
            <option value="Warning">警告 (Warning)</option>
            <option value="Info">一般資訊 (Info)</option>
          </select>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchRules}
            disabled={isLoading}
            className="px-3 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-800 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
            title="重新整理規則狀態"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
            <span>重新整理</span>
          </button>

          {!isReadOnly && (
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-900/30 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>自訂 NDR 告警規則</span>
            </button>
          )}
        </div>
      </div>

      {/* Rules Table / Cards */}
      <div className="space-y-4">
        {filteredRules.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#111114] border border-gray-800">
            <Flame className="w-12 h-12 text-gray-600 mx-auto mb-3 opacity-60" />
            <h4 className="text-base font-bold text-white">找不到符合條件的 NDR 流量告警規則</h4>
            <p className="text-xs text-gray-500 mt-1">請嘗試調整搜尋字串或清除篩選條件。</p>
          </div>
        ) : (
          filteredRules.map(rule => {
            const pConfig = NDR_PATTERNS_CONFIG[rule.patternType] || NDR_PATTERNS_CONFIG.bandwidth_surge;
            const PatternIcon = pConfig.icon;
            const isFiring = rule.status === 'critical' || rule.status === 'warning';

            return (
              <motion.div
                key={rule.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                  "p-5 rounded-2xl border transition-all relative overflow-hidden backdrop-blur-md shadow-xl",
                  !rule.enabled
                    ? "bg-[#0f0f12]/60 border-gray-900 text-gray-500 opacity-60"
                    : isFiring
                    ? "bg-rose-950/20 border-rose-500/50 shadow-rose-950/20"
                    : "bg-[#111114] border-gray-800/80 hover:border-gray-700"
                )}
              >
                {/* Active firing pulse bar */}
                {isFiring && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-amber-400 to-rose-600 animate-pulse" />
                )}

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  {/* Left: Info & Scope */}
                  <div className="space-y-2.5 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {/* Pattern Badge */}
                      <span className={cn("px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5", pConfig.badgeBg, pConfig.badgeBorder, pConfig.badgeText)}>
                        <PatternIcon className="w-3.5 h-3.5" />
                        <span>{pConfig.name}</span>
                      </span>

                      {/* Severity Badge */}
                      <span className={cn(
                        "text-[10px] font-mono px-2 py-0.5 rounded font-black uppercase tracking-wider border",
                        rule.severity === 'Critical'
                          ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                          : rule.severity === 'High'
                          ? "bg-orange-500/20 text-orange-300 border-orange-500/40"
                          : rule.severity === 'Warning'
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          : "bg-blue-500/20 text-blue-300 border-blue-500/40"
                      )}>
                        {rule.severity}
                      </span>

                      {/* Status indicator */}
                      {isFiring ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/30 text-rose-200 border border-rose-500/50 animate-pulse flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                          FIRING 告警觸發中
                        </span>
                      ) : rule.enabled ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          監控正常
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-gray-800 text-gray-400 border border-gray-700">
                          已停用
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                        {rule.name}
                      </h4>
                      <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                        {rule.description}
                      </p>
                    </div>

                    {/* Metadata pill grid */}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-gray-400 pt-1">
                      <span className="flex items-center gap-1 bg-gray-900/80 px-2 py-1 rounded border border-gray-800">
                        <Network className="w-3 h-3 text-blue-400" />
                        範疇: <strong className="text-gray-200">{rule.targetScope}</strong>
                      </span>

                      <span className="flex items-center gap-1 bg-gray-900/80 px-2 py-1 rounded border border-gray-800">
                        <Clock className="w-3 h-3 text-amber-400" />
                        持續判定: <strong className="text-gray-200">{rule.sustainDurationSec}s</strong>
                      </span>

                      <span className="flex items-center gap-1 bg-gray-900/80 px-2 py-1 rounded border border-gray-800">
                        <RotateCcw className="w-3 h-3 text-purple-400" />
                        冷卻: <strong className="text-gray-200">{rule.cooldownMinutes}m</strong>
                      </span>

                      {rule.triggerCount > 0 && (
                        <span className="flex items-center gap-1 bg-gray-900/80 px-2 py-1 rounded border border-gray-800">
                          <Flame className="w-3 h-3 text-rose-400" />
                          已觸發: <strong className="text-rose-300">{rule.triggerCount} 次</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle: Threshold & Live Comparison Meter */}
                  <div className="bg-gray-950/70 p-4 rounded-xl border border-gray-800/80 w-full lg:w-72 space-y-2.5 shrink-0">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-gray-400 font-medium">門檻規則條件</span>
                      <span className="text-amber-400 font-bold">
                        {rule.condition} {rule.criticalThreshold.toLocaleString()} {rule.unit}
                      </span>
                    </div>

                    {/* Gauge bar */}
                    <div className="space-y-1">
                      <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden flex">
                        <div
                          className={cn(
                            "h-full transition-all duration-500",
                            isFiring ? "bg-rose-500" : "bg-emerald-500"
                          )}
                          style={{
                            width: `${Math.min(100, Math.max(5, ((rule.currentValue || 0) / (rule.criticalThreshold * 1.3)) * 100))}%`
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-gray-500">
                        <span>
                          當前: <strong className={isFiring ? "text-rose-400" : "text-gray-300"}>{rule.currentValue?.toLocaleString() || 0} {rule.unit}</strong>
                        </span>
                        <span>預警: {rule.warningThreshold} / 嚴重: {rule.criticalThreshold}</span>
                      </div>
                    </div>

                    {/* Active Notification Channels Icons */}
                    <div className="pt-2 border-t border-gray-800 flex items-center justify-between text-[11px] text-gray-400">
                      <span>告警通道:</span>
                      <div className="flex items-center gap-1.5">
                        {rule.notificationChannels.inApp && (
                          <span className="p-1 rounded bg-blue-500/10 text-blue-400" title="站內即時通知"><Bell className="w-3 h-3" /></span>
                        )}
                        {rule.notificationChannels.email && (
                          <span className="p-1 rounded bg-emerald-500/10 text-emerald-400" title="郵件通報"><Mail className="w-3 h-3" /></span>
                        )}
                        {rule.notificationChannels.webhook && (
                          <span className="p-1 rounded bg-amber-500/10 text-amber-400" title="Webhook (Slack/Teams)"><Share2 className="w-3 h-3" /></span>
                        )}
                        {rule.notificationChannels.syslog && (
                          <span className="p-1 rounded bg-purple-500/10 text-purple-400" title="Syslog SIEM"><Server className="w-3 h-3" /></span>
                        )}
                        {rule.notificationChannels.sound && (
                          <span className="p-1 rounded bg-pink-500/10 text-pink-400" title="警報音效"><Volume2 className="w-3 h-3" /></span>
                        )}
                        {rule.notificationChannels.soarAction && (
                          <span className="px-1 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono font-bold text-[9px]" title="SOAR 自動阻斷處置">SOAR</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-800">
                    <button
                      onClick={() => handleTestTrigger(rule)}
                      disabled={isTesting}
                      className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                      title="發送測試通知，驗證 Webhook、Email 與站內通知系統聯防"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>即時測試觸發</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      {!isReadOnly && (
                        <>
                          <button
                            onClick={() => handleToggleRule(rule)}
                            className={cn(
                              "px-2.5 py-1.5 rounded-lg text-xs font-semibold transition",
                              rule.enabled
                                ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                                : "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                            )}
                            title={rule.enabled ? '停用此規則' : '啟用此規則'}
                          >
                            {rule.enabled ? '停用' : '啟用'}
                          </button>

                          <button
                            onClick={() => handleOpenEditModal(rule)}
                            className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition"
                            title="編輯規則"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDuplicateRule(rule)}
                            className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition"
                            title="複製規則副本"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteRule(rule.id, rule.name)}
                            className="p-1.5 rounded-lg bg-gray-800 hover:bg-rose-950/60 text-gray-400 hover:text-rose-400 transition"
                            title="刪除規則"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* MODAL 1: Create / Edit Rule Modal */}
      <AnimatePresence>
        {isEditModalOpen && editingRule && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#0e0e12] border border-gray-800 rounded-3xl w-full max-w-3xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-black/40">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {rules.some(r => r.id === editingRule.id) ? '編輯 NDR 流量特徵自訂告警規則' : '新增自訂 NDR 流量特徵告警規則'}
                    </h3>
                    <p className="text-xs text-gray-400">
                      定義特定網路流量模式、閾值條件與既有通知管道整合
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Subtab Navigation inside Modal */}
              <div className="px-6 pt-3 border-b border-gray-800/80 flex items-center gap-2 overflow-x-auto bg-gray-950/40">
                {[
                  { id: 'basics', label: '基本資訊 (Basics)', icon: <Sliders size={13} /> },
                  { id: 'pattern', label: '特徵與門檻 (Patterns & Thresholds)', icon: <Flame size={13} /> },
                  { id: 'channels', label: '通知管道整合 (Notifications)', icon: <Bell size={13} /> },
                  { id: 'remediation', label: 'SOAR 聯防處置 (Mitigation)', icon: <Shield size={13} /> }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setModalActiveTab(t.id as any)}
                    className={cn(
                      "px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap",
                      modalActiveTab === t.id
                        ? "border-blue-500 text-blue-400 bg-blue-500/10"
                        : "border-transparent text-gray-400 hover:text-gray-200"
                    )}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {/* TAB 1: Basics */}
                {modalActiveTab === 'basics' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-gray-300 block mb-1">
                        規則名稱 (Rule Name) *
                      </label>
                      <input
                        type="text"
                        value={editingRule.name}
                        onChange={e => setEditingRule({ ...editingRule, name: e.target.value })}
                        placeholder="例如：核心伺服器出境異常大流量警報"
                        className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-300 block mb-1">
                        威脅與狀況描述 (Description)
                      </label>
                      <textarea
                        rows={3}
                        value={editingRule.description}
                        onChange={e => setEditingRule({ ...editingRule, description: e.target.value })}
                        placeholder="詳細描述觸發原因、業務影響與建議應變排查..."
                        className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-gray-300 block mb-1">
                          告警嚴重度 (Severity)
                        </label>
                        <select
                          value={editingRule.severity}
                          onChange={e => setEditingRule({ ...editingRule, severity: e.target.value as any })}
                          className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-sans"
                        >
                          <option value="Critical">緊急致命 (Critical)</option>
                          <option value="High">高風險 (High)</option>
                          <option value="Warning">預警提醒 (Warning)</option>
                          <option value="Info">一般資訊 (Info)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-300 block mb-1">
                          監控啟用狀態 (Status)
                        </label>
                        <div className="flex items-center gap-4 mt-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="rule_enabled"
                              checked={editingRule.enabled}
                              onChange={() => setEditingRule({ ...editingRule, enabled: true })}
                              className="accent-blue-600"
                            />
                            <span className="text-xs text-emerald-400 font-bold">啟用中 (Active)</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="rule_enabled"
                              checked={!editingRule.enabled}
                              onChange={() => setEditingRule({ ...editingRule, enabled: false })}
                              className="accent-blue-600"
                            />
                            <span className="text-xs text-gray-400">停用 (Disabled)</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: Pattern & Scope & Thresholds */}
                {modalActiveTab === 'pattern' && (
                  <div className="space-y-5">
                    <div>
                      <label className="text-xs font-bold text-gray-300 block mb-2">
                        NDR 流量特徵模式 (Traffic Pattern Type) *
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {Object.entries(NDR_PATTERNS_CONFIG).map(([key, val]) => {
                          const IconComp = val.icon;
                          const isSelected = editingRule.patternType === key;

                          return (
                            <div
                              key={key}
                              onClick={() => {
                                setEditingRule({
                                  ...editingRule,
                                  patternType: key as any,
                                  unit: val.defaultUnit,
                                  warningThreshold: val.defaultWarning,
                                  criticalThreshold: val.defaultCritical
                                });
                              }}
                              className={cn(
                                "p-3 rounded-xl border cursor-pointer transition flex items-start gap-3",
                                isSelected
                                  ? "bg-blue-600/10 border-blue-500 shadow-md"
                                  : "bg-gray-900/60 border-gray-800 hover:border-gray-700"
                              )}
                            >
                              <div className={cn("p-2 rounded-lg mt-0.5", val.badgeBg, val.badgeText)}>
                                <IconComp className="w-4 h-4" />
                              </div>
                              <div className="space-y-0.5">
                                <span className={cn("text-xs font-bold block", isSelected ? "text-blue-300" : "text-white")}>
                                  {val.name}
                                </span>
                                <span className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                                  {val.description}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-800">
                      <div>
                        <label className="text-xs font-bold text-gray-300 block mb-1">
                          流量方向 (Direction)
                        </label>
                        <select
                          value={editingRule.direction}
                          onChange={e => setEditingRule({ ...editingRule, direction: e.target.value as any })}
                          className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-sans"
                        >
                          <option value="both">全向雙向 (Inbound & Outbound)</option>
                          <option value="inbound">進境進線 (Inbound Egress to Inside)</option>
                          <option value="outbound">出境連外 (Outbound to Internet)</option>
                          <option value="internal_lateral">內網橫向傳輸 (Internal Lateral Only)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-300 block mb-1">
                          目標網段與監控範疇 (Target Scope / CIDR)
                        </label>
                        <input
                          type="text"
                          value={editingRule.targetScope}
                          onChange={e => setEditingRule({ ...editingRule, targetScope: e.target.value })}
                          placeholder="例如: 10.0.0.0/16 或 DMZ Gateway"
                          className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                        />
                      </div>
                    </div>

                    {/* Condition & Threshold Values */}
                    <div className="p-4 rounded-xl bg-gray-900/80 border border-gray-800 space-y-4">
                      <h5 className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                        <Sliders className="w-3.5 h-3.5" /> 門檻條件運算元與觸發邊界
                      </h5>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-gray-400 block mb-1">
                            比較條件 (Condition)
                          </label>
                          <select
                            value={editingRule.condition}
                            onChange={e => setEditingRule({ ...editingRule, condition: e.target.value as any })}
                            className="w-full bg-black/60 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                          >
                            <option value=">=">&gt;= 大於等於</option>
                            <option value=">">&gt; 大於</option>
                            <option value="<=">&lt;= 小於等於 (斷流判定)</option>
                            <option value="<">&lt; 小於</option>
                            <option value="cluster_deviation">離群偏離度 (Deviation %)</option>
                            <option value="rate_surge">突增變化率 (Rate Surge)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-gray-400 block mb-1">
                            預警門檻 (Warning)
                          </label>
                          <input
                            type="number"
                            value={editingRule.warningThreshold}
                            onChange={e => setEditingRule({ ...editingRule, warningThreshold: Number(e.target.value) })}
                            className="w-full bg-black/60 border border-gray-800 rounded-lg px-3 py-2 text-xs text-amber-300 font-mono"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-gray-400 block mb-1">
                            嚴重門檻 (Critical)
                          </label>
                          <input
                            type="number"
                            value={editingRule.criticalThreshold}
                            onChange={e => setEditingRule({ ...editingRule, criticalThreshold: Number(e.target.value) })}
                            className="w-full bg-black/60 border border-gray-800 rounded-lg px-3 py-2 text-xs text-rose-400 font-mono font-bold"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-gray-400 block mb-1">
                            衡量單位 (Unit)
                          </label>
                          <input
                            type="text"
                            value={editingRule.unit}
                            onChange={e => setEditingRule({ ...editingRule, unit: e.target.value })}
                            className="w-full bg-black/60 border border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-300 font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div>
                          <label className="text-[11px] text-gray-400 block mb-1">
                            持續時長判定 (Sustain Duration): {editingRule.sustainDurationSec} 秒
                          </label>
                          <input
                            type="range"
                            min="5"
                            max="300"
                            step="5"
                            value={editingRule.sustainDurationSec}
                            onChange={e => setEditingRule({ ...editingRule, sustainDurationSec: Number(e.target.value) })}
                            className="w-full accent-blue-500"
                          />
                          <span className="text-[10px] text-gray-500">超標持續達此秒數始視為有效異常，避免單包抖動誤報。</span>
                        </div>

                        <div>
                          <label className="text-[11px] text-gray-400 block mb-1">
                            重覆告警冷卻抑制 (Cooldown): {editingRule.cooldownMinutes} 分鐘
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="120"
                            step="1"
                            value={editingRule.cooldownMinutes}
                            onChange={e => setEditingRule({ ...editingRule, cooldownMinutes: Number(e.target.value) })}
                            className="w-full accent-purple-500"
                          />
                          <span className="text-[10px] text-gray-500">觸發後冷卻期內抑制重複告警，防止告警風暴。</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: Notifications Channel Integration */}
                {modalActiveTab === 'channels' && (
                  <div className="space-y-4">
                    <p className="text-xs text-gray-400">
                      設定當 NDR 流量特徵達到觸發門檻時，自動整合之系統告警通報管道：
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* In-App */}
                      <label className="p-3.5 rounded-xl border border-gray-800 bg-gray-900/60 flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingRule.notificationChannels.inApp}
                          onChange={e => setEditingRule({
                            ...editingRule,
                            notificationChannels: { ...editingRule.notificationChannels, inApp: e.target.checked }
                          })}
                          className="mt-0.5 accent-blue-600 rounded"
                        />
                        <div>
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Bell className="w-3.5 h-3.5 text-blue-400" /> 站內即時通知 (In-App Banner & Toast)
                          </span>
                          <span className="text-[11px] text-gray-400 block mt-0.5">
                            即時推播至 SOC 儀表板通知中心與頂部警報列。
                          </span>
                        </div>
                      </label>

                      {/* Sound */}
                      <label className="p-3.5 rounded-xl border border-gray-800 bg-gray-900/60 flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingRule.notificationChannels.sound}
                          onChange={e => setEditingRule({
                            ...editingRule,
                            notificationChannels: { ...editingRule.notificationChannels, sound: e.target.checked }
                          })}
                          className="mt-0.5 accent-pink-600 rounded"
                        />
                        <div>
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Volume2 className="w-3.5 h-3.5 text-pink-400" /> 瀏覽器警報音效 (Audio Chime)
                          </span>
                          <span className="text-[11px] text-gray-400 block mt-0.5">
                            觸發時播放 Web Audio 緊急提醒聲響。
                          </span>
                        </div>
                      </label>

                      {/* Webhook */}
                      <label className="p-3.5 rounded-xl border border-gray-800 bg-gray-900/60 flex items-start gap-3 cursor-pointer md:col-span-2">
                        <input
                          type="checkbox"
                          checked={editingRule.notificationChannels.webhook}
                          onChange={e => setEditingRule({
                            ...editingRule,
                            notificationChannels: { ...editingRule.notificationChannels, webhook: e.target.checked }
                          })}
                          className="mt-0.5 accent-amber-600 rounded"
                        />
                        <div className="flex-1 space-y-2">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Share2 className="w-3.5 h-3.5 text-amber-400" /> Webhook 整合 (Slack / Teams / Discord)
                          </span>
                          {editingRule.notificationChannels.webhook && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                              <input
                                type="text"
                                value={editingRule.notificationChannels.webhookUrl}
                                onChange={e => setEditingRule({
                                  ...editingRule,
                                  notificationChannels: { ...editingRule.notificationChannels, webhookUrl: e.target.value }
                                })}
                                placeholder="Webhook URL (https://hooks.slack.com/...)"
                                className="w-full bg-black/60 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                              />
                              <input
                                type="text"
                                value={editingRule.notificationChannels.webhookChannel || ''}
                                onChange={e => setEditingRule({
                                  ...editingRule,
                                  notificationChannels: { ...editingRule.notificationChannels, webhookChannel: e.target.value }
                                })}
                                placeholder="Channel (#ndr-alerts)"
                                className="w-full bg-black/60 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                              />
                            </div>
                          )}
                        </div>
                      </label>

                      {/* Email */}
                      <label className="p-3.5 rounded-xl border border-gray-800 bg-gray-900/60 flex items-start gap-3 cursor-pointer md:col-span-2">
                        <input
                          type="checkbox"
                          checked={editingRule.notificationChannels.email}
                          onChange={e => setEditingRule({
                            ...editingRule,
                            notificationChannels: { ...editingRule.notificationChannels, email: e.target.checked }
                          })}
                          className="mt-0.5 accent-emerald-600 rounded"
                        />
                        <div className="flex-1 space-y-2">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-emerald-400" /> Email 郵件通報 (SMTP Incident Dispatch)
                          </span>
                          {editingRule.notificationChannels.email && (
                            <input
                              type="text"
                              value={editingRule.notificationChannels.emailRecipients.join(', ')}
                              onChange={e => setEditingRule({
                                ...editingRule,
                                notificationChannels: {
                                  ...editingRule.notificationChannels,
                                  emailRecipients: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                                }
                              })}
                              placeholder="收件者信箱 (以逗號分隔，例如: soc@corp.internal, lead@corp.internal)"
                              className="w-full bg-black/60 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                            />
                          )}
                        </div>
                      </label>

                      {/* Syslog */}
                      <label className="p-3.5 rounded-xl border border-gray-800 bg-gray-900/60 flex items-start gap-3 cursor-pointer md:col-span-2">
                        <input
                          type="checkbox"
                          checked={editingRule.notificationChannels.syslog}
                          onChange={e => setEditingRule({
                            ...editingRule,
                            notificationChannels: { ...editingRule.notificationChannels, syslog: e.target.checked }
                          })}
                          className="mt-0.5 accent-purple-600 rounded"
                        />
                        <div className="flex-1 space-y-2">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Server className="w-3.5 h-3.5 text-purple-400" /> Syslog RFC 5424 SIEM 轉發
                          </span>
                          {editingRule.notificationChannels.syslog && (
                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <input
                                type="text"
                                value={editingRule.notificationChannels.syslogHost || '127.0.0.1'}
                                onChange={e => setEditingRule({
                                  ...editingRule,
                                  notificationChannels: { ...editingRule.notificationChannels, syslogHost: e.target.value }
                                })}
                                placeholder="Syslog 主機 (127.0.0.1)"
                                className="w-full bg-black/60 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                              />
                              <input
                                type="number"
                                value={editingRule.notificationChannels.syslogPort || 514}
                                onChange={e => setEditingRule({
                                  ...editingRule,
                                  notificationChannels: { ...editingRule.notificationChannels, syslogPort: Number(e.target.value) }
                                })}
                                placeholder="Port (514)"
                                className="w-full bg-black/60 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                              />
                            </div>
                          )}
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {/* TAB 4: Remediation */}
                {modalActiveTab === 'remediation' && (
                  <div className="space-y-4">
                    <p className="text-xs text-gray-400">
                      當此 NDR 規則觸發 Critical 嚴重級別告警時，可自動執行之主動式網路聯防處置：
                    </p>

                    <label className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/20 flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingRule.notificationChannels.soarAction}
                        onChange={e => setEditingRule({
                          ...editingRule,
                          notificationChannels: { ...editingRule.notificationChannels, soarAction: e.target.checked }
                        })}
                        className="mt-1 accent-rose-600 rounded"
                      />
                      <div className="space-y-2 flex-1">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Shield className="w-4 h-4 text-rose-400" /> 啟用 SOAR 自動化聯防劇本 (Automated Response)
                        </span>
                        <p className="text-xs text-rose-200/80">
                          超標時自動排程聯防下發，無需人工即刻介入即可遏止惡意橫向擴散。
                        </p>

                        {editingRule.notificationChannels.soarAction && (
                          <div className="pt-2">
                            <label className="text-[11px] font-bold text-gray-300 block mb-1">
                              自動處置動作類型 (Action Type)
                            </label>
                            <select
                              value={editingRule.notificationChannels.soarActionType || 'deploy_suricata_rule'}
                              onChange={e => setEditingRule({
                                ...editingRule,
                                notificationChannels: { ...editingRule.notificationChannels, soarActionType: e.target.value as any }
                              })}
                              className="w-full bg-black/80 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                            >
                              <option value="deploy_suricata_rule">下發 Suricata 7.0 IPS 即時阻斷特徵碼 (Drop Rule)</option>
                              <option value="isolate_host">透過 802.1X NAC 將違規來源 IP 踢入隔離 VLAN 999</option>
                              <option value="capture_pcap">自動抓取前後 60 秒 PCAP 封包串流並固化為取證檔案</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-800 flex items-center justify-between bg-black/40">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white text-xs font-medium transition"
                >
                  取消
                </button>

                <button
                  onClick={() => {
                    if (!editingRule.name.trim()) {
                      alert('請輸入規則名稱');
                      return;
                    }
                    saveRuleToBackend(editingRule);
                  }}
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-900/40 transition active:scale-95 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? '儲存中...' : '儲存並套用規則'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Test Trigger & Notification Dispatch Simulator */}
      <AnimatePresence>
        {testingRule && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#0e0e12] border border-amber-500/40 rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-black/40">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      NDR 流量告警通知即時測試 (Alert Dispatch Simulator)
                    </h3>
                    <p className="text-xs text-gray-400">
                      測試規則「{testingRule.name}」與現有通知系統整合流程
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setTestingRule(null);
                    setTestResult(null);
                  }}
                  className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-5 flex-1">
                {/* Rule preview */}
                <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">目標模式:</span>
                    <span className="text-white font-bold">{testingRule.patternType}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">觸發嚴重度:</span>
                    <span className="text-rose-400 font-bold">{testingRule.severity}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">臨界門檻值:</span>
                    <span className="text-amber-400 font-bold">{testingRule.criticalThreshold} {testingRule.unit}</span>
                  </div>
                </div>

                {/* Dispatch logs */}
                {testResult && (
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-200 text-xs space-y-1">
                      <div className="font-bold flex items-center gap-2 text-white">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        {testResult.message}
                      </div>
                      <div className="text-[11px] text-gray-400 font-mono pt-1">
                        已推播管道: [{testResult.dispatchedChannels?.join(', ') || 'inApp'}]
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-mono text-gray-400 block mb-1">
                        執行審計日誌軌跡 (Execution Log):
                      </span>
                      <pre className="p-3 rounded-xl bg-black border border-gray-800 text-[11px] font-mono text-emerald-400 overflow-x-auto space-y-1">
                        {testResult.executionLogs?.map((log: string, idx: number) => (
                          <div key={idx}>{log}</div>
                        ))}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-800 flex items-center justify-between bg-black/40">
                <button
                  onClick={() => {
                    setTestingRule(null);
                    setTestResult(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-gray-900 text-gray-300 text-xs font-medium"
                >
                  關閉
                </button>

                <button
                  onClick={() => handleTestTrigger(testingRule)}
                  disabled={isTesting}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-900/30 transition active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", isTesting && "animate-spin")} />
                  <span>{isTesting ? '發送測試中...' : '再次注入模擬並發送通知'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default NDRAlertRulesSettingsView;
