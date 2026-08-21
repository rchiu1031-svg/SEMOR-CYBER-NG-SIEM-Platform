import React, { useState, useMemo } from 'react';
import { 
  Binary, 
  Sparkles, 
  RefreshCw, 
  Save, 
  Search, 
  SearchX, 
  Shield, 
  ShieldAlert, 
  Server, 
  Terminal, 
  ExternalLink, 
  X, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  Copy, 
  Download, 
  Upload, 
  FileText, 
  Globe, 
  Cpu, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  Filter,
  Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import { cn } from '../lib/utils';

export interface ExtractedField {
  name: string;
  value: string;
  regex: string;
  type?: 'string' | 'ip' | 'port' | 'timestamp' | 'number' | 'action';
}

export interface DecoderItem {
  id: string;
  name: string;
  brand: string;
  category: 'firewall' | 'os' | 'web' | 'cloud' | 'ids' | 'custom';
  version: string;
  description: string;
  iconType?: string;
  isCustom?: boolean;
  fields: ExtractedField[];
  sampleLog?: string;
  timestamp?: string;
}

const PREDEFINED_DECODERS: DecoderItem[] = [
  {
    id: 'fortigate',
    name: 'FortiGate 防火牆解碼器',
    brand: 'Fortinet',
    category: 'firewall',
    version: '7.x / 6.x',
    description: '標準 FortiGate 流量、安全防護特徵、NAT 與 VPN 連線日誌解析',
    iconType: 'shield-red',
    sampleLog: 'Sep 23 12:45:01 fortigate-01 date=2026-09-23 time=12:45:01 devname="FGT-HQ" devid="FG200E-TR" eventtime=1695473101859345203 tz="+0800" logid="0000000013" type="traffic" subtype="forward" level="notice" vd="root" srcip=10.0.10.5 srcport=54321 srcintf="port1" srcintfrole="lan" dstip=8.8.8.8 dstport=443 dstintf="port2" dstintfrole="wan" srccountry="Reserved" dstcountry="United States" sessionid=123456789 proto=6 action="accept" policyid=1',
    fields: [
      { name: 'devname', value: 'FGT-HQ', regex: 'devname="?([^"\\s]+)"?', type: 'string' },
      { name: 'date', value: '2026-09-23', regex: 'date=([0-9-]+)', type: 'timestamp' },
      { name: 'time', value: '12:45:01', regex: 'time=([0-9:]+)', type: 'timestamp' },
      { name: 'srcip', value: '10.0.10.5', regex: 'srcip=([0-9.]+)', type: 'ip' },
      { name: 'srcport', value: '54321', regex: 'srcport=([0-9]+)', type: 'port' },
      { name: 'dstip', value: '8.8.8.8', regex: 'dstip=([0-9.]+)', type: 'ip' },
      { name: 'dstport', value: '443', regex: 'dstport=([0-9]+)', type: 'port' },
      { name: 'action', value: 'accept', regex: 'action="?([a-zA-Z]+)"?', type: 'action' },
      { name: 'proto', value: '6', regex: 'proto=([0-9]+)', type: 'number' },
      { name: 'sessionid', value: '123456789', regex: 'sessionid=([0-9]+)', type: 'number' }
    ]
  },
  {
    id: 'paloalto',
    name: 'Palo Alto PAN-OS 威脅防護解碼器',
    brand: 'Palo Alto Networks',
    category: 'firewall',
    version: '10.x / 11.x',
    description: 'PAN-OS 流量傳輸、威脅偵測 (Threat)、URL 過濾與 GlobalProtect 稽核事件',
    iconType: 'shield-orange',
    sampleLog: '{"timestamp":"2026-10-12T14:30:22.123Z","host":"palo-fw-01","type":"THREAT","subtype":"vulnerability","src":"192.168.50.22","dst":"104.22.12.110","sport":49221,"dport":80,"proto":"tcp","action":"drop","threat":"SQL Injection Attempt","severity":"critical"}',
    fields: [
      { name: 'timestamp', value: '2026-10-12T14:30:22.123Z', regex: '"timestamp"\\s*:\\s*"([^"]+)"', type: 'timestamp' },
      { name: 'host', value: 'palo-fw-01', regex: '"host"\\s*:\\s*"([^"]+)"', type: 'string' },
      { name: 'type', value: 'THREAT', regex: '"type"\\s*:\\s*"([^"]+)"', type: 'string' },
      { name: 'src', value: '192.168.50.22', regex: '"src"\\s*:\\s*"([^"]+)"', type: 'ip' },
      { name: 'dst', value: '104.22.12.110', regex: '"dst"\\s*:\\s*"([^"]+)"', type: 'ip' },
      { name: 'sport', value: '49221', regex: '"sport"\\s*:\\s*([0-9]+)', type: 'port' },
      { name: 'dport', value: '80', regex: '"dport"\\s*:\\s*([0-9]+)', type: 'port' },
      { name: 'action', value: 'drop', regex: '"action"\\s*:\\s*"([^"]+)"', type: 'action' },
      { name: 'threat', value: 'SQL Injection Attempt', regex: '"threat"\\s*:\\s*"([^"]+)"', type: 'string' },
      { name: 'severity', value: 'critical', regex: '"severity"\\s*:\\s*"([^"]+)"', type: 'string' }
    ]
  },
  {
    id: 'cisco-ftd',
    name: 'Cisco Firepower / ASA 解碼器',
    brand: 'Cisco',
    category: 'firewall',
    version: '6.x / 7.x / 9.x',
    description: 'FTD 統一威脅事件、存取控制政策與 ASA Syslog (%ASA-6-302013 / %ASA-4-106023)',
    iconType: 'server-blue',
    sampleLog: '%ASA-4-106023: Deny tcp src outside:203.0.113.50/49152 dst inside:192.168.1.10/22 by access-group "OUTSIDE-IN" [0x0, 0x0]',
    fields: [
      { name: 'message_code', value: '%ASA-4-106023', regex: '(%ASA-\\d+-\\d+)', type: 'string' },
      { name: 'action', value: 'Deny', regex: ':\\s*(Deny|Built|Teardown|Permit)', type: 'action' },
      { name: 'protocol', value: 'tcp', regex: '(?:Deny|Permit)\\s+([a-zA-Z]+)', type: 'string' },
      { name: 'src_interface', value: 'outside', regex: 'src\\s+([a-zA-Z0-9_-]+):', type: 'string' },
      { name: 'src_ip', value: '203.0.113.50', regex: 'src\\s+[a-zA-Z0-9_-]+:([0-9.]+)', type: 'ip' },
      { name: 'src_port', value: '49152', regex: 'src\\s+[a-zA-Z0-9_-]+:[0-9.]+/([0-9]+)', type: 'port' },
      { name: 'dst_interface', value: 'inside', regex: 'dst\\s+([a-zA-Z0-9_-]+):', type: 'string' },
      { name: 'dst_ip', value: '192.168.1.10', regex: 'dst\\s+[a-zA-Z0-9_-]+:([0-9.]+)', type: 'ip' },
      { name: 'dst_port', value: '22', regex: 'dst\\s+[a-zA-Z0-9_-]+:[0-9.]+/([0-9]+)', type: 'port' },
      { name: 'acl_rule', value: 'OUTSIDE-IN', regex: 'by access-group "([^"]+)"', type: 'string' }
    ]
  },
  {
    id: 'windows-security',
    name: 'Windows 安全事件日誌 (Security Event)',
    brand: 'Microsoft',
    category: 'os',
    version: 'Server 2019/2022/2025',
    description: '解析 Windows 登入稽核 (Event 4624/4625)、特權指派 (4672) 與行程建立 (4688)',
    iconType: 'server-purple',
    sampleLog: 'EventID=4625 ProviderName=Microsoft-Windows-Security-Auditing TimeCreated=2026-04-20T10:15:30.000Z TargetUserName="Administrator" TargetDomainName="CORP" Status="0xC000006D" SubStatus="0xC000006A" WorkstationName="WKSTN-99" IpAddress="192.168.10.88" IpPort="51234" LogonType=3',
    fields: [
      { name: 'EventID', value: '4625', regex: 'EventID=([0-9]+)', type: 'number' },
      { name: 'TimeCreated', value: '2026-04-20T10:15:30.000Z', regex: 'TimeCreated=([^\\s]+)', type: 'timestamp' },
      { name: 'TargetUserName', value: 'Administrator', regex: 'TargetUserName="?([^"\\s]+)"?', type: 'string' },
      { name: 'TargetDomainName', value: 'CORP', regex: 'TargetDomainName="?([^"\\s]+)"?', type: 'string' },
      { name: 'Status', value: '0xC000006D', regex: 'Status="?([^"\\s]+)"?', type: 'string' },
      { name: 'IpAddress', value: '192.168.10.88', regex: 'IpAddress="?([0-9.]+)"?', type: 'ip' },
      { name: 'IpPort', value: '51234', regex: 'IpPort="?([0-9]+)"?', type: 'port' },
      { name: 'LogonType', value: '3', regex: 'LogonType=([0-9]+)', type: 'number' }
    ]
  },
  {
    id: 'linux-audit',
    name: 'Linux Syslog / Auth / Auditd 解碼器',
    brand: 'Linux',
    category: 'os',
    version: 'Kernel 5.x / 6.x',
    description: '解析 Linux /var/log/auth.log、Sudo 提權操作與 auditd 系統呼叫事件',
    iconType: 'terminal-cyan',
    sampleLog: 'Apr 20 14:22:01 srv-core-01 sshd[24890]: Failed password for invalid user admin from 185.220.101.5 port 42890 ssh2',
    fields: [
      { name: 'timestamp', value: 'Apr 20 14:22:01', regex: '^([A-Z][a-z]{2}\\s+\\d+\\s+[0-9:]+)', type: 'timestamp' },
      { name: 'hostname', value: 'srv-core-01', regex: '^[A-Z][a-z]{2}\\s+\\d+\\s+[0-9:]+\\s+([^\\s]+)', type: 'string' },
      { name: 'process', value: 'sshd', regex: '([a-zA-Z0-9_-]+)\\[\\d+\\]:', type: 'string' },
      { name: 'pid', value: '24890', regex: '\\[(\\d+)\\]:', type: 'number' },
      { name: 'event_message', value: 'Failed password', regex: ':\\s*(Failed password|Accepted password|Invalid user)', type: 'string' },
      { name: 'user', value: 'admin', regex: '(?:for|user)\\s+([a-zA-Z0-9._-]+)', type: 'string' },
      { name: 'src_ip', value: '185.220.101.5', regex: 'from\\s+([0-9.]+)', type: 'ip' },
      { name: 'src_port', value: '42890', regex: 'port\\s+([0-9]+)', type: 'port' }
    ]
  },
  {
    id: 'nginx-access',
    name: 'Nginx / Apache Web 伺服器存取日誌',
    brand: 'Web Server',
    category: 'web',
    version: 'Combined Format',
    description: '解析標準 Web Access Log (客戶端 IP、HTTP 方法、請求路徑、狀態碼與 User-Agent)',
    iconType: 'globe-emerald',
    sampleLog: '192.168.1.150 - admin [20/Apr/2026:15:30:45 +0800] "POST /api/v1/auth/login HTTP/1.1" 200 4820 "https://semor.corp/login" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0"',
    fields: [
      { name: 'client_ip', value: '192.168.1.150', regex: '^([0-9.]+)', type: 'ip' },
      { name: 'auth_user', value: 'admin', regex: '^[0-9.]+\\s+-\\s+([^\\s]+)', type: 'string' },
      { name: 'timestamp', value: '20/Apr/2026:15:30:45 +0800', regex: '\\[([^\\]]+)\\]', type: 'timestamp' },
      { name: 'http_method', value: 'POST', regex: '"([A-Z]+)\\s+', type: 'action' },
      { name: 'request_uri', value: '/api/v1/auth/login', regex: '"[A-Z]+\\s+([^\\s]+)', type: 'string' },
      { name: 'http_status', value: '200', regex: '"\\s+([0-9]{3})\\s+', type: 'number' },
      { name: 'bytes_sent', value: '4820', regex: '"\\s+[0-9]{3}\\s+([0-9]+)', type: 'number' },
      { name: 'referer', value: 'https://semor.corp/login', regex: '"\\s+[0-9]+\\s+"([^"]*)"', type: 'string' },
      { name: 'user_agent', value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0', regex: '"\\s+"([^"]+)"$', type: 'string' }
    ]
  },
  {
    id: 'suricata-eve',
    name: 'Suricata / Snort 網路入侵偵測 (NIDS)',
    brand: 'OISF Suricata',
    category: 'ids',
    version: '6.x / 7.x EVE JSON',
    description: 'Suricata EVE JSON 入侵告警 (Signature ID、嚴重度、流向與封包酬載特徵)',
    iconType: 'shield-orange',
    sampleLog: '{"timestamp":"2026-04-20T16:00:01.000000+0800","flow_id":982374823,"event_type":"alert","src_ip":"45.33.32.156","src_port":51892,"dest_ip":"192.168.1.100","dest_port":8080,"proto":"TCP","alert":{"action":"blocked","gid":1,"signature_id":2010935,"rev":3,"signature":"ET SCAN Potential Nmap Scan","category":"Attempted Information Leak","severity":2}}',
    fields: [
      { name: 'timestamp', value: '2026-04-20T16:00:01.000000+0800', regex: '"timestamp"\\s*:\\s*"([^"]+)"', type: 'timestamp' },
      { name: 'event_type', value: 'alert', regex: '"event_type"\\s*:\\s*"([^"]+)"', type: 'string' },
      { name: 'src_ip', value: '45.33.32.156', regex: '"src_ip"\\s*:\\s*"([^"]+)"', type: 'ip' },
      { name: 'src_port', value: '51892', regex: '"src_port"\\s*:\\s*([0-9]+)', type: 'port' },
      { name: 'dest_ip', value: '192.168.1.100', regex: '"dest_ip"\\s*:\\s*"([^"]+)"', type: 'ip' },
      { name: 'dest_port', value: '8080', regex: '"dest_port"\\s*:\\s*([0-9]+)', type: 'port' },
      { name: 'proto', value: 'TCP', regex: '"proto"\\s*:\\s*"([^"]+)"', type: 'string' },
      { name: 'signature_id', value: '2010935', regex: '"signature_id"\\s*:\\s*([0-9]+)', type: 'number' },
      { name: 'signature', value: 'ET SCAN Potential Nmap Scan', regex: '"signature"\\s*:\\s*"([^"]+)"', type: 'string' },
      { name: 'severity', value: '2', regex: '"severity"\\s*:\\s*([0-9]+)', type: 'number' }
    ]
  }
];

export default function DecoderView({ isReadOnly = false }: { isReadOnly?: boolean }) {
  const [logInput, setLogInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedFields, setAnalyzedFields] = useState<ExtractedField[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'firewall' | 'os' | 'web' | 'ids' | 'custom'>('all');
  
  // Custom Decoder Save form
  const [saveName, setSaveName] = useState('');
  const [saveVersion, setSaveVersion] = useState('');
  const [saveBrand, setSaveBrand] = useState('自訂 (Custom)');
  const [saveDescription, setSaveDescription] = useState('');

  // Decoder Detail Modal & Test Modal
  const [selectedDecoder, setSelectedDecoder] = useState<DecoderItem | null>(null);
  const [testInputLog, setTestInputLog] = useState('');
  const [testResults, setTestResults] = useState<{ name: string; match: string; success: boolean }[]>([]);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Load custom decoders
  const [customDecoders, setCustomDecoders] = useState<DecoderItem[]>(() => {
    try {
      const saved = localStorage.getItem('custom_decoders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Rule-based offline parser for instant intelligent fallback
  const parseLogOffline = (rawLog: string): ExtractedField[] => {
    const fields: ExtractedField[] = [];
    const trimmed = rawLog.trim();

    // 1. JSON Detection
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const obj = JSON.parse(trimmed);
        const flatten = (data: any, prefix = '') => {
          for (const key in data) {
            const val = data[key];
            const fullKey = prefix ? `${prefix}.${key}` : key;
            if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
              flatten(val, fullKey);
            } else {
              const strVal = String(val);
              let type: ExtractedField['type'] = 'string';
              if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(strVal)) type = 'ip';
              else if (/^\d+$/.test(strVal) && Number(strVal) <= 65535 && (key.includes('port') || key.includes('sport') || key.includes('dport'))) type = 'port';
              else if (/^\d+$/.test(strVal)) type = 'number';
              else if (/date|time|timestamp/i.test(key)) type = 'timestamp';
              else if (/action|status|decision/i.test(key)) type = 'action';

              fields.push({
                name: fullKey,
                value: strVal,
                regex: `"${fullKey.split('.').pop()}"\\s*:\\s*"?([^",}]+)"?`,
                type
              });
            }
          }
        };
        flatten(obj);
        if (fields.length > 0) return fields;
      } catch {
        // Fall through to other parsers
      }
    }

    // 2. Key-Value Pairs (key=value, key="value")
    const kvRegex = /([a-zA-Z0-9_.-]+)=("([^"]*)"|'([^']*)'|([^ \t\r\n,]+))/g;
    let match;
    const seenKeys = new Set<string>();
    while ((match = kvRegex.exec(rawLog)) !== null) {
      const k = match[1];
      const v = match[3] ?? match[4] ?? match[5] ?? '';
      if (!seenKeys.has(k)) {
        seenKeys.add(k);
        let type: ExtractedField['type'] = 'string';
        if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(v)) type = 'ip';
        else if (/^\d+$/.test(v) && Number(v) <= 65535 && (k.includes('port') || k.includes('sport') || k.includes('dport'))) type = 'port';
        else if (/^\d+$/.test(v)) type = 'number';
        else if (/date|time|eventtime/i.test(k)) type = 'timestamp';
        else if (/action|decision|level|status/i.test(k)) type = 'action';

        fields.push({
          name: k,
          value: v,
          regex: `${k}="?([^"\\s,]+)"?`,
          type
        });
      }
    }

    // 3. Syslog & Common Web Regex fallback
    if (fields.length === 0) {
      const ipMatches = rawLog.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g);
      if (ipMatches) {
        ipMatches.forEach((ip, idx) => {
          fields.push({
            name: idx === 0 ? 'src_ip' : idx === 1 ? 'dst_ip' : `ip_${idx + 1}`,
            value: ip,
            regex: `\\b${ip.replace(/\./g, '\\.')}\\b`,
            type: 'ip'
          });
        });
      }

      const timeMatch = rawLog.match(/(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?|[A-Z][a-z]{2}\s+\d+\s+\d{2}:\d{2}:\d{2})/);
      if (timeMatch) {
        fields.push({
          name: 'timestamp',
          value: timeMatch[1],
          regex: '(\\d{4}-\\d{2}-\\d{2}[T\\s]\\d{2}:\\d{2}:\\d{2}|[A-Z][a-z]{2}\\s+\\d+\\s+\\d{2}:\\d{2}:\\d{2})',
          type: 'timestamp'
        });
      }

      const actionMatch = rawLog.match(/\b(allow|deny|drop|accept|block|reject|failed|success|pass)\b/i);
      if (actionMatch) {
        fields.push({
          name: 'action',
          value: actionMatch[1],
          regex: '\\b(allow|deny|drop|accept|block|reject|failed|success|pass)\\b',
          type: 'action'
        });
      }
    }

    return fields;
  };

  const handleAnalyze = async () => {
    if (!logInput.trim()) {
      showToast('請先貼上或載入原始日誌內容', 'info');
      return;
    }

    setIsAnalyzing(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY || localStorage.getItem('gemini_api_key') || '';
      
      if (apiKey) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const prompt = `分析下列資安/系統日誌並識別其資料結構。
提取所有可能的欄位名稱、該樣本中的數值，並產生一組精確的正規表達式 (Regex Pattern) 用以擷取相同格式日誌的對應欄位。
請嚴格僅回傳 JSON 陣列，格式如下：
[{"name": "欄位名稱", "value": "數值", "regex": "正規表達式", "type": "string|ip|port|timestamp|number|action"}]

原始日誌內容：
${logInput.trim()}`;

          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json"
            }
          });

          const resultText = response.text || '';
          const result = JSON.parse(resultText);
          if (Array.isArray(result) && result.length > 0) {
            setAnalyzedFields(result);
            showToast(`AI 智慧正規化完成，成功擷取 ${result.length} 個結構化欄位！`, 'success');
            setIsAnalyzing(false);
            return;
          }
        } catch (aiErr) {
          console.warn('AI 解析失敗，自動切換為本機規則引擎：', aiErr);
        }
      }

      // Offline rule fallback
      const offlineResult = parseLogOffline(logInput);
      if (offlineResult.length > 0) {
        setAnalyzedFields(offlineResult);
        showToast(`本機規則引擎解析完成，已自動擷取 ${offlineResult.length} 個欄位！`, 'success');
      } else {
        showToast('無法自動識別此日誌結構，請確認格式或手動新增欄位', 'error');
      }
    } catch (error: any) {
      showToast(`解析失敗：${error.message || error}`, 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveDecoder = () => {
    if (analyzedFields.length === 0) {
      showToast('尚未有任何解析欄位可供儲存', 'error');
      return;
    }

    const name = saveName.trim() || `自訂日誌解碼器 #${customDecoders.length + 1}`;
    const newDecoder: DecoderItem = {
      id: `custom-${Date.now()}`,
      name,
      brand: saveBrand.trim() || '自訂 (Custom)',
      category: 'custom',
      version: saveVersion.trim() || 'v1.0',
      description: saveDescription.trim() || `針對 ${name} 的日誌正規化規則`,
      iconType: 'terminal-cyan',
      isCustom: true,
      fields: analyzedFields,
      sampleLog: logInput.trim(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    const updated = [newDecoder, ...customDecoders];
    setCustomDecoders(updated);
    localStorage.setItem('custom_decoders', JSON.stringify(updated));

    // Update discovery custom fields
    try {
      const savedFields = JSON.parse(localStorage.getItem('discovery_custom_fields') || '[]');
      const newFields = [...new Set([...savedFields, ...analyzedFields.map(f => f.name)])];
      localStorage.setItem('discovery_custom_fields', JSON.stringify(newFields));
    } catch (e) {
      console.error(e);
    }

    showToast(`解碼器「${name}」已成功儲存至規則庫！`, 'success');
    setSaveName('');
    setSaveVersion('');
    setSaveDescription('');
  };

  const handleDeleteCustomDecoder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isReadOnly) return;
    const updated = customDecoders.filter(d => d.id !== id);
    setCustomDecoders(updated);
    localStorage.setItem('custom_decoders', JSON.stringify(updated));
    showToast('已自規則庫中刪除該自訂解碼器', 'info');
    if (selectedDecoder?.id === id) {
      setSelectedDecoder(null);
    }
  };

  const handleUpdateField = (index: number, key: keyof ExtractedField, val: string) => {
    const next = [...analyzedFields];
    next[index] = { ...next[index], [key]: val };
    setAnalyzedFields(next);
  };

  const handleRemoveField = (index: number) => {
    setAnalyzedFields(analyzedFields.filter((_, i) => i !== index));
  };

  const handleAddField = () => {
    setAnalyzedFields([
      ...analyzedFields,
      { name: `field_${analyzedFields.length + 1}`, value: '範例數值', regex: '.*', type: 'string' }
    ]);
  };

  const handleTestDecoder = (decoder: DecoderItem) => {
    const raw = testInputLog.trim() || decoder.sampleLog || '';
    if (!raw) {
      showToast('請輸入待測試的日誌字串', 'info');
      return;
    }

    const results = decoder.fields.map(f => {
      try {
        const re = new RegExp(f.regex);
        const m = raw.match(re);
        return {
          name: f.name,
          match: m ? (m[1] !== undefined ? m[1] : m[0]) : '(未匹配)',
          success: !!m
        };
      } catch {
        return {
          name: f.name,
          match: '(正規表達式語法錯誤)',
          success: false
        };
      }
    });

    setTestResults(results);
  };

  const allDecoders = useMemo(() => {
    return [...customDecoders, ...PREDEFINED_DECODERS];
  }, [customDecoders]);

  const filteredDecoders = useMemo(() => {
    return allDecoders.filter(d => {
      const matchQuery = 
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchCategory = categoryFilter === 'all' || d.category === categoryFilter;
      return matchQuery && matchCategory;
    });
  }, [allDecoders, searchQuery, categoryFilter]);

  const renderIcon = (type?: string) => {
    switch (type) {
      case 'shield-red':
        return <Shield className="w-5 h-5 text-red-400" />;
      case 'shield-orange':
        return <ShieldAlert className="w-5 h-5 text-amber-400" />;
      case 'server-blue':
        return <Server className="w-5 h-5 text-blue-400" />;
      case 'server-purple':
        return <Cpu className="w-5 h-5 text-purple-400" />;
      case 'globe-emerald':
        return <Globe className="w-5 h-5 text-emerald-400" />;
      case 'terminal-cyan':
      default:
        return <Terminal className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={cn(
              "fixed bottom-8 right-8 z-[9999] px-6 py-3.5 rounded-2xl shadow-2xl font-bold text-xs flex items-center gap-3 border backdrop-blur-md",
              toastMessage.type === 'success' ? "bg-emerald-600/90 text-white border-emerald-400/30" :
              toastMessage.type === 'error' ? "bg-red-600/90 text-white border-red-400/30" :
              "bg-cyan-600/90 text-white border-cyan-400/30"
            )}
          >
            {toastMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Log Input, AI Extraction & Field Mapper (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Top Panel: Log Input */}
          <div className="bg-[#111114] border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-cyan-500/10 p-3 rounded-2xl border border-cyan-500/20 text-cyan-400 shadow-inner">
                  <Binary className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                    AI 智慧日誌解碼與正規化
                    <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      Normalizer Studio
                    </span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    貼上任意原始日誌字串，自動解析資料結構、擷取安全關鍵欄位並產生正規化表達式。
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Sample Chips */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={12} className="text-gray-500" />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  快速載入常見廠牌日誌範本：
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'FortiGate 防火牆', id: 'fortigate' },
                  { label: 'Palo Alto 威脅防護', id: 'paloalto' },
                  { label: 'Cisco ASA 阻擋日誌', id: 'cisco-ftd' },
                  { label: 'Windows Event 4625', id: 'windows-security' },
                  { label: 'Linux SSH 認證失敗', id: 'linux-audit' },
                  { label: 'Web Nginx 存取日誌', id: 'nginx-access' }
                ].map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => {
                      const dec = PREDEFINED_DECODERS.find(d => d.id === sample.id);
                      if (dec?.sampleLog) {
                        setLogInput(dec.sampleLog);
                        showToast(`已載入「${sample.label}」日誌範本`, 'info');
                      }
                    }}
                    className="px-2.5 py-1 bg-white/[0.03] hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/30 rounded-lg text-[11px] font-semibold text-gray-400 hover:text-cyan-300 transition-all cursor-pointer"
                  >
                    {sample.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Log Textarea */}
            <div className="space-y-4">
              <div className="relative">
                <textarea
                  value={logInput}
                  onChange={(e) => setLogInput(e.target.value)}
                  placeholder="在此貼上原始日誌內容（支援 CEF, Syslog, Key-Value 鍵值對, JSON, WAF, Firewall 等格式）..."
                  className="w-full h-44 bg-black/50 border border-gray-800 rounded-2xl p-4 text-xs font-mono text-gray-200 focus:border-cyan-500 outline-none transition-all resize-none shadow-inner custom-scrollbar leading-relaxed"
                />
                {logInput && (
                  <button
                    onClick={() => setLogInput('')}
                    className="absolute top-3 right-3 p-1.5 bg-gray-900/80 hover:bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
                    title="清空內容"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setLogInput('')}
                    className="px-4 py-2.5 bg-gray-900/60 hover:bg-gray-800 border border-gray-800 rounded-xl text-xs font-bold text-gray-400 hover:text-gray-200 transition-colors"
                  >
                    清空重置
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !logInput.trim()}
                    className={cn(
                      "px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-black tracking-wide transition-all shadow-lg shadow-cyan-900/30 flex items-center gap-2 cursor-pointer",
                      (isAnalyzing || !logInput.trim()) && "opacity-50 cursor-not-allowed hover:bg-cyan-600 shadow-none"
                    )}
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-cyan-200" />
                        <span>AI 正在解析日誌結構...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-cyan-200" />
                        <span>使用 AI 識別欄位與正規化</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Normalization Result & Field Editor Panel */}
          {analyzedFields.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#111114] border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800/80 pb-5">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 text-emerald-400">
                    <Layers size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      正規化欄位映射結果
                      <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {analyzedFields.length} 個欄位
                      </span>
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      您可手動調整欄位鍵名、正規表達式與資料型態，並儲存為全新日誌解碼器。
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddField}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-gray-300 hover:text-white transition-all flex items-center gap-1.5 w-fit"
                >
                  <Plus size={14} /> 新增欄位
                </button>
              </div>

              {/* Save Decoder Meta Form */}
              <div className="p-5 bg-black/40 border border-cyan-500/20 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-black uppercase tracking-widest">
                  <Save size={14} />
                  <span>儲存為自訂解碼器規則 (Save Custom Decoder)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                      解碼器名稱 <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={saveName}
                      onChange={(e) => setSaveName(e.target.value)}
                      placeholder="例如：Corp-NGFW-Firewall"
                      className="w-full bg-gray-900/90 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                      設備廠牌 / 分類
                    </label>
                    <input
                      type="text"
                      value={saveBrand}
                      onChange={(e) => setSaveBrand(e.target.value)}
                      placeholder="例如：Fortinet / Cisco / Nginx"
                      className="w-full bg-gray-900/90 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                      韌體 / 規則版本
                    </label>
                    <input
                      type="text"
                      value={saveVersion}
                      onChange={(e) => setSaveVersion(e.target.value)}
                      placeholder="例如：v1.2.0"
                      className="w-full bg-gray-900/90 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                    規則說明 / 適用日誌描述
                  </label>
                  <input
                    type="text"
                    value={saveDescription}
                    onChange={(e) => setSaveDescription(e.target.value)}
                    placeholder="例如：解析公司核心邊界防火牆阻擋與連線建立日誌"
                    className="w-full bg-gray-900/90 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleSaveDecoder}
                    disabled={isReadOnly}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Save size={14} /> 儲存至解碼器資料庫
                  </button>
                </div>
              </div>

              {/* Fields Table / Cards */}
              <div className="space-y-3">
                <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  提取欄位細部設定清單 ({analyzedFields.length})
                </div>

                <div className="max-h-[420px] overflow-y-auto custom-scrollbar space-y-2.5 pr-2">
                  {analyzedFields.map((field, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-black/40 border border-gray-800/80 rounded-2xl hover:border-gray-700 transition-all space-y-2.5 group"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                          <input
                            type="text"
                            value={field.name}
                            onChange={(e) => handleUpdateField(idx, 'name', e.target.value)}
                            className="bg-gray-900/80 border border-gray-800 rounded-lg px-2.5 py-1 text-xs font-black text-cyan-400 outline-none focus:border-cyan-500 transition-colors"
                          />
                          <select
                            value={field.type || 'string'}
                            onChange={(e) => handleUpdateField(idx, 'type', e.target.value as any)}
                            className="bg-gray-900 border border-gray-800 rounded-lg px-2 py-1 text-[10px] font-bold text-gray-400 outline-none"
                          >
                            <option value="string">文字 (String)</option>
                            <option value="ip">IP 位址 (IP)</option>
                            <option value="port">通訊埠 (Port)</option>
                            <option value="timestamp">時間戳記 (Time)</option>
                            <option value="number">數值 (Number)</option>
                            <option value="action">處置動作 (Action)</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-gray-400 bg-gray-900 px-2 py-0.5 rounded border border-gray-800 max-w-[160px] truncate" title={field.value}>
                            樣本: {field.value}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveField(idx)}
                            className="p-1 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="刪除此欄位"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Regex Editor */}
                      <div className="flex items-center gap-2 bg-gray-900/60 border border-gray-800/80 rounded-xl px-3 py-1.5">
                        <Binary size={12} className="text-gray-500 shrink-0" />
                        <span className="text-[9px] font-bold text-gray-500 uppercase shrink-0">Regex:</span>
                        <input
                          type="text"
                          value={field.regex}
                          onChange={(e) => handleUpdateField(idx, 'regex', e.target.value)}
                          className="w-full bg-transparent text-[11px] font-mono text-gray-300 outline-none focus:text-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Column: Decoder Library (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#111114] border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                  日誌解碼器資料庫
                  <span className="px-2 py-0.5 text-[9px] font-black rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {allDecoders.length} 組
                  </span>
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  瀏覽內建標準解碼器與自訂擴充規則。
                </p>
              </div>
            </div>

            {/* Search & Category Filter */}
            <div className="space-y-3 mb-6">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜尋解碼器名稱、廠牌或描述..."
                  className="w-full bg-black/40 border border-gray-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'all', label: '全部' },
                  { id: 'custom', label: '自訂規則' },
                  { id: 'firewall', label: '防火牆/網路' },
                  { id: 'os', label: '作業系統' },
                  { id: 'web', label: 'Web 伺服器' },
                  { id: 'ids', label: '入侵偵測 (IDS)' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryFilter(cat.id as any)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                      categoryFilter === cat.id
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                        : "bg-white/[0.02] text-gray-500 border border-white/5 hover:text-gray-300"
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Decoders List */}
            <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1 max-h-[640px]">
              {filteredDecoders.map((dec) => (
                <div
                  key={dec.id}
                  onClick={() => {
                    setSelectedDecoder(dec);
                    setTestInputLog(dec.sampleLog || '');
                    setTestResults([]);
                  }}
                  className={cn(
                    "p-4 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden",
                    selectedDecoder?.id === dec.id
                      ? "bg-cyan-950/20 border-cyan-500/50 shadow-lg shadow-cyan-950/30"
                      : "bg-black/30 border-gray-800/80 hover:border-gray-700 hover:bg-black/50"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                      <div className="p-2.5 bg-gray-900 rounded-xl border border-gray-800 group-hover:border-cyan-500/30 transition-colors shrink-0 mt-0.5">
                        {renderIcon(dec.iconType)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-gray-100 group-hover:text-cyan-300 transition-colors">
                            {dec.name}
                          </h4>
                          {dec.isCustom && (
                            <span className="px-1.5 py-0.2 text-[8px] font-black uppercase rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                              自訂
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase">
                          <span>{dec.brand}</span>
                          <span>•</span>
                          <span>{dec.version}</span>
                          <span>•</span>
                          <span className="text-cyan-400/80 font-mono">{dec.fields.length} 欄位</span>
                        </div>

                        <p className="text-[11px] text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                          {dec.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {dec.isCustom && !isReadOnly && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteCustomDecoder(dec.id, e)}
                          className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          title="刪除自訂解碼器"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                      <button
                        type="button"
                        className="p-1.5 text-gray-500 hover:text-cyan-300 hover:bg-white/5 rounded-lg transition-colors"
                        title="查看規則詳情與測試"
                      >
                        <Eye size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredDecoders.length === 0 && (
                <div className="h-60 flex flex-col items-center justify-center text-gray-600">
                  <SearchX size={36} className="mb-3 opacity-30 text-gray-500" />
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                    查無符合條件之解碼器規則
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Summary */}
            <div className="mt-6 pt-5 border-t border-gray-800/80 flex items-center justify-between text-[11px] text-gray-500">
              <span>共載入 {allDecoders.length} 組解碼器 (內建 {PREDEFINED_DECODERS.length} / 自訂 {customDecoders.length})</span>
              <button
                type="button"
                onClick={() => {
                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(customDecoders, null, 2));
                  const dlAnchor = document.createElement('a');
                  dlAnchor.setAttribute("href", dataStr);
                  dlAnchor.setAttribute("download", "custom_decoders.json");
                  dlAnchor.click();
                  showToast('已匯出自訂解碼器備份 JSON 檔', 'success');
                }}
                className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Download size={12} /> 匯出自訂解碼器
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Decoder Detail & Test Modal */}
      <AnimatePresence>
        {selectedDecoder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#111114] border border-gray-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-black/40">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gray-900 rounded-xl border border-gray-800 text-cyan-400">
                    {renderIcon(selectedDecoder.iconType)}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      {selectedDecoder.name}
                      <span className="text-xs font-mono font-bold text-gray-500 bg-gray-900 px-2 py-0.5 rounded border border-gray-800">
                        {selectedDecoder.version}
                      </span>
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">{selectedDecoder.description}</p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedDecoder(null)}
                  className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
                {/* Live Test Playground */}
                <div className="p-5 bg-black/50 border border-gray-800 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-black text-cyan-400 uppercase tracking-wider">
                      <Play size={14} /> 即時日誌匹配測試 (Decoder Matcher)
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTestDecoder(selectedDecoder)}
                      className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-cyan-900/20"
                    >
                      <Play size={12} /> 執行解析驗證
                    </button>
                  </div>

                  <textarea
                    value={testInputLog}
                    onChange={(e) => setTestInputLog(e.target.value)}
                    placeholder="在此貼上日誌字串以測試本解碼器規則..."
                    className="w-full h-24 bg-gray-950 border border-gray-800 rounded-xl p-3 text-xs font-mono text-gray-200 outline-none focus:border-cyan-500 custom-scrollbar resize-none"
                  />

                  {testResults.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-gray-800/80">
                      <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        匹配測試結果：
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                        {testResults.map((tr, i) => (
                          <div
                            key={i}
                            className={cn(
                              "p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2",
                              tr.success
                                ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                                : "bg-red-950/20 border-red-500/30 text-red-400"
                            )}
                          >
                            <span className="font-bold text-gray-300">{tr.name}</span>
                            <span className="font-mono text-[11px] truncate max-w-[200px]" title={tr.match}>
                              {tr.match}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Fields Table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-black text-gray-400 uppercase tracking-wider">
                    <span>欄位正規化對照表 ({selectedDecoder.fields.length})</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(selectedDecoder.fields, null, 2));
                        showToast('已複製欄位規則 JSON 至剪貼簿', 'success');
                      }}
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold lowercase"
                    >
                      <Copy size={12} /> copy json
                    </button>
                  </div>

                  <div className="border border-gray-800 rounded-2xl overflow-hidden bg-black/40">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-900/80 border-b border-gray-800 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                          <th className="px-4 py-3">欄位名稱 (Field Name)</th>
                          <th className="px-4 py-3">欄位型態 (Type)</th>
                          <th className="px-4 py-3">樣本數值 (Sample Value)</th>
                          <th className="px-4 py-3">正規表達式 (Regex Pattern)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/80">
                        {selectedDecoder.fields.map((f, fi) => (
                          <tr key={fi} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-4 py-3 font-bold text-cyan-400">{f.name}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-gray-900 text-gray-300 border border-gray-800 uppercase">
                                {f.type || 'string'}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-gray-300 max-w-[150px] truncate" title={f.value}>
                              {f.value || '-'}
                            </td>
                            <td className="px-4 py-3 font-mono text-[11px] text-gray-400 max-w-[240px] truncate" title={f.regex}>
                              {f.regex}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-6 border-t border-gray-800 flex items-center justify-between bg-black/40">
                <button
                  type="button"
                  onClick={() => {
                    setLogInput(selectedDecoder.sampleLog || '');
                    setAnalyzedFields(selectedDecoder.fields);
                    setSelectedDecoder(null);
                    showToast(`已載入「${selectedDecoder.name}」至左側編輯區`, 'info');
                  }}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-gray-300 hover:text-white transition-colors"
                >
                  載入至工作區編輯
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedDecoder(null)}
                  className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  關閉
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
