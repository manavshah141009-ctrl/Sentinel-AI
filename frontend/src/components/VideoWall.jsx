import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  Grid,
  Video,
  Maximize2,
  Radio,
  ShieldAlert,
  Camera,
  Play,
  Pause,
  Cpu,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Layers,
  Filter,
  CheckSquare
} from 'lucide-react';
import { scanPlates } from '../services/api';
import RealCamVideo from './RealCamVideo';

const CameraTrackOverlay = memo(function CameraTrackOverlay({ detectedVehicles = [], livePlate = null }) {
  const vehicles = detectedVehicles || [];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-15">
      {/* Top Tactical Status HUD */}
      <div className="absolute top-9 left-2 flex items-center gap-2 z-10 select-none">
        {vehicles.length > 0 ? (
          <span className="bg-emerald-950/90 border border-emerald-400/80 text-emerald-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 shadow-lg backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            AI LOCK: {vehicles.length} {vehicles.length > 1 ? 'VEHICLES' : 'VEHICLE'}
          </span>
        ) : (
          <span className="bg-black/60 border border-white/10 text-slate-400 text-[9px] font-mono px-2 py-0.5 rounded-full backdrop-blur-sm flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            AI SCANNING FEED…
          </span>
        )}
      </div>

      {/* Dynamic Green Bounding Boxes Around Detected Vehicles */}
      {vehicles.map((v, idx) => {
        if (!v || !Array.isArray(v.box) || v.box.length < 4) return null;
        const [rawX1, rawY1, rawX2, rawY2] = v.box;
        const x1 = Math.min(rawX1, rawX2);
        const x2 = Math.max(rawX1, rawX2);
        const y1 = Math.min(rawY1, rawY2);
        const y2 = Math.max(rawY1, rawY2);

        const left = `${Math.max(0, Math.min(100, x1 * 100))}%`;
        const top = `${Math.max(0, Math.min(100, y1 * 100))}%`;
        const width = `${Math.max(2, Math.min(100, (x2 - x1) * 100))}%`;
        const height = `${Math.max(2, Math.min(100, (y2 - y1) * 100))}%`;

        // If the box is right against the top edge, place label inside to prevent clipping
        const isNearTop = y1 < 0.08;

        return (
          <div
            key={v.id || idx}
            className="absolute border-2 border-emerald-400 bg-emerald-500/15 rounded-sm shadow-[0_0_12px_rgba(52,211,153,0.7)] pointer-events-none"
            style={{
              left,
              top,
              width,
              height,
              transition: 'left 0.28s cubic-bezier(0.16, 1, 0.3, 1), top 0.28s cubic-bezier(0.16, 1, 0.3, 1), width 0.28s ease, height 0.28s ease'
            }}
          >
            {/* Vehicle Category & Confidence Badge */}
            <div
              className={`absolute left-0 z-20 flex items-center gap-1.5 px-1.5 py-0.5 text-[9px] font-mono font-bold whitespace-nowrap shadow-md backdrop-blur-sm ${
                isNearTop
                  ? 'top-1 left-1 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-400/60'
                  : '-top-5 left-0 rounded-t bg-emerald-600/95 text-white border-t border-x border-emerald-300/60'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              <span className="tracking-wide uppercase">{v.label || 'VEHICLE'}</span>
              <span className="text-emerald-200">
                {Math.round(v.confidence != null && v.confidence > 1 ? v.confidence : (v.confidence || 0.88) * 100)}%
              </span>
              {v.plate && (
                <span className="bg-[#FED439] text-slate-950 px-1 py-0.2 rounded text-[9px] font-mono font-black tracking-wider border border-amber-400 shadow-sm ml-0.5">
                  {v.plate}
                </span>
              )}
            </div>

            {/* Corner Reticles for High-Tech Surveillance Visual */}
            <div className="absolute -top-0.5 -left-0.5 w-2.5 h-2.5 border-t-2 border-l-2 border-emerald-300" />
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 border-t-2 border-r-2 border-emerald-300" />
            <div className="absolute -bottom-0.5 -left-0.5 w-2.5 h-2.5 border-b-2 border-l-2 border-emerald-300" />
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-b-2 border-r-2 border-emerald-300" />
          </div>
        );
      })}

      {/* ANPR Plate Read Banner if available - perfectly centered */}
      {livePlate && (
        <div className="absolute bottom-6 inset-x-0 mx-auto w-max max-w-[90%] bg-slate-950/90 backdrop-blur-md text-emerald-300 font-mono font-bold text-xs px-3.5 py-1.5 rounded-full border-2 border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.4)] flex items-center justify-center gap-2.5 z-20 animate-fade-in pointer-events-none select-none">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
          <span className="text-white/70 text-[10px] uppercase tracking-wider font-sans">ANPR DETECT:</span>
          <span className="bg-[#FED439] text-slate-950 px-2.5 py-0.5 rounded font-mono font-black text-xs tracking-widest border border-amber-400/80 shadow-sm">
            {livePlate.plate}
          </span>
          {livePlate.confidence != null && (
            <span className="text-[10px] text-emerald-300 font-mono bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/40">
              {Math.round(livePlate.confidence > 1 ? livePlate.confidence : livePlate.confidence * 100)}%
            </span>
          )}
        </div>
      )}
    </div>
  );
});

export default function VideoWall({
  cameras = [],
  recentDetections = [],
  cameraBoxes = {},
  onTriggerAlert = () => {}
}) {
  const [gridSize, setGridSize] = useState(6); // 1, 4, 6, 9, 16, 30
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedDistrict, setSelectedDistrict] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  // Real plate-scan state per camera: { status: 'idle'|'scanning'|'done', plates: [], regions: 0 }
  const [scans, setScans] = useState({});
  const [pausedCams, setPausedCams] = useState({});

  const togglePauseCam = useCallback((camId) => {
    setPausedCams(prev => ({
      ...prev,
      [camId]: !prev[camId]
    }));
  }, []);

  const runScan = async (camId, seg = 0) => {
    setScans(prev => ({ ...prev, [camId]: { status: 'scanning', plates: [], regions: 0, message: '' } }));
    try {
      const res = await scanPlates(camId, seg);
      setScans(prev => ({
        ...prev,
        [camId]: { 
          status: 'done', 
          plates: res.plates || [], 
          regions: res.regions || 0,
          message: res.message || '',
          vehicles: res.vehicles || []
        }
      }));
      setTimeout(() => {
        setScans(prev => ({
          ...prev,
          [camId]: { 
            status: 'idle', 
            plates: [], 
            regions: 0, 
            message: '',
            vehicles: []
          }
        }));
      }, 7000);
      return res;
    } catch (err) {
      console.error('scan failed', camId, err);
      setScans(prev => ({ ...prev, [camId]: { status: 'idle', plates: [], regions: 0, message: 'Scan request timed out' } }));
      return null;
    }
  };

  // Derive unique departments and districts for filtering across all 30 cameras
  const departments = React.useMemo(() => {
    const set = new Set();
    cameras.forEach(c => {
      if (c.department_label) set.add(c.department_label);
    });
    return Array.from(set).sort();
  }, [cameras]);

  const districts = React.useMemo(() => {
    const set = new Set();
    cameras.forEach(c => {
      if (c.district) set.add(c.district);
    });
    return Array.from(set).sort();
  }, [cameras]);

  // Filter cameras based on search query, department, and district
  const filteredCameras = React.useMemo(() => {
    return cameras.filter(cam => {
      if (selectedDept !== 'ALL' && cam.department_label !== selectedDept) return false;
      if (selectedDistrict !== 'ALL' && cam.district !== selectedDistrict) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = cam.name?.toLowerCase().includes(q);
        const matchCode = cam.cam_code?.toLowerCase().includes(q);
        const matchLoc = cam.location?.toLowerCase().includes(q);
        const matchDept = cam.department_label?.toLowerCase().includes(q);
        const matchDist = cam.district?.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchLoc && !matchDept && !matchDist) return false;
      }
      return true;
    });
  }, [cameras, selectedDept, selectedDistrict, searchQuery]);

  // Reset page when filter or grid size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [gridSize, selectedDept, selectedDistrict, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredCameras.length / gridSize));
  const pageStart = (currentPage - 1) * gridSize;
  const activeCameras = filteredCameras.slice(pageStart, pageStart + gridSize);

  return (
    <div className="p-4 bg-club-cream min-h-[calc(100vh-112px)] flex flex-col gap-4">
      {/* Control Header */}
      <div className="club-card flex flex-col gap-3 p-4 rounded-3xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-club-pine flex items-center justify-center text-club-gold shadow-sm">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold text-club-ink">
                  Model 2: Unified Multi-Stream Video Wall & Edge Analytics
                </h2>
                <span className="bg-emerald-950/80 border border-emerald-400/80 text-emerald-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {filteredCameras.length} / {cameras.length} CAMERAS ONLINE
                </span>
              </div>
              <p className="text-[11px] text-club-ink/55">
                Low-latency feed aggregation across 26 departments · Real-time RTSP/WebRTC streams with live AI inference
              </p>
            </div>
          </div>

          {/* Grid Sizer Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-club-ink/60 font-bold mr-1 flex items-center gap-1">
              <Grid className="w-3.5 h-3.5" /> Layout:
            </span>
            {[
              { size: 1, label: '1 x 1' },
              { size: 4, label: '2 x 2' },
              { size: 6, label: '3 x 2 (Pilot)' },
              { size: 9, label: '3 x 3' },
              { size: 16, label: '4 x 4' },
              { size: 30, label: 'All 30 Wall' }
            ].map(opt => (
              <button
                key={opt.size}
                onClick={() => setGridSize(opt.size)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  gridSize === opt.size
                    ? 'bg-club-pine text-club-cream shadow'
                    : 'bg-club-creamdark text-club-ink/60 hover:bg-[#EADFC6]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Toolbar: Search, Department, District, & Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-[#EADFC6]/70">
          <div className="flex items-center gap-2 flex-wrap flex-1 min-w-[280px]">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-club-ink/40 pointer-events-none" />
              <input
                type="text"
                placeholder="Search camera, location, code…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-club-creamdark/70 border border-[#EADFC6] rounded-xl text-xs font-sans text-club-ink placeholder:text-club-ink/40 focus:outline-none focus:ring-1 focus:ring-club-pine"
              />
            </div>

            {/* Department Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-club-ink/40" />
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="bg-club-creamdark/70 border border-[#EADFC6] rounded-xl px-2.5 py-1.5 text-xs font-bold text-club-ink focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Departments ({cameras.length})</option>
                {departments.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* District Filter */}
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="bg-club-creamdark/70 border border-[#EADFC6] rounded-xl px-2.5 py-1.5 text-xs font-bold text-club-ink focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Districts</option>
              {districts.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Pagination Controls when cameras exceed gridSize */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2 bg-club-creamdark/70 border border-[#EADFC6] rounded-xl px-3 py-1">
              <span className="text-[11px] font-mono text-club-ink/70">
                Page <span className="font-bold text-club-ink">{currentPage}</span> of <span className="font-bold text-club-ink">{totalPages}</span>
                {' '}({pageStart + 1}–{Math.min(filteredCameras.length, pageStart + gridSize)} of {filteredCameras.length})
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded hover:bg-[#EADFC6] disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4 text-club-ink" />
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded hover:bg-[#EADFC6] disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4 text-club-ink" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Video Wall Grid */}
      <div className={`grid gap-3.5 flex-1 ${
        gridSize === 1
          ? 'grid-cols-1 max-w-5xl mx-auto w-full'
          : gridSize === 4
          ? 'grid-cols-1 md:grid-cols-2'
          : gridSize === 6
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          : gridSize === 9
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          : gridSize === 16
          ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
          : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
      }`}>
        {activeCameras.map((cam) => {
          // Check if this camera has recent detection
          const activeDet = recentDetections.find(d => d.camera_id === cam.id);
          const isAlert = activeDet?.is_watchlist_alert;
          const scan = scans[cam.id] || { status: 'idle', plates: [], regions: 0 };
          const isCamPaused = Boolean(pausedCams[cam.id]);
          
          let livePlate = scan.plates && scan.plates.length > 0 ? scan.plates[0] : null;

          // Real-time YOLO vehicle detections for this camera
          const camBoxData = cameraBoxes[cam.id] || cameraBoxes[cam.id?.toString()] || cameraBoxes[cam.cam_code] || cameraBoxes[`cam0${cam.id}`] || cameraBoxes[`cam${cam.id}`] || { vehicles: [] };
          let detectedVehicles = [...(camBoxData.vehicles || [])];
          if (detectedVehicles.length === 0 && scan.vehicles && scan.vehicles.length > 0) {
            detectedVehicles = [...scan.vehicles];
          }

          return (
            <div
              key={cam.id}
              className={`relative group bg-[#0d1424] rounded-3xl overflow-hidden border-2 transition-all duration-300 flex flex-col min-w-0 ${
                isAlert
                  ? 'border-red-500 shadow-lg shadow-red-900/30 alert-flash'
                  : isCamPaused
                  ? 'border-amber-400/90 shadow-md shadow-amber-950/20'
                  : 'border-[#EADFC6] hover:border-club-tang shadow-md'
              }`}
            >
              {/* Stream Frame / Visual Canvas - 16:9 fixed ratio ensures zero coordinate drift for AI bounding boxes */}
              <div className="relative w-full aspect-video bg-black overflow-hidden flex items-center justify-center">
                <RealCamVideo 
                  cameraId={cam.id} 
                  title={cam.name} 
                  isPaused={isCamPaused}
                  onTogglePause={togglePauseCam}
                />

                {/* Scanline Grid Effect */}
                <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,24,38,0)_50%,rgba(0,0,0,0.4)_50%)] bg-[length:100%_4px] opacity-40 z-10" />

                {/* Camera Top Status Header with Interactive Play/Pause Button */}
                <div className="absolute top-2 left-2 right-2 flex items-center justify-between text-[11px] font-mono text-white bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 z-30">
                  <div className="flex items-center gap-2 truncate">
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isCamPaused ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400 live-dot'}`} />
                    <span className="font-bold truncate">{cam.name.split('—')[0]}</span>
                    {isCamPaused && (
                      <span className="bg-amber-400 text-slate-950 text-[9px] font-mono font-black px-1.5 py-0.2 rounded shadow flex items-center gap-1 flex-shrink-0">
                        <Pause className="w-2 h-2 fill-slate-950" />
                        PAUSED
                      </span>
                    )}
                    {cam.name.includes('ANPR') && (
                      <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded flex-shrink-0">ANPR FIXED</span>
                    )}
                    <span className="text-slate-400 hidden sm:inline truncate">{cam.district}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300 flex-shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); togglePauseCam(cam.id); }}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isCamPaused
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow ring-2 ring-emerald-300/80'
                          : 'bg-white/20 hover:bg-white/30 text-white border border-white/20'
                      }`}
                      title={isCamPaused ? "Click to Resume Stream" : "Click to Pause Stream"}
                    >
                      {isCamPaused ? (
                        <>
                          <Play className="w-2.5 h-2.5 fill-slate-950" />
                          <span>RESUME</span>
                        </>
                      ) : (
                        <>
                          <Pause className="w-2.5 h-2.5 fill-current" />
                          <span>PAUSE</span>
                        </>
                      )}
                    </button>
                    <span className="text-[10px] uppercase font-bold text-blue-300 hidden md:inline">{cam.codec}</span>
                  </div>
                </div>

                {/* Real-Time AI Vehicle Detection Overlays with Buttery-Smooth Persistence */}
                <CameraTrackOverlay detectedVehicles={detectedVehicles} livePlate={livePlate} />

                {/* Critical Watchlist Banner if active alert */}
                {isAlert && (
                  <div className="absolute bottom-2 left-2 right-2 bg-red-950/95 border border-red-500 text-white px-3 py-1.5 rounded-2xl text-xs font-bold flex items-center justify-between animate-bounce z-30">
                    <span className="flex items-center gap-1.5 text-red-300">
                      <ShieldAlert className="w-4 h-4 text-red-400" />
                      <span>{activeDet.alert.alert_message}</span>
                    </span>
                    <span className="font-mono text-red-200">
                      {activeDet.alert.fir_number}
                    </span>
                  </div>
                )}
              </div>

              {/* Bottom Camera Metadata Footer */}
              <div className="bg-[#FFFDF7] px-3 py-2 border-t border-[#EADFC6] flex items-center justify-between text-xs">
                <div className="truncate pr-2">
                  <span className="font-bold text-club-ink block truncate">{cam.location}</span>
                  <span className="text-[10px] text-club-ink/55">{cam.department_label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {scan.message && !livePlate && (
                    <span className="text-[9px] font-mono text-amber-700 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 hidden md:inline truncate max-w-[200px]" title={scan.message}>
                      {scan.message}
                    </span>
                  )}
                  {/* Interactive Start / Pause Control Button */}
                  <button
                    onClick={() => togglePauseCam(cam.id)}
                    className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                      isCamPaused
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm ring-2 ring-emerald-300/40'
                        : 'bg-club-creamdark hover:bg-[#EADFC6] text-club-ink/80 border border-[#EADFC6]'
                    }`}
                    title={isCamPaused ? "Resume live camera feed" : "Pause live camera feed"}
                  >
                    {isCamPaused ? (
                      <>
                        <Play className="w-3 h-3 fill-current text-white" />
                        <span>RESUME</span>
                      </>
                    ) : (
                      <>
                        <Pause className="w-3 h-3 fill-current text-club-ink/70" />
                        <span>PAUSE</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => runScan(cam.id, 0)}
                    disabled={scan.status === 'scanning'}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
                      livePlate 
                        ? 'bg-[#FED439] text-slate-950 shadow-md font-black border border-amber-400' 
                        : 'bg-club-pine hover:bg-club-pinedeep text-club-cream'
                    }`}
                    title={scan.message || "Run live plate scan on this camera"}
                  >
                    {scan.status === 'scanning' ? '◌ SCAN…' : livePlate ? `🎯 ${livePlate.plate}` : '🔍 SCAN PLATE'}
                  </button>
                </div>
                <div className="text-right text-[10px] font-mono text-club-ink/55 whitespace-nowrap hidden sm:block">
                  <div>VMS: <span className="text-club-ink font-bold">{cam.vms_vendor}</span></div>
                  <div>BITRATE: <span className="text-club-ink font-bold">{cam.bitrate_kbps} kbps</span></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
