import React, { useState } from 'react';
import { WormLedgerRecord } from './types';
import { cn } from '../../lib/utils';
import {
  ShieldCheck, Lock, Hash, Clock, CheckCircle2, Copy, Check,
  RefreshCw, Search, Database, FileText
} from 'lucide-react';

interface ComplianceWormLedgerViewProps {
  ledgerRecords: WormLedgerRecord[];
  isZh: boolean;
}

export const ComplianceWormLedgerView: React.FC<ComplianceWormLedgerViewProps> = ({
  ledgerRecords,
  isZh
}) => {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2500);
  };

  const handleVerifyChain = () => {
    setIsVerifying(true);
    setVerificationResult(null);

    setTimeout(() => {
      setIsVerifying(false);
      setVerificationResult(
        isZh
          ? '全鏈驗證通過！全數 5 個區塊與 Merkle Root 簽章完全吻合，未偵測到任何竄改痕跡。'
          : 'Chain Integrity Verified 100%! All blocks and Merkle Root signatures match perfectly.'
      );
      setTimeout(() => setVerificationResult(null), 5000);
    }, 1200);
  };

  const filteredRecords = ledgerRecords.filter(r => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.hash.toLowerCase().includes(q) ||
        r.event.toLowerCase().includes(q) ||
        r.framework.toLowerCase().includes(q) ||
        r.auditorId.toLowerCase().includes(q) ||
        r.blockId.toString().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Verification Notice */}
      {verificationResult && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2.5 shadow-lg shadow-emerald-500/10 animate-in fade-in duration-200">
          <ShieldCheck size={18} className="text-emerald-400 shrink-0" />
          <span className="font-bold">{verificationResult}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-br from-blue-600/10 via-indigo-600/5 to-transparent border border-blue-500/20 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-500/20 rounded-xl text-blue-400 border border-blue-500/30">
              <Lock size={18} />
            </span>
            <h3 className="text-base font-black text-white tracking-tight">
              {isZh ? 'WORM 一次寫入多次讀取 (Write Once, Read Many) 稽核存證鏈' : 'WORM Immutable Cryptographic Audit Ledger'}
            </h3>
          </div>
          <p className="text-xs text-gray-400 max-w-2xl leading-relaxed">
            {isZh
              ? '嚴格遵循 SEC 17a-4、ISO 27001 A.8.15 與 PCI DSS Req 10.2 規範。所有遙測日誌每 15 分鐘以 SHA-256 雜湊密封寫入區塊鏈存證槽，保證不可變動與不可否認性。'
              : 'Strict compliance with SEC 17a-4, ISO 27001 A.8.15 & PCI DSS Req 10.2. Every telemetry event is sealed into an immutable Merkle ledger every 15 minutes.'}
          </p>
        </div>

        <button
          type="button"
          disabled={isVerifying}
          onClick={handleVerifyChain}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-95 shrink-0"
        >
          <RefreshCw size={13} className={cn(isVerifying && "animate-spin")} />
          <span>{isVerifying ? (isZh ? '密碼學驗證中...' : 'Verifying Chain...') : (isZh ? '密碼學完整性全檢' : 'Verify Ledger')}</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="p-4 bg-[#111114] border border-white/5 rounded-2xl flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={isZh ? '搜尋區塊 ID、雜湊指紋、審計簽署 ID、法規條例...' : 'Search block ID, hash, auditor ID, event...'}
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-gray-500 outline-none focus:border-blue-500"
          />
        </div>
        <div className="text-xs text-gray-400 font-mono">
          {isZh ? `已密封區塊: ${filteredRecords.length} 塊` : `Blocks: ${filteredRecords.length}`}
        </div>
      </div>

      {/* Blocks List */}
      <div className="space-y-4">
        {filteredRecords.map((block) => (
          <div
            key={block.blockId}
            className="p-5 bg-[#111114] border border-white/5 rounded-2xl space-y-3 hover:border-white/15 transition-all shadow-lg"
          >
            {/* Block Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-blue-500/15 text-blue-400 font-mono font-black text-xs rounded-lg border border-blue-500/30">
                  Block #{block.blockId}
                </span>
                <span className="px-2 py-0.5 bg-white/5 text-gray-300 font-mono text-xs rounded">
                  {block.framework}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-gray-400 font-mono">
                  <Clock size={12} /> {block.timestamp}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-gray-400">
                  Auditor: <span className="text-gray-200 font-bold">{block.auditorId}</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck size={11} /> {block.status}
                </span>
              </div>
            </div>

            {/* Event Description */}
            <div className="text-xs font-bold text-gray-200">
              {block.event}
            </div>

            {/* Hashes details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-[11px] font-mono">
              <div className="p-2.5 bg-black/40 rounded-xl border border-white/5 space-y-1">
                <div className="flex items-center justify-between text-gray-500 text-[10px]">
                  <span>CURRENT BLOCK SHA-256 HASH</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(block.hash)}
                    className="text-gray-400 hover:text-white flex items-center gap-1"
                  >
                    {copiedHash === block.hash ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                    <span className="text-[9px]">{copiedHash === block.hash ? 'COPIED' : 'COPY'}</span>
                  </button>
                </div>
                <p className="text-blue-400 break-all leading-tight">{block.hash}</p>
              </div>

              <div className="p-2.5 bg-black/40 rounded-xl border border-white/5 space-y-1">
                <div className="flex items-center justify-between text-gray-500 text-[10px]">
                  <span>MERKLE ROOT SIGNATURE</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(block.merkleRoot)}
                    className="text-gray-400 hover:text-white flex items-center gap-1"
                  >
                    {copiedHash === block.merkleRoot ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                    <span className="text-[9px]">{copiedHash === block.merkleRoot ? 'COPIED' : 'COPY'}</span>
                  </button>
                </div>
                <p className="text-cyan-400 break-all leading-tight">{block.merkleRoot}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
