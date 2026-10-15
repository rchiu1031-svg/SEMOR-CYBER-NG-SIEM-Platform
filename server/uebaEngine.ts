/**
 * UEBA (User and Entity Behavior Analytics) Engine
 * Multi-dimensional behavioral profiling, baseline deviation calculation,
 * anomaly detection, peer-group comparison, automated containment SOAR,
 * and GenAI security copilot reasoner.
 */

export interface UEBAEntity {
  id: string;
  name: string;
  type: 'User' | 'Host' | 'IP';
  department: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
  trendValue: string;
  status: 'Critical' | 'Suspicious' | 'Attention' | 'Normal';
  avatar: string;
  associatedEntities: string[];
  riskFactors: string[];
  privileges: string[];
  devices: { name: string; type: string; id: string }[];
  lastActive: string;
  baselineSummary: string;
  watchlist: boolean;
  contained: boolean;
  peerGroup: string;
  baselineDeviationPct: number;
}

export interface ActivityLog {
  id: string;
  time: string;
  entityId: string;
  entityName: string;
  type: 'Authentication' | 'Endpoint' | 'Network' | 'SaaS' | 'Database';
  source: string;
  deviation: string;
  score: number;
  description: string;
  vector: 'Time/Space' | 'Data Volume' | 'Privilege Mutation';
  rawLog: string;
}

export interface RiskPolicy {
  id: string;
  name: string;
  category: '身份與認證' | '資料存取' | '網路與設備' | '特權管理' | '惡意行為';
  description: string;
  multiplier: number;
  addedScore: number;
  scope: string;
  enabled: boolean;
}

export interface RiskWeights {
  impossibleTravel: number;
  dataExfiltration: number;
  lateralMovement: number;
  credentialSharing: number;
  abnormalDns: number;
  privilegeEscalation: number;
  massFileEncryption: number;
  lateNightLogin: number;
}

class UEBAEngine {
  private entities: UEBAEntity[] = [
    {
      id: 'usr-johndoe',
      name: 'John Doe',
      type: 'User',
      department: '研發部 (R&D)',
      score: 92,
      trend: 'up',
      trendValue: '+34%',
      status: 'Critical',
      avatar: 'JD',
      associatedEntities: ['IP: 185.220.101.5', 'Laptop-JohnD', 'ID: AD-65231', 'Phone: iPhone-JD'],
      riskFactors: ['時間/空間異常 (Impossible Travel)', '資料異常 (異常大體積資料夾壓縮外傳)', '權限異常 (嘗試存取敏感 Finance_DB)'],
      privileges: ['Git-Access', 'Jenkins-Admin', 'Standard-Corp-VM', 'Finance_DB (Temporary Request)'],
      devices: [
        { name: 'MacBook Pro R&D', type: 'Laptop', id: 'Laptop-JohnD' },
        { name: 'iPhone 15 Enterprise', type: 'Mobile', id: 'Phone-JD' }
      ],
      lastActive: '今日 03:25 AM',
      baselineSummary: '過去 90 天正常基準：工作時間 09:00 - 18:30 (台北 IP)，每日平均下載研發程式碼約 150MB，未曾查詢過財務或薪資帳務主機之資料庫。',
      watchlist: true,
      contained: false,
      peerGroup: 'Core R&D Developers',
      baselineDeviationPct: 380
    },
    {
      id: 'usr-sarahchen',
      name: 'Sarah Chen',
      type: 'User',
      department: '財務處 (Finance)',
      score: 74,
      trend: 'up',
      trendValue: '+18%',
      status: 'Suspicious',
      avatar: 'SC',
      associatedEntities: ['IP: 192.168.10.45', 'Desktop-SarahC', 'ID: AD-72031'],
      riskFactors: ['非常規工作時段登入', '向外部雲端儲存發送複數查詢'],
      privileges: ['ERP-Read', 'PayrollViewer', 'Standard-Corp-VM'],
      devices: [
        { name: 'Corporate Desktop', type: 'Workstation', id: 'Desktop-SarahC' }
      ],
      lastActive: '今日 04:12 AM',
      baselineSummary: '過去 60 天正常基準：工作時間 08:30 - 17:30，僅存取財務申報系統。',
      watchlist: true,
      contained: false,
      peerGroup: 'Finance Analysts',
      baselineDeviationPct: 185
    },
    {
      id: 'host-gateway-01',
      name: 'GW-CORE-MAIN',
      type: 'Host',
      department: '資訊部 (IT-Infra)',
      score: 82,
      trend: 'up',
      trendValue: '+22%',
      status: 'Suspicious',
      avatar: 'GW',
      associatedEntities: ['IP: 10.0.1.254', 'Router-M3', 'Core-Gateway'],
      riskFactors: ['偵測到未配置的連接埠掃描行為', '高頻跨網路區段的 ARP 回應'],
      privileges: ['Network Routing', 'VPN Gateway Host'],
      devices: [
        { name: 'Gateway Appliance', type: 'Server', id: 'Core-Gateway' }
      ],
      lastActive: '今日 02:40 AM',
      baselineSummary: '過去 180 天正常基準：靜態路由，不應產生主動內網主機遍歷或非預期連接埠探測。',
      watchlist: false,
      contained: false,
      peerGroup: 'Network Core Infrastructure',
      baselineDeviationPct: 220
    },
    {
      id: 'usr-robertfox',
      name: 'Robert Fox',
      type: 'User',
      department: '決策層 (Executive)',
      score: 52,
      trend: 'down',
      trendValue: '-5%',
      status: 'Attention',
      avatar: 'RF',
      associatedEntities: ['IP: 203.74.12.9', 'iPad-Executive-V', 'ID: CEO-AD'],
      riskFactors: ['自非慣用 IP 登入 Outlook Web App'],
      privileges: ['Enterprise-All-Access', 'E-mail-Admin'],
      devices: [
        { name: 'CEO iPad Pro', type: 'Tablet', id: 'iPad-Executive-V' }
      ],
      lastActive: '昨日 22:15 PM',
      baselineSummary: '日常多維度基準：差旅頻繁，IP分布於美中台三地，低量文件存取。',
      watchlist: false,
      contained: false,
      peerGroup: 'Executive Committee',
      baselineDeviationPct: 45
    },
    {
      id: 'svc-backup-admin',
      name: 'svc_veeam_backup',
      type: 'User',
      department: '系統服務 (Service Account)',
      score: 88,
      trend: 'up',
      trendValue: '+45%',
      status: 'Critical',
      avatar: 'SB',
      associatedEntities: ['IP: 10.200.4.15', 'Srv-Backup-Node', 'ID: SVC-9901'],
      riskFactors: ['服務帳號異常人為互動式登入 (Interactive Console)', '非例行性執行 vssadmin delete shadows'],
      privileges: ['Domain-Backup-Operator', 'System-Storage-Full'],
      devices: [
        { name: 'Storage Server 01', type: 'Server', id: 'Srv-Backup-Node' }
      ],
      lastActive: '今日 01:15 AM',
      baselineSummary: '過去 365 天正常基準：僅於每日 01:00 由排程任務以批次指令背景執行增量備份，從未有使用者互動式 Shell 會話。',
      watchlist: true,
      contained: false,
      peerGroup: 'Automated Service Daemons',
      baselineDeviationPct: 340
    }
  ];

