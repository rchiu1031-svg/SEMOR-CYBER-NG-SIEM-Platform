import crypto from 'crypto';
import {
  INITIAL_FIM_EVENTS,
  INITIAL_FIM_PLAYBOOKS,
  INITIAL_FIM_POLICIES,
  INITIAL_FIM_BASELINES
} from '../src/data/soarFimData.ts';
import type {
  FimEventItem,
  FimPlaybookItem,
  FimPolicyItem,
  FimBaselineSnapshot
} from '../src/data/soarFimData.ts';

export interface FimAuditLog {
  id: string;
  timestamp: string;
  action: 'ROLLBACK' | 'ISOLATE_HOST' | 'KILL_PROCESS' | 'PLAYBOOK_SIMULATE' | 'POLICY_UPDATE' | 'BASELINE_RECALC' | 'INTEGRITY_SCAN';
  targetId: string;
  targetPath?: string;
  operator: string;
  details: string;
  status: 'SUCCESS' | 'FAILED' | 'IN_PROGRESS';
  hashVerified?: boolean;
}

export interface FimTelemetry {
  totalMonitoredFiles: number;
  totalEventsCount: number;
  criticalEventsCount: number;
  highEventsCount: number;
  containedEventsCount: number;
  resolvedEventsCount: number;
  activePlaybooksCount: number;
  activePoliciesCount: number;
  goldenBaselinesCount: number;
  rollbackSuccessRate: number;
  averageMttrMs: number;
  kernelProbe: {
    status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
    probeType: string;
    ebpfSyscallsPerSec: number;
    droppedEventsCount: number;
    lastHeartbeat: string;
  };
}

export class FimEngine {
  private events: FimEventItem[] = [];
  private playbooks: FimPlaybookItem[] = [];
  private policies: FimPolicyItem[] = [];
  private baselines: FimBaselineSnapshot[] = [];
  private monitoredPaths: any[] = [];
  private auditLogs: FimAuditLog[] = [];

  constructor() {
    this.init();
  }

  private init() {
    // Deep clone initial datasets to allow in-memory mutations
    this.events = JSON.parse(JSON.stringify(INITIAL_FIM_EVENTS));
    this.playbooks = JSON.parse(JSON.stringify(INITIAL_FIM_PLAYBOOKS));
    this.policies = JSON.parse(JSON.stringify(INITIAL_FIM_POLICIES));
    this.baselines = JSON.parse(JSON.stringify(INITIAL_FIM_BASELINES));

    this.monitoredPaths = [
      {
        id: "fim-path-01",
        path: "/etc/passwd",
        os: "Linux",
        host: "edge-gateway-01",
        expectedSha256: "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
        currentSha256: "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
        status: "intact",
        lastChecked: new Date().toISOString()
      },
      {
        id: "fim-path-02",
        path: "/etc/shadow",
        os: "Linux",
        host: "edge-gateway-01",
        expectedSha256: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
        currentSha256: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
        status: "intact",
        lastChecked: new Date().toISOString()
      },
      {
        id: "fim-path-03",
        path: "C:\\Windows\\System32\\vssadmin.exe",
        os: "Windows",
        host: "HR-DESKTOP-09",
        expectedSha256: "ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb",
        currentSha256: "ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb",
        status: "tamper_attempt_prevented",
        lastChecked: new Date().toISOString()
      },
      {
        id: "fim-path-04",
        path: "/var/log/suricata/eve.json",
        os: "Linux",
        host: "edge-gateway-01",
        expectedSha256: "DYNAMIC",
        currentSha256: "DYNAMIC",
        status: "active_stream",
        lastChecked: new Date().toISOString()
      }
    ];

    // Seed initial audit log
    this.auditLogs.push({
      id: `audit-${Date.now()}-01`,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      action: 'ROLLBACK',
      targetId: 'FIM-2026-9041',
      targetPath: '/var/www/html/app/Http/Controllers/AuthHelper.php',
      operator: 'SOAR Autonomous Dispatcher',
      details: 'WebShell injected block detected. Restored from read-only golden snapshot in 420ms.',
      status: 'SUCCESS',
      hashVerified: true
    });
  }

