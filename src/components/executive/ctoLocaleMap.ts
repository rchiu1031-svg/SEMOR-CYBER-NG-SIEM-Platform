import type {
  ComplianceFrameworkMeta,
  ComplianceControl,
  WormLedgerRecord,
  RemediationTask,
  FrameworkId
} from '../compliance/types';
import type {
  BusinessServiceHealth,
  DepartmentRisk,
  StrategicRoadmapItem,
  ExecutiveApprovalItem
} from './types';

interface FrameworkTranslation {
  version: string;
  fullName: string;
  category: string;
  badgePrefix: string;
  auditor: string;
  description: string;
  domains: string[];
}

const FRAMEWORK_EN: Record<FrameworkId, FrameworkTranslation> = {
  ISO27001: {
    version: '2022 Standard Edition',
    fullName: 'ISO/IEC 27001:2022 Information Security Management System (ISMS)',
    category: 'Global Security Governance',
    badgePrefix: 'Certification Ready',
    auditor: 'BSI Lead Auditor Certification / SOC Audit Committee',
    description:
      'Premier international ISMS standard covering organizational, people, physical perimeter, and technological controls.',
    domains: [
      'A.5 Organizational Controls',
      'A.6 People Controls',
      'A.7 Physical Controls',
      'A.8 Technological Controls'
    ]
  },
  GDPR: {
    version: 'Regulation (EU) 2016/679',
    fullName: 'EU General Data Protection Regulation (GDPR) Privacy Governance',
    category: 'International Data Privacy',
    badgePrefix: 'Compliant Active',
    auditor: 'EU Data Protection Officer (DPO) Taskforce',
    description:
      'Governs PII processing lawfulness, cross-border exfiltration controls, Data Subject Access Requests (SAR), and 72-hour breach reporting.',
    domains: [
      'Art.5 Lawfulness & Minimization',
      'Art.12-23 Data Subject Rights',
      'Art.32 Processing Security & Encryption',
      'Art.33-34 72h Breach Notification',
      'Art.44 Cross-Border Transfer Control'
    ]
  },
  'NIST-800': {
    version: 'Rev. 5 / CSF 2.0',
    fullName: 'NIST SP 800-53 Rev. 5 Security and Privacy Controls Baseline',
    category: 'Federal & Defense Security Baseline',
    badgePrefix: 'High Assurance',
    auditor: 'FedRAMP 3PAO Third-Party Assessment Organization',
    description:
      'Comprehensive federal control baseline spanning AC access control, AU audit & accountability, IA authentication, SC comms protection, and SI system integrity.',
    domains: [
      'AC Access Control Family',
      'AU Audit & Accountability WORM',
      'IA Identification & MFA Family',
      'SC System & Comms Protection',
      'SI System & Info Integrity'
    ]
  },
  TSC: {
    version: 'AICPA 2024 Trust Services',
    fullName: 'AICPA SOC 2 Type II Trust Services Criteria (TSC)',
    category: 'Cloud & SaaS Assurance',
    badgePrefix: 'Type II Auditing',
    auditor: 'KPMG / Independent CPA Audit Practice',
    description:
      'Evaluates the five Trust Services Criteria: Security, Availability, Processing Integrity, Confidentiality, and Privacy.',
    domains: [
      'CC6.0 Logical & Physical Access',
      'CC7.0 System Ops & Incident Mgmt',
      'CC8.0 Change Auth & Code Signing',
      'A1.0 High Availability & DR'
    ]
  },
  HIPAA: {
    version: '45 CFR Part 160 & 164',
    fullName: 'HIPAA Security Rule Electronic Protected Health Information (ePHI)',
    category: 'Healthcare & Biotech Privacy',
    badgePrefix: 'ePHI Protected',
    auditor: 'HHS OCR Healthcare Compliance Office',
    description:
      'Enforces Administrative Safeguards (§164.308), Physical Safeguards (§164.310), and Technical Safeguards (§164.312) for ePHI.',
    domains: [
      '§ 164.308 Administrative Safeguards',
      '§ 164.310 Workstation Physical Security',
      '§ 164.312 Technical Access Controls',
      '§ 164.314 Business Associate Agreements'
    ]
  },
  'PCI-DSS': {
    version: 'Version 4.0 Standard',
    fullName: 'Payment Card Industry Data Security Standard (PCI DSS v4.0)',
    category: 'Financial & Payment Security',
    badgePrefix: 'QSA Audit Ready',
    auditor: 'Qualified Security Assessor (QSA) Lead Sign-off',
    description:
      'Protects stored Primary Account Numbers (PAN), enforces CDE microsegmentation, FIDO2 MFA, and immutable audit logging.',
    domains: [
      'Req 1-2 Network & Microsegmentation',
      'Req 3-4 Strong PAN Cryptography',
      'Req 7-8 Identity & Least Privilege',
      'Req 10-11 Audit Logging & Pentesting'
    ]
  }
};

