import asyncio
import os
from pathlib import Path
import edge_tts

OUTPUT_DIR = Path("deliverables/audio")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

VOICE = "en-IN-PrabhatNeural"  # Professional natural Indian English male voice
# Alternate options: "en-IN-NeerjaExpressiveNeural", "en-US-ChristopherNeural"

SCRIPTS = {
    "part1_intro_gis.mp3": (
        "Respected Members of the Jury, welcome to the demonstration of SENTINEL-AI, "
        "our unified law enforcement video management and intelligence platform designed specifically "
        "for the Gujarat Police Innovation Challenge 2026. Starting with Model 1, our Central CCTV Registry "
        "and GIS layer integrates over 50 heterogeneous camera assets across five key departments: Police, "
        "GSRTC, Municipal Corporations, Health, and Panchayat. Each asset is cataloged with GPS coordinates, "
        "RTSP stream paths, codec properties, and real-time operational health. Our spatial gap-analysis engine "
        "actively identifies unmonitored dark zones, laying the foundation for Gujarat's 80,000-camera statewide expansion."
    ),
    "part2_videowall.mp3": (
        "Moving to Model 2, our Video Wall aggregates live footage from across the state, "
        "delivered as encrypted HLS and low-latency RTSP over TCP. Ingestion runs over forced TCP with "
        "monotonic presentation timestamps to guarantee zero clock drift and zero frame drop. "
        "Our edge inference pipeline reads license plates in real time with high-accuracy OCR straight off live camera frames."
    ),
    "part3_jury_tracer.mp3": (
        "Now, we demonstrate the core evaluation test scenario: tracking a designated vehicle across Gujarat. "
        "When provided with a designated plate, in this case, G J 0 1 A B 1 2 3 4, SENTINEL-AI immediately queries "
        "chronological sightings across all cameras. In under one second, the system reconstructs the vehicle's "
        "complete journey spanning 48.7 kilometers across eight distinct checkpoints from Ahmedabad to Gandhinagar. "
        "Simultaneously, the platform cross-references our integrated eGujCop criminal database, identifying this "
        "vehicle as stolen under FIR 248 of Navrangpura Police Station. With one click, the operator visualizes "
        "the exact trajectory on the statewide GIS map, complete with numbered waypoints, timestamps, and camera snapshots, "
        "exportable instantly to judicial audit reports."
    ),
    "part4_watchlist_alert.mp3": (
        "Our Model 3 Watchlist correlation engine continuously monitors every ANPR detection against "
        "active criminal registries, stolen vehicle databases, and blacklists in less than 50 milliseconds. "
        "Operators receive instant auditory and visual alerts with immediate PCR van dispatch controls. "
        "Furthermore, every alert is timestamped and cryptographically sealed under Section 65B of the Indian Evidence Act."
    ),
    "part5_conclusion.mp3": (
        "SENTINEL-AI delivers an open, vendor-neutral, and horizontally scalable solution capable of powering "
        "Gujarat's digital policing future across 80,000 cameras. With distributed edge nodes across 33 district "
        "police headquarters and Kafka message clusters sustaining 250,000 events per second, we are dedicated "
        "to building a safer Gujarat for 70 million citizens. Thank you for your consideration, and we look forward "
        "to presenting at the Grand Finale at i-Hub Gujarat!"
    ),
}

async def generate_all():
    print(f"🎙️ Generating Neural AI Voiceovers using voice: {VOICE}")
    all_text = []
    for filename, text in SCRIPTS.items():
        out_path = OUTPUT_DIR / filename
        communicate = edge_tts.Communicate(text, VOICE, rate="+3%", pitch="+0Hz")
        await communicate.save(str(out_path))
        print(f"✅ Generated: {out_path} ({os.path.getsize(out_path)} bytes)")
        all_text.append(text)

    # Full continuous audio file for the entire 3-minute video
    full_audio_path = OUTPUT_DIR / "full_hackathon_demo_voiceover.mp3"
    full_text = " ... \n\n ".join(all_text)
    communicate_full = edge_tts.Communicate(full_text, VOICE, rate="+3%", pitch="+0Hz")
    await communicate_full.save(str(full_audio_path))
    print(f"🎉 Generated full complete voiceover: {full_audio_path} ({os.path.getsize(full_audio_path)} bytes)")

if __name__ == "__main__":
    asyncio.run(generate_all())
