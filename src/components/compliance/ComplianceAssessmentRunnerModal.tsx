import React, { useState, useEffect } from 'react';
import { FrameworkId } from './types';
import { cn } from '../../lib/utils';
import {
  X, Play, ShieldCheck, CheckCircle2, AlertTriangle, XCircle,
  RefreshCw, Terminal, Cpu, Database, Network, Key, Layers
} from 'lucide-react';

interface ComplianceAssessmentRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFrameworkId: FrameworkId;
  onScanCompleted: (frameworkId: FrameworkId, newScore: number) => void;
  isZh: boolean;
}

interface ScanStage {
  id: string;
  nameZh: string;
  nameEn: string;
  icon: React.ReactNode;
  durationMs: number;
}

export const ComplianceAssessmentRunnerModal: React.FC<ComplianceAssessmentRunnerModalProps> = ({
  isOpen,
  onClose,
  selectedFrameworkId,
  onScanCompleted,
  isZh
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [currentStageIndex, setCurrentStageIndex] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [passCount, setPassCount] = useState(0);
  const [warnCount, setWarnCount] = useState(0);
  const [failCount, setFailCount] = useState(0);

  const stages: ScanStage[] = [
    {
      id: 'net',
      nameZh: '網路邊界與 CDE 網段微隔離策略掃描',
      nameEn: 'Network Boundary & Microsegmentation Audit',
      icon: <Network size={14} />,
      durationMs: 800
    },
    {
      id: 'iam',
      nameZh: 'IAM 特權帳號、FIDO2 MFA 與閒置會話盤點',
      nameEn: 'IAM Privileges, FIDO2 MFA & Inactive Accounts',
      icon: <Key size={14} />,
      durationMs: 900
    },
    {
      id: 'endpoint',
      nameZh: 'OpenXDR 端點防禦與 FIM 系統核心完整性校驗',
      nameEn: 'OpenXDR & FIM System Core Integrity Check',
      icon: <Cpu size={14} />,
      durationMs: 1000
    },
    {
      id: 'crypto',
      nameZh: '資料庫 AES-256 加密、HSM 密鑰與 TLS 1.3 協定鑑識',
      nameEn: 'Database AES-256, HSM Keys & TLS 1.3 Verification',
      icon: <Database size={14} />,
      durationMs: 900
    },
    {
      id: 'worm',
      nameZh: 'WORM 不可篡改審計日誌與 Merkle 樹區塊鏈封裝',
      nameEn: 'WORM Immutable Audit Log & Merkle Tree Sealing',
      icon: <Layers size={14} />,
      durationMs: 800
    }
  ];

  const resetState = () => {
    setIsScanning(false);
    setCurrentStageIndex(-1);
    setProgress(0);
    setLogs([]);
    setIsFinished(false);
    setPassCount(0);
    setWarnCount(0);
    setFailCount(0);
  };

  const startScan = () => {
    resetState();
    setIsScanning(true);
    setLogs([
      `[${new Date().toLocaleTimeString()}] 啟動自動化合規全檢引擎 (Engine v4.8) - 標的: ${selectedFrameworkId}`,
      `[${new Date().toLocaleTimeString()}] 載入基準規範: CIS Benchmark v8.0 & 官方法規控制項庫`
    ]);

    let step = 0;
    let currProgress = 0;
    let passes = 0;
    let warns = 0;
    let fails = 0;

    const interval = setInterval(() => {
      if (step < stages.length) {
        setCurrentStageIndex(step);
        currProgress += 20;
        setProgress(Math.min(currProgress, 99));

        const stage = stages[step];
        const newLogs: string[] = [];

        if (step === 0) {
          newLogs.push(`[${new Date().toLocaleTimeString()}] [NET] 掃描 14 組核心防火牆與 SDN 虛擬路由...`);
          newLogs.push(`[${new Date().toLocaleTimeString()}] [NET] 驗證持卡人資料網段 (CDE) 邊界隔離 - 發現 1 項暫時性規則違規`);
          warns += 1;
        } else if (step === 1) {
          newLogs.push(`[${new Date().toLocaleTimeString()}] [IAM] 稽核 Active Directory 與 Okta 身分識別目錄 (共 1,240 帳號)...`);
          newLogs.push(`[${new Date().toLocaleTimeString()}] [IAM] 100% 強制 FIDO2 MFA 鑑別通過；發現 12 個閒置 >90 天帳號需清理`);
          passes += 24;
          warns += 1;
        } else if (step === 2) {
          newLogs.push(`[${new Date().toLocaleTimeString()}] [XDR] 檢驗 420 台主機 OpenXDR 代理程式運作心跳...`);
          newLogs.push(`[${new Date().toLocaleTimeString()}] [FIM] 比對 /etc/pam.d/sshd 基準雜湊值 - 偵測到 1 台主機偏離需處置`);
          passes += 35;
          fails += 1;
        } else if (step === 3) {
          newLogs.push(`[${new Date().toLocaleTimeString()}] [CRYPTO] 測試端到端 TLS 1.3 傳輸密碼套件... 全部符合標準`);
          newLogs.push(`[${new Date().toLocaleTimeString()}] [CRYPTO] 驗證 HSM 金鑰管理週期性輪替雜湊... 合規`);
          passes += 28;
        } else if (step === 4) {
          newLogs.push(`[${new Date().toLocaleTimeString()}] [WORM] 驗證 VictoriaLogs 審計日誌鏈... 產生區塊 Block #10429`);
          newLogs.push(`[${new Date().toLocaleTimeString()}] [WORM] Merkle 樹簽章驗證通過 (0x9a3e1b7...)，存證密封完成`);
          passes += 12;
        }

        setPassCount(passes);
        setWarnCount(warns);
        setFailCount(fails);
        setLogs(prev => [...prev, ...newLogs]);

        step++;
      } else {
        clearInterval(interval);
        setProgress(100);
        setIsScanning(false);
        setIsFinished(true);
        setLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] 合規評估完成！總通過率 96.2%，自動歸檔正式報表。`
        ]);
        onScanCompleted(selectedFrameworkId, 96);
      }
    }, 900);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#141417] border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#18181d]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                {isZh ? '連續性自動化合規全檢引擎' : 'Continuous Compliance Assessment Engine'}
              </h3>
              <p className="text-[11px] text-gray-400 font-mono">
                Target: {selectedFrameworkId} (CIS Benchmarks & Full Telemetry Audit)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Progress Bar & Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-300 font-bold flex items-center gap-1.5">
                {isScanning && <RefreshCw size={13} className="animate-spin text-blue-400" />}
                {isScanning
                  ? (isZh ? '正在進行連續性遙測審查與策略校驗...' : 'Scanning telemetry & policies...')
                  : isFinished
                  ? (isZh ? '全檢巡檢完畢！評定報表已更新' : 'Scan Completed! Audit report updated.')
                  : (isZh ? '準備就緒，點擊啟動開始自動化巡檢' : 'Ready to begin automated assessment.')}
              </span>
              <span className="font-mono font-black text-blue-400 text-sm">{progress}%</span>
            </div>

            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-400 transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">
                {isZh ? '通過控制項' : 'Passed'}
              </span>
              <span className="text-xl font-mono font-black text-emerald-400 mt-0.5 block">{passCount}</span>
            </div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block">
                {isZh ? '偏離警告' : 'Warnings'}
              </span>
              <span className="text-xl font-mono font-black text-amber-400 mt-0.5 block">{warnCount}</span>
            </div>
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-center">
              <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest block">
                {isZh ? '違規需處置' : 'Violations'}
              </span>
              <span className="text-xl font-mono font-black text-rose-400 mt-0.5 block">{failCount}</span>
            </div>
          </div>

          {/* Stages List */}
          <div className="space-y-1.5">
            {stages.map((stg, i) => {
              const isCurrent = currentStageIndex === i;
              const isPassed = currentStageIndex > i || isFinished;

              return (
                <div
                  key={stg.id}
                  className={cn(
                    "p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors",
                    isCurrent
                      ? "bg-blue-600/15 border-blue-500 text-white"
                      : isPassed
                      ? "bg-white/[0.02] border-white/5 text-gray-300"
                      : "bg-white/[0.01] border-white/5 text-gray-500"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={isCurrent ? "text-blue-400 animate-pulse" : isPassed ? "text-emerald-400" : "text-gray-600"}>
                      {stg.icon}
                    </span>
                    <span className="font-bold">{isZh ? stg.nameZh : stg.nameEn}</span>
                  </div>

                  <div>
                    {isCurrent ? (
                      <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider flex items-center gap-1">
                        <RefreshCw size={11} className="animate-spin" /> {isZh ? '掃描中' : 'Scanning'}
                      </span>
                    ) : isPassed ? (
                      <CheckCircle2 size={14} className="text-emerald-400" />
                    ) : (
                      <span className="text-[10px] font-mono text-gray-600">PENDING</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Terminal Console Logs */}
          <div className="p-3 bg-black/70 rounded-xl border border-white/5 font-mono text-[11px] text-gray-300 h-32 overflow-y-auto space-y-1">
            <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest pb-1 border-b border-white/5 flex items-center gap-1">
              <Terminal size={10} /> ENGINE TELEMETRY AUDIT STREAM
            </div>
            {logs.length === 0 ? (
              <div className="text-gray-600 italic py-2">
                {isZh ? '等待啟動掃描引擎...' : 'Awaiting trigger...'}
              </div>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} className="leading-tight text-emerald-400/90 break-all">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#18181d] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-bold transition-all"
          >
            {isZh ? '關閉' : 'Close'}
          </button>

          <button
            type="button"
            disabled={isScanning}
            onClick={startScan}
            className={cn(
              "px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg",
              isScanning
                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 active:scale-95"
            )}
          >
            <Play size={13} fill="currentColor" />
            {isScanning
              ? (isZh ? '全檢執行中...' : 'Scanning...')
              : isFinished
              ? (isZh ? '重新執行全檢' : 'Rerun Scan')
              : (isZh ? '立即啟動合規全檢' : 'Run Assessment')}
          </button>
        </div>
      </div>
    </div>
  );
};
