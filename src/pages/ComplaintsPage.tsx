import React, { useMemo, useState } from 'react';
import { ArrowUpDown, FileText, RefreshCw, Search, ShieldAlert } from 'lucide-react';
import { ComplaintStatus, CyberComplaint, PageId, RiskLevel } from '../types';
import { formatINR } from '../utils/formatters';
import { DemoDataNotice, EmptyState, LoadingSkeleton, RiskIndicator } from '../components/ui/StateViews';

interface ComplaintsPageProps {
  complaints: CyberComplaint[];
  onUpdateStatus: (id: string, status: ComplaintStatus) => void;
  onSelectZone: (zoneId: string) => void;
  onNavigate: (page: PageId) => void;
}

type SortKey = 'date' | 'reportedAmount' | 'riskScore' | 'id';

export const ComplaintsPage: React.FC<ComplaintsPageProps> = ({
  complaints,
  onUpdateStatus,
  onSelectZone,
  onNavigate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | ComplaintStatus>('All');
  const [riskFilter, setRiskFilter] = useState<'All' | RiskLevel>('All');
  const [sortKey, setSortKey] = useState<SortKey>('riskScore');
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedId, setSelectedId] = useState<string>(complaints[0]?.id ?? '');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return complaints
      .filter((c) => {
        const matchesSearch =
          !q ||
          c.id.toLowerCase().includes(q) ||
          c.type.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q) ||
          c.district.toLowerCase().includes(q);
        const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
        const matchesRisk = riskFilter === 'All' || c.riskLevel === riskFilter;
        return matchesSearch && matchesStatus && matchesRisk;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortKey === 'reportedAmount') cmp = a.reportedAmount - b.reportedAmount;
        else if (sortKey === 'riskScore') cmp = a.riskScore - b.riskScore;
        else if (sortKey === 'date') cmp = a.date.localeCompare(b.date);
        else cmp = a.id.localeCompare(b.id);
        return sortAsc ? cmp : -cmp;
      });
  }, [complaints, searchQuery, statusFilter, riskFilter, sortKey, sortAsc]);

  const selectedComplaint = useMemo(() => {
    return (
      filtered.find((c) => c.id === selectedId) ||
      filtered[0] ||
      null
    );
  }, [filtered, selectedId]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc((prev) => !prev);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const handleSimulatedRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 450);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setRiskFilter('All');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight font-display">
            Cybercrime Complaint Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Search, sort, and inspect NCRP-style cybercrime reports linked to mule accounts and withdrawal zones.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSimulatedRefresh}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-cyan-400 dark:hover:border-cyan-500/40 transition-colors self-start sm:self-auto cursor-pointer whitespace-nowrap"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-600 dark:text-cyan-400' : ''}`} />
          <span>Refresh Records</span>
        </button>
      </div>

      <DemoDataNotice detail="Sample complaint dataset for MONETA demonstration. Prepared to map directly to FastAPI /complaints/ endpoint." />

      {/* Search & Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 rounded-xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800/80">
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by Complaint ID, fraud type, or city..."
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-slate-50 dark:bg-[#090e1c] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'All' | ComplaintStatus)}
          className="h-9 px-3 rounded-lg bg-slate-50 dark:bg-[#090e1c] border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500/50"
          aria-label="Filter by complaint status"
        >
          <option value="All">All Statuses</option>
          <option value="Open">Open</option>
          <option value="Under Investigation">Under Investigation</option>
          <option value="Mule Traced">Mule Traced</option>
          <option value="Account Frozen">Account Frozen</option>
          <option value="Escalated">Escalated</option>
        </select>

        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value as 'All' | RiskLevel)}
          className="h-9 px-3 rounded-lg bg-slate-50 dark:bg-[#090e1c] border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500/50"
          aria-label="Filter by risk level"
        >
          <option value="All">All Risk Levels</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>

      {isRefreshing ? (
        <LoadingSkeleton rows={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No matching complaints found"
          description="No cybercrime complaints matched your current search or filter criteria."
          actionLabel="Clear Filters"
          onAction={resetFilters}
        />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
          {/* Complaints Table */}
          <div className="xl:col-span-2 rounded-xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => toggleSort('id')}
                        className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer"
                      >
                        Complaint ID <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="py-3 px-4">Complaint Type</th>
                    <th className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => toggleSort('reportedAmount')}
                        className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer ml-auto"
                      >
                        Reported Amount <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => toggleSort('date')}
                        className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer"
                      >
                        Date <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => toggleSort('riskScore')}
                        className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer"
                      >
                        Risk Level <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/70 text-xs">
                  {filtered.map((c) => {
                    const isSelected = selectedComplaint?.id === c.id;
                    return (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedId(c.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-cyan-50/90 dark:bg-cyan-500/10'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-3 px-4 font-mono tabular-nums text-cyan-700 dark:text-cyan-300 whitespace-nowrap">
                          {c.id}
                        </td>
                        <td className="py-3 px-4 text-slate-800 dark:text-slate-200 max-w-[180px] truncate">
                          {c.type}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          {formatINR(c.reportedAmount)}
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {c.date}
                        </td>
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {c.location}
                        </td>
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {c.status}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <RiskIndicator level={c.riskLevel} score={c.riskScore} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Complaint Details Side Panel */}
          {selectedComplaint && (
            <aside className="rounded-xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800/80 p-5 space-y-4">
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800/80">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-700 dark:text-cyan-400">
                    <FileText className="w-3.5 h-3.5" />
                    <span>{selectedComplaint.id}</span>
                  </div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1 font-display">
                    {selectedComplaint.type}
                  </h2>
                </div>
                <RiskIndicator
                  level={selectedComplaint.riskLevel}
                  score={selectedComplaint.riskScore}
                />
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Reported Amount</span>
                  <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                    {formatINR(selectedComplaint.reportedAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Logged Timestamp</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {selectedComplaint.timestamp}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Location / District</span>
                  <span className="text-slate-800 dark:text-slate-200">{selectedComplaint.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Victim Bank</span>
                  <span className="text-slate-800 dark:text-slate-200">{selectedComplaint.victimBank}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                  Modus Operandi
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {selectedComplaint.modusOperandi}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
                  Linked Mule Accounts ({selectedComplaint.linkedMuleAccounts.length})
                </div>
                <div className="space-y-1.5">
                  {selectedComplaint.linkedMuleAccounts.map((acc) => (
                    <div
                      key={acc}
                      className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#090e1c] border border-slate-200 dark:border-slate-800 font-mono text-xs text-amber-700 dark:text-amber-300 flex items-center justify-between"
                    >
                      <span>{acc}</span>
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 space-y-2">
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Update Investigation Status (Demo)
                </label>
                <select
                  value={selectedComplaint.status}
                  onChange={(e) =>
                    onUpdateStatus(selectedComplaint.id, e.target.value as ComplaintStatus)
                  }
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-[#090e1c] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500/50"
                >
                  <option value="Open">Open</option>
                  <option value="Under Investigation">Under Investigation</option>
                  <option value="Mule Traced">Mule Traced</option>
                  <option value="Account Frozen">Account Frozen</option>
                  <option value="Escalated">Escalated</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  onSelectZone(selectedComplaint.predictedWithdrawalZoneId);
                  onNavigate('predictive-analytics');
                }}
                className="w-full py-2.5 px-4 rounded-lg text-xs font-medium bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/35 hover:bg-cyan-100 dark:hover:bg-cyan-500/25 transition-colors cursor-pointer"
              >
                Inspect Predicted Withdrawal Zone ({selectedComplaint.predictedWithdrawalZoneId})
              </button>
            </aside>
          )}
        </div>
      )}
    </div>
  );
};
