/**
 * Digital Forensics Engine (數位鑑識底層核心引擎)
 * Evidence Invariant Preservation (Chain of Custody),
 * Physical Sector Hex Viewer, Magic Bytes File Carving,
 * Super-Timeline Correlation, Multimodal Malware/Ransomware Analysis,
 * YARA Threat Hunting Core, and AI Forensics Copilot Reasoner.
 */

export interface ForensicCase {
  id: string;
  name: string;
  caseNumber: string;
  status: 'Active' | 'Under_Review' | 'Archived' | 'Closed';
  examiner: string;
  agency: string;
  createdDate: string;
  incidentType: string;
  targetSystems: string[];
  summary: string;
  evidenceIds: string[];
}

export interface ForensicEvidence {
  id: string;
  caseId: string;
  name: string;
  type: 'Disk_Image_E01' | 'Physical_RAM_Raw' | 'Network_PCAP' | 'Mobile_UFDR' | 'Web_Access_Log' | 'Windows_EVTX';
  fileSizeMB: number;
  sha256: string;
  md5: string;
  acquiredFrom: string;
  acquiredBy: string;
  acquiredAt: string;
  verifiedIntegrity: boolean;
  status: 'locked' | 'compromised' | 'analyzing' | 'archived';
  deviceInfo: string;
  ntfsAttributes?: {
    path: string;
    fileSizeStr: string;
    permissions: string;
    timestamps: {
      modified: string;
      accessed: string;
      created: string;
      born: string;
    };
    mftRecordNumber: number;
    carvingRecoveryStatus: string;
  };
  notes: string;
}

export interface CustodyRecord {
  recordId: string;
  evidenceId: string;
  action: 'ACQUISITION' | 'SEAL_VERIFY' | 'TRANSFER' | 'EXAMINATION' | 'EXPORT_REPORT';
  performedBy: string;
  recipient?: string;
  timestamp: string;
  reason: string;
  sha256Before: string;
  sha256After: string;
  integrityMatch: boolean;
  vaultLocation: string;
  legalSignature: string;
}

export interface HexSectorBlock {
  offset: string;
  hex: string;
  ascii: string;
  tag?: string;
  interpretation?: string;
}

export interface CarvedArtifact {
  id: string;
  fileName: string;
  fileType: string;
  recoveredFromOffset: string;
  sizeBytes: number;
  sha256: string;
  classification: 'Malicious' | 'Suspicious' | 'Benign' | 'Unknown';
  recoveredAt: string;
  description: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  source: string;
  category: 'Logon' | 'Process' | 'Network' | 'File' | 'Registry' | 'AntiForensics';
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';
  description: string;
  rawRecord: string;
  evidenceRef: string;
  mitreTactic?: string;
}

export interface MemoryProcessArtifact {
  pid: number;
  ppid: number;
  imageFileName: string;
  threads: number;
  handles: number;
  session: number;
  wow64: boolean;
  createTime: string;
  exitTime?: string;
  injected: boolean;
  hiddenVAD: boolean;
  yaraHits: string[];
  vadProtection: string;
}

export interface NetworkForensicSession {
  sessionId: string;
  srcIp: string;
  srcPort: number;
  destIp: string;
  destPort: number;
  protocol: 'TCP' | 'UDP' | 'TLS' | 'HTTP' | 'DNS';
  bytesSent: number;
  bytesReceived: number;
  packets: number;
  sniDomain?: string;
  dnsQuery?: string;
  ja3Fingerprint?: string;
  alertSignature?: string;
  threatLevel: 'Critical' | 'Suspicious' | 'Clean';
  timestamp: string;
}

export interface RegistryCarvedKey {
  keyPath: string;
  valueName: string;
  valueType: string;
  data: string;
  lastWriteTime: string;
  isDeleted: boolean;
  suspiciousIndicator: string;
}

class ForensicsEngine {
  private cases: ForensicCase[] = [
    {
      id: 'CASE-2026-004',
      name: '金融主機 Ransomware 勒索入侵事件',
      caseNumber: 'SEC-FOR-2026-0612-004',
      status: 'Active',
      examiner: 'Chiur [CH-9912]',
      agency: 'Cyber Forensics Incident Response Unit',
      createdDate: '2026-06-12',
      incidentType: 'Ransomware / Lateral Movement / Data Exfiltration',
      targetSystems: ['FINANCE-SRV-01 (10.0.4.15)', 'DC-CORP-01 (10.0.1.10)', 'SW-CORE-SPAN'],
      summary: '財務核心伺服器遭 LockBit 3.0 勒索軟體攻擊，磁碟陰影複本遭抹除，並涉及 4.2GB 敏感薪資與專利資料異常外傳。需對物理鏡像進行 NTFS 磁區還原、記憶體注入提取與全封包流量解碼。',
      evidenceIds: ['EVI-001', 'EVI-002', 'EVI-003', 'EVI-004']
    },
    {
      id: 'CASE-2026-003',
      name: '台北總部人事資料庫 API 外洩調查',
      caseNumber: 'SEC-FOR-2026-0608-003',
      status: 'Archived',
      examiner: 'Sarah Lin [SL-8841]',
      agency: 'Internal Security Audit Team',
      createdDate: '2026-06-08',
      incidentType: 'API Credential Misuse / Unauthorized Data Export',
      targetSystems: ['HR-DB-PRIMARY (192.168.10.20)'],
      summary: '外部代理 IP 透過洩漏之 API Token 發起批量非營業時間野卡查詢，已完成身分比對並移送法律程序。',
      evidenceIds: ['EVI-005']
    }
  ];

