import type {
  CaseIncident,
  CaseSeverity,
  CaseStatus,
  CaseCategory,
  CaseCustomField,
  LayoutBlockConfig,
  SLAPolicyStage,
  CaseConfigVersion,
  IngestionMapping,
  CaseObservable,
  AffectedAsset,
  AffectedUser,
  TimelineEntry,
  WarRoomNote
} from '../src/components/case-management/types.ts';

import {
  INITIAL_CASES,
  INITIAL_CUSTOM_FIELDS,
  INITIAL_LAYOUT_BLOCKS,
  INITIAL_SLA_STAGES,
  INITIAL_VERSIONS,
  INITIAL_INGESTION_MAPPINGS
} from '../src/components/case-management/caseManagementData.ts';

export class CasesEngine {
  private cases: CaseIncident[] = [];
  private customFields: CaseCustomField[] = [];
  private layoutBlocks: LayoutBlockConfig[] = [];
  private slaStages: SLAPolicyStage[] = [];
  private ingestionMappings: IngestionMapping[] = [];
  private versions: CaseConfigVersion[] = [];

  constructor() {
    // Initialize empty cases array for production mode
    this.cases = [];
    this.customFields = JSON.parse(JSON.stringify(INITIAL_CUSTOM_FIELDS));
    this.layoutBlocks = JSON.parse(JSON.stringify(INITIAL_LAYOUT_BLOCKS));
    this.slaStages = JSON.parse(JSON.stringify(INITIAL_SLA_STAGES));
    this.ingestionMappings = JSON.parse(JSON.stringify(INITIAL_INGESTION_MAPPINGS));
    this.versions = JSON.parse(JSON.stringify(INITIAL_VERSIONS));
  }

  // Purge simulated test cases
  public purgeData(): void {
    this.cases = [];
  }

  // --- CASES QUERY & CRUD ---

