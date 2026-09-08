import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Building2,
  Server,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  Shield,
  Clock,
  Layers,
  Search,
  ArrowRight
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { DepartmentRisk, BusinessServiceHealth } from './types';
import { DEPARTMENT_RISKS_DATA, BUSINESS_SERVICES_DATA } from './executiveData';

interface ExecutiveBusinessRiskMatrixProps {
  isZh: boolean;
  onSelectDepartment?: (dept: DepartmentRisk) => void;
}

export function ExecutiveBusinessRiskMatrix({ isZh, onSelectDepartment }: ExecutiveBusinessRiskMatrixProps) {
  const [activeTab, setActiveTab] = useState<'departments' | 'services'>('departments');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDepartments = DEPARTMENT_RISKS_DATA.filter(
    d =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.topRiskFactor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredServices = BUSINESS_SERVICES_DATA.filter(
    s =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-[#111114] border border-white/5 rounded-3xl p-6 lg:p-8 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 size={18} className="text-blue-400" />
            <h3 className="text-base font-black text-white tracking-tight">
              {isZh ? '事業體風險矩陣與關鍵核心服務可用度' : 'Business Unit Risk Index & Critical Services Resilience'}
            </h3>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {isZh
              ? '綜覽各事業群資安風險指標、UEBA 人員異常行為、以及 Tier-1 關鍵營運服務高可用 (RTO/RPO) 現況'
              : 'Holistic risk distribution across business departments and Tier-1 core system availability'}
          </p>
        </div>

        {/* Sub-tab switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 p-1 bg-black/40 border border-white/5 rounded-2xl shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('departments')}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                activeTab === 'departments'
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-gray-400 hover:text-white"
              )}
            >
              <Building2 size={13} />
              <span>{isZh ? '事業群風險排位' : 'Business Units'}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-white/20 font-mono">
                {DEPARTMENT_RISKS_DATA.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('services')}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                activeTab === 'services'
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-gray-400 hover:text-white"
              )}
            >
              <Server size={13} />
              <span>{isZh ? '關鍵核心服務 (Tier 1-3)' : 'Core Services'}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-white/20 font-mono">
                {BUSINESS_SERVICES_DATA.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Search Filter Bar */}
      <div className="relative">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={
            activeTab === 'departments'
              ? isZh ? '搜尋事業單位名稱、主管或風險特徵...' : 'Search business unit, head, risk factor...'
              : isZh ? '搜尋關鍵服務、分類或系統架構...' : 'Search service name, tier, category...'
          }
          className="w-full pl-9 pr-4 py-2 bg-black/40 border border-white/5 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
        />
      </div>

      {/* Tab 1: Department Risks Table */}
      {activeTab === 'departments' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-gray-400 font-mono text-[10px] uppercase">
                <th className="py-3 px-3">{isZh ? '事業單位 / 處室' : 'Business Unit'}</th>
                <th className="py-3 px-3">{isZh ? '主管與人數' : 'Head / Count'}</th>
                <th className="py-3 px-3">{isZh ? '資安風險指數' : 'Risk Index'}</th>
                <th className="py-3 px-3">{isZh ? '趨勢' : 'Trend'}</th>
                <th className="py-3 px-3">{isZh ? '本期事件' : 'Incidents'}</th>
                <th className="py-3 px-3">{isZh ? '主要風險根因' : 'Top Risk Factor'}</th>
                <th className="py-3 px-3">{isZh ? 'MFA 與意識達標' : 'MFA & Training'}</th>
                <th className="py-3 px-3 text-right">{isZh ? '動作' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredDepartments.map((dept) => {
                const isHigh = dept.riskScore >= 60;
                const isMed = dept.riskScore >= 40 && dept.riskScore < 60;

                return (
                  <tr
                    key={dept.id}
                    className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                    onClick={() => onSelectDepartment?.(dept)}
                  >
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-white text-xs">{dept.name}</div>
                      <div className="text-[10px] font-mono text-gray-500">{dept.code}</div>
                    </td>

                    <td className="py-3.5 px-3 text-gray-300">
                      <div>{dept.head}</div>
                      <div className="text-[10px] text-gray-500">{dept.headcount} {isZh ? '名同仁' : 'members'}</div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "font-mono font-black text-sm",
                            isHigh ? "text-rose-400" : isMed ? "text-amber-400" : "text-emerald-400"
                          )}
                        >
                          {dept.riskScore}
                        </span>
                        <div className="w-16 bg-white/5 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              isHigh ? "bg-rose-500" : isMed ? "bg-amber-500" : "bg-emerald-500"
                            )}
                            style={{ width: `${dept.riskScore}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      {dept.trend === 'up' && (
                        <span className="flex items-center gap-1 text-rose-400 font-bold text-[11px]">
                          <TrendingUp size={12} /> {isZh ? '攀升' : 'Up'}
                        </span>
                      )}
                      {dept.trend === 'down' && (
                        <span className="flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                          <TrendingDown size={12} /> {isZh ? '改善' : 'Down'}
                        </span>
                      )}
                      {dept.trend === 'stable' && (
                        <span className="flex items-center gap-1 text-gray-400 font-bold text-[11px]">
                          <Minus size={12} /> {isZh ? '持平' : 'Stable'}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 font-mono text-gray-300">
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 font-bold">
                        {dept.incidentCount}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 max-w-xs">
                      <p className="text-gray-400 text-[11px] truncate leading-tight" title={dept.topRiskFactor}>
                        {dept.topRiskFactor}
                      </p>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="text-[10px] space-y-0.5">
                        <div className="flex items-center justify-between text-gray-400">
                          <span>MFA:</span>
                          <span className="font-mono text-gray-200 font-bold">{dept.mfaAdoptionRate}%</span>
                        </div>
                        <div className="flex items-center justify-between text-gray-400">
                          <span>{isZh ? '培訓:' : 'Train:'}</span>
                          <span className="font-mono text-gray-200 font-bold">{dept.trainingRate}%</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <button
                        type="button"
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-blue-600/20 text-gray-400 hover:text-blue-400 transition-colors"
                      >
                        <ArrowRight size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Core Services Grid */}
      {activeTab === 'services' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="p-5 bg-black/30 border border-white/5 rounded-2xl space-y-3 relative overflow-hidden group hover:border-blue-500/30 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider",
                      service.tier.includes('Tier-1')
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    )}
                  >
                    {service.tier}
                  </span>
                  <h4 className="font-bold text-white text-xs mt-1.5 leading-snug">
                    {service.name}
                  </h4>
                  <span className="text-[10px] text-gray-500 font-mono">
                    {service.category}
                  </span>
                </div>

                <div className="text-right">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1",
                      service.status === 'optimal'
                        ? "text-emerald-400 bg-emerald-500/10"
                        : "text-amber-400 bg-amber-500/10"
                    )}
                  >
                    <CheckCircle2 size={11} />
                    {service.availability}%
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/5 grid grid-cols-3 gap-2 text-[10px] font-mono">
                <div>
                  <span className="text-gray-500 block uppercase">{isZh ? '攔截威脅' : 'Blocked'}</span>
                  <span className="text-white font-bold">{service.activeThreatsBlocked}</span>
                </div>
                <div>
                  <span className="text-gray-500 block uppercase">RTO 目標</span>
                  <span className="text-blue-400 font-bold">{service.rtoMinutes}m</span>
                </div>
                <div>
                  <span className="text-gray-500 block uppercase">RPO 目標</span>
                  <span className="text-emerald-400 font-bold">{service.rpoMinutes}m</span>
                </div>
              </div>

              <div className="text-[10px] text-gray-500 flex items-center justify-between pt-1">
                <span>{isZh ? '上次容災演練' : 'Last DR Drill'}</span>
                <span className="font-mono text-gray-400">{service.lastStressTest}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
