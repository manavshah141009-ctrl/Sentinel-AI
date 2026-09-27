import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Shield, CheckCircle2, Award, ExternalLink, Heart } from "lucide-react";
import { Badge } from "./components/Badge";

export const Scene6Conclusion: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scaleIn = spring({ frame, fps, config: { damping: 12 } });
  const itemsFade = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" });

  const deliverables = [
    { title: "Model 1: Central CCTV Registry & GIS Foundation", desc: "52+ verified cameras across 5 state departments with dark-zone analysis" },
    { title: "Model 2: Unified Video Wall & Ingestion Engine", desc: "PTS synchronized, forced RTSP/TCP, real-time ANPR inference" },
    { title: "Model 3: eGujCop & VAHAN Watchlist Federation", desc: "Sub-50ms automated correlation with 1-click PCR Van dispatch" },
    { title: "Jury Test Case: Designated Vehicle Tracing", desc: "48.78 km chronological route reconstruction with Section 65B audit export" },
  ];

  return (
    <div className="w-full h-full bg-[#050B14] text-white flex flex-col justify-between p-14 relative overflow-hidden font-sans select-none text-center">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-cyan-600/15 blur-[140px] pointer-events-none" />

      {/* Top badges */}
      <div className="flex items-center justify-center gap-3 z-10">
        <Badge
          label="Grand Finale Presentation"
          variant="amber"
          icon={<Award className="w-4 h-4 text-amber-400" />}
        />
        <Badge
          label="Gujarat Police Innovation Challenge 2026"
          variant="blue"
          icon={<Shield className="w-4 h-4 text-cyan-400" />}
        />
      </div>

      {/* Main Conclusion Hero */}
      <div style={{ transform: `scale(${scaleIn})` }} className="my-auto z-10 flex flex-col items-center">
        <h2 className="text-5xl font-extrabold tracking-tight text-white mb-3">
          SENTINEL<span className="text-cyan-400 font-mono">-AI</span> IS READY
        </h2>
        <p className="text-xl text-cyan-200/80 max-w-3xl font-medium mb-8">
          Empowering Gujarat Police with Statewide Intelligent Surveillance &amp; Real-Time Vehicle Interception
        </p>

        {/* 4 Deliverables Badges */}
        <div style={{ opacity: itemsFade }} className="grid grid-cols-2 gap-4 max-w-4xl w-full text-left">
          {deliverables.map((d, i) => (
            <div
              key={i}
              className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-start gap-3 shadow-lg"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-sm text-white font-mono">{d.title}</div>
                <div className="text-xs text-slate-400 mt-0.5">{d.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="flex items-center justify-between border-t border-slate-800 pt-5 z-10 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <span>Developed by</span>
          <span className="text-white font-bold">Team Sentinel Innovators</span>
          <span>· i-Hub Gujarat</span>
        </div>
        <div className="flex items-center gap-2 text-cyan-400">
          <Heart className="w-4 h-4 text-red-400 fill-red-400" />
          <span>Building a Safer Gujarat for 70 Million Citizens</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <ExternalLink className="w-4 h-4 text-slate-400" />
          <span>github.com/Sentinel-AI/Gujarat</span>
        </div>
      </div>
    </div>
  );
};