  public getCases(filters?: {
    status?: string;
    severity?: string;
    category?: string;
    assignee?: string;
    searchQuery?: string;
    onlyMyCases?: boolean;
  }): CaseIncident[] {
    let result = [...this.cases];

    if (!filters) return result;

    if (filters.status && filters.status !== 'all') {
      result = result.filter(c => c.status === filters.status);
    }
    if (filters.severity && filters.severity !== 'all') {
      result = result.filter(c => c.severity === filters.severity);
    }
    if (filters.category && filters.category !== 'all') {
      result = result.filter(c => c.category === filters.category);
    }
    if (filters.onlyMyCases) {
      result = result.filter(c => c.assignee.name.includes('Warren') || c.assignee.name.includes('張維倫'));
    }
    if (filters.searchQuery && filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase();
      result = result.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.caseNumber.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.affectedAssets?.some(a => a.name.toLowerCase().includes(q) || a.ip.includes(q)) ||
        c.observables?.some(o => o.value.toLowerCase().includes(q)) ||
        c.mitreTactics?.some(m => m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q))
      );
    }

    return result;
  }

  public getCaseById(id: string): CaseIncident | undefined {
    return this.cases.find(c => c.id === id || c.caseNumber === id);
  }

  public createCase(data: Partial<CaseIncident>): CaseIncident {
    const timestampStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newCaseNumber = `INC-2026-${1015 + this.cases.length}`;
    const id = data.id || `inc-${Date.now()}`;

    const newCase: CaseIncident = {
      id,
      caseNumber: newCaseNumber,
      title: data.title || '新增資安通報案件',
      description: data.description || '由分析師手動立案之資安通報案件。',
      severity: data.severity || 'High',
      status: data.status || 'New',
      category: data.category || 'Ransomware',
      sourceEngine: data.sourceEngine || 'TheHive SIRP + Cortex',
      assignee: data.assignee || {
        id: 'usr-01',
        name: '張維倫 (Warren C.)',
        role: '資深 L2 資安鑑識專家',
        email: 'warren.c@semor.security',
        avatarBg: 'bg-purple-600'
      },
      createdAt: timestampStr,
      updatedAt: timestampStr,
      sla: data.sla || {
        stage: 'Triage',
        stageDeadline: new Date(Date.now() + 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19),
        remainingMinutes: 60,
        totalMinutes: 60,
        isBreached: false
      },
      affectedAssets: data.affectedAssets || [],
      affectedUsers: data.affectedUsers || [],
      mitreTactics: data.mitreTactics && data.mitreTactics.length > 0 ? data.mitreTactics : [
        { id: 'T1059', name: '惡意指令行執行', technique: 'Command Execution', tactic: 'Execution', color: '#ef4444' }
      ],
      observables: data.observables || [],
      timeline: [
        {
          id: `tl-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          type: 'Alert',
          author: data.assignee?.name || '張維倫 (Warren C.)',
          content: `手動通報立案 ${newCaseNumber}，SLA 倒數計時開始。`,
          status: 'Success'
        }
      ],
      attackGraph: data.attackGraph || {
        nodes: [
          { id: 'n-target', label: data.affectedAssets?.[0]?.name || 'Target Host', type: 'asset', status: 'At Risk' }
        ],
        edges: []
      },
      warRoomNotes: [
        {
          id: `wn-${Date.now()}`,
          author: '系統通知',
          role: 'TheHive SIRP',
          time: new Date().toLocaleTimeString(),
          text: `案件 ${newCaseNumber} 已建立，已指派分析師進行初步資產盤點與分流。`,
          isAutomatedBot: true
        }
      ],
      tags: data.tags || ['Manual-Created']
    };

    this.cases.unshift(newCase);
    return newCase;
  }

  public updateCase(id: string, updates: Partial<CaseIncident>): CaseIncident | null {
    const idx = this.cases.findIndex(c => c.id === id || c.caseNumber === id);
    if (idx === -1) return null;

    const currentCase = this.cases[idx];
    const timestampStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // If status changed, automatically record status change timeline entry
    if (updates.status && updates.status !== currentCase.status) {
      currentCase.timeline.unshift({
        id: `tl-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'Status Change',
        author: '張維倫 (Warren C.)',
        content: `案件狀態由「${currentCase.status}」更新為「${updates.status}」`,
        status: 'Success'
      });
    }

    // If severity changed, record in timeline
    if (updates.severity && updates.severity !== currentCase.severity) {
      currentCase.timeline.unshift({
        id: `tl-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'Status Change',
        author: '張維倫 (Warren C.)',
        content: `案件嚴重度由「${currentCase.severity}」調整為「${updates.severity}」`,
        status: 'Success'
      });
    }

    this.cases[idx] = {
      ...currentCase,
      ...updates,
      updatedAt: timestampStr
    };

    return this.cases[idx];
  }

  public deleteCase(id: string): boolean {
    const lenBefore = this.cases.length;
    this.cases = this.cases.filter(c => c.id !== id && c.caseNumber !== id);
    return this.cases.length < lenBefore;
  }

  // --- WAR ROOM & COLLABORATION ---

  public addWarRoomNote(caseId: string, noteData: {
    text: string;
    author?: string;
    role?: string;
    avatarColor?: string;
    isAutomatedBot?: boolean;
  }): WarRoomNote | null {
    const item = this.getCaseById(caseId);
    if (!item) return null;

    const newNote: WarRoomNote = {
      id: `wn-${Date.now()}`,
      author: noteData.author || '張維倫 (Warren C.)',
      role: noteData.role || '資深 L2 鑑識專家',
      time: new Date().toLocaleTimeString(),
      text: noteData.text,
      isAutomatedBot: !!noteData.isAutomatedBot,
      avatarColor: noteData.avatarColor || 'bg-purple-600'
    };

    item.warRoomNotes.push(newNote);
    item.updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);

    return newNote;
  }

  // --- INCIDENT RESPONSE ACTIONS ---

  public executeRemediationAction(caseId: string, actionType: string, note?: string, analystName: string = '張維倫 (Warren C.)'): {
    success: boolean;
    caseItem: CaseIncident;
    actionDesc: string;
    executionLog: TimelineEntry;
  } | null {
    const item = this.getCaseById(caseId);
    if (!item) return null;

    let actionDesc = '執行 SOAR 應變動作';
    if (actionType === 'quarantine') actionDesc = '主機網路層級微隔離 (EDR Host Isolation)';
    else if (actionType === 'block_ip') actionDesc = '周邊防火牆 IP 全域阻斷 (Perimeter Drop)';
    else if (actionType === 'revoke_token') actionDesc = '作廢 Session Token 與強制登出';
    else if (actionType === 'memory_dump') actionDesc = 'Velociraptor 記憶體鑑識傾印 (RAM Acquisition)';
    else if (actionType === 'dns_sinkhole') actionDesc = 'DNS RPZ 黑名單 Sinkhole 阻斷';

    if (actionType === 'quarantine') {
      item.affectedAssets = item.affectedAssets.map(a => ({ ...a, status: 'Isolated' as const }));
    } else if (actionType === 'block_ip') {
      item.observables = item.observables.map(o => ({ ...o, actionTaken: '周邊防火牆已全網阻斷' }));
    } else if (actionType === 'revoke_token') {
      item.affectedUsers = item.affectedUsers.map(u => ({ ...u, mfaStatus: 'Revoked' as const }));
    }

    item.status = 'In Remediation';
    item.updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const executionLog: TimelineEntry = {
      id: `tl-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      type: 'Action Executed',
      author: 'SOAR 處置引擎',
      content: `成功執行: ${actionDesc}`,
      details: note ? `分析師 (${analystName}) 備註: ${note}` : undefined,
      status: 'Success'
    };

    item.timeline.unshift(executionLog);

    item.warRoomNotes.push({
      id: `wn-${Date.now()}`,
      author: 'SOAR 處置機器人',
      role: 'Remediation Bot',
      time: new Date().toLocaleTimeString(),
      text: `已成功對受影響標的下發指令「${actionDesc}」${note ? ` (備註: ${note})` : ''}。`,
      isAutomatedBot: true
    });

    return {
      success: true,
      caseItem: item,
      actionDesc,
      executionLog
    };
  }

  // --- AI INVESTIGATION INSIGHT ---

  public generateAiInsight(caseId: string): {
    success: boolean;
    insight: string;
    threatSummary: string;
    recommendedActions: string[];
  } | null {
    const item = this.getCaseById(caseId);
    if (!item) return null;

    const assetsList = item.affectedAssets.map(a => `${a.name} (${a.ip})`).join(', ') || '無明確資產名單';
    const observablesList = item.observables.map(o => `${o.type}: ${o.value}`).join(', ') || '無明確 IoC';
    const mitreList = item.mitreTactics.map(m => `${m.id} ${m.name}`).join(', ') || '通用攻擊手法';

    const insight =
      `【SEMOR GenAI 調查評估報告】\n` +
      `• 根本威脅特徵: 判定為 ${item.category} 威脅事件，涉及攻擊手法 [${mitreList}]。\n` +
      `• 衝擊評估: 受影響核心目標包含 [${assetsList}]，現行狀態為 ${item.status}。關聯威脅指標包含 [${observablesList}]。\n` +
      `• 優先處置建議:\n` +
      `  1. 立即下發 EDR 端點網路微隔離，切斷橫向擴散通道。\n` +
      `  2. 於邊界次世代防火牆 (NGFW) 注入動態阻斷規則，攔截反彈 C2 通訊。\n` +
      `  3. 撤銷受侵害身分之 Kerberos 票證與 OAuth Session，並啟動 FIDO2 強制驗證。\n` +
      `  4. 啟動分散式 Velociraptor 鑑識採樣，留存 MFT 與記憶體證據鏈。`;

    const recommendedActions = [
      'EDR 端點實體網路隔離',
      'NGFW 注入 DAG IP 阻斷黑名單',
      '撤銷 Kerberos TGT 與使用者 Session',
      '下發 Velociraptor VQL 採樣取證'
    ];

    return {
      success: true,
      insight,
      threatSummary: `威脅評估: ${item.category} (嚴重度: ${item.severity})`,
      recommendedActions
    };
  }

  // --- OBSERVABLES & EVIDENCE VAULT ---

  public addObservable(caseId: string, observable: Partial<CaseObservable>): CaseObservable | null {
    const item = this.getCaseById(caseId);
    if (!item) return null;

    const newObs: CaseObservable = {
      id: `obs-${Date.now()}`,
      type: observable.type || 'IP',
      value: observable.value || '127.0.0.1',
      reputation: observable.reputation || 'Suspicious',
      score: observable.score ?? 80,
      hits: observable.hits ?? 1,
      source: observable.source || 'Analyst Manual Triage',
      actionTaken: observable.actionTaken
    };

    item.observables.push(newObs);
    item.updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);

    return newObs;
  }

  // --- STUDIO ADMIN CONFIGURATION ---

  public getStudioConfig() {
    return {
      customFields: this.customFields,
      layoutBlocks: this.layoutBlocks,
      slaStages: this.slaStages,
      ingestionMappings: this.ingestionMappings,
      versions: this.versions
    };
  }

  public saveCustomFields(fields: CaseCustomField[]): CaseCustomField[] {
    this.customFields = fields;
    return this.customFields;
  }

  public saveLayoutBlocks(blocks: LayoutBlockConfig[]): LayoutBlockConfig[] {
    this.layoutBlocks = blocks;
    return this.layoutBlocks;
  }

  public saveSlaStages(stages: SLAPolicyStage[]): SLAPolicyStage[] {
    this.slaStages = stages;
    return this.slaStages;
  }

  public saveIngestionMappings(mappings: IngestionMapping[]): IngestionMapping[] {
    this.ingestionMappings = mappings;
    return this.ingestionMappings;
  }

  public createVersion(author: string, note: string): CaseConfigVersion {
    const nextVer = `v2.${this.versions.length + 5}`;
    const newVer: CaseConfigVersion = {
      id: nextVer,
      author: author || '管理員 (Warren C.)',
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'Active',
      note: note || '更新案件欄位架構與 SLA 政策'
    };

    this.versions = this.versions.map(v => ({ ...v, status: 'Historical' }));
    this.versions.unshift(newVer);
    return newVer;
  }

  public revertVersion(versionId: string): boolean {
    const target = this.versions.find(v => v.id === versionId);
    if (!target) return false;

    this.versions = this.versions.map(v => ({
      ...v,
      status: v.id === versionId ? 'Active' : 'Historical'
    }));
    return true;
  }

  // --- METRICS TELEMETRY ---

  public getMetrics() {
    const total = this.cases.length;
    const critical = this.cases.filter(c => c.severity === 'Critical').length;
    const high = this.cases.filter(c => c.severity === 'High').length;
    const investigating = this.cases.filter(c => c.status === 'Investigating' || c.status === 'New').length;
    const inRemediation = this.cases.filter(c => c.status === 'In Remediation').length;
    const closed = this.cases.filter(c => c.status === 'Closed').length;
    const breached = this.cases.filter(c => c.sla?.isBreached).length;

    return {
      totalCases: total,
      criticalCount: critical,
      highCount: high,
      investigatingCount: investigating,
      remediationCount: inRemediation,
      closedCount: closed,
      slaBreachedCount: breached,
      avgMtta: '3.4m',
      avgMttr: '18.6m',
      complianceRate: '98.6%'
    };
  }

  // --- EXPORT CSV ---

  public exportCsv(): string {
    const headers = "CaseNumber,Title,Severity,Status,Category,CreatedAt,Assignee,AffectedAssets,ObservablesCount";
    const rows = this.cases.map(c => {
      const assets = (c.affectedAssets || []).map(a => a.name).join(';');
      return `"${c.caseNumber}","${c.title.replace(/"/g, '""')}","${c.severity}","${c.status}","${c.category}","${c.createdAt}","${c.assignee.name}","${assets}","${c.observables?.length || 0}"`;
    });
    return [headers, ...rows].join("\n");
  }
}

export const globalCasesEngine = new CasesEngine();