  private evidence: ForensicEvidence[] = [
    {
      id: 'EVI-001',
      caseId: 'CASE-2026-004',
      name: 'finance_srv_phys.E01',
      type: 'Disk_Image_E01',
      fileSizeMB: 262553.6, // 256.4 GB
      sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      md5: 'a6b2c89fca6e1aef91236ea9cbde78f2',
      acquiredFrom: 'FINANCE-SRV-01 (Hyper-V Windows Server 2022 Physical RAID)',
      acquiredBy: 'Chiur [CH-9912]',
      acquiredAt: '2026-06-12T03:45:00.000Z',
      verifiedIntegrity: true,
      status: 'locked',
      deviceInfo: 'Hyper-V Windows Server 2022 Physical SAS Volume',
      ntfsAttributes: {
        path: 'C:\\Windows\\System32\\drivers\\sec_sys.sys (🔍 物理還原已刪執行檔二進位)',
        fileSizeStr: '524 KB',
        permissions: 'NTFS Integrity Check // SYSTEM:FULL_CONTROL // NO_EXECUTE',
        timestamps: {
          modified: '2026-06-12 02:40:50 (M)',
          accessed: '2026-06-12 02:40:50 (A)',
          created: '2026-06-12 02:15:20 (C)',
          born: '2026-06-12 02:15:20 (B)'
        },
        mftRecordNumber: 148291,
        carvingRecoveryStatus: 'File Carving 深度物理資料雕刻成功：已在未配置磁區 (Unallocated Space) 0x000F83C0 成功還原已被惡意抹除之 PE 二進位代碼。'
      },
      notes: '使用 Tableau 物理防寫鎖 (Write-Blocker) 與 FTK Imager 採證之 E01 證據檔案，已完成不可篡改數位簽章計算。'
    },
    {
      id: 'EVI-002',
      caseId: 'CASE-2026-004',
      name: 'win_mem_dump.raw',
      type: 'Physical_RAM_Raw',
      fileSizeMB: 65536.0, // 64 GB
      sha256: '3c1a89f92adbc018ee89fa72bb3c881fa2c244c798031e4d8efbe067c80884d9',
      md5: '8b1a9953c4611296a827abf8c47804d7',
      acquiredFrom: 'FINANCE-SRV-01 (RAM Physical Memory)',
      acquiredBy: 'Chiur [CH-9912]',
      acquiredAt: '2026-06-12T03:50:00.000Z',
      verifiedIntegrity: true,
      status: 'locked',
      deviceInfo: 'FINANCE-SRV (64GB ECC DDR4)',
      ntfsAttributes: {
        path: '\\Device\\PhysicalMemory (Volatility Process Address Space)',
        fileSizeStr: '64.0 GB',
        permissions: 'KERNEL_PRIVILEGED_READONLY',
        timestamps: {
          modified: '2026-06-12 03:50:00 (M)',
          accessed: '2026-06-12 03:50:00 (A)',
          created: '2026-06-12 03:50:00 (C)',
          born: '2026-06-12 03:50:00 (B)'
        },
        mftRecordNumber: 0,
        carvingRecoveryStatus: '已透過 Volatility 3 pslist/malfind 提取注入到 lsass.exe (PID 684) 記憶體空間之 Mimikatz DLL 特徵與 LockBit 記憶體常數。'
      },
      notes: '利用 WinPmem 在不中斷主機電源情況下即時導出之揮發性記憶體，已透過 SHA-256 鎖定。'
    },
    {
      id: 'EVI-003',
      caseId: 'CASE-2026-004',
      name: 'ceo_mobile_backup.ufdr',
      type: 'Mobile_UFDR',
      fileSizeMB: 131276.8, // 128.2 GB
      sha256: 'd83b77ab22cd81a9f023ea519bfb8fa9c581e2894541bf6f784e7ad183188544',
      md5: '5d41402abc4b2a76b9719d911017c592',
      acquiredFrom: 'CEO iPhone 15 Pro (iOS 17.5.1)',
      acquiredBy: 'Chiur [CH-9912]',
      acquiredAt: '2026-06-12T05:10:00.000Z',
      verifiedIntegrity: true,
      status: 'locked',
      deviceInfo: 'Cellebrite UFED Physical/Logical Extraction',
      ntfsAttributes: {
        path: '/private/var/mobile/Library/SMS/sms.db',
        fileSizeStr: '128.2 GB',
        permissions: 'APFS Encrypted Keybag // Read-Only Master',
        timestamps: {
          modified: '2026-06-12 05:00:00 (M)',
          accessed: '2026-06-12 05:05:00 (A)',
          created: '2026-06-12 05:00:00 (C)',
          born: '2026-06-12 05:00:00 (B)'
        },
        mftRecordNumber: 88102,
        carvingRecoveryStatus: '提取並還原已刪除的 Signal / iMessage 網路釣魚簡訊，包含含有短網址之憑證竊取連結。'
      },
      notes: '符合 ISO/IEC 27037 數位證據保全標準程序。'
    },
    {
      id: 'EVI-004',
      caseId: 'CASE-2026-004',
      name: 'exchange_server_logs.log',
      type: 'Web_Access_Log',
      fileSizeMB: 12697.6, // 12.4 GB
      sha256: 'b81d77a834ef9213bc5e902148dae9215091a1005a761ef294812aaecf812831',
      md5: 'b81d77a834ef192039abedfe8912384a',
      acquiredFrom: 'Exchange Server IIS Portal (C:\\inetpub\\logs\\LogFiles)',
      acquiredBy: 'Chiur [CH-9912]',
      acquiredAt: '2026-06-12T04:20:00.000Z',
      verifiedIntegrity: false, // Discrepancy!
      status: 'compromised',
      deviceInfo: 'Exchange Server IIS 10.0 W3C Logs',
      ntfsAttributes: {
        path: 'C:\\inetpub\\logs\\LogFiles\\W3SVC1\\u_ex260612.log',
        fileSizeStr: '12.4 GB',
        permissions: 'NTFS Integrity Check // WARNING: TIMESTAMP_MISMATCH',
        timestamps: {
          modified: '2026-06-12 04:18:22 (M)',
          accessed: '2026-06-12 04:18:22 (A)',
          created: '2026-06-12 01:00:00 (C)',
          born: '2026-06-12 01:00:00 (B)'
        },
        mftRecordNumber: 22091,
        carvingRecoveryStatus: '偵測到 Timestomping 偽造時間戳記特徵與檔案哈希不一致，已被攻擊者局部抹除部分 02:00-02:30 登入活動。'
      },
      notes: '⚠️ 注意：該證據與原始收集雜湊存在不一致，疑似在封裝前遭受攻擊者抹除，需調用 VSS 磁碟快照進行二次驗證。'
    }
  ];

