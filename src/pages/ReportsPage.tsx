import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Download, FileSpreadsheet, Printer } from 'lucide-react';
import { ReportLocationSummary, ResolvedTheme } from '../types';
import { formatINR, formatINRCompact, formatNumber } from '../utils/formatters';
import { getChartTheme } from '../utils/chartTheme';
import { DemoDataNotice, EmptyState } from '../components/ui/StateViews';

interface ReportsPageProps {
  reports: ReportLocationSummary[];
  theme: ResolvedTheme;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ reports, theme }) => {
  const [fromDate, setFromDate] = useState('2026-11-15');
  const [toDate, setToDate] = useState('2026-11-19');
  const [districtFilter, setDistrictFilter] = useState('All');
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const chartTheme = useMemo(() => getChartTheme(theme), [theme]);

  const districts = useMemo(
    () => ['All', ...Array.from(new Set(reports.map((r) => r.district)))],
    [reports]
  );

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      const inRange =
        (!fromDate || r.date >= fromDate) && (!toDate || r.date <= toDate);
      const matchesDistrict =
        districtFilter === 'All' || r.district === districtFilter;
      return inRange && matchesDistrict;
    });
  }, [reports, fromDate, toDate, districtFilter]);

  const summaryStats = useMemo(() => {
    const totalComplaints = filtered.reduce((acc, r) => acc + r.totalComplaints, 0);
    const totalExposure = filtered.reduce((acc, r) => acc + r.totalExposure, 0);
    const avgRisk =
      filtered.length > 0
        ? Math.round(
            filtered.reduce((acc, r) => acc + r.avgRiskScore, 0) / filtered.length
          )
        : 0;
    return { totalComplaints, totalExposure, avgRisk };
  }, [filtered]);

  const handleExportCSV = () => {
    if (filtered.length === 0) return;
    const headers = [
      'Location',
      'District',
      'Date',
      'Total Complaints',
      'Estimated Exposure (INR)',
      'Average Risk Score',
      'Top Crime Type',
      'Predicted Window',
    ];
    const rows = filtered.map((r) => [
      `"${r.location}"`,
      `"${r.district}"`,
      r.date,
      r.totalComplaints,
      r.totalExposure,
      r.avgRiskScore,
      `"${r.topCrimeType}"`,
      `"${r.predictedWindow}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MONETA_Cybercrime_Report_${fromDate}_to_${toDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setExportMessage(`Exported ${filtered.length} location summary rows as CSV.`);
    setTimeout(() => setExportMessage(null), 3500);
  };

  const handlePrintBrief = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight font-display">
            MONETA Intelligence Reports & Export
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Complaint summaries, risk analysis by withdrawal corridor, date filtering, and CSV export.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handlePrintBrief}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Summary</span>
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/35 hover:bg-cyan-100 dark:hover:bg-cyan-500/25 disabled:opacity-45 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV Report</span>
          </button>
        </div>
      </div>

      <DemoDataNotice detail="Report aggregations compiled from synthetic demo records." />

      {exportMessage && (
        <div className="px-4 py-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/35 text-xs text-emerald-800 dark:text-emerald-300">
          {exportMessage}
        </div>
      )}

      {/* Date & District Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800/80">
        <div>
          <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
            From Date
          </label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-[#090e1c] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-cyan-500/50"
          />
        </div>
        <div>
          <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
            To Date
          </label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-[#090e1c] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-cyan-500/50"
          />
        </div>
        <div>
          <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
            District Filter
          </label>
          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-[#090e1c] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500/50"
          >
            {districts.map((d) => (
              <option key={d} value={d}>
                {d === 'All' ? 'All Districts' : d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Complaint & Risk Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800/80">
          <div className="text-xs text-slate-600 dark:text-slate-400">
            Complaint Summary Count
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-1.5">
            {formatNumber(summaryStats.totalComplaints)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Across {filtered.length} zones</div>
        </div>
        <div className="p-5 rounded-xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800/80">
          <div className="text-xs text-slate-600 dark:text-slate-400">
            Total Exposure Analyzed
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-300 mt-1.5">
            {formatINRCompact(summaryStats.totalExposure)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Reported cybercrime inflow</div>
        </div>
        <div className="p-5 rounded-xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800/80">
          <div className="text-xs text-slate-600 dark:text-slate-400">
            Average Zone Risk Score
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-cyan-700 dark:text-cyan-300 mt-1.5">
            {summaryStats.avgRisk}/100
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Weighted regional index</div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No report records in selected date range"
          description="Adjust the start/end date or district filter to view location-based analytical reports."
          actionLabel="Reset Report Filters"
          onAction={() => {
            setFromDate('2026-11-15');
            setToDate('2026-11-19');
            setDistrictFilter('All');
          }}
        />
      ) : (
        <>
          {/* Risk Analysis Chart */}
          <section className="p-5 rounded-xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800/80">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Location Risk & Complaint Volume Analysis
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Complaints logged per high-risk district within selected dates
              </p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filtered} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridStroke} vertical={false} />
                  <XAxis dataKey="district" stroke={chartTheme.categoryAxisStroke} fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke={chartTheme.axisStroke} fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: chartTheme.cursorFill }} contentStyle={chartTheme.tooltipStyle} />
                  <Bar dataKey="totalComplaints" name="Complaints" fill="#06b6d4" radius={[6, 6, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Location-Based Reports Table */}
          <div className="rounded-xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800/80 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800/80 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Location-Based Intelligence Report
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-5">Location</th>
                    <th className="py-3 px-4">District</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Complaints</th>
                    <th className="py-3 px-4 text-right">Exposure</th>
                    <th className="py-3 px-4 text-right">Avg Risk</th>
                    <th className="py-3 px-5">Dominant Crime Vector</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/70 text-xs">
                  {filtered.map((r) => (
                    <tr
                      key={r.location}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/35 transition-colors"
                    >
                      <td className="py-3 px-5 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {r.location}
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {r.district}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {r.date}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200">
                        {r.totalComplaints}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-amber-600 dark:text-amber-300 whitespace-nowrap">
                        {formatINR(r.totalExposure)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-cyan-700 dark:text-cyan-300 font-semibold">
                        {r.avgRiskScore}/100
                      </td>
                      <td className="py-3 px-5 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {r.topCrimeType}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