  // --- 1. TELEMETRY ---
  public getTelemetry(): FimTelemetry {
    const criticalEventsCount = this.events.filter(e => e.severity === 'Critical').length;
    const highEventsCount = this.events.filter(e => e.severity === 'High').length;
    const containedEventsCount = this.events.filter(e => e.status === 'Contained').length;
    const resolvedEventsCount = this.events.filter(e => e.status === 'Resolved').length;

    return {
      totalMonitoredFiles: 284910,
      totalEventsCount: this.events.length,
      criticalEventsCount,
      highEventsCount,
      containedEventsCount,
      resolvedEventsCount,
      activePlaybooksCount: this.playbooks.filter(p => p.isActive).length,
      activePoliciesCount: this.policies.filter(p => p.enabled).length,
      goldenBaselinesCount: this.baselines.length,
      rollbackSuccessRate: 99.4,
      averageMttrMs: 580,
      kernelProbe: {
        status: 'ONLINE',
        probeType: 'eBPF In-Kernel Tracepoint (sys_enter_openat / sys_enter_write)',
        ebpfSyscallsPerSec: 14820,
        droppedEventsCount: 0,
        lastHeartbeat: new Date().toISOString()
      }
    };
  }

  // --- 2. EVENTS ---
  public getEvents(filters?: { severity?: string; status?: string; search?: string; limit?: number }) {
    let result = [...this.events];

    if (filters?.severity && filters.severity !== 'all') {
      result = result.filter(e => e.severity.toLowerCase() === filters.severity?.toLowerCase());
    }

    if (filters?.status && filters.status !== 'all') {
      result = result.filter(e => e.status.toLowerCase() === filters.status?.toLowerCase());
    }

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(e =>
        e.filePath.toLowerCase().includes(q) ||
        e.fileName.toLowerCase().includes(q) ||
        e.hostName.toLowerCase().includes(q) ||
        e.ipAddress.toLowerCase().includes(q) ||
        e.threatClassification.toLowerCase().includes(q) ||
        (e.diffSummary && e.diffSummary.toLowerCase().includes(q))
      );
    }

    if (filters?.limit && filters.limit > 0) {
      result = result.slice(0, filters.limit);
    }

