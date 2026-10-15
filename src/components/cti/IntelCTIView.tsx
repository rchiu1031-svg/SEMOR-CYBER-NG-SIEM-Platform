import React, { useState, useEffect, useCallback } from 'react';
import { 
  Activity, Globe, Search, RefreshCw, Zap, Shield, ShieldAlert, 
  Layers, Database, FileText, Target, Server, Check, ArrowUpRight,
  ShieldCheck, Trash2, Upload, Plus, AlertCircle, Info, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CtiIndicator, 
  CtiConnector, 
  CtiReport,
  INITIAL_INDICATORS,
  INITIAL_CONNECTORS,
  CTI_REPORTS
} from '../../data/ctiIntelData';
import { CtiDashboardTab } from './CtiDashboardTab';
import { CtiGraphTab } from './CtiGraphTab';
import { CtiMapTab } from './CtiMapTab';
import { CtiIndicatorsTab } from './CtiIndicatorsTab';
import { CtiMitreTab } from './CtiMitreTab';
import { CtiConnectorsTab } from './CtiConnectorsTab';
import { CtiReportsTab } from './CtiReportsTab';
import { 
  CtiEnrichmentModal, 
  CtiAddIndicatorModal, 
  CtiReportReaderModal,
  CtiImportStixModal
} from './CtiModals';
import { cn } from '../../lib/utils';

export type CtiTabType = 'dashboard' | 'graph' | 'map' | 'indicators' | 'mitre' | 'connectors' | 'reports';

interface IntelCTIViewProps {
  isZh?: boolean;
}

