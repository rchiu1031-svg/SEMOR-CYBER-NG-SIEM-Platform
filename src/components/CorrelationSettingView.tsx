import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import {
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Layers,
  Clock,
  ArrowRightLeft,
  Code,
  Sliders,
  Plus,
  Play,
  Save,
  Trash2,
  Edit3,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Database,
  RefreshCw,
  Terminal,
  FileCode,
  Share2,
  SlidersHorizontal,
  ChevronRight,
  ChevronDown,
  Workflow,
  Sparkles,
  Server,
  Activity,
  HardDrive,
  Copy,
  RotateCcw,
  AlertTriangle,
  Info,
  Check,
  Radio,
  BarChart3
} from 'lucide-react';
import { cn } from '../lib/utils';

interface CorrelationRule {
  id: string;
  name: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  tactic: string;
  technique?: string;
  sources: string[];
  window: string;
  windowSeconds: number;
  joinKey: string;
  enabled: boolean;
  hits24h: number;
  ruleLogic: string;
  stages: {
    stageId: string;
    name: string;
    source: string;
    condition: string;
  }[];
  actions?: string[];
  updatedAt?: string;
}

interface WindowConfig {
  burstWindowSeconds: number;
  killChainWindowMinutes: number;
  slowAptWindowDays: number;
  allowedLatenessSeconds: number;
  checkpointIntervalSeconds: number;
  maxStateMemoryMB: number;
  rocksdbCompression: 'Snappy' | 'ZSTD' | 'LZ4';
  stateRetentionPolicy: string;
}

interface SchemaMapping {
  id: string;
  sourceField: string;
  targetField: string;
  transformation: string;
  description: string;
  sampleInput: string;
  sampleOutput: string;
  active: boolean;
}

interface AggregationConfig {
  entityClusteringEnabled: boolean;
  clusteringWindowMinutes: number;
  clusteringKeys: string[];
  escalationMatrixEnabled: boolean;
  escalationThreshold: number;
  escalationWindowMinutes: number;
  escalateFrom: 'Medium' | 'High';
  escalateTo: 'High' | 'Critical';
  stormSuppressionRateLimit: number;
  dedupWindowSeconds: number;
  autoNoiseFilter: boolean;
}

const PRESET_PAYLOADS = [
  {
    nameZh: 'PowerShell 記憶體混淆與 C2 外連',
    nameEn: 'PowerShell In-Memory + C2 Ingress',
    ruleHint: 'CORR-RULE-102',
    payload: {
      timestamp: '2026-08-20T19:14:00Z',
      event_type: 'windows_security_4688',
      host: 'WS-FINANCE-088',
      src_ip: '192.168.10.55',
      user: 'alice.chen',
      process: 'powershell.exe',
      cmdline: 'powershell.exe -NoP -NonI -W Hidden -Enc JABjAGwAbwB1AGQA...',
      parent_process: 'WINWORD.EXE',
      dns_query: 'darkc2-infrastructure-mesh.xyz',
      network_direction: 'outbound',
      dst_port: 443
    }
  },
  {
    nameZh: '多重登入失敗 + 特權提升 + SMB 橫向移動',
    nameEn: 'Brute Force + PrivEsc + SMB Lateral',
    ruleHint: 'CORR-RULE-101',
    payload: {
      timestamp: '2026-08-20T21:05:12Z',
      event_type: 'windows_security_4625',
      host: 'DC-PROD-01',
      src_ip: '192.168.10.88',
      dst_ip: '192.168.10.10',
      user: 'admin_backup',
      fail_count: 8,
      privilege_code: '4672',
      privilege_name: 'SeDebugPrivilege',
      protocol: 'SMB2',
      destination_port: 445
    }
  },
  {
    nameZh: '陰影副本抹除 + 大量副檔名變更 (勒索特徵)',
    nameEn: 'Shadow Copy Deletion + Rapid Renames',
    ruleHint: 'CORR-RULE-105',
    payload: {
      timestamp: '2026-08-20T03:30:15Z',
      event_type: 'sysmon_process_creation',
      host: 'SRV-FILE-VAULT',
      user: 'system',
      process: 'cmd.exe',
      cmdline: 'vssadmin.exe delete shadows /all /quiet',
      file_action: 'RENAME',
      file_extension: '.locked',
      file_rate_per_min: 820
    }
  },
  {
    nameZh: '非工作時段資料庫導出 + 突發 S3 上傳',
    nameEn: 'Off-Hours DB Dump + S3 Exfil',
    ruleHint: 'CORR-RULE-104',
    payload: {
      timestamp: '2026-08-20T02:45:00Z',
      event_type: 'postgresql_audit',
      host: 'SRV-DB-PROD-01',
      user: 'dwh_sync_service',
      iam_arn: 'arn:aws:iam::123456789:role/DWHAdmin',
      sql_statement: 'SELECT * FROM customer_pii_vault LIMIT 500000',
      is_after_hours: true,
      bytes_out: 2147483648,
      cloud_action: 'PutObject',
      s3_bucket: 'vault-external-backup'
    }
  },
  {
    nameZh: '不可能的移動登入 + Tor 出口節點',
    nameEn: 'Impossible Travel + Tor Exit Ingress',
    ruleHint: 'CORR-RULE-103',
    payload: {
      timestamp: '2026-08-20T14:10:00Z',
      event_type: 'okta_sso_authentication',
      host: 'VPN-EDGE-01',
      src_ip: '185.220.101.5',
      user: 'charlie.wang@corp.internal',
      geo_country: 'Iceland',
      user_home_country: 'Taiwan',
      distance_km: 9800,
      velocity_kmh: 8400,
      cti_threat_type: 'TOR_EXIT_NODE'
    }
  },
  {
    nameZh: '正常常規系統記錄 (負面測試)',
    nameEn: 'Benign Clean Audit (Negative Test)',
    ruleHint: 'No Match',
    payload: {
      timestamp: '2026-08-20T10:15:00Z',
      event_type: 'windows_security_4624',
      host: 'WS-DEV-102',
      user: 'dev_user',
      src_ip: '192.168.10.12',
      process: 'explorer.exe',
      status: 'SUCCESS'
    }
  }
];