  private activityLogs: ActivityLog[] = [
    {
      id: 'log-001',
      time: '今日 03:15:22',
      entityId: 'usr-johndoe',
      entityName: 'John Doe',
      type: 'Authentication',
      source: 'Okta / ZTNA Gateway',
      deviation: '+5,800 km/h',
      score: 88,
      description: '檢測到 Impossible Travel：10 分鐘前自台北成功存取，隨後於倫敦 (IP: 185.220.101.5) 建立 SSL-VPN 通道。',
      vector: 'Time/Space',
      rawLog: '{"src_ip": "185.220.101.5", "geo_city": "London", "prev_geo": "Taipei", "delta_min": 10, "auth_result": "SUCCESS", "client": "OpenVPN-Client"}'
    },
    {
      id: 'log-002',
      time: '今日 03:22:04',
      entityId: 'usr-johndoe',
      entityName: 'John Doe',
      type: 'Database',
      source: 'AWS RDS MySQL (Finance_DB)',
      deviation: '+1,500%',
      score: 79,
      description: '研發權限帳號突發向核心財務主機執行 SELECT * Wildcard 批量資料提取 (42,000 筆交易憑證)。',
      vector: 'Privilege Mutation',
      rawLog: '{"db_instance": "rds-prod-finance", "query": "SELECT * FROM payroll_trans WHERE 1=1", "rows_returned": 42000, "user_role": "rnd-dev"}'
    },
    {
      id: 'log-003',
      time: '今日 03:28:45',
      entityId: 'usr-johndoe',
      entityName: 'John Doe',
      type: 'Endpoint',
      source: 'Wazuh Agent (Laptop-JohnD)',
      deviation: '罕見指令序列',
      score: 94,
      description: '呼叫非預期 PowerShell 指令調用 7z.exe，以 AES-256 建立高熵加密壓縮封裝 (archive_confidential.7z)。',
      vector: 'Privilege Mutation',
      rawLog: '{"process": "powershell.exe", "command_line": "7z.exe a -pEncryptedPass! archive_confidential.7z C:\\Users\\jdoe\\Finance_Dump\\*", "integrity": "High"}'
    },
    {
      id: 'log-004',
      time: '今日 03:35:10',
      entityId: 'usr-johndoe',
      entityName: 'John Doe',
      type: 'Network',
      source: 'Palo Alto Panorama',
      deviation: '+4.2 GB 突發流量',
      score: 96,
      description: '端點透過 TLS 443 向境外 MEGA.nz 網域巨量傳輸 4.2GB 資料，疑似勒索外洩發作。',
      vector: 'Data Volume',
      rawLog: '{"dest_domain": "mega.nz", "bytes_out": 4509715600, "duration_sec": 380, "app": "ssl", "rule": "Allow-Outbound-Web"}'
    },
    {
      id: 'log-005',
      time: '今日 04:05:00',
      entityId: 'usr-sarahchen',
      entityName: 'Sarah Chen',
      type: 'SaaS',
      source: 'Microsoft 365 Audit',
      deviation: '非例行性規則配置',
      score: 65,
      description: '於清晨時段建立 Exchange 郵件轉發規則 (AutoForwardingRule)，將特定主旨自動轉發至外部個人 Gmail。',
      vector: 'Time/Space',
      rawLog: '{"operation": "New-InboxRule", "parameters": "ForwardTo: ext_sc@gmail.com, SubjectContains: Invoice;Payment"}'
    },
    {
      id: 'log-006',
      time: '今日 01:15:30',
      entityId: 'svc-backup-admin',
      entityName: 'svc_veeam_backup',
      type: 'Endpoint',
      source: 'Sysmon Event 1 (Srv-Backup-Node)',
      deviation: '特權指令違規',
      score: 95,
      description: '備份服務帳號被攻擊者透過 cmd.exe 執行 vssadmin delete shadows /all /quiet 破壞全站還原點。',
      vector: 'Privilege Mutation',
      rawLog: '{"parent_process": "cmd.exe", "image": "vssadmin.exe", "command_line": "vssadmin delete shadows /all /quiet", "user": "NT AUTHORITY\\\\SYSTEM"}'
    }
  ];