interface ControlTranslation {
  domain: string;
  title: string;
  requirementText: string;
  evidence: string;
  baselineVariance: string;
  remediationPlaybook?: string;
  remediationGuidance: string;
}

const CONTROL_EN: Record<string, ControlTranslation> = {
  'iso-a8.2': {
    domain: 'Privileged Access Management',
    title: 'Privileged Access Rights & Behavioral Review',
    requirementText:
      'Privileged access rights must be restricted and continuously monitored for anomalous archive tool invocations and off-hour database operations.',
    evidence:
      'UEBA detected admin account Kevin (ADM) invoking 7z.exe during off-hours to compress sensitive DB dumps (+850% deviation above baseline).',
    baselineVariance: 'Severe Deviation (+850%)',
    remediationPlaybook: 'SOAR-PB-109: Privileged Session Revocation & MFA Re-auth',
    remediationGuidance:
      'Enforce DBA access exclusively through the secure bastion proxy, block server-side 7z archiving, and temporarily suspend the privileged account for Tier-2 SOC review.'
  },
  'iso-a8.20': {
    domain: 'Network Perimeter Security',
    title: 'Network Segregation & Remote Access Auditing',
    requirementText:
      'Networks must be segregated with MFA-enforced VPN gateways and Geo-IP threat blocking to prevent anonymous proxy brute-force attacks.',
    evidence:
      'Perimeter NDR detected unauthorized VPN brute-force originating from RU exit nodes; firewall automatically enforced dynamic Geo-IP blocklist.',
    baselineVariance: 'New Geolocation Anomaly',
    remediationPlaybook: 'SOAR-PB-802: Perimeter Dynamic Blocklist & Rate-Limiting',
    remediationGuidance:
      'Blocked automatically via SOAR playbook. Schedule a 7-day historical session audit for the same /24 subnet.'
  },
  'iso-a8.7': {
    domain: 'Malware Protection',
    title: 'Endpoint Threat Protection & Behavioral Detection',
    requirementText:
      'Endpoints must run high-efficacy EDR/XDR telemetry to intercept and terminate unauthorized binaries and malicious scripts in real time.',
    evidence:
      'OpenXDR sensor on web-frontend-03 intercepted unauthorized cryptominer xmrig_miner.exe and neutralized memory injection.',
    baselineVariance: 'Known Signature Blocked (Pass)',
    remediationPlaybook: 'SOAR-PB-104: Endpoint Micro-Isolation & Process Termination',
    remediationGuidance:
      'Malicious process terminated. Schedule a full filesystem hash integrity scan and vulnerability re-verification on the host.'
  },
  'iso-a5.15': {
    domain: 'Access Control Lifecycle',
    title: 'Identity Lifecycle & Stale Account Cleanup',
    requirementText:
      'Accounts inactive for more than 90 days or belonging to departed staff must be reviewed and disabled to prevent lateral movement.',
    evidence:
      'IAM audit identified 12 Active Directory accounts with >90 days of inactivity still active outside restricted OUs.',
    baselineVariance: '12 Overdue Accounts',
    remediationPlaybook: 'SOAR-PB-310: Cloud Session Revocation & Key Rotation',
    remediationGuidance:
      'Confirm employment status with HR/IT Ops and execute automated batch deprovisioning policy.'
  },
  'iso-a8.15': {
    domain: 'Logging & Tamper-Proofing',
    title: 'System Audit Log Integrity & WORM Protection',
    requirementText:
      'All security logs must be written to tamper-proof WORM storage with NTP-synchronized timestamps.',
    evidence:
      'All Syslog and XDR telemetry streams seal to WORM blockchain hashes every 5 minutes with 100% Merkle tree verification.',
    baselineVariance: 'Healthy Baseline (0 Drift)',
    remediationGuidance:
      'Compliant. Storage cluster health is 88% with a 365-day immutable retention policy.'
  },
  'gdpr-art32': {
    domain: 'Security of Processing',
    title: 'PII Processing Security & End-to-End TLS 1.3 Encryption',
    requirementText:
      'Controllers and processors must enforce pseudonymization and end-to-end TLS 1.3 encryption for all PII-carrying channels.',
    evidence:
      'NDR deep packet inspection confirmed 100% of API calls containing IDs or payment PII enforce TLS 1.3 (ChaCha20-Poly1305 / AES-256-GCM).',
    baselineVariance: '100% Enforced Coverage',
    remediationGuidance:
      'Compliant. Legacy cipher suites (SSLv3/TLS1.0/1.1) are globally disabled across reverse proxies.'
  },
  'gdpr-art44': {
    domain: 'Cross-Border Data Transfers',
    title: 'Restrictions on Transfers of Personal Data to Third Countries',
    requirementText:
      'Prohibit unencrypted exports of EU customer PII to non-adequate third countries or unauthorized cloud storage services.',
    evidence:
      'DLP and NDR intercepted dev-workstation-99 uploading a 15GB compressed database dump containing 12,000 EU customer PII records to MEGA.nz.',
    baselineVariance: 'Unauthorized Cross-Border Exfil',
    remediationPlaybook: 'SOAR-PB-901: DLP Cross-Border Cutoff & DPO Alert',
    remediationGuidance:
      'Endpoint connection severed. Initiate GDPR incident assessment to evaluate the 72-hour regulatory notification threshold.'
  },
  'gdpr-art33': {
    domain: 'Breach Notification',
    title: '72-Hour Supervisory Authority Breach Notification SLA',
    requirementText:
      'Personal data breaches must be assessed and reported to supervisory authorities within 72 hours of awareness.',
    evidence:
      'Automated SOC response generated forensic impact brief within 11 minutes (<15m, well within the 72h statutory window).',
    baselineVariance: 'Rapid Response (SLA Met)',
    remediationGuidance:
      'Response timeline compliant; forensic bundle archived to WORM storage.'
  },
  'gdpr-art15': {
    domain: 'Data Subject Rights',
    title: 'Right of Access & PII Query Audit Trail',
    requirementText:
      'Every employee or admin lookup of personal records must be tied to an approved ticket with least-privilege field scoping.',
    evidence:
      'SAR-2026-091 HR lookup verified against approved workflow ticket with field-level masking enforced.',
    baselineVariance: 'Authorized Audit Trail',
    remediationGuidance: 'Compliant.'
  },
  'nist-ac2': {
    domain: 'Access Control (AC)',
    title: 'Account Management & Least-Privilege Authorization',
    requirementText:
      'Enforce Separation of Duties across accounts and periodically audit service accounts for over-privileged grants.',
    evidence:
      'Scan detected 3 Jenkins CI/CD service accounts holding global Administrator privileges, violating least privilege.',
    baselineVariance: 'Over-Privileged (High)',
    remediationPlaybook: 'SOAR-PB-310: Cloud Session Revocation & Key Rotation',
    remediationGuidance:
      'Downgrade CI/CD accounts to scoped deployment RBAC roles and revoke Cluster-Admin bindings.'
  },
  'nist-ia2': {
    domain: 'Identification & Authentication (IA)',
    title: 'Phishing-Resistant Multi-Factor Authentication (FIDO2)',
    requirementText:
      'Enforce phishing-resistant FIDO2/WebAuthn MFA for all system components, bastions, and admin consoles.',
    evidence:
      'Admin consoles, SSH bastions, and cloud IAM enforce 100% hardware FIDO2 MFA with zero bypass events.',
    baselineVariance: '100% Baseline Met',
    remediationGuidance: 'Meets NIST AAL3 assurance requirements.'
  },
  'nist-si7': {
    domain: 'System Integrity (SI)',
    title: 'Software, Firmware & Configuration Integrity Monitoring',
    requirementText:
      'Use File Integrity Monitoring (FIM) to detect unauthorized modifications to critical binaries and authentication configs.',
    evidence:
      'SOAR FIM detected out-of-window modification to /etc/pam.d/sshd on gateway-gw-02 and triggered immediate alerting.',
    baselineVariance: 'Critical Config Tampering',
    remediationPlaybook: 'SOAR-PB-104: Endpoint Micro-Isolation & Process Termination',
    remediationGuidance:
      'Compare against GitOps baseline, restore tampered PAM config, and run forensic trace on source IP.'
  },
  'nist-au2': {
    domain: 'Audit & Accountability (AU)',
    title: 'Security Event Logging & Immutable Retention',
    requirementText:
      'Capture authentication, privilege changes, and critical DB operations with full user attribution and retention.',
    evidence:
      'All 420 enterprise nodes stream logs over TLS 1.3 to VictoriaLogs with <120ms ingestion latency.',
    baselineVariance: 'Zero Log Loss (0% Drop)',
    remediationGuidance: 'Compliant.'
  },
  'tsc-cc6.1': {
    domain: 'Logical Access Control',
    title: 'Logical Access Security & Device Registration',
    requirementText:
      'Restrict logical access to protected assets through NAC, certificate validation, and VLAN microsegmentation.',
    evidence:
      '802.1X NAC and microsegmentation policies enforced across all DC VLANs; unregistered hosts auto-quarantined.',
    baselineVariance: 'Fully Compliant',
    remediationGuidance: 'Meets SOC 2 CC6.1 criteria.'
  },
  'tsc-cc7.2': {
    domain: 'Vulnerability Monitoring',
    title: 'Real-Time Vulnerability Monitoring & Remediation SLA',
    requirementText:
      'Remediate CVSS >= 9.0 critical vulnerabilities within 14 days or apply verified compensating controls.',
    evidence:
      'Scanner flagged 1 internet-facing reverse proxy exposing OpenSSL memory overflow CVE-2026-1192 (CVSS 9.8), 2 days past 14-day SLA.',
    baselineVariance: 'CVSS 9.8 SLA Overdue',
    remediationPlaybook: 'SOAR-PB-802: Perimeter Dynamic Blocklist & Rate-Limiting',
    remediationGuidance:
      'WAF virtual patching is active to block exploit payloads; upgrade OpenSSL to 3.4.1 in tonight’s maintenance window.'
  },
  'tsc-cc8.1': {
    domain: 'Change Management',
    title: 'Code Change Authorization & Cryptographic Signing',
    requirementText:
      'Production changes require dual peer review and Cosign cryptographic image attestation before cluster admission.',
    evidence:
      '100% of deployed Docker images are signed with Cosign/Sigstore and verified by the Kubernetes Admission Controller.',
    baselineVariance: '0 Unsigned Images',
    remediationGuidance: 'Meets SOC 2 Change Management requirements.'
  },
  'hipaa-164.312-a': {
    domain: 'ePHI Access Control',
    title: 'ePHI Unique User ID & Automatic Session Logoff',
    requirementText:
      'Assign unique IDs for ePHI access and enforce automatic workstation lockoff after <= 15 minutes of inactivity.',
    evidence:
      '4 PACS radiology viewing terminals had screen-lock timeout configured to "Never", violating § 164.312(a)(2)(iii).',
    baselineVariance: 'Idle Lockout Missing',
    remediationPlaybook: 'SOAR-PB-104: Endpoint Micro-Isolation & Process Termination',
    remediationGuidance:
      'Push mandatory GPO/MDM policy setting workstation idle timeout to 10 minutes with credential unlock.'
  },
  'hipaa-164.312-e': {
    domain: 'ePHI Transmission Security',
    title: 'ePHI Confidentiality & mTLS Transport Protection',
    requirementText:
      'All ePHI transmitted over internal or public networks must use strong end-to-end encryption (TLS 1.3 / IPsec).',
    evidence:
      'Hospital HL7 and DICOM imaging interfaces enforce mutual TLS (mTLS) across 100% of endpoints.',
    baselineVariance: '100% Encrypted Transit',
    remediationGuidance: 'Fully compliant with HIPAA Technical Safeguards.'
  },
  'hipaa-164.312-b': {
    domain: 'Audit Controls',
    title: 'ePHI Access Audit Logging & Traceability',
    requirementText:
      'Implement hardware and software mechanisms to record and audit all queries and exports involving ePHI.',
    evidence:
      'EMR database SELECT, UPDATE, and EXPORT events are captured in real time with clinician ID attribution.',
    baselineVariance: 'Full Audit Trail (Pass)',
    remediationGuidance: 'Compliant.'
  },
  'pci-req3.4': {
    domain: 'Cardholder Data Protection',
    title: 'Strong Cryptography for Stored PAN Data',
    requirementText:
      'Primary Account Numbers (PAN) must be rendered unreadable using AES-256 or tokenization with HSM key rotation.',
    evidence:
      'Payment DB PAN columns encrypted with AES-256-GCM backed by Thales HSM with 90-day automated rotation.',
    baselineVariance: 'HSM Key Rotation Valid',
    remediationGuidance: 'Compliant with PCI DSS v4.0.'
  },
  'pci-req1.2': {
    domain: 'CDE Microsegmentation',
    title: 'Cardholder Data Environment (CDE) Network Isolation',
    requirementText:
      'Strictly isolate CDE databases from corporate Wi-Fi and untrusted networks via stateful firewall segmentation.',
    evidence:
      'Firewall audit found 1 temporary rule allowing corp-wifi-vlan-20 access to CDE DB port 3306 expired 18 days ago.',
    baselineVariance: 'Stale CDE Firewall Rule',
    remediationPlaybook: 'SOAR-PB-802: Perimeter Dynamic Blocklist & Rate-Limiting',
    remediationGuidance:
      'Immediately delete rule-id 4091 and enforce jump-host bastion access for all CDE administration.'
  },
  'pci-req8.3': {
    domain: 'Identity & MFA',
    title: 'Multi-Factor Authentication for All CDE Access',
    requirementText:
      'PCI DSS v4.0 mandates MFA for every local and remote administrative session entering the CDE.',
    evidence:
      'All CDE bastion connections require RADIUS / FIDO2 MFA; unauthenticated attempts are dropped and alerted.',
    baselineVariance: '100% MFA Enforced',
    remediationGuidance: 'Compliant with PCI DSS v4.0.'
  },
  'pci-req10.2': {
    domain: 'Audit Logging',
    title: 'Audit Trail Capture for All CDE & Privileged Access',
    requirementText:
      'Log all access to cardholder data, privileged actions, failed logins, and log initialization events.',
    evidence:
      'All CDE DB session telemetry replicates to immutable WORM storage with guaranteed 365-day retention.',
    baselineVariance: '0% Log Loss (Compliant)',
    remediationGuidance: 'Compliant.'
  }
};

