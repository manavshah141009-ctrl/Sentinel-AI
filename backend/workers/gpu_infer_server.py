"""
SENTINEL.AI — Colab GPU Inference Server
Receives JPEG frames from the Mac frame relay → runs YOLO + OCR → returns detections JSON.
Runs as a sub-application mounted under /api/infer on the main FastAPI app in Colab.
"""

import re
import time
import threading
import logging
import numpy as np
import cv2

from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import JSONResponse

log = logging.getLogger("sentinel.gpu_infer")

# ---------------------------------------------------------------------------
# Lazy-load models (only once, thread-safe)
# ---------------------------------------------------------------------------
_yolo        = None
_ocr_reader  = None
_model_lock  = threading.Lock()
_ocr_lock    = threading.Lock()

def _get_yolo():
    global _yolo
    if _yolo is None:
        with _model_lock:
            if _yolo is None:
                try:
                    import torch
                    from ultralytics import YOLO
                    device = "cuda" if torch.cuda.is_available() else "cpu"
                    log.info(f"Loading YOLOv8n on {device.upper()}...")
                    _yolo = YOLO("yolov8n.pt")
                    _yolo.to(device)
                    log.info(f"✅ YOLO loaded on {device.upper()}")
                except Exception:
                    try:
                        from backend.workers.local_infer import get_local_yolo
                        _yolo = get_local_yolo()
                    except Exception as err:
                        log.debug(f"Local YOLO fallback error: {err}")
    return _yolo

def _get_ocr():
    global _ocr_reader
    if _ocr_reader is None:
        with _ocr_lock:
            if _ocr_reader is None:
                try:
                    import easyocr
                    import torch
                    use_gpu = torch.cuda.is_available()
                    log.info(f"Loading EasyOCR (gpu={use_gpu})...")
                    _ocr_reader = easyocr.Reader(["en"], gpu=use_gpu, verbose=False)
                    log.info("✅ EasyOCR loaded")
                except Exception:
                    try:
                        from backend.workers.local_infer import get_local_anpr
                        _ocr_reader = get_local_anpr()
                    except Exception as err:
                        log.debug(f"Local ANPR fallback error: {err}")
    return _ocr_reader

# Pre-warm in background thread so first request isn't slow
def _prewarm():
    _get_yolo()
    _get_ocr()

threading.Thread(target=_prewarm, daemon=True).start()

# ---------------------------------------------------------------------------
# Plate validation — same logic as inference_worker.py
# ---------------------------------------------------------------------------
# ---------------------------------------------------------------------------
# Plate validation — Indian Motor Vehicles Act Standards (Zero Mock Data)
# ---------------------------------------------------------------------------
BAD_TOKENS = [
    "CSITMS","PTZ","BRIDGE","CHIMAN","JANPATH","SPEED","CAM","CSIT",
    "ITMS","LIMIT","LANE","CSITM","POLICE","POUCE","GUJARAT","GUJ",
    "RAPIDO","BARRICADE","TRAFFIC","CORP","GOV","ROAD","FLYOVER",
    "HOSPITAL","STATION","JUNCTION","CHECKPOST","TOLL","HIGHWAY"
]
STATES = (
    "AN", "AP", "AR", "AS", "BR", "CG", "CH", "DD", "DL", "DN", "GA", "GJ",
    "HP", "HR", "JH", "JK", "KA", "KL", "LA", "LD", "MH", "ML", "MN", "MP",
    "MZ", "NL", "OD", "PB", "PY", "RJ", "SK", "TN", "TR", "TS", "UK", "UP", "WB"
)

INDIAN_PLATE_RE = re.compile(r"^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{1,4}$")
BHARAT_SERIES_RE = re.compile(r"^[0-9]{2}BH[0-9]{4}[A-Z]{1,2}$")

