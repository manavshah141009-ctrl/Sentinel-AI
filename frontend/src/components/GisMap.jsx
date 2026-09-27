import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  Video, 
  MapPin, 
  Radio, 
  Layers, 
  AlertCircle, 
  Eye, 
  CheckCircle2, 
  Activity,
  Maximize2,
  Play,
  Pause,
  RotateCcw,
  Gauge,
  Navigation,
  FileText,
  Clock,
  Compass
} from 'lucide-react';
import { getJourneyDossierUrl } from '../services/api';

// Center of Gujarat
const GUJARAT_CENTER = [22.75, 71.85];

// Department Color Mapping
const DEPT_COLORS = {
  Police: { bg: '#2563eb', border: '#60a5fa', text: 'Police (Law & Order)', icon: '🛡️' },
  GSRTC: { bg: '#059669', border: '#34d399', text: 'GSRTC (Transit)', icon: '🚌' },
  Municipal: { bg: '#d97706', border: '#fbbf24', text: 'Municipal (Urban)', icon: '🏛️' },
  Health: { bg: '#dc2626', border: '#f87171', text: 'Health (Hospital)', icon: '🏥' },
  Panchayat: { bg: '#7c3aed', border: '#a78bfa', text: 'Panchayat (Rural)', icon: '🌾' }
};

