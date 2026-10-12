import React, { useState, useEffect } from 'react';
import { CaseManagementHeader } from './CaseManagementHeader';
import { CaseListView } from './CaseListView';
import { CaseDetailWarRoom } from './CaseDetailWarRoom';
import { CaseCreateModal } from './CaseCreateModal';
import { CaseActionConfirmModal } from './CaseActionConfirmModal';
import { CaseStudioAdminView } from './CaseStudioAdminView';
import { 
  CaseIncident, 
  CaseFilterState, 
  CaseStatus, 
  CaseCustomField, 
  LayoutBlockConfig, 
  SLAPolicyStage, 
  CaseConfigVersion,
  IngestionMapping 
} from './types';
import { 
  INITIAL_CASES, 
  INITIAL_CUSTOM_FIELDS, 
  INITIAL_LAYOUT_BLOCKS, 
  INITIAL_SLA_STAGES, 
  INITIAL_VERSIONS,
  INITIAL_INGESTION_MAPPINGS
} from './caseManagementData';

export const CaseManagementView: React.FC = () => {
  // Navigation / Mode State
  const [currentMode, setCurrentMode] = useState<'workspace' | 'studio'>('workspace');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  // Incidents Data State
  const [cases, setCases] = useState<CaseIncident[]>(INITIAL_CASES);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filter State
  const [filterState, setFilterState] = useState<CaseFilterState>({
    status: 'all',
    severity: 'all',
    category: 'all',
    assignee: 'all',
    timeRange: 'all',
    searchQuery: '',
    onlyMyCases: false
  });

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [actionModalState, setActionModalState] = useState<{
    isOpen: boolean;
    caseItem: CaseIncident | null;
    actionType: string;
  }>({
    isOpen: false,
    caseItem: null,
    actionType: 'quarantine'
  });

  // Studio Admin Config States
  const [customFields, setCustomFields] = useState<CaseCustomField[]>(INITIAL_CUSTOM_FIELDS);
  const [layoutBlocks, setLayoutBlocks] = useState<LayoutBlockConfig[]>(INITIAL_LAYOUT_BLOCKS);
  const [slaStages, setSlaStages] = useState<SLAPolicyStage[]>(INITIAL_SLA_STAGES);
  const [ingestionMappings, setIngestionMappings] = useState<IngestionMapping[]>(INITIAL_INGESTION_MAPPINGS);
  const [versions, setVersions] = useState<CaseConfigVersion[]>(INITIAL_VERSIONS);

  // Fetch initial data from backend API
  const fetchCasesAndConfig = async () => {
    try {
      setIsLoading(true);
      const [casesRes, configRes] = await Promise.all([
        fetch('/api/v1/cases').then(r => r.json()).catch(() => null),
        fetch('/api/v1/cases/studio/config').then(r => r.json()).catch(() => null)
      ]);

      if (casesRes?.success && Array.isArray(casesRes.cases)) {
        setCases(casesRes.cases);
      }
      if (configRes?.success && configRes.config) {
        const c = configRes.config;
        if (c.customFields) setCustomFields(c.customFields);
        if (c.layoutBlocks) setLayoutBlocks(c.layoutBlocks);
        if (c.slaStages) setSlaStages(c.slaStages);
        if (c.ingestionMappings) setIngestionMappings(c.ingestionMappings);
        if (c.versions) setVersions(c.versions);
      }
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to fetch cases from backend:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCasesAndConfig();
  }, []);

  // Filter Logic
  const filteredCases = cases.filter((c) => {
    if (filterState.severity !== 'all' && c.severity !== filterState.severity) return false;
    if (filterState.status !== 'all' && c.status !== filterState.status) return false;
    if (filterState.category !== 'all' && c.category !== filterState.category) return false;
    if (filterState.onlyMyCases && !c.assignee.name.includes('Warren') && !c.assignee.name.includes('張維倫')) return false;

    if (filterState.searchQuery.trim()) {
      const q = filterState.searchQuery.toLowerCase();
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchCaseNum = c.caseNumber.toLowerCase().includes(q);
      const matchDesc = c.description.toLowerCase().includes(q);
      const matchAssets = c.affectedAssets?.some(a => a.name.toLowerCase().includes(q) || a.ip.includes(q));
      const matchIoc = c.observables?.some(o => o.value.toLowerCase().includes(q));
      const matchMitre = c.mitreTactics?.some(m => m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q));
      return matchTitle || matchCaseNum || matchDesc || matchAssets || matchIoc || matchMitre;
    }

    return true;
  });

  const selectedCase = cases.find(c => c.id === selectedCaseId) || null;

  // Handlers
  const handleFilterChange = (newFilters: Partial<CaseFilterState>) => {
    setFilterState(prev => ({ ...prev, ...newFilters }));
  };

  const handleQuickStatusChange = async (caseId: string, newStatus: CaseStatus) => {
    // Optimistic UI update
    setCases(prev => prev.map(c => {
      if (c.id === caseId) {
        return {
          ...c,
          status: newStatus,
          updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
          timeline: [
            {
              id: `tl-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString(),
              type: 'Status Change',
              author: '張維倫 (Warren C.)',
              content: `案件狀態由「${c.status}」更新為「${newStatus}」`,
              status: 'Success'
            },
            ...c.timeline
          ]
        };
      }
      return c;
    }));

    try {
      const res = await fetch(`/api/v1/cases/${caseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success && data.caseItem) {
        setCases(prev => prev.map(c => c.id === caseId ? data.caseItem : c));
      }
    } catch (err) {
      console.error(`Failed to update status for case ${caseId}:`, err);
    }
  };

  const handleCreateCase = async (newCaseData: Partial<CaseIncident>) => {
    try {
      const res = await fetch('/api/v1/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCaseData)
      });
      const data = await res.json();
      if (data.success && data.caseItem) {
        setCases(prev => [data.caseItem, ...prev]);
        setSelectedCaseId(data.caseItem.id);
      } else {
        // Fallback local creation
        const newCaseNumber = `INC-2026-${1015 + cases.length}`;
        const fallbackCase: CaseIncident = {
          id: `inc-${Date.now()}`,
          caseNumber: newCaseNumber,
          title: newCaseData.title || '新增資安通報案件',
          description: newCaseData.description || '由分析師手動立案。',
          severity: newCaseData.severity || 'High',
          status: 'New',
          category: newCaseData.category || 'Ransomware',
          sourceEngine: newCaseData.sourceEngine || 'TheHive SIRP',
          assignee: {
            id: 'usr-01',
            name: '張維倫 (Warren C.)',
            role: '資深 L2 資安鑑識專家',
            email: 'warren.c@semor.security',
            avatarBg: 'bg-purple-600'
          },
          createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
          updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
          sla: {
            stage: 'Triage',
            stageDeadline: new Date(Date.now() + 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19),
            remainingMinutes: 60,
            totalMinutes: 60,
            isBreached: false
          },
          affectedAssets: newCaseData.affectedAssets || [],
          affectedUsers: [],
          mitreTactics: [
            { id: 'T1059', name: '惡意指令行執行', technique: 'Command Execution', tactic: 'Execution', color: '#ef4444' }
          ],
          observables: newCaseData.observables || [],
          timeline: [
            {
              id: `tl-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString(),
              type: 'Alert',
              author: '張維倫 (Warren C.)',
              content: `手動通報立案 ${newCaseNumber}，SLA 倒數計時開始。`,
              status: 'Success'
            }
          ],
          attackGraph: {
            nodes: [
              { id: 'n-target', label: newCaseData.affectedAssets?.[0]?.name || 'Target Host', type: 'asset', status: 'At Risk' }
            ],
            edges: []
          },
          warRoomNotes: [
            {
              id: `wn-${Date.now()}`,
              author: '系統通知',
              role: 'TheHive SIRP',
              time: new Date().toLocaleTimeString(),
              text: `案件 ${newCaseNumber} 已建立，指派分析師進行初步資產盤點與分流。`,
              isAutomatedBot: true
            }
          ],
          tags: newCaseData.tags || ['Manual-Created']
        };
        setCases(prev => [fallbackCase, ...prev]);
        setSelectedCaseId(fallbackCase.id);
      }
    } catch (err) {
      console.error('Failed to create case:', err);
    }
  };

  const handleOpenActionModal = (caseItem: CaseIncident, actionType: string) => {
    setActionModalState({
      isOpen: true,
      caseItem,
      actionType
    });
  };

  const handleConfirmAction = async (actionType: string, note: string) => {
    if (!actionModalState.caseItem) return;
    const targetCaseId = actionModalState.caseItem.id;

    try {
      const res = await fetch(`/api/v1/cases/${targetCaseId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionType, note, analystName: '張維倫 (Warren C.)' })
      });
      const data = await res.json();
      if (data.success && data.caseItem) {
        setCases(prev => prev.map(c => c.id === targetCaseId ? data.caseItem : c));
        return;
      }
    } catch (err) {
      console.error('Failed to execute action on backend:', err);
    }

    // Local fallback if offline
    setCases(prev => prev.map(c => {
      if (c.id === targetCaseId) {
        let actionDesc = '執行 SOAR 應變動作';
        if (actionType === 'quarantine') actionDesc = '主機網路層級微隔離 (EDR Host Isolation)';
        if (actionType === 'block_ip') actionDesc = '周邊防火牆 IP 全域阻斷 (Perimeter Drop)';
        if (actionType === 'revoke_token') actionDesc = '作廢 Session Token 與強制登出';
        if (actionType === 'memory_dump') actionDesc = 'Velociraptor 記憶體鑑識傾印';

        const updatedAssets = actionType === 'quarantine' 
          ? c.affectedAssets.map(a => ({ ...a, status: 'Isolated' as const }))
          : c.affectedAssets;

        const updatedObservables = actionType === 'block_ip'
          ? c.observables.map(o => ({ ...o, actionTaken: '周邊防火牆已全網阻斷' }))
          : c.observables;

        const updatedUsers = actionType === 'revoke_token'
          ? c.affectedUsers.map(u => ({ ...u, mfaStatus: 'Revoked' as const }))
          : c.affectedUsers;

        return {
          ...c,
          status: 'In Remediation',
          affectedAssets: updatedAssets,
          observables: updatedObservables,
          affectedUsers: updatedUsers,
          updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
          timeline: [
            {
              id: `tl-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString(),
              type: 'Action Executed',
              author: 'SOAR 處置引擎',
              content: `成功執行: ${actionDesc}`,
              details: note ? `分析師備註: ${note}` : undefined,
              status: 'Success'
            },
            ...c.timeline
          ],
          warRoomNotes: [
            ...c.warRoomNotes,
            {
              id: `wn-${Date.now()}`,
              author: 'SOAR 處置機器人',
              role: 'Remediation Bot',
              time: new Date().toLocaleTimeString(),
              text: `已成功對受影響標的下發指令「${actionDesc}」${note ? ` (備註: ${note})` : ''}。`,
              isAutomatedBot: true
            }
          ]
        };
      }
      return c;
    }));
  };

  const handleAddWarRoomNote = async (noteText: string) => {
    if (!selectedCaseId) return;

    try {
      const res = await fetch(`/api/v1/cases/${selectedCaseId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: noteText,
          author: '張維倫 (Warren C.)',
          role: '資深 L2 鑑識專家',
          avatarColor: 'bg-purple-600'
        })
      });
      const data = await res.json();
      if (data.success && data.note) {
        setCases(prev => prev.map(c => {
          if (c.id === selectedCaseId) {
            return {
              ...c,
              warRoomNotes: [...c.warRoomNotes, data.note],
              updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
            };
          }
          return c;
        }));
        return;
      }
    } catch (err) {
      console.error('Failed to post note to backend:', err);
    }

    // Local fallback
    setCases(prev => prev.map(c => {
      if (c.id === selectedCaseId) {
        const newNote = {
          id: `wn-${Date.now()}`,
          author: '張維倫 (Warren C.)',
          role: '資深 L2 鑑識專家',
          time: new Date().toLocaleTimeString(),
          text: noteText,
          isAutomatedBot: false,
          avatarColor: 'bg-purple-600'
        };
        return {
          ...c,
          warRoomNotes: [...c.warRoomNotes, newNote],
          updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
        };
      }
      return c;
    }));
  };

  const handleExportReport = async () => {
    try {
      const res = await fetch('/api/v1/cases/export/csv');
      const csvText = await res.text();
      const encodedUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csvText);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `SEMOR_Incidents_Report_${new Date().toISOString().substring(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      // Local fallback
      const csvContent = "data:text/csv;charset=utf-8," + 
        ["CaseNumber,Title,Severity,Status,Category,CreatedAt,Assignee",
         ...cases.map(c => `"${c.caseNumber}","${c.title}","${c.severity}","${c.status}","${c.category}","${c.createdAt}","${c.assignee.name}"`)
        ].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `SEMOR_Incidents_Report_${new Date().toISOString().substring(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleRefresh = () => {
    fetchCasesAndConfig();
  };

  // Studio Admin Handlers with Backend Sync
  const handleSaveCustomFields = async (fields: CaseCustomField[]) => {
    setCustomFields(fields);
    try {
      await fetch('/api/v1/cases/studio/custom-fields', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
      });
    } catch (err) {
      console.error('Failed to sync custom fields:', err);
    }
  };

  const handleSaveLayoutBlocks = async (blocks: LayoutBlockConfig[]) => {
    setLayoutBlocks(blocks);
    try {
      await fetch('/api/v1/cases/studio/layout-blocks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks })
      });
    } catch (err) {
      console.error('Failed to sync layout blocks:', err);
    }
  };

  const handleSaveSlaStages = async (stages: SLAPolicyStage[]) => {
    setSlaStages(stages);
    try {
      await fetch('/api/v1/cases/studio/sla-stages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stages })
      });
    } catch (err) {
      console.error('Failed to sync SLA stages:', err);
    }
  };

  const handleSaveIngestionMappings = async (mappings: IngestionMapping[]) => {
    setIngestionMappings(mappings);
    try {
      await fetch('/api/v1/cases/studio/ingestion-mappings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mappings })
      });
    } catch (err) {
      console.error('Failed to sync ingestion mappings:', err);
    }
  };

  const handleRevertVersion = async (versionId: string) => {
    setVersions(prev => prev.map(v => ({
      ...v,
      status: v.id === versionId ? 'Active' : 'Historical'
    })));
    try {
      await fetch(`/api/v1/cases/studio/versions/${versionId}/revert`, { method: 'POST' });
    } catch (err) {
      console.error('Failed to revert version:', err);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1750px] mx-auto min-h-screen text-gray-100">
      {/* Top Header & Metrics */}
      <CaseManagementHeader
        currentMode={currentMode}
        onChangeMode={(mode) => {
          setCurrentMode(mode);
          if (mode === 'studio') setSelectedCaseId(null);
        }}
        cases={cases}
        filterState={filterState}
        onFilterChange={handleFilterChange}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onExportReport={handleExportReport}
        onRefresh={handleRefresh}
        lastRefreshed={lastRefreshed}
      />

      {/* Primary Content Router */}
      {currentMode === 'workspace' ? (
        selectedCase ? (
          /* Incident War Room Detail */
          <CaseDetailWarRoom
            caseItem={selectedCase}
            onBack={() => setSelectedCaseId(null)}
            onUpdateStatus={(newStatus) => handleQuickStatusChange(selectedCase.id, newStatus)}
            onOpenActionModal={handleOpenActionModal}
            onAddNote={handleAddWarRoomNote}
          />
        ) : (
          /* Case Triage & Kanban List */
          <CaseListView
            cases={filteredCases}
            selectedCaseId={selectedCaseId}
            onSelectCase={(id) => setSelectedCaseId(id)}
            onQuickStatusChange={handleQuickStatusChange}
            onOpenActionModal={handleOpenActionModal}
          />
        )
      ) : (
        /* Case Studio & Schema Customizer */
        <CaseStudioAdminView
          customFields={customFields}
          onSaveCustomFields={handleSaveCustomFields}
          layoutBlocks={layoutBlocks}
          onSaveLayoutBlocks={handleSaveLayoutBlocks}
          slaStages={slaStages}
          onSaveSlaStages={handleSaveSlaStages}
          ingestionMappings={ingestionMappings}
          onSaveIngestionMappings={handleSaveIngestionMappings}
          versions={versions}
          onRevertVersion={handleRevertVersion}
        />
      )}

      {/* Create Incident Modal */}
      <CaseCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateCase={handleCreateCase}
      />

      {/* Action Execution Confirmation Modal */}
      <CaseActionConfirmModal
        isOpen={actionModalState.isOpen}
        onClose={() => setActionModalState(prev => ({ ...prev, isOpen: false }))}
        caseItem={actionModalState.caseItem}
        actionType={actionModalState.actionType}
        onConfirmAction={handleConfirmAction}
      />
    </div>
  );
};

export default CaseManagementView;
