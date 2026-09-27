import os
import time
import signal
import subprocess
import logging
from pathlib import Path
from typing import Dict, Any, Optional

log = logging.getLogger("sentinel.screen_recorder")

RECORDINGS_DIR = Path("data/recordings")
RECORDINGS_DIR.mkdir(parents=True, exist_ok=True)

class ScreenRecorder:
    """
    Operating System Screen & Hackathon Presentation Recorder
    Captures native desktop screen display (AVFoundation on macOS)
    with high-quality H.264 MP4 export for hackathon submission.
    """
    def __init__(self):
        self.process: Optional[subprocess.Popen] = None
        self.current_filename: Optional[str] = None
        self.current_filepath: Optional[Path] = None
        self.start_time: Optional[float] = None
        self.with_audio: bool = False
        self.status: str = "IDLE"  # "IDLE", "RECORDING", "SAVED", "ERROR"
        self.last_error: Optional[str] = None

    def get_status(self) -> Dict[str, Any]:
        elapsed = 0.0
        file_size = 0
        if self.status == "RECORDING" and self.start_time:
            elapsed = time.time() - self.start_time
            if self.process and self.process.poll() is not None:
                rc = self.process.poll()
                if rc != 0 and rc != 255:
                    self.status = "ERROR"
                    self.last_error = f"Recording process exited with code {rc}"
                else:
                    self.status = "SAVED"

        if self.current_filepath and self.current_filepath.exists():
            file_size = self.current_filepath.stat().st_size

        return {
            "status": self.status,
            "filename": self.current_filename,
            "filepath": str(self.current_filepath) if self.current_filepath else None,
            "duration_sec": round(elapsed, 1),
            "file_size_bytes": file_size,
            "file_size_mb": round(file_size / (1024 * 1024), 2),
            "with_audio": self.with_audio,
            "error": self.last_error,
            "download_url": f"/api/recorder/download/{self.current_filename}" if self.current_filename and self.status == "SAVED" else None
        }

    def start_recording(self, with_audio: bool = False, capture_device: str = "1") -> Dict[str, Any]:
        """
        Starts native OS screen recording via ffmpeg avfoundation (Display Capture Screen 0).
        """
        if self.status == "RECORDING":
            return {"success": False, "message": "A recording session is already active.", "status": self.get_status()}

        timestamp = time.strftime("%Y%m%d_%H%M%S")
        self.current_filename = f"sentinel_hackathon_demo_{timestamp}.mp4"
        self.current_filepath = RECORDINGS_DIR / self.current_filename
        self.with_audio = with_audio
        self.last_error = None

        input_device = f"{capture_device}:0" if with_audio else f"{capture_device}:none"
        
        cmd = [
            "ffmpeg",
            "-y",
            "-f", "avfoundation",
            "-capture_cursor", "1",
            "-capture_mouse_clicks", "1",
            "-framerate", "30",
            "-i", input_device,
            "-c:v", "libx264",
            "-preset", "veryfast",
            "-pix_fmt", "yuv420p",
            "-crf", "22",
        ]
        if with_audio:
            cmd.extend(["-c:a", "aac", "-b:a", "128k"])

        cmd.append(str(self.current_filepath))

        log.info(f"Starting screen recording: {' '.join(cmd)}")
        try:
            self.process = subprocess.Popen(
                cmd,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                preexec_fn=os.setsid
            )
            self.start_time = time.time()
            self.status = "RECORDING"
            return {"success": True, "message": "Screen recording initiated successfully.", "status": self.get_status()}
        except Exception as e:
            self.status = "ERROR"
            self.last_error = str(e)
            log.error(f"Failed to launch ffmpeg recording: {e}")
            return {"success": False, "message": f"Failed to start screen recording: {e}", "status": self.get_status()}

    def stop_recording(self) -> Dict[str, Any]:
        """
        Gracefully terminates the ffmpeg process by sending 'q' to stdin or SIGINT to flush MP4 headers.
        """
        if self.status != "RECORDING" or not self.process:
            return {"success": False, "message": "No active recording to stop.", "status": self.get_status()}

        log.info("Stopping screen recording...")
        try:
            if self.process.stdin:
                try:
                    self.process.stdin.write(b"q\n")
                    self.process.stdin.flush()
                except Exception:
                    pass

            try:
                self.process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                os.killpg(os.getpgid(self.process.pid), signal.SIGINT)
                self.process.wait(timeout=5)

            self.status = "SAVED"
        except Exception as e:
            try:
                os.killpg(os.getpgid(self.process.pid), signal.SIGKILL)
            except Exception:
                pass
            self.status = "SAVED" if (self.current_filepath and self.current_filepath.exists() and self.current_filepath.stat().st_size > 50000) else "ERROR"
            self.last_error = str(e)

        return {"success": True, "message": "Recording stopped and saved.", "status": self.get_status()}

    def list_recordings(self) -> list:
        recordings = []
        for p in RECORDINGS_DIR.glob("*.mp4"):
            try:
                stat = p.stat()
                recordings.append({
                    "filename": p.name,
                    "filepath": str(p),
                    "size_bytes": stat.st_size,
                    "size_mb": round(stat.st_size / (1024 * 1024), 2),
                    "created_at": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(stat.st_ctime)),
                    "download_url": f"/api/recorder/download/{p.name}"
                })
            except Exception:
                pass
        recordings.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return recordings

recorder_instance = ScreenRecorder()
