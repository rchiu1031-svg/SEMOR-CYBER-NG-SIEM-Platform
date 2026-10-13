import { 
  CaseIncident, 
  CaseCustomField, 
  LayoutBlockConfig, 
  SLAPolicyStage, 
  CaseConfigVersion,
  IngestionMapping
} from './types';

export const INITIAL_CASES: CaseIncident[] = [];

// Initial Custom Fields for Studio Configuration
export const INITIAL_CUSTOM_FIELDS: CaseCustomField[] = [
  { id: 'f1', name: 'incident_type', label: '資安事件分類標籤', type: 'Tag', required: true, editable: true, defaultValue: 'Ransomware' },
  { id: 'f2', name: 'threat_source', label: '威脅進線遙測來源', type: 'String', required: true, editable: false, defaultValue: 'SentinelOne-XDR' },
  { id: 'f3', name: 'assigned_team', label: '負責調查團隊', type: 'String', required: true, editable: true, defaultValue: 'Tier 1 SOC' },
  { id: 'f4', name: 'ioc_list', label: '關聯 IoC 特徵清單 (JSON)', type: 'JSON', required: false, editable: true },
  { id: 'f5', name: 'regulatory_impact', label: '法規合規與通報衝擊評級', type: 'String', required: false, editable: true, defaultValue: '一般內控' },
  { id: 'f6', name: 'containment_deadline', label: '遏阻處置最高時限 (分鐘)', type: 'Number', required: true, editable: true, defaultValue: '30' }
];

// Ingestion Mappings
export const INITIAL_INGESTION_MAPPINGS: IngestionMapping[] = [
  { id: 'm1', sourceField: 'raw.source_ip', targetField: 'src_ip', sourceEngine: 'Suricata NDR', transformFunction: 'NormalizeIPv4' },
  { id: 'm2', sourceField: 'raw.event_id', targetField: 'external_id', sourceEngine: 'CrowdStrike Falcon', transformFunction: 'TrimPrefix' },
  { id: 'm3', sourceField: 'raw.misp.tags', targetField: 'intel_tags', sourceEngine: 'MISP Threat Feeds', transformFunction: 'SplitComma' },
  { id: 'm4', sourceField: 'rule.mitre.id', targetField: 'mitre_technique', sourceEngine: 'Wazuh SIEM', transformFunction: 'Uppercase' },
  { id: 'm5', sourceField: 'agent.name', targetField: 'hostname', sourceEngine: 'SentinelOne Agent', transformFunction: 'ToLower' }
];

// Layout Blocks Config
export const INITIAL_LAYOUT_BLOCKS: LayoutBlockConfig[] = [
  { id: 'b1', type: 'Incident Summary', title: '事件基本資訊與生命週期指標', size: 'full', removable: false, enabled: true },
  { id: 'b2', type: 'Attack Flow Graph', title: '攻擊拓撲因果關係圖 (Interactive Graph)', size: 'half', removable: true, enabled: true },
  { id: 'b3', type: 'IoC Intelligence', title: 'IoC 威脅情資多源聯防表', size: 'half', removable: true, enabled: true },
  { id: 'b4', type: 'Forensic Timeline', title: '事件鑑識與處置時間軸', size: 'half', removable: true, enabled: true },
  { id: 'b5', type: 'Remediation Hub', title: 'SOAR 自動化應變處置動作庫', size: 'half', removable: true, enabled: true },
  { id: 'b6', type: 'War Room Discussion', title: '跨單位戰情討論室與 AI 助手', size: 'full', removable: true, enabled: true }
];

// SLA Policy Stages
export const INITIAL_SLA_STAGES: SLAPolicyStage[] = [
  { id: 's1', stage: '偵測與分流 (Triage)', limitMinutes: 15, limitDisplay: '15 分鐘', action: '發送警訊至 SOC 值班人員與 Teams 通訊軟體', escalateToRole: 'L1 分析師' },
  { id: 's2', stage: '調查與遏制 (Response)', limitMinutes: 60, limitDisplay: '1 小時', action: '自動升級指派至 L2 鑑識工程師，並執行初步網路隔離', escalateToRole: 'L2 專家' },
  { id: 's3', stage: '根本修復與清除 (Remediation)', limitMinutes: 240, limitDisplay: '4 小時', action: '若逾時未復原，自動抄送資安長 (CISO) 及啟動外部 IR 顧問', escalateToRole: 'SOC 總指揮' },
  { id: 's4', stage: '稽核歸檔 (Archival)', limitMinutes: 1440, limitDisplay: '24 小時', action: '產出事後檢討報告 (PIR) 並自動建立結案簽核流程', escalateToRole: '法規稽核組' }
];

// Versions History
export const INITIAL_VERSIONS: CaseConfigVersion[] = [
  { id: 'v2.4', author: '管理員 (Warren C.)', date: '2026-09-08 04:12', status: 'Active', note: '優化 CrowdStrike 欄位對映、新增 FIDO2 弱驗證條件式規則' },
  { id: 'v2.3', author: '管理員 (Howard L.)', date: '2026-09-05 14:05', status: 'Historical', note: '調整 SLA 響應時限由 90 分鐘緊縮至 60 分鐘' },
  { id: 'v2.2', author: '管理員 (Warren C.)', date: '2026-08-28 10:30', status: 'Historical', note: '新增攻擊流程拓撲圖節點顏色語意化樣式' }
];
