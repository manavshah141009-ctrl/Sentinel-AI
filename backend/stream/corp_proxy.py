import re
import time
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Dict, Any, Optional, Tuple

import requests

from backend.config import CORP_HLS_BASE, CORP_UA, COOKIES_FILE

# ──────────────────────────────────────────────────────────────
# One shared session per process – keeps the TCP connection and
# the sentinel cookie alive without re-authenticating on every
# request.  Reload cookies each startup (file written by curl).
# ──────────────────────────────────────────────────────────────
SESSION = requests.Session()
SESSION.headers.update({
    "User-Agent": CORP_UA,
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    "Origin": CORP_HLS_BASE,
    "Referer": CORP_HLS_BASE + "/",
    "Sec-Fetch-Dest": "video",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
})

_cookies_loaded = False


def _load_cookies():
    global _cookies_loaded
    if _cookies_loaded:
        return
    # 1. Try Netscape cookie-jar file (written by curl --cookie-jar)
    try:
        import http.cookiejar as cookiejar
        jar = cookiejar.MozillaCookieJar(str(COOKIES_FILE))
        jar.load(ignore_discard=True, ignore_expires=True)
        SESSION.cookies.update(jar)
        _cookies_loaded = True
        return
    except Exception:
        pass

    # 2. Fallback: parse the raw text ourselves
    try:
        raw = Path(COOKIES_FILE).read_text()
        for line in raw.splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            parts = line.split("\t")
            if len(parts) >= 7:
                SESSION.cookies.set(parts[5], parts[6], domain=parts[0].lstrip("#HttpOnly_"))
        _cookies_loaded = True
    except Exception:
        pass


def _cam_tag(camera_id: int) -> str:
    return f"cam{int(camera_id):02d}"


def _get(url: str, stream: bool = False, timeout: int = 20) -> Optional[requests.Response]:
    """GET with automatic cookie refresh on 401/403 + retry."""
    _load_cookies()
    for attempt in range(3):
        try:
            r = SESSION.get(url, timeout=timeout, stream=stream)
            if r.status_code in (200, 206):
                return r
            if r.status_code in (401, 403) and attempt == 0:
                # Session may have expired; try reloading cookies once
                global _cookies_loaded
                _cookies_loaded = False
                _load_cookies()
                continue
            # For 5xx or cooldown (non-auth), backoff
            time.sleep(1 + attempt * 2)
        except requests.RequestException:
            time.sleep(2 + attempt * 3)
    return None


def fetch_playlist(camera_id: int) -> Tuple[Optional[str], str]:
    """Fetch and rewrite an HLS playlist from the Corp grid."""
    tag = _cam_tag(camera_id)
    url = f"{CORP_HLS_BASE}/{tag}/index.m3u8"
    r = _get(url)
    if r is None:
        return None, f"upstream unreachable for {tag}"
    text = r.text
    if "#EXTM3U" not in text:
        return None, f"upstream returned non-playlist for {tag}: {text[:120]}"

    # Rewrite segment URIs to go through our proxy
    # enc.key lives at gateway root
    text = text.replace('URI="/enc.key"', f'URI="/api/cams/{tag}/enc.key"')
    # Relative segment names like  seg00001.ts  →  /api/cams/cam01/seg00001.ts
    text = re.sub(r"^(seg[^\r\n]*\.ts)", f"/api/cams/{tag}/\\1", text, flags=re.M)
    # Also rewrite if the playlist uses full paths already (some encoders do)
    text = re.sub(r"^/([^\r\n]*\.ts)", f"/api/cams/{tag}/\\1", text, flags=re.M)
    return text, "ok"


def fetch_bytes(path: str) -> Tuple[Optional[bytes], str, str]:
    """Download a raw HLS asset (segment or key) from the Corp grid."""
    _load_cookies()
    # AES key lives at the gateway root
    upstream = "enc.key" if path.endswith("enc.key") else path
    url = f"{CORP_HLS_BASE}/{upstream}"
    r = _get(url, timeout=30)
    if r is None:
        return None, "", f"upstream unreachable: {url}"
    ctype = "application/octet-stream"
    if path.endswith(".m3u8"):
        ctype = "application/vnd.apple.mpegurl"
    elif path.endswith(".ts"):
        ctype = "video/mp2t"
    return r.content, ctype, "ok"


# ──────────────────────────────────────────────────────────────
# Frame grabbing + ANPR pipeline
# ──────────────────────────────────────────────────────────────

def ffmpeg_exe() -> str:
    from backend.config import FFMPEG_PATH
    if shutil.which(FFMPEG_PATH):
        return FFMPEG_PATH
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return FFMPEG_PATH


def _decrypt_segment(seg_bytes: bytes, key_bytes: bytes) -> Optional[bytes]:
    """AES-128-CBC decrypt an HLS segment."""
    with tempfile.TemporaryDirectory() as td:
        enc = Path(td) / "seg.ts"
        dec = Path(td) / "dec.ts"
        enc.write_bytes(seg_bytes)
        cmd = [
            "openssl", "enc", "-d", "-aes-128-cbc",
            "-K", key_bytes.hex(), "-iv", "0",
            "-in", str(enc), "-out", str(dec),
        ]
        try:
            subprocess.run(cmd, check=True, capture_output=True, timeout=30)
            return dec.read_bytes()
        except Exception:
            # Segment may not be encrypted — return raw
            return seg_bytes


