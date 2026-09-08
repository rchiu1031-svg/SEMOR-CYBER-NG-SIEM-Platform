import React, { useState } from 'react';
import { 
  X, Shield, ShieldAlert, ShieldCheck, Globe, Activity, Terminal, 
  ExternalLink, Download, Copy, Check, Server, Tag, Lock, AlertTriangle,
  Zap, FileText, CheckCircle2, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CtiIndicator, CtiConnector, CtiReport, TlpLevel } from '../../data/ctiIntelData';
import { cn } from '../../lib/utils';

// ==========================================
// 1. QUICK IOC ENRICHMENT LOOKUP MODAL
// ==========================================
interface EnrichmentModalProps {
  isOpen: boolean;
  query: string;
  onClose: () => void;
  onPushToFirewall: (val: string) => void;
  isZh: boolean;
}

export function CtiEnrichmentModal({ isOpen, query, onClose, onPushToFirewall, isZh }: EnrichmentModalProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'whois' | 'malware' | 'stix'>('overview');

  if (!isOpen) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(query);
  const isHash = /^[a-fA-F0-9]{32,64}$/.test(query);
  const isCve = /^CVE-\d{4}-\d{4,7}$/i.test(query);

  const reputationScore = isCve ? 98 : isIp ? 92 : 88;
  const vtScore = isCve ? 'N/A (CVE KEV Active)' : isIp ? '64/72 Security Vendors Flagged' : '58/70 Vendors Flagged';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="bg-[#111114] border border-gray-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600/20 border border-red-500/30 rounded-xl">
              <Zap className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white uppercase tracking-tight">
                  {isZh ? 'STIX 2.1 即時情資研判與關聯分析' : 'STIX 2.1 Real-Time Enrichment & Threat Sandbox'}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 font-bold">
                  HIGH CONFIDENCE
                </span>
              </div>
              <p className="text-xs font-mono text-gray-400 mt-0.5">{query}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-gray-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-gray-950 px-5 pt-2 border-b border-gray-800 gap-2">
          {[
            { id: 'overview', label: isZh ? '威脅評估總覽' : 'Threat Overview' },
            { id: 'whois', label: isZh ? '網路溯源 / ASN' : 'Network & ASN' },
            { id: 'malware', label: isZh ? '關聯惡意樣本' : 'Associated Malware' },
            { id: 'stix', label: isZh ? 'STIX 2.1 JSON' : 'STIX 2.1 Bundle' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-3.5 py-2 text-xs font-bold transition-all border-b-2",
                activeTab === tab.id ? "border-blue-500 text-white" : "border-transparent text-gray-500 hover:text-gray-300"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
          {activeTab === 'overview' && (
            <>
              {/* Score Banners */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-3.5">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">
                    {isZh ? '威脅危險指數 (Score)' : 'Threat Reputation Score'}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-red-400 font-mono">{reputationScore}/100</span>
                    <span className="text-[10px] font-bold text-red-500 uppercase">Critical</span>
                  </div>
                </div>

                <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-3.5">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">
                    {isZh ? '全球資安沙箱檢測' : 'Multi-Engine Detection'}
                  </span>
                  <span className="text-sm font-bold text-orange-400 font-mono block mt-1">{vtScore}</span>
                </div>

                <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-3.5">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">
                    {isZh ? '歸屬組織 (Attribution)' : 'Attributed Actor'}
                  </span>
                  <span className="text-sm font-bold text-white block mt-1">APT28 (Fancy Bear)</span>
                </div>
              </div>

              {/* Threat Dossier Details */}
              <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert size={14} className="text-red-400" />
                  {isZh ? '研判特徵與威脅行為軌跡' : 'Threat Intelligence Behavioral Fingerprint'}
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {isZh 
                    ? `該指標與近期活躍的進階持續性威脅 (APT) 攻擊戰役強烈吻合。通訊特徵顯示其具備高速跳板與 Fast-Flux 偽裝機制，並曾向包括政府外交單位及關鍵基礎設施發起定向釣魚攻擊。沙箱執行紀錄確認包含記憶體反防毒注射與特權提權行為。`
                    : `This indicator correlates with active state-sponsored advanced persistent threat (APT) campaigns. Network telemetry reflects bulletproof VPS hopping, Fast-Flux proxying, and credential harvesting lures targeting government defense contractors.`
                  }
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-gray-800/80">
                  <div>
                    <span className="text-[9px] text-gray-500 uppercase block font-bold">TLP Protocol</span>
                    <span className="text-[11px] font-bold text-amber-400">TLP:AMBER</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-500 uppercase block font-bold">First Sighting</span>
                    <span className="text-[11px] font-mono text-gray-300">2026-03-24</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-500 uppercase block font-bold">Kill Chain</span>
                    <span className="text-[11px] font-bold text-blue-400">Command & Control</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-500 uppercase block font-bold">CISA KEV Status</span>
                    <span className="text-[11px] font-bold text-red-400">Exploitation Confirmed</span>
                  </div>
                </div>
              </div>

              {/* MITRE Mapping */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block">
                  MITRE ATT&CK® TTPs
                </span>
                <div className="flex flex-wrap gap-2">
                  {['T1566.001 Spearphishing', 'T1059.001 PowerShell', 'T1071.001 Web C2', 'T1003.001 LSASS Memory', 'T1190 Perimeter Exploit'].map(ttp => (
                    <span key={ttp} className="px-2.5 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono font-bold">
                      {ttp}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'whois' && (
            <div className="space-y-3 font-mono text-xs">
              <div className="bg-black/60 p-4 rounded-xl border border-gray-800 space-y-2">
                <div className="flex justify-between text-gray-400"><span className="text-gray-500">Autonomous System:</span> <span>AS44477 (Bulletproof Network Services Ltd.)</span></div>
                <div className="flex justify-between text-gray-400"><span className="text-gray-500">IP Geolocation:</span> <span>Frankfurt am Main, Hessen, DE (Relayed)</span></div>
                <div className="flex justify-between text-gray-400"><span className="text-gray-500">Reverse DNS PTR:</span> <span>host-185-234-219-12.static.fastvps.io</span></div>
                <div className="flex justify-between text-gray-400"><span className="text-gray-500">Passive DNS Sighting:</span> <span>update.microsoft-security.com (TTL: 300)</span></div>
                <div className="flex justify-between text-gray-400"><span className="text-gray-500">Shodan Open Ports:</span> <span>80/tcp (nginx), 443/tcp (TLS C2), 8443/tcp (custom)</span></div>
                <div className="flex justify-between text-gray-400"><span className="text-gray-500">SSL Certificate:</span> <span>CN=ms-update-cdn.org (Self-Signed, Exp: 2027)</span></div>
              </div>
            </div>
          )}

          {activeTab === 'malware' && (
            <div className="space-y-3">
              {[
                { name: 'Zebrocy Go Dropper', hash: '7d11f8e12470a9cb991283...d567', family: 'Trojan / Loader', detections: '68/72' },
                { name: 'Drovorub Kernel Stager', hash: '5c82a1b948f1023a8871...1290', family: 'Rootkit / Backdoor', detections: '65/71' },
                { name: 'CVE-2023-38831 RAR Exploit Lure', hash: 'e3b0c44298fc1c149afb...b855', family: 'Exploit Document', detections: '59/69' }
              ].map(m => (
                <div key={m.name} className="p-3 bg-gray-900/60 border border-gray-800 rounded-xl flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-white">{m.name}</h5>
                    <p className="text-[10px] font-mono text-gray-500">{m.hash}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-red-400">{m.detections}</span>
                    <span className="block text-[9px] text-gray-500 uppercase">{m.family}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'stix' && (
            <div className="relative bg-black p-4 rounded-xl border border-gray-800 text-[11px] font-mono text-green-400 max-h-60 overflow-y-auto">
              <button 
                onClick={() => handleCopy(`{\n  "type": "indicator",\n  "spec_version": "2.1",\n  "id": "indicator--${query}",\n  "pattern": "[ipv4-addr:value = '${query}']",\n  "confidence": 92\n}`)}
                className="absolute top-3 right-3 p-1.5 bg-gray-900 border border-gray-700 rounded text-gray-400 hover:text-white"
              >
                {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
              </button>
              <pre>{JSON.stringify({
                type: "indicator",
                spec_version: "2.1",
                id: `indicator--query-${Math.random().toString(36).substring(7)}`,
                pattern: `[network-traffic:dst_ref.value = '${query}']`,
                pattern_type: "stix",
                valid_from: "2026-03-24T00:00:00Z",
                confidence: reputationScore,
                labels: ["malicious-activity", "apt28", "c2"]
              }, null, 2)}</pre>
            </div>
          )}
        </div>

        {/* Modal Footer / Fast Actions */}
        <div className="p-4 border-t border-gray-800 bg-black/50 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[11px] text-gray-400">
            {isZh ? '已完成 CTI 自動關聯分析' : 'Enrichment complete across 8 TAXII feeds'}
          </span>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                onPushToFirewall(query);
                onClose();
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-red-600/20"
            >
              <ShieldAlert size={14} />
              {isZh ? '即刻下發防火牆黑名單 (Push to Blocklist)' : 'Push to Firewall Blocklist'}
            </button>
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold transition-colors"
            >
              {isZh ? '關閉' : 'Close'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ==========================================
// 2. ADD NEW STIX INDICATOR MODAL
// ==========================================
interface AddIndicatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (ioc: Partial<CtiIndicator>) => void;
  isZh: boolean;
}

export function CtiAddIndicatorModal({ isOpen, onClose, onAdd, isZh }: AddIndicatorModalProps) {
  const [type, setType] = useState<CtiIndicator['type']>('IPv4-Addr');
  const [value, setValue] = useState('');
  const [score, setScore] = useState(85);
  const [tlp, setTlp] = useState<TlpLevel>('TLP:AMBER');
  const [actor, setActor] = useState('APT28');
  const [phase, setPhase] = useState<CtiIndicator['killChainPhase']>('C2');
  const [tags, setTags] = useState('Threat-Hunt, C2-Relay');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;

    onAdd({
      type,
      value: value.trim(),
      score,
      tlp,
      actor,
      campaign: 'Ad-Hoc Tactical Threat Hunt',
      killChainPhase: phase,
      firstSeen: new Date().toISOString().split('T')[0],
      lastSeen: new Date().toISOString().replace('T', ' ').substring(0, 16),
      sightings: 1,
      status: 'Active',
      vtDetectionRatio: '45/70',
      tags: tags.split(',').map(s => s.trim()).filter(Boolean)
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[#111114] border border-gray-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-5"
      >
        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 border border-blue-500/30 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isZh ? '新增 STIX 2.1 威脅情資指標 (IOC)' : 'Add New STIX 2.1 Threat Indicator'}
              </h3>
              <p className="text-xs text-gray-500">
                {isZh ? '遵循 STIX 2.1 標準規格進行情資入庫與派送' : 'Standard STIX 2.1 indicator ingestion into local repository'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 font-bold mb-1">{isZh ? '指標種類 (Type)' : 'Type'}</label>
              <select 
                value={type}
                onChange={e => setType(e.target.value as any)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500"
              >
                <option value="IPv4-Addr">IPv4 Address</option>
                <option value="IPv6-Addr">IPv6 Address</option>
                <option value="Domain-Name">Domain Name</option>
                <option value="URL">URL / URI</option>
                <option value="File-SHA256">File SHA-256</option>
                <option value="File-MD5">File MD5</option>
                <option value="Windows-Registry">Windows Registry Key</option>
                <option value="Email-Addr">Email Address</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-400 font-bold mb-1">{isZh ? 'TLP 協議等級' : 'TLP Protocol'}</label>
              <select 
                value={tlp}
                onChange={e => setTlp(e.target.value as any)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500"
              >
                <option value="TLP:CLEAR">TLP:CLEAR (Public)</option>
                <option value="TLP:GREEN">TLP:GREEN (Community)</option>
                <option value="TLP:AMBER">TLP:AMBER (Organization)</option>
                <option value="TLP:AMBER+STRICT">TLP:AMBER+STRICT</option>
                <option value="TLP:RED">TLP:RED (Confidential)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-gray-400 font-bold mb-1">{isZh ? '指標數值 (Indicator Pattern Value)' : 'Indicator Value'}</label>
            <input 
              type="text" 
              required
              placeholder={type === 'IPv4-Addr' ? 'e.g. 195.123.45.67' : type === 'Domain-Name' ? 'e.g. evil-command-c2.net' : 'Pattern value...'}
              value={value}
              onChange={e => setValue(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2.5 text-white font-mono outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 font-bold mb-1">{isZh ? '關聯威脅組織 (Actor)' : 'Attributed Actor'}</label>
              <input 
                type="text"
                value={actor}
                onChange={e => setActor(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-gray-400 font-bold mb-1">{isZh ? '殺傷鏈階段 (Kill Chain)' : 'Kill Chain Phase'}</label>
              <select 
                value={phase}
                onChange={e => setPhase(e.target.value as any)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500"
              >
                <option value="Reconnaissance">Reconnaissance</option>
                <option value="Weaponization">Weaponization</option>
                <option value="Delivery">Delivery</option>
                <option value="Exploitation">Exploitation</option>
                <option value="Installation">Installation</option>
                <option value="C2">Command & Control (C2)</option>
                <option value="Exfiltration">Exfiltration</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-gray-400 font-bold">{isZh ? '置信度評分 (Confidence Score)' : 'Confidence Score'}</label>
              <span className="font-mono font-bold text-blue-400">{score}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={score} 
              onChange={e => setScore(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-400 font-bold mb-1">{isZh ? '標籤 (Tags, 逗號分隔)' : 'Tags (Comma separated)'}</label>
            <input 
              type="text"
              value={tags}
              onChange={e => setTags(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500 font-mono text-xs"
            />
          </div>

          <div className="pt-4 border-t border-gray-800 flex items-center justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-bold"
            >
              {isZh ? '取消' : 'Cancel'}
            </button>
            <button 
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20"
            >
              {isZh ? '存入情資庫 (Save STIX IOC)' : 'Save STIX IOC'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ==========================================
// 3. CTI REPORT READER MODAL
// ==========================================
interface ReportModalProps {
  report: CtiReport | null;
  onClose: () => void;
  isZh: boolean;
}

export function CtiReportReaderModal({ report, onClose, isZh }: ReportModalProps) {
  const [copied, setCopied] = useState(false);
  if (!report) return null;

  const handleDownload = () => {
    const blob = new Blob([report.rawStixJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.id}-stix2.1-bundle.json`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[#111114] border border-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-800 bg-black/40 flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono text-xs font-bold border border-blue-500/30">
                {report.id}
              </span>
              <span className="px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30">
                {report.tlp}
              </span>
              <span className="text-xs text-gray-500 font-mono">
                Published: {report.published}
              </span>
            </div>
            <h3 className="text-lg font-black text-white leading-snug">{report.title}</h3>
            <p className="text-xs text-gray-400 mt-1">Author: {report.author}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white p-1 rounded-lg hover:bg-gray-800">
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6 text-sm">
          {/* Executive Summary */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
              <FileText size={14} /> {isZh ? '執行摘要 (Executive Summary)' : 'Executive Summary'}
            </h4>
            <p className="text-gray-300 leading-relaxed bg-gray-900/40 p-4 rounded-xl border border-gray-800/80">
              {report.summary}
            </p>
          </div>

          {/* Adversary Profile */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-red-400 uppercase tracking-widest flex items-center gap-2">
              <ShieldAlert size={14} /> {isZh ? '威脅組織剖析 (Adversary Profile)' : 'Adversary Profile'}
            </h4>
            <p className="text-gray-300 leading-relaxed bg-gray-900/40 p-4 rounded-xl border border-gray-800/80">
              {report.adversaryProfile}
            </p>
          </div>

          {/* Technical Analysis */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-purple-400 uppercase tracking-widest flex items-center gap-2">
              <Terminal size={14} /> {isZh ? '戰術與技術手法深度剖析 (Technical Analysis)' : 'Technical Analysis'}
            </h4>
            <p className="text-gray-300 leading-relaxed bg-gray-900/40 p-4 rounded-xl border border-gray-800/80">
              {report.technicalAnalysis}
            </p>
          </div>

          {/* MITRE ATT&CK & IOCs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-900/40 p-4 rounded-xl border border-gray-800/80 space-y-2">
              <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider">MITRE ATT&CK® Techniques</h5>
              <div className="flex flex-wrap gap-1.5">
                {report.mitreTechniques.map(tech => (
                  <span key={tech} className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono font-bold rounded">
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-gray-900/40 p-4 rounded-xl border border-gray-800/80 space-y-2">
              <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Correlated Indicators (IOCs)</h5>
              <div className="space-y-1">
                {report.relatedIocs.map(ioc => (
                  <div key={ioc} className="text-xs font-mono text-gray-300 bg-black/40 px-2.5 py-1 rounded border border-gray-800">
                    {ioc}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recommended Mitigations */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-green-400 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck size={14} /> {isZh ? '防禦建議與緩解措施 (Actionable Mitigations)' : 'Actionable Mitigations'}
            </h4>
            <ul className="space-y-2">
              {report.mitigations.map((m, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-gray-300 bg-gray-900/40 p-3 rounded-xl border border-gray-800/80">
                  <CheckCircle2 size={15} className="text-green-400 shrink-0 mt-0.5" />
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 bg-black/50 flex items-center justify-between">
          <span className="text-xs text-gray-500 font-mono">STIX 2.1 Standard Compliant Report</span>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleDownload}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-blue-600/20"
            >
              <Download size={14} />
              {isZh ? '匯出 STIX 2.1 Bundle (JSON)' : 'Export STIX 2.1 Bundle'}
            </button>
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded-xl"
            >
              {isZh ? '關閉' : 'Close'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