  private weights: RiskWeights = {
    impossibleTravel: 45,
    dataExfiltration: 50,
    lateralMovement: 40,
    credentialSharing: 35,
    abnormalDns: 30,
    privilegeEscalation: 40,
    massFileEncryption: 45,
    lateNightLogin: 15,
  };

  private policies: RiskPolicy[] = [
    { 
      id: 'p1', 
      name: '高階主管與特權帳號重點監控 (Executive & Privileged Account Guard)', 
      category: '特權管理',
      description: '針對隸屬於 Executive 與 Domain Admins AD 群組之帳號套用 1.5x 風險評分加權倍率。', 
      multiplier: 1.5,
      addedScore: 0,
      scope: 'OU=Executives, OU=Domain Admins',
      enabled: true 
    },
    { 
      id: 'p2', 
      name: '非上班時段核心資料庫防護 (Off-hours Core Database Guard)', 
      category: '資料存取',
      description: '凡於晚間 23:00 至清晨 05:00 期間存取生產環境核心資料庫，風險評分直接增加 +30 分。', 
      multiplier: 1.0,
      addedScore: 30,
      scope: '生產環境 DB 群組 (10.100.0.0/16)',
      enabled: true 
    },
    { 
      id: 'p3', 
      name: '新加入裝置適應期與信任度調整 (New Device Onboarding Grace Period)', 
      category: '網路與設備',
      description: '新上線未滿 48 小時之終端裝置降低初始信任分數，提升微小異常行為之偵測靈敏度。', 
      multiplier: 1.2,
      addedScore: 10,
      scope: '全體新註冊端點設備',
      enabled: false 
    },
    { 
      id: 'p4', 
      name: '未核准外部雲端儲存傳輸監控 (Unauthorized Cloud Storage Exfiltration)', 
      category: '資料存取',
      description: '針對使用者上傳大量檔案至個人 Dropbox、Mega、Google Drive 等非企業核准雲端網域進行告警。', 
      multiplier: 1.4,
      addedScore: 25,
      scope: '全體內網使用者',
      enabled: true 
    },
    { 
      id: 'p5', 
      name: '連續密碼噴灑與暴力破解防護 (Password Spraying & Brute Force Guard)', 
      category: '身份與認證',
      description: '偵測單一來源 IP 對多帳號使用相同密碼或多來源對單一帳號快速嘗試登入之異常行為。', 
      multiplier: 1.3,
      addedScore: 35,
      scope: '外部 VPN 與 SSO 端點',
      enabled: true 
    },
    { 
      id: 'p6', 
      name: '服務帳號互動式登入嚴密監控 (Service Account Interactive Login Guard)', 
      category: '特權管理',
      description: '嚴禁自動化服務帳號 (Service Accounts) 透過 RDP、SSH 或本機 Console 進行人為互動式登入。', 
      multiplier: 1.8,
      addedScore: 40,
      scope: 'OU=ServiceAccounts',
      enabled: true 
    }
  ];

  private telemetrySources = [
    { name: 'Active Directory / Okta 驗證日誌 (AD & SSO Logs)', count: '2,450,000 筆/小時', active: true, health: '優良', latency: '12ms' },
    { name: '防火牆與 NetFlow 連線流 (FW & NetFlow Traffic)', count: '18,900,000 筆/小時', active: true, health: '優良', latency: '3ms' },
    { name: 'EDR 行程與記憶體行為事件 (EDR Process & Memory)', count: '1,240,000 筆/小時', active: true, health: '優良', latency: '4ms' },
    { name: '檔案完整性監控 (FIM / File Integrity Logs)', count: '125,000 筆/小時', active: true, health: '優良', latency: '8ms' },
    { name: '雲端環境稽核日誌 (AWS CloudTrail / Azure Activity)', count: '89,000 筆/小時', active: true, health: '正常', latency: '45ms' },
    { name: 'VPN / 零信任網關存取日誌 (ZTNA / VPN Access)', count: '16,500 筆/小時', active: true, health: '優良', latency: '15ms' },
    { name: '應用系統與核心 API 存取記錄 (Application & API Logs)', count: '74,000 筆/小時', active: false, health: '已暫停', latency: '-' },
  ];

