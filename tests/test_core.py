"""
SENTINEL.AI — Unit Tests
Covers core modules: temporal consensus, watchlist engine, plate normalization,
and event bus functionality.
"""

import os
import sys
import time
import json
import pytest
from unittest.mock import MagicMock, patch

# Add project root to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


# ---------------------------------------------------------------------------
# Plate Normalization Tests
# ---------------------------------------------------------------------------
class TestPlateNormalization:
    def test_normalize_gujarat_plate(self):
        from backend.modules.watchlist import normalize_plate
        assert normalize_plate("GJ-01-AB-1234") == "GJ01AB1234"
        assert normalize_plate("gj01ab1234") == "GJ01AB1234"
        assert normalize_plate("GJ 01 AB 1234") == "GJ01AB1234"
        assert normalize_plate("GJ01AB1234") == "GJ01AB1234"

    def test_normalize_empty_plate(self):
        from backend.modules.watchlist import normalize_plate
        assert normalize_plate("") == ""
        assert normalize_plate(None) == ""

    def test_normalize_with_special_chars(self):
        from backend.modules.watchlist import normalize_plate
        assert normalize_plate("GJ-01-AB-1234/5") == "GJ01AB12345"
        assert normalize_plate("GJ@01#AB$1234") == "GJ01AB1234"


# ---------------------------------------------------------------------------
# Multi-Object Tracker & Bayesian Consensus Tests
# ---------------------------------------------------------------------------
class TestMultiObjectTracker:
    def test_track_creation(self):
        from backend.modules.tracker_engine import MultiObjectTracker
        mot = MultiObjectTracker(min_hits=1)
        dets = [{"box": [0.1, 0.1, 0.2, 0.2], "plate": "GJ01AB1234", "plate_conf": 0.9, "label": "CAR"}]
        tracks = mot.update(dets)
        assert len(tracks) == 1
        assert tracks[0]["hits"] >= 1

    def test_bayesian_consensus(self):
        from backend.modules.tracker_engine import MultiObjectTracker
        mot = MultiObjectTracker(min_hits=1)
        mot.update([{"box": [0.1, 0.1, 0.2, 0.2], "plate": "GJ01AB1234", "plate_conf": 0.95, "label": "CAR"}])
        tracks = mot.update([{"box": [0.1, 0.1, 0.2, 0.2], "plate": "GJ01AB1234", "plate_conf": 0.95, "label": "CAR"}])
        assert tracks[0]["consensus_plate"] == "GJ01AB1234"


# ---------------------------------------------------------------------------
# Watchlist Engine Tests
# ---------------------------------------------------------------------------
class TestWatchlistEngine:
    def test_match_plate_exact(self):
        from backend.modules.watchlist import WatchlistEngine
        engine = WatchlistEngine()
        # Mock watchlist data
        engine.watchlist = [
            {
                "plate_number": "GJ01AB1234",
                "category": "STOLEN",
                "severity": "HIGH",
                "fir_number": "FIR/248/2026",
                "police_station": "Navrangpura",
                "owner_name": "Test Owner",
                "alert_message": "Stolen vehicle",
                "action_required": "Intercept",
                "vehicle_color": "White",
                "vehicle_make": "Maruti",
                "vehicle_model": "Swift"
            }
        ]
        result = engine.match_plate("GJ01AB1234")
        assert result is not None
        assert result["category"] == "STOLEN"

    def test_match_plate_no_match(self):
        from backend.modules.watchlist import WatchlistEngine
        engine = WatchlistEngine()
        engine.watchlist = [
            {"plate_number": "GJ01AB1234", "category": "STOLEN"}
        ]
        result = engine.match_plate("MH12CD5678")
        assert result is None

    def test_add_entry(self):
        from backend.modules.watchlist import WatchlistEngine
        engine = WatchlistEngine()
        entry = {
            "plate_number": "gj01ab1234",
            "category": "STOLEN",
            "severity": "HIGH"
        }
        result = engine.add_entry(entry)
        assert result["plate_number"] == "GJ01AB1234"  # Normalized


# ---------------------------------------------------------------------------
# Event Bus Tests
# ---------------------------------------------------------------------------
class TestEventBus:
    def test_publish_local_fallback(self):
        from backend.events import EventBus
        bus = EventBus()
        received = []
        bus.subscribe("test_channel", lambda e: received.append(e))
        bus.publish("test_channel", {"type": "TEST", "data": "hello"})
        assert len(received) == 1
        assert received[0]["type"] == "TEST"

    def test_multiple_subscribers(self):
        from backend.events import EventBus
        bus = EventBus()
        results_a = []
        results_b = []
        bus.subscribe("ch", lambda e: results_a.append(e))
        bus.subscribe("ch", lambda e: results_b.append(e))
        bus.publish("ch", {"msg": "test"})
        assert len(results_a) == 1
        assert len(results_b) == 1


# ---------------------------------------------------------------------------
# Camera Registry Tests
# ---------------------------------------------------------------------------
class TestCameraRegistry:
    def test_get_by_id(self):
        from backend.modules.registry import CameraRegistry
        registry = CameraRegistry()
        # Should not crash even with no data
        result = registry.get_by_id(999)
        assert result is None

    def test_geojson_generation(self):
        from backend.modules.registry import CameraRegistry
        registry = CameraRegistry()
        geojson = registry.to_geojson()
        assert geojson["type"] == "FeatureCollection"
        assert "features" in geojson

    def test_gap_analysis(self):
        from backend.modules.registry import CameraRegistry
        registry = CameraRegistry()
        analysis = registry.get_gap_analysis()
        assert "total_cameras" in analysis
        assert "blind_spots" in analysis
        assert "statewide_coverage_score" in analysis


# ---------------------------------------------------------------------------
# Reports Module Tests
# ---------------------------------------------------------------------------
class TestReports:
    def test_export_detections_csv(self):
        from backend.modules.reports import export_detections_csv
        detections = [
            {
                "detection_id": "DET-001",
                "timestamp": "2026-09-06T10:00:00",
                "plate_number": "GJ01AB1234",
                "confidence": 0.95,
                "camera_id": 1,
                "camera_name": "Test Cam",
                "location": "Ahmedabad",
                "vehicle_type": "Car",
                "source": "REAL_AI_GPU",
            }
        ]
        csv = export_detections_csv(detections)
        assert "GJ01AB1234" in csv
        assert "detection_id" in csv.lower()

    def test_export_journey_csv(self):
        from backend.modules.reports import export_journey_csv
        trace = {
            "query_plate": "GJ01AB1234",
            "normalized_plate": "GJ01AB1234",
            "waypoints": [
                {
                    "step": 1,
                    "camera_name": "Test Cam 1",
                    "location": "Ahmedabad",
                    "timestamp": "2026-09-06T10:00:00",
                    "confidence": 0.95,
                    "speed_kmph": 45,
                    "district": "Ahmedabad",
                }
            ]
        }
        csv = export_journey_csv(trace)
        assert "GJ01AB1234" in csv


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
