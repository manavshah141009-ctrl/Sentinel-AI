import React, { useState, useEffect } from 'react';
import {
  Shield,
  Video,
  MapPin,
  Search,
  AlertTriangle,
  PieChart,
  PlusCircle,
  Radio,
  RefreshCw,
  Bell,
  LayoutDashboard,
  UserRound,
  Globe,
  Cpu,
  Server,
  Disc
} from 'lucide-react';

// 1% Club style header: cream canvas, pine brand block, pill nav, tang CTA.
export default function Navbar({
  activeTab,
  setActiveTab,
  alertCount,
  cameraCount,
  onOpenOnboardModal,
  onOpenGapModal,
  onOpenClusterModal,
  onOpenRecorderModal,
  onOpenAlerts,
  onSyncSandbox,
  isSyncing,
  session,
  onOpenAuth,
  onLogout
}) {
  const [time, setTime] = useState(new Date().toLocaleTimeString('en-IN', { hour12: false }));

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-IN', { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const tabs = [
    { id: 'dashboard', label: 'Overview',      icon: LayoutDashboard, badge: null },
    { id: 'gis',       label: 'GIS Registry',  icon: MapPin,          badge: cameraCount },
    { id: 'video',     label: 'Video Wall',     icon: Video,           badge: null },
    { id: 'anpr',      label: 'ANPR Scrapes',   icon: Cpu,             badge: 'REAL AI' },
    { id: 'tracer',    label: 'Vehicle Tracer', icon: Search,          badge: null },
    { id: 'watchlist', label: 'Watchlist',      icon: AlertTriangle,   badge: null },
    { id: 'govfeed',   label: 'Gov Feed',       icon: Globe,           badge: 'LIVE' },
  ];

  return (
    <header className="bg-club-cream text-club-ink sticky top-0 z-40 shadow-md border-b border-[#EADFC6]">
      {/* Trust strip */}
      <div className="bg-club-pinedeep px-4 py-1.5 flex items-center justify-between text-[11px] text-club-cream/80">
        <div className="flex items-center gap-2">
          <span className="font-bold text-club-gold uppercase tracking-wider">
            Gujarat Police Innovation Challenge 2026
          </span>
          <span className="hidden md:inline text-club-cream/40">|</span>
          <span className="hidden md:inline">Home Department · SCRB</span>
        </div>
        <div className="flex items-center gap-4 font-mono">
          <span className="text-emerald-300 flex items-center gap-1">
            <Radio className="w-3 h-3 animate-pulse" />
            SANDBOX CONNECTED
          </span>
          <span>{time} IST</span>
        </div>
      </div>

      {/* Main bar */}
      <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-club-pine flex items-center justify-center shadow">
            <Shield className="w-5 h-5 text-club-gold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base md:text-lg tracking-tight">
                SENTINEL<span className="text-club-tang">.AI</span>
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-club-pine text-[10px] font-bold text-club-cream">
                STATEWIDE C2
              </span>
            </div>
            <p className="text-[11px] text-club-ink/55 hidden sm:block">
              Law enforcement video management & intelligence
            </p>
          </div>
        </div>

        {/* Pill nav */}
        <nav className="flex items-center gap-1 bg-white p-1 rounded-full border border-[#EADFC6] shadow-sm overflow-x-auto">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                  active
                    ? t.id === 'tracer'
                      ? 'bg-club-tang text-white shadow'
                      : 'bg-club-pine text-club-cream shadow'
                    : 'text-club-ink/60 hover:text-club-ink hover:bg-club-cream'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
                {t.badge !== null && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${active ? 'bg-black/25' : 'bg-club-creamdark text-club-ink/70'}`}>
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAlerts}
            className="relative p-2 rounded-full bg-white hover:bg-club-creamdark border border-[#EADFC6] transition-colors"
            title="Active alerts"
          >
            <Bell className="w-4 h-4 text-club-tang" />
            {alertCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-600 text-white font-bold text-[9px] flex items-center justify-center animate-pulse">
                {alertCount}
              </span>
            )}
          </button>

          <button
            onClick={onOpenGapModal}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-club-creamdark text-xs font-bold border border-[#EADFC6] transition-all"
          >
            <PieChart className="w-3.5 h-3.5 text-club-pine" />
            <span>Gap Analysis</span>
          </button>

          <button
            onClick={onOpenClusterModal}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-club-creamdark text-xs font-bold border border-[#EADFC6] transition-all"
            title="80,000 Camera Cluster Architecture & Server Management"
          >
            <Server className="w-3.5 h-3.5 text-club-tang" />
            <span>80K Scale & Server Hub</span>
          </button>

          <button
            onClick={onOpenRecorderModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-sm transition-all animate-pulse"
            title="Record Screen Presentation for Hackathon Submission"
          >
            <Disc className="w-3.5 h-3.5 animate-spin" />
            <span>Record Screen</span>
          </button>

          <button
            onClick={onOpenOnboardModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-club-tang hover:brightness-110 text-white text-xs font-bold shadow transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Onboard Cameras</span>
          </button>

          <button
            onClick={onSyncSandbox}
            disabled={isSyncing}
            className="p-2 rounded-full bg-white hover:bg-club-creamdark border border-[#EADFC6] transition-all disabled:opacity-50"
            title="Sync catalogue"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-club-leaf ${isSyncing ? 'animate-spin' : ''}`} />
          </button>

          {session ? (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-club-pine text-club-cream text-xs font-bold transition-all"
              title={session?.user?.username || 'Signed in'}
            >
              <UserRound className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{session?.user?.username || 'Officer'}</span>
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-club-creamdark text-xs font-bold border border-[#EADFC6] transition-all"
            >
              <UserRound className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
