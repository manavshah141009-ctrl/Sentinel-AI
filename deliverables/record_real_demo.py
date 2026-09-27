#!/usr/bin/env python3
"""
Automated High-Definition Screen Recorder for SENTINEL-AI
Records live browser interaction with the real running app at http://localhost:5173.
Outputs a clean, professional MP4 video ready for hackathon submission.
"""

import os
import sys
import time
import subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright

RECORDING_DIR = Path("deliverables/recording_raw")
RECORDING_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_MP4 = Path("deliverables/SENTINEL_AI_REAL_DEMO_RECORDING.mp4")

def safe_click(locator, timeout=5000, force=True):
    try:
        locator.first.click(timeout=timeout, force=force)
        return True
    except Exception as e:
        print(f"   [Note] Safe click skipped: {e}")
        return False

def run_recording():
    print("🎬 Starting Playwright Screen Recording Session at 1080p...")
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            headless=True,
            args=[
                "--window-size=1920,1080",
                "--no-sandbox",
                "--disable-dev-shm-usage",
                "--disable-blink-features=AutomationControlled"
            ]
        )
        context = browser.new_context(
            viewport={"width": 1920, "height": 1080},
            record_video_dir=str(RECORDING_DIR),
            record_video_size={"width": 1920, "height": 1080}
        )
        page = context.new_page()

        # Step 1: Open Dashboard
        print("1️⃣ Navigating to SENTINEL-AI Overview Dashboard...")
        page.goto("http://localhost:5173", wait_until="networkidle")
        time.sleep(4)

        # Smooth scroll overview metrics & charts
        page.evaluate("window.scrollBy({ top: 400, behavior: 'smooth' })")
        time.sleep(3)
        page.evaluate("window.scrollBy({ top: -400, behavior: 'smooth' })")
        time.sleep(2.5)

        # Step 2: Navigate to GIS Registry (Model 1)
        print("2️⃣ Switching to GIS Registry & Statewide Camera Map...")
        safe_click(page.locator("button:has-text('GIS Registry')").or_(page.locator("text='GIS Registry'")))
        time.sleep(4.5)

        # Inspect camera asset on GIS map
        print("   Inspecting camera asset on GIS map...")
        try:
            marker = page.locator(".custom-camera-marker").first
            if marker.is_visible():
                marker.dispatch_event("click")
                time.sleep(3)
        except Exception as e:
            print(f"   [Note] Marker click: {e}")

        # Step 3: Open Gap Analysis Modal
        print("3️⃣ Triggering Dark Zone Gap Analysis Modal...")
        safe_click(page.locator("button:has-text('Dark Zones')").or_(page.locator("button:has-text('Gap Analysis')")).or_(page.locator("text='Gap Analysis'")))
        time.sleep(4)
        # Close modal
        safe_click(page.locator("button:has-text('Close')").or_(page.locator(".lucide-x")))
        time.sleep(1.5)

        # Step 4: Navigate to Video Wall (Model 2)
        print("4️⃣ Switching to Video Wall & Live CCTV Feeds...")
        safe_click(page.locator("button:has-text('Video Wall')").or_(page.locator("text='Video Wall'")))
        time.sleep(6)

        # Step 5: Navigate to ANPR Scrapes
        print("5️⃣ Checking Real-Time AI ANPR OCR Scrapes...")
        safe_click(page.locator("button:has-text('ANPR Scrapes')").or_(page.locator("text='ANPR Scrapes'")))
        time.sleep(4.5)

        # Step 6: Core Jury Test Case — Vehicle Tracer
        print("6️⃣ Opening Designated Vehicle Tracer (Jury Test Scenario)...")
        safe_click(page.locator("button:has-text('Vehicle Tracer')").or_(page.locator("text='Vehicle Tracer'")))
        time.sleep(3.5)

        # Select GJ01AB1234 (Stolen White Swift)
        print("   Selecting designated vehicle: GJ01AB1234...")
        safe_click(page.locator("button:has-text('GJ01AB1234')"))
        time.sleep(2)

        # Click Trace Vehicle Journey
        print("   Executing Trajectory Reconstruction & Database Match...")
        safe_click(page.locator("button:has-text('Trace Vehicle Journey')"))
        time.sleep(4)

        # Scroll to inspect chronological checkpoints & Kavach radar
        page.evaluate("window.scrollBy({ top: 380, behavior: 'smooth' })")
        time.sleep(3.5)

        # Step 7: Launch Animated Trajectory on GIS Map
        print("7️⃣ Launching Animated Trajectory on GIS Map...")
        safe_click(page.locator("button:has-text('Launch Animated Trajectory on GIS Map')"))
        time.sleep(8)  # Let route animation play across Gujarat

        # Return to Vehicle Tracer to show Section 65B Dossier
        print("8️⃣ Opening Section 65B Forensic Legal Dossier...")
        safe_click(page.locator("button:has-text('Vehicle Tracer')").or_(page.locator("text='Vehicle Tracer'")))
        time.sleep(2)
        safe_click(page.locator("button:has-text('Section 65B Dossier')"))
        time.sleep(4)
        safe_click(page.locator("button:has-text('Close')").or_(page.locator(".lucide-x")))
        time.sleep(1.5)

        # Step 9: Watchlist & Alerts
        print("9️⃣ Inspecting Law Enforcement Watchlist & CCTNS Alerts...")
        safe_click(page.locator("button:has-text('Watchlist')").or_(page.locator("text='Watchlist'")))
        time.sleep(3.5)

        # Open Live Alerts drawer
        safe_click(page.locator("button:has-text('View Live Alerts')").or_(page.locator("text='Live Alerts Feed'")))
        time.sleep(4)

        print("🔟 Returning to Command Dashboard...")
        safe_click(page.locator("button:has-text('Overview')").or_(page.locator("text='Overview'")))
        time.sleep(3)

        # Finalize context and close browser to finish writing video
        video_path = page.video.path()
        context.close()
        browser.close()
        print(f"✅ Raw WebM screen recording saved to: {video_path}")
        return video_path

def convert_to_mp4(webm_path):
    print("🔄 Transcoding to crystal-clear 1080p MP4 via FFmpeg...")
    cmd = [
        "ffmpeg", "-y",
        "-i", str(webm_path),
        "-c:v", "libx264",
        "-preset", "slow",
        "-crf", "18",
        "-pix_fmt", "yuv420p",
        str(OUTPUT_MP4)
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode == 0:
        file_size = OUTPUT_MP4.stat().st_size / (1024 * 1024)
        print(f"🎉 Final Screen Recording MP4 Created: {OUTPUT_MP4} ({file_size:.2f} MB)")
        return True
    else:
        print(f"❌ Transcoding failed:\n{res.stderr}")
        return False

if __name__ == "__main__":
    raw_video = run_recording()
    if raw_video and os.path.exists(raw_video):
        convert_to_mp4(raw_video)
    else:
        print("❌ Failed to obtain raw screen recording.")