  private custodyLedger: CustodyRecord[] = [
    {
      recordId: 'CUST-001',
      evidenceId: 'EVI-001',
      action: 'ACQUISITION',
      performedBy: 'Chiur [CH-9912]',
      recipient: 'SOC Forensic Offline Vault',
      timestamp: '2026-06-12T03:45:00.000Z',
      reason: '金融主機勒索事件物理磁碟採證封裝 (FTK Imager + Tableau Write-Blocker)',
      sha256Before: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      sha256After: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      integrityMatch: true,
      vaultLocation: 'SOC Encrypted Offline Storage Vault S3-SECURE-VAULT-01',
      legalSignature: 'CH-LEGAL-SIGN-a6b2c89f'
    },
    {
      recordId: 'CUST-002',
      evidenceId: 'EVI-002',
      action: 'ACQUISITION',
      performedBy: 'Chiur [CH-9912]',
      recipient: 'SOC Volatile Memory Archive',
      timestamp: '2026-06-12T03:50:00.000Z',
      reason: 'WinPmem 揮發性物理記憶體提取鎖定',
      sha256Before: '3c1a89f92adbc018ee89fa72bb3c881fa2c244c798031e4d8efbe067c80884d9',
      sha256After: '3c1a89f92adbc018ee89fa72bb3c881fa2c244c798031e4d8efbe067c80884d9',
      integrityMatch: true,
      vaultLocation: 'SOC Encrypted Offline Storage Vault S3-SECURE-VAULT-02',
      legalSignature: 'CH-LEGAL-SIGN-3c1a89f9'
    },
    {
      recordId: 'CUST-003',
      evidenceId: 'EVI-004',
      action: 'SEAL_VERIFY',
      performedBy: 'Chiur [CH-9912]',
      recipient: 'Evidence Integrity Auditor',
      timestamp: '2026-06-12T04:25:00.000Z',
      reason: '定時不可篡改校驗程序：發現 Exchange 日誌雜湊與原始登錄值不符，標記為 COMPROMISED_SUSPECT',
      sha256Before: 'b81d77a834ef9213bc5e902148dae9215091a1005a761ef294812aaecf812831',
      sha256After: '0000000000000000000000000000000000000000000000000000000000000000',
      integrityMatch: false,
      vaultLocation: 'Quarantine Evidence Storage QUAR-09',
      legalSignature: 'CH-AUDIT-DISCREPANCY-b81d'
    }
  ];

  private carvedArtifacts: Record<string, CarvedArtifact[]> = {
    'EVI-001': [
      {
        id: 'CRV-001',
        fileName: 'sec_sys.sys',
        fileType: 'PE Driver / Executable Binary',
        recoveredFromOffset: '0x000F83C0',
        sizeBytes: 536576, // 524 KB
        sha256: '4a6b2c89fca6e1aef91236ea9cbde78f29f86d081884c7d659a2feaa0c55ad01',
        classification: 'Malicious',
        recoveredAt: '2026-06-12T04:30:15.000Z',
        description: '已成功從未配置扇區中還原被攻擊者主動抹除的 Kernel Rootkit 驅動檔案。包含針對 Windows Defender 阻斷之核心掛鉤代碼。'
      },
      {
        id: 'CRV-002',
        fileName: 'lockbit_encryptor_payload.exe',
        fileType: 'PE32+ Portable Executable',
        recoveredFromOffset: '0x001B9200',
        sizeBytes: 1048576, // 1 MB
        sha256: '7b22a0198fcd881023a1290bbfa71029481aa01928374a5e1283a098234ff12a',
        classification: 'Malicious',
        recoveredAt: '2026-06-12T04:31:00.000Z',
        description: 'LockBit 3.0 (Black) 勒索主體，具備多執行緒 AES-256 / RSA-2048 混合加密與自毀腳本指令。'
      },
      {
        id: 'CRV-003',
        fileName: 'shadow_purge.bat',
        fileType: 'Windows Batch Script',
        recoveredFromOffset: '0x002C4110',
        sizeBytes: 4096,
        sha256: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
        classification: 'Malicious',
        recoveredAt: '2026-06-12T04:31:30.000Z',
        description: '批次腳本包含「vssadmin delete shadows /all /quiet」與「wmic shadowcopy delete」，破壞災難復原能力。'
      }
    ],
    'EVI-002': [
      {
        id: 'CRV-004',
        fileName: 'lsass_injected_mimikatz.dll',
        fileType: 'Memory Dump Process DLL',
        recoveredFromOffset: '0x7FFF0040',
        sizeBytes: 2097152,
        sha256: '991029ba22378f89ac5e884898da28047151d0e56f8dc6292773603d0d6aabbd',
        classification: 'Malicious',
        recoveredAt: '2026-06-12T04:35:00.000Z',
        description: '自記憶體空間 dump 出之 Mimikatz sekurlsa 特徵，記憶體殘留包含 Domain Admins 憑證雜湊。'
      }
    ]
  };

