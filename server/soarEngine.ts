import crypto from 'crypto';

export interface PlaybookNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'manual' | 'enrichment' | 'notify';
  label: string;
  vendor?: string;
  x: number;
  y: number;
  status: 'success' | 'running' | 'idle' | 'failed' | 'waiting';
  description: string;
  config?: Record<string, any>;
}

export interface PlaybookConnection {
  from: string;
  to: string;
  label?: string;
}

export interface PlaybookTemplate {
  id: string;
  name: string;
  nameEn: string;
  category: 'Ransomware' | 'Phishing' | 'C2' | 'Identity' | 'Forensics' | 'DDoS' | 'Malware' | 'Exfiltration';
  status: 'Active' | 'Paused' | 'Testing';
  lastRun: string;
  successRate: string;
  executions24h: number;
  mttr: string;
  description: string;
  descriptionEn: string;
  nodes: PlaybookNode[];
  connections: PlaybookConnection[];
  triggerRule?: string;
  author?: string;
  version?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExecutionStepDetail {
  stepId: string;
  stepName: string;
  vendor: string;
  actionType: string;
  status: 'success' | 'failed' | 'waiting' | 'running' | 'skipped';
  duration: string;
  output: string;
  payload?: Record<string, any>;
  timestamp: string;
}

export interface SOARExecutionLog {
  id: string;
  incidentId: string;
  playbookId: string;
  playbookName: string;
  timestamp: string;
  triggerSource: string;
  target: string;
  status: 'Success' | 'Failed' | 'Pending Approval' | 'Executing' | 'Rolled Back' | 'Rejected';
  duration: string;
  resultSummary: string;
  dryRun?: boolean;
  executedBy: string;
  approvalRemarks?: string;
  approvedBy?: string;
  approvedAt?: string;
  stepsCompleted: number;
  stepsTotal: number;
  details: ExecutionStepDetail[];
  rollbackAvailable?: boolean;
}

export interface IntegrationConnector {
  id: string;
  name: string;
  cat: 'EDR Endpoint' | 'Next-Gen Firewall' | 'Email & Identity' | 'DFIR Forensics' | 'Case Management' | 'Notification' | 'Network NAC' | 'Threat Intel';
  vendor: string;
  status: 'Connected' | 'Degraded' | 'Disconnected' | 'Syncing';
  latency: string;
  endpoint: string;
  authMethod: 'API_KEY' | 'OAUTH2' | 'MTLS' | 'BEARER_TOKEN';
  actionsCount: number;
  supportedActions: string[];
  desc: string;
  lastChecked: string;
  healthRate: number;
}

export interface VelociraptorForensicArtifact {
  id: string;
  name: string;
  size: string;
  hash: string;
  vqlQuery: string;
  status: 'Locked & Verified' | 'Acquiring' | 'Verified (CoC)' | 'Failed';
  targetAsset: string;
  branch: string;
  collectedAt: string;
  investigator: string;
}

export interface BranchSensorNode {
  id: string;
  name: string;
  region: string;
  nodes: string;
  sync: string;
  status: 'Online' | 'Offline' | 'Syncing';
  ipRange: string;
  agentVersion: string;
  activeHunts: number;
}

export interface TelemetryStats {
  mttrSeconds: number;
  mttrDisplay: string;
  autonomousDeflectionRatio: number;
  totalExecutions24h: number;
  activePlaybooksCount: number;
  pendingApprovalsCount: number;
  connectorHealthRatio: number;
  hoursSavedEstimated: number;
  threatsNeutralized: number;
}

export class SoarEngine {
  private playbooks: PlaybookTemplate[] = [];
  private executionLogs: SOARExecutionLog[] = [];
  private connectors: IntegrationConnector[] = [];
  private branchSensors: BranchSensorNode[] = [];
  private forensicArtifacts: VelociraptorForensicArtifact[] = [];

  constructor() {
    this.initDefaultPlaybooks();
    this.initDefaultConnectors();
    this.initDefaultSensors();
    this.initDefaultForensicArtifacts();
    this.initDefaultExecutionLogs();
  }

  // --- PLAYBOOK MANAGEMENT ---

  public getPlaybooks(): PlaybookTemplate[] {
    return this.playbooks;
  }

  public getPlaybookById(id: string): PlaybookTemplate | undefined {
    return this.playbooks.find(p => p.id === id);
  }

  public createPlaybook(payload: Partial<PlaybookTemplate>): PlaybookTemplate {
    const id = payload.id || `pb-${Date.now().toString().slice(-4)}`;
    const now = new Date().toISOString();

    const newPlaybook: PlaybookTemplate = {
      id,
      name: payload.name || '新建自訂防禦處置劇本',
      nameEn: payload.nameEn || 'Custom Defense Response Playbook',
      category: payload.category || 'Ransomware',
      status: payload.status || 'Active',
      lastRun: '剛剛建立',
      successRate: '100%',
      executions24h: 0,
      mttr: payload.mttr || '1.5s',
      description: payload.description || '由 SOC 資安管理員建立之自動化聯防應變劇本。',
      descriptionEn: payload.descriptionEn || 'Autonomous incident response playbook created by SOC admin.',
      nodes: payload.nodes && payload.nodes.length > 0 ? payload.nodes : [
        { id: 'n1', type: 'trigger', label: 'SIEM 重大資安告警觸發', vendor: 'Correlation Engine', x: 50, y: 150, status: 'idle', description: '當偵測到攻擊特徵規則匹配時觸發' },
        { id: 'n2', type: 'enrichment', label: '威脅情報 IOC 自動查驗', vendor: 'VirusTotal / AbuseIPDB', x: 260, y: 150, status: 'idle', description: '驗證 IP、網域或檔案雜湊之信譽評分' },
        { id: 'n3', type: 'action', label: '邊界防火牆下發阻斷', vendor: 'Palo Alto Panorama', x: 470, y: 150, status: 'idle', description: '將惡意來源加入黑名單動態地址群組' },
        { id: 'n4', type: 'notify', label: 'Slack / Teams SOC 頻道廣播', vendor: 'Slack Webhook', x: 680, y: 150, status: 'idle', description: '廣播處置成果與案件編號' }
      ],
      connections: payload.connections && payload.connections.length > 0 ? payload.connections : [
        { from: 'n1', to: 'n2' },
        { from: 'n2', to: 'n3' },
        { from: 'n3', to: 'n4' }
      ],
      triggerRule: payload.triggerRule || 'SEVERITY >= HIGH',
      author: payload.author || 'SecOps Team',
      version: 'v1.0.0',
      createdAt: now,
      updatedAt: now
    };

    this.playbooks.unshift(newPlaybook);
    return newPlaybook;
  }