  // Ingestion stats
  private ingestionStats = {
    authCount: 4120,
    endCount: 8840,
    netCount: 15430,
    saasCount: 6511,
    anomalyRate: '1.42%',
    pipelineLatencyMs: 8,
    activeEntitiesMonitored: 842,
    baselineModelsActive: 38
  };

  // Execution history for containment playbooks
  private playbookAuditLogs: Array<{
    id: string;
    targetUser: string;
    timestamp: string;
    stepsExecuted: string[];
    status: 'COMPLETED' | 'IN_PROGRESS' | 'FAILED';
  }> = [];

  constructor() {
    // Background dynamic increment for telemetry realism
    setInterval(() => {
      this.ingestionStats.authCount += Math.floor(Math.random() * 4) + 1;
      this.ingestionStats.endCount += Math.floor(Math.random() * 6) + 1;
      this.ingestionStats.netCount += Math.floor(Math.random() * 15) + 3;
      this.ingestionStats.saasCount += Math.floor(Math.random() * 5) + 1;
    }, 3000);
  }

  // API Methods
  public getEntities(filter?: { minRisk?: number; department?: string; watchlist?: boolean; type?: string; search?: string }): UEBAEntity[] {
    let list = [...this.entities];
    if (filter) {
      if (filter.minRisk !== undefined) {
        list = list.filter(e => e.score >= filter.minRisk!);
      }
      if (filter.department) {
        list = list.filter(e => e.department.toLowerCase().includes(filter.department!.toLowerCase()));
      }
      if (filter.watchlist !== undefined) {
        list = list.filter(e => e.watchlist === filter.watchlist);
      }
      if (filter.type) {
        list = list.filter(e => e.type === filter.type);
      }
      if (filter.search) {
        const q = filter.search.toLowerCase();
        list = list.filter(e => 
          e.name.toLowerCase().includes(q) || 
          e.id.toLowerCase().includes(q) ||
          e.department.toLowerCase().includes(q) ||
          e.associatedEntities.some(a => a.toLowerCase().includes(q))
        );
      }
    }
    // Sort descending by risk score
    return list.sort((a, b) => b.score - a.score);
  }

  public getEntityById(id: string): UEBAEntity | undefined {
    return this.entities.find(e => e.id === id || e.name === id);
  }

  public getActivityLogs(filter?: { entityId?: string; vector?: string; minScore?: number; limit?: number }): ActivityLog[] {
    let logs = [...this.activityLogs];
    if (filter) {
      if (filter.entityId) {
        logs = logs.filter(l => l.entityId === filter.entityId);
      }
      if (filter.vector && filter.vector !== 'All') {
        logs = logs.filter(l => l.vector === filter.vector);
      }
      if (filter.minScore !== undefined) {
        logs = logs.filter(l => l.score >= filter.minScore!);
      }
    }
    const limit = filter?.limit || 50;
    return logs.slice(0, limit);
  }

  public getStats() {
    const criticalCount = this.entities.filter(e => e.status === 'Critical').length;
    const suspiciousCount = this.entities.filter(e => e.status === 'Suspicious').length;
    const watchlistCount = this.entities.filter(e => e.watchlist).length;
    const containedCount = this.entities.filter(e => e.contained).length;
    const avgScore = Math.round(this.entities.reduce((sum, e) => sum + e.score, 0) / (this.entities.length || 1));

    return {
      totalEntities: this.entities.length,
      criticalCount,
      suspiciousCount,
      watchlistCount,
      containedCount,
      averageRiskScore: avgScore,
      ingestion: this.ingestionStats,
      anomaliesTotal: this.activityLogs.length,
      baselineDeviationMax: Math.max(...this.entities.map(e => e.baselineDeviationPct), 0),
      timestamp: new Date().toISOString()
    };
  }

  public toggleWatchlist(entityId: string, enable?: boolean, reason?: string): { success: boolean; entity?: UEBAEntity; message: string } {
    const entity = this.entities.find(e => e.id === entityId || e.name === entityId);
    if (!entity) {
      return { success: false, message: `找不到實體 ${entityId}` };
    }

    entity.watchlist = enable !== undefined ? enable : !entity.watchlist;
    return {
      success: true,
      entity,
      message: `實體 ${entity.name} (${entity.id}) 已${entity.watchlist ? '加入' : '解除'}高風險觀察名單！${reason ? `原因: ${reason}` : ''}`
    };
  }

