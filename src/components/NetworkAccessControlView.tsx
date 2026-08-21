import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Activity, 
  Users, 
  Settings, 
  Network, 
  Monitor, 
  Plus, 
  Trash2, 
  Zap, 
  Lock, 
  Database, 
  Key, 
  RefreshCw, 
  Binary, 
  Bell, 
  Brain, 
  Globe, 
  Search, 
  PlusCircle, 
  CheckCircle2, 
  XCircle, 
  Smartphone, 
  Send, 
  Share2, 
  FileText, 
  Sliders, 
  Eye, 
  Layers, 
  Wifi, 
  UserCheck, 
  Compass, 
  Server, 
  ChevronRight, 
  AlertTriangle,
  Info,
  LockKeyhole,
  Check,
  ExternalLink,
  Laptop,
  HelpCircle,
  QrCode,
  FileCode,
  Save,
  Menu
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { cn } from '../lib/utils';

// Core Modular Settings Sub-Components
import ConnectionProfilesEditor from './ConnectionProfilesEditor';
import AuthenticationSourcesEditor from './AuthenticationSourcesEditor';
import CaptivePortalDesigner from './CaptivePortalDesigner';
import SwitchesConfigEditor from './SwitchesConfigEditor';


// Interfaces
interface NodeDevice {
  mac: string;
  ip: string;
  os: 'Windows' | 'macOS' | 'Linux' | 'iOS' | 'Android' | 'IoT';
  status: 'Registered' | 'Unregistered' | 'Quarantine';
  owner: string;
  lastSeen: string;
  switchIp: string;
  switchPort: string;
  vlan: number;
}

interface GuestRequest {
  id: string;
  account: string;
  name: string;
  phone: string;
  email: string;
  duration: string;
  status: 'pending' | 'approved' | 'rejected';
  requestTime: string;
}

interface ActiveSession {
  id: string;
  account: string;
  mac: string;
  ip: string;
  duration: string;
  traffic: string;
  authSource: string;
}

interface AlertEvent {
  id: string;
  time: string;
  type: string;
  severity: 'high' | 'medium' | 'low';
  mac: string;
  ip: string;
  message: string;
}

interface AccessRule {
  id: string;
  name: string;
  deviceType: string;
  authGroup: string;
  vlan: number;
  status: 'active' | 'inactive';
}

interface SwitchConfig {
  id: string;
  ip: string;
  name: string;
  brand: string;
  snmpCommunity: string;
  radiusSecret: string;
  status: 'online' | 'offline';
}