const CAPA_EN: Record<string, { title: string; remediationAction: string }> = {
  'CAPA-2026-001': {
    title: 'Revoke direct DB compression privilege for Kevin (ADM) and restrict archiving tools',
    remediationAction:
      'Block 7z.exe / winrar on Bastion hosts and enforce Zero Trust PAM Just-In-Time (JIT) elevation.'
  },
  'CAPA-2026-002': {
    title: 'Block cross-border MEGA.nz uploads and escalate PII exfiltration review to DPO',
    remediationAction:
      'Null-route external cloud storage egress, quarantine dev-workstation-99, and initiate 72h GDPR forensic workflow.'
  },
  'CAPA-2026-003': {
    title: 'Purge expired firewall rule permitting corporate Wi-Fi access to CDE database',
    remediationAction:
      'Revoke rule-id 4091 (Allow-Corp-WiFi-to-CDE-3306) on cde-firewall-cluster and seal audit change log.'
  },
  'CAPA-2026-004': {
    title: 'Enforce 10-minute idle screen lock across radiology PACS viewing terminals',
    remediationAction:
      'Deploy GPO override to pacs-view-terminal fleet locking idle timeout to 10m and disallowing user override.'
  },
  'CAPA-2026-005': {
    title: 'Upgrade edge reverse proxy OpenSSL to 3.4.1 to remediate CVE-2026-1192',
    remediationAction:
      'Rolling-rebuild reverse proxy containers during maintenance window with patched OpenSSL 3.4.1.'
  }
};

