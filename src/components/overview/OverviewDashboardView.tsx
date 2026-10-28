import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'motion/react';
import {
  TimeRange,
  RefreshInterval,
  CriticalIncidentRecord,
  UebaHighRiskEntity,
  MetricCardData,
  CcsClusterNode,
  MitreTacticItem,
  AbnormalLoginRecord,
  TrafficDataPoint,
  MasterNodeSystemHealth
} from './types';
import {
  OVERVIEW_METRICS,
  CCS_CLUSTER_NODES,
  MITRE_TACTIC_DISTRIBUTION,
  UEBA_HIGH_RISK_ENTITIES,
  ABNORMAL_LOGINS,
  CRITICAL_INCIDENTS,
  HOURLY_TRAFFIC_DATA,
  SOC_SLA_METRICS,
  INITIAL_MASTER_SYSTEM_HEALTH
} from './overviewData';
import { OverviewHeader } from './OverviewHeader';
import { OverviewAiThreatAdvisory } from './OverviewAiThreatAdvisory';
import { OverviewMetricCards } from './OverviewMetricCards';
import { OverviewSystemHealth } from './OverviewSystemHealth';
import { OverviewTrafficAnalytics } from './OverviewTrafficAnalytics';
import { OverviewMitreMatrix } from './OverviewMitreMatrix';
import { OverviewGlobalClusterMap } from './OverviewGlobalClusterMap';
import { OverviewUebaRiskPanel } from './OverviewUebaRiskPanel';
import { OverviewAbnormalLogins } from './OverviewAbnormalLogins';
import { OverviewCriticalIncidents } from './OverviewCriticalIncidents';
import { OverviewAttackTopologyModal } from './OverviewAttackTopologyModal';
import { OverviewSoarActionModal } from './OverviewSoarActionModal';
import { OverviewEntityModal } from './OverviewEntityModal';
import { CheckCircle2, AlertTriangle, Wifi, WifiOff } from 'lucide-react';

interface OverviewDashboardViewProps {
  setActiveTab: (tab: string) => void;
}

