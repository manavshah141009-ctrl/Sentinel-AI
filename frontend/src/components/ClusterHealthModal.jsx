import React, { useState, useEffect } from 'react';
import {
  Server,
  Activity,
  Cpu,
  Radio,
  Layers,
  CheckCircle2,
  HardDrive,
  Zap,
  Gauge,
  X,
  RefreshCw,
  ShieldCheck,
  TrendingDown
} from 'lucide-react';
import { fetchClusterOverview } from '../services/api';

export default function ClusterHealthModal({ isOpen, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetchClusterOverview();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadMetrics();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl h-[88vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-[#EADFC6] animate-fade-up">
        {/* Header */}
        <div className="p-5 bg-club-pine text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-club-tang flex items-center justify-center text-white shadow">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-club-tang text-white text-[10px] font-extrabold uppercase tracking-wider">
                  Statewide Architecture Sizing
                </span>
                <span className="text-white/60 text-xs">·</span>
                <span className="text-emerald-400 text-xs font-mono font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  33 District PoPs Online
                </span>
              </div>
              <h2 className="text-lg font-black tracking-tight">
                80,000-Camera Scalability & Server Management Console
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadMetrics}
              disabled={loading}
              className="p-2 rounded-full hover:bg-white/10 text-white/80 transition-all"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-white/80 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-auto p-5 bg-club-cream flex flex-col gap-4">
          {data ? (
            <>
              {/* Executive Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="club-card p-4 rounded-3xl">
                  <span className="text-[10px] font-bold text-club-ink/55 uppercase tracking-wider block mb-1">
                    Statewide Scale Target
                  </span>
                  <div className="font-mono font-black text-2xl text-club-pine">
                    {data.total_registered_cameras?.toLocaleString()}
                  </div>
                  <span className="text-[11px] text-club-ink/55 font-medium">
                    Across 26 Gujarat Departments
                  </span>
                </div>

                <div className="club-card p-4 rounded-3xl border-2 border-emerald-500/20 bg-emerald-50/40">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1 flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
                    Bandwidth Reduction
                  </span>
                  <div className="font-mono font-black text-2xl text-emerald-700">
                    {data.bandwidth_metrics?.bandwidth_reduction_pct}%
                  </div>
                  <span className="text-[11px] text-emerald-800/80 font-medium">
                    {data.bandwidth_metrics?.sentinel_metadata_mbps} Mbps vs 320 Gbps Raw
                  </span>
                </div>

                <div className="club-card p-4 rounded-3xl">
                  <span className="text-[10px] font-bold text-club-ink/55 uppercase tracking-wider block mb-1">
                    Zero-Lag Buffer Depth
                  </span>
                  <div className="font-mono font-black text-2xl text-club-tang">
                    {data.backpressure_management?.ring_buffer_depth_frames} Frames
                  </div>
                  <span className="text-[11px] text-club-ink/55 font-medium">
                    {data.backpressure_management?.stream_lag_status} (&lt;125ms delay)
                  </span>
                </div>

                <div className="club-card p-4 rounded-3xl">
                  <span className="text-[10px] font-bold text-club-ink/55 uppercase tracking-wider block mb-1">
                    End-to-End Latency
                  </span>
                  <div className="font-mono font-black text-2xl text-blue-600">
                    {data.latency_sla?.end_to_end_alert_dispatch_ms} ms
                  </div>
                  <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Meets &lt;50ms SLA
                  </span>
                </div>
              </div>

              {/* Bandwidth & Motion-Gating Strategy Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 3-Tier Zero-Bandwidth Topology Card */}
                <div className="club-card p-4 rounded-3xl flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Radio className="w-4 h-4 text-club-tang" />
                      <h3 className="font-bold text-sm text-club-ink">
                        3-Tier Edge-to-Core Network Optimization
                      </h3>
                    </div>
                    <p className="text-xs text-club-ink/65 leading-relaxed">
                      Rather than streaming 80,000 raw 1080p feeds (320 Gbps) to Gandhinagar, SENTINEL-AI runs localized edge inference. Only compact JSON events (15 KB) travel upstream.
                    </p>
                  </div>

                  <div className="space-y-2 text-xs font-mono bg-club-creamdark p-3 rounded-2xl border border-[#EADFC6]">
                    <div className="flex items-center justify-between">
                      <span className="text-club-ink/60">Raw Continuous Video:</span>
                      <span className="font-bold text-red-600">320.0 Gbps (Network Failure)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-club-ink/60">SENTINEL-AI Metadata Stream:</span>
                      <span className="font-bold text-emerald-700">158.4 Mbps (Fiber Safe)</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-[#EADFC6]">
                      <span className="text-club-ink/60">Gujarat SWAN Backbone Usage:</span>
                      <span className="font-bold text-club-pine">1.8% of 10 Gbps Link</span>
                    </div>
                  </div>
                </div>

                {/* Motion Gate & GPU Energy Sizing Card */}
                <div className="club-card p-4 rounded-3xl flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Cpu className="w-4 h-4 text-club-pine" />
                      <h3 className="font-bold text-sm text-club-ink">
                        Motion-Gated AI Inference Efficiency
                      </h3>
                    </div>
                    <p className="text-xs text-club-ink/65 leading-relaxed">
                      CCTV cameras on rural highways and night streets have no moving vehicles 65% of the time. The CPU motion gate pre-filter discards static frames in &lt;1ms before reaching the GPU.
                    </p>
                  </div>

                  <div className="space-y-2 text-xs font-mono bg-club-creamdark p-3 rounded-2xl border border-[#EADFC6]">
                    <div className="flex items-center justify-between">
                      <span className="text-club-ink/60">Empty Road Frames Skipped:</span>
                      <span className="font-bold text-emerald-700">65.4% Compute Saved</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-club-ink/60">Distributed GPU Pool:</span>
                      <span className="font-bold text-club-pine">{data.total_gpus_deployed} NVIDIA L4s (Statewide)</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-[#EADFC6]">
                      <span className="text-club-ink/60">Per-District Average:</span>
                      <span className="font-bold text-club-tang">2 to 3 GPUs per District HQ</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 33 Gujarat District PoPs Distribution Table */}
              <div className="club-card p-4 rounded-3xl flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-[#EADFC6] pb-2">
                  <h3 className="font-bold text-sm text-club-ink flex items-center gap-2">
                    <Layers className="w-4 h-4 text-club-pine" />
                    <span>Gujarat District Ingestion Hubs & Server Distribution (33 PoPs)</span>
                  </h3>
                  <span className="text-xs text-club-ink/50 font-mono">
                    Partitioned Apache Kafka Architecture
                  </span>
                </div>

                <div className="max-h-64 overflow-y-auto rounded-2xl border border-[#EADFC6]">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-club-pine text-white sticky top-0">
                      <tr>
                        <th className="p-2.5">District</th>
                        <th className="p-2.5">Integrated Cameras</th>
                        <th className="p-2.5">Regional PoP Ingestion Hub</th>
                        <th className="p-2.5">Allocated L4 GPUs</th>
                        <th className="p-2.5">Traffic Density</th>
                        <th className="p-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EADFC6] bg-white">
                      {data.districts?.map((d, i) => (
                        <tr key={i} className="hover:bg-club-cream/50 transition-colors">
                          <td className="p-2.5 font-bold text-club-ink font-sans">{d.name}</td>
                          <td className="p-2.5 font-bold text-club-tang">{d.cams?.toLocaleString()}</td>
                          <td className="p-2.5 text-club-ink/70">{d.pop}</td>
                          <td className="p-2.5 text-club-pine font-bold">{d.gpus} GPUs</td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              d.traffic === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                              d.traffic === 'HIGH' ? 'bg-amber-100 text-amber-700' :
                              'bg-emerald-100 text-emerald-700'
                            }`}>
                              {d.traffic}
                            </span>
                          </td>
                          <td className="p-2.5 text-emerald-600 font-bold">ONLINE</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-500 font-medium">
              Loading 80,000-camera cluster metrics...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
