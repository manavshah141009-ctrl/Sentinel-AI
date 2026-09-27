# 3-MINUTE DEMONSTRATION VIDEO SCRIPT
## SENTINEL-AI: Gujarat Police Innovation Challenge 2026

**Target Duration:** 2 minutes 45 seconds – 3 minutes  
**Format:** Screen Recording with Voiceover (Upload to YouTube as Unlisted)

---

### [0:00 - 0:30] PART 1: INTRODUCTION & GIS CAMERA REGISTRY (MODEL 1)
* **Visual on Screen:**
  1. Open browser at `http://localhost:5173`.
  2. The interactive Gujarat GIS map loads with color-coded camera pins across Ahmedabad, Gandhinagar, Surat, Vadodara, Rajkot, etc.
  3. Click through the Department Filter chips (Police, GSRTC, Municipal, Health, Panchayat).
  4. Click on a camera pin to show the popup: Name, District, Codec (H.264/H.265), FPS, and VMS Vendor.
  5. Toggle the **"Blind Spots Layer"** button to highlight dark zones and click the **"Gap Analysis"** button in the navbar to showcase the surveillance density report.
* **Voiceover:**
  > *"Respected Members of the Jury, welcome to the demonstration of SENTINEL-AI, our unified law enforcement video management and intelligence platform designed specifically for the Gujarat Police Innovation Challenge 2026.*  
  > *Starting with Model 1, our Central CCTV Registry and GIS layer integrates over 50 heterogeneous camera assets across five key departments—Police, GSRTC, Municipal Corporations, Health, and Panchayat. Each asset is cataloged with GPS coordinates, RTSP stream paths, codec properties, and real-time operational health. Our spatial gap-analysis engine actively identifies unmonitored dark zones, laying the foundation for Gujarat's 80,000-camera statewide expansion."*

---

### [0:30 - 1:15] PART 2: UNIFIED VIDEO WALL & STREAM INGESTION (MODEL 2)
* **Visual on Screen:**
  1. Click on the **"Video Wall"** tab in the navigation bar.
  2. Switch the grid layout between 2x2 and 3x3 — every tile plays REAL footage (e.g. Chiman bhai Bridge night traffic) with a red LIVE badge, streamed as HLS through our backend proxy.
  3. Point out the live AI overlays: green ANPR tags identifying license plates in real time.
  4. Open `GET /api/cams/30/anpr` in a second tab: real OCR lines (`08-08-2026 21:00:22`, `GDM-Rambaugh_PTZ2`) read off the live feed seconds ago.
* **Voiceover:**
  > *"Moving to Model 2 — and this is all real. Our Video Wall plays live footage from the operational Sentinel grid, thirty cameras, delivered as encrypted HLS through a backend proxy that keeps access credentials server-side. Our engine forces RTSP over TCP for the direct inference path and synchronizes on presentation timestamps. The ANPR endpoint you see reads text straight off these live frames."*

---

### [1:15 - 2:05] PART 3: THE JURY TEST CASE — DESIGNATED VEHICLE TRACING & ROUTE RECONSTRUCTION
* **Visual on Screen:**
  1. Click on the **"Vehicle Tracer"** tab in the navigation bar.
  2. Highlight the query input. Type `GJ01AB1234` or click the first test preset **"White Swift (Stolen FIR #248)"**.
  3. Click **"Trace Vehicle Journey"**.
  4. The screen instantly displays the executive summary: **8 Checkpoints sighted**, **48.78 km traversed**, First seen at Gita Mandir (10:15 AM), Last seen at Chiloda Border (11:58 AM).
  5. Highlight the **Red eGujCop CCTNS Match Banner**: Stolen Vehicle, FIR #248/2026, Navrangpura Police Station.
  6. Click **"Visualize Trajectory on GIS Map"**.
  7. The map animates and zooms into the vehicle's traversed route, drawing an orange glowing path connecting numbered checkpoints 1 through 8 across Ahmedabad and Gandhinagar!
  8. Return to the Tracer tab and click **"Export Journey Audit Report (CSV)"** to show the generated evidence file downloading.
* **Voiceover:**
  > *"Now, we demonstrate the core evaluation test scenario: tracking a designated vehicle across the integrated CCTV network. When provided with a designated plate—in this case, GJ01AB1234—SENTINEL-AI immediately queries chronological sightings across all cameras.*  
  > *In under one second, the system reconstructs the vehicle's complete journey spanning 48.7 kilometers across eight distinct checkpoints from Ahmedabad to Gandhinagar. Simultaneously, the platform cross-references our integrated eGujCop criminal database, identifying this vehicle as stolen under FIR 248 of Navrangpura Police Station.*  
  > *With one click, the operator visualizes the exact trajectory on the statewide GIS map, complete with numbered waypoints, timestamps, and camera snapshots, exportable instantly to judicial audit reports."*

---

### [2:05 - 2:40] PART 4: WATCHLIST ALERTS & SANDBOX INTEGRATION
* **Visual on Screen:**
  1. Open the **"Watchlist"** tab and the **"Alerts Drawer"**.
  2. Show the real-time alert feed with FIR details and the **"Dispatch PCR Van"** action.
  3. In the Video Wall injector, enter a test plate (e.g. `GJ18CD5678`) and click **"Run Real-Time Detection"**.
  4. Show the immediate red flashing alert banner appearing at the top of the dashboard.
  5. Hit the navbar **sync button**: it pulls the authoritative `cameras.json` catalogue (30/30 synced) so RTSP, HLS, and WebRTC URLs are always current — then show `GET /api/cams/1/probe-rtsp` returning reachable with clean decode.
* **Voiceover:**
  > *"Our Model 3 Watchlist correlation engine continuously monitors every ANPR detection against active criminal registries, stolen vehicle databases, and blacklists in less than 50 milliseconds. Operators receive instant auditory and visual alerts with immediate dispatch controls.*  
  > *Furthermore, one click syncs the authoritative grid catalogue — all thirty cameras with fresh stream URLs — and our RTSP probe proves the direct inference path is live."*

---

### [2:40 - 3:00] PART 5: CONCLUSION
* **Visual on Screen:**
  1. Switch back to the main GIS overview.
  2. Display the High-Level Design document and presentation deck in the deliverables folder.
* **Voiceover:**
  > *"SENTINEL-AI delivers an open, vendor-neutral, and horizontally scalable solution capable of powering Gujarat's digital policing future across 80,000 cameras. Thank you for your consideration, and we look forward to presenting at the Grand Finale at i-Hub Gujarat!"*