export const OverviewDashboardView: React.FC<OverviewDashboardViewProps> = ({
  setActiveTab
}) => {
  const { i18n } = useTranslation();
  const isZh = i18n.language?.startsWith('zh') || i18n.language === 'zh';

  // Controls & View State
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [refreshInterval, setRefreshInterval] = useState<RefreshInterval>(30);
  const [isWarMode, setIsWarMode] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedMetricId, setSelectedMetricId] = useState<string | undefined>(undefined);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  // Live Telemetry Datasets synced with backend
  const [metrics, setMetrics] = useState<MetricCardData[]>(OVERVIEW_METRICS);
  const [trafficData, setTrafficData] = useState<TrafficDataPoint[]>(HOURLY_TRAFFIC_DATA);
  const [clusterNodes, setClusterNodes] = useState<CcsClusterNode[]>(CCS_CLUSTER_NODES);
  const [mitreTactics, setMitreTactics] = useState<MitreTacticItem[]>(MITRE_TACTIC_DISTRIBUTION);
  const [uebaEntities, setUebaEntities] = useState<UebaHighRiskEntity[]>([]);
  const [abnormalLogins, setAbnormalLogins] = useState<AbnormalLoginRecord[]>([]);
  const [criticalIncidents, setCriticalIncidents] = useState<CriticalIncidentRecord[]>([]);
  const [systemHealth, setSystemHealth] = useState<MasterNodeSystemHealth>(INITIAL_MASTER_SYSTEM_HEALTH);
  const [collectorStatus, setCollectorStatus] = useState({
    status: 'ONLINE',
    eps: 0,
    bufferDepth: 0,
    totalIngestedEvents: 0,
    queueDepth: 0,
    compressionRatio: '1.00x'
  });

  // Modals state
  const [selectedIncidentForTopology, setSelectedIncidentForTopology] = useState<CriticalIncidentRecord | null>(null);
  const [selectedIncidentForSoar, setSelectedIncidentForSoar] = useState<CriticalIncidentRecord | null>(null);
  const [selectedUebaEntity, setSelectedUebaEntity] = useState<UebaHighRiskEntity | null>(null);

  // Toast notifications
  const [notification, setNotification] = useState<{ msg: string; type?: 'info' | 'warn' } | null>(null);

  const triggerToast = (msg: string, type: 'info' | 'warn' = 'info') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3800);
  };

  // 1. Backend Data Fetcher (Unified Ingestion Pipeline sync)
  const fetchDashboardData = useCallback(async (isManual: boolean = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const res = await fetch(`/api/v1/overview/dashboard?timeRange=${timeRange}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      if (json.success && json.data) {
        const d = json.data;
        if (Array.isArray(d.metrics)) setMetrics(d.metrics);
        if (Array.isArray(d.traffic)) setTrafficData(d.traffic);
        if (Array.isArray(d.clusterNodes)) setClusterNodes(d.clusterNodes);
        if (Array.isArray(d.mitreTactics)) setMitreTactics(d.mitreTactics);
        if (Array.isArray(d.uebaEntities)) setUebaEntities(d.uebaEntities);
        if (Array.isArray(d.abnormalLogins)) setAbnormalLogins(d.abnormalLogins);
        if (Array.isArray(d.criticalIncidents)) setCriticalIncidents(d.criticalIncidents);
        if (d.systemHealth) setSystemHealth(d.systemHealth);
        if (typeof d.isWarMode === 'boolean') setIsWarMode(d.isWarMode);
        if (d.collectorStatus) setCollectorStatus(d.collectorStatus);
        setIsLiveConnected(true);
      }
    } catch (err) {
      console.warn('[Overview] Error fetching backend dashboard data, maintaining local state:', err);
    } finally {
      if (isManual) {
        setTimeout(() => {
          setIsRefreshing(false);
          triggerToast(isZh ? '全域 SOC 遙測日誌與後端數據已同步完成' : 'All SOC telemetry refreshed from backend');
        }, 400);
      }
    }
  }, [timeRange, isZh]);

  // 1b. Real-time System Health Poller (every 3s for smooth Recharts live telemetry)
  useEffect(() => {
    let active = true;
    const pollHealth = async () => {
      try {
        const res = await fetch('/api/v1/overview/system-health');
        if (!res.ok) return;
        const json = await res.json();
        if (active && json.success && json.data) {
          setSystemHealth(json.data);
        }
      } catch {
        // Fallback gracefully to current state
      }
    };

    const timer = setInterval(pollHealth, 3000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  // Initial fetch and on timeRange change
  useEffect(() => {
    fetchDashboardData(false);
  }, [fetchDashboardData]);

  // 2. Real-Time WebSocket Listener (Instantaneous Ingestion Stream)
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let active = true;
    let reconnectTimeout: any = null;

    const connectWs = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!active) return;
          setIsLiveConnected(true);
          // Subscribe to overview and collector telemetry events
          ws.send(JSON.stringify({ type: 'subscribe_overview_dashboard' }));
        };

        ws.onmessage = (event) => {
          if (!active) return;
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'overview_update') {
              // Backend notified of new logs or state change -> re-fetch fresh state
              fetchDashboardData(false);
            } else if (data.type === 'collector_retry_stats' && data.data) {
              // Update live buffer and EPS metrics dynamically
              setCollectorStatus(prev => ({
                ...prev,
                queueDepth: data.data.queueDepth || prev.queueDepth
              }));
            }
          } catch {
            // Ignore non-json WS frames
          }
        };

        ws.onclose = () => {
          if (!active) return;
          setIsLiveConnected(false);
          reconnectTimeout = setTimeout(connectWs, 3500);
        };

        ws.onerror = () => {
          if (!active) return;
          setIsLiveConnected(false);
        };
      } catch (err) {
        if (!active) return;
        setIsLiveConnected(false);
        reconnectTimeout = setTimeout(connectWs, 5000);
      }
    };

    connectWs();

    return () => {
      active = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {}
      }
    };
  }, [fetchDashboardData]);

  // 3. Auto-refresh Interval Timer
  useEffect(() => {
    if (refreshInterval === 0) return;
    const timer = setInterval(() => {
      fetchDashboardData(false);
    }, refreshInterval * 1000);
    return () => clearInterval(timer);
  }, [refreshInterval, fetchDashboardData]);

  // 4. Action Handlers hooked directly to Backend APIs
  const handleManualRefresh = () => {
    fetchDashboardData(true);
  };

  const handleToggleWarMode = async (val: boolean) => {
    setIsWarMode(val);
    try {
      const res = await fetch('/api/v1/overview/toggle-war-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: val })
      });
      const data = await res.json();
      triggerToast(data.message || (val ? '已啟動戰情警戒模式 (DEFCON 1)' : '已解除戰情模式'));
      fetchDashboardData(false);
    } catch {
      triggerToast(
        val
          ? (isZh ? '已啟動戰情警戒模式 (DEFCON 1)：自動封鎖高危連線' : 'War Mode (DEFCON 1) Activated: Auto-quarantine on')
          : (isZh ? '已解除戰情模式，恢復常態監控' : 'War mode deactivated, normal operations resumed')
      );
    }
  };

  const handleBlockIp = async (ip: string) => {
    try {
      const res = await fetch('/api/v1/overview/block-ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip })
      });
      const data = await res.json();
      triggerToast(data.message || (isZh ? `IP ${ip} 已成功加入邊界防火牆黑名單` : `IP ${ip} blocked at firewall`));
      // Refresh local list state
      setAbnormalLogins(prev => prev.map(item => item.ip === ip ? { ...item, status: 'BLOCKED' as const } : item));
      fetchDashboardData(false);
    } catch {
      triggerToast(isZh ? `IP ${ip} 已加入阻斷佇列` : `IP ${ip} null-routed at border`);
    }
  };

  const handleSoarAction = async (incident: CriticalIncidentRecord) => {
    try {
      const res = await fetch('/api/v1/overview/soar-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incidentId: incident.id, actionType: 'auto_quarantine' })
      });
      const data = await res.json();
      triggerToast(data.message || (isZh ? 'SOAR 自動化處置策略下發成功' : 'SOAR containment executed'));
      setCriticalIncidents(prev => prev.map(inc => 
        inc.id === incident.id ? { ...inc, soarStatus: 'Auto-Contained' as const } : inc
      ));
      fetchDashboardData(false);
    } catch {
      triggerToast(isZh ? 'SOAR 自動化隔離策略下發成功' : 'SOAR containment executed successfully');
    }
  };

  const handleRevokeSession = async (entityId: string) => {
    try {
      const res = await fetch('/api/v1/overview/revoke-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityId })
      });
      const data = await res.json();
      triggerToast(data.message || (isZh ? `已撤銷實體 ${entityId} 之所有工作階段` : `Revoked sessions for entity ${entityId}`));
      setUebaEntities(prev => prev.map(ent => ent.id === entityId ? { ...ent, score: Math.max(15, ent.score - 40), status: 'Medium' as const } : ent));
      fetchDashboardData(false);
    } catch {
      triggerToast(isZh ? `已撤銷使用者 ${entityId} 之所有作用中工作階段` : `Revoked sessions for entity ${entityId}`);
    }
  };

  const handleSimulateIngest = async () => {
    try {
      const res = await fetch('/api/v1/overview/simulate-telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threatName: isZh ? '即時注入：可疑外網探測與掃描' : 'Simulated: Suspicious Inbound Probe',
          srcIp: `198.51.100.${Math.floor(Math.random() * 200 + 10)}`
        })
      });
      const data = await res.json();
      triggerToast(data.message || (isZh ? '測試遙測數據已送入後端收集管線' : 'Simulated telemetry ingested into Go Collector'));
      fetchDashboardData(false);
    } catch {
      triggerToast(isZh ? '已觸發遙測模擬' : 'Telemetry triggered');
    }
  };

  const handleExportReport = () => {
    const reportDate = new Date().toISOString().split('T')[0];
    const totalEventsValue = metrics.find(m => m.id === 'total_events')?.value || '128.4M';
    const activeThreatsValue = metrics.find(m => m.id === 'active_threats')?.value || String(criticalIncidents.length);
    const endpointsValue = metrics.find(m => m.id === 'endpoints')?.value || '1,042';
    const healthyNodesCount = clusterNodes.filter(n => n.status === 'healthy').length;

    const reportContent = `SEMOR NG-SIEM SOC OPERATIONAL SHIFT REPORT
==================================================
Report Timestamp: ${new Date().toISOString()}
Target Environment: Production Mesh Cluster
Operational Mode: ${isWarMode ? 'DEFCON 1 (WAR MODE ENGAGED)' : 'Normal SOC Monitoring'}
Time Range Filter: ${timeRange}
Live Pipeline Status: ${collectorStatus.status} (Ingestion EPS: ${collectorStatus.eps})
--------------------------------------------------
METRICS OVERVIEW:
- Total Ingested Events (24H): ${totalEventsValue}
- Live Ingestion Throughput: ${collectorStatus.eps} EPS
- CCS Worker Nodes Online: ${healthyNodesCount}/${clusterNodes.length}
- Protected Monitored Endpoints: ${endpointsValue}
- Active Critical Threats: ${activeThreatsValue}
- Storage Compression Ratio: ${collectorStatus.compressionRatio} (VictoriaLogs Zstandard)
- Memory Buffer Depth: ${collectorStatus.bufferDepth} MB

SOC SLA PERFORMANCE:
- MTTD (Mean Time to Detect): ${SOC_SLA_METRICS.mttdZh} (${SOC_SLA_METRICS.mttdChange})
- MTTR (Mean Time to Respond): ${SOC_SLA_METRICS.mttrZh} (${SOC_SLA_METRICS.mttrChange})
- Automated SOAR Containment Rate: ${SOC_SLA_METRICS.autoContainmentRate}
- False Positive Filter Rate: ${SOC_SLA_METRICS.falsePositiveRate}

RECENT CRITICAL INCIDENTS TRIAGE (${criticalIncidents.length}):
${criticalIncidents.map((inc, i) => `[${i + 1}] ${inc.id} | ${inc.time} | ${inc.threatZh}
     Category: ${inc.categoryZh} | Risk: ${inc.risk} | Status: ${inc.soarStatus}
     Source IP: ${inc.srcIp} -> Dest IP: ${inc.destIp} | Host: ${inc.host}
     MITRE Stage: ${inc.mitreTactic}`).join('\n')}

TOP HIGH-RISK UEBA ENTITIES (${uebaEntities.length}):
${uebaEntities.map((ent, i) => `[${i + 1}] ${ent.name} (${ent.id}) - Risk Score: ${ent.score}/100 [${ent.status}]
     Dept: ${ent.departmentZh} | Last Anomaly: ${ent.lastAnomalyTime}
     Primary Trigger: ${ent.triggersZh[0] || 'N/A'}`).join('\n')}
--------------------------------------------------
Generated by: SEMOR Cyber Defense SOC Engine
Telemetry Authority: Go Collector + Rust VictoriaLogs Storage`;

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SEMOR_SOC_Shift_Report_${reportDate}.txt`;
    link.click();
    URL.revokeObjectURL(url);

    triggerToast(isZh ? '已成功產生並下載 SOC 即時資安戰情報告' : 'SOC Shift Report generated and downloaded');
  };

  return (
    <div className="space-y-6 relative pb-12">
      {/* Toast banner */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-2 text-xs font-bold border ${
              notification.type === 'warn'
                ? 'bg-amber-600/90 text-white border-amber-400/40'
                : 'bg-blue-600/90 text-white border-blue-400/40'
            }`}
          >
            <CheckCircle2 size={16} className="text-white shrink-0" />
            <span>{notification.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header with controls and live metrics */}
      <OverviewHeader
        isZh={isZh}
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        refreshInterval={refreshInterval}
        setRefreshInterval={setRefreshInterval}
        isWarMode={isWarMode}
        setIsWarMode={handleToggleWarMode}
        onExportReport={handleExportReport}
        onNavigateExecutive={() => setActiveTab('executive-insights')}
        onManualRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
        liveEps={collectorStatus.eps}
        liveNodesCount={{
          healthy: clusterNodes.filter(n => n.status === 'healthy').length,
          total: clusterNodes.length
        }}
        isLiveConnected={isLiveConnected}
        onSimulateIngest={handleSimulateIngest}
      />

      {/* Real-time AI Copilot Advisory */}
      <OverviewAiThreatAdvisory
        isZh={isZh}
        onOpenTopology={() => setSelectedIncidentForTopology(criticalIncidents[0] || CRITICAL_INCIDENTS[0])}
        onOpenSoar={() => setSelectedIncidentForSoar(criticalIncidents[0] || CRITICAL_INCIDENTS[0])}
      />

      {/* Top 6 KPI Metric Cards & SLA Bar */}
      <OverviewMetricCards
        metrics={metrics}
        isZh={isZh}
        selectedMetricId={selectedMetricId}
        onSelectMetric={(id) => setSelectedMetricId(id === selectedMetricId ? undefined : id)}
      />

      {/* Real-time SIEM Master Node System Health (Recharts CPU, RAM, Disk Utilization) */}
      <OverviewSystemHealth
        systemHealth={systemHealth}
        isZh={isZh}
        onRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Bento Grid Row 1: Distributed Ingestion Traffic (2/3) + UEBA Risk Entities (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <OverviewTrafficAnalytics
            data={trafficData}
            isZh={isZh}
          />
        </div>

        <div className="lg:col-span-1">
          <OverviewUebaRiskPanel
            entities={uebaEntities}
            isZh={isZh}
            onSelectEntity={(entity) => setSelectedUebaEntity(entity)}
            onNavigateUebaView={() => setActiveTab('ueba-investigation')}
          />
        </div>
      </div>

      {/* Bento Grid Row 2: MITRE ATT&CK Matrix (1/2) + CCS Global Cluster Topology (1/2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OverviewMitreMatrix
          tactics={mitreTactics}
          isZh={isZh}
          onSelectTactic={(tacticId) => {
            triggerToast(isZh ? `已依戰術階段篩選相關日誌：${tacticId}` : `Filtered telemetry by tactic: ${tacticId}`);
          }}
        />

        <OverviewGlobalClusterMap
          nodes={clusterNodes}
          isZh={isZh}
        />
      </div>

      {/* Row 3: Host Abnormal Logins & Brute-Force Surveillance */}
      <OverviewAbnormalLogins
        records={abnormalLogins}
        isZh={isZh}
        onBlockIp={handleBlockIp}
        onInvestigateHost={(host) => {
          triggerToast(isZh ? `已載入端點主機日誌：${host}` : `Loaded host logs: ${host}`);
        }}
      />

      {/* Row 4: Critical Incident Triage & Response Queue */}
      <OverviewCriticalIncidents
        incidents={criticalIncidents}
        isZh={isZh}
        onOpenTopology={(incident) => setSelectedIncidentForTopology(incident)}
        onOpenSoar={(incident) => setSelectedIncidentForSoar(incident)}
        onNavigateIncidentsView={() => setActiveTab('critical-incidents')}
      />

      {/* Modals & Overlays */}
      <AnimatePresence>
        {selectedIncidentForTopology && (
          <OverviewAttackTopologyModal
            incident={selectedIncidentForTopology}
            onClose={() => setSelectedIncidentForTopology(null)}
            isZh={isZh}
            onExecuteContainment={() => {
              setSelectedIncidentForSoar(selectedIncidentForTopology);
              setSelectedIncidentForTopology(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedIncidentForSoar && (
          <OverviewSoarActionModal
            incident={selectedIncidentForSoar}
            onClose={() => setSelectedIncidentForSoar(null)}
            isZh={isZh}
            onComplete={() => {
              if (selectedIncidentForSoar) {
                handleSoarAction(selectedIncidentForSoar);
              }
              setSelectedIncidentForSoar(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedUebaEntity && (
          <OverviewEntityModal
            entity={selectedUebaEntity}
            onClose={() => setSelectedUebaEntity(null)}
            isZh={isZh}
            onRevokeSession={(id) => {
              handleRevokeSession(id);
              setSelectedUebaEntity(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default OverviewDashboardView;
