import subprocess
import uuid
import os
from pathlib import Path
from typing import Dict, Any, Optional
from backend.config import FFMPEG_PATH, HLS_SEGMENT_DURATION, HLS_PLAYLIST_SIZE

HLS_ROOT = Path(__file__).resolve().parent.parent / "data" / "hls"
HLS_ROOT.mkdir(parents=True, exist_ok=True)

_active: Dict[int, Dict[str, Any]] = {}


def start_hls_relay(camera_id: int, rtsp_url: str) -> Dict[str, Any]:
    if not rtsp_url:
        return {"success": False, "message": "No RTSP URL for camera"}
    if camera_id in _active and _active[camera_id].get("process"):
        proc = _active[camera_id]["process"]
        if proc.poll() is None:
            return {"success": True, "hls_url": _active[camera_id]["hls_url"], "cached": True}
    out_dir = HLS_ROOT / f"cam{camera_id}"
    out_dir.mkdir(parents=True, exist_ok=True)
    playlist = out_dir / "index.m3u8"
    session = uuid.uuid4().hex[:8]
    cmd = [
        FFMPEG_PATH, "-y", "-rtsp_transport", "tcp",
        "-i", rtsp_url,
        "-c:v", "libx264", "-preset", "veryfast", "-tune", "zerolatency",
        "-c:a", "aac",
        "-f", "hls",
        "-hls_time", str(HLS_SEGMENT_DURATION),
        "-hls_list_size", str(HLS_PLAYLIST_SIZE),
        "-hls_flags", "delete_segments",
        str(playlist),
    ]
    try:
        proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except FileNotFoundError:
        return {"success": False, "message": "ffmpeg binary not found"}
    hls_url = f"/hls/cam{camera_id}/index.m3u8?session={session}"
    _active[camera_id] = {"process": proc, "hls_url": hls_url, "session": session}
    return {"success": True, "hls_url": hls_url, "session": session}


def stop_hls_relay(camera_id: int) -> Dict[str, Any]:
    entry = _active.pop(camera_id, None)
    if not entry:
        return {"success": True, "message": "No active relay"}
    try:
        entry["process"].terminate()
    except Exception:
        pass
    return {"success": True}


def relay_status(camera_id: int) -> Dict[str, Any]:
    entry = _active.get(camera_id)
    if not entry:
        return {"active": False}
    alive = entry["process"].poll() is None
    return {"active": alive, "hls_url": entry.get("hls_url")}
