"""
SENTINEL.AI — Local Frame Relay (runs on your Mac)
Reads RTSP cameras → sends JPEG frames to Colab GPU for inference
Receives detections back → forwards to local FastAPI backend

Usage:
    python frame_relay.py --colab-url https://xxxx.trycloudflare.com
Or:
    COLAB_URL=https://xxxx.trycloudflare.com python frame_relay.py
"""

import os
import sys
import cv2
import time
import logging
import argparse
import threading
import requests
from pathlib import Path
from datetime import datetime, timezone

from dotenv import load_dotenv
load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s — %(message)s")
log = logging.getLogger("sentinel.relay")

COLAB_URL  = os.getenv("COLAB_URL", "").rstrip("/")
LOCAL_API  = os.getenv("LOCAL_API",  "http://localhost:8000")
FRAME_SKIP   = int(os.getenv("FRAME_SKIP",   "3"))
JPEG_QUALITY = int(os.getenv("JPEG_QUALITY", "75"))
MAX_INFER_FPS = float(os.getenv("MAX_INFER_FPS", "2.5"))

CAMERAS = [
    {"id": "cam01", "name": "Highway Cam 1"},
    {"id": "cam02", "name": "Toll Plaza Cam"},
    {"id": "cam03", "name": "City Intersection Cam"},
    {"id": "cam04", "name": "Surat Ring Road"},
    {"id": "cam05", "name": "Visat Teen Rasta"},
    {"id": "cam06", "name": "Madhuram Bypass ANPR"},
]

RTSP_USER = os.getenv("SENTINEL_RTSP_USER", "")
RTSP_PASS = os.getenv("SENTINEL_RTSP_PASS", "")
RTSP_HOST = os.getenv("SENTINEL_RTSP_HOST", "103.250.160.189")
RTSP_PORT = int(os.getenv("SENTINEL_RTSP_PORT", "8554"))

def build_rtsp_url(cam_id):
    if RTSP_USER and RTSP_PASS:
        creds = f"{RTSP_USER.replace('@', '%40')}:{RTSP_PASS}@"
    else:
        creds = ""
    return f"rtsp://{creds}{RTSP_HOST}:{RTSP_PORT}/stream/{cam_id}"

def _post_boxes(cam_id, data):
    numeric_id = int(cam_id.replace("cam", "")) if "cam" in cam_id else cam_id
    payload = {
        "camera_id": numeric_id, "cam_code": cam_id,
        "timestamp": data.get("timestamp", time.time() * 1000),
        "vehicles": data["vehicles"],
    }
    try:
        requests.post("http://localhost:8000/api/detections/boxes", json=payload, timeout=1)
    except Exception:
        pass
    if COLAB_URL and not COLAB_URL.startswith("http://localhost:8000"):
        try:
            requests.post(f"{COLAB_URL}/api/detections/boxes", json=payload, timeout=1.5)
        except Exception:
            pass

_last_posted_plates = {}

def should_post_plate(cam_id: str, plate: str, cooldown_sec: float = 6.0) -> bool:
    now = time.time()
    key = f"{cam_id}:{plate}"
    if key in _last_posted_plates and (now - _last_posted_plates[key]) < cooldown_sec:
        return False
    _last_posted_plates[key] = now
    return True

def _post_plate(cam_id, data):
    plate_conf = data.get("plate_conf")
    if plate_conf is None or float(plate_conf) <= 0.0:
        return
    numeric_id = int(str(cam_id).replace("cam", "")) if "cam" in str(cam_id) else cam_id
    payload = {
        "type": "VEHICLE_OBSERVED",
        "camera_id": numeric_id,
        "cam_code": cam_id,
        "source": "REAL_AI_GPU",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "pts_timestamp": data.get("timestamp", 0),
        "plate_number": data["plate"],
        "plate_confidence": round(float(plate_conf), 2),
        "vehicle_type": data.get("vehicle_type", "car"),
        "vehicle_confidence": round(float(data.get("vehicle_conf") or data.get("plate_conf", 0.0)), 2),
    }
    try:
        requests.post("http://localhost:8000/api/detections/worker", json=payload, timeout=1)
    except Exception:
        pass
    if COLAB_URL and not COLAB_URL.startswith("http://localhost:8000"):
        try:
            requests.post(f"{COLAB_URL}/api/detections/worker", json=payload, timeout=1.5)
        except Exception:
            pass

