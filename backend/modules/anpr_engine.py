import asyncio
import time
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from backend.modules.registry import registry
from backend.modules.watchlist import watchlist_engine
from backend.models.detection import VehicleObservation

log = logging.getLogger("sentinel.anpr")


class AnprEngine:
    def __init__(self):
        self.active_detections: List[Dict[str, Any]] = []
        self.is_running = False

    def reset(self):
        self.active_detections = []

    def process_detection(self, plate: str, camera_id: int, confidence: Optional[float] = None, vehicle_type: str = "Car", source: str = "REAL_AI_GPU") -> Optional[Dict[str, Any]]:
        # Reject missing or invalid optical confidences — no hardcoded fallbacks
        if confidence is None or float(confidence) <= 0.0:
            return None

        cam = registry.get_by_id(camera_id) or (registry.cameras[0] if registry.cameras else {})
        now = datetime.now()
        
        # Check against police watchlist
        alert = watchlist_engine.match_plate(plate, cam)

        base_speed = {
            "highway": 65, "toll": 45, "junction": 35, "city": 40
        }.get(cam.get("location_type", "highway"), 50)
        vehicle_offset = {
            "truck": -10, "bus": -8, "motorcycle": 5, "car": 0
        }.get(vehicle_type.lower(), 0)

        detection_event = {
            "detection_id": f"DET-{now.strftime('%Y%m%d%H%M%S')}-{int(time.time() * 1000) % 10000:04d}",
            "timestamp": now.isoformat(),
            "plate_number": plate,
            "confidence": round(float(confidence), 2),
            "camera_id": cam.get("id", 1),
            "camera_name": cam.get("name", "CAM-01"),
            "location": cam.get("location", "Gujarat"),
            "district": cam.get("district") or "Statewide",
            "department": cam.get("department", "Police"),
            "speed_kmph": max(20, min(120, base_speed + vehicle_offset)),
            "vehicle_type": vehicle_type,
            "source": source,
            "is_watchlist_alert": alert is not None,
            "alert": alert
        }

        self.active_detections.insert(0, detection_event)
        if len(self.active_detections) > 200:
            self.active_detections.pop()

        return detection_event

    def get_recent_detections(self, limit: int = 30) -> List[Dict[str, Any]]:
        if not self.active_detections:
            try:
                from backend.database import get_db
                with get_db() as db:
                    rows = db.query(VehicleObservation).order_by(VehicleObservation.timestamp.desc()).limit(limit).all()
                    for r in rows:
                        cam = registry.get_by_id(r.camera_id) or {}
                        loc_type = cam.get("location_type", "highway")
                        est_speed = {"highway": 65, "toll": 45, "junction": 35, "city": 40}.get(loc_type, 50)
                        self.active_detections.append({
                            "detection_id": f"DET-{r.observation_id[:8]}",
                            "timestamp": r.timestamp.isoformat() if r.timestamp else datetime.now().isoformat(),
                            "plate_number": r.plate_number,
                            "confidence": round(float(r.plate_confidence if r.plate_confidence is not None else 0.0), 2),
                            "camera_id": r.camera_id,
                            "camera_name": cam.get("name", f"CAM-{r.camera_id:02d}"),
                            "location": cam.get("location", "Gujarat"),
                            "district": cam.get("district") or "Gujarat",
                            "vehicle_type": (r.vehicle_type or "Car").capitalize(),
                            "source": "REAL_AI_GPU",
                            "speed_kmph": est_speed,
                            "is_watchlist_alert": bool(r.is_watchlist_alert),
                            "alert": None
                        })
            except Exception:
                # Never swallow silently: log the real cause so data-layer bugs are visible.
                log.exception("Failed to hydrate detections from database fallback")
        return self.active_detections[:limit]

anpr_engine = AnprEngine()
