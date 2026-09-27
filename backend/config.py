import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
PROJECT_ROOT = BASE_DIR.parent

# Real-camera upstream (corp media gateway). Session cookie stays server-side.
CORP_HLS_BASE = os.getenv("CORP_HLS_BASE", "https://cctv.corp8.cloud")
CORP_UA = os.getenv(
    "CORP_UA",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/126.0 Safari/537.36",
)
COOKIES_FILE = Path(os.getenv("SENTINEL_COOKIES_FILE", str(BASE_DIR / "cookies.txt")))

# Direct-stream credentials (env only — never commit). Email @ must be %40 in URLs.
RTSP_USER = os.getenv("SENTINEL_RTSP_USER", "")
RTSP_PASS = os.getenv("SENTINEL_RTSP_PASS", "")
RTSP_HOST = os.getenv("SENTINEL_RTSP_HOST", "103.250.160.189")
RTSP_PORT = int(os.getenv("SENTINEL_RTSP_PORT", "8554"))
WHEP_PORT = int(os.getenv("SENTINEL_WHEP_PORT", "8889"))
CATALOGUE_URL = f"{CORP_HLS_BASE}/cameras.json"


def _rtsp_userinfo() -> str:
    if not RTSP_USER or not RTSP_PASS:
        return ""
    return f"{RTSP_USER.replace('@', '%40')}:{RTSP_PASS}@"


def build_rtsp_url(cam_tag: str) -> str:
    info = _rtsp_userinfo()
    if not info:
        return ""
    return f"rtsp://{info}{RTSP_HOST}:{RTSP_PORT}/stream/{cam_tag}"


def build_whep_url(cam_tag: str) -> str:
    info = _rtsp_userinfo()
    if not info:
        return ""
    return f"http://{info}{RTSP_HOST}:{WHEP_PORT}/stream/{cam_tag}/whep"

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./sentinel.db")
DATABASE_URL_READ = os.getenv("DATABASE_URL_READ", "")

SENTINEL_SANDBOX_HOST = os.getenv("SENTINEL_HOST", "sentinel.gujarat.gov.in")
FEED_RESOURCES_URL = f"https://{SENTINEL_SANDBOX_HOST}/api/resources/feeds"
SANDBOX_INGEST_URL = f"https://{SENTINEL_SANDBOX_HOST}/api/ingest"

CAMERAS_FILE = DATA_DIR / "cameras_seed.json"
WATCHLIST_FILE = DATA_DIR / "watchlist_seed.json"
JOURNEYS_FILE = DATA_DIR / "journeys_seed.json"

SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-production-use-32-char-minimum")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

FFMPEG_PATH = os.getenv("FFMPEG_PATH", "ffmpeg")
HLS_SEGMENT_DURATION = int(os.getenv("HLS_SEGMENT_DURATION", "4"))
HLS_PLAYLIST_SIZE = int(os.getenv("HLS_PLAYLIST_SIZE", "6"))

ANPR_MODEL = os.getenv("ANPR_MODEL", "easyocr")
OCR_LANGUAGES = ["en", "hi"]

PORT = int(os.getenv("PORT", 8000))
DEBUG = os.getenv("DEBUG", "True").lower() == "true"
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")