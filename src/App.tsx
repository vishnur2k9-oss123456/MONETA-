import { useCallback, useEffect, useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { ErrorState, LoadingSkeleton } from './components/ui/StateViews';
import { AlertsPage } from './pages/AlertsPage';
import { ComplaintsPage } from './pages/ComplaintsPage';
import { CrimeRiskMapPage } from './pages/CrimeRiskMapPage';
import { DashboardPage } from './pages/DashboardPage';
import { ModelPerformancePage } from './pages/ModelPerformancePage';
import { NetworkGraphPage } from './pages/NetworkGraphPage';
import { PredictiveAnalyticsPage } from './pages/PredictiveAnalyticsPage';
import { ReportsPage } from './pages/ReportsPage';
import { RiskPrioritizationPage } from './pages/RiskPrioritizationPage';
import { SettingsPage } from './pages/SettingsPage';
import { TransactionsPage } from './pages/TransactionsPage';
import {
  checkBackendHealth,
  fetchAlerts,
  fetchComplaints,
  fetchDashboardOverview,
  fetchModelMetrics,
  fetchNetworkGraph,
  fetchPredictedLocations,
  fetchReportSummaries,
  fetchRiskPriorities,
  fetchTransactions,
} from './services/api';
import {
  AlertItem,
  ComplaintStatus,
  CrimeTrendPoint,
  CyberComplaint,
  DataSourceMode,
  DistrictRiskSummary,
  GraphEdge,
  GraphNode,
  ModelMetricSnapshot,
  PageId,
  PredictedLocation,
  ReportLocationSummary,
  ResolvedTheme,
  RiskPriorityItem,
  SuspiciousTransaction,
  ThemePreference,
} from './types';

const THEME_STORAGE_KEY = 'moneta_theme_preference';

function getSystemTheme(): ResolvedTheme {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return 'dark';
}

export default function App() {
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [dataMode, setDataMode] = useState<DataSourceMode>('demo');
  const [alertThreshold, setAlertThreshold] = useState<number>(75);

  const [themePreference, setThemePreference] = useState<ThemePreference>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light' || saved === 'system') {
        return saved;
      }
    } catch {
      // Ignore storage access failures
    }
    return 'dark';
  });

  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => getSystemTheme());

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const resolvedTheme: ResolvedTheme =
    themePreference === 'system' ? systemTheme : themePreference;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
    try {
      localStorage.setItem(THEME_STORAGE_KEY, themePreference);
    } catch {
      // Ignore storage write failures
    }
  }, [resolvedTheme, themePreference]);

  const handleToggleTheme = () => {
    setThemePreference(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const [loading, setLoading] = useState(true);
  const [apiWarning, setApiWarning] = useState<string | null>(null);

  const [totals, setTotals] = useState({
    totalComplaints: 0,
    totalSuspiciousTransactions: 0,
    highRiskLocations: 0,
    activePredictiveAlerts: 0,
  });
  const [trends, setTrends] = useState<CrimeTrendPoint[]>([]);
  const [districts, setDistricts] = useState<DistrictRiskSummary[]>([]);
  const [locations, setLocations] = useState<PredictedLocation[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string>('LOC-DEL-01');
  const [complaints, setComplaints] = useState<CyberComplaint[]>([]);
  const [transactions, setTransactions] = useState<SuspiciousTransaction[]>([]);
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);
  const [graphEdges, setGraphEdges] = useState<GraphEdge[]>([]);
  const [priorities, setPriorities] = useState<RiskPriorityItem[]>([]);
  const [modelMetrics, setModelMetrics] = useState<ModelMetricSnapshot | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [reportSummaries, setReportSummaries] = useState<ReportLocationSummary[]>([]);

  const loadAllData = useCallback(async (mode: DataSourceMode) => {
    setLoading(true);
    setApiWarning(null);
    try {
      const [
        dashRes,
        locRes,
        compRes,
        txRes,
        graphRes,
        prioRes,
        modelRes,
        alertsRes,
        reportsRes,
      ] = await Promise.all([
        fetchDashboardOverview(mode),
        fetchPredictedLocations(mode),
        fetchComplaints(mode),
        fetchTransactions(mode),
        fetchNetworkGraph(mode),
        fetchRiskPriorities(mode),
        fetchModelMetrics(mode),
        fetchAlerts(mode),
        fetchReportSummaries(mode),
      ]);

      setTotals(dashRes.data.totals);
      setTrends(dashRes.data.trends);
      setDistricts(dashRes.data.districts);
      setLocations(locRes.data);
      if (locRes.data.length > 0) {
        setSelectedZoneId((prev) =>
          locRes.data.some((l) => l.id === prev) ? prev : locRes.data[0].id
        );
      }
      setComplaints(compRes.data);
      setTransactions(txRes.data);
      setGraphNodes(graphRes.data.nodes);
      setGraphEdges(graphRes.data.edges);
      setPriorities(prioRes.data);
      setModelMetrics(modelRes.data);
      setAlerts(alertsRes.data);
      setReportSummaries(reportsRes.data);

      const firstWarning =
        dashRes.warning ||
        locRes.warning ||
        compRes.warning ||
        txRes.warning ||
        null;
      setApiWarning(firstWarning);
    } catch (err) {
      setApiWarning(
        err instanceof Error
          ? err.message
          : 'Failed to load application data.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const init = async () => {
      const health = await checkBackendHealth();
      if (!active) return;
      if (health.reachable) {
        setDataMode('backend');
        await loadAllData('backend');
      } else {
        await loadAllData('demo');
      }
    };
    init();
    return () => {
      active = false;
    };
  }, [loadAllData]);

  const handleUpdateComplaintStatus = (id: string, status: ComplaintStatus) => {
    setComplaints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status } : c))
    );
  };

  const handleToggleAlertRead = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, read: !a.read } : a))
    );
  };

  const handleMarkAlertRead = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, read: true } : a))
    );
  };

  const handleMarkAllAlertsRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  };

  const unreadAlertsCount = alerts.filter((a) => !a.read).length;

  const renderPage = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          <LoadingSkeleton rows={4} />
          <LoadingSkeleton rows={6} />
        </div>
      );
    }

    switch (activePage) {
      case 'dashboard':
        return (
          <DashboardPage
            totals={totals}
            trends={trends}
            districts={districts}
            complaints={complaints}
            transactions={transactions}
            locations={locations}
            theme={resolvedTheme}
            onNavigate={setActivePage}
            onSelectZone={setSelectedZoneId}
          />
        );
      case 'predictive-analytics':
        return (
          <PredictiveAnalyticsPage
            locations={locations}
            selectedZoneId={selectedZoneId}
            theme={resolvedTheme}
            onSelectZone={setSelectedZoneId}
            onNavigate={setActivePage}
          />
        );
      case 'crime-risk-map':
        return (
          <CrimeRiskMapPage
            locations={locations}
            complaints={complaints}
            selectedZoneId={selectedZoneId}
            theme={resolvedTheme}
            dataMode={dataMode}
            backendWarning={apiWarning}
            onSelectZone={setSelectedZoneId}
            onNavigate={setActivePage}
            onSyncBackend={() => {
              if (dataMode === 'backend') {
                loadAllData('backend');
              } else {
                setDataMode('backend');
                loadAllData('backend');
              }
            }}
            onSwitchToDemo={() => {
              setDataMode('demo');
              loadAllData('demo');
            }}
          />
        );
      case 'complaints':
        return (
          <ComplaintsPage
            complaints={complaints}
            onUpdateStatus={handleUpdateComplaintStatus}
            onSelectZone={setSelectedZoneId}
            onNavigate={setActivePage}
          />
        );
      case 'transactions':
        return (
          <TransactionsPage
            transactions={transactions}
            theme={resolvedTheme}
            onNavigate={setActivePage}
          />
        );
      case 'network-graph':
        return (
          <NetworkGraphPage
            initialNodes={graphNodes}
            edges={graphEdges}
            theme={resolvedTheme}
          />
        );
      case 'risk-prioritization':
        return (
          <RiskPrioritizationPage
            items={priorities}
            onSelectZone={setSelectedZoneId}
            onNavigate={setActivePage}
          />
        );
      case 'model-performance':
        return modelMetrics ? (
          <ModelPerformancePage metrics={modelMetrics} theme={resolvedTheme} />
        ) : null;
      case 'alerts':
        return (
          <AlertsPage
            alerts={alerts}
            onToggleRead={handleToggleAlertRead}
            onMarkAllRead={handleMarkAllAlertsRead}
            onNavigate={setActivePage}
            onSelectZone={setSelectedZoneId}
          />
        );
      case 'reports':
        return <ReportsPage reports={reportSummaries} theme={resolvedTheme} />;
      case 'settings':
        return (
          <SettingsPage
            dataMode={dataMode}
            onChangeDataMode={(mode) => {
              setDataMode(mode);
              loadAllData(mode);
            }}
            alertThreshold={alertThreshold}
            onChangeAlertThreshold={setAlertThreshold}
            themePreference={themePreference}
            resolvedTheme={resolvedTheme}
            onChangeThemePreference={setThemePreference}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 dark:bg-[#060913] dark:text-slate-100 transition-colors duration-200">
      <Sidebar
        activePage={activePage}
        onSelectPage={setActivePage}
        unreadAlertsCount={unreadAlertsCount}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          activePage={activePage}
          onSelectPage={setActivePage}
          globalSearch={globalSearch}
          onGlobalSearchChange={setGlobalSearch}
          alerts={alerts}
          onMarkAlertRead={handleMarkAlertRead}
          complaints={complaints}
          locations={locations}
          dataMode={dataMode}
          resolvedTheme={resolvedTheme}
          onToggleTheme={handleToggleTheme}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          onSelectZoneFromSearch={setSelectedZoneId}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-7 max-w-[1600px] w-full mx-auto space-y-5">
          {apiWarning && (
            <ErrorState
              title="FastAPI Backend Fallback Active"
              message={apiWarning}
              onRetry={() => loadAllData(dataMode)}
            />
          )}
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
