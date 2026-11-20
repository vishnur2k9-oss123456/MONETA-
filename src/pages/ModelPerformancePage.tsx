import React, { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Info } from 'lucide-react';
import { ModelMetricSnapshot, ResolvedTheme } from '../types';
import { getChartTheme } from '../utils/chartTheme';

interface ModelPerformancePageProps {
  metrics: ModelMetricSnapshot;
  theme: ResolvedTheme;
}

export const ModelPerformancePage: React.FC<ModelPerformancePageProps> = ({
  metrics,
  theme,
}) => {
  const chartTheme = useMemo(() => getChartTheme(theme), [theme]);

  const metricCards = [
    { label: 'Model Accuracy', value: `${metrics.accuracy}%`, note: 'DEMO DATA · Synthetic validation' },
    { label: 'Precision', value: `${metrics.precision}%`, note: 'DEMO DATA · Positive cash-out zones' },
    { label: 'Recall', value: `${metrics.recall}%`, note: 'DEMO DATA · Sensitivity on high-risk' },
    { label: 'F1 Score', value: `${metrics.f1Score}%`, note: 'DEMO DATA · Harmonic balance' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight font-display">
          Model Performance & Evaluation
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
          Illustrative evaluation dashboard for geospatial withdrawal prediction models.
        </p>
      </div>

      {/* Mandatory explicit DEMO DATA disclaimer */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/35 text-xs text-amber-900 dark:text-amber-100">
        <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-amber-800 dark:text-amber-300">DEMO DATA NOTICE: </span>
          {metrics.evaluationNote} Connects to FastAPI{' '}
          <code className="font-mono text-amber-800 dark:text-amber-200">/feedback/</code> when backend evaluation runs are logged.
        </div>
      </div>

      {/* 4 Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {metricCards.map((card) => (
          <div
            key={card.label}
            className="p-5 rounded-xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800/80"
          >
            <div className="flex items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
              <span>{card.label}</span>
              <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400">DEMO DATA</span>
            </div>
            <div className="text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-2">
              {card.value}
            </div>
            <div className="text-[11px] text-slate-500 mt-2">{card.note}</div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Prediction Trends */}
        <section className="p-5 rounded-xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Prediction Trends (Demo Data)
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Weekly illustrative progression of Accuracy, Precision, Recall, and F1
              </p>
            </div>
            <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400">DEMO DATA</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.trendHistory} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridStroke} vertical={false} />
                <XAxis dataKey="week" stroke={chartTheme.axisStroke} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis domain={[70, 95]} unit="%" stroke={chartTheme.axisStroke} fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(v) => [`${v ?? 0}%`, '']}
                  contentStyle={chartTheme.tooltipStyle}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="accuracy" name="Accuracy" stroke="#06b6d4" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="precision" name="Precision" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="recall" name="Recall" stroke="#a855f7" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="f1" name="F1 Score" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Class Performance Chart */}
        <section className="p-5 rounded-xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Performance by Risk Tier (Demo Data)
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Precision, Recall, and F1 score across predicted risk classifications
              </p>
            </div>
            <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400">DEMO DATA</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.classPerformance} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridStroke} vertical={false} />
                <XAxis dataKey="riskClass" stroke={chartTheme.categoryAxisStroke} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis domain={[70, 95]} unit="%" stroke={chartTheme.axisStroke} fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(v) => [`${v ?? 0}%`, '']}
                  cursor={{ fill: chartTheme.cursorFill }}
                  contentStyle={chartTheme.tooltipStyle}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="precision" name="Precision" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="recall" name="Recall" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="f1" name="F1 Score" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Confusion Matrix Summary */}
      <section className="p-5 rounded-xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Validation Confusion Matrix Summary (Demo Data)
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Illustrative binary grouping of Critical/High vs Medium/Low zone predictions
            </p>
          </div>
          <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400">
            AUC-ROC: {metrics.aucRoc}% (Demo)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <th className="py-2.5 pr-4">Ground Truth Group</th>
                <th className="py-2.5 px-4 text-right">Predicted Critical / High</th>
                <th className="py-2.5 pl-4 text-right">Predicted Medium / Low</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/70 text-xs font-mono tabular-nums">
              {metrics.confusionMatrix.map((row) => (
                <tr key={row.actual}>
                  <td className="py-3 pr-4 font-sans font-medium text-slate-800 dark:text-slate-200">
                    {row.actual}
                  </td>
                  <td className="py-3 px-4 text-right text-cyan-700 dark:text-cyan-300">
                    {row.predictedCriticalHigh}
                  </td>
                  <td className="py-3 pl-4 text-right text-slate-700 dark:text-slate-300">
                    {row.predictedMediumLow}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