const WORM_EN: Record<number, string> = {
  10428: 'ISO 27001 A.8.15 WORM tamper-proof periodic seal verified across 420 nodes.',
  10427: 'PCI DSS v4.0 Req 3.4 HSM key rotation cryptographic proof sealed to immutable ledger.',
  10426: 'GDPR Art. 32 end-to-end TLS 1.3 enforcement audit verified across all PII APIs.',
  10425: 'NIST SP 800-53 IA-2 100% FIDO2 WebAuthn hardware attestation stamped.',
  10424: 'HIPAA § 164.312(e) ePHI transport mTLS certificate chain validation sealed.'
};

const SERVICES_EN: Record<string, string> = {
  'SVC-01': 'SAP S/4HANA Core ERP & Financial Ledger',
  'SVC-02': 'SWIFT & Global Interbank Clearing Gateway',
  'SVC-03': 'Customer Trading API Gateway (Kubernetes)',
  'SVC-04': 'Zero Trust Identity Governance & IAM SSO Cluster',
  'SVC-05': 'Global Supply Chain EDI & Vendor Portal',
  'SVC-06': 'Internal Collaboration & Messaging (Teams/Slack)'
};

const DEPTS_EN: Record<string, { name: string; topRiskFactor: string }> = {
  'DEPT-01': {
    name: 'R&D & Silicon Architecture Engineering (R&D)',
    topRiskFactor: 'Off-hour bulk source code Git cloning (+850% UEBA baseline deviation)'
  },
  'DEPT-02': {
    name: 'Global Treasury & Finance Division',
    topRiskFactor: 'BEC CEO-impersonation wire transfer fraud attempts intercepted'
  },
  'DEPT-03': {
    name: 'APAC Global Supply Chain Management',
    topRiskFactor: 'Shared third-party vendor VPN credentials & unrevoked expired certificates'
  },
  'DEPT-04': {
    name: 'Executive Board & C-Suite Office',
    topRiskFactor: 'Targeted executive spear-phishing & deepfake voice impersonation'
  },
  'DEPT-05': {
    name: 'Global Customer Support & Operations',
    topRiskFactor: 'Social engineering attempts bypassing customer identity verification'
  }
};

