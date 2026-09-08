import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Zap,
  Server,
  Lock,
  FileCheck
} from 'lucide-react';
import { CriticalIncidentRecord } from './types';
import { cn } from '../../lib/utils';

interface OverviewSoarActionModalProps {
  incident: CriticalIncidentRecord | null;
  onClose: () => void;
  isZh: boolean;
  onComplete?: () => void;
}

export const OverviewSoarActionModal: React.FC<OverviewSoarActionModalProps> = ({
  incident,
  onClose,
  isZh,
  onComplete
}) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isFinished, setIsFinished] = useState(false);

  const playbookSteps = [
    {
      id: 'quarantine_edr',
      titleZh: '端點 EDR 網路隔離',
      titleEn: 'Endpoint Network Quarantine',
      descZh: '向端點代理程式下發封閉政策，阻斷所有內網通訊 (除 SOC 監控連線)',
      descEn: 'Isolate host from local subnet except agent management port',
      icon: <Server size={16} />
    },
    {
      id: 'block_c2_ngfw',
      titleZh: '邊界防火牆 C2 IP 丟棄',
      titleEn: 'Edge NGFW Ingress/Egress Drop',
      descZh: '於 Palo Alto / Fortinet 防火牆新增 IP 黑名單：185.220.101.5 (TTL 48h)',
      descEn: 'Push null-route rule for external C2 IP to all edge clusters',
      icon: <Lock size={16} />
    },
    {
      id: 'revoke_auth_tokens',
      titleZh: 'AD / OAuth 權杖強制失效',
      titleEn: 'Invalidate Identity Sessions',
      descZh: '撤銷遭入侵帳號之現存 Kerberos TGT 與所有雲端 SSO 登入 Session',
      descEn: 'Force sign-out across all SSO/AD services and invalidate tokens',
      icon: <Zap size={16} />
    },
    {
      id: 'ram_forensics_snapshot',
      titleZh: '記憶體 RAM 快照取證',
      titleEn: 'Live Memory Dump Forensics',
      descZh: '透過背景安全通道擷取端點 Volatile Memory 供後續沙箱逆向分析',
      descEn: 'Capture memory dump image for digital forensics investigation',
      icon: <FileCheck size={16} />
    }
  ];

  const handleStartExecution = () => {
    setIsExecuting(true);
    setCurrentStep(1);

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= playbookSteps.length) {
          clearInterval(interval);
          setIsExecuting(false);
          setIsFinished(true);
          if (onComplete) onComplete();
          return prev;
        }
        return prev + 1;
      });
    }, 1100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#111114] border border-gray-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-gradient-to-r from-red-950/25 via-transparent to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-600/20 border border-red-500/30 rounded-xl text-red-400">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">
                  {isZh ? 'SOAR 自動化處置劇本執行器' : 'SOAR Automated Playbook Runner'}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-500/20 text-red-400 border border-red-500/30 font-bold">
                  PB-SEC-091
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {isZh ? '針對勒索病毒橫向感染與機密外傳之標準緊急阻斷協同劇本' : 'Emergency Ransomware & Exfiltration Containment Playbook'}
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

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Target Incident Pill */}
          {incident && (
            <div className="bg-black/50 border border-gray-800 rounded-xl p-3 flex items-center justify-between text-xs">
              <div>
                <span className="text-gray-500">{isZh ? '目標事件：' : 'Target:'} </span>
                <strong className="text-white font-mono">{incident.id}</strong>
                <span className="text-gray-400 ml-2">({isZh ? incident.threatZh : incident.threatEn})</span>
              </div>
              <span className="font-mono text-red-400 font-bold">{incident.srcIp}</span>
            </div>
          )}

          {/* Steps List */}
          <div className="space-y-3">
            {playbookSteps.map((step, idx) => {
              const stepNumber = idx + 1;
              const isCompleted = isFinished || currentStep > stepNumber;
              const isCurrent = isExecuting && currentStep === stepNumber;

              return (
                <div
                  key={step.id}
                  className={cn(
                    "p-3.5 rounded-xl border transition-all flex items-start gap-3.5",
                    isCompleted
                      ? "bg-emerald-950/20 border-emerald-500/40 text-gray-200"
                      : isCurrent
                      ? "bg-blue-950/30 border-blue-500 shadow-md shadow-blue-500/10 text-white animate-pulse"
                      : "bg-black/40 border-gray-800/80 text-gray-400 opacity-60"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-lg shrink-0",
                    isCompleted
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : isCurrent
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      : "bg-gray-900 text-gray-500 border border-gray-800"
                  )}>
                    {isCompleted ? <CheckCircle2 size={16} /> : step.icon}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white">
                        {isZh ? step.titleZh : step.titleEn}
                      </h4>
                      <span className={cn(
                        "text-[10px] font-mono font-bold px-1.5 py-0.5 rounded uppercase",
                        isCompleted
                          ? "text-emerald-400 bg-emerald-500/10"
                          : isCurrent
                          ? "text-blue-400 bg-blue-500/10"
                          : "text-gray-500"
                      )}>
                        {isCompleted ? (isZh ? '已完成' : 'COMPLETED') : isCurrent ? (isZh ? '執行中...' : 'RUNNING') : (isZh ? '等待中' : 'QUEUED')}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">
                      {isZh ? step.descZh : step.descEn}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Success Banner */}
          {isFinished && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-xs text-emerald-300">
              <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
              <div>
                <strong className="block text-emerald-200">
                  {isZh ? 'SOAR 劇本全數執行完成' : 'SOAR Playbook Execution Finished'}
                </strong>
                <span>
                  {isZh
                    ? '端點 WS-22 已隔離，邊界阻斷生效，帳號存取撤銷，已產生取證數位鑑識檔案。'
                    : 'Endpoint quarantined, perimeter rules enforced, sessions revoked, RAM snapshot generated.'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-950 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold transition-all"
          >
            {isZh ? '取消 / 關閉' : 'Cancel / Close'}
          </button>

          {!isFinished ? (
            <button
              onClick={handleStartExecution}
              disabled={isExecuting}
              className={cn(
                "flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all text-white shadow-lg",
                isExecuting
                  ? "bg-blue-600 opacity-80 cursor-wait"
                  : "bg-red-600 hover:bg-red-700 shadow-red-600/20"
              )}
            >
              <Zap size={14} className={isExecuting ? "animate-spin" : ""} />
              <span>{isZh ? (isExecuting ? '自動化處置執行中...' : '確認執行劇本') : (isExecuting ? 'Executing...' : 'Run Containment')}</span>
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all"
            >
              {isZh ? '完成' : 'Done'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