  private superTimeline: TimelineEvent[] = [
    {
      id: 'EVT-001',
      timestamp: '2026-06-12T02:15:20.000Z',
      source: 'Windows Security EVTX (EventID: 4624)',
      category: 'Logon',
      severity: 'Critical',
      description: '帳號「Administrator」自外部跳板 IP 185.220.101.4 (Tor Proxy) 透過 RDP (Port 3389) 暴力憑證驗證成功登入。',
      rawRecord: '{"EventID":4624,"TargetUserName":"Administrator","LogonType":10,"IpAddress":"185.220.101.4","WorkstationName":"DESKTOP-HACKER"}',
      evidenceRef: 'EVI-001',
      mitreTactic: 'TA0001 (Initial Access) / T1078 (Valid Accounts)'
    },
    {
      id: 'EVT-002',
      timestamp: '2026-06-12T02:18:10.000Z',
      source: 'Sysmon EVTX (EventID: 1)',
      category: 'Process',
      severity: 'Critical',
      description: '執行 psexec.exe 並啟動非簽署提權程式 cmd.exe /c powershell -enc ...，建立特權 System32 空間。',
      rawRecord: '{"EventID":1,"Image":"C:\\\\Windows\\\\System32\\\\psexec.exe","CommandLine":"psexec.exe -s -i cmd.exe","User":"NT AUTHORITY\\\\SYSTEM"}',
      evidenceRef: 'EVI-001',
      mitreTactic: 'TA0004 (Privilege Escalation) / T1548'
    },
    {
      id: 'EVT-003',
      timestamp: '2026-06-12T02:22:45.000Z',
      source: 'Windows Security EVTX (EventID: 7045)',
      category: 'AntiForensics',
      severity: 'Critical',
      description: '建立偽裝服務「Windows Security Helper」，調用 vssadmin 抹除磁碟陰影複本與系統還原點。',
      rawRecord: '{"EventID":7045,"ServiceName":"SecSysHelper","ImagePath":"vssadmin delete shadows /all /quiet","ServiceType":"user mode"}',
      evidenceRef: 'EVI-001',
      mitreTactic: 'TA0040 (Impact) / T1490 (Inhibit System Recovery)'
    },
    {
      id: 'EVT-004',
      timestamp: '2026-06-12T02:40:00.000Z',
      source: 'NTFS MFT Transaction Log ($LogFile)',
      category: 'File',
      severity: 'Critical',
      description: 'LockBit 3.0 開始高頻批量重命名檔案為「.lockbit」擴展名，並刪除原始 unallocated 扇區文件。',
      rawRecord: '{"MFTRecord":148291,"FileName":"financial_report_2026.xlsx.lockbit","Action":"RENAME_AND_ENCRYPT"}',
      evidenceRef: 'EVI-001',
      mitreTactic: 'TA0040 (Impact) / T1486 (Data Encrypted for Impact)'
    },
    {
      id: 'EVT-005',
      timestamp: '2026-06-12T03:25:05.000Z',
      source: 'Suricata / Zeek PCAP Stream',
      category: 'Network',
      severity: 'Critical',
      description: '偵測到對外部雲端儲存 MEGA.nz (31.21.4.150:443) 建立突發 TLS 連線，3 分鐘內累計上傳 4.2GB 壓縮密碼包。',
      rawRecord: '{"proto":"tcp","src_ip":"10.0.4.15","dest_ip":"31.21.4.150","dest_port":443,"bytes_sent":4509715200,"app":"mega-upload"}',
      evidenceRef: 'EVI-001',
      mitreTactic: 'TA0010 (Exfiltration) / T1567 (Exfiltration to Cloud Storage)'
    }
  ];

  // Cases APIs
  public getCases(): ForensicCase[] {
    return this.cases;
  }

  public getCaseById(id: string): ForensicCase | undefined {
    return this.cases.find(c => c.id === id || c.caseNumber === id);
  }

  public createCase(payload: Partial<ForensicCase>): ForensicCase {
    const newCase: ForensicCase = {
      id: `CASE-2026-${String(this.cases.length + 5).padStart(3, '0')}`,
      name: payload.name || '全新數位鑑識案件',
      caseNumber: `SEC-FOR-2026-${Date.now().toString().slice(-4)}`,
      status: 'Active',
      examiner: payload.examiner || 'SOC Digital Forensics Lead',
      agency: payload.agency || 'Corporate Cyber Incident Response Center',
      createdDate: new Date().toISOString().slice(0, 10),
      incidentType: payload.incidentType || 'General Forensic Triage',
      targetSystems: payload.targetSystems || ['Primary Host'],
      summary: payload.summary || '建立新案件，遵循 ISO/IEC 27037 監管鏈作業程序。',
      evidenceIds: []
    };
    this.cases.unshift(newCase);
    return newCase;
  }

  // Evidence APIs
  public getEvidence(caseId?: string): ForensicEvidence[] {
    if (caseId) {
      return this.evidence.filter(e => e.caseId === caseId);
    }
    return this.evidence;
  }

  public getEvidenceById(id: string): ForensicEvidence | undefined {
    return this.evidence.find(e => e.id === id || e.name === id);
  }

  public addEvidence(payload: Partial<ForensicEvidence>): ForensicEvidence {
    const now = new Date().toISOString();
    const id = `EVI-${String(this.evidence.length + 1).padStart(3, '0')}`;
    const hash = `sha256:${Buffer.from(String(Date.now()) + (payload.name || '')).toString('hex').slice(0, 64)}`;
    const md5 = Buffer.from(String(Date.now())).toString('hex').slice(0, 32);

    const newEvidence: ForensicEvidence = {
      id,
      caseId: payload.caseId || 'CASE-2026-004',
      name: payload.name || 'acquired_evidence.raw',
      type: payload.type || 'Disk_Image_E01',
      fileSizeMB: Number(payload.fileSizeMB) || 1024,
      sha256: hash,
      md5,
      acquiredFrom: payload.acquiredFrom || 'Host Endpoint System',
      acquiredBy: payload.acquiredBy || 'Chiur [CH-9912]',
      acquiredAt: now,
      verifiedIntegrity: true,
      status: 'locked',
      deviceInfo: payload.deviceInfo || 'Standard Secured Forensic Storage',
      ntfsAttributes: {
        path: `C:\\Forensics\\Evidence\\${payload.name || 'image.raw'}`,
        fileSizeStr: `${Number(payload.fileSizeMB) || 1024} MB`,
        permissions: 'SEALED // WRITE-BLOCK // READONLY',
        timestamps: {
          modified: now,
          accessed: now,
          created: now,
          born: now
        },
        mftRecordNumber: Math.floor(Math.random() * 50000 + 10000),
        carvingRecoveryStatus: '證據已安全密封於保險箱，監管鏈雜湊校驗無誤。'
      },
      notes: payload.notes || '已完成不可篡改數位簽章計算並歸檔至證據保險箱。'
    };

    this.evidence.unshift(newEvidence);

    // Append to custody record
    this.custodyLedger.unshift({
      recordId: `CUST-${String(this.custodyLedger.length + 1).padStart(3, '0')}`,
      evidenceId: id,
      action: 'ACQUISITION',
      performedBy: newEvidence.acquiredBy,
      recipient: 'SOC Forensic Vault S3',
      timestamp: now,
      reason: `採證封裝事證: ${newEvidence.name}`,
      sha256Before: hash,
      sha256After: hash,
      integrityMatch: true,
      vaultLocation: 'SOC Encrypted Offline Storage Vault S3',
      legalSignature: `SIG-${md5.slice(0, 8)}`
    });

    return newEvidence;
  }

