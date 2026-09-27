"""
SENTINEL.AI — Redis Pub/Sub Event Bus
Decouples inference workers from the FastAPI backend.
Workers publish events, backend subscribes and broadcasts to WebSocket clients.
"""

import os
import json
import asyncio
import logging
import threading
from typing import Callable, Dict, Any, Optional
from contextlib import contextmanager

log = logging.getLogger("sentinel.events")

# Event Types
VEHICLE_OBSERVED = "VEHICLE_OBSERVED"
WATCHLIST_MATCH = "WATCHLIST_MATCH"
CAMERA_BOXES = "CAMERA_BOXES"
ANPR_DETECTION = "ANPR_DETECTION"
POLICE_ALERT = "POLICE_ALERT"
SYSTEM_HEALTH = "SYSTEM_HEALTH"

CHANNELS = {
    "detections": "sentinel:detections",
    "alerts": "sentinel:alerts",
    "boxes": "sentinel:boxes",
    "health": "sentinel:health",
}


class EventBus:
    """Redis-backed pub/sub event bus for decoupled worker communication."""

    def __init__(self, redis_url: Optional[str] = None):
        self.redis_url = redis_url or os.getenv("REDIS_URL", "redis://localhost:6379/0")
        self._redis = None
        self._pubsub = None
        self._subscribers: Dict[str, list] = {}
        self._running = False
        self._thread: Optional[threading.Thread] = None

    def _get_redis(self):
        """Lazy-init Redis connection (import redis only when needed)."""
        if self._redis is None:
            try:
                import redis
                self._redis = redis.from_url(
                    self.redis_url,
                    decode_responses=True,
                    socket_connect_timeout=5,
                    socket_timeout=5,
                )
                self._redis.ping()
                log.info(f"✅ Redis connected: {self.redis_url}")
            except Exception as e:
                log.warning(f"⚠️ Redis unavailable ({e}), falling back to in-process events")
                self._redis = None
        return self._redis

    def publish(self, channel: str, event: Dict[str, Any]) -> bool:
        """Publish an event to a Redis channel. Returns True on success."""
        r = self._get_redis()
        payload = json.dumps(event, default=str)
        try:
            if r:
                r.publish(channel, payload)
                return True
            else:
                # Fallback: invoke local subscribers directly
                self._dispatch_local(channel, event)
                return True
        except Exception as e:
            log.error(f"Publish failed on {channel}: {e}")
            self._dispatch_local(channel, event)
            return False

    def subscribe(self, channel: str, callback: Callable[[Dict[str, Any]], None]):
        """Register a callback for a channel."""
        if channel not in self._subscribers:
            self._subscribers[channel] = []
        self._subscribers[channel].append(callback)

    def _dispatch_local(self, channel: str, event: Dict[str, Any]):
        """Dispatch event to local subscribers (fallback when Redis is unavailable)."""
        for cb in self._subscribers.get(channel, []):
            try:
                cb(event)
            except Exception as e:
                log.error(f"Local subscriber error on {channel}: {e}")

    def start_listener(self):
        """Start background thread listening to Redis Pub/Sub."""
        r = self._get_redis()
        if not r:
            log.info("Redis unavailable, using in-process event bus")
            return

        self._pubsub = r.pubsub()
        channels = list(CHANNELS.values())
        self._pubsub.subscribe(*channels)
        self._running = True

        def _listener():
            log.info(f"🎧 Event bus listener started on {len(channels)} channels")
            for message in self._pubsub.listen():
                if not self._running:
                    break
                if message["type"] != "message":
                    continue
                ch = message["channel"]
                try:
                    event = json.loads(message["data"])
                    self._dispatch_local(ch, event)
                except Exception as e:
                    log.error(f"Event parse error: {e}")

        self._thread = threading.Thread(target=_listener, daemon=True)
        self._thread.start()

    def stop_listener(self):
        """Shutdown the listener."""
        self._running = False
        if self._pubsub:
            try:
                self._pubsub.unsubscribe()
                self._pubsub.close()
            except Exception:
                pass


# Async wrapper for use inside FastAPI async handlers
class AsyncEventBus:
    """Async-compatible event bus that bridges to the sync EventBus."""

    def __init__(self):
        self._bus = EventBus()
        self._loop: Optional[asyncio.AbstractEventLoop] = None

    async def publish(self, channel: str, event: Dict[str, Any]) -> bool:
        """Publish event asynchronously (runs sync publish in threadpool)."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._bus.publish, channel, event)

    def subscribe(self, channel: str, callback):
        """Subscribe to a channel. Callback may be sync or async."""
        async def _async_wrapper(event):
            if asyncio.iscoroutinefunction(callback):
                await callback(event)
            else:
                callback(event)
        self._bus.subscribe(channel, _async_wrapper)

    def start(self):
        self._bus.start_listener()

    def stop(self):
        self._bus.stop_listener()


# Global singleton
event_bus = AsyncEventBus()


def publish_detection(event: Dict[str, Any]):
    """Publish a detection event to the detections channel."""
    event_bus._bus.publish(CHANNELS["detections"], {
        "type": ANPR_DETECTION,
        "data": event
    })


def publish_alert(event: Dict[str, Any]):
    """Publish a watchlist alert to the alerts channel."""
    event_bus._bus.publish(CHANNELS["alerts"], {
        "type": POLICE_ALERT,
        "data": event
    })


def publish_boxes(camera_id: int, vehicles: list, timestamp: float):
    """Publish bounding box data for a camera."""
    event_bus._bus.publish(CHANNELS["boxes"], {
        "type": CAMERA_BOXES,
        "data": {
            "camera_id": camera_id,
            "vehicles": vehicles,
            "timestamp": timestamp
        }
    })
