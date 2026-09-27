import React, { useState } from 'react';
import {
  ShieldAlert,
  X,
  Volume2,
  VolumeX,
  Radio,
  MapPin,
  Clock,
  Check,
  Send,
  AlertTriangle,
  FileText
} from 'lucide-react';

export default function WatchlistAlerts({
  isOpen,
  onClose,
  alerts = [],
  watchlist = []
}) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState('alerts'); // 'alerts' or 'database'
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState(new Set());

  const handleAcknowledge = (id) => {
    setAcknowledgedAlerts(prev => new Set([...prev, id]));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-fadeIn">
      <div className="w-full max-w-xl bg-club-cream h-full border-l border-[#EADFC6] shadow-2xl flex flex-col overflow-hidden animate-slideLeft text-club-ink">
        {/* Modal Header */}
        <div className="bg-club-pine p-4 flex items-center justify-between text-club-cream">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-club-tang flex items-center justify-center text-white">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm flex items-center gap-2">
                <span>eGujCop & VAHAN Intelligence Center</span>
                <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-mono">
                  {alerts.length} ALERTS
                </span>
              </h2>
              <p className="text-[11px] text-club-cream/60">
                Continuous Watchlist Cross-Referencing & Incident Dispatch
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-full bg-white/15 hover:bg-white/25 text-xs"
              title={soundEnabled ? 'Mute Alert Chime' : 'Unmute Alert Chime'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 opacity-60" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/15 hover:bg-white/25"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 px-4 pt-3 bg-[#FFFDF7] border-b border-[#EADFC6]">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`pb-2 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'alerts'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-club-ink/45 hover:text-club-ink'
            }`}
          >
            Live Tactical Alerts ({alerts.length})
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`pb-2 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'database'
                ? 'border-club-pine text-club-pine'
                : 'border-transparent text-club-ink/45 hover:text-club-ink'
            }`}
          >
            Active Watchlist Database ({watchlist.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activeTab === 'alerts' ? (
            alerts.length === 0 ? (
              <div className="p-8 text-center text-club-ink/50 text-xs">
                No active police alerts at this moment. Video streams are being continuously monitored.
              </div>
            ) : (
              alerts.map((alert, idx) => {
                const isAck = acknowledgedAlerts.has(alert.alert_id);
                return (
                  <div
                    key={alert.alert_id || idx}
                    className={`p-3.5 rounded-3xl border transition-all flex flex-col gap-2 ${
                      isAck
                        ? 'bg-white border-[#EADFC6] opacity-60'
                        : 'bg-white border-red-400 shadow-lg'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-mono font-bold text-[10px]">
                        {alert.category || 'CRITICAL'}
                      </span>
                      <span className="text-[11px] font-mono text-club-ink/50 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-mono font-black text-base text-club-tang">
                          {alert.matched_plate}
                        </h4>
                        <span className="text-xs text-club-ink/70 font-semibold">
                          ({alert.vehicle_info})
                        </span>
                      </div>
                      <p className="text-xs text-red-700 mt-1 font-semibold">
                        {alert.alert_message}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-club-cream p-2 rounded-2xl border border-[#EADFC6]">
                      <div>
                        <span className="text-club-ink/45 block text-[10px] font-bold">FIR / CRIME NUMBER</span>
                        <span className="font-mono font-bold">{alert.fir_number}</span>
                      </div>
                      <div>
                        <span className="text-club-ink/45 block text-[10px] font-bold">JURISDICTION</span>
                        <span className="truncate block font-semibold">{alert.police_station}</span>
                      </div>
                      <div>
                        <span className="text-club-ink/45 block text-[10px] font-bold">DETECTION CAMERA</span>
                        <span className="truncate block font-semibold">{alert.camera_name}</span>
                      </div>
                      <div>
                        <span className="text-club-ink/45 block text-[10px] font-bold">DISTRICT</span>
                        <span className="font-semibold">{alert.district}</span>
                      </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-300 p-2 rounded-2xl text-[11px] text-amber-800 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>{alert.action_required}</span>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleAcknowledge(alert.alert_id)}
                        disabled={isAck}
                        className="px-3 py-1.5 rounded-full bg-club-creamdark hover:bg-[#EADFC6] font-semibold text-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5 text-club-leaf" />
                        <span>{isAck ? 'Acknowledged' : 'Acknowledge'}</span>
                      </button>

                      <button
                        onClick={() => alert(`🚨 DISPATCH ISSUED: PCR Van #4 and Gandhinagar Control Room notified for vehicle ${alert.matched_plate}`)}
                        className="px-3 py-1.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow transition-all flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Dispatch PCR Van</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )
          ) : (
            <div className="space-y-2.5">
              {watchlist.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white rounded-3xl border border-[#EADFC6] flex items-start justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-sm">
                        {item.display_plate || item.plate_number}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-club-pine text-[10px] text-club-cream font-semibold">
                        {item.category}
                      </span>
                    </div>
                    <p className="font-medium text-club-ink/80">
                      {item.vehicle_color} {item.vehicle_make} {item.vehicle_model} · {item.owner_name}
                    </p>
                    <p className="text-[11px] text-club-ink/55 mt-1">
                      {item.fir_number} ({item.police_station})
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
