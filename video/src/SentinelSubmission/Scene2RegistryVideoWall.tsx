import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Camera, Eye, Layers, Server, Activity, CheckCircle2 } from "lucide-react";
import { Badge } from "./components/Badge";

export const Scene2RegistryVideoWall: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSlide = spring({ frame, fps, config: { damping: 14 } });
  const gridScale = spring({ frame: Math.max(0, frame - 15), fps, config: { damping: 12 } });

  const cameraCams = [
    {
      id: "CAM-01",
      name: "Ahmedabad · Gita Mandir Terminal",
      dept: "GSRTC",
      deptColor: "text-emerald-400 border-emerald-500/40 bg-emerald-950/40",
      plate: "GJ-01-AB-1234",
      conf: "99.2%",
      fps: "25 FPS · RTSP/TCP",
      speed: "42 km/h",
    },
    {
      id: "CAM-04",
      name: "Sabarmati Riverfront Promenade",
      dept: "AMC",
      deptColor: "text-amber-400 border-amber-500/40 bg-amber-950/40",
      plate: "GJ-27-K-8812",
      conf: "97.8%",
      fps: "30 FPS · H.265",
      speed: "35 km/h",
    },
    {
      id: "CAM-12",
      name: "SG Highway · ISKCON Flyover",
      dept: "POLICE",
      deptColor: "text-cyan-400 border-cyan-500/40 bg-cyan-950/40",
      plate: "GJ-01-EF-4410",
      conf: "98.5%",
      fps: "25 FPS · RTSP/TCP",
      speed: "64 km/h",
    },
    {
      id: "CAM-29",
      name: "Gandhinagar · Koba Circle",
      dept: "POLICE",
      deptColor: "text-cyan-400 border-cyan-500/40 bg-cyan-950/40",
      plate: "GJ-18-CD-5678",
      conf: "99.6%",
      fps: "30 FPS · H.264",
      speed: "58 km/h",
    },
  ];

  const scanLinePos = (frame * 3) % 100;

  return (
    <div className="w-full h-full bg-[#050B14] text-white flex flex-col justify-between p-14 relative overflow-hidden font-sans select-none">
      {/* Background accents */}
      <div className="absolute top-1/4 -right-20 w-[500px] h-[500px] rounded-full bg-cyan-900/10 blur-[100px] pointer-events-none" />

      {/* Header */}
      <div
        style={{ transform: `translateY(${(1 - titleSlide) * -30}px)` }}
        className="flex items-center justify-between border-b border-slate-800 pb-5 z-10"
      >
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Badge label="Model 1 &amp; Model 2" variant="blue" icon={<Layers className="w-3.5 h-3.5" />} />
            <Badge label="Statewide Central Registry" variant="emerald" icon={<Server className="w-3.5 h-3.5" />} />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            Unified CCTV Viewing Wall &amp; PTS Ingestion Engine
          </h2>
        </div>

        <div className="flex items-center gap-6 font-mono text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300">52 Pilot Cams Verified</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-cyan-300">Monotonic PTS Sync</span>
          </div>
        </div>
      </div>

      {/* Center 2x2 Video Surveillance Grid */}
      <div
        style={{ transform: `scale(${gridScale})` }}
        className="grid grid-cols-2 gap-5 my-auto z-10"
      >
        {cameraCams.map((cam, idx) => {
          return (
            <div
              key={cam.id}
              className="relative bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-2xl p-4 flex flex-col justify-between h-[210px]"
            >
              {/* Scanline effect */}
              <div
                className="absolute left-0 right-0 h-[2px] bg-cyan-400/30 blur-[1px] pointer-events-none"
                style={{ top: `${scanLinePos}%` }}
              />

              {/* Cam Top Bar */}
              <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  <span className="text-xs font-mono font-bold text-red-400">LIVE</span>
                  <span className="text-xs font-mono text-slate-300 font-semibold">{cam.id}</span>
                  <span className="text-xs text-slate-400">· {cam.name}</span>
                </div>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${cam.deptColor}`}
                >
                  {cam.dept}
                </span>
              </div>

              {/* Center ANPR Target Detection Reticle */}
              <div className="my-auto flex items-center justify-center relative">
                <div className="border border-cyan-400/80 bg-cyan-950/30 rounded-lg p-3 px-5 flex items-center gap-4 backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono text-cyan-300 tracking-wider">AI OCR CANDIDATE</span>
                    <span className="text-xl font-mono font-extrabold text-white tracking-widest">{cam.plate}</span>
                  </div>
                  <div className="h-8 w-[1px] bg-cyan-500/30" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono text-slate-400">CONFIDENCE</span>
                    <span className="text-sm font-mono font-bold text-emerald-400">{cam.conf}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono text-slate-400">TELEMETRY</span>
                    <span className="text-sm font-mono font-bold text-amber-400">{cam.speed}</span>
                  </div>
                </div>
              </div>

              {/* Cam Bottom Info */}
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 z-10 border-t border-slate-800/80 pt-2">
                <span>{cam.fps}</span>
                <span className="text-cyan-400/80">PTS: 0x{((frame * 900) + idx * 1234).toString(16).toUpperCase()}</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <Eye className="w-3 h-3" /> ZERO FRAME DROP
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Protocol Rigor Banner */}
      <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-xl px-6 py-3 text-xs font-mono text-slate-300 z-10">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-white">Edge Protocol Rigor:</span>
          <span>Forced RTSP over TCP avoids UDP packet loss · AES-128 Proxy shields camera credentials</span>
        </div>
        <div className="text-cyan-400 font-semibold">
          Hardware H.264 &amp; H.265 Transcode · 0-FPS Drift
        </div>
      </div>
    </div>
  );
};
