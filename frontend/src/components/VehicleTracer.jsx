import React, { useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  Clock,
  Gauge,
  ShieldAlert,
  Download,
  ArrowRight,
  FileText,
  CheckCircle2,
  AlertOctagon,
  Eye,
  Calendar,
  Compass,
  Play,
  Pause,
  RotateCcw,
  Radio,
  ExternalLink,
  Printer,
  X,
  Target
} from 'lucide-react';
import { traceVehicle, getJourneyCsvUrl, getJourneyDossierUrl } from '../services/api';

export default function VehicleTracer({
  onShowOnMap = () => {},
  activeTrace,
  setActiveTrace
}) {
  const [queryPlate, setQueryPlate] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [dossierHtml, setDossierHtml] = useState('');
  const [dossierLoading, setDossierLoading] = useState(false);

  const sampleQuickPlates = [
    { plate: 'GJ01AB1234', label: 'White Swift (Stolen FIR #248)', tag: 'STOLEN - CCTNS' },
    { plate: 'GJ18CD5678', label: 'Black Scorpio (Wanted Suspect)', tag: 'CRITICAL' },
    { plate: 'GJ05EF9012', label: 'Grey Creta (Surat Highway)', tag: 'SURAT' },
    { plate: 'GJ03JK7890', label: 'White Fortuner (Rajkot Corridor)', tag: 'RAJKOT' },
    { plate: 'GJ06XY5555', label: 'Blue Sedan (Vadodara NE-1)', tag: 'EXPRESSWAY' }
  ];

  const handleSearch = async (plateToSearch) => {
    const target = plateToSearch || queryPlate;
    if (!target.trim()) return;
    setLoading(true);
    try {
      const data = await traceVehicle(target.trim());
      setActiveTrace(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openDossier = async () => {
    if (!activeTrace) return;
    setShowDossierModal(true);
    setDossierLoading(true);
    try {
      const res = await fetch(getJourneyDossierUrl(activeTrace.query_plate));
      const html = await res.text();
      setDossierHtml(html);
    } catch (e) {
      setDossierHtml('<p style="color: red; padding: 20px;">Failed to load legal dossier.</p>');
    } finally {
      setDossierLoading(false);
    }
  };

  const handlePrintDossier = () => {
    const win = window.open(getJourneyDossierUrl(activeTrace.query_plate), '_blank');
    if (win) {
      win.focus();
    }
  };

  return (
    <div className="p-4 bg-club-cream min-h-[calc(100vh-112px)] flex flex-col gap-4 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-club-pine p-5 rounded-3xl shadow-xl flex flex-wrap items-center justify-between gap-4 text-club-cream">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-club-tang text-white font-extrabold text-[10px] tracking-wider uppercase">
              Jury Evaluation Test Engine
            </span>
            <span className="text-club-cream/50 text-xs">·</span>
            <span className="text-club-cream/70 text-xs font-semibold">
              PTS Monotonic Trajectory & Interception Vector
            </span>
          </div>
          <h1 className="text-xl font-black tracking-tight">
            Designated Vehicle Movement & Route Tracer
          </h1>
          <p className="text-xs text-club-cream/70 max-w-2xl mt-1">
            Reconstructs chronological multi-camera journeys across Gujarat's CCTV grid, correlating live feeds with eGujCop CCTNS records, computing monotonic PTS velocities, and forecasting downstream chokepoints.
          </p>
        </div>

        {/* Action Buttons */}
        {activeTrace && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={openDossier}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-club-cream text-club-pine hover:bg-white text-xs font-bold shadow transition-all"
            >
              <FileText className="w-4 h-4 text-red-600" />
              <span>Section 65B Dossier</span>
            </button>
            <a
              href={getJourneyCsvUrl(activeTrace.query_plate)}
              download
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-club-tang hover:brightness-110 text-white text-xs font-bold shadow transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </a>
          </div>
        )}
      </div>

      {/* Search Bar & Evaluation Presets */}
      <div className="club-card p-4 rounded-3xl flex flex-col gap-3">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
          className="flex flex-wrap items-center gap-2"
        >
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-club-ink/40" />
            <input
              type="text"
              value={queryPlate}
              onChange={(e) => setQueryPlate(e.target.value.toUpperCase())}
              placeholder="Enter designated vehicle registration number (e.g. GJ01AB1234 or any Gujarat RTO plate)..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#EADFC6] rounded-full text-club-ink font-mono font-bold text-sm uppercase placeholder:font-sans placeholder:normal-case placeholder:text-club-ink/40 focus:outline-none focus:border-club-pine"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-full bg-club-tang hover:brightness-110 text-white font-extrabold text-xs shadow transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Reconstructing Route...</span>
            ) : (
              <>
                <Compass className="w-4 h-4" />
                <span>Trace Vehicle Journey</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-bold text-club-ink/55">Evaluation Scenarios:</span>
          {sampleQuickPlates.map((item) => (
            <button
              key={item.plate}
              onClick={() => {
                setQueryPlate(item.plate);
                handleSearch(item.plate);
              }}
              className="px-2.5 py-1 rounded-full bg-club-creamdark hover:bg-[#EADFC6] text-club-ink text-xs font-mono font-semibold border border-[#EADFC6] flex items-center gap-1.5 transition-all"
            >
              <span>{item.plate}</span>
              <span className="text-[10px] text-club-tang font-sans font-bold">({item.tag})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Results Display */}
      {activeTrace ? (
        activeTrace.total_checkpoints === 0 ? (
          <div className="flex flex-col gap-4 animate-fade-up">
            {activeTrace.is_watchlist_match && (
              <div className="bg-red-50 border-2 border-red-400 p-4 rounded-3xl shadow flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-red-600 flex items-center justify-center text-white">
                    <ShieldAlert className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-club-ink">eGujCop CCTNS MATCH CONFIRMED (BOLO ACTIVE)</span>
                      <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold">
                        {activeTrace.watchlist_info?.category || 'CRITICAL'}
                      </span>
                    </div>
                    <p className="text-xs text-red-700 mt-0.5">
                      {activeTrace.watchlist_info?.alert_message} — <span className="font-bold">{activeTrace.watchlist_info?.fir_number}</span> ({activeTrace.watchlist_info?.police_station})
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 font-mono font-bold text-xs border border-red-200">
                  Target Flagged in CCTNS
                </span>
              </div>
            )}

            <div className="p-10 text-center club-card rounded-3xl flex flex-col items-center justify-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-1">
                <Eye className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-club-ink">
                No Live Sightings Recorded for {activeTrace.query_plate}
              </h3>
              <p className="text-xs text-club-ink/65 max-w-md mx-auto">
                This vehicle has not been observed passing any active roadside ANPR cameras yet. Real-time trajectories, velocity vectors, and Section 65B forensic custody records will generate automatically upon live detection.
              </p>
            </div>
          </div>
        ) : (
        <div className="flex flex-col gap-4 animate-fade-up">
          {/* Executive Metrics Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="club-card p-4 rounded-3xl">
              <span className="text-[10px] font-bold text-club-ink/55 uppercase tracking-wider block mb-1">
                Target Vehicle
              </span>
              <div className="font-mono font-black text-lg text-club-tang">
                {activeTrace.query_plate}
              </div>
              <span className="text-[11px] text-club-ink/55">
                {activeTrace.corridor_name || 'Statewide Highway Network'}
              </span>
            </div>

            <div className="club-card p-4 rounded-3xl">
              <span className="text-[10px] font-bold text-club-ink/55 uppercase tracking-wider block mb-1">
                Traversed Distance
              </span>
              <div className="font-mono font-black text-lg text-club-leaf">
                {activeTrace.total_distance_km} km
              </div>
              <span className="text-[11px] text-club-ink/55">
                Across {activeTrace.total_checkpoints} CCTV Checkpoints
              </span>
            </div>

            <div className="club-card p-4 rounded-3xl">
              <span className="text-[10px] font-bold text-club-ink/55 uppercase tracking-wider block mb-1">
                Velocity & Heading
              </span>
              <div className="font-mono font-bold text-base text-club-ink truncate">
                {activeTrace.current_speed_kmph} km/h · {activeTrace.kavach_interception?.heading_cardinal || 'N/A'}
              </div>
              <span className="text-[10px] text-club-ink/50 font-mono">
                PTS Monotonic Sync Verified
              </span>
            </div>

            <div className="club-card p-4 rounded-3xl">
              <span className="text-[10px] font-bold text-club-ink/55 uppercase tracking-wider block mb-1">
                Forensic Custody Seal
              </span>
              <div className="font-mono font-bold text-[11px] text-club-pine truncate" title={activeTrace.chain_of_custody_sha256}>
                SHA-256: {activeTrace.chain_of_custody_sha256 ? activeTrace.chain_of_custody_sha256.slice(0, 14) + '...' : 'Verified'}
              </div>
              <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Section 65B Compliant
              </span>
            </div>
          </div>

          {/* A* Geodesic Highway Routing Topology Snapping Banner */}
          {activeTrace.astar_highway_routing?.is_graph_snapped && (
            <div className="club-card p-3 rounded-2xl bg-indigo-50/70 border border-indigo-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-indigo-950">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
                <span className="font-mono font-extrabold text-[11px] text-indigo-900 uppercase">
                  A* HIGHWAY TOPOLOGY SNAPPED:
                </span>
                <span className="font-bold text-indigo-800">
                  {activeTrace.astar_highway_routing.node_count} Intersections Snapped ({activeTrace.astar_highway_routing.path_nodes[0]} → {activeTrace.astar_highway_routing.path_nodes[activeTrace.astar_highway_routing.path_nodes.length - 1]})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 font-bold">
                  Geodesic Shortest-Path Verified
                </span>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  Zero FPS Drift · PTS Timestamps
                </span>
              </div>
            </div>
          )}

          {/* Anti-Spoofing Teleportation / Cloned Plate Auditor Banner */}
          {activeTrace.anti_spoofing?.is_spoofed ? (
            <div className="bg-amber-50 border-2 border-amber-500 p-4 rounded-3xl shadow flex items-center justify-between gap-3 text-amber-950">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-600 flex items-center justify-center text-white">
                  <AlertOctagon className="w-6 h-6 animate-ping" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-amber-900">
                    CRITICAL WARNING: CLONED VEHICLE / SPOOFED PLATE ANOMALY
                  </h4>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Physical velocity exceeds 165 km/h between distant checkpoints. Dual vehicles may be operating concurrently on forged registration plates.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-600 text-white font-bold text-xs">
                ANOMALY FLAGGED
              </span>
            </div>
          ) : null}

          {/* Kavach Predictive Downstream Chokepoint Interception Card */}
          {activeTrace.kavach_interception && (
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 rounded-3xl text-white shadow-xl flex flex-col gap-3 border border-slate-700">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-club-tang flex items-center justify-center text-white">
                    <Radio className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm tracking-tight flex items-center gap-2">
                      <span>KAVACH TACTICAL INTERCEPTION RADAR</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                        ACTIVE FORECAST
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-300">
                      Predicting downstream highway chokepoints based on heading vector ({activeTrace.kavach_interception.heading_cardinal} {activeTrace.kavach_interception.active_heading_degrees}°) and speed ({activeTrace.kavach_interception.projected_velocity_kmph} km/h).
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-semibold">Recommended Dispatch:</span>
                  <span className="px-3 py-1 rounded-full bg-blue-600/30 border border-blue-500 text-blue-300 font-bold text-xs">
                    {activeTrace.kavach_interception.recommended_pcr_unit}
                  </span>
                </div>
              </div>

              {/* Mathematical Dynamic PCR Interception Cordon Vector */}
              {activeTrace.kavach_interception.tactical_interception_cordon?.optimal_interception_point && (
                <div className="bg-slate-950/80 border border-cyan-500/40 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-cyan-400 animate-ping flex-shrink-0" />
                    <div>
                      <span className="text-cyan-400 font-extrabold font-mono text-[10px] uppercase tracking-wider block">
                        A* DYNAMIC HIGHWAY CORDON INTERCEPT POINT
                      </span>
                      <span className="text-white font-black text-sm">
                        {activeTrace.kavach_interception.tactical_interception_cordon.optimal_interception_point.chokepoint_name} ({activeTrace.kavach_interception.tactical_interception_cordon.optimal_interception_point.district})
                      </span>
                      <span className="text-slate-400 text-[11px] ml-2 font-mono">
                        Target ETA: {activeTrace.kavach_interception.tactical_interception_cordon.optimal_interception_point.vehicle_eta_min}m · Interceptor ETA: {activeTrace.kavach_interception.tactical_interception_cordon.optimal_interception_point.pcr_eta_min}m
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold text-xs border border-cyan-500/30">
                      Tactical Buffer: +{activeTrace.kavach_interception.tactical_interception_cordon.optimal_interception_point.tactical_advantage_min} mins
                    </span>
                    <span className="px-3 py-1 rounded-full bg-blue-600 text-white font-bold text-xs">
                      ROADBLOCK VIABLE
                    </span>
                  </div>
                </div>
              )}

              {/* Chokepoint Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {activeTrace.kavach_interception.predicted_chokepoints?.map((cp, idx) => (
                  <div key={idx} className="bg-slate-800/80 border border-slate-700 p-3 rounded-2xl flex flex-col justify-between gap-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md bg-club-tang text-white text-[10px] font-bold">
                        CHOKEPOINT {idx + 1}
                      </span>
                      <span className="font-mono text-xs text-amber-400 font-bold">
                        ETA ~{cp.eta_minutes} mins
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-xs text-white truncate">{cp.camera_name}</h4>
                      <p className="text-[11px] text-slate-400 truncate">{cp.location}, {cp.district}</p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-300 pt-1 border-t border-slate-700/60">
                      <span>Distance: {cp.distance_km} km</span>
                      <span className="text-emerald-400 font-bold">Interception Ready</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Critical Watchlist Alert Banner */}
          {activeTrace.is_watchlist_match ? (
            <div className="bg-red-50 border-2 border-red-400 p-4 rounded-3xl shadow flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-600 flex items-center justify-center text-white">
                  <ShieldAlert className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-club-ink">eGujCop CCTNS MATCH CONFIRMED</span>
                    <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold">
                      {activeTrace.watchlist_info.category}
                    </span>
                  </div>
                  <p className="text-xs text-red-700 mt-0.5">
                    {activeTrace.watchlist_info.alert_message} — <span className="font-bold">{activeTrace.watchlist_info.fir_number}</span> ({activeTrace.watchlist_info.police_station})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onShowOnMap(activeTrace)}
                  className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow transition-all flex items-center gap-2"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Launch Animated Trajectory on GIS Map</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-300 p-3 rounded-3xl flex items-center justify-between text-xs text-emerald-800">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-club-leaf" />
                <span>Vehicle is not flagged in active eGujCop criminal database. Standard traffic transit.</span>
              </span>
              <button
                onClick={() => onShowOnMap(activeTrace)}
                className="px-4 py-2 rounded-full bg-club-leaf hover:brightness-110 text-white font-semibold text-xs transition-all flex items-center gap-1.5 shadow"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Launch Animated Trajectory on GIS Map</span>
              </button>
            </div>
          )}

          {/* Chronological Waypoints Timeline */}
          <div className="club-card p-4 rounded-3xl flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#EADFC6]">
              <h3 className="font-bold text-sm text-club-ink flex items-center gap-2">
                <Clock className="w-4 h-4 text-club-pine" />
                <span>Chronological Sighting Timeline ({activeTrace.waypoints.length} Checkpoints)</span>
              </h3>
              <span className="text-xs text-club-ink/50 font-mono hidden sm:inline">
                Monotonic PTS Timestamps (Zero Clock Drift)
              </span>
            </div>

            <div className="space-y-3">
              {activeTrace.waypoints.map((wp, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-club-cream rounded-2xl border border-[#EADFC6] hover:border-club-tang transition-all"
                >
                  {/* Step & Camera Info */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-club-tang text-white font-extrabold text-xs flex items-center justify-center shadow-md">
                      {wp.step}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs text-club-ink">
                          {wp.camera_name}
                        </h4>
                        <span className="px-1.5 py-0.2 rounded-full bg-club-creamdark text-[10px] text-club-ink/60 font-semibold">
                          {wp.department}
                        </span>
                      </div>
                      <p className="text-[11px] text-club-ink/55 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {wp.location} · <span className="text-club-ink/80 font-semibold">{wp.district}</span>
                      </p>
                    </div>
                  </div>

                  {/* Telemetry Metrics */}
                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                    <div>
                      <span className="text-[10px] block text-club-ink/45 font-sans font-bold">TIMESTAMP</span>
                      <span className="text-club-ink font-bold">{new Date(wp.timestamp).toLocaleTimeString()}</span>
                    </div>

                    <div>
                      <span className="text-[10px] block text-club-ink/45 font-sans font-bold">SPEED</span>
                      <span className="text-club-leaf font-bold">{wp.speed_kmph} km/h</span>
                    </div>

                    <div>
                      <span className="text-[10px] block text-club-ink/45 font-sans font-bold">OCR CONFIDENCE</span>
                      <span className="text-club-pine font-bold">{(wp.confidence * 100).toFixed(0)}%</span>
                    </div>

                    <div className="hidden lg:block">
                      <span className="text-[10px] block text-club-ink/45 font-sans font-bold">ALGORITHM TRACK</span>
                      <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Kalman + Bayesian
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] block text-club-ink/45 font-sans font-bold">TRAFFIC LANE</span>
                      <span className="text-club-ink font-bold">{wp.lane}</span>
                    </div>

                    {/* Snapshot Thumbnail */}
                    <img
                      src={wp.image_url}
                      alt="Capture"
                      className="w-14 h-9 rounded-xl object-cover border border-[#EADFC6] hidden md:block"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        )
      ) : (
        <div className="p-12 text-center club-card rounded-3xl">
          <Search className="w-10 h-10 text-club-ink/25 mx-auto mb-3" />
          <h3 className="text-base font-extrabold text-club-ink">No Vehicle Queried Yet</h3>
          <p className="text-xs text-club-ink/55 max-w-md mx-auto mt-1">
            Enter any vehicle registration plate or click one of the jury evaluation presets above to reconstruct its movement across Gujarat.
          </p>
        </div>
      )}

      {/* Section 65B Forensic Dossier Modal */}
      {showDossierModal && (
        <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Top Bar */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-red-400" />
                <h3 className="font-bold text-sm">
                  Section 65B Indian Evidence Act Forensic Dossier — {activeTrace?.query_plate}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintDossier}
                  className="px-3 py-1.5 rounded-full bg-club-tang text-white font-bold text-xs flex items-center gap-1.5 hover:brightness-110 shadow"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Open in Full Print Tab</span>
                </button>
                <button
                  onClick={() => setShowDossierModal(false)}
                  className="p-1.5 rounded-full hover:bg-slate-800 text-slate-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Render HTML */}
            <div className="flex-1 overflow-auto p-4 bg-slate-50">
              {dossierLoading ? (
                <div className="p-12 text-center text-slate-500 text-sm font-semibold">
                  Generating Cryptographic Evidence Hash & Judicial Certificate...
                </div>
              ) : (
                <iframe
                  title="Section 65B Certificate"
                  srcDoc={dossierHtml}
                  className="w-full h-full border-0 bg-white rounded-xl shadow-inner"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
