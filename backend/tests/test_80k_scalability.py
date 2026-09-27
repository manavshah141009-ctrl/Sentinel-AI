import numpy as np
from backend.modules.motion_filter import motion_filter
from backend.modules.cluster_manager import cluster_manager

def test_motion_gate():
    print("Testing MotionGateFilter...")
    # 1. Blank static frames
    frame1 = np.full((720, 1280, 3), 50, dtype=np.uint8)
    should1, _ = motion_filter.should_infer(frame1)
    assert should1 == True, "First frame should always infer"

    # Second identical frame -> should skip!
    frame2 = np.full((720, 1280, 3), 50, dtype=np.uint8)
    should2, score2 = motion_filter.should_infer(frame2)
    assert should2 == False, f"Static empty frame should be skipped! Got {should2}"

    # Third frame with simulated car movement
    frame3 = frame2.copy()
    frame3[200:400, 300:600] = 220 # Simulated vehicle
    should3, score3 = motion_filter.should_infer(frame3)
    assert should3 == True, f"Moving vehicle frame must trigger inference! Got {should3}"
    print("✅ MotionGateFilter successfully skipped static background and detected moving vehicle.")

def test_cluster_telemetry():
    print("Testing ClusterManager for 80,000 cameras...")
    overview = cluster_manager.get_cluster_overview()
    assert overview["total_registered_cameras"] >= 80000, f"Expected >= 80k cams, got {overview['total_registered_cameras']}"
    assert overview["district_pops_active"] == 33, f"Expected 33 district PoPs, got {overview['district_pops_active']}"
    assert overview["bandwidth_metrics"]["bandwidth_reduction_pct"] > 99.0
    assert overview["latency_sla"]["end_to_end_alert_dispatch_ms"] < 50.0
    print(f"✅ Cluster telemetry verified: {overview['total_registered_cameras']} cams, {overview['bandwidth_metrics']['bandwidth_reduction_pct']}% bandwidth saved.")

if __name__ == "__main__":
    test_motion_gate()
    test_cluster_telemetry()
    print("🎉 80K SCALABILITY & MOTION-GATE CHECKS PASSED CLEANLY!")
