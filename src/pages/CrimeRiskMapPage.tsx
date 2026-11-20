import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Activity,
  Calendar,
  Clock,
  Database,
  FileText,
  Layers,
  MapPin,
  Navigation,
  Pause,
  Play,
  RefreshCw,
  Route,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  CyberComplaint,
  DataSourceMode,
  PageId,
  PredictedLocation,
  ResolvedTheme,
  RiskLevel,
} from '../types';
import { formatINR, formatINRCompact, getRiskHexColor } from '../utils/formatters';
import { EmptyState, RiskIndicator } from '../components/ui/StateViews';

interface CrimeRiskMapPageProps {
  locations: PredictedLocation[];
  complaints: CyberComplaint[];
  selectedZoneId: string;
  theme: ResolvedTheme;
  dataMode: DataSourceMode;
  backendWarning: string | null;
  onSelectZone: (zoneId: string) => void;
  onNavigate: (page: PageId) => void;
  onSyncBackend: () => void;
  onSwitchToDemo: () => void;
}

function buildCurvedArc(
  start: [number, number],
  end: [number, number],
  curvature = 0.2,
  segments = 24
): [number, number][] {
  const [lat1, lng1] = start;
  const [lat2, lng2] = end;
  const midLat = (lat1 + lat2) / 2;
  const midLng = (lng1 + lng2) / 2;
  const dLat = lat2 - lat1;
  const dLng = lng2 - lng1;
  const ctrlLat = midLat - dLng * curvature;
  const ctrlLng = midLng + dLat * curvature;

  const pts: [number, number][] = [];
  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const inv = 1 - t;
    const lat = inv * inv * lat1 + 2 * inv * t * ctrlLat + t * t * lat2;
    const lng = inv * inv * lng1 + 2 * inv * t * ctrlLng + t * t * lng2;
    pts.push([lat, lng]);
  }
  return pts;
}

const CORRIDOR_FLOW_PAIRS: [string, string][] = [
  ['LOC-JAI-06', 'LOC-DEL-01'],
  ['LOC-DEL-01', 'LOC-NOI-02'],
  ['LOC-PUN-08', 'LOC-MUM-03'],
  ['LOC-HYD-05', 'LOC-BLR-04'],
  ['LOC-KOL-07', 'LOC-DEL-01'],
];

