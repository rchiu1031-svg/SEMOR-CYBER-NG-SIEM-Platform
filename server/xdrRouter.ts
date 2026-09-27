import { Router, Request, Response } from 'express';

export function createXdrRouter() {
  const router = Router();

  const correlations = [
    {
      id: "XDR-CORR-101",
      title: "多階段進階持續威脅 (APT) 鏈路: 釣魚鏈接 -> 認證竊取 -> 橫向移動 -> 勒索破壞",
      severity: "Critical",
      confidenceScore: 98,
      status: "Active_Investigating",
      startedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      impactedAssetsCount: 4,
      involvedLayers: ["Endpoint (EDR)", "Network (NDR)", "Identity (AD)", "Perimeter (NGFW)"],
      killChainPhases: [
        { phase: "Initial Access", technique: "T1566.002 Spearphishing Link", detectedBy: "WAF & OpenPhish Intel", target: "hr_admin (HR-DESKTOP-09)" },
        { phase: "Credential Access", technique: "T1003.001 LSASS Memory", detectedBy: "CrowdStrike EDR", target: "victim_user (FINANCE-PC03)" },
        { phase: "Lateral Movement", technique: "T1210 Exploitation of Remote Services", detectedBy: "Suricata IDS & NDR", target: "dc01.corp.internal (192.168.1.100)" },
        { phase: "Command and Control", technique: "T1071.004 DNS Tunneling", detectedBy: "Palo Alto NGFW", target: "DEV-MAC-BOOK-12 (10.0.12.44)" }
      ],
      aiNarrative: "攻擊者透過釣魚社交工程獲得初始權限後，在財務主機執行 Mimikatz 提取記憶體憑證，並利用 EternalBlue (MS17-010) 橫向探測網域控制站 (DC01)。同時建立高隱蔽 DNS C2 隧道嘗試回傳滲透資訊。建議立即啟動 XDR 一鍵複合聯防切斷鏈路。"
    },
    {
      id: "XDR-CORR-102",
      title: "分散式 SSH/RDP 暴力猜測伴隨外部漏洞掃描",
      severity: "High",
      confidenceScore: 91,
      status: "Contained",
      startedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      impactedAssetsCount: 2,
      involvedLayers: ["Network (NDR)", "Perimeter (NGFW)", "Auth (Syslog)"],
      killChainPhases: [
        { phase: "Reconnaissance", technique: "T1046 Network Service Scanning", detectedBy: "Fortinet IPS", target: "辦公核心網段 (192.168.1.50)" },
        { phase: "Credential Access", technique: "T1110.001 Password Guessing", detectedBy: "Suricata IDS", target: "edge-gateway-01 (172.16.0.22)" }
      ],
      aiNarrative: "外部已知惡意 IP 叢集針對 SSH 與 RDP 進行自動化撞庫掃描，邊界防火牆已自動下發黑名單阻斷來源 IP。"
    }
  ];

  router.get('/dashboard', (req: Request, res: Response) => {
    res.json({
      success: true,
      stats: {
        totalCorrelatedIncidents: correlations.length,
        criticalThreats: 1,
        activeSensors: 142,
        ingestedLayers: [
          { layer: "Endpoint (EDR)", status: "connected", eventsToday: 1845000, color: "#06b6d4" },
          { layer: "Network (NDR)", status: "connected", eventsToday: 3420000, color: "#6366f1" },
          { layer: "Identity (AD / IAM)", status: "connected", eventsToday: 984000, color: "#a855f7" },
          { layer: "Cloud / K8s", status: "connected", eventsToday: 1250000, color: "#ec4899" },
          { layer: "Perimeter (WAF / NGFW)", status: "connected", eventsToday: 2190000, color: "#10b981" }
        ],
        meanTimeToDetectMin: 1.2,
        meanTimeToRemediateMin: 4.8
      }
    });
  });

  router.get('/correlations', (req: Request, res: Response) => {
    res.json({ success: true, count: correlations.length, correlations });
  });

  router.get('/correlations/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const item = correlations.find(c => c.id === id);
    if (!item) {
      return res.status(404).json({ error: 'Correlation not found' });
    }
    res.json({ success: true, correlation: item });
  });

  router.post('/actions/remediate', (req: Request, res: Response) => {
    const { correlationId, actionType, targetAsset } = req.body;
    const timestamp = new Date().toISOString();

    const actionResult = {
      actionId: `xdr-act-${Date.now().toString().slice(-4)}`,
      correlationId: correlationId || "XDR-CORR-101",
      actionType: actionType || "isolate_host",
      targetAsset: targetAsset || "10.0.4.15 (FINANCE-PC03)",
      executedAt: timestamp,
      status: "SUCCESS",
      dispatchedIntegrations: ["CrowdStrike Falcon", "Fortinet FortiGate NGFW", "Cisco Catalyst 9300 NAC"],
      auditMessage: `[XDR_AUTO_REMEDIATION] 成功對受害資產 ${targetAsset} 執行 ${actionType} 隔離策略。工作站已阻斷內部網路橫向溝通，僅保留安全管理通道。`
    };

    res.json({ success: true, message: actionResult.auditMessage, result: actionResult });
  });

  return router;
}
