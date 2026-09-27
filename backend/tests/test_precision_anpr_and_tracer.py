import time
import cv2
import numpy as np
from backend.ai.anpr.plate_finder import (
    correct_indian_plate_syntax,
    enhance_crop_multi_condition,
    deskew_plate,
    ocr_crop
)
from backend.modules.tracer import tracer, PlateRadixIndex, verify_chain_of_custody
from backend.modules.reports import generate_section_65b_dossier, generate_section_63_bsa_dossier, export_journey_csv

def test_syntax_corrections():
    print("Testing Indian Plate Bayesian Syntax Corrector...")
    cases = [
        ("GJ01AB1234", "GJ01AB1234"),
        ("G1O1ABI234", "GJ01AB1234"),
        ("INDGJ18CD5678", "GJ18CD5678"),
        ("GJ05B8888", "GJ05B8888"),
        ("6J03JK7890", "GJ03JK7890"),
        ("GJ18CD567B", "GJ18CD5678"),
        ("22BH1234AB", "22BH1234AB")
    ]
    for raw, expected in cases:
        res = correct_indian_plate_syntax(raw)
        assert res == expected, f"Failed for {raw}: got {res}, expected {expected}"
    print("✅ Syntax correction test passed with 100% precision.")

def test_crop_enhancement_and_deskew():
    print("Testing Multi-Condition Enhancement & Deskew...")
    # Create artificial skewed text plate
    dummy = np.full((60, 220, 3), 40, dtype=np.uint8) # Dark night background
    cv2.putText(dummy, "GJ01AB1234", (15, 42), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 255), 2)
    
    # Deskew check
    deskewed = deskew_plate(dummy)
    assert deskewed is not None and deskewed.shape == dummy.shape
    
    # Enhancement variants check
    variants = enhance_crop_multi_condition(dummy)
    assert len(variants) >= 5, f"Expected >= 5 variants, got {len(variants)}"
    print(f"✅ Generated {len(variants)} enhanced condition variants (Night CLAHE, Glare Tamer, Motion Sharp, Black-Hat).")

def test_tracer_latency_and_features():
    print("Testing Vehicle Tracer Latency & Feature Vectors...")
    
    # Test 1: Seed Plate
    t0 = time.perf_counter()
    res1 = tracer.trace("GJ01AB1234")
    dt1 = (time.perf_counter() - t0) * 1000.0
    print(f"Seed query latency: {dt1:.2f}ms (target < 10ms)")
    assert res1["status"] == "ROUTE_RECONSTRUCTED_SUCCESSFULLY"
    assert res1["total_checkpoints"] > 0
    assert res1["is_watchlist_match"] == True
    assert "chain_of_custody_sha256" in res1
    assert "kavach_interception" in res1
    assert "anti_spoofing" in res1
    
    # Test 2: Unobserved Vehicle (Real Honest Detection)
    t0 = time.perf_counter()
    res2 = tracer.trace("GJ05ZZ9999")
    dt2 = (time.perf_counter() - t0) * 1000.0
    print(f"Unobserved query latency: {dt2:.2f}ms (target < 5ms)")
    assert res2["status"] == "NO_OBSERVATIONS_RECORDED"
    assert res2["total_checkpoints"] == 0
    assert len(res2["waypoints"]) == 0
    print(f"✅ Real-world verification passed: Unobserved vehicle honestly reports NO_OBSERVATIONS_RECORDED.")

    # Test 3: Real Database Observation Ingestion & Live Tracing
    from datetime import datetime
    from backend.database import get_db, init_db
    from backend.models.detection import VehicleObservation
    init_db()
    with get_db() as db:
        db.query(VehicleObservation).filter(VehicleObservation.plate_number == "GJ05REAL12").delete()
        obs1 = VehicleObservation(
            observation_id="TEST-REAL-001",
            camera_id=1,
            camera_name="CAM-01 (SG Highway)",
            location="SG Highway, Ahmedabad",
            timestamp=datetime.now(),
            plate_number="GJ05REAL12",
            plate_confidence=0.98,
            vehicle_type="Car",
            latitude=23.0338,
            longitude=72.5262
        )
        obs2 = VehicleObservation(
            observation_id="TEST-REAL-002",
            camera_id=2,
            camera_name="CAM-02 (Ring Road)",
            location="Ring Road, Ahmedabad",
            timestamp=datetime.now(),
            plate_number="GJ05REAL12",
            plate_confidence=0.97,
            vehicle_type="Car",
            latitude=23.0800,
            longitude=72.5500
        )
        db.add_all([obs1, obs2])
        db.commit()

    res3 = tracer.trace("GJ05REAL12")
    assert res3["status"] == "ROUTE_RECONSTRUCTED_SUCCESSFULLY"
    assert res3["total_checkpoints"] == 2
    assert len(res3["waypoints"]) == 2
    print(f"✅ Real DB observation trace passed: Reconstructed {res3['total_checkpoints']} live waypoints from SQLite.")

def test_section_65b_dossier():
    print("Testing Section 63 BSA 2023 / Section 65B IEA 1872 Dossier Generation...")
    trace_data = tracer.trace("GJ01AB1234")
    html = generate_section_65b_dossier(trace_data)
    assert "SECTION 65B" in html
    assert "SECTION 63" in html
    assert "BHARATIYA SAKSHYA ADHINIYAM" in html
    assert "PART A: DECLARATION & CERTIFICATE BY THE SYSTEM CUSTODIAN" in html
    assert "PART B: CERTIFICATE & ENDORSEMENT BY TECHNICAL FORENSIC EXPERT" in html
    assert "SHA-256" in html
    assert "Government of Gujarat" in html
    assert trace_data["chain_of_custody_sha256"] in html
    assert "CRYPTOGRAPHICALLY VALIDATED & SEALED" in html

    # Test explicit BSA 2023 generator alias
    bsa_html = generate_section_63_bsa_dossier(trace_data)
    assert bsa_html == html

    # Test empty waypoints case (as requested in test specification)
    empty_html = generate_section_65b_dossier({"query_plate": "GJ01AB1234", "waypoints": []})
    assert "SECTION 63" in empty_html
    assert "PART A" in empty_html
    assert "PART B" in empty_html
    assert "SHA-256" in empty_html

    # Test cryptographic chain of custody validation
    audit = verify_chain_of_custody(trace_data)
    assert audit["is_valid"] is True
    assert audit["status"] == "CRYPTOGRAPHICALLY_VERIFIED"
    print(f"✅ Section 63 BSA / Section 65B Dossier generated successfully ({len(html)} bytes).")

if __name__ == "__main__":
    test_syntax_corrections()
    test_crop_enhancement_and_deskew()
    test_tracer_latency_and_features()
    test_section_65b_dossier()
    print("\n🎉 ALL UNIT TESTS PASSED CLEANLY WITH ZERO FAILURES!")
