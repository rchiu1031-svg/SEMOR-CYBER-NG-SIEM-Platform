import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Bot, 
  Server, 
  Globe, 
  Database, 
  Activity, 
  Terminal, 
  Network, 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  Search, 
  FileText, 
  AlertTriangle, 
  Zap, 
  Check, 
  RefreshCw,
  Cpu,
  Lock,
  Key,
  HardDrive,
  Copy,
  Download,
  Flame,
  Radio,
  FileSpreadsheet,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { cn } from '../lib/utils';

// Comprehensive Intelligence Data for the three incidents
const INCIDENT_DATA: Record<string, {
  id: string;
  title: string;
  titleZh: string;
  severity: 'Critical' | 'High' | 'Medium';
  time: string;
  timeZh: string;
  status: string;
  statusZh: string;
  summaryEn: string;
  summaryZh: string;
  engineStatus: string;
  gpuUsage: string;
  vram: string;
  inferenceLatency: string;
  contextTokens: string;
  nodes: Array<{
    id: string;
    label: string;
    labelZh: string;
    type: 'Attacker' | 'Gateway' | 'Service' | 'Target' | 'Bridge' | 'Network' | 'Identity' | 'Host' | 'Archive';
    ip: string;
    details: string;
    detailsZh: string;
    status: 'compromised' | 'active' | 'blocking' | 'alerting';
  }>;
  connections: Array<{
    from: string;
    to: string;
    label: string;
    labelZh: string;
    protocol: string;
    status: 'breached' | 'flowing' | 'blocked';
  }>;
  findings: string[];
  findingsZh: string[];
  recommendations: string[];
  recommendationsZh: string[];
  logs: Array<{
    time: string;
    source: string;
    level: 'info' | 'warn' | 'error' | 'critical';
    message: string;
    messageZh?: string;
  }>;
  flows: Array<{
    time: string;
    src: string;
    srcPort: number;
    dst: string;
    dstPort: number;
    proto: string;
    pkts: number;
    volume: string;
    score: number;
    status: 'Anomaly' | 'Suspicious' | 'Normal';
  }>;
  cti: {
    threatGroup: string;
    threatGroupZh?: string;
    actorCountry: string;
    actorCountryZh: string;
    confidence: string;
    confidenceZh: string;
    targetSectors: string;
    targetSectorsZh: string;
    tactics: string[];
    tacticsZh: string[];
    threatIndex: number;
    cvssScore: number;
    iocs: Array<{ type: string; typeZh: string; value: string; desc: string; descZh: string }>;
  };
  ttps: Array<{
    id: string;
    name: string;
    nameZh: string;
    phase: string;
    phaseZh: string;
    technique: string;
    techniqueZh: string;
    description: string;
    descriptionZh: string;
  }>;
  timeline: Array<{
    time: string;
    title: string;
    titleZh: string;
    description: string;
    descriptionZh: string;
    severity: 'critical' | 'warn' | 'info';
  }>;
  affectedAssets: Array<{ name: string; ip: string; role: string; roleZh: string; status: 'compromised' | 'at-risk' | 'safe' }>;
}> = {
  'R-001': {
    id: 'R-001',
    title: 'Brute Force Attack on SSH',
    titleZh: '針對 SSH 連接埠的暴力破解與權限突破',
    severity: 'High',
    time: '10 mins ago',
    timeZh: '10 分鐘前',
    status: 'Completed',
    statusZh: '研判完成',
    summaryEn: 'Based on the analyzed telemetry from Traefik ingress and host SSH daemons, I have identified a massive, distributed brute-force attempt originating from malicious Tor exit nodes. The attacker cycled through 1,200+ default passwords over 2 minutes, successfully hijacking the deployer account and installing a persistent SSH authorized key backend.',
    summaryZh: '根據分析來自 Traefik 入口閘道與主機 SSH 守護進程的觀測數據，我們識別出一起源自惡意 Tor 節點的大規模分散式暴力破解行為。攻擊者在 2 分鐘內輪詢嘗試了超過 1,200 次默認與高頻密碼庫，最終成功猜解 deployer 管理帳戶，並在主機核心寫入了帶有後門特性的 SSH authorized_keys 配置以進行持久化控制。',
    engineStatus: 'Ollama / Llama-3-8B-Instruct',
    gpuUsage: '45%',
    vram: '6.2 GB / 16 GB',
    inferenceLatency: '142ms',
    contextTokens: '8.4k / 128k',
    nodes: [
      { id: 'n1', label: 'Attacker C2', labelZh: '威脅源 C2 主機', type: 'Attacker', ip: '185.234.219.82', details: 'Malicious Server (Russia VPN / Tor Exit)', detailsZh: '惡意跳板伺服器 / 黑名單 Tor 節點 (俄羅斯 VPN)', status: 'compromised' },
      { id: 'n2', label: 'Traefik Proxy', labelZh: '邊界 Traefik 代理', type: 'Gateway', ip: '10.10.1.5', details: 'Ingress Web/SSH Proxy Gateway', detailsZh: '容器邊界流量調度與負載平衡閘道器', status: 'active' },
      { id: 'n3', label: 'SSH Auth Svc', labelZh: 'SSH 驗證服務', type: 'Service', ip: '10.10.12.3', details: 'System SSH Daemon Thread', detailsZh: '系統主機 SSHD 連線管理常駐線程', status: 'alerting' },
      { id: 'n4', label: 'Prod-Web-01', labelZh: '生產網頁主機 01', type: 'Target', ip: '10.10.12.31', details: 'Target Linux Web Host Container', detailsZh: '網頁前端的核心 Linux 主機容器 (失陷節點)', status: 'compromised' }
    ],
    connections: [
      { from: 'n1', to: 'n2', label: 'Brute force traffic', labelZh: '暴力破解洪流', protocol: 'TCP/22 (SSH)', status: 'flowing' },
      { from: 'n2', to: 'n3', label: 'Forward handshake', labelZh: '重導驗證訊號', protocol: 'TCP/22', status: 'flowing' },
      { from: 'n3', to: 'n4', label: 'Deploy backdoor key', labelZh: '部屬後門公鑰', protocol: 'Local Write', status: 'breached' }
    ],
    findings: [
      "Detected 1,500+ authentication failures within 120 seconds",
      "Credential matching for admin user accounts failed, succeeded on administrative user 'deployer'",
      "Authorized keys file modified at /home/deployer/.ssh/authorized_keys"
    ],
    findingsZh: [
      "在 120 秒內偵測到多達 1,500+ 次 SSH 連線密碼查驗失敗日誌",
      "使用者憑證嘗試主要針對 root/admin 帳戶，最後在 deployer 管理帳戶突破成功",
      "受侵害主機上的 /home/deployer/.ssh/authorized_keys 持久化公鑰配置已被強行寫入"
    ],
    recommendations: [
      "Instantly block source IP 185.234.219.82 at the network boundary firewall level.",
      "Enforce publickey-only authentication on SSH daemon configuring /etc/ssh/sshd_config.",
      "Isolate host Prod-Web-01 and trigger file integrity check on deployer directory."
    ],
    recommendationsZh: [
      "立即在邊界防火牆與 WAF 全面性封鎖來源 IP 185.234.219.82 的任何連入通訊。",
      "修改 /etc/ssh/sshd_config 停用所有密碼驗證形式，強制落實 SSH 金鑰對查驗（Publickey-only）。",
      "對 Prod-Web-01 Linux 主機執行邏輯網路隔離，並啟動 deployer 家目錄整合性稽核。"
    ],
    logs: [
      { time: '19:40:02', source: 'sshd[12042]', level: 'warn', message: 'Invalid user admin from 185.234.219.82 port 51234 ssh2', messageZh: '來自 185.234.219.82:51234 的無效使用者 admin 嘗試' },
      { time: '19:40:05', source: 'sshd[12045]', level: 'warn', message: 'Invalid user root from 185.234.219.82 port 51240 ssh2', messageZh: '來自 185.234.219.82:51240 的無效使用者 root 嘗試' },
      { time: '19:40:15', source: 'sshd[12051]', level: 'critical', message: 'pam_unix(sshd:auth): authentication failure; user=root rhost=185.234.219.82', messageZh: 'pam 認證失敗：使用者 root，來源 185.234.219.82' },
      { time: '19:41:22', source: 'sshd[12110]', level: 'info', message: 'Received disconnect from 185.234.219.82 port 51280:11: Bye Bye [preauth]', messageZh: '收到來自 185.234.219.82 的中斷連線訊號 [preauth]' },
      { time: '19:42:01', source: 'sshd[12322]', level: 'critical', message: 'Accepted password for deployer from 185.234.219.82 port 52332 ssh2', messageZh: '成功驗證使用者 deployer 的密碼 (來源 185.234.219.82:52332)' },
      { time: '19:42:05', source: 'systemd', level: 'info', message: 'New session 184 of user deployer.', messageZh: '為使用者 deployer 建立新會話 Session 184' },
      { time: '19:42:15', source: 'bash[12431]', level: 'critical', message: 'deployer@Prod-Web-01:~$ echo "ssh-rsa AAAAB3NzaC1yc..." >> ~/.ssh/authorized_keys', messageZh: '向 ~/.ssh/authorized_keys 追加寫入惡意公鑰' }
    ],
    flows: [
      { time: '19:40:00', src: '185.234.219.82', srcPort: 51234, dst: '10.10.1.5', dstPort: 22, proto: 'TCP', pkts: 4, volume: '256B', score: 85, status: 'Suspicious' },
      { time: '19:40:12', src: '185.234.219.82', srcPort: 51240, dst: '10.10.1.5', dstPort: 22, proto: 'TCP', pkts: 18, volume: '9.2KB', score: 92, status: 'Anomaly' },
      { time: '19:41:05', src: '185.234.219.82', srcPort: 51280, dst: '10.10.1.5', dstPort: 22, proto: 'TCP', pkts: 42, volume: '24.5KB', score: 98, status: 'Anomaly' },
      { time: '19:42:01', src: '185.234.219.82', srcPort: 52332, dst: '10.10.1.5', dstPort: 22, proto: 'TCP', pkts: 312, volume: '184.2KB', score: 99, status: 'Anomaly' }
    ],
    cti: {
      threatGroup: 'APT29 (Cozy Bear) / UNC2452',
      threatGroupZh: 'APT29 (舒適熊 / 俄羅斯對外情報局 SVR)',
      actorCountry: 'Russia (State-Sponsored)',
      actorCountryZh: '俄羅斯 (國家級網軍贊助)',
      confidence: 'High (89%)',
      confidenceZh: '高置信度 (89%)',
      targetSectors: 'Governments, Telecoms, Cloud Services providers, Defense Services',
      targetSectorsZh: '政府機關、電信營運商、雲端服務供應商、國防承包商',
      tactics: ['Credential Stuffing', 'Password Spraying', 'Backdoor Deployment', 'In-memory beacons'],
      tacticsZh: ['憑證撞庫攻擊', '密碼噴灑 (Password Spraying)', '後門持久化公鑰部署', '記憶體 Beacons 植入'],
      threatIndex: 94,
      cvssScore: 8.8,
      iocs: [
        { type: 'IPv4 Address', typeZh: '惡意 IPv4 位址', value: '185.234.219.82', desc: 'Active Cozy Bear C2 IP Address node', descZh: '活躍的 Cozy Bear 外部 C2 跳板節點' },
        { type: 'Key Fingerprint', typeZh: '公鑰特徵碼', value: 'SHA256:6eef88cd0a89d311b512c0199f7...', desc: 'Compromised SSH public key deployed inside systems', descZh: '已被注入至受害主機中的非授權 SSH 公鑰指紋' },
        { type: 'Adversary Domain', typeZh: '攻擊者網域', value: 'office-update-microsoft.host', desc: 'Primary exfiltration dynamic domain name', descZh: '假冒微軟更新的動態外流 C2 域名' }
      ]
    },
    ttps: [
      { id: 'T1110.001', name: 'Brute Force: Password Guessing', nameZh: '暴力破解：密碼字典猜解', phase: 'Initial Access', phaseZh: '初始存取', technique: 'Using dictionary to guess user password', techniqueZh: '利用高頻字典庫對 SSH 端點發起自動化猜解', description: 'Attackers systematically try password lists directly on SSH endpoints.', descriptionZh: '攻擊者通過字典庫，針對開放中的 SSH 端口頻繁發起自動化連線嘗試。' },
      { id: 'T1021.004', name: 'SSH Protocol Connection', nameZh: 'SSH 通訊協定連線', phase: 'Lateral Movement', phaseZh: '橫向移動', technique: 'Accessing terminal remotely using SSH', techniqueZh: '藉由獲取的合法帳密建立加密互動 Shell', description: 'Once password accepted, admin SSH session established securely.', descriptionZh: '憑證猜解獲取後，藉由對應加密通道開啟系統 Shell 互動。' },
      { id: 'T1098.004', name: 'Account Manipulation: SSH Authorized Keys', nameZh: '帳戶操控：寫入 SSH 信任公鑰', phase: 'Persistence', phaseZh: '持久化控制', technique: 'Appending rogue keys backdooring profiles', techniqueZh: '將攻擊者公鑰附加至 authorized_keys 檔案中', description: 'Adding custom public key metadata directly into user keys for permanent access.', descriptionZh: '將攻擊者私鑰配對的公鑰字串注入配置檔案，繞過常規密碼更改審計。' }
    ],
    timeline: [
      { time: '19:40:02', title: 'Intrusion Commenced', titleZh: '暴力破解行為啟動', description: 'SSH Bruteforce scanning from Russian C2 node network targeted to boundary proxy server core.', descriptionZh: '源自俄羅斯 C2 節點的 SSH 暴力破解高頻掃描，主要指向邊界負載調度閘道。', severity: 'info' },
      { time: '19:41:22', title: 'Volume Amplified', titleZh: '破解併發力度飆升', description: 'Security alert triggered: SSH connection rate on Gateway over 300 requests per unit minutes limit.', descriptionZh: '安全引擎發送警示：SSH 連線速率在幾分鐘內達到正常峰值的 15 倍。', severity: 'warn' },
      { time: '19:42:01', title: 'Access Success', titleZh: '帳戶猜解突入成功', description: 'SSHD accepted valid credential set for deployer administrative service account on Prod-Web-01.', descriptionZh: 'SSHD 認證接受了管理員配屬的 deployer 本機服務帳戶密碼，建立正式終端。', severity: 'critical' },
      { time: '19:42:15', title: 'Backdoor Appended', titleZh: '後門公鑰部署完成', description: 'Bash system operations recorded modifying localized ssh/authorized_keys persistence file structures.', descriptionZh: '本機 Bash 指令對主管持久化配置之 .ssh/authorized_keys 進行非法附加寫入。', severity: 'critical' }
    ],
    affectedAssets: [
      { name: 'Prod-Web-01', ip: '10.10.12.31', role: 'Frontend App Server', roleZh: '前端網頁應用伺服器', status: 'compromised' },
      { name: 'Traefik-Ingress-01', ip: '10.10.1.5', role: 'Boundary Gateway', roleZh: '邊界負載調度閘道', status: 'at-risk' },
      { name: 'Deployer Service Account', ip: 'IAM:deployer', role: 'Admin IAM User', roleZh: '系統部署管理者帳號', status: 'compromised' }
    ]
  },
  'R-002': {
    id: 'R-002',
    title: 'Suspicious Lateral Movement',
    titleZh: '內部高度可疑的橫向移動與特權提權行為',
    severity: 'Critical',
    time: '1 hour ago',
    timeZh: '1 小時前',
    status: 'Completed',
    statusZh: '研判完成',
    summaryEn: 'An active lateral intrusion was caught following the initial compromise of Prod-Web-01. Using compromised administrative passwords, the attacker scanned database and directory namespaces on subnet VLAN-10. Leveraging specialized LDAP replica querying, the actor successfully extracted Kerberoasting service hashes to target client production databases.',
    summaryZh: '在一併追蹤 Prod-Web-01 的初次失陷後，我們在內網捕捉到了猖獗的橫向滲透行為。威脅主體調用了先前獲取的 deployer 特權，在 VLAN-10 分段內對資料庫與目錄服務進行大規模網路探測。透過對 LDAP 備份節點發起精準對象遍歷，成功攫取了包含 Kerberos 在內的敏感認證雜湊，並橫向進駐了核心 PostgreSQL 生產集群。',
    engineStatus: 'Ollama / Llama-3-8B-Instruct',
    gpuUsage: '58%',
    vram: '7.1 GB / 16 GB',
    inferenceLatency: '156ms',
    contextTokens: '11.2k / 128k',
    nodes: [
      { id: 'n1', label: 'Prod-Web-01 (Compromised)', labelZh: '受控主機 Prod-Web-01', type: 'Bridge', ip: '10.10.12.31', details: 'Pivot source with compromise legacy', detailsZh: '已被攻陷的前端網頁主機 / 橫向發起原點', status: 'compromised' },
      { id: 'n2', label: 'VLAN-10 Router', labelZh: '區域內網 VLAN-10 路由', type: 'Network', ip: '10.10.10.1', details: 'Core Switch Routing Segment', detailsZh: '內網劃分核心虛擬路由交換網段', status: 'active' },
      { id: 'n3', label: 'ldap-replica-01', labelZh: '高安全 LDAP 目錄節點', type: 'Identity', ip: '10.10.42.5', details: 'Containerized Active Directory replica', detailsZh: '負責承載全域身分查證的 LDAP 副本快取', status: 'alerting' },
      { id: 'n4', label: 'PostgreSQL Prod', labelZh: 'PostgreSQL 生產集群', type: 'Target', ip: '10.10.42.10', details: 'Client Ledger Database Storage', detailsZh: '承載完整客戶交易與金融帳目的資料庫主叢集', status: 'compromised' }
    ],
    connections: [
      { from: 'n1', to: 'n2', label: 'Internal Scan & Sweep', labelZh: '探測與內網橫掃', protocol: 'TCP Sync (389,5432)', status: 'flowing' },
      { from: 'n2', to: 'n3', label: 'LDAP Query Bind', labelZh: '身分查詢與繫結', protocol: 'LDAP (389)', status: 'flowing' },
      { from: 'n2', to: 'n4', label: 'Rogue Admin SQL Login', labelZh: '非授權管理資料庫登入', protocol: 'PostgreSQL (5432)', status: 'breached' }
    ],
    findings: [
      "Malicious automated network port scanning initiated from internal node 10.10.12.31",
      "Active Directory LDAP directory queried requesting system services principal accounts mapping",
      "Kerberos Ticket-Granting-Service (TGS) requesting patterns matching Kerberoasting lateral TTP"
    ],
    findingsZh: [
      "在內部伺服器 10.10.12.31 精準發起橫跨內網 5432 與 389 連接埠的主動式網路探測",
      "以特定身分查詢 LDAP 套件，遍歷系統內所有關聯管理服務主體（Principal Accounts）",
      "監測到異常提取 Kerberos 服務票據（TGS）並藉此針對 Core PostgreSQL 進程成功建立連線"
    ],
    recommendations: [
      "Immediately rotate passwords for all Active Directory and LDAP admin reader services.",
      "Shut down system active directory Kerberos RC4 cryptographic configurations.",
      "Block TCP port 5432 communication originating from the front-end Prod-Web-01 subnet."
    ],
    recommendationsZh: [
      "即刻強制輪換（Rotate）全域 Active Directory 目錄服務與內部 LDAP 認證讀取代理帳號密碼。",
      "停用 Kerberos 內部非安全 RC4 加密等級算法，全面提升憑證加密抗雜湊強度模型。",
      "在網路隔離層（Security Group）徹底阻斷任何源於 10.10.12.31（網頁端前台）對資料庫的 direct 連線能力。"
    ],
    logs: [
      { time: '18:15:20', source: 'sudo[14820]', level: 'warn', message: 'deployer : TTY=pts/0 ; COMMAND=/usr/bin/nmap -sS -p 389,5432 10.10.42.0/24', messageZh: 'deployer 執行 sudo nmap 探測 10.10.42.0/24 端口 389,5432' },
      { time: '18:16:01', source: 'ldap-srv[332]', level: 'info', message: 'Conn 2042 IP=10.10.12.31:38192 bind (simple) DN="cn=reader,cn=users,dc=prod" - Accepted', messageZh: 'LDAP 服務接受來自 10.10.12.31 的 reader 帳戶繫結請求' },
      { time: '18:16:11', source: 'ldap-srv[332]', level: 'critical', message: 'Search DN="cn=users,dc=prod" filter="(&(objectClass=user)(userAccountControl:1.2.840.113556.1.4.803:=262144))" - 42 records returned', messageZh: 'LDAP 遍歷搜尋特權服務帳號，回傳 42 筆記錄' },
      { time: '18:17:30', source: 'postgres[983]', level: 'error', message: '[3-1] user=admin_replica host=10.10.12.31 FATAL: password authentication failed', messageZh: 'Postgres 使用者 admin_replica 密碼驗證失敗' },
      { time: '18:17:45', source: 'postgres[990]', level: 'critical', message: '[4-1] user=postgres db=sales_ledger host=10.10.12.31 Connection established via cloned GSS/Kerberos ticket', messageZh: '使用偽造的 Kerberos 票據成功建立 Postgres 連線' }
    ],
    flows: [
      { time: '18:15:20', src: '10.10.12.31', srcPort: 49923, dst: '10.10.42.5', dstPort: 389, proto: 'TCP', pkts: 254, volume: '16.2KB', score: 78, status: 'Suspicious' },
      { time: '18:16:01', src: '10.10.12.31', srcPort: 38192, dst: '10.10.42.5', dstPort: 389, proto: 'LDAP', pkts: 84, volume: '45.1KB', score: 86, status: 'Suspicious' },
      { time: '18:17:30', src: '10.10.12.31', srcPort: 40232, dst: '10.10.42.10', dstPort: 5432, proto: 'TCP', pkts: 3, volume: '120B', score: 91, status: 'Anomaly' },
      { time: '18:17:45', src: '10.10.12.31', srcPort: 40235, dst: '10.10.42.10', dstPort: 5432, proto: 'PostgreSQL', pkts: 1220, volume: '3.4MB', score: 99, status: 'Anomaly' }
    ],
    cti: {
      threatGroup: 'Sandworm (Russian GRU Unit 74455)',
      threatGroupZh: 'Sandworm (沙蟲 / 俄羅斯軍事情報總局 GRU 74455 部隊)',
      actorCountry: 'Russia (State-Sponsored)',
      actorCountryZh: '俄羅斯 (國家級軍事情報局贊助)',
      confidence: 'High (84%)',
      confidenceZh: '高置信度 (84%)',
      targetSectors: 'Energy Grids, Governments, Financial Databases, Critical infrastructure',
      targetSectorsZh: '能源電網、政府機關、金融資料庫、關鍵基礎設施',
      tactics: ['Kerberoasting', 'Active Directory Extraction', 'Service Impersonation', 'Local Privilege Abuse'],
      tacticsZh: ['Kerberoasting 票據竊取', 'Active Directory 目錄遍歷', '服務身分假冒', '本地權限濫用'],
      threatIndex: 96,
      cvssScore: 9.2,
      iocs: [
        { type: 'Internal Pivot', typeZh: '內部跳板主機', value: '10.10.12.31', desc: 'Compromised web server utilized as internal launch-pad', descZh: '已被攻陷的前端網頁伺服器，被用作內網滲透發射台' },
        { type: 'ELF Malware Payload', typeZh: '惡意記憶體載荷', value: '/tmp/.memfd_payload', desc: 'Linux Cobalt Strike beacon wrapper running in virtual memory', descZh: '於 Linux 虛擬記憶體中常駐運行的 Cobalt Strike Beacon' },
        { type: 'Target Token MD5', typeZh: '身分認證權杖雜湊', value: 'a0f8b1c4dbec7288a10986161be01c51', desc: 'Active session credentials extracted', descZh: '被惡意導出的作用中會話憑證雜湊值' }
      ]
    },
    ttps: [
      { id: 'T1046', name: 'Network Service Discovery', nameZh: '網路服務探索', phase: 'Discovery', phaseZh: '環境探索', technique: 'Host internal port check targeted to port 389/5432', techniqueZh: '針對 389 (LDAP) 與 5432 (Postgres) 連接埠進行掃描', description: 'Attacker leverages automated network scripts to discover active core network endpoints.', descriptionZh: '利用自動化本機腳本遍歷特定連接埠，搜尋可進行高價值存取的內網系統。' },
      { id: 'T1558.003', name: 'Kerberoasting', nameZh: 'Kerberoasting 票據離線破解', phase: 'Credential Access', phaseZh: '憑證存取', technique: 'Extracting service tickets for offline password cracking', techniqueZh: '請求服務票據（TGS）並提取密碼雜湊', description: 'Attackers extract Active Directory hashes directly to hijack DB permissions.', descriptionZh: '對 AD 目錄對象發起特殊查詢，以提取帶有管理員關聯特權的登入票據。' },
      { id: 'T1021.006', name: 'Lateral Remote Login', nameZh: '橫向遠端登入', phase: 'Lateral Movement', phaseZh: '橫向移動', technique: 'Accessing core databases via forged administrative tokens', techniqueZh: '使用偽造的管理員憑證連接核心資料庫', description: 'Executing database remote connections using parsed service tickets.', descriptionZh: '結合獲取的身分票據，不發起暴力破解，直接進行身分假冒形式的內部對接。' }
    ],
    timeline: [
      { time: '18:15:20', title: 'Internal Reconnaissance', titleZh: '內網偵查探測', description: 'Host utility executed local Nmap network scanning targeted into LDAP and Postgres service addresses.', descriptionZh: '受侵害前端主機下發本機提權指令，針對認證區段網段實施細粒度連接埠偵查。', severity: 'info' },
      { time: '18:16:01', title: 'AD / LDAP Encroachment', titleZh: '目錄身分服務非法獲取', description: 'Attacker established bindings with Active Directory replicas mapping key administrative users.', descriptionZh: '攻擊者通過認證綁定突入備用 LDAP 目錄，讀取了包括特權服務組在內的多項對象架構。', severity: 'warn' },
      { time: '18:17:30', title: 'SQL Session Attempt', titleZh: '資料庫通道探索驗證', description: 'Attempted connections with high privileges observed on production PostgreSQL databases.', descriptionZh: '核心生產 PostgreSQL 數據庫爆發基於 admin_replica 被拒的異常連線事件。', severity: 'warn' },
      { time: '18:17:45', title: 'Session Breached', titleZh: '資料庫核心完成横向突破', description: 'Successful lateral login inside DB sales_ledger was registered using Kerberos service certificate credentials.', descriptionZh: '使用偽造的 Kerberos 票據在 184 號會話中成功認證進 database 內網並開始高頻查詢。', severity: 'critical' }
    ],
    affectedAssets: [
      { name: 'ldap-replica-01', ip: '10.10.42.5', role: 'Active Directory Replica', roleZh: 'AD 目錄身分副本節點', status: 'at-risk' },
      { name: 'PostgreSQL-Prod-01', ip: '10.10.42.10', role: 'Core Ledger Database', roleZh: '核心金融帳目資料庫', status: 'compromised' },
      { name: 'Prod-Web-01', ip: '10.10.12.31', role: 'Compromised Web Node', roleZh: '受控的前端跳板主機', status: 'compromised' }
    ]
  },
  'R-003': {
    id: 'R-003',
    title: 'Data Exfiltration Attempt',
    titleZh: '核心金融資料庫大規模打包外流與資料勒索',
    severity: 'Critical',
    time: '3 hours ago',
    timeZh: '3 小時前',
    status: 'Completed',
    statusZh: '研判完成',
    summaryEn: 'A high-impact data exfiltration vector was shut down in real-time. Following database takeover, the actor dumped 14.8 GB of sensitive customer transaction history tables into a temporary directory, created zipped compression archives, resolved dynamic drop-box DNS pathways, and streaming egressed 15.2 GB of data via encrypted TLS tunnels.',
    summaryZh: '一項極具破壞力的資料外洩（Exfiltration）威脅被即時阻斷。在控制了核心 Postgres 資料庫節點後，威脅組織將多達 14.8 GB 的敏感客戶明細帳目檔案匯出至暫存目錄。隨後調用壓縮模組對其進行高壓縮率包裝，繼而請求動態 DNS 完成外連雲儲存通路的定址，最終以高頻 TLS 加密管道朝海外 VPS 串流外遞了多達 15.2 GB 的數據，導致系統觸發帶寬峰值告警。',
    engineStatus: 'Ollama / Llama-3-8B-Instruct',
    gpuUsage: '62%',
    vram: '8.4 GB / 16 GB',
    inferenceLatency: '168ms',
    contextTokens: '14.8k / 128k',
    nodes: [
      { id: 'n1', label: 'PostgreSQL Prod', labelZh: 'PostgreSQL 生產叢集', type: 'Host', ip: '10.10.42.10', details: 'Core Ledger DB Node', detailsZh: '核心資料存儲庫主機（資料外流策源地）', status: 'compromised' },
      { id: 'n2', label: 'Archiver Utility', labelZh: '資料打包暫存壓縮程序', type: 'Archive', ip: '10.10.42.15', details: 'Gzip zip creator running locally', detailsZh: '負責將 CSV 資料表透過 Tar 模組打包的進程', status: 'active' },
      { id: 'n3', label: 'Edge Proxy Nginx', labelZh: '邊界 Nginx Egress 代理', type: 'Gateway', ip: '10.10.1.5', details: 'External TLS forwarding client Nginx', detailsZh: '網頁出口的反向代理兼外部路由代理主機', status: 'alerting' },
      { id: 'n4', label: 'Dropbox API Receiver', labelZh: '境外 C2 資料存儲終端', type: 'Target', ip: '192.164.22.84', details: 'External Attacker Drop Pool (Malicious VPS)', detailsZh: '海外不法 C2 跳板主機 / 瑞典 Bulletproof 虛擬機', status: 'compromised' }
    ],
    connections: [
      { from: 'n1', to: 'n2', label: 'SQL Backup Dump', labelZh: '資料庫資料匯出', protocol: 'Local DB Pipe', status: 'flowing' },
      { from: 'n2', to: 'n3', label: 'Forward Egress Tunnel', labelZh: '加密外連通道建立', protocol: 'Local TCP Socket', status: 'flowing' },
      { from: 'n3', to: 'n4', label: 'High volume HTTPS Stream', labelZh: '海量加載傳輸外遞', protocol: 'HTTPS (443 TLS)', status: 'breached' }
    ],
    findings: [
      "Large-scale database query dumps (COPY TO CSV) executed on main ledger tables",
      "Dynamic domain resolution lookup for dropbox-api-secure.online (categorized malicious IP)",
      "Continuous egress flow stream measuring 15.2 GB of data uploaded inside 4 minutes window"
    ],
    findingsZh: [
      "核心資料庫主帳目表被批量下達了資料歸檔指令（COPY TO FILE），導出大規格本機文檔",
      "系統發送了針對未授權動態域名 dropbox-api-secure.online（歸類於 Lazarus 黑名單 C2 庫）的 DNS 查詢",
      "在極速 4 分鐘窗口期內，透過主機網卡出口對外高速拋送了高達 15.2 GB 的加密 TLS 字元流"
    ],
    recommendations: [
      "Deploy custom snort/suricata network rules blocking dropbox-api-secure.online.",
      "Shut down external outbound HTTPS connections initiated by the PostgreSQL database servers container.",
      "Re-audit the user execution capabilities of the service account to block COPY TO command scopes."
    ],
    recommendationsZh: [
      "立即部屬專屬防火牆 / 閘道協議規則，封殺目標動態域名與目標惡意 IP 192.164.22.84。",
      "在資料庫安全組中落實對外（Outbound）通訊的『白名單機制』，嚴禁資料庫內網集群直接呼叫外網。",
      "審計和撤銷 PostgreSQL 模組內一般使用者對 COPY TO 等能調用作業系統文件系統的高危權限級。"
    ],
    logs: [
      { time: '15:30:10', source: 'postgres[1222]', level: 'critical', message: '[6-1] db=sales_ledger user=postgres stat=ok: COPY customer_ledger TO \'/tmp/customer_data.csv\' DELIMITER \',\' CSV HEADER;', messageZh: 'Postgres 執行 COPY customer_ledger 到 /tmp/customer_data.csv' },
      { time: '15:31:02', source: 'bash[15982]', level: 'critical', message: 'tar -czvf /tmp/ledger_archive.tar.gz /tmp/customer_data.csv', messageZh: '執行 tar 壓縮打包敏感客戶明細資料' },
      { time: '15:31:45', source: 'resolv[102]', level: 'warn', message: 'resolve query: dropbox-api-secure.online via dns-8.8.8.8 root-srv', messageZh: 'DNS 查詢惡意動態網域 dropbox-api-secure.online' },
      { time: '15:32:01', source: 'curl[16012]', level: 'critical', message: 'OUTBOUND: POST https://dropbox-api-secure.online/upload Payload = 15.2GB Egress stream initiating', messageZh: '對海外伺服器發起 15.2GB 的大容量 HTTPS 傳輸外洩' },
      { time: '15:35:00', source: 'nics-driver[18]', level: 'critical', message: 'eth0: Transmist limit alert - peak speed 450Mbps; total volume exceeded 15GB', messageZh: '網卡 eth0 流量超限警報：峰值 450Mbps，累積外洩已逾 15GB' }
    ],
    flows: [
      { time: '15:30:10', src: '10.10.42.10', srcPort: 5432, dst: '10.10.42.15', dstPort: 22, proto: 'LocalPipe', pkts: 0, volume: '14.8GB', score: 80, status: 'Suspicious' },
      { time: '15:31:45', src: '10.10.12.31', srcPort: 42312, dst: '8.8.8.8', dstPort: 53, proto: 'UDP', pkts: 2, volume: '124B', score: 72, status: 'Normal' },
      { time: '15:32:01', src: '10.10.12.31', srcPort: 55421, dst: '192.164.22.84', dstPort: 443, proto: 'TCP/TLS', pkts: 1120440, volume: '15.2GB', score: 99, status: 'Anomaly' }
    ],
    cti: {
      threatGroup: 'APT38 (Lazarus Group - Bureau 121)',
      threatGroupZh: 'APT38 (拉撒路集團 / 北韓 121 局情報部隊)',
      actorCountry: 'Korea (Democratic People\'s Republic of - State Sponsored)',
      actorCountryZh: '北韓 (國家級金融情報作戰組織)',
      confidence: 'High (93%)',
      confidenceZh: '極高置信度 (93%)',
      targetSectors: 'Banks, Cryptocurrency Brokers, Payment Gateways, Swift infrastructure',
      targetSectorsZh: '跨國銀行、加密貨幣交易所、支付閘道、SWIFT 金融通訊基礎設施',
      tactics: ['Database Copy Dump', 'Data Archiving & Zip Compression', 'Encrypted TLS Tunnel Exfiltration'],
      tacticsZh: ['資料庫指令傾印 (Dump)', '資料歸檔與 Gzip 壓縮', '加密 TLS 通道大數據外洩'],
      threatIndex: 98,
      cvssScore: 9.6,
      iocs: [
        { type: 'Exfiltration dynamic domain', typeZh: '資料外洩動態網域', value: 'dropbox-api-secure.online', desc: 'Attacker hosted C2 exfiltration pool domain', descZh: '威脅組織架設之仿冒 Dropbox API 的資料收集站' },
        { type: 'Offshore Server IP address', typeZh: '海外 C2 伺服器 IP', value: '192.164.22.84', desc: 'Offshore Swedish VPS, verified active Lazarus recipient point', descZh: '瑞典境外 Bulletproof VPS，經證實為 Lazarus 專用節點' },
        { type: 'Compressed Payload hash', typeZh: '壓縮外洩包 Hash', value: 'SHA256:e3b0c44298fc1c149afbf4c8996fb...', desc: 'Gzip archive representing exfiltrated db', descZh: '外洩之客戶資料庫歸檔檔案 SHA256 指紋' }
      ]
    },
    ttps: [
      { id: 'T1567.002', name: 'Exfiltration to Cloud C2 Proxy', nameZh: '透過雲端 C2 代理外洩資料', phase: 'Exfiltration', phaseZh: '資料外洩', technique: 'Streaming ledger archives out to cloud dynamic APIs', techniqueZh: '假借合法雲端 API 管道傳輸導出的帳目檔案', description: 'Attacker leverages dynamic dropbox proxies as a trusted front to push data past firewalls.', descriptionZh: '假冒或借用合法雲端 API 連接埠（如防禦網常忽略的 HTTPS 儲存通路）傳輸導出檔案。' },
      { id: 'T1002', name: 'Data Compressed', nameZh: '資料就地壓縮', phase: 'Collection', phaseZh: '資料收集', technique: 'Packaging tables via Gzip / Tar tools', techniqueZh: '利用本機 Tar / Gzip 工具將資料庫傾印檔案壓縮', description: 'Attackers create highly compressed bundles in Linux storage directories prior to outbound exfiltration.', descriptionZh: '對導出的純文字進行就地壓縮與分卷打包，加快外流速度並防止傳輸中特徵碼曝露。' },
      { id: 'T1041', name: 'Exfiltration Over C2 Channel', nameZh: '透過 C2 通道外洩', phase: 'Exfiltration', phaseZh: '資料外洩', technique: 'Using established egress connections to stream data', techniqueZh: '將敏感資料載入已建立的加密 TLS 通道傳輸', description: 'Pumping secure ledger tables out over encrypted TLS pipelines.', descriptionZh: '將敏感資料載荷（Payload）裝載於一建立並信任的 TLS 連線中，向海外威脅控制站輸送。' }
    ],
    timeline: [
      { time: '15:30:10', title: 'Ledger Query Harvested', titleZh: '生產資料匯出', description: 'Postgres logs registered a raw execution of COPY TO statements targeting customer payment information.', descriptionZh: '資料庫主機接獲高特權指令，將包含客戶金融往來明細的 ledger 表完全備份輸出至暫存區。', severity: 'critical' },
      { time: '15:31:02', title: 'Data Archive Bundled', titleZh: '壓縮特徵整合', description: 'A massive zip Gzip command was deployed inside the host directories packaging raw exfiltrated data.', descriptionZh: '作業系統底層進程調用高壓縮模組，就地產出 /tmp/ledger_archive.tar.gz 加密載荷。', severity: 'warn' },
      { time: '15:31:45', title: 'Outbound DNS Issued', titleZh: '出口網域定址解析', description: 'Dynamic host DNS queries triggered for the malicious recipient pool address dropbox-api-secure.online.', descriptionZh: '作業系統觸發了對 dropbox-api-secure.online 惡意動態網域的 DNS 定址解析。', severity: 'warn' },
      { time: '15:32:01', title: 'Massive Exfiltration Transfer', titleZh: '資料外流傳輸啟動', description: 'High-speed encrypted TLS streaming connections initiated, transferring 15.2 GB of data to external nodes.', descriptionZh: '與海外 Swedish VPS 建立大頻寬加密連線，資料快速、持續性朝外拋送，網卡瞬時頻寬崩潰。', severity: 'critical' }
    ],
    affectedAssets: [
      { name: 'PostgreSQL-Prod-01', ip: '10.10.42.10', role: 'Database Master Node', roleZh: '核心生產資料庫主節點', status: 'compromised' },
      { name: 'Egress-Nginx-01', ip: '10.10.1.5', role: 'Edge TLS Proxy', roleZh: '邊界 TLS 出口代理', status: 'at-risk' },
      { name: 'customer_ledger Table', ip: 'DB:sales_ledger', role: 'Financial Data Lake', roleZh: '敏感客戶財務帳目資料表', status: 'compromised' }
    ]
  }
};

