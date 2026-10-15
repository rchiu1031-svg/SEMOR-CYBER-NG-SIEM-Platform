import express, { type Request, type Response } from 'express';
const Router = express.Router;
import crypto from 'crypto';
import { globalAttackSignatureEngine } from './attackSignatureEngine.ts';

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

export function createIncidentsRouter(
  getRuntimeLogCorpus?: () => any[],
  broadcastUpdate?: (data: any) => void
) {
  const router = Router();

  // Initial High-Fidelity Critical Incidents Dataset
  let criticalIncidents: CriticalIncidentItem[] = [];

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

  // Correlation Engine: Evaluates raw backend log corpus and synthesizes critical incidents
  function correlateLogs(): { correlatedCount: number; scannedLogsCount: number } {
    if (!getRuntimeLogCorpus) return { correlatedCount: 0, scannedLogsCount: 0 };
    const logs = getRuntimeLogCorpus();
    let newCount = 0;

    for (const log of logs) {
      const msg = (log.full_log || log.message || log._msg || '').toLowerCase();
      const level = (log.level || log.severity || '').toLowerCase();
      const host = log.host || 'WS-EDGE-SENSOR';
      const remoteIP = log.remoteIP || log.ip || log.src_ip || '198.51.100.88';

      let matchedThreat: {
        threat: string;
        category: 'ueba' | 'ics' | 'apt' | 'bruteforce' | 'c2' | 'exfil';
        mitreTTP: string;
        mitreStage: 'Recon' | 'Initial Access' | 'Privilege Escalation' | 'Lateral Movement' | 'Exfiltration';
        riskScore: number;
        action: string;
        cve?: string;
        aiSummary: string;
        hexDump?: string;
        confidence?: number;
        recommendedPlaybooks?: PlaybookItem[];
      } | null = null;

      // 1. Primary: Evaluate through Deep Attack Signature Engine
      const sigDetection = globalAttackSignatureEngine.evaluateLog(log);
      if (sigDetection) {
        matchedThreat = {
          threat: `${sigDetection.signatureName} (${host})`,
          category: sigDetection.category,
          mitreTTP: sigDetection.mitreTTP,
          mitreStage: sigDetection.mitreStage,
          riskScore: sigDetection.riskScore,
          action: sigDetection.recommendedActions[0]?.title || '特徵碼自動防禦阻斷',
          cve: sigDetection.cve,
          aiSummary: sigDetection.summary,
          hexDump: sigDetection.hexDump,
          confidence: sigDetection.confidence,
          recommendedPlaybooks: sigDetection.recommendedActions.map((a, idx) => ({
            id: `pb-sig-${idx}`,
            title: a.title,
            description: a.description,
            type: a.type
          }))
        };
      } else if (msg.includes('failed password') || msg.includes('authentication failure') || msg.includes('brute force') || msg.includes('preauth fail')) {
        matchedThreat = {
          threat: `分散式憑證暴力破解與撞庫攻擊 (${host})`,
          category: 'bruteforce',
          mitreTTP: 'T1110.001 Password Guessing',
          mitreStage: 'Initial Access',
          riskScore: 8.9,
          action: '高頻登入失敗超過閾值，自動實施速率限制',
          aiSummary: `偵測到來自 ${remoteIP} 的密集帳密猜測攻擊，針對 ${host} 進行未授權存取嘗試，已觸發預防性阻斷原則。`
        };
      } else if (msg.includes('modbus') || msg.includes('plc') || msg.includes('scada') || msg.includes('holding register') || msg.includes('function code 0x06')) {
        matchedThreat = {
          threat: `工控 Modbus/TCP 暫存器未授權寫入攻擊 (${host})`,
          category: 'ics',
          mitreTTP: 'T0816 Impair Process Control',
          mitreStage: 'Lateral Movement',
          riskScore: 9.9,
          action: '工控通訊白名單阻斷異常寫入指令',
          cve: 'ICS-ALERT-2026-MODBUS',
          aiSummary: `現場工控感測器偵測到異常非授權 Modbus 寫入請求，企圖變更關鍵設定點，SOAR 已下發 PLC 連接埠硬體隔離。`
        };
      } else if (msg.includes('beacon') || msg.includes('c2') || msg.includes('reverse shell') || msg.includes('cobalt strike') || msg.includes('powershell -enc')) {
        matchedThreat = {
          threat: `隱蔽 C2 通道連線與惡意代碼注入 (${host})`,
          category: 'c2',
          mitreTTP: 'T1059.001 Command and Scripting Interpreter',
          mitreStage: 'Lateral Movement',
          riskScore: 9.7,
          action: '即時終止可疑處理程序並隔離該主機',
          aiSummary: `端點行為分析偵測到高頻混淆命令列執行與反向連線特徵，符合 APT 組織 Cobalt Strike 植入信標行為。`
        };
      } else if (msg.includes('exfil') || msg.includes('mega.nz') || msg.includes('large upload') || msg.includes('dns tunneling') || msg.includes('base32')) {
        matchedThreat = {
          threat: `機敏數據巨量異常外洩 (${host})`,
          category: 'exfil',
          mitreTTP: 'T1567.002 Exfiltration to Cloud Storage',
          mitreStage: 'Exfiltration',
          riskScore: 9.8,
          action: '阻斷外傳連線並撤銷帳號 SSO Token',
          aiSummary: `偵測到大量非工作時段機密檔案外傳行為，累計外流流量超出基準線，已通知安全合規團隊並執行封鎖。`
        };
      } else if (msg.includes('ransomware') || msg.includes('vssadmin') || msg.includes('shadowcopy') || msg.includes('.encrypted')) {
        matchedThreat = {
          threat: `勒索軟體加密活動與卷影複本刪除破壞 (${host})`,
          category: 'apt',
          mitreTTP: 'T1486 Data Encrypted for Impact',
          mitreStage: 'Exfiltration',
          riskScore: 9.9,
          action: '立即下發主機全隔離並觸發備份保護鎖',
          cve: 'ALERT-RANSOM-SHADOW-DEL',
          aiSummary: `偵測到端點正嘗試執行 vssadmin 刪除備份卷影並高頻重命名加密檔案，符合高危險勒索軟體特徵，SOAR 自動封鎖。`
        };
      } else if (msg.includes('mimikatz') || msg.includes('lsass') || msg.includes('sekurlsa') || msg.includes('ntdsutil')) {
        matchedThreat = {
          threat: `記憶體特權憑證轉儲攻擊 (LSASS Dump) (${host})`,
          category: 'apt',
          mitreTTP: 'T1003.001 OS Credential Dumping: LSASS Memory',
          mitreStage: 'Privilege Escalation',
          riskScore: 9.7,
          action: '強制重設管理員憑證並隔離可疑處理程序',
          cve: 'CWE-250 Execution with Unnecessary Privileges',
          aiSummary: `端點感測器捕獲未經授權之處理程序存取 lsass.exe 記憶體以讀取明文密碼及 NTLM Hash，已觸發預防性帳密吊銷。`
        };
      } else if (level === 'critical' || msg.includes('sqli') || msg.includes('exploit') || msg.includes('rce') || msg.includes('log4j')) {
        matchedThreat = {
          threat: `高危遠端代碼執行與 Web 漏洞攻擊 (${host})`,
          category: 'apt',
          mitreTTP: 'T1190 Exploit Public-Facing Application',
          mitreStage: 'Initial Access',
          riskScore: 9.6,
          action: '邊界 WAF 已攔截攻擊載荷並記錄數位證據',
          cve: 'CVE-2026-SECURITY-EXPLOIT',
          aiSummary: `Web 防火牆日誌中捕獲特徵明確的漏洞利用載荷，企圖突破邊界應用程式獲取伺服器最高控制權。`
        };
      }

      if (matchedThreat) {
        // Prevent duplicate incidents with exact same threat, host, and remote IP
        const exists = criticalIncidents.some(
          i => i.threat === matchedThreat!.threat && i.srcHost === host && i.srcip === remoteIP
        );
        if (!exists) {
          const newId = `INC-2026-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;
          const payloadRaw = typeof log === 'string' ? log : JSON.stringify(log);
          const hexDump = Buffer.from(payloadRaw.slice(0, 32), 'utf8').toString('hex').match(/.{1,2}/g)?.join(' ') || '41 54 54 41 43 4b';

          const newIncident: CriticalIncidentItem = {
            id: newId,
            time: log['@timestamp'] || new Date().toISOString().replace('T', ' ').slice(0, 19),
            srcip: remoteIP,
            srcHost: host,
            srcUser: log.user || log.source_user || 'SYSTEM',
            dstip: log.dst_ip || log.dest_ip || '10.88.88.100',
            dstHost: log.dstHost || 'CORE-SECURITY-CLUSTER',
            action: matchedThreat.action,
            country: remoteIP.startsWith('10.') || remoteIP.startsWith('192.168.') ? 'Internal' : 'External',
            threat: matchedThreat.threat,
            risk: matchedThreat.riskScore >= 9.0 ? 'Critical' : 'High',
            riskScore: matchedThreat.riskScore,
            status: 'active',
            category: matchedThreat.category,
            cve: matchedThreat.cve || 'N/A',
            mitreTTP: matchedThreat.mitreTTP,
            mitreStage: matchedThreat.mitreStage,
            affectedAssets: 2,
            confidence: matchedThreat.confidence || 96.5,
            payloadHex: matchedThreat.hexDump || hexDump,
            rawLog: JSON.stringify(log, null, 2),
            aiSummary: matchedThreat.aiSummary,
            recommendedPlaybooks: (matchedThreat.recommendedPlaybooks && matchedThreat.recommendedPlaybooks.length > 0)
              ? matchedThreat.recommendedPlaybooks
              : [
                  { id: `pb-${newId}-1`, title: '即時阻斷受害端點連網 (EDR Quarantine)', description: '向端點防護引擎下發物理與邏輯網路阻斷指令', type: 'isolate' },
                  { id: `pb-${newId}-2`, title: '下發邊界防火牆黑名單封鎖', description: `將攻擊來源 ${remoteIP} 加入全域 Drop 規則`, type: 'block' },
                  { id: `pb-${newId}-3`, title: '強制撤銷帳號授權與 SSO Session', description: '立即鎖定使用者憑證並終止連線權杖', type: 'revoke' }
                ],
            notes: [
              {
                id: `note-${Date.now()}`,
                author: 'Log Correlation Engine',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
                content: `由後端日誌收集管線自動關聯入案。匹配規則：${matchedThreat.category.toUpperCase()} 威脅模式。`
              }
            ],
            history: [
              { timestamp: new Date().toISOString(), action: 'INCIDENT_CORRELATED_FROM_LOGS', operator: 'SIEM Correlation Engine' }
            ]
          };

          criticalIncidents.unshift(newIncident);
          newCount++;

          if (broadcastUpdate) {
            broadcastUpdate({ type: 'incident_created', incident: newIncident });
          }
        }
      }
    }

    return { correlatedCount: newCount, scannedLogsCount: logs.length };
  }

  // 0.1 POST /api/v1/incidents/correlate-logs (Trigger automated log correlation)
  router.post('/correlate-logs', (req: Request, res: Response) => {
    const result = correlateLogs();
    res.json({
      success: true,
      message: `已完成 ${result.scannedLogsCount} 筆後端收集日誌之關聯分析，新立案 ${result.correlatedCount} 筆嚴重事件`,
      scannedLogsCount: result.scannedLogsCount,
      correlatedCount: result.correlatedCount,
      totalIncidents: criticalIncidents.length,
      incidents: criticalIncidents,
      stats: getStats()
    });
  });

  // 0.2 GET /api/v1/incidents/logs/summary (Log corpus health & threat indicators)
  router.get('/logs/summary', (req: Request, res: Response) => {
    const rawCorpus = getRuntimeLogCorpus ? getRuntimeLogCorpus() : [];
    const highRiskLogs = rawCorpus.filter((l: any) => {
      const lvl = (l.level || l.severity || '').toLowerCase();
      const txt = (l.full_log || l.message || l._msg || '').toLowerCase();
      return lvl === 'critical' || lvl === 'error' || txt.includes('attack') || txt.includes('fail') || txt.includes('modbus') || txt.includes('c2') || txt.includes('beacon') || txt.includes('exfil') || txt.includes('ransomware');
    });

    res.json({
      success: true,
      totalLogs: rawCorpus.length,
      highRiskLogsCount: highRiskLogs.length,
      activeIncidentCount: criticalIncidents.filter(i => i.status === 'active').length,
      lastIngestedLogTime: rawCorpus[0]?.['@timestamp'] || new Date().toISOString(),
      recentLogsSample: rawCorpus.slice(0, 8).map((l: any, idx: number) => ({
        id: `sample-${idx}`,
        timestamp: l['@timestamp'] || new Date().toISOString(),
        host: l.host || 'unknown-host',
        level: (l.level || 'INFO').toUpperCase(),
        protocol: l.protocol || 'syslog',
        source: l.source || 'ingest-pipeline',
        message: (l.full_log || l.message || l._msg || 'Log event telemetry recorded').slice(0, 140)
      }))
    });
  });

  // 0.3 GET /api/v1/incidents/:id/evidence-logs (Query real matching backend logs for an incident)
  router.get('/:id/evidence-logs', (req: Request, res: Response) => {
    const { id } = req.params;
    const item = criticalIncidents.find(i => i.id === id);
    if (!item) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    const rawCorpus = getRuntimeLogCorpus ? getRuntimeLogCorpus() : [];
    const searchTerms = [item.srcip, item.dstip, item.srcHost].filter(Boolean) as string[];

    // Match logs containing IP or Host or Category keyword
    let matched = rawCorpus.filter((log: any) => {
      const str = (
        (log.full_log || '') + ' ' +
        (log.message || '') + ' ' +
        (log._msg || '') + ' ' +
        (log.host || '') + ' ' +
        (log.remoteIP || '') + ' ' +
        (log.source || '')
      ).toLowerCase();

      return searchTerms.some(term => str.includes(term.toLowerCase())) ||
             str.includes(item.category.toLowerCase());
    });

    // If corpus has few matches, synthesize contextual evidence logs from the incident raw payload
    if (matched.length === 0) {
      try {
        const parsed = JSON.parse(item.rawLog);
        matched = [
          {
            '@timestamp': item.time,
            level: item.risk === 'Critical' ? 'CRITICAL' : 'WARN',
            host: item.srcHost || 'edge-sensor-01',
            source: 'syslog-stream',
            protocol: 'RFC5424',
            message: `[SECURITY-ALERT] ${item.threat} - Src: ${item.srcip} -> Dst: ${item.dstip}`,
            ...parsed
          }
        ];
      } catch {
        matched = [
          {
            '@timestamp': item.time,
            level: 'CRITICAL',
            host: item.srcHost || 'edge-sensor-01',
            source: 'syslog-stream',
            protocol: 'RFC5424',
            message: `${item.threat} (Target: ${item.dstHost})`
          }
        ];
      }
    }

    const formattedLogs = matched.slice(0, 25).map((l: any, idx: number) => ({
      id: `ev-${id}-${idx}`,
      timestamp: l['@timestamp'] || new Date(Date.now() - idx * 15000).toISOString().replace('T', ' ').slice(0, 19),
      level: (l.level || (idx === 0 ? 'CRITICAL' : 'WARN')).toUpperCase(),
      host: l.host || item.srcHost || 'unknown-host',
      source: l.source || l.protocol || 'syslog',
      protocol: l.protocol || 'UDP 5140',
      message: l.full_log || l.message || l._msg || `Raw forensic packet telemetry captured for ${item.id}`,
      raw: JSON.stringify(l)
    }));

    res.json({
      success: true,
      incidentId: id,
      count: formattedLogs.length,
      logs: formattedLogs
    });
  });

  // 0.4 POST /api/v1/incidents/simulate-threat-log (Inject threat log and auto-correlate)
  router.post('/simulate-threat-log', (req: Request, res: Response) => {
    const { threatType, customHost, customIp } = req.body;
    const host = customHost || `WS-PROD-${Math.floor(Math.random() * 80 + 10)}`;
    const ip = customIp || `198.51.100.${Math.floor(Math.random() * 200 + 10)}`;

    let simulatedLog: any;
    if (threatType === 'ics') {
      simulatedLog = {
        '@timestamp': new Date().toISOString(),
        level: 'CRITICAL',
        host: 'PLC-STATION-TURBINE-02',
        remoteIP: '192.168.100.88',
        source: 'ot-modbus-sensor',
        protocol: 'TCP 502',
        message: 'Modbus/TCP holding register 40012 unauthorized override attempt from 192.168.100.88, function code 0x06 setpoint manipulation'
      };
    } else if (threatType === 'c2') {
      simulatedLog = {
        '@timestamp': new Date().toISOString(),
        level: 'CRITICAL',
        host,
        remoteIP: ip,
        source: 'edr-behavioral-agent',
        protocol: 'TLS 443',
        message: `PowerShell -enc suspicious execution and Cobalt Strike beacon reverse shell connection established to external C2 node ${ip}`
      };
    } else if (threatType === 'ransomware') {
      simulatedLog = {
        '@timestamp': new Date().toISOString(),
        level: 'CRITICAL',
        host,
        remoteIP: '10.200.4.15',
        source: 'edr-tamper-guard',
        protocol: 'RPC 445',
        message: `Mass file extension change detected (.encrypted) and vssadmin delete shadows attempted on host ${host}`
      };
    } else if (threatType === 'exfil') {
      simulatedLog = {
        '@timestamp': new Date().toISOString(),
        level: 'CRITICAL',
        host,
        remoteIP: '198.51.100.88',
        source: 'ueba-dlp-proxy',
        protocol: 'HTTPS 443',
        message: `Mega.nz large encrypted upload anomaly: 18.2GB outbound archive transmission detected during off-hours from ${host}`
      };
    } else if (threatType === 'sqli') {
      simulatedLog = {
        '@timestamp': new Date().toISOString(),
        level: 'CRITICAL',
        host,
        remoteIP: ip,
        source: 'waf-edge-sensor',
        protocol: 'HTTP 80',
        message: `SQLi injection attack blocked: ' UNION SELECT null, username, password_hash FROM corp_users-- from ${ip}`
      };
    } else {
      simulatedLog = {
        '@timestamp': new Date().toISOString(),
        level: 'CRITICAL',
        host,
        remoteIP: ip,
        source: 'auth-gateway-pam',
        protocol: 'TCP 22',
        message: `Failed password for root from ${ip} port 49822 ssh2 (brute force burst detected: 520 attempts/min)`
      };
    }

    if (getRuntimeLogCorpus) {
      getRuntimeLogCorpus().unshift(simulatedLog);
    }

    const { correlatedCount } = correlateLogs();

    res.status(201).json({
      success: true,
      message: `已將威脅 Log 注入後端收集佇列，自動關聯立案 ${correlatedCount} 筆嚴重事件！`,
      injectedLog: simulatedLog,
      latestIncident: criticalIncidents[0],
      totalIncidents: criticalIncidents.length
    });
  });

  // 1. GET /api/v1/incidents (List with filters & stats)
  router.get('/', (req: Request, res: Response) => {
    // Automatically correlate against raw backend log corpus
    correlateLogs();

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

    const topology = globalAttackSignatureEngine.generateDynamicTopology(item);

    res.json({
      success: true,
      topology
    });
  });

  // 10.1 POST /api/v1/incidents/:id/topology/contain-node (1-Click node containment from topology UI)
  router.post('/:id/topology/contain-node', (req: Request, res: Response) => {
    const { id } = req.params;
    const { nodeId, action, operator } = req.body;
    const item = criticalIncidents.find(i => i.id === id);
    if (!item) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    // Apply containment
    if (!(item as any).containedNodes) {
      (item as any).containedNodes = [];
    }
    if (!(item as any).containedNodes.includes(nodeId)) {
      (item as any).containedNodes.push(nodeId);
    }
    item.status = 'contained';
    item.riskScore = Math.max(1.5, item.riskScore - 2.5);
    const historyItem: IncidentHistoryItem = {
      timestamp: new Date().toISOString(),
      action: `TOPOLOGY_NODE_CONTAINED: ${nodeId}`,
      operator: operator || 'Topology SOC Analyst',
      details: `對攻擊路徑拓撲節點 [${nodeId}] 執行實體/邏輯隔離處置 (${action || 'isolate'})，阻斷相鄰跳躍連線`
    };
    item.history = [...(item.history || []), historyItem];

    if (broadcastUpdate) {
      broadcastUpdate({ type: 'incident_contained', incidentId: id, nodeId, timestamp: new Date().toISOString() });
    }

    const updatedTopology = globalAttackSignatureEngine.generateDynamicTopology(item);

    res.json({
      success: true,
      message: `拓撲節點 ${nodeId} 已成功執行 ${action || '隔離'} 處置！全域防禦屏障已啟動`,
      incident: item,
      topology: updatedTopology,
      stats: getStats()
    });
  });

  // 10.2 GET /api/v1/incidents/signatures (List all active attack signature definitions)
  router.get('/signatures', (req: Request, res: Response) => {
    res.json({
      success: true,
      catalog: globalAttackSignatureEngine.getSignaturesCatalog()
    });
  });

  // 10.2.1 POST /api/v1/incidents/parse-log-signature (Parse custom arbitrary raw log & extract IOCs)
  router.post('/parse-log-signature', (req: Request, res: Response) => {
    const { rawLog, host, protocol, remoteIP } = req.body;
    if (!rawLog || typeof rawLog !== 'string') {
      return res.status(400).json({ error: 'Missing rawLog string parameter' });
    }

    const detection = globalAttackSignatureEngine.parseCustomLog(rawLog, { host, protocol, remoteIP });
    res.json({
      success: true,
      detection,
      analyzedAt: new Date().toISOString()
    });
  });

  // 10.2.2 POST /api/v1/incidents/scan-corpus-signatures (Scan entire runtime log collection corpus)
  router.post('/scan-corpus-signatures', (req: Request, res: Response) => {
    const rawCorpus = getRuntimeLogCorpus ? getRuntimeLogCorpus() : [];
    const scanResult = globalAttackSignatureEngine.scanCorpus(rawCorpus);

    // Aggregate extracted IOCs
    const allIocs: any[] = [];
    scanResult.detections.forEach(d => {
      d.extractedIocs.forEach(ioc => {
        if (!allIocs.some(x => x.type === ioc.type && x.value === ioc.value)) {
          allIocs.push(ioc);
        }
      });
    });

    res.json({
      success: true,
      totalScannedLogs: rawCorpus.length,
      matchedDetectionsCount: scanResult.detections.length,
      signatureStats: scanResult.signatureStats,
      extractedIocs: allIocs.slice(0, 50),
      recentDetections: scanResult.detections.slice(0, 10)
    });
  });

  // 10.3 GET /api/v1/incidents/:id/signature-analysis (Deep threat signature & IOC breakdown)
  router.get('/:id/signature-analysis', (req: Request, res: Response) => {
    const { id } = req.params;
    const item = criticalIncidents.find(i => i.id === id);
    if (!item) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    let parsedLog: any;
    try {
      parsedLog = JSON.parse(item.rawLog);
    } catch {
      parsedLog = { message: item.threat, host: item.srcHost, protocol: 'syslog' };
    }

    const detection = globalAttackSignatureEngine.evaluateLog(parsedLog) || {
      signatureId: `SIG-${item.category.toUpperCase()}-AUTOGEN`,
      signatureName: item.threat,
      category: item.category,
      mitreTTP: item.mitreTTP,
      mitreTactic: 'Execution',
      mitreStage: item.mitreStage,
      riskScore: item.riskScore,
      confidence: item.confidence,
      cve: item.cve || 'N/A',
      summary: item.aiSummary,
      decodedPayload: item.payloadHex,
      hexDump: item.payloadHex,
      extractedIocs: [
        { type: 'ipv4', value: item.srcip, context: '攻擊來源節點 IP', risk: 'critical' },
        { type: 'ipv4', value: item.dstip, context: '目標受害節點 IP', risk: 'high' }
      ],
      forensicEvidence: {
        matchedPatterns: [item.threat],
        logTimestamp: item.time,
        protocol: 'RFC5424/Syslog',
        attackVector: item.action
      },
      recommendedActions: item.recommendedPlaybooks
    };

    res.json({
      success: true,
      incidentId: id,
      detection
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

  // 14. POST /api/v1/incidents/clear (Purge all critical incidents for clean state)
  router.post('/clear', (_req: Request, res: Response) => {
    criticalIncidents = [];
    if (broadcastUpdate) {
      broadcastUpdate({ type: 'incidents_cleared' });
    }
    res.json({
      success: true,
      message: '嚴重資安事件資料庫已全數清空，就緒於實體即時關聯警報',
      incidents: criticalIncidents,
      stats: getStats()
    });
  });

  return router;
}
