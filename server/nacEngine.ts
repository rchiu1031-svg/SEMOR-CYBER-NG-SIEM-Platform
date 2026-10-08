/**
 * Network Access Control (NAC) Engine - PacketFence & 802.1X Dynamic Enforcement
 * Handles:
 * - Dynamic Node Identity, DHCP Fingerprinting, Compliance & State Machine
 * - Real-time Threat Containment & Multi-Layer Blocking:
 *    1. RADIUS 802.1X Access-Reject / CoA Disconnect (RFC 3576)
 *    2. Switch Port Isolation / VLAN 99 Quarantine
 *    3. Switch Hardware Port Shutdown (SNMP / CLI emulation)
 *    4. Dynamic Firewall Blacklisting (IP / MAC Layer 2/3 Drop)
 * - Guest Credential Lifecycle & Denial/Block Enforcement
 * - Active Session Teardown & Host Block
 * - Visual Connection Profiles / ACL Rule Evaluation
 */

export interface NodeDevice {
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
  postureScore?: number;
  fingerprint?: {
    dhcpVendor: string;
    userAgent: string;
    ttl: number;
  };
}

export interface GuestRequest {
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

export interface ActiveSession {
  id: string;
  account: string;
  mac: string;
  ip: string;
  duration: string;
  traffic: string;
  authSource: string;
  vlan: number;
}

export interface AlertEvent {
  id: string;
  time: string;
  type: string;
  severity: 'high' | 'medium' | 'low';
  mac: string;
  ip: string;
  message: string;
  status: 'active' | 'isolated' | 'blocked' | 'dismissed';
}

export interface ConnectionProfileRule {
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
  defaultVlan?: number;
}

export interface BlocklistEntry {
  id: string;
  target: string;
  targetType: 'mac' | 'ip' | 'account';
  status: 'blocked' | 'quarantined';
  reason: string;
  source: 'alert_containment' | 'manual_admin' | 'guest_rejection' | 'session_disconnect' | 'compliance_fail' | 'rule_enforcement';
  enforcedActions: string[];
  timestamp: string;
  expiresAt: string;
  switchIp?: string;
  switchPort?: string;
  vlan?: number;
}

export interface SwitchPortConfig {
  port: string;
  status: 'up' | 'down' | 'blocked';
  vlan: number;
  connectedMac?: string;
  speed: string;
}

export interface SwitchConfig {
  id: string;
  ip: string;
  name: string;
  brand: string;
  snmpCommunity: string;
  radiusSecret: string;
  status: 'online' | 'offline';
  enableCoa?: boolean;
  coaPort?: number;
  ports?: SwitchPortConfig[];
}

export class NacEngine {
  private nodes: Map<string, NodeDevice> = new Map();
  private alerts: Map<string, AlertEvent> = new Map();
  private guestRequests: Map<string, GuestRequest> = new Map();
  private activeSessions: Map<string, ActiveSession> = new Map();
  private rules: Map<string, ConnectionProfileRule> = new Map();
  private switches: Map<string, SwitchConfig> = new Map();
  private blocklist: Map<string, BlocklistEntry> = new Map();
  private auditLog: Array<{ timestamp: string; action: string; target: string; operator: string; details: string }> = [];

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // 1. Initial Nodes
    const initialNodes: NodeDevice[] = [
      { mac: 'E0:DB:55:6C:12:3A', ip: '10.120.10.99', os: 'Windows', status: 'Registered', owner: 'chiur@ke-la.com', lastSeen: '2026-06-16 20:31:02', switchIp: '10.120.1.254', switchPort: 'GigabitEthernet1/12', vlan: 10, postureScore: 95 },
      { mac: '00:1A:2B:3C:4D:5E', ip: '10.120.10.45', os: 'Linux', status: 'Registered', owner: 'guest_service', lastSeen: '2026-06-16 20:28:44', switchIp: '10.120.1.254', switchPort: 'GigabitEthernet1/15', vlan: 50, postureScore: 88 },
      { mac: '70:88:6B:A2:3F:11', ip: '10.120.90.112', os: 'iOS', status: 'Quarantine', owner: 'finance.john', lastSeen: '2026-06-16 20:15:34', switchIp: '10.120.1.253', switchPort: 'GigabitEthernet1/4', vlan: 99, postureScore: 42, blockReason: 'iOS version outdated compliance failure' },
      { mac: '3C:07:54:E9:10:8F', ip: '10.120.10.101', os: 'macOS', status: 'Registered', owner: 'dev.linda', lastSeen: '2026-06-16 19:45:12', switchIp: '10.120.1.254', switchPort: 'GigabitEthernet1/1', vlan: 10, postureScore: 92 },
      { mac: '5A:45:90:3C:99:BC', ip: '10.120.100.8', os: 'IoT', status: 'Unregistered', owner: 'Unknown', lastSeen: '2026-06-16 19:42:01', switchIp: '10.120.1.251', switchPort: 'FastEthernet0/12', vlan: 1, postureScore: 60 },
      { mac: '90:B6:86:1C:88:7A', ip: '10.120.50.32', os: 'Android', status: 'Registered', owner: 'guest_guest1', lastSeen: '2026-06-16 18:22:10', switchIp: '10.120.1.252', switchPort: 'AP-Guest-02', vlan: 50, postureScore: 80 }
    ];
    initialNodes.forEach(n => this.nodes.set(n.mac.toUpperCase(), n));

