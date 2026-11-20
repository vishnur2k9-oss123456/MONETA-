import React, { useMemo, useState } from 'react';
import { ArrowRight, ListOrdered } from 'lucide-react';
import { PageId, RiskPriorityItem } from '../types';
import { formatINR } from '../utils/formatters';
import { DemoDataNotice, EmptyState, RiskIndicator } from '../components/ui/StateViews';

interface RiskPrioritizationPageProps {
  items: RiskPriorityItem[];
  onSelectZone: (zoneId: string) => void;
  onNavigate: (page: PageId) => void;
}

export const RiskPrioritizationPage: React.FC<RiskPrioritizationPageProps> = ({
  items,
  onSelectZone,
  onNavigate,
}) => {
  const [priorityFilter, setPriorityFilter] = useState<string>('All');

  const filtered = useMemo(() => {
    if (priorityFilter === 'All') return items;
    return items.filter((item) => item.recommendedPriority === priorityFilter);
  }, [items, priorityFilter]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight font-display">
            Investigation Risk Prioritization Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Ranked withdrawal zones and linked complaints ordered by urgency score, exposure, and predicted time-to-cash-out.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-lg bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800 overflow-x-auto">
          {[
            'All',
            'Immediate Dispatch',
            'Urgent Freeze',
            'Active Surveillance',
            'Standard Review',
          ].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriorityFilter(p)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                priorityFilter === p
                  ? 'bg-cyan-50 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/35'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 border border-transparent'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <DemoDataNotice detail="Ranked priority queue generated from synthetic demo cases. Integrates with FastAPI /risk/ priority engine." />

      {filtered.length === 0 ? (
        <EmptyState
          title="No prioritized items in this category"
          description="Select All priorities to view the full ranked investigation queue."
          actionLabel="Show All Priorities"
          onAction={() => setPriorityFilter('All')}
        />
      ) : (
        <div className="rounded-xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800/80 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800/80 flex items-center gap-2">
            <ListOrdered className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Ranked High-Risk Locations & Linked Complaints ({filtered.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-5">Priority Rank</th>
                  <th className="py-3 px-4 text-right">Risk Score</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4 text-right">Related Complaints</th>
                  <th className="py-3 px-4 text-right">Estimated Withdrawal Risk</th>
                  <th className="py-3 px-4">Recommended Investigation Priority</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/70 text-xs">
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/35 transition-colors"
                  >
                    <td className="py-3.5 px-5 font-mono tabular-nums font-bold text-cyan-700 dark:text-cyan-300 whitespace-nowrap">
                      #{item.rank}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <RiskIndicator level={item.riskLevel} score={item.riskScore} />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {item.location}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {item.district} · Lead Case {item.primaryComplaintId} · {item.predictedWindow}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {item.relatedComplaints}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="font-mono tabular-nums font-semibold text-amber-600 dark:text-amber-300">
                        {formatINR(item.estimatedWithdrawalRisk)}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">
                        {item.withdrawalProbability}% cash-out prob.
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`font-semibold ${
                          item.recommendedPriority === 'Immediate Dispatch'
                            ? 'text-rose-600 dark:text-rose-400'
                            : item.recommendedPriority === 'Urgent Freeze'
                            ? 'text-amber-600 dark:text-amber-400'
                            : item.recommendedPriority === 'Active Surveillance'
                            ? 'text-cyan-700 dark:text-cyan-400'
                            : 'text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        {item.recommendedPriority}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectZone(item.id);
                          onNavigate('predictive-analytics');
                        }}
                        className="inline-flex items-center gap-1 text-xs font-medium text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 cursor-pointer"
                      >
                        <span>Inspect</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
