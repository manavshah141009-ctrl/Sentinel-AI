"""
SENTINEL.AI — Google Colab GPU Backend Runner
Starts FastAPI with GPU /api/infer endpoint + Cloudflare public tunnel.
Frames are sent by the Mac's frame_relay.py — this server only does GPU AI inference.
"""

import os
import sys
import time
import re
import subprocess
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("sentinel.colab")

# Tell main.py to mount the GPU inference endpoint
os.environ["COLAB_GPU_MODE"] = "1"

def check_gpu():
    try:
        import torch
        if torch.cuda.is_available():
            name = torch.cuda.get_device_name(0)
            vram = torch.cuda.get_device_properties(0).total_memory / (1024**3)
            log.info(f"⚡ GPU: {name} ({vram:.1f} GB VRAM) | CUDA {torch.version.cuda}")
            return True
        else:
            log.warning("⚠️ No GPU found — go to Runtime → Change runtime type → GPU (T4)")
            return False
    except Exception as e:
        log.warning(f"GPU check error: {e}")
        return False

def start_backend():
    log.info("Starting FastAPI Backend (GPU Inference Mode) on port 8000...")
    env = os.environ.copy()
    env["COLAB_GPU_MODE"] = "1"
    backend_log = open("backend.log", "w")
    proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"],
        stdout=backend_log, stderr=subprocess.STDOUT, env=env
    )
    return proc

def start_tunnel():
    log.info("Setting up Cloudflare Tunnel...")
    cf_bin = Path("cloudflared")
    if not cf_bin.exists():
        log.info("Downloading cloudflared...")
        subprocess.run(
            ["curl", "-sLo", "cloudflared",
             "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64"],
            check=True
        )
        subprocess.run(["chmod", "+x", "cloudflared"], check=True)

    log_file = open("tunnel.log", "w")
    proc = subprocess.Popen(
        ["./cloudflared", "tunnel", "--url", "http://localhost:8000"],
        stderr=subprocess.STDOUT, stdout=log_file
    )

    tunnel_url = None
    for _ in range(30):
        time.sleep(1)
        if Path("tunnel.log").exists():
            content = Path("tunnel.log").read_text(errors="ignore")
            match = re.search(r"https://[a-zA-Z0-9-]+\.trycloudflare\.com", content)
            if match:
                tunnel_url = match.group(0)
                break

    return proc, tunnel_url

def main():
    print("=" * 70)
    print("🛡️  SENTINEL.AI — COLAB GPU INFERENCE SERVER")
    print("   (Hybrid mode: Mac relays frames → this server runs YOLO+OCR)")
    print("=" * 70)

    check_gpu()
    Path("data/frames").mkdir(parents=True, exist_ok=True)

    backend_proc = start_backend()
    log.info("Waiting for FastAPI to start...")
    time.sleep(5)

    tunnel_proc, tunnel_url = start_tunnel()

    print("\n" + "=" * 70)
    if tunnel_url:
        print("🚀 COLAB GPU BACKEND IS LIVE!")
        print(f"\n👉 PUBLIC TUNNEL URL:  {tunnel_url}")
        print("\n📋 NOW DO THIS ON YOUR MAC:")
        print(f"   cd /Users/macbook/Desktop/GujratSarkar")
        print(f"   python frame_relay.py --colab-url {tunnel_url}")
        print("\n   (Keep the Mac frontend also running with: npm run dev --prefix frontend)")
    else:
        print("⚠️  Tunnel URL not ready yet. Check tunnel.log:")
        if Path("tunnel.log").exists():
            print(Path("tunnel.log").read_text(errors="ignore")[-800:])
    print("=" * 70 + "\n")

    # Show backend.log live in terminal
    log.info("Backend log output (tail -f backend.log):")
    try:
        subprocess.run(["tail", "-f", "backend.log"])
    except KeyboardInterrupt:
        log.info("Shutting down...")
        backend_proc.terminate()
        tunnel_proc.terminate()

if __name__ == "__main__":
    main()