    // 2. Initial Alerts
    const initialAlerts: AlertEvent[] = [
      { id: 'a1', time: '20:30:12', type: 'MAC Spoofing', severity: 'high', mac: '00:1A:2B:3C:4D:5E', ip: '10.120.10.45', message: 'MAC Address is claimed by different vendor signatures than mapped history.', status: 'active' },
      { id: 'a2', time: '20:15:34', type: 'Compliance Failed', severity: 'medium', mac: '70:88:6B:A2:3F:11', ip: '10.120.90.112', message: 'Corporate iPad failed compliance checker: iOS version 15.2 is outdated.', status: 'isolated' },
      { id: 'a3', time: '19:42:01', type: 'Rogue Device', severity: 'high', mac: '5A:45:90:3C:99:BC', ip: '10.120.100.8', message: 'Unknown IoT hub registered on Switch port FastEthernet0/12 (VLAN 1).', status: 'active' },
      { id: 'a4', time: '18:50:11', type: 'Malware DNS Activity', severity: 'high', mac: 'E0:DB:55:6C:12:3A', ip: '10.120.10.99', message: 'Suricata IDS signature triggered: command and control callback DNS pattern detected.', status: 'active' }
    ];
    initialAlerts.forEach(a => this.alerts.set(a.id, a));

    // 3. Initial Guest Requests
    const initialGuests: GuestRequest[] = [
      { id: '1', account: 'guest_jane', name: 'Jane Wu', phone: '+886 912 345 678', email: 'jane.wu@partner.com', duration: '24 Hours', status: 'pending', requestTime: '2026-06-16 19:12' },
      { id: '2', account: 'guest_thomas', name: 'Thomas Mueller', phone: '+886 987 654 321', email: 'thomas.m@consultant.org', duration: '7 Days', status: 'pending', requestTime: '2026-06-16 18:40' },
      { id: '3', account: 'guest_sharon', name: 'Sharon Lee', phone: '+886 911 223 344', email: 'v-sharon@contractor.com', duration: '12 Hours', status: 'approved', requestTime: '2026-06-16 14:02' }
    ];
    initialGuests.forEach(g => this.guestRequests.set(g.id, g));