STATE_REGEX = "|".join(STATES)
INDIAN_PLATE_PATTERN = re.compile(rf"(?:IND)?[^A-Z0-9]*({STATE_REGEX})[^A-Z0-9]*([0-9]{{1,2}})[^A-Z0-9]*([A-Z]{{1,3}})[^A-Z0-9]*([0-9]{{1,4}})")
BHARAT_SERIES_PATTERN = re.compile(r"([0-9]{2})[^A-Z0-9]*(BH)[^A-Z0-9]*([0-9]{4})[^A-Z0-9]*([A-Z]{1,2})")

from backend.ai.anpr.plate_finder import (
    correct_indian_plate_syntax,
    enhance_crop_multi_condition,
    is_osd_false_positive
)
from backend.modules.tracker_engine import MultiObjectTracker

_camera_trackers = {}

def extract_genuine_plate(s: str):
    return correct_indian_plate_syntax(s)

def _is_genuine_plate(s: str) -> bool:
    return correct_indian_plate_syntax(s) is not None

def preprocess_plate_for_ocr(crop_bgr: np.ndarray):
    return enhance_crop_multi_condition(crop_bgr)


# ---------------------------------------------------------------------------
# Inference endpoint — mounted at /api/infer by main.py
# ---------------------------------------------------------------------------
infer_router = APIRouter()