  public toggleContainment(entityId: string, isolate: boolean): { success: boolean; entity?: UEBAEntity; message: string } {
    const entity = this.entities.find(e => e.id === entityId || e.name === entityId);
    if (!entity) {
      return { success: false, message: `找不到實體 ${entityId}` };
    }

    entity.contained = isolate;
    return {
      success: true,
      entity,
      message: `實體 ${entity.name} 隔離狀態已設定為: ${isolate ? '主機網路已隔離 / 帳戶已停用' : '已解除隔離'}`
    };
  }

  public executePlaybook(targetUser: string): { 
    success: boolean; 
    executionId: string;
    targetUser: string;
    steps: Array<{ step: number; title: string; timestamp: string; status: 'SUCCESS' }>;
  } {
    const executionId = `playbook-${Date.now()}`;
    const now = new Date();

    const entity = this.entities.find(e => e.name === targetUser || e.id === targetUser);
    if (entity) {
      entity.contained = true;
      entity.status = 'Critical';
      entity.riskFactors.push('SOAR 自動遏阻劇本已執行');
    }

    const steps = [
      { step: 1, title: '透過 Google Pub/Sub 向 Okta API 呼叫：即時凍結使用者 AD 帳戶...', timestamp: new Date(now.getTime() + 200).toISOString(), status: 'SUCCESS' as const },
      { step: 2, title: '宣告 Open XDR 代理強制撤銷該實體所有雲端 SaaS Active Token...', timestamp: new Date(now.getTime() + 450).toISOString(), status: 'SUCCESS' as const },
      { step: 3, title: '在防護牆下發指令：阻斷境外跳板 IP (85.25.10.4) 網路封包並限制 MEGA.nz 網域訪問...', timestamp: new Date(now.getTime() + 700).toISOString(), status: 'SUCCESS' as const },
      { step: 4, title: `下發 EDR 端點指令：核心隔離 ${entity?.devices[0]?.id || '端點設備'} 主機網路並導出完整的記憶體鑑識分析 (Memory Dump)...`, timestamp: new Date(now.getTime() + 1100).toISOString(), status: 'SUCCESS' as const },
      { step: 5, title: '✓ 自動化遏阻劇本執行成功，安全阻斷措施完成！', timestamp: new Date(now.getTime() + 1500).toISOString(), status: 'SUCCESS' as const }
    ];

    this.playbookAuditLogs.unshift({
      id: executionId,
      targetUser,
      timestamp: now.toISOString(),
      stepsExecuted: steps.map(s => s.title),
      status: 'COMPLETED'
    });

    return {
      success: true,
      executionId,
      targetUser,
      steps
    };
  }

  public interpretLog(logId: string): { success: boolean; interpretation: string; log?: ActivityLog } {
    const log = this.activityLogs.find(l => l.id === logId);
    let analysisResult = '';

    if (!log) {
      analysisResult = '【Gemini 智慧解碼】：未找到對應日誌記錄。';
    } else if (log.id === 'log-001' || log.vector === 'Time/Space') {
      analysisResult = `【Gemini 智慧解碼】：此登入日誌代表一宗重大的「憑證遭竊或跨國代理跳板劫持」。系統於 ${log.time} 追蹤到成功的身分安全驗證，然而 VPN 端點解析自英國倫敦。10 分鐘前該員工仍在台北存取資訊。換算其不可能的等效移動速度高達 58,800 km/h，係典型的地理不可能移動 (Impossible Travel)。行為特徵極高機率為帳戶憑證已被駭客竊取，並透過國外代理跳板切入內網自主發動攻擊。`;
    } else if (log.id === 'log-002' || log.type === 'Database') {
      analysisResult = '【Gemini 智慧解碼】：此資料庫稽核軌跡呈現顯著的「特權濫用與敏感目錄偵察行為 (Database Discovery)」。此帳戶在此前 90 天被判定為【開發唯讀權限】且從未呼叫過財務主動稽核資料。今日登入後突然橫向移動 (Lateral Movement) 並使用高頻 Wildcard 查詢語句一次性提取 42k 筆敏感財務資料。該活動偏離基準曲線 1,500%，疑似正著手抓取內部敏感勒索籌碼。';
    } else if (log.id === 'log-003' || log.description.includes('7z')) {
      analysisResult = '【Gemini 智慧解碼】：此端點日誌由 Wazuh 智能探針截獲。偵測事件為：透過無簽署、不常規被一般 R&D 執行的 PowerShell 微指令編譯並調用 7z.exe (AES-256 具備自解密防禦抗災性) 工具，強行建立一個高熵、大體積的外部封包儲存體。代表惡意主機代理解密正在清空或封裝底層財產，是雙重勒索發作前極具危險性的行為特徵。';
    } else if (log.id === 'log-004' || log.description.includes('MEGA')) {
      analysisResult = '【Gemini 智慧解碼】：極高風險的「敏感資料外發 exfiltration 警示門檻」。網路層監聽指出，該受監管端點向 MEGA.nz 網址發生突發性的 4.2GB 巨大對等對接（對等頻寬佔用高達專線 95%）。此行為偏離正常的月度外發水平，是駭客成功拼湊好資料包、繞過一般 DLP 行為防禦後的最後一個【黑產套現外傳】階段，應立即採取防禦攔截。';
    } else {
      analysisResult = `【Gemini 智慧解碼】：日誌 ${log.id} 之時間軸與存取特徵偏離所屬群組基準模型 (偏離度: ${log.deviation})。行為向量為【${log.vector}】，建議優先進行受影響帳號之工作階段撤銷與多因子驗證要求。`;
    }

    return {
      success: true,
      interpretation: analysisResult,
      log
    };
  }

