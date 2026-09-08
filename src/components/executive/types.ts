export type ExecutiveTimeRange = '7d' | '30d' | '90d' | '365d';

export type ExecutivePersona = 'ciso' | 'ceo' | 'cfo' | 'board';

export interface BusinessServiceHealth {
  id: string;
  name: string;
  category: string;
  tier: 'Tier-1 Mission Critical' | 'Tier-2 Business Core' | 'Tier-3 Operational';
  availability: number; // e.g. 99.99
  status: 'optimal' | 'warning' | 'degraded';
  activeThreatsBlocked: number;
  rtoMinutes: number; // Recovery Time Objective
  rpoMinutes: number; // Recovery Point Objective
  lastStressTest: string;
}

export interface DepartmentRisk {
  id: string;
  name: string;
  code: string;
  head: string;
  headcount: number;
  riskScore: number; // 0-100
  incidentCount: number;
  trend: 'up' | 'down' | 'stable';
  topRiskFactor: string;
  mfaAdoptionRate: number; // percentage
  trainingRate: number; // percentage
  assetCriticality: 'Very High' | 'High' | 'Medium';
}

export interface FinancialCyberRisk {
  annualizedLossExpectancy: number; // USD
  potentialValueAtRisk: number; // USD (95% VaR)
  lossAvoidanceSavings: number; // USD saved by automated defenses
  cyberInsuranceLimit: number; // USD
  cyberInsuranceDeductible: number; // USD
  costPerIncidentAverted: number; // USD
  roiPercentage: number;
  industryPeerAvgVaR: number; // USD
}

export interface StrategicRoadmapItem {
  id: string;
  title: string;
  domain: string;
  progress: number; // 0-100
  targetQuarter: string;
  status: 'on_track' | 'at_risk' | 'completed' | 'planned';
  owner: string;
  budgetUtilized: number; // USD
  budgetTotal: number; // USD
  description: string;
}

export interface ExecutiveApprovalItem {
  id: string;
  title: string;
  category: 'Network Isolation' | 'Credential Revocation' | 'Cloud Quarantine' | 'SaaS Interception';
  urgency: 'critical' | 'high' | 'medium';
  requestedBy: string;
  requestedAt: string;
  expiresInHours: number;
  description: string;
  businessImpact: string;
  affectedEntities: string[];
  status: 'pending' | 'approved' | 'rejected';
}

export interface ExecutiveTrendDataPoint {
  date: string;
  attacksDetected: number;
  threatsNeutralized: number;
  mttdMinutes: number;
  mttrMinutes: number;
  riskIndex: number;
  lossesPreventedUsd: number;
}
