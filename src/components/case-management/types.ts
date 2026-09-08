export type CaseSeverity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';

export type CaseStatus = 
  | 'New' 
  | 'Investigating' 
  | 'Awaiting Approval' 
  | 'In Remediation' 
  | 'Closed' 
  | 'False Positive';

export type CaseCategory = 
  | 'Ransomware' 
  | 'APT C2' 
  | 'Phishing' 
  | 'Data Exfiltration' 
  | 'DDoS' 
  | 'Privilege Escalation' 
  | 'Insider Threat';

export interface AffectedAsset {
  id: string;
  name: string;
  type: 'Endpoint' | 'Server' | 'Cloud VM' | 'Database' | 'Domain Controller' | 'Gateway';
  ip: string;
  status: 'Compromised' | 'Isolated' | 'At Risk' | 'Clean';
  os: string;
  agentVersion?: string;
  ownerDepartment?: string;
}

export interface AffectedUser {
  username: string;
  displayName: string;
  email: string;
  role: string;
  department: string;
  compromised: boolean;
  mfaStatus: 'Enforced' | 'Revoked' | 'Normal';
  lastActiveSession?: string;
}

export interface MitreTacticItem {
  id: string;
  name: string;
  technique: string;
  tactic: string;
  color?: string;
}

export interface CaseObservable {
  id: string;
  type: 'IP' | 'Domain' | 'SHA256' | 'File' | 'Process' | 'URL';
  value: string;
  reputation: 'Malicious' | 'Suspicious' | 'Clean' | 'Unknown';
  score: number; // 0 - 100
  hits: number;
  source: string; // e.g. MISP, VirusTotal, AlienVault
  actionTaken?: string;
}

export interface TimelineEntry {
  id: string;
  timestamp: string;
  type: 'Alert' | 'Automated Playbook' | 'Analyst Note' | 'Action Executed' | 'Status Change';
  author: string;
  content: string;
  details?: string;
  status?: 'Success' | 'Warning' | 'Running' | 'Failed';
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'attacker' | 'asset' | 'c2' | 'process' | 'file' | 'user';
  subLabel?: string;
  status?: string;
  x?: number;
  y?: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  label: string;
  protocol?: string;
}

export interface WarRoomNote {
  id: string;
  author: string;
  role: string;
  time: string;
  text: string;
  isAutomatedBot?: boolean;
  avatarColor?: string;
}

export interface CaseIncident {
  id: string;
  caseNumber: string; // e.g. INC-2026-1002
  title: string;
  description: string;
  severity: CaseSeverity;
  status: CaseStatus;
  category: CaseCategory;
  sourceEngine: string; // TheHive, Cortex, n8n, Wazuh, SentinelOne
  assignee: {
    id: string;
    name: string;
    role: string;
    email: string;
    avatarBg: string;
  };
  createdAt: string;
  updatedAt: string;
  sla: {
    stage: 'Detection' | 'Triage' | 'Response' | 'Remediation' | 'Archived';
    stageDeadline: string;
    remainingMinutes: number;
    totalMinutes: number;
    isBreached: boolean;
  };
  affectedAssets: AffectedAsset[];
  affectedUsers: AffectedUser[];
  mitreTactics: MitreTacticItem[];
  observables: CaseObservable[];
  timeline: TimelineEntry[];
  attackGraph: {
    nodes: GraphNode[];
    edges: GraphEdge[];
  };
  warRoomNotes: WarRoomNote[];
  tags: string[];
  customAttributes?: Record<string, any>;
}

export interface CaseFilterState {
  status: string;
  severity: string;
  category: string;
  assignee: string;
  timeRange: string;
  searchQuery: string;
  onlyMyCases: boolean;
}

// Studio Config Types
export interface CaseCustomField {
  id: string;
  name: string;
  label: string;
  type: 'Tag' | 'String' | 'JSON' | 'Number' | 'Date' | 'Boolean';
  required: boolean;
  editable: boolean;
  defaultValue?: string;
}

export interface IngestionMapping {
  id: string;
  sourceField: string;
  targetField: string;
  sourceEngine: string;
  transformFunction?: string;
}

export interface LayoutBlockConfig {
  id: string;
  type: string;
  title: string;
  size: 'full' | 'half' | 'third';
  removable: boolean;
  enabled: boolean;
}

export interface SLAPolicyStage {
  id: string;
  stage: string;
  limitMinutes: number;
  limitDisplay: string;
  action: string;
  escalateToRole: string;
}

export interface CaseConfigVersion {
  id: string;
  author: string;
  date: string;
  status: 'Active' | 'Historical';
  note: string;
}