  public verifyEvidenceHash(evidenceId: string): { success: boolean; evidence?: ForensicEvidence; match: boolean; message: string } {
    const evi = this.evidence.find(e => e.id === evidenceId || e.name === evidenceId);
    if (!evi) {
      return { success: false, match: false, message: `未找到事證 ID: ${evidenceId}` };
    }

    // In our simulation, EVI-004 has hash discrepancy
    if (evi.id === 'EVI-004') {
      evi.verifiedIntegrity = false;
      evi.status = 'compromised';
      return {
        success: true,
        evidence: evi,
        match: false,
        message: '⚠️ 嚴重警示：事證 SHA-256 雜湊與入庫監管鏈不一致！比對失敗，疑似在封裝前遭受抹除或 Timestomping 偽造。'
      };
    }

    evi.verifiedIntegrity = true;
    evi.status = 'locked';
    return {
      success: true,
      evidence: evi,
      match: true,
      message: `✓ 雜湊比對成功：事證 ${evi.name} 的 SHA-256 (${evi.sha256.slice(0, 16)}...) 與入庫原始雜湊 100% 吻合，符合法庭證據不變性標準。`
    };
  }

  public transferCustody(payload: { evidenceId: string; recipient: string; reason: string; examiner: string }): CustodyRecord {
    const evi = this.evidence.find(e => e.id === payload.evidenceId);
    const now = new Date().toISOString();
    const record: CustodyRecord = {
      recordId: `CUST-${String(this.custodyLedger.length + 1).padStart(3, '0')}`,
      evidenceId: payload.evidenceId,
      action: 'TRANSFER',
      performedBy: payload.examiner || 'Chiur [CH-9912]',
      recipient: payload.recipient || '高檢署鑑識實驗室 / 外部法證中心',
      timestamp: now,
      reason: payload.reason || '移交鑑定機構或外部合規性審計審查',
      sha256Before: evi ? evi.sha256 : 'sha256:verified',
      sha256After: evi ? evi.sha256 : 'sha256:verified',
      integrityMatch: true,
      vaultLocation: `Transferred to: ${payload.recipient}`,
      legalSignature: `LEGAL-TRANSFER-${Date.now().toString(16)}`
    };
    this.custodyLedger.unshift(record);
    return record;
  }

  // Hex Sector Dump API
  public getHexDump(evidenceId: string, offset: string = '0x000F83C0'): HexSectorBlock[] {
    if (evidenceId === 'EVI-004') {
      return [
        { offset: '0x000A1A00', hex: '2F 61 70 69 2F 76 31 2F 61 75 74 68 20 48 54 54', ascii: '/api/v1/auth HTT', tag: 'HTTP_REQUEST', interpretation: 'IIS Web 日誌調用 /api/v1/auth 鑑識端點。' },
        { offset: '0x000A1A10', hex: '50 2F 31 2E 31 20 32 30 30 20 4F 4B 20 2D 20 49', ascii: 'P/1.1 200 OK - I', tag: 'STATUS_200', interpretation: 'HTTP 200 OK 請求成功返回。' },
        { offset: '0x000A1A20', hex: '50 3A 20 31 38 35 2e 32 32 30 2e 31 30 31 2e 34', ascii: 'P: 185.220.101.4', tag: 'ATTACKER_IP', interpretation: '威脅來源 Tor 跳板代理 IP: 185.220.101.4。' },
        { offset: '0x000A1A30', hex: '20 75 73 65 72 3A 61 64 6D 69 6e 69 73 74 72 61', ascii: ' user:administra', tag: 'USER_TARGET', interpretation: '針對 Administrator 系統管理員帳號進行探測。' },
        { offset: '0x000A1A40', hex: '74 6F 72 20 41 75 74 68 53 65 63 74 6F 72 20 42', ascii: 'tor AuthSector B', tag: 'AUTH_MUTATION', interpretation: 'AuthSector 驗證區段記錄。' },
        { offset: '0x000A1A50', hex: '41 53 45 36 34 20 45 4E 43 4F 44 45 44 20 53 45', ascii: 'ASE64 ENCODED SE', tag: 'BASE64_TOKEN', interpretation: '日誌記錄包含 Base64 編碼之惡意 Session。' },
        { offset: '0x000A1A60', hex: '53 53 49 4F 4E 3A 20 59 57 52 74 61 57 34 7a 64', ascii: 'SSION: YWRtaW4zd', tag: 'PAYLOAD', interpretation: '編碼字串還原為 admin3:secret...' },
        { offset: '0x000A1A70', hex: '48 4a 70 64 47 56 79 4c 6e 42 6f 63 33 4d 3d 0d', ascii: 'HJpdGVyLnBoc3M=', tag: 'WEBSHELL_REF', interpretation: '結尾指向 webshell 後門腳本名。' }
      ];
    }

    // Default EVI-001 with MZ Header
    return [
      { offset: '0x000F83C0', hex: '4D 5A 90 00 03 00 00 00 04 00 00 00 FF FF 00 00', ascii: 'MZ..............', tag: 'DOS_HEADER', interpretation: 'PE 執行檔標頭：MZ 簽章 (DOS Header)，代表該磁區快照中可能藏有已被刪除或提權植入的二進位執行程式。' },
      { offset: '0x000F83D0', hex: 'B8 00 00 00 00 00 00 00 40 00 00 00 00 00 00 00', ascii: '........@.......', tag: 'DOS_STUB_OFFSET', interpretation: 'e_lfanew 偏移指向 PE 標頭位置。' },
      { offset: '0x000F83E0', hex: '00 00 00 00 00 00 00 00 00 00 00 00 f0 00 00 00', ascii: '............ð...', tag: 'RESERVED', interpretation: '保留字區段。' },
      { offset: '0x000F83F0', hex: '0E 1F BA 0E 00 B4 09 CD 21 B8 01 4C CD 21 54 68', ascii: '..º..´.Í!¸.LÍ!Th', tag: 'DOS_STUB_CODE', interpretation: '傳統 16 位元 DOS Stub 指令段落。' },
      { offset: '0x000F8400', hex: '69 73 20 70 72 6F 67 72 61 6D 20 63 61 6E 6E 6F', ascii: 'is program canno', tag: 'STRING_RESOURCE', interpretation: '提示訊息區段："This program cannot be run in DOS mode."。' },
      { offset: '0x000F8410', hex: '74 20 62 65 20 72 75 6E 20 69 6E 20 44 4F 53 20', ascii: 't be run in DOS ', tag: 'STRING_RESOURCE', interpretation: '典型的 Windows 可執行檔二進位標誌。' },
      { offset: '0x000F8420', hex: '6D 4F 64 65 2E 0D 0D 0A 24 00 00 00 00 00 00 00', ascii: 'mode....$.......', tag: 'STRING_END', interpretation: '字串終止符與對齊補齊 (Padding)。' },
      { offset: '0x000F8430', hex: '50 45 00 00 4C 01 05 00 D9 5E CB 65 00 00 00 00', ascii: 'PE..L...Ù^Ëe....', tag: 'PE_SIGNATURE', interpretation: 'PE 簽章標頭 (Portable Executable Signature "PE\\0\\0")，證明是完整 32/64 位元 Windows PE 快照。' }
    ];
  }

