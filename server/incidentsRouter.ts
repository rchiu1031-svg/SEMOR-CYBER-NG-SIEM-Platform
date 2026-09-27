import { Router, Request, Response } from 'express';
import crypto from 'crypto';

export interface PlaybookItem {
  id: string;
  title: string;
  description: string;
  type: 'isolate' | 'block' | 'revoke' | 'dump' | 'notify';
}

export interface IncidentNote {
  id: string;
  author: string;
  timestamp: string;
  content: string;
}

export interface IncidentHistoryItem {
  timestamp: string;
  action: string;
  operator: string;
  details?: string;
}

export interface CriticalIncidentItem {
  id: string;
  time: string;
  srcip: string;
  srcHost?: string;
  srcUser?: string;
  dstip: string;
  dstHost?: string;
  action: string;
  country: string;
  threat: string;
  risk: 'Critical' | 'High' | 'Medium';
  riskScore: number;
  status: 'active' | 'investigating' | 'contained' | 'resolved';
  category: 'ueba' | 'ics' | 'apt' | 'bruteforce' | 'c2' | 'exfil';
  cve?: string;
  mitreTTP: string;
  mitreStage: 'Recon' | 'Initial Access' | 'Privilege Escalation' | 'Lateral Movement' | 'Exfiltration';
  affectedAssets: number;
  confidence: number;
  payloadHex: string;
  rawLog: string;
  aiSummary: string;
  recommendedPlaybooks: PlaybookItem[];
  notes?: IncidentNote[];
  history?: IncidentHistoryItem[];
}

