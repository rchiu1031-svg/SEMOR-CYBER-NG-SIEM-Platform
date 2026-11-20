import React from 'react';
import { ExecutiveDashboardView } from '../executive/ExecutiveDashboardView';

export interface ComplianceCenterViewProps {
  setActiveTab?: (tab: string) => void;
}

export function ComplianceCenterView({ setActiveTab }: ComplianceCenterViewProps) {
  return (
    <ExecutiveDashboardView
      setActiveTab={setActiveTab || (() => {})}
      initialSection="compliance"
    />
  );
}

export default ComplianceCenterView;
