export type PageId =
  | 'dashboard'
  | 'predictive-analytics'
  | 'crime-risk-map'
  | 'complaints'
  | 'transactions'
  | 'network-graph'
  | 'risk-prioritization'
  | 'model-performance'
  | 'alerts'
  | 'reports'
  | 'settings';

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type ComplaintStatus =
  | 'Open'
  | 'Under Investigation'
  | 'Mule Traced'
  | 'Account Frozen'
  | 'Escalated';

export type DataSourceMode = 'demo' | 'backend';

export type ThemePreference = 'dark' | 'light' | 'system';
export type ResolvedTheme = 'dark' | 'light';

export interface GlobalDriver {
  factor: string;
  percentage: number; // All drivers for a zone strictly sum to 100
  description: string;
}

export interface ScoreFactor {
  label: string;
  contribution: string;
  impact: 'High' | 'Medium' | 'Low';
  detail: string;
}

export interface PredictedLocation {
  id: string;
  zoneName: string;
  city: string;
  state: string;
  district: string;
  atmCluster: string;
  lat: number;
  lng: number;
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  predictionConfidence: number; // 0-100%
  withdrawalProbability: number; // 0-100%
  predictedWindow: string;
  dateCategory: '24h' | '7d' | '30d';
  complaintVelocity: string; // e.g., "14 complaints / 6h"
  complaintVelocityNumeric: number;
  muleAccountDensity: number; // count of linked mule accounts
  phishingDomainExposure: number; // 0-100 index
  repeatedTxPatterns: number; // count of flagged repeating patterns
  estimatedAmountAtRisk: number; // INR
  relatedComplaintsCount: number;
  recommendedPriority: 'Immediate Dispatch' | 'Urgent Freeze' | 'Active Surveillance' | 'Standard Review';
  globalDrivers: GlobalDriver[];
  whyThisScore: {
    summary: string;
    confidenceLabel: string;
    factors: ScoreFactor[];
  };
}

export interface CyberComplaint {
  id: string;
  type: string;
  reportedAmount: number; // INR
  date: string; // ISO date YYYY-MM-DD
  timestamp: string;
  location: string;
  district: string;
  status: ComplaintStatus;
  riskLevel: RiskLevel;
  riskScore: number;
  victimBank: string;
  linkedMuleAccounts: string[];
  predictedWithdrawalZoneId: string;
  modusOperandi: string;
}

export interface SuspiciousTransaction {
  id: string;
  complaintId: string;
  amount: number; // INR
  senderAccount: string;
  senderName: string;
  senderBank: string;
  receiverAccount: string;
  receiverName: string;
  receiverBank: string;
  receiverLocation: string;
  timestamp: string;
  accountRiskLevel: RiskLevel;
  riskScore: number;
  pattern: 'Rapid Layering' | 'Structuring / Smurfing' | 'Midnight ATM Hop' | 'Mule Funnel' | 'Cross-State Hop';
  hopSequence: number;
  flaggedReason: string;
}

export type GraphEntityType =
  | 'bank_account'
  | 'mobile_number'
  | 'beneficiary'
  | 'transaction'
  | 'suspicious_entity';

export interface GraphNode {
  id: string;
  label: string;
  sublabel: string;
  type: GraphEntityType;
  riskLevel: RiskLevel;
  riskScore: number;
  x: number; // Normalized 0..900 canvas coordinates
  y: number; // Normalized 0..540 canvas coordinates
  metadata: Record<string, string>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  amount?: number;
  suspicious: boolean;
}

export interface RiskPriorityItem {
  rank: number;
  id: string;
  riskScore: number;
  location: string;
  district: string;
  relatedComplaints: number;
  estimatedWithdrawalRisk: number; // INR
  withdrawalProbability: number; // %
  recommendedPriority: 'Immediate Dispatch' | 'Urgent Freeze' | 'Active Surveillance' | 'Standard Review';
  primaryComplaintId: string;
  predictedWindow: string;
  riskLevel: RiskLevel;
}

export interface AlertItem {
  id: string;
  title: string;
  message: string;
  category: 'Critical Risk' | 'High-Risk Location' | 'Suspicious Transaction';
  severity: RiskLevel;
  timestamp: string;
  read: boolean;
  linkedPage: PageId;
  referenceId: string;
  location: string;
}

export interface CrimeTrendPoint {
  date: string;
  complaints: number;
  suspiciousTx: number;
  predictedHits: number;
}

export interface DistrictRiskSummary {
  district: string;
  state: string;
  complaints: number;
  riskIndex: number;
  flaggedAtms: number;
  estimatedExposure: number;
}

export interface ModelMetricSnapshot {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  aucRoc: number;
  evaluationNote: string;
  trendHistory: {
    week: string;
    accuracy: number;
    precision: number;
    recall: number;
    f1: number;
  }[];
  classPerformance: {
    riskClass: RiskLevel;
    precision: number;
    recall: number;
    f1: number;
    sampleCount: number;
  }[];
  confusionMatrix: {
    actual: string;
    predictedCriticalHigh: number;
    predictedMediumLow: number;
  }[];
}

export interface ReportLocationSummary {
  location: string;
  district: string;
  totalComplaints: number;
  totalExposure: number;
  avgRiskScore: number;
  topCrimeType: string;
  predictedWindow: string;
  date: string;
}

export interface DataResponse<T> {
  data: T;
  source: DataSourceMode;
  isDemoData: boolean;
  fetchedAt: string;
  warning?: string;
}