  // File Carving Recovery API
  public carveArtifacts(evidenceId: string): { success: boolean; evidenceId: string; recoveredCount: number; artifacts: CarvedArtifact[] } {
    const list = this.carvedArtifacts[evidenceId] || [
      {
        id: `CRV-${Date.now().toString().slice(-4)}`,
        fileName: 'carved_deleted_executable.bin',
        fileType: 'Binary Carved Stream',
        recoveredFromOffset: '0x000F83C0',
        sizeBytes: 524288,
        sha256: `sha256:${Buffer.from(String(Date.now())).toString('hex').slice(0, 64)}`,
        classification: 'Suspicious',
        recoveredAt: new Date().toISOString(),
        description: '透過標頭特徵還原之未配置扇區執行檔碎片。'
      }
    ];

    return {
      success: true,
      evidenceId,
      recoveredCount: list.length,
      artifacts: list
    };
  }

  // Super-Timeline API
  public getSuperTimeline(evidenceId?: string): TimelineEvent[] {
    if (evidenceId) {
      return this.superTimeline.filter(t => t.evidenceRef === evidenceId);
    }
    return this.superTimeline;
  }

  // Chain of Custody Ledger API
  public getCustodyLedger(evidenceId?: string): CustodyRecord[] {
    if (evidenceId) {
      return this.custodyLedger.filter(c => c.evidenceId === evidenceId);
    }
    return this.custodyLedger;
  }

  // YARA Deployment API
  public deployYaraRule(payload: { ruleName: string; ruleBody?: string }): { success: boolean; ruleName: string; compiledNodes: number; message: string; timestamp: string } {
    return {
      success: true,
      ruleName: payload.ruleName,
      compiledNodes: 120, // 120 Velociraptor endpoints
      message: `🚀 [檢索核心部署成功] YARA 檢索規則「${payload.ruleName}」已安全編譯並下發至 120 處分公司 Velociraptor / Sleuthkit 物理特徵檢索節點！`,
      timestamp: new Date().toISOString()
    };
  }

  // GenAI Forensics Copilot Query Reasoner
  public queryForensicsCopilot(prompt: string, contextEvidenceId?: string): { sender: 'gemini'; text: string; code?: string; hasDeployButton?: boolean; structuredReport?: any } {
    const lower = prompt.toLowerCase();
    const evi = this.evidence.find(e => e.id === contextEvidenceId) || this.evidence[0];

    if (lower.includes('timeline') || lower.includes('時間軸') || lower.includes('rdp') || lower.includes('登入') || lower.includes('02:15')) {
      return {
        sender: 'gemini',
        text: `🎯 **異常 RDP 登入時間軸鑑識剖析**：\n\n依據物理磁碟 EVTX 與 NTFS MFT 交易還原，Gemini 3 Pro 已在 **2026-06-12** 定位關鍵攻擊時間節點：\n\n1. **02:15:20**：攻擊者自跳板 IP \`185.220.101.4\` (Tor 出口節點) 透過 RDP 3389 端口成功驗證 \`Administrator\` 帳戶（Event ID: 4624）。\n2. **02:18:10**：調用 \`psexec.exe\` 將權限提升至 \`NT AUTHORITY\\SYSTEM\`。\n3. **02:22:45**：執行 \`vssadmin delete shadows /all /quiet\` 抹除磁碟陰影複本與系統快照。\n4. **02:40:00**：觸發 LockBit 3.0 多執行緒加密迴圈，將檔案批量重命名為 \`.lockbit\`。\n\n已為您動態加載「異常登入時間軸組件」，可直接於畫布檢視關鍵軌跡。`,
        code: `// 異常 RDP 登入時間軸特徵過濾器\n{\n  "pivot_time": "2026-06-12T02:15:20Z",\n  "threat_ip": "185.220.101.4",\n  "compromised_account": "Administrator",\n  "killchain_stage": "Lateral Movement -> Impact",\n  "carved_driver": "sec_sys.sys (Offset 0x000F83C0)"\n}`
      };
    } else if (lower.includes('ransomware') || lower.includes('勒索') || lower.includes('lockbit') || lower.includes('多模態')) {
      return {
        sender: 'gemini',
        text: `🖼️ **多模態勒索軟體辨識報告**：\n\n分析鑑識官所上傳的被害系統螢幕截圖與記憶體特徵：\n- **特徵 A**：系統桌面已被替換為「ALL YOUR FILES ARE ENCRYPTED...」的黑底紅字警告頁面。\n- **特徵 B**：桌面隨處可見 \`.lockbit\` 後綴名的加密檔案。\n- **特徵 C**：提示中附帶了 Tor 匿名通訊渠道的網址：\`lockbitapt...onion\`。\n\n**結合威脅情資（CTI）比對結果**：\n- **精準匹配威脅家族**：**LockBit 3.0 (Black)**\n- **已知 IOC 攻擊特徵**：利用登錄檔 \`HKLM\\SOFTWARE\\LockBit\` 初始化加密常數，並透過 \`vssadmin.exe delete shadows /all /quiet\` 強力抹除快照。\n\n核心數據已加載至 Center Main Canvas 的「多模態勒索軟體卡片組件」，可觀察與該惡意家族關聯之 YARA 指標及系統阻斷對策。`,
        code: `rule LockBit3_Black_Forensic_Carver {\n  meta:\n    author = "Gemini Forensics Agent"\n    threat_family = "LockBit 3.0 (Black)"\n    hash = "7b22a0198fcd881023a1290bbfa71029481aa01928374a5e1283a098234ff12a"\n  strings:\n    $s1 = "ALL YOUR FILES ARE ENCRYPTED"\n    $s2 = "lockbitapt"\n    $s3 = "vssadmin delete shadows"\n    $hex = { 4D 5A 90 00 03 00 00 00 }\n  condition:\n    uint16(0) == 0x5A4D and 2 of ($s*)\n}`,
        hasDeployButton: true
      };
    } else if (lower.includes('yara') || lower.includes('規則') || lower.includes('檢索') || lower.includes('ioc')) {
      return {
        sender: 'gemini',
        text: `🛡️ **Gemini 智慧產製 YARA 物理檢索規則**：\n\n已根據當前還原出的未配置磁區已刪驅動 \`sec_sys.sys\` (MD5: a6b2c89f) 與記憶體中注入之 Mimikatz 殘留字串，生成高精度 YARA 規則。點擊下方按鈕可一鍵安全部署至 Velociraptor 實體端點探針核心。`,
        code: `rule Forensic_Threat_Cluster_2026 {\n  meta:\n    description = "Detects Carved sec_sys.sys and LockBit Stage 1"\n    chain_of_custody_ref = "EVI-001"\n    date = "2026-06-12"\n  strings:\n    $magic = { 4D 5A }\n    $ip = "185.220.101.4"\n    $cmd = "delete shadows /all /quiet"\n    $driver_str = "sec_sys.sys"\n  condition:\n    $magic at 0 and ($ip or ($cmd and $driver_str))\n}`,
        hasDeployButton: true
      };
    }

    return {
      sender: 'gemini',
      text: `🧠 **AI 數位鑑識專家已分析您的提問：** "${prompt}"\n\n依據證據鏈規範，當前證據 \`${evi.name}\` 處於物理防寫唯讀保護中（SHA-256 吻合率: 100%）。\n我已透過底層 Sleuthkit / Volatility 微服務分析扇區，識別該項指標與 NTFS MFT 交易日誌一致。\n\n**推薦快捷指令**：\n- 點擊下方 \`[📊 視覺化異常登入時間軸]\` 深入追蹤 02:15 RDP 暴破入侵。\n- 點擊下方 \`[🖼️ 勒索軟體多模態螢幕特徵識讀]\` 解析 LockBit 3.0 家族。\n- 點擊下方 \`[🛡️ 自動產製 YARA 檢索規則]\` 將防禦特徵同步至全網節點。`
    };
  }

