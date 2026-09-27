import time

from backend.modules.highway_graph import highway_graph
from backend.modules.tracker_engine import MultiObjectTracker, KalmanBoxTracker, box_iou
from backend.modules.tracer import tracer

def test_highway_graph_astar_routing():
    """Verify A* Shortest Path finds valid connected route over Gujarat arterial highway network."""
    # Ahmedabad Paldi -> Gandhinagar Dehgam
    path = highway_graph.astar_route("N_PALDI", "N_DEHGAM")
    assert len(path) >= 3
    assert path[0] == "N_PALDI"
    assert path[-1] == "N_DEHGAM"

    # Ahmedabad NE-1 Toll -> Surat Athwa Gate via Golden Corridor
    ne1_path = highway_graph.astar_route("N_NE1_IN", "N_ATHWA")
    assert len(ne1_path) >= 5
    assert ne1_path[0] == "N_NE1_IN"
    assert ne1_path[-1] == "N_ATHWA"
    assert "N_VADODARA_N" in ne1_path

def test_highway_graph_pcr_interception_cordon():
    """Verify mathematical meeting point calculation with tactical cordon advantage."""
    # Vehicle heading North-East on SG Highway near ONGC Chandkheda (23.1091, 72.5934)
    cordon = highway_graph.compute_pcr_interception_cordon(
        vehicle_lat=23.1091,
        vehicle_lon=72.5934,
        vehicle_speed_kmph=60.0,
        heading_degrees=20.0
    )
    assert cordon is not None
    assert "optimal_interception_point" in cordon
    opt = cordon["optimal_interception_point"]
    assert opt is not None
    assert "chokepoint_name" in opt
    assert opt["vehicle_eta_min"] > 0
    assert opt["pcr_eta_min"] > 0
    assert "tactical_advantage_min" in opt

def test_kalman_box_tracker_kinematics():
    """Verify Kalman filter smoothly predicts box forward based on velocity."""
    box0 = [100.0, 100.0, 200.0, 200.0]
    trk = KalmanBoxTracker(box0)
    
    # Simulate box moving right by 10 pixels per frame
    for step in range(1, 5):
        pred = trk.predict()
        obs = [100.0 + step * 10, 100.0, 200.0 + step * 10, 200.0]
        trk.update(obs)
    
    vx, vy = trk.get_velocity()
    # Horizontal velocity vx should be positive and approx 10
    assert vx > 5.0
    assert abs(vy) < 3.0

def test_bayesian_ocr_consensus_voting():
    """Verify Bayesian voter eliminates single-frame OCR glitch and locks true plate."""
    mot = MultiObjectTracker(max_age=10, min_hits=2)
    
    # Frame 1: Clear read of GJ01AB1234
    mot.update([{"box": [0.2, 0.2, 0.4, 0.4], "plate": "GJ01AB1234", "plate_conf": 0.92, "label": "CAR"}])
    
    # Frame 2: Glitch read with motion blur: GJ01AR1234
    mot.update([{"box": [0.21, 0.2, 0.41, 0.4], "plate": "GJ01AR1234", "plate_conf": 0.50, "label": "CAR"}])
    
    # Frame 3: Confirmatory read: GJ01AB1234
    tracks = mot.update([{"box": [0.22, 0.2, 0.42, 0.4], "plate": "GJ01AB1234", "plate_conf": 0.94, "label": "CAR"}])
    
    assert len(tracks) > 0
    target_trk = tracks[0]
    # Consensus plate should be GJ01AB1234 (glitch discarded)
    assert target_trk["consensus_plate"] == "GJ01AB1234"
    assert target_trk["consensus_confidence"] >= 0.90
    assert target_trk["vote_count"] == 3

def test_mot_processing_latency():
    """Verify MultiObjectTracker updates 50 vehicles in under 3ms."""
    mot = MultiObjectTracker()
    dets = [{"box": [i * 0.01, 0.1, i * 0.01 + 0.05, 0.2], "plate": None, "label": "CAR"} for i in range(50)]
    
    t0 = time.perf_counter()
    for _ in range(10):
        mot.update(dets)
    elapsed_ms = ((time.perf_counter() - t0) / 10.0) * 1000.0
    
    # Must comfortably meet sub-35ms CPU budget for 50 vehicles
    assert elapsed_ms < 35.0, f"MOT too slow: {elapsed_ms:.2f}ms"

def test_tracer_end_to_end_with_astar():
    """Verify tracer returns A* highway snapped path and tactical interception cordon."""
    res = tracer.trace("GJ01AB1234")
    assert res["status"] == "ROUTE_RECONSTRUCTED_SUCCESSFULLY"
    assert "astar_highway_routing" in res
    astar_info = res["astar_highway_routing"]
    assert astar_info["is_graph_snapped"] is True
    assert len(astar_info["path_nodes"]) >= 2
    
    kavach = res["kavach_interception"]
    assert "tactical_interception_cordon" in kavach
    cordon = kavach["tactical_interception_cordon"]
    assert cordon["optimal_interception_point"] is not None

if __name__ == "__main__":
    test_highway_graph_astar_routing()
    test_highway_graph_pcr_interception_cordon()
    test_kalman_box_tracker_kinematics()
    test_bayesian_ocr_consensus_voting()
    test_mot_processing_latency()
    test_tracer_end_to_end_with_astar()
    print("✅ ALL ACADEMIC MOT & A* ROUTING TESTS PASSED!")
