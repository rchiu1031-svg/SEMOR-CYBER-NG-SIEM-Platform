import express, { type Request, type Response } from 'express';
const Router = express.Router;

export function createSoarRouter() {
  const router = Router();

  let playbooks = [
    {
      id: "pb-ransomware-containment",
      name: "勒索軟體端點與網路緊急自動阻斷處置",
      triggerType: "ALERT_SEVERITY_CRITICAL",
      status: "active",
      stepsCount: 5,
      lastExecutedAt: new Date(Date.now() - 3600000).toISOString(),
      executionCount: 18,
      steps: [
        { order: 1, name: "下發 EDR 端點微隔離", integration: "CrowdStrike Falcon", action: "isolate_network" },
        { order: 2, name: "終止惡意父行程樹", integration: "Endpoint OS Agent", action: "kill_process_tree" },
        { order: 3, name: "802.1X NAC 切換隔離 VLAN", integration: "Cisco Catalyst 9300", action: "vlan_quarantine" },
        { order: 4, name: "封鎖外部 C2 逆向連線", integration: "Palo Alto NGFW", action: "add_firewall_drop_rule" },
        { order: 5, name: "自動立案與通報 SOC 應變小組", integration: "Case Management & Slack", action: "create_case_and_notify" }
      ]
    },
    {
      id: "pb-brute-force-mitigation",
      name: "高頻 SSH/RDP 暴力撞庫自動動態黑名單",
      triggerType: "LOG_PATTERN_MATCH",
      status: "active",
      stepsCount: 3,
      lastExecutedAt: new Date(Date.now() - 1800000).toISOString(),
      executionCount: 1420,
      steps: [
        { order: 1, name: "提取攻擊來源 IP 與關聯網段", integration: "Regex Ingest Pipeline", action: "extract_ioc" },
        { order: 2, name: "同步至全網邊界防火牆黑名單", integration: "Fortinet FortiGate", action: "add_blacklist_address" },
        { order: 3, name: "冷卻 24 小時後自動驗證釋放", integration: "SOAR Scheduler", action: "cooldown_timer" }
      ]
    },
    {
      id: "pb-phishing-triage",
      name: "可疑釣魚郵件自動拆解與沙箱引爆",
      triggerType: "USER_REPORT_OR_INLINE_WAF",
      status: "active",
      stepsCount: 4,
      lastExecutedAt: new Date(Date.now() - 7200000).toISOString(),
      executionCount: 84,
      steps: [
        { order: 1, name: "提取郵件超連結與附件 Hash", integration: "Mail Gateway Parser", action: "extract_artifacts" },
        { order: 2, name: "發起 URLhaus / VirusTotal 交叉情資檢驗", integration: "CTI TAXII Engine", action: "check_ioc_reputation" },
        { order: 3, name: "隔離全網收到相同郵件之收件匣", integration: "Microsoft 365 Exchange", action: "purge_phishing_message" },
        { order: 4, name: "回饋使用者安全分析報告", integration: "SOC Notification Mailer", action: "send_user_receipt" }
      ]
    }
  ];

  let executionLogs = [
    {
      executionId: "exec-901",
      playbookId: "pb-ransomware-containment",
      playbookName: "勒索軟體端點與網路緊急自動阻斷處置",
      triggeredBy: "INC-2026-0902 (Mimikatz Credential Dumping)",
      targetAsset: "10.0.4.15 (FINANCE-PC03)",
      status: "SUCCESS",
      startedAt: new Date(Date.now() - 3600000).toISOString(),
      durationMs: 820,
      stepsCompleted: 5,
      stepsTotal: 5,
      auditLog: "所有 5 個聯防步驟均成功執行完畢。端點已切入保護隔離狀態。"
    },
    {
      executionId: "exec-902",
      playbookId: "pb-brute-force-mitigation",
      playbookName: "高頻 SSH/RDP 暴力撞庫自動動態黑名單",
      triggeredBy: "Suricata IDS (45.142.214.88)",
      targetAsset: "45.142.214.88",
      status: "SUCCESS",
      startedAt: new Date(Date.now() - 1800000).toISOString(),
      durationMs: 310,
      stepsCompleted: 3,
      stepsTotal: 3,
      auditLog: "來源 IP 45.142.214.88 已成功推播至邊界防火牆黑名單封鎖。"
    }
  ];

  router.get('/playbooks', (req: Request, res: Response) => {
    res.json({ success: true, count: playbooks.length, playbooks });
  });

  router.post('/playbooks', (req: Request, res: Response) => {
    const { name, triggerType, steps } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const newPb = {
      id: `pb-${Date.now().toString().slice(-4)}`,
      name,
      triggerType: triggerType || "MANUAL_TRIGGER",
      status: "active",
      stepsCount: Array.isArray(steps) ? steps.length : 1,
      lastExecutedAt: "Never",
      executionCount: 0,
      steps: steps || [{ order: 1, name: "執行安全審計處置", integration: "System Log", action: "audit_log" }]
    };

    playbooks.unshift(newPb);
    res.json({ success: true, message: `SOAR 劇本 '${newPb.name}' 建立成功`, playbook: newPb });
  });

  router.post('/playbooks/:id/run', (req: Request, res: Response) => {
    const { id } = req.params;
    const { targetAsset, dryRun } = req.body;
    const pb = playbooks.find(p => p.id === id);
    if (!pb) {
      return res.status(404).json({ error: 'Playbook not found' });
    }

    pb.executionCount++;
    pb.lastExecutedAt = new Date().toISOString();

    const execLog = {
      executionId: `exec-${Date.now().toString().slice(-4)}`,
      playbookId: pb.id,
      playbookName: pb.name,
      triggeredBy: "Manual SOC Analyst Trigger",
      targetAsset: targetAsset || "All Affected Infrastructure",
      status: dryRun ? "DRY_RUN_SUCCESS" : "SUCCESS",
      startedAt: new Date().toISOString(),
      durationMs: Math.floor(Math.random() * 400 + 200),
      stepsCompleted: pb.stepsCount,
      stepsTotal: pb.stepsCount,
      auditLog: dryRun 
        ? `【演練模式】劇本所有 ${pb.stepsCount} 個步驟模擬校驗通過，未實際修改生產配置。` 
        : `【正式執行】劇本所有 ${pb.stepsCount} 個自動化處置步驟均已即時交付各資安防禦設備執行！`
    };

    executionLogs.unshift(execLog);
    res.json({
      success: true,
      message: execLog.auditLog,
      execution: execLog
    });
  });

  router.get('/executions', (req: Request, res: Response) => {
    res.json({ success: true, count: executionLogs.length, executions: executionLogs });
  });

  router.get('/actions', (req: Request, res: Response) => {
    res.json({
      success: true,
      connectors: [
        { name: "Fortinet FortiGate", actions: ["block_ip", "quarantine_mac", "update_utm_policy"] },
        { name: "Palo Alto NGFW", actions: ["add_edl_ip", "terminate_session", "dns_sinkhole"] },
        { name: "CrowdStrike Falcon EDR", actions: ["isolate_host", "kill_process", "get_file_sample"] },
        { name: "Microsoft 365 Exchange", actions: ["purge_email", "revoke_user_sessions", "block_sender"] },
        { name: "Cisco Catalyst 9300", actions: ["shutdown_port", "vlan_change", "8021x_reauth"] }
      ]
    });
  });

  return router;
}
