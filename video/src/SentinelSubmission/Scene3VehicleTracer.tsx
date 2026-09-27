import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Navigation, MapPin, AlertTriangle, FileSpreadsheet, Check, ArrowRight } from "lucide-react";
import { Badge } from "./components/Badge";

export const Scene3VehicleTracer: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const checkpoints = [
    { num: 1, name: "Gita Mandir GSRTC", time: "10:15:20 AM", speed: "42 km/h", dist: "0.0 km" },
    { num: 2, name: "Sabarmati Riverfront", time: "10:24:05 AM", speed: "38 km/h", dist: "4.2 km" },
    { num: 3, name: "SG Highway ISKCON", time: "10:41:50 AM", speed: "64 km/h", dist: "14.6 km" },
    { num: 4, name: "Vaishnodevi Circle", time: "10:55:12 AM", speed: "59 km/h", dist: "23.8 km" },
    { num: 5, name: "Gandhinagar Koba", time: "11:08:44 AM", speed: "68 km/h", dist: "32.1 km" },
    { num: 6, name: "Infocity IT Hub", time: "11:20:10 AM", speed: "45 km/h", dist: "39.4 km" },
    { num: 7, name: "Sector 18 SCRB", time: "11:34:28 AM", speed: "30 km/h", dist: "43.2 km" },
    { num: 8, name: "Chiloda Border Gate", time: "11:58:15 AM", speed: "72 km/h", dist: "48.78 km" },
  ];

  // Progressive checkpoint reveal
  const revealedCount = Math.min(
    checkpoints.length,
    Math.floor(interpolate(frame, [15, 75], [1, 8], { extrapolateRight: "clamp" }))
  );

  const routeProgress = interpolate(frame, [20, 80], [0, 100], { extrapolateRight: "clamp" });

  return (
    <div className="w-full h-full bg-[#050B14] text-white flex flex-col justify-between p-14 relative overflow-hidden font-sans select-none">
      {/* Background GIS Grid & Route Lines */}
      <div className="absolute inset-0 opacity-15 pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid-pattern" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#0ea5e9" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </svg>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 z-10">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Badge label="Jury Test Case" variant="amber" icon={<Navigation className="w-3.5 h-3.5" />} />
            <Badge label="Mandatory Scenario" variant="red" icon={<AlertTriangle className="w-3.5 h-3.5" />} />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            Designated Vehicle Tracing &amp; Trajectory Reconstruction
          </h2>
        </div>

        {/* Target Vehicle Tag */}
        <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 px-5 py-2.5 rounded-xl shadow-lg">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-slate-400">DESIGNATED TARGET</span>
            <span className="text-xl font-mono font-extrabold text-cyan-400">GJ-01-AB-1234</span>
          </div>
          <div className="h-7 w-[1px] bg-slate-800" />
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-slate-400">VEHICLE MAKE</span>
            <span className="text-sm font-semibold text-white">White Maruti Swift</span>
          </div>
        </div>
      </div>

      {/* Main Split: Left Route Stats & Right Trajectory Visualizer */}
      <div className="grid grid-cols-12 gap-8 my-auto z-10 items-center">
        {/* Left Col: Executive Summary & Alert (5 cols) */}
        <div className="col-span-5 flex flex-col gap-4">
          {/* Stolen Alert Banner */}
          <div className="bg-gradient-to-r from-red-950/90 to-red-900/60 border border-red-500/50 rounded-xl p-4 shadow-[0_0_25px_rgba(239,68,68,0.25)]">
            <div className="flex items-center gap-2 text-red-400 text-xs font-mono font-bold mb-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              eGujCop CCTNS MATCH CONFIRMED
            </div>
            <div className="text-lg font-bold text-white">STOLEN VEHICLE · WANTED</div>
            <div className="text-xs text-red-200/90 mt-1 font-mono">
              FIR #248/2026 · Navrangpura Police Station · Ahmedabad City
            </div>
          </div>

          {/* Trajectory Metrics Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
            <div className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider mb-3">
              Reconstructed Journey Telemetry
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-400">Total Checkpoints</div>
                <div className="text-2xl font-bold font-mono text-white">8 Cameras</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Traversed Distance</div>
                <div className="text-2xl font-bold font-mono text-cyan-400">48.78 km</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Transit Duration</div>
                <div className="text-2xl font-bold font-mono text-emerald-400">1h 42m 55s</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Speed Telemetry</div>
                <div className="text-2xl font-bold font-mono text-amber-400">54.2 km/h avg</div>
              </div>
            </div>
          </div>

          {/* Export compliance */}
          <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-2 text-slate-300">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              Instant Section 65B CSV/PDF Export
            </span>
            <span className="text-cyan-400 font-semibold">1-Click Download</span>
          </div>
        </div>

        {/* Right Col: Animated GIS Trajectory Route (7 cols) */}
        <div className="col-span-7 bg-slate-950/80 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono text-slate-300 font-bold uppercase tracking-wider">
                Chronological Route Reconstruction
              </span>
            </div>
            <span className="text-xs font-mono text-cyan-400">Route Sync: {Math.round(routeProgress)}%</span>
          </div>

          {/* Checkpoint list */}
          <div className="space-y-2.5">
            {checkpoints.map((cp, i) => {
              const isRevealed = i < revealedCount;
              return (
                <div
                  key={cp.num}
                  style={{
                    opacity: isRevealed ? 1 : 0.25,
                    transform: isRevealed ? "translateX(0)" : "translateX(20px)",
                    transition: "all 0.3s ease",
                  }}
                  className={`flex items-center justify-between p-2.5 rounded-lg border text-xs font-mono ${
                    isRevealed
                      ? i === checkpoints.length - 1
                        ? "bg-red-950/40 border-red-500/50 text-white"
                        : "bg-slate-900/80 border-slate-800 text-slate-200"
                      : "bg-slate-900/20 border-slate-900 text-slate-600"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                        i === checkpoints.length - 1
                          ? "bg-red-500 text-white animate-pulse"
                          : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                      }`}
                    >
                      {cp.num}
                    </span>
                    <span className="font-semibold">{cp.name}</span>
                  </div>

                  <div className="flex items-center gap-6 text-[11px] text-slate-400">
                    <span>{cp.time}</span>
                    <span className="text-amber-400">{cp.speed}</span>
                    <span className="text-cyan-400 font-bold w-16 text-right">{cp.dist}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Math Bar */}
      <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-xl px-6 py-3 text-xs font-mono text-slate-300 z-10">
        <span className="text-cyan-400 font-bold">Physics &amp; Math Engine:</span>
        <span>Strict Temporal Velocity Vector = \(\Delta d / \Delta PTS\) · Eliminates Clock/NTP Drift</span>
        <span className="text-emerald-400 flex items-center gap-1">
          <Check className="w-3.5 h-3.5" /> JURY SCENARIO VERIFIED
        </span>
      </div>
    </div>
  );
};