const ROADMAP_EN: Record<string, { title: string; description: string }> = {
  'ROAD-01': {
    title: 'Enterprise Zero Trust Perimeter Architecture Phase III',
    description:
      'Decommission legacy perimeter VPNs and roll out device-posture conditional SASE / ZTNA private access.'
  },
  'ROAD-02': {
    title: 'Autonomous SOAR Containment Coverage to 95%',
    description:
      'Integrate next-gen EDR, NDR, and microsegmentation firewalls for automated sub-second ransomware isolation.'
  },
  'ROAD-03': {
    title: 'Third-Party Risk Management (TPRM) & Automated SBOM Gates',
    description:
      'Enforce CycloneDX SBOM and real-time breach intel checks across top 100 critical vendors.'
  },
  'ROAD-04': {
    title: 'Post-Quantum Cryptography (PQC) Core Asset Migration',
    description:
      'Validate NIST FIPS 203/204 PQC readiness across banking backbones, SWIFT links, and core databases.'
  }
};

const APPROVALS_EN: Record<string, { title: string; description: string; businessImpact: string }> = {
  'APPR-2026-089': {
    title: 'Emergency Isolate High-Risk SEA Regional Branch Subnet (10.184.0.0/16)',
    description:
      'Suspected BlackByte ransomware lateral movement and Kerberoasting detected on SEA branch endpoints; immediate Zero Trust circuit-breaker isolation recommended.',
    businessImpact:
      'Temporarily pauses ERP access for ~45 branch staff (~2h order scheduling delay), while completely preventing ransomware propagation to HQ core.'
  },
  'APPR-2026-090': {
    title: 'Immediately Revoke Compromised Marketing SaaS OAuth Integration Tokens',
    description:
      'Third-party SaaS vendor disclosed developer key leakage while holding read-only CRM tokens; immediate token revocation required.',
    businessImpact:
      'Marketing campaign dispatch delayed by 30 minutes; zero impact on core production workloads.'
  }
};