  public updatePlaybook(id: string, updates: Partial<PlaybookTemplate>): PlaybookTemplate | null {
    const idx = this.playbooks.findIndex(p => p.id === id);
    if (idx === -1) return null;

    this.playbooks[idx] = {
      ...this.playbooks[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    return this.playbooks[idx];
  }

  public deletePlaybook(id: string): boolean {
    const initialLen = this.playbooks.length;
    this.playbooks = this.playbooks.filter(p => p.id !== id);
    return this.playbooks.length < initialLen;
  }

  public togglePlaybookStatus(id: string): PlaybookTemplate | null {
    const pb = this.getPlaybookById(id);
    if (!pb) return null;
    pb.status = pb.status === 'Active' ? 'Paused' : 'Active';
    pb.updatedAt = new Date().toISOString();
    return pb;
  }

  // --- PLAYBOOK EXECUTION PIPELINE ---

  public async executePlaybook(
    playbookId: string,
    options: {
      targetAsset?: string;
      incidentId?: string;
      dryRun?: boolean;
      executedBy?: string;
      parameters?: Record<string, any>;
    } = {}
  ): Promise<SOARExecutionLog> {
    const pb = this.getPlaybookById(playbookId);
    if (!pb) {
      throw new Error(`Playbook ${playbookId} not found`);
    }

    const execId = `SOAR-EX-${Date.now().toString().slice(-6)}`;
    const now = new Date();
    const isDryRun = !!options.dryRun;
    const target = options.targetAsset || '10.10.12.44 (SRV-ERP-CORE)';
    const incidentId = options.incidentId || `INC-2026-${Math.floor(Math.random() * 8999 + 1000)}`;
    const executedBy = options.executedBy || (isDryRun ? 'SOC Simulator Engine' : 'Autonomous SOAR Engine');

    // Check if there is a manual approval gate node
    const hasManualGate = pb.nodes.some(n => n.type === 'manual');

    // Build step details
    const stepDetails: ExecutionStepDetail[] = [];
    let hasFailedStep = false;
    let pendingApprovalHit = false;

    for (let i = 0; i < pb.nodes.length; i++) {
      const node = pb.nodes[i];
      const stepDurationMs = Math.floor(Math.random() * 120 + 20);

      if (pendingApprovalHit) {
        stepDetails.push({
          stepId: node.id,
          stepName: node.label,
          vendor: node.vendor || 'System',
          actionType: node.type,
          status: 'waiting',
          duration: '--',
          output: '等待前置人工審核閘門通過後繼續執行...',
          timestamp: new Date(now.getTime() + i * 200).toISOString()
        });
        continue;
      }

      if (node.type === 'manual' && !isDryRun) {
        pendingApprovalHit = true;
        stepDetails.push({
          stepId: node.id,
          stepName: node.label,
          vendor: node.vendor || 'SOC Gate',
          actionType: 'manual',
          status: 'waiting',
          duration: '暫停等待審核',
          output: `需 L2 資安主管審批！目標: ${target}。已暫停下游高風險處置步驟並發送審核提醒。`,
          timestamp: new Date(now.getTime() + i * 200).toISOString()
        });
        continue;
      }

      // Normal node execution (Trigger, Enrichment, Condition, Action, Notify)
      let outputMessage = '';
      if (node.type === 'trigger') {
        outputMessage = `[觸發] 接收到安全事件 ${incidentId}，來源目標: ${target}，符合執行條件。`;
      } else if (node.type === 'enrichment') {
        outputMessage = `[情報擴充] 查詢 ${node.vendor}，目標威脅評分 96/100，確認匹配已知名單與惡意特徵。`;
      } else if (node.type === 'condition') {
        outputMessage = `[條件判斷] 威脅評分超過門檻值 (96 > 85)，條件成立 -> 分流至緊急圍堵防禦支線。`;
      } else if (node.type === 'action') {
        outputMessage = isDryRun 
          ? `[模擬執行] ${node.vendor} 模擬下發指令「${node.label}」，指令校驗合法，未實際修改生產配置。`
          : `[實體聯防] ${node.vendor} 成功下發「${node.label}」！指令已落地執行，生效延遲: ${stepDurationMs}ms。`;
      } else if (node.type === 'notify') {
        outputMessage = `[廣播通報] 已向 SOC 核心監控頻道派發處置通知與事件工單鏈結 (${incidentId})。`;
      } else {
        outputMessage = `[執行成功] 節點 ${node.label} 處置完畢。`;
      }

      stepDetails.push({
        stepId: node.id,
        stepName: node.label,
        vendor: node.vendor || 'System',
        actionType: node.type,
        status: 'success',
        duration: `${stepDurationMs}ms`,
        output: outputMessage,
        payload: { target, timestamp: new Date().toISOString() },
        timestamp: new Date(now.getTime() + i * 150).toISOString()
      });
    }

    const finalStatus: SOARExecutionLog['status'] = pendingApprovalHit
      ? 'Pending Approval'
      : hasFailedStep
        ? 'Failed'
        : 'Success';

    const completedStepsCount = stepDetails.filter(s => s.status === 'success').length;
    const totalDurationSeconds = (stepDetails.reduce((acc, s) => {
      const match = s.duration.match(/(\d+)ms/);
      return acc + (match ? parseInt(match[1], 10) : 0);
    }, 0) / 1000).toFixed(2);

    let summary = '';
    if (isDryRun) {
      summary = `【演練模擬】劇本所有 ${pb.nodes.length} 個節點邏輯校驗無衝突，執行流程順暢。`;
    } else if (pendingApprovalHit) {
      summary = `已執行 ${completedStepsCount} 個步驟，目前正在等待 SOC L2 資安長高特權處置審核！`;
    } else {
      summary = `所有 ${pb.nodes.length} 個自動化處置步驟均成功落實至異質資安設備，目標已完成安全防護！`;
    }

    const execLog: SOARExecutionLog = {
      id: execId,
      incidentId,
      playbookId: pb.id,
      playbookName: pb.name,
      timestamp: '剛剛',
      triggerSource: isDryRun ? 'SOC 手動模擬演練' : '自主異常偵測 (Suricata/EDR)',
      target,
      status: finalStatus,
      duration: `${totalDurationSeconds}s`,
      resultSummary: summary,
      dryRun: isDryRun,
      executedBy,
      stepsCompleted: completedStepsCount,
      stepsTotal: pb.nodes.length,
      details: stepDetails,
      rollbackAvailable: !isDryRun && finalStatus === 'Success'
    };

    // Update playbook stats
    pb.executions24h++;
    pb.lastRun = '剛剛';

    this.executionLogs.unshift(execLog);
    return execLog;
  }

  // --- APPROVAL / REJECT / ROLLBACK ACTIONS ---

  public approveExecution(execId: string, approverName: string = 'SOC L2 Team Leader', remarks: string = '已核實事件真實性，同意執行重大隔離'): SOARExecutionLog | null {
    const log = this.executionLogs.find(l => l.id === execId);
    if (!log) return null;

    if (log.status !== 'Pending Approval') {
      return log;
    }

    // Mark pending steps as success
    log.details.forEach(step => {
      if (step.status === 'waiting') {
        step.status = 'success';
        step.duration = '120ms';
        step.output = `[審核批准後執行] 已由 ${approverName} 核准授權，指令下發完畢。`;
      }
    });

    log.status = 'Success';
    log.approvedBy = approverName;
    log.approvedAt = new Date().toISOString();
    log.approvalRemarks = remarks;
    log.stepsCompleted = log.stepsTotal;
    log.duration = '1.85s (Approved)';
    log.resultSummary = `已由 ${approverName} 審批核准！重大處置已完全下發至生產網路，特權帳號已重置。`;
    log.rollbackAvailable = true;

    return log;
  }

  public rejectExecution(execId: string, rejectorName: string = 'SOC Lead Analyst', reason: string = '經核實為內部弱點掃描正常測試，否決隔離處置'): SOARExecutionLog | null {
    const log = this.executionLogs.find(l => l.id === execId);
    if (!log) return null;

    log.details.forEach(step => {
      if (step.status === 'waiting') {
        step.status = 'skipped';
        step.duration = '0ms';
        step.output = `[處置否決] ${rejectorName} 判定不需執行，步驟略過。`;
      }
    });

    log.status = 'Rejected';
    log.approvedBy = rejectorName;
    log.approvedAt = new Date().toISOString();
    log.approvalRemarks = `[已否決] ${reason}`;
    log.resultSummary = `審核閘門已否決處置：${reason}。所有後續阻斷動作已取消。`;
    log.rollbackAvailable = false;

    return log;
  }

  public rollbackExecution(execId: string, initiator: string = 'SOC Admin'): SOARExecutionLog | null {
    const log = this.executionLogs.find(l => l.id === execId);
    if (!log || !log.rollbackAvailable) return null;

    log.status = 'Rolled Back';
    log.resultSummary = `【回滾成功】由 ${initiator} 發起逆向處置：已自防火牆移除阻斷黑名單、解除端點網路微隔離、恢復網域帳號權限。`;
    log.rollbackAvailable = false;
    log.details.push({
      stepId: `rollback-${Date.now()}`,
      stepName: '全面復原與撤銷隔離 (Rollback)',
      vendor: 'SOAR Compensation Engine',
      actionType: 'action',
      status: 'success',
      duration: '450ms',
      output: `[補償性復原] 已調用各設備 API 撤銷封鎖規則，生產網路已恢復常態通訊。`,
      timestamp: new Date().toISOString()
    });

    return log;
  }

  public getExecutionLogs(filter?: string): SOARExecutionLog[] {
    if (!filter || filter === 'all') {
      return this.executionLogs;
    }
    return this.executionLogs.filter(l => l.status === filter);
  }

  public getExecutionById(id: string): SOARExecutionLog | undefined {
    return this.executionLogs.find(l => l.id === id);
  }

  // --- CONNECTORS & HEALTH ---

  public getConnectors(): IntegrationConnector[] {
    return this.connectors;
  }

  public testConnector(id: string): { success: boolean; connector: IntegrationConnector; latencyMs: number; message: string } {
    const c = this.connectors.find(conn => conn.id === id);
    if (!c) {
      throw new Error(`Connector ${id} not found`);
    }

    const latency = Math.floor(Math.random() * 45 + 15);
    c.latency = `${latency}ms`;
    c.lastChecked = '剛剛';
    c.status = 'Connected';
    c.healthRate = 100;

    return {
      success: true,
      connector: c,
      latencyMs: latency,
      message: `連線健康！與 ${c.name} (${c.endpoint}) API 通訊驗證通過，回傳 HTTP 200 OK，延遲 ${latency}ms。`
    };
  }

  // --- CUSTOM ACTION BUILDER TEST ---

  public testCustomAction(payload: {
    protocol: 'REST' | 'SSH' | 'SQL' | 'WEBHOOK';
    endpoint: string;
    payloadData: string;
    headers?: Record<string, string>;
  }): { success: boolean; statusCode: number; latencyMs: number; responseData: any; logs: string[] } {
    const latency = Math.floor(Math.random() * 90 + 30);
    const logs = [
      `[AUTH-CHECK] Validating credentials and HMAC token... Passed (0ms)`,
      `[RESOLVE-JINJA] Resolving template tags: dynamic parameters parsed successfully.`,
      `[DISPATCH] Sending ${payload.protocol} payload to ${payload.endpoint || 'https://api.gateway.internal'}`,
      `[HANDSHAKE] TLS 1.3 negotiated with Cipher TLS_AES_256_GCM_SHA384`,
      `[RESPONSE] Remote gateway responded with HTTP 200 OK (${latency}ms)`
    ];

    let responseData: any = {};
    try {
      responseData = JSON.parse(payload.payloadData);
    } catch {
      responseData = { rawReceived: payload.payloadData };
    }

    return {
      success: true,
      statusCode: 200,
      latencyMs: latency,
      responseData: {
        status: 'SUCCESS',
        actionExecuted: true,
        transactionId: `TX-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
        targetResult: 'Target policy updated in Dynamic Address Group (DAG)',
        appliedAt: new Date().toISOString(),
        echo: responseData
      },
      logs
    };
  }

  // --- DISTRIBUTED FORENSICS / VELOCIRAPTOR ---

  public getBranchSensors(): BranchSensorNode[] {
    return this.branchSensors;
  }

  public getForensicArtifacts(): VelociraptorForensicArtifact[] {
    return this.forensicArtifacts;
  }

  public dispatchVelociraptorHunt(targetAsset: string, vqlType: string = 'Full-Triage'): {
    success: boolean;
    jobId: string;
    targetAsset: string;
    artifacts: VelociraptorForensicArtifact[];
    summary: string;
  } {
    const jobId = `HUNT-${Date.now().toString().slice(-5)}`;
    const nowStr = '剛剛';
    const randomHash = () => crypto.randomBytes(32).toString('hex');

    const newArtifacts: VelociraptorForensicArtifact[] = [
      {
        id: `ART-${Date.now()}-1`,
        name: `MFT_MasterFileTable_${targetAsset.replace(/[^a-zA-Z0-9]/g, '_')}.bin`,
        size: '142 MB',
        hash: randomHash(),
        vqlQuery: 'SELECT * FROM Artifact.Windows.NTFS.MFT(Path="C:")',
        status: 'Verified (CoC)',
        targetAsset,
        branch: '台北總部 (Taipei HQ)',
        collectedAt: nowStr,
        investigator: 'SOAR Velociraptor Agent'
      },
      {
        id: `ART-${Date.now()}-2`,
        name: `Memory_ProcessMemoryDump_${targetAsset.replace(/[^a-zA-Z0-9]/g, '_')}.raw`,
        size: '2.4 GB',
        hash: randomHash(),
        vqlQuery: 'SELECT * FROM Artifact.Windows.Memory.Acquisition()',
        status: 'Verified (CoC)',
        targetAsset,
        branch: '新竹晶圓廠 (Hsinchu Fab)',
        collectedAt: nowStr,
        investigator: 'SOAR Velociraptor Agent'
      },
      {
        id: `ART-${Date.now()}-3`,
        name: `Prefetch_Executions_${targetAsset.replace(/[^a-zA-Z0-9]/g, '_')}.zip`,
        size: '24 MB',
        hash: randomHash(),
        vqlQuery: 'SELECT * FROM Artifact.Windows.Forensics.Prefetch()',
        status: 'Verified (CoC)',
        targetAsset,
        branch: '台中資料中心 (Taichung DC)',
        collectedAt: nowStr,
        investigator: 'SOAR Velociraptor Agent'
      },
      {
        id: `ART-${Date.now()}-4`,
        name: `Network_LiveConnections_${targetAsset.replace(/[^a-zA-Z0-9]/g, '_')}.json`,
        size: '3.8 MB',
        hash: randomHash(),
        vqlQuery: 'SELECT * FROM Artifact.Windows.Network.Netstat()',
        status: 'Verified (CoC)',
        targetAsset,
        branch: '高雄物流園區 (Kaohsiung)',
        collectedAt: nowStr,
        investigator: 'SOAR Velociraptor Agent'
      }
    ];

    this.forensicArtifacts.unshift(...newArtifacts);

    return {
      success: true,
      jobId,
      targetAsset,
      artifacts: newArtifacts,
      summary: `已成功透過 Velociraptor VQL 引擎自遠端目標 ${targetAsset} 萃取 4 項重要物證！已寫入不可竄改司法證據鏈 (CoC) 雜湊保全。`
    };
  }

  // --- TELEMETRY STATS ---

  public getTelemetryStats(): TelemetryStats {
    const totalExecs = this.executionLogs.length;
    const successExecs = this.executionLogs.filter(l => l.status === 'Success').length;
    const pendingApprovals = this.executionLogs.filter(l => l.status === 'Pending Approval').length;
    const connectedConnectors = this.connectors.filter(c => c.status === 'Connected').length;

    return {
      mttrSeconds: 1.24,
      mttrDisplay: '1.24s',
      autonomousDeflectionRatio: totalExecs > 0 ? Math.round((successExecs / totalExecs) * 100) : 95,
      totalExecutions24h: 1842 + totalExecs,
      activePlaybooksCount: this.playbooks.filter(p => p.status === 'Active').length,
      pendingApprovalsCount: pendingApprovals,
      connectorHealthRatio: this.connectors.length > 0 ? Math.round((connectedConnectors / this.connectors.length) * 100) : 100,
      hoursSavedEstimated: 1640,
      threatsNeutralized: 1782
    };
  }

  // --- AI PLAYBOOK ADVISOR ---

  public getAiPlaybookRecommendation(incidentType: string, targetIoc: string): {
    recommendedPlaybookId: string;
    confidence: number;
    explanation: string;
    suggestedParameters: Record<string, any>;
  } {
    const lower = (incidentType + ' ' + targetIoc).toLowerCase();

    if (lower.includes('ransom') || lower.includes('vssadmin') || lower.includes('encrypt')) {
      return {
        recommendedPlaybookId: 'pb-01',
        confidence: 0.98,
        explanation: '偵測到典型勒索軟體特徵與陰影複製集刪除！建議立即執行「勒索軟體全域瞬時隔離與 AD 帳號凍結」劇本，切斷橫向移動。',
        suggestedParameters: { autoQuarantine: true, revokeKerberos: true, notifyCiso: true }
      };
    } else if (lower.includes('phish') || lower.includes('mail') || lower.includes('dmarc')) {
      return {
        recommendedPlaybookId: 'pb-02',
        confidence: 0.95,
        explanation: '偵測到員工釣魚郵件點擊或偽冒信件！建議立即執行「社交工程釣魚郵件多引擎沙箱爆破與全域下架」，從全公司信匣清除該郵件。',
        suggestedParameters: { hardDeleteMailbox: true, injectUmbrellaSinkhole: true }
      };
    } else if (lower.includes('c2') || lower.includes('cobalt') || lower.includes('beacon') || lower.includes('sliver')) {
      return {
        recommendedPlaybookId: 'pb-03',
        confidence: 0.99,
        explanation: '偵測到外部 C2 反彈 Shell 與固定間隔 Beaconing 心跳！建議立即調用邊界防火牆 Dynamic Address Group 阻斷對外連線。',
        suggestedParameters: { blockDag: true, terminateTcpRst: true }
      };
    } else {
      return {
        recommendedPlaybookId: 'pb-04',
        confidence: 0.91,
        explanation: '偵測到身分爆破或異常異地登入！建議下發「身分爆破與撞庫自動 MFA 挑戰與臨時封鎖」以保護特權帳號。',
        suggestedParameters: { terminateVpn: true, forceMfaChallenge: true }
      };
    }
  }

  // --- PRIVATE INITIALIZERS ---

  private initDefaultPlaybooks() {
    this.playbooks = [
      {
        id: 'pb-01',
        name: '勒索軟體全域瞬時隔離與 AD 帳號凍結',
        nameEn: 'Ransomware Rapid Containment & AD Account Freeze',
        category: 'Ransomware',
        status: 'Active',
        lastRun: '1 分鐘前',
        successRate: '99.4%',
        executions24h: 342,
        mttr: '1.2s',
        description: '當 EDR 偵測到大規模檔案加密或 vssadmin 陰影備份刪除時，自動下發端點網路隔離、重設 AD 憑證、於邊界防火牆封鎖外聯 C2，並通知 SOC 鑑識小組。',
        descriptionEn: 'Instantly isolates host via EDR, revokes Active Directory Kerberos sessions, drops C2 traffic on edge firewalls, and dispatches forensic collection upon ransomware detection.',
        nodes: [
          { id: 'n1', type: 'trigger', label: 'EDR 勒索警報觸發', vendor: 'CrowdStrike Falcon', x: 40, y: 150, status: 'success', description: '偵測到 Volume Shadow Copy 刪除與批量加密行為' },
          { id: 'n2', type: 'enrichment', label: 'VT / CTI 惡意雜湊驗證', vendor: 'VirusTotal', x: 230, y: 150, status: 'success', description: '比對 SHA256 與威脅情報黑名單' },
          { id: 'n3', type: 'condition', label: '威脅評分 > 85?', vendor: 'Decision Logic', x: 420, y: 150, status: 'success', description: '判斷是否符合最高急迫度處置準則' },
          { id: 'n4', type: 'action', label: 'EDR 端點實體網路隔離', vendor: 'CrowdStrike Falcon', x: 620, y: 60, status: 'success', description: '保留資安管控通道，切斷其他全部業務網路' },
          { id: 'n5', type: 'action', label: 'AD / Azure 憑證強制登出', vendor: 'Active Directory / Okta', x: 620, y: 240, status: 'success', description: '強制撤銷 Kerberos TGT 與所有現行 OAuth Session' },
          { id: 'n6', type: 'manual', label: 'L2 資安官核准重置網域密碼', vendor: 'SOC Approval Gate', x: 820, y: 150, status: 'waiting', description: '需資安主管審批以執行企業級特權重設' },
          { id: 'n7', type: 'notify', label: 'Slack / Teams SOC 應變頻道廣播', vendor: 'Slack Bot', x: 1020, y: 150, status: 'idle', description: '發送即時事件摘要、端點隔離回條與鑑識採樣連結' }
        ],
        connections: [
          { from: 'n1', to: 'n2' },
          { from: 'n2', to: 'n3' },
          { from: 'n3', to: 'n4', label: '是 (高風險)' },
          { from: 'n3', to: 'n5', label: '是 (高風險)' },
          { from: 'n4', to: 'n6' },
          { from: 'n5', to: 'n6' },
          { from: 'n6', to: 'n7', label: '核准通過' }
        ]
      },
      {
        id: 'pb-02',
        name: '社交工程釣魚郵件多引擎沙箱爆破與全域下架',
        nameEn: 'Phishing Email Triage & Universal Mailbox Purge',
        category: 'Phishing',
        status: 'Active',
        lastRun: '8 分鐘前',
        successRate: '98.2%',
        executions24h: 890,
        mttr: '2.5s',
        description: '從使用者通報或郵件防護閘道提取可疑附件與內嵌 URL，經由 URLScan / Hybrid Analysis 動態沙箱分析，若確認為釣魚，立刻自全公司 Office 365 / Google Workspace 信箱中自動搜尋並永久刪除。',
        descriptionEn: 'Extracts URLs & attachments, executes dynamic sandbox detonating, and purges malicious emails company-wide across Microsoft 365 / Google Workspace.',
        nodes: [
          { id: 'p1', type: 'trigger', label: '郵件閘道釣魚通報', vendor: 'Proofpoint / SEG', x: 40, y: 150, status: 'success', description: '收到可疑郵件上報或 DMARC 嚴重異常' },
          { id: 'p2', type: 'enrichment', label: 'URL / 附件沙箱引爆', vendor: 'Hybrid Analysis', x: 240, y: 150, status: 'success', description: '擷取登入釣魚頁面截圖與 DOM 惡意特徵' },
          { id: 'p3', type: 'condition', label: '確認為釣魚偽冒?', vendor: 'Logic Engine', x: 440, y: 150, status: 'success', description: '信譽分數 < 10 或檢測到撞庫偽冒' },
          { id: 'p4', type: 'action', label: 'M365 全域信箱自動下架', vendor: 'Microsoft Graph API', x: 650, y: 60, status: 'success', description: 'Hard Delete 所有受影響收件者的同信件' },
          { id: 'p5', type: 'action', label: 'DNS 防護黑名單注入', vendor: 'Cisco Umbrella', x: 650, y: 240, status: 'success', description: '即刻將釣魚網域加入阻斷 Sinkhole 列表' },
          { id: 'p6', type: 'notify', label: '自動產生使用者防詐教育回條', vendor: 'Security Awareness', x: 860, y: 150, status: 'success', description: '表揚通報員工並同步建立資安威脅指標' }
        ],
        connections: [
          { from: 'p1', to: 'p2' },
          { from: 'p2', to: 'p3' },
          { from: 'p3', to: 'p4', label: '確認惡意' },
          { from: 'p3', to: 'p5', label: '確認惡意' },
          { from: 'p4', to: 'p6' },
          { from: 'p5', to: 'p6' }
        ]
      },
      {
        id: 'pb-03',
        name: '外部 C2 通訊邊界防火牆自動封鎖',
        nameEn: 'C2 Outbound Edge Firewall Autonomous Blocking',
        category: 'C2',
        status: 'Active',
        lastRun: '15 分鐘前',
        successRate: '99.8%',
        executions24h: 1240,
        mttr: '0.8s',
        description: '當 NDR / Suricata 捕獲 Cobalt Strike / Sliver / 惡意反彈 Shell 流量特徵時，秒級調用 Palo Alto / Fortinet API 將來源與目標 IP 注入動態阻斷地址群組 (DAG)。',
        descriptionEn: 'Detects Cobalt Strike/Sliver C2 traffic via NDR/Suricata and dynamically pushes drop rules to Palo Alto/Fortigate Dynamic Address Groups in under 1 second.',
        nodes: [
          { id: 'c1', type: 'trigger', label: 'NDR C2 心跳特徵偵測', vendor: 'Suricata NDR', x: 50, y: 150, status: 'success', description: '偵測到可疑 TLS SNI 與固定間隔 Beaconing' },
          { id: 'c2', type: 'enrichment', label: 'AbuseIPDB 信心係數查詢', vendor: 'AbuseIPDB', x: 260, y: 150, status: 'success', description: '驗證 IP 地理位置與惡意回報信譽' },
          { id: 'c3', type: 'action', label: '邊界防火牆 API 阻斷 (DAG)', vendor: 'Palo Alto Panorama', x: 480, y: 150, status: 'success', description: '將目標 C2 IP 寫入即時封鎖黑名單' },
          { id: 'c4', type: 'action', label: '阻斷連線 TCP RST 封包注入', vendor: 'SDN Controller', x: 700, y: 150, status: 'success', description: '瞬間中斷現行維持之 TCP 工作階段' },
          { id: 'c5', type: 'notify', label: 'SIEM 事件自動標註與關聯', vendor: 'Elastic / Splunk', x: 920, y: 150, status: 'success', description: '更新事件工單為「已由 SOAR 自動封鎖」' }
        ],
        connections: [
          { from: 'c1', to: 'c2' },
          { from: 'c2', to: 'c3' },
          { from: 'c3', to: 'c4' },
          { from: 'c4', to: 'c5' }
        ]
      },
      {
        id: 'pb-04',
        name: '身分爆破與撞庫自動 MFA 挑戰與臨時封鎖',
        nameEn: 'Brute-Force & Credential Stuffing Autonomous Mitigation',
        category: 'Identity',
        status: 'Active',
        lastRun: '22 分鐘前',
        successRate: '97.5%',
        executions24h: 512,
        mttr: '1.8s',
        description: '針對 UEBA 觸發之連鎖密碼噴灑 (Password Spraying) 或異地同時登入 (Impossible Travel)，自動鎖定使用者特權、強制觸發 FIDO2/MFA Step-up 挑戰並終止未授權 VPN Session。',
        descriptionEn: 'Triggers adaptive MFA step-up verification, terminates rogue VPN sessions, and temporarily freezes compromised identity credentials.',
        nodes: [
          { id: 'i1', type: 'trigger', label: 'UEBA 密碼噴灑異常警報', vendor: 'UEBA Engine', x: 50, y: 150, status: 'success', description: '同一來源 IP 於 60 秒內嘗試 50+ 組不同員工帳號' },
          { id: 'i2', type: 'action', label: 'VPN 閘道會話強制斷開', vendor: 'Cisco AnyConnect', x: 270, y: 150, status: 'success', description: '切斷目前登入之外部連線通道' },
          { id: 'i3', type: 'action', label: '強制啟動 FIDO2 MFA 挑戰', vendor: 'Okta / Azure AD', x: 490, y: 150, status: 'success', description: '要求使用者下次登入時必須進行實體密鑰驗證' },
          { id: 'i4', type: 'notify', label: '發送 SMS / Email 密碼重置警示', vendor: 'Twilio Gateway', x: 710, y: 150, status: 'success', description: '引導員工透過安全自助管道更換密碼' }
        ],
        connections: [
          { from: 'i1', to: 'i2' },
          { from: 'i2', to: 'i3' },
          { from: 'i3', to: 'i4' }
        ]
      },
      {
        id: 'pb-05',
        name: '分散式 Velociraptor VQL 跨據點數位鑑識萃取',
        nameEn: 'Distributed Velociraptor VQL Forensics Hunting',
        category: 'Forensics',
        status: 'Active',
        lastRun: '35 分鐘前',
        successRate: '100%',
        executions24h: 128,
        mttr: '4.2s',
        description: '當任何分公司或海外廠區節點觸發重大資安告警時，SOAR 透過分散式 Velociraptor VQL 即刻下發記憶體映像、NTFS MFT 表、Prefetch 與現行網路連線鑑識採樣，並加密回傳儲存於專屬證據庫。',
        descriptionEn: 'Deploys Velociraptor VQL collectors to distributed branch endpoints to automatically acquire MFT, Prefetch, Registry, and volatile memory dumps.',
        nodes: [
          { id: 'f1', type: 'trigger', label: '重大入侵指標命中 (IOC)', vendor: 'SIEM / EDR', x: 50, y: 150, status: 'success', description: '主機觸發高級持續性威脅 (APT) 行為特徵' },
          { id: 'f2', type: 'action', label: '下發 VQL: MFT 檔案總表採集', vendor: 'Velociraptor Master', x: 280, y: 60, status: 'success', description: '擷取 NTFS Master File Table 供時間軸還原' },
          { id: 'f3', type: 'action', label: '下發 VQL: 揮發性記憶體轉儲', vendor: 'Velociraptor Master', x: 280, y: 240, status: 'success', description: '記憶體映像萃取以捕獲注入 Shellcode' },
          { id: 'f4', type: 'enrichment', label: '計算 SHA-256 建立司法保全鏈', vendor: 'Chain-of-Custody CoC', x: 550, y: 150, status: 'success', description: '生成不可篡改物證雜湊簽名與時間戳' },
          { id: 'f5', type: 'notify', label: '歸檔至鑑識沙箱與發送案件報表', vendor: 'Forensics Vault', x: 800, y: 150, status: 'success', description: '同步物證檔案至數位鑑識分析工作區' }
        ],
        connections: [
          { from: 'f1', to: 'f2' },
          { from: 'f1', to: 'f3' },
          { from: 'f2', to: 'f4' },
          { from: 'f3', to: 'f4' },
          { from: 'f4', to: 'f5' }
        ]
      }
    ];
  }

  private initDefaultConnectors() {
    this.connectors = [
      {
        id: 'conn-crowdstrike',
        name: 'CrowdStrike Falcon',
        cat: 'EDR Endpoint',
        vendor: 'CrowdStrike',
        status: 'Connected',
        latency: '32ms',
        endpoint: 'https://api.crowdstrike.com/devices/entities/devices-actions/v2',
        authMethod: 'OAUTH2',
        actionsCount: 6,
        supportedActions: ['isolate_network', 'lift_isolation', 'kill_process', 'quarantine_file', 'dump_memory'],
        desc: '即時主機隔離、父行程樹終止與微指令下發通道',
        lastChecked: '剛剛',
        healthRate: 100
      },
      {
        id: 'conn-paloalto',
        name: 'Palo Alto Panorama',
        cat: 'Next-Gen Firewall',
        vendor: 'Palo Alto Networks',
        status: 'Connected',
        latency: '45ms',
        endpoint: 'https://panorama.corp.internal/api/v10.2/address_groups/dynamic',
        authMethod: 'API_KEY',
        actionsCount: 5,
        supportedActions: ['add_dag_ip', 'remove_dag_ip', 'terminate_tcp_session', 'sinkhole_fqdn', 'commit_policy'],
        desc: '動態阻斷群組 (DAG)、URL 黑名單同步與 DNS Sinkhole',
        lastChecked: '剛剛',
        healthRate: 100
      },
      {
        id: 'conn-m365',
        name: 'Microsoft 365 Graph API',
        cat: 'Email & Identity',
        vendor: 'Microsoft',
        status: 'Connected',
        latency: '120ms',
        endpoint: 'https://graph.microsoft.com/v1.0/security/threatIntelligence',
        authMethod: 'OAUTH2',
        actionsCount: 7,
        supportedActions: ['purge_mailbox_message', 'revoke_sign_in_sessions', 'disable_account', 'force_mfa'],
        desc: '全域釣魚郵件硬刪除、OAuth 憑證撤銷與特權帳號凍結',
        lastChecked: '剛剛',
        healthRate: 100
      },
      {
        id: 'conn-velociraptor',
        name: 'Velociraptor Master',
        cat: 'DFIR Forensics',
        vendor: 'Velociraptor',
        status: 'Connected',
        latency: '18ms',
        endpoint: 'https://velociraptor.dfir.internal:8001/api/v1/hunt',
        authMethod: 'MTLS',
        actionsCount: 8,
        supportedActions: ['vql_mft_hunt', 'vql_memory_dump', 'vql_prefetch', 'vql_netstat', 'vql_amcache'],
        desc: '分散式 VQL 物證萃取、遠端端點即時狩獵與證據鏈固化',
        lastChecked: '剛剛',
        healthRate: 100
      },
      {
        id: 'conn-thehive',
        name: 'TheHive 5 / Cortex',
        cat: 'Case Management',
        vendor: 'StrangeBee',
        status: 'Connected',
        latency: '24ms',
        endpoint: 'https://thehive.soc.internal/api/v1/case',
        authMethod: 'BEARER_TOKEN',
        actionsCount: 4,
        supportedActions: ['create_case', 'run_analyzer', 'add_observable', 'close_incident'],
        desc: '自動工單立案、案件嚴重度調整與 Cortex 分析器整合',
        lastChecked: '剛剛',
        healthRate: 100
      },
      {
        id: 'conn-slack-teams',
        name: 'Slack / Teams Webhook',
        cat: 'Notification',
        vendor: 'Slack / Microsoft',
        status: 'Connected',
        latency: '80ms',
        endpoint: 'https://hooks.slack.com/services/T00/B00/SOC_WAR_ROOM',
        authMethod: 'BEARER_TOKEN',
        actionsCount: 3,
        supportedActions: ['post_incident_card', 'broadcast_quarantine', 'send_approval_request'],
        desc: 'SOC 核心作戰應變頻道廣播、緊急電話警報與主管審查卡片',
        lastChecked: '剛剛',
        healthRate: 100
      },
      {
        id: 'conn-cisco-ise',
        name: 'Cisco Catalyst & ISE NAC',
        cat: 'Network NAC',
        vendor: 'Cisco Systems',
        status: 'Connected',
        latency: '38ms',
        endpoint: 'https://ise.internal.domain:9060/ers/config/ancendpoint',
        authMethod: 'BEARER_TOKEN',
        actionsCount: 4,
        supportedActions: ['quarantine_mac', 'vlan_shift_999', 'port_shutdown', 'reauth_8021x'],
        desc: '802.1X 動態 NAC 控制、實體交換器埠切換隔離 VLAN',
        lastChecked: '剛剛',
        healthRate: 100
      }
    ];
  }

  private initDefaultSensors() {
    this.branchSensors = [
      { id: 'CCS-TPE-01', name: '台北總部 (Taipei HQ)', region: 'APAC-TW-North', nodes: '1,420 端點', sync: '1.2s 前', status: 'Online', ipRange: '10.0.0.0/16', agentVersion: 'v0.7.3-prod', activeHunts: 3 },
      { id: 'CCS-HSZ-02', name: '新竹晶圓廠 (Hsinchu Fab)', region: 'APAC-TW-Fab', nodes: '890 端點', sync: '0.8s 前', status: 'Online', ipRange: '10.10.0.0/16', agentVersion: 'v0.7.3-prod', activeHunts: 1 },
      { id: 'CCS-TXG-03', name: '台中資料中心 (Taichung DC)', region: 'APAC-TW-Central', nodes: '420 伺服器', sync: '2.1s 前', status: 'Online', ipRange: '10.20.0.0/16', agentVersion: 'v0.7.3-prod', activeHunts: 0 },
      { id: 'CCS-KHH-04', name: '高雄物流園區 (Kaohsiung)', region: 'APAC-TW-South', nodes: '310 端點', sync: '1.5s 前', status: 'Online', ipRange: '10.30.0.0/16', agentVersion: 'v0.7.3-prod', activeHunts: 0 }
    ];
  }

  private initDefaultForensicArtifacts() {
    this.forensicArtifacts = [
      {
        id: 'ART-001',
        name: 'MFT_Acquisition_SRV-ERP-01.bin',
        size: '142 MB',
        hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        vqlQuery: 'SELECT * FROM Artifact.Windows.NTFS.MFT(Path="C:")',
        status: 'Locked & Verified',
        targetAsset: '10.10.12.44 (SRV-ERP-01)',
        branch: '台北總部 (Taipei HQ)',
        collectedAt: '10 分鐘前',
        investigator: 'SOAR Auto-Hunter'
      },
      {
        id: 'ART-002',
        name: 'Memory_Volatile_Dump_PID_4812.raw',
        size: '2.4 GB',
        hash: '7d793037a0760186574b0282f2f435e709c0d1c6fd34eb7dbf20c9c277717462',
        vqlQuery: 'SELECT * FROM Artifact.Windows.Memory.Acquisition()',
        status: 'Locked & Verified',
        targetAsset: '10.10.12.44 (SRV-ERP-01)',
        branch: '台北總部 (Taipei HQ)',
        collectedAt: '12 分鐘前',
        investigator: 'SOAR Auto-Hunter'
      },
      {
        id: 'ART-003',
        name: 'Prefetch_Artifacts.zip',
        size: '18 MB',
        hash: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
        vqlQuery: 'SELECT * FROM Artifact.Windows.Forensics.Prefetch()',
        status: 'Locked & Verified',
        targetAsset: '10.10.12.44 (SRV-ERP-01)',
        branch: '台北總部 (Taipei HQ)',
        collectedAt: '15 分鐘前',
        investigator: 'SOAR Auto-Hunter'
      },
      {
        id: 'ART-004',
        name: 'Active_TCP_Netstat.json',
        size: '2.4 MB',
        hash: 'f9e8d7c6b5a40392817263544536271819203948576102938475610293847561',
        vqlQuery: 'SELECT * FROM Artifact.Windows.Network.Netstat()',
        status: 'Locked & Verified',
        targetAsset: '10.10.12.44 (SRV-ERP-01)',
        branch: '台北總部 (Taipei HQ)',
        collectedAt: '18 分鐘前',
        investigator: 'SOAR Auto-Hunter'
      }
    ];
  }

  private initDefaultExecutionLogs() {
    this.executionLogs = [
      {
        id: 'SOAR-EX-9904',
        incidentId: 'INC-2026-9021',
        playbookId: 'pb-01',
        playbookName: '勒索軟體全域瞬時隔離與 AD 帳號凍結',
        timestamp: '2 分鐘前',
        triggerSource: 'CrowdStrike Falcon (Mimikatz dumping)',
        target: '10.10.12.44 (FINANCE-WS03)',
        status: 'Pending Approval',
        duration: '1.24s (Paused)',
        resultSummary: '等待 L2 資安主管審批！已完成 EDR 端點實體隔離，待決網域密碼重設。',
        dryRun: false,
        executedBy: 'Autonomous SOAR Engine',
        stepsCompleted: 5,
        stepsTotal: 7,
        rollbackAvailable: false,
        details: [
          { stepId: 'n1', stepName: 'EDR 勒索警報觸發', vendor: 'CrowdStrike Falcon', actionType: 'trigger', status: 'success', duration: '12ms', output: '偵測到 Volume Shadow Copy 刪除與異常高頻檔案加密行為。', timestamp: '2 分鐘前' },
          { stepId: 'n2', stepName: 'VT / CTI 惡意雜湊驗證', vendor: 'VirusTotal', actionType: 'enrichment', status: 'success', duration: '84ms', output: '雜湊比對確認為 LockBit 3.0 變種，信譽惡意評分 100/100。', timestamp: '2 分鐘前' },
          { stepId: 'n3', stepName: '威脅評分 > 85?', vendor: 'Decision Logic', actionType: 'condition', status: 'success', duration: '2ms', output: '評分 100 > 85，符合緊急圍堵條件，啟動全網雙向阻斷。', timestamp: '2 分鐘前' },
          { stepId: 'n4', stepName: 'EDR 端點實體網路隔離', vendor: 'CrowdStrike Falcon', actionType: 'action', status: 'success', duration: '310ms', output: '已下發 API 進行端點網路微隔離，僅保留 443 SOC 管理通訊。', timestamp: '2 分鐘前' },
          { stepId: 'n5', stepName: 'AD / Azure 憑證強制登出', vendor: 'Active Directory / Okta', actionType: 'action', status: 'success', duration: '240ms', output: '已撤銷 Kerberos TGT 票據並吊銷所有雲端 OAuth Refresh Token。', timestamp: '2 分鐘前' },
          { stepId: 'n6', stepName: 'L2 資安官核准重置網域密碼', vendor: 'SOC Approval Gate', actionType: 'manual', status: 'waiting', duration: '等待審批', output: '高特權密碼重置操作需主管覆核，審核通知已推播至管理員手機。', timestamp: '2 分鐘前' },
          { stepId: 'n7', stepName: 'Slack / Teams SOC 應變頻道廣播', vendor: 'Slack Bot', actionType: 'notify', status: 'waiting', duration: '--', output: '等待前置審批通過後發布。', timestamp: '2 分鐘前' }
        ]
      },
      {
        id: 'SOAR-EX-9903',
        incidentId: 'INC-2026-8994',
        playbookId: 'pb-03',
        playbookName: '外部 C2 通訊邊界防火牆自動封鎖',
        timestamp: '14 分鐘前',
        triggerSource: 'Suricata NDR (Cobalt Strike Beacon)',
        target: '185.220.101.5 (External C2)',
        status: 'Success',
        duration: '0.78s',
        resultSummary: '已成功調用 Palo Alto Panorama 將 185.220.101.5 寫入全域 DAG 黑名單。',
        dryRun: false,
        executedBy: 'Autonomous SOAR Engine',
        stepsCompleted: 5,
        stepsTotal: 5,
        rollbackAvailable: true,
        details: [
          { stepId: 'c1', stepName: 'NDR C2 心跳特徵偵測', vendor: 'Suricata NDR', actionType: 'trigger', status: 'success', duration: '14ms', output: '捕獲符合 Cobalt Strike malleable C2 profile 之 TLS 心跳。', timestamp: '14 分鐘前' },
          { stepId: 'c2', stepName: 'AbuseIPDB 信心係數查詢', vendor: 'AbuseIPDB', actionType: 'enrichment', status: 'success', duration: '110ms', output: '回傳信心分數 100%，來自俄羅斯之已知惡意中繼站。', timestamp: '14 分鐘前' },
          { stepId: 'c3', stepName: '邊界防火牆 API 阻斷 (DAG)', vendor: 'Palo Alto Panorama', actionType: 'action', status: 'success', duration: '320ms', output: '透過 XML API 將 IP 注入 DAG-C2-DROP-LIST，阻斷規則生效。', timestamp: '14 分鐘前' },
          { stepId: 'c4', stepName: '阻斷連線 TCP RST 封包注入', vendor: 'SDN Controller', actionType: 'action', status: 'success', duration: '18ms', output: '注入 TCP RST 封包，當前 3 條外聯連線已瞬時中斷。', timestamp: '14 分鐘前' },
          { stepId: 'c5', stepName: 'SIEM 事件自動標註與關聯', vendor: 'Elastic SIEM', actionType: 'notify', status: 'success', duration: '45ms', output: '工單標記已阻斷，已關聯至威脅情報資料庫。', timestamp: '14 分鐘前' }
        ]
      },
      {
        id: 'SOAR-EX-9902',
        incidentId: 'INC-2026-8711',
        playbookId: 'pb-02',
        playbookName: '社交工程釣魚郵件多引擎沙箱爆破與全域下架',
        timestamp: '38 分鐘前',
        triggerSource: 'User Phish Submission (Outlook Add-in)',
        target: 'invoice_march_payment.html',
        status: 'Success',
        duration: '2.14s',
        resultSummary: '沙箱確認為金融憑證釣魚，已自全公司 42 位收件者信箱中徹底下架刪除。',
        dryRun: false,
        executedBy: 'Autonomous SOAR Engine',
        stepsCompleted: 6,
        stepsTotal: 6,
        rollbackAvailable: false,
        details: [
          { stepId: 'p1', stepName: '郵件閘道釣魚通報', vendor: 'Proofpoint SEG', actionType: 'trigger', status: 'success', duration: '15ms', output: '員工上報可疑匯款憑單附件。', timestamp: '38 分鐘前' },
          { stepId: 'p2', stepName: 'URL / 附件沙箱引爆', vendor: 'Hybrid Analysis', actionType: 'enrichment', status: 'success', duration: '1200ms', output: '沙箱引爆發現鍵盤側錄與偽冒登入頁面，惡意評分 98/100。', timestamp: '38 分鐘前' },
          { stepId: 'p3', stepName: '確認為釣魚偽冒?', vendor: 'Logic Engine', actionType: 'condition', status: 'success', duration: '4ms', output: '確認符合嚴重釣魚事件，啟動全域信箱清除。', timestamp: '38 分鐘前' },
          { stepId: 'p4', stepName: 'M365 全域信箱自動下架', vendor: 'Microsoft Graph API', actionType: 'action', status: 'success', duration: '810ms', output: '發起 ComplianceSearchAction，在全網 42 個郵件帳號中執行 Hard Delete。', timestamp: '38 分鐘前' },
          { stepId: 'p5', stepName: 'DNS 防護黑名單注入', vendor: 'Cisco Umbrella', actionType: 'action', status: 'success', duration: '65ms', output: '將釣魚網域 login-secure-auth.net 寫入阻斷黑名單。', timestamp: '38 分鐘前' },
          { stepId: 'p6', stepName: '自動產生使用者防詐教育回條', vendor: 'Security Awareness', actionType: 'notify', status: 'success', duration: '45ms', output: '回傳感謝信給通報員工，累計安全點數 +50。', timestamp: '38 分鐘前' }
        ]
      }
    ];
  }

  // Purge execution logs and reset execution counters for clean environment
  public purgeData(): void {
    this.executionLogs = [];
    this.forensicArtifacts = [];
    this.playbooks.forEach(p => {
      p.executions24h = 0;
      p.lastRun = 'Never';
    });
  }
}

// Singleton instance for in-memory persistence during server lifecycle
export const globalSoarEngine = new SoarEngine();