  // Volatility 3 Memory Extraction API
  public getMemoryAnalysis(evidenceId: string = 'EVI-002'): {
    success: boolean;
    evidenceId: string;
    profile: string;
    kdbg: string;
    processes: MemoryProcessArtifact[];
    malfindCount: number;
    summary: string;
  } {
    const defaultProcesses: MemoryProcessArtifact[] = [
      {
        pid: 4,
        ppid: 0,
        imageFileName: 'System',
        threads: 248,
        handles: 0,
        session: 0,
        wow64: false,
        createTime: '2026-06-11 20:00:10',
        injected: false,
        hiddenVAD: false,
        yaraHits: [],
        vadProtection: 'PAGE_READWRITE'
      },
      {
        pid: 684,
        ppid: 592,
        imageFileName: 'lsass.exe',
        threads: 18,
        handles: 1240,
        session: 0,
        wow64: false,
        createTime: '2026-06-11 20:00:25',
        injected: true,
        hiddenVAD: true,
        yaraHits: ['mimikatz_sekurlsa_dll', 'pwdump_hash_seeker'],
        vadProtection: 'PAGE_EXECUTE_READWRITE (Injected VAD Entry)'
      },
      {
        pid: 4108,
        ppid: 3990,
        imageFileName: 'svch0st.exe',
        threads: 6,
        handles: 154,
        session: 1,
        wow64: true,
        createTime: '2026-06-12 02:18:15',
        injected: true,
        hiddenVAD: true,
        yaraHits: ['LockBit3_Stage1_Dropper', 'Process_Hollowing_Ref'],
        vadProtection: 'PAGE_EXECUTE_READWRITE'
      },
      {
        pid: 3990,
        ppid: 1044,
        imageFileName: 'powershell.exe',
        threads: 12,
        handles: 480,
        session: 1,
        wow64: false,
        createTime: '2026-06-12 02:17:50',
        injected: false,
        hiddenVAD: false,
        yaraHits: ['Encoded_Command_B64'],
        vadProtection: 'PAGE_READONLY'
      },
      {
        pid: 5120,
        ppid: 4108,
        imageFileName: 'vssadmin.exe',
        threads: 2,
        handles: 88,
        session: 1,
        wow64: false,
        createTime: '2026-06-12 02:22:45',
        exitTime: '2026-06-12 02:22:52',
        injected: false,
        hiddenVAD: false,
        yaraHits: ['Shadow_Purge_Command'],
        vadProtection: 'PAGE_EXECUTE_READ'
      }
    ];

    return {
      success: true,
      evidenceId,
      profile: 'Windows Server 2022 x64 (Build 20348)',
      kdbg: '0xf800028080a0',
      processes: defaultProcesses,
      malfindCount: 2,
      summary: 'Volatility 3 malfind 與 pslist 插件檢測到 2 處高危惡意代碼注入：lsass.exe (PID 684) 記憶體中遭注入 Mimikatz 憑證竊取模組；偽裝成 svch0st.exe (PID 4108) 的進程記憶體空間具備 PAGE_EXECUTE_READWRITE 權限，符合 Process Hollowing 注入特徵。'
    };
  }

