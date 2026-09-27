import json
import re
from datetime import datetime
from typing import List, Dict, Any, Optional
from backend.config import WATCHLIST_FILE

def normalize_plate(plate: str) -> str:
    if not plate:
        return ""
    return re.sub(r"[^A-Za-z0-9]", "", plate).upper()

class WatchlistEngine:
    def __init__(self):
        self.watchlist: List[Dict[str, Any]] = []
        self.alerts_history: List[Dict[str, Any]] = []
        self.load_watchlist()
        self.seed_initial_alerts()

    def load_watchlist(self):
        if WATCHLIST_FILE.exists():
            with open(WATCHLIST_FILE, "r", encoding="utf-8") as f:
                self.watchlist = json.load(f)
        else:
            self.watchlist = []

    def seed_initial_alerts(self):
        if not self.alerts_history and self.watchlist:
            sample_cams = [
                {"id": 1, "name": "CAM-01 Gita Mandir", "location": "Ahmedabad", "district": "Ahmedabad", "latitude": 23.0128, "longitude": 72.5907},
                {"id": 29, "name": "CAM-29 Koba Circle", "location": "Gandhinagar", "district": "Gandhinagar", "latitude": 23.1610, "longitude": 72.6375},
                {"id": 4, "name": "CAM-04 Surat Ring Road", "location": "Surat", "district": "Surat", "latitude": 21.1702, "longitude": 72.8311},
            ]
            for idx, item in enumerate(self.watchlist[:3]):
                cam = sample_cams[idx % len(sample_cams)]
                alert = {
                    "alert_id": f"ALT-{datetime.now().strftime('%Y%m%d%H%M%S')}-{idx+1}",
                    "timestamp": datetime.now().isoformat(),
                    "matched_plate": item.get("display_plate", item.get("plate_number")),
                    "category": item.get("category"),
                    "severity": item.get("severity"),
                    "vehicle_info": f"{item.get('vehicle_color')} {item.get('vehicle_make')} {item.get('vehicle_model')}",
                    "fir_number": item.get("fir_number"),
                    "police_station": item.get("police_station"),
                    "owner_name": item.get("owner_name"),
                    "alert_message": item.get("alert_message"),
                    "action_required": item.get("action_required"),
                    "camera_id": cam["id"],
                    "camera_name": cam["name"],
                    "location": cam["location"],
                    "district": cam["district"],
                    "latitude": cam["latitude"],
                    "longitude": cam["longitude"]
                }
                self.alerts_history.append(alert)

    def get_all(self, category: Optional[str] = None) -> List[Dict[str, Any]]:
        if category and category.lower() != "all":
            return [item for item in self.watchlist if item.get("category", "").lower() == category.lower()]
        return self.watchlist

    def match_plate(self, detected_plate: str, camera_info: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        norm_input = normalize_plate(detected_plate)
        matched_item = None

        # Fast path: exact match
        for item in self.watchlist:
            if normalize_plate(item.get("plate_number", "")) == norm_input:
                matched_item = item
                break

        # Fuzzy path: Levenshtein-1 via stdlib (catches single OCR misread)
        if matched_item is None:
            for item in self.watchlist:
                wl_norm = normalize_plate(item.get("plate_number", ""))
                if abs(len(wl_norm) - len(norm_input)) <= 1 and _edit_distance_le1(norm_input, wl_norm):
                    matched_item = item
                    break  # ponytail: first fuzzy hit wins; rank by confidence if false-positive rate rises

        if matched_item is None:
            return None

        alert = {
            "alert_id": f"ALT-{datetime.now().strftime('%Y%m%d%H%M%S')}-{len(self.alerts_history)+1}",
            "timestamp": datetime.now().isoformat(),
            "matched_plate": matched_item.get("display_plate", detected_plate),
            "category": matched_item.get("category"),
            "severity": matched_item.get("severity"),
            "vehicle_info": f"{matched_item.get('vehicle_color')} {matched_item.get('vehicle_make')} {matched_item.get('vehicle_model')}",
            "fir_number": matched_item.get("fir_number"),
            "police_station": matched_item.get("police_station"),
            "owner_name": matched_item.get("owner_name"),
            "alert_message": matched_item.get("alert_message"),
            "action_required": matched_item.get("action_required"),
            "camera_id": camera_info.get("id") if camera_info else 1,
            "camera_name": camera_info.get("name") if camera_info else "CAM-01 Gita Mandir",
            "location": camera_info.get("location") if camera_info else "Ahmedabad",
            "district": camera_info.get("district") if camera_info else "Ahmedabad",
            "latitude": camera_info.get("latitude") if camera_info else 23.0128,
            "longitude": camera_info.get("longitude") if camera_info else 72.5907
        }
        self.alerts_history.insert(0, alert)
        if len(self.alerts_history) > 100:
            self.alerts_history.pop()
        return alert

    def add_entry(self, entry: Dict[str, Any]) -> Dict[str, Any]:
        norm = normalize_plate(entry.get("plate_number", ""))
        entry["plate_number"] = norm
        if "display_plate" not in entry:
            entry["display_plate"] = norm
        self.watchlist.append(entry)
        return entry

    def get_recent_alerts(self, limit: int = 20) -> List[Dict[str, Any]]:
        return self.alerts_history[:limit]


def _edit_distance_le1(a: str, b: str) -> bool:
    """Returns True iff edit distance between a and b is exactly 1 (sub, ins, or del).
    O(n) stdlib-only. Avoids full DP matrix for the common case of same-length plates."""
    if a == b:
        return False
    if abs(len(a) - len(b)) > 1:
        return False
    # Same length → one substitution allowed
    if len(a) == len(b):
        return sum(c1 != c2 for c1, c2 in zip(a, b)) == 1
    # Length differs by 1 → one insertion/deletion
    shorter, longer = (a, b) if len(a) < len(b) else (b, a)
    i = j = diffs = 0
    while i < len(shorter) and j < len(longer):
        if shorter[i] != longer[j]:
            diffs += 1
            j += 1  # skip one char in longer
        else:
            i += 1; j += 1
    return diffs <= 1


watchlist_engine = WatchlistEngine()
