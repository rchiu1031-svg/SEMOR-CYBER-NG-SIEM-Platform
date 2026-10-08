import React, { useState, useEffect, useCallback } from 'react';
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
  Menu,
  Ban,
  PowerOff
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
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
  status: 'Registered' | 'Unregistered' | 'Quarantine' | 'Blocked';
  owner: string;
  lastSeen: string;
  switchIp: string;
  switchPort: string;
  vlan: number;
  blockReason?: string;
  blockedAt?: string;
}

interface GuestRequest {
  id: string;
  account: string;
  name: string;
  phone: string;
  email: string;
  duration: string;
  status: 'pending' | 'approved' | 'rejected' | 'blocked';
  requestTime: string;
  rejectionReason?: string;
}

interface ActiveSession {
  id: string;
  account: string;
  mac: string;
  ip: string;
  duration: string;
  traffic: string;
  authSource: string;
  vlan?: number;
}

interface AlertEvent {
  id: string;
  time: string;
  type: string;
  severity: 'high' | 'medium' | 'low';
  mac: string;
  ip: string;
  message: string;
  status?: 'active' | 'isolated' | 'blocked' | 'dismissed';
}

interface BlocklistEntry {
  id: string;
  target: string;
  targetType: 'mac' | 'ip' | 'account';
  status: 'blocked' | 'quarantined';
  reason: string;
  source: string;
  enforcedActions: string[];
  timestamp: string;
  expiresAt: string;
  switchIp?: string;
  switchPort?: string;
  vlan?: number;
}

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
  accessRole: 'Guest' | 'Employee' | 'Quarantine' | 'BYOD' | 'Blocked';
  sessionTimeout: number;
  sessionTimeoutUnit: 'hours' | 'days';
  defaultVlan: number;
}

interface SwitchConfig {
  id: string;
  ip: string;
  name: string;
  brand: string;
  snmpCommunity: string;
  radiusSecret: string;
  status: 'online' | 'offline';
  enableCoa?: boolean;
  coaPort?: number;
}