    // 4. Initial Active Sessions
    const initialSessions: ActiveSession[] = [
      { id: 's1', account: 'chiur@ke-la.com', mac: 'E0:DB:55:6C:12:3A', ip: '10.120.10.99', duration: '02h 41m', traffic: '1.45 GB', authSource: 'Active Directory AD-01', vlan: 10 },
      { id: 's2', account: 'dev.linda', mac: '3C:07:54:E9:10:8F', ip: '10.120.10.101', duration: '08h 15m', traffic: '4.89 GB', authSource: 'Active Directory AD-01', vlan: 10 },
      { id: 's3', account: 'guest_sharon', mac: '90:B6:86:1C:88:7A', ip: '10.120.50.32', duration: '01h 05m', traffic: '320 MB', authSource: 'Captive Portal SMS', vlan: 50 }
    ];
    initialSessions.forEach(s => this.activeSessions.set(s.id, s));

    // 5. Initial Connection Profile Rules
    const initialRules: ConnectionProfileRule[] = [
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
    ];
    initialRules.forEach(r => this.rules.set(r.id, r));

    // 6. Initial Switches
    const initialSwitches: SwitchConfig[] = [
      { 
        id: 'sw1', 
        ip: '10.120.1.254', 
        name: 'Main Campus FortiSwitch_1', 
        brand: 'Fortinet', 
        snmpCommunity: 'pf_snmp_sec', 
        radiusSecret: '•••••••••••••••••', 
        status: 'online',
        enableCoa: true,
        coaPort: 3799,
        ports: [
          { port: 'GigabitEthernet1/1', status: 'up', vlan: 10, connectedMac: '3C:07:54:E9:10:8F', speed: '1000Mbps' },
          { port: 'GigabitEthernet1/12', status: 'up', vlan: 10, connectedMac: 'E0:DB:55:6C:12:3A', speed: '1000Mbps' },
          { port: 'GigabitEthernet1/15', status: 'up', vlan: 50, connectedMac: '00:1A:2B:3C:4D:5E', speed: '1000Mbps' }
        ]
      },
      { 
        id: 'sw2', 
        ip: '10.120.1.253', 
        name: 'Server Area Distribution Cisco_C9300', 
        brand: 'Cisco', 
        snmpCommunity: 'pf_snmp_sec', 
        radiusSecret: '•••••••••••••••••', 
        status: 'online',
        enableCoa: true,
        coaPort: 3799,
        ports: [
          { port: 'GigabitEthernet1/4', status: 'up', vlan: 99, connectedMac: '70:88:6B:A2:3F:11', speed: '1000Mbps' }
        ]
      },
      { 
        id: 'sw3', 
        ip: '10.120.1.251', 
        name: 'Lobby Edge Aruba_2930F', 
        brand: 'Aruba', 
        snmpCommunity: 'pf_snmp_public', 
        radiusSecret: '•••••••••••••••••', 
        status: 'online',
        enableCoa: true,
        coaPort: 3799,
        ports: [
          { port: 'FastEthernet0/12', status: 'up', vlan: 1, connectedMac: '5A:45:90:3C:99:BC', speed: '100Mbps' }
        ]
      }
    ];
    initialSwitches.forEach(s => this.switches.set(s.id, s));

    // 7. Initial Blocklist / Quarantine Pool
    const initialBlocklist: BlocklistEntry[] = [
      {
        id: 'blk-1',
        target: '70:88:6B:A2:3F:11',
        targetType: 'mac',
        status: 'quarantined',
        reason: 'iOS 15.2 Outdated Endpoint Compliance Failure',
        source: 'compliance_fail',
        enforcedActions: ['Switch VLAN 99 Isolation', 'RFC 3576 RADIUS CoA Redirect', 'Remediation Captive Portal Active'],
        timestamp: '2026-06-16 20:15:34',
        expiresAt: 'Until Patched',
        switchIp: '10.120.1.253',
        switchPort: 'GigabitEthernet1/4',
        vlan: 99
      }
    ];
    initialBlocklist.forEach(b => this.blocklist.set(b.id, b));
  }

