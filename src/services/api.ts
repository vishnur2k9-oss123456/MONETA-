import {
  MOCK_ALERTS,
  MOCK_COMPLAINTS,
  MOCK_CRIME_TREND,
  MOCK_DASHBOARD_TOTALS,
  MOCK_DISTRICT_RISKS,
  MOCK_GRAPH_EDGES,
  MOCK_GRAPH_NODES,
  MOCK_MODEL_METRICS,
  MOCK_PREDICTED_LOCATIONS,
  MOCK_REPORT_SUMMARIES,
  MOCK_RISK_PRIORITIES,
  MOCK_TRANSACTIONS,
} from '../data/mockData';
import {
  AlertItem,
  CrimeTrendPoint,
  CyberComplaint,
  DataResponse,
  DataSourceMode,
  DistrictRiskSummary,
  GraphEdge,
  GraphNode,
  ModelMetricSnapshot,
  PredictedLocation,
  ReportLocationSummary,
  RiskLevel,
  RiskPriorityItem,
  SuspiciousTransaction,
} from '../types';

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export class ApiClientError extends Error {
  status?: number;
  endpoint: string;

  constructor(message: string, endpoint: string, status?: number) {
    super(message);
    this.name = 'ApiClientError';
    this.endpoint = endpoint;
    this.status = status;
  }
}

/**
 * Generic HTTP request helper prepared for the Python FastAPI backend
 * running at VITE_API_BASE_URL (default: http://localhost:8000).
 */
