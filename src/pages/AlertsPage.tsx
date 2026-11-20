import React, { useMemo, useState } from 'react';
import { ArrowRight, Bell, CheckCheck, Circle } from 'lucide-react';
import { AlertItem, PageId } from '../types';
import { DemoDataNotice, EmptyState, RiskIndicator } from '../components/ui/StateViews';

interface AlertsPageProps {
  alerts: AlertItem[];
  onToggleRead: (id: string) => void;
  onMarkAllRead: () => void;
  onNavigate: (page: PageId) => void;
  onSelectZone: (zoneId: string) => void;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({
  alerts,
  onToggleRead,
  onMarkAllRead,
  onNavigate,
  onSelectZone,
}) => {
  const [filter, setFilter] = useState<
    'All' | 'Unread' | 'Critical Risk' | 'High-Risk Location' | 'Suspicious Transaction'
  >('All');

  const filtered = useMemo(() => {
    return alerts.filter((a) => {
      if (filter === 'Unread') return !a.read;
      if (filter === 'All') return true;
      return a.category === filter;
    });
  }, [alerts, filter]);

  const unreadCount = useMemo(() => alerts.filter((a) => !a.read).length, [alerts]);

  const handleOpenTarget = (alert: AlertItem) => {
    if (!alert.read) onToggleRead(alert.id);
    if (alert.referenceId.startsWith('LOC-')) {
      onSelectZone(alert.referenceId);
    }
    onNavigate(alert.linkedPage);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight font-display">
            Predictive Intelligence Alerts
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Critical risk escalations, high-risk ATM location surges, and flagged transaction anomalies.
          </p>
        </div>

        <button
          type="button"
          onClick={onMarkAllRead}
          disabled={unreadCount === 0}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-cyan-400 dark:hover:border-cyan-500/40 disabled:opacity-45 disabled:cursor-not-allowed transition-colors self-start sm:self-auto cursor-pointer whitespace-nowrap"
        >
          <CheckCheck className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          <span>Mark All Read ({unreadCount})</span>
        </button>
      </div>

      <DemoDataNotice detail="Sample operational alerts. In live mode, connects to FastAPI /alerts/ws WebSocket feed." />

      {/* Category Filter */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800 overflow-x-auto w-fit max-w-full">
        {(
          [
            'All',
            'Unread',
            'Critical Risk',
            'High-Risk Location',
            'Suspicious Transaction',
          ] as const
        ).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
              filter === tab
                ? 'bg-cyan-50 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/35'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 border border-transparent'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No alerts in this view"
          description="All alerts matching this filter have been reviewed or cleared."
          actionLabel="Show All Alerts"
          onAction={() => setFilter('All')}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 sm:p-5 rounded-xl border transition-colors ${
                alert.read
                  ? 'bg-white dark:bg-[#0c1222] border-slate-200 dark:border-slate-800/80'
                  : 'bg-cyan-50/50 dark:bg-[#0f172c] border-cyan-300 dark:border-cyan-500/35'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5 text-xs">
                    <RiskIndicator level={alert.severity} />
                    <span className="text-slate-400 dark:text-slate-600" aria-hidden="true">·</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {alert.category}
                    </span>
                    <span className="text-slate-400 dark:text-slate-600" aria-hidden="true">·</span>
                    <span className="font-mono text-slate-600 dark:text-slate-400">
                      {alert.location}
                    </span>
                    <span className="text-slate-400 dark:text-slate-600" aria-hidden="true">·</span>
                    <span className="font-mono text-slate-500">{alert.timestamp}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {alert.title}
                    </h3>
                    {!alert.read && (
                      <span className="text-[11px] font-mono text-cyan-700 dark:text-cyan-300 font-semibold">
                        Unread
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
                    {alert.message}
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onToggleRead(alert.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-50 dark:bg-[#090e1c] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Circle
                      className={`w-3 h-3 ${
                        alert.read
                          ? 'text-slate-400 dark:text-slate-600'
                          : 'text-cyan-500 dark:text-cyan-400 fill-cyan-500 dark:fill-cyan-400'
                      }`}
                    />
                    <span>{alert.read ? 'Mark Unread' : 'Mark Read'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenTarget(alert)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/35 hover:bg-cyan-100 dark:hover:bg-cyan-500/25 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <span>Investigate</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