  // ==================== GETTERS ====================
  public getAllNodes(): NodeDevice[] {
    return Array.from(this.nodes.values());
  }

  public getNodeByMac(mac: string): NodeDevice | undefined {
    return this.nodes.get(mac.toUpperCase());
  }

  public getAllAlerts(): AlertEvent[] {
    return Array.from(this.alerts.values());
  }

  public getAllGuestRequests(): GuestRequest[] {
    return Array.from(this.guestRequests.values());
  }

  public getAllActiveSessions(): ActiveSession[] {
    return Array.from(this.activeSessions.values());
  }

  public getAllRules(): ConnectionProfileRule[] {
    return Array.from(this.rules.values());
  }

  public getAllSwitches(): SwitchConfig[] {
    return Array.from(this.switches.values());
  }

  public getBlocklist(): BlocklistEntry[] {
    return Array.from(this.blocklist.values());
  }

  public getAuditLogs() {
    return this.auditLog.slice(-100);
  }

  public getMetrics() {
    const nodes = this.getAllNodes();
    const quarantined = nodes.filter(n => n.status === 'Quarantine').length;
    const blocked = nodes.filter(n => n.status === 'Blocked').length;
    const registered = nodes.filter(n => n.status === 'Registered').length;
    const unregistered = nodes.filter(n => n.status === 'Unregistered').length;
    const blocklistCount = this.blocklist.size;
    const sessions = this.activeSessions.size;

    return {
      totalNodes: nodes.length + 1242,
      registeredNodes: registered + 1242,
      quarantinedNodes: quarantined,
      blockedNodes: blocked,
      unregisteredNodes: unregistered,
      activeSessionsCount: sessions + 348,
      pendingGuests: Array.from(this.guestRequests.values()).filter(g => g.status === 'pending').length,
      totalBlocklistEntries: blocklistCount,
      radiusFailRate: 1.21,
      coreStatus: 'healthy',
      version: 'PacketFence v12.2.0 (Dual-Stack RADIUS/REST)'
    };
  }

  // ==================== BLOCKING & CONTAINMENT ACTIONS ====================

  /**
   * 1. Isolate Node (VLAN 99 Quarantine)
   * Dispatches RFC 3576 CoA Disconnect to switch and reallocates host to Quarantine VLAN 99.
   */
  public isolateNode(mac: string, reason = 'Administrative isolation policy enforcement') {
    const formattedMac = mac.toUpperCase();
    let node = this.nodes.get(formattedMac);
    
    if (!node) {
      node = {
        mac: formattedMac,
        ip: '0.0.0.0',
        os: 'Windows',
        status: 'Quarantine',
        owner: 'system_auto_isolated',
        lastSeen: new Date().toISOString().replace('T', ' ').substring(0, 19),
        switchIp: '10.120.1.254',
        switchPort: 'GigabitEthernet1/12',
        vlan: 99,
        blockReason: reason
      };
      this.nodes.set(formattedMac, node);
    } else {
      node.status = 'Quarantine';
      node.vlan = 99;
      node.blockReason = reason;
      node.blockedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
    }

    // Terminate any active sessions
    this.terminateSessionsForMac(formattedMac);

    // Add or update blocklist/quarantine entry
    const entryId = `iso-${formattedMac.replace(/:/g, '')}`;
    const blockEntry: BlocklistEntry = {
      id: entryId,
      target: formattedMac,
      targetType: 'mac',
      status: 'quarantined',
      reason,
      source: 'alert_containment',
      enforcedActions: [
        'VLAN 99 Quarantine Allocation',
        'RFC 3576 RADIUS CoA Disconnect Packet Dispatched',
        'Captive Remediation Portal Redirect (Port 443)',
        'Egress Internet Flow Blocked'
      ],
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      expiresAt: 'Pending Remediation',
      switchIp: node.switchIp,
      switchPort: node.switchPort,
      vlan: 99
    };
    this.blocklist.set(entryId, blockEntry);

    // Update corresponding alert status if any
    for (const alert of this.alerts.values()) {
      if (alert.mac.toUpperCase() === formattedMac && alert.status === 'active') {
        alert.status = 'isolated';
      }
    }

    this.auditLog.push({
      timestamp: new Date().toISOString(),
      action: 'ISOLATE_NODE',
      target: formattedMac,
      operator: 'admin',
      details: `Node isolated to VLAN 99 on switch ${node.switchIp}:${node.switchPort}. Reason: ${reason}`
    });

    return {
      success: true,
      mac: formattedMac,
      status: 'Quarantine',
      vlan: 99,
      switchIp: node.switchIp,
      switchPort: node.switchPort,
      coaStatus: 'RFC 3576 Disconnect-ACK received from NAS',
      message: `Node ${formattedMac} successfully isolated to Quarantine VLAN 99. RADIUS CoA Disconnect dispatched.`
    };
  }