    return result;
  }

  public getEventById(id: string): FimEventItem | undefined {
    return this.events.find(e => e.id === id);
  }

  public executeRollback(eventId: string, operator: string = 'SOC Admin') {
    const event = this.events.find(e => e.id === eventId);
    if (!event) {
      throw new Error(`FIM event with id ${eventId} not found`);
    }

    const previousHash = event.previousHashSha256 || '9f83acde782103fca576912384729104fae109405829bba12984183058a9d012';
    const executionMs = Math.floor(Math.random() * 250) + 320;

    // Mutate event
    event.soarActionTaken = 'Auto_Rolled_Back';
    event.status = 'Resolved';
    event.analystNotes = `已於 ${new Date().toLocaleString()} 由 ${operator} 觸發 SOAR 黃金快照還原，檔案已回歸原雜湊 [${previousHash.slice(0, 16)}...]，校驗成功。`;

    // Record audit
    this.auditLogs.unshift({
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      action: 'ROLLBACK',
      targetId: event.id,
      targetPath: event.filePath,
      operator,
      details: `檔案強制還原成功：覆寫異動，比對 SHA-256 吻合，耗時 ${executionMs}ms。`,
      status: 'SUCCESS',
      hashVerified: true
    });

    return {
      success: true,
      message: `檔案 ${event.fileName} 已成功自黃金快照還原！`,
      event,
      executionMs,
      restoredHash: previousHash
    };
  }

  public isolateHost(eventId: string, operator: string = 'SOC Admin') {
    const event = this.events.find(e => e.id === eventId);
    if (!event) {
      throw new Error(`FIM event with id ${eventId} not found`);
    }

    event.soarActionTaken = 'Process_Killed_Host_Isolated';
    event.status = 'Contained';
    event.analystNotes = `已於 ${new Date().toLocaleString()} 由 ${operator} 執行安全圍堵：終止進程 PID ${event.pid} (${event.processName}) 並對 ${event.hostName} (${event.ipAddress}) 實施微隔離。`;

    this.auditLogs.unshift({
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      action: 'ISOLATE_HOST',
      targetId: event.id,
      targetPath: event.filePath,
      operator,
      details: `主機 ${event.hostName} 已隔離，惡意進程 PID ${event.pid} 已強制終止。`,
      status: 'SUCCESS'
    });

    return {
      success: true,
      message: `主機 ${event.hostName} (${event.ipAddress}) 已完成微隔離，PID ${event.pid} 已強制終止！`,
      event
    };
  }

  public updateEvent(eventId: string, updates: Partial<FimEventItem>) {
    const event = this.events.find(e => e.id === eventId);
    if (!event) {
      throw new Error(`FIM event with id ${eventId} not found`);
    }

    Object.assign(event, updates);
    return event;
  }

  // --- 3. PLAYBOOKS ---
  public getPlaybooks(): FimPlaybookItem[] {
    return this.playbooks;
  }

  public togglePlaybook(id: string) {
    const pb = this.playbooks.find(p => p.id === id);
    if (!pb) throw new Error(`Playbook ${id} not found`);
    pb.isActive = !pb.isActive;
    return pb;
  }

  public changePlaybookMode(id: string, mode: FimPlaybookItem['executionMode']) {
    const pb = this.playbooks.find(p => p.id === id);
    if (!pb) throw new Error(`Playbook ${id} not found`);
    pb.executionMode = mode;
    return pb;
  }

  public simulatePlaybook(id: string, targetHost: string = 'edge-gateway-01') {
    const pb = this.playbooks.find(p => p.id === id);
    if (!pb) throw new Error(`Playbook ${id} not found`);

    const now = new Date();
    const steps = [
      `[${now.toLocaleTimeString()}] 模擬威脅注入測試：向目標主機 ${targetHost} 目錄觸發未授權變更事件...`,
      `[${now.toLocaleTimeString()}] FIM eBPF 核心探針精準攔截系統呼叫 (sys_enter_openat)，比對 SHA-256 發生偏離`,
      `[${now.toLocaleTimeString()}] 規則引擎觸發匹配：${pb.name} (處置模式: ${pb.executionMode})`,
      ...pb.actionsList.map(a => `[${now.toLocaleTimeString()}] 執行處置動作節點 -> ${a} [SUCCESS: 0 err]`),
      `[${now.toLocaleTimeString()}] 完整性鏈路核對完成！MTTR 耗時：${(pb.averageMttrSeconds * 1000).toFixed(0)}ms，受監控節點已回歸合規狀態。`
    ];

    pb.lastTriggered = '剛剛';
    pb.executionHistoryCount = (pb.executionHistoryCount || 0) + 1;

    this.auditLogs.unshift({
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: now.toISOString(),
      action: 'PLAYBOOK_SIMULATE',
      targetId: pb.id,
      operator: 'Playbook Simulator',
      details: `劇本 [${pb.name}] 模擬驗證成功，耗時 ${(pb.averageMttrSeconds * 1000).toFixed(0)}ms。`,
      status: 'SUCCESS'
    });

    return {
      success: true,
      playbookId: pb.id,
      playbookName: pb.name,
      executionSteps: steps,
      elapsedMs: Math.round(pb.averageMttrSeconds * 1000),
      status: 'SUCCESS'
    };
  }

  // --- 4. POLICIES ---
  public getPolicies(): FimPolicyItem[] {
    return this.policies;
  }

  public togglePolicy(id: string) {
    const pol = this.policies.find(p => p.id === id);
    if (!pol) throw new Error(`Policy ${id} not found`);
    pol.enabled = !pol.enabled;
    return pol;
  }

  public createPolicy(policyData: Partial<FimPolicyItem>): FimPolicyItem {
    const newPolicy: FimPolicyItem = {
      id: policyData.id || `POL-CUSTOM-${Date.now().toString().slice(-4)}`,
      name: policyData.name || '自訂安全監控規則',
      standard: policyData.standard || 'Custom',
      description: policyData.description || '自訂即時監控路徑與特徵比對原則',
      monitoredPaths: policyData.monitoredPaths || ['/etc/**'],
      recursive: policyData.recursive ?? true,
      checkAttributes: policyData.checkAttributes || {
        contentHash: true,
        permissions: true,
        ownership: true,
        size: true,
        mtime: true
      },
      detectionEngine: policyData.detectionEngine || 'Real-time eBPF / inotify',
      activeHostsCount: policyData.activeHostsCount || 24,
      enabled: policyData.enabled ?? true
    };

    this.policies.unshift(newPolicy);
    return newPolicy;
  }

  public deletePolicy(id: string) {
    const index = this.policies.findIndex(p => p.id === id);
    if (index === -1) throw new Error(`Policy ${id} not found`);
    const removed = this.policies.splice(index, 1)[0];
    return removed;
  }

  // --- 5. BASELINES ---
  public getBaselines(): FimBaselineSnapshot[] {
    return this.baselines;
  }

  public recalculateBaseline(id: string, approvedBy: string = 'SOC SecOps Lead') {
    const baseline = this.baselines.find(b => b.id === id);
    if (!baseline) throw new Error(`Baseline ${id} not found`);

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    baseline.driftCount = 0;
    baseline.createdDate = nowStr;
    baseline.approvedBy = approvedBy;
    baseline.status = 'Active Golden Baseline';

    this.auditLogs.unshift({
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      action: 'BASELINE_RECALC',
      targetId: baseline.id,
      operator: approvedBy,
      details: `黃金基線快照 [${baseline.clusterName}] 已完成 SHA-256 雜湊樹重構與數位簽證，偏離歸零。`,
      status: 'SUCCESS'
    });

    return baseline;
  }

  public createBaseline(baselineData: Partial<FimBaselineSnapshot>): FimBaselineSnapshot {
    const newBaseline: FimBaselineSnapshot = {
      id: baselineData.id || `BASE-2026-${Date.now().toString().slice(-4)}`,
      clusterName: baselineData.clusterName || '新叢集節點基線',
      osType: baselineData.osType || 'Linux Ubuntu 24.04 LTS',
      totalFilesIndexed: baselineData.totalFilesIndexed || Math.floor(Math.random() * 30000) + 15000,
      createdDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
      hashAlgorithm: 'SHA-256 + SSDEEP Fuzzy Hash',
      approvedBy: baselineData.approvedBy || 'CISO Approval Gate',
      changeRequestTicket: baselineData.changeRequestTicket || `CR-2026-${Date.now().toString().slice(-4)}`,
      status: 'Active Golden Baseline',
      driftCount: 0
    };

    this.baselines.unshift(newBaseline);
    return newBaseline;
  }

  // --- 6. ON-DEMAND INTEGRITY SCAN ---
  public runScan(targetPath: string, hostName: string = 'edge-gateway-01') {
    const scanId = `SCAN-${Date.now().toString().slice(-6)}`;
    const randomHash = crypto.randomBytes(32).toString('hex');
    const filesScanned = Math.floor(Math.random() * 450) + 50;

    const result = {
      scanId,
      timestamp: new Date().toISOString(),
      targetPath,
      hostName,
      status: 'COMPLETED',
      filesScanned,
      intactCount: filesScanned - 1,
      driftCount: 1,
      sampleRootHash: randomHash,
      executionTimeMs: Math.floor(Math.random() * 800) + 400,
      findings: [
        {
          path: `${targetPath.replace(/\/\*+$/, '')}/runtime_config.yaml`,
          status: 'UNAUTHORIZED_CHANGE',
          severity: 'High',
          detectedDiff: 'TLS cert validation toggled to insecure_skip_verify: true',
          sha256: randomHash
        }
      ]
    };

    this.auditLogs.unshift({
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      action: 'INTEGRITY_SCAN',
      targetId: scanId,
      targetPath,
      operator: 'eBPF On-Demand Crawler',
      details: `路徑 ${targetPath} 掃描完畢，掃描 ${filesScanned} 筆檔案，發現 1 筆未授權偏離。`,
      status: 'SUCCESS'
    });

    return result;
  }

  // --- 7. AUDIT TRAIL ---
  public getAuditLogs(): FimAuditLog[] {
    return this.auditLogs;
  }

  // --- 8. LEGACY MONITORED PATHS COMPATIBILITY ---
  public getMonitoredPaths() {
    return this.monitoredPaths;
  }

  public addMonitoredPath(path: string, host?: string, os?: string) {
    const hash = crypto.createHash('sha256').update(path).digest('hex');
    const newPath = {
      id: `fim-path-${Date.now().toString().slice(-4)}`,
      path,
      os: os || "Linux",
      host: host || "all-managed-hosts",
      expectedSha256: hash,
      currentSha256: hash,
      status: "intact",
      lastChecked: new Date().toISOString()
    };
    this.monitoredPaths.unshift(newPath);
    return newPath;
  }

  public acceptBaseline(pathId: string, newSha256?: string) {
    const item = this.monitoredPaths.find(p => p.id === pathId);
    if (item) {
      item.expectedSha256 = newSha256 || item.currentSha256;
      item.status = "intact";
      item.lastChecked = new Date().toISOString();
    }
    return item;
  }

  // Purge simulated Fim events and audit logs for clean environment
  public purgeData(): void {
    this.events = [];
    this.auditLogs = [];
  }
}

export const globalFimEngine = new FimEngine();