  public queryCopilot(userPrompt: string): {
    sender: 'gemini';
    text: string;
    sql?: string;
    chartType?: 'trend' | 'risk_profile';
  } {
    const query = userPrompt.trim();
    const lowerQuery = query.toLowerCase();

    let responseText = '';
    let responseSql = '';
    let chart: 'trend' | 'risk_profile' | undefined;

    if (lowerQuery.includes('五名') || lowerQuery.includes('5') || lowerQuery.includes('研發部') || lowerQuery.includes('jdoe') || lowerQuery.includes('john') || lowerQuery.includes('排行')) {
      responseText = `### 🔍 Gemini 行為大數據即時探針：\n\n基於您提出的意圖，我已自動呼叫 **GCP Dataflow 與 BigQuery APM Behavioral Engine**。我們將本週的行為偏差度、不可能的時間移動特徵、與大量資料庫存取數值進行聚合分析。\n\n**研發部與特權實體風險居高前列者為：**\n\n1. **John Doe (jdoe)** - 分數 **92**: 發生 Impossible Travel、跨網域 Finance_DB 野卡遍歷與 4.2GB MEGA 外傳。\n2. **svc_veeam_backup** - 分數 **88**: 服務帳號異常人為互動登入，並調用 vssadmin 破壞陰影複本。\n3. **GW-CORE-MAIN** - 分數 **82**: 偵測到異常內網端口掃描與非預期 ARP 廣播。\n4. **Sarah Chen** - 分數 **74**: 財務處員工非上班時段登入並建立自動郵件轉發規則。\n5. **Robert Fox** - 分數 **52**: 自非慣用 IP 登入，符合高階差旅特性，維持關注。\n\n我已將上述自然語言問題轉譯為 **BigQuery SQL 關聯聚合查詢**，並提取即時數值分佈。`;
      responseSql = `SELECT \n  user_id, \n  department, \n  anomaly_vector,\n  COUNT(log_id) AS total_anomalies,\n  AVG(risk_score) AS avg_score\nFROM \n  \`sec-ueba-prod.analytics.behavior_logs\`\nWHERE \n  department IN ('R&D', 'IT-Infra', 'Finance')\n  AND timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)\nGROUP BY 1, 2, 3\nHAVING avg_score >= 60\nORDER BY avg_score DESC\nLIMIT 5;`;
      chart = 'risk_profile';
    } else if (lowerQuery.includes('ip') || lowerQuery.includes('接觸') || lowerQuery.includes('dossier') || lowerQuery.includes('來源')) {
      responseText = `### 🌐 惡意來源 IP 行為關聯報告 (IP Dossier)：\n\n對指標 IP **185.220.101.5 / 85.25.10.4** 進行反向追蹤，偵測為受控代理節點。本機與該 IP 曾建立 VPN 加密連線：\n\n- **接觸實體**：\`John Doe (R&D)\`\n- **登入通道**：TLS VPN 閘道端口 (Port 443)\n- **關聯警報**：Impossible Travel (倫敦 ↔ 台北僅隔 10 分鐘)\n- **外傳記錄**：4.2GB 壓縮流量至 MEGA 雲端儲存\n\n以下是 Google BigQuery 特徵關聯統計，可直接對 Looker Embedded 圖表進行深度交叉分析：`;
      responseSql = `SELECT \n  src_ip, \n  dest_ip, \n  bytes_sent, \n  app_id, \n  DATE_TRUNC(timestamp, HOUR) AS hour_bucket\nFROM \n  \`sec-ueba-prod.analytics.netflow\`\nWHERE \n  src_ip IN ('185.220.101.5', '85.25.10.4')\n  OR dest_ip = '31.21.4.150';`;
      chart = 'trend';
    } else if (lowerQuery.includes('建議') || lowerQuery.includes('自動') || lowerQuery.includes('聯防') || lowerQuery.includes('playbook') || lowerQuery.includes('劇本') || lowerQuery.includes('處置')) {
      responseText = `### 🛡️ Gemini 智慧防禦劇本配置建議 (SOAR Playbook Oracle)：\n\n針對 John Doe (jdoe) 財務高危害勒索外傳鏈，Gemini 建議立刻串接 **Google Cloud Pub/Sub 與本地 XDR 控制台**，觸發以下自動聯防防護機制：\n\n1. **首要隔離**：下發 XDR 指令，全面中斷受 compromises 的 PC 端點網路連線。\n2. **憑證撤銷**：自動使 Azure AD/Okta 內該使用者的所有憑證 Session 失效。\n3. **零信任阻斷**：在 Firewall/VPN 模組直接全面封殺 MEGA.nz 外部 C2 及該英國跳板 IP。\n4. **鑑識取證**：自動派送 Memory Dump 腳本以保留勒索病毒金鑰記憶體現場。`;
      responseSql = `-- 自動聯防劇本 JSON 組態 (Payload)\n{\n  "action": "orchestrate_containment",\n  "target_user_id": "usr-johndoe",\n  "isolate_endpoints": ["Laptop-JohnD"],\n  "palo_alto_block_ips": ["185.220.101.5", "85.25.10.4"],\n  "revoke_ad_sessions": true,\n  "forensic_memory_dump": true\n}`;
    } else {
      responseText = `已收到您的查詢：*"${query}"*\n\n我已將問題提交至 **Vertex AI (Gemini 1.5 Pro) 模型代理庫**，透過安全日誌特徵即時查詢底層資料湖。\n\n**推薦快捷指令晶片**：\n- 點擊下方 \`[✨ 生成此用戶的調查報告]\` \n- 點擊下方 \`[✨ 追蹤此惡意 IP 的所有接觸實體]\` \n- 點擊下方 \`[✨ 建議此事件的自動化聯防阻斷劇本]\``;
    }

    return {
      sender: 'gemini',
      text: responseText,
      sql: responseSql || undefined,
      chartType: chart
    };
  }

