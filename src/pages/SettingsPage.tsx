import React, { useState } from 'react';
import {
  CheckCircle2,
  Database,
  Monitor,
  Moon,
  Palette,
  RefreshCw,
  Server,
  Sliders,
  Sun,
  XCircle,
} from 'lucide-react';
import { API_BASE_URL, checkBackendHealth } from '../services/api';
import { DataSourceMode, ResolvedTheme, ThemePreference } from '../types';

interface SettingsPageProps {
  dataMode: DataSourceMode;
  onChangeDataMode: (mode: DataSourceMode) => void;
  alertThreshold: number;
  onChangeAlertThreshold: (val: number) => void;
  themePreference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  onChangeThemePreference: (pref: ThemePreference) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  dataMode,
  onChangeDataMode,
  alertThreshold,
  onChangeAlertThreshold,
  themePreference,
  resolvedTheme,
  onChangeThemePreference,
}) => {
  const [checking, setChecking] = useState(false);
  const [healthResult, setHealthResult] = useState<{
    reachable: boolean;
    message: string;
    checkedUrl: string;
  } | null>(null);

  const handleTestConnection = async () => {
    setChecking(true);
    const result = await checkBackendHealth();
    setHealthResult(result);
    setChecking(false);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight font-display">
          MONETA Platform & Theme Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
          Customize interface appearance, external Python FastAPI connectivity, data source mode, and analytical thresholds.
        </p>
      </div>

      {/* Theme Customization */}
      <section className="p-5 rounded-xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Palette className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Interface Theme Customization
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Switch between Dark Intelligence and Light Operational modes across charts, map tiles, and tables.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400 shrink-0">
            Active: {resolvedTheme === 'dark' ? 'Dark' : 'Light'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(
            [
              {
                id: 'dark',
                label: 'Dark Intelligence',
                desc: 'Low-glare navy/obsidian command surface for SOC environments.',
                icon: Moon,
              },
              {
                id: 'light',
                label: 'Light Operational',
                desc: 'High-contrast daylight slate canvas for presentations & print.',
                icon: Sun,
              },
              {
                id: 'system',
                label: 'System Preference',
                desc: 'Automatically match your operating system light or dark setting.',
                icon: Monitor,
              },
            ] as const
          ).map((opt) => {
            const Icon = opt.icon;
            const selected = themePreference === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChangeThemePreference(opt.id)}
                className={`text-left p-4 rounded-xl border transition-colors cursor-pointer ${
                  selected
                    ? 'bg-cyan-50 dark:bg-cyan-500/12 border-cyan-300 dark:border-cyan-500/45 text-slate-900 dark:text-slate-100'
                    : 'bg-slate-50 dark:bg-[#090e1c] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Icon
                    className={`w-4 h-4 ${
                      selected ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400'
                    }`}
                  />
                  <span>{opt.label}</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  {opt.desc}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* FastAPI Backend Configuration */}
      <section className="p-5 rounded-xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800/80 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Server className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                FastAPI Backend Connection
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Configured via{' '}
                <code className="font-mono text-cyan-700 dark:text-cyan-300">VITE_API_BASE_URL</code>{' '}
                environment variable.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={checking}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/35 hover:bg-cyan-100 dark:hover:bg-cyan-500/25 disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'Testing...' : 'Test FastAPI Connection'}</span>
          </button>
        </div>

        <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#090e1c] border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-slate-600 dark:text-slate-400">Configured API Base URL</span>
          <code className="font-mono text-cyan-700 dark:text-cyan-300">{API_BASE_URL}</code>
        </div>

        {healthResult && (
          <div
            className={`p-3.5 rounded-lg border text-xs flex items-start gap-2.5 ${
              healthResult.reachable
                ? 'bg-emerald-50 dark:bg-emerald-950/25 border-emerald-200 dark:border-emerald-500/35 text-emerald-900 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/25 border-rose-200 dark:border-rose-500/35 text-rose-900 dark:text-rose-200'
            }`}
          >
            {healthResult.reachable ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-medium">{healthResult.message}</div>
              <div className="text-[11px] font-mono opacity-75 mt-0.5">
                Checked: {healthResult.checkedUrl}
              </div>
            </div>
          </div>
        )}

        {/* Documented Backend Prefixes */}
        <div className="pt-2">
          <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
            Prepared FastAPI Service Layer Prefixes
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
            {[
              '/auth/',
              '/complaints/',
              '/transactions/',
              '/predictions/',
              '/risk/',
              '/feedback/',
              '/alerts/ws',
            ].map((route) => (
              <div
                key={route}
                className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#090e1c] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
              >
                {route}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Data Source Mode Selector */}
      <section className="p-5 rounded-xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800/80 space-y-4">
        <div className="flex items-center gap-2.5">
          <Database className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Active Data Source Mode
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Switch between standalone synthetic demo datasets and the external FastAPI server (falls back safely to demo data if unreachable).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onChangeDataMode('demo')}
            className={`text-left p-4 rounded-xl border transition-colors cursor-pointer ${
              dataMode === 'demo'
                ? 'bg-cyan-50 dark:bg-cyan-500/12 border-cyan-300 dark:border-cyan-500/45 text-slate-900 dark:text-slate-100'
                : 'bg-slate-50 dark:bg-[#090e1c] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="text-xs font-semibold">Demo Sample Data (Standalone)</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Runs all 11 views offline using separated synthetic datasets in src/data/mockData.ts.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onChangeDataMode('backend')}
            className={`text-left p-4 rounded-xl border transition-colors cursor-pointer ${
              dataMode === 'backend'
                ? 'bg-cyan-50 dark:bg-cyan-500/12 border-cyan-300 dark:border-cyan-500/45 text-slate-900 dark:text-slate-100'
                : 'bg-slate-50 dark:bg-[#090e1c] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="text-xs font-semibold">External FastAPI Backend</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Attempts live requests to {API_BASE_URL} with automatic error handling and demo fallback.
            </p>
          </button>
        </div>
      </section>

      {/* Alert Threshold Preference */}
      <section className="p-5 rounded-xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800/80 space-y-4">
        <div className="flex items-center gap-2.5">
          <Sliders className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              High-Risk Alert Threshold
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Highlight zones exceeding this composite risk score for priority dispatch review.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <input
            type="range"
            min={50}
            max={95}
            step={5}
            value={alertThreshold}
            onChange={(e) => onChangeAlertThreshold(Number(e.target.value))}
            className="flex-1 accent-cyan-600 dark:accent-cyan-400 cursor-pointer"
          />
          <span className="font-mono tabular-nums text-sm font-bold text-cyan-700 dark:text-cyan-300 w-16 text-right">
            {alertThreshold}/100
          </span>
        </div>
      </section>
    </div>
  );
};