const DOMAIN_KEY_EN: Record<string, string> = {
  '特權存取權限管理': 'Privileged Access Management',
  '網路安全邊界控制': 'Network Perimeter Security',
  '惡意軟體防護': 'Malware Protection',
  '存取控制生命週期': 'Access Control Lifecycle',
  '記錄與審計日誌': 'Logging & Tamper-Proofing',
  '處理安全與傳輸加密': 'Security of Processing',
  '跨境境外傳輸控管': 'Cross-Border Data Transfers',
  '重大資料外洩通報': 'Breach Notification',
  '當事人權利與調閱': 'Data Subject Rights',
  '存取控制 (Access Control)': 'Access Control (AC)',
  '識別與鑑別 (Identification and Authentication)': 'Identification & Authentication (IA)',
  '系統與資訊完整性 (System Integrity)': 'System Integrity (SI)',
  '系統與資訊完整性 (System & Information Integrity)': 'System Integrity (SI)',
  '審計與問責 (Audit & Accountability)': 'Audit & Accountability (AU)',
  '邏輯存取控制 (Logical Access)': 'Logical Access Control',
  '系統異常與弱點修補 (Vulnerability Monitoring)': 'Vulnerability Monitoring',
  '系統異常與弱點修補 (System Vulnerability Monitoring)': 'Vulnerability Monitoring',
  '變更授權與發布管理 (Change Management)': 'Change Management',
  'ePHI 存取控制措施': 'ePHI Access Control',
  'ePHI 傳輸安全加密': 'ePHI Transmission Security',
  '審計控制與記錄追蹤': 'Audit Controls',
  '持卡人資料保護 (Cardholder Data)': 'Cardholder Data Protection',
  '網路安全與持卡人環境微隔離': 'CDE Microsegmentation',
  '使用者識別與多因素鑑別': 'Identity & MFA',
  '記錄與審計追蹤 (Log & Audit)': 'Audit Logging'
};

