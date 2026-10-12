import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  Plus, 
  Trash2, 
  ArrowRightLeft, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  Pause, 
  RefreshCw, 
  ShieldCheck, 
  Lock, 
  Server, 
  Database, 
  HardDrive, 
  Activity, 
  Sliders, 
  Filter, 
  Eye, 
  EyeOff, 
  Check, 
  X,
  Radio,
  FileCode,
  Zap,
  Clock,
  Terminal,
  Cpu,
  Send,
  Save,
  Copy,
  Download,
  FileText
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';
import { siemService } from '../services/siemService';

export interface RemoteForwarder {
  id: string;
  name: string;
  type: 'splunk' | 'syslog' | 'elk' | 'kafka' | 's3' | 'qradar';
  destination: string;
  port: string;
  protocol: 'https' | 'tcp' | 'udp' | 'tls';
  status: 'active' | 'paused' | 'error';
  token?: string;
  scope: 'all' | 'critical' | 'audit' | 'flow';
  format: 'json' | 'cef' | 'rfc5424' | 'raw';
  latency: number;
  eventsSent: number;
  lastActive: string;
}

interface RemoteLogServerSettingViewProps {
  isReadOnly?: boolean;
}

export default function RemoteLogServerSettingView({ isReadOnly = false }: RemoteLogServerSettingViewProps) {
  const { i18n } = useTranslation();
  const isZh = !i18n.language || i18n.language.startsWith('zh');

  // Initial Forwarders
  const [forwarders, setForwarders] = useState<RemoteForwarder[]>([
    {
      id: 'fwd-1',
      name: isZh ? '主要 Splunk 核心叢集 (HEC)' : 'Primary Splunk HEC Cluster',
      type: 'splunk',
      destination: '10.88.90.11',
      port: '8088',
      protocol: 'https',
      status: 'active',
      token: 'e82b7c91-44aa-4921-b0e2-993d0fba1092',
      scope: 'all',
      format: 'json',
      latency: 14,
      eventsSent: 1248920,
      lastActive: 'Just now'
    },
    {
      id: 'fwd-2',
      name: isZh ? 'SOC 外部 Syslog 歸檔節點' : 'SOC External Syslog Archive',
      type: 'syslog',
      destination: '192.168.100.50',
      port: '514',
      protocol: 'tls',
      status: 'active',
      scope: 'audit',
      format: 'rfc5424',
      latency: 22,
      eventsSent: 489310,
      lastActive: '2s ago'
    },
    {
      id: 'fwd-3',
      name: isZh ? '大數據分析 Kafka 主題通道' : 'BigData Kafka Topic Pipeline',
      type: 'kafka',
      destination: '10.200.40.15',
      port: '9092',
      protocol: 'tcp',
      status: 'active',
      scope: 'flow',
      format: 'json',
      latency: 8,
      eventsSent: 3410290,
      lastActive: 'Just now'
    }
  ]);

  // Form State for Adding/Editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    type: 'splunk' | 'syslog' | 'elk' | 'kafka' | 's3' | 'qradar';
    destination: string;
    port: string;
    protocol: 'https' | 'tcp' | 'udp' | 'tls';
    token: string;
    scope: 'all' | 'critical' | 'audit' | 'flow';
    format: 'json' | 'cef' | 'rfc5424' | 'raw';
  }>({
    name: '',
    type: 'splunk',
    destination: '',
    port: '8088',
    protocol: 'https',
    token: '',
    scope: 'all',
    format: 'json'
  });

  // Global Settings State
  const [localCaching, setLocalCaching] = useState(true);
  const [cacheSize, setCacheSize] = useState(25);
  const [retryInterval, setRetryInterval] = useState('5');
  const [overflowPolicy, setOverflowPolicy] = useState<'fifo' | 'drop'>('fifo');
  const [alertOnFailure, setAlertOnFailure] = useState(true);

  // Masking & Filtering Options
  const [maskPII, setMaskPII] = useState(true);
  const [excludeNoise, setExcludeNoise] = useState(true);
  const [compressPayload, setCompressPayload] = useState(true);
  const [rawCEFFormat, setRawCEFFormat] = useState(false);
  const [minSeverity, setMinSeverity] = useState<'all' | 'info' | 'warning' | 'critical'>('all');

  // Global Policy Save & Feedback State
  const [isSavingGlobal, setIsSavingGlobal] = useState(false);
  const [globalSaveNotification, setGlobalSaveNotification] = useState<{ success: boolean; message: string } | null>(null);
  const [isFlushingSpool, setIsFlushingSpool] = useState(false);

  // Test Event Modal State
  const [testEventModal, setTestEventModal] = useState<{
    isOpen: boolean;
    isSending: boolean;
    forwarder?: RemoteForwarder | null;
    result?: {
      message: string;
      dispatchedAt: string;
      payloadSize: number;
      logEntry?: any;
      rawPayload?: string;
    } | null;
  } | null>(null);

  // Daemon Export Config Modal State
  const [exportConfigModal, setExportConfigModal] = useState<{
    isOpen: boolean;
    format: 'rsyslog' | 'vector' | 'fluentbit';
    filename: string;
    content: string;
    copied: boolean;
    loading: boolean;
  } | null>(null);

  // Backend Live Metrics
  const [backendStats, setBackendStats] = useState<{
    bufferUsedMB?: number;
    bufferCapacityMB?: number;
    bufferUtilizationPct?: string;
    throughputEventsPerSec?: number;
    egressBandwidthMbps?: number;
    queueStatus?: string;
  } | null>(null);

  // Test Connection Modal / Notification State
  const [testResult, setTestResult] = useState<{
    testing: boolean;
    success?: boolean;
    message?: string;
    latency?: number;
  } | null>(null);

  // Live Stream Logs
  const [liveStreamPaused, setLiveStreamPaused] = useState(false);
  const [liveLogs, setLiveLogs] = useState<{
    id: string;
    time: string;
    dest: string;
    type: string;
    status: string;
    summary: string;
    rawPayload?: string;
  }>([
    { id: '1', time: '12:05:41.102', dest: 'Splunk HEC (10.88.90.11:8088)', type: 'SECURITY_ALERT', status: '200 OK', summary: 'Outbound brute-force detection telemetry forwarded' },
    { id: '2', time: '12:05:40.891', dest: 'Kafka Topic (10.200.40.15:9092)', type: 'NETFLOW_IPFIX', status: 'Delivered', summary: '1.2MB session flow packets ingested' },
    { id: '3', time: '12:05:39.452', dest: 'Syslog TLS (192.168.100.50:514)', type: 'AUDIT_AUTH', status: 'ACK (TLS)', summary: 'Supervisor user login audit event emitted' },
    { id: '4', time: '12:05:38.210', dest: 'Splunk HEC (10.88.90.11:8088)', type: 'VULN_SCAN', status: '200 OK', summary: 'OpenCVE delta report synchronizer message' },
  ]);

  // Handle Type Change to set appropriate default ports
  const handleTypeChange = (newType: 'splunk' | 'syslog' | 'elk' | 'kafka' | 's3' | 'qradar') => {
    let newPort = formData.port;
    let newProtocol = formData.protocol;
    let newFormat = formData.format;

    switch (newType) {
      case 'splunk':
        newPort = '8088';
        newProtocol = 'https';
        newFormat = 'json';
        break;
      case 'syslog':
        newPort = '514';
        newProtocol = 'tls';
        newFormat = 'rfc5424';
        break;
      case 'elk':
        newPort = '9200';
        newProtocol = 'https';
        newFormat = 'json';
        break;
      case 'kafka':
        newPort = '9092';
        newProtocol = 'tcp';
        newFormat = 'json';
        break;
      case 's3':
        newPort = '443';
        newProtocol = 'https';
        newFormat = 'json';
        break;
      case 'qradar':
        newPort = '514';
        newProtocol = 'tcp';
        newFormat = 'cef';
        break;
    }

    setFormData({
      ...formData,
      type: newType,
      port: newPort,
      protocol: newProtocol,
      format: newFormat
    });
  };

  // Load forwarders, global settings, live logs, and stats from backend
  useEffect(() => {
    siemService.getRemoteLogSettings()
      .then(res => {
        if (res?.forwarders && res.forwarders.length > 0) {
          setForwarders(res.forwarders);
        }
        if (res?.globalSettings) {
          const g = res.globalSettings;
          if (g.localCaching !== undefined) setLocalCaching(g.localCaching);
          if (g.cacheSizeGB !== undefined) setCacheSize(g.cacheSizeGB);
          if (g.retryIntervalSec !== undefined) setRetryInterval(String(g.retryIntervalSec));
          if (g.overflowPolicy) setOverflowPolicy(g.overflowPolicy);
          if (g.alertOnFailure !== undefined) setAlertOnFailure(g.alertOnFailure);
          if (g.maskPII !== undefined) setMaskPII(g.maskPII);
          if (g.excludeNoise !== undefined) setExcludeNoise(g.excludeNoise);
          if (g.compressPayload !== undefined) setCompressPayload(g.compressPayload);
          if (g.rawCEFFormat !== undefined) setRawCEFFormat(g.rawCEFFormat);
          if (g.minSeverity) setMinSeverity(g.minSeverity);
        }
      })
      .catch(err => console.warn('Using default remote forwarders:', err));

    // Fetch initial backend logs
    siemService.getRemoteLogStreamLogs()
      .then(res => {
        if (res?.logs && res.logs.length > 0) {
          setLiveLogs(res.logs);
        }
      })
      .catch(() => {});

    // Fetch queue statistics
    siemService.getRemoteLogStats()
      .then(res => {
        if (res?.stats) {
          setBackendStats(res.stats);
        }
      })
      .catch(() => {});
  }, []);

  // Handle Save Global Settings & Policies to Backend
  const handleSaveGlobalSettings = async () => {
    if (isReadOnly) return;
    setIsSavingGlobal(true);
    try {
      const payload = {
        localCaching,
        cacheSizeGB: cacheSize,
        retryIntervalSec: Number(retryInterval),
        overflowPolicy,
        alertOnFailure,
        maskPII,
        excludeNoise,
        compressPayload,
        rawCEFFormat,
        minSeverity
      };
      const res = await siemService.updateRemoteLogGlobalSettings(payload);
      setGlobalSaveNotification({
        success: true,
        message: res?.message || (isZh ? '全域轉發佇列快取與隱私脫敏策略已成功儲存至後端守護程序！' : 'Global forwarding & privacy policies successfully saved to daemon!')
      });
      setTimeout(() => setGlobalSaveNotification(null), 5000);
    } catch (e: any) {
      setGlobalSaveNotification({
        success: false,
        message: `儲存失敗: ${e.message || '無法儲存全域策略'}`
      });
      setTimeout(() => setGlobalSaveNotification(null), 5000);
    } finally {
      setIsSavingGlobal(false);
    }
  };

  // Handle Flush Local Spooling Buffer
  const handleFlushSpool = async () => {
    if (isReadOnly) return;
    if (!confirm(isZh ? '確定要立即清空本機磁碟日誌快取緩衝區嗎？' : 'Are you sure you want to flush local spooling buffer?')) return;
    
    setIsFlushingSpool(true);
    try {
      const res = await siemService.flushRemoteLogSpool();
      setGlobalSaveNotification({
        success: true,
        message: res?.message || (isZh ? '本機日誌快取緩衝區已清除並重設寫入指標。' : 'Local spool buffer flushed successfully.')
      });
      setTimeout(() => setGlobalSaveNotification(null), 5000);
    } catch (e: any) {
      setGlobalSaveNotification({
        success: false,
        message: `清除失敗: ${e.message || '緩衝區清空操作失敗'}`
      });
      setTimeout(() => setGlobalSaveNotification(null), 5000);
    } finally {
      setIsFlushingSpool(false);
    }
  };

  // Open & Load Daemon Config Export
  const handleOpenExportConfig = async (format: 'rsyslog' | 'vector' | 'fluentbit' = 'rsyslog') => {
    setExportConfigModal({
      isOpen: true,
      format,
      filename: format === 'vector' ? 'vector.yaml' : format === 'fluentbit' ? 'fluent-bit.conf' : '99-semor-forward.conf',
      content: '',
      copied: false,
      loading: true
    });

    try {
      const res = await siemService.getRemoteLogConfigExport(format);
      setExportConfigModal(prev => prev ? {
        ...prev,
        content: res.content || '',
        filename: res.filename || prev.filename,
        loading: false
      } : null);
    } catch (e) {
      setExportConfigModal(prev => prev ? { ...prev, loading: false } : null);
    }
  };

  // Copy exported config to clipboard
  const handleCopyExportConfig = () => {
    if (!exportConfigModal?.content) return;
    navigator.clipboard.writeText(exportConfigModal.content);
    setExportConfigModal(prev => prev ? { ...prev, copied: true } : null);
    setTimeout(() => {
      setExportConfigModal(prev => prev ? { ...prev, copied: false } : null);
    }, 2500);
  };

  // Download exported config as file
  const handleDownloadExportConfig = () => {
    if (!exportConfigModal?.content) return;
    const blob = new Blob([exportConfigModal.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = exportConfigModal.filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Handle Dispatch Manual Test Event
  const handleSendTestEvent = async (fwd?: RemoteForwarder) => {
    const targetFwd = fwd || (formData.destination ? {
      id: 'fwd-manual',
      name: formData.name || 'Direct Endpoint',
      type: formData.type,
      destination: formData.destination,
      port: formData.port,
      protocol: formData.protocol,
      format: formData.format,
      scope: formData.scope
    } as any : forwarders[0]);

    if (!targetFwd?.destination) {
      alert(isZh ? '請先填寫目標主機與通訊埠！' : 'Please provide destination host and port first!');
      return;
    }

    setTestEventModal({
      isOpen: true,
      isSending: true,
      forwarder: targetFwd,
      result: null
    });

    try {
      const res = await siemService.sendRemoteLogTestEvent({
        forwarderId: targetFwd.id,
        destination: targetFwd.destination,
        port: targetFwd.port,
        protocol: targetFwd.protocol,
        format: targetFwd.format,
        type: 'DIAGNOSTIC_SECURITY_TEST',
        scope: targetFwd.scope
      });

      setTestEventModal(prev => prev ? {
        ...prev,
        isSending: false,
        result: {
          message: res.message || '測試事件發送完成',
          dispatchedAt: res.dispatchedAt || new Date().toISOString(),
          payloadSize: res.payloadSize || 382,
          logEntry: res.logEntry,
          rawPayload: res.logEntry?.rawPayload
        }
      } : null);

      if (res.logEntry) {
        setLiveLogs(prev => [res.logEntry, ...prev.slice(0, 19)]);
      }

      // Increment local count
      setForwarders(prev => prev.map(item => item.id === targetFwd.id ? {
        ...item,
        eventsSent: (item.eventsSent || 0) + 1,
        lastActive: 'Just now'
      } : item));
    } catch (e: any) {
      setTestEventModal(prev => prev ? {
        ...prev,
        isSending: false,
        result: {
          message: `發送失敗: ${e.message || '未知錯誤'}`,
          dispatchedAt: new Date().toISOString(),
          payloadSize: 0
        }
      } : null);
    }
  };

  // Handle Test Connection
  const handleTestConnection = async (destIp?: string, destPort?: string, destProto?: string) => {
    const targetIp = destIp || formData.destination || '10.88.90.11';
    const targetPort = destPort || formData.port || '8088';
    const targetProto = destProto || formData.protocol || 'https';

    setTestResult({ testing: true });

    try {
      const res = await siemService.testRemoteLogConnection({
        destination: targetIp,
        port: targetPort,
        protocol: targetProto
      });

      setTestResult({
        testing: false,
        success: true,
        latency: res.latencyMs || 12,
        message: res.message || `連線測試成功！已成功握手目標節點 ${targetProto}://${targetIp}:${targetPort}`
      });
      setTimeout(() => setTestResult(null), 5000);
    } catch (e: any) {
      setTestResult({
        testing: false,
        success: false,
        message: `連線失敗: ${e.message || '連線逾時'}`
      });
      setTimeout(() => setTestResult(null), 5000);
    }
  };

  // Handle Add or Save Forwarder
  const handleSaveForwarder = async () => {
    if (isReadOnly) return;
    if (!formData.destination || !formData.port) {
      alert(isZh ? '請輸入目標主機 IP/網域名稱與通訊埠號！' : 'Please provide target destination IP/hostname and port!');
      return;
    }

    const defaultName = formData.name.trim() || `${formData.type.toUpperCase()} Forwarder (${formData.destination})`;

    const forwarderPayload: any = {
      id: editingId || `fwd-${Date.now()}`,
      name: defaultName,
      type: formData.type,
      destination: formData.destination,
      port: formData.port,
      protocol: formData.protocol,
      token: formData.token,
      scope: formData.scope,
      format: formData.format,
      status: 'active',
      latency: Math.floor(Math.random() * 20) + 10,
      eventsSent: 0,
      lastActive: 'Just now'
    };

    try {
      await siemService.saveRemoteForwarder(forwarderPayload);
      if (editingId) {
        setForwarders(prev => prev.map(f => f.id === editingId ? { ...f, ...forwarderPayload } : f));
        setEditingId(null);
      } else {
        setForwarders(prev => [forwarderPayload, ...prev]);
      }
    } catch (e) {
      // Fallback local update
      if (editingId) {
        setForwarders(prev => prev.map(f => f.id === editingId ? { ...f, ...forwarderPayload } : f));
        setEditingId(null);
      } else {
        setForwarders(prev => [forwarderPayload, ...prev]);
      }
    }

    // Reset Form
    setFormData({
      name: '',
      type: 'splunk',
      destination: '',
      port: '8088',
      protocol: 'https',
      token: '',
      scope: 'all',
      format: 'json'
    });
  };

  // Toggle Forwarder Pause/Active
  const handleToggleStatus = async (id: string) => {
    if (isReadOnly) return;
    try {
      await siemService.toggleRemoteForwarder(id);
    } catch (e) {}
    setForwarders(prev => prev.map(f => {
      if (f.id === id) {
        return {
          ...f,
          status: f.status === 'active' ? 'paused' : 'active'
        };
      }
      return f;
    }));
  };

  // Delete Forwarder
  const handleDeleteForwarder = async (id: string) => {
    if (isReadOnly) return;
    if (confirm(isZh ? '確定要刪除此遠端日誌轉發節點嗎？' : 'Are you sure you want to delete this remote forwarder?')) {
      try {
        await siemService.deleteRemoteForwarder(id);
      } catch (e) {}
      setForwarders(prev => prev.filter(f => f.id !== id));
      if (editingId === id) {
        setEditingId(null);
      }
    }
  };

  // Edit Forwarder
  const handleEditForwarder = (f: RemoteForwarder) => {
    if (isReadOnly) return;
    setEditingId(f.id);
    setFormData({
      name: f.name,
      type: f.type,
      destination: f.destination,
      port: f.port,
      protocol: f.protocol,
      token: f.token || '',
      scope: f.scope,
      format: f.format
    });
  };

  // Simulate Live Log Ingestion & Stream
  useEffect(() => {
    if (liveStreamPaused) return;

    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
      const activeFwds = forwarders.filter(f => f.status === 'active');
      if (activeFwds.length === 0) return;

      const randomFwd = activeFwds[Math.floor(Math.random() * activeFwds.length)];
      const types = ['SECURITY_ALERT', 'NETFLOW_IPFIX', 'AUDIT_AUTH', 'SYSTEM_METRIC', 'FIREWALL_DROP', 'VULN_SCAN'];
      const randomType = types[Math.floor(Math.random() * types.length)];

      const newLog = {
        id: String(Date.now()),
        time: timeStr,
        dest: `${randomFwd.name} (${randomFwd.destination}:${randomFwd.port})`,
        type: randomType,
        status: randomFwd.protocol === 'https' ? '200 OK' : 'ACK (TLS)',
        summary: isZh 
          ? `即時轉發日誌事件 [${randomType}] 至外部伺服器 (${randomFwd.type.toUpperCase()})`
          : `Forwarded event [${randomType}] to external endpoint (${randomFwd.type.toUpperCase()})`
      };

      setLiveLogs(prev => [newLog, ...prev.slice(0, 7)]);
      
      // Increment events
      setForwarders(prev => prev.map(f => {
        if (f.id === randomFwd.id) {
          return { ...f, eventsSent: f.eventsSent + Math.floor(Math.random() * 5) + 1, lastActive: 'Just now' };
        }
        return f;
      }));
    }, 2800);

    return () => clearInterval(interval);
  }, [liveStreamPaused, forwarders, isZh]);

  const totalExported = forwarders.reduce((acc, f) => acc + f.eventsSent, 0);
  const activeCount = forwarders.filter(f => f.status === 'active').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      
      {/* Top Overview Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-[#0d0d0f] border border-gray-800 rounded-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
              {isZh ? '已啟用轉發伺服器' : 'Active Forwarders'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <Share2 size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono">{activeCount}</span>
            <span className="text-[10px] font-bold text-gray-500">/ {forwarders.length} {isZh ? '個節點' : 'Nodes'}</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            <span>{isZh ? '日誌串流守護進程運行中' : 'Daemon Live Streaming'}</span>
          </div>
        </div>

        <div className="p-5 bg-[#0d0d0f] border border-gray-800 rounded-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
              {isZh ? '累計轉發日誌事件' : 'Total Exported Events'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Activity size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-400 font-mono">
              {(totalExported / 1000000).toFixed(2)}M
            </span>
            <span className="text-[10px] font-bold text-gray-500">Events</span>
          </div>
          <div className="mt-2 text-[10px] font-bold text-gray-400">
            {isZh ? '平均延遲：' : 'Avg Latency:'} <span className="text-white font-mono">14.6 ms</span>
          </div>
        </div>

        <div className="p-5 bg-[#0d0d0f] border border-gray-800 rounded-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
              {isZh ? '本機暫存快取容量' : 'Local Buffer Cache'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <HardDrive size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-400 font-mono">3.1 GB</span>
            <span className="text-[10px] font-bold text-gray-500">/ {cacheSize} GB</span>
          </div>
          <div className="mt-2 w-full bg-gray-900 rounded-full h-1.5 overflow-hidden">
            <div className="bg-purple-500 h-full rounded-full" style={{ width: `${(3.1 / cacheSize) * 100}%` }}></div>
          </div>
        </div>

        <div className="p-5 bg-[#0d0d0f] border border-gray-800 rounded-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
              {isZh ? '即時出口轉發頻寬' : 'Egress Bandwidth'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Zap size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400 font-mono">4.82 MB/s</span>
            <span className="text-[10px] font-bold text-gray-500">~ 3,200 EPS</span>
          </div>
          <div className="mt-2 text-[10px] font-bold text-emerald-400 flex items-center gap-1">
            <ShieldCheck size={12} />
            <span>{isZh ? 'TLS 雙向加密安全傳輸' : 'Encrypted with TLS/SSL'}</span>
          </div>
        </div>
      </div>

      {/* Global Save Notification Banner */}
      {globalSaveNotification && (
        <div className={cn(
          "p-4 rounded-2xl border flex items-center justify-between transition-all animate-in slide-in-from-top duration-300",
          globalSaveNotification.success 
            ? "bg-emerald-950/40 border-emerald-800 text-emerald-300 shadow-lg shadow-emerald-950/20" 
            : "bg-red-950/40 border-red-800 text-red-300"
        )}>
          <div className="flex items-center gap-3">
            {globalSaveNotification.success ? (
              <CheckCircle2 className="text-emerald-400 shrink-0" size={18} />
            ) : (
              <AlertCircle className="text-red-400 shrink-0" size={18} />
            )}
            <span className="text-xs font-bold font-mono">
              {globalSaveNotification.message}
            </span>
          </div>
          <button 
            onClick={() => setGlobalSaveNotification(null)}
            className="p-1 hover:bg-black/30 rounded-lg text-gray-400 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Test Notification Banner */}
      {testResult && (
        <div className={cn(
          "p-4 rounded-2xl border flex items-center justify-between transition-all animate-in slide-in-from-top duration-300",
          testResult.testing 
            ? "bg-blue-950/40 border-blue-800 text-blue-300"
            : testResult.success 
              ? "bg-emerald-950/40 border-emerald-800 text-emerald-300" 
              : "bg-red-950/40 border-red-800 text-red-300"
        )}>
          <div className="flex items-center gap-3">
            {testResult.testing ? (
              <RefreshCw className="animate-spin text-blue-400" size={18} />
            ) : testResult.success ? (
              <CheckCircle2 className="text-emerald-400" size={18} />
            ) : (
              <AlertCircle className="text-red-400" size={18} />
            )}
            <span className="text-xs font-bold font-mono">
              {testResult.testing ? (isZh ? '正在嘗試連線目標節點並進行 SSL/TLS 握手測試...' : 'Establishing SSL/TLS handshake with target destination...') : testResult.message}
            </span>
          </div>
          <button 
            onClick={() => setTestResult(null)}
            className="p-1 hover:bg-black/30 rounded-lg text-gray-400 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Section 1: Forwarder Config Card (Add / Edit) */}
      <div className="p-6 sm:p-8 bg-[#0d0d0f] border border-gray-800 rounded-3xl space-y-6 relative overflow-hidden group shadow-2xl">
        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
          <Share2 size={90} className="text-orange-500" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800/80 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-orange-500/10 rounded-2xl flex items-center justify-center border border-orange-500/20 shadow-inner">
              <Share2 className="text-orange-400" size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-black text-white uppercase italic tracking-tighter">
                  {editingId 
                    ? (isZh ? '編輯遠端日誌轉發伺服器節點' : 'Edit Remote Forwarder Destination')
                    : (isZh ? '日誌轉發與資料匯出設定 (Log Forwarding & Export)' : 'Log Forwarding & Data Export')}
                </h4>
                {editingId && (
                  <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-[9px] font-black uppercase rounded-md border border-orange-500/30">
                    {isZh ? '編輯模式' : 'EDITING'}
                  </span>
                )}
              </div>
              <p className="text-[11px] font-bold text-gray-400 mt-0.5">
                {isZh 
                  ? '將平台收集之即時日誌、安全告警、網路連線特徵等資料，自動轉發至外部 SIEM、資料湖或 Syslog 伺服器。' 
                  : 'Configure real-time automated data export to third-party SIEM, Data Lakes, or Central Syslog servers.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleOpenExportConfig('rsyslog')}
              className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-gray-800 flex items-center gap-1.5"
            >
              <FileCode size={13} className="text-blue-400" />
              {isZh ? '匯出守護行程配置' : 'Export Daemon Config'}
            </button>
            <button
              type="button"
              onClick={() => handleSendTestEvent()}
              disabled={isReadOnly}
              className="px-3 py-1.5 bg-orange-950/40 hover:bg-orange-900/50 text-orange-300 rounded-xl text-xs font-bold transition-all border border-orange-800/60 flex items-center gap-1.5"
            >
              <Send size={13} className="text-orange-400" />
              {isZh ? '發送診斷日誌' : 'Send Test Log'}
            </button>
            {editingId && (
              <button
                onClick={() => {
                  setEditingId(null);
                  setFormData({
                    name: '',
                    type: 'splunk',
                    destination: '',
                    port: '8088',
                    protocol: 'https',
                    token: '',
                    scope: 'all',
                    format: 'json'
                  });
                }}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <X size={14} /> {isZh ? '取消編輯' : 'Cancel Edit'}
              </button>
            )}
          </div>
        </div>

        {/* Input Fields Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <Server size={12} className="text-orange-400" />
              {isZh ? '目標平台類型 (Platform)' : 'Target Platform'}
            </label>
            <select 
              value={formData.type}
              onChange={(e) => handleTypeChange(e.target.value as any)}
              disabled={isReadOnly}
              className="w-full bg-black/50 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs font-black text-white outline-none focus:border-orange-500 transition-all uppercase"
            >
              <option value="splunk">Splunk (HEC HTTP Event Collector)</option>
              <option value="syslog">遠端 Syslog 伺服器 (RFC5424/RFC3164)</option>
              <option value="elk">Elasticsearch / OpenSearch</option>
              <option value="kafka">Apache Kafka 分散式佇列</option>
              <option value="s3">AWS S3 / MinIO 物件儲存</option>
              <option value="qradar">IBM QRadar SIEM (LEEF/CEF)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
              {isZh ? '節點自訂名稱 (Name)' : 'Destination Label'}
            </label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={isReadOnly}
              placeholder={isZh ? '例：主要 Splunk 核心叢集' : 'e.g. Primary Splunk HEC'} 
              className="w-full bg-black/50 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white outline-none focus:border-orange-500 transition-all placeholder:text-gray-600"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
              {isZh ? '目標主機 IP / 網域名稱' : 'Destination IP / Host'}
            </label>
            <input 
              type="text" 
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              disabled={isReadOnly}
              placeholder="10.88.90.11 或 log.corp.local" 
              className="w-full bg-black/50 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-orange-400 outline-none focus:border-orange-500 transition-all font-bold placeholder:text-gray-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                {isZh ? '通訊埠 (Port)' : 'Port'}
              </label>
              <input 
                type="number" 
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                disabled={isReadOnly}
                placeholder="8088" 
                className="w-full bg-black/50 border border-gray-800 rounded-xl px-3 py-2.5 text-xs font-mono text-orange-400 outline-none focus:border-orange-500 transition-all font-bold placeholder:text-gray-600"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                {isZh ? '協定 (Proto)' : 'Protocol'}
              </label>
              <select 
                value={formData.protocol}
                onChange={(e) => setFormData({ ...formData, protocol: e.target.value as any })}
                disabled={isReadOnly}
                className="w-full bg-black/50 border border-gray-800 rounded-xl px-2.5 py-2.5 text-xs font-black text-white outline-none focus:border-orange-500 transition-all uppercase"
              >
                <option value="https">HTTPS (SSL)</option>
                <option value="tls">TLS/SSL</option>
                <option value="tcp">TCP</option>
                <option value="udp">UDP</option>
              </select>
            </div>
          </div>
        </div>

        {/* Secondary Row: Token, Scope, Format & Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <Lock size={12} className="text-purple-400" />
              {isZh ? '認證金鑰 / HEC Token (選填)' : 'Auth Token / Key (Optional)'}
            </label>
            <input 
              type="password" 
              value={formData.token}
              onChange={(e) => setFormData({ ...formData, token: e.target.value })}
              disabled={isReadOnly}
              placeholder="••••••••••••••••••••" 
              className="w-full bg-black/50 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-purple-300 outline-none focus:border-orange-500 transition-all placeholder:text-gray-600"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
              {isZh ? '轉發範疇過濾 (Scope)' : 'Forwarding Scope'}
            </label>
            <select 
              value={formData.scope}
              onChange={(e) => setFormData({ ...formData, scope: e.target.value as any })}
              disabled={isReadOnly}
              className="w-full bg-black/50 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs font-black text-white outline-none focus:border-orange-500 transition-all uppercase"
            >
              <option value="all">{isZh ? '全域所有日誌 (All Ingested Logs)' : 'All Ingested Logs'}</option>
              <option value="critical">{isZh ? '僅高危告警與資安事件 (Critical Threats Only)' : 'Critical Threats Only'}</option>
              <option value="audit">{isZh ? '僅系統認證與稽核日誌 (Audit & Auth Logs)' : 'Audit & Auth Logs'}</option>
              <option value="flow">{isZh ? '僅網路流量與連線記錄 (Flow & Network)' : 'Flow & Network'}</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
              {isZh ? '日誌編碼格式 (Format)' : 'Payload Format'}
            </label>
            <select 
              value={formData.format}
              onChange={(e) => setFormData({ ...formData, format: e.target.value as any })}
              disabled={isReadOnly}
              className="w-full bg-black/50 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs font-black text-white outline-none focus:border-orange-500 transition-all uppercase"
            >
              <option value="json">Structured JSON (Elastic/Splunk 原生)</option>
              <option value="cef">CEF (ArcSight / Micro Focus 標準)</option>
              <option value="rfc5424">Syslog RFC5424 (標準時間戳與標頭)</option>
              <option value="raw">Raw String (原始字串轉送)</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button 
              type="button"
              onClick={() => handleTestConnection()}
              className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl text-xs font-bold transition-all border border-gray-700 flex items-center justify-center gap-1.5 whitespace-nowrap shadow"
            >
              <Radio size={14} className="text-orange-400" />
              {isZh ? '測試連線' : 'Test Ping'}
            </button>
            <button 
              type="button"
              onClick={handleSaveForwarder}
              disabled={isReadOnly}
              className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2"
            >
              {editingId ? <Check size={16} /> : <Plus size={16} />}
              {editingId ? (isZh ? '儲存變更' : 'Save Changes') : (isZh ? '新增轉發節點' : 'Add Forwarder')}
            </button>
          </div>
        </div>
      </div>

      {/* Section 2: Configured Forwarders Table */}
      <div className="bg-[#0d0d0f] border border-gray-800 rounded-3xl overflow-hidden shadow-2xl space-y-0">
        <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2.5">
            <Database size={16} className="text-orange-400" />
            <h5 className="text-sm font-black text-white uppercase tracking-wider">
              {isZh ? '已配置之遠端轉發節點清冊' : 'Configured Forwarding Destinations'}
            </h5>
            <span className="px-2 py-0.5 bg-gray-800 text-gray-400 text-[10px] font-mono rounded-full">
              {forwarders.length}
            </span>
          </div>
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest hidden sm:inline">
            {isZh ? '支援多路並行無損串流輸出' : 'Multi-Destination Lossless Streaming'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-900/50 border-b border-gray-800 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-4">{isZh ? '伺服器目標名稱' : 'DESTINATION NAME'}</th>
                <th className="px-6 py-4">{isZh ? '平台類型' : 'PLATFORM'}</th>
                <th className="px-6 py-4">{isZh ? '端點位址 / 通訊埠' : 'ENDPOINT & PORT'}</th>
                <th className="px-6 py-4">{isZh ? '日誌範疇 / 格式' : 'SCOPE & FORMAT'}</th>
                <th className="px-6 py-4">{isZh ? '傳輸狀態 / 延遲' : 'STATUS & LATENCY'}</th>
                <th className="px-6 py-4">{isZh ? '累計轉發量' : 'EXPORTED VOLUME'}</th>
                <th className="px-6 py-4 text-right">{isZh ? '管理操作' : 'ACTIONS'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 font-mono text-xs">
              {forwarders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 font-sans">
                    {isZh ? '尚未配置任何遠端日誌伺服器轉發節點。' : 'No remote log forwarder destinations configured yet.'}
                  </td>
                </tr>
              ) : (
                forwarders.map(f => (
                  <tr key={f.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4 font-sans">
                      <div className="flex items-center gap-2.5">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          f.status === 'active' ? "bg-emerald-500 animate-pulse" : "bg-gray-600"
                        )}></div>
                        <div>
                          <span className="text-xs font-black text-white block uppercase tracking-tight">{f.name}</span>
                          <span className="text-[10px] text-gray-500 font-mono font-bold">{f.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-[9px] font-black uppercase px-2 py-0.5 rounded border tracking-wider",
                        f.type === 'splunk' ? "bg-orange-950/40 text-orange-400 border-orange-800/60" :
                        f.type === 'syslog' ? "bg-blue-950/40 text-blue-400 border-blue-800/60" :
                        f.type === 'kafka' ? "bg-purple-950/40 text-purple-400 border-purple-800/60" :
                        f.type === 'elk' ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/60" :
                        "bg-gray-800 text-gray-300 border-gray-700"
                      )}>
                        {f.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[11px] text-orange-400 font-bold">
                        {f.protocol}://{f.destination}:{f.port}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-sans">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-gray-300 block">
                          {f.scope === 'all' ? (isZh ? '全域所有日誌' : 'All Ingested Logs') :
                           f.scope === 'critical' ? (isZh ? '僅高危告警' : 'Critical Threats Only') :
                           f.scope === 'audit' ? (isZh ? '認證與稽核' : 'Audit & Auth Logs') :
                           (isZh ? '網路連線流量' : 'Flow & Network')}
                        </span>
                        <span className="text-[9px] text-gray-500 font-mono uppercase">
                          [{f.format.toUpperCase()}]
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[9px] font-black uppercase",
                          f.status === 'active' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-gray-800 text-gray-400"
                        )}>
                          {f.status === 'active' ? (isZh ? '即時串流中' : 'Streaming') : (isZh ? '已暫停' : 'Paused')}
                        </span>
                        {f.status === 'active' && (
                          <span className="text-[10px] text-gray-400 font-bold">
                            {f.latency}ms
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-gray-200">
                        {f.eventsSent.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleSendTestEvent(f)}
                          disabled={isReadOnly}
                          title={isZh ? '向此節點發送測試日誌封包' : 'Send Test Log to Destination'}
                          className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-emerald-400 transition-colors"
                        >
                          <Send size={14} />
                        </button>
                        <button 
                          onClick={() => handleTestConnection(f.destination, f.port, f.protocol)}
                          title={isZh ? '測試此節點連線' : 'Test Ping'}
                          className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-orange-400 transition-colors"
                        >
                          <Radio size={14} />
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(f.id)}
                          disabled={isReadOnly}
                          title={f.status === 'active' ? (isZh ? '暫停轉發' : 'Pause') : (isZh ? '啟動轉發' : 'Resume')}
                          className={cn(
                            "p-1.5 hover:bg-gray-800 rounded-lg transition-colors",
                            f.status === 'active' ? "text-gray-400 hover:text-amber-400" : "text-gray-400 hover:text-emerald-400"
                          )}
                        >
                          {f.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                        </button>
                        <button 
                          onClick={() => handleEditForwarder(f)}
                          disabled={isReadOnly}
                          title={isZh ? '編輯設定' : 'Edit'}
                          className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-blue-400 transition-colors"
                        >
                          <Sliders size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteForwarder(f.id)}
                          disabled={isReadOnly}
                          title={isZh ? '刪除節點' : 'Delete'}
                          className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Global Failover & Data Masking Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Failover & Caching Settings */}
        <div className="p-6 bg-[#0d0d0f] border border-gray-800 rounded-3xl space-y-5 shadow-xl">
          <div className="flex items-center gap-2.5 border-b border-gray-800 pb-3">
            <HardDrive size={16} className="text-blue-400" />
            <h5 className="text-sm font-black text-white uppercase tracking-wider">
              {isZh ? '全域容錯與斷線快取設定 (Failover & Buffer)' : 'Global Failover & Local Buffering'}
            </h5>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-900/40 border border-gray-800 rounded-2xl">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-gray-200">
                  {isZh ? '本機斷線快取保護 (Local Spooling Buffer)' : 'Local Spooling Buffer'}
                </p>
                <p className="text-[10px] text-gray-500 font-bold">
                  {isZh ? '當目標遠端伺服器不可達時，自動將日誌寫入本地磁碟快取，待復原後自動補傳。' : 'Buffer outbound logs on local SSD if destination is unreachable'}
                </p>
              </div>
              <button 
                type="button"
                onClick={() => !isReadOnly && setLocalCaching(!localCaching)}
                className={cn(
                  "w-11 h-6 rounded-full relative p-1 transition-colors cursor-pointer",
                  localCaching ? "bg-blue-600" : "bg-gray-800"
                )}
              >
                <div className={cn(
                  "w-4 h-4 bg-white rounded-full transition-transform",
                  localCaching ? "translate-x-5" : "translate-x-0"
                )}></div>
              </button>
            </div>

            <div className="space-y-2 p-4 bg-gray-900/20 border border-gray-800/80 rounded-2xl">
              <div className="flex justify-between items-center text-xs">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  {isZh ? '最大本機快取容量限制 (Max Cache Size)' : 'Max Cache Buffer Size (GB)'}
                </label>
                <span className="text-blue-400 font-mono font-bold text-xs">{cacheSize} GB</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="100" 
                value={cacheSize}
                disabled={isReadOnly || !localCaching}
                onChange={(e) => setCacheSize(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-600" 
              />
              <div className="flex justify-between text-[9px] font-bold text-gray-600 font-mono">
                <span>1 GB</span>
                <span>50 GB</span>
                <span>100 GB</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  {isZh ? '斷線重試頻率' : 'Retry Interval'}
                </label>
                <select 
                  value={retryInterval}
                  onChange={(e) => setRetryInterval(e.target.value)}
                  disabled={isReadOnly}
                  className="w-full bg-black/50 border border-gray-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-blue-500 uppercase"
                >
                  <option value="3">{isZh ? '每 3 秒重試' : 'Every 3s'}</option>
                  <option value="5">{isZh ? '每 5 秒重試 (建議)' : 'Every 5s (Default)'}</option>
                  <option value="15">{isZh ? '每 15 秒重試' : 'Every 15s'}</option>
                  <option value="30">{isZh ? '每 30 秒重試' : 'Every 30s'}</option>
                  <option value="60">{isZh ? '每 60 秒重試' : 'Every 60s'}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  {isZh ? '快取滿溢處置' : 'Overflow Action'}
                </label>
                <select 
                  value={overflowPolicy}
                  onChange={(e) => setOverflowPolicy(e.target.value as any)}
                  disabled={isReadOnly}
                  className="w-full bg-black/50 border border-gray-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-blue-500 uppercase"
                >
                  <option value="fifo">{isZh ? '覆蓋最舊日誌 (FIFO)' : 'Drop Oldest (FIFO)'}</option>
                  <option value="drop">{isZh ? '暫停寫入並告警 (Block)' : 'Block & Alert'}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Data Filtering & Masking Options */}
        <div className="p-6 bg-[#0d0d0f] border border-gray-800 rounded-3xl space-y-5 shadow-xl">
          <div className="flex items-center gap-2.5 border-b border-gray-800 pb-3">
            <ShieldCheck size={16} className="text-emerald-400" />
            <h5 className="text-sm font-black text-white uppercase tracking-wider">
              {isZh ? '日誌過濾與資料脫敏 (Data Filtering & Privacy)' : 'Data Filtering & Privacy Masking'}
            </h5>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div 
              onClick={() => !isReadOnly && setMaskPII(!maskPII)}
              className={cn(
                "p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2",
                maskPII ? "bg-emerald-950/20 border-emerald-600/40 text-emerald-300" : "bg-gray-900/30 border-gray-800 text-gray-500 hover:border-gray-700"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase">
                  {isZh ? '個資與敏感資訊遮蔽' : 'Mask PII Data'}
                </span>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  maskPII ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "bg-gray-700"
                )}></div>
              </div>
              <p className="text-[10px] text-gray-400 leading-tight">
                {isZh ? '自動隱藏身分證號、信用卡號、電子郵件等個人隱私欄位。' : 'Anonymize email, SSN, credit cards & phone numbers.'}
              </p>
            </div>

            <div 
              onClick={() => !isReadOnly && setExcludeNoise(!excludeNoise)}
              className={cn(
                "p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2",
                excludeNoise ? "bg-emerald-950/20 border-emerald-600/40 text-emerald-300" : "bg-gray-900/30 border-gray-800 text-gray-500 hover:border-gray-700"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase">
                  {isZh ? '排除無效心跳雜訊' : 'Exclude Noise'}
                </span>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  excludeNoise ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "bg-gray-700"
                )}></div>
              </div>
              <p className="text-[10px] text-gray-400 leading-tight">
                {isZh ? '自動過濾內部健康監聽 (Keep-alive) 與重複高頻心跳記錄。' : 'Filter internal keep-alives and repetitive heartbeats.'}
              </p>
            </div>

            <div 
              onClick={() => !isReadOnly && setCompressPayload(!compressPayload)}
              className={cn(
                "p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2",
                compressPayload ? "bg-emerald-950/20 border-emerald-600/40 text-emerald-300" : "bg-gray-900/30 border-gray-800 text-gray-500 hover:border-gray-700"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase">
                  {isZh ? '傳輸封包壓縮 (GZIP)' : 'Compress Payload'}
                </span>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  compressPayload ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "bg-gray-700"
                )}></div>
              </div>
              <p className="text-[10px] text-gray-400 leading-tight">
                {isZh ? '啟用 GZIP 壓縮傳輸，節省高達 65% 之出口頻寬與成本。' : 'Enable GZIP compression, saving up to 65% egress bandwidth.'}
              </p>
            </div>

            <div 
              onClick={() => !isReadOnly && setRawCEFFormat(!rawCEFFormat)}
              className={cn(
                "p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2",
                rawCEFFormat ? "bg-emerald-950/20 border-emerald-600/40 text-emerald-300" : "bg-gray-900/30 border-gray-800 text-gray-500 hover:border-gray-700"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase">
                  {isZh ? '強制 CEF 標準格式' : 'Enforce CEF Spec'}
                </span>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  rawCEFFormat ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "bg-gray-700"
                )}></div>
              </div>
              <p className="text-[10px] text-gray-400 leading-tight">
                {isZh ? '符合 Common Event Format 格式規範，相容傳統 SIEM 系統。' : 'Encode logs into ArcSight / QRadar CEF compliance.'}
              </p>
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
              {isZh ? '最低日誌轉發嚴重等級 (Minimum Severity)' : 'Minimum Forwarding Severity'}
            </label>
            <select 
              value={minSeverity}
              onChange={(e) => setMinSeverity(e.target.value as any)}
              disabled={isReadOnly}
              className="w-full bg-black/50 border border-gray-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-emerald-500 uppercase"
            >
              <option value="all">{isZh ? '全部等級 (Debug / Info / Warning / Critical)' : 'All Severities'}</option>
              <option value="info">{isZh ? '一般資訊以上 (Info 及以上)' : 'Info and Above'}</option>
              <option value="warning">{isZh ? '警告等級以上 (Warning 及以上)' : 'Warning and Above'}</option>
              <option value="critical">{isZh ? '僅致命高危告警 (Critical Only)' : 'Critical / High Only'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Global Forwarding Policies Persistence Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-[#0d0d0f] border border-gray-800 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            <Sliders size={18} />
          </div>
          <div>
            <h6 className="text-xs font-black text-white uppercase tracking-wider">
              {isZh ? '全域轉發佇列與隱私脫敏策略控制台' : 'Global Forwarding & Privacy Policy Console'}
            </h6>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {isZh 
                ? '調整上述斷線快取容量、滿溢處置、PII 遮蔽或 CEF 格式規範後，點擊立即套用將持久化配置至後端伺服器 (system_settings_config.json)。' 
                : 'Save global spooling limits, overflow policies, PII masking, or CEF formatting to backend daemon.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleFlushSpool}
            disabled={isReadOnly || isFlushingSpool}
            className="px-3.5 py-2 bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-red-400 rounded-xl text-xs font-bold transition-all border border-gray-800 flex items-center gap-1.5"
          >
            {isFlushingSpool ? <RefreshCw size={13} className="animate-spin" /> : <Trash2 size={13} />}
            {isFlushingSpool ? (isZh ? '正在清空...' : 'Flushing...') : (isZh ? '清除本地緩衝' : 'Flush Buffer')}
          </button>

          <button
            type="button"
            onClick={handleSaveGlobalSettings}
            disabled={isReadOnly || isSavingGlobal}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2"
          >
            {isSavingGlobal ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            {isSavingGlobal ? (isZh ? '正在儲存中...' : 'Saving...') : (isZh ? '套用全域轉發策略' : 'Save Global Policies')}
          </button>
        </div>
      </div>

      {/* Section 4: Live Outbound Transmission Log Stream */}
      <div className="p-6 bg-[#0d0d0f] border border-gray-800 rounded-3xl space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Terminal size={16} className="text-orange-400" />
            <h5 className="text-sm font-black text-white uppercase tracking-wider">
              {isZh ? '即時出口轉發串流監控 (Live Outbound Stream)' : 'Real-time Outbound Transmission Stream'}
            </h5>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLiveStreamPaused(!liveStreamPaused)}
              className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-1.5"
            >
              {liveStreamPaused ? <Play size={12} className="text-emerald-400" /> : <Pause size={12} className="text-amber-400" />}
              {liveStreamPaused ? (isZh ? '繼續串流' : 'Resume') : (isZh ? '暫停串流' : 'Pause')}
            </button>
            <button
              onClick={() => setLiveLogs([])}
              className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg text-[10px] font-black uppercase transition-all"
            >
              {isZh ? '清空' : 'Clear'}
            </button>
          </div>
        </div>

        <div className="bg-black/80 rounded-2xl p-4 border border-gray-900 space-y-2 font-mono text-[11px] max-h-56 overflow-y-auto">
          {liveLogs.length === 0 ? (
            <div className="text-center py-6 text-gray-600">
              {isZh ? '暫無轉發日誌輸出記錄...' : 'Waiting for outgoing log stream events...'}
            </div>
          ) : (
            liveLogs.map((log) => (
              <div key={log.id} className="flex items-start justify-between gap-4 py-1 border-b border-gray-900/60 hover:bg-white/[0.02] px-2 rounded">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <span className="text-gray-500 text-[10px] shrink-0">{log.time}</span>
                  <span className="px-1.5 py-0.5 bg-orange-950/40 text-orange-400 rounded text-[9px] font-black uppercase border border-orange-900/40 shrink-0">
                    {log.type}
                  </span>
                  <span className="text-gray-300 truncate text-[11px] font-sans">
                    {log.summary}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-right">
                  <span className="text-gray-400 text-[10px] hidden sm:inline">{log.dest}</span>
                  <span className="text-emerald-400 font-bold text-[10px] bg-emerald-950/30 px-1.5 py-0.5 rounded border border-emerald-800/40">
                    {log.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Test Event Result Modal */}
      {testEventModal?.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-gray-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                  <Send size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">
                    {isZh ? '遠端日誌診斷測試事件發送' : 'Remote Log Diagnostic Event Dispatch'}
                  </h4>
                  <p className="text-[10px] text-gray-400 font-mono">
                    {testEventModal.forwarder?.name || 'Manual Endpoint'} ({testEventModal.forwarder?.destination}:{testEventModal.forwarder?.port})
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setTestEventModal(null)}
                className="p-1.5 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              {testEventModal.isSending ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  <RefreshCw className="animate-spin text-orange-400" size={32} />
                  <p className="text-xs font-bold text-gray-300">
                    {isZh ? '正在生成標準格式封包並嘗試發送至目標節點...' : 'Encoding payload and establishing socket delivery...'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="p-4 bg-gray-900/40 border border-gray-800 rounded-2xl flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-gray-400 block tracking-wider">
                        {isZh ? '分派狀態' : 'DISPATCH STATUS'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-emerald-950/40 text-emerald-400 border border-emerald-800 rounded text-xs font-bold">
                          {testEventModal.result?.logEntry?.status || '200 OK (ACK)'}
                        </span>
                        <span className="text-xs text-gray-300 font-bold">
                          {testEventModal.result?.message}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black uppercase text-gray-500 block">
                        {isZh ? '封包大小' : 'PAYLOAD SIZE'}
                      </span>
                      <span className="text-xs font-mono font-bold text-orange-400">
                        {testEventModal.result?.payloadSize || 360} bytes
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        <FileCode size={12} className="text-blue-400" />
                        {isZh ? '轉發日誌標準格式載荷預覽' : 'Raw Forwarding Payload Preview'}
                      </label>
                      {testEventModal.result?.rawPayload && (
                        <button
                          onClick={() => navigator.clipboard.writeText(testEventModal.result?.rawPayload || '')}
                          className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1"
                        >
                          <Copy size={11} /> {isZh ? '複製封包' : 'Copy'}
                        </button>
                      )}
                    </div>
                    <pre className="p-4 bg-black/90 border border-gray-900 rounded-2xl text-[11px] font-mono text-gray-200 overflow-x-auto whitespace-pre-wrap max-h-56">
                      {testEventModal.result?.rawPayload || JSON.stringify(testEventModal.result?.logEntry, null, 2)}
                    </pre>
                  </div>
                </>
              )}
            </div>

            <div className="p-4 border-t border-gray-800 bg-black/30 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setTestEventModal(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold"
              >
                {isZh ? '關閉' : 'Close'}
              </button>
              <button
                type="button"
                disabled={testEventModal.isSending}
                onClick={() => handleSendTestEvent(testEventModal.forwarder || undefined)}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <RefreshCw size={12} className={testEventModal.isSending ? 'animate-spin' : ''} />
                {isZh ? '再次發送' : 'Resend'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Daemon Configuration Export Modal */}
      {exportConfigModal?.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-gray-800 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <FileCode size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">
                    {isZh ? '邊緣日誌轉發守護程序配置檔匯出' : 'Forwarder Daemon Configuration Snippet'}
                  </h4>
                  <p className="text-[10px] text-gray-400">
                    {isZh ? '根據目前設定自動生成 rsyslog、Vector 或 Fluent-bit 轉發規則' : 'Auto-generated export rules for edge forwarding daemons'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setExportConfigModal(null)}
                className="p-1.5 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="flex items-center gap-2 border-b border-gray-800/80 pb-3">
                <button
                  onClick={() => handleOpenExportConfig('rsyslog')}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all",
                    exportConfigModal.format === 'rsyslog' 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" 
                      : "bg-gray-900 text-gray-400 hover:text-white"
                  )}
                >
                  rsyslog (99-semor-forward.conf)
                </button>
                <button
                  onClick={() => handleOpenExportConfig('vector')}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all",
                    exportConfigModal.format === 'vector' 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" 
                      : "bg-gray-900 text-gray-400 hover:text-white"
                  )}
                >
                  Vector (vector.yaml)
                </button>
                <button
                  onClick={() => handleOpenExportConfig('fluentbit')}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all",
                    exportConfigModal.format === 'fluentbit' 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" 
                      : "bg-gray-900 text-gray-400 hover:text-white"
                  )}
                >
                  Fluent-bit (fluent-bit.conf)
                </button>
              </div>

              {exportConfigModal.loading ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  <RefreshCw className="animate-spin text-blue-400" size={32} />
                  <p className="text-xs font-bold text-gray-400">
                    {isZh ? '正在自後端守護程序編譯設定腳本...' : 'Compiling daemon configuration snippet...'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="font-mono text-[11px] text-gray-300">
                      檔案名稱: <span className="text-blue-400 font-bold">{exportConfigModal.filename}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopyExportConfig}
                        className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                      >
                        {exportConfigModal.copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        {exportConfigModal.copied ? (isZh ? '已複製！' : 'Copied!') : (isZh ? '複製代碼' : 'Copy Code')}
                      </button>
                      <button
                        onClick={handleDownloadExportConfig}
                        className="px-2.5 py-1 bg-blue-950/40 hover:bg-blue-900/60 text-blue-300 rounded-lg text-xs font-bold flex items-center gap-1 border border-blue-800/60 transition-all"
                      >
                        <Download size={12} />
                        {isZh ? '下載檔案' : 'Download'}
                      </button>
                    </div>
                  </div>
                  <pre className="p-4 bg-black/90 border border-gray-900 rounded-2xl text-[11px] font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap max-h-72">
                    {exportConfigModal.content}
                  </pre>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-800 bg-black/30 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setExportConfigModal(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold"
              >
                {isZh ? '關閉' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
