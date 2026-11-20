import { ResolvedTheme } from '../types';

export function getChartTheme(theme: ResolvedTheme) {
  const isDark = theme === 'dark';
  return {
    gridStroke: isDark ? '#1e293b' : '#e2e8f0',
    axisStroke: isDark ? '#64748b' : '#64748b',
    categoryAxisStroke: isDark ? '#cbd5e1' : '#334155',
    cursorFill: isDark ? 'rgba(148,163,184,0.06)' : 'rgba(15,23,42,0.04)',
    tooltipStyle: {
      backgroundColor: isDark ? '#090e1c' : '#ffffff',
      border: isDark
        ? '1px solid rgba(56,189,248,0.25)'
        : '1px solid rgba(15,23,42,0.12)',
      borderRadius: '8px',
      fontSize: '12px',
      color: isDark ? '#f1f5f9' : '#0f172a',
      boxShadow: isDark
        ? '0 10px 25px rgba(0,0,0,0.45)'
        : '0 10px 25px rgba(15,23,42,0.08)',
    },
  };
}
