import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Map, BarChart3, HardDrive, Network, CheckCircle2, Globe2 } from "lucide-react";
import { Badge, TechCard } from "./components/Badge";

export const Scene5Scalability: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSlide = spring({ frame, fps, config: { damping: 14 } });
  const contentFade = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" });

  const districtGaps = [
    { district: "Ahmedabad Urban", coverage: "94.2%", status: "OPTIMAL", color: "text-emerald-400" },
    { district: "Gandhinagar Capital", coverage: "96.8%", status: "OPTIMAL", color: "text-emerald-400" },
    { district: "Surat Commercial", coverage: "88.5%", status: "ACTIVE", color: "text-cyan-400" },
    { district: "Surendranagar Corridor", coverage: "42.1%", status: "DARK ZONE GAP", color: "text-amber-400" },
    { district: "Amreli Coastal Border", coverage: "38.7%", status: "DARK ZONE GAP", color: "text-red-400" },
  ];

  return (
    <div className="w-full h-full bg-[#050B14] text-white flex flex-col justify-between p-14 relative overflow-hidden font-sans select-none">
      {/* Background ambient glow */}
      <div className="absolute top-10 right-10 w-[600px] h-[600px] rounded-full bg-blue-900/10 blur-[130px] pointer-events-none" />

      {/* Header */}
      <div
        style={{ transform: `translateY(${(1 - titleSlide) * -30}px)` }}
        className="flex items-center justify-between border-b border-slate-800 pb-4 z-10"
      >
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Badge label="Statewide Expansion" variant="blue" icon={<Globe2 className="w-3.5 h-3.5" />} />
            <Badge label="Spatial Gap Analysis" variant="amber" icon={<Map className="w-3.5 h-3.5" />} />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            Spatial Gap Analysis &amp; Scalability to 80,000 Cameras
          </h2>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-cyan-400">
          <span>GSDC ACTIVE-ACTIVE TIER-IV</span>
          <span className="text-slate-700">|</span>
          <span className="text-emerald-400 font-bold">99.99% UPTIME SLA</span>
        </div>
      </div>

      {/* Main Content Split */}
      <div
        style={{ opacity: contentFade }}
        className="grid grid-cols-12 gap-8 my-auto z-10 items-stretch"
      >
        {/* Left: Spatial Gap Analysis Table (5 cols) */}
        <div className="col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-2xl">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono text-slate-200 font-bold uppercase tracking-wider">
                  Automated Dark-Zone Detection
                </span>
              </div>
              <span className="text-xs font-mono text-cyan-400">33 Districts Scanned</span>
            </div>

            <div className="space-y-2.5">
              {districtGaps.map((d) => (
                <div
                  key={d.district}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-mono"
                >
                  <div>
                    <div className="text-slate-200 font-semibold">{d.district}</div>
                    <div className={`text-[10px] font-bold ${d.color}`}>{d.status}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold text-sm">{d.coverage}</div>
                    <div className="text-[10px] text-slate-500">Density Index</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-xs font-mono text-slate-400">
            Automated recommendations generated for SCRB border expansion.
          </div>
        </div>

        {/* Right: Scalability Architecture Blocks (7 cols) */}
        <div className="col-span-7 flex flex-col justify-between gap-4">
          <div className="grid grid-cols-2 gap-4">
            <TechCard
              title="Edge Compute Nodes"
              value="33 District HQs"
              subtitle="85% Core Network Bandwidth Reduction"
              icon={<Network className="w-5 h-5 text-cyan-400" />}
              accentColor="#06b6d4"
            />
            <TechCard
              title="Event Streaming"
              value="250,000 / sec"
              subtitle="Distributed Apache Kafka Cluster"
              icon={<Globe2 className="w-5 h-5 text-emerald-400" />}
              accentColor="#10b981"
            />
          </div>

          {/* Storage Architecture Tiering Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-slate-300 font-bold uppercase tracking-wider flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-purple-400" />
                Tiered Forensic Storage Architecture
              </span>
              <span className="text-xs font-mono text-purple-400">Statutory Compliant</span>
            </div>

            <div className="grid grid-cols-3 gap-3 font-mono text-xs text-center">
              <div className="p-3 rounded-xl bg-slate-950 border border-cyan-500/30">
                <div className="text-cyan-400 font-bold">HOT TIER (7 Days)</div>
                <div className="text-white font-bold text-lg mt-1">NVMe Arrays</div>
                <div className="text-[10px] text-slate-400 mt-1">Instant Replay &amp; AI</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/30">
                <div className="text-emerald-400 font-bold">WARM TIER (30 Days)</div>
                <div className="text-white font-bold text-lg mt-1">Ceph S3 Object</div>
                <div className="text-[10px] text-slate-400 mt-1">Investigative Traces</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-purple-500/30">
                <div className="text-purple-400 font-bold">COLD TIER (180+ Days)</div>
                <div className="text-white font-bold text-lg mt-1">Deep Archive</div>
                <div className="text-[10px] text-slate-400 mt-1">Judicial Retention</div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Vendor-Neutral Architecture
            </span>
            <span>Supports Milestone, Hikvision, Dahua, CP Plus, Axis &amp; RTSP IP</span>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-xl px-6 py-3 text-xs font-mono text-slate-300 z-10">
        <span className="text-cyan-400 font-bold">Scaling to 80,000 Cameras:</span>
        <span>Proven Zero-Single-Point-of-Failure High Availability Topology across Gujarat State</span>
        <span className="text-emerald-400 font-bold">PRODUCTION-READY</span>
      </div>
    </div>
  );
};
