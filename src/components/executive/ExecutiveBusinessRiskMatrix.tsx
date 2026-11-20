import React, { useState } from 'react';
import {
  Building2,
  Server,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  Search,
  Cpu
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { DepartmentRisk, BusinessServiceHealth, AssetCoverageItem } from './types';
import { DEPARTMENT_RISKS_DATA, BUSINESS_SERVICES_DATA } from './executiveData';
import { localizeDepartmentRisk, localizeBusinessService } from './ctoLocaleMap';

interface ExecutiveBusinessRiskMatrixProps {
  isZh: boolean;
  departments?: DepartmentRisk[];
  services?: BusinessServiceHealth[];
  assetCoverage?: AssetCoverageItem[];
  onSelectDepartment?: (dept: DepartmentRisk) => void;
}

export function ExecutiveBusinessRiskMatrix({
  isZh,
  departments,
  services,
  assetCoverage,
  onSelectDepartment
}: ExecutiveBusinessRiskMatrixProps) {
  const [activeTab, setActiveTab] = useState<'departments' | 'services' | 'coverage'>('departments');
  const [searchTerm, setSearchTerm] = useState('');

  const deptList = (departments && departments.length > 0 ? departments : DEPARTMENT_RISKS_DATA).map((d) =>
    localizeDepartmentRisk(d, isZh)
  );
  const serviceList = (services && services.length > 0 ? services : BUSINESS_SERVICES_DATA).map((s) =>
    localizeBusinessService(s, isZh)
  );
  const coverageList: AssetCoverageItem[] =
    assetCoverage && assetCoverage.length > 0
      ? assetCoverage
      : [
          { id: 'cov-cde', labelZh: '財務與持卡人核心資料庫 (CDE)', labelEn: 'Financial & CDE Core DB', coveragePct: 100, standard: 'PCI-DSS Req 3.4', nodeCount: 48 },
          { id: 'cov-git', labelZh: '研發與程式碼 Git / CI-CD 叢集', labelEn: 'R&D Git & CI/CD Fleet', coveragePct: 97, standard: 'SOC 2 CC8.1', nodeCount: 94 },
          { id: 'cov-egress', labelZh: '雲端網路出站端點 (Egress EDR)', labelEn: 'Cloud Egress Endpoints', coveragePct: 100, standard: 'GDPR Art. 44', nodeCount: 152 },
          { id: 'cov-ephi', labelZh: '醫療終端與影像歸檔 PACS VLAN', labelEn: 'ePHI Healthcare Terminal VLAN', coveragePct: 92, standard: 'HIPAA § 164.312', nodeCount: 64 },
          { id: 'cov-ot', labelZh: 'OT/IoT 邊界閘道與控制網路', labelEn: 'IoT / OT Control Gateways', coveragePct: 86, standard: 'NIST SP 800-53', nodeCount: 62 }
        ];

  const filteredDepartments = deptList.filter(
    d =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.topRiskFactor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredServices = serviceList.filter(
    s =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCoverage = coverageList.filter(
    c =>
      c.labelZh.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.labelEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.standard.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 size={18} className="text-blue-400 shrink-0" />
            <h3 className="text-base font-black text-white tracking-tight">
              {isZh ? '工程與事業群風險矩陣、核心服務 SLA 與資產監控覆蓋' : 'Engineering & Business Risk, SLA Resilience & Asset Coverage'}
            </h3>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {isZh
              ? '依 CTO 治理視角彙整研發/事業單位 UEBA 風險、Tier 1-3 核心系統 RTO/RPO 韌性與各合規網段納管率'
              : 'Reviewing department UEBA risk, Tier 1-3 RTO/RPO resilience, and compliance node coverage'}
          </p>
        </div>

        {/* Sub-tab switcher */}
        <div className="flex items-center gap-1 p-1 bg-black/40 border border-white/10 rounded-xl shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('departments')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap',
              activeTab === 'departments' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
            )}
          >
            <Building2 size={13} />
            <span>{isZh ? '事業群與研發風險' : 'Business Units'}</span>
            <span className="font-mono text-[10px] opacity-80">({deptList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('services')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap',
              activeTab === 'services' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
            )}
          >
            <Server size={13} />
            <span>{isZh ? '核心服務 RTO/RPO' : 'Core Services SLA'}</span>
            <span className="font-mono text-[10px] opacity-80">({serviceList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('coverage')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap',
              activeTab === 'coverage' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
            )}
          >
            <Cpu size={13} />
            <span>{isZh ? '合規節點納管率' : 'Asset Coverage'}</span>
            <span className="font-mono text-[10px] opacity-80">({coverageList.length})</span>
          </button>
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
              : activeTab === 'services'
              ? isZh ? '搜尋關鍵服務、分類或系統架構...' : 'Search service name, tier, category...'
              : isZh ? '搜尋基礎設施網段或法規標準...' : 'Search asset zone or compliance standard...'
          }
          className="w-full pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/60"
        />
      </div>

      {/* Tab 1: Department Risks Table */}
      {activeTab === 'departments' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 font-mono text-[10px] uppercase">
                <th className="py-3 px-3">{isZh ? '事業單位 / 處室' : 'Business Unit'}</th>
                <th className="py-3 px-3">{isZh ? '主管與人數' : 'Head / Count'}</th>
                <th className="py-3 px-3">{isZh ? '資安風險指數' : 'Risk Index'}</th>
                <th className="py-3 px-3">{isZh ? '趨勢' : 'Trend'}</th>
                <th className="py-3 px-3">{isZh ? '事件' : 'Incidents'}</th>
                <th className="py-3 px-3">{isZh ? '主要風險根因' : 'Top Risk Factor'}</th>
                <th className="py-3 px-3 text-right">{isZh ? 'FIDO2 / 意識' : 'MFA / Train'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredDepartments.map((dept) => {
                const isHigh = dept.riskScore >= 60;
                const isMed = dept.riskScore >= 40 && dept.riskScore < 60;

                return (
                  <tr
                    key={dept.id}
                    className="hover:bg-white/[0.03] transition-colors cursor-pointer"
                    onClick={() => onSelectDepartment?.(dept)}
                  >
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-white text-xs">{dept.name}</div>
                      <div className="text-[10px] font-mono text-gray-500">
                        {dept.code} · {dept.assetCriticality}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-gray-300">
                      <div className="font-medium">{dept.head}</div>
                      <div className="text-[10px] text-gray-500 font-mono tabular-nums">
                        {dept.headcount} {isZh ? '人' : 'staff'}
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'font-mono font-black tabular-nums text-sm',
                            isHigh ? 'text-rose-400' : isMed ? 'text-amber-400' : 'text-emerald-400'
                          )}
                        >
                          {dept.riskScore}
                        </span>
                        <div className="w-16 bg-white/10 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              isHigh ? 'bg-rose-500' : isMed ? 'bg-amber-500' : 'bg-emerald-500'
                            )}
                            style={{ width: `${dept.riskScore}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 whitespace-nowrap">
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

                    <td className="py-3.5 px-3 font-mono tabular-nums text-gray-300">
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 font-bold">
                        {dept.incidentCount}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 max-w-xs">
                      <p className="text-gray-300 text-[11px] truncate leading-tight" title={dept.topRiskFactor}>
                        {dept.topRiskFactor}
                      </p>
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono tabular-nums text-[11px]">
                      <div className="text-gray-200 font-bold">{dept.mfaAdoptionRate}%</div>
                      <div className="text-gray-500 text-[10px]">{dept.trainingRate}%</div>
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
              className="p-4 bg-black/30 border border-white/10 rounded-xl space-y-3 hover:border-blue-500/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider inline-block',
                      service.tier.includes('Tier-1')
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    )}
                  >
                    {service.tier}
                  </span>
                  <h4 className="font-bold text-white text-xs mt-1.5 leading-snug">{service.name}</h4>
                  <span className="text-[10px] text-gray-400 font-mono">{service.category}</span>
                </div>

                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-mono tabular-nums font-bold flex items-center gap-1 shrink-0',
                    service.status === 'optimal'
                      ? 'text-emerald-400 bg-emerald-500/10'
                      : 'text-amber-400 bg-amber-500/10'
                  )}
                >
                  <CheckCircle2 size={11} />
                  {service.availability}%
                </span>
              </div>

              <div className="pt-2 border-t border-white/5 grid grid-cols-3 gap-2 text-[10px] font-mono tabular-nums">
                <div>
                  <span className="text-gray-400 block uppercase">{isZh ? '攔截威脅' : 'Blocked'}</span>
                  <span className="text-white font-bold">{service.activeThreatsBlocked}</span>
                </div>
                <div>
                  <span className="text-gray-400 block uppercase">RTO</span>
                  <span className="text-blue-400 font-bold">{service.rtoMinutes}m</span>
                </div>
                <div>
                  <span className="text-gray-400 block uppercase">RPO</span>
                  <span className="text-emerald-400 font-bold">{service.rpoMinutes}m</span>
                </div>
              </div>

              <div className="text-[10px] text-gray-400 flex items-center justify-between pt-1">
                <span>{isZh ? '上次容災演練' : 'Last DR Drill'}</span>
                <span className="font-mono text-gray-300">{service.lastStressTest}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Asset Compliance Coverage */}
      {activeTab === 'coverage' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCoverage.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-black/30 border border-white/10 rounded-xl space-y-2.5"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-white">
                    {isZh ? item.labelZh : item.labelEn}
                  </div>
                  <div className="text-[10px] font-mono text-gray-400 mt-0.5">
                    {item.standard} · {item.nodeCount} {isZh ? '台受監控節點' : 'Monitored Nodes'}
                  </div>
                </div>
                <span
                  className={cn(
                    'text-sm font-black font-mono tabular-nums shrink-0',
                    item.coveragePct === 100
                      ? 'text-emerald-400'
                      : item.coveragePct >= 90
                      ? 'text-blue-400'
                      : 'text-amber-400'
                  )}
                >
                  {item.coveragePct}%
                </span>
              </div>

              <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    item.coveragePct === 100
                      ? 'bg-emerald-500'
                      : item.coveragePct >= 90
                      ? 'bg-blue-500'
                      : 'bg-amber-500'
                  )}
                  style={{ width: `${item.coveragePct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
