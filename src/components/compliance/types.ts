export type FrameworkId = 'ISO27001' | 'GDPR' | 'NIST-800' | 'TSC' | 'HIPAA' | 'PCI-DSS';

export type ComplianceStatus = 'Compliant' | 'Warning' | 'Violated' | 'Under-Review' | 'Compensating';

export type Severity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';

export interface ComplianceControl {
  id: string;
  code: string;
  framework: FrameworkId;
  domain: string;
  title: string;
  requirementText: string;
  evidence: string;
  baselineVariance: string;
  status: ComplianceStatus;
  severity: Severity;
  lastChecked: string;
  affectedAssets: string[];
  telemetrySource: 'EDR/XDR' | 'UEBA' | 'WORM Storage' | 'NDR' | 'IAM/IdP' | 'CloudPosture' | 'FIM' | 'DLP';
  remediationPlaybook?: string;
  remediationGuidance?: string;
  mitreRef?: string;
}

export interface FrameworkDomainSummary {
  name: string;
  score: number;
  totalControls: number;
  passedControls: number;
}

export interface ComplianceFrameworkMeta {
  id: FrameworkId;
  name: string;
  shortName: string;
  version: string;
  fullName: string;
  category: string;
  badge: string;
  score: number; // 0-100
  totalControls: number;
  passedControls: number;
  warningControls: number;
  violatedControls: number;
  lastAudited: string;
  auditor: string;
  description: string;
  accentColor: string;
  domains: FrameworkDomainSummary[];
}

export interface WormLedgerRecord {
  blockId: number;
  timestamp: string;
  framework: FrameworkId;
  hash: string;
  prevHash: string;
  merkleRoot: string;
  auditorId: string;
  event: string;
  status: 'Verified' | 'Sealed';
}

export interface RemediationTask {
  id: string;
  controlId: string;
  framework: FrameworkId;
  title: string;
  assignedTo: string;
  priority: Severity;
  deadline: string;
  status: 'Open' | 'In-Progress' | 'Resolved' | 'Verified';
  remediationAction: string;
  playbookId?: string;
  affectedAsset: string;
}
