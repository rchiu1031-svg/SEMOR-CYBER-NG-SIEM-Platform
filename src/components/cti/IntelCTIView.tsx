import React, { useState } from 'react';
import { 
  Activity, Globe, Search, RefreshCw, Zap, Shield, ShieldAlert, 
  Layers, Database, FileText, Target, Server, Check, ArrowUpRight 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  INITIAL_INDICATORS, 
  INITIAL_CONNECTORS, 
  CtiIndicator, 
  CtiConnector, 
  CtiReport 
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
  CtiReportReaderModal 
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
  const [readingReport, setReadingReport] = useState<CtiReport | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dynamic state for Indicators & Connectors
  const [indicators, setIndicators] = useState<CtiIndicator[]>(INITIAL_INDICATORS);
  const [connectors, setConnectors] = useState<CtiConnector[]>(INITIAL_CONNECTORS);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

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

  const handlePushToFirewall = (val: string) => {
    showToast(isZh ? `已成功將指標 [${val}] 推送至次世代防火牆 (NGFW) 阻斷黑名單！` : `Successfully pushed [${val}] to NGFW blocklist!`);
  };

  const handleToggleConnector = (id: string) => {
    setConnectors(prev => prev.map(c => {
      if (c.id === id) {
        return {
          ...c,
          status: (c.status === 'Paused' ? 'Active' : 'Paused') as CtiConnector['status']
        };
      }
      return c;
    }));
  };

  const handleSyncConnector = (id: string) => {
    setConnectors(prev => prev.map(c => {
      if (c.id === id) {
        const currentCount = c.ingestedCount ?? parseInt(c.count?.replace(/[^0-9]/g, '') || '0');
        const newCount = currentCount + Math.floor(Math.random() * 40 + 5);
        return {
          ...c,
          lastSync: 'Just now',
          ingestedCount: newCount,
          count: `${newCount.toLocaleString()} Observables`
        };
      }
      return c;
    }));
    showToast(isZh ? `已向 TAXII 2.1 節點發起全量增量拉取` : `Triggered TAXII 2.1 incremental poll`);
  };

  const handleAddIndicator = (newIoc: Partial<CtiIndicator>) => {
    const created: CtiIndicator = {
      id: `IOC-${Date.now().toString().slice(-4)}`,
      stixId: `indicator--${Math.random().toString(36).substring(7)}`,
      type: newIoc.type || 'IPv4-Addr',
      value: newIoc.value || '',
      score: newIoc.score || 80,
      tlp: newIoc.tlp || 'TLP:AMBER',
      actor: newIoc.actor || 'Unknown Threat Actor',
      campaign: newIoc.campaign || 'Custom Intelligence',
      firstSeen: newIoc.firstSeen || new Date().toISOString().split('T')[0],
      lastSeen: newIoc.lastSeen || new Date().toISOString().split('T')[0],
      sightings: newIoc.sightings || 1,
      killChainPhase: newIoc.killChainPhase || 'C2',
      status: 'Active',
      vtDetectionRatio: newIoc.vtDetectionRatio || '42/70',
      tags: newIoc.tags || ['User-Added']
    };
    setIndicators(prev => [created, ...prev]);
    showToast(isZh ? `已成功建立 STIX 2.1 指標 [${created.value}]` : `Created STIX 2.1 indicator [${created.value}]`);
  };

  const handleAddConnector = (newConn: Partial<CtiConnector>) => {
    const created: CtiConnector = {
      id: `conn-${Date.now().toString().slice(-4)}`,
      name: newConn.name || 'New Threat Feed',
      vendor: newConn.vendor || 'Custom CTI Provider',
      type: newConn.type || 'Ingestion',
      protocol: newConn.protocol || 'TAXII 2.1',
      endpoint: newConn.endpoint || 'https://cti.local',
      status: 'Active',
      lastSync: 'Just now',
      count: '0 Observables',
      ingestedCount: 0,
      tlpFloor: newConn.tlpFloor || 'TLP:AMBER',
      pullInterval: newConn.pullInterval || 'Every 15m',
      tlsStatus: 'TLS 1.3 Verified',
      errorRate: '0.0%'
    };
    setConnectors(prev => [...prev, created]);
    showToast(isZh ? `已成功建立連接器管線 [${created.name}]` : `Created connector [${created.name}]`);
  };

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
          <div className="space-y-1">
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
            </div>
            <p className="text-xs text-gray-400 max-w-3xl">
              {isZh 
                ? '全天候即時匯流全球國家級 APT 組織情資、暗網威脅走廊、零日漏洞利用與 MITRE ATT&CK 戰術矩陣，提供自動化情資研判與防火牆/EDR 一鍵規則下發能力。'
                : 'Enterprise-grade Cyber Threat Intelligence (CTI) engine delivering real-time STIX 2.1 observables, adversarial knowledge graphs, geopolitical attack telemetry, and automated mitigation enforcement.'
              }
            </p>
          </div>

          {/* Quick IOC Enrichment Input Bar */}
          <form onSubmit={handleGlobalSearchSubmit} className="flex items-center gap-2 w-full xl:w-auto">
            <div className="relative flex-1 xl:w-80">
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
          />
        )}

        {activeTab === 'reports' && (
          <CtiReportsTab 
            isZh={isZh}
            onReadReport={(r) => setReadingReport(r)}
            onEnrichQuery={handleEnrich}
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