export function translateDomainName(domain: string, isZh: boolean): string {
  if (isZh) return domain;
  return DOMAIN_KEY_EN[domain] || domain;
}

export function localizeFramework(fw: ComplianceFrameworkMeta, isZh: boolean): ComplianceFrameworkMeta {
  if (isZh) return fw;
  const en = FRAMEWORK_EN[fw.id];
  if (!en) return fw;
  return {
    ...fw,
    version: en.version,
    fullName: en.fullName,
    category: en.category,
    badge: `${en.badgePrefix} (${fw.score}%)`,
    auditor: en.auditor,
    description: en.description,
    domains: fw.domains.map((d, idx) => ({
      ...d,
      name: en.domains[idx] || d.name
    }))
  };
}

export function localizeControl(ctrl: ComplianceControl, isZh: boolean): ComplianceControl {
  if (isZh) return ctrl;
  const en = CONTROL_EN[ctrl.id];
  if (!en) return ctrl;
  const isResolved = ctrl.status === 'Compliant' && /已完成修復/.test(ctrl.baselineVariance);
  return {
    ...ctrl,
    domain: en.domain,
    title: en.title,
    requirementText: en.requirementText,
    evidence: en.evidence,
    baselineVariance: isResolved ? 'Remediated & Verified (Compliant)' : en.baselineVariance,
    remediationPlaybook: en.remediationPlaybook ?? ctrl.remediationPlaybook,
    remediationGuidance: en.remediationGuidance
  };
}