def relay_camera(cam):
    cam_id = cam["id"]
    rtsp = build_rtsp_url(cam_id)
    infer_url = f"{COLAB_URL}/api/infer"
    min_interval = 1.0 / MAX_INFER_FPS

    latest_frame = [None]
    is_running = [True]

    # Asynchronous worker thread: performs inference without blocking RTSP decoding
    def infer_worker():
        last_sent_t = 0.0
        while is_running[0]:
            now = time.time()
            frame = latest_frame[0]
            if frame is not None and (now - last_sent_t) >= min_interval:
                last_sent_t = now
                if COLAB_URL:
                    try:
                        _, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, JPEG_QUALITY])
                        resp = requests.post(
                            infer_url,
                            files={"frame": (f"{cam_id}.jpg", buf.tobytes(), "image/jpeg")},
                            data={"cam_id": cam_id},
                            timeout=6
                        )
                        if resp.status_code == 200:
                            result = resp.json()
                            if "vehicles" in result:
                                _post_boxes(cam_id, result)
                            if result.get("plate"):
                                plate = str(result["plate"]).strip().upper()
                                _post_plate(cam_id, result)
                                log.info(f"[{cam_id}] 🚗 100% REAL OPTICAL PLATE: {plate} ({result.get('plate_conf',0):.2f})")
                    except requests.exceptions.ConnectionError:
                        time.sleep(2)
                    except Exception:
                        pass
                else:
                    # 100% Local Inference Mode: Fast YOLOv8 (~80-120ms) + Async Low-Light OCR
                    try:
                        from backend.workers.local_infer import infer_frame_fast

                        def on_plate_found(cam, plate_data, vtype):
                            conf = plate_data.get("confidence")
                            if conf is None or float(conf) <= 0.0:
                                return
                            plate_num = str(plate_data["plate"]).strip().upper()
                            if should_post_plate(cam, plate_num, cooldown_sec=5.0):
                                _post_plate(cam, {
                                    "plate": plate_num,
                                    "plate_conf": round(float(conf), 2),
                                    "vehicle_type": vtype,
                                    "timestamp": time.time() * 1000
                                })
                                log.info(f"[{cam}] 🚗 100% REAL OPTICAL PLATE (LOCAL): {plate_num} ({conf:.2f})")

                        result = infer_frame_fast(frame, cam_id, on_plate_cb=on_plate_found)
                        n_veh = len(result.get("vehicles", []))
                        if n_veh:
                            log.info(f"[{cam_id}] 🔍 {n_veh} vehicle(s) detected")
                            _post_boxes(cam_id, result)
                        elif "vehicles" in result:
                            _post_boxes(cam_id, result)
                    except Exception as e:
                        log.warning(f"[{cam_id}] Local infer error: {e}")
            time.sleep(0.04)

    infer_thread = threading.Thread(target=infer_worker, daemon=True)
    infer_thread.start()

    last_disk_write = 0.0
    # Main RTSP video reader loop: NEVER BLOCKS, ensures continuous rock-solid 25 FPS streaming
    while True:
        log.info(f"[{cam_id}] Opening RTSP stream via PyAV...")
        try:
            import av
            container = av.open(rtsp, options={
                'rtsp_transport': 'tcp',
                'timeout': '6000000',
                'buffer_size': '2048000'
            })
            stream = container.streams.video[0]
            stream.thread_type = 'AUTO'
            log.info(f"[{cam_id}] ✅ Stream open. Real-time smooth non-blocking playback active...")

            Path("data/frames").mkdir(parents=True, exist_ok=True)

            for av_frame in container.decode(stream):
                frame = av_frame.to_ndarray(format='bgr24')
                latest_frame[0] = frame

                # Throttled snapshot update: at most once every 2.0s for forensic snapshot export
                now_t = time.time()
                if now_t - last_disk_write >= 2.0:
                    last_disk_write = now_t
                    try:
                        tmp_f = f"data/frames/{cam_id}.tmp.jpg"
                        dst_f = f"data/frames/{cam_id}.jpg"
                        cv2.imwrite(tmp_f, frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
                        os.replace(tmp_f, dst_f)
                    except Exception:
                        pass

        except Exception as e:
            log.error(f"[{cam_id}] RTSP connection issue: {e}. Reconnecting smoothly in 1s...")
            time.sleep(1)

def main():
    global COLAB_URL, LOCAL_API
    parser = argparse.ArgumentParser(description="SENTINEL.AI Frame Relay & Inference")
    parser.add_argument("--colab-url", default="", help="Optional Colab tunnel URL (e.g. https://xxx.trycloudflare.com)")
    parser.add_argument("--local", action="store_true", help="Force 100% local ONNX + RapidOCR inference")
    parser.add_argument("--local-api", default=LOCAL_API)
    args = parser.parse_args()
    if args.local:
        COLAB_URL = ""
    elif args.colab_url:
        COLAB_URL = args.colab_url.rstrip("/")
    if args.local_api:
        LOCAL_API = args.local_api.rstrip("/")

    mode_str = f"📡 Colab GPU ({COLAB_URL})" if COLAB_URL else "💻 100% LOCAL (ONNX YOLOv8 + RapidOCR)"
    log.info("=" * 65)
    log.info("🛡️  SENTINEL.AI — UNIFIED STREAM RELAY & AI INFERENCE")
    log.info(f"   ⚙️  Mode:       {mode_str}")
    log.info(f"   💻  Local API:  {LOCAL_API}")
    log.info(f"   🎥  Cameras:    {[c['id'] for c in CAMERAS]}")
    log.info(f"   ⚡  Max FPS/cam: {MAX_INFER_FPS}")
    log.info("=" * 65)

    if not COLAB_URL:
        try:
            from backend.workers.local_infer import get_local_yolo, get_local_anpr
            log.info("🚀 Pre-warming YOLOv8 & RapidOCR engines...")
            get_local_yolo()
            get_local_anpr()
            log.info("✅ AI Engines pre-warmed and ready.")
        except Exception as e:
            log.warning(f"Engine prewarm note: {e}")

    threads = []
    for cam in CAMERAS:
        t = threading.Thread(target=relay_camera, args=(cam,), daemon=True)
        t.start()
        threads.append(t)
        log.info(f"✅  Relay started: {cam['id']}")
        time.sleep(0.4)

    try:
        for t in threads:
            t.join()
    except KeyboardInterrupt:
        log.info("Stopped.")

if __name__ == "__main__":
    main()
