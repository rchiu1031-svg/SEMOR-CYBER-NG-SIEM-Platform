import React, { useState } from 'react';
import {
  X,
  Brain,
  AlertTriangle,
  User,
  Clock,
  HardDrive,
  Globe,
  FileText,
  ShieldCheck,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { UebaHighRiskEntity } from './types';
import { cn } from '../../lib/utils';

interface OverviewEntityModalProps {
  entity: UebaHighRiskEntity | null;
  onClose: () => void;
  isZh: boolean;
  onRevokeSession?: (entityId: string) => void;
}

export const OverviewEntityModal: React.FC<OverviewEntityModalProps> = ({
  entity,
  onClose,
  isZh,
  onRevokeSession
}) => {
  const [activeTab, setActiveTab] = useState<'baseline' | 'storyline' | 'actions'>('baseline');
  const [isRevoked, setIsRevoked] = useState(false);

  if (!entity) return null;

  const baselineComparisons = [
    {
      metricZh: '登入存取時段',
      metricEn: 'Login Hours',
      current: '02:40 AM (非慣用時段)',
      baseline: '09:00 - 18:00 (週一至週五)',
      deviation: isZh ? '嚴重偏離常態' : 'Severe Anomaly',
      status: 'danger'
    },
    {
      metricZh: '檔案存取數量 (24h)',
      metricEn: 'File Access Vol',
      current: `${entity.networkActivity.filesAccessed} 份檔案`,
      baseline: '45 份 / 日常平均',
      deviation: '+2,655%',
      status: 'danger'
    },
    {
      metricZh: '出站流量總量 (24h)',
      metricEn: 'Outbound Traffic',
      current: `${(entity.networkActivity.bytesOutMb / 1024).toFixed(1)} GB`,
      baseline: '120 MB / 日常平均',
      deviation: isZh ? '極高風險突增' : 'High Surge',
      status: 'danger'
    },
    {
      metricZh: '異常連線來源 IP',
      metricEn: 'Source IP Anomaly',
      current: '103.152.220.45 (未知 VPN)',
      baseline: '10.88.x.x (辦公室內網)',
      deviation: isZh ? '首次出現位址' : 'First-time IP',
      status: 'warning'
    }
  ];

  const storylineEvents = [
    { time: '02:40:12', descZh: '自外部 VPN 節點成功通過 MFA 驗證登入', descEn: 'MFA authenticated login via external VPN gateway', risk: 'Medium' },
    { time: '02:48:30', descZh: '存取 /src/core/crypto 演算法機密檔案庫', descEn: 'Traversed sensitive path /src/core/crypto', risk: 'High' },
    { time: '03:12:05', descZh: '背景執行 7z.exe 並建立密碼加密壓縮封存檔 (15GB)', descEn: 'Executed 7z.exe to create encrypted 15GB archive', risk: 'Critical' },
    { time: '03:45:22', descZh: '透過 WebClient 發起大量出站連線至外部未授權 IP', descEn: 'High-volume egress traffic to external untrusted node', risk: 'Critical' }
  ];

  const handleRevoke = () => {
    setIsRevoked(true);
    if (onRevokeSession) onRevokeSession(entity.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#111114] border border-gray-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-gradient-to-r from-purple-950/30 via-transparent to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 font-bold font-mono text-sm">
              {entity.avatarInitials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">{entity.name}</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-500/20 text-red-400 border border-red-500/30 font-bold">
                  {isZh ? '風險指數: ' : 'Risk Score: '}{entity.score}/100
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {isZh ? entity.departmentZh : entity.departmentEn} · {isZh ? entity.roleZh : entity.roleEn}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-gray-800 bg-gray-950 px-5 pt-2 text-xs">
          <button
            onClick={() => setActiveTab('baseline')}
            className={cn(
              "px-4 py-2 font-bold transition-all border-b-2",
              activeTab === 'baseline' ? "border-purple-500 text-white" : "border-transparent text-gray-400 hover:text-gray-200"
            )}
          >
            {isZh ? '行為基線偏離分析' : 'Baseline Deviations'}
          </button>
          <button
            onClick={() => setActiveTab('storyline')}
            className={cn(
              "px-4 py-2 font-bold transition-all border-b-2",
              activeTab === 'storyline' ? "border-purple-500 text-white" : "border-transparent text-gray-400 hover:text-gray-200"
            )}
          >
            {isZh ? '實體活動時間軸' : 'Activity Storyline'}
          </button>
        </div>

        {/* Modal content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {activeTab === 'baseline' ? (
            <div className="space-y-3">
              <div className="text-xs text-gray-400">
                {isZh
                  ? 'UEBA 機器學習模型為每位使用者計算 30 天日常行為基線，以下為今日顯著偏離項目：'
                  : 'Machine-learning baseline metrics comparing 30-day norm to current anomalies:'}
              </div>

              <div className="space-y-2.5">
                {baselineComparisons.map((b, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-black/40 border border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <span className="font-bold text-white block mb-0.5">
                        {isZh ? b.metricZh : b.metricEn}
                      </span>
                      <div className="text-gray-400 text-[11px]">
                        <span>{isZh ? '現狀：' : 'Current: '}</span>
                        <strong className="text-red-400">{b.current}</strong>
                        <span className="mx-2">|</span>
                        <span>{isZh ? '常態：' : 'Norm: '}</span>
                        <span>{b.baseline}</span>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded bg-red-500/15 text-red-400 border border-red-500/30 text-[10px] font-mono font-bold self-start sm:self-center shrink-0">
                      {b.deviation}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2.5">
                {storylineEvents.map((ev, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-black/40 border border-gray-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <Clock size={14} className="text-gray-500 shrink-0" />
                      <span className="font-mono text-gray-400 text-[11px] shrink-0">{ev.time}</span>
                      <span className="text-gray-200">{isZh ? ev.descZh : ev.descEn}</span>
                    </div>
                    <span className={cn(
                      "text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase shrink-0",
                      ev.risk === 'Critical' ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    )}>
                      {ev.risk}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isRevoked && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span>{isZh ? '已成功撤銷該使用者之所有作用中身分權杖並通知主管。' : 'Active sessions revoked; manager notified.'}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-950 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold transition-all"
          >
            {isZh ? '關閉' : 'Close'}
          </button>

          {!isRevoked ? (
            <button
              onClick={handleRevoke}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-600/20"
            >
              <Zap size={14} />
              <span>{isZh ? '強制登出並撤銷權限' : 'Revoke All Sessions'}</span>
            </button>
          ) : (
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 size={14} />
              {isZh ? '帳號已處置' : 'Secured'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
