# SENTINEL.AI — Current Architecture & Audit

> Last verified: 2026-09-13 (full project walkthrough; all statements below verified by
> automated tests and a live server smoke test — see §7).

## 1. Existing Architecture

The project is a vertically-decoupled monolith: one FastAPI process serves REST + WebSocket,
with inference work split into dedicated worker modules that communicate through a Redis
pub/sub event bus (in-process fallback when Redis is absent).

- **Frontend:** React 18 + Vite (Tailwind, Lucide, Leaflet). Pages/components: Overview
  dashboard (`components/dashboard/`), GIS Registry (`GisMap.jsx`), Video Wall
  (`VideoWall.jsx`, `RealCamVideo.jsx`), Vehicle Tracer (`VehicleTracer.jsx`), Watchlist
  (`WatchlistAlerts.jsx`), ANPR scrapes (`AnprScrapesPage.jsx`), Gov Feed
  (`GovFeedPage.jsx`), camera onboarding (`CameraModal.jsx`), gap analysis
  (`GapAnalysisModal.jsx`), cluster health (`ClusterHealthModal.jsx`), and auth
  (`components/auth/AuthModal.jsx`). API client: `src/services/api.js`.
- **Backend:** FastAPI (`backend/main.py`, lifespan-managed) — ~35 REST endpoints,
  `/ws/stream` WebSocket broadcast, security-header + rate-limit middleware.
- **Auth:** `backend/auth/` — JWT (python-jose) + bcrypt (passlib), users/roles/departments
  models, `get_current_user` / `get_current_admin` dependencies. Mounted when
  `HAS_AUTH=True` (requires `passlib`, `bcrypt`, `python-jose` in the venv).
- **Database:** SQLAlchemy 2.0 ORM. `VehicleObservation`, `Journey`, `User`,
  `Department`, `Role`, `Token`. SQLite by default (`sentinel.db`);
  Postgres + PostGIS via `docker-compose.yml` (`DATABASE_URL`).
- **Eventing:** `backend/events/` — `EventBus` (Redis pub/sub) wrapped by
  `AsyncEventBus` for FastAPI handlers; channels `sentinel:{detections,alerts,boxes,health}`.
  Falls back to in-process dispatch when Redis is unreachable (logged, never silent).

## 2. Working Features (verified)

- **Camera registry & GIS (Model 1):** seed registry + GeoJSON endpoint, department/district
  filters, credential redaction on served URLs, CSV bulk import, sandbox sync with
  fail-closed offline fallback, gap/dark-zone analysis.
- **Live video (Model 2):** HLS proxy (`stream/corp_proxy.py`), ffmpeg HLS relay
  (`stream/relay.py`), WebRTC/WHEP proxy, MJPEG + snapshot endpoints, per-camera health loop.
- **Real-time ANPR:** ONNX YOLOv8n vehicle detection (`workers/local_infer.py`), async OCR
  queue, plate enhancement pipeline (`ai/anpr/plate_finder.py`: OSD rejection, deskew,
  multi-condition night/glare enhancement, Indian plate syntax correction), MultiObjectTracker
  with Bayesian temporal consensus (`modules/tracker_engine.py`), motion filter
  (`modules/motion_filter.py`), GPU/Colab inference router (`workers/gpu_infer_server.py`).
- **Watchlist & alerts (Model 3):** exact + Levenshtein-1 fuzzy plate matching, alert history,
  WebSocket push, Redis fan-out, PCR dispatch payload.
- **Vehicle tracing (jury test):** Radix plate index (<5 ms lookups), DB-first observation
  trail, Haversine distance/bearing, anti-spoofing velocity audit, Kavach chokepoint
  interception, A* highway-graph route snapping (`modules/highway_graph.py`), SHA-256
  chain-of-custody seal + verification.
- **Reports:** detections CSV, journey CSV, Section 63 BSA 2023 / Section 65B IEA 1872
  forensic dossier (HTML).

## 3. Tests & Verification (all passing)

- `tests/` — unit tests for plate normalization, MOT tracker + Bayesian consensus,
  watchlist engine, event bus, camera registry, reports.
- `backend/tests/` — API integration tests (health, cameras, trace, ANPR), 80k-scale
  scalability, academic MOT/routing, precision ANPR/tracer.
- `tests/test_fixes.py` — regression suite for the 2026-09-13 walkthrough fixes:
  sandbox-sync NameError, detections DB-fallback hydration, auth mount, lifespan wiring.

Verification commands:

```bash
.venv/bin/python -m pytest tests/ backend/tests/ -q \
  -W "error::DeprecationWarning" -W "error::sqlalchemy.exc.MovedIn20Warning"
# → 41 passed, 0 warnings

.venv/bin/uvicorn backend.main:app --port 8000   # then:
#   GET  /api/health                  → {"status":"OPERATIONAL","subsystems":{"auth":true,...}}
#   POST /api/cameras/sync-sandbox    → graceful JSON (no NameError/500)
#   GET  /api/detections              → rows hydrated from vehicle_observations
#   POST /api/trace {"plate_number":"GJ01AB1234"} → waypoints + chain-of-custody
#   GET  /docs                        → Swagger UI (HTTP 200)

cd frontend && npm run build                      # → built in ~4s, no errors
```

## 4. Dependencies — Runtime Notes

- **Required at runtime:** fastapi, uvicorn, sqlalchemy 2.0, httpx, requests, redis,
  onnxruntime, opencv-python-headless, numpy, python-multipart, python-dotenv,
  passlib+bcrypt+python-jose (auth).
- **Optional (GPU/Colab path, `COLAB_GPU_MODE=1`):** torch, torchvision, ultralytics,
  easyocr — safe to omit for local ONNX inference.
- bcrypt is pinned to 4.0.1 in practice: passlib 1.7.4 emits a version-detection
  warning with bcrypt ≥ 4.1.

## 5. Known Limitations (accepted for scope)

- CORS is `allow_origins=["*"]` with credentials — demo-grade; tighten via
  `ALLOWED_ORIGINS` before any real deployment.
- `SECRET_KEY` has a development default (`change-me-...`) — must be set via env in prod.
- Camera catalogue sync expects the external sandbox gateway; offline it fails closed to
  the seeded registry by design.
- `frontend/dist/` is a build artifact; regenerate with `npm run build`, do not hand-edit.

## 6. Defect Log (2026-09-13 walkthrough)

| # | Defect | Impact | Status |
|---|--------|--------|--------|
| 1 | `registry.py` referenced undefined `SENTINEL_INGEST_URL` | `POST /api/cameras/sync-sandbox` raised NameError (500) | **Fixed** (→ `SANDBOX_INGEST_URL`) + regression test |
| 2 | `anpr_engine.py` used unimported `VehicleObservation` behind bare `except: pass` | `GET /api/detections` silently empty despite DB rows | **Fixed** (import added; failures now logged) + regression test |
| 3 | `passlib`/`bcrypt`/`python-jose` missing from venv | Auth subsystem silently unmounted (`HAS_AUTH=False`) | **Fixed** (installed; verified mounted, 401 on unauth) |
| 4 | Deprecated `@app.on_event` startup/shutdown | 5 pytest warnings | **Fixed** (migrated to `lifespan`) |
| 5 | `sqlalchemy.ext.declarative` deprecation | 1 pytest warning | **Fixed** (→ `sqlalchemy.orm.declarative_base`) |