export default function CorrelationSettingView() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'zh';
  const isZh = currentLang.startsWith('zh');
  const isJa = currentLang.startsWith('ja');

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'rules' | 'window' | 'mapping' | 'aggregation' | 'engine'>('rules');

  // Rules State
  const [rules, setRules] = useState<CorrelationRule[]>([]);
  const [loadingRules, setLoadingRules] = useState(false);
  const [ruleSearch, setRuleSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [isEditingRule, setIsEditingRule] = useState(false);
  const [editingRuleData, setEditingRuleData] = useState<Partial<CorrelationRule>>({});
  const [savingRule, setSavingRule] = useState(false);

  // Window Config State
  const [windowConfig, setWindowConfig] = useState<WindowConfig>({
    burstWindowSeconds: 180,
    killChainWindowMinutes: 60,
    slowAptWindowDays: 7,
    allowedLatenessSeconds: 30,
    checkpointIntervalSeconds: 60,
    maxStateMemoryMB: 4096,
    rocksdbCompression: 'LZ4',
    stateRetentionPolicy: 'SLIDING_WATERMARK_LRU'
  });
  const [savingWindow, setSavingWindow] = useState(false);

  // Schema Mapping State
  const [schemaMappings, setSchemaMappings] = useState<SchemaMapping[]>([]);
  const [isAddingMapping, setIsAddingMapping] = useState(false);
  const [newMappingData, setNewMappingData] = useState<Partial<SchemaMapping>>({
    sourceField: '',
    targetField: '',
    transformation: 'Extract & Trim',
    description: '',
    sampleInput: '',
    sampleOutput: '',
    active: true
  });

  // Aggregation State
  const [aggregationConfig, setAggregationConfig] = useState<AggregationConfig>({
    entityClusteringEnabled: true,
    clusteringWindowMinutes: 10,
    clusteringKeys: ['host.ip', 'user.name'],
    escalationMatrixEnabled: true,
    escalationThreshold: 3,
    escalationWindowMinutes: 30,
    escalateFrom: 'Medium',
    escalateTo: 'High',
    stormSuppressionRateLimit: 100,
    dedupWindowSeconds: 60,
    autoNoiseFilter: true
  });
  const [savingAggregation, setSavingAggregation] = useState(false);

  // Engine Status & Telemetry
  const [engineStatus, setEngineStatus] = useState<any>(null);
  const [reloadingEngine, setReloadingEngine] = useState(false);

  // Overall Stats
  const [stats, setStats] = useState<any>(null);

  // Feedback Notification Toast/Banner
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Live Test Simulation State
  const [testPayload, setTestPayload] = useState<string>(
    JSON.stringify(PRESET_PAYLOADS[0].payload, null, 2)
  );
  const [testResult, setTestResult] = useState<any | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Load All Backend Data
  const fetchAllData = async () => {
    setLoadingRules(true);
    try {
      // 1. Rules
      const rulesRes = await fetch('/api/v1/correlation/rules');
      if (rulesRes.ok) {
        const data = await rulesRes.json();
        if (data.rules) setRules(data.rules);
      }

      // 2. Window Config
      const winRes = await fetch('/api/v1/correlation/window-config');
      if (winRes.ok) {
        const data = await winRes.json();
        if (data.config) setWindowConfig(data.config);
      }

      // 3. Schema Mappings
      const mapRes = await fetch('/api/v1/correlation/schema-mappings');
      if (mapRes.ok) {
        const data = await mapRes.json();
        if (data.mappings) setSchemaMappings(data.mappings);
      }

      // 4. Aggregation Config
      const aggRes = await fetch('/api/v1/correlation/aggregation-config');
      if (aggRes.ok) {
        const data = await aggRes.json();
        if (data.config) setAggregationConfig(data.config);
      }

      // 5. Engine Status
      const engRes = await fetch('/api/v1/correlation/engine/status');
      if (engRes.ok) {
        const data = await engRes.json();
        setEngineStatus(data);
      }

      // 6. Overall Stats
      const statsRes = await fetch('/api/v1/correlation/stats');
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching correlation settings from backend:', err);
      showToast(isZh ? '連線後端關聯分析服務異常' : 'Failed to connect to correlation backend', 'error');
    } finally {
      setLoadingRules(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Handle Rule Toggle
  const toggleRule = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/correlation/rules/${id}/toggle`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        setRules((prev) =>
          prev.map((r) => (r.id === id ? { ...r, enabled: data.enabled } : r))
        );
        showToast(
          isZh
            ? `規則 ${id} 狀態已切換為：${data.enabled ? '啟用' : '停用'}`
            : `Rule ${id} toggled to ${data.enabled ? 'ENABLED' : 'DISABLED'}`,
          'success'
        );
      } else {
        showToast(isZh ? '切換規則狀態失敗' : 'Failed to toggle rule state', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast(isZh ? '網路連線失敗' : 'Network error', 'error');
    }
  };

  // Handle Delete Rule
  const handleDeleteRule = async (id: string) => {
    if (!window.confirm(isZh ? `確定要刪除關聯規則 ${id} 嗎？` : `Are you sure you want to delete rule ${id}?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/v1/correlation/rules/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setRules((prev) => prev.filter((r) => r.id !== id));
        showToast(isZh ? `已成功刪除規則 ${id}` : `Rule ${id} deleted successfully`, 'success');
      } else {
        showToast(isZh ? '刪除失敗' : 'Delete failed', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast(isZh ? '網路連線失敗' : 'Network error', 'error');
    }
  };

  // Reset Rules to Factory Defaults
  const handleResetRules = async () => {
    if (
      !window.confirm(
        isZh
          ? '確定要還原為出廠預設關聯分析規則庫嗎？自訂規則將被覆蓋。'
          : 'Reset all correlation rules to enterprise factory presets? Custom rules will be reset.'
      )
    ) {
      return;
    }
    try {
      const res = await fetch('/api/v1/correlation/rules/reset', {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        setRules(data.rules || []);
        showToast(
          isZh ? '已成功恢復出廠預設關聯規則庫' : 'Correlation rules restored to factory presets',
          'success'
        );
      }
    } catch (e) {
      console.error(e);
      showToast(isZh ? '重設失敗' : 'Reset failed', 'error');
    }
  };

  // Open Edit/Create Modal
  const handleOpenRuleModal = (rule?: CorrelationRule) => {
    if (rule) {
      setEditingRuleData({ ...rule });
    } else {
      setEditingRuleData({
        id: '',
        name: isZh ? '自訂多階段關聯偵測規則' : 'Custom Multi-Stage Correlation Rule',
        description: isZh ? '分析多資料源事件序列並提取關聯鍵' : 'Correlates multi-source events and extracts join keys',
        severity: 'High',
        tactic: 'TA0002 Execution',
        technique: 'T1059 Command and Scripting',
        sources: ['EDR Telemetry', 'Network NDR'],
        window: '300s (5 min)',
        windowSeconds: 300,
        joinKey: 'host.ip, user.name',
        enabled: true,
        ruleLogic: 'EventA(Process_Exec) -> EventB(Outbound_Connect in 300s)',
        stages: [
          {
            stageId: 'A',
            name: '階段 A: 初始處理程序觸發',
            source: 'EDR Telemetry',
            condition: "process.name in ['powershell.exe', 'cmd.exe']"
          },
          {
            stageId: 'B',
            name: '階段 B: 出境網路連線',
            source: 'Network NDR',
            condition: "network.direction == 'outbound' AND destination.port in [443, 8080]"
          }
        ],
        actions: ['Generate High Incident', 'Notify SOC Analyst']
      });
    }
    setIsEditingRule(true);
  };

  // Save Rule (Create or Update)
  const handleSaveRule = async () => {
    if (!editingRuleData.name || !editingRuleData.ruleLogic) {
      showToast(isZh ? '請填寫規則名稱與關聯邏輯' : 'Rule name and logic are required', 'error');
      return;
    }

    setSavingRule(true);
    try {
      const isUpdate = Boolean(editingRuleData.id && rules.some((r) => r.id === editingRuleData.id));
      const url = isUpdate
        ? `/api/v1/correlation/rules/${editingRuleData.id}`
        : '/api/v1/correlation/rules';
      const method = isUpdate ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingRuleData)
      });

      if (res.ok) {
        const data = await res.json();
        if (isUpdate) {
          setRules((prev) => prev.map((r) => (r.id === data.rule.id ? data.rule : r)));
          showToast(isZh ? `規則 ${data.rule.id} 已更新並熱部署！` : `Rule ${data.rule.id} updated!`, 'success');
        } else {
          setRules((prev) => [data.rule, ...prev]);
          showToast(isZh ? `新建規則 ${data.rule.id} 已成功載入 CEP 引擎！` : `Rule ${data.rule.id} created!`, 'success');
        }
        setIsEditingRule(false);
      } else {
        const err = await res.json();
        showToast(err.error || (isZh ? '儲存規則失敗' : 'Failed to save rule'), 'error');
      }
    } catch (e) {
      console.error(e);
      showToast(isZh ? '網路通訊錯誤' : 'Network error', 'error');
    } finally {
      setSavingRule(false);
    }
  };

  // Save Window & CEP State Config
  const handleSaveWindowConfig = async () => {
    setSavingWindow(true);
    try {
      const res = await fetch('/api/v1/correlation/window-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(windowConfig)
      });
      if (res.ok) {
        const data = await res.json();
        setWindowConfig(data.config);
        showToast(
          isZh
            ? 'CEP 時間滑動窗口與 RocksDB 水線參數已同步更新！'
            : 'CEP sliding window and RocksDB state parameters updated!',
          'success'
        );
      } else {
        showToast(isZh ? '儲存失敗' : 'Failed to update window config', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast(isZh ? '網路錯誤' : 'Network error', 'error');
    } finally {
      setSavingWindow(false);
    }
  };

  // Add Schema Mapping
  const handleAddSchemaMapping = async () => {
    if (!newMappingData.sourceField || !newMappingData.targetField) {
      showToast(isZh ? '請填寫原始欄位與目標欄位' : 'Source and target fields are required', 'error');
      return;
    }
    try {
      const res = await fetch('/api/v1/correlation/schema-mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMappingData)
      });
      if (res.ok) {
        const data = await res.json();
        setSchemaMappings((prev) => [...prev, data.mapping]);
        setIsAddingMapping(false);
        setNewMappingData({
          sourceField: '',
          targetField: '',
          transformation: 'Extract & Trim',
          description: '',
          sampleInput: '',
          sampleOutput: '',
          active: true
        });
        showToast(isZh ? '欄位標準化對齊規則已儲存' : 'Schema mapping saved', 'success');
      }
    } catch (e) {
      console.error(e);
      showToast(isZh ? '儲存失敗' : 'Save failed', 'error');
    }
  };

  // Delete Schema Mapping
  const handleDeleteSchemaMapping = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/correlation/schema-mappings/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setSchemaMappings((prev) => prev.filter((m) => m.id !== id));
        showToast(isZh ? '映射規則已刪除' : 'Schema mapping deleted', 'success');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Save Aggregation Config
  const handleSaveAggregationConfig = async () => {
    setSavingAggregation(true);
    try {
      const res = await fetch('/api/v1/correlation/aggregation-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aggregationConfig)
      });
      if (res.ok) {
        const data = await res.json();
        setAggregationConfig(data.config);
        showToast(
          isZh
            ? '告警風暴聚合與嚴重等級升級策略已成功套用！'
            : 'Alert aggregation and storm suppression policies saved!',
          'success'
        );
      }
    } catch (e) {
      console.error(e);
      showToast(isZh ? '網路錯誤' : 'Network error', 'error');
    } finally {
      setSavingAggregation(false);
    }
  };

  // Reload CEP Engine
  const handleReloadEngine = async () => {
    setReloadingEngine(true);
    try {
      const res = await fetch('/api/v1/correlation/engine/reload', {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        showToast(
          isZh
            ? `CEP 規則引擎熱重載成功！(已編譯 ${data.activeRules} 條活躍規則，無縫切換無停機)`
            : 'CEP engine reloaded seamlessly without downtime!',
          'success'
        );
        // refresh status
        const engRes = await fetch('/api/v1/correlation/engine/status');
        if (engRes.ok) setEngineStatus(await engRes.json());
      }
    } catch (e) {
      console.error(e);
      showToast(isZh ? '重載失敗' : 'Reload failed', 'error');
    } finally {
      setReloadingEngine(false);
    }
  };

  // Run Test Simulation via Real Backend
  const handleRunSimulation = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/v1/correlation/simulate-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: testPayload })
      });

      if (res.ok) {
        const data = await res.json();
        setTestResult(data);
        if (data.matched) {
          showToast(
            isZh
              ? `模擬測試命中規則：${data.ruleName} (信心度 ${data.confidenceScore}%)`
              : `Matched: ${data.ruleName} (${data.confidenceScore}%)`,
            'success'
          );
        } else {
          showToast(
            isZh ? '測試完成：未達到任何啟用中關聯規則之觸發閥值' : 'No rule matched input payload',
            'info'
          );
        }
      } else {
        const err = await res.json();
        showToast(err.error || (isZh ? '測試請求格式錯誤' : 'Evaluation error'), 'error');
      }
    } catch (e) {
      console.error(e);
      showToast(isZh ? '模擬器執行失敗' : 'Simulation failed', 'error');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              'fixed top-6 right-6 z-50 px-4 py-3 rounded-xl border shadow-2xl flex items-center gap-3 text-xs font-bold backdrop-blur-md',
              toastMessage.type === 'success' && 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300',
              toastMessage.type === 'error' && 'bg-red-950/90 border-red-500/50 text-red-300',
              toastMessage.type === 'info' && 'bg-blue-950/90 border-blue-500/50 text-blue-300'
            )}
          >
            {toastMessage.type === 'success' && <CheckCircle2 size={16} className="text-emerald-400" />}
            {toastMessage.type === 'error' && <AlertCircle size={16} className="text-red-400" />}
            {toastMessage.type === 'info' && <Info size={16} className="text-blue-400" />}
            <span>{toastMessage.text}</span>
            <button onClick={() => setToastMessage(null)} className="ml-2 text-gray-400 hover:text-white">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header Card */}
      <div className="bg-[#111116] border border-gray-800 p-6 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center border border-blue-500/30 text-blue-400 shadow-lg shadow-blue-500/10">
            <Sliders size={24} />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-black text-white uppercase tracking-tight">
                {isZh ? '關聯設定與 CEP 規則引擎配置' : 'Correlation Engine & CEP Configuration'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {isZh ? '引擎狀態：在線 (Flink CEP + RocksDB)' : 'Engine Status: Active (Flink CEP)'}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {isZh
                ? '自定義跨資料源關聯邏輯、滑動時間窗口、欄位標準化對齊與告警風暴聚合降噪規則。'
                : 'Configure cross-source event correlation pipelines, CEP sliding time windows, schema normalization, and de-duplication policies.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono flex-wrap">
          <div className="px-3.5 py-2 bg-gray-900 border border-gray-800 rounded-xl">
            <div className="text-[10px] text-gray-500 uppercase font-bold">{isZh ? '活躍規則' : 'Active Rules'}</div>
            <div className="text-white font-bold">{rules.filter((r) => r.enabled).length} / {rules.length}</div>
          </div>
          <div className="px-3.5 py-2 bg-gray-900 border border-gray-800 rounded-xl">
            <div className="text-[10px] text-gray-500 uppercase font-bold">{isZh ? '24h 關聯命中' : '24h Hits'}</div>
            <div className="text-purple-400 font-bold">{stats?.totalHits24h ?? 327}</div>
          </div>
          <div className="px-3.5 py-2 bg-gray-900 border border-gray-800 rounded-xl">
            <div className="text-[10px] text-gray-500 uppercase font-bold">{isZh ? '降噪壓縮率' : 'Noise Reduction'}</div>
            <div className="text-emerald-400 font-bold">77.3%</div>
          </div>
          <button
            onClick={fetchAllData}
            disabled={loadingRules}
            className="p-2.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl text-gray-400 hover:text-white transition-colors"
            title={isZh ? '重新載入設定' : 'Refresh'}
          >
            <RefreshCw size={14} className={cn(loadingRules && 'animate-spin text-blue-400')} />
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex bg-gray-900 p-1.5 rounded-2xl border border-gray-800 overflow-x-auto custom-scrollbar gap-1">
        {[
          { id: 'rules', label: isZh ? '關聯規則庫與編排 (Rules)' : isJa ? '相関ルールライブラリ (Rules)' : 'Rule Catalog & Builder', icon: <FileCode size={15} /> },
          { id: 'window', label: isZh ? '滑動窗口與 CEP 參數 (Windows)' : isJa ? 'スライディングウィンドウとCEP (Windows)' : 'Sliding Windows & CEP State', icon: <Clock size={15} /> },
          { id: 'mapping', label: isZh ? '欄位標準化與測試 (Schema)' : isJa ? 'フィールド標準化とテスト (Schema)' : 'Schema Mapping & Live Test', icon: <ArrowRightLeft size={15} /> },
          { id: 'aggregation', label: isZh ? '告警聚合與降噪策略 (Grouping)' : isJa ? 'アラート集約・ノイズ低減 (Grouping)' : 'Alert Aggregation & Storm Suppression', icon: <Layers size={15} /> },
          { id: 'engine', label: isZh ? '引擎叢集與狀態監控 (Engine)' : isJa ? 'エンジンクラスタ監視 (Engine)' : 'Engine Cluster & RocksDB', icon: <Server size={15} /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              'px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap',
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: CORRELATION RULE CATALOG & VISUAL BUILDER */}
      {activeTab === 'rules' && (
        <div className="space-y-6">
          {/* Rules Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 flex-wrap">
              <div className="relative flex-1 min-w-[220px] max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={15} />
                <input
                  type="text"
                  value={ruleSearch}
                  onChange={(e) => setRuleSearch(e.target.value)}
                  placeholder={isZh ? '搜尋規則名稱、MITRE ATT&CK 標籤或 ID...' : 'Search rules by name, tactic, or ID...'}
                  className="w-full bg-[#111116] border border-gray-800 rounded-xl py-2 pl-9 pr-4 text-xs font-bold text-white focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-[#111116] border border-gray-800 rounded-xl py-2 px-3 text-xs font-bold text-gray-300 outline-none"
              >
                <option value="ALL">{isZh ? '全部等級 (All Severity)' : 'All Severity'}</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>

              <button
                onClick={handleResetRules}
                className="px-3 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-400 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                title={isZh ? '重設為出廠規則庫' : 'Reset to factory rules'}
              >
                <RotateCcw size={13} />
                <span className="hidden sm:inline">{isZh ? '恢復出廠規則' : 'Factory Reset'}</span>
              </button>
            </div>

            <button
              onClick={() => handleOpenRuleModal()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20 whitespace-nowrap"
            >
              <Plus size={15} />
              {isZh ? '建立自訂關聯規則' : 'Create Correlation Rule'}
            </button>
          </div>

          {/* Rules List Table */}
          <div className="bg-[#111116] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-900/80 border-b border-gray-800 text-[10px] uppercase font-bold text-gray-400">
                  <tr>
                    <th className="p-3.5 w-16 text-center">{isZh ? '狀態' : 'Status'}</th>
                    <th className="p-3.5">{isZh ? '規則名稱與關聯邏輯' : 'Rule Name & Logic'}</th>
                    <th className="p-3.5">{isZh ? '嚴重等級' : 'Severity'}</th>
                    <th className="p-3.5">{isZh ? '資料源' : 'Sources'}</th>
                    <th className="p-3.5">{isZh ? '滑動窗口' : 'Window'}</th>
                    <th className="p-3.5">{isZh ? '關聯鍵 (Join)' : 'Join Keys'}</th>
                    <th className="p-3.5 text-center">{isZh ? '24h命中' : 'Hits'}</th>
                    <th className="p-3.5 text-right">{isZh ? '操作' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {rules
                    .filter((r) => {
                      if (severityFilter !== 'ALL' && r.severity !== severityFilter) return false;
                      if (
                        ruleSearch &&
                        !r.name.toLowerCase().includes(ruleSearch.toLowerCase()) &&
                        !r.id.toLowerCase().includes(ruleSearch.toLowerCase()) &&
                        !r.tactic.toLowerCase().includes(ruleSearch.toLowerCase()) &&
                        !r.ruleLogic.toLowerCase().includes(ruleSearch.toLowerCase())
                      ) {
                        return false;
                      }
                      return true;
                    })
                    .map((rule) => (
                      <tr key={rule.id} className="hover:bg-gray-800/40 transition-colors">
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => toggleRule(rule.id)}
                            className={cn(
                              'w-8 h-4 rounded-full transition-colors relative inline-block',
                              rule.enabled ? 'bg-emerald-600' : 'bg-gray-700'
                            )}
                            title={rule.enabled ? 'Enabled' : 'Disabled'}
                          >
                            <span
                              className={cn(
                                'w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform',
                                rule.enabled ? 'right-0.5' : 'left-0.5'
                              )}
                            />
                          </button>
                        </td>
                        <td className="p-3.5">
                          <div className="font-bold text-white text-xs">{rule.name}</div>
                          <div className="text-[10px] text-blue-400 font-mono mt-0.5">
                            {rule.id} • {rule.tactic} {rule.technique ? `• ${rule.technique}` : ''}
                          </div>
                          <div className="text-[10px] text-gray-500 font-mono mt-1 bg-black/40 px-2 py-1 rounded border border-gray-800/60 inline-block max-w-xl truncate">
                            {rule.ruleLogic}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={cn(
                              'text-[9px] font-black uppercase px-2 py-0.5 rounded border',
                              rule.severity === 'Critical'
                                ? 'bg-red-500/10 text-red-400 border-red-500/30'
                                : rule.severity === 'High'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                            )}
                          >
                            {rule.severity}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="flex gap-1 flex-wrap max-w-xs">
                            {rule.sources?.map((s) => (
                              <span key={s} className="px-1.5 py-0.5 bg-gray-800 text-gray-300 rounded text-[9px] font-mono">
                                {s}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3.5 font-mono text-gray-400 text-[11px] whitespace-nowrap">{rule.window}</td>
                        <td className="p-3.5 font-mono text-purple-300 text-[11px] whitespace-nowrap">{rule.joinKey}</td>
                        <td className="p-3.5 text-center font-mono text-xs font-bold text-white">
                          <span className={cn(rule.hits24h > 50 ? 'text-purple-400' : 'text-gray-400')}>
                            {rule.hits24h}
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => handleOpenRuleModal(rule)}
                            className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors inline-block"
                            title="Edit Rule"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteRule(rule.id)}
                            className="p-1.5 bg-gray-800 hover:bg-red-900/40 text-gray-400 hover:text-red-400 rounded-lg transition-colors inline-block"
                            title="Delete Rule"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Visual Rule Builder Modal Drawer */}
          <AnimatePresence>
            {isEditingRule && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ scale: 0.95, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 20 }}
                  className="bg-[#111116] border border-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar p-6 space-y-6 shadow-2xl text-left"
                >
                  <div className="flex items-center justify-between pb-4 border-b border-gray-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-600/20 rounded-xl text-blue-400">
                        <FileCode size={20} />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-white">
                          {editingRuleData.id
                            ? isZh ? `編輯關聯規則 (${editingRuleData.id})` : `Edit Correlation Rule (${editingRuleData.id})`
                            : isZh ? '新建跨維度關聯規則' : 'Create New Correlation Rule'}
                        </h3>
                        <p className="text-xs text-gray-400">
                          {isZh ? '定義多階段事件觸發條件、滑動時間閥值與實體關聯鍵' : 'Define multi-stage event triggers, CEP sliding thresholds, and entity join keys.'}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => setIsEditingRule(false)} className="text-gray-400 hover:text-white text-lg font-bold">✕</button>
                  </div>

                  {/* Form fields */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-bold text-gray-400">{isZh ? '規則名稱' : 'Rule Name'}</label>
                      <input
                        type="text"
                        value={editingRuleData.name || ''}
                        onChange={(e) => setEditingRuleData({ ...editingRuleData, name: e.target.value })}
                        className="w-full bg-gray-900 border border-gray-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-blue-500 font-bold"
                        placeholder="e.g. In-Memory PowerShell Injection + High-Risk C2"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400">{isZh ? '嚴重等級' : 'Severity'}</label>
                      <select
                        value={editingRuleData.severity || 'High'}
                        onChange={(e) => setEditingRuleData({ ...editingRuleData, severity: e.target.value as any })}
                        className="w-full bg-gray-900 border border-gray-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-blue-500 font-bold"
                      >
                        <option value="Critical">Critical</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400">MITRE ATT&CK Tactic</label>
                      <input
                        type="text"
                        value={editingRuleData.tactic || ''}
                        onChange={(e) => setEditingRuleData({ ...editingRuleData, tactic: e.target.value })}
                        className="w-full bg-gray-900 border border-gray-800 rounded-xl p-2.5 text-xs text-blue-300 font-mono outline-none"
                        placeholder="e.g. TA0008 Lateral Movement"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400">{isZh ? '資料源 (逗號分隔)' : 'Data Sources (comma separated)'}</label>
                      <input
                        type="text"
                        value={editingRuleData.sources?.join(', ') || ''}
                        onChange={(e) =>
                          setEditingRuleData({
                            ...editingRuleData,
                            sources: e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                          })
                        }
                        className="w-full bg-gray-900 border border-gray-800 rounded-xl p-2.5 text-xs text-gray-200 font-mono outline-none"
                        placeholder="e.g. Active Directory, EDR, Firewall"
                      />
                    </div>
                  </div>

                  {/* Multi-Stage Visual Pipeline */}
                  <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl space-y-4">
                    <div className="text-xs font-black text-blue-400 uppercase tracking-widest flex items-center justify-between">
                      <span>{isZh ? '多事件關聯管道 (Sequential CEP Pattern)' : 'Event Stages Pipeline'}</span>
                      <span className="text-[10px] text-gray-500 font-mono">Real Flink Pattern Engine</span>
                    </div>

                    {/* Stage A */}
                    <div className="p-3 bg-black/40 border border-gray-800 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-white">
                        <span className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">A</span>
                          {isZh ? '階段 A 條件：初始存取 / 異常程序' : 'Stage A: Initial Trigger'}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">Source: EDR Telemetry</span>
                      </div>
                      <input
                        type="text"
                        value={editingRuleData.stages?.[0]?.condition || "process.name in ['powershell.exe', 'wscript.exe']"}
                        onChange={(e) => {
                          const stages = [...(editingRuleData.stages || [])];
                          if (!stages[0]) {
                            stages[0] = { stageId: 'A', name: 'Stage A', source: 'EDR', condition: '' };
                          }
                          stages[0].condition = e.target.value;
                          setEditingRuleData({ ...editingRuleData, stages });
                        }}
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2 font-mono text-[11px] text-emerald-400 outline-none"
                      />
                    </div>

                    {/* Stage B */}
                    <div className="p-3 bg-black/40 border border-gray-800 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-white">
                        <span className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px]">B</span>
                          {isZh ? '階段 B 條件：出境網路 / 提權連線' : 'Stage B: Subsequent Action'}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">Source: Network NDR</span>
                      </div>
                      <input
                        type="text"
                        value={editingRuleData.stages?.[1]?.condition || "network.direction == 'outbound' AND destination.port in [443, 8080]"}
                        onChange={(e) => {
                          const stages = [...(editingRuleData.stages || [])];
                          if (!stages[1]) {
                            stages[1] = { stageId: 'B', name: 'Stage B', source: 'NDR', condition: '' };
                          }
                          stages[1].condition = e.target.value;
                          setEditingRuleData({ ...editingRuleData, stages });
                        }}
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2 font-mono text-[11px] text-emerald-400 outline-none"
                      />
                    </div>

                    {/* Join Keys & Window */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-400">{isZh ? '關聯主鍵 (Join Keys)' : 'Join Keys (Cross-Event)'}</label>
                        <input
                          type="text"
                          value={editingRuleData.joinKey || 'host.ip, user.name'}
                          onChange={(e) => setEditingRuleData({ ...editingRuleData, joinKey: e.target.value })}
                          className="w-full bg-gray-900 border border-gray-800 rounded-xl p-2.5 font-mono text-xs text-purple-300 outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-400">{isZh ? '滑動時間窗口 (Sliding Window)' : 'Sliding Time Window'}</label>
                        <input
                          type="text"
                          value={editingRuleData.window || '300s (5 min)'}
                          onChange={(e) => setEditingRuleData({ ...editingRuleData, window: e.target.value })}
                          className="w-full bg-gray-900 border border-gray-800 rounded-xl p-2.5 font-mono text-xs text-white outline-none"
                        />
                      </div>
                    </div>

                    {/* Full Rule Logic Expression */}
                    <div className="space-y-1.5 pt-2">
                      <label className="text-xs font-bold text-gray-400">{isZh ? '綜合 CEP 運算邏輯表達式' : 'Rule Logic Expression'}</label>
                      <input
                        type="text"
                        value={editingRuleData.ruleLogic || ''}
                        onChange={(e) => setEditingRuleData({ ...editingRuleData, ruleLogic: e.target.value })}
                        className="w-full bg-gray-900 border border-gray-800 rounded-xl p-2.5 font-mono text-xs text-amber-300 outline-none"
                        placeholder="EventA(...) -> EventB(...) within 300s"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                    <button
                      onClick={() => setIsEditingRule(false)}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold"
                    >
                      {isZh ? '取消' : 'Cancel'}
                    </button>
                    <button
                      onClick={handleSaveRule}
                      disabled={savingRule}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30"
                    >
                      <Save size={14} />
                      {savingRule ? (isZh ? '儲存編譯中...' : 'Saving...') : (isZh ? '儲存並立即套用' : 'Save & Hot Deploy')}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* TAB 2: SLIDING WINDOWS & CEP STATE ENGINE */}
      {activeTab === 'window' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-[#111116] border border-gray-800 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-red-400">{isZh ? '快速突發攻擊窗口' : 'Fast Burst Window'}</span>
                <Clock size={16} className="text-red-400" />
              </div>
              <div className="text-2xl font-black text-white font-mono">{windowConfig.burstWindowSeconds}s</div>
              <p className="text-xs text-gray-400">
                {isZh ? '專門針對暴力破解、DDoS 洪水與勒索軟體大規模加密抹除之高頻關聯。' : 'High-frequency correlation targeting brute force, DDoS bursts, and ransomware rapid encryption.'}
              </p>
              <div className="pt-2 border-t border-gray-800 flex justify-between text-[10px] font-mono text-gray-500">
                <span>In-Memory State: 380 MB</span>
                <span className="text-emerald-400 font-bold">Latency: 1.2ms</span>
              </div>
            </div>

            <div className="p-6 bg-[#111116] border border-gray-800 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-amber-400">{isZh ? '常規攻擊鏈推進窗口' : 'Kill-Chain Stage Window'}</span>
                <Clock size={16} className="text-amber-400" />
              </div>
              <div className="text-2xl font-black text-white font-mono">{windowConfig.killChainWindowMinutes} min</div>
              <p className="text-xs text-gray-400">
                {isZh ? '覆蓋從魚叉釣魚郵件點擊、C2 建立到內網橫向移動與特權提升之多階段時序。' : 'Spanning initial phishing, C2 beaconing, lateral movement, and privilege escalation stages.'}
              </p>
              <div className="pt-2 border-t border-gray-800 flex justify-between text-[10px] font-mono text-gray-500">
                <span>In-Memory State: 1.2 GB</span>
                <span className="text-emerald-400 font-bold">Latency: 4.8ms</span>
              </div>
            </div>

            <div className="p-6 bg-[#111116] border border-gray-800 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-blue-400">{isZh ? '慢速滲透 APT 漂移窗口' : 'Slow-and-Low APT Window'}</span>
                <Clock size={16} className="text-blue-400" />
              </div>
              <div className="text-2xl font-black text-white font-mono">{windowConfig.slowAptWindowDays} days</div>
              <p className="text-xs text-gray-400">
                {isZh ? '專門偵測低頻心跳 Beaconing、定時暗夜探查與長週期資料庫慢速竊取行為。' : 'Catching stealth low-frequency beaconing, off-hours probing, and long-term exfiltration.'}
              </p>
              <div className="pt-2 border-t border-gray-800 flex justify-between text-[10px] font-mono text-gray-500">
                <span>RocksDB State: 3.4 GB</span>
                <span className="text-blue-400 font-bold">Checkpoint: Active</span>
              </div>
            </div>
          </div>

          <div className="bg-[#111116] border border-gray-800 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800 flex-wrap gap-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <HardDrive size={16} className="text-blue-400" />
                {isZh ? 'CEP 狀態暫存與亂序事件水線 (Watermark & Out-of-Order Lateness)' : 'CEP Watermark & Lateness Configuration'}
              </h3>
              <button
                onClick={handleSaveWindowConfig}
                disabled={savingWindow}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-600/30"
              >
                <Save size={14} />
                {savingWindow ? (isZh ? '儲存中...' : 'Saving...') : (isZh ? '儲存窗口與狀態設定' : 'Save Window Config')}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400">{isZh ? '日誌亂序到達容忍水線 (Allowed Lateness, 秒)' : 'Allowed Watermark Lateness (Seconds)'}</label>
                <input
                  type="number"
                  value={windowConfig.allowedLatenessSeconds}
                  onChange={(e) => setWindowConfig({ ...windowConfig, allowedLatenessSeconds: Number(e.target.value) })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl p-2.5 text-xs font-mono text-white outline-none focus:border-blue-500"
                />
                <p className="text-[10px] text-gray-500">
                  {isZh ? '當代理或遠端探針延遲送達時，在允許水線時間內仍會被納入關聯滑動窗口計算。' : 'Late-arriving logs within this threshold are seamlessly evaluated against active window states.'}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400">{isZh ? 'RocksDB 記憶體狀態快照頻率 (State Checkpoint, 秒)' : 'RocksDB Checkpoint Interval (Seconds)'}</label>
                <input
                  type="number"
                  value={windowConfig.checkpointIntervalSeconds}
                  onChange={(e) => setWindowConfig({ ...windowConfig, checkpointIntervalSeconds: Number(e.target.value) })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl p-2.5 text-xs font-mono text-emerald-400 outline-none focus:border-blue-500"
                />
                <p className="text-[10px] text-gray-500">
                  {isZh ? '發生節點故障時，CEP 引擎可在 2 秒內從 Checkpoint 無縫恢復關聯狀態。' : 'Enables instant state recovery in under 2s during worker failovers.'}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400">{isZh ? '狀態記憶體配額上限 (Max State Memory, MB)' : 'Max State Memory Quota (MB)'}</label>
                <input
                  type="number"
                  value={windowConfig.maxStateMemoryMB}
                  onChange={(e) => setWindowConfig({ ...windowConfig, maxStateMemoryMB: Number(e.target.value) })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl p-2.5 text-xs font-mono text-purple-300 outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400">{isZh ? 'RocksDB 壓縮演算法 (Compression Algorithm)' : 'RocksDB Compression'}</label>
                <select
                  value={windowConfig.rocksdbCompression}
                  onChange={(e) => setWindowConfig({ ...windowConfig, rocksdbCompression: e.target.value as any })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl p-2.5 text-xs font-mono text-white outline-none focus:border-blue-500"
                >
                  <option value="LZ4">LZ4 (High Speed, Recommended)</option>
                  <option value="Snappy">Snappy (Balanced)</option>
                  <option value="ZSTD">ZSTD (High Compression Ratio)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SCHEMA MAPPING & LIVE TEST SIMULATOR */}
      {activeTab === 'mapping' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Schema Normalization Matrix */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-[#111116] border border-gray-800 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-800 flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <ArrowRightLeft size={16} className="text-purple-400" />
                    {isZh ? 'ECS / Interflow 欄位標準化對齊' : 'ECS Schema Normalization Mapping'}
                  </h3>
                  <span className="text-[10px] font-mono text-gray-500">
                    {schemaMappings.length} Connectors Active in CEP Normalizer
                  </span>
                </div>
                <button
                  onClick={() => setIsAddingMapping(true)}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/20"
                >
                  <Plus size={13} />
                  {isZh ? '新增欄位映射' : 'Add Mapping'}
                </button>
              </div>

              {/* Add Mapping Drawer/Form */}
              {isAddingMapping && (
                <div className="p-4 bg-gray-900 border border-purple-500/30 rounded-xl space-y-3">
                  <div className="text-xs font-bold text-purple-300">{isZh ? '新建欄位轉換規則' : 'New Field Mapping Rule'}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Source Field (e.g. Win_Event.TargetUserName)"
                      value={newMappingData.sourceField || ''}
                      onChange={(e) => setNewMappingData({ ...newMappingData, sourceField: e.target.value })}
                      className="bg-black/60 border border-gray-800 rounded-lg p-2 text-xs font-mono text-white outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Target Field (e.g. user.name)"
                      value={newMappingData.targetField || ''}
                      onChange={(e) => setNewMappingData({ ...newMappingData, targetField: e.target.value })}
                      className="bg-black/60 border border-gray-800 rounded-lg p-2 text-xs font-mono text-emerald-400 outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <select
                      value={newMappingData.transformation || 'Extract & Trim'}
                      onChange={(e) => setNewMappingData({ ...newMappingData, transformation: e.target.value })}
                      className="bg-black/60 border border-gray-800 rounded-lg p-2 text-xs font-mono text-white outline-none"
                    >
                      <option value="Direct">Direct Pass</option>
                      <option value="Extract & Trim">Extract & Trim</option>
                      <option value="IPv4 Validate">IPv4 Validate</option>
                      <option value="Parse ARN">Parse ARN</option>
                      <option value="De-obfuscate Base64">De-obfuscate Base64</option>
                      <option value="Lowercase">Lowercase</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Description"
                      value={newMappingData.description || ''}
                      onChange={(e) => setNewMappingData({ ...newMappingData, description: e.target.value })}
                      className="bg-black/60 border border-gray-800 rounded-lg p-2 text-xs text-gray-300 outline-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => setIsAddingMapping(false)}
                      className="px-3 py-1 bg-gray-800 text-gray-300 rounded-lg text-xs"
                    >
                      {isZh ? '取消' : 'Cancel'}
                    </button>
                    <button
                      onClick={handleAddSchemaMapping}
                      className="px-4 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold"
                    >
                      {isZh ? '確認新增' : 'Save'}
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3 font-mono text-xs max-h-[520px] overflow-y-auto custom-scrollbar pr-1">
                {schemaMappings.map((m) => (
                  <div key={m.id} className="p-3 bg-gray-900/60 border border-gray-800 rounded-xl flex items-center justify-between gap-2 hover:border-gray-700 transition-colors">
                    <div className="text-gray-400 truncate flex-1 font-mono text-[11px]">{m.sourceField}</div>
                    <ArrowRightLeft size={12} className="text-blue-500 flex-shrink-0" />
                    <div className="text-emerald-400 font-bold flex-1 font-mono text-[11px] truncate">{m.targetField}</div>
                    <span className="text-[9px] px-2 py-0.5 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded whitespace-nowrap">
                      {m.transformation}
                    </span>
                    <button
                      onClick={() => handleDeleteSchemaMapping(m.id)}
                      className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                      title="Delete Mapping"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Live Test Simulator */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#111116] border border-gray-800 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-800 flex-wrap gap-2">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Play size={16} className="text-emerald-400" />
                  {isZh ? '即時日誌注入與規則模擬器' : 'Live Test Rule Simulator'}
                </h3>
                <button
                  onClick={handleRunSimulation}
                  disabled={isTesting}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/30"
                >
                  <Zap size={13} className={cn(isTesting && 'animate-spin')} />
                  {isTesting ? (isZh ? '測試中...' : 'Evaluating...') : (isZh ? '執行匹配測試' : 'Run Match')}
                </button>
              </div>

              {/* Presets Chips */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                  <span>{isZh ? '載入攻擊情境範例' : 'Load Attack Scenario Presets'}</span>
                  <span className="text-gray-500 font-mono text-[9px]">Click to inject</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_PAYLOADS.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => setTestPayload(JSON.stringify(preset.payload, null, 2))}
                      className="px-2 py-1 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 text-gray-300 rounded-lg text-[10px] font-mono transition-all text-left"
                    >
                      {isZh ? preset.nameZh : preset.nameEn}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase">{isZh ? '模擬日誌 JSON Payload' : 'Input JSON Payload'}</label>
                <textarea
                  value={testPayload}
                  onChange={(e) => setTestPayload(e.target.value)}
                  rows={8}
                  className="w-full bg-black/60 border border-gray-800 rounded-xl p-3 font-mono text-[11px] text-blue-300 outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {testResult && (
                <div
                  className={cn(
                    'p-4 rounded-xl space-y-3 animate-in fade-in border',
                    testResult.matched
                      ? 'bg-emerald-950/20 border-emerald-500/40 text-gray-200'
                      : 'bg-gray-900/40 border-gray-800 text-gray-400'
                  )}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className={cn('font-bold flex items-center gap-1.5', testResult.matched ? 'text-emerald-400' : 'text-gray-400')}>
                      {testResult.matched ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                      {testResult.matched
                        ? (isZh ? '規則成功命中 (Match Hit!)' : 'Rule Match Hit!')
                        : (isZh ? '未命中規則 (No Trigger)' : 'No Trigger')}
                    </span>
                    <span className="text-[10px] font-mono text-gray-400">Time: {testResult.executionTime}</span>
                  </div>

                  {testResult.matched ? (
                    <>
                      <div className="text-xs font-bold text-white">{testResult.ruleName}</div>
                      <div className="text-[10px] text-blue-400 font-mono">
                        {testResult.ruleId} • Confidence: <span className="text-emerald-400 font-bold">{testResult.confidenceScore}%</span> • {testResult.tactic}
                      </div>

                      {/* Matched stages */}
                      {testResult.matchedStages && testResult.matchedStages.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-[10px] text-gray-500 uppercase font-bold">{isZh ? '觸發階段序列' : 'Matched Stages'}:</div>
                          <div className="flex flex-wrap gap-1">
                            {testResult.matchedStages.map((stg: string, i: number) => (
                              <span key={i} className="text-[9px] bg-blue-950 text-blue-300 border border-blue-800/60 px-1.5 py-0.5 rounded font-mono">
                                {stg}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Extracted Join Keys */}
                      {testResult.extractedKeys && (
                        <div className="pt-2 border-t border-gray-800 font-mono text-[10px] space-y-1">
                          <div className="text-gray-500 font-bold uppercase">{isZh ? '提取實體關聯鍵 (Join Keys)' : 'Extracted Join Keys'}:</div>
                          {Object.entries(testResult.extractedKeys).map(([k, v]) => (
                            <div key={k} className="flex justify-between">
                              <span className="text-gray-400">{k}:</span>
                              <span className="text-purple-300 font-bold">{String(v)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Trace */}
                      {testResult.trace && (
                        <div className="pt-2 border-t border-gray-800 text-[10px] font-mono space-y-0.5 text-gray-400">
                          <div className="text-gray-500 font-bold uppercase">{isZh ? '執行軌跡 (CEP Trace)' : 'Execution Trace'}:</div>
                          {testResult.trace.map((tr: string, i: number) => (
                            <div key={i} className="flex items-center gap-1 text-emerald-400/80">
                              <span>✓</span>
                              <span>{tr}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-xs text-gray-400 space-y-1">
                      <p>{testResult.message || (isZh ? '輸入日誌不符合當前已啟用之關聯分析規則條件。' : 'Payload did not meet any rule trigger threshold.')}</p>
                      {testResult.trace && (
                        <div className="text-[10px] font-mono text-gray-500 space-y-0.5 pt-1">
                          {testResult.trace.map((t: string, i: number) => (
                            <div key={i}>• {t}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ALERT AGGREGATION & STORM SUPPRESSION */}
      {activeTab === 'aggregation' && (
        <div className="space-y-6">
          <div className="bg-[#111116] border border-gray-800 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800 flex-wrap gap-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Layers size={16} className="text-blue-400" />
                {isZh ? '告警風暴抑制與聚合降噪策略' : 'Alert Storm Suppression & Grouping Policies'}
              </h3>
              <button
                onClick={handleSaveAggregationConfig}
                disabled={savingAggregation}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-600/30"
              >
                <Save size={14} />
                {savingAggregation ? (isZh ? '儲存中...' : 'Saving...') : (isZh ? '儲存降噪聚合設定' : 'Save Policies')}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Entity Clustering Card */}
              <div className="p-5 bg-gray-900/60 border border-gray-800 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-white">{isZh ? '實體維度告警聚合 (Entity Grouping)' : 'Entity Clustering'}</div>
                  <button
                    onClick={() =>
                      setAggregationConfig({
                        ...aggregationConfig,
                        entityClusteringEnabled: !aggregationConfig.entityClusteringEnabled
                      })
                    }
                    className={cn(
                      'w-8 h-4 rounded-full transition-colors relative inline-block',
                      aggregationConfig.entityClusteringEnabled ? 'bg-emerald-600' : 'bg-gray-700'
                    )}
                  >
                    <span
                      className={cn(
                        'w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform',
                        aggregationConfig.entityClusteringEnabled ? 'right-0.5' : 'left-0.5'
                      )}
                    />
                  </button>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {isZh
                    ? '同一主機 IP 或使用者帳號在指定時間窗口內觸發的同類告警自動聚合為單一 Incident，大幅避免 SOC 告警疲勞。'
                    : 'Group repeated detections from the same host or user within the window into a single clustered incident.'}
                </p>
                <div className="space-y-2 pt-2 border-t border-gray-800">
                  <label className="text-xs font-bold text-gray-400">{isZh ? '聚合窗口 (分鐘)' : 'Clustering Window (Minutes)'}</label>
                  <input
                    type="number"
                    value={aggregationConfig.clusteringWindowMinutes}
                    onChange={(e) =>
                      setAggregationConfig({
                        ...aggregationConfig,
                        clusteringWindowMinutes: Number(e.target.value)
                      })
                    }
                    className="w-full bg-black/60 border border-gray-800 rounded-xl p-2.5 text-xs font-mono text-white outline-none"
                  />
                </div>
              </div>

              {/* Dynamic Escalation Matrix Card */}
              <div className="p-5 bg-gray-900/60 border border-gray-800 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-white">{isZh ? '嚴重等級動態升級矩陣 (Severity Escalation)' : 'Dynamic Escalation Matrix'}</div>
                  <button
                    onClick={() =>
                      setAggregationConfig({
                        ...aggregationConfig,
                        escalationMatrixEnabled: !aggregationConfig.escalationMatrixEnabled
                      })
                    }
                    className={cn(
                      'w-8 h-4 rounded-full transition-colors relative inline-block',
                      aggregationConfig.escalationMatrixEnabled ? 'bg-emerald-600' : 'bg-gray-700'
                    )}
                  >
                    <span
                      className={cn(
                        'w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform',
                        aggregationConfig.escalationMatrixEnabled ? 'right-0.5' : 'left-0.5'
                      )}
                    />
                  </button>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {isZh
                    ? '若同一實體在指定時間內累積達到告警閥值，系統自動動態升級嚴重等級並優先通知輪值資安分析師。'
                    : 'Automatically escalates multiple detections into a higher severity incident with on-call alert.'}
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-800">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400">{isZh ? '累積門檻次數' : 'Threshold Count'}</label>
                    <input
                      type="number"
                      value={aggregationConfig.escalationThreshold}
                      onChange={(e) =>
                        setAggregationConfig({
                          ...aggregationConfig,
                          escalationThreshold: Number(e.target.value)
                        })
                      }
                      className="w-full bg-black/60 border border-gray-800 rounded-xl p-2 text-xs font-mono text-amber-300 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400">{isZh ? '觀察窗口 (分鐘)' : 'Window (Mins)'}</label>
                    <input
                      type="number"
                      value={aggregationConfig.escalationWindowMinutes}
                      onChange={(e) =>
                        setAggregationConfig({
                          ...aggregationConfig,
                          escalationWindowMinutes: Number(e.target.value)
                        })
                      }
                      className="w-full bg-black/60 border border-gray-800 rounded-xl p-2 text-xs font-mono text-white outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ENGINE CLUSTER & ROCKSDB STATUS */}
      {activeTab === 'engine' && (
        <div className="space-y-6">
          {/* Cluster Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111116] border border-gray-800 p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <Server className="text-blue-400" size={20} />
              <div>
                <h4 className="text-xs font-black text-white uppercase">{isZh ? 'Apache Flink CEP + RocksDB 狀態叢集' : 'CEP Engine Cluster'}</h4>
                <p className="text-[11px] text-gray-400">
                  {engineStatus?.engineType || 'High-Throughput State Backend'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleReloadEngine}
                disabled={reloadingEngine}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-600/30"
              >
                <RefreshCw size={13} className={cn(reloadingEngine && 'animate-spin')} />
                {reloadingEngine ? (isZh ? '熱重載中...' : 'Reloading...') : (isZh ? '熱重載 CEP 規則庫' : 'Hot Reload CEP')}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 bg-[#111116] border border-gray-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-gray-400">{engineStatus?.cluster?.master?.node || 'CEP Master 01'}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="text-lg font-black text-white font-mono">{engineStatus?.cluster?.master?.role || 'Leader (Active)'}</div>
              <div className="text-[11px] text-gray-400 space-y-1 font-mono">
                <div>CPU Load: {engineStatus?.cluster?.master?.cpuPercent ?? 18.4}%</div>
                <div>Memory: {engineStatus?.cluster?.master?.memoryUsed ?? '2.1 GB'} / {engineStatus?.cluster?.master?.memoryTotal ?? '8.0 GB'}</div>
                <div>Uptime: {engineStatus?.cluster?.master?.uptime ?? '18d 04h'}</div>
              </div>
            </div>

            {engineStatus?.cluster?.workers?.map((w: any) => (
              <div key={w.id} className="p-5 bg-[#111116] border border-gray-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-gray-400">{w.name}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                <div className="text-lg font-black text-white font-mono">{w.eps.toLocaleString()} EPS</div>
                <div className="text-[11px] text-gray-400 space-y-1 font-mono">
                  <div>RocksDB State: {w.rocksdbStateMB} MB</div>
                  <div>Latency: {w.latencyMs} ms</div>
                  <div>Active Windows: {w.activeWindows}</div>
                </div>
              </div>
            )) || (
              <>
                <div className="p-5 bg-[#111116] border border-gray-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-gray-400">Worker Node 01</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                  <div className="text-lg font-black text-white font-mono">92,400 EPS</div>
                  <div className="text-[11px] text-gray-400 space-y-1 font-mono">
                    <div>RocksDB State: 1.2 GB</div>
                    <div>Latency: 3.8 ms</div>
                  </div>
                </div>
                <div className="p-5 bg-[#111116] border border-gray-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-gray-400">Worker Node 02</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                  <div className="text-lg font-black text-white font-mono">93,000 EPS</div>
                  <div className="text-[11px] text-gray-400 space-y-1 font-mono">
                    <div>RocksDB State: 1.1 GB</div>
                    <div>Latency: 4.1 ms</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