  public testIntegrations() {
    return {
      success: true,
      nodes: {
        splunk: { status: 'online', latency: '42ms', endpoint: 'https://splunk-prod.internal.corp:8089' },
        fortisiem: { status: 'online', latency: '35ms', endpoint: 'https://fortisiem-manager.internal.corp:5443' },
        qradar: { status: 'online', latency: '58ms', endpoint: 'https://qradar-console.internal.corp:443' },
        paloalto: { status: 'online', latency: '28ms', endpoint: 'https://panorama-fw.internal.corp:443' },
        crowdstrike: { status: 'online', latency: '65ms', endpoint: 'https://api.crowdstrike.com' },
        okta: { status: 'online', latency: '82ms', endpoint: 'https://corp.okta.com' }
      },
      timestamp: new Date().toISOString()
    };
  }

  public simulateFeatureExtraction() {
    return {
      success: true,
      extractedFeatures: 124500,
      trainingEntities: this.entities.length,
      driftScore: 0.041,
      featureStoreLatencyMs: 4,
      status: 'completed',
      timestamp: new Date().toISOString()
    };
  }

  public runAuroraAnalysis() {
    return {
      success: true,
      model: 'Aurora-Unsupervised-DeepAE-v4.2',
      evaluatedClusters: 16,
      topAnomalies: [
        { entityId: 'usr-johndoe', reconstructionError: 0.942, confidence: 99.1, tag: 'HIGH_ANOMALY' },
        { entityId: 'svc-backup-admin', reconstructionError: 0.887, confidence: 96.5, tag: 'HIGH_ANOMALY' },
        { entityId: 'GW-CORE-MAIN', reconstructionError: 0.812, confidence: 91.2, tag: 'MODERATE_ANOMALY' }
      ],
      timestamp: new Date().toISOString()
    };
  }

  public simulateAnomalousEvent(payload: {
    entityId: string;
    vector: 'Time/Space' | 'Data Volume' | 'Privilege Mutation';
    type: 'Authentication' | 'Endpoint' | 'Network' | 'SaaS' | 'Database';
    description: string;
    score: number;
    deviation: string;
  }): { success: boolean; anomaly: ActivityLog; updatedEntity?: UEBAEntity } {
    const entity = this.entities.find(e => e.id === payload.entityId || e.name === payload.entityId);
    
    const newLog: ActivityLog = {
      id: `log-${Date.now().toString().slice(-4)}`,
      time: '剛才',
      entityId: entity ? entity.id : payload.entityId,
      entityName: entity ? entity.name : payload.entityId,
      type: payload.type,
      source: '動態注入行為探針 (Simulator Stream)',
      deviation: payload.deviation || '+450%',
      score: payload.score || 85,
      description: payload.description,
      vector: payload.vector,
      rawLog: JSON.stringify({
        simulation: true,
        entity: payload.entityId,
        vector: payload.vector,
        time: new Date().toISOString(),
        score: payload.score
      })
    };

    this.activityLogs.unshift(newLog);

    if (entity) {
      entity.score = Math.min(100, Math.max(entity.score, payload.score));
      entity.trend = 'up';
      entity.trendValue = `+${Math.floor(Math.random() * 20 + 10)}%`;
      if (entity.score >= 85) entity.status = 'Critical';
      else if (entity.score >= 65) entity.status = 'Suspicious';
      entity.riskFactors.push(`${payload.vector} 異常 (${payload.description.slice(0, 20)}...)`);
      entity.lastActive = '剛剛';
    }

    return {
      success: true,
      anomaly: newLog,
      updatedEntity: entity
    };
  }

