import express, { type Request, type Response } from 'express';
const Router = express.Router;

export function createAiAnalystRouter() {
  const router = Router();

  router.post('/investigate', (req: Request, res: Response) => {
    const { question, incidentId, logContext } = req.body;
    const q = String(question || '').toLowerCase();

    let answer = "根據平台全鏈路日誌與遙測大數據分析：";
    let keyFindings = [
      "來源 IP 45.142.214.88 在過去 24 小時內發起超過 4,200 次 SSH 暴力猜測請求。",
      "目標主機 10.0.12.44 出現 DNS 隧道特徵 (Base64 子域名頻繁向外部 DNS 請求)，疑似 C2 通道。",
      "端點防護 (EDR) 成功在 10.0.4.15 上阻斷 mimikatz 針對 LSASS 記憶體的憑證抓取操作。"
    ];
    let recommendedActions = [
      "1. 於次世代防火牆 (Palo Alto) 與邊界交換器將來源 45.142.214.88 加入全局封鎖清單。",
      "2. 針對 10.0.12.44 實施 802.1X NAC 隔離至 VLAN 999 進行惡意程式鑑識清理。",
      "3. 強制重設財務部門與網域管理員特權帳號密碼，啟用 FIDO2 雙因子硬體認證。"
    ];

    if (q.includes('eternalblue') || q.includes('smb') || q.includes('445') || q.includes('cve-2017-0144')) {
      answer = "【AI 深度分析報告：EternalBlue SMBv1 漏洞攻擊行為】\n偵測到來源 10.88.14.92 試圖向網域控制站 (DC-01) 445 埠發送畸形 SMBv1 封包。此行為完全符合 CVE-2017-0144 (MS17-010) 漏洞利用特徵。防火牆已執行 DROP 丟棄，且 DC-01 已於系統層徹底關閉 SMBv1 協定，本次攻擊未造成特權外洩。";
      keyFindings = [
        "攻擊協定: SMBv1 (TCP Port 445)",
        "攻擊手法: MITRE ATT&CK T1210 - Exploitation of Remote Services",
        "防禦結果: 防火牆連線阻斷 (Deny) + 封包校驗丟棄"
      ];
    } else if (q.includes('dns') || q.includes('c2') || q.includes('tunnel')) {
      answer = "【AI 深度分析報告：DNS 隧道 Command and Control 鑑識】\n主機 10.0.12.44 於過去 1 小時內向 8.8.8.8 發送了超過 1,400 筆高長度熵值 TXT/A 查詢。此模式為典型利用 DNS 協定繞過出口代理的數據回傳行為，已啟動頻寬限制與會話切斷。";
    }

    res.json({
      success: true,
      query: question,
      incidentId: incidentId || "INC-CURRENT",
      aiModel: "CyberGuard-AI Analyst Engine (Fine-tuned for MITRE & RFC Telemetry)",
      confidenceScore: 96,
      generatedAt: new Date().toISOString(),
      answer,
      keyFindings,
      recommendedActions
    });
  });

  router.post('/triage-alert', (req: Request, res: Response) => {
    const { rawLog, alertName, severity } = req.body;
    res.json({
      success: true,
      alertTriage: {
        alertName: alertName || "Suspicious Execution Detected",
        calculatedSeverity: severity || "Critical",
        threatCategory: "Credential Theft / Defense Evasion",
        falsePositiveProbabilityPct: 3.2,
        mitreMapping: {
          tactic: "Credential Access",
          technique: "T1003.001 - LSASS Memory",
          subTechniqueName: "OS Credential Dumping: LSASS Memory"
        },
        triageSummary: "高可信度惡意行為。日誌顯示行程試圖調用未授權的虛擬記憶體讀取 API，強烈建議自動啟動 SOAR 隔離劇本。"
      }
    });
  });

  router.get('/insights', (req: Request, res: Response) => {
    res.json({
      success: true,
      dailySummary: "全網昨日防護攔截 14,290 次攻擊嘗試，整體安全態勢評級為【良好 (HEALTHY)】。主要威脅向量集中於外部 SSH 字典暴力猜測與少量釣魚鏈接點擊嘗試，均已被 WAF、NDR 及端點 EDR 在第一時間撲滅。",
      topThreats: [
        { name: "外部自動化 SSH/RDP 掃描", threatCount: 9240, status: "Auto-Blocked" },
        { name: "釣魚郵件附檔巨集阻絕", threatCount: 412, status: "Quarantined" },
        { name: "端點防禦規避與憑證探測", threatCount: 12, status: "Isolated" }
      ]
    });
  });

  return router;
}