  /**
   * 2. Full Block / Blacklist Node (Access-Reject & Port Down & Firewall Drop)
   * Completely bans the MAC from the network.
   */
  public blockNode(mac: string, reason = 'Zero-Trust Policy Violation / Malware Threat', source: BlocklistEntry['source'] = 'manual_admin') {
    const formattedMac = mac.toUpperCase();
    let node = this.nodes.get(formattedMac);

    if (!node) {
      node = {
        mac: formattedMac,
        ip: '0.0.0.0',
        os: 'Windows',
        status: 'Blocked',
        owner: 'blacklisted_entity',
        lastSeen: new Date().toISOString().replace('T', ' ').substring(0, 19),
        switchIp: '10.120.1.254',
        switchPort: 'Port-Blocked',
        vlan: 999,
        blockReason: reason,
        blockedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };
      this.nodes.set(formattedMac, node);
    } else {
      node.status = 'Blocked';
      node.vlan = 999;
      node.blockReason = reason;
      node.blockedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
    }

    // Terminate any active sessions immediately
    this.terminateSessionsForMac(formattedMac);

    // Enforce port state on switch
    if (node.switchIp && node.switchPort) {
      this.setSwitchPortState(node.switchIp, node.switchPort, 'blocked');
    }

    // Add entry into global blocklist
    const entryId = `blk-${formattedMac.replace(/:/g, '')}`;
    const blockEntry: BlocklistEntry = {
      id: entryId,
      target: formattedMac,
      targetType: 'mac',
      status: 'blocked',
      reason,
      source,
      enforcedActions: [
        'RADIUS 802.1X Access-Reject (Permanent Drop)',
        'Switch Port Physical Teardown / Admin Disabled',
        'RFC 3576 CoA Kill Disconnect Packet',
        'Next-Gen Firewall MAC/IP Blacklist Rule Injected',
        'DHCP NAK Response Configured'
      ],
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      expiresAt: 'Permanent (Admin Revocation Required)',
      switchIp: node.switchIp,
      switchPort: node.switchPort,
      vlan: 999
    };
    this.blocklist.set(entryId, blockEntry);

    // Mark alerts as blocked
    for (const alert of this.alerts.values()) {
      if (alert.mac.toUpperCase() === formattedMac) {
        alert.status = 'blocked';
      }
    }

    this.auditLog.push({
      timestamp: new Date().toISOString(),
      action: 'BLOCK_NODE',
      target: formattedMac,
      operator: 'admin',
      details: `Node completely blocked. RADIUS Access-Reject enforced, switch port disabled. Reason: ${reason}`
    });

    return {
      success: true,
      mac: formattedMac,
      status: 'Blocked',
      vlan: 999,
      actionsEnforced: blockEntry.enforcedActions,
      message: `Node ${formattedMac} is now completely blocked across RADIUS 802.1X, Switch Port, and Firewall drop tables.`
    };
  }

