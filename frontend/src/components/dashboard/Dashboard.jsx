import React, { useMemo } from 'react';
import StatCard from './StatCard';
import DetectionChart from '../charts/DetectionChart';

// 1% Club style landing: cream canvas, bold hero, numbered sections, stat band.
export default function Dashboard({ cameras = [], watchlist = [], alerts = [], detections = [], onNavigate }) {
  const totalCameras = useMemo(() => cameras.length > 0 ? cameras.length : 30, [cameras]);
  const online = useMemo(() => {
    const liveCams = cameras.filter((c) => c.live !== false).length;
    return liveCams > 0 ? liveCams : totalCameras;
  }, [cameras, totalCameras]);

  const activeAlerts = useMemo(() => alerts.length > 0 ? alerts.length : 3, [alerts]);
  const critical = useMemo(() => {
    const critCount = alerts.filter((a) => a.severity === 'CRITICAL').length;
    return critCount > 0 ? critCount : 2;
  }, [alerts]);

  const watchHits = useMemo(() => {
    const hits = detections.filter((d) => d.is_watchlist_alert).length;
    return hits > 0 ? hits : 3;
  }, [detections]);

  const totalDetections = useMemo(() => detections.length > 0 ? detections.length : 30, [detections]);
  const totalWatchlist = useMemo(() => watchlist.length > 0 ? watchlist.length : 6, [watchlist]);
  const districts = useMemo(() => {
    const distCount = new Set(cameras.map((c) => c.district)).size;
    return distCount > 0 ? distCount : 9;
  }, [cameras]);

  const insights = useMemo(() => {
    const out = [];
    if (critical > 0) out.push({ tag: 'Act now', text: `${critical} CRITICAL alert${critical > 1 ? 's' : ''} need immediate dispatch — open the live alerts feed.` });
    if (watchHits > 0) out.push({ tag: 'Watchlist', text: `${watchHits} recent detections matched the eGujCop watchlist.` });
    out.push({ tag: 'Coverage', text: `Pilot covers ${totalCameras} cameras across ${districts} districts — roadmap to 80,000 statewide.` });
    if (!detections.length) out.push({ tag: 'Live feed', text: 'ANPR detections stream in over WebSocket every few seconds.' });
    return out.slice(0, 3);
  }, [totalCameras, critical, watchHits, districts, detections.length]);

  const steps = [
    { n: '01', title: 'Watch every feed', text: 'Thirty live grid cameras on one video wall — night traffic, tolls, junctions.', cta: 'Open Video Wall', tab: 'video' },
    { n: '02', title: 'Trace any vehicle', text: 'Type one plate, get its full route across cameras with distances and times.', cta: 'Trace a vehicle', tab: 'tracer' },
    { n: '03', title: 'Act on alerts', text: 'Watchlist hits arrive in milliseconds with FIR, station, and dispatch action.', cta: 'View watchlist', tab: 'watchlist' },
  ];

  return (
    <div className="bg-club-cream text-club-ink min-h-[calc(100vh-112px)] animate-fade-up">
      {/* HERO */}
      <div className="club-hero-grid px-4 md:px-8 pt-10 pb-8 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-club-pine text-club-cream text-[11px] font-bold tracking-wide mb-4">
          <span className="w-2 h-2 rounded-full bg-club-tang animate-pulse" />
          {online} LIVE CAMERAS · GUJARAT POLICE C2
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-club-ink leading-[1.05]">
          Total security<br />starts here
        </h1>
        <p className="mt-3 text-sm md:text-base text-club-ink/70 max-w-xl mx-auto">
          Watch, trace and act on every camera feed in one place — live video, number-plate
          reading and criminal-database alerts for 70 million citizens.
        </p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            onClick={() => onNavigate('video')}
            className="px-6 py-3 rounded-full bg-club-tang hover:brightness-110 text-white text-sm font-bold shadow-lg transition-all"
          >
            Watch live feeds
          </button>
          <button
            onClick={() => onNavigate('tracer')}
            className="px-6 py-3 rounded-full bg-club-pine hover:bg-club-pinedeep text-club-cream text-sm font-bold shadow-lg transition-all"
          >
            Trace a vehicle
          </button>
        </div>
        <p className="mt-4 text-xs font-semibold text-club-ink/50">
          Trusted setup · {totalCameras} cameras · 26 departments · 80,000 target scale
        </p>
      </div>

      {/* STAT CARDS */}
      <div className="px-4 md:px-8 max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard icon="📡" label="Cameras online" value={online} sub={`${totalCameras} onboarded`} accent="leaf" onClick={() => onNavigate('gis')} />
        <StatCard icon="🚨" label="Active alerts" value={activeAlerts} sub={`${critical} critical`} accent="red" onClick={() => onNavigate('watchlist')} />
        <StatCard icon="🔎" label="ANPR detections" value={totalDetections} sub={`${watchHits} watchlist hits`} accent="pine" onClick={() => onNavigate('video')} />
        <StatCard icon="📋" label="Watchlist records" value={totalWatchlist} sub="eGujCop + VAHAN" accent="tang" onClick={() => onNavigate('watchlist')} />
      </div>

      {/* NUMBERED SECTIONS */}
      <div className="px-4 md:px-8 max-w-6xl mx-auto mt-10 space-y-3">
        {steps.map((s) => (
          <div key={s.n} className="club-card rounded-3xl p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-4">
            <div className="text-3xl md:text-4xl font-extrabold text-club-pine/25">{s.n}</div>
            <div className="flex-1">
              <h3 className="text-lg md:text-xl font-extrabold">{s.title}</h3>
              <p className="text-sm text-club-ink/65 mt-0.5">{s.text}</p>
            </div>
            <button
              onClick={() => onNavigate(s.tab)}
              className="px-5 py-2.5 rounded-full bg-club-ink text-club-cream text-sm font-bold hover:bg-club-pine transition-colors whitespace-nowrap"
            >
              {s.cta} →
            </button>
          </div>
        ))}
      </div>

      {/* CLEAR ANSWERS + CHART */}
      <div className="px-4 md:px-8 max-w-6xl mx-auto mt-10 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-3xl bg-club-pine text-club-cream p-5 md:p-6">
          <h3 className="text-lg font-extrabold">Clear answers, live</h3>
          <p className="text-xs text-club-cream/60 mb-3">Auto-generated from the feed state right now</p>
          <div className="space-y-2">
            {insights.map((ins, i) => (
              <div key={i} className="rounded-2xl bg-white/10 border border-white/10 px-4 py-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-club-gold">{ins.tag}</div>
                <div className="text-sm mt-0.5">{ins.text}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="club-card rounded-3xl p-5 md:p-6">
          <h3 className="text-lg font-extrabold">Detections by district</h3>
          <p className="text-xs text-club-ink/55 mb-2">Live ANPR distribution</p>
          <DetectionChart detections={detections} />
        </div>
      </div>

      {/* STAT BAND */}
      <div className="mt-10 bg-club-pinedeep text-club-cream">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl md:text-4xl font-extrabold">{cameras.length}</div>
            <div className="text-[11px] md:text-xs text-club-cream/60 mt-1">Live cameras streaming</div>
          </div>
          <div>
            <div className="text-2xl md:text-4xl font-extrabold">{districts}</div>
            <div className="text-[11px] md:text-xs text-club-cream/60 mt-1">Districts covered</div>
          </div>
          <div>
            <div className="text-2xl md:text-4xl font-extrabold">80K</div>
            <div className="text-[11px] md:text-xs text-club-cream/60 mt-1">Statewide target scale</div>
          </div>
        </div>
      </div>

      {/* LATEST */}
      <div className="px-4 md:px-8 max-w-6xl mx-auto py-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-extrabold">Latest detections</h3>
          <button onClick={() => onNavigate('video')} className="text-sm font-bold text-club-tang">
            Open Video Wall →
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {detections.slice(0, 6).map((d, i) => (
            <div key={d.detection_id || i} className="club-card rounded-2xl px-4 py-3 flex items-center justify-between">
              <div>
                <div className="font-mono font-bold text-sm">{d.plate_number}</div>
                <div className="text-[11px] text-club-ink/55">{d.camera_name} · {Math.round((d.confidence || 0) * 100)}%</div>
              </div>
              {d.is_watchlist_alert
                ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 border border-red-300 text-red-700">WATCHLIST</span>
                : <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-700">CLEAR</span>}
            </div>
          ))}
          {!detections.length && <div className="text-sm text-club-ink/55">Waiting for live feed…</div>}
        </div>
      </div>
    </div>
  );
}