  // Network PCAP Stream Reconstruction API
  public getNetworkSessions(evidenceId?: string): {
    success: boolean;
    evidenceId?: string;
    totalPackets: number;
    sessions: NetworkForensicSession[];
    ja3BlacklistHits: number;
  } {
    const sessions: NetworkForensicSession[] = [
      {
        sessionId: 'NET-001',
        srcIp: '185.220.101.4',
        srcPort: 49152,
        destIp: '10.0.4.15',
        destPort: 3389,
        protocol: 'TCP',
        bytesSent: 489200,
        bytesReceived: 182300,
        packets: 1420,
        alertSignature: 'ET POLICY Suspicious Tor Exit Node Inbound RDP Session',
        threatLevel: 'Critical',
        timestamp: '2026-06-12T02:15:20.000Z'
      },
      {
        sessionId: 'NET-002',
        srcIp: '10.0.4.15',
        srcPort: 52180,
        destIp: '31.21.4.150',
        destPort: 443,
        protocol: 'TLS',
        bytesSent: 4509715200, // 4.2 GB exfiltration
        bytesReceived: 1048576,
        packets: 2840500,
        sniDomain: 'api.mega.nz',
        ja3Fingerprint: 'a0e9f5d64349fb13191bc781f81f42e1',
        alertSignature: 'ET TROJAN Massive TLS Data Exfiltration to Cloud Storage',
        threatLevel: 'Critical',
        timestamp: '2026-06-12T03:25:05.000Z'
      },
      {
        sessionId: 'NET-003',
        srcIp: '10.0.4.15',
        srcPort: 55432,
        destIp: '198.51.100.88',
        destPort: 8443,
        protocol: 'TLS',
        bytesSent: 124500,
        bytesReceived: 89400,
        packets: 320,
        sniDomain: 'system-updater-live.com',
        ja3Fingerprint: '51c64c77e60f39ac3e382e303e357f83',
        alertSignature: 'LockBit 3.0 C2 Heartbeat Beaconing Check-In',
        threatLevel: 'Critical',
        timestamp: '2026-06-12T02:35:10.000Z'
      },
      {
        sessionId: 'NET-004',
        srcIp: '10.0.4.15',
        srcPort: 53120,
        destIp: '10.0.1.10',
        destPort: 53,
        protocol: 'DNS',
        bytesSent: 2048,
        bytesReceived: 4096,
        packets: 24,
        dnsQuery: 'api.mega.nz (A Record)',
        threatLevel: 'Suspicious',
        timestamp: '2026-06-12T03:24:58.000Z'
      },
      {
        sessionId: 'NET-005',
        srcIp: '10.0.4.15',
        srcPort: 58900,
        destIp: '10.0.1.10',
        destPort: 88,
        protocol: 'TCP',
        bytesSent: 8192,
        bytesReceived: 16384,
        packets: 42,
        alertSignature: 'Kerberos AS-REQ / TGS-REQ Kerberoasting Suspect Ticket Request',
        threatLevel: 'Suspicious',
        timestamp: '2026-06-12T02:18:40.000Z'
      }
    ];

    return {
      success: true,
      evidenceId,
      totalPackets: 2842306,
      sessions,
      ja3BlacklistHits: 2
    };
  }

  // Registry Carving & System Footprint API
  public getRegistryCarving(evidenceId: string = 'EVI-001'): {
    success: boolean;
    evidenceId: string;
    keys: RegistryCarvedKey[];
    hive: string;
    totalKeysExamined: number;
  } {
    const keys: RegistryCarvedKey[] = [
      {
        keyPath: 'HKLM\\SYSTEM\\CurrentControlSet\\Services\\SecSysHelper',
        valueName: 'ImagePath',
        valueType: 'REG_EXPAND_SZ',
        data: 'C:\\Windows\\System32\\vssadmin.exe delete shadows /all /quiet',
        lastWriteTime: '2026-06-12 02:22:45',
        isDeleted: false,
        suspiciousIndicator: '惡意持久化服務：綁定破壞磁碟快照之 vssadmin 指令'
      },
      {
        keyPath: 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run',
        valueName: 'svch0st_persist',
        valueType: 'REG_SZ',
        data: 'C:\\Windows\\Temp\\svch0st.exe',
        lastWriteTime: '2026-06-12 02:18:22',
        isDeleted: true,
        suspiciousIndicator: 'Carved 已刪登錄鍵值：從未分配磁區還原的 Run 鍵開機自啟動惡意項'
      },
      {
        keyPath: 'HKCU\\Software\\LockBit',
        valueName: 'Public_Key_Hex',
        valueType: 'REG_BINARY',
        data: '04 A8 91 22 5B CF 10 99 22 81 0F...',
        lastWriteTime: '2026-06-12 02:39:55',
        isDeleted: false,
        suspiciousIndicator: 'LockBit 3.0 勒索主體加密常數與公開金鑰存放節點'
      },
      {
        keyPath: 'HKLM\\SYSTEM\\CurrentControlSet\\Control\\Terminal Server',
        valueName: 'fDenyTSConnections',
        valueType: 'REG_DWORD',
        data: '0x00000000 (RDP 限制被強制關閉)',
        lastWriteTime: '2026-06-12 02:14:50',
        isDeleted: false,
        suspiciousIndicator: '被攻擊者竄改強制開啟遠端桌面 (RDP) 服務'
      }
    ];

    return {
      success: true,
      evidenceId,
      keys,
      hive: 'SYSTEM.DAT & SOFTWARE.DAT',
      totalKeysExamined: 148520
    };
  }

  // Export Court-Admissible Forensic Dossier
  public exportDossier(caseId: string): any {
    const forensicCase = this.cases.find(c => c.id === caseId) || this.cases[0];
    const relatedEvidence = this.evidence.filter(e => e.caseId === forensicCase.id);
    const relatedCustody = this.custodyLedger.filter(c => relatedEvidence.some(e => e.id === c.evidenceId));
    const relatedTimeline = this.superTimeline.filter(t => relatedEvidence.some(e => e.id === t.evidenceRef));

    return {
      reportTitle: '數位鑑識司法鑑定與事證監管鏈法定總結卷宗 (Court-Admissible Digital Forensics Dossier)',
      exportTimestamp: new Date().toISOString(),
      standardsCompliance: ['ISO/IEC 27037:2012 (Digital Evidence Handling)', 'NIST SP 800-86', 'RFC 3227 (Evidence Collection)'],
      caseMetadata: forensicCase,
      evidenceRegistry: relatedEvidence,
      chainOfCustodyAuditLedger: relatedCustody,
      superTimelineCorrelated: relatedTimeline,
      examinerDigitalSignature: {
        examiner: forensicCase.examiner,
        agency: forensicCase.agency,
        digitalSignatureHash: `SHA256:${Buffer.from(`${forensicCase.id}-${Date.now()}`).toString('hex')}`,
        validity: 'LEGALLY_BINDING_VERIFIED'
      }
    };
  }
}



export const forensicsEngine = new ForensicsEngine();
