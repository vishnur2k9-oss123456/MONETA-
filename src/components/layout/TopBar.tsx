import React, { useMemo, useState } from 'react';
import {
  Bell,
  ChevronDown,
  Menu,
  Moon,
  Search,
  ShieldAlert,
  Sun,
  User,
} from 'lucide-react';
import {
  AlertItem,
  CyberComplaint,
  DataSourceMode,
  PageId,
  PredictedLocation,
  ResolvedTheme,
} from '../../types';
import { NAV_ITEMS } from './Sidebar';

interface TopBarProps {
  activePage: PageId;
  onSelectPage: (page: PageId) => void;
  globalSearch: string;
  onGlobalSearchChange: (val: string) => void;
  alerts: AlertItem[];
  onMarkAlertRead: (id: string) => void;
  complaints: CyberComplaint[];
  locations: PredictedLocation[];
  dataMode: DataSourceMode;
  resolvedTheme: ResolvedTheme;
  onToggleTheme: () => void;
  onOpenMobileSidebar: () => void;
  onSelectZoneFromSearch: (zoneId: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activePage,
  onSelectPage,
  globalSearch,
  onGlobalSearchChange,
  alerts,
  onMarkAlertRead,
  complaints,
  locations,
  dataMode,
  resolvedTheme,
  onToggleTheme,
  onOpenMobileSidebar,
  onSelectZoneFromSearch,
}) => {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const unreadAlerts = useMemo(() => alerts.filter((a) => !a.read), [alerts]);
  const currentNav = NAV_ITEMS.find((item) => item.id === activePage);

  const searchResults = useMemo(() => {
    const q = globalSearch.trim().toLowerCase();
    if (!q) return { zones: [], complaints: [] };
    return {
      zones: locations
        .filter(
          (l) =>
            l.zoneName.toLowerCase().includes(q) ||
            l.city.toLowerCase().includes(q) ||
            l.district.toLowerCase().includes(q) ||
            l.id.toLowerCase().includes(q)
        )
        .slice(0, 4),
      complaints: complaints
        .filter(
          (c) =>
            c.id.toLowerCase().includes(q) ||
            c.type.toLowerCase().includes(q) ||
            c.location.toLowerCase().includes(q)
        )
        .slice(0, 4),
    };
  }, [globalSearch, locations, complaints]);

  const hasResults =
    searchResults.zones.length > 0 || searchResults.complaints.length > 0;

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-[#090e1c]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0 transition-colors duration-200">
      {/* Left: Mobile toggle + current workspace context */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer"
          aria-label="Open navigation sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="hidden sm:inline font-semibold text-slate-700 dark:text-slate-300">
              MONETA
            </span>
            <span className="hidden sm:inline" aria-hidden="true">
              /
            </span>
            <span className="text-slate-900 dark:text-slate-100 font-semibold truncate">
              {currentNav?.label ?? 'Dashboard'}
            </span>
          </div>
        </div>
      </div>

      {/* Center: Global search input */}
      <div className="relative flex-1 max-w-md">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => onGlobalSearchChange(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
            placeholder="Search complaint ID, district, or ATM zone..."
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-slate-100 dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/60 transition-colors"
            aria-label="Global search"
          />
        </div>

        {/* Instant search results dropdown */}
        {searchFocused && globalSearch.trim().length > 0 && (
          <div className="absolute left-0 right-0 mt-1.5 rounded-xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden z-50">
            {!hasResults ? (
              <div className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                No matching zones or complaints for "{globalSearch}"
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800/80 max-h-80 overflow-y-auto">
                {searchResults.zones.length > 0 && (
                  <div className="p-2">
                    <div className="px-2 py-1 text-[11px] font-medium text-slate-500">
                      Predicted Locations
                    </div>
                    {searchResults.zones.map((z) => (
                      <button
                        key={z.id}
                        type="button"
                        onMouseDown={() => {
                          onSelectZoneFromSearch(z.id);
                          onSelectPage('predictive-analytics');
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 flex items-center justify-between gap-2 text-xs cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="text-slate-900 dark:text-slate-100 font-medium truncate">
                            {z.city} — {z.zoneName}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {z.id} · {z.district}
                          </div>
                        </div>
                        <span className="font-mono tabular-nums text-cyan-600 dark:text-cyan-400 shrink-0">
                          {z.riskScore}/100
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {searchResults.complaints.length > 0 && (
                  <div className="p-2">
                    <div className="px-2 py-1 text-[11px] font-medium text-slate-500">
                      Complaints
                    </div>
                    {searchResults.complaints.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onMouseDown={() => onSelectPage('complaints')}
                        className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 flex items-center justify-between gap-2 text-xs cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="text-slate-900 dark:text-slate-100 font-medium truncate">
                            {c.id} · {c.type}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {c.location}
                          </div>
                        </div>
                        <span className="text-[11px] text-amber-600 dark:text-amber-400 shrink-0">
                          {c.riskLevel}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Theme switch + Data source indicator + Notifications + Profile */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Quick Light / Dark theme toggle */}
        <button
          type="button"
          onClick={onToggleTheme}
          className="p-2 rounded-lg bg-slate-100 dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-cyan-700 dark:hover:text-cyan-300 hover:border-cyan-400 dark:hover:border-cyan-500/40 transition-colors cursor-pointer"
          aria-label={resolvedTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          title={resolvedTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>

        <button
          type="button"
          onClick={() => onSelectPage('settings')}
          className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:border-cyan-400 dark:hover:border-cyan-500/40 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          title="Configure backend data source"
        >
          <span className="text-cyan-700 dark:text-cyan-400 font-semibold">
            {dataMode === 'demo' ? 'DEMO DATA' : 'FASTAPI MODE'}
          </span>
        </button>

        {/* Notifications bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setNotifOpen((prev) => !prev);
              setProfileOpen(false);
            }}
            className="relative p-2 rounded-lg bg-slate-100 dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-cyan-700 dark:hover:text-cyan-300 hover:border-cyan-400 dark:hover:border-cyan-500/40 transition-colors cursor-pointer"
            aria-label="Open notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-mono font-bold flex items-center justify-center tabular-nums">
                {unreadAlerts.length}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800/80">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Recent Alerts ({unreadAlerts.length} unread)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setNotifOpen(false);
                    onSelectPage('alerts');
                  }}
                  className="text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-medium cursor-pointer"
                >
                  View all
                </button>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-slate-800/80 max-h-72 overflow-y-auto">
                {alerts.slice(0, 4).map((alert) => (
                  <button
                    key={alert.id}
                    type="button"
                    onClick={() => {
                      onMarkAlertRead(alert.id);
                      setNotifOpen(false);
                      onSelectPage(alert.linkedPage);
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${
                      !alert.read ? 'bg-cyan-50/60 dark:bg-cyan-500/5' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate flex items-center gap-1.5">
                        <ShieldAlert
                          className={`w-3.5 h-3.5 shrink-0 ${
                            alert.severity === 'Critical'
                              ? 'text-rose-500 dark:text-rose-400'
                              : 'text-amber-500 dark:text-amber-400'
                          }`}
                        />
                        {alert.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                      {alert.message}
                    </p>
                    <div className="mt-1.5 text-[11px] font-mono text-slate-500">
                      {alert.timestamp} · {alert.read ? 'Read' : 'Unread'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Analyst profile */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setProfileOpen((prev) => !prev);
              setNotifOpen(false);
            }}
            className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer"
          >
            {!avatarError ? (
              <img
                src="/src/assets/images/analyst_profile_avatar_1795111761889.jpg"
                alt="Cybercrime Analyst"
                referrerPolicy="no-referrer"
                onError={() => setAvatarError(true)}
                className="w-7 h-7 rounded-md object-cover shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-md bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-700 dark:text-cyan-300 shrink-0">
                <User className="w-4 h-4" />
              </div>
            )}
            <div className="hidden sm:block text-left">
              <div className="text-xs font-medium text-slate-900 dark:text-slate-100 leading-tight whitespace-nowrap">
                A. Sharma
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight whitespace-nowrap">
                LEA Analyst
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden sm:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-2">
              <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800/80 mb-1">
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Inspector A. Sharma
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Cybercrime Predictive Unit · MONETA
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  onSelectPage('settings');
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                Theme & API Settings
              </button>
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  onSelectPage('reports');
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                Export Investigation Brief
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