export default function AIAttackAnalysisView() {
  const { i18n } = useTranslation();
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('R-001');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<'logs' | 'flows' | 'cti' | 'ttps' | 'timeline'>('logs');
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [isolateApplied, setIsolateApplied] = useState(false);
  const [blockingApplied, setBlockingApplied] = useState(false);
  const [playbookTriggered, setPlaybookTriggered] = useState(false);
  const [copiedIoc, setCopiedIoc] = useState<string | null>(null);
  
  const isZh = i18n.language?.startsWith('zh') || i18n.language === 'zh';
  const isJa = i18n.language?.startsWith('ja') || i18n.language === 'ja';
  const incident = INCIDENT_DATA[selectedIncidentId] || INCIDENT_DATA['R-001'];

  // Handle local Llama-3 rerun animation
  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setSelectedNodeId(null);
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 2000);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIoc(id);
    setTimeout(() => setCopiedIoc(null), 2000);
  };

  const filteredLogs = incident.logs.filter(log => {
    const term = logSearchQuery.toLowerCase();
    const msg = (isZh && log.messageZh ? log.messageZh : log.message).toLowerCase();
    return msg.includes(term) || log.source.toLowerCase().includes(term) || log.time.includes(term);
  });

  // Calculate Node coordinates dynamically for the attack chain
  const getNodeCoordinates = (index: number, total: number) => {
    const width = 680;
    const padding = 60;
    const step = (width - padding * 2) / (total - 1);
    
    const x = padding + index * step;
    let y = 140; // baseline
    if (index === 0) y = 140;          // Attack source
    else if (index === 1) y = 100;     // Gateway (raised)
    else if (index === 2) y = 180;     // Internal service (lowered)
    else if (index === 3) y = 140;     // Exploit target (centered)
    
    return { x, y };
  };

  const nodeCount = incident.nodes.length;
  const positions = incident.nodes.map((_, idx) => getNodeCoordinates(idx, nodeCount));
  const activeNode = incident.nodes.find(n => n.id === selectedNodeId);

  return (
    <div className="space-y-8" id="ai-attack-analysis-view">
      
      {/* SVG animation styles */}
      <style>{`
        @keyframes marchingSinuousFlow {
          0% { stroke-dashoffset: 40; }
          100% { stroke-dashoffset: 0; }
        }
        .anim-flow-breached {
          stroke-dasharray: 6, 6;
          animation: marchingSinuousFlow 0.8s linear infinite;
        }
        .anim-flow-normal {
          stroke-dasharray: 8, 8;
          animation: marchingSinuousFlow 1.5s linear infinite;
        }
        @keyframes glowPulse {
          0%, 100% { filter: drop-shadow(0 0 2px rgba(239, 68, 68, 0.4)); }
          50% { filter: drop-shadow(0 0 10px rgba(239, 68, 68, 0.8)); }
        }
        .node-compromised-glow {
          animation: glowPulse 2s infinite;
        }
      `}</style>

      {/* TOP SECTION: Incident Selector Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" />
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">
              {isZh ? '待研判重大威脅事件佇列' : isJa ? '分析対象の重大脅威キュー' : 'CRITICAL INCIDENTS QUEUE'}
            </h3>
          </div>
          <span className="text-xs text-gray-500 font-mono">
            {isZh ? '已就緒分析模型：Llama-3-8B-Instruct' : 'Ready Core: Llama-3-8B-Instruct'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.values(INCIDENT_DATA).map((inc) => {
            const isSelected = selectedIncidentId === inc.id;
            return (
              <button
                key={inc.id}
                onClick={() => {
                  setSelectedIncidentId(inc.id);
                  setSelectedNodeId(null);
                }}
                className={cn(
                  "p-4 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between gap-3 group cursor-pointer",
                  isSelected 
                    ? "bg-purple-950/20 border-purple-500/60 shadow-lg shadow-purple-950/30" 
                    : "bg-[#111114] border-gray-800/80 hover:border-gray-700 hover:bg-gray-900/50"
                )}
              >
                {isSelected && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500" />
                )}
                
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-gray-900 border border-gray-800 text-gray-300">
                      {inc.id}
                    </span>
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-black uppercase",
                      inc.severity === 'Critical' ? "bg-red-500/15 text-red-400 border border-red-500/30" : "bg-orange-500/15 text-orange-400 border border-orange-500/30"
                    )}>
                      {isZh ? (inc.severity === 'Critical' ? '嚴重' : '高危險') : inc.severity}
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-500 flex items-center gap-1 font-mono">
                    <Clock size={11} /> {isZh ? inc.timeZh : inc.time}
                  </span>
                </div>

                <div>
                  <h4 className={cn(
                    "text-sm font-bold leading-snug transition-colors line-clamp-1",
                    isSelected ? "text-white" : "text-gray-300 group-hover:text-white"
                  )}>
                    {isZh ? inc.titleZh : inc.title}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1 font-mono">
                    {isZh ? `歸屬組織：${inc.cti.threatGroupZh || inc.cti.threatGroup}` : `Attribution: ${inc.cti.threatGroup}`}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-800/50 text-[11px]">
                  <span className="text-purple-400 font-bold flex items-center gap-1">
                    <Radio size={10} className="animate-pulse" />
                    {isZh ? inc.statusZh : inc.status}
                  </span>
                  <span className="text-gray-400 font-mono">
                    CVSS: <strong className="text-red-400">{inc.cti.cvssScore}</strong>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN WORKSTATION 2-COL LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* LEFT 2 COLS: Attack Graph + AI Reasoning + 5 Telemetry Tabs */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. Attack Graph Box */}
          <div className="bg-[#111114] border border-gray-800 rounded-2xl p-6 relative overflow-hidden flex flex-col">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-purple-600/20 p-2.5 rounded-xl border border-purple-500/30">
                  <Network className="w-5 h-5 text-purple-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white italic uppercase tracking-tight">
                    {isZh ? '互動式威脅攻擊鏈路圖' : isJa ? 'インタラクティブ脅威アタックグラフ' : 'ATTACK GRAPH VISUALIZATION ENGINE'}
                  </h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                    {isZh ? '視覺化呈現端到端的入侵路徑、通訊協定與外流流向' : 'End-to-End Kill Chain Telemetry & Waveform'}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 self-stretch sm:self-auto">
                <button 
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-purple-600/10 cursor-pointer"
                >
                  {isAnalyzing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap size={13} className="animate-pulse" />}
                  {isAnalyzing ? (isZh ? 'Llama-3 推理中...' : 'Llama-3 Reasoning...') : (isZh ? '重新運行 AI 關聯分析' : 'Rerun Correlation')}
                </button>
              </div>
            </div>

            {/* Interactive Canvas/Stage */}
            <div className="bg-black/50 rounded-xl border border-gray-800/80 p-6 min-h-[350px] flex flex-col items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent"></div>
              </div>

              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center space-y-4 animate-pulse">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin"></div>
                    <Bot className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-purple-400" size={24} />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-mono font-bold text-gray-300">
                      {isZh ? '正在深度評估 Suricata 警報日誌索引與 Linux 內核 Trace-points...' : 'Evaluating suricata alerting indexes & kernel trace-points...'}
                    </p>
                    <p className="text-[10px] font-mono text-purple-400 mt-1">
                      {isZh ? '正在生成 Llama-3 資安情境映射與攻擊拓撲鏈路...' : 'Generating Llama-3 context maps...'}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* SVG Attack Graph */}
                  <svg viewBox="0 0 680 280" className="w-full max-w-3xl h-full select-none">
                    
                    {/* Definitions for arrow markers and gradient colors */}
                    <defs>
                      <marker id="arrow-breached" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 1 L 10 5 L 0 9 z" fill="#ef4444" />
                      </marker>
                      <marker id="arrow-normal" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 1 L 10 5 L 0 9 z" fill="#a855f7" />
                      </marker>
                      <linearGradient id="grad-breached" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#ec4899" stopOpacity="0.8" />
                      </linearGradient>
                      <linearGradient id="grad-normal" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
                      </linearGradient>
                    </defs>

                    {/* SVG Connections */}
                    {incident.connections.map((conn, cIdx) => {
                      const fromNodeIdx = incident.nodes.findIndex(n => n.id === conn.from);
                      const toNodeIdx = incident.nodes.findIndex(n => n.id === conn.to);
                      if (fromNodeIdx === -1 || toNodeIdx === -1) return null;
                      
                      const fromPos = positions[fromNodeIdx];
                      const toPos = positions[toNodeIdx];
                      
                      const isBreached = conn.status === 'breached';
                      const strokeColor = isBreached ? 'url(#grad-breached)' : 'url(#grad-normal)';
                      const marker = isBreached ? 'url(#arrow-breached)' : 'url(#arrow-normal)';
                      
                      const cpX1 = fromPos.x + (toPos.x - fromPos.x) / 2;
                      const cpY1 = fromPos.y;
                      const cpX2 = fromPos.x + (toPos.x - fromPos.x) / 2;
                      const cpY2 = toPos.y;
                      const pathD = `M ${fromPos.x},${fromPos.y} C ${cpX1},${cpY1} ${cpX2},${cpY2} ${toPos.x},${toPos.y}`;

                      return (
                        <g key={cIdx} className="group/path">
                          <path 
                            d={pathD} 
                            stroke={isBreached ? '#ef4444' : '#a855f7'} 
                            strokeWidth="6" 
                            fill="none" 
                            className="opacity-5 group-hover/path:opacity-15 transition-opacity"
                          />
                          <path 
                            d={pathD} 
                            stroke={strokeColor} 
                            strokeWidth="2.5" 
                            fill="none" 
                            markerEnd={marker}
                            className={cn(
                              "transition-all",
                              isBreached ? "anim-flow-breached" : "anim-flow-normal"
                            )}
                          />
                          <g transform={`translate(${(fromPos.x + toPos.x)/2}, ${((fromPos.y + toPos.y)/2) - 10})`}>
                            <rect 
                              x="-50" 
                              y="-10" 
                              width="100" 
                              height="20" 
                              rx="6" 
                              fill="#0b0b0c" 
                              stroke={isBreached ? '#ef4444' : '#a855f7'} 
                              strokeWidth="1" 
                              className="opacity-90 shadow-md border-gray-800"
                            />
                            <text 
                              textAnchor="middle" 
                              y="3" 
                              fill="white" 
                              fontSize="8" 
                              fontWeight="bold" 
                              className="font-mono tracking-tight"
                            >
                              {conn.protocol}
                            </text>
                          </g>
                        </g>
                      );
                    })}

                    {/* SVG Nodes */}
                    {incident.nodes.map((node, nIdx) => {
                      const pos = positions[nIdx];
                      const isSelected = selectedNodeId === node.id;
                      const isCompromised = node.status === 'compromised' || node.status === 'alerting';

                      return (
                        <g 
                          key={node.id} 
                          transform={`translate(${pos.x}, ${pos.y})`}
                          onClick={() => setSelectedNodeId(isSelected ? null : node.id)}
                          className="cursor-pointer group/node"
                        >
                          <circle 
                            r={isSelected ? "34" : "28"} 
                            fill={isCompromised ? 'rgba(239, 68, 68, 0.1)' : 'rgba(168, 85, 247, 0.05)'} 
                            className={cn(
                              "transition-all duration-300",
                              isCompromised ? "node-compromised-glow" : "",
                              isSelected ? "scale-110" : "scale-100"
                            )}
                          />

                          <circle 
                            r={isSelected ? "28" : "24"} 
                            fill="#111114" 
                            stroke={
                              isSelected ? '#a855f7' : 
                              isCompromised ? '#ef4444' : 
                              '#374151'
                            } 
                            strokeWidth={isSelected ? "3" : isCompromised ? "2" : "1.5"}
                            className="transition-all duration-300"
                          />

                          <g transform="translate(-8, -8)" className={cn(
                            "transition-colors",
                            isSelected ? "text-purple-400" : isCompromised ? "text-red-400" : "text-gray-400"
                          )}>
                            {node.type === 'Attacker' ? <Terminal size={16} /> :
                             node.type === 'Gateway' ? <Globe size={16} /> :
                             node.type === 'Target' ? <Database size={16} /> :
                             node.type === 'Identity' ? <Key size={16} /> :
                             node.type === 'Archive' ? <HardDrive size={16} /> :
                             <Server size={16} />}
                          </g>

                          <g transform="translate(0, 42)">
                            <text 
                              textAnchor="middle" 
                              fill={isSelected ? '#a855f7' : 'white'} 
                              fontSize="10" 
                              fontWeight="bold"
                              className="font-sans transition-colors drop-shadow"
                            >
                              {isZh ? node.labelZh : node.label}
                            </text>
                            <text 
                              textAnchor="middle" 
                              y="12" 
                              fill="#9ca3af" 
                              fontSize="8" 
                              className="font-mono tracking-tight"
                            >
                              {node.ip}
                            </text>
                          </g>

                          {isCompromised && (
                            <g transform="translate(16, -16)" className="animate-bounce">
                              <circle r="7" fill="#ef4444" />
                              <text textAnchor="middle" y="2.5" fill="white" fontSize="8" fontWeight="black" className="font-mono">!</text>
                            </g>
                          )}
                        </g>
                      );
                    })}
                  </svg>

                  {/* SVG Nodes Legend */}
                  <div className="absolute bottom-4 left-6 flex flex-wrap gap-4 select-none">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></div>
                      <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest">
                        {isZh ? '入侵點/告警節點' : 'Root Ingress / Alert'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                      <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest">
                        {isZh ? '中繼代理/網段' : 'Gateway / Internal Node'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-0.5 border-t border-dashed border-red-500"></div>
                      <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest">
                        {isZh ? '異常外流管道' : 'Egress Threat Stream'}
                      </span>
                    </div>
                  </div>

                  {/* Dynamic interactive node overlay drawer */}
                  <AnimatePresence>
                    {activeNode && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute bottom-4 right-6 bg-[#0a0a0c]/95 border border-gray-800 rounded-xl p-3.5 max-w-sm shadow-2xl backdrop-blur-md space-y-1.5"
                      >
                        <div className="flex items-center justify-between border-b border-gray-800 pb-1.5">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "w-2 h-2 rounded-full",
                              activeNode.status === 'compromised' ? 'bg-red-500' : 
                              activeNode.status === 'alerting' ? 'bg-yellow-500 animate-pulse' : 'bg-blue-500'
                            )}></span>
                            <span className="text-xs font-black text-gray-100 font-mono uppercase">{activeNode.ip}</span>
                          </div>
                          <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest bg-gray-900 border border-gray-800 px-1.5 py-0.5 rounded">
                            {activeNode.type}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-300 font-bold">
                          {isZh ? activeNode.labelZh : activeNode.label}
                        </p>
                        <p className="text-[10px] text-gray-500 leading-normal">
                          {isZh ? activeNode.detailsZh : activeNode.details}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>
          </div>

          {/* 2. Llama-3 AI Reasoning & Containment Actions */}
          <div className="bg-[#111114] border border-gray-800 rounded-2xl p-6 space-y-6">
            
            <div className="flex items-center justify-between border-b border-gray-800/80 pb-4">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-purple-400" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  {isZh ? 'Llama-3 深度威脅研判與防禦防護對策' : 'AI THREAT SYNTHESIS & ACTIONABLE CONTAINMENTS'}
                </h4>
              </div>
              <span className="text-[10px] font-mono font-bold bg-purple-900/30 text-purple-300 border border-purple-500/30 px-2.5 py-1 rounded-full">
                Confidence: {isZh ? incident.cti.confidenceZh : incident.cti.confidence}
              </span>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-black/40 border border-purple-500/20 rounded-xl">
                <p className="text-xs md:text-sm text-gray-200 leading-relaxed font-sans">
                  <strong className="text-purple-400 mr-2 font-mono">
                    {isZh ? '[S.E.M.O.R 智慧總結]' : '[S.E.M.O.R SYNTHESIS]'}
                  </strong>
                  {isZh ? incident.summaryZh : incident.summaryEn}
                </p>
              </div>
              
              {/* Split Findings and Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                
                {/* Findings */}
                <div className="bg-black/30 border border-gray-800 p-4 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-red-400 font-black text-xs uppercase tracking-wider">
                    <ShieldAlert size={14} className="animate-pulse" />
                    <span>{isZh ? '主要入侵與檢測發現 (Key Findings)' : 'Kill Chain Findings'}</span>
                  </div>
                  <ul className="space-y-2 text-xs text-gray-300">
                    {(isZh ? incident.findingsZh : incident.findings).map((finding, fIdx) => (
                      <li key={fIdx} className="flex gap-2 items-start">
                        <span className="text-red-500 font-bold mt-0.5">•</span>
                        <span>{finding}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommendations */}
                <div className="bg-purple-950/10 border border-purple-900/30 p-4 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-purple-400 font-black text-xs uppercase tracking-wider">
                    <ShieldCheck size={14} />
                    <span>{isZh ? '修復處置防護建議 (Actionable Recommendations)' : 'Actionable Containments'}</span>
                  </div>
                  <ul className="space-y-2 text-xs text-gray-200">
                    {(isZh ? incident.recommendationsZh : incident.recommendations).map((rec, rIdx) => (
                      <li key={rIdx} className="flex gap-2 items-start">
                        <span className="text-purple-400 font-bold mt-0.5">{rIdx + 1}.</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

              {/* Quick Containment Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-800/60 justify-end">
                <button 
                  onClick={() => {
                    setBlockingApplied(true);
                    setTimeout(() => setBlockingApplied(false), 2000);
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-red-600/10"
                >
                  <Lock size={13} />
                  {blockingApplied ? (isZh ? '已下發邊界防火牆封鎖!' : 'Firewall Rules Dispatched!') : (isZh ? '防火牆一鍵阻斷 IP' : 'Block Ingress IP')}
                </button>

                <button 
                  onClick={() => {
                    setIsolateApplied(true);
                    setTimeout(() => setIsolateApplied(false), 2000);
                  }}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Activity size={13} />
                  {isolateApplied ? (isZh ? '已執行主機網路完全隔離!' : 'Host Fully Isolated!') : (isZh ? '主機網路完全隔離' : 'Isolate Compromised Host')}
                </button>

                <button 
                  onClick={() => {
                    setPlaybookTriggered(true);
                    setTimeout(() => setPlaybookTriggered(false), 2000);
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Zap size={13} />
                  {playbookTriggered ? (isZh ? 'SOAR 自動劇本派發成功!' : 'SOAR Playbook Executed!') : (isZh ? '派發自動化應變劇本' : 'Run Auto Playbook')}
                </button>
              </div>

            </div>

          </div>

          {/* 3. Deep Telemetry & Investigation Tabs */}
          <div className="bg-[#111114] border border-gray-800 rounded-2xl p-6 space-y-6">
            
            {/* Tabs Header */}
            <div className="flex border-b border-gray-800 overflow-x-auto custom-scrollbar">
              {[
                { id: 'logs', label: isZh ? '日誌稽核分析' : 'Raw Audit Logs', icon: <FileText size={13} /> },
                { id: 'flows', label: isZh ? '網路通訊流量' : 'Network Flows', icon: <Activity size={13} /> },
                { id: 'cti', label: isZh ? '威脅情報 (CTI)' : 'Threat Intel (CTI)', icon: <Globe size={13} /> },
                { id: 'ttps', label: isZh ? '惡意手法與 TTPs' : 'Malware & TTPs', icon: <AlertTriangle size={13} /> },
                { id: 'timeline', label: isZh ? '時序攻擊時間表' : 'Chronology Timeline', icon: <Clock size={13} /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveAnalysisTab(tab.id as any)}
                  className={cn(
                    "px-4 py-3 border-b-2 font-black text-xs transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer",
                    activeAnalysisTab === tab.id ? 
                    "border-purple-500 text-purple-400 bg-purple-500/5" : 
                    "border-transparent text-gray-500 hover:text-gray-300"
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tabs Body */}
            <div>
              {/* TAB 1: LOGS */}
              {activeAnalysisTab === 'logs' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800/80 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-950 border border-gray-800 px-2.5 py-1 rounded">
                        syslog & service audits
                      </span>
                      <span className="text-xs text-gray-500 font-bold">
                        {isZh ? `偵測到 ${incident.logs.length} 條核心日誌` : `${incident.logs.length} core audit logs found`}
                      </span>
                    </div>
                    <div className="relative w-full sm:w-64">
                      <input 
                        type="text" 
                        placeholder={isZh ? '過濾日誌內容或來源...' : 'Filter logs...'} 
                        value={logSearchQuery}
                        onChange={(e) => setLogSearchQuery(e.target.value)}
                        className="w-full bg-black/40 border border-gray-800 rounded-lg pl-8 pr-4 py-1.5 text-xs text-white focus:border-purple-500 outline-none transition-all font-mono"
                      />
                      <Search className="absolute left-2.5 top-2.5 text-gray-600" size={13} />
                    </div>
                  </div>

                  <div className="bg-black/30 border border-gray-800/60 rounded-xl overflow-x-auto custom-scrollbar max-h-[460px]">
                    <table className="w-full text-left border-collapse font-mono text-[11px] leading-relaxed">
                      <thead className="bg-gray-900/60 sticky top-0">
                        <tr className="border-b border-gray-800 text-gray-400">
                          <th className="py-2.5 px-4 font-black">{isZh ? '時間' : 'TIMESTAMP'}</th>
                          <th className="py-2.5 px-4 font-black">{isZh ? '來源模組 / 進程' : 'DAEMON / COMPONENT'}</th>
                          <th className="py-2.5 px-4 font-black">{isZh ? '等級' : 'LEVEL'}</th>
                          <th className="py-2.5 px-4 font-black">{isZh ? '稽核日誌消息' : 'MESSAGE'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/40">
                        {filteredLogs.map((log, lIdx) => (
                          <tr key={lIdx} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3 px-4 text-gray-500 whitespace-nowrap">{log.time}</td>
                            <td className="py-3 px-4 text-blue-400 font-bold whitespace-nowrap">{log.source}</td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className={cn(
                                "px-1.5 py-0.5 rounded text-[9px] font-black uppercase text-center block w-14",
                                log.level === 'critical' || log.level === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                log.level === 'warn' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                                'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                              )}>
                                {log.level}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-gray-300">
                              {isZh && log.messageZh ? log.messageZh : log.message}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 2: FLOWS */}
              {activeAnalysisTab === 'flows' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-800/80 pb-3">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-950 border border-gray-800 px-2.5 py-1 rounded">
                      network interface kernel records
                    </span>
                    <span className="text-xs text-gray-500 font-bold">
                      {isZh ? '即時網卡流量通訊分析' : 'Network Flow & Anomaly score'}
                    </span>
                  </div>

                  <div className="bg-black/30 border border-gray-800/60 rounded-xl overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse font-mono text-[11px] leading-relaxed">
                      <thead className="bg-gray-900/60">
                        <tr className="border-b border-gray-800 text-gray-400">
                          <th className="py-2.5 px-4 font-black">{isZh ? '時間' : 'TIMESTAMP'}</th>
                          <th className="py-2.5 px-4 font-black">{isZh ? '來源位址' : 'SOURCE'}</th>
                          <th className="py-2.5 px-4 text-center font-black">{isZh ? '流向' : 'DIR'}</th>
                          <th className="py-2.5 px-4 font-black">{isZh ? '目的位址' : 'DESTINATION'}</th>
                          <th className="py-2.5 px-4 font-black">{isZh ? '協定' : 'PROTO'}</th>
                          <th className="py-2.5 px-4 text-center font-black">{isZh ? '封包' : 'PKTS'}</th>
                          <th className="py-2.5 px-4 text-right font-black">{isZh ? '流量' : 'VOLUME'}</th>
                          <th className="py-2.5 px-4 text-center font-black">{isZh ? '異常評級' : 'ANOMALY'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/40">
                        {incident.flows.map((flow, fIdx) => (
                          <tr key={fIdx} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3 px-4 text-gray-500 whitespace-nowrap">{flow.time}</td>
                            <td className="py-3 px-4 text-gray-200 whitespace-nowrap">
                              {flow.src}<span className="text-gray-500">:{flow.srcPort}</span>
                            </td>
                            <td className="py-3 px-4 text-center text-purple-400">→</td>
                            <td className="py-3 px-4 text-gray-200 whitespace-nowrap">
                              {flow.dst}<span className="text-gray-500">:{flow.dstPort}</span>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="bg-gray-900 border border-gray-800 px-1.5 py-0.5 rounded text-[9px] text-gray-400 font-black">
                                {flow.proto}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center text-gray-300">{flow.pkts}</td>
                            <td className="py-3 px-4 text-right text-purple-400 font-bold">{flow.volume}</td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className="flex items-center justify-center gap-2">
                                <span className={cn(
                                  "px-2 py-0.5 rounded text-[9px] font-black uppercase text-center min-w-[70px]",
                                  flow.status === 'Anomaly' ? 'bg-red-500/15 text-red-400 border border-red-500/30' :
                                  flow.status === 'Suspicious' ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30' :
                                  'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                                )}>
                                  {isZh ? (flow.status === 'Anomaly' ? '異常' : flow.status === 'Suspicious' ? '可疑' : '正常') : flow.status}
                                </span>
                                <span className="text-[10px] font-bold text-gray-400">{flow.score}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: CTI */}
              {activeAnalysisTab === 'cti' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  {/* Left Side: CTI Threat Profile */}
                  <div className="space-y-4">
                    <div className="border-b border-gray-800/80 pb-2">
                      <h4 className="text-xs font-black text-gray-300 uppercase tracking-widest flex items-center gap-2">
                        <Bot size={13} className="text-purple-400" />
                        {isZh ? 'APT 威脅組織畫像與歸屬' : 'APT Actor CTI Aggregation'}
                      </h4>
                    </div>
                    
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-gray-800">
                        <span className="text-gray-400 font-bold">{isZh ? '關聯威脅組織' : 'Threat Group / APT'}</span>
                        <span className="font-black text-white">{isZh ? incident.cti.threatGroupZh || incident.cti.threatGroup : incident.cti.threatGroup}</span>
                      </div>

                      <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-gray-800">
                        <span className="text-gray-400 font-bold">{isZh ? '組織地緣歸屬' : 'Geopolitical Attribution'}</span>
                        <span className="font-bold text-red-400">{isZh ? incident.cti.actorCountryZh : incident.cti.actorCountry}</span>
                      </div>

                      <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-gray-800">
                        <span className="text-gray-400 font-bold">{isZh ? '情資置信度' : 'Intelligence Confidence'}</span>
                        <span className="font-bold text-green-400 text-right">{isZh ? incident.cti.confidenceZh : incident.cti.confidence}</span>
                      </div>

                      <div className="space-y-1.5 bg-black/40 p-3 rounded-xl border border-gray-800">
                        <span className="text-gray-400 font-bold block mb-1">{isZh ? '常見攻擊目標領域' : 'Commonly Targeted Sectors'}</span>
                        <p className="text-xs text-gray-300 leading-relaxed font-sans">
                          {isZh ? incident.cti.targetSectorsZh : incident.cti.targetSectors}
                        </p>
                      </div>

                      <div className="space-y-1.5 bg-black/40 p-3 rounded-xl border border-gray-800">
                        <span className="text-gray-400 font-bold block mb-1">{isZh ? '核心戰術模式' : 'Tactics'}</span>
                        <div className="flex flex-wrap gap-1.5">
                          {(isZh ? incident.cti.tacticsZh : incident.cti.tactics).map((t, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-purple-950/30 text-purple-300 border border-purple-500/20 rounded text-[10px] font-mono">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: IoCs */}
                  <div className="space-y-4">
                    <div className="border-b border-gray-800/80 pb-2">
                      <h4 className="text-xs font-black text-gray-300 uppercase tracking-widest flex items-center gap-2">
                        <ShieldAlert size={13} className="text-purple-400" />
                        {isZh ? '本次事件失陷指標 (IoCs)' : 'Indicators of Compromise (IoCs)'}
                      </h4>
                    </div>

                    <div className="space-y-3">
                      {incident.cti.iocs.map((ioc, iIdx) => (
                        <div key={iIdx} className="bg-black/40 border border-gray-800 p-3.5 rounded-xl space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[9px] font-black text-red-400 uppercase tracking-widest bg-red-950/30 border border-red-500/20 px-2 py-0.5 rounded">
                              {isZh ? ioc.typeZh : ioc.type}
                            </span>
                            <button
                              onClick={() => copyToClipboard(ioc.value, `ioc-${iIdx}`)}
                              className="text-gray-500 hover:text-white transition-colors flex items-center gap-1 text-[10px] font-mono"
                            >
                              {copiedIoc === `ioc-${iIdx}` ? (
                                <span className="text-green-400 flex items-center gap-0.5"><Check size={11} /> {isZh ? '已複製' : 'Copied'}</span>
                              ) : (
                                <span className="flex items-center gap-0.5"><Copy size={11} /> {isZh ? '複製' : 'Copy'}</span>
                              )}
                            </button>
                          </div>
                          <p className="text-white font-bold font-mono text-xs break-all">{ioc.value}</p>
                          <p className="text-[11px] text-gray-400 font-sans">{isZh ? ioc.descZh : ioc.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 4: TTPS */}
              {activeAnalysisTab === 'ttps' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-gray-800/80 pb-3">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-950 border border-gray-800 px-2.5 py-1 rounded">
                      mitre att&ck framework mapping
                    </span>
                    <span className="text-xs text-gray-500 font-bold">
                      {isZh ? '對齊全球 MITRE 威脅矩陣技戰術' : 'Tactics & Techniques Matrix Mapping'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {incident.ttps.map((ttp) => (
                      <div key={ttp.id} className="bg-black/40 border border-gray-800 hover:border-purple-500/40 transition-all rounded-xl p-4 space-y-3 flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between border-b border-gray-800/60 pb-2">
                            <span className="text-[10px] font-mono text-purple-400 font-black tracking-widest bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded">
                              {ttp.id}
                            </span>
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                              {isZh ? ttp.phaseZh : ttp.phase}
                            </span>
                          </div>
                          
                          <div>
                            <h4 className="text-xs font-bold text-white">{isZh ? ttp.nameZh : ttp.name}</h4>
                            <p className="text-[11px] text-purple-300 font-mono mt-0.5">{isZh ? ttp.techniqueZh : ttp.technique}</p>
                          </div>
                        </div>

                        <p className="text-xs text-gray-400 leading-normal font-sans border-t border-gray-800/40 pt-2">
                          {isZh ? ttp.descriptionZh : ttp.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: TIMELINE */}
              {activeAnalysisTab === 'timeline' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-gray-800/80 pb-3">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-950 border border-gray-800 px-2.5 py-1 rounded">
                      incident temporal progression records
                    </span>
                    <span className="text-xs text-gray-500 font-bold">
                      {isZh ? '攻擊事件按秒級精確時間遞進軌跡' : 'Chronological millisecond lifecycle events'}
                    </span>
                  </div>

                  <div className="relative pl-6 md:pl-8 border-l-2 border-gray-800 space-y-6 py-2 max-w-2xl mx-auto">
                    {incident.timeline.map((evt, eIdx) => (
                      <div key={eIdx} className="relative group/timeline-node">
                        <span className={cn(
                          "absolute -left-[31px] md:-left-[39px] top-1.5 w-4 h-4 rounded-full border bg-[#111114] z-10 flex items-center justify-center transition-all group-hover/timeline-node:scale-125",
                          evt.severity === 'critical' ? 'border-red-500' :
                          evt.severity === 'warn' ? 'border-yellow-500' : 'border-blue-500'
                        )}>
                          <span className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            evt.severity === 'critical' ? 'bg-red-500' :
                            evt.severity === 'warn' ? 'bg-yellow-500' : 'bg-blue-500'
                          )}></span>
                        </span>

                        <div className="bg-black/40 border border-gray-800 rounded-xl p-4 space-y-2 hover:border-purple-500/30 transition-all">
                          <div className="flex items-center justify-between border-b border-gray-800/40 pb-1.5">
                            <span className="text-xs font-mono font-black text-purple-400 flex items-center gap-1.5">
                              <Clock size={11} /> {evt.time}
                            </span>
                            <span className={cn(
                              "text-[9px] font-black uppercase px-2 py-0.5 border rounded",
                              evt.severity === 'critical' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                              evt.severity === 'warn' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                              'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            )}>
                              {isZh ? (evt.severity === 'critical' ? '嚴重威脅' : evt.severity === 'warn' ? '中度警示' : '資訊紀錄') : evt.severity}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-gray-200">
                            {isZh ? evt.titleZh : evt.title}
                          </h4>
                          <p className="text-xs text-gray-400 font-sans leading-relaxed">
                            {isZh ? evt.descriptionZh : evt.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>

        {/* RIGHT 1 COL: AI Engine Telemetry + Threat Radar + Playbook Controls */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Card 1: AI Inference Engine Telemetry */}
          <div className="bg-[#111114] border border-gray-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  {isZh ? 'AI 推論核心狀態遙測' : 'AI Engine Telemetry'}
                </h4>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-mono text-green-400">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping"></span>
                ONLINE
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center bg-black/40 p-2.5 rounded-lg border border-gray-800">
                <span className="text-gray-400">{isZh ? '推論核心' : 'LLM Core'}</span>
                <span className="font-mono font-bold text-purple-300">{incident.engineStatus}</span>
              </div>
              
              <div className="flex justify-between items-center bg-black/40 p-2.5 rounded-lg border border-gray-800">
                <span className="text-gray-400">{isZh ? '推論延遲' : 'Latency'}</span>
                <span className="font-mono font-bold text-green-400">{incident.inferenceLatency}</span>
              </div>

              <div className="flex justify-between items-center bg-black/40 p-2.5 rounded-lg border border-gray-800">
                <span className="text-gray-400">{isZh ? '顯存佔用 (VRAM)' : 'VRAM Usage'}</span>
                <span className="font-mono font-bold text-white">{incident.vram}</span>
              </div>

              <div className="flex justify-between items-center bg-black/40 p-2.5 rounded-lg border border-gray-800">
                <span className="text-gray-400">{isZh ? 'GPU 負載率' : 'GPU Load'}</span>
                <span className="font-mono font-bold text-blue-400">{incident.gpuUsage}</span>
              </div>

              <div className="flex justify-between items-center bg-black/40 p-2.5 rounded-lg border border-gray-800">
                <span className="text-gray-400">{isZh ? '脈絡長度 (Context)' : 'Context Window'}</span>
                <span className="font-mono font-bold text-purple-400">{incident.contextTokens}</span>
              </div>
            </div>

            <div className="p-3 bg-purple-950/20 border border-purple-500/20 rounded-xl text-[11px] text-purple-300">
              <p className="flex items-center gap-1.5 font-bold">
                <ShieldCheck size={13} className="text-purple-400 shrink-0" />
                {isZh ? 'Purple Llama 安全沙箱防護已啟用' : 'Purple Llama Guardrails Active'}
              </p>
              <p className="text-[10px] text-gray-400 mt-1 leading-normal">
                {isZh ? '所有推論輸出均已通過 Meta Purple Llama 紅隊合規過濾，避免惡意代碼外溢。' : 'All model outputs filtered via Meta Purple Llama safeguards.'}
              </p>
            </div>
          </div>

          {/* Card 2: Affected Assets Impact List */}
          <div className="bg-[#111114] border border-gray-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  {isZh ? '衝擊半徑與受害資產' : 'Affected Assets'}
                </h4>
              </div>
              <span className="text-[10px] font-mono text-gray-500">
                {incident.affectedAssets.length} {isZh ? '個節點' : 'Nodes'}
              </span>
            </div>

            <div className="space-y-2.5">
              {incident.affectedAssets.map((asset, aIdx) => (
                <div key={aIdx} className="p-3 bg-black/40 border border-gray-800 rounded-xl flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <p className="font-bold text-white">{asset.name}</p>
                    <p className="text-[11px] text-gray-400 font-mono">{asset.ip}</p>
                    <p className="text-[10px] text-gray-500">{isZh ? asset.roleZh : asset.role}</p>
                  </div>
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-black uppercase shrink-0",
                    asset.status === 'compromised' ? "bg-red-500/15 text-red-400 border border-red-500/30" :
                    asset.status === 'at-risk' ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30" :
                    "bg-green-500/15 text-green-400 border border-green-500/30"
                  )}>
                    {isZh ? (asset.status === 'compromised' ? '已失陷' : asset.status === 'at-risk' ? '高風險' : '安全') : asset.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Export & Automation Playbook */}
          <div className="bg-[#111114] border border-gray-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-800/80 pb-3">
              <Download className="w-4 h-4 text-green-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                {isZh ? '鑑識匯報與自動化排程' : 'Forensics Dossier'}
              </h4>
            </div>

            <div className="space-y-2">
              <button 
                onClick={() => {
                  const content = `# 資安事件鑑識報告 - ${incident.id}\n\n## 事件名稱：${incident.titleZh}\n## 威脅等級：${incident.severity}\n## 關聯組織：${incident.cti.threatGroupZh}\n\n### 研判結論：\n${incident.summaryZh}\n\n### 主要發現：\n${incident.findingsZh.map(f => `- ${f}`).join('\n')}\n\n### 防護建議：\n${incident.recommendationsZh.map(r => `- ${r}`).join('\n')}\n`;
                  const blob = new Blob([content], { type: 'text/markdown' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `incident-${incident.id}-forensics.md`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 border border-gray-700 cursor-pointer"
              >
                <FileSpreadsheet size={14} className="text-purple-400" />
                {isZh ? '匯出 Markdown 鑑識專案書' : 'Export Forensics Dossier'}
              </button>

              <button 
                onClick={() => {
                  window.print();
                }}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-600/20"
              >
                <ArrowUpRight size={14} />
                {isZh ? '列印 / 匯出 PDF 執行專案' : 'Print / Export PDF Dossier'}
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
