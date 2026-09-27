from typing import Dict, Any, Optional, List
from backend.config import (
    FEED_RESOURCES_URL, SANDBOX_INGEST_URL, CATALOGUE_URL,
    CORP_HLS_BASE, CORP_UA, COOKIES_FILE, RTSP_USER, RTSP_PASS,
    build_rtsp_url, build_whep_url,
)


def fetch_catalogue() -> Dict[str, Any]:
    """Authoritative camera list. Needs session cookie + access credentials."""
    import requests
    import http.cookiejar as cookiejar
    sess = requests.Session()
    sess.headers.update({"User-Agent": CORP_UA})
    try:
        jar = cookiejar.MozillaCookieJar(str(COOKIES_FILE))
        jar.load(ignore_discard=True, ignore_expires=True)
        sess.cookies.update(jar)
    except Exception:
        pass
    auth = (RTSP_USER, RTSP_PASS) if (RTSP_USER and RTSP_PASS) else None
    try:
        r = sess.get(CATALOGUE_URL, auth=auth, timeout=15)
    except Exception as e:
        return {"success": False, "message": f"catalogue unreachable: {e}"}
    if r.status_code != 200:
        return {"success": False, "message": f"catalogue HTTP {r.status_code}: {r.text[:120]}"}
    try:
        items = r.json()
    except Exception:
        return {"success": False, "message": "catalogue did not return JSON"}
    cams = items if isinstance(items, list) else items.get("cameras", [])
    normed = []
    for c in cams:
        tag = str(c.get("id", "")).lower()
        if not tag.startswith("cam"):
            continue
        normed.append({
            "tag": tag,
            "name": c.get("name", tag),
            "hls_url": f"{CORP_HLS_BASE}/{tag}/index.m3u8",
            "rtsp_url": build_rtsp_url(tag),
            "whep_url": build_whep_url(tag),
        })
    return {"success": True, "count": len(normed), "cameras": normed}


async def fetch_sandbox_feeds(sandbox_url: Optional[str] = None) -> Dict[str, Any]:
    try:
        import httpx
    except ImportError:
        return {"success": False, "message": "httpx not installed; sandbox sync unavailable"}
    url = sandbox_url or FEED_RESOURCES_URL
    try:
        async with httpx.AsyncClient(timeout=8.0, verify=False) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                try:
                    data = resp.json()
                    return {"success": True, "feeds": data}
                except Exception:
                    return {"success": False, "message": "Non-JSON gateway response"}
            return {"success": False, "message": f"Gateway HTTP {resp.status_code}"}
    except Exception as e:
        return {"success": False, "message": f"Sandbox unreachable: {e}"}


async def push_detection_to_sandbox(detection: Dict[str, Any]) -> Dict[str, Any]:
    try:
        import httpx
    except ImportError:
        return {"success": False, "message": "httpx not installed"}
    try:
        async with httpx.AsyncClient(timeout=5.0, verify=False) as client:
            resp = await client.post(SANDBOX_INGEST_URL, json=detection)
            return {"success": resp.status_code in (200, 201), "status": resp.status_code}
    except Exception as e:
        return {"success": False, "message": str(e)}


def normalize_gov_camera(raw: Dict[str, Any], idx: int = 0) -> Dict[str, Any]:
    return {
        "id": raw.get("id", idx),
        "name": raw.get("name", f"CAM-{idx}"),
        "department": raw.get("department", "Police"),
        "department_label": raw.get("department_label", "Home (Gujarat Police)"),
        "location": raw.get("location", "Gujarat"),
        "district": raw.get("district", "Ahmedabad"),
        "latitude": float(raw.get("latitude", 23.0225)),
        "longitude": float(raw.get("longitude", 72.5714)),
        "codec": raw.get("codec", "h264"),
        "resolution": raw.get("resolution", "1920x1080"),
        "declared_fps": int(raw.get("declared_fps", 25)),
        "bitrate_kbps": int(raw.get("bitrate_kbps", 4096)),
        "live": raw.get("live", True),
        "vms_vendor": raw.get("vms_vendor", "Generic RTSP"),
        "rtsp_url": raw.get("rtsp_url", ""),
        "hls_url": raw.get("hls_url", ""),
        "stream_path": raw.get("stream_path", f"/stream/{idx}"),
    }
