import { 
  CaseIncident, 
  CaseCustomField, 
  LayoutBlockConfig, 
  SLAPolicyStage, 
  CaseConfigVersion,
  IngestionMapping
} from './types';

export const INITIAL_CASES: CaseIncident[] = [
  {
    id: 'inc-1002',
    caseNumber: 'INC-2026-1002',
    title: 'Locky 勒索軟體感染與網域控制站 (DC) 橫向移動滲透事件',
    description: '端點偵測發現高熵值 (High-Entropy) 加密行為，攻擊者藉由 SMB 445 埠與 Pass-the-Hash 技法向台中分公司主控台 (Branch-02.DC) 進行特權擴張與檔案竄改。',
    severity: 'Critical',
    status: 'Investigating',
    category: 'Ransomware',
    sourceEngine: 'SentinelOne + Suricata NDR',
    assignee: {
      id: 'usr-01',
      name: '張維倫 (Warren C.)',
      role: '資深 L2 資安鑑識專家',
      email: 'warren.c@semor.security',
      avatarBg: 'bg-purple-600'
    },
    createdAt: '2026-09-08 04:15:20',
    updatedAt: '2026-09-08 04:58:33',
    sla: {
      stage: 'Response',
      stageDeadline: '2026-09-08 05:15:00',
      remainingMinutes: 16,
      totalMinutes: 60,
      isBreached: false
    },
    affectedAssets: [
      {
        id: 'ast-01',
        name: 'TC-DC-01.corp.internal',
        type: 'Domain Controller',
        ip: '10.240.12.5',
        status: 'Compromised',
        os: 'Windows Server 2022 Datacenter',
        agentVersion: 'S1-Agent v24.2.1',
        ownerDepartment: 'IT 基礎架構營運部'
      },
      {
        id: 'ast-02',
        name: 'WKS-FIN-8821.corp.internal',
        type: 'Endpoint',
        ip: '10.240.88.21',
        status: 'Isolated',
        os: 'Windows 11 Pro Enterprise',
        agentVersion: 'S1-Agent v24.2.1',
        ownerDepartment: '財務核算組'
      },
      {
        id: 'ast-03',
        name: 'NAS-BACKUP-01',
        type: 'Server',
        ip: '10.240.15.100',
        status: 'At Risk',
        os: 'Linux TrueNAS Core',
        ownerDepartment: '企業備份維運組'
      }
    ],
    affectedUsers: [
      {
        username: 'david.chen',
        displayName: '陳大衛 (資深會計專員)',
        email: 'david.chen@corp.tw',
        role: '財務部專員',
        department: '財務會計部',
        compromised: true,
        mfaStatus: 'Revoked',
        lastActiveSession: '10.240.88.21 (Session ID: ssn-99182)'
      },
      {
        username: 'svc_backup_admin',
        displayName: '服務帳號: 備份排程代理',
        email: 'svc_backup@corp.tw',
        role: 'Domain Service Account',
        department: 'IT 系統架構部',
        compromised: true,
        mfaStatus: 'Normal',
        lastActiveSession: 'Kerberos TGS Request from 10.240.88.21'
      }
    ],
    mitreTactics: [
      { id: 'T1059.001', name: 'PowerShell 惡意腳本執行', technique: 'PowerShell', tactic: 'Execution', color: '#ef4444' },
      { id: 'T1021.002', name: 'SMB/Windows Admin Shares 橫向移動', technique: 'SMB Shares', tactic: 'Lateral Movement', color: '#f97316' },
      { id: 'T1486', name: '以資料加密進行勒索衝擊', technique: 'Data Encrypted for Impact', tactic: 'Impact', color: '#dc2626' },
      { id: 'T1078.002', name: '濫用網域特權帳號', technique: 'Domain Accounts', tactic: 'Privilege Escalation', color: '#a855f7' }
    ],
    observables: [
      {
        id: 'obs-1',
        type: 'IP',
        value: '185.199.110.153',
        reputation: 'Malicious',
        score: 98,
        hits: 14,
        source: 'MISP + AlienVault OTX',
        actionTaken: '周邊防火牆阻斷 (Perimeter Dropped)'
      },
      {
        id: 'obs-2',
        type: 'SHA256',
        value: 'da39a3ee5e6b4b0d3255bfef95601890afd80709',
        reputation: 'Malicious',
        score: 100,
        hits: 5,
        source: 'VirusTotal (67/72 Detections)',
        actionTaken: 'EDR 全網隔離 (Host Isolated)'
      },
      {
        id: 'obs-3',
        type: 'Domain',
        value: 'update-msft-telemetry.ru',
        reputation: 'Malicious',
        score: 95,
        hits: 8,
        source: 'ThreatConnect CTI',
        actionTaken: 'DNS Sinkhole (RPZ 阻斷)'
      },
      {
        id: 'obs-4',
        type: 'File',
        value: 'C:\\Users\\david.chen\\AppData\\Local\\Temp\\invoice_q3.pdf.exe',
        reputation: 'Malicious',
        score: 99,
        hits: 1,
        source: 'Endpoint FIM Sandbox',
        actionTaken: '沙箱動態引爆鑑識'
      }
    ],
    timeline: [
      {
        id: 'tl-1',
        timestamp: '04:15:20',
        type: 'Alert',
        author: 'SentinelOne XDR',
        content: '觸發端點高熵值檔案加密行為警戒 (Ransomware Heuristics: Locky.v4)',
        details: '進程: invoice_q3.pdf.exe PID: 4982 試圖改寫 240 個 .xlsx 檔案副檔名。',
        status: 'Warning'
      },
      {
        id: 'tl-2',
        timestamp: '04:17:05',
        type: 'Automated Playbook',
        author: 'n8n SOAR 劇本 (SOAR-PB-99)',
        content: '自動發起第一階段遏制：隔離財務端點 WKS-FIN-8821 網路連線',
        details: '成功調用 EDR API 發送隔離指令，僅保留 8443 遙測管理埠。',
        status: 'Success'
      },
      {
        id: 'tl-3',
        timestamp: '04:22:40',
        type: 'Alert',
        author: 'Suricata NDR 流量感測器',
        content: '偵測到嘗試使用 SMBv1 向 TC-DC-01 (10.240.12.5) 進行 Pass-the-Hash 爆破',
        details: '封包特徵比對成功：ET EXPLOIT Windows SMB Remote Code Execution Attempt (CVE-2017-0144)。',
        status: 'Failed'
      },
      {
        id: 'tl-4',
        timestamp: '04:35:12',
        type: 'Analyst Note',
        author: '張維倫 (Warren C.)',
        content: '已聯絡 IT 基礎架構負責人，確認 NAS 備份快照已啟動不可竄改鎖定 (WORM Storage)。',
        status: 'Success'
      },
      {
        id: 'tl-5',
        timestamp: '04:50:00',
        type: 'Action Executed',
        author: 'SOAR 處置引擎',
        content: '全面撤銷 david.chen 與 svc_backup_admin 之 Active Directory Kerberos 票證並強制踢除連線。',
        status: 'Success'
      }
    ],
    attackGraph: {
      nodes: [
        { id: 'n-c2', label: '185.199.110.153', subLabel: '外部攻擊 C2 伺服器', type: 'attacker', status: 'Blocked' },
        { id: 'n-phish', label: '釣魚郵件附加檔', subLabel: 'invoice_q3.pdf.exe', type: 'file', status: 'Quarantined' },
        { id: 'n-victim', label: 'WKS-FIN-8821', subLabel: '10.240.88.21 (會計端點)', type: 'asset', status: 'Isolated' },
        { id: 'n-user', label: 'david.chen', subLabel: '被盜用特權身分', type: 'user', status: 'Revoked' },
        { id: 'n-dc', label: 'TC-DC-01', subLabel: '10.240.12.5 (網域控制站)', type: 'asset', status: 'Protected' },
        { id: 'n-nas', label: 'NAS-BACKUP-01', subLabel: '核心不可竄改備份', type: 'asset', status: 'Secure' }
      ],
      edges: [
        { from: 'n-c2', to: 'n-phish', label: '攻擊酬載投遞 (Spear Phishing)' },
        { from: 'n-phish', to: 'n-victim', label: '巨集釋放執行 (Process Spawn)' },
        { from: 'n-victim', to: 'n-user', label: '記憶體 LSASS 密碼傾印' },
        { from: 'n-user', to: 'n-dc', label: 'Pass-the-Hash 橫向移動 (SMB 445)', protocol: 'SMB' },
        { from: 'n-dc', to: 'n-nas', label: '試圖鎖定備份 (阻斷成功)', protocol: 'NFS/SMB' }
      ]
    },
    warRoomNotes: [
      {
        id: 'wn-1',
        author: '系統自動監控 (n8n Bot)',
        role: 'SOAR Automation Engine',
        time: '04:18:10',
        text: '已自動呼叫 Cortex 對 IoC: 185.199.110.153 進行情資豐富化查詢，VirusTotal 惡意評分高達 98 分，已自動同步至周邊 Palo Alto 防火牆之動態黑名單。',
        isAutomatedBot: true
      },
      {
        id: 'wn-2',
        author: '張維倫 (Warren C.)',
        role: 'L2 鑑識官',
        time: '04:30:15',
        text: '檢查會計端點記憶體傾印，確認此為 Locky 變種，金鑰尚未外洩至外部 C2。建議對全域網域進行 Kerberos 密碼雙重滾動重設 (krbtgt reset)。',
        isAutomatedBot: false,
        avatarColor: 'bg-purple-600'
      },
      {
        id: 'wn-3',
        author: '林宏毅 (Howard L.)',
        role: 'SOC 總指揮官',
        time: '04:42:00',
        text: '核准對受影響的台中分公司網段進行細粒度微隔離 (Micro-segmentation)，請持續監控 LDAP 與 Kerberos 異常驗證頻率。',
        isAutomatedBot: false,
        avatarColor: 'bg-blue-600'
      }
    ],
    tags: ['Locky', 'Ransomware', 'Pass-the-Hash', 'P1-Critical', 'Containment-Active'],
    customAttributes: {
      threat_source: 'SentinelOne-XDR',
      incident_type: 'Ransomware.Locky',
      assigned_team: 'Tier 2 SOC Analyst',
      ioc_count: 4,
      regulatory_impact: 'ISO 27001 / 金管會重大資安事件申報'
    }
  },
  {
    id: 'inc-1005',
    caseNumber: 'INC-2026-1005',
    title: '雲端管理者帳號 MFA 疲勞推播炸彈攻擊與 Session 劫持',
    description: 'AWS Production 環境在 3 分鐘內觸發 42 次 Okta Push 驗證請求，管理員誤按核准後，攻擊者隨即由奈及利亞 IP 建立 STS 臨時憑證並試圖建立特權 IAM Role。',
    severity: 'High',
    status: 'In Remediation',
    category: 'Privilege Escalation',
    sourceEngine: 'Okta Identity Engine + AWS CloudTrail',
    assignee: {
      id: 'usr-02',
      name: '李雅婷 (Evelyn L.)',
      role: '雲端與身分安全分析官',
      email: 'evelyn.l@semor.security',
      avatarBg: 'bg-blue-600'
    },
    createdAt: '2026-09-08 03:20:10',
    updatedAt: '2026-09-08 04:40:12',
    sla: {
      stage: 'Remediation',
      stageDeadline: '2026-09-08 07:20:00',
      remainingMinutes: 140,
      totalMinutes: 240,
      isBreached: false
    },
    affectedAssets: [
      {
        id: 'ast-cloud-01',
        name: 'AWS-Prod-Account (ID: 981240128912)',
        type: 'Cloud VM',
        ip: '172.31.0.12',
        status: 'At Risk',
        os: 'Amazon Linux 2023',
        ownerDepartment: 'DevOps 雲端架構組'
      }
    ],
    affectedUsers: [
      {
        username: 'samuel.wu@corp.tw',
        displayName: '吳思明 (雲端架構總監)',
        email: 'samuel.wu@corp.tw',
        role: 'AWS Cloud Admin',
        department: '雲端技術部',
        compromised: true,
        mfaStatus: 'Enforced',
        lastActiveSession: '102.164.21.90 (Lagos, Nigeria)'
      }
    ],
    mitreTactics: [
      { id: 'T1621', name: 'MFA 疲勞請求多重撞庫', technique: 'Multi-Factor Authentication Request Generation', tactic: 'Credential Access', color: '#f59e0b' },
      { id: 'T1098.001', name: '雲端特權角色與密鑰附加', technique: 'Additional Cloud Credentials', tactic: 'Persistence', color: '#ec4899' },
      { id: 'T1539', name: 'Web 瀏覽器工作階段 Cookie 盜竊', technique: 'Steal Web Session Cookie', tactic: 'Credential Access', color: '#eab308' }
    ],
    observables: [
      {
        id: 'obs-c1',
        type: 'IP',
        value: '102.164.21.90',
        reputation: 'Malicious',
        score: 92,
        hits: 42,
        source: 'Spur.us + AbuseIPDB',
        actionTaken: 'WAF 全域地理阻斷 (Geo-Block)'
      },
      {
        id: 'obs-c2',
        type: 'URL',
        value: 'https://aws-sso-portal-login-auth.com',
        reputation: 'Malicious',
        score: 96,
        hits: 3,
        source: 'PhishTank + OpenPhish',
        actionTaken: '網域黑名單同步'
      }
    ],
    timeline: [
      {
        id: 'tl-c1',
        timestamp: '03:20:10',
        type: 'Alert',
        author: 'Okta UEBA Engine',
        content: '偵測到 Impossible Travel (台灣至奈及利亞 0.5 小時內切換)',
        details: '從台北至拉哥斯距離超過 11,000 公里，觸發極高風險判定。',
        status: 'Warning'
      },
      {
        id: 'tl-c2',
        timestamp: '03:23:45',
        type: 'Automated Playbook',
        author: 'AWS GuardDuty SOAR',
        content: '即時作廢所有由 AssumeRole 衍生之 STS 臨時 AccessKey',
        details: '呼叫 aws iam attach-user-policy 掛載 DenyAll 政策遏制。',
        status: 'Success'
      },
      {
        id: 'tl-c3',
        timestamp: '03:45:00',
        type: 'Analyst Note',
        author: '李雅婷 (Evelyn L.)',
        content: '已要求當事人更換 FIDO2 WebAuthn 硬體金鑰，全面停用 SMS 與 Push 弱驗證機制。',
        status: 'Success'
      }
    ],
    attackGraph: {
      nodes: [
        { id: 'gn-att', label: '102.164.21.90', subLabel: '奈及利亞 VPS 節點', type: 'attacker', status: 'Blocked' },
        { id: 'gn-okta', label: 'Okta SSO 身份閘道', subLabel: 'MFA 推播轟炸', type: 'process', status: 'Protected' },
        { id: 'gn-user', label: 'samuel.wu', subLabel: '特權管理帳號', type: 'user', status: 'Password-Reset' },
        { id: 'gn-aws', label: 'AWS IAM STS', subLabel: '試圖派發臨時角色', type: 'asset', status: 'Revoked' }
      ],
      edges: [
        { from: 'gn-att', to: 'gn-okta', label: '42 次推播爆發 (Push Fatigue)' },
        { from: 'gn-okta', to: 'gn-user', label: '使用者誤按同意' },
        { from: 'gn-user', to: 'gn-aws', label: '呼叫 AssumeRole 遭 SOAR 攔截' }
      ]
    },
    warRoomNotes: [
      {
        id: 'wn-c1',
        author: '李雅婷 (Evelyn L.)',
        role: '雲端與身分安全分析官',
        time: '03:50:00',
        text: '確認 AWS CloudTrail 中未出現未經授權的 S3 桶下載或 EC2 提權操作，危害已限縮於登入階段。',
        isAutomatedBot: false,
        avatarColor: 'bg-blue-600'
      }
    ],
    tags: ['MFA-Fatigue', 'Okta', 'AWS-CloudTrail', 'STS-Revoked'],
    customAttributes: {
      threat_source: 'Okta-Identity-Engine',
      incident_type: 'Credential-Abuse',
      assigned_team: 'Cloud SecOps'
    }
  },
  {
    id: 'inc-1008',
    caseNumber: 'INC-2026-1008',
    title: 'APT41 Cobalt Strike Beacon 植入與 DNS 隱匿通道外洩',
    description: '核心研發伺服器持續向境外動態網域進行 53 埠 DNS TXT 請求通道，封包負載檢測出 Base64 加密之原始碼片斷，疑似高階持續性威脅 (APT)。',
    severity: 'Critical',
    status: 'Awaiting Approval',
    category: 'APT C2',
    sourceEngine: 'Wazuh FIM + Arkime PCAP',
    assignee: {
      id: 'usr-03',
      name: '何建銘 (Ken H.)',
      role: '資深威脅狩獵顧問 (Threat Hunter)',
      email: 'ken.h@semor.security',
      avatarBg: 'bg-emerald-600'
    },
    createdAt: '2026-09-08 01:10:00',
    updatedAt: '2026-09-08 04:30:00',
    sla: {
      stage: 'Triage',
      stageDeadline: '2026-09-08 06:00:00',
      remainingMinutes: 70,
      totalMinutes: 180,
      isBreached: false
    },
    affectedAssets: [
      {
        id: 'ast-rd-01',
        name: 'SRV-RND-GIT-01',
        type: 'Server',
        ip: '10.100.4.18',
        status: 'Compromised',
        os: 'Ubuntu 24.04 LTS Kernel 6.8',
        agentVersion: 'Wazuh 4.8.1',
        ownerDepartment: '前瞻軟體研發處'
      }
    ],
    affectedUsers: [
      {
        username: 'rd_dev_lead',
        displayName: '研發團隊自動部署帳號',
        email: 'ci_deploy@corp.tw',
        role: 'Service Account',
        department: '研發處',
        compromised: true,
        mfaStatus: 'Normal'
      }
    ],
    mitreTactics: [
      { id: 'T1071.004', name: 'DNS 通訊協定偽裝通道', technique: 'DNS Tunneling', tactic: 'Command and Control', color: '#3b82f6' },
      { id: 'T1048', name: '藉由替代通訊協定外洩機密資料', technique: 'Exfiltration Over Alternative Protocol', tactic: 'Exfiltration', color: '#dc2626' }
    ],
    observables: [
      {
        id: 'obs-d1',
        type: 'Domain',
        value: 'ns1.cdn-cloud-cache.online',
        reputation: 'Malicious',
        score: 99,
        hits: 1540,
        source: 'DNS Tunneling Deep Analyzer',
        actionTaken: 'DNS 遞迴解析全面丟棄'
      }
    ],
    timeline: [
      {
        id: 'tl-d1',
        timestamp: '01:10:00',
        type: 'Alert',
        author: 'Arkime PCAP 分析器',
        content: '偵測到異常 DNS 查詢頻率 (超過 250 QPS，長度大於 180 位元組)',
        status: 'Warning'
      }
    ],
    attackGraph: {
      nodes: [
        { id: 'an-srv', label: 'SRV-RND-GIT-01', subLabel: '10.100.4.18', type: 'asset', status: 'Compromised' },
        { id: 'an-dns', label: 'ns1.cdn-cloud-cache.online', subLabel: '境外偽造權威 DNS', type: 'c2', status: 'Blocked' }
      ],
      edges: [
        { from: 'an-srv', to: 'an-dns', label: 'DNS TXT Query Exfiltration', protocol: 'DNS/UDP 53' }
      ]
    },
    warRoomNotes: [
      {
        id: 'wn-d1',
        author: '何建銘 (Ken H.)',
        role: '威脅狩獵顧問',
        time: '02:00:00',
        text: '已提交「全面拔除該研發伺服器外網連線，並進行完整磁碟數位鑑識鏡像備份」申請，等待主管核准中。',
        isAutomatedBot: false,
        avatarColor: 'bg-emerald-600'
      }
    ],
    tags: ['APT41', 'Cobalt-Strike', 'DNS-Tunneling', 'Approval-Pending'],
    customAttributes: {
      threat_source: 'Arkime-Deep-Packet',
      incident_type: 'APT-C2-Beaconing',
      assigned_team: 'Threat Hunting Squad'
    }
  },
  {
    id: 'inc-1011',
    caseNumber: 'INC-2026-1011',
    title: '未授權 API 閘道權限外洩與客戶個資大批洩漏告警',
    description: 'B2B 合作夥伴 API Gateway 於深夜發生 100,000 筆客戶聯絡人資料分頁下載，比對權限發現為遭洩露之硬編碼 API Token。',
    severity: 'Medium',
    status: 'In Remediation',
    category: 'Data Exfiltration',
    sourceEngine: 'Traefik API Log + OpenSearch',
    assignee: {
      id: 'usr-01',
      name: '張維倫 (Warren C.)',
      role: '資深 L2 資安鑑識專家',
      email: 'warren.c@semor.security',
      avatarBg: 'bg-purple-600'
    },
    createdAt: '2026-09-07 22:15:00',
    updatedAt: '2026-09-08 02:00:00',
    sla: {
      stage: 'Remediation',
      stageDeadline: '2026-09-08 12:00:00',
      remainingMinutes: 420,
      totalMinutes: 720,
      isBreached: false
    },
    affectedAssets: [
      {
        id: 'ast-api-01',
        name: 'APIGW-PROD-CLUSTER',
        type: 'Gateway',
        ip: '10.50.2.1',
        status: 'Compromised',
        os: 'Kubernetes Ingress Controller',
        ownerDepartment: '電商平台事業處'
      }
    ],
    affectedUsers: [],
    mitreTactics: [
      { id: 'T1552.001', name: '儲存庫硬編碼 API 密鑰洩露', technique: 'Credentials in Files', tactic: 'Credential Access', color: '#f59e0b' }
    ],
    observables: [
      {
        id: 'obs-api-1',
        type: 'IP',
        value: '45.142.214.22',
        reputation: 'Suspicious',
        score: 78,
        hits: 12050,
        source: 'API Rate Limiter',
        actionTaken: 'IP 限流並暫時封鎖'
      }
    ],
    timeline: [],
    attackGraph: {
      nodes: [
        { id: 'an-api-c', label: '45.142.214.22', subLabel: '外部爬蟲 IP', type: 'attacker' },
        { id: 'an-api-gw', label: 'API Gateway', subLabel: '特權 Token 濫用', type: 'asset' }
      ],
      edges: [
        { from: 'an-api-c', to: 'an-api-gw', label: 'REST API 批次呼叫' }
      ]
    },
    warRoomNotes: [],
    tags: ['Data-Exfiltration', 'API-Security', 'Token-Leakage'],
    customAttributes: {
      threat_source: 'Traefik-WAF',
      incident_type: 'API-Abuse',
      assigned_team: 'Application Security'
    }
  },
  {
    id: 'inc-1014',
    caseNumber: 'INC-2026-1014',
    title: '跨國主管信箱巨集釣魚郵件點擊與惡意載荷釋放 (已遏阻)',
    description: '人資部門收到以 Q4 薪資調整為誘餌的釣魚郵件，經 Microsoft 365 Defender 與沙箱動態分析自動攔截並隔離。',
    severity: 'Low',
    status: 'Closed',
    category: 'Phishing',
    sourceEngine: 'TheHive SIRP + Cortex Analyzer',
    assignee: {
      id: 'usr-02',
      name: '李雅婷 (Evelyn L.)',
      role: '雲端與身分安全分析官',
      email: 'evelyn.l@semor.security',
      avatarBg: 'bg-blue-600'
    },
    createdAt: '2026-09-07 14:00:00',
    updatedAt: '2026-09-07 15:30:00',
    sla: {
      stage: 'Archived',
      stageDeadline: '2026-09-07 16:00:00',
      remainingMinutes: 0,
      totalMinutes: 120,
      isBreached: false
    },
    affectedAssets: [],
    affectedUsers: [],
    mitreTactics: [],
    observables: [],
    timeline: [],
    attackGraph: { nodes: [], edges: [] },
    warRoomNotes: [],
    tags: ['Phishing', 'Safe-Blocked', 'False-Positive-Excluded'],
    customAttributes: {}
  }
];

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
