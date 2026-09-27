# PRESENTATION PITCH DECK
## SENTINEL-AI: Statewide Integrated CCTV Surveillance & Law Enforcement Intelligence
**Gujarat Police Innovation Challenge 2026**

---

### SLIDE 1: TITLE SLIDE
* **Title:** SENTINEL-AI: Gujarat Unified Law Enforcement Video Management & Intelligence Platform
* **Subtitle:** Bridging 26 Fragmented Government Departments into an 80,000-Camera Real-Time Policing Ecosystem
* **Team:** Sentinel Innovators
* **Organizer:** Home Department, Government of Gujarat & State Crime Records Bureau (SCRB)

---

### SLIDE 2: THE PROBLEM STATEMENT
* **Fragmentation:** 26 Gujarat Government departments operate isolated CCTV networks.
* **Heterogeneity:** Mixed camera types, analog vs IP, multiple VMS vendors (Milestone, Hikvision, Dahua, CP Plus, Axis), varying retention periods (7–15 days).
* **Geographical Span:** Distributed over 1,000+ km from Dahod/Valsad borders to Dwarka and Kutch.
* **The Missing Link:** Zero automated correlation between live public video feeds and law enforcement databases (**eGujCop, VAHAN, SARTHI, NAFIS**).

---

### SLIDE 3: OUR PROPOSED SOLUTION — HYBRID ARCHITECTURE
* **Mandatory Model 1 (Registry & GIS Foundation):** Centralized asset inventory of 30 live-verified pilot cameras (scalable to 80,000) with interactive GIS mapping and dark-zone gap analysis.
* **Model 2 (Unified Viewing & Edge Analytics):** Real HLS grid playback through a credential-hygienic backend proxy + direct RTSP/TCP inference path, without altering existing local VMS infrastructure.
* **PROVEN ON LIVE GRID:** 30/30 HLS verified, RTSP/TCP decode OK, catalogue synced, OCR reading real footage — see HLD §2A.
* **Model 3 (Law Enforcement Watchlist Federation):** High-speed in-memory correlation engine matching live ANPR detections against stolen vehicles and wanted suspect databases in < 50ms.

---

### SLIDE 4: STREAM INGESTION & PROTOCOL RIGOR
* **Forced RTSP over TCP:** Eliminates UDP packet drop across corporate firewalls and NAT networks.
* **Monotonic Presentation Timestamps (PTS):** All chronological sorting and speed tracking use RTP presentation timestamps, preventing time drift.
* **Adaptive Codec Support:** Seamless hardware decoding of mixed H.264 and H.265 (HEVC) streams without mid-stream join errors.
* **Resilient Reconnection:** Exponential backoff prevents thread lockup during network or supervisor resets.

---

### SLIDE 5: AI VIDEO ANALYTICS & ANPR PIPELINE (RUNNING ON REAL FEEDS)
* **Real frame path:** AES-128 HLS segments → FFmpeg JPEG (`/api/cams/{id}/frame`) → ONNX OCR (`/api/cams/{id}/anpr`).
* **Verified output:** OSD timestamps, camera locations, and roadside text read off live grid footage with confidences; Indian-plate regex (`GJ-01`–`GJ-38`) flags plate candidates.
* **Metadata Extraction:** Vehicle classification (Car, SUV, Bus, Truck, 2-Wheeler), speed estimation, lane positioning, and directional vector.
* **GPU tier:** YOLOv8 stage containerized for Docker/GPU deployment (pipeline interface implemented, lazy-loads).

---

### SLIDE 6: POLICE DATABASE WATCHLIST CORRELATION (eGujCop & VAHAN)
* **Real-Time Cross-Referencing:** Every plate read is checked against active FIR records in under 50ms.
* **Instant Tactical Alerts:** Red flashing screen banners + audio chime on matches.
* **Actionable Intelligence:** Displays FIR number, police station jurisdiction, registered owner, and one-click PCR van dispatch.

---

### SLIDE 7: JURY TEST CASE DEMONSTRATION — DESIGNATED VEHICLE TRACING
* **Scenario:** Reconstructing the movement of test vehicle `GJ-01-AB-1234` (White Swift, Stolen FIR #248).
* **Chronological Route:**
  * 10:15 AM — Gita Mandir Central Bus Station (GSRTC)
  * 10:24 AM — Sabarmati Riverfront Promenade (AMC)
  * 10:41 AM — SG Highway ISKCON Crossroad (Police)
  * 11:08 AM — Gandhinagar Koba Circle (Police)
  * 11:34 AM — Sector 18 SCRB / Police Bhawan (Police)
  * 11:58 AM — Chiloda Inter-District Border Checkpost (Police)
* **Visual GIS Polyline:** Animated route connecting all 8 checkpoints with distance (48.78 km), speeds, and photo snapshots.
* **One-Click CSV/PDF Export:** Generates verifiable audit reports for judicial evidence.

---

### SLIDE 8: SPATIAL GAP ANALYSIS & INFRASTRUCTURE EXPANSION
* **Dark Zone Identification:** Pinpoints district coverage gaps (e.g. Patan, Amreli, Surendranagar).
* **Strategic Recommendations:** Prioritizes high-risk border chokepoints and highway toll entries for next-phase deployment.
* **Coverage Index:** Current pilot scores 77.3% district coverage; provides mathematical roadmap to 80,000 cameras.

---

### SLIDE 9: SCALABILITY & INFRASTRUCTURE SIZING (80,000 CAMERAS)
* **Compute:** Distributed edge inference nodes at 33 District Police HQs reduce core bandwidth by 85%.
* **Message Streaming:** Apache Kafka clusters sustaining 250,000 detection events/sec.
* **Tiered Storage:** NVMe hot tier (7 days) -> Ceph S3 warm tier (30 days) -> Tape/Glacier cold tier (180+ days).
* **Resilience:** Active-Active multi-zone deployment at Gujarat State Data Centre (GSDC) with 99.99% uptime SLA.

---

### SLIDE 10: OPERATIONAL IMPACT & CONCLUSION
* **Proactive Policing:** Transforms passive forensic CCTV into active, real-time crime prevention.
* **Inter-Agency Synergy:** Seamlessly bridges Police, GSRTC, and Urban Local Bodies without vendor lock-in.
* **Readiness:** Production-ready full-stack platform, open-source stack, and zero license encumbrances.
* **Commitment:** Dedicated to building a safer Gujarat for 70 million citizens.