  /**
   * 3. Restore / Un-quarantine / Unblock Node
   * Brings node back to registered state and safe VLAN 10
   */
  public restoreNode(mac: string, targetVlan = 10) {
    const formattedMac = mac.toUpperCase();
    const node = this.nodes.get(formattedMac);

    if (node) {
      node.status = 'Registered';
      node.vlan = targetVlan;
      delete node.blockReason;
      delete node.blockedAt;

      // Re-enable switch port if was blocked
      if (node.switchIp && node.switchPort) {
        this.setSwitchPortState(node.switchIp, node.switchPort, 'up');
      }
    }

    // Remove from blocklist
    for (const [id, entry] of this.blocklist.entries()) {
      if (entry.target.toUpperCase() === formattedMac) {
        this.blocklist.delete(id);
      }
    }

    // Trigger CoA to let user re-authenticate
    this.auditLog.push({
      timestamp: new Date().toISOString(),
      action: 'RESTORE_NODE',
      target: formattedMac,
      operator: 'admin',
      details: `Node restored to Registered status on VLAN ${targetVlan}. Blocklist record removed.`
    });

    return {
      success: true,
      mac: formattedMac,
      status: 'Registered',
      vlan: targetVlan,
      message: `Node ${formattedMac} successfully restored to operational network (VLAN ${targetVlan}).`
    };
  }

  /**
   * 4. Change VLAN dynamically (With auto-quarantine detection if VLAN 99)
   */
  public changeNodeVlan(mac: string, vlan: number) {
    const formattedMac = mac.toUpperCase();
    let node = this.nodes.get(formattedMac);

    if (!node) {
      throw new Error(`Node with MAC ${mac} not found in database`);
    }

    node.vlan = vlan;
    if (vlan === 99) {
      node.status = 'Quarantine';
      this.isolateNode(formattedMac, 'Assigned to Quarantine VLAN 99 via VLAN Reallocation');
    } else if (node.status === 'Quarantine' && vlan !== 99) {
      node.status = 'Registered';
      // Remove quarantine blocklist
      for (const [id, entry] of this.blocklist.entries()) {
        if (entry.target.toUpperCase() === formattedMac && entry.status === 'quarantined') {
          this.blocklist.delete(id);
        }
      }
    }

    this.auditLog.push({
      timestamp: new Date().toISOString(),
      action: 'VLAN_CHANGE',
      target: formattedMac,
      operator: 'admin',
      details: `VLAN updated to ${vlan} for switch ${node.switchIp} port ${node.switchPort}`
    });

    return {
      success: true,
      mac: formattedMac,
      vlan,
      status: node.status,
      message: `Successfully shifted host ${formattedMac} to VLAN ${vlan}. Dispatched RFC 3576 CoA to ${node.switchIp}.`
    };
  }

  /**
   * 5. Disconnect Host / CoA Disconnect (RFC 3576)
   */
  public disconnectNode(mac: string) {
    const formattedMac = mac.toUpperCase();
    const node = this.nodes.get(formattedMac);
    this.terminateSessionsForMac(formattedMac);

    this.auditLog.push({
      timestamp: new Date().toISOString(),
      action: 'COA_DISCONNECT',
      target: formattedMac,
      operator: 'admin',
      details: `Dispatched RFC 3576 Disconnect-Request for MAC ${formattedMac}`
    });

    return {
      success: true,
      mac: formattedMac,
      switchIp: node?.switchIp || '10.120.1.254',
      message: `RFC 3576 RADIUS Disconnect-Request sent to NAS ${node?.switchIp || '10.120.1.254'}. Host disconnected.`
    };
  }

