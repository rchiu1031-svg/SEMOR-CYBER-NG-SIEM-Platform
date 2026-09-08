import React, { useState } from 'react';
import {
  UserCheck,
  ShieldAlert,
  Ban,
  Clock,
  ExternalLink,
  Lock,
  Search,
  CheckCircle2
} from 'lucide-react';
import { AbnormalLoginRecord } from './types';
import { cn } from '../../lib/utils';

interface OverviewAbnormalLoginsProps {
  records: AbnormalLoginRecord[];
  isZh: boolean;
  onBlockIp: (ip: string) => void;
  onInvestigateHost: (host: string) => void;
}

export const OverviewAbnormalLogins: React.FC<OverviewAbnormalLoginsProps> = ({
  records,
  isZh,
  onBlockIp,
  onInvestigateHost
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [blockedIps, setBlockedIps] = useState<string[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const filteredRecords = records.filter((r) =>
    r.ip.includes(searchTerm) ||
    r.host.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (isZh ? r.locationZh : r.locationEn).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBlock = (ip: string) => {
    setBlockedIps((prev) => [...prev, ip]);
    onBlockIp(ip);
    setToastMsg(isZh ? `已向全域邊界防火牆下發阻斷規則：${ip}` : `Null-route rule pushed to border NGFW: ${ip}`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  return (
    <div className="bg-[#111114] border border-gray-800/80 rounded-2xl p-5 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/15 border border-amber-500/30 text-amber-400 rounded-xl">
              <UserCheck size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                {isZh ? '主機異常暴力破解與憑證撞庫監控' : 'Host Brute-Force & Credential Stuffing Watch'}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {isZh
                  ? '自動捕獲 SSH / RDP / Kerberos 高頻嘗試並即時實施速率限制與阻斷'
                  : 'Automated telemetry for distributed auth brute-force attacks'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-2.5 text-gray-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={isZh ? '搜尋 IP 或主機名稱...' : 'Search IP or host...'}
                className="pl-8 pr-3 py-1.5 bg-black/40 border border-gray-800 rounded-xl text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 w-44 sm:w-56"
              />
            </div>
          </div>
        </div>

        {toastMsg && (
          <div className="mb-3 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 size={14} className="shrink-0 text-red-400" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-800/80">
                <th className="pb-3 font-bold">{isZh ? '時間' : 'Time'}</th>
                <th className="pb-3 font-bold">{isZh ? '來源 IP 與地理歸屬' : 'Source IP & Geo'}</th>
                <th className="pb-3 font-bold">{isZh ? '目標主機' : 'Target Host'}</th>
                <th className="pb-3 font-bold">{isZh ? '協定' : 'Protocol'}</th>
                <th className="pb-3 font-bold">{isZh ? '嘗試次數 (1m)' : 'Attempts (1m)'}</th>
                <th className="pb-3 font-bold">{isZh ? '防禦狀態' : 'Status'}</th>
                <th className="pb-3 font-bold text-right">{isZh ? '應變動作' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {filteredRecords.map((record) => {
                const isAlreadyBlocked = record.status === 'BLOCKED' || blockedIps.includes(record.ip);
                return (
                  <tr key={record.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="py-3 text-xs text-gray-400 font-mono">
                      {record.time}
                    </td>

                    <td className="py-3">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-blue-400 font-mono group-hover:underline cursor-pointer" onClick={() => onInvestigateHost(record.ip)}>
                          {record.ip}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {isZh ? record.locationZh : record.locationEn}
                        </span>
                      </div>
                    </td>

                    <td className="py-3">
                      <div className="flex items-center gap-1.5">
                        <Lock size={12} className="text-gray-500" />
                        <span className="text-xs font-medium text-gray-200 font-mono">
                          {record.host}
                        </span>
                      </div>
                    </td>

                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-gray-900 border border-gray-800 text-gray-300">
                        {record.service}
                      </span>
                    </td>

                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-900 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              record.attempts > 80 ? "bg-red-500" : "bg-amber-500"
                            )}
                            style={{ width: `${Math.min(record.attempts, 100)}%` }}
                          />
                        </div>
                        <span className={cn("text-xs font-bold font-mono", record.attempts > 80 ? "text-red-400" : "text-amber-400")}>
                          {record.attempts}
                        </span>
                      </div>
                    </td>

                    <td className="py-3">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border uppercase font-mono",
                        isAlreadyBlocked
                          ? "bg-red-500/15 text-red-400 border-red-500/30"
                          : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                      )}>
                        {isAlreadyBlocked ? (isZh ? '已阻斷' : 'BLOCKED') : (isZh ? '頻率限制' : 'RATE-LIMITED')}
                      </span>
                    </td>

                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!isAlreadyBlocked ? (
                          <button
                            onClick={() => handleBlock(record.ip)}
                            className="px-2.5 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1"
                          >
                            <Ban size={11} />
                            <span>{isZh ? '立即封鎖' : 'Block IP'}</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-gray-500 font-mono">
                            {isZh ? '防火牆丟棄' : 'Null-routed'}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-gray-800/80 flex items-center justify-between text-xs text-gray-500">
        <span className="text-[11px]">
          {isZh ? '暴力破解規則：1 分鐘內失敗超過 10 次自動納入動態觀察清單' : 'Rule: >10 failures/min dynamically placed in watch quarantine'}
        </span>
        <span className="text-[11px] font-mono text-emerald-400">
          {isZh ? '已攔截 362 次未授權連線' : '362 unauthorized attempts mitigated today'}
        </span>
      </div>
    </div>
  );
};
