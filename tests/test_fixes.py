"""
SENTINEL.AI — Regression tests for defects found during the full project walkthrough.

Covers:
1. CameraRegistry.sync_sentinel_sandbox() — NameError on undefined SENTINEL_INGEST_URL
   (fixed to use the imported SANDBOX_INGEST_URL) with graceful offline fallback.
2. AnprEngine.get_recent_detections() — silent DB-fallback failure caused by a missing
   VehicleObservation import; the fix restores hydration from vehicle_observations.
3. Auth subsystem — passlib/bcrypt/python-jose are installed so HAS_AUTH must be True
   and /api/auth routes must be mounted on the application.
"""

import uuid
from datetime import datetime, timezone

import pytest


# ---------------------------------------------------------------------------
# Fix 1: Camera Registry sandbox sync (was: NameError: SENTINEL_INGEST_URL)
# ---------------------------------------------------------------------------
class TestSandboxSyncRegression:
    def test_offline_failure_is_graceful_not_nameerror(self, monkeypatch):
        """When the sandbox gateway is unreachable the method must return a
        failure dict (fail-closed), never raise NameError."""
        import requests
        from backend.modules.registry import CameraRegistry

        def _unreachable(url, timeout=5):
            raise requests.exceptions.ConnectionError("simulated offline gateway")

        monkeypatch.setattr("backend.modules.registry.requests.get", _unreachable)
        registry = CameraRegistry()
        result = registry.sync_sentinel_sandbox(None)
        assert isinstance(result, dict)
        assert result["success"] is False
        assert "message" in result

    def test_success_path_uses_imported_sandbox_url(self, monkeypatch):
        """With a live 200/JSON gateway the sync must merge cameras — this path
        only executes when the corrected SANDBOX_INGEST_URL name is referenced."""
        from unittest.mock import MagicMock
        from backend.modules.registry import CameraRegistry

        resp = MagicMock()
        resp.status_code = 200
        resp.headers = {"content-type": "application/json"}
        resp.json.return_value = [
            {
                "id": 9001,
                "name": "Regression Sandbox Cam",
                "department": "Police",
                "district": "Ahmedabad",
                "latitude": 23.0225,
                "longitude": 72.5714,
                "live": True,
            }
        ]
        monkeypatch.setattr("backend.modules.registry.requests.get", lambda url, timeout=5: resp)

        registry = CameraRegistry()
        result = registry.sync_sentinel_sandbox(None)
        assert result["success"] is True
        assert result["synced"] == 1
        assert any(c.get("id") == 9001 for c in registry.cameras)


# ---------------------------------------------------------------------------
# Fix 2: ANPR detections DB fallback (was: silently swallowed NameError)
# ---------------------------------------------------------------------------
class TestDetectionsDbFallbackRegression:
    def test_hydrates_rows_from_database(self):
        """Empty in-memory cache must hydrate from vehicle_observations.
        Regression: the fallback used an unimported VehicleObservation and the
        bare except returned [] despite real rows existing."""
        from backend.modules.anpr_engine import AnprEngine
        from backend.database import get_db
        from backend.models.detection import VehicleObservation

        engine = AnprEngine()
        engine.active_detections = []

        marker_plate = f"GJ99RG{uuid.uuid4().hex[:4].upper()}"
        with get_db() as db:
            db.add(VehicleObservation(
                observation_id=f"regression-{uuid.uuid4()}",
                camera_id=1,
                camera_name="CAM-01 Regression",
                location="Ahmedabad",
                plate_number=marker_plate,
                plate_confidence=0.93,
                vehicle_type="Car",
                vehicle_confidence=0.9,
                timestamp=datetime.now(timezone.utc),
                is_watchlist_alert=False,
            ))

        rows = engine.get_recent_detections(limit=25)
        assert len(rows) > 0, "DB fallback returned empty — hydration is broken again"
        assert any(d["plate_number"] == marker_plate for d in rows)

    def test_engine_module_exports_vehicle_observation(self):
        """The model class must be importable from the engine module — this is
        the exact symbol whose absence caused the silent NameError."""
        import backend.modules.anpr_engine as ae
        from backend.models.detection import VehicleObservation
        assert ae.VehicleObservation is VehicleObservation


# ---------------------------------------------------------------------------
# Fix 3: Auth subsystem mounted (passlib / bcrypt / python-jose installed)
# ---------------------------------------------------------------------------
class TestAuthSubsystemRegression:
    def test_has_auth_is_true(self):
        from backend import main as sentinel_main
        assert sentinel_main.HAS_AUTH is True, (
            "auth import failed — passlib/bcrypt/python-jose missing from venv?"
        )

    def test_auth_routes_are_mounted(self):
        from fastapi.testclient import TestClient
        from backend.main import app

        client = TestClient(app)
        # Unauthenticated request must hit the mounted route (401/403), not 404.
        r = client.get("/api/auth/me")
        assert r.status_code in (401, 403), (
            f"expected 401/403 from mounted auth route, got {r.status_code}"
        )

    def test_password_hashing_roundtrip(self):
        from backend.auth.hashing import hash_password, verify_password
        hashed = hash_password("sentinel-regression-pw")
        assert verify_password("sentinel-regression-pw", hashed) is True
        assert verify_password("wrong-password", hashed) is False


# ---------------------------------------------------------------------------
# Fix 4: lifespan wiring (on_event deprecated hooks migrated)
# ---------------------------------------------------------------------------
class TestLifespanWiring:
    def test_app_uses_lifespan_not_on_event(self):
        import asyncio
        from backend.main import app
        from backend.modules.anpr_engine import anpr_engine

        # No deprecated on_event handlers may remain registered.
        assert app.router.on_startup == [], "legacy on_event(startup) still registered"
        assert app.router.on_shutdown == [], "legacy on_event(shutdown) still registered"

        # Behavioral check: the lifespan context must actually execute its
        # startup logic (reset of the detection cache) and exit cleanly.
        anpr_engine.active_detections = [{"stale": True}]
        async def _run():
            async with app.router.lifespan_context(app):
                assert anpr_engine.active_detections == [], "lifespan startup did not reset detection cache"
        asyncio.run(_run())


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
