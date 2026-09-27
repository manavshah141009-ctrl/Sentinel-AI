import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import GisMap from './components/GisMap';
import VideoWall from './components/VideoWall';
import VehicleTracer from './components/VehicleTracer';
import WatchlistAlerts from './components/WatchlistAlerts';
import CameraModal from './components/CameraModal';
import GapAnalysisModal from './components/GapAnalysisModal';
import Dashboard from './components/dashboard/Dashboard';
import AuthModal from './components/auth/AuthModal';
import GovFeedPage from './components/GovFeedPage';
import AnprScrapesPage from './components/AnprScrapesPage';
import ClusterHealthModal from './components/ClusterHealthModal';
import ScreenRecorderModal from './components/ScreenRecorderModal';

import {
  fetchCameras,
  fetchWatchlist,
  fetchAlerts,
  fetchDetections,
  syncSandbox,
  syncCatalogue
} from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'gis', 'video', 'tracer', 'watchlist'
  const [cameras, setCameras] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [detections, setDetections] = useState([]);
  const [activeTrace, setActiveTrace] = useState(null);

  // Modals state
  const [isOnboardOpen, setIsOnboardOpen] = useState(false);
  const [isGapOpen, setIsGapOpen] = useState(false);
  const [isClusterOpen, setIsClusterOpen] = useState(false);
  const [isRecorderOpen, setIsRecorderOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);


  // Top Flashing Alert Banner
  const [topAlert, setTopAlert] = useState(null);
  const [cameraBoxes, setCameraBoxes] = useState({});

  // Load initial data
  const loadData = async () => {
    try {
      const [camsData, wlData, alertsData, detsData] = await Promise.all([
        fetchCameras(),
        fetchWatchlist(),
        fetchAlerts(),
        fetchDetections()
      ]);
      setCameras(camsData);
      setWatchlist(wlData);
      setAlerts(alertsData);
      setDetections(detsData);
    } catch (err) {
      console.error('Initial load error:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Robust WebSocket Connection with Auto-Reconnect & Direct Backend Routing
  useEffect(() => {
    let socket = null;
    let reconnectTimer = null;
    let pingTimer = null;
    let isUnmounted = false;

    const connectWs = () => {
      if (isUnmounted) return;

      const backend = import.meta.env.VITE_BACKEND_URL || '';
      let wsUrl;
      if (backend && backend.startsWith('http')) {
        wsUrl = `${backend.replace(/^http/, 'ws')}/ws/stream`;
      } else {
        wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/stream`;
      }

      console.log('📡 Connecting WebSocket to:', wsUrl);

      try {
        socket = new WebSocket(wsUrl);

        socket.onopen = () => {
          console.log('✅ WebSocket Connected! Streaming live AI vehicle detections...');
          // Ping to keep tunnel connection alive
          pingTimer = setInterval(() => {
            if (socket && socket.readyState === WebSocket.OPEN) {
              socket.send('ping');
            }
          }, 10000);
        };

        socket.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'ANPR_DETECTION') {
              setDetections(prev => [msg.data, ...prev.slice(0, 30)]);
            } else if (msg.type === 'CAMERA_BOXES') {
              const camId = msg.data.camera_id;
              const camCode = msg.data.cam_code;
              const boxEntry = {
                vehicles: msg.data.vehicles || [],
                timestamp: Date.now()
              };
              setCameraBoxes(prev => ({
                ...prev,
                [camId]: boxEntry,
                ...(camCode ? { [camCode]: boxEntry } : {})
              }));
            } else if (msg.type === 'POLICE_ALERT') {
              setAlerts(prev => [msg.data, ...prev.slice(0, 50)]);
              setTopAlert(msg.data);
              setTimeout(() => setTopAlert(null), 8000);
            }
          } catch (e) {
            // ignore ping or non-json
          }
        };

        socket.onerror = (err) => {
          console.warn('⚠️ WebSocket Error, reconnecting in 2s...', err);
        };

        socket.onclose = () => {
          clearInterval(pingTimer);
          if (!isUnmounted) {
            reconnectTimer = setTimeout(connectWs, 2000);
          }
        };
      } catch (e) {
        if (!isUnmounted) {
          reconnectTimer = setTimeout(connectWs, 2000);
        }
      }
    };

    connectWs();

    return () => {
      isUnmounted = true;
      clearInterval(pingTimer);
      clearTimeout(reconnectTimer);
      if (socket) socket.close();
    };
  }, []);

  const handleSandboxSync = async () => {
    setIsSyncing(true);
    try {
      await syncSandbox();
      try { await syncCatalogue(); } catch { /* catalogue needs creds server-side */ }
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleShowTraceOnMap = (traceResult) => {
    setActiveTrace(traceResult);
    setActiveTab('gis');
  };

  return (
    <div className="min-h-screen bg-club-cream text-club-ink flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        alertCount={alerts.length}
        cameraCount={cameras.length}
        onOpenOnboardModal={() => setIsOnboardOpen(true)}
        onOpenGapModal={() => setIsGapOpen(true)}
        onOpenClusterModal={() => setIsClusterOpen(true)}
        onOpenRecorderModal={() => setIsRecorderOpen(true)}
        onOpenAlerts={() => setIsAlertsOpen(true)}
        onSyncSandbox={handleSandboxSync}
        isSyncing={isSyncing}
        session={session}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={() => setSession(null)}
      />

      {/* Real-time Law Enforcement Flashing Alert Banner */}
      {topAlert && (
        <div 
          onClick={() => setIsAlertsOpen(true)}
          className="bg-red-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between cursor-pointer animate-pulse shadow-lg"
        >
          <div className="flex items-center gap-2">
            <span className="bg-black/40 px-2 py-0.5 rounded text-[10px] font-mono">
              REAL-TIME ALERT
            </span>
            <span>🚨 {topAlert.alert_message} — Detected vehicle {topAlert.matched_plate} at {topAlert.camera_name}</span>
          </div>
          <span className="underline text-[11px]">Click to View Tactical Action &rarr;</span>
        </div>
      )}

      {/* Main Views */}
      <main className="flex-1 relative">
        {activeTab === 'dashboard' && (
          <Dashboard
            cameras={cameras}
            watchlist={watchlist}
            alerts={alerts}
            detections={detections}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'gis' && (
          <GisMap
            cameras={cameras}
            activeTrace={activeTrace}
            setActiveTrace={setActiveTrace}
            onSelectCamera={(cam) => console.log('Selected:', cam)}
            onInspectVideo={(cam) => setActiveTab('video')}
          />
        )}

        {activeTab === 'video' && (
          <VideoWall
            cameras={cameras}
            recentDetections={detections}
            cameraBoxes={cameraBoxes}
            onTriggerAlert={(alert) => {
              setAlerts(prev => [alert, ...prev]);
              setTopAlert(alert);
              setTimeout(() => setTopAlert(null), 8000);
            }}
          />
        )}

        {activeTab === 'anpr' && (
          <AnprScrapesPage
            detections={detections}
            cameras={cameras}
            onTracePlate={(plate) => {
              setActiveTrace(plate);
              setActiveTab('tracer');
            }}
          />
        )}

        {activeTab === 'tracer' && (
          <VehicleTracer
            onShowOnMap={handleShowTraceOnMap}
            activeTrace={activeTrace}
            setActiveTrace={setActiveTrace}
          />
        )}

        {activeTab === 'watchlist' && (
          <div className="p-4 max-w-7xl mx-auto bg-club-cream min-h-[calc(100vh-112px)]">
            <div className="club-card p-5 rounded-3xl flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-club-tang">01 · Watchlist</div>
                <h2 className="text-xl font-extrabold">Model 3: eGujCop & VAHAN Watchlist Database</h2>
                <p className="text-xs text-club-ink/55">Integrated Police CCTNS criminal database, stolen vehicles, and missing persons registry</p>
              </div>
              <button
                onClick={() => setIsAlertsOpen(true)}
                className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow transition-all"
              >
                View Live Alerts Feed ({alerts.length})
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {watchlist.map((item, idx) => (
                <div
                  key={idx}
                  className="club-card p-4 rounded-3xl hover:-translate-y-0.5 hover:shadow-xl transition-all flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-black text-base text-club-tang">
                        {item.display_plate || item.plate_number}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-red-600 text-[10px] font-bold text-white">
                        {item.category}
                      </span>
                    </div>

                    <h4 className="font-bold text-xs">
                      {item.vehicle_color} {item.vehicle_make} {item.vehicle_model}
                    </h4>
                    <p className="text-[11px] text-club-ink/55 mt-1">
                      Registered Owner: <span className="font-semibold">{item.owner_name}</span>
                    </p>
                    <p className="text-[11px] text-club-ink/55">
                      Police Station: <span>{item.police_station}</span>
                    </p>
                    <p className="text-[11px] text-club-ink/55">
                      FIR Number: <span className="font-mono font-bold">{item.fir_number}</span>
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#EADFC6] flex items-center justify-between">
                    <button
                      onClick={() => {
                        setActiveTrace(null);
                        setActiveTab('tracer');
                      }}
                      className="text-xs font-bold text-club-pine hover:text-club-tang transition-colors"
                    >
                      Trace this Vehicle &rarr;
                    </button>
                    <span className="text-[10px] font-mono text-club-ink/45">
                      INCIDENT: {item.incident_date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'govfeed' && (
          <GovFeedPage />
        )}
      </main>

      {/* Modals & Drawers */}
      <WatchlistAlerts
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
        alerts={alerts}
        watchlist={watchlist}
      />

      <CameraModal
        isOpen={isOnboardOpen}
        onClose={() => setIsOnboardOpen(false)}
        onSuccess={loadData}
      />

      <GapAnalysisModal
        isOpen={isGapOpen}
        onClose={() => setIsGapOpen(false)}
      />

      <ClusterHealthModal
        isOpen={isClusterOpen}
        onClose={() => setIsClusterOpen(false)}
      />

      <ScreenRecorderModal
        isOpen={isRecorderOpen}
        onClose={() => setIsRecorderOpen(false)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuth={setSession}
      />
    </div>
  );
}