// Custom Camera Marker Creator
function createCameraIcon(department, isWaypointed = false, stepNumber = null) {
  const dept = DEPT_COLORS[department] || DEPT_COLORS.Police;

  if (isWaypointed && stepNumber !== null) {
    return L.divIcon({
      className: 'custom-waypoint-icon',
      html: `
        <div style="
          background: #ff6b00;
          color: #ffffff;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 13px;
          border: 3px solid #ffffff;
          box-shadow: 0 0 15px rgba(255, 107, 0, 0.9);
          transform: translate(-14px, -14px);
        ">
          ${stepNumber}
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
  }

  return L.divIcon({
    className: 'custom-camera-marker',
    html: `
      <div style="
        background: ${dept.bg};
        border: 2px solid #ffffff;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.5);
        color: #ffffff;
        font-size: 10px;
        transform: translate(-11px, -11px);
      ">
        <div style="width: 6px; height: 6px; background: #ffffff; border-radius: 50%;"></div>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });
}

// Vehicle Trajectory Head Marker with Dynamic Compass Heading
function createVehicleMarker(speedKmph, headingText) {
  return L.divIcon({
    className: 'custom-vehicle-tracker-marker',
    html: `
      <div style="
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        transform: translate(-20px, -20px);
      ">
        <div style="
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #dc2626;
          border: 3px solid #ffffff;
          box-shadow: 0 0 20px rgba(220, 38, 38, 0.95);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-weight: 900;
          font-size: 18px;
        ">
          🚔
        </div>
        <div style="
          margin-top: 4px;
          background: rgba(15, 23, 42, 0.9);
          color: #38bdf8;
          font-family: monospace;
          font-size: 10px;
          font-weight: bold;
          padding: 2px 6px;
          border-radius: 12px;
          white-space: nowrap;
          border: 1px solid rgba(56, 189, 248, 0.4);
          box-shadow: 0 2px 6px rgba(0,0,0,0.5);
        ">
          ${speedKmph} km/h · ${headingText || 'Active'}
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
}

// PCR Cordon Tactical Interception Marker
function createPcrCordonMarker(chokepointName, tacticalAdvantage) {
  return L.divIcon({
    className: 'custom-pcr-cordon-marker',
    html: `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        transform: translate(-22px, -22px);
      ">
        <div style="
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: #0284c7;
          border: 3px solid #ffffff;
          box-shadow: 0 0 25px rgba(2, 132, 199, 0.95);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-weight: 900;
          font-size: 18px;
        ">
          🚨
        </div>
        <div style="
          margin-top: 4px;
          background: rgba(15, 23, 42, 0.95);
          color: #38bdf8;
          font-family: monospace;
          font-size: 10px;
          font-weight: bold;
          padding: 2px 8px;
          border-radius: 12px;
          white-space: nowrap;
          border: 1px solid #0284c7;
          box-shadow: 0 2px 8px rgba(0,0,0,0.6);
        ">
          PCR CORDON: +${tacticalAdvantage}m
        </div>
      </div>
    `,
    iconSize: [42, 42],
    iconAnchor: [21, 21]
  });
}

// Controller to auto-fit bounds on trace update
function MapController({ activeTrace, cameras, activeCoord }) {
  const map = useMap();

  useEffect(() => {
    if (activeTrace && activeTrace.trajectory_polyline && activeTrace.trajectory_polyline.length > 0) {
      const bounds = L.latLngBounds(activeTrace.trajectory_polyline);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
    }
  }, [activeTrace, map]);

  useEffect(() => {
    if (activeCoord) {
      map.panTo(activeCoord, { animate: true, duration: 0.6 });
    }
  }, [activeCoord, map]);

  return null;
}

export default function GisMap({ 
  cameras = [], 
  activeTrace = null, 
  onSelectCamera = () => {}, 
  onInspectVideo = () => {} 
}) {
  const [selectedDept, setSelectedDept] = useState('All');
  const [showBlindSpots, setShowBlindSpots] = useState(false);

  // Playback state
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Reset playback when trace changes
  useEffect(() => {
    if (activeTrace && activeTrace.waypoints && activeTrace.waypoints.length > 0) {
      setPlaybackIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  }, [activeTrace]);

  // Playback loop
  useEffect(() => {
    if (!isPlaying || !activeTrace || !activeTrace.waypoints || activeTrace.waypoints.length <= 1) {
      return;
    }
    const interval = setInterval(() => {
      setPlaybackIndex((prev) => {
        if (prev >= activeTrace.waypoints.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1800 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, activeTrace, playbackSpeed]);

  const currentWaypoint = useMemo(() => {
    if (!activeTrace || !activeTrace.waypoints || activeTrace.waypoints.length === 0) {
      return null;
    }
    return activeTrace.waypoints[playbackIndex] || activeTrace.waypoints[0];
  }, [activeTrace, playbackIndex]);

  // Blind spot circles for dark-zone analysis
  const blindSpotDistricts = [
    { name: "Patan District Border", lat: 23.85, lng: 72.12, radius: 25000 },
    { name: "Amreli Coastal Blindspot", lat: 21.60, lng: 71.22, radius: 28000 },
    { name: "Surendranagar Highway Gap", lat: 22.72, lng: 71.63, radius: 24000 },
    { name: "Porbandar Coastal Corridor", lat: 21.64, lng: 69.60, radius: 22000 }
  ];

  const filteredCameras = useMemo(() => {
    if (selectedDept === 'All') return cameras;
    return cameras.filter(c => c.department === selectedDept);
  }, [cameras, selectedDept]);

  // Check if camera is part of active vehicle trace
  const traceCameraMap = useMemo(() => {
    const map = new Map();
    if (activeTrace && activeTrace.waypoints) {
      activeTrace.waypoints.forEach(wp => {
        map.set(wp.camera_id, wp.step);
      });
    }
    return map;
  }, [activeTrace]);

  return (
    <div className="relative w-full h-[calc(100vh-112px)] flex flex-col bg-[#0b101d]">
      {/* Top Filter Bar */}
      <div className="absolute top-4 left-4 z-[1000] bg-[#FFFDF7]/95 backdrop-blur-md p-2 rounded-full border border-[#EADFC6] shadow-xl flex flex-wrap items-center gap-1.5 max-w-[calc(100%-2rem)]">
        <div className="flex items-center gap-1 text-xs font-bold text-club-ink px-2">
          <Layers className="w-3.5 h-3.5 text-club-pine" />
          <span>Departments:</span>
        </div>

        {['All', 'Police', 'GSRTC', 'Municipal', 'Health', 'Panchayat'].map(dept => {
          const isSelected = selectedDept === dept;
          return (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-club-pine text-club-cream shadow-md'
                  : 'bg-club-creamdark text-club-ink/70 hover:bg-[#EADFC6]'
              }`}
            >
              {dept !== 'All' && (
                <span 
                  className="w-2 h-2 rounded-full inline-block" 
                  style={{ backgroundColor: DEPT_COLORS[dept]?.bg }}
                />
              )}
              <span>{dept}</span>
              <span className="text-[10px] opacity-75 font-mono">
                {dept === 'All' ? cameras.length : cameras.filter(c => c.department === dept).length}
              </span>
            </button>
          );
        })}

        <div className="h-4 w-px bg-[#EADFC6] mx-1 hidden sm:block" />

        {/* Gap Analysis Toggle */}
        <button
          onClick={() => setShowBlindSpots(!showBlindSpots)}
          className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
            showBlindSpots
              ? 'bg-club-tang text-white shadow-md'
              : 'bg-club-creamdark text-club-tang hover:bg-[#EADFC6]'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Blind Spots Layer</span>
        </button>
      </div>

      {/* Active Trace Info Pill & Legal Dossier Link */}
      {activeTrace && (
        <div className="absolute top-16 left-4 z-[1000] bg-[#FFFDF7]/95 border border-club-tang text-club-ink px-4 py-2.5 rounded-3xl backdrop-blur-md shadow-xl flex items-center gap-3 animate-fadeIn">
          <div className="w-3 h-3 rounded-full bg-club-tang animate-ping" />
          <div>
            <div className="text-xs font-extrabold flex items-center gap-2">
              <span>ACTIVE RECONSTRUCTION:</span>
              <span className="font-mono bg-club-pine px-2 py-0.5 rounded-full text-club-cream">
                {activeTrace.query_plate}
              </span>
              {activeTrace.is_watchlist_match && (
                <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold">
                  eGujCop ALERT
                </span>
              )}
            </div>
            <p className="text-[11px] text-club-ink/65">
              {activeTrace.total_checkpoints} Checkpoints · {activeTrace.total_distance_km} km · {activeTrace.corridor_name || 'Highway Corridor'}
            </p>
          </div>
          <a
            href={getJourneyDossierUrl(activeTrace.query_plate)}
            target="_blank"
            rel="noreferrer"
            className="ml-2 px-3 py-1 rounded-full bg-club-pine text-white text-[11px] font-bold flex items-center gap-1 hover:brightness-110 shadow"
          >
            <FileText className="w-3 h-3 text-red-400" />
            <span>Section 65B Dossier</span>
          </a>
        </div>
      )}

      {/* Leaflet Map */}
      <MapContainer
        center={GUJARAT_CENTER}
        zoom={7.5}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <MapController 
          activeTrace={activeTrace} 
          cameras={cameras} 
          activeCoord={currentWaypoint ? [currentWaypoint.latitude, currentWaypoint.longitude] : null}
        />

        {/* Dark CartoDB Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Blind Spot Dark Zones Layer */}
        {showBlindSpots && blindSpotDistricts.map((bs, i) => (
          <Circle
            key={i}
            center={[bs.lat, bs.lng]}
            radius={bs.radius}
            pathOptions={{
              color: '#ef4444',
              fillColor: '#ef4444',
              fillOpacity: 0.15,
              weight: 1.5,
              dashArray: '6, 6'
            }}
          >
            <Popup className="custom-popup">
              <div className="p-2 text-xs">
                <div className="font-bold text-red-400 flex items-center gap-1.5 mb-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>Uncovered Dark Zone</span>
                </div>
                <p className="text-slate-300 font-semibold">{bs.name}</p>
                <p className="text-slate-400 text-[11px] mt-1">
                  Priority 1 surveillance gap under 80,000 camera expansion plan.
                </p>
              </div>
            </Popup>
          </Circle>
        ))}

        {/* Camera Markers */}
        {filteredCameras.map((cam) => {
          const isWaypointed = traceCameraMap.has(cam.id);
          const stepNumber = isWaypointed ? traceCameraMap.get(cam.id) : null;
          const icon = createCameraIcon(cam.department, isWaypointed, stepNumber);

          return (
            <Marker
              key={cam.id}
              position={[cam.latitude, cam.longitude]}
              icon={icon}
              eventHandlers={{
                click: () => onSelectCamera(cam)
              }}
            >
              <Popup className="custom-popup">
                <div className="p-2.5 max-w-xs text-slate-100">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-700 pb-2 mb-2">
                    <span 
                      className="px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase"
                      style={{ backgroundColor: DEPT_COLORS[cam.department]?.bg || '#2563eb' }}
                    >
                      {cam.department}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-dot" />
                      LIVE (25 FPS)
                    </span>
                  </div>

                  <h3 className="font-bold text-xs text-white leading-snug mb-1">
                    {cam.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 mb-2 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    {cam.location} · <span className="text-slate-300">{cam.district}</span>
                  </p>

                  <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono bg-slate-900/80 p-2 rounded-lg border border-slate-800 mb-3">
                    <div>
                      <span className="text-slate-500 block">CODEC</span>
                      <span className="text-slate-200 font-bold uppercase">{cam.codec || 'H.264'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">RESOLUTION</span>
                      <span className="text-slate-200 font-bold">{cam.resolution || '1080p'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">VMS VENDOR</span>
                      <span className="text-slate-200 font-bold">{cam.vms_vendor || 'Hikvision'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">BITRATE</span>
                      <span className="text-slate-200 font-bold">{cam.bitrate_kbps || 4096} kbps</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onInspectVideo(cam)}
                      className="flex-1 py-1.5 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] flex items-center justify-center gap-1.5 shadow transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Live Feed</span>
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Trajectory Polyline overlay when a vehicle is traced */}
        {activeTrace && activeTrace.trajectory_polyline && (
          <>
            {/* Outer Glow Line */}
            <Polyline
              positions={activeTrace.trajectory_polyline}
              pathOptions={{
                color: '#ff6b00',
                weight: 8,
                opacity: 0.35,
                lineCap: 'round'
              }}
            />
            {/* Core Dash Line */}
            <Polyline
              positions={activeTrace.trajectory_polyline}
              pathOptions={{
                color: '#ffffff',
                weight: 3,
                opacity: 0.95,
                dashArray: '8, 8',
                lineCap: 'round'
              }}
            />

            {/* Sonar Radar Pulse at Active Checkpoint */}
            {currentWaypoint && (
              <Circle
                center={[currentWaypoint.latitude, currentWaypoint.longitude]}
                radius={2500}
                pathOptions={{
                  color: '#ef4444',
                  fillColor: '#ef4444',
                  fillOpacity: 0.25,
                  weight: 2
                }}
              />
            )}

            {/* Dynamic Animated Vehicle Gliding Marker */}
            {currentWaypoint && (
              <Marker
                position={[currentWaypoint.latitude, currentWaypoint.longitude]}
                icon={createVehicleMarker(
                  currentWaypoint.speed_kmph,
                  currentWaypoint.direction ? currentWaypoint.direction.split(' ')[0] : 'N'
                )}
                zIndexOffset={10000}
              >
                <Popup className="custom-popup">
                  <div className="p-2 text-slate-100 text-xs">
                    <div className="font-extrabold text-club-tang mb-1">
                      {activeTrace.query_plate} — Sighting #{currentWaypoint.step}
                    </div>
                    <p className="font-bold text-white">{currentWaypoint.camera_name}</p>
                    <p className="text-slate-400 text-[11px]">{currentWaypoint.location}</p>
                    <div className="mt-2 text-[10px] font-mono grid grid-cols-2 gap-1 bg-slate-900 p-1.5 rounded">
                      <div>Speed: <span className="text-emerald-400 font-bold">{currentWaypoint.speed_kmph} km/h</span></div>
                      <div>PTS: <span className="text-amber-400">{currentWaypoint.pts_ms ? `${(currentWaypoint.pts_ms / 1000).toFixed(1)}s` : 'Real'}</span></div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* A* Highway Topology Snapped Route Glow */}
            {activeTrace.astar_highway_routing?.is_graph_snapped && activeTrace.astar_highway_routing.snapped_polyline && (
              <Polyline
                positions={activeTrace.astar_highway_routing.snapped_polyline}
                pathOptions={{
                  color: '#6366f1',
                  weight: 4,
                  opacity: 0.55,
                  dashArray: '4, 8',
                  lineCap: 'round'
                }}
              />
            )}

            {/* Tactical PCR Interception Cordon & Roadblock Perimeter */}
            {activeTrace.kavach_interception?.tactical_interception_cordon?.optimal_interception_point && currentWaypoint && (
              <>
                {/* Tactical Intercept Vector connecting Vehicle to Cordon Meeting Point */}
                <Polyline
                  positions={[
                    [currentWaypoint.latitude, currentWaypoint.longitude],
                    [
                      activeTrace.kavach_interception.tactical_interception_cordon.optimal_interception_point.latitude,
                      activeTrace.kavach_interception.tactical_interception_cordon.optimal_interception_point.longitude
                    ]
                  ]}
                  pathOptions={{
                    color: '#06b6d4',
                    weight: 3,
                    opacity: 0.85,
                    dashArray: '6, 8'
                  }}
                />

                {/* Roadblock Perimeter Zone Circle */}
                <Circle
                  center={[
                    activeTrace.kavach_interception.tactical_interception_cordon.optimal_interception_point.latitude,
                    activeTrace.kavach_interception.tactical_interception_cordon.optimal_interception_point.longitude
                  ]}
                  radius={1800}
                  pathOptions={{
                    color: '#0284c7',
                    fillColor: '#0284c7',
                    fillOpacity: 0.22,
                    weight: 2,
                    dashArray: '4, 4'
                  }}
                />

                {/* Police Cordon Tactical Intercept Marker */}
                <Marker
                  position={[
                    activeTrace.kavach_interception.tactical_interception_cordon.optimal_interception_point.latitude,
                    activeTrace.kavach_interception.tactical_interception_cordon.optimal_interception_point.longitude
                  ]}
                  icon={createPcrCordonMarker(
                    activeTrace.kavach_interception.tactical_interception_cordon.optimal_interception_point.chokepoint_name,
                    activeTrace.kavach_interception.tactical_interception_cordon.optimal_interception_point.tactical_advantage_min
                  )}
                  zIndexOffset={9999}
                >
                  <Popup className="custom-popup">
                    <div className="p-2 text-slate-100 text-xs">
                      <div className="font-extrabold text-cyan-400 mb-1 flex items-center gap-1.5">
                        <span>🚨 POLICE CORDON INTERCEPT POINT</span>
                      </div>
                      <p className="font-bold text-white text-sm">
                        {activeTrace.kavach_interception.tactical_interception_cordon.optimal_interception_point.chokepoint_name}
                      </p>
                      <p className="text-slate-400 text-[11px] mb-2">
                        {activeTrace.kavach_interception.tactical_interception_cordon.optimal_interception_point.district} Highway Sector
                      </p>
                      <div className="space-y-1 bg-slate-900 p-2 rounded text-[11px] font-mono border border-slate-800">
                        <div>Target Vehicle ETA: <strong className="text-amber-400">{activeTrace.kavach_interception.tactical_interception_cordon.optimal_interception_point.vehicle_eta_min} mins</strong></div>
                        <div>PCR Interceptor ETA: <strong className="text-cyan-400">{activeTrace.kavach_interception.tactical_interception_cordon.optimal_interception_point.pcr_eta_min} mins</strong></div>
                        <div className="text-emerald-400 font-bold">Tactical Buffer: +{activeTrace.kavach_interception.tactical_interception_cordon.optimal_interception_point.tactical_advantage_min} mins</div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </>
            )}
          </>
        )}
      </MapContainer>

      {/* Floating Cinematic Trajectory Playback Console */}
      {activeTrace && activeTrace.waypoints && activeTrace.waypoints.length > 0 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-3xl bg-slate-950/90 backdrop-blur-md border border-slate-700 text-white p-3.5 rounded-3xl shadow-2xl flex flex-col gap-2">
          {/* Top Bar: Active Checkpoint Telemetry */}
          <div className="flex flex-wrap items-center justify-between text-xs border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300">PLAYHEAD STEP {playbackIndex + 1}/{activeTrace.waypoints.length}:</span>
              <span className="text-club-tang font-bold">{currentWaypoint?.camera_name}</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono text-slate-300">
              <span>Velocity: <strong className="text-emerald-400">{currentWaypoint?.speed_kmph} km/h</strong></span>
              <span>Time: <strong className="text-amber-400">{new Date(currentWaypoint?.timestamp).toLocaleTimeString()}</strong></span>
            </div>
          </div>

          {/* Controls & Scrubber Slider */}
          <div className="flex items-center gap-3">
            {/* Play/Pause Button */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-9 h-9 rounded-full bg-club-tang hover:brightness-110 flex items-center justify-center text-white shadow transition-all flex-shrink-0"
              title={isPlaying ? "Pause Playback" : "Play Trajectory"}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>

            {/* Rewind Button */}
            <button
              onClick={() => { setPlaybackIndex(0); setIsPlaying(true); }}
              className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all flex-shrink-0"
              title="Restart from Beginning"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Timeline Slider */}
            <input
              type="range"
              min={0}
              max={activeTrace.waypoints.length - 1}
              value={playbackIndex}
              onChange={(e) => {
                setPlaybackIndex(Number(e.target.value));
                setIsPlaying(false);
              }}
              className="flex-1 accent-club-tang h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />

            {/* Speed Multipliers */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-full text-[10px] font-mono">
              {[1, 2, 5].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setPlaybackSpeed(speed)}
                  className={`px-2 py-0.5 rounded-full font-bold transition-all ${
                    playbackSpeed === speed
                      ? 'bg-club-tang text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Department Legend */}
      <div className="absolute bottom-6 right-6 z-[999] bg-[#FFFDF7]/95 backdrop-blur-md p-3 rounded-3xl border border-[#EADFC6] text-xs shadow-xl text-club-ink hidden lg:block">
        <div className="font-extrabold mb-2 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-club-pine" />
          <span>Gujarat CCTV Network Layer</span>
        </div>
        <div className="space-y-1.5">
          {Object.entries(DEPT_COLORS).map(([dept, info]) => (
            <div key={dept} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: info.bg }} />
              <span className="font-bold">{dept}</span>
              <span className="text-club-ink/55 text-[10px]">({info.text})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