export function createIncidentsRouter() {
  const router = Router();

  // Initial High-Fidelity Critical Incidents Dataset
  let criticalIncidents: CriticalIncidentItem[] = [
    {
      id: 'INC-2026-0801',
      time: '2026-04-30 02:30:00',
      srcip: '10.100.4.18',
      srcHost: 'WS-RD-DEV-04',
      srcUser: 'Kevin (R&D Lead)',
      dstip: '198.51.100.88',
      dstHost: 'MEGA.nz Cloud Storage',
      action: 'UEBA: Data Exfiltration',
      country: 'Internal',
      threat: 'Anomalous Upload (15GB Encrypted Blob)',
      risk: 'Critical',
      riskScore: 9.8,
      status: 'active',
      category: 'ueba',
      cve: 'CWE-200 / Insider Threat',
      mitreTTP: 'T1567.002 Exfiltration to Cloud Storage',
      mitreStage: 'Exfiltration',
      affectedAssets: 3,
      confidence: 98.4,
      payloadHex: '4d 45 47 41 5f 55 50 4c 4f 41 44 5f 53 45 53 53 49 4f 4e 5f 4b 45 59 3a 20 61 65 73 32 35 36 2d 67 63 6d 5f 70 61 79 6c 6f 61 64 2e 74 61 72 2e 67 7a',
      rawLog: JSON.stringify({
        timestamp: "2026-04-30T02:30:00Z",
        event: "UEBA_ANOMALOUS_OUTBOUND",
        source_user: "kevin_rd",
        source_ip: "10.100.4.18",
        dest_fqdn: "eu.storage.mega.co.nz",
        dest_ip: "198.51.100.88",
        protocol: "HTTPS/TLSv1.3",
        bytes_out: 16106127360,
        baseline_avg_bytes: 45000000,
        deviation_sigma: "+7.4 sigma",
        encryption: "Client-Side Pre-Encrypted Archive"
      }, null, 2),
      aiSummary: '戰術模式顯示研發部門帳號於非工作時間（凌晨 02:30）存取核心原始碼儲存庫後，向境外網盤高頻上傳高達 15GB 加密封裝資料。偏離該使用者過去 90 天行為基準線達 +7.4 個標準差，高度符合內部威脅資料竊取特徵。',
      recommendedPlaybooks: [
        { id: 'pb-1', title: '即時阻斷該端點連外網路 (Host Quarantine)', description: '透過 EDR 下發網路隔離指令，僅保留 SOC 通信埠', type: 'isolate' },
        { id: 'pb-2', title: '強制撤銷 AD 帳號與 Session Token', description: '立即鎖定 Active Directory 帳號並終止所有雲端登入憑證', type: 'revoke' },
        { id: 'pb-3', title: '下發邊界防火牆 DNS / IP 封鎖規則', description: '向 Palo Alto / Fortinet 下發 198.51.100.88 阻斷規則', type: 'block' },
        { id: 'pb-4', title: '執行終端記憶體傾印取證 (Forensic Dump)', description: '即時擷取該開發主機 RAM 與暫存目錄進行數位鑑識', type: 'dump' }
      ],
      notes: [
        {
          id: 'n-1',
          author: 'Tier-3 Lead (Chen)',
          timestamp: '14:22:10',
          content: '已確認為真實內部異常存取活動，初步比對該 R&D 帳號昨夜有異地 VPN 登入紀錄，疑似帳號憑證遭竊取或內部人員惡意外洩。'
        },
        {
          id: 'n-2',
          author: 'EDR Analyst (Lin)',
          timestamp: '14:35:45',
          content: '已下發主機網路隔離指令，目前正在對 WS-RD-DEV-04 執行即時 RAM Memory Dump 取證。'
        }
      ],
      history: [
        { timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), action: 'ALERT_TRIGGERED', operator: 'SIEM Correlation Engine', details: 'UEBA 偵測到異常用量 +7.4 Sigma' },
        { timestamp: new Date(Date.now() - 3600000 * 3).toISOString(), action: 'TRIAGE_ELEVATED', operator: 'SOC Tier-2 Lead', details: '評估為國防級極高危險事件 P1' }
      ]
    },
    {
      id: 'INC-2026-0802',
      time: '2026-04-30 02:15:00',
      srcip: '10.100.4.18',
      srcHost: 'WS-RD-DEV-04',
      srcUser: 'Kevin (R&D Lead)',
      dstip: '10.200.1.20',
      dstHost: 'GitLab-Enterprise-Core',
      action: 'UEBA: File Access Anomaly',
      country: 'Internal',
      threat: 'High Vol Source Code Repository Clone',
      risk: 'High',
      riskScore: 8.6,
      status: 'investigating',
      category: 'ueba',
      cve: 'CWE-284 Improper Access Control',
      mitreTTP: 'T1005 Data from Local System',
      mitreStage: 'Lateral Movement',
      affectedAssets: 2,
      confidence: 94.2,
      payloadHex: '67 69 74 20 63 6c 6f 6e 65 20 2d 2d 6d 69 72 72 6f 72 20 67 69 74 40 67 69 74 6c 61 62 3a 64 65 66 65 6e 73 65 2d 63 34 69 73 72 2e 67 69 74',
      rawLog: JSON.stringify({
        timestamp: "2026-04-30T02:15:00Z",
        event: "GIT_BULK_EXPORT",
        actor: "kevin_rd",
        repo_count: 18,
        total_commits_downloaded: 45200,
        protocol: "SSH-RSA",
        fingerprint: "SHA256:d8:a1:4c:7b:99:12:ef"
      }, null, 2),
      aiSummary: '同一主機在進行大流量外洩前 15 分鐘，批次鏡像複製了 18 個軍事通信與 C4ISR 核心專案儲存庫，確認為連貫性資料竊取攻擊鏈之第一階段。',
      recommendedPlaybooks: [
        { id: 'pb-git-1', title: '暫時撤銷該使用者之 GitLab SSH 金鑰與權限', description: '防止繼續進行未授權之代碼複製', type: 'revoke' },
        { id: 'pb-git-2', title: '限制內部 Git Server 存取 IP 網段', description: '加強微分段安全防護', type: 'block' }
      ],
      notes: [
        {
          id: 'n-git-1',
          author: 'AppSec Engineer',
          timestamp: '14:40:12',
          content: '已核對 GitLab Audit Logs，該使用者於 12 分鐘內執行了 18 次 git clone --mirror。'
        }
      ]
    },
    {
      id: 'INC-2026-0803',
      time: '2026-04-02 09:30:15',
      srcip: '103.45.12.88',
      srcHost: 'APT-66-PUPPET',
      srcUser: 'SYSTEM (Exploited)',
      dstip: '192.168.50.10',
      dstHost: 'SCADA-PLC-TURBINE-01',
      action: 'Modbus Write (0x05)',
      country: 'Russia',
      threat: 'Industrial Sabotage (Coil Override Attempt)',
      risk: 'Critical',
      riskScore: 9.9,
      status: 'active',
      category: 'ics',
      cve: 'CVE-2022-22965 / Modbus Auth Bypass',
      mitreTTP: 'T0855 Unauthorized Command Message',
      mitreStage: 'Initial Access',
      affectedAssets: 4,
      confidence: 99.1,
      payloadHex: '00 01 00 00 00 06 01 05 00 64 ff 00 (Modbus Force Single Coil: OVERRIDE_COOLING_VALVE_ON)',
      rawLog: JSON.stringify({
        timestamp: "2026-04-02T09:30:15Z",
        protocol: "Modbus/TCP (Port 502)",
        function_code: "0x05 (Write Single Coil)",
        register_address: "0x0064 (Coil 100)",
        requested_state: "0xFF00 (Force ON)",
        plc_model: "Schneider Modicon M580",
        threat_actor: "APT-66 (Industrial Disruptor)"
      }, null, 2),
      aiSummary: '偵測到針對關鍵基礎設施冷卻控制閥之強制寫入惡意指令 (Function Code 0x05)，企圖越過安全連鎖機構造成渦輪機過熱停機。來源 IP 位於境外高風險網段，屬於具備國家級背景之工控破壞攻擊。',
      recommendedPlaybooks: [
        { id: 'pb-ics-1', title: '切換工控網閘至單向硬體隔離模式 (Air-Gap)', description: '阻斷外部 IT-OT 橫向連線，維持本地 HMI 安全運作', type: 'isolate' },
        { id: 'pb-ics-2', title: '下發 ICS 防火牆 Modbus 協議白名單過濾', description: '強制拒絕所有非排程之 0x05 / 0x0F 寫入指令', type: 'block' },
        { id: 'pb-ics-3', title: '緊急啟動備援發電機與安全保護連鎖', description: '防止物理設備產生硬體損傷', type: 'notify' }
      ]
    },
    {
      id: 'INC-2026-0804',
      time: '2026-04-02 09:12:40',
      srcip: '45.122.3.15',
      srcHost: 'HOST-EXTERNAL-SCANNER',
      dstip: '172.16.0.5',
      dstHost: 'DMZ-BASTION-JUMP',
      action: 'SSH Brute Force',
      country: 'China',
      threat: 'Credential Access (Dict Attack: 2,400 attempts/min)',
      risk: 'High',
      riskScore: 8.2,
      status: 'contained',
      category: 'bruteforce',
      cve: 'CWE-307 Excessive Authentication Attempts',
      mitreTTP: 'T1110.001 Password Guessing',
      mitreStage: 'Initial Access',
      affectedAssets: 1,
      confidence: 96.0,
      payloadHex: '53 53 48 2d 32 2e 30 2d 4c 69 62 53 53 48 5f 30 2e 39 2e 35 20 61 75 74 68 5f 66 61 69 6c 75 72 65 3a 20 72 6f 6f 74',
      rawLog: JSON.stringify({
        timestamp: "2026-04-02T09:12:40Z",
        service: "OpenSSH_8.9p1",
        failed_attempts: 2480,
        duration_seconds: 62,
        target_accounts: ["root", "admin", "c4isr_op", "operator", "backup"]
      }, null, 2),
      aiSummary: '高頻字典檔攻擊邊界堡壘機，企圖透過自動化撞庫取得特權操作通道。自動化 WAF / Fail2ban 已即時下發 24 小時動態黑名單。',
      recommendedPlaybooks: [
        { id: 'pb-ssh-1', title: '延長來源 IP 封鎖期至 30 天', description: '將 45.122.3.15 加入全域邊界防禦清單', type: 'block' }
      ]
    },
    {
      id: 'INC-2026-0805',
      time: '2026-04-02 08:55:22',
      srcip: '185.220.101.4',
      srcHost: 'TOR-EXIT-NODE-NETH',
      dstip: '10.0.0.15',
      dstHost: 'PORTAL-AUTH-API-01',
      action: 'SQL Injection',
      country: 'Netherlands',
      threat: 'Data Exfiltration (UNION SELECT schema dump)',
      risk: 'Critical',
      riskScore: 9.5,
      status: 'active',
      category: 'apt',
      cve: 'CVE-2023-34362 / SQLi in REST API',
      mitreTTP: 'T1190 Exploit Public-Facing Application',
      mitreStage: 'Initial Access',
      affectedAssets: 2,
      confidence: 97.8,
      payloadHex: '27 20 55 4e 49 4f 4e 20 53 45 4c 45 43 54 20 6e 75 6c 6c 2c 20 74 61 62 6c 65 5f 6e 61 6d 65 2c 20 63 6f 6c 75 6d 6e 5f 6e 61 6d 65 20 46 52 4f 4d 20 69 6e 66 6f 72 6d 61 74 69 6f 6e 5f 73 63 68 65 6d 61 2e 63 6f 6c 75 6d 6e 73 20 2d 2d 20',
      rawLog: JSON.stringify({
        timestamp: "2026-04-02T08:55:22Z",
        request_uri: "/api/v2/personnel/search?q='%20UNION%20SELECT%20null,table_name,column_name%20FROM%20information_schema.columns--",
        user_agent: "sqlmap/1.7.2#stable (https://sqlmap.org)",
        waf_status: "ALERT_GENERATED",
        db_response_size: "142 KB"
      }, null, 2),
      aiSummary: '利用 Portal 查詢介面未經過濾之參數進行 UNION 注入，探測系統資料表結構並嘗試導出人員資料庫清冊。',
      recommendedPlaybooks: [
        { id: 'pb-sqli-1', title: '開啟 WAF 嚴格虛擬修補 (Virtual Patching)', description: '阻斷所有包含 UNION SELECT / SQL 特徵字元之 HTTP 請求', type: 'block' },
        { id: 'pb-sqli-2', title: '暫時停用脆弱 API 節點 /api/v2/personnel/search', description: '將流量路由至靜態維護頁面以待熱修復', type: 'isolate' }
      ]
    },
    {
      id: 'INC-2026-0806',
      time: '2026-04-02 08:40:10',
      srcip: '91.241.19.33',
      srcHost: 'UNKNOWN-HOST',
      dstip: '192.168.1.100',
      dstHost: 'WS-FINANCE-03',
      action: 'RDP Exploit (BlueKeep)',
      country: 'Ukraine',
      threat: 'Lateral Movement (EternalBlue / BlueKeep probe)',
      risk: 'High',
      riskScore: 8.9,
      status: 'investigating',
      category: 'apt',
      cve: 'CVE-2019-0708 (BlueKeep)',
      mitreTTP: 'T1210 Exploitation of Remote Services',
      mitreStage: 'Lateral Movement',
      affectedAssets: 2,
      confidence: 93.5,
      payloadHex: '03 00 00 13 0e e0 00 00 00 00 00 01 00 08 00 03 00 00 00 (RDP MS_T120 Channel Malformed Packet)',
      rawLog: JSON.stringify({
        timestamp: "2026-04-02T08:40:10Z",
        port: 3389,
        channel: "MS_T120",
        exploit_family: "BlueKeep Kernel Memory Corruption",
        edr_state: "PROCESS_TAMPER_DETECTED"
      }, null, 2),
      aiSummary: '遠端桌面服務接收到異常通道封包，企圖觸發核心記憶體毀損以執行任意代碼。',
      recommendedPlaybooks: [
        { id: 'pb-rdp-1', title: '關閉非必要之公網 RDP 存取埠 (Port 3389)', description: '強制使用 VPN 加上 2FA 雙因子驗證連線', type: 'block' },
        { id: 'pb-rdp-2', title: '下發微軟安全更新 KB4499175', description: '派送緊急安全性更新修補 BlueKeep 弱點', type: 'isolate' }
      ]
    },
    {
      id: 'INC-2026-0807',
      time: '2026-04-02 08:15:05',
      srcip: '192.168.50.200',
      srcHost: 'WS-LOGISTICS-08',
      dstip: '8.8.8.8',
      dstHost: 'Google Public DNS (Hijacked Tunnel)',
      action: 'DNS Tunneling',
      country: 'Internal',
      threat: 'C2 Communication (Encoded Subdomains Exfiltration)',
      risk: 'Critical',
      riskScore: 9.7,
      status: 'active',
      category: 'c2',
      cve: 'CWE-319 Cleartext Transmission',
      mitreTTP: 'T1071.004 DNS Application Layer Protocol',
      mitreStage: 'Privilege Escalation',
      affectedAssets: 3,
      confidence: 99.3,
      payloadHex: '71 78 7a 61 39 39 31 38 66 61 32 30 34 62 2e 63 32 2d 63 6f 6d 6d 61 6e 64 2e 6e 65 74',
      rawLog: JSON.stringify({
        timestamp: "2026-04-02T08:15:05Z",
        query_type: "TXT / NULL",
        subdomain_entropy: 4.88,
        query_count: 5400,
        dest_c2_ns: "ns1.c2-command.net"
      }, null, 2),
      aiSummary: '內網後勤端點向惡意 NS 伺服器發出高頻超長 Base32 子網域 DNS 請求，確認為隱蔽 C2 通道與慢速外洩特徵。',
      recommendedPlaybooks: [
        { id: 'pb-dns-1', title: '內部 DNS 伺服器強制啟用 DNS RPZ 響應原則區域', description: '將惡意網域導向安全黑洞 Sinkhole', type: 'block' },
        { id: 'pb-dns-2', title: '隔離 WS-LOGISTICS-08 並進行惡意軟體掃描', description: '清除背景常駐之 DNS Beacon 惡意載荷', type: 'isolate' }
      ]
    }
  ];

  // Helper to calculate statistics
  const getStats = () => {
    const active = criticalIncidents.filter(i => i.status === 'active').length;
    const investigating = criticalIncidents.filter(i => i.status === 'investigating').length;
    const contained = criticalIncidents.filter(i => i.status === 'contained').length;
    const resolved = criticalIncidents.filter(i => i.status === 'resolved').length;
    const avgRisk = criticalIncidents.length > 0
      ? Number((criticalIncidents.reduce((sum, i) => sum + i.riskScore, 0) / criticalIncidents.length).toFixed(1))
      : 0;

    const categoryBreakdown = criticalIncidents.reduce((acc: any, i) => {
      acc[i.category] = (acc[i.category] || 0) + 1;
      return acc;
    }, {});

    const stageBreakdown = criticalIncidents.reduce((acc: any, i) => {
      acc[i.mitreStage] = (acc[i.mitreStage] || 0) + 1;
      return acc;
    }, {});

    return {
      total: criticalIncidents.length,
      activeCount: active,
      investigatingCount: investigating,
      containedCount: contained,
      resolvedCount: resolved,
      containedOrResolvedCount: contained + resolved,
      avgRiskScore: avgRisk,
      avgMttrMinutes: 12.4,
      slaTargetMinutes: 15.0,
      slaComplianceRate: 94.8,
      categoryBreakdown,
      stageBreakdown
    };
  };

  // 1. GET /api/v1/incidents (List with filters & stats)
  router.get('/', (req: Request, res: Response) => {
    const { status, risk, category, search, mitreStage } = req.query;
    let list = [...criticalIncidents];

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      list = list.filter(i =>
        i.id.toLowerCase().includes(q) ||
        i.srcip.toLowerCase().includes(q) ||
        i.dstip.toLowerCase().includes(q) ||
        i.threat.toLowerCase().includes(q) ||
        i.action.toLowerCase().includes(q) ||
        i.mitreTTP.toLowerCase().includes(q) ||
        (i.srcUser && i.srcUser.toLowerCase().includes(q)) ||
        (i.srcHost && i.srcHost.toLowerCase().includes(q))
      );
    }

    if (status && status !== 'ALL') {
      list = list.filter(i => i.status === status);
    }

    if (risk && risk !== 'ALL') {
      list = list.filter(i => i.risk === risk);
    }

    if (category && category !== 'ALL') {
      list = list.filter(i => i.category === category);
    }

    if (mitreStage && mitreStage !== 'ALL') {
      list = list.filter(i => i.mitreStage === mitreStage);
    }

    res.json({
      success: true,
      count: list.length,
      incidents: list,
      stats: getStats()
    });
  });

  // 2. GET /api/v1/incidents/stats
  router.get('/stats', (req: Request, res: Response) => {
    res.json({
      success: true,
      stats: getStats()
    });
  });

  // 3. POST /api/v1/incidents/acknowledge-all (Acknowledge all active)
  router.post('/acknowledge-all', (req: Request, res: Response) => {
    let modifiedCount = 0;
    criticalIncidents = criticalIncidents.map(inc => {
      if (inc.status === 'active') {
        modifiedCount++;
        const historyItem: IncidentHistoryItem = {
          timestamp: new Date().toISOString(),
          action: 'STATUS_ACKNOWLEDGED',
          operator: req.body?.operator || 'Current Analyst',
          details: '全數確認知悉並移入調查處理隊列'
        };
        return {
          ...inc,
          status: 'investigating' as const,
          history: [...(inc.history || []), historyItem]
        };
      }
      return inc;
    });

    res.json({
      success: true,
      message: `已全數確認知悉 ${modifiedCount} 筆嚴重事件並轉入調查階段`,
      acknowledgedCount: modifiedCount,
      incidents: criticalIncidents,
      stats: getStats()
    });
  });

  // 4. GET /api/v1/incidents/export/dossier (Digital forensic dossier)
  router.get('/export/dossier', (req: Request, res: Response) => {
    const activeBreaches = criticalIncidents.filter(i => i.status === 'active' || i.status === 'investigating');
    const dossierId = `DOSSIER-${new Date().getFullYear()}-CRIT-${String(Math.floor(Math.random() * 900) + 100)}`;
    const integrityHash = crypto.createHash('sha256').update(JSON.stringify(criticalIncidents)).digest('hex');

    const dossier = {
      dossierId,
      classificationLevel: '國防極機密 / TOP SECRET (DEFCON-ELEVATED)',
      generatedAt: new Date().toISOString(),
      leadInvestigator: req.query.investigator || 'SOC-Lead-Analyst (Chen)',
      overallRiskAssessment: 'DEFCON-ELEVATED: MULTI-VECTOR BREACHES DETECTED',
      integrityHash: `SHA-256:${integrityHash}`,
      executiveSummary: '本鑑識報告彙整全網偵測之高危險嚴重資安事件，涵蓋核心原始碼未授權外洩、工控 SCADA/PLC 指令竄改、APT 滲透與隱蔽 C2 通道。建議立即下發全域自動化 SOAR 處置劇本，維持關鍵基礎設施連續運作。',
      totalIncidentsIncluded: criticalIncidents.length,
      activeCriticalBreaches: activeBreaches.length,
      incidents: criticalIncidents,
      containmentDirectives: [
        '針對所有高於 9.0 之事件端點下發 EDR 硬體/網路雙重隔離',
        '邊界 NGFW 與 DNS RPZ 伺服器動態同步境外惡意 IP/網域黑名單',
        '全面執行 Active Directory 特權帳號金鑰輪替 (Kerberos KRBTGT 密碼重設)',
        '工控網段全面切換為物理單向 Air-Gap 安全防護'
      ]
    };

    res.json({
      success: true,
      dossier
    });
  });

  // 5. GET /api/v1/incidents/:id (Single Incident)
  router.get('/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const item = criticalIncidents.find(i => i.id === id);
    if (!item) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    res.json({ success: true, incident: item });
  });

  // 6. PATCH /api/v1/incidents/:id (Update status / riskScore / attributes)
  router.patch('/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const item = criticalIncidents.find(i => i.id === id);
    if (!item) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    const { status, riskScore, threat, action } = req.body;
    if (status) item.status = status;
    if (typeof riskScore === 'number') item.riskScore = Math.min(10.0, Math.max(1.0, riskScore));
    if (threat) item.threat = threat;
    if (action) item.action = action;

    const historyItem: IncidentHistoryItem = {
      timestamp: new Date().toISOString(),
      action: 'INCIDENT_UPDATED',
      operator: req.body?.operator || 'SOC Analyst',
      details: `更新事件狀態為 ${item.status}，風險評級 ${item.riskScore}`
    };
    item.history = [...(item.history || []), historyItem];

    res.json({
      success: true,
      message: `事件 ${id} 狀態已成功更新為 ${item.status}`,
      incident: item,
      stats: getStats()
    });
  });

  // 7. POST /api/v1/incidents/:id/playbooks/execute (SOAR Playbook Execution)
  router.post('/:id/playbooks/execute', (req: Request, res: Response) => {
    const { id } = req.params;
    const item = criticalIncidents.find(i => i.id === id);
    if (!item) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    const { playbookTitle, type, operator } = req.body;
    const playbookType = (type || 'isolate') as 'isolate' | 'block' | 'revoke' | 'dump' | 'notify';

    // Transition status & reduce riskScore
    if (playbookType === 'isolate' || playbookType === 'block') {
      item.status = 'contained';
      item.riskScore = Math.max(2.0, Number((item.riskScore - 3.5).toFixed(1)));
    } else if (playbookType === 'revoke' || playbookType === 'notify') {
      item.status = 'contained';
      item.riskScore = Math.max(2.5, Number((item.riskScore - 2.8).toFixed(1)));
    } else {
      item.status = 'resolved';
      item.riskScore = Math.max(1.5, Number((item.riskScore - 4.2).toFixed(1)));
    }

    // Add note and history entry
    const noteEntry: IncidentNote = {
      id: `n-${Date.now()}`,
      author: operator || 'SOAR Automation Engine',
      timestamp: new Date().toLocaleTimeString(),
      content: `【自動化 SOAR 指令執行】成功下發：${playbookTitle || '防護處置劇本'} (${playbookType.toUpperCase()})。受害端點/威脅源連線已遭阻斷，事件狀態轉移為 ${item.status.toUpperCase()}。`
    };
    item.notes = [...(item.notes || []), noteEntry];

    const historyEntry: IncidentHistoryItem = {
      timestamp: new Date().toISOString(),
      action: 'PLAYBOOK_EXECUTED',
      operator: operator || 'SOAR Engine',
      details: `執行處置劇本: ${playbookTitle} (${playbookType})`
    };
    item.history = [...(item.history || []), historyEntry];

    res.json({
      success: true,
      message: `【自動化 SOAR 指令成功】已對 ${id} 執行：${playbookTitle || '防禦劇本'}`,
      incident: item,
      executionResult: {
        playbookTitle,
        type: playbookType,
        status: 'SUCCESS',
        executedAt: new Date().toISOString(),
        firewallRuleApplied: true,
        edrQuarantineApplied: playbookType === 'isolate',
        newIncidentStatus: item.status,
        updatedRiskScore: item.riskScore
      },
      stats: getStats()
    });
  });

  // 8. GET /api/v1/incidents/:id/notes (Get notes)
  router.get('/:id/notes', (req: Request, res: Response) => {
    const { id } = req.params;
    const item = criticalIncidents.find(i => i.id === id);
    if (!item) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    res.json({
      success: true,
      incidentId: id,
      notes: item.notes || []
    });
  });

  // 9. POST /api/v1/incidents/:id/notes (Add note)
  router.post('/:id/notes', (req: Request, res: Response) => {
    const { id } = req.params;
    const item = criticalIncidents.find(i => i.id === id);
    if (!item) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    const { content, author } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Note content is required' });
    }

    const newNote: IncidentNote = {
      id: `n-${Date.now()}`,
      author: author || 'Current Analyst',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
      content: content.trim()
    };

    item.notes = [...(item.notes || []), newNote];

    res.json({
      success: true,
      message: '鑑識備註已成功紀錄',
      note: newNote,
      notes: item.notes
    });
  });

  // 10. GET /api/v1/incidents/:id/topology (Attack graph topology)
  router.get('/:id/topology', (req: Request, res: Response) => {
    const { id } = req.params;
    const item = criticalIncidents.find(i => i.id === id);
    if (!item) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    const topology = {
      incidentId: id,
      threatActor: item.country === 'Internal' ? '內部惡意行為者 (Malicious Insider)' : `${item.country} APT 組織`,
      nodes: [
        { id: 'C2', type: 'attacker', label: item.country === 'Internal' ? '內部可疑來源' : '境外 C2 威脅節點', x: 120, y: 240, ip: item.srcip },
        { id: 'FW', type: 'gateway', label: '邊界防火牆閘道 (NextGen FW)', x: 300, y: 240, ip: '10.88.88.254' },
        { id: 'SW', type: 'network', label: '戰術核心交換網段 (Core Segment)', x: 500, y: 240, ip: '10.88.88.1' },
        { id: 'WS22', type: 'infected', label: `受害端點 (${item.srcHost || 'WS-DEV'})`, x: 700, y: 240, ip: item.srcip, patientZero: true },
        { id: 'TARGET', type: 'target', label: `目標資產 (${item.dstHost || 'Target'})`, x: 880, y: 150, ip: item.dstip },
        { id: 'DB', type: 'db', label: '國防敏感資料庫 (Vault)', x: 880, y: 330, ip: '10.200.1.50' }
      ],
      links: [
        { source: 'C2', target: 'FW', label: '初始突破', type: 'entry' },
        { source: 'FW', target: 'SW', label: '網段穿透', type: 'transit' },
        { source: 'SW', target: 'WS22', label: '載荷植入', type: 'infection' },
        { source: 'WS22', target: 'TARGET', label: '橫向突襲/外洩', type: 'lateral' },
        { source: 'WS22', target: 'DB', label: '特權探針', type: 'lateral' }
      ]
    };

    res.json({
      success: true,
      topology
    });
  });

  // 11. POST /api/v1/incidents/:id/ai-analyze (AI Threat Analysis)
  router.post('/:id/ai-analyze', (req: Request, res: Response) => {
    const { id } = req.params;
    const item = criticalIncidents.find(i => i.id === id);
    if (!item) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    // Dynamic AI Analysis derivation
    const aiTriageResult = {
      incidentId: id,
      analyzedAt: new Date().toISOString(),
      threatSeverityLevel: item.riskScore >= 9.5 ? 'CRITICAL_URGENT' : (item.riskScore >= 8.0 ? 'HIGH_PRIORITY' : 'ELEVATED'),
      confidenceScore: item.confidence,
      mitreKillChainStage: item.mitreStage,
      mitreTechnique: item.mitreTTP,
      iocFindings: [
        { type: 'IP', value: item.srcip, reputation: item.country === 'Internal' ? 'Suspicious Internal' : 'Malicious Tor/Proxy Node' },
        { type: 'Target', value: item.dstip, assetRole: item.dstHost || 'Core Production Node' },
        { type: 'CVE', value: item.cve || 'N/A', severity: 'Critical 9.8' }
      ],
      executiveTriage: item.aiSummary,
      recommendedContainmentSteps: item.recommendedPlaybooks.map(p => ({
        step: p.title,
        priority: p.type === 'isolate' ? 1 : 2,
        mechanism: p.description
      }))
    };

    res.json({
      success: true,
      analysis: aiTriageResult
    });
  });

  // 12. POST /api/v1/incidents (Create new incident)
  router.post('/', (req: Request, res: Response) => {
    const {
      srcip,
      srcHost,
      srcUser,
      dstip,
      dstHost,
      threat,
      action,
      risk,
      riskScore,
      category,
      mitreTTP,
      mitreStage,
      rawLog,
      aiSummary
    } = req.body;

    if (!srcip || !dstip || !threat) {
      return res.status(400).json({ error: 'srcip, dstip, and threat are required' });
    }

    const newId = `INC-2026-${Date.now().toString().slice(-4)}`;
    const newInc: CriticalIncidentItem = {
      id: newId,
      time: new Date().toISOString().replace('T', ' ').slice(0, 19),
      srcip,
      srcHost: srcHost || 'UNKNOWN-HOST',
      srcUser: srcUser || 'SYSTEM',
      dstip,
      dstHost: dstHost || 'CORE-ASSET',
      action: action || 'Network Anomaly',
      country: 'Internal',
      threat,
      risk: (risk as any) || 'High',
      riskScore: typeof riskScore === 'number' ? riskScore : 8.5,
      status: 'active',
      category: (category as any) || 'apt',
      cve: req.body?.cve || 'N/A',
      mitreTTP: mitreTTP || 'T1046 Network Discovery',
      mitreStage: (mitreStage as any) || 'Initial Access',
      affectedAssets: Number(req.body?.affectedAssets) || 1,
      confidence: Number(req.body?.confidence) || 95.0,
      payloadHex: req.body?.payloadHex || '41 54 54 41 43 4b 5f 50 41 59 4c 4f 41 44',
      rawLog: rawLog || JSON.stringify({ timestamp: new Date().toISOString(), src: srcip, dst: dstip, threat }, null, 2),
      aiSummary: aiSummary || `系統自動立案之威脅事件：${threat}`,
      recommendedPlaybooks: [
        { id: `pb-${Date.now()}-1`, title: '即時阻斷受害主機連外網路', description: '透過 EDR 下發網路隔離指令', type: 'isolate' },
        { id: `pb-${Date.now()}-2`, title: '下發邊界防火牆黑名單封鎖', description: '阻斷來源 IP 通信', type: 'block' }
      ],
      notes: [],
      history: [{ timestamp: new Date().toISOString(), action: 'INCIDENT_CREATED', operator: 'SOC System' }]
    };

    criticalIncidents.unshift(newInc);

    res.json({
      success: true,
      message: '嚴重資安事件立案成功',
      incident: newInc,
      stats: getStats()
    });
  });

  // 13. POST /api/v1/incidents/reset (Reset to initial data)
  router.post('/reset', (req: Request, res: Response) => {
    // Reset dataset
    criticalIncidents.forEach(item => {
      item.status = 'active';
      if (item.id === 'INC-2026-0804') item.status = 'contained';
      if (item.id === 'INC-2026-0802' || item.id === 'INC-2026-0806') item.status = 'investigating';
    });
    res.json({
      success: true,
      message: '嚴重事件資料集已重置回初始高擬真狀態',
      incidents: criticalIncidents,
      stats: getStats()
    });
  });

  return router;
}