export function IntelCTIView({ isZh = true }: IntelCTIViewProps) {
  const [activeTab, setActiveTab] = useState<CtiTabType>('dashboard');
  const [globalSearch, setGlobalSearch] = useState('');
  const [enrichQuery, setEnrichQuery] = useState('');
  const [isEnrichOpen, setIsEnrichOpen] = useState(false);
  const [isAddIocOpen, setIsAddIocOpen] = useState(false);
  const [isImportStixOpen, setIsImportStixOpen] = useState(false);
  const [readingReport, setReadingReport] = useState<CtiReport | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Backend CTI dynamic state
  const [indicators, setIndicators] = useState<CtiIndicator[]>([]);
  const [connectors, setConnectors] = useState<CtiConnector[]>([]);
  const [reports, setReports] = useState<CtiReport[]>([]);
  const [overviewStats, setOverviewStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  // Fetch all CTI state from backend APIs
  const fetchCtiData = useCallback(async (quiet: boolean = false) => {
    if (!quiet) setIsRefreshing(true);
    try {
      const [indRes, connRes, repRes, statRes] = await Promise.all([
        fetch('/api/v1/cti/indicators?limit=300').then(r => r.json()).catch(() => ({ indicators: [] })),
        fetch('/api/v1/cti/connectors').then(r => r.json()).catch(() => ({ connectors: [] })),
        fetch('/api/v1/cti/reports').then(r => r.json()).catch(() => ({ reports: [] })),
        fetch('/api/v1/cti/overview').then(r => r.json()).catch(() => ({ stats: null }))
      ]);

      if (Array.isArray(indRes?.indicators)) {
        setIndicators(indRes.indicators);
      }
      if (Array.isArray(connRes?.connectors)) {
        setConnectors(connRes.connectors);
      }
      if (Array.isArray(repRes?.reports)) {
        setReports(repRes.reports);
      }
      if (statRes?.stats) {
        setOverviewStats(statRes.stats);
      }
    } catch (err: any) {
      console.warn('CTI API polling notice:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchCtiData();
  }, [fetchCtiData]);

  // Real-time WebSocket event listener
  useEffect(() => {
    let ws: WebSocket | null = null;
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (
            msg.type === 'system_purged' ||
            msg.type === 'cti_purged' ||
            msg.type === 'cti_seeded' ||
            msg.type === 'cti_indicator_added' ||
            msg.type === 'cti_indicator_deleted' ||
            msg.type === 'cti_connector_synced' ||
            msg.type === 'cti_connector_added' ||
            msg.type === 'cti_connector_deleted' ||
            msg.type === 'cti_connector_toggled' ||
            msg.type === 'cti_firewall_enforced' ||
            msg.type === 'cti_stix_imported' ||
            msg.type?.startsWith('cti_')
          ) {
            fetchCtiData(true);
          }
        } catch (e) {}
      };
    } catch (e) {}

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [fetchCtiData]);

  // 1. Enrich search submit
  const handleEnrich = (queryVal: string) => {
    if (!queryVal.trim()) return;
    setEnrichQuery(queryVal.trim());
    setIsEnrichOpen(true);
  };

  const handleGlobalSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalSearch.trim()) {
      handleEnrich(globalSearch.trim());
    }
  };

  // 2. Edge Firewall & EDR push
  const handlePushToFirewall = async (val: string, vendor: string = 'Palo Alto NGFW') => {
    try {
      const res = await fetch('/api/v1/cti/push-to-firewall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [val], targetVendor: vendor })
      });
      const data = await res.json();
      if (data.success) {
        showToast(isZh 
          ? `已成功將指標 [${val}] 推送至 ${vendor} 邊界阻斷黑名單！`
          : `Successfully pushed [${val}] to ${vendor} blocklist!`
        );
        fetchCtiData(true);
      } else {
        showToast(data.error || '推送失敗');
      }
    } catch (err: any) {
      showToast('API 通訊異常: ' + err.message);
    }
  };

  // 3. Connectors Sync
  const handleSyncConnector = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/cti/connectors/${id}/sync`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(isZh 
          ? `TAXII 2.1 增量同步完成！自節點接收 ${data.newObservables} 筆觀測特徵`
          : `TAXII sync completed! Received ${data.newObservables} observables.`
        );
        fetchCtiData(true);
      } else {
        showToast(data.message || '同步失敗');
      }
    } catch (err: any) {
      showToast('連線失敗: ' + err.message);
    }
  };

  // 4. Toggle Connector Status
  const handleToggleConnector = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/cti/connectors/${id}/toggle`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || '狀態切換成功');
        fetchCtiData(true);
      }
    } catch (err: any) {
      showToast('切換失敗: ' + err.message);
    }
  };

  // 5. Add Connector
  const handleAddConnector = async (newConn: Partial<CtiConnector>) => {
    try {
      const res = await fetch('/api/v1/cti/connectors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConn)
      });
      const data = await res.json();
      if (data.success) {
        showToast(isZh ? `已成功建立連接器管線 [${data.connector.name}]` : `Created connector [${data.connector.name}]`);
        fetchCtiData(true);
      } else {
        showToast(data.error || '建立失敗');
      }
    } catch (err: any) {
      showToast('建立失敗: ' + err.message);
    }
  };

  // 6. Delete Connector
  const handleDeleteConnector = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/cti/connectors/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || '連接器已刪除');
        fetchCtiData(true);
      }
    } catch (err: any) {
      showToast('刪除失敗: ' + err.message);
    }
  };

  // 7. Add Indicator (STIX 2.1)
  const handleAddIndicator = async (newIoc: Partial<CtiIndicator>) => {
    try {
      const res = await fetch('/api/v1/cti/indicators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIoc)
      });
      const data = await res.json();
      if (data.success) {
        showToast(isZh ? `已成功建立 STIX 2.1 指標 [${data.indicator.value}]` : `Created STIX 2.1 indicator [${data.indicator.value}]`);
        fetchCtiData(true);
      } else {
        showToast(data.error || '新增失敗');
      }
    } catch (err: any) {
      showToast('新增失敗: ' + err.message);
    }
  };

  // 8. Delete Indicator
  const handleDeleteIndicator = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/cti/indicators/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || '指標已刪除');
        fetchCtiData(true);
      }
    } catch (err: any) {
      showToast('刪除失敗: ' + err.message);
    }
  };

  // 9. Purge Simulated Data for Clean State
  const handlePurgeAll = async () => {
    if (!window.confirm(isZh ? '確定要清除所有在系統中的模擬測試情資指標與報告，回復乾淨初始狀態嗎？' : 'Purge all simulated CTI test indicators and reports for clean state?')) {
      return;
    }
    try {
      const res = await fetch('/api/v1/cti/purge', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(isZh ? '所有模擬情資數據已清除完畢，系統處於乾淨初始狀態！' : 'Purged simulated intelligence! System is now clean.');
        setIndicators([]);
        setReports([]);
        fetchCtiData(true);
      }
    } catch (err: any) {
      showToast('清除失敗: ' + err.message);
    }
  };

  // 10. Seed Baseline Data
  const handleSeedBaseline = async () => {
    try {
      const res = await fetch('/api/v1/cti/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(isZh ? '已成功重新載入基準威脅特徵與 APT 組織情報！' : 'Loaded benchmark STIX 2.1 intelligence baseline.');
        fetchCtiData(true);
      }
    } catch (err: any) {
      showToast('載入失敗: ' + err.message);
    }
  };

  // 11. Import STIX 2.1 Bundle
  const handleImportStix = async (bundle: any) => {
    try {
      const res = await fetch('/api/v1/cti/import/stix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bundle)
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'STIX 2.1 封裝匯入成功！');
        fetchCtiData(true);
      } else {
        showToast(data.error || '匯入失敗');
      }
    } catch (err: any) {
      showToast('匯入異常: ' + err.message);
    }
  };

  // 12. Delete Report
  const handleDeleteReport = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/cti/reports/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || '報告已刪除');
        fetchCtiData(true);
      }
    } catch (err: any) {
      showToast('刪除失敗: ' + err.message);
    }
  };

  const isCleanState = indicators.length === 0;

  const tabs = [
    { id: 'dashboard', label: isZh ? '情資態勢總覽' : 'Intelligence Dashboard', icon: <Activity size={15} /> },
    { id: 'graph', label: isZh ? 'STIX 2.1 戰役圖譜' : 'STIX 2.1 Graph', icon: <Zap size={15} /> },
    { id: 'map', label: isZh ? '全球攻擊走廊' : 'Geo Infiltration Map', icon: <Globe size={15} /> },
    { id: 'indicators', label: isZh ? 'IOC 指標庫' : 'Indicators Repository', icon: <Target size={15} /> },
    { id: 'mitre', label: isZh ? 'MITRE ATT&CK 矩陣' : 'MITRE ATT&CK Matrix', icon: <Shield size={15} /> },
    { id: 'connectors', label: isZh ? '情資饋送連接器' : 'TAXII & Connectors', icon: <Server size={15} /> },
    { id: 'reports', label: isZh ? '威脅研判報告' : 'Threat Dossiers', icon: <FileText size={15} /> },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white p-4 sm:p-6 lg:p-8 space-y-6">
      {/* CTI Global Header */}
      <div className="bg-[#111114] border border-gray-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="p-2.5 bg-blue-600/20 border border-blue-500/30 rounded-2xl">
                <ShieldAlert className="w-6 h-6 text-blue-400" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
                SEMOR CTI™ 網路威脅情報研判與防禦中樞
              </h1>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold tracking-wider uppercase">
                STIX 2.1 / TAXII 2.1
              </span>
              {isCleanState ? (
                <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold tracking-wider flex items-center gap-1">
                  <ShieldCheck size={12} />
                  {isZh ? '乾淨初始狀態 (CLEAN)' : 'CLEAN SLATE'}
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 font-bold tracking-wider">
                  {indicators.length} {isZh ? '筆指標' : 'IOCs'}
                </span>
              )}
              {isRefreshing && (
                <span className="text-[10px] font-mono text-gray-400 flex items-center gap-1">
                  <RefreshCw size={11} className="animate-spin text-blue-400" />
                  {isZh ? '同步中' : 'Syncing'}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 max-w-3xl leading-relaxed">
              {isZh 
                ? '全天候即時匯流全球國家級 APT 組織情資、暗網威脅走廊、零日漏洞利用與 MITRE ATT&CK 戰術矩陣，提供自動化情資研判與防火牆/EDR 一鍵規則下發能力。'
                : 'Enterprise-grade Cyber Threat Intelligence (CTI) engine delivering real-time STIX 2.1 observables, adversarial knowledge graphs, geopolitical attack telemetry, and automated mitigation enforcement.'
              }
            </p>
          </div>

          {/* Quick IOC Enrichment Input Bar & Quick Action */}
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            <form onSubmit={handleGlobalSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto flex-1">
              <div className="relative flex-1 sm:w-72">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={isZh ? '貼上 IP / 網域名稱 / 雜湊 / CVE 即刻研判...' : 'Paste IP, Domain, Hash, or CVE to enrich...'}
                  value={globalSearch}
                  onChange={e => setGlobalSearch(e.target.value)}
                  className="w-full bg-black/60 border border-gray-700/80 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono shadow-inner"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shadow-lg shadow-blue-600/20"
              >
                <Zap size={14} />
                {isZh ? '即時研判' : 'Enrich'}
              </button>
            </form>

            <button
              onClick={() => fetchCtiData(false)}
              className="p-2.5 bg-gray-900 border border-gray-800 hover:bg-gray-800 text-gray-300 rounded-2xl text-xs transition-colors"
              title="Refresh CTI State"
            >
              <RefreshCw size={15} className={cn(isRefreshing && "animate-spin text-blue-400")} />
            </button>
          </div>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-gray-800/80 overflow-x-auto pb-1 custom-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as CtiTabType)}
                className={cn(
                  "px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap uppercase tracking-wider",
                  isActive 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25 scale-102" 
                    : "bg-black/40 text-gray-400 hover:text-gray-200 hover:bg-gray-900 border border-gray-800/80"
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Content Viewport */}
      <div>
        {activeTab === 'dashboard' && (
          <CtiDashboardTab 
            isZh={isZh} 
            onEnrichQuery={handleEnrich}
            stats={overviewStats}
            indicators={indicators}
            connectors={connectors}
            reports={reports}
            onSyncConnector={connectors[0]?.id ? handleSyncConnector : undefined}
            onAddIndicatorClick={() => setIsAddIocOpen(true)}
            onSeedBaseline={handleSeedBaseline}
            onPurgeAll={handlePurgeAll}
          />
        )}

        {activeTab === 'graph' && (
          <CtiGraphTab 
            isZh={isZh} 
            onEnrichQuery={handleEnrich} 
          />
        )}

        {activeTab === 'map' && (
          <CtiMapTab 
            isZh={isZh} 
            onEnrichQuery={handleEnrich} 
          />
        )}

        {activeTab === 'indicators' && (
          <CtiIndicatorsTab 
            isZh={isZh}
            indicators={indicators}
            onAddIndicatorClick={() => setIsAddIocOpen(true)}
            onEnrichQuery={handleEnrich}
            onPushToFirewall={handlePushToFirewall}
            onDeleteIndicator={handleDeleteIndicator}
            onPurgeAll={handlePurgeAll}
            onSeedBaseline={handleSeedBaseline}
            onImportStixClick={() => setIsImportStixOpen(true)}
            onSyncFirstConnector={connectors[0]?.id ? () => handleSyncConnector(connectors[0].id) : undefined}
          />
        )}

        {activeTab === 'mitre' && (
          <CtiMitreTab 
            isZh={isZh} 
            onEnrichQuery={handleEnrich} 
          />
        )}

        {activeTab === 'connectors' && (
          <CtiConnectorsTab 
            isZh={isZh}
            connectors={connectors}
            onToggleStatus={handleToggleConnector}
            onSyncNow={handleSyncConnector}
            onAddConnector={handleAddConnector}
            onDeleteConnector={handleDeleteConnector}
            onSeedBaseline={handleSeedBaseline}
          />
        )}

        {activeTab === 'reports' && (
          <CtiReportsTab 
            isZh={isZh}
            reports={reports}
            onReadReport={(r) => setReadingReport(r)}
            onEnrichQuery={handleEnrich}
            onSeedBaseline={handleSeedBaseline}
            onDeleteReport={handleDeleteReport}
          />
        )}
      </div>

      {/* Modals Container */}
      <CtiEnrichmentModal
        isOpen={isEnrichOpen}
        query={enrichQuery}
        onClose={() => setIsEnrichOpen(false)}
        onPushToFirewall={handlePushToFirewall}
        isZh={isZh}
      />

      <CtiAddIndicatorModal
        isOpen={isAddIocOpen}
        onClose={() => setIsAddIocOpen(false)}
        onAdd={handleAddIndicator}
        isZh={isZh}
      />

      <CtiImportStixModal
        isOpen={isImportStixOpen}
        onClose={() => setIsImportStixOpen(false)}
        onImport={handleImportStix}
        isZh={isZh}
      />

      <CtiReportReaderModal
        report={readingReport}
        onClose={() => setReadingReport(null)}
        isZh={isZh}
      />

      {/* Action Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 bg-[#111114] border border-blue-500/50 shadow-2xl rounded-2xl p-4 flex items-center gap-3 text-xs text-white"
          >
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl">
              <Check size={16} />
            </div>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default IntelCTIView;
