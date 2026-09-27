import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ShieldAlert, Zap, Truck, CheckCircle2, Lock, Radio, BellRing } from "lucide-react";
import { Badge } from "./components/Badge";

export const Scene4WatchlistAlert: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const alertScale = spring({ frame: Math.max(0, frame - 10), fps, config: { damping: 10, mass: 0.9 } });
  const dispatchOpacity = interpolate(frame, [35, 55], [0, 1], { extrapolateRight: "clamp" });
  const pulseAlert = frame % 20 < 10;

  return (
    <div className="w-full h-full bg-[#050B14] text-white flex flex-col justify-between p-14 relative overflow-hidden font-sans select-none">
      {/* Background Warning Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-red-600/10 blur-[140px] pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 z-10">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Badge label="Model 3" variant="purple" icon={<Radio className="w-3.5 h-3.5" />} />
            <Badge label="Real-Time Federation" variant="red" icon={<Zap className="w-3.5 h-3.5" />} />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            Law Enforcement Database Watchlist Federation
          </h2>
        </div>

        <div className="flex items-center gap-3 bg-red-950/60 border border-red-500/60 px-4 py-2 rounded-xl text-xs font-mono">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          <span className="text-red-400 font-bold">MATCH SPEED: 38.4 MS</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300">BENCHMARK: &lt; 50 MS</span>
        </div>
      </div>

      {/* Center Tactical Alert & Dispatch Grid */}
      <div className="grid grid-cols-2 gap-8 my-auto z-10">
        {/* Left: Tactical Red Alert Card */}
        <div
          style={{ transform: `scale(${alertScale})` }}
          className={`rounded-2xl p-7 flex flex-col justify-between border shadow-2xl transition-all ${
            pulseAlert
              ? "bg-red-950/90 border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.4)]"
              : "bg-red-950/70 border-red-600/70 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/40">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs font-mono text-red-300 tracking-wider">CRIMINAL WATCHLIST HIT</span>
                <h3 className="text-2xl font-black text-white">INTERCEPT ORDER</h3>
              </div>
            </div>
            <div className="px-3 py-1 bg-red-500 text-white rounded-md text-xs font-mono font-bold tracking-widest animate-pulse">
              PRIORITY-1
            </div>
          </div>

          {/* Hit Details */}
          <div className="bg-black/40 border border-red-500/30 rounded-xl p-4 my-5 space-y-2.5 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">License Plate:</span>
              <span className="font-extrabold text-white text-sm">GJ-01-AB-1234</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">eGujCop Record:</span>
              <span className="text-red-400 font-bold">FIR #248/2026 (IPC Sec. 379 - Theft)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Jurisdiction:</span>
              <span className="text-slate-200">Navrangpura Police Station, Ahmedabad</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Owner in VAHAN:</span>
              <span className="text-slate-200">Rajesh M. Patel (Reported Stolen)</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-red-300/80 font-mono">
            <span className="flex items-center gap-1.5">
              <BellRing className="w-3.5 h-3.5" /> Auto-Audio Chime Broadcasted
            </span>
            <span>Triggered in 0.038s</span>
          </div>
        </div>

        {/* Right: Tactical Interception & Section 65B Audit */}
        <div
          style={{ opacity: dispatchOpacity }}
          className="bg-slate-900/90 border border-slate-800 rounded-2xl p-7 flex flex-col justify-between shadow-2xl"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-cyan-400" />
                <span className="text-sm font-mono text-white font-bold uppercase tracking-wider">
                  Automated PCR Van Dispatch
                </span>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-1 rounded">
                UNIT DISPATCHED
              </span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-white font-bold">PCR Van 14 (Chiloda Highway Unit)</div>
                  <div className="text-slate-400 text-[11px]">Assigned Interception Point: Chiloda Toll Plaza</div>
                </div>
                <div className="text-right">
                  <div className="text-amber-400 font-bold text-sm">ETA: 3.8 mins</div>
                  <div className="text-slate-500 text-[10px]">Distance: 2.1 km</div>
                </div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <div className="flex items-center gap-2 text-cyan-400 font-bold mb-1">
                  <Lock className="w-3.5 h-3.5" /> Section 65B Indian Evidence Act Forensic Ledger
                </div>
                <div className="text-[11px] text-slate-300">
                  Cryptographic SHA-256 seal generated at time of hit:
                </div>
                <div className="text-[10px] text-emerald-400 font-mono mt-1 break-all bg-black/60 p-2 rounded border border-emerald-950">
                  e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-3 border-t border-slate-800">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" /> Court-Admissible Judicial Evidence
            </span>
            <span className="text-slate-300">VAHAN · eGujCop · CCTNS Interconnected</span>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-xl px-6 py-3 text-xs font-mono text-slate-300 z-10">
        <span className="text-cyan-400 font-bold">Statewide Database Interconnect:</span>
        <span>Radix-Trie plate indexing + Redis temporal caching handles 100,000+ checks &lt; 10ms</span>
        <span className="text-purple-400 font-semibold">Zero False Negatives</span>
      </div>
    </div>
  );
};
