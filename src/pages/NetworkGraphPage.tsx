import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowLeftRight,
  Building2,
  RotateCcw,
  ShieldAlert,
  Smartphone,
  UserCheck,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { GraphEdge, GraphEntityType, GraphNode, ResolvedTheme } from '../types';
import { formatINR, getRiskHexColor } from '../utils/formatters';
import { DemoDataNotice, RiskIndicator } from '../components/ui/StateViews';

interface NetworkGraphPageProps {
  initialNodes: GraphNode[];
  edges: GraphEdge[];
  theme: ResolvedTheme;
}

const ENTITY_META: Record<
  GraphEntityType,
  { label: string; color: string; icon: React.ComponentType<{ className?: string }> }
> = {
  bank_account: { label: 'Bank Account', color: '#3b82f6', icon: Building2 },
  mobile_number: { label: 'Mobile Number', color: '#06b6d4', icon: Smartphone },
  beneficiary: { label: 'Beneficiary', color: '#a855f7', icon: UserCheck },
  transaction: { label: 'Transaction', color: '#f59e0b', icon: ArrowLeftRight },
  suspicious_entity: { label: 'Suspicious Entity / ATM', color: '#f43f5e', icon: ShieldAlert },
};

export const NetworkGraphPage: React.FC<NetworkGraphPageProps> = ({
  initialNodes,
  edges,
  theme,
}) => {
  const [nodes, setNodes] = useState<GraphNode[]>(initialNodes);
  const [selectedNodeId, setSelectedNodeId] = useState<string>(initialNodes[0]?.id ?? '');
  const [typeFilter, setTypeFilter] = useState<'all' | GraphEntityType>('all');
  const [zoom, setZoom] = useState<number>(1);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const isDark = theme === 'dark';

  const visibleNodeIds = useMemo(() => {
    if (typeFilter === 'all') return new Set(nodes.map((n) => n.id));
    return new Set(nodes.filter((n) => n.type === typeFilter).map((n) => n.id));
  }, [nodes, typeFilter]);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) || nodes[0] || null,
    [nodes, selectedNodeId]
  );

  const connectedEdges = useMemo(() => {
    if (!selectedNode) return [];
    return edges.filter(
      (e) => e.source === selectedNode.id || e.target === selectedNode.id
    );
  }, [edges, selectedNode]);

  const connectedNodeIds = useMemo(() => {
    const set = new Set<string>();
    if (selectedNode) set.add(selectedNode.id);
    connectedEdges.forEach((e) => {
      set.add(e.source);
      set.add(e.target);
    });
    return set;
  }, [connectedEdges, selectedNode]);

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!draggingId || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const viewW = 900 / zoom;
    const viewH = 540 / zoom;
    const offsetX = (900 - viewW) / 2;
    const offsetY = (540 - viewH) / 2;

    const x = offsetX + ((e.clientX - rect.left) / rect.width) * viewW;
    const y = offsetY + ((e.clientY - rect.top) / rect.height) * viewH;

    setNodes((prev) =>
      prev.map((n) =>
        n.id === draggingId
          ? { ...n, x: Math.max(45, Math.min(855, x)), y: Math.max(45, Math.min(495, y)) }
          : n
      )
    );
  };

  const resetGraph = () => {
    setNodes(initialNodes);
    setZoom(1);
    setTypeFilter('all');
  };

  const viewW = 900 / zoom;
  const viewH = 540 / zoom;
  const minX = (900 - viewW) / 2;
  const minY = (540 - viewH) / 2;

  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight font-display">
            Network Graph Analysis
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Interactive entity-relationship graph linking bank accounts, mobile numbers, beneficiaries, transactions, and target ATM clusters.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(1.5, Number((z + 0.15).toFixed(2))))}
            className="p-2 rounded-lg bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-cyan-700 dark:hover:text-cyan-300 hover:border-cyan-400 dark:hover:border-cyan-500/40 cursor-pointer"
            aria-label="Zoom in graph"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.75, Number((z - 0.15).toFixed(2))))}
            className="p-2 rounded-lg bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-cyan-700 dark:hover:text-cyan-300 hover:border-cyan-400 dark:hover:border-cyan-500/40 cursor-pointer"
            aria-label="Zoom out graph"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={resetGraph}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-cyan-400 dark:hover:border-cyan-500/40 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Layout</span>
          </button>
        </div>
      </div>

      <DemoDataNotice detail="Sample mule-layering network graph. Drag any node to reposition; click a node to trace connected money-laundering hops." />

      {/* Entity Type Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800/80">
        <button
          type="button"
          onClick={() => setTypeFilter('all')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
            typeFilter === 'all'
              ? 'bg-cyan-50 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/35'
              : 'bg-slate-100 dark:bg-[#090e1c] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          All Entities ({nodes.length})
        </button>
        {(Object.keys(ENTITY_META) as GraphEntityType[]).map((typeKey) => {
          const meta = ENTITY_META[typeKey];
          const Icon = meta.icon;
          return (
            <button
              key={typeKey}
              type="button"
              onClick={() => setTypeFilter(typeKey)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                typeFilter === typeKey
                  ? 'bg-cyan-50 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/35'
                  : 'bg-slate-100 dark:bg-[#090e1c] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{meta.label}</span>
            </button>
          );
        })}
      </div>

      {/* Graph Canvas + Inspector */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-stretch">
        <div className="xl:col-span-2 rounded-xl bg-slate-50 dark:bg-[#070b17] border border-slate-200 dark:border-slate-800/80 overflow-hidden relative">
          <svg
            ref={svgRef}
            viewBox={`${minX} ${minY} ${viewW} ${viewH}`}
            className="w-full h-[460px] xl:h-[540px] select-none touch-none"
            onPointerMove={handlePointerMove}
            onPointerUp={() => setDraggingId(null)}
            onPointerLeave={() => setDraggingId(null)}
          >
            <defs>
              <pattern id="grid-pattern" width="36" height="36" patternUnits="userSpaceOnUse">
                <path
                  d="M 36 0 L 0 0 0 36"
                  fill="none"
                  stroke={isDark ? 'rgba(148, 163, 184, 0.06)' : 'rgba(15, 23, 42, 0.06)'}
                  strokeWidth="1"
                />
              </pattern>
              <marker
                id="arrow-suspicious"
                viewBox="0 0 10 10"
                refX="24"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill={isDark ? '#38bdf8' : '#0284c7'} />
              </marker>
              <marker
                id="arrow-muted"
                viewBox="0 0 10 10"
                refX="24"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill={isDark ? '#475569' : '#94a3b8'} />
              </marker>
            </defs>

            <rect x="0" y="0" width="900" height="540" fill="url(#grid-pattern)" />

            {/* Edges */}
            {edges.map((edge) => {
              const src = nodes.find((n) => n.id === edge.source);
              const dst = nodes.find((n) => n.id === edge.target);
              if (!src || !dst) return null;

              const isHighlighted =
                selectedNode &&
                (edge.source === selectedNode.id || edge.target === selectedNode.id);
              const isVisible =
                visibleNodeIds.has(src.id) || visibleNodeIds.has(dst.id);

              const midX = (src.x + dst.x) / 2;
              const midY = (src.y + dst.y) / 2;

              return (
                <g key={edge.id} opacity={isVisible ? 1 : 0.2}>
                  <line
                    x1={src.x}
                    y1={src.y}
                    x2={dst.x}
                    y2={dst.y}
                    stroke={
                      isHighlighted
                        ? isDark
                          ? '#22d3ee'
                          : '#0284c7'
                        : edge.suspicious
                        ? '#3b82f6'
                        : isDark
                        ? '#475569'
                        : '#94a3b8'
                    }
                    strokeWidth={isHighlighted ? 2.4 : 1.4}
                    strokeDasharray={edge.suspicious ? undefined : '4 4'}
                    markerEnd={
                      isHighlighted || edge.suspicious
                        ? 'url(#arrow-suspicious)'
                        : 'url(#arrow-muted)'
                    }
                  />
                  <rect
                    x={midX - 44}
                    y={midY - 9}
                    width={88}
                    height={18}
                    rx={4}
                    fill={isDark ? '#090e1c' : '#ffffff'}
                    stroke={isDark ? 'rgba(51,65,85,0.7)' : 'rgba(148,163,184,0.6)'}
                    strokeWidth={0.8}
                  />
                  <text
                    x={midX}
                    y={midY + 3}
                    textAnchor="middle"
                    fill={
                      isHighlighted
                        ? isDark
                          ? '#67e8f9'
                          : '#0369a1'
                        : isDark
                        ? '#94a3b8'
                        : '#475569'
                    }
                    fontSize="9"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {edge.label}
                  </text>
                </g>
              );
            })}

            {/* Nodes */}
            {nodes.map((node) => {
              const meta = ENTITY_META[node.type];
              const isSelected = selectedNode?.id === node.id;
              const isNeighbor = connectedNodeIds.has(node.id);
              const isVisible = visibleNodeIds.has(node.id);
              const ringColor = getRiskHexColor(node.riskLevel);

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  opacity={isVisible ? (selectedNode && !isNeighbor ? 0.5 : 1) : 0.2}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setSelectedNodeId(node.id);
                    setDraggingId(node.id);
                  }}
                  style={{ cursor: draggingId === node.id ? 'grabbing' : 'grab' }}
                >
                  <circle
                    r={isSelected ? 27 : 22}
                    fill={isDark ? '#0c1222' : '#ffffff'}
                    stroke={isSelected ? (isDark ? '#ffffff' : '#0f172a') : ringColor}
                    strokeWidth={isSelected ? 2.8 : 2}
                  />
                  <circle r={15} fill={meta.color} fillOpacity={isDark ? 0.2 : 0.14} />
                  <text
                    y={4}
                    textAnchor="middle"
                    fill={meta.color}
                    fontSize="10"
                    fontWeight="700"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {node.riskScore}
                  </text>
                  <text
                    y={38}
                    textAnchor="middle"
                    fill={isDark ? '#f1f5f9' : '#0f172a'}
                    fontSize="11"
                    fontWeight="600"
                    fontFamily="DM Sans, sans-serif"
                  >
                    {node.label}
                  </text>
                  <text
                    y={51}
                    textAnchor="middle"
                    fill={isDark ? '#94a3b8' : '#475569'}
                    fontSize="9.5"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {node.sublabel}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Node Details */}
        {selectedNode && (
          <aside className="rounded-xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800/80 p-5 flex flex-col space-y-4">
            <div className="pb-3 border-b border-slate-200 dark:border-slate-800/80 flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] font-mono text-cyan-700 dark:text-cyan-400">
                  {ENTITY_META[selectedNode.type].label} · {selectedNode.id}
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1 font-display">
                  {selectedNode.label}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  {selectedNode.sublabel}
                </p>
              </div>
              <RiskIndicator level={selectedNode.riskLevel} score={selectedNode.riskScore} />
            </div>

            <div className="space-y-2 text-xs">
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                Entity Attributes
              </div>
              {Object.entries(selectedNode.metadata).map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-center justify-between gap-2 py-1.5 border-b border-slate-200 dark:border-slate-800/60"
                >
                  <span className="text-slate-500 dark:text-slate-400">{k}</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200 text-right">{v}</span>
                </div>
              ))}
            </div>

            <div className="flex-1 space-y-2">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Connected Hops ({connectedEdges.length})
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {connectedEdges.map((edge) => {
                  const otherId =
                    edge.source === selectedNode.id ? edge.target : edge.source;
                  const otherNode = nodes.find((n) => n.id === otherId);
                  const direction =
                    edge.source === selectedNode.id ? 'Outbound →' : 'Inbound ←';
                  return (
                    <button
                      key={edge.id}
                      type="button"
                      onClick={() => otherNode && setSelectedNodeId(otherNode.id)}
                      className="w-full text-left p-2.5 rounded-lg bg-slate-50 dark:bg-[#090e1c] border border-slate-200 dark:border-slate-800 hover:border-cyan-400 dark:hover:border-cyan-500/40 transition-colors text-xs cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-cyan-700 dark:text-cyan-300 font-medium">
                          {direction}
                        </span>
                        <span className="font-mono text-slate-500 dark:text-slate-400">
                          {edge.label}
                        </span>
                      </div>
                      <div className="text-slate-900 dark:text-slate-200 font-medium mt-1">
                        {otherNode?.label ?? otherId}
                      </div>
                      {edge.amount && (
                        <div className="text-[11px] font-mono text-amber-600 dark:text-amber-300 mt-0.5">
                          {formatINR(edge.amount)}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