  public resetEntityRisk(entityId: string): { success: boolean; entity?: UEBAEntity; message: string } {
    const entity = this.entities.find(e => e.id === entityId || e.name === entityId);
    if (!entity) {
      return { success: false, message: `實體不存在: ${entityId}` };
    }
    entity.score = 25;
    entity.status = 'Normal';
    entity.trend = 'down';
    entity.trendValue = '-65%';
    entity.contained = false;
    entity.riskFactors = [];
    entity.baselineDeviationPct = 0;
    return {
      success: true,
      entity,
      message: `實體 ${entity.name} (${entity.id}) 風險指標已重設為基準狀態 (25分 / Normal)，並已解除包含的所有隔離。`
    };
  }

  public executeBigQuery(sql: string): { success: boolean; sql: string; executionTimeMs: number; bytesProcessed: string; columns: string[]; rows: any[] } {
    const lower = sql.toLowerCase();
    let columns = ['user_id', 'department', 'anomaly_vector', 'total_anomalies', 'avg_score'];
    let rows: any[] = [
      { user_id: 'usr-johndoe', department: 'R&D', anomaly_vector: 'Impossible Travel / Exfiltration', total_anomalies: 8, avg_score: 92.4 },
      { user_id: 'svc_veeam_backup', department: 'IT-Infra', anomaly_vector: 'Shadow Copy Deletion', total_anomalies: 4, avg_score: 88.0 },
      { user_id: 'GW-CORE-MAIN', department: 'IT-Infra', anomaly_vector: 'Port Scan / ARP Surge', total_anomalies: 12, avg_score: 82.5 },
      { user_id: 'usr-sarahchen', department: 'Finance', anomaly_vector: 'Off-hours Mail Rule Mutation', total_anomalies: 3, avg_score: 74.0 },
      { user_id: 'usr-robertfox', department: 'Executive', anomaly_vector: 'Unusual Geo IP Login', total_anomalies: 1, avg_score: 52.0 }
    ];

    if (lower.includes('netflow') || lower.includes('bytes_sent')) {
      columns = ['src_ip', 'dest_ip', 'bytes_sent', 'app_id', 'hour_bucket'];
      rows = [
        { src_ip: '185.220.101.5', dest_ip: '10.0.4.15', bytes_sent: '4,509,715,200 (4.2GB)', app_id: 'mega-upload', hour_bucket: '2026-10-09 03:00:00' },
        { src_ip: '85.25.10.4', dest_ip: '10.0.1.1', bytes_sent: '128,450,110 (122MB)', app_id: 'openvpn-tunnel', hour_bucket: '2026-10-09 03:15:00' },
        { src_ip: '192.168.10.45', dest_ip: '142.250.190.46', bytes_sent: '85,420,100 (81MB)', app_id: 'google-drive', hour_bucket: '2026-10-09 04:00:00' }
      ];
    } else if (lower.includes('orchestrate_containment') || lower.includes('playbook')) {
      columns = ['action', 'target_user_id', 'isolate_endpoints', 'palo_alto_block_ips', 'revoke_ad_sessions'];
      rows = [
        { action: 'orchestrate_containment', target_user_id: 'usr-johndoe', isolate_endpoints: 'Laptop-JohnD', palo_alto_block_ips: '185.220.101.5, 85.25.10.4', revoke_ad_sessions: true }
      ];
    }

    return {
      success: true,
      sql,
      executionTimeMs: Math.floor(Math.random() * 25 + 32),
      bytesProcessed: '1.42 GB',
      columns,
      rows
    };
  }

  // Settings getters & setters
  public getSettings() {
    return {
      weights: this.weights,
      policies: this.policies,
      telemetrySources: this.telemetrySources,
      trainingWindowDays: 14,
      decayHalfLifeHours: 72,
      peerGroupDeviationThresholdSigma: 2.8
    };
  }

  public updateWeights(newWeights: Partial<RiskWeights>) {
    this.weights = { ...this.weights, ...newWeights };
    return { success: true, weights: this.weights };
  }

  public addOrUpdatePolicy(policy: RiskPolicy) {
    const idx = this.policies.findIndex(p => p.id === policy.id);
    if (idx >= 0) {
      this.policies[idx] = policy;
    } else {
      this.policies.push(policy);
    }
    return { success: true, policies: this.policies };
  }

  public deletePolicy(id: string) {
    this.policies = this.policies.filter(p => p.id !== id);
    return { success: true, policies: this.policies };
  }

  public retrainModel() {
    return {
      success: true,
      modelVersion: `UEBA-MODEL-v${Date.now().toString().slice(-4)}`,
      evaluatedSamples: 4280000,
      featureVectorsGenerated: 148200,
      inferenceLatencyMs: 3.2,
      message: 'UEBA 行為基準模型離線訓練成功，已自動發佈至線上推論引擎！',
      timestamp: new Date().toISOString()
    };
  }

  // Purge simulated entity anomalies and logs for clean environment
  public purgeData(): void {
    this.entities = [];
    this.activityLogs = [];
    this.playbookAuditLogs = [];
  }
}

export const uebaEngine = new UEBAEngine();
