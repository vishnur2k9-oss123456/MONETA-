import React, { useMemo } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowRight, ArrowUpRight, BellRing, FileWarning, MapPin, ShieldAlert } from 'lucide-react';
import {
  CrimeTrendPoint,
  CyberComplaint,
  DistrictRiskSummary,
  PageId,
  PredictedLocation,
  ResolvedTheme,
  RiskLevel,
  SuspiciousTransaction,
} from '../types';
import { formatINR, formatINRCompact, formatNumber, getRiskHexColor } from '../utils/formatters';
import { getChartTheme } from '../utils/chartTheme';
import { DemoDataNotice, RiskIndicator } from '../components/ui/StateViews';

interface DashboardPageProps {
  totals: {
    totalComplaints: number;
    totalSuspiciousTransactions: number;
    highRiskLocations: number;
    activePredictiveAlerts: number;
  };
  trends: CrimeTrendPoint[];
  districts: DistrictRiskSummary[];
  complaints: CyberComplaint[];
  transactions: SuspiciousTransaction[];
  locations: PredictedLocation[];
  theme: ResolvedTheme;
  onNavigate: (page: PageId) => void;
  onSelectZone: (zoneId: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  totals,
  trends,
  districts,
  complaints,
  transactions,
  locations,
  theme,
  onNavigate,
  onSelectZone,
}) => {
  const chartTheme = useMemo(() => getChartTheme(theme), [theme]);

  const riskDistribution = useMemo(() => {
    const counts: Record<RiskLevel, number> = {
      Critical: 0,
      High: 0,
      Medium: 0,
      Low: 0,
    };
    locations.forEach((loc) => {
      counts[loc.riskLevel] += loc.relatedComplaintsCount * 18;
    });
    return (['Critical', 'High', 'Medium', 'Low'] as RiskLevel[]).map((level) => ({
      level,
      count: counts[level],
      color: getRiskHexColor(level),
    }));
  }, [locations]);

  const kpiCards = [
    {
      label: 'Total Cybercrime Complaints',
      value: formatNumber(totals.totalComplaints),
      subtext: '+12.4% vs prior 14d · Demo dataset',
      icon: FileWarning,
      accent: 'text-cyan-600 dark:text-cyan-400',
      target: 'complaints' as PageId,
    },
    {
      label: 'Total Suspicious Transactions',
      value: formatNumber(totals.totalSuspiciousTransactions),
      subtext: '₹4.18 Cr flagged layering volume',
      icon: ArrowUpRight,
      accent: 'text-blue-600 dark:text-blue-400',
      target: 'transactions' as PageId,
    },
    {
      label: 'High-Risk Locations',
      value: formatNumber(totals.highRiskLocations),
      subtext: '4 Critical · 10 High ATM clusters',
      icon: MapPin,
      accent: 'text-amber-600 dark:text-amber-400',
      target: 'crime-risk-map' as PageId,
    },
    {
      label: 'Active Predictive Alerts',
      value: formatNumber(totals.activePredictiveAlerts),
      subtext: '3 unread critical dispatch alerts',
      icon: BellRing,
      accent: 'text-rose-600 dark:text-rose-400',
      target: 'alerts' as PageId,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header + Demo Notice */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight font-display">
            MONETA Cybercrime Predictive Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Forecasting likely cash withdrawal corridors from cybercrime complaints and mule layering graphs.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('predictive-analytics')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/35 hover:bg-cyan-100 dark:hover:bg-cyan-500/25 transition-colors whitespace-nowrap cursor-pointer"
          >
            <span>Inspect Predictions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <DemoDataNotice />

      {/* 4 KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <button
              key={kpi.label}
              type="button"
              onClick={() => onNavigate(kpi.target)}
              className="text-left p-5 rounded-xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800/80 hover:border-cyan-400 dark:hover:border-cyan-500/35 transition-colors group cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {kpi.label}
                </span>
                <Icon className={`w-4 h-4 ${kpi.accent} shrink-0`} />
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 group-hover:text-cyan-700 dark:group-hover:text-cyan-200 transition-colors">
                {kpi.value}
              </div>
              <div className="text-[11px] text-slate-500 mt-2">{kpi.subtext}</div>
            </button>
          );
        })}
      </div>

      {/* Main Analytics Row: Crime Trend Analysis + Overall Risk Distribution */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Crime Trend Analysis */}
        <section className="xl:col-span-2 p-5 rounded-xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800/80">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Crime Trend Analysis
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Daily cybercrime complaints vs suspicious layering transactions (Demo Data)
              </p>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-600 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-[2px] bg-cyan-500 dark:bg-cyan-400" />
                Complaints
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-[2px] bg-purple-500 dark:bg-purple-400" />
                Suspicious Tx
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradTx" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradComp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridStroke} vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke={chartTheme.axisStroke}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke={chartTheme.axisStroke}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip contentStyle={chartTheme.tooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="suspiciousTx"
                  name="Suspicious Transactions"
                  stroke="#a855f7"
                  strokeWidth={2}
                  fill="url(#gradTx)"
                />
                <Area
                  type="monotone"
                  dataKey="complaints"
                  name="Complaints"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fill="url(#gradComp)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Overall Risk Distribution */}
        <section className="p-5 rounded-xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800/80 flex flex-col">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Overall Risk Distribution
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Active case volume segmented by severity tier
            </p>
          </div>

          <div className="h-56 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={riskDistribution}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridStroke} horizontal={false} />
                <XAxis type="number" stroke={chartTheme.axisStroke} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis
                  dataKey="level"
                  type="category"
                  stroke={chartTheme.categoryAxisStroke}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={68}
                />
                <Tooltip
                  cursor={{ fill: chartTheme.cursorFill }}
                  contentStyle={chartTheme.tooltipStyle}
                />
                <Bar dataKey="count" name="Cases" radius={[0, 6, 6, 0]} barSize={22}>
                  {riskDistribution.map((entry) => (
                    <Cell key={entry.level} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
            {riskDistribution.map((item) => (
              <div key={item.level} className="flex items-center justify-between px-2 py-1">
                <RiskIndicator level={item.level} />
                <span className="font-mono tabular-nums text-slate-800 dark:text-slate-200 font-medium">
                  {formatNumber(item.count)}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* High-Risk Districts + Recent Complaints */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* High-Risk Districts */}
        <section className="p-5 rounded-xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                High-Risk Districts
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Ranked by composite withdrawal risk index
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('crime-risk-map')}
              className="text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-medium cursor-pointer"
            >
              Open Map
            </button>
          </div>
          <div className="space-y-3.5">
            {districts.map((dist) => {
              const barColor =
                dist.riskIndex >= 85
                  ? 'bg-rose-500'
                  : dist.riskIndex >= 65
                  ? 'bg-amber-500'
                  : 'bg-cyan-500';
              return (
                <div key={dist.district} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="min-w-0">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {dist.district}
                      </span>
                      <span className="text-slate-500 ml-1.5">· {dist.state}</span>
                    </div>
                    <div className="font-mono tabular-nums text-slate-700 dark:text-slate-300 shrink-0">
                      {dist.riskIndex}/100
                    </div>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800/90 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${barColor}`}
                      style={{ width: `${dist.riskIndex}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono tabular-nums">
                    <span>{dist.complaints} complaints · {dist.flaggedAtms} flagged ATMs</span>
                    <span>{formatINRCompact(dist.estimatedExposure)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Recent Cybercrime Complaints */}
        <section className="xl:col-span-2 p-5 rounded-xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800/80 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Recent Cybercrime Complaints
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Latest NCRP-style incident reports linked to withdrawal forecasts
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('complaints')}
              className="text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-medium cursor-pointer"
            >
              All Complaints
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  <th className="py-2.5 pr-4">Complaint ID</th>
                  <th className="py-2.5 pr-4">Type</th>
                  <th className="py-2.5 pr-4">Location</th>
                  <th className="py-2.5 pr-4 text-right">Amount</th>
                  <th className="py-2.5 pr-4">Risk</th>
                  <th className="py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/70 text-xs">
                {complaints.slice(0, 6).map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => {
                      onSelectZone(c.predictedWithdrawalZoneId);
                      onNavigate('complaints');
                    }}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/35 transition-colors cursor-pointer"
                  >
                    <td className="py-3 pr-4 font-mono tabular-nums text-cyan-700 dark:text-cyan-300 whitespace-nowrap">
                      {c.id}
                    </td>
                    <td className="py-3 pr-4 text-slate-800 dark:text-slate-200 max-w-[180px] truncate">
                      {c.type}
                    </td>
                    <td className="py-3 pr-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {c.location}
                    </td>
                    <td className="py-3 pr-4 text-right font-mono tabular-nums text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {formatINR(c.reportedAmount)}
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      <RiskIndicator level={c.riskLevel} />
                    </td>
                    <td className="py-3 text-right text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {c.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Recent Suspicious Transactions */}
      <section className="p-5 rounded-xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800/80 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Recent Suspicious Transactions
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Multi-hop layering and structuring flows feeding geospatial withdrawal predictions
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('transactions')}
            className="text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-medium cursor-pointer"
          >
            View Intelligence Grid
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <th className="py-2.5 pr-4">Transaction ID</th>
                <th className="py-2.5 pr-4">Sender</th>
                <th className="py-2.5 pr-4">Receiver</th>
                <th className="py-2.5 pr-4">Pattern</th>
                <th className="py-2.5 pr-4 text-right">Amount</th>
                <th className="py-2.5 pr-4">Time</th>
                <th className="py-2.5 text-right">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/70 text-xs">
              {transactions.slice(0, 5).map((tx) => (
                <tr
                  key={tx.id}
                  onClick={() => onNavigate('transactions')}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/35 transition-colors cursor-pointer"
                >
                  <td className="py-3 pr-4 font-mono tabular-nums text-blue-600 dark:text-blue-300 whitespace-nowrap">
                    {tx.id}
                  </td>
                  <td className="py-3 pr-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {tx.senderName} · <span className="text-slate-500 font-mono">{tx.senderAccount}</span>
                  </td>
                  <td className="py-3 pr-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {tx.receiverName} · <span className="text-slate-500">{tx.receiverLocation}</span>
                  </td>
                  <td className="py-3 pr-4 text-purple-600 dark:text-purple-300 whitespace-nowrap">
                    {tx.pattern}
                  </td>
                  <td className="py-3 pr-4 text-right font-mono tabular-nums text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    {formatINR(tx.amount)}
                  </td>
                  <td className="py-3 pr-4 font-mono tabular-nums text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {tx.timestamp}
                  </td>
                  <td className="py-3 text-right whitespace-nowrap">
                    <RiskIndicator level={tx.accountRiskLevel} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
