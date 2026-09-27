import React, { useState } from 'react';
import {
  X,
  PlusCircle,
  Upload,
  Radio,
  Check,
  FileText,
  Server,
  RefreshCw
} from 'lucide-react';
import { onboardCamera, bulkImportCameras, syncSandbox } from '../services/api';

export default function CameraModal({
  isOpen,
  onClose,
  onSuccess = () => {}
}) {
  const [tab, setTab] = useState('sandbox'); // 'sandbox', 'bulk', 'manual'
  const [sandboxUrl, setSandboxUrl] = useState('https://live.sentinelgujarat.in/api/ingest');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  // Manual Form State
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('Police');
  const [location, setLocation] = useState('');
  const [district, setDistrict] = useState('Ahmedabad');
  const [lat, setLat] = useState('23.0225');
  const [lng, setLng] = useState('72.5714');
  const [rtspUrl, setRtspUrl] = useState('rtsp://live.sentinelgujarat.in:8554/stream/1');
  const [vmsVendor, setVmsVendor] = useState('Hikvision iVMS');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSandboxSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await syncSandbox(sandboxUrl);
      setSyncResult(res);
      if (res.success) onSuccess();
    } catch (err) {
      setSyncResult({ success: false, message: err.message });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const cam = {
        name,
        department,
        department_label: department === 'Police' ? 'Home (Gujarat Police)' : `${department} Department`,
        location,
        district,
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        rtsp_url: rtspUrl,
        vms_vendor: vmsVendor,
        codec: 'h264',
        resolution: '1920x1080',
        declared_fps: 25,
        bitrate_kbps: 4096
      };
      await onboardCamera(cam);
      onSuccess();
      onClose();
    } catch (err) {
      alert('Error onboarding camera: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputCls = "w-full px-3 py-2 bg-white border border-[#EADFC6] rounded-2xl text-club-ink focus:outline-none focus:border-club-pine";

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-2xl bg-club-cream rounded-3xl shadow-2xl overflow-hidden flex flex-col text-club-ink">
        {/* Header */}
        <div className="bg-club-pine p-4 flex items-center justify-between text-club-cream">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-2xl bg-club-tang flex items-center justify-center text-white">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm">Camera Onboarding Engine</h2>
              <p className="text-[11px] text-club-cream/60">Integrate multi-department CCTV systems into unified registry</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-club-cream/70 hover:text-white hover:bg-white/15">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-[#EADFC6] bg-[#FFFDF7]">
          <button
            onClick={() => setTab('sandbox')}
            className={`flex-1 py-2.5 text-xs font-bold transition-all ${
              tab === 'sandbox' ? 'border-b-2 border-club-tang text-club-tang' : 'text-club-ink/45 hover:text-club-ink'
            }`}
          >
            Live Sentinel Gateway Sync
          </button>
          <button
            onClick={() => setTab('manual')}
            className={`flex-1 py-2.5 text-xs font-bold transition-all ${
              tab === 'manual' ? 'border-b-2 border-club-tang text-club-tang' : 'text-club-ink/45 hover:text-club-ink'
            }`}
          >
            Manual Camera Onboarding
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1">
          {tab === 'sandbox' && (
            <div className="space-y-4">
              <div className="p-3 bg-club-pine/10 border border-club-pine/25 rounded-2xl text-xs text-club-pine">
                <span className="font-bold block mb-1">Official Sentinel Sandbox /api/ingest Sync:</span>
                Connects directly to the live challenge catalogue endpoint to ingest real-time Gujarat Government camera metadata and stream paths.
              </div>

              <div>
                <label className="block text-xs font-bold text-club-ink/70 mb-1">Sandbox Catalog URL</label>
                <input
                  type="text"
                  value={sandboxUrl}
                  onChange={(e) => setSandboxUrl(e.target.value)}
                  className={`${inputCls} font-mono`}
                />
              </div>

              <button
                onClick={handleSandboxSync}
                disabled={isSyncing}
                className="w-full py-2.5 rounded-full bg-club-tang hover:brightness-110 text-white font-bold text-xs shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing Feeds...' : 'Sync with Sentinel Live Catalog'}</span>
              </button>

              {syncResult && (
                <div className={`p-3 rounded-2xl text-xs font-semibold border ${
                  syncResult.success ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-amber-50 border-amber-300 text-amber-700'
                }`}>
                  {syncResult.message || `Successfully synced ${syncResult.synced} feeds! Total cameras active: ${syncResult.total}`}
                </div>
              )}
            </div>
          )}

          {tab === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-club-ink/70 mb-1">Camera Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CAM-53 — Airport Circle"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block font-bold text-club-ink/70 mb-1">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className={inputCls}
                  >
                    <option value="Police">Police (Traffic/Crime)</option>
                    <option value="GSRTC">GSRTC (Transit)</option>
                    <option value="Municipal">Municipal Corporation</option>
                    <option value="Health">Health (Civil Hospital)</option>
                    <option value="Panchayat">Panchayat (Rural)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-club-ink/70 mb-1">Location Details</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Terminal Exit Bay 1"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block font-bold text-club-ink/70 mb-1">District</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ahmedabad"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-club-ink/70 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    className={`${inputCls} font-mono`}
                  />
                </div>
                <div>
                  <label className="block font-bold text-club-ink/70 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    className={`${inputCls} font-mono`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-club-ink/70 mb-1">RTSP Stream URL (RTP/RTSP over TCP)</label>
                <input
                  type="text"
                  required
                  placeholder="rtsp://<host>:8554/stream/<id>"
                  value={rtspUrl}
                  onChange={(e) => setRtspUrl(e.target.value)}
                  className={`${inputCls} font-mono`}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-full bg-club-leaf hover:brightness-110 text-white font-bold text-xs shadow transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Registering...' : 'Register Camera to Statewide Grid'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