export default function NetworkAccessControlView({ isReadOnly = false }: { isReadOnly?: boolean }) {
  const { i18n } = useTranslation();
  const isZh = i18n.language === 'zh';

  // State Management
  const [activeTab, setActiveTab] = useState<'dashboard' | 'management' | 'policies'>('dashboard');
  const [managementSubTab, setManagementSubTab] = useState<'nodes' | 'guests' | 'sessions' | 'blocklist'>('nodes');
  const [policiesSubTab, setPoliciesSubTab] = useState<'rules' | 'auth_sources' | 'captive_portal' | 'switches'>('rules');

  // Search Terms
  const [searchNode, setSearchNode] = useState('');
  const [searchGuest, setSearchGuest] = useState('');
  const [searchSession, setSearchSession] = useState('');
  const [searchBlocklist, setSearchBlocklist] = useState('');

  // Notifications / Toast Simulator
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'info' | 'error' }[]>([]);

  const triggerToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  // 1. Alert State & Live Feed
  const [alerts, setAlerts] = useState<AlertEvent[]>([
    { id: 'a1', time: '20:30:12', type: 'MAC Spoofing', severity: 'high', mac: '00:1A:2B:3C:4D:5E', ip: '10.120.10.45', message: 'MAC Address is claimed by different vendor signatures than mapped history.', status: 'active' },
    { id: 'a2', time: '20:15:34', type: 'Compliance Failed', severity: 'medium', mac: '70:88:6B:A2:3F:11', ip: '10.120.90.112', message: 'Corporate iPad failed compliance checker: iOS version 15.2 is outdated.', status: 'isolated' },
    { id: 'a3', time: '19:42:01', type: 'Rogue Device', severity: 'high', mac: '5A:45:90:3C:99:BC', ip: '10.120.100.8', message: 'Unknown IoT hub registered on Switch port FastEthernet0/12 (VLAN 1).', status: 'active' },
    { id: 'a4', time: '18:50:11', type: 'Malware DNS Activity', severity: 'high', mac: 'E0:DB:55:6C:12:3A', ip: '10.120.10.99', message: 'Suricata IDS signature triggered: command and control callback DNS pattern detected.', status: 'active' }
  ]);

  // 2. Nodes Data State
  const [nodes, setNodes] = useState<NodeDevice[]>([
    { mac: 'E0:DB:55:6C:12:3A', ip: '10.120.10.99', os: 'Windows', status: 'Registered', owner: 'chiur@ke-la.com', lastSeen: '2026-06-16 20:31:02', switchIp: '10.120.1.254', switchPort: 'GigabitEthernet1/12', vlan: 10 },
    { mac: '00:1A:2B:3C:4D:5E', ip: '10.120.10.45', os: 'Linux', status: 'Registered', owner: 'guest_service', lastSeen: '2026-06-16 20:28:44', switchIp: '10.120.1.254', switchPort: 'GigabitEthernet1/15', vlan: 50 },
    { mac: '70:88:6B:A2:3F:11', os: 'iOS', status: 'Quarantine', owner: 'finance.john', ip: '10.120.90.112', lastSeen: '2026-06-16 20:15:34', switchIp: '10.120.1.253', switchPort: 'GigabitEthernet1/4', vlan: 99, blockReason: 'Outdated OS' },
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
    { id: 's1', account: 'chiur@ke-la.com', mac: 'E0:DB:55:6C:12:3A', ip: '10.120.10.99', duration: '02h 41m', traffic: '1.45 GB', authSource: 'Active Directory AD-01', vlan: 10 },
    { id: 's2', account: 'dev.linda', mac: '3C:07:54:E9:10:8F', ip: '10.120.10.101', duration: '08h 15m', traffic: '4.89 GB', authSource: 'Active Directory AD-01', vlan: 10 },
    { id: 's3', account: 'guest_sharon', mac: '90:B6:86:1C:88:7A', ip: '10.120.50.32', duration: '01h 05m', traffic: '320 MB', authSource: 'Captive Portal SMS', vlan: 50 }
  ]);

  // 5. Blocklist State
  const [blocklist, setBlocklist] = useState<BlocklistEntry[]>([
    {
      id: 'blk-1',
      target: '70:88:6B:A2:3F:11',
      targetType: 'mac',
      status: 'quarantined',
      reason: 'iOS 15.2 Outdated Endpoint Compliance Failure',
      source: 'compliance_fail',
      enforcedActions: ['Switch VLAN 99 Isolation', 'RFC 3576 RADIUS CoA Redirect', 'Remediation Captive Portal Active'],
      timestamp: '2026-06-16 20:15:34',
      expiresAt: 'Pending Remediation',
      switchIp: '10.120.1.253',
      switchPort: 'GigabitEthernet1/4',
      vlan: 99
    }
  ]);

  // Manual Block Inputs
  const [manualBlockTarget, setManualBlockTarget] = useState('');
  const [manualBlockType, setManualBlockType] = useState<'mac' | 'ip' | 'account'>('mac');
  const [manualBlockReason, setManualBlockReason] = useState('Administrative Zero-Trust Enforce Block');

  // Backend sync indicator
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 6. Rules State
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
      name: 'Rogue_Hardware_Enforce_Block',
      description: 'Blocks untrusted MACs and unauthorized IoT bridge dongles (Access-Reject)',
      isActive: true,
      conditions: [
        { id: 'c5', criteriaType: 'os_type', operator: 'equals', value: 'IoT' },
        { id: 'c6', criteriaType: 'ssid', operator: 'equals', value: 'Corp_Secure' }
      ],
      logic: 'AND',
      accessRole: 'Blocked',
      sessionTimeout: 1,
      sessionTimeoutUnit: 'hours',
      defaultVlan: 999
    },
    {
      id: 'r4',
      name: 'IoT_Printer_and_Camera_Isolate',
      description: 'Renders guest privilege level with narrow restricted bandwidth',
      isActive: true,
      conditions: [
        { id: 'c7', criteriaType: 'os_type', operator: 'equals', value: 'IoT' }
      ],
      logic: 'AND',
      accessRole: 'Guest',
      sessionTimeout: 7,
      sessionTimeoutUnit: 'days',
      defaultVlan: 40
    }
  ]);

  // 7. Portal Config
  const [portalConfig, setPortalConfig] = useState({
    logoText: 'Secure corporate network access portal',
    welcomeMsg: 'Please complete validation to securely browse the internet',
    termsText: 'By using this network, you agree to secure monitoring and compliance configurations. All activities are audited.',
    requireAgreement: true,
    primaryColor: '#dc2626',
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

  // 8. Switches Config
  const [switches, setSwitches] = useState<SwitchConfig[]>([
    { id: 'sw1', ip: '10.120.1.254', name: 'Main Campus FortiSwitch_1', brand: 'Fortinet', snmpCommunity: 'pf_snmp_sec', radiusSecret: '•••••••••••••••••', status: 'online', enableCoa: true, coaPort: 3799 },
    { id: 'sw2', ip: '10.120.1.253', name: 'Server Area Distribution Cisco_C9300', brand: 'Cisco', snmpCommunity: 'pf_snmp_sec', radiusSecret: '•••••••••••••••••', status: 'online', enableCoa: true, coaPort: 3799 },
    { id: 'sw3', ip: '10.120.1.251', name: 'Lobby Edge Aruba_2930F', brand: 'Aruba', snmpCommunity: 'pf_snmp_public', radiusSecret: '•••••••••••••••••', status: 'online', enableCoa: true, coaPort: 3799 }
  ]);

  // Auth Directories
  const [ldapSource, setLdapSource] = useState({
    sourceName: 'Active Directory AD-01',
    serverHost: '10.120.100.2',
    port: 389,
    encryption: 'starttls' as 'none' | 'starttls' | 'ssltls',
    bindDn: 'cn=admin,dc=corp,dc=local',
    bindPass: '•••••••••••••••••',
    baseDn: 'ou=users,dc=corp,dc=local'
  });

  const [oauthSource, setOauthSource] = useState({
    provider: 'Google' as 'Google' | 'AzureAD',
    clientId: '96321-googleclientid123.apps.googleusercontent.com',
    clientSecret: 'GOCSPX-secretkey987654321',
    hostedDomain: 'company.com'
  });

  const [ldapVerified, setLdapVerified] = useState(true);
  const [oauthVerified, setOauthVerified] = useState(true);

  // Form dirty states
  const [isRulesDirty, setIsRulesDirty] = useState(false);
  const [isAuthDirty, setIsAuthDirty] = useState(false);
  const [isPortalDirty, setIsPortalDirty] = useState(false);
  const [isSwitchesDirty, setIsSwitchesDirty] = useState(false);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingSubTab, setPendingSubTab] = useState<string | null>(null);
  const [pendingTab, setPendingTab] = useState<'dashboard' | 'management' | 'policies' | null>(null);

  const isAnyFormDirty = isRulesDirty || isAuthDirty || isPortalDirty || isSwitchesDirty;

  // ==================== FETCH DATA FROM BACKEND ====================
  const fetchAllNacData = useCallback(async (quiet = false) => {
    if (!quiet) setIsRefreshing(true);
    try {
      const [nodesRes, alertsRes, guestsRes, sessionsRes, rulesRes, switchesRes, blkRes] = await Promise.all([
        fetch('/api/v1/nac/nodes').then(r => r.json()).catch(() => null),
        fetch('/api/v1/nac/alerts').then(r => r.json()).catch(() => null),
        fetch('/api/v1/nac/guests').then(r => r.json()).catch(() => null),
        fetch('/api/v1/nac/sessions').then(r => r.json()).catch(() => null),
        fetch('/api/v1/nac/rules').then(r => r.json()).catch(() => null),
        fetch('/api/v1/nac/switches').then(r => r.json()).catch(() => null),
        fetch('/api/v1/nac/blocklist').then(r => r.json()).catch(() => null)
      ]);

      if (nodesRes?.success && Array.isArray(nodesRes.data)) setNodes(nodesRes.data);
      if (alertsRes?.success && Array.isArray(alertsRes.data)) setAlerts(alertsRes.data);
      if (guestsRes?.success && Array.isArray(guestsRes.data)) setGuestRequests(guestsRes.data);
      if (sessionsRes?.success && Array.isArray(sessionsRes.data)) setActiveSessions(sessionsRes.data);
      if (rulesRes?.success && Array.isArray(rulesRes.data)) setRules(rulesRes.data);
      if (switchesRes?.success && Array.isArray(switchesRes.data)) setSwitches(switchesRes.data);
      if (blkRes?.success && Array.isArray(blkRes.data)) setBlocklist(blkRes.data);
    } catch (err) {
      console.warn('Backend NAC sync error:', err);
    } finally {
      if (!quiet) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAllNacData(true);
  }, [fetchAllNacData]);

  // ==================== REAL BACKEND BLOCKING & CONTAINMENT ACTIONS ====================

  /**
   * 1. Isolate Node (VLAN 99 Quarantine)
   */
  const handleIsolateNode = async (mac: string, reason = 'Administrative isolation policy enforcement') => {
    try {
      const res = await fetch(`/api/v1/nac/nodes/${encodeURIComponent(mac)}/isolate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      const json = await res.json();
      if (json.success) {
        setNodes(prev => prev.map(n => n.mac.toUpperCase() === mac.toUpperCase() ? { ...n, status: 'Quarantine', vlan: 99, blockReason: reason } : n));
        setActiveSessions(prev => prev.filter(s => s.mac.toUpperCase() !== mac.toUpperCase()));
        triggerToast(json.data?.message || (isZh ? `已隔離主機 ${mac} 至 VLAN 99` : `Host ${mac} isolated to VLAN 99`), 'success');
        fetchAllNacData(true);
      } else {
        throw new Error(json.error || 'Isolation failed');
      }
    } catch (err: any) {
      triggerToast(isZh ? `隔離失敗: ${err.message}` : `Isolate failed: ${err.message}`, 'error');
    }
  };

  /**
   * 2. Full Block Node (RADIUS Access-Reject & Port Down & Blacklist)
   */
  const handleBlockNode = async (mac: string, reason = 'Administrative Zero-Trust Enforce Block') => {
    try {
      const res = await fetch(`/api/v1/nac/nodes/${encodeURIComponent(mac)}/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, source: 'manual_admin' })
      });
      const json = await res.json();
      if (json.success) {
        setNodes(prev => prev.map(n => n.mac.toUpperCase() === mac.toUpperCase() ? { ...n, status: 'Blocked', vlan: 999, blockReason: reason } : n));
        setActiveSessions(prev => prev.filter(s => s.mac.toUpperCase() !== mac.toUpperCase()));
        triggerToast(json.data?.message || (isZh ? `已永久阻斷主機 ${mac} 並下發 RADIUS 拒絕與交換器斷線！` : `Host ${mac} fully blocked across RADIUS and Switch!`), 'success');
        fetchAllNacData(true);
      } else {
        throw new Error(json.error || 'Block failed');
      }
    } catch (err: any) {
      triggerToast(isZh ? `阻斷失敗: ${err.message}` : `Block failed: ${err.message}`, 'error');
    }
  };

  /**
   * 3. Restore Node
   */
  const handleRestoreNode = async (mac: string) => {
    try {
      const res = await fetch(`/api/v1/nac/nodes/${encodeURIComponent(mac)}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetVlan: 10 })
      });
      const json = await res.json();
      if (json.success) {
        setNodes(prev => prev.map(n => n.mac.toUpperCase() === mac.toUpperCase() ? { ...n, status: 'Registered', vlan: 10, blockReason: undefined } : n));
        triggerToast(json.data?.message || (isZh ? `已解除主機 ${mac} 的阻斷/隔離狀態，重定回常規 VLAN 10` : `Host ${mac} restored to VLAN 10`), 'success');
        fetchAllNacData(true);
      } else {
        throw new Error(json.error || 'Restore failed');
      }
    } catch (err: any) {
      triggerToast(isZh ? `解除失敗: ${err.message}` : `Restore failed: ${err.message}`, 'error');
    }
  };

  /**
   * 4. Change Node VLAN
   */
  const handleChangeVlan = async (mac: string, targetVlan: string) => {
    const vlanNum = parseInt(targetVlan);
    try {
      const res = await fetch(`/api/v1/nac/nodes/${encodeURIComponent(mac)}/vlan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vlan: vlanNum })
      });
      const json = await res.json();
      if (json.success) {
        setNodes(prev => prev.map(n => n.mac.toUpperCase() === mac.toUpperCase() ? {
          ...n,
          vlan: vlanNum,
          status: vlanNum === 99 ? 'Quarantine' : (n.status === 'Quarantine' ? 'Registered' : n.status)
        } : n));
        triggerToast(json.data?.message || (isZh ? `已更新 VLAN 為 ${vlanNum}` : `Updated VLAN to ${vlanNum}`), 'success');
        fetchAllNacData(true);
      } else {
        throw new Error(json.error || 'VLAN change failed');
      }
    } catch (err: any) {
      triggerToast(isZh ? `切換 VLAN 失敗: ${err.message}` : `Change VLAN failed: ${err.message}`, 'error');
    }
  };

  /**
   * 5. Disconnect Host via RFC 3576 CoA
   */
  const handleCoaDisconnect = async (mac: string) => {
    try {
      const res = await fetch(`/api/v1/nac/nodes/${encodeURIComponent(mac)}/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const json = await res.json();
      if (json.success) {
        setActiveSessions(prev => prev.filter(s => s.mac.toUpperCase() !== mac.toUpperCase()));
        triggerToast(json.data?.message || (isZh ? `已發送 RFC 3576 CoA 踢除封包強制 ${mac} 下線！` : `RFC 3576 CoA disconnect dispatched for ${mac}`), 'info');
        fetchAllNacData(true);
      } else {
        throw new Error(json.error || 'CoA disconnect failed');
      }
    } catch (err: any) {
      triggerToast(isZh ? `CoA 踢除失敗: ${err.message}` : `CoA failed: ${err.message}`, 'error');
    }
  };

  /**
   * 6. Switch Physical Port Shutdown
   */
  const handlePortShutdown = async (switchIp: string, port: string, mac: string) => {
    try {
      const res = await fetch(`/api/v1/nac/switches/${encodeURIComponent(switchIp)}/ports/${encodeURIComponent(port)}/shutdown`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: `Administrative port shutdown for host ${mac}` })
      });
      const json = await res.json();
      if (json.success) {
        setNodes(prev => prev.map(n => n.mac.toUpperCase() === mac.toUpperCase() ? { ...n, status: 'Blocked', vlan: 999 } : n));
        setActiveSessions(prev => prev.filter(s => s.mac.toUpperCase() !== mac.toUpperCase()));
        triggerToast(json.data?.message || (isZh ? `交換器埠 ${switchIp} (${port}) 已成功實體關閉阻斷！` : `Port ${port} shutdown executed`), 'success');
        fetchAllNacData(true);
      } else {
        throw new Error(json.error || 'Port shutdown failed');
      }
    } catch (err: any) {
      triggerToast(isZh ? `連接埠關閉失敗: ${err.message}` : `Port shutdown failed: ${err.message}`, 'error');
    }
  };

  /**
   * 7. Alert Containment: Isolate Node
   */
  const handleIsolateAlert = async (alert: AlertEvent) => {
    try {
      const res = await fetch(`/api/v1/nac/alerts/${alert.id}/isolate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const json = await res.json();
      if (json.success) {
        setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, status: 'isolated' } : a));
        setNodes(prev => prev.map(n => n.mac.toUpperCase() === alert.mac.toUpperCase() ? { ...n, status: 'Quarantine', vlan: 99 } : n));
        triggerToast(isZh ? `通報 #${alert.id} 已執行處置：成功隔離主機 ${alert.mac} 至 VLAN 99` : `Alert #${alert.id} handled: host ${alert.mac} isolated to VLAN 99`, 'success');
        fetchAllNacData(true);
      } else {
        throw new Error(json.error || 'Failed to isolate');
      }
    } catch (err: any) {
      triggerToast(isZh ? `隔離處置失敗: ${err.message}` : `Isolation failed: ${err.message}`, 'error');
    }
  };

  /**
   * 8. Alert Containment: Full Block Host
   */
  const handleBlockAlert = async (alert: AlertEvent) => {
    try {
      const res = await fetch(`/api/v1/nac/alerts/${alert.id}/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const json = await res.json();
      if (json.success) {
        setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, status: 'blocked' } : a));
        setNodes(prev => prev.map(n => n.mac.toUpperCase() === alert.mac.toUpperCase() ? { ...n, status: 'Blocked', vlan: 999 } : n));
        triggerToast(isZh ? `高危通報 #${alert.id} 阻斷成功！已向全域 RADIUS/交換器下發 ${alert.mac} 永久阻斷！` : `Alert #${alert.id} blocked: ${alert.mac} banned network-wide!`, 'success');
        fetchAllNacData(true);
      } else {
        throw new Error(json.error || 'Failed to block');
      }
    } catch (err: any) {
      triggerToast(isZh ? `阻斷處置失敗: ${err.message}` : `Block failed: ${err.message}`, 'error');
    }
  };

  /**
   * 9. Dismiss Alert
   */
  const handleDismissAlert = async (alertId: string) => {
    try {
      await fetch(`/api/v1/nac/alerts/${alertId}/dismiss`, { method: 'POST' });
      setAlerts(prev => prev.filter(a => a.id !== alertId));
      triggerToast(isZh ? '已暫時忽略此通報' : 'Alert dismissed', 'info');
      fetchAllNacData(true);
    } catch {
      setAlerts(prev => prev.filter(a => a.id !== alertId));
    }
  };

  /**
   * 10. Guest Approval or Rejection / Blacklist
   */
  const handleGuestApproval = async (id: string, isApprove: boolean, blockApplicant = false) => {
    try {
      const endpoint = isApprove ? `/api/v1/nac/guests/${id}/approve` : `/api/v1/nac/guests/${id}/reject`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockApplicant, reason: blockApplicant ? 'Guest application rejected and blacklisted' : 'Administrative refusal' })
      });
      const json = await res.json();
      if (json.success) {
        setGuestRequests(prev => prev.map(g => g.id === id ? { ...g, status: isApprove ? 'approved' : (blockApplicant ? 'blocked' : 'rejected') } : g));
        triggerToast(json.data?.message || (isApprove ? (isZh ? '訪客申請已核准' : 'Approved') : (isZh ? '訪客申請已拒絕' : 'Rejected')), isApprove ? 'success' : 'error');
        fetchAllNacData(true);
      } else {
        throw new Error(json.error || 'Guest operation failed');
      }
    } catch (err: any) {
      triggerToast(isZh ? `訪客操作失敗: ${err.message}` : `Guest action failed: ${err.message}`, 'error');
    }
  };

  /**
   * 11. Disconnect Session & Optional Host Block
   */
  const handleDisconnectSession = async (id: string, mac: string, blockMac = false) => {
    try {
      const res = await fetch(`/api/v1/nac/sessions/${id}/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockMac, reason: blockMac ? 'Active session terminated with instant host block' : 'Admin forced teardown' })
      });
      const json = await res.json();
      if (json.success) {
        setActiveSessions(prev => prev.filter(s => s.id !== id));
        if (blockMac) {
          setNodes(prev => prev.map(n => n.mac.toUpperCase() === mac.toUpperCase() ? { ...n, status: 'Blocked', vlan: 999 } : n));
        }
        triggerToast(json.data?.message || (blockMac ? (isZh ? `已踢除連線並永久阻斷 MAC ${mac}` : `Kicked and blocked MAC ${mac}`) : (isZh ? `已踢除 MAC ${mac} 會話` : `Session disconnected`)), blockMac ? 'success' : 'info');
        fetchAllNacData(true);
      } else {
        throw new Error(json.error || 'Disconnect failed');
      }
    } catch (err: any) {
      triggerToast(isZh ? `踢除會話失敗: ${err.message}` : `Disconnect failed: ${err.message}`, 'error');
    }
  };

  /**
   * 12. Manual Quick Block Target (IP / MAC / Account)
   */
  const handleManualBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualBlockTarget.trim()) return;

    try {
      const res = await fetch('/api/v1/nac/blocklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: manualBlockTarget.trim(),
          targetType: manualBlockType,
          reason: manualBlockReason.trim() || 'Manual admin blacklist injection'
        })
      });
      const json = await res.json();
      if (json.success) {
        triggerToast(json.data?.message || (isZh ? `已成功將 ${manualBlockTarget} 加入全域阻斷黑名單！` : `Target ${manualBlockTarget} added to blocklist`), 'success');
        setManualBlockTarget('');
        fetchAllNacData(true);
      } else {
        throw new Error(json.error || 'Failed to block target');
      }
    } catch (err: any) {
      triggerToast(isZh ? `手動阻斷失敗: ${err.message}` : `Block failed: ${err.message}`, 'error');
    }
  };

  /**
   * 13. Remove from Blocklist / Quarantine Pool
   */
  const handleRemoveBlocklistEntry = async (id: string, target: string) => {
    try {
      const res = await fetch(`/api/v1/nac/blocklist/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setBlocklist(prev => prev.filter(b => b.id !== id));
        triggerToast(json.message || (isZh ? `已解除對 ${target} 的黑名單阻斷限制！` : `Block revoked for ${target}`), 'success');
        fetchAllNacData(true);
      } else {
        throw new Error(json.error || 'Failed to remove');
      }
    } catch (err: any) {
      triggerToast(isZh ? `解鎖失敗: ${err.message}` : `Unblock failed: ${err.message}`, 'error');
    }
  };

  // Subtab navigation helpers
  const handleSubTabNavigate = (targetSubTab: 'rules' | 'auth_sources' | 'captive_portal' | 'switches') => {
    if (policiesSubTab === targetSubTab) return;
    if (isAnyFormDirty) {
      setPendingSubTab(targetSubTab);
      setPendingTab(null);
      setShowConfirmModal(true);
    } else {
      setPoliciesSubTab(targetSubTab);
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
    }
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
              <span className="font-bold block mb-1 uppercase tracking-wider">{toast.type === 'success' ? 'SUCCESS REST API' : toast.type === 'error' ? 'NAC BLOCKING NOTICE' : 'ENGINE DISPATCH'}</span>
              <span>{toast.message}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Top Welcome Title */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gray-900/40 p-6 rounded-2xl border border-gray-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-red-600 text-white rounded text-[9px] font-black tracking-widest uppercase animate-pulse">{isZh ? 'NAC 存取控制就緒' : 'NAC Integrated'}</span>
            <span className="text-[10px] font-mono text-gray-500 font-bold uppercase">{isZh ? 'PacketFence 802.1X / RADIUS 雙向阻斷引擎在線' : 'PF Core RADIUS & Block Engine Active'}</span>
          </div>
          <h2 className="text-xl font-bold font-sans text-white tracking-tight flex items-center gap-2.5">
            {isZh ? '網路存取控制後台控制器 (Network Access Control)' : 'Network Access Control Controller'} <span className="text-gray-500 font-normal text-sm">v12.2.0</span>
          </h2>
          <p className="text-xs text-gray-400 leading-relaxed">
            {isZh 
              ? '全方位 802.1X RADIUS 認證、DHCP 指紋識別、連線會話動態踢除、VLAN 99 隔離檢疫與交換器實體埠關閉阻斷系統。' 
              : 'Direct API integrations with PacketFence Core. Live dashboard for RADIUS 802.1x compliance, guest provisioning, active sessions teardown, and granular access profile workflows.'}
          </p>
        </div>

        {/* REST API Endpoints Quick status & Refresh button */}
        <div className="flex flex-wrap items-center gap-3 justify-end">
          <button
            onClick={() => fetchAllNacData(false)}
            disabled={isRefreshing}
            className="p-2.5 bg-black/50 border border-gray-800 hover:border-red-500/40 rounded-xl text-gray-400 hover:text-white transition-all flex items-center gap-2 text-xs font-mono"
            title="Refresh NAC Live Telemetry"
          >
            <RefreshCw size={14} className={cn(isRefreshing && "animate-spin text-red-500")} />
            <span className="hidden sm:inline">{isZh ? '重新整理' : 'Sync'}</span>
          </button>

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
              <span className="text-gray-500 block uppercase">{isZh ? '阻斷處置引擎' : 'BLOCKING ENGINE'}</span>
              <span className="text-purple-400 font-bold font-mono">{isZh ? '運作中 (ACTIVE)' : 'ONLINE'}</span>
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
          {isZh ? '控制與管理功能 (含阻斷)' : 'Detail Management & Blocking'}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            
            {/* KPI 1: Total Online */}
            <div className="bg-[#111114] border border-gray-800 rounded-2xl p-5 relative overflow-hidden group hover:border-red-500/20 transition-all">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-all">
                <Laptop size={64} className="text-white" />
              </div>
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">{isZh ? '在線端點設備總數' : 'Total Endpoints'}</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-mono text-white">{nodes.length + 1242}</span>
                <span className="text-[10px] text-green-400 font-bold font-mono">+12.4%</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-2">{isZh ? '對接 RADIUS + DHCP 在線設備' : 'Actively bound sessions in LDAP'}</p>
            </div>

            {/* KPI 2: Violating / Quarantine */}
            <div className="bg-[#111114] border border-gray-800 rounded-2xl p-5 relative overflow-hidden group hover:border-amber-500/20 transition-all">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-all">
                <ShieldAlert size={64} className="text-amber-500" />
              </div>
              <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest block mb-1">{isZh ? '隔離檢疫設備 (Quarantine)' : 'Quarantined Endpoints'}</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-mono text-amber-400 animate-pulse">{nodes.filter(n => n.status === 'Quarantine').length}</span>
                <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-500 text-[8px] font-black rounded uppercase tracking-widest">{isZh ? 'VLAN 99 隔離' : 'VLAN 99'}</span>
              </div>
              <p className="text-[10px] text-amber-400/80 mt-2">{isZh ? '觸發檢疫並導向修復頁面' : 'Failing security threshold logs'}</p>
            </div>

            {/* KPI 3: Blocked / Blacklist */}
            <div className="bg-[#111114] border border-red-500/30 rounded-2xl p-5 relative overflow-hidden group hover:border-red-500/50 transition-all bg-gradient-to-br from-red-950/20 to-transparent">
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none group-hover:scale-110 transition-all">
                <Ban size={64} className="text-red-500" />
              </div>
              <span className="text-[9px] font-black text-red-400 uppercase tracking-widest block mb-1">{isZh ? '完全阻斷設備 (Blocked)' : 'Blocked / Blacklisted'}</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-mono text-red-500">{nodes.filter(n => n.status === 'Blocked').length + blocklist.filter(b => b.status === 'blocked').length}</span>
                <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[8px] font-black rounded uppercase tracking-widest">{isZh ? '永久阻斷' : 'BLOCKED'}</span>
              </div>
              <p className="text-[10px] text-red-300/80 mt-2">{isZh ? 'RADIUS Reject & 端口強制關閉' : 'Access-Reject and Port Shutdown'}</p>
            </div>

            {/* KPI 4: Today's Guest */}
            <div className="bg-[#111114] border border-gray-800 rounded-2xl p-5 relative overflow-hidden group hover:border-blue-500/20 transition-all">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-all">
                <Users size={64} className="text-blue-500" />
              </div>
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">{isZh ? '今日訪客申請總數' : 'Guest Registrations'}</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-mono text-purple-400">{guestRequests.length + 81}</span>
                <span className="text-[10px] text-purple-400 font-bold font-mono">
                  {guestRequests.filter(g => g.status === 'rejected' || g.status === 'blocked').length} {isZh ? '筆阻斷' : 'Denied'}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 mt-2">{isZh ? 'Captive Portal 認證審核佇列' : 'Dynamic transient accounts'}</p>
            </div>

            {/* KPI 5: Active Sessions */}
            <div className="bg-[#111114] border border-gray-800 rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-500/20 transition-all">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-all">
                <Lock size={64} className="text-emerald-500" />
              </div>
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">{isZh ? '即時在線連線會話' : 'Active Sessions'}</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-mono text-emerald-400">{activeSessions.length + 348}</span>
                <span className="px-1.5 py-0.5 bg-green-500/10 text-green-400 text-[8px] font-black rounded uppercase tracking-widest">{isZh ? '可一鍵踢除' : 'ONLINE'}</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-2">{isZh ? 'RFC 3576 CoA 踢除通道就緒' : 'Radius Session Teardown Ready'}</p>
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

          {/* Sub-area: Real-time Alerts Streams and Multi-Action Containment */}
          <div className="bg-[#111114] border border-gray-800 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <h4 className="text-xs font-black uppercase text-gray-200 tracking-widest">{isZh ? 'PacketFence 異常事件即時監控與阻斷處置' : 'Active PacketFence IDS / MAC Anomalies & Rapid Blocking'}</h4>
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
                        
                        {alert.status && alert.status !== 'active' && (
                          <span className={cn(
                            "px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-widest font-mono",
                            alert.status === 'isolated' ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                            alert.status === 'blocked' ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                            "bg-gray-800 text-gray-400"
                          )}>
                            {alert.status === 'isolated' ? (isZh ? '已隔離' : 'ISOLATED') :
                             alert.status === 'blocked' ? (isZh ? '已完全阻斷' : 'BLOCKED') : alert.status}
                          </span>
                        )}

                        {/* Interactive matching node link label */}
                        <span className="text-[10px] text-gray-400 font-mono font-bold">IP: {alert.ip} / MAC: {alert.mac}</span>
                      </div>
                      <p className="text-xs text-gray-300 font-medium leading-relaxed mt-1">
                        {alert.message}
                      </p>
                    </div>

                    {/* Quick containment & blocking button actions */}
                    <div className="flex flex-wrap gap-2 shrink-0 w-full md:w-auto justify-end">
                      {/* Action 1: Isolate */}
                      <button 
                        onClick={() => handleIsolateAlert(alert)}
                        className="py-1.5 px-3 bg-amber-600/90 hover:bg-amber-600 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-lg shadow-amber-900/10"
                        title="Isolate host to VLAN 99 Quarantine"
                      >
                        <Lock size={11} />
                        {isZh ? '一鍵隔離 (VLAN 99)' : 'Isolate (VLAN 99)'}
                      </button>

                      {/* Action 2: Full Block */}
                      <button 
                        onClick={() => handleBlockAlert(alert)}
                        className="py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-lg shadow-red-900/20"
                        title="Permanently block host across RADIUS and Switch"
                      >
                        <Ban size={11} />
                        {isZh ? '一鍵阻斷 (Access-Reject)' : 'Block Host (Ban)'}
                      </button>

                      {/* Action 3: Dismiss */}
                      <button 
                        onClick={() => handleDismissAlert(alert.id)}
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
          
          {/* Sub Navigation Bar for management with 4 tabs including Blocklist */}
          <div className="flex border-b border-gray-800 pb-0 bg-[#111114] px-4 pt-4 rounded-xl border flex-wrap">
            {[
              { id: 'nodes', label: isZh ? '節點與設備管理 (Nodes)' : 'Nodes & Devices', icon: <Laptop size={13} /> },
              { id: 'guests', label: isZh ? '使用者與訪客稽核 (Guests)' : 'Guest Approval Desk', icon: <UserCheck size={13} /> },
              { id: 'sessions', label: isZh ? '即時連線會話 (Active Sessions)' : 'Active RADIUS Sessions', icon: <Wifi size={13} /> },
              { id: 'blocklist', label: isZh ? '黑名單與阻斷隔離池 (Blocklist)' : 'Blocklist & Quarantine', icon: <Ban size={13} /> }
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
                    {isZh ? '同步自 PacketFence PostgreSQL 主資料庫，支援實時隔離、永久阻斷與 VLAN 切換' : 'Real-time database sync mapping MAC profiles, RADIUS history, and blocking states'}
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
                      <th className="p-4 text-center">{isZh ? '阻斷與控制操作' : 'CONTAINMENT ACTIONS'}</th>
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
                              node.status === 'Quarantine' ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse" :
                              node.status === 'Blocked' ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                              "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                            )}>
                              {node.status === 'Blocked' ? (isZh ? '已完全阻斷' : 'BLOCKED') :
                               node.status === 'Quarantine' ? (isZh ? '隔離檢疫中' : 'QUARANTINE') : node.status}
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
                              
                              {/* Containment action buttons */}
                              {node.status === 'Blocked' ? (
                                <button 
                                  onClick={() => handleRestoreNode(node.mac)}
                                  className="px-2.5 py-1 bg-green-950/40 text-green-400 hover:bg-green-600 hover:text-white font-black text-[9px] rounded uppercase transition-all flex items-center gap-1"
                                >
                                  <Check size={10} />
                                  {isZh ? '解除阻斷' : 'Unblock'}
                                </button>
                              ) : node.status === 'Quarantine' ? (
                                <>
                                  <button 
                                    onClick={() => handleRestoreNode(node.mac)}
                                    className="px-2.5 py-1 bg-green-950/40 text-green-400 hover:bg-green-600 hover:text-white font-black text-[9px] rounded uppercase transition-all"
                                  >
                                    {isZh ? '解除隔離' : 'Restore'}
                                  </button>
                                  <button 
                                    onClick={() => handleBlockNode(node.mac, 'Escalated to Full Network Block from Quarantine')}
                                    className="px-2.5 py-1 bg-red-950/40 text-red-400 hover:bg-red-600 hover:text-white font-black text-[9px] rounded uppercase transition-all flex items-center gap-1"
                                  >
                                    <Ban size={10} />
                                    {isZh ? '升級阻斷' : 'Block'}
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button 
                                    onClick={() => handleIsolateNode(node.mac, 'Administrative isolation from nodes console')}
                                    className="px-2 py-1 bg-amber-950/40 text-amber-400 hover:bg-amber-600 hover:text-white font-black text-[9px] rounded uppercase transition-all"
                                  >
                                    {isZh ? '隔離' : 'Isolate'}
                                  </button>
                                  <button 
                                    onClick={() => handleBlockNode(node.mac, 'Direct administrative block from nodes console')}
                                    className="px-2 py-1 bg-red-950/40 text-red-400 hover:bg-red-600 hover:text-white font-black text-[9px] rounded uppercase transition-all flex items-center gap-1"
                                  >
                                    <Ban size={10} />
                                    {isZh ? '阻斷' : 'Block'}
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>

              {/* Node Detail Drawer Modal Panel */}
              {selectedNode && (
                <div className="fixed inset-y-0 right-0 z-50 bg-[#0c0c0e] border-l border-gray-800 w-full sm:w-[480px] p-6 shadow-2xl overflow-y-auto animate-in slide-in-from-right flex flex-col justify-between">
                  
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                      <div>
                        <span className="px-2 py-0.5 bg-gray-900 border border-gray-800 rounded text-[8px] font-black text-gray-500 uppercase tracking-widest block mb-1">
                          {isZh ? 'PacketFence 節點診斷與阻斷面板' : 'PacketFence Node Diagnostics & Blocking Panel'}
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

                    {/* Change VLAN Actions & Blocking Triggers */}
                    <div className="bg-red-600/5 border border-red-500/10 p-4 rounded-xl space-y-4">
                      <h5 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <Sliders size={12} className="text-red-500" />
                        {isZh ? '控制動作與阻斷處置操作' : 'VLAN Modification & Enforcement Actions'}
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
                            <option value="99">{isZh ? 'VLAN 99 (隔離檢疫網區 - Quarantine)' : 'VLAN 99 (Quarantine Network)'}</option>
                          </select>
                        </div>

                        <div className="flex items-end">
                          <button
                            onClick={() => handleChangeVlan(selectedNode.mac, vlanToChange)}
                            className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded text-[9px] uppercase font-black tracking-widest transition-colors"
                          >
                            {isZh ? '切換並生效 VLAN' : 'Change VLAN'}
                          </button>
                        </div>
                      </div>

                      {/* Multi-Enforcement Action Group */}
                      <div className="space-y-2 pt-2 border-t border-gray-800/80">
                        {/* Power disconnect action */}
                        <button
                          onClick={() => handleCoaDisconnect(selectedNode.mac)}
                          className="w-full py-2.5 bg-black border border-red-500/30 hover:bg-red-500/10 text-red-400 hover:text-white rounded text-[9px] uppercase font-black tracking-wider transition-all flex items-center justify-center gap-1.5"
                        >
                          <Zap size={12} />
                          {isZh ? '強制登出 (RADIUS CoA Disconnect)' : 'RADIUS CoA Disconnect'}
                        </button>

                        {/* Full Blacklist Block action */}
                        <button
                          onClick={() => handleBlockNode(selectedNode.mac, 'Manual zero-trust enforcement from node drawer')}
                          className="w-full py-2.5 bg-red-950/40 border border-red-500/50 hover:bg-red-600 text-red-300 hover:text-white rounded text-[9px] uppercase font-black tracking-wider transition-all flex items-center justify-center gap-1.5"
                        >
                          <Ban size={12} />
                          {isZh ? '永久阻斷黑名單 (Access-Reject / Drop)' : 'Block & Blacklist MAC'}
                        </button>

                        {/* Physical Port Shutdown action */}
                        <button
                          onClick={() => handlePortShutdown(selectedNode.switchIp, selectedNode.switchPort, selectedNode.mac)}
                          className="w-full py-2.5 bg-black border border-gray-700 hover:border-red-500 hover:bg-red-950/20 text-gray-300 hover:text-red-400 rounded text-[9px] uppercase font-black tracking-wider transition-all flex items-center justify-center gap-1.5"
                        >
                          <PowerOff size={12} />
                          {isZh ? `實體連接埠斷線 (Switch Port Shutdown: ${selectedNode.switchPort})` : `Shutdown Port (${selectedNode.switchPort})`}
                        </button>
                      </div>
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
              
              {/* Approval interactive desk (left) */}
              <div className="lg:col-span-8 bg-[#111114] border border-gray-800 rounded-2xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800/60 pb-3">
                  <div className="space-y-1">
                    <h3 className="text-xs font-black uppercase text-gray-200 tracking-wider">
                      {isZh ? '臨時研討會與訪客臨時註冊審核 (含黑名單阻斷)' : 'Captive Portal Visitor Desk & Access Denial'}
                    </h3>
                    <p className="text-[10px] text-gray-500">
                      {isZh ? '管理通過簡訊(SMS)/條款認證之臨時對象帳號，可執行核准、拒絕或永久黑名單阻斷。' : 'Dynamic transient accounts triggered over SMS queues with instant blacklisting capabilities.'}
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
                                req.status === 'blocked' ? "text-red-500 font-black" :
                                "text-yellow-400 animate-pulse"
                              )}>
                                {isZh 
                                  ? (req.status === 'approved' ? '已核准 (Approved)' : req.status === 'blocked' ? '已永久阻斷 (Blocked)' : req.status === 'rejected' ? '已拒絕 (Rejected)' : '待審核 (Pending)') 
                                  : req.status}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0 self-end sm:self-center">
                          {req.status === 'pending' ? (
                            <>
                              {/* Approve */}
                              <button 
                                onClick={() => handleGuestApproval(req.id, true)}
                                className="py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1"
                              >
                                <CheckCircle2 size={11} />
                                {isZh ? '核准並送憑證' : 'Approve & Dispatch'}
                              </button>

                              {/* Reject */}
                              <button 
                                onClick={() => handleGuestApproval(req.id, false, false)}
                                className="py-1.5 px-3 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-400 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                              >
                                {isZh ? '拒絕' : 'Deny'}
                              </button>

                              {/* Reject & Block */}
                              <button 
                                onClick={() => handleGuestApproval(req.id, false, true)}
                                className="py-1.5 px-3 bg-red-950/40 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1"
                                title="Reject and permanently block applicant phone and account"
                              >
                                <Ban size={11} />
                                {isZh ? '拒絕並加入黑名單阻斷' : 'Deny & Block'}
                              </button>
                            </>
                          ) : (
                            <span className={cn(
                              "px-3 py-1 text-[10px] font-black border rounded uppercase",
                              req.status === 'approved' ? "bg-green-950/30 text-green-400 border-green-500/20" :
                              req.status === 'blocked' ? "bg-red-950/40 text-red-400 border-red-500/30" :
                              "bg-black text-gray-500 border-gray-800"
                            )}>
                              {isZh ? (req.status === 'approved' ? '已核准發照' : req.status === 'blocked' ? '已列入黑名單' : '已完成審核') : req.status}
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
                    {isZh ? '此清單列出已通過認證並被分配 IP 地區的主機會話，可執行單純踢除或踢除並立即阻斷設備。' : 'RADIUS Live authenticated tuples actively sending internet streams, supporting RFC 3576 disconnect and instant block.'}
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
                      <th className="p-4 text-center">{isZh ? '踢除與阻斷操作' : 'ADMIN DISCONNECT & BLOCK'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50 bg-black/20">
                    {activeSessions
                      .filter(s => s.account.toLowerCase().includes(searchSession.toLowerCase()) || s.mac.toLowerCase().includes(searchSession.toLowerCase()))
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
                            <div className="flex items-center justify-center gap-2">
                              {/* Option 1: Disconnect */}
                              <button
                                onClick={() => handleDisconnectSession(session.id, session.mac, false)}
                                className="py-1 px-3 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20 text-[9px] font-black uppercase rounded transition-all"
                              >
                                {isZh ? '踢除會話' : 'Disconnect'}
                              </button>

                              {/* Option 2: Kick & Block */}
                              <button
                                onClick={() => handleDisconnectSession(session.id, session.mac, true)}
                                className="py-1 px-3 bg-red-950/40 hover:bg-red-700 text-red-300 hover:text-white border border-red-500/30 text-[9px] font-black uppercase rounded transition-all flex items-center gap-1"
                                title="Kill active session and permanently block this MAC"
                              >
                                <Ban size={10} />
                                {isZh ? '踢除並立即阻斷 MAC' : 'Kick & Block MAC'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub Content: Section 4. Blocklist & Quarantine Pool */}
          {managementSubTab === 'blocklist' && (
            <div className="bg-[#111114] border border-gray-800 rounded-2xl p-6 space-y-6">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800/60 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="p-1 bg-red-600/20 text-red-500 rounded border border-red-500/30">
                      <Ban size={14} />
                    </span>
                    <h3 className="text-xs font-black uppercase text-red-400 tracking-wider">
                      {isZh ? '全域黑名單與阻斷隔離池 (Active Blocklist & Quarantine Pool)' : 'Active Blocklist & Quarantine Pool'}
                    </h3>
                  </div>
                  <p className="text-[10px] text-gray-500">
                    {isZh 
                      ? '集中管理所有被 RADIUS Access-Reject、實體交換器埠 Shutdown、VLAN 99 隔離檢疫或防火牆封鎖的主機、MAC 位址與訪客帳號。' 
                      : 'Central repository of all quarantined hosts, RADIUS access-rejected MACs, and blacklisted entities.'}
                  </p>
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-2.5 text-gray-500 w-4 h-4" />
                  <input
                    type="text"
                    value={searchBlocklist}
                    onChange={(e) => setSearchBlocklist(e.target.value)}
                    placeholder={isZh ? "搜尋黑名單目標或原因..." : "Search Target or Reason..."}
                    className="w-full bg-black/40 border border-gray-800 rounded-xl pl-9 pr-4 py-2 text-xs font-bold text-white outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Quick Manual Block Toolbar */}
              <form onSubmit={handleManualBlock} className="bg-black/40 border border-gray-800 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                    <PlusCircle size={12} className="text-red-500" />
                    {isZh ? '手動下發立即阻斷 (Manual Quick Block)' : 'Manual Quick Block Dispatch'}
                  </span>
                  <span className="text-[9px] text-gray-500 font-mono">Real-time RADIUS + Switch ACL Injection</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      required
                      value={manualBlockTarget}
                      onChange={(e) => setManualBlockTarget(e.target.value)}
                      placeholder={isZh ? "輸入 MAC (如 AA:BB:CC:DD:EE:FF) 或 IP / 帳號..." : "MAC or IP or Account..."}
                      className="w-full bg-[#0c0c0e] border border-gray-800 rounded-lg px-3 py-2 text-white font-mono font-bold outline-none focus:border-red-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <select
                      value={manualBlockType}
                      onChange={(e) => setManualBlockType(e.target.value as any)}
                      className="w-full bg-[#0c0c0e] border border-gray-800 rounded-lg px-3 py-2 text-gray-300 font-bold outline-none"
                    >
                      <option value="mac">MAC 位址</option>
                      <option value="ip">IP 位址</option>
                      <option value="account">帳號 / 手機</option>
                    </select>
                  </div>

                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      value={manualBlockReason}
                      onChange={(e) => setManualBlockReason(e.target.value)}
                      placeholder={isZh ? "阻斷原因 (例：零信任違規 / 惡意程式連線)..." : "Block Reason..."}
                      className="w-full bg-[#0c0c0e] border border-gray-800 rounded-lg px-3 py-2 text-gray-300 outline-none focus:border-red-500"
                    />
                  </div>

                  <div className="sm:col-span-2 flex items-center">
                    <button
                      type="submit"
                      className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-red-900/20"
                    >
                      <Ban size={12} />
                      {isZh ? '執行阻斷' : 'Enforce Block'}
                    </button>
                  </div>
                </div>
              </form>

              {/* Blocklist Table */}
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left font-mono text-xs border text-gray-300 border-gray-800/60 rounded-xl overflow-hidden divide-y divide-gray-800">
                  <thead className="bg-[#0c0c0e] text-gray-400 text-[10px] font-black uppercase tracking-wider">
                    <tr>
                      <th className="p-4">{isZh ? '阻斷目標' : 'TARGET'}</th>
                      <th className="p-4">{isZh ? '類型' : 'TYPE'}</th>
                      <th className="p-4">{isZh ? '阻斷狀態' : 'STATUS'}</th>
                      <th className="p-4">{isZh ? '已下發處置措施' : 'ENFORCED ACTIONS'}</th>
                      <th className="p-4">{isZh ? '阻斷原因與來源' : 'REASON & SOURCE'}</th>
                      <th className="p-4">{isZh ? '時間 / 有效期' : 'TIMESTAMP / TTL'}</th>
                      <th className="p-4 text-center">{isZh ? '解鎖操作' : 'REVOKE ACTION'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50 bg-black/20">
                    {blocklist
                      .filter(b => {
                        const term = searchBlocklist.toLowerCase();
                        return (
                          b.target.toLowerCase().includes(term) ||
                          b.reason.toLowerCase().includes(term) ||
                          b.source.toLowerCase().includes(term)
                        );
                      })
                      .map((entry, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-4 font-bold text-white selection:bg-red-500">
                            <span className="block">{entry.target}</span>
                            {entry.switchIp && (
                              <span className="text-[9px] text-gray-500 block font-normal">{entry.switchIp} : {entry.switchPort}</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 bg-gray-900 border border-gray-800 text-gray-300 rounded text-[9px] uppercase font-bold">
                              {entry.targetType}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest block w-max",
                              entry.status === 'blocked' ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                              "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            )}>
                              {entry.status === 'blocked' ? (isZh ? '永久阻斷' : 'BLOCKED') : (isZh ? '隔離檢疫中' : 'QUARANTINE')}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="space-y-1">
                              {entry.enforcedActions.map((act, aidx) => (
                                <span key={aidx} className="block text-[9.5px] text-gray-400 flex items-center gap-1">
                                  <span className="w-1 h-1 bg-red-500 rounded-full shrink-0" />
                                  {act}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-gray-200 block font-medium">{entry.reason}</span>
                            <span className="text-[9px] text-purple-400 block uppercase font-mono">[{entry.source}]</span>
                          </td>
                          <td className="p-4 text-gray-400 text-[10px]">
                            <div>{entry.timestamp}</div>
                            <div className="text-amber-400 font-bold">{entry.expiresAt}</div>
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleRemoveBlocklistEntry(entry.id, entry.target)}
                              className="py-1 px-3 bg-green-950/40 hover:bg-green-600 text-green-400 hover:text-white border border-green-500/30 text-[9px] font-black uppercase rounded transition-all flex items-center justify-center gap-1 mx-auto"
                            >
                              <Check size={10} />
                              {isZh ? '解除阻斷' : 'Unblock / Revoke'}
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
                  { id: 'rules', label: isZh ? '存取策略與角色集 (Rules)' : 'Connection Rules', icon: <Sliders size={14} />, desc: isZh ? 'Visual If/Then 決策與阻斷鏈' : 'If-Then prioritizing builder' },
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
                  setIsRulesDirty(false);
                  setIsAuthDirty(false);
                  setIsPortalDirty(false);
                  setIsSwitchesDirty(false);
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
