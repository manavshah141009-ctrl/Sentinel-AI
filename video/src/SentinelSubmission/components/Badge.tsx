import React from "react";

export const Badge: React.FC<{
  label: string;
  variant?: "blue" | "emerald" | "amber" | "red" | "purple";
  icon?: React.ReactNode;
}> = ({ label, variant = "blue", icon }) => {
  const styles = {
    blue: "bg-cyan-950/80 text-cyan-400 border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.25)]",
    emerald: "bg-emerald-950/80 text-emerald-400 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.25)]",
    amber: "bg-amber-950/80 text-amber-400 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.25)]",
    red: "bg-red-950/80 text-red-400 border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.35)]",
    purple: "bg-purple-950/80 text-purple-400 border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.25)]",
  }[variant];

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-mono font-semibold tracking-wider uppercase backdrop-blur-md ${styles}`}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
};

export const TechCard: React.FC<{
  title: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  accentColor?: string;
}> = ({ title, value, subtitle, icon, accentColor = "#06b6d4" }) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl backdrop-blur-md relative overflow-hidden">
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }}
      />
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">{title}</span>
        {icon}
      </div>
      <div className="text-2xl font-bold font-mono tracking-tight text-white">{value}</div>
      {subtitle && <div className="text-xs text-slate-400 mt-1">{subtitle}</div>}
    </div>
  );
};
