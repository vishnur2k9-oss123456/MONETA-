import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Clock, Info, MapPin, ShieldCheck } from 'lucide-react';
import { PageId, PredictedLocation, ResolvedTheme, RiskLevel } from '../types';
import { formatINRCompact, getRiskHexColor } from '../utils/formatters';
import { getChartTheme } from '../utils/chartTheme';
import { DemoDataNotice, EmptyState, RiskIndicator } from '../components/ui/StateViews';

interface PredictiveAnalyticsPageProps {
  locations: PredictedLocation[];
  selectedZoneId: string;
  theme: ResolvedTheme;
  onSelectZone: (zoneId: string) => void;
  onNavigate: (page: PageId) => void;
}

const DRIVER_COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#f59e0b', '#10b981'];

export const PredictiveAnalyticsPage: React.FC<PredictiveAnalyticsPageProps> = ({
  locations,
  selectedZoneId,
  theme,
  onSelectZone,
  onNavigate,
}) => {
  const [riskFilter, setRiskFilter] = useState<'All' | RiskLevel>('All');
  const chartTheme = useMemo(() => getChartTheme(theme), [theme]);

  const filteredLocations = useMemo(() => {
    if (riskFilter === 'All') return locations;
    return locations.filter((l) => l.riskLevel === riskFilter);
  }, [locations, riskFilter]);

  const activeZone = useMemo(() => {
    return (
      locations.find((l) => l.id === selectedZoneId) ||
      filteredLocations[0] ||
      locations[0]
    );
  }, [locations, filteredLocations, selectedZoneId]);

  const driverSum = useMemo(() => {
    if (!activeZone) return 0;
    return activeZone.globalDrivers.reduce((acc, d) => acc + d.percentage, 0);
  }, [activeZone]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight font-display">
            Predictive Cash Withdrawal Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Spatio-temporal forecasts, zone-level risk drivers, and individual prediction explainability.
          </p>
        </div>

        {/* Segmented filter control */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800 overflow-x-auto">
          {(['All', 'Critical', 'High', 'Medium', 'Low'] as const).map((tier) => (
            <button
              key={tier}
              type="button"
              onClick={() => setRiskFilter(tier)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                riskFilter === tier
                  ? 'bg-cyan-50 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/35'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 border border-transparent'
              }`}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      <DemoDataNotice detail="Synthetic forecast locations and explainability weights for MONETA demonstration. Replace with FastAPI /predictions/ response when live." />

      {/* Predicted locations grid / table */}
      {filteredLocations.length === 0 ? (
        <EmptyState
          title="No predicted zones match this risk tier"
          description="Try selecting another risk classification filter to view predicted cash withdrawal corridors."
          actionLabel="Show All Zones"
          onAction={() => setRiskFilter('All')}
        />
      ) : (
        <div className="rounded-xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800/80 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Predicted Cash Withdrawal Locations ({filteredLocations.length})
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Select any row to inspect Global Drivers and Score Explanation below
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('crime-risk-map')}
              className="inline-flex items-center gap-1.5 text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-medium whitespace-nowrap cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5" />
              View on Risk Map
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-5">Zone & ATM Cluster</th>
                  <th className="py-3 px-4 text-right">Risk Score</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4">Predicted Withdrawal Time</th>
                  <th className="py-3 px-4">Complaint Velocity</th>
                  <th className="py-3 px-4 text-right">Mule Density</th>
                  <th className="py-3 px-4 text-right">Phishing Exposure</th>
                  <th className="py-3 px-5 text-right">Repeated Tx</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/70 text-xs">
                {filteredLocations.map((loc) => {
                  const isSelected = activeZone?.id === loc.id;
                  return (
                    <tr
                      key={loc.id}
                      onClick={() => onSelectZone(loc.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-cyan-50/90 dark:bg-cyan-500/10'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {loc.city} — {loc.zoneName}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {loc.id} · {loc.atmCluster}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        <span style={{ color: getRiskHexColor(loc.riskLevel) }}>
                          {loc.riskScore}
                        </span>
                        <span className="text-slate-500 font-normal">/100</span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <RiskIndicator level={loc.riskLevel} />
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {loc.predictedWindow}
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums text-cyan-700 dark:text-cyan-300 whitespace-nowrap">
                        {loc.complaintVelocity}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {loc.muleAccountDensity} accts
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-amber-600 dark:text-amber-300 whitespace-nowrap">
                        {loc.phishingDomainExposure}%
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono tabular-nums text-purple-600 dark:text-purple-300 whitespace-nowrap">
                        {loc.repeatedTxPatterns}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Selected Zone Deep Dive */}
      {activeZone && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white dark:bg-[#0c1222] border border-cyan-300 dark:border-cyan-500/25 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs text-cyan-700 dark:text-cyan-400 font-medium">
                Selected Zone Inspection · {activeZone.id}
              </div>
              <div className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5 font-display">
                {activeZone.city} — {activeZone.zoneName}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  {activeZone.predictedWindow}
                </span>
                <span>·</span>
                <span>Estimated Exposure: {formatINRCompact(activeZone.estimatedAmountAtRisk)}</span>
              </div>
            </div>
            <div className="flex items-center gap-5">
              <div className="text-right">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Risk Score</div>
                <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                  {activeZone.riskScore}
                  <span className="text-sm text-slate-500">/100</span>
                </div>
              </div>
              <RiskIndicator level={activeZone.riskLevel} className="text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-stretch">
            {/* Global drivers for this zone */}
            <section className="p-5 rounded-xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800/80 flex flex-col">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 font-display">
                    Global drivers for this zone
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Feature importance breakdown for {activeZone.city} ({activeZone.id})
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Total Feature Weight
                  </div>
                  <div className="text-xs font-mono tabular-nums font-semibold text-cyan-700 dark:text-cyan-300">
                    {driverSum}%
                  </div>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={activeZone.globalDrivers}
                    layout="vertical"
                    margin={{ top: 4, right: 28, left: 10, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridStroke} horizontal={false} />
                    <XAxis
                      type="number"
                      domain={[0, 40]}
                      unit="%"
                      stroke={chartTheme.axisStroke}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      dataKey="factor"
                      type="category"
                      width={165}
                      stroke={chartTheme.categoryAxisStroke}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      formatter={(value) => [`${value ?? 0}%`, 'Importance']}
                      cursor={{ fill: chartTheme.cursorFill }}
                      contentStyle={chartTheme.tooltipStyle}
                    />
                    <Bar dataKey="percentage" radius={[0, 6, 6, 0]} barSize={20}>
                      {activeZone.globalDrivers.map((d, idx) => (
                        <Cell key={d.factor} fill={DRIVER_COLORS[idx % DRIVER_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 space-y-2.5">
                {activeZone.globalDrivers.map((driver, idx) => (
                  <div key={driver.factor} className="flex items-start justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
                        <span
                          className="w-2 h-2 rounded-[2px] shrink-0"
                          style={{ backgroundColor: DRIVER_COLORS[idx % DRIVER_COLORS.length] }}
                        />
                        <span>{driver.factor}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 pl-4">
                        {driver.description}
                      </p>
                    </div>
                    <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100 shrink-0">
                      {driver.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Why this score? */}
            <section className="p-5 rounded-xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800/80 flex flex-col">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 font-display flex items-center gap-2">
                    <Info className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    Why this score?
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Individual prediction explanation for {activeZone.zoneName}
                  </p>
                </div>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 shrink-0">
                  {activeZone.whyThisScore.confidenceLabel}
                </span>
              </div>

              <p className="text-xs sm:text-[13px] leading-relaxed text-slate-700 dark:text-slate-300 p-3.5 rounded-lg bg-slate-50 dark:bg-[#090e1c] border border-slate-200 dark:border-slate-800/80 mb-4">
                {activeZone.whyThisScore.summary}
              </p>

              <div className="space-y-3 flex-1">
                {activeZone.whyThisScore.factors.map((factor) => (
                  <div
                    key={factor.label}
                    className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#090e1c] border border-slate-200 dark:border-slate-800/70"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {factor.label}
                      </span>
                      <div className="flex items-center gap-2.5 text-xs shrink-0">
                        <span
                          className={`text-[11px] font-medium ${
                            factor.impact === 'High'
                              ? 'text-rose-600 dark:text-rose-400'
                              : factor.impact === 'Medium'
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-cyan-700 dark:text-cyan-400'
                          }`}
                        >
                          {factor.impact} Impact
                        </span>
                        <span className="font-mono tabular-nums font-semibold text-cyan-700 dark:text-cyan-300">
                          {factor.contribution}
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                      {factor.detail}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Recommended Action: {activeZone.recommendedPriority}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('risk-prioritization')}
                  className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-medium cursor-pointer"
                >
                  Priority Queue
                </button>
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
};
