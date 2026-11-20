import React from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowLeftRight,
  Bell,
  FileBarChart2,
  FileText,
  Gauge,
  LayoutDashboard,
  ListOrdered,
  Map as MapIcon,
  Network,
  Settings,
  Shield,
  X,
} from 'lucide-react';
import { PageId } from '../../types';

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'predictive-analytics', label: 'Predictive Analytics', icon: Activity },
  { id: 'crime-risk-map', label: 'Crime Risk Map', icon: MapIcon },
  { id: 'complaints', label: 'Complaint Management', icon: FileText },
  { id: 'transactions', label: 'Transaction Intelligence', icon: ArrowLeftRight },
  { id: 'network-graph', label: 'Network Graph Analysis', icon: Network },
  { id: 'risk-prioritization', label: 'Risk Prioritization', icon: ListOrdered },
  { id: 'model-performance', label: 'Model Performance', icon: Gauge },
  { id: 'alerts', label: 'Alerts', icon: Bell },
  { id: 'reports', label: 'Reports', icon: FileBarChart2 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  activePage: PageId;
  onSelectPage: (page: PageId) => void;
  unreadAlertsCount: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onSelectPage,
  unreadAlertsCount,
  mobileOpen,
  onCloseMobile,
}) => {
  const handleSelect = (page: PageId) => {
    onSelectPage(page);
    onCloseMobile();
  };

  const navContent = (
    <div className="flex flex-col h-full bg-white dark:bg-[#090e1c] border-r border-slate-200 dark:border-slate-800/80 w-64 select-none transition-colors duration-200">
      {/* Brand header */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-slate-200 dark:border-slate-800/80 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500/15 to-blue-600/15 dark:from-cyan-500/20 dark:to-blue-600/20 border border-cyan-500/35 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate font-display">
              MONETA
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              Cybercrime Intelligence
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60"
          aria-label="Close navigation menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-cyan-50 dark:bg-cyan-500/12 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive
                      ? 'text-cyan-600 dark:text-cyan-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </span>
              {item.id === 'alerts' && unreadAlertsCount > 0 && (
                <span className="font-mono tabular-nums text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                  {unreadAlertsCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Subtle footer attribution */}
      <div className="px-4 py-3.5 border-t border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-500 shrink-0">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-400 font-medium">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
          <span className="truncate">Withdrawal Forecast Suite</span>
        </div>
        <div className="mt-1 text-slate-500 truncate">
          Demo Mode · FastAPI Ready
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop persistent sidebar */}
      <aside className="hidden lg:block shrink-0">{navContent}</aside>

      {/* Mobile / tablet overlay drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full">{navContent}</div>
        </div>
      )}
    </>
  );
};