  /**
   * 6. Guest Approval or Rejection/Blocking
   */
  public handleGuestRequest(id: string, isApprove: boolean, blockApplicant = false, reason = 'Administrative guest rejection') {
    const guest = this.guestRequests.get(id);
    if (!guest) {
      throw new Error(`Guest request #${id} not found`);
    }

    if (isApprove) {
      guest.status = 'approved';
      this.auditLog.push({
        timestamp: new Date().toISOString(),
        action: 'GUEST_APPROVE',
        target: guest.account,
        operator: 'admin',
        details: `Approved guest access for ${guest.name} (${guest.phone})`
      });

      return {
        success: true,
        guest,
        message: `Account ${guest.account} approved. Transient credentials dispatched to ${guest.phone}.`
      };
    } else {
      guest.status = blockApplicant ? 'blocked' : 'rejected';
      guest.rejectionReason = reason;

      if (blockApplicant) {
        // Enforce in blocklist
        const blkId = `guest-blk-${guest.id}`;
        this.blocklist.set(blkId, {
          id: blkId,
          target: guest.account,
          targetType: 'account',
          status: 'blocked',
          reason: `Guest Application Rejected & Blocked: ${reason}`,
          source: 'guest_rejection',
          enforcedActions: ['Captive Portal Registration Blocked', 'Phone Number Blacklist Added'],
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          expiresAt: 'Permanent'
        });
      }

      this.auditLog.push({
        timestamp: new Date().toISOString(),
        action: blockApplicant ? 'GUEST_BLOCK' : 'GUEST_REJECT',
        target: guest.account,
        operator: 'admin',
        details: `Guest application ${blockApplicant ? 'blocked' : 'rejected'}. Reason: ${reason}`
      });

      return {
        success: true,
        guest,
        isBlocked: blockApplicant,
        message: blockApplicant 
          ? `Guest ${guest.account} rejected and permanently blocked from portal registration.`
          : `Guest ${guest.account} registration request denied.`
      };
    }
  }

  /**
   * 7. Active Session Disconnect & Optional MAC Blacklisting
   */
  public disconnectSession(sessionId: string, blockMac = false, reason = 'Operator triggered session teardown') {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ID ${sessionId} not found or already terminated`);
    }

    const sessionMac = session.mac;
    this.activeSessions.delete(sessionId);

    let blockResult = null;
    if (blockMac) {
      blockResult = this.blockNode(sessionMac, reason, 'session_disconnect');
    }

    this.auditLog.push({
      timestamp: new Date().toISOString(),
      action: blockMac ? 'SESSION_KILL_AND_BLOCK' : 'SESSION_KILL',
      target: sessionMac,
      operator: 'admin',
      details: `Session ${sessionId} terminated for account ${session.account}. Host blocked: ${blockMac}`
    });

    return {
      success: true,
      sessionId,
      mac: sessionMac,
      account: session.account,
      isBlocked: blockMac,
      blockResult,
      message: blockMac 
        ? `Session for ${session.account} killed and host MAC ${sessionMac} blocked completely from network.`
        : `Issued RFC 3576 Disconnect-Request. Active session for MAC ${sessionMac} forcefully terminated.`
    };
  }

  /**
   * 8. Switch Port Shutdown (Physical Layer 2 Block)
   */
  public shutdownSwitchPort(switchIp: string, port: string, reason = 'Administrative switch port shutdown') {
    this.setSwitchPortState(switchIp, port, 'blocked');

    // Find node connected to this port and block/quarantine it
    for (const node of this.nodes.values()) {
      if (node.switchIp === switchIp && node.switchPort === port) {
        node.status = 'Blocked';
        this.terminateSessionsForMac(node.mac);
      }
    }

    this.auditLog.push({
      timestamp: new Date().toISOString(),
      action: 'SWITCH_PORT_SHUTDOWN',
      target: `${switchIp}:${port}`,
      operator: 'admin',
      details: `Physical switch port administrative shutdown executed. Reason: ${reason}`
    });

    return {
      success: true,
      switchIp,
      port,
      status: 'down',
      message: `Executed SNMP/CLI port shutdown on ${switchIp} (${port}). Port link state is now DISABLED.`
    };
  }

  /**
   * 9. Dismiss Alert
   */
  public dismissAlert(alertId: string) {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.status = 'dismissed';
      return { success: true, message: `Alert ${alertId} dismissed.` };
    }
    return { success: false, message: 'Alert not found' };
  }

  /**
   * 10. Manual Quick Block Target (IP, MAC, or Account)
   */
  public manualBlockTarget(target: string, targetType: 'mac' | 'ip' | 'account', reason: string) {
    if (targetType === 'mac') {
      return this.blockNode(target, reason, 'manual_admin');
    }

    const entryId = `man-blk-${Date.now()}`;
    const entry: BlocklistEntry = {
      id: entryId,
      target,
      targetType,
      status: 'blocked',
      reason,
      source: 'manual_admin',
      enforcedActions: [
        'Firewall L2/L3 Drop Rule Active',
        'RADIUS Access-Reject Rule Synchronized',
        'Captive Portal Blacklisted'
      ],
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      expiresAt: 'Permanent'
    };
    this.blocklist.set(entryId, entry);

    this.auditLog.push({
      timestamp: new Date().toISOString(),
      action: 'MANUAL_BLOCK',
      target,
      operator: 'admin',
      details: `Target ${target} (${targetType}) blocked manually. Reason: ${reason}`
    });

    return {
      success: true,
      entry,
      message: `Target ${target} (${targetType}) successfully added to active Network Access Control blocklist.`
    };
  }

  /**
   * 11. Remove from Blocklist
   */
  public removeBlocklistEntry(id: string) {
    const entry = this.blocklist.get(id);
    if (!entry) {
      throw new Error(`Blocklist entry #${id} not found`);
    }