def grab_frame(camera_id: int, seg_index: int = 0) -> Tuple[Optional[bytes], str]:
    """Fetch one TS segment, decrypt if needed, extract one JPEG frame via ffmpeg."""
    tag = _cam_tag(camera_id)

    # 1. Try to get AES key (optional — segment may be cleartext)
    key_r = _get(f"{CORP_HLS_BASE}/enc.key", timeout=10)
    key_bytes = key_r.content if key_r else b""

    # 2. Fetch segment
    seg_url = f"{CORP_HLS_BASE}/{tag}/seg{seg_index:05d}.ts"
    seg_r = _get(seg_url, timeout=30)
    if seg_r is None:
        # Try without zero-padding (some cameras use seg1.ts)
        seg_r = _get(f"{CORP_HLS_BASE}/{tag}/cam{tag[3:]}_00{seg_index}.ts", timeout=20)
    if seg_r is None:
        return None, f"segment {seg_index} unavailable for {tag}"

    raw = seg_r.content

    # 3. Decrypt
    ts_bytes = _decrypt_segment(raw, key_bytes) if key_bytes else raw

    # 4. Extract frame via ffmpeg
    with tempfile.TemporaryDirectory() as td:
        ts_file = Path(td) / "seg.ts"
        jpg_file = Path(td) / "frame.jpg"
        ts_file.write_bytes(ts_bytes)
        cmd = [
            ffmpeg_exe(), "-y", "-v", "error",
            "-i", str(ts_file),
            "-vframes", "1",
            "-q:v", "2",        # JPEG quality
            str(jpg_file),
        ]
        try:
            subprocess.run(cmd, check=True, capture_output=True, timeout=60)
        except Exception as e:
            return None, f"frame extract failed for {tag}: {e}"
        if not jpg_file.exists():
            return None, f"no frame output for {tag}"
        return jpg_file.read_bytes(), "ok"


PLATE_RE = re.compile(r"\b([A-Z]{2}\s*\d{1,2}\s*[A-Z]{1,3}\s*\d{1,4})\b")


def analyze_frame(camera_id: int) -> Dict[str, Any]:
    """Grab a frame from the real Corp feed and run OCR plate detection."""
    import datetime as _dt
    tag = _cam_tag(camera_id)
    jpg, msg = grab_frame(camera_id)
    result = {
        "camera_id": camera_id,
        "cam_tag": tag,
        "analyzed_at": _dt.datetime.utcnow().isoformat() + "Z",
        "frame_captured": jpg is not None,
    }
    if jpg is None:
        return {**result, "success": False, "message": msg}

    # Try EasyOCR first, then RapidOCR, then regex-only
    plates = []
    lines = []
    ocr_engine_used = "none"

    try:
        import easyocr
        reader = easyocr.Reader(["en"], gpu=False, verbose=False)
        ocr_result = reader.readtext(jpg)
        ocr_engine_used = "easyocr"
        for (_, text, conf) in ocr_result:
            norm = re.sub(r"[^A-Za-z0-9 ]", "", text).upper().strip()
            entry = {"text": norm, "confidence": round(float(conf), 3)}
            lines.append(entry)
            m = PLATE_RE.search(norm)
            if m:
                plates.append({**entry, "plate": re.sub(r"\s+", "", m.group(1))})
    except ImportError:
        pass

    if not lines:
        try:
            from rapidocr_onnxruntime import RapidOCR
            engine = RapidOCR()
            ocr_result, _ = engine(jpg)
            ocr_engine_used = "rapidocr"
            for (_, text, conf) in (ocr_result or []):
                norm = re.sub(r"[^A-Za-z0-9 ]", "", text).upper().strip()
                entry = {"text": norm, "confidence": round(float(conf), 3)}
                lines.append(entry)
                m = PLATE_RE.search(norm)
                if m:
                    plates.append({**entry, "plate": re.sub(r"\s+", "", m.group(1))})
        except ImportError:
            pass

    return {
        **result,
        "success": True,
        "ocr_engine": ocr_engine_used,
        "lines": lines,
        "plate_candidates": plates,
        "frame_size_bytes": len(jpg),
    }


def probe_rtsp(rtsp_url: str, timeout_s: int = 12) -> Dict[str, Any]:
    """Verify RTSP reachability using ffprobe over TCP."""
    cmd = [
        ffmpeg_exe(), "-v", "error",
        "-rtsp_transport", "tcp",
        "-analyzeduration", "2000000",
        "-i", rtsp_url,
        "-t", "1", "-f", "null", "-",
    ]
    try:
        p = subprocess.run(cmd, capture_output=True, timeout=timeout_s + 5, text=True)
        if p.returncode == 0:
            return {"reachable": True, "message": "RTSP handshake + 1 s decode OK"}
        return {"reachable": False, "message": (p.stderr or "ffmpeg error").strip()[:300]}
    except subprocess.TimeoutExpired:
        return {"reachable": False, "message": "RTSP timed out"}
    except Exception as e:
        return {"reachable": False, "message": str(e)[:300]}
