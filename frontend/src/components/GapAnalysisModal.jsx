import React, { useState, useEffect } from 'react';
import {
  PieChart,
  X,
  AlertTriangle,
  ShieldCheck,
  Layers,
  MapPin,
  BarChart3,
  CheckCircle2
} from 'lucide-react';
import { fetchGapAnalysis } from '../services/api';

export default function GapAnalysisModal({ isOpen, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchGapAnalysis()
        .then(res => setData(res))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-3xl bg-club-cream rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-club-ink">
        {/* Header */}
        <div className="bg-club-pine p-4 flex items-center justify-between text-club-cream">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-2xl bg-club-gold flex items-center justify-center text-club-pine">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm">
                Model 1: Statewide Gap & Blind Spot Infrastructure Analysis
              </h2>
              <p className="text-[11px] text-club-cream/60">
                Surveillance density assessment for Gujarat 80,000 camera expansion
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-club-cream/70 hover:text-white hover:bg-white/15">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {loading ? (
            <div className="p-8 text-center text-xs text-club-ink/55">Computing spatial surveillance density...</div>
          ) : data ? (
            <>
              {/* Top Metrics Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="club-card p-3 rounded-3xl">
                  <span className="text-[10px] text-club-ink/55 font-bold uppercase block mb-1">Onboarded Grid</span>
                  <span className="font-mono text-xl font-black">{data.total_cameras}</span>
                  <span className="text-[10px] text-club-leaf font-bold block mt-0.5">Live Pilot Assets</span>
                </div>

                <div className="club-card p-3 rounded-3xl">
                  <span className="text-[10px] text-club-ink/55 font-bold uppercase block mb-1">Target Scale</span>
                  <span className="font-mono text-xl font-black text-club-pine">80,000</span>
                  <span className="text-[10px] text-club-ink/55 block mt-0.5">Statewide Target</span>
                </div>

                <div className="club-card p-3 rounded-3xl">
                  <span className="text-[10px] text-club-ink/55 font-bold uppercase block mb-1">District Coverage</span>
                  <span className="font-mono text-xl font-black text-club-tang">{data.statewide_coverage_score}%</span>
                  <span className="text-[10px] text-club-ink/55 block mt-0.5">22 Key Districts</span>
                </div>

                <div className="club-card p-3 rounded-3xl">
                  <span className="text-[10px] text-club-ink/55 font-bold uppercase block mb-1">Identified Blindspots</span>
                  <span className="font-mono text-xl font-black text-red-600">{data.blind_spots.length}</span>
                  <span className="text-[10px] text-red-500 font-bold block mt-0.5">Priority Zones</span>
                </div>
              </div>

              {/* Department Distribution */}
              <div className="club-card p-4 rounded-3xl text-xs">
                <h3 className="font-bold mb-2 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-club-pine" />
                  <span>Inter-Departmental Asset Distribution</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono">
                  {Object.entries(data.department_breakdown).map(([dept, count]) => (
                    <div key={dept} className="bg-club-cream p-2.5 rounded-2xl border border-[#EADFC6]">
                      <span className="text-[10px] font-sans font-bold text-club-ink/55 block">{dept}</span>
                      <span className="text-base font-black">{count}</span>
                      <span className="text-[10px] text-club-ink/45 block">({((count / data.total_cameras) * 100).toFixed(0)}%)</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Critical Blind Spots List */}
              <div className="space-y-2">
                <h3 className="font-bold text-xs flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span>Uncovered Zones & High-Priority Expansion Sites</span>
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {data.blind_spots.map((bs, i) => (
                    <div
                      key={i}
                      className="p-3 bg-red-50 border border-red-300 rounded-2xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{bs.district}</span>
                          <span className="px-2 py-0.2 rounded-full bg-red-600 text-white text-[10px] font-bold">
                            {bs.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-club-ink/65 mt-1">{bs.recommendation}</p>
                      </div>
                      <div className="text-right text-[10px] font-mono text-club-ink/55 whitespace-nowrap">
                        Current: <span className="text-red-600 font-bold">{bs.cameras}</span> cams
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
