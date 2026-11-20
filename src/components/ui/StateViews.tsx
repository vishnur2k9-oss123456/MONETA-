import React from 'react';
import { AlertTriangle, Database, RotateCcw, SearchX } from 'lucide-react';
import { RiskLevel } from '../../types';
import { getRiskMarkerBg, getRiskTextColor } from '../../utils/formatters';

export const RiskIndicator: React.FC<{
  level: RiskLevel;
  score?: number;
  className?: string;
}> = ({ level, score, className = '' }) => {
  return (
    <span className={`inline-flex items-center gap-2 text-xs font-medium whitespace-nowrap ${className}`}>
      <span
        className={`w-2 h-2 rounded-[2px] shrink-0 ${getRiskMarkerBg(level)}`}
        aria-hidden="true"
      />
      <span className={getRiskTextColor(level)}>{level}</span>
      {typeof score === 'number' && (
        <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">({score})</span>
      )}
    </span>
  );
};

export const DemoDataNotice: React.FC<{
  label?: string;
  detail?: string;
  compact?: boolean;
}> = ({
  label = 'Demo Data',
  detail = 'Showing synthetic sample intelligence. Connect FastAPI backend at http://localhost:8000 for live records.',
  compact = false,
}) => {
  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 text-xs text-cyan-700 dark:text-cyan-300/90 font-medium">
        <Database className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
        <span>{label}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-lg bg-cyan-50/70 dark:bg-[#0c1428] border border-cyan-200 dark:border-cyan-500/25 text-xs text-slate-700 dark:text-slate-300">
      <div className="flex items-center gap-2.5">
        <Database className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
        <span>
          <strong className="font-semibold text-cyan-800 dark:text-cyan-300 mr-1.5">{label}:</strong>
          {detail}
        </span>
      </div>
    </div>
  );
};

export const LoadingSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div
      className="space-y-3 p-4 rounded-xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800/80"
      aria-busy="true"
    >
      <div className="h-5 w-48 bg-slate-200 dark:bg-slate-800/80 rounded animate-pulse" />
      <div className="space-y-2.5 pt-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-10 w-full bg-slate-100 dark:bg-slate-800/50 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
};

export const EmptyState: React.FC<{
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ title, description, actionLabel, onAction }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6 rounded-xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800/80">
      <div className="w-11 h-11 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center mb-3">
        <SearchX className="w-5 h-5 text-slate-500 dark:text-slate-400" />
      </div>
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">{title}</h3>
      <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mb-4">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30 hover:bg-cyan-100 dark:hover:bg-cyan-500/25 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export const ErrorState: React.FC<{
  title?: string;
  message: string;
  onRetry?: () => void;
}> = ({ title = 'Unable to load records', message, onRetry }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/30">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-rose-900 dark:text-rose-200">{title}</h4>
          <p className="text-xs text-rose-700 dark:text-rose-300/80 mt-0.5">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 rounded-lg text-xs font-medium bg-rose-100 dark:bg-rose-500/15 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-500/30 hover:bg-rose-200 dark:hover:bg-rose-500/25 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Retry Connection
        </button>
      )}
    </div>
  );
};