    if (entry.targetType === 'mac') {
      this.restoreNode(entry.target);
    } else {
      this.blocklist.delete(id);
    }

    this.auditLog.push({
      timestamp: new Date().toISOString(),
      action: 'REMOVE_BLOCKLIST_ENTRY',
      target: entry.target,
      operator: 'admin',
      details: `Revoked blocklist entry for ${entry.target}`
    });

    return {
      success: true,
      message: `Blocklist rule for ${entry.target} revoked. Access privileges restored.`
    };
  }

  // ==================== RULES MANAGEMENT ====================
  public createRule(rule: Omit<ConnectionProfileRule, 'id'>): ConnectionProfileRule {
    const id = `r_${Date.now()}`;
    const newRule: ConnectionProfileRule = { ...rule, id };
    this.rules.set(id, newRule);
    return newRule;
  }

  public updateRule(id: string, updates: Partial<ConnectionProfileRule>): ConnectionProfileRule {
    const rule = this.rules.get(id);
    if (!rule) throw new Error(`Rule ${id} not found`);
    const updated = { ...rule, ...updates };
    this.rules.set(id, updated);
    return updated;
  }

  public deleteRule(id: string): boolean {
    return this.rules.delete(id);
  }

  // ==================== SWITCHES MANAGEMENT ====================
  public addSwitch(sw: Omit<SwitchConfig, 'id'>): SwitchConfig {
    const id = `sw_${Date.now()}`;
    const newSwitch: SwitchConfig = { ...sw, id, status: 'online' };
    this.switches.set(id, newSwitch);
    return newSwitch;
  }

  // ==================== HELPER METHODS ====================
  private terminateSessionsForMac(mac: string) {
    const formattedMac = mac.toUpperCase();
    for (const [id, session] of this.activeSessions.entries()) {
      if (session.mac.toUpperCase() === formattedMac) {
        this.activeSessions.delete(id);
      }
    }
  }

  private setSwitchPortState(switchIp: string, portName: string, state: 'up' | 'down' | 'blocked') {
    for (const sw of this.switches.values()) {
      if (sw.ip === switchIp && sw.ports) {
        for (const p of sw.ports) {
          if (p.port === portName) {
            p.status = state;
          }
        }
      }
    }
  }
}

export const globalNacEngine = new NacEngine();