export const CrimeRiskMapPage: React.FC<CrimeRiskMapPageProps> = ({
  locations,
  complaints,
  selectedZoneId,
  theme,
  dataMode,
  backendWarning,
  onSelectZone,
  onNavigate,
  onSyncBackend,
  onSwitchToDemo,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);

  const [riskFilter, setRiskFilter] = useState<'All' | RiskLevel>('All');
  const [dateFilter, setDateFilter] = useState<'All' | '24h' | '7d' | '30d'>('All');
  const [showDistrictZones, setShowDistrictZones] = useState(true);
  const [showDistrictLabels, setShowDistrictLabels] = useState(true);
  const [showHotspotRipples, setShowHotspotRipples] = useState(true);
  const [showCorridorFlows, setShowCorridorFlows] = useState(true);
  const [isTourActive, setIsTourActive] = useState(false);

  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      const matchesRisk = riskFilter === 'All' || loc.riskLevel === riskFilter;
      const matchesDate =
        dateFilter === 'All' ||
        (dateFilter === '24h' && loc.dateCategory === '24h') ||
        (dateFilter === '7d' && (loc.dateCategory === '24h' || loc.dateCategory === '7d')) ||
        dateFilter === '30d';
      return matchesRisk && matchesDate;
    });
  }, [locations, riskFilter, dateFilter]);

  const activeLocation = useMemo(() => {
    return (
      filteredLocations.find((l) => l.id === selectedZoneId) ||
      filteredLocations[0] ||
      null
    );
  }, [filteredLocations, selectedZoneId]);

  const relatedComplaints = useMemo(() => {
    if (!activeLocation) return [];
    return complaints.filter(
      (c) =>
        c.predictedWithdrawalZoneId === activeLocation.id ||
        c.district.toLowerCase() === activeLocation.district.toLowerCase()
    );
  }, [complaints, activeLocation]);

  // Initialize Leaflet with free OpenStreetMap tiles (zero API keys required)
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [21.5, 78.9],
      zoom: 5,
      zoomControl: true,
      scrollWheelZoom: true,
      zoomAnimation: true,
      fadeAnimation: true,
      markerZoomAnimation: true,
      inertia: true,
      inertiaDeceleration: 2400,
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    markerLayerRef.current = layerGroup;

    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerLayerRef.current = null;
    };
  }, []);

  // Realistic fly-through tour across filtered hotspots
  useEffect(() => {
    if (!isTourActive || filteredLocations.length === 0) return;

    const timer = setInterval(() => {
      const currentIdx = filteredLocations.findIndex((l) => l.id === activeLocation?.id);
      const nextLoc = filteredLocations[(currentIdx + 1) % filteredLocations.length];
      if (nextLoc) {
        onSelectZone(nextLoc.id);
        mapInstanceRef.current?.flyTo([nextLoc.lat, nextLoc.lng], 10, {
          duration: 1.5,
          easeLinearity: 0.22,
        });
      }
    }, 3400);

    return () => clearInterval(timer);
  }, [isTourActive, filteredLocations, activeLocation, onSelectZone]);

  // Render markers, district labels, ripples, and corridor arcs
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = markerLayerRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    if (filteredLocations.length === 0) return;

    // 1. Animated corridor flow arcs
    if (showCorridorFlows && filteredLocations.length > 1) {
      const visibleMap = new Map(filteredLocations.map((l) => [l.id, l]));
      CORRIDOR_FLOW_PAIRS.forEach(([fromId, toId]) => {
        const fromLoc = visibleMap.get(fromId);
        const toLoc = visibleMap.get(toId);
        if (!fromLoc || !toLoc) return;

        const arcPoints = buildCurvedArc(
          [fromLoc.lat, fromLoc.lng],
          [toLoc.lat, toLoc.lng],
          0.18
        );

        L.polyline(arcPoints, {
          color: theme === 'dark' ? '#38bdf8' : '#0284c7',
          weight: 2,
          opacity: 0.22,
        }).addTo(layerGroup);

        L.polyline(arcPoints, {
          color: theme === 'dark' ? '#22d3ee' : '#0ea5e9',
          weight: 2.2,
          opacity: 0.85,
          className: 'moneta-flow-arc',
        }).addTo(layerGroup);
      });
    }

    // 2. District catchment circles, radar ripples, clickable markers, and district labels
    filteredLocations.forEach((loc) => {
      const color = getRiskHexColor(loc.riskLevel);
      const isSelected = activeLocation?.id === loc.id;

      if (showDistrictZones) {
        L.circle([loc.lat, loc.lng], {
          radius: loc.riskScore * 550,
          color,
          weight: isSelected ? 1.8 : 1,
          opacity: isSelected ? 0.7 : 0.45,
          fillColor: color,
          fillOpacity: isSelected ? 0.24 : 0.14,
        }).addTo(layerGroup);
      }

      // Animated hotspot ripple effects for Critical and High risk zones (and active selection)
      if (
        showHotspotRipples &&
        (loc.riskLevel === 'Critical' || loc.riskLevel === 'High' || isSelected)
      ) {
        const rippleIcon = L.divIcon({
          className: 'moneta-hotspot-icon',
          iconSize: [48, 48],
          iconAnchor: [24, 24],
          html: `<div class="moneta-hotspot-ring" style="--hotspot-color:${color}">
            <span class="moneta-hotspot-wave"></span>
            <span class="moneta-hotspot-wave moneta-hotspot-wave-delay"></span>
          </div>`,
        });
        L.marker([loc.lat, loc.lng], {
          icon: rippleIcon,
          interactive: false,
          keyboard: false,
        }).addTo(layerGroup);
      }

      const marker = L.circleMarker([loc.lat, loc.lng], {
        radius: isSelected ? 10 : 8,
        color: isSelected ? (theme === 'dark' ? '#ffffff' : '#0f172a') : color,
        weight: isSelected ? 2.5 : 1.8,
        fillColor: color,
        fillOpacity: 0.94,
      }).addTo(layerGroup);

      // Permanent actual district label associated with each marker
      if (showDistrictLabels) {
        marker.bindTooltip(`${loc.district}`, {
          permanent: true,
          direction: 'top',
          offset: [0, -10],
          className: 'moneta-district-tooltip',
        });
      }

      const titleColor = theme === 'dark' ? '#f8fafc' : '#0f172a';
      const subColor = theme === 'dark' ? '#94a3b8' : '#475569';
      const bodyColor = theme === 'dark' ? '#cbd5e1' : '#334155';

      marker.bindPopup(
        `<div style="min-width:215px;line-height:1.5;">
          <div style="font-weight:700;font-size:13px;color:${titleColor};">${loc.district} (${loc.city})</div>
          <div style="font-size:11px;color:${subColor};margin-top:2px;">${loc.zoneName}</div>
          <div style="margin-top:6px;font-size:12px;">
            <strong style="color:${color};">${loc.riskLevel} Risk</strong> · Score: <strong>${loc.riskScore}/100</strong>
          </div>
          <div style="font-size:11px;color:${bodyColor};margin-top:2px;">
            Withdrawal Prob: <strong>${loc.withdrawalProbability}%</strong> · Confidence: <strong>${loc.predictionConfidence}%</strong>
          </div>
          <div style="font-size:11px;color:${bodyColor};margin-top:2px;">
            Related Complaints: <strong>${loc.relatedComplaintsCount}</strong>
          </div>
          <div style="font-size:11px;color:${subColor};margin-top:2px;">Window: ${loc.predictedWindow}</div>
        </div>`
      );

      marker.on('click', () => {
        setIsTourActive(false);
        onSelectZone(loc.id);
        map.flyTo([loc.lat, loc.lng], Math.max(map.getZoom(), 9), {
          duration: 1.0,
          easeLinearity: 0.25,
        });
      });

      if (isSelected) {
        marker.openPopup();
      }
    });
  }, [
    filteredLocations,
    activeLocation,
    showDistrictZones,
    showDistrictLabels,
    showHotspotRipples,
    showCorridorFlows,
    theme,
    onSelectZone,
  ]);

  const handleFocusLocation = (loc: PredictedLocation) => {
    setIsTourActive(false);
    onSelectZone(loc.id);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([loc.lat, loc.lng], 11, {
        duration: 1.25,
        easeLinearity: 0.22,
      });
    }
  };

  const handleResetView = () => {
    setIsTourActive(false);
    setRiskFilter('All');
    setDateFilter('All');
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([21.5, 78.9], 5, {
        duration: 1.2,
        easeLinearity: 0.25,
      });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight font-display">
            Geospatial Crime Risk Map
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            OpenStreetMap intelligence view displaying predicted district withdrawal hotspots, confidence levels, and linked complaints.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onSyncBackend}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-white dark:bg-[#0c1222] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:border-cyan-400 dark:hover:border-cyan-500/40 transition-colors cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Sync Python Backend</span>
          </button>

          <button
            type="button"
            onClick={() => setIsTourActive((prev) => !prev)}
            disabled={filteredLocations.length === 0}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap disabled:opacity-45 ${
              isTourActive
                ? 'bg-cyan-500 text-white border-cyan-500 shadow-sm'
                : 'bg-white dark:bg-[#0c1222] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-cyan-400 dark:hover:border-cyan-500/40'
            }`}
          >
            {isTourActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isTourActive ? 'Pause Tour' : 'Fly-Through Tour'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDistrictLabels((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
              showDistrictLabels
                ? 'bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/35'
                : 'bg-white dark:bg-[#0c1222] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>District Labels</span>
          </button>

          <button
            type="button"
            onClick={() => setShowHotspotRipples((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
              showHotspotRipples
                ? 'bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/35'
                : 'bg-white dark:bg-[#0c1222] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Ripples</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCorridorFlows((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
              showCorridorFlows
                ? 'bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/35'
                : 'bg-white dark:bg-[#0c1222] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
            }`}
          >
            <Route className="w-3.5 h-3.5" />
            <span>Corridors</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDistrictZones((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
              showDistrictZones
                ? 'bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/35'
                : 'bg-white dark:bg-[#0c1222] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Catchment</span>
          </button>
        </div>
      </div>

      {/* Data Source Context Bar (OpenStreetMap, no API key required) */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-[#0c1428] border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
        <div className="flex items-center gap-2.5">
          <Database className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
          <span>
            <strong className="font-semibold text-slate-900 dark:text-slate-100 mr-1.5">
              {dataMode === 'backend' ? 'Live FastAPI Database:' : 'Sample Preview Mode:'}
            </strong>
            {dataMode === 'backend'
              ? 'Fetching real predicted locations and districts from FastAPI /predictions/.'
              : 'Rendering OpenStreetMap with Leaflet. Connect your Python backend on port 8000 for live DB predictions.'}
          </span>
        </div>
        {dataMode === 'demo' && (
          <button
            type="button"
            onClick={onSyncBackend}
            className="text-xs font-medium text-cyan-700 dark:text-cyan-300 hover:underline cursor-pointer"
          >
            Connect FastAPI Now
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800/80">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-600 dark:text-slate-400 mr-1">Risk Level:</span>
          {(['All', 'Critical', 'High', 'Medium', 'Low'] as const).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setRiskFilter(level)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                riskFilter === level
                  ? 'bg-cyan-50 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/35'
                  : 'bg-slate-100 dark:bg-[#090e1c] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {level}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span className="text-xs text-slate-600 dark:text-slate-400 mr-1">Timeframe:</span>
          {(
            [
              { id: 'All', label: 'All Time' },
              { id: '24h', label: 'Last 24 Hours' },
              { id: '7d', label: 'Last 7 Days' },
              { id: '30d', label: 'Last 30 Days' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setDateFilter(opt.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                dateFilter === opt.id
                  ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/35'
                  : 'bg-slate-100 dark:bg-[#090e1c] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map + Details Split */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-stretch">
        {/* OpenStreetMap Leaflet Viewport */}
        <div className="xl:col-span-2 rounded-xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800/80 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {filteredLocations.length} predicted withdrawal zones
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => mapInstanceRef.current?.zoomIn()}
                  className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-cyan-600 cursor-pointer"
                  aria-label="Zoom in map"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => mapInstanceRef.current?.zoomOut()}
                  className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-cyan-600 cursor-pointer"
                  aria-label="Zoom out map"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleResetView}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-cyan-600 text-[11px] cursor-pointer"
                >
                  <Navigation className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Exact requested legend: Critical: Red, High: Orange, Medium: Yellow, Low: Green */}
            <div className="flex items-center gap-4 text-[11px] text-slate-600 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Critical
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> High
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" /> Medium
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Low
              </span>
            </div>
          </div>

          <div className="relative">
            <div
              ref={mapContainerRef}
              className="moneta-osm-map w-full h-[480px] xl:h-[580px] bg-slate-200 dark:bg-[#070b17] z-10"
              aria-label="OpenStreetMap Cybercrime Risk Map"
            />
            {filteredLocations.length === 0 && (
              <div className="absolute inset-0 z-20 flex items-center justify-center p-6 bg-slate-900/55 backdrop-blur-xs">
                <div className="max-w-md w-full">
                  <EmptyState
                    title={
                      dataMode === 'backend' && backendWarning
                        ? 'Python Backend Unreachable'
                        : 'No Prediction Data Available'
                    }
                    description={
                      dataMode === 'backend' && backendWarning
                        ? backendWarning
                        : dataMode === 'backend'
                        ? 'No predicted withdrawal locations were returned by the database for the active filters.'
                        : 'No predicted withdrawal zones match the active risk level or date range filters.'
                    }
                    actionLabel={
                      dataMode === 'backend' ? 'Switch to Sample Preview' : 'Reset Map Filters'
                    }
                    onAction={dataMode === 'backend' ? onSwitchToDemo : handleResetView}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* District & Zone Details Inspector */}
        <div className="rounded-xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800/80 p-5 flex flex-col">
          {!activeLocation ? (
            <EmptyState
              title="No District Selected"
              description={
                dataMode === 'backend'
                  ? 'Connect your FastAPI backend with prediction records or adjust filters to inspect district details.'
                  : 'Adjust risk level or timeframe filters to inspect predicted withdrawal districts.'
              }
              actionLabel={dataMode === 'backend' ? 'Retry Backend' : 'Reset Filters'}
              onAction={dataMode === 'backend' ? onSyncBackend : handleResetView}
            />
          ) : (
            <>
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800/80">
                <div>
                  <div className="text-[11px] font-mono text-cyan-700 dark:text-cyan-400">
                    {activeLocation.id} · {activeLocation.district}
                  </div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1 font-display">
                    {activeLocation.district} — {activeLocation.city}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    {activeLocation.zoneName}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                    {activeLocation.riskScore}
                    <span className="text-xs text-slate-500 font-normal">/100</span>
                  </div>
                  <RiskIndicator level={activeLocation.riskLevel} />
                </div>
              </div>

              <div className="py-4 space-y-2.5 text-xs border-b border-slate-200 dark:border-slate-800/80">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-600 dark:text-slate-400">
                    Predicted Withdrawal Probability
                  </span>
                  <span className="font-mono tabular-nums font-semibold text-red-600 dark:text-red-400">
                    {activeLocation.withdrawalProbability}%
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-600 dark:text-slate-400">
                    Prediction Confidence
                  </span>
                  <span className="font-mono tabular-nums font-semibold text-cyan-700 dark:text-cyan-300">
                    {activeLocation.predictionConfidence}%
                  </span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-600 dark:text-slate-400">ATM Cluster</span>
                  <span className="text-slate-900 dark:text-slate-200 text-right">
                    {activeLocation.atmCluster}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Predicted Window
                  </span>
                  <span className="font-mono text-cyan-700 dark:text-cyan-300">
                    {activeLocation.predictedWindow}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-600 dark:text-slate-400">Est. Amount at Risk</span>
                  <span className="font-mono text-orange-600 dark:text-orange-300 font-semibold">
                    {formatINRCompact(activeLocation.estimatedAmountAtRisk)}
                  </span>
                </div>
              </div>

              {/* Relevant Complaint Information */}
              <div className="py-3.5 border-b border-slate-200 dark:border-slate-800/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    Relevant Complaints ({relatedComplaints.length || activeLocation.relatedComplaintsCount})
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavigate('complaints')}
                    className="text-[11px] text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
                  >
                    Open All
                  </button>
                </div>

                {relatedComplaints.length === 0 ? (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {activeLocation.relatedComplaintsCount} complaints linked in {activeLocation.district} ({activeLocation.complaintVelocity}).
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {relatedComplaints.map((comp) => (
                      <button
                        key={comp.id}
                        type="button"
                        onClick={() => onNavigate('complaints')}
                        className="w-full text-left p-2 rounded-lg bg-slate-50 dark:bg-[#090e1c] border border-slate-200 dark:border-slate-800 hover:border-cyan-400 dark:hover:border-cyan-500/40 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-mono font-semibold text-cyan-700 dark:text-cyan-300">
                            {comp.id}
                          </span>
                          <span className="font-mono text-slate-700 dark:text-slate-300">
                            {formatINR(comp.reportedAmount)}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate mt-0.5">
                          {comp.type} · {comp.status}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Zone quick-jump list */}
              <div className="pt-3.5 flex-1 flex flex-col">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  District Hotspots ({filteredLocations.length})
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 flex-1">
                  {filteredLocations.map((loc) => (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => handleFocusLocation(loc)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                        loc.id === activeLocation.id
                          ? 'bg-cyan-50 dark:bg-cyan-500/15 text-cyan-800 dark:text-cyan-200 border border-cyan-200 dark:border-cyan-500/35'
                          : 'bg-slate-50 dark:bg-[#090e1c] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <span className="truncate flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        {loc.district} · {loc.city}
                      </span>
                      <span className="font-mono tabular-nums shrink-0 font-semibold">
                        {loc.riskScore}
                      </span>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate('predictive-analytics')}
                  className="mt-3 w-full py-2.5 px-4 rounded-lg text-xs font-medium bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/35 hover:bg-cyan-100 dark:hover:bg-cyan-500/25 transition-colors cursor-pointer"
                >
                  Open Explainability & Global Drivers
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
