import React, { useEffect, useRef, useState, memo, useCallback } from 'react';
import { Play, Pause } from 'lucide-react';

function RealCamVideoComponent({ cameraId, fallbackImg, title, isPaused = false, onTogglePause = () => {} }) {
  const videoRef = useRef(null);
  const pcRef = useRef(null);
  const streamHealthyRef = useRef(false);
  const [streamHealthy, setStreamHealthy] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [useFallback, setUseFallback] = useState(false);

  const handleToggle = useCallback((e) => {
    if (e) e.stopPropagation();
    if (onTogglePause) {
      onTogglePause(cameraId);
    }
  }, [cameraId, onTogglePause]);

  // Handle Pause / Resume without tearing down WebRTC
  useEffect(() => {
    if (!videoRef.current) return;
    if (isPaused) {
      try {
        videoRef.current.pause();
      } catch (e) {}
    } else {
      try {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {});
        }
      } catch (e) {}
    }
  }, [isPaused]);

  useEffect(() => {
    let isMounted = true;
    let reconnectTimeout = null;
    let fallbackTimeout = null;

    async function startWebRTC() {
      if (pcRef.current) {
        try { pcRef.current.close(); } catch (e) {}
        pcRef.current = null;
      }

      if (!isMounted) return;
      setIsConnecting(true);
      setUseFallback(false);

      try {
        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ],
          bundlePolicy: 'max-bundle'
        });
        pcRef.current = pc;

        pc.addTransceiver('video', { direction: 'recvonly' });

        pc.ontrack = (event) => {
          if (!isMounted) return;
          if (videoRef.current && event.streams && event.streams[0]) {
            videoRef.current.srcObject = event.streams[0];
            videoRef.current.muted = true;
            if (!isPaused) {
              videoRef.current.play().catch(() => {});
            }
            streamHealthyRef.current = true;
            setStreamHealthy(true);
            setIsConnecting(false);
            if (fallbackTimeout) clearTimeout(fallbackTimeout);
          }
        };

        // Stable connection state: only reconnect on permanent 'failed', NEVER on transient 'disconnected'
        pc.onconnectionstatechange = () => {
          if (!isMounted) return;
          const state = pc.connectionState;
          if (state === 'connected') {
            streamHealthyRef.current = true;
            setStreamHealthy(true);
            setIsConnecting(false);
            if (fallbackTimeout) clearTimeout(fallbackTimeout);
          } else if (state === 'failed') {
            streamHealthyRef.current = false;
            setStreamHealthy(false);
            scheduleReconnect();
          }
        };

        pc.oniceconnectionstatechange = () => {
          if (!isMounted) return;
          if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
            streamHealthyRef.current = true;
            setStreamHealthy(true);
            setIsConnecting(false);
            if (fallbackTimeout) clearTimeout(fallbackTimeout);
          }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        await new Promise((resolve) => {
          if (pc.iceGatheringState === 'complete') {
            resolve();
          } else {
            const checkState = () => {
              if (pc.iceGatheringState === 'complete') {
                pc.removeEventListener('icegatheringstatechange', checkState);
                resolve();
              }
            };
            pc.addEventListener('icegatheringstatechange', checkState);
            setTimeout(resolve, 800);
          }
        });

        if (!isMounted) return;

        const res = await fetch(`/api/cams/${cameraId}/whep`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/sdp' },
          body: pc.localDescription ? pc.localDescription.sdp : offer.sdp
        });

        if (!res.ok) {
          throw new Error(`WHEP proxy returned ${res.status}`);
        }

        const answerSdp = await res.text();
        if (!isMounted || !pcRef.current) return;

        await pc.setRemoteDescription({
          type: 'answer',
          sdp: answerSdp
        });

      } catch (err) {
        console.warn(`[WebRTC CAM-${cameraId}] Setup error:`, err);
        if (isMounted) {
          scheduleReconnect();
        }
      }
    }

    function scheduleReconnect() {
      if (!isMounted) return;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      reconnectTimeout = setTimeout(() => {
        if (isMounted) {
          startWebRTC();
        }
      }, 4000);
    }

    fallbackTimeout = setTimeout(() => {
      if (isMounted && !streamHealthyRef.current) {
        setUseFallback(true);
      }
    }, 7000);

    startWebRTC();

    return () => {
      isMounted = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (fallbackTimeout) clearTimeout(fallbackTimeout);
      if (pcRef.current) {
        try { pcRef.current.close(); } catch (e) {}
        pcRef.current = null;
      }
    };
  }, [cameraId]);

  return (
    <div className="relative w-full h-full bg-[#080d18] overflow-hidden select-none flex items-center justify-center">
      {/* TV-Grade Hardware-Accelerated WebRTC Video Stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover pointer-events-none transition-opacity duration-300 ${
          streamHealthy && !useFallback ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Fallback snapshot stream if WebRTC is waiting on ICE */}
      {useFallback && (
        <img
          src={`/api/cams/${cameraId}/snapshot?t=${Date.now()}`}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          alt={title}
          onError={() => setUseFallback(false)}
        />
      )}

      {/* Interactive Stream Paused Overlay Badge */}
      {isPaused && (
        <div
          onClick={handleToggle}
          className="absolute inset-0 z-20 bg-amber-950/15 hover:bg-amber-950/25 backdrop-brightness-95 border-2 border-amber-400/80 flex flex-col items-center justify-center cursor-pointer transition-all group pointer-events-auto"
          title="Feed is paused. Click to resume live stream."
        >
          {/* Centered Amber Badge & Resume Button */}
          <div className="bg-slate-950/90 backdrop-blur-md border border-amber-400/90 shadow-[0_0_24px_rgba(245,158,11,0.35)] rounded-2xl px-4 py-2.5 flex items-center gap-3 transform group-hover:scale-105 transition-all">
            <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md group-hover:bg-amber-300 transition-colors">
              <Play className="w-4 h-4 fill-slate-950 ml-0.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-amber-400 font-mono font-black text-xs tracking-wider uppercase">PAUSED</span>
                <span className="text-[9px] font-mono text-amber-200/80 border-l border-amber-400/30 pl-1.5 uppercase">FEED FROZEN</span>
              </div>
              <p className="text-[10px] text-slate-300 font-sans mt-0.5 font-medium">Click feed or press RESUME</p>
            </div>
          </div>
        </div>
      )}

      {/* Initializing Radar Indicator */}
      {isConnecting && !streamHealthy && !useFallback && !isPaused && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#080d18] text-slate-400 font-mono text-xs z-0">
          <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin mb-2" />
          <span className="text-[10px] tracking-wider uppercase text-emerald-400 font-bold">
            Connecting High-Speed WebRTC…
          </span>
          <span className="text-[9px] text-slate-500 mt-1">{title || `CAM-${cameraId}`}</span>
        </div>
      )}

      {/* Stream Status & FPS HUD */}
      <div className="absolute bottom-2 right-2 flex items-center gap-1.5 z-20 pointer-events-none select-none">
        <span className="px-1.5 py-0.5 rounded bg-black/70 backdrop-blur text-slate-300 font-mono text-[9px] border border-white/10">
          {isPaused ? 'FEED FROZEN' : streamHealthy ? '30 FPS · WEBRTC' : 'CONNECTING'}
        </span>
        <span
          className={`px-2 py-0.5 rounded font-mono font-bold text-[9px] flex items-center gap-1.5 shadow-sm border ${
            isPaused
              ? 'bg-amber-500 border-amber-400 text-slate-950 font-black'
              : streamHealthy
              ? 'bg-emerald-600/90 border-emerald-400/40 text-white'
              : 'bg-slate-700/90 border-slate-600 text-slate-300'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isPaused ? 'bg-slate-950 animate-pulse' : 'bg-white animate-pulse'}`} />
          {isPaused ? 'PAUSED' : streamHealthy ? 'LIVE TV' : 'BUFFERING'}
        </span>
      </div>
    </div>
  );
}

export default memo(RealCamVideoComponent);