export function localizeRemediationTask(task: RemediationTask, isZh: boolean): RemediationTask {
  if (isZh) return task;
  const en = CAPA_EN[task.id];
  if (!en) return task;
  return {
    ...task,
    title: en.title,
    remediationAction: en.remediationAction
  };
}

export function localizeWormRecord(rec: WormLedgerRecord, isZh: boolean): WormLedgerRecord {
  if (isZh) return rec;
  if (WORM_EN[rec.blockId]) {
    return { ...rec, event: WORM_EN[rec.blockId] };
  }
  const ev = rec.event;
  if (!/[\u4e00-\u9fff]/.test(ev)) return rec;

  // Dynamic backend WORM ledger messages generated at runtime
  if (ev.includes('高階授權決策')) {
    const decisionEn = ev.includes('已核准') ? 'Approved for Isolation' : 'Rejected';
    return {
      ...rec,
      event: ev
        .replace('高階授權決策', 'Executive Authorization')
        .replace(/已核准執行隔離處置/g, decisionEn)
        .replace(/已駁回退回/g, 'Rejected')
    };
  }
  if (ev.includes('自動化連續遙測全檢完成')) {
    return {
      ...rec,
      event: `${rec.framework} continuous automated telemetry assessment sealed to immutable ledger.`
    };
  }
  if (ev.includes('觸發自動化合規修復劇本')) {
    return {
      ...rec,
      event: `Automated SOAR compliance remediation playbook triggered for ${rec.framework}.`
    };
  }
  if (ev.includes('合規缺陷工單')) {
    return {
      ...rec,
      event: `CAPA compliance deficiency task resolved and cryptographically verified for ${rec.framework}.`
    };
  }
  return rec;
}

export function localizeBusinessService(svc: BusinessServiceHealth, isZh: boolean): BusinessServiceHealth {
  if (isZh) return svc;
  return {
    ...svc,
    name: SERVICES_EN[svc.id] || svc.name
  };
}

export function localizeDepartmentRisk(dept: DepartmentRisk, isZh: boolean): DepartmentRisk {
  if (isZh) return dept;
  const en = DEPTS_EN[dept.id];
  if (!en) return dept;
  return {
    ...dept,
    name: en.name,
    topRiskFactor: en.topRiskFactor
  };
}

export function localizeRoadmapItem(item: StrategicRoadmapItem, isZh: boolean): StrategicRoadmapItem {
  if (isZh) return item;
  const en = ROADMAP_EN[item.id];
  if (!en) return item;
  return {
    ...item,
    title: en.title,
    description: en.description
  };
}

export function localizeApprovalItem(item: ExecutiveApprovalItem, isZh: boolean): ExecutiveApprovalItem {
  if (isZh) return item;
  const en = APPROVALS_EN[item.id];
  if (!en) return item;
  return {
    ...item,
    title: en.title,
    description: en.description,
    businessImpact: en.businessImpact
  };
}