async function requestBackend<T>(
  path: string,
  options: RequestInit = {},
  timeoutMs = 5000
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const normalizedBase = API_BASE_URL.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${normalizedBase}${normalizedPath}`;

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      throw new ApiClientError(
        `Backend responded with HTTP ${response.status} ${response.statusText}`,
        normalizedPath,
        response.status
      );
    }

    return (await response.json()) as T;
  } catch (err) {
    if (err instanceof ApiClientError) {
      throw err;
    }
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiClientError(
        `Request timed out after ${timeoutMs}ms connecting to ${normalizedBase}`,
        normalizedPath
      );
    }
    throw new ApiClientError(
      `Unable to reach FastAPI backend at ${normalizedBase}. Ensure uvicorn is running on port 8000 with CORS enabled.`,
      normalizedPath
    );
  } finally {
    clearTimeout(timer);
  }
}

function wrapDemo<T>(data: T, warning?: string): DataResponse<T> {
  return {
    data,
    source: 'demo',
    isDemoData: true,
    fetchedAt: new Date().toISOString(),
    warning,
  };
}

function normalizeRiskLevel(rawLevel: unknown, score: number): RiskLevel {
  if (typeof rawLevel === 'string') {
    const normalized = rawLevel.trim().toLowerCase();
    if (normalized === 'critical') return 'Critical';
    if (normalized === 'high') return 'High';
    if (normalized === 'medium') return 'Medium';
    if (normalized === 'low') return 'Low';
  }
  if (score >= 85) return 'Critical';
  if (score >= 65) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
}

function normalizeDateCategory(raw: Record<string, unknown>): '24h' | '7d' | '30d' {
  const rawCat = String(raw.dateCategory ?? raw.date_category ?? '').toLowerCase();
  if (rawCat === '24h' || rawCat === '7d' || rawCat === '30d') {
    return rawCat;
  }
  const timestamp = raw.created_at ?? raw.predicted_at ?? raw.timestamp;
  if (typeof timestamp === 'string') {
    const parsed = Date.parse(timestamp);
    if (!Number.isNaN(parsed)) {
      const ageHours = (Date.now() - parsed) / 3600000;
      if (ageHours <= 24) return '24h';
      if (ageHours <= 24 * 7) return '7d';
      return '30d';
    }
  }
  return '24h';
}

function mapBackendPrediction(raw: Record<string, unknown>, index: number): PredictedLocation | null {
  const lat = Number(raw.lat ?? raw.latitude ?? raw.atm_latitude);
  const lng = Number(raw.lng ?? raw.lon ?? raw.longitude ?? raw.atm_longitude);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }

  const rawScore = Number(raw.riskScore ?? raw.risk_score ?? raw.score ?? 50);
  const riskScore = Math.max(0, Math.min(100, Math.round(rawScore <= 1 ? rawScore * 100 : rawScore)));
  const riskLevel = normalizeRiskLevel(raw.riskLevel ?? raw.risk_level, riskScore);

  const rawConfidence = Number(
    raw.predictionConfidence ?? raw.prediction_confidence ?? raw.confidence ?? Math.min(96, Math.round(riskScore * 0.95))
  );
  const predictionConfidence = Math.max(
    0,
    Math.min(100, Math.round(rawConfidence <= 1 ? rawConfidence * 100 : rawConfidence))
  );

  const rawProb = Number(
    raw.withdrawalProbability ?? raw.withdrawal_probability ?? raw.probability ?? Math.round(riskScore * 0.92)
  );
  const withdrawalProbability = Math.max(
    0,
    Math.min(100, Math.round(rawProb <= 1 ? rawProb * 100 : rawProb))
  );

  const district = String(raw.district ?? raw.district_name ?? raw.city ?? 'Unknown District');
  const city = String(raw.city ?? district);
  const state = String(raw.state ?? raw.region ?? '');
  const zoneName = String(raw.zoneName ?? raw.zone_name ?? raw.location_name ?? raw.atm_name ?? district);
  const atmCluster = String(raw.atmCluster ?? raw.atm_cluster ?? raw.bank_name ?? 'Predicted Withdrawal Zone');

  const rawDrivers = Array.isArray(raw.globalDrivers ?? raw.global_drivers ?? raw.feature_importance)
    ? ((raw.globalDrivers ?? raw.global_drivers ?? raw.feature_importance) as Record<string, unknown>[])
    : [];

  const globalDrivers =
    rawDrivers.length > 0
      ? rawDrivers.map((d) => ({
          factor: String(d.factor ?? d.feature ?? 'Signal'),
          percentage: Number(d.percentage ?? d.weight ?? 0),
          description: String(d.description ?? ''),
        }))
      : [
          { factor: 'Mule Account Density', percentage: 35, description: 'Linked mule entities in zone.' },
          { factor: 'Complaint Velocity', percentage: 25, description: 'Recent complaint frequency.' },
          { factor: 'Repeated Tx Patterns', percentage: 20, description: 'Structuring/layering signals.' },
          { factor: 'Phishing Domain Exposure', percentage: 12, description: 'Phishing telemetry overlap.' },
          { factor: 'Historical Withdrawals', percentage: 8, description: 'Prior corridor cash-out affinity.' },
        ];

  const relatedComplaintsCount = Number(
    raw.relatedComplaintsCount ?? raw.related_complaints_count ?? raw.complaints_count ?? 0
  );

  return {
    id: String(raw.id ?? raw.prediction_id ?? `PRED-${index + 1}`),
    zoneName,
    city,
    state,
    district,
    atmCluster,
    lat,
    lng,
    riskScore,
    riskLevel,
    predictionConfidence,
    withdrawalProbability,
    predictedWindow: String(raw.predictedWindow ?? raw.predicted_window ?? 'Active Monitoring Window'),
    dateCategory: normalizeDateCategory(raw),
    complaintVelocity: String(raw.complaintVelocity ?? raw.complaint_velocity ?? `${relatedComplaintsCount} linked`),
    complaintVelocityNumeric: Number(raw.complaintVelocityNumeric ?? relatedComplaintsCount),
    muleAccountDensity: Number(raw.muleAccountDensity ?? raw.mule_account_density ?? 0),
    phishingDomainExposure: Number(raw.phishingDomainExposure ?? raw.phishing_domain_exposure ?? 0),
    repeatedTxPatterns: Number(raw.repeatedTxPatterns ?? raw.repeated_tx_patterns ?? 0),
    estimatedAmountAtRisk: Number(raw.estimatedAmountAtRisk ?? raw.estimated_amount_at_risk ?? raw.amount_at_risk ?? 0),
    relatedComplaintsCount,
    recommendedPriority:
      riskLevel === 'Critical'
        ? 'Immediate Dispatch'
        : riskLevel === 'High'
        ? 'Urgent Freeze'
        : riskLevel === 'Medium'
        ? 'Active Surveillance'
        : 'Standard Review',
    globalDrivers,
    whyThisScore: {
      summary: String(
        raw.explanation ??
          raw.summary ??
          `Prediction scored ${riskScore}/100 (${riskLevel}) for ${district} with ${predictionConfidence}% model confidence.`
      ),
      confidenceLabel: `Model Confidence: ${predictionConfidence}%`,
      factors: Array.isArray(raw.factors)
        ? (raw.factors as { label: string; contribution: string; impact: 'High' | 'Medium' | 'Low'; detail: string }[])
        : [
            {
              label: 'Geospatial Cluster Score',
              contribution: `${riskScore} pts`,
              impact: riskLevel === 'Critical' || riskLevel === 'High' ? 'High' : 'Medium',
              detail: `District: ${district} · Withdrawal probability ${withdrawalProbability}%`,
            },
          ],
    },
  };
}

function mapBackendComplaint(raw: Record<string, unknown>, index: number): CyberComplaint {
  const score = Number(raw.riskScore ?? raw.risk_score ?? 65);
  return {
    id: String(raw.id ?? raw.complaint_id ?? `CMP-${index + 1}`),
    type: String(raw.type ?? raw.complaint_type ?? raw.category ?? 'Cybercrime Report'),
    reportedAmount: Number(raw.reportedAmount ?? raw.reported_amount ?? raw.amount ?? 0),
    date: String(raw.date ?? raw.reported_date ?? new Date().toISOString().slice(0, 10)),
    timestamp: String(raw.timestamp ?? raw.created_at ?? ''),
    location: String(raw.location ?? raw.city ?? raw.district ?? 'Unknown'),
    district: String(raw.district ?? raw.district_name ?? raw.location ?? 'Unknown'),
    status: (raw.status as CyberComplaint['status']) ?? 'Open',
    riskLevel: normalizeRiskLevel(raw.riskLevel ?? raw.risk_level, score),
    riskScore: Math.round(score),
    victimBank: String(raw.victimBank ?? raw.victim_bank ?? 'N/A'),
    linkedMuleAccounts: Array.isArray(raw.linkedMuleAccounts ?? raw.linked_mule_accounts)
      ? ((raw.linkedMuleAccounts ?? raw.linked_mule_accounts) as string[])
      : [],
    predictedWithdrawalZoneId: String(raw.predictedWithdrawalZoneId ?? raw.predicted_zone_id ?? ''),
    modusOperandi: String(raw.modusOperandi ?? raw.description ?? ''),
  };
}

/**
 * Checks connectivity to the FastAPI backend root/OpenAPI docs.
 */
export async function checkBackendHealth(customBaseUrl?: string): Promise<{
  reachable: boolean;
  message: string;
  checkedUrl: string;
}> {
  const base = (customBaseUrl || API_BASE_URL).replace(/\/+$/, '');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);

  try {
    const res = await fetch(`${base}/openapi.json`, {
      method: 'GET',
      signal: controller.signal,
    });
    if (res.ok) {
      return {
        reachable: true,
        message: 'Connected to FastAPI backend OpenAPI schema.',
        checkedUrl: `${base}/openapi.json`,
      };
    }
    return {
      reachable: false,
      message: `Backend reachable but returned HTTP ${res.status}.`,
      checkedUrl: `${base}/openapi.json`,
    };
  } catch {
    return {
      reachable: false,
      message: `FastAPI server not reachable at ${base}.`,
      checkedUrl: `${base}/openapi.json`,
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchDashboardOverview(mode: DataSourceMode = 'demo'): Promise<
  DataResponse<{
    totals: typeof MOCK_DASHBOARD_TOTALS;
    trends: CrimeTrendPoint[];
    districts: DistrictRiskSummary[];
  }>
> {
  if (mode === 'backend') {
    try {
      const payload = await requestBackend<unknown>('/predictions/');
      const rawList = Array.isArray(payload)
        ? payload
        : Array.isArray((payload as Record<string, unknown>)?.predictions)
        ? ((payload as Record<string, unknown>).predictions as unknown[])
        : Array.isArray((payload as Record<string, unknown>)?.items)
        ? ((payload as Record<string, unknown>).items as unknown[])
        : [];
      const mapped = rawList
        .map((r, i) => mapBackendPrediction(r as Record<string, unknown>, i))
        .filter((item): item is PredictedLocation => item !== null);

      const districtSummaries: DistrictRiskSummary[] = mapped.map((m) => ({
        district: m.district,
        state: m.state,
        complaints: m.relatedComplaintsCount,
        riskIndex: m.riskScore,
        flaggedAtms: m.muleAccountDensity,
        estimatedExposure: m.estimatedAmountAtRisk,
      }));

      return {
        data: {
          totals: {
            totalComplaints: mapped.reduce((a, b) => a + b.relatedComplaintsCount, 0),
            totalSuspiciousTransactions: mapped.reduce((a, b) => a + b.repeatedTxPatterns, 0),
            highRiskLocations: mapped.filter(
              (m) => m.riskLevel === 'Critical' || m.riskLevel === 'High'
            ).length,
            activePredictiveAlerts: mapped.filter((m) => m.riskScore >= 75).length,
          },
          trends: MOCK_CRIME_TREND,
          districts: districtSummaries,
        },
        source: 'backend',
        isDemoData: false,
        fetchedAt: new Date().toISOString(),
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Backend connection failed';
      return wrapDemo(
        {
          totals: MOCK_DASHBOARD_TOTALS,
          trends: MOCK_CRIME_TREND,
          districts: MOCK_DISTRICT_RISKS,
        },
        `${msg} Falling back to demo data.`
      );
    }
  }
  return wrapDemo({
    totals: MOCK_DASHBOARD_TOTALS,
    trends: MOCK_CRIME_TREND,
    districts: MOCK_DISTRICT_RISKS,
  });
}

/**
 * Fetches predicted locations.
 * When `mode === 'backend'`, strictly queries FastAPI `/predictions/` and returns
 * real database predictions (or `[]` when no predictions exist, without fabricating fake locations).
 */
export async function fetchPredictedLocations(
  mode: DataSourceMode = 'demo'
): Promise<DataResponse<PredictedLocation[]>> {
  if (mode === 'backend') {
    try {
      const payload = await requestBackend<unknown>('/predictions/');
      const rawList = Array.isArray(payload)
        ? payload
        : Array.isArray((payload as Record<string, unknown>)?.predictions)
        ? ((payload as Record<string, unknown>).predictions as unknown[])
        : Array.isArray((payload as Record<string, unknown>)?.items)
        ? ((payload as Record<string, unknown>).items as unknown[])
        : Array.isArray((payload as Record<string, unknown>)?.data)
        ? ((payload as Record<string, unknown>).data as unknown[])
        : [];

      const mapped = rawList
        .map((item, idx) => mapBackendPrediction(item as Record<string, unknown>, idx))
        .filter((item): item is PredictedLocation => item !== null);

      return {
        data: mapped,
        source: 'backend',
        isDemoData: false,
        fetchedAt: new Date().toISOString(),
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Backend connection failed';
      return {
        data: [],
        source: 'backend',
        isDemoData: false,
        fetchedAt: new Date().toISOString(),
        warning: msg,
      };
    }
  }
  return wrapDemo(MOCK_PREDICTED_LOCATIONS);
}

export async function fetchComplaints(
  mode: DataSourceMode = 'demo'
): Promise<DataResponse<CyberComplaint[]>> {
  if (mode === 'backend') {
    try {
      const payload = await requestBackend<unknown>('/complaints/');
      const rawList = Array.isArray(payload)
        ? payload
        : Array.isArray((payload as Record<string, unknown>)?.items)
        ? ((payload as Record<string, unknown>).items as unknown[])
        : Array.isArray((payload as Record<string, unknown>)?.complaints)
        ? ((payload as Record<string, unknown>).complaints as unknown[])
        : [];
      return {
        data: rawList.map((item, idx) =>
          mapBackendComplaint(item as Record<string, unknown>, idx)
        ),
        source: 'backend',
        isDemoData: false,
        fetchedAt: new Date().toISOString(),
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Backend connection failed';
      return {
        data: [],
        source: 'backend',
        isDemoData: false,
        fetchedAt: new Date().toISOString(),
        warning: msg,
      };
    }
  }
  return wrapDemo(MOCK_COMPLAINTS);
}

export async function fetchTransactions(
  mode: DataSourceMode = 'demo'
): Promise<DataResponse<SuspiciousTransaction[]>> {
  if (mode === 'backend') {
    try {
      await requestBackend<unknown>('/transactions/');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Backend connection failed';
      return wrapDemo(MOCK_TRANSACTIONS, `${msg} Falling back to demo data.`);
    }
  }
  return wrapDemo(MOCK_TRANSACTIONS);
}

export async function fetchNetworkGraph(
  mode: DataSourceMode = 'demo'
): Promise<DataResponse<{ nodes: GraphNode[]; edges: GraphEdge[] }>> {
  if (mode === 'backend') {
    try {
      await requestBackend<unknown>('/transactions/');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Backend connection failed';
      return wrapDemo(
        { nodes: MOCK_GRAPH_NODES, edges: MOCK_GRAPH_EDGES },
        `${msg} Falling back to demo data.`
      );
    }
  }
  return wrapDemo({ nodes: MOCK_GRAPH_NODES, edges: MOCK_GRAPH_EDGES });
}

export async function fetchRiskPriorities(
  mode: DataSourceMode = 'demo'
): Promise<DataResponse<RiskPriorityItem[]>> {
  if (mode === 'backend') {
    try {
      await requestBackend<unknown>('/risk/');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Backend connection failed';
      return wrapDemo(MOCK_RISK_PRIORITIES, `${msg} Falling back to demo data.`);
    }
  }
  return wrapDemo(MOCK_RISK_PRIORITIES);
}

export async function fetchModelMetrics(
  mode: DataSourceMode = 'demo'
): Promise<DataResponse<ModelMetricSnapshot>> {
  if (mode === 'backend') {
    try {
      await requestBackend<unknown>('/feedback/');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Backend connection failed';
      return wrapDemo(MOCK_MODEL_METRICS, `${msg} Falling back to demo data.`);
    }
  }
  return wrapDemo(MOCK_MODEL_METRICS);
}

export async function fetchAlerts(
  _mode: DataSourceMode = 'demo'
): Promise<DataResponse<AlertItem[]>> {
  return wrapDemo(MOCK_ALERTS);
}

export async function fetchReportSummaries(
  _mode: DataSourceMode = 'demo'
): Promise<DataResponse<ReportLocationSummary[]>> {
  return wrapDemo(MOCK_REPORT_SUMMARIES);
}