export default function NetworkAccessControlView({ isReadOnly = false }: { isReadOnly?: boolean }) {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';

  // State Management
  const [activeTab, setActiveTab] = useState<'dashboard' | 'management' | 'policies'>('dashboard');
  const [managementSubTab, setManagementSubTab] = useState<'nodes' | 'guests' | 'sessions'>('nodes');
  const [policiesSubTab, setPoliciesSubTab] = useState<'rules' | 'auth_sources' | 'captive_portal' | 'switches'>('rules');

  // Search Terms
  const [searchNode, setSearchNode] = useState('');
  const [searchGuest, setSearchGuest] = useState('');
  const [searchSession, setSearchSession] = useState('');

  // Notifications / Toast Simulator
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'info' | 'error' }[]>([]);

  const triggerToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // 1. Alert State & Live Feed
  const [alerts, setAlerts] = useState<AlertEvent[]>([
    { id: 'a1', time: '20:30:12', type: 'MAC Spoofing', severity: 'high', mac: '00:1A:2B:3C:4D:5E', ip: '10.120.10.45', message: 'MAC Address is claimed by different vendor signatures than mapped history.' },
    { id: 'a2', time: '20:15:34', type: 'Compliance Failed', severity: 'medium', mac: '70:88:6B:A2:3F:11', ip: '10.120.10.120', message: 'Corporate iPad failed compliance checker: iOS version 15.2 is outdated.' },
    { id: 'a3', time: '19:42:01', type: 'Rogue Device', severity: 'high', mac: '5A:45:90:3C:99:BC', ip: '10.120.100.8', message: 'Unknown IoT hub registered on Switch port FastEthernet0/12 (VLAN 1).' },
    { id: 'a4', time: '18:50:11', type: 'Malware DNS Activity', severity: 'high', mac: 'E0:DB:55:6C:12:3A', ip: '10.120.10.99', message: 'Suricata IDS signature triggered: command and control callback DNS pattern detected.' }
  ]);

  // 2. Nodes Data State
  const [nodes, setNodes] = useState<NodeDevice[]>([
    { mac: 'E0:DB:55:6C:12:3A', ip: '10.120.10.99', os: 'Windows', status: 'Registered', owner: 'chiur@ke-la.com', lastSeen: '2026-06-16 20:31:02', switchIp: '10.120.1.254', switchPort: 'GigabitEthernet1/12', vlan: 10 },
    { mac: '00:1A:2B:3C:4D:5E', ip: '10.120.10.45', os: 'Linux', status: 'Registered', owner: 'guest_service', lastSeen: '2026-06-16 20:28:44', switchIp: '10.120.1.254', switchPort: 'GigabitEthernet1/15', vlan: 50 },
    { mac: '70:88:6B:A2:3F:11', os: 'iOS', status: 'Quarantine', owner: 'finance.john', ip: '10.120.90.112', lastSeen: '2026-06-16 20:15:34', switchIp: '10.120.1.253', switchPort: 'GigabitEthernet1/4', vlan: 99 },
    { mac: '3C:07:54:E9:10:8F', os: 'macOS', status: 'Registered', owner: 'dev.linda', ip: '10.120.10.101', lastSeen: '2026-06-16 19:45:12', switchIp: '10.120.1.254', switchPort: 'GigabitEthernet1/1', vlan: 10 },
    { mac: '5A:45:90:3C:99:BC', os: 'IoT', status: 'Unregistered', owner: 'Unknown', ip: '10.120.100.8', lastSeen: '2026-06-16 19:42:01', switchIp: '10.120.1.251', switchPort: 'FastEthernet0/12', vlan: 1 },
    { mac: '90:B6:86:1C:88:7A', os: 'Android', status: 'Registered', owner: 'guest_guest1', ip: '10.120.50.32', lastSeen: '2026-06-16 18:22:10', switchIp: '10.120.1.252', switchPort: 'AP-Guest-02', vlan: 50 }
  ]);

  // Selected Node Details for Drawer Modal
  const [selectedNode, setSelectedNode] = useState<NodeDevice | null>(null);
  const [vlanToChange, setVlanToChange] = useState<string>('10');

  // 3. Guest Approval State
  const [guestRequests, setGuestRequests] = useState<GuestRequest[]>([
    { id: '1', account: 'guest_jane', name: 'Jane Wu', phone: '+886 912 345 678', email: 'jane.wu@partner.com', duration: '24 Hours', status: 'pending', requestTime: '2026-06-16 19:12' },
    { id: '2', account: 'guest_thomas', name: 'Thomas Mueller', phone: '+886 987 654 321', email: 'thomas.m@consultant.org', duration: '7 Days', status: 'pending', requestTime: '2026-06-16 18:40' },
    { id: '3', account: 'guest_sharon', name: 'Sharon Lee', phone: '+886 911 223 344', email: 'v-sharon@contractor.com', duration: '12 Hours', status: 'approved', requestTime: '2026-06-16 14:02' }
  ]);

  // 4. Active Sessions State
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([
    { id: 's1', account: 'chiur@ke-la.com', mac: 'E0:DB:55:6C:12:3A', ip: '10.120.10.99', duration: '02h 41m', traffic: '1.45 GB', authSource: 'Active Directory AD-01' },
    { id: 's2', account: 'dev.linda', mac: '3C:07:54:E9:10:8F', ip: '10.120.10.101', duration: '08h 15m', traffic: '4.89 GB', authSource: 'Active Directory AD-01' },
    { id: 's3', account: 'guest_sharon', mac: '90:B6:86:1C:88:7A', ip: '10.120.50.32', duration: '01h 05m', traffic: '320 MB', authSource: 'Captive Portal SMS' }
  ]);

  // 5. Connection Profiles Rules State (Visual Rule Builder)
  interface ConnectionProfileRule {
    id: string;
    name: string;
    description: string;
    isActive: boolean;
    conditions: {
      id: string;
      criteriaType: 'ssid' | 'switch_ip' | 'user_group' | 'os_type' | 'time_window' | 'mac_list';
      operator: 'equals' | 'not_equals' | 'contains' | 'matches_regex';
      value: string;
    }[];
    logic: 'AND' | 'OR';
    accessRole: 'Guest' | 'Employee' | 'Quarantine' | 'BYOD';
    sessionTimeout: number;
    sessionTimeoutUnit: 'hours' | 'days';
    defaultVlan: number;
  }

  const [rules, setRules] = useState<ConnectionProfileRule[]>([
    {
      id: 'r1',
      name: 'AD_Finance_Staff_iPads',
      description: 'Maps finance branch iPads directly into operational VLAN 10',
      isActive: true,
      conditions: [
        { id: 'c1', criteriaType: 'os_type', operator: 'equals', value: 'iOS' },
        { id: 'c2', criteriaType: 'user_group', operator: 'equals', value: 'Finance' }
      ],
      logic: 'AND',
      accessRole: 'Employee',
      sessionTimeout: 12,
      sessionTimeoutUnit: 'hours',
      defaultVlan: 10
    },
    {
      id: 'r2',
      name: 'Compliance_Failure_Isolation',
      description: 'Force Quarantine VLAN 99 for security checking defects',
      isActive: true,
      conditions: [
        { id: 'c3', criteriaType: 'os_type', operator: 'equals', value: 'Windows' },
        { id: 'c4', criteriaType: 'ssid', operator: 'not_equals', value: 'Corp_Secure' }
      ],
      logic: 'OR',
      accessRole: 'Quarantine',
      sessionTimeout: 24,
      sessionTimeoutUnit: 'hours',
      defaultVlan: 99
    },
    {
      id: 'r3',
      name: 'IoT_Printer_and_Camera_Isolate',
      description: 'Renders guest privilege level with narrow restricted bandwidth',
      isActive: true,
      conditions: [
        { id: 'c5', criteriaType: 'os_type', operator: 'equals', value: 'IoT' }
      ],
      logic: 'AND',
      accessRole: 'Guest',
      sessionTimeout: 7,
      sessionTimeoutUnit: 'days',
      defaultVlan: 40
    }
  ]);

  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    isActive: true,
    logic: 'AND' as 'AND' | 'OR',
    conditions: [
      { id: 'init-1', criteriaType: 'os_type' as any, operator: 'equals' as any, value: 'iOS' }
    ],
    accessRole: 'Guest' as any,
    sessionTimeout: 8,
    sessionTimeoutUnit: 'hours' as 'hours' | 'days',
    defaultVlan: 10
  });

  // 6. Captive Portal Config
  const [portalConfig, setPortalConfig] = useState({
    logoText: 'Secure corporate network access portal',
    welcomeMsg: 'Please complete validation to securely browse the internet',
    termsText: 'By using this network, you agree to secure monitoring and compliance configurations. All activities are audited.',
    requireAgreement: true,
    primaryColor: '#dc2626', // bg-red-600 hex
    bgType: 'gradient' as 'solid' | 'gradient' | 'image',
    bgSolidColor: '#0c0c0e',
    logoFileName: 'logo_kela_networks.png',
    authMethods: {
      passwordless: true,
      sms: true,
      credentials: true,
      termsAgreement: true
    }
  });

  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string>('');

  // 7. Switches & Port configuration
  const [switches, setSwitches] = useState<SwitchConfig[]>([
    { id: 'sw1', ip: '10.120.1.254', name: 'Main Campus FortiSwitch_1', brand: 'Fortinet', snmpCommunity: 'pf_snmp_sec', radiusSecret: '•••••••••••••••••', status: 'online' },
    { id: 'sw2', ip: '10.120.1.253', name: 'Server Area Distribution Cisco_C9300', brand: 'Cisco', snmpCommunity: 'pf_snmp_sec', radiusSecret: '•••••••••••••••••', status: 'online' },
    { id: 'sw3', ip: '10.120.1.251', name: 'Lobby Edge Aruba_2930F', brand: 'Aruba', snmpCommunity: 'pf_snmp_public', radiusSecret: '•••••••••••••••••', status: 'online' }
  ]);

  // Integrated Switch form state
  const [switchForm, setSwitchForm] = useState({
    ip: '10.120.1.250',
    name: '3F-Core-Switch',
    vendor: 'Cisco',
    snmpVersion: 'v2c' as 'v2c' | 'v3',
    snmpCommunity: 'pf_snmp_sec',
    snmpV3User: 'pf_snmp_v3_user',
    snmpV3AuthPass: 'authSecret123',
    snmpV3PrivPass: 'privSecret456',
    snmpV3AuthProto: 'SHA' as 'MD5' | 'SHA' | 'SHA-256',
    snmpV3PrivProto: 'AES' as 'DES' | 'AES' | 'AES-256',
    radiusSecret: 'radius_shared_secret_key',
    enableCoa: true,
    coaPort: 3799
  });

  // Authentication Directories stateful forms
  interface AuthSourceLDAP {
    sourceName: string;
    serverHost: string;
    port: number;
    encryption: 'none' | 'starttls' | 'ssltls';
    bindDn: string;
    bindPass: string;
    baseDn: string;
  }
  
  interface AuthSourceOAuth {
    provider: 'Google' | 'AzureAD';
    clientId: string;
    clientSecret: string;
    hostedDomain: string;
  }

  const [ldapSource, setLdapSource] = useState<AuthSourceLDAP>({
    sourceName: 'Active Directory AD-01',
    serverHost: '10.120.100.2',
    port: 389,
    encryption: 'starttls',
    bindDn: 'cn=admin,dc=corp,dc=local',
    bindPass: '•••••••••••••••••',
    baseDn: 'ou=users,dc=corp,dc=local'
  });

  const [oauthSource, setOauthSource] = useState<AuthSourceOAuth>({
    provider: 'Google',
    clientId: '96321-googleclientid123.apps.googleusercontent.com',
    clientSecret: 'GOCSPX-secretkey987654321',
    hostedDomain: 'company.com'
  });

  const [ldapVerified, setLdapVerified] = useState(true);
  const [oauthVerified, setOauthVerified] = useState(true);
  
  // Test connection logs dialog state
  const [ldapErrorDetail, setLdapErrorDetail] = useState<string | null>(null);

  // Form dirty states (leaving before unsaved warnings)
  const [isRulesDirty, setIsRulesDirty] = useState(false);
  const [isAuthDirty, setIsAuthDirty] = useState(false);
  const [isPortalDirty, setIsPortalDirty] = useState(false);
  const [isSwitchesDirty, setIsSwitchesDirty] = useState(false);

  // Warning Modal triggers
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingSubTab, setPendingSubTab] = useState<string | null>(null);
  const [pendingTab, setPendingTab] = useState<'dashboard' | 'management' | 'policies' | null>(null);

  // Client-side Validation feedback buffer
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const isAnyFormDirty = isRulesDirty || isAuthDirty || isPortalDirty || isSwitchesDirty;

  const handleSubTabNavigate = (targetSubTab: 'rules' | 'auth_sources' | 'captive_portal' | 'switches') => {
    if (policiesSubTab === targetSubTab) return;
    if (isAnyFormDirty) {
      setPendingSubTab(targetSubTab);
      setPendingTab(null);
      setShowConfirmModal(true);
    } else {
      setPoliciesSubTab(targetSubTab);
      setValidationErrors({});
    }
  };

  const handleMainTabNavigate = (targetTab: 'dashboard' | 'management' | 'policies') => {
    if (activeTab === targetTab) return;
    if (isAnyFormDirty) {
      setPendingTab(targetTab);
      setPendingSubTab(null);
      setShowConfirmModal(true);
    } else {
      setActiveTab(targetTab);
      setValidationErrors({});
    }
  };

  const [newSwitch, setNewSwitch] = useState({
    ip: '',
    name: '',
    brand: 'Cisco',
    snmpCommunity: 'pf_snmp_sec',
    radiusSecret: ''
  });

  // 8. Auth Testing States
  const [testingAuthConnection, setTestingAuthConnection] = useState<string | null>(null);

  // Isolate Quick Action
  const handleIsolateNode = (mac: string, ip: string) => {
    // Shifting node status to quarantine
    setNodes(prev => prev.map(node => {
      if (node.mac === mac) {
        return { ...node, status: 'Quarantine', vlan: 99 };
      }
      return node;
    }));

    // Trigger toast notification imitating rest calls to PacketFence CoA v2 endpoints
    triggerToast(
      isZh 
        ? `成功調用 PacketFence RESTful API (v2/nodes/${mac}/isolate)。隔離封鎖 VLAN 99 已成功下架 MAC / IP: ${ip} 並且觸發 RADIUS 802.1X CoA 踢除。`
        : `PacketFence API (v2/nodes/${mac}/isolate) invoked successfully. Dispatched CoA disconnect payload over RADIUS, pushing host on VLAN 99 (Quarantine Network).`,
      'success'
    );
  };

  // Re-Connect / Un-quarantine node
  const handleRestoreNode = (mac: string) => {
    setNodes(prev => prev.map(node => {
      if (node.mac === mac) {
        return { ...node, status: 'Registered', vlan: 10 };
      }
      return node;
    }));

    triggerToast(
      isZh 
        ? `已撤銷隔離。已呼叫 PacketFence API 解除綁定，將網卡重定回常規 VLAN 10。`
        : `Quarantine revoked. REST API called to restore host profile back into operational VLAN 10.`,
      'success'
    );
  };

  // Approve Guest Request
  const handleGuestApproval = (id: string, isApprove: boolean) => {
    setGuestRequests(prev => prev.map(req => {
      if (req.id === id) {
        return { ...req, status: isApprove ? 'approved' : 'rejected' };
      }
      return req;
    }));

    const req = guestRequests.find(r => r.id === id);
    if (isApprove && req) {
      triggerToast(
        isZh 
          ? `帳號 ${req.account} 核准成功！PacketFence 即時簡訊發送系統已向 ${req.phone} 發送專屬認證憑證與網路條款。`
          : `Account ${req.account} approved. PacketFence SMS engine issued transient credentials dynamically to ${req.phone}.`,
        'success'
      );
    } else if (req) {
      triggerToast(
        isZh ? `已拒絕該訪客申請 (帳號 ${req.account})` : `Guest application rejected (Account ${req.account}).`,
        'error'
      );
    }
  };

  // Kick out session
  const handleDisconnectSession = (id: string, mac: string) => {
    setActiveSessions(prev => prev.filter(s => s.id !== id));
    triggerToast(
      isZh 
        ? `發起 PacketFence Disconnect-Request (RFC 3576). 已將 MAC ${mac} 強制踢除當前在線 RADIUS 會話。`
        : `Issued RFC 3576 Disconnect-Request via RADIUS engine. Forcefully cleared session state for MAC ${mac}.`,
      'info'
    );
  };

  // Test Connection
  const handleTestAuthConnection = (sourceName: string) => {
    setTestingAuthConnection(sourceName);
    setTimeout(() => {
      setTestingAuthConnection(null);
      triggerToast(
        isZh 
          ? `與 ${sourceName} 的通訊檢測成功！LDAP 同步/Radius 通訊協定握手正常，延遲 14ms。`
          : `Handshake test with ${sourceName} successful! Protocol synchronization normal, latency: 14ms.`,
        'success'
      );
    }, 1800);
  };

  // Create new rule
  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.name) return;
    const ruleObj: ConnectionProfileRule = {
      id: 'r' + (rules.length + 1),
      name: newRule.name,
      description: newRule.description || 'Dynamic created rule',
      isActive: newRule.isActive,
      conditions: newRule.conditions,
      logic: newRule.logic,
      accessRole: newRule.accessRole,
      sessionTimeout: newRule.sessionTimeout,
      sessionTimeoutUnit: newRule.sessionTimeoutUnit,
      defaultVlan: newRule.defaultVlan
    };
    setRules([...rules, ruleObj]);
    setNewRule({
      name: '',
      description: '',
      isActive: true,
      logic: 'AND',
      conditions: [
        { id: 'init-1', criteriaType: 'os_type', operator: 'equals', value: 'iOS' }
      ],
      accessRole: 'Guest',
      sessionTimeout: 8,
      sessionTimeoutUnit: 'hours',
      defaultVlan: 10
    });
    triggerToast(
      isZh ? `存取策略 [${ruleObj.name}] 成功儲存，已同步至 PacketFence 認證引擎規則庫。` : `Access rule [${ruleObj.name}] saved successfully and loaded into Active Profiles.`,
      'success'
    );
  };

  // Add Switch Config
  const handleAddSwitch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSwitch.ip || !newSwitch.name) return;
    const swObj: SwitchConfig = {
      id: 'sw' + (switches.length + 1),
      ip: newSwitch.ip,
      name: newSwitch.name,
      brand: newSwitch.brand,
      snmpCommunity: newSwitch.snmpCommunity,
      radiusSecret: newSwitch.radiusSecret ? '•••••••••••••••••' : 'pf_shared_radius_secret',
      status: 'online'
    };
    setSwitches([...switches, swObj]);
    setNewSwitch({
      ip: '',
      name: '',
      brand: 'Cisco',
      snmpCommunity: 'pf_snmp_sec',
      radiusSecret: ''
    });
    triggerToast(
      isZh ? `硬體設備 [${swObj.name}] 註冊成功， PacketFence 將自動觸發 CLI/SNMP v2 端口探針與 VLAN 切換協調。` : `Network element [${swObj.name}] enrolled. Automatic SNMP/CLI port scanning initiated.`,
      'success'
    );
  };

  // Charts data preparation
  const deviceTypeDistribution = [
    { name: 'Windows', value: nodes.filter(n => n.os === 'Windows').length, color: '#3b82f6' },
    { name: 'macOS', value: nodes.filter(n => n.os === 'macOS').length, color: '#a855f7' },
    { name: 'iOS', value: nodes.filter(n => n.os === 'iOS').length, color: '#ec4899' },
    { name: 'Android', value: nodes.filter(n => n.os === 'Android').length, color: '#10b981' },
    { name: 'Linux', value: nodes.filter(n => n.os === 'Linux').length, color: '#64748b' },
    { name: 'IoT Hubs', value: nodes.filter(n => n.os === 'IoT').length, color: '#f59e0b' },
  ];

  const authenticationTrends = [
    { hour: '00:00', requests: 420, successRate: 98.4 },
    { hour: '04:00', requests: 280, successRate: 99.1 },
    { hour: '08:00', requests: 950, successRate: 97.2 },
    { hour: '12:00', requests: 1210, successRate: 98.8 },
    { hour: '16:00', requests: 880, successRate: 97.9 },
    { hour: '20:00', requests: 590, successRate: 98.6 },
    { hour: '24:00', requests: 450, successRate: 98.9 },
  ];

  return (
    <div className="space-y-6 text-gray-200">
      
      {/* Toast Notification Stack */}
      <div className="fixed top-5 right-5 z-50 space-y-2 max-w-md">
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className={cn(
              "p-4 rounded-xl shadow-2xl border text-xs leading-relaxed flex items-start gap-3 animate-in slide-in-from-right",
              toast.type === 'success' ? "bg-black/90 border-green-500/30 text-green-400" :
              toast.type === 'error' ? "bg-black/90 border-red-500/30 text-red-400" :
              "bg-black/90 border-blue-500/30 text-blue-400"
            )}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-green-400 animate-bounce" />}
            {toast.type === 'error' && <XCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />}
            {toast.type === 'info' && <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />}
            <div className="flex-1">
              <span className="font-bold block mb-1 uppercase tracking-wider">{toast.type === 'success' ? 'SUCCESS REST API' : toast.type === 'error' ? 'ERROR PACKETFENCE' : 'ENGINE DISPATCH'}</span>
              <span>{toast.message}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Top Welcome Title */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gray-900/40 p-6 rounded-2xl border border-gray-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-red-600 text-white rounded text-[9px] font-black tracking-widest uppercase animate-pulse">{isZh ? 'NAC 整合就緒' : 'NAC Integrated'}</span>
            <span className="text-[10px] font-mono text-gray-500 font-bold uppercase">{isZh ? 'PF 核心代理服務運行於 Port 443' : 'PF Core Agent Active on Port 443'}</span>
          </div>
          <h2 className="text-xl font-bold font-sans text-white tracking-tight">
            {isZh ? 'PacketFence REST 核心控制器 (NAC Core Controller)' : 'PacketFence REST Core Controller'} <span className="text-gray-500 font-normal">v12.2.0</span>
          </h2>
          <p className="text-xs text-gray-400 leading-relaxed">
            {isZh 
              ? '三層式網管自動化存取控制系統。提供強健 802.1X RADIUS 認證、DHCP指紋偵測、Captive Portal 配置與 SNMP/CLI 彈性開關連動。' 
              : 'Direct API integrations with PacketFence Core. Live dashboard for RADIUS 802.1x compliance, guest provisioning, active sessions teardown, and granular access profile workflows.'}
          </p>
        </div>

        {/* REST API Endpoints Quick status */}
        <div className="flex gap-3 justify-end">
          <div className="bg-black/40 border border-gray-800 p-3 rounded-xl flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
            <div className="text-[10px] font-mono">
              <span className="text-gray-500 block uppercase">PacketFence REST API</span>
              <span className="text-emerald-400 font-bold font-mono">{isZh ? '連線就緒' : 'CONNECTED'}</span>
            </div>
          </div>
          <div className="bg-black/40 border border-gray-800 p-3 rounded-xl flex items-center gap-3">
            <Activity className="text-purple-400 w-4 h-4 animate-spin-slow" />
            <div className="text-[10px] font-mono">
              <span className="text-gray-500 block uppercase">{isZh ? 'RADIUS 認證引擎' : 'RADIUS ENGINE'}</span>
              <span className="text-purple-400 font-bold font-mono">{isZh ? '運作中' : 'ONLINE'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-navigation tabs: Module Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-[#0d0d0f] rounded-xl border border-gray-800/80">
        <button
          onClick={() => handleMainTabNavigate('dashboard')}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
            activeTab === 'dashboard' 
              ? "bg-red-600 text-white shadow-md shadow-red-900/20" 
              : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/50"
          )}
        >
          <Activity size={14} />
          {isZh ? '核心可視化儀表板' : 'Analytical Dashboard'}
        </button>

        <button
          onClick={() => handleMainTabNavigate('management')}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
            activeTab === 'management' 
              ? "bg-red-600 text-white shadow-md shadow-red-900/20" 
              : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/50"
          )}
        >
          <Sliders size={14} />
          {isZh ? '控制與管理功能' : 'Detail Management'}
        </button>

        <button
          onClick={() => handleMainTabNavigate('policies')}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
            activeTab === 'policies' 
              ? "bg-red-600 text-white shadow-md shadow-red-900/20" 
              : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/50"
          )}
        >
          <Layers size={14} />
          {isZh ? '系統設定與策略配置' : 'System Settings & Policies'}
        </button>
      </div>

      {/* Main Content Render Area */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          
          {/* KPI Metrics Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* KPI 1: Total Online */}
            <div className="bg-[#111114] border border-gray-800 rounded-2xl p-5 relative overflow-hidden group hover:border-red-500/20 transition-all">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-all">
                <Laptop size={64} className="text-white" />
              </div>
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">{isZh ? '在線端點設備總數' : 'Total Online Endpoints'}</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-mono text-white">{nodes.length + 1242}</span>
                <span className="text-[10px] text-green-400 font-bold font-mono">+12.4%</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-2">{isZh ? '當前對接 RADIUS + DHCP 在線設備' : 'Actively bound sessions in LDAP'}</p>
            </div>

            {/* KPI 2: Violating / Quarantine */}
            <div className="bg-[#111114] border border-gray-800 rounded-2xl p-5 relative overflow-hidden group hover:border-red-500/20 transition-all">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-all">
                <ShieldAlert size={64} className="text-red-500" />
              </div>
              <span className="text-[9px] font-black text-red-500 uppercase tracking-widest block mb-1">{isZh ? '待處理 / 未合規端點' : 'Pending / Compliance Flaws'}</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-mono text-red-500 animate-pulse">{nodes.filter(n => n.status === 'Quarantine').length + 2}</span>
                <span className="px-1.5 py-0.5 bg-red-500/10 text-red-500 text-[8px] font-black rounded uppercase tracking-widest">{isZh ? '高度警戒' : 'HIGH ALERT'}</span>
              </div>
              <p className="text-[10px] text-red-400/80 mt-2">{isZh ? '觸發隔離設定或合規性檢查失敗' : 'Failing security threshold logs'}</p>
            </div>

            {/* KPI 3: Today's Guest */}
            <div className="bg-[#111114] border border-gray-800 rounded-2xl p-5 relative overflow-hidden group hover:border-red-500/20 transition-all">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-all">
                <Users size={64} className="text-blue-500" />
              </div>
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">{isZh ? '今日註冊訪客總數' : 'Today Guests Registered'}</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-mono text-purple-400">{guestRequests.length + 81}</span>
                <span className="text-[10px] text-purple-400 font-bold font-mono">+8.9%</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-2">{isZh ? '今日通過 Captive Portal 認證的訪客' : 'Dynamic transient accounts'}</p>
            </div>

            {/* KPI 4: Authorization Fail Rate */}
            <div className="bg-[#111114] border border-gray-800 rounded-2xl p-5 relative overflow-hidden group hover:border-red-500/20 transition-all">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-all">
                <Lock size={64} className="text-emerald-500" />
              </div>
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">{isZh ? 'RADIUS 認證失敗率' : 'RADIUS Fail Rate'}</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-mono text-emerald-400">1.21%</span>
                <span className="px-1.5 py-0.5 bg-green-500/10 text-green-400 text-[8px] font-black rounded uppercase tracking-widest">{isZh ? '狀態正常' : 'HEALTHY'}</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-2">{isZh ? '近 24 小時認證拒絕與超時統計' : 'Radius Handshake Fail stats'}</p>
            </div>

          </div>

          {/* Graphical Analytics Charts Area */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Chart 1: Device Type distribution (Donut) */}
            <div className="bg-[#111114] border border-gray-800 rounded-2xl p-6 lg:col-span-4 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-1">{isZh ? '設備作業系統分布' : 'Device Operating Systems'}</h3>
                <p className="text-[10px] text-gray-500 mb-4">{isZh ? 'PacketFence DHCP 偵測特徵引擎抓取' : 'Fingerprinted DHCP/OS metrics source'}</p>
              </div>

              <div className="h-[200px] flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deviceTypeDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {deviceTypeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff', fontSize: '11px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Embedded Center Indicator */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black font-mono text-white">{nodes.length}</span>
                  <span className="text-[8px] text-gray-500 uppercase tracking-widest font-black">{isZh ? '已篩選設備' : 'Filtered'}</span>
                </div>
              </div>

              {/* Legends list */}
              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-800/60 text-[10px] font-mono">
                {deviceTypeDistribution.map((entry, idx) => (
                  <div key={idx} className="flex flex-col items-start px-2 py-1 rounded bg-[#0d0d0f]">
                    <div className="flex items-center gap-1.5 text-gray-400 mb-0.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span>{entry.name}</span>
                    </div>
                    <span className="font-bold text-white pl-3">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 2: Auth line trends */}
            <div className="bg-[#111114] border border-gray-800 rounded-2xl p-6 lg:col-span-8 flex flex-col justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-1">{isZh ? '即時流量與認證請求趨勢 (24H)' : 'Authentication Handshake Velocity'}</h3>
                  <p className="text-[10px] text-gray-500">{isZh ? 'RADIUS/DHCP 每小時分析量與成功率對照' : 'Hourly comparison of load & connection success'}</p>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-red-500/20 border border-red-500 rounded" />
                    <span className="text-gray-400">{isZh ? '請求次數 (Requests)' : 'Requests (Count)'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-1 bg-purple-400 rounded" />
                    <span className="text-gray-400">{isZh ? '成功率 (%)' : 'Success Rate (%)'}</span>
                  </div>
                </div>
              </div>

              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={authenticationTrends} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.01}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                    <XAxis dataKey="hour" stroke="#4b5563" fontSize={10} fontFamily="monospace" />
                    <YAxis stroke="#4b5563" fontSize={10} fontFamily="monospace" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0d0d0f', border: '1px solid #1f2937', borderRadius: '8px' }}
                      labelStyle={{ color: '#9ca3af', fontSize: '11px', fontWeight: 'bold' }}
                      itemStyle={{ fontSize: '11px' }}
                    />
                    <Area type="monotone" dataKey="requests" stroke="#ef4444" fillOpacity={1} fill="url(#colorRequests)" name={isZh ? '認證請求次數' : 'Auth Requests'} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Sub-area: Real-time Alerts Streams and Isolate actions */}
          <div className="bg-[#111114] border border-gray-800 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <h4 className="text-xs font-black uppercase text-gray-200 tracking-widest">{isZh ? 'PacketFence 異常事件即時監控' : 'Active PacketFence IDS / MAC Anomalies Stream'}</h4>
              </div>
              <span className="text-[10px] font-mono text-gray-500">{alerts.length} {isZh ? '筆事件待審查處置' : 'Events Pending triage'}</span>
            </div>

            <div className="space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
              {alerts.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-500">
                  {isZh ? '無異常警報，系統安穩運行中！' : 'Zero live alerts. Network perimeter compliant.'}
                </div>
              ) : (
                alerts.map(alert => (
                  <div key={alert.id} className="p-4 bg-black/40 border border-gray-800 rounded-xl flex flex-col md:flex-row items-start md:items-center gap-4 justify-between transition-colors hover:border-red-500/10">
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[10px] text-gray-500 font-bold">{alert.time}</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                          alert.severity === 'high' ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                          alert.severity === 'medium' ? "bg-yellow-500/15 text-yellow-500 border border-yellow-500/10" :
                          "bg-blue-500/15 text-blue-400"
                        )}>
                          {isZh ? (alert.severity === 'high' ? '高風險' : alert.severity === 'medium' ? '中風險' : '低風險') : `${alert.severity} Risk`}
                        </span>
                        <span className="px-1.5 py-0.5 bg-gray-900 border border-gray-800 text-gray-300 rounded text-[9px] font-mono">{alert.type}</span>
                        
                        {/* Interactive matching node link label */}
                        <span className="text-[10px] text-gray-400 font-mono font-bold">IP: {alert.ip} / MAC: {alert.mac}</span>
                      </div>
                      <p className="text-xs text-gray-300 font-medium leading-relaxed mt-1">
                        {alert.message}
                      </p>
                    </div>

                    {/* Quick containment button action */}
                    <div className="flex gap-2 shrink-0 w-full md:w-auto justify-end">
                      <button 
                        onClick={() => handleIsolateNode(alert.mac, alert.ip)}
                        className="py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-lg shadow-red-900/10"
                      >
                        <Lock size={11} />
                        {isZh ? '一鍵隔離設備' : 'Isolate Node'}
                      </button>
                      <button 
                        onClick={() => {
                          setAlerts(prev => prev.filter(a => a.id !== alert.id));
                          triggerToast(isZh ? '已暫時忽略此通報' : 'Alert dismissed/acknowledged in session.', 'info');
                        }}
                        className="py-1.5 px-3 bg-[#0d0d0f] hover:bg-gray-800 border border-gray-800 text-gray-400 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                      >
                        {isZh ? '忽略' : 'Acknowledge'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>

        </div>
      )}

      {activeTab === 'management' && (
        <div className="space-y-6">
          
          {/* Sub Navigation Bar for management */}
          <div className="flex border-b border-gray-800 pb-0 bg-[#111114] px-4 pt-4 rounded-xl border">
            {[
              { id: 'nodes', label: isZh ? '節點與設備管理 (Nodes)' : 'Nodes & Devices', icon: <Laptop size={13} /> },
              { id: 'guests', label: isZh ? '使用者與訪客稽核 (Guests)' : 'Guest Approval Desk', icon: <UserCheck size={13} /> },
              { id: 'sessions', label: isZh ? '即時連線會話 (Active Sessions)' : 'Active RADIUS Sessions', icon: <Wifi size={13} /> }
            ].map((subTab) => (
              <button
                key={subTab.id}
                onClick={() => setManagementSubTab(subTab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all relative top-[2px]",
                  managementSubTab === subTab.id 
                    ? "border-red-500 text-white" 
                    : "border-transparent text-gray-500 hover:text-gray-300"
                )}
              >
                {subTab.icon}
                {subTab.label}
              </button>
            ))}
          </div>

          {/* Sub Content: Section 1. Nodes Management */}
          {managementSubTab === 'nodes' && (
            <div className="bg-[#111114] border border-gray-800 rounded-2xl p-6 space-y-4">
              
              {/* Header and filters search controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-xs font-black uppercase text-gray-200 tracking-wider">
                    {isZh ? '網路端點節點狀態庫' : 'Registered Device Repository'}
                  </h3>
                  <p className="text-[10px] text-gray-500">
                    {isZh ? '同步自 PacketFence PostgreSQL 主資料庫，過濾 MAC、狀態與交換器埠號' : 'Real-time database sync mapping MAC profiles & RADIUS history'}
                  </p>
                </div>
                
                {/* Search field */}
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-2.5 text-gray-500 w-4 h-4" />
                  <input
                    type="text"
                    value={searchNode}
                    onChange={(e) => setSearchNode(e.target.value)}
                    placeholder={isZh ? "搜尋 MAC, IP 或使用者..." : "MAC IP or Identity search..."}
                    className="w-full bg-black/40 border border-gray-800 rounded-xl pl-9 pr-4 py-2 text-xs font-bold text-white outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left font-mono text-xs border text-gray-300 border-gray-800/60 rounded-xl overflow-hidden divide-y divide-gray-800">
                  <thead className="bg-[#0c0c0e] text-gray-400 text-[10px] font-black uppercase tracking-wider">
                    <tr>
                      <th className="p-4">{isZh ? 'MAC 位址' : 'MAC ADDRESS'}</th>
                      <th className="p-4">{isZh ? '分配 IP' : 'ASSIGNED IP'}</th>
                      <th className="p-4">{isZh ? '系統類別 (OS)' : 'OS TYPE'}</th>
                      <th className="p-4">{isZh ? '當前狀態' : 'HEALTH STATUS'}</th>
                      <th className="p-4">{isZh ? '綁定所有人' : 'OWNER IDENTITY'}</th>
                      <th className="p-4">{isZh ? '位置 (Switch / Port)' : 'NAS LOCATION'}</th>
                      <th className="p-4 text-center">{isZh ? '操作' : 'ACTIONS'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50 bg-black/20">
                    {nodes
                      .filter(n => {
                        const term = searchNode.toLowerCase();
                        return (
                          n.mac.toLowerCase().includes(term) ||
                          (n.ip && n.ip.includes(term)) ||
                          n.owner.toLowerCase().includes(term) ||
                          n.os.toLowerCase().includes(term)
                        );
                      })
                      .map((node, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-4 font-bold text-white selection:bg-red-500">{node.mac}</td>
                          <td className="p-4 text-gray-300 font-semibold">{node.ip || '0.0.0.0'}</td>
                          <td className="p-4 leading-none">
                            <span className="px-2 py-0.5 bg-gray-900 border border-gray-800 rounded text-[9px] font-black uppercase flex items-center gap-1.5 w-max">
                              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                              {node.os}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest block w-max",
                              node.status === 'Registered' ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                              node.status === 'Quarantine' ? "bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse" :
                              "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                            )}>
                              {node.status}
                            </span>
                          </td>
                          <td className="p-4 text-[11px] font-bold text-gray-400">{node.owner}</td>
                          <td className="p-4 leading-normal">
                            <span className="text-[10px] text-gray-500 block">{node.switchIp}</span>
                            <span className="text-white text-[10px] font-black font-mono">{node.switchPort} (VLAN {node.vlan})</span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-2">
                              {/* Open Detail Drawer Option */}
                              <button 
                                onClick={() => {
                                  setSelectedNode(node);
                                  setVlanToChange(node.vlan.toString());
                                }}
                                className="px-2 py-1 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded text-[9px] font-black text-gray-300 hover:text-white uppercase transition-colors"
                              >
                                {isZh ? '詳細日誌' : 'Diag Logs'}
                              </button>
                              
                              {node.status === 'Quarantine' ? (
                                <button 
                                  onClick={() => handleRestoreNode(node.mac)}
                                  className="px-2 py-1 bg-green-950/40 text-green-400 hover:bg-green-600 hover:text-white font-black text-[9px] rounded uppercase transition-all"
                                >
                                  {isZh ? '解鎖' : 'Restore'}
                                </button>
                              ) : (
                                <button 
                                  onClick={() => handleIsolateNode(node.mac, node.ip)}
                                  className="px-2 py-1 bg-red-950/40 text-red-400 hover:bg-red-600 hover:text-white font-black text-[9px] rounded uppercase transition-all"
                                >
                                  {isZh ? '隔離' : 'Isolate'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>

              {/* Node Detail Drawer Modal Panel (Simulated Floating Panel) */}
              {selectedNode && (
                <div className="fixed inset-y-0 right-0 z-50 bg-[#0c0c0e] border-l border-gray-800 w-full sm:w-[480px] p-6 shadow-2xl overflow-y-auto animate-in slide-in-from-right flex flex-col justify-between">
                  
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                      <div>
                        <span className="px-2 py-0.5 bg-gray-900 border border-gray-800 rounded text-[8px] font-black text-gray-500 uppercase tracking-widest block mb-1">
                          {isZh ? 'PacketFence 節點診斷日誌' : 'PacketFence Node Diagnostics'}
                        </span>
                        <h4 className="text-md font-black text-white uppercase italic tracking-wider">{selectedNode.mac}</h4>
                      </div>
                      <button 
                        onClick={() => setSelectedNode(null)}
                        className="p-1.5 bg-gray-900 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
                      >
                        <XCircle size={18} />
                      </button>
                    </div>

                    {/* Meta Data */}
                    <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                      <div className="bg-black/30 p-3 rounded-lg border border-gray-800/60">
                        <span className="text-gray-500 block uppercase text-[8px] font-black">{isZh ? 'RADIUS 客戶端 IP' : 'RADIUS Client IP'}</span>
                        <span className="text-white font-bold">{selectedNode.ip || (isZh ? 'DHCP 未分配' : 'DHCP unassigned')}</span>
                      </div>
                      <div className="bg-black/30 p-3 rounded-lg border border-gray-800/60">
                        <span className="text-gray-500 block uppercase text-[8px] font-black">{isZh ? '辨識系統 (DHCP 指紋)' : 'Identified OS (DHCP Fingerprint)'}</span>
                        <span className="text-white font-bold">{selectedNode.os}</span>
                      </div>
                      <div className="bg-black/30 p-3 rounded-lg border border-gray-800/60">
                        <span className="text-gray-500 block uppercase text-[8px] font-black">{isZh ? '關聯交換器設備' : 'Associated Switch Profile'}</span>
                        <span className="text-white font-bold">{selectedNode.switchIp}</span>
                      </div>
                      <div className="bg-black/30 p-3 rounded-lg border border-gray-800/60">
                        <span className="text-gray-500 block uppercase text-[8px] font-black">{isZh ? '連接埠配置 (Port)' : 'Port Allocation'}</span>
                        <span className="text-white font-bold">{selectedNode.switchPort}</span>
                      </div>
                    </div>

                    {/* Change VLAN Actions */}
                    <div className="bg-red-600/5 border border-red-500/10 p-4 rounded-xl space-y-4">
                      <h5 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <Sliders size={12} className="text-red-500" />
                        {isZh ? '控制動作與 VLAN 切換配置' : 'VLAN Modification & Active CoA'}
                      </h5>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[8px] text-gray-500 tracking-wider font-black uppercase">{isZh ? '指派節點 VLAN' : 'Assign Node VLAN'}</label>
                          <select 
                            value={vlanToChange} 
                            onChange={(e) => setVlanToChange(e.target.value)}
                            className="w-full bg-black border border-gray-800 text-xs text-white rounded p-2 outline-none font-bold italic"
                          >
                            <option value="10">{isZh ? 'VLAN 10 (內部核心安全網)' : 'VLAN 10 (Secure Intranet)'}</option>
                            <option value="20">{isZh ? 'VLAN 20 (研發與工程網段)' : 'VLAN 20 (R&D Department)'}</option>
                            <option value="40">{isZh ? 'VLAN 40 (物聯網隔離沙箱)' : 'VLAN 40 (IoT Sandbox)'}</option>
                            <option value="50">{isZh ? 'VLAN 50 (動態訪客網路)' : 'VLAN 50 (Dynamic Guests)'}</option>
                            <option value="99">{isZh ? 'VLAN 99 (隔離檢疫網區)' : 'VLAN 99 (Quarantine Network)'}</option>
                          </select>
                        </div>

                        <div className="flex items-end">
                          <button
                            onClick={() => {
                              setNodes(prev => prev.map(n => {
                                if (n.mac === selectedNode.mac) {
                                  return { ...n, vlan: parseInt(vlanToChange), status: parseInt(vlanToChange) === 99 ? 'Quarantine' : 'Registered' };
                                }
                                return n;
                              }));
                              triggerToast(
                                isZh 
                                  ? `已切換 VLAN。調用 REST API 給 Switch ${selectedNode.switchIp} 將埠 ${selectedNode.vlan} 更改為 VLAN ${vlanToChange}。`
                                  : `Port reallocation pushed. Switch port for ${selectedNode.mac} updated to VLAN ${vlanToChange}.`,
                                'success'
                              );
                            }}
                            className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded text-[9px] uppercase font-black tracking-widest transition-colors"
                          >
                            {isZh ? '切換並生效 VLAN' : 'Change VLAN'}
                          </button>
                        </div>
                      </div>

                      {/* Power disconnect action */}
                      <button
                        onClick={() => {
                          triggerToast(
                            isZh 
                              ? `已發送 RFC 3576 RADIUS Change-of-Authorization (CoA) 至 ${selectedNode.switchIp}。終端執行強制下線 (RADIUS Disconnect) 重啟 DHCP 獲取流程。`
                              : `Triggered RADIUS Change-of-Authorization (CoA) disconnect packet to host ${selectedNode.mac}.`,
                            'info'
                          );
                        }}
                        className="w-full py-2.5 bg-black border border-red-500/30 hover:bg-red-500/10 text-red-400 hover:text-white rounded text-[9px] uppercase font-black tracking-wider transition-all flex items-center justify-center gap-1.5"
                      >
                        <Zap size={12} />
                        {isZh ? '強制登出 (RADIUS CoA Disconnect)' : 'RADIUS CoA Disconnect'}
                      </button>
                    </div>

                    {/* RADIUS Logging stream */}
                    <div className="space-y-3">
                      <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">{isZh ? 'RADIUS 認證記錄' : 'RADIUS Log Audits'}</h5>
                      <div className="space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar font-mono text-[10px] bg-black/40 p-3 rounded-lg border border-gray-800">
                        <div className="flex justify-between text-gray-500">
                          <span>[20:30:12]</span>
                          <span className="text-green-400 font-bold">Access-Accept (PEAP-TLS)</span>
                        </div>
                        <div className="text-gray-300">User CN chiur@ke-la.com. Port authenticated Gig1/12</div>
                        <hr className="border-gray-800/40 my-1"/>
                        <div className="flex justify-between text-gray-500">
                          <span>[16:44:02]</span>
                          <span className="text-gray-400 font-bold">DHCP-Request signature</span>
                        </div>
                        <div className="text-gray-300">Fingerprint matches Windows NT kernel signature</div>
                      </div>
                    </div>

                    {/* DHCP Lease profile history */}
                    <div className="space-y-3">
                      <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">{isZh ? 'DHCP 租期歷史記錄' : 'DHCP Leases Audit'}</h5>
                      <div className="space-y-1.5 font-mono text-[10px] bg-black/40 p-3 rounded-lg border border-gray-800">
                        <div className="flex justify-between">
                          <span className="text-gray-500">{isZh ? '獲取 IP：' : 'Acquired IP:'}</span>
                          <span className="text-white font-bold">{selectedNode.ip || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">{isZh ? '租期開始：' : 'Lease Start:'}</span>
                          <span className="text-gray-400">2026-06-16 12:00:00</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">{isZh ? '租期結束：' : 'Lease End:'}</span>
                          <span className="text-gray-400">2026-06-17 12:00:00</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">{isZh ? '網路介面：' : 'Network Interface:'}</span>
                          <span className="text-red-400">eth1 (PacketFence core virtualized)</span>
                        </div>
                      </div>
                    </div>

                  </div>

                  <div className="pt-6 border-t border-gray-800">
                    <button 
                      onClick={() => setSelectedNode(null)}
                      className="w-full py-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-400 hover:text-white rounded text-xs font-bold transition-all"
                    >
                      {isZh ? '關閉視窗' : 'Close Panel'}
                    </button>
                  </div>

                </div>
              )}

            </div>
          )}

          {/* Sub Content: Section 2. Guests & Provisioning Panel */}
          {managementSubTab === 'guests' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Approval interactive desk desk (left) */}
              <div className="lg:col-span-8 bg-[#111114] border border-gray-800 rounded-2xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800/60 pb-3">
                  <div className="space-y-1">
                    <h3 className="text-xs font-black uppercase text-gray-200 tracking-wider">
                      {isZh ? '臨時研討會與訪客臨時註冊審核' : 'Captive Portal Visitor Registration Desk'}
                    </h3>
                    <p className="text-[10px] text-gray-500">
                      {isZh ? '管理通過簡訊(SMS)/條款認證之臨時對象帳號生命週期。' : 'Dynamic transient accounts triggered over SMS validation queues'}
                    </p>
                  </div>
                  
                  {/* Search input */}
                  <input
                    type="text"
                    value={searchGuest}
                    onChange={(e) => setSearchGuest(e.target.value)}
                    placeholder={isZh ? "搜尋訪客姓名或手機號碼..." : "Search Guest Name or contact..."}
                    className="bg-black/40 border border-gray-800 rounded-xl px-4 py-1.5 text-xs font-bold text-white outline-none focus:border-red-500 w-full sm:w-56"
                  />
                </div>

                <div className="space-y-3">
                  {guestRequests
                    .filter(g => {
                      const term = searchGuest.toLowerCase();
                      return g.name.toLowerCase().includes(term) || g.account.toLowerCase().includes(term) || g.phone.includes(term);
                    })
                    .map((req, idx) => (
                      <div key={idx} className="p-4 bg-black/40 border border-gray-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{req.name}</span>
                            <span className="bg-gray-900 border border-gray-800 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold text-purple-400">@{req.account}</span>
                            <span className="text-[10px] text-gray-500 font-mono">({req.requestTime})</span>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 text-[11px] text-gray-400 font-mono">
                            <div>{isZh ? '電話：' : 'SMS: '} <span className="text-gray-300">{req.phone}</span></div>
                            <div>{isZh ? '信箱：' : 'Mail: '} <span className="text-gray-300">{req.email}</span></div>
                            <div>{isZh ? '預期租期：' : 'TTL Requested: '} <span className="text-amber-400">{req.duration}</span></div>
                            <div>{isZh ? '當前狀態：' : 'Status: '} 
                              <span className={cn(
                                "font-bold font-sans tracking-wide ml-1 uppercase text-[9px]",
                                req.status === 'approved' ? "text-green-400" :
                                req.status === 'rejected' ? "text-red-400" :
                                "text-yellow-400 animate-pulse"
                              )}>
                                {isZh 
                                  ? (req.status === 'approved' ? '已核准 (Approved)' : req.status === 'rejected' ? '已拒絕 (Rejected)' : '待審核 (Pending)') 
                                  : req.status}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          {req.status === 'pending' ? (
                            <>
                              <button 
                                onClick={() => handleGuestApproval(req.id, true)}
                                className="py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1"
                              >
                                <CheckCircle2 size={11} />
                                {isZh ? '核准並送憑證' : 'Approve & Dispatch'}
                              </button>
                              <button 
                                onClick={() => handleGuestApproval(req.id, false)}
                                className="py-1.5 px-3 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-400 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                              >
                                {isZh ? '拒絕' : 'Deny'}
                              </button>
                            </>
                          ) : (
                            <span className="px-3 py-1 bg-black text-[10px] font-black text-gray-500 border border-gray-800 rounded uppercase">
                              {isZh ? '已完成審核' : 'Handled'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>

              {/* Informative helper sidebar (right) */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-[#111114] border border-gray-800 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider">
                    <QrCode size={16} />
                    <span>{isZh ? 'WiFi 訪客入口掃描碼 (Captive Portal QR)' : 'WiFi Captive Portal Code'}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    {isZh 
                      ? '管理員可以下載或列印以下 PacketFence 動態訪客入口 QR-CODE。臨時訪客掃碼後將自動重新定向至內部 Captive Portal 註冊流程：' 
                      : 'Temporary reception printout QR code. Guests scanning this token trigger immediate HTTP redirection under PacketFence Captive Portal daemon:'}
                  </p>

                  <div className="bg-white p-4 rounded-xl flex items-center justify-center max-w-[170px] mx-auto border-4 border-purple-950/20 shadow-xl">
                    {/* Simulated vector QR layout */}
                    <div className="grid grid-cols-5 gap-1.5 w-32 h-32 bg-white text-black p-1 filter contrast-125">
                      <div className="bg-black col-span-2 row-span-2 rounded" />
                      <div className="bg-white" />
                      <div className="bg-black col-span-2 row-span-2 rounded" />
                      <div className="bg-black" />
                      <div className="bg-white" />
                      <div className="bg-black" />
                      <div className="bg-white" />
                      <div className="bg-black" />
                      <div className="bg-white" />
                      <div className="bg-black" />
                      <div className="bg-black col-span-2 row-span-2 rounded" />
                      <div className="bg-black" />
                      <div className="bg-white" />
                    </div>
                  </div>

                  <hr className="border-gray-800" />
                  
                  <div className="space-y-2">
                    <h5 className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{isZh ? '全域訪客策略限制' : 'Global Policy Limits'}</h5>
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-gray-500">{isZh ? '每位訪客最大設備數：' : 'Max devices per Guest:'}</span>
                      <span className="text-white font-bold">{isZh ? '2 台設備' : '2 Devices'}</span>
                    </div>
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-gray-500">{isZh ? 'RADIUS 會話逾時上限：' : 'RADIUS session timeout:'}</span>
                      <span className="text-white font-bold">{isZh ? '86400秒 (24小時)' : '86400s (24 Hrs)'}</span>
                    </div>
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-gray-500">{isZh ? '入口驗證加密機制：' : 'Portal auth encryption:'}</span>
                      <span className="text-green-500 font-bold">HTTPS WPA3 Enterprise</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Sub Content: Section 3. Active Sessions table */}
          {managementSubTab === 'sessions' && (
            <div className="bg-[#111114] border border-gray-800 rounded-2xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-xs font-black uppercase text-gray-200 tracking-wider">
                    {isZh ? '網上連接會話與 RADIUS 連線即時狀態' : 'Active Connection Cores (RADIUS Sessions)'}
                  </h3>
                  <p className="text-[10px] text-gray-500">
                    {isZh ? '此清單列出已通過認證並被分配 IP 地區的主機會話，可執行立即強退。' : 'RADIUS Live authenticated tuples actively sending internet streams'}
                  </p>
                </div>

                <input
                  type="text"
                  value={searchSession}
                  onChange={(e) => setSearchSession(e.target.value)}
                  placeholder={isZh ? "過濾在線帳號..." : "Filter Account ID..."}
                  className="bg-black/40 border border-gray-800 rounded-xl px-4 py-1.5 text-xs font-bold text-white outline-none focus:border-red-500 w-full sm:w-60"
                />
              </div>

              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left font-mono text-xs border text-gray-300 border-gray-800/60 rounded-xl overflow-hidden divide-y divide-gray-800">
                  <thead className="bg-[#0c0c0e] text-gray-400 text-[10px] font-black uppercase tracking-wider">
                    <tr>
                      <th className="p-4">{isZh ? '連線帳號 / 用戶ID' : 'ACCOUNT IDENTITY'}</th>
                      <th className="p-4">{isZh ? 'IP 與 MAC 位址' : 'IP & MAC ADDRESS'}</th>
                      <th className="p-4">{isZh ? '連線持續時間' : 'SESSION TTL'}</th>
                      <th className="p-4">{isZh ? '已消耗網路流量' : 'VOLUME CONSUMED'}</th>
                      <th className="p-4">{isZh ? '認證來源' : 'AUTHENTICATION ENTITY'}</th>
                      <th className="p-4 text-center">{isZh ? '踢除操作' : 'ADMIN ACTION'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50 bg-black/20">
                    {activeSessions
                      .filter(s => s.account.toLowerCase().includes(searchSession.toLowerCase()))
                      .map((session, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-4 font-bold text-white">
                            <span className="block">{session.account}</span>
                            <span className="text-[9px] text-gray-500 uppercase tracking-widest bg-gray-900 border border-gray-800 px-1 py-0.2 rounded w-max md:inline-block hidden">PF_Session_Tunnel</span>
                          </td>
                          <td className="p-4">
                            <span className="text-gray-200 block font-black">{session.ip}</span>
                            <span className="text-gray-500 text-[10px] block">{session.mac}</span>
                          </td>
                          <td className="p-4 text-white font-bold">{session.duration}</td>
                          <td className="p-4 text-purple-400 font-bold">{session.traffic}</td>
                          <td className="p-4 text-gray-400 text-[11px]">{session.authSource}</td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleDisconnectSession(session.id, session.mac)}
                              className="py-1 px-3 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20 text-[9px] font-black uppercase rounded transition-all"
                            >
                              {isZh ? '踢除會話' : 'Disconnect Session'}
                            </button>
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Tab: Policies and rule configuring & Sources & switches */}
      {activeTab === 'policies' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 min-h-[640px]">
          
          {/* Left Column: Sub-sidebar secondary navigation */}
          <div className="xl:col-span-3 bg-[#0d0d0f]/90 border border-gray-800 rounded-2xl p-4 flex flex-col justify-between gap-6 shadow-xl">
            <div className="space-y-4">
              <div className="px-3 py-2 border-b border-gray-850/60">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block font-mono">{isZh ? '核心配置引擎' : 'CORE PROFILE ENGINES'}</span>
                <h4 className="text-xs font-bold text-gray-300 font-mono flex items-center gap-1.5 pt-0.5">
                  <Network size={14} className="text-red-500" />
                  {isZh ? 'PacketFence 守護進程' : 'PacketFence Daemon'}
                </h4>
              </div>
              
              {/* Navigation buttons and icons mapping */}
              <div className="space-y-2">
                {[
                  { id: 'rules', label: isZh ? '存取策略與角色集 (Rules)' : 'Connection Rules', icon: <Sliders size={14} />, desc: isZh ? 'Visual If/Then 決策優先鏈' : 'If-Then prioritizing builder' },
                  { id: 'auth_sources', label: isZh ? '身分認證源系統 (Sources)' : 'Auth Directories', icon: <Database size={14} />, desc: isZh ? 'Windows AD / Cloud SSO' : 'LDAP / Cloud OAuth credentials' },
                  { id: 'captive_portal', label: isZh ? '網頁入口設計器 (Portal)' : 'Captive Designer', icon: <Smartphone size={14} />, desc: isZh ? '主題配色與條款預覽模擬' : 'Live simulator logo & colors' },
                  { id: 'switches', label: isZh ? '網路 NAS 暨交換器 (NAS)' : 'Device Config table', icon: <Server size={14} />, desc: isZh ? 'RADIUS Clients/SNMP Creds' : 'Dynamic Switch port & CoA' }
                ].map((item) => {
                  const isCurrent = policiesSubTab === item.id;
                  const isDirty = 
                    item.id === 'rules' ? isRulesDirty :
                    item.id === 'auth_sources' ? isAuthDirty :
                    item.id === 'captive_portal' ? isPortalDirty :
                    isSwitchesDirty;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSubTabNavigate(item.id as any)}
                      className={cn(
                        "w-full flex items-center justify-between p-3 rounded-xl transition-all border text-left outline-none",
                        isCurrent
                          ? "bg-red-600/10 border-red-500/40 text-red-400 font-bold shadow-lg"
                          : "bg-black/20 border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-850/40"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={cn(
                          "p-1.5 rounded-lg shrink-0",
                          isCurrent ? "bg-red-600 text-white" : "bg-gray-900 border border-gray-850 text-gray-500"
                        )}>
                          {item.icon}
                        </div>
                        <div className="leading-tight">
                          <span className="block text-[11px] font-black uppercase tracking-tight">{item.label}</span>
                          <span className="text-[8.5px] text-gray-500 font-normal block pt-0.5">{item.desc}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        {isDirty && (
                          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" title="Has unsaved changes" />
                        )}
                        <ChevronRight size={13} className={cn("opacity-40 transition-transform", isCurrent && "translate-x-0.5 text-red-400")} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* State Synchronizer diagnostics readouts */}
            <div className="p-3.5 bg-black/40 border border-gray-850/80 rounded-xl space-y-2 text-[10px] font-mono hover:border-gray-800 transition-colors">
              <span className="block font-black text-[9px] uppercase text-gray-500 tracking-wider">{isZh ? '設定暫存狀態 (State Buffer)' : 'Storage State buffer'}</span>
              
              <div className="space-y-1 text-[9px] text-gray-400">
                <div className="flex justify-between items-center">
                  <span>{isZh ? '存取策略規則：' : 'Connection Rules:'}</span>
                  <span className={isRulesDirty ? "text-amber-500 font-bold" : "text-gray-600"}>{isRulesDirty ? (isZh ? '未儲存' : 'UNSAVED') : (isZh ? '已同步' : 'SYNCED')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>{isZh ? '認證目錄來源：' : 'Auth Directories:'}</span>
                  <span className={isAuthDirty ? "text-amber-500 font-bold" : "text-gray-600"}>{isAuthDirty ? (isZh ? '未儲存' : 'UNSAVED') : (isZh ? '已同步' : 'SYNCED')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>{isZh ? '入口設計配置：' : 'Captive Designer:'}</span>
                  <span className={isPortalDirty ? "text-amber-500 font-bold" : "text-gray-600"}>{isPortalDirty ? (isZh ? '未儲存' : 'UNSAVED') : (isZh ? '已同步' : 'SYNCED')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>{isZh ? '交換器用戶端：' : 'NAS clients list:'}</span>
                  <span className={isSwitchesDirty ? "text-amber-500 font-bold" : "text-gray-600"}>{isSwitchesDirty ? (isZh ? '未儲存' : 'UNSAVED') : (isZh ? '已同步' : 'SYNCED')}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Switchable form content card wrapper */}
          <div className="xl:col-span-9 bg-[#0d0d0f]/90 border border-gray-800 rounded-2xl p-6 shadow-2xl relative min-h-[580px]">
            {policiesSubTab === 'rules' && (
              <ConnectionProfilesEditor 
                rules={rules} 
                setRules={setRules} 
                isZh={isZh} 
                setIsDirty={setIsRulesDirty} 
                triggerToast={triggerToast} 
              />
            )}

            {policiesSubTab === 'auth_sources' && (
              <AuthenticationSourcesEditor 
                ldapSource={ldapSource} 
                setLdapSource={setLdapSource} 
                oauthSource={oauthSource} 
                setOauthSource={setOauthSource} 
                isZh={isZh} 
                setIsDirty={setIsAuthDirty} 
                triggerToast={triggerToast} 
                ldapVerified={ldapVerified}
                setLdapVerified={setLdapVerified}
                oauthVerified={oauthVerified}
                setOauthVerified={setOauthVerified}
              />
            )}

            {policiesSubTab === 'captive_portal' && (
              <CaptivePortalDesigner 
                portalConfig={portalConfig} 
                setPortalConfig={setPortalConfig} 
                isZh={isZh} 
                setIsDirty={setIsPortalDirty} 
                triggerToast={triggerToast} 
                logoPreviewUrl={logoPreviewUrl}
                setLogoPreviewUrl={setLogoPreviewUrl}
              />
            )}

            {policiesSubTab === 'switches' && (
              <SwitchesConfigEditor 
                switches={switches as any} 
                setSwitches={setSwitches as any} 
                isZh={isZh} 
                setIsDirty={setIsSwitchesDirty} 
                triggerToast={triggerToast} 
              />
            )}
          </div>

        </div>
      )}

      {/* Unsaved Changes Confirmation Dialog Overlay Modal (離開前未存檔警告) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-100 select-none">
          <div className="bg-[#0b0b0e] border border-red-500/25 rounded-2xl p-6 w-full max-w-md shadow-3xl space-y-4">
            
            <div className="flex items-center gap-3 text-amber-500 border-b border-gray-850 pb-3">
              <AlertTriangle className="w-8 h-8 shrink-0 animate-bounce text-amber-500" />
              <div>
                <h4 className="text-xs font-black uppercase text-white tracking-widest">{isZh ? '離開前未存檔警告' : 'Unsaved Changes Warning'}</h4>
                <span className="text-[9px] text-gray-500 uppercase font-mono tracking-widest">PacketFence Navigation Blocker</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed font-semibold">
              {isZh 
                ? '系統檢測到，您當前在設定介面的表單中有尚未儲存的變更內容！如果現在強行離開，剛剛填寫的所有設定、圖片與金鑰資料將會被捨棄遺失。您確定要繼續離開嗎？' 
                : 'Form changes detected in buffer. Leaving now will clear your temporary playground memory. Do you wish to continue?'}
            </p>
            
            {/* Displaying which forms are dirty */}
            <div className="bg-black/60 font-mono text-[9px] p-3 rounded-lg border border-gray-850 text-amber-400 space-y-1">
              <span className="text-gray-500 block uppercase text-[8px] font-bold pb-0.5">MODIFIED FORMS:</span>
              {isRulesDirty && <div className="flex items-center gap-1.5"><span>●</span> <span>{isZh ? '存取策略規則組 (Rules Criteria)' : 'Connection Profiles Mapping'}</span></div>}
              {isAuthDirty && <div className="flex items-center gap-1.5"><span>●</span> <span>{isZh ? '認證來源與加密金鑰 (Directory Sources)' : 'LDAP / OAuth parameters modified'}</span></div>}
              {isPortalDirty && <div className="flex items-center gap-1.5"><span>●</span> <span>{isZh ? '網頁登陸入口品牌與條款 (Captive Portal)' : 'Branding files and logo buffer modified'}</span></div>}
              {isSwitchesDirty && <div className="flex items-center gap-1.5"><span>●</span> <span>{isZh ? '網路交換器與 AP 設定 (Switches credentials)' : 'SNMP / RADIUS secrets modified'}</span></div>}
            </div>

            <div className="flex gap-3 justify-end pt-1">
              <button
                type="button"
                onClick={() => {
                  // Discard all changes
                  setIsRulesDirty(false);
                  setIsAuthDirty(false);
                  setIsPortalDirty(false);
                  setIsSwitchesDirty(false);
                  setValidationErrors({});
                  setShowConfirmModal(false);
                  if (pendingSubTab) setPoliciesSubTab(pendingSubTab as any);
                  if (pendingTab) setActiveTab(pendingTab as any);
                }}
                className="py-1.5 px-3.5 bg-gray-950 border border-gray-850 hover:bg-red-950/20 text-red-400 rounded-lg text-[10px] font-black uppercase transition-all"
              >
                {isZh ? '確認捨棄並離開' : 'Discard and Continue'}
              </button>
              
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="py-1.5 px-3.5 bg-red-650 hover:bg-red-750 text-white rounded-lg text-[10px] font-black uppercase transition-all"
              >
                {isZh ? '留在原處繼續編輯' : 'Keep Editing'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
