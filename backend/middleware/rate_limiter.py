import time
from collections import defaultdict
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

# Simple in-memory token bucket. For production use Redis.
_hits: defaultdict = defaultdict(list)
LIMIT = 120
WINDOW = 60


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        ip = request.client.host if request.client else "unknown"
        if request.url.path.startswith(("/api/health", "/docs", "/openapi.json", "/api/detections", "/api/infer", "/api/cams")) or ip in ("127.0.0.1", "localhost", "::1"):
            return await call_next(request)
        now = time.time()
        window_start = now - WINDOW
        _hits[ip] = [t for t in _hits[ip] if t > window_start]
        if len(_hits[ip]) >= LIMIT:
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded. Try again later."},
            )
        _hits[ip].append(now)
        return await call_next(request)
