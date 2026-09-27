import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  Disc,
  Square,
  Download,
  AlertCircle,
  Clock,
  HardDrive,
  Mic,
  MicOff,
  CheckCircle2,
  Film,
  X,
  Play,
  Monitor,
  Sparkles
} from 'lucide-react';

export default function ScreenRecorderModal({ isOpen, onClose }) {
  const [recorderStatus, setRecorderStatus] = useState({
    status: 'IDLE',
    duration_sec: 0,
    file_size_mb: 0,
    filename: null,
    download_url: null,
    error: null
  });
  const [withAudio, setWithAudio] = useState(false);
  const [recordingsList, setRecordingsList] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeMode, setActiveMode] = useState('browser'); // 'browser' (WebRTC MediaRecorder) or 'system' (ffmpeg avfoundation)
  const [browserRecording, setBrowserRecording] = useState(false);
  const [browserDuration, setBrowserDuration] = useState(0);
  const [browserBlobUrl, setBrowserBlobUrl] = useState(null);

  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const timerRef = useRef(null);

  // Poll backend recorder status & load existing recordings
  const fetchStatusAndList = async () => {
    try {
      const [resStatus, resList] = await Promise.all([
        fetch('/api/recorder/status'),
        fetch('/api/recorder/list')
      ]);
      if (resStatus.ok) {
        const data = await resStatus.json();
        setRecorderStatus(data);
      }
      if (resList.ok) {
        const data = await resList.json();
        setRecordingsList(data.recordings || []);
      }
    } catch (err) {
      console.error('Failed to query recorder status', err);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchStatusAndList();
    const interval = setInterval(fetchStatusAndList, 1500);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Browser MediaRecorder handlers
  const startBrowserCapture = async () => {
    try {
      recordedChunksRef.current = [];
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
          frameRate: { ideal: 30, max: 60 },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: withAudio ? true : false
      });

      // Optional mic audio track
      if (withAudio) {
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const audioCtx = new AudioContext();
          const dest = audioCtx.createMediaStreamDestination();
          if (stream.getAudioTracks().length > 0) {
            const sysSource = audioCtx.createMediaStreamSource(stream);
            sysSource.connect(dest);
          }
          const micSource = audioCtx.createMediaStreamSource(micStream);
          micSource.connect(dest);
          stream.addTrack(dest.stream.getAudioTracks()[0]);
        } catch (e) {
          console.warn('Microphone permission skipped', e);
        }
      }

      const mimeType = MediaRecorder.isTypeSupported('video/webm; codecs=vp9')
        ? 'video/webm; codecs=vp9'
        : 'video/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setBrowserBlobUrl(url);
        setBrowserRecording(false);
        if (timerRef.current) clearInterval(timerRef.current);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      // Handle user pressing browser's native "Stop Sharing" floating button
      stream.getVideoTracks()[0].onended = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      };

      mediaRecorder.start(1000);
      setBrowserRecording(true);
      setBrowserDuration(0);
      setBrowserBlobUrl(null);

      timerRef.current = setInterval(() => {
        setBrowserDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Screen capture error:', err);
      alert('Screen recording permission was not granted or cancelled.');
    }
  };

  const stopBrowserCapture = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  // Backend OS ffmpeg handlers
  const handleStartSystemRecording = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/recorder/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ with_audio: withAudio, capture_device: '1' })
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.message || 'Failed to start OS recording');
      }
      fetchStatusAndList();
    } catch (err) {
      console.error('Error starting system recorder:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStopSystemRecording = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/recorder/stop', { method: 'POST' });
      const data = await res.json();
      fetchStatusAndList();
    } catch (err) {
      console.error('Error stopping system recorder:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  const isRecording = activeMode === 'browser' ? browserRecording : recorderStatus.status === 'RECORDING';
  const displayDuration = activeMode === 'browser' ? browserDuration : recorderStatus.duration_sec;

  const formatSeconds = (sec) => {
    const s = Math.floor(sec || 0);
    const m = Math.floor(s / 60);
    const remainder = s % 60;
    return `${m.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#0b1329] border-2 border-emerald-500/40 rounded-2xl shadow-[0_0_50px_rgba(16,185,129,0.2)] text-slate-100 overflow-hidden">
        
        {/* Header Strip */}
        <div className="bg-gradient-to-r from-emerald-950/80 to-slate-900 px-6 py-4 border-b border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.3)]">
              <Film className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-sans font-black text-base tracking-wide text-white">
                  Hackathon Screen Recording Studio
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 border border-emerald-400 text-emerald-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" /> FULL QUALITY
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Record your full C2 screen presentation for hackathon submission with high-fidelity video & audio.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6">

          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-3 p-1 bg-slate-900/80 rounded-xl border border-slate-800">
            <button
              onClick={() => !isRecording && setActiveMode('browser')}
              disabled={isRecording}
              className={`py-2.5 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                activeMode === 'browser'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              } ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Monitor className="w-4 h-4" />
              <span>Browser Screen & Window Capture</span>
            </button>
            <button
              onClick={() => !isRecording && setActiveMode('system')}
              disabled={isRecording}
              className={`py-2.5 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                activeMode === 'system'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              } ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Video className="w-4 h-4" />
              <span>Native OS Desktop Recorder (ffmpeg)</span>
            </button>
          </div>

          {/* Active Status & Duration Display */}
          <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                  isRecording
                    ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse shadow-[0_0_20px_rgba(244,63,94,0.4)]'
                    : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                }`}
              >
                {isRecording ? <Disc className="w-6 h-6 animate-spin" /> : <Video className="w-6 h-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isRecording ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'
                    }`}
                  />
                  <span className="font-mono font-bold text-sm tracking-wider uppercase text-white">
                    {isRecording ? 'RECORDING IN PROGRESS' : 'STANDBY · READY TO RECORD'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isRecording
                    ? 'Capturing real-time screen presentation at 30 FPS'
                    : 'Click START RECORDING to record your live Sentinel C2 demo.'}
                </p>
              </div>
            </div>

            {/* Timer HUD */}
            <div className="text-right">
              <div className="text-2xl font-mono font-black text-emerald-400 flex items-center gap-1.5 justify-end">
                <Clock className="w-5 h-5 text-emerald-500" />
                {formatSeconds(displayDuration)}
              </div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                Elapsed Time
              </span>
            </div>
          </div>

          {/* Audio Options Toggle */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900/60 rounded-xl border border-slate-800">
            <div className="flex items-center gap-3">
              {withAudio ? (
                <Mic className="w-4 h-4 text-emerald-400" />
              ) : (
                <MicOff className="w-4 h-4 text-slate-500" />
              )}
              <div>
                <span className="text-xs font-bold text-slate-200">Include Microphone Narration</span>
                <p className="text-[11px] text-slate-400">
                  Record voiceover commentary explaining Sentinel AI features to the hackathon judges.
                </p>
              </div>
            </div>
            <button
              onClick={() => setWithAudio(!withAudio)}
              disabled={isRecording}
              className={`px-3 py-1.5 rounded-full font-mono text-xs font-bold transition-all border ${
                withAudio
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              } ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {withAudio ? 'AUDIO: ENABLED' : 'AUDIO: OFF'}
            </button>
          </div>

          {/* Main Action Buttons */}
          <div className="flex items-center gap-3">
            {!isRecording ? (
              <button
                onClick={activeMode === 'browser' ? startBrowserCapture : handleStartSystemRecording}
                disabled={isProcessing}
                className="flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:brightness-110 text-white font-bold text-sm tracking-wide shadow-[0_0_25px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2.5 transition-all transform active:scale-95 disabled:opacity-50"
              >
                <Disc className="w-5 h-5 animate-pulse text-white" />
                <span>START SCREEN RECORDING</span>
              </button>
            ) : (
              <button
                onClick={activeMode === 'browser' ? stopBrowserCapture : handleStopSystemRecording}
                disabled={isProcessing}
                className="flex-1 py-3.5 px-6 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm tracking-wide shadow-[0_0_25px_rgba(244,63,94,0.4)] flex items-center justify-center gap-2.5 transition-all transform active:scale-95 disabled:opacity-50 animate-pulse"
              >
                <Square className="w-5 h-5 fill-white text-white" />
                <span>STOP & SAVE RECORDING</span>
              </button>
            )}
          </div>

          {/* Download Box for freshly recorded browser video */}
          {browserBlobUrl && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/50 rounded-xl flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <div>
                  <span className="text-xs font-bold text-emerald-300">Screen Recording Completed!</span>
                  <p className="text-[11px] text-slate-300">
                    Your WebM video is ready for your hackathon submission.
                  </p>
                </div>
              </div>
              <a
                href={browserBlobUrl}
                download={`sentinel_hackathon_submission_${Date.now()}.webm`}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Video</span>
              </a>
            </div>
          )}

          {/* OS ffmpeg Recordings List */}
          {recordingsList.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                Saved OS Screen Recordings ({recordingsList.length})
              </span>
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {recordingsList.map((rec, i) => (
                  <div
                    key={i}
                    className="px-3 py-2 bg-slate-900/60 rounded-lg border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Film className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span className="font-mono text-slate-300 truncate">{rec.filename}</span>
                      <span className="text-[10px] text-slate-500 font-mono">({rec.size_mb} MB)</span>
                    </div>
                    <a
                      href={rec.download_url}
                      download={rec.filename}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white font-mono text-[11px] flex items-center gap-1 transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer info strip */}
        <div className="bg-slate-900/90 px-6 py-2.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Target Resolution: 1080p @ 30fps</span>
          <span>Codec: H.264 / VP9 · Section 65B Forensics Ready</span>
        </div>

      </div>
    </div>
  );
}
