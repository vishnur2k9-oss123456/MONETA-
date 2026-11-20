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
import { ArrowRight, ArrowUpDown, Search } from 'lucide-react';
import { PageId, ResolvedTheme, RiskLevel, SuspiciousTransaction } from '../types';
import { formatINR, formatINRCompact } from '../utils/formatters';
import { getChartTheme } from '../utils/chartTheme';
import { DemoDataNotice, EmptyState, RiskIndicator } from '../components/ui/StateViews';

interface TransactionsPageProps {
  transactions: SuspiciousTransaction[];
  theme: ResolvedTheme;
  onNavigate: (page: PageId) => void;
}

type SortField = 'amount' | 'riskScore' | 'timestamp';

export const TransactionsPage: React.FC<TransactionsPageProps> = ({
  transactions,
  theme,
  onNavigate,
}) => {
  const [search, setSearch] = useState('');
  const [patternFilter, setPatternFilter] = useState<string>('All');
  const [riskFilter, setRiskFilter] = useState<'All' | RiskLevel>('All');
  const [sortField, setSortField] = useState<SortField>('riskScore');
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedTxId, setSelectedTxId] = useState<string>(transactions[0]?.id ?? '');

  const chartTheme = useMemo(() => getChartTheme(theme), [theme]);

  const patterns = useMemo(() => {
    const set = new Set(transactions.map((t) => t.pattern));
    return ['All', ...Array.from(set)];
  }, [transactions]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions
      .filter((tx) => {
        const matchesSearch =
          !q ||
          tx.id.toLowerCase().includes(q) ||
          tx.senderName.toLowerCase().includes(q) ||
          tx.receiverName.toLowerCase().includes(q) ||
          tx.receiverLocation.toLowerCase().includes(q) ||
          tx.complaintId.toLowerCase().includes(q);
        const matchesPattern = patternFilter === 'All' || tx.pattern === patternFilter;
        const matchesRisk = riskFilter === 'All' || tx.accountRiskLevel === riskFilter;
        return matchesSearch && matchesPattern && matchesRisk;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortField === 'amount') cmp = a.amount - b.amount;
        else if (sortField === 'riskScore') cmp = a.riskScore - b.riskScore;
        else cmp = a.timestamp.localeCompare(b.timestamp);
        return sortAsc ? cmp : -cmp;
      });
  }, [transactions, search, patternFilter, riskFilter, sortField, sortAsc]);

  const patternDistribution = useMemo(() => {
    const map: Record<string, { pattern: string; count: number; totalAmount: number }> = {};
    transactions.forEach((tx) => {
      if (!map[tx.pattern]) {
        map[tx.pattern] = { pattern: tx.pattern, count: 0, totalAmount: 0 };
      }
      map[tx.pattern].count += 1;
      map[tx.pattern].totalAmount += tx.amount;
    });
    return Object.values(map);
  }, [transactions]);

  const selectedTx = useMemo(
    () => filtered.find((t) => t.id === selectedTxId) || filtered[0] || null,
    [filtered, selectedTxId]
  );

  const totalVolume = useMemo(
    () => filtered.reduce((acc, t) => acc + t.amount, 0),
    [filtered]
  );

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortAsc((p) => !p);
    else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight font-display">
            Transaction Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Inspect multi-hop layering transfers, structuring anomalies, and mule account risk profiles.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('network-graph')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/35 hover:bg-cyan-100 dark:hover:bg-cyan-500/25 transition-colors self-start sm:self-auto cursor-pointer whitespace-nowrap"
        >
          <span>Trace in Network Graph</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <DemoDataNotice detail="Synthetic transaction ledger for MONETA demonstration. Connects to FastAPI /transactions/ when live." />

      {/* Summary + Pattern Chart */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 gap-3">
          <div className="p-4 rounded-xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800/80">
            <div className="text-xs text-slate-600 dark:text-slate-400">
              Filtered Suspicious Records
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-1">
              {filtered.length}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800/80">
            <div className="text-xs text-slate-600 dark:text-slate-400">
              Flagged Transfer Volume
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-cyan-700 dark:text-cyan-300 mt-1">
              {formatINRCompact(totalVolume)}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800/80">
            <div className="text-xs text-slate-600 dark:text-slate-400">
              Critical Account Risk Records
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400 mt-1">
              {filtered.filter((t) => t.accountRiskLevel === 'Critical').length}
            </div>
          </div>
        </div>

        <section className="xl:col-span-2 p-5 rounded-xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800/80">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Suspicious Transaction Patterns
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Frequency of detected fraud-laundering typologies (Demo Data)
            </p>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={patternDistribution} margin={{ top: 6, right: 16, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridStroke} vertical={false} />
                <XAxis dataKey="pattern" stroke={chartTheme.categoryAxisStroke} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke={chartTheme.axisStroke} fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: chartTheme.cursorFill }} contentStyle={chartTheme.tooltipStyle} />
                <Bar dataKey="count" name="Flagged Tx" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 rounded-xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800/80">
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Tx ID, sender, receiver, or complaint ID..."
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-slate-50 dark:bg-[#090e1c] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        <select
          value={patternFilter}
          onChange={(e) => setPatternFilter(e.target.value)}
          className="h-9 px-3 rounded-lg bg-slate-50 dark:bg-[#090e1c] border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500/50"
          aria-label="Filter by suspicious pattern"
        >
          {patterns.map((p) => (
            <option key={p} value={p}>
              {p === 'All' ? 'All Patterns' : p}
            </option>
          ))}
        </select>

        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value as 'All' | RiskLevel)}
          className="h-9 px-3 rounded-lg bg-slate-50 dark:bg-[#090e1c] border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500/50"
          aria-label="Filter by account risk level"
        >
          <option value="All">All Risk Levels</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No suspicious transactions match filters"
          description="Try clearing your search query or selecting All Patterns to view flagged transfer flows."
          actionLabel="Reset Filters"
          onAction={() => {
            setSearch('');
            setPatternFilter('All');
            setRiskFilter('All');
          }}
        />
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-4">Transaction ID</th>
                    <th className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => toggleSort('amount')}
                        className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer ml-auto"
                      >
                        Amount <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="py-3 px-4">Sender Details</th>
                    <th className="py-3 px-4">Receiver Details</th>
                    <th className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => toggleSort('timestamp')}
                        className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer"
                      >
                        Transaction Time <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => toggleSort('riskScore')}
                        className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer"
                      >
                        Account Risk <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="py-3 px-4">Suspicious Pattern</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/70 text-xs">
                  {filtered.map((tx) => {
                    const isSelected = selectedTx?.id === tx.id;
                    return (
                      <tr
                        key={tx.id}
                        onClick={() => setSelectedTxId(tx.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-cyan-50/90 dark:bg-cyan-500/10'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-mono text-blue-700 dark:text-blue-300 font-medium">
                            {tx.id}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500">
                            {tx.complaintId} · Hop {tx.hopSequence}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          {formatINR(tx.amount)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="text-slate-800 dark:text-slate-200">{tx.senderName}</div>
                          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                            {tx.senderAccount} · {tx.senderBank}
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="text-slate-800 dark:text-slate-200">{tx.receiverName}</div>
                          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                            {tx.receiverAccount} · {tx.receiverLocation}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {tx.timestamp}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <RiskIndicator level={tx.accountRiskLevel} score={tx.riskScore} />
                        </td>
                        <td className="py-3 px-4 text-purple-700 dark:text-purple-300 font-medium whitespace-nowrap">
                          {tx.pattern}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {selectedTx && (
            <div className="p-4 rounded-xl bg-white dark:bg-[#0c1222] border border-cyan-300 dark:border-cyan-500/25 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
              <div>
                <div className="font-mono text-cyan-700 dark:text-cyan-400">
                  Selected Record: {selectedTx.id} · Linked Complaint {selectedTx.complaintId}
                </div>
                <div className="text-slate-900 dark:text-slate-200 font-medium mt-1">
                  Flagged Reason: {selectedTx.flaggedReason}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('network-graph')}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/35 hover:bg-cyan-100 dark:hover:bg-cyan-500/25 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Inspect Entity Graph
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
