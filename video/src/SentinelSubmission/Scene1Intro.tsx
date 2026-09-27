import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Shield, Radio, Cpu, Lock } from "lucide-react";
import { Badge, TechCard } from "./components/Badge";

export const Scene1Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring animations
  const logoScale = spring({ frame, fps, config: { damping: 12, mass: 0.8 } });
  const titleOpacity = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp" });
  const subtitleSlide = interpolate(frame, [25, 45], [40, 0], { extrapolateRight: "clamp" });
  const cardsOpacity = interpolate(frame, [45, 65], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div className="w-full h-full bg-[#050B14] text-white flex flex-col justify-between p-16 relative overflow-hidden font-sans select-none">
      {/* Background Cyber Grid */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#0ea5e9 1px, transparent 1px), linear-gradient(90deg, #0ea5e9 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          transform: `translateY(${(frame * 0.5) % 60}px)`,
        }}
      />

      {/* Radial glow */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-cyan-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-blue-600/15 blur-[120px] pointer-events-none" />

      {/* Top Header Bar */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <Badge
            label="Gujarat Police Innovation Challenge 2026"
            variant="blue"
            icon={<Shield className="w-4 h-4 text-cyan-400" />}
          />
          <Badge
            label="Home Department & SCRB"
            variant="purple"
          />
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-cyan-400/80">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            STATEWIDE C2 ONLINE
          </span>
          <span className="text-slate-600">|</span>
          <span>BUILD: v2.6.4-ENTERPRISE</span>
        </div>
      </div>

      {/* Center Hero Title */}
      <div className="flex flex-col items-center justify-center my-auto z-10 text-center">
        {/* Emblem / Shield icon */}
        <div
          style={{ transform: `scale(${logoScale})` }}
          className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 p-[2px] shadow-[0_0_50px_rgba(6,182,212,0.4)] mb-6 flex items-center justify-center"
        >
          <div className="w-full h-full bg-[#050B14] rounded-2xl flex items-center justify-center">
            <Shield className="w-12 h-12 text-cyan-400" />
          </div>
        </div>

        <h1
          style={{ opacity: titleOpacity }}
          className="text-7xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent"
        >
          SENTINEL<span className="text-cyan-400 font-mono">-AI</span>
        </h1>

        <p
          style={{
            opacity: titleOpacity,
            transform: `translateY(${subtitleSlide}px)`,
          }}
          className="text-2xl text-cyan-200/90 font-medium max-w-4xl mt-4 leading-relaxed"
        >
          Gujarat Unified Law Enforcement Video Management &amp; Intelligence Platform
        </p>

        <p
          style={{ opacity: cardsOpacity }}
          className="text-sm text-slate-400 mt-2 font-mono tracking-wide"
        >
          Autonomous Video Ingestion · Multi-Camera Trajectory Reconstruction · Judicial Audit Proof
        </p>
      </div>

      {/* Key Metric Highlights Grid */}
      <div
        style={{ opacity: cardsOpacity }}
        className="grid grid-cols-4 gap-6 z-10"
      >
        <TechCard
          title="Departments Unified"
          value="26 Agencies"
          subtitle="Police · GSRTC · AMC · Health"
          icon={<Radio className="w-5 h-5 text-cyan-400" />}
          accentColor="#06b6d4"
        />
        <TechCard
          title="Statewide CCTV Target"
          value="80,000+ Feeds"
          subtitle="33 Districts Interconnected"
          icon={<Cpu className="w-5 h-5 text-emerald-400" />}
          accentColor="#10b981"
        />
        <TechCard
          title="Correlation Latency"
          value="< 50 ms"
          subtitle="eGujCop & VAHAN In-Memory"
          icon={<Shield className="w-5 h-5 text-amber-400" />}
          accentColor="#f59e0b"
        />
        <TechCard
          title="Forensic Compliance"
          value="Sec 65B Indian Evidence"
          subtitle="SHA-256 Chain-of-Custody"
          icon={<Lock className="w-5 h-5 text-purple-400" />}
          accentColor="#a855f7"
        />
      </div>
    </div>
  );
};