@infer_router.post("")
@infer_router.post("/")
async def infer(
    frame: UploadFile = File(...),
    cam_id: str       = Form("unknown"),
):
    """
    Accepts a JPEG frame upload, runs YOLO + OCR, returns JSON:
    {
        "cam_id": "cam01",
        "timestamp": <float ms>,
        "vehicles": [...],  # YOLO boxes, normalised 0-1
        "plate": "GJ18AZ1234" | null,
        "plate_conf": 0.92,
        "vehicle_type": "car",
        "vehicle_conf": 0.88
    }
    """
    ts = time.time() * 1000
    raw = await frame.read()
    nparr = np.frombuffer(raw, np.uint8)
    img   = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        return JSONResponse({"error": "invalid image"}, status_code=400)

    h, w = img.shape[:2]
    yolo = _get_yolo()
    vehicle_boxes = []

    if yolo:
        try:
            results = yolo.predict(img, imgsz=480, conf=0.15, verbose=False)
            for r in results:
                for b in r.boxes:
                    cls_id = int(b.cls.max())
                    if cls_id not in [1, 2, 3, 5, 7]:
                        continue
                    conf  = float(b.conf.max())
                    xyxy  = b.xyxy.tolist()[0]
                    label = yolo.names[cls_id].upper()
                    track_id = len(vehicle_boxes) + 1
                    vehicle_boxes.append({
                        "id": f"{cam_id}_trk_{track_id}",
                        "box": [
                            round(xyxy[0] / w, 4), round(xyxy[1] / h, 4),
                            round(xyxy[2] / w, 4), round(xyxy[3] / h, 4),
                        ],
                        "label": label,
                        "confidence": round(conf, 2),
                        "plate": None,
                        "_raw": list(map(int, xyxy)),
                    })
        except Exception as e:
            log.error(f"[{cam_id}] YOLO error: {e}")

    # Smart ANPR extraction & genuine optical plate attachment (100% real EasyOCR reads only)
    best_plate   = None
    best_conf    = 0.0
    best_vtype   = "car"
    best_vconf   = 0.0

    ocr = _get_ocr()

    for idx, v in enumerate(vehicle_boxes):
        x1, y1, x2, y2 = v["_raw"]
        safe_y1 = max(y1 + int((y2 - y1) * 0.30), int(h * 0.05))
        safe_y2 = min(y2, int(h * 0.95))
        
        plate_found = None
        plate_conf = 0.0

        # Attempt high-contrast optical OCR crop if vehicle is reasonably sized
        if (x2 - x1) > 35 and (safe_y2 - safe_y1) > 15 and ocr is not None:
            try:
                crop = img[safe_y1:safe_y2, x1:x2]
                candidates = preprocess_plate_for_ocr(crop)
                for cand in candidates:
                    ocr_res = ocr.readtext(cand)
                    for _, text, c in ocr_res:
                        norm = re.sub(r"[^A-Za-z0-9]", "", text).upper()
                        if _is_genuine_plate(norm) and float(c) > 0.20:
                            plate_found = norm
                            plate_conf = round(float(c), 3)
                            break
                    if plate_found:
                        break
            except Exception as e:
                log.debug(f"OCR candidate exception: {e}")

        # 100% REAL READS ONLY: If optical character recognition didn't detect genuine text, plate is None
        v["plate"] = plate_found

        if plate_found and (not best_plate or plate_conf > best_conf):
            best_plate = plate_found
            best_conf = plate_conf
            best_vtype = v["label"].lower()
            best_vconf = v["confidence"]

    # Strip internal _raw field before returning
    for v in vehicle_boxes:
        v.pop("_raw", None)

    # -----------------------------------------------------------------------
    # Multi-Object Tracking (MOT) & Multi-Frame Bayesian OCR Consensus
    # -----------------------------------------------------------------------
    cam_mot = _camera_trackers.setdefault(str(cam_id), MultiObjectTracker(max_age=15, min_hits=2))
    tracked_inputs = []
    for v in vehicle_boxes:
        tracked_inputs.append({
            "box": v["box"],
            "plate": v.get("plate"),
            "plate_conf": best_conf if v.get("plate") == best_plate else None,
            "label": v.get("label", "VEHICLE")
        })
    active_tracks = cam_mot.update(tracked_inputs, pts_ms=ts)

    # If Bayesian consensus locked on a track, prioritize consensus plate
    for trk in active_tracks:
        if trk.get("consensus_plate"):
            best_plate = trk["consensus_plate"]
            best_conf = trk.get("consensus_confidence", best_conf)
            break

    # Reject high-altitude PTZ cameras (Cams 01, 02, 04, 05) where resolution is insufficient for ANPR
    try:
        numeric_id = int(str(cam_id).lower().replace("cam", ""))
    except Exception:
        numeric_id = 0

    if numeric_id in {1, 2, 4, 5}:
        best_plate = None
        best_conf = None

    # 1. Save frame on Colab for MJPEG fallback stream
    try:
        from pathlib import Path
        Path("data/frames").mkdir(parents=True, exist_ok=True)
        with open(f"data/frames/{cam_id}.jpg", "wb") as f:
            f.write(raw)
    except Exception:
        pass

    # 2. Directly broadcast to connected frontend WebSockets
    try:
        import asyncio
        from backend.main import ws_manager, anpr_engine
        if vehicle_boxes:
            asyncio.create_task(ws_manager.broadcast({
                "type": "CAMERA_BOXES",
                "data": {
                    "camera_id": numeric_id,
                    "cam_code": cam_id,
                    "timestamp": ts,
                    "vehicles": vehicle_boxes,
                    "tracks": active_tracks
                }
            }))
        if best_plate and best_conf:
            det = anpr_engine.process_detection(best_plate, numeric_id, confidence=best_conf)
            if det:
                asyncio.create_task(ws_manager.broadcast({
                    "type": "ANPR_DETECTION",
                    "data": det
                }))
                if det.get("is_watchlist_alert") and det.get("alert"):
                    asyncio.create_task(ws_manager.broadcast({
                        "type": "POLICE_ALERT",
                        "data": det["alert"]
                    }))
    except Exception as e:
        log.debug(f"Direct broadcast error: {e}")

    return {
        "cam_id":       cam_id,
        "timestamp":    ts,
        "vehicles":     vehicle_boxes,
        "tracks":       active_tracks,
        "plate":        best_plate,
        "plate_conf":   best_conf,
        "vehicle_type": best_vtype,
        "vehicle_conf": best_vconf,
    }
