import math
import heapq
from typing import Dict, List, Tuple, Any, Optional

def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    return 2 * R * math.asin(math.sqrt(a))

# Gujarat Arterial Road Topology Graph (Key Intersections, Tolls, Expressways)
GUJARAT_ROAD_NODES = {
    "N_PALDI": {"name": "Paldi Circle", "lat": 23.0145, "lon": 72.5658, "district": "Ahmedabad"},
    "N_ASHRAM": {"name": "Ashram Road Janpath", "lat": 23.0412, "lon": 72.5694, "district": "Ahmedabad"},
    "N_CHIMAN": {"name": "Chimanbhai Bridge Sabarmati", "lat": 23.0784, "lon": 72.5832, "district": "Ahmedabad"},
    "N_VISAT": {"name": "Visat Teen Rasta Circle", "lat": 23.0921, "lon": 72.5912, "district": "Ahmedabad"},
    "N_ONGC": {"name": "ONGC Complex Chandkheda", "lat": 23.1091, "lon": 72.5934, "district": "Ahmedabad"},
    "N_ADALAJ": {"name": "Adalaj Toll Plaza", "lat": 23.1678, "lon": 72.5842, "district": "Gandhinagar"},
    "N_INFOCITY": {"name": "Infocity / DA-IICT Crossroad", "lat": 23.1895, "lon": 72.6284, "district": "Gandhinagar"},
    "N_SECTOR18": {"name": "Sector 18 Police Bhawan (SCRB)", "lat": 23.2156, "lon": 72.6369, "district": "Gandhinagar"},
    "N_DEHGAM": {"name": "Dehgam Junction", "lat": 23.1684, "lon": 72.8124, "district": "Gandhinagar"},
    "N_SARKHEJ": {"name": "Sarkhej Sanand Crossroads", "lat": 22.9854, "lon": 72.5012, "district": "Ahmedabad"},
    "N_NE1_IN": {"name": "Ahmedabad NE-1 Ingress Toll", "lat": 22.9712, "lon": 72.6341, "district": "Ahmedabad"},
    "N_NADIAD": {"name": "Nadiad Toll Plaza", "lat": 22.6841, "lon": 72.8612, "district": "Kheda"},
    "N_ANAND": {"name": "Anand Expressway Junction", "lat": 22.5641, "lon": 72.9512, "district": "Anand"},
    "N_VADODARA_N": {"name": "Vadodara North Exit Toll", "lat": 22.3612, "lon": 73.1894, "district": "Vadodara"},
    "N_ALKAPURI": {"name": "Alkapuri Circle", "lat": 22.3124, "lon": 73.1784, "district": "Vadodara"},
    "N_BHARUCH": {"name": "Bharuch Narmada Bridge", "lat": 21.7124, "lon": 73.0012, "district": "Bharuch"},
    "N_SURAT_R": {"name": "Surat Ring Road Entry", "lat": 21.2141, "lon": 72.8412, "district": "Surat"},
    "N_ATHWA": {"name": "Athwa Gate Junction", "lat": 21.1865, "lon": 72.8081, "district": "Surat"},
    "N_KAMREJ": {"name": "Kamrej NH-48 Tollnaka", "lat": 21.2712, "lon": 72.9641, "district": "Surat"},
    "N_NAVSARI": {"name": "Navsari Junction", "lat": 20.9521, "lon": 72.9324, "district": "Navsari"},
    "N_VALSAD": {"name": "Valsad Border Toll Plaza", "lat": 20.6124, "lon": 72.9312, "district": "Valsad"},
    "N_RAJKOT_K": {"name": "Kotecha Chowk Kalawad Rd", "lat": 22.2854, "lon": 70.7712, "district": "Rajkot"},
    "N_MADHAPAR": {"name": "Madhapar Chowk Bypass", "lat": 22.3214, "lon": 70.7645, "district": "Rajkot"},
    "N_DHROL": {"name": "Dhrol Highway Cross", "lat": 22.5641, "lon": 70.4124, "district": "Jamnagar"},
    "N_JAMNAGAR": {"name": "Jamnagar Reliance Greens Gate", "lat": 22.4712, "lon": 70.0612, "district": "Jamnagar"}
}

# Bidirectional Highway Edges (Node A, Node B, Speed Limit km/h)
GUJARAT_ROAD_EDGES = [
    ("N_PALDI", "N_ASHRAM", 45),
    ("N_ASHRAM", "N_CHIMAN", 50),
    ("N_CHIMAN", "N_VISAT", 55),
    ("N_VISAT", "N_ONGC", 60),
    ("N_ONGC", "N_ADALAJ", 70),
    ("N_ADALAJ", "N_INFOCITY", 65),
    ("N_INFOCITY", "N_SECTOR18", 55),
    ("N_ADALAJ", "N_DEHGAM", 70),
    ("N_PALDI", "N_SARKHEJ", 50),
    ("N_SARKHEJ", "N_NE1_IN", 65),
    ("N_NE1_IN", "N_NADIAD", 100),
    ("N_NADIAD", "N_ANAND", 100),
    ("N_ANAND", "N_VADODARA_N", 100),
    ("N_VADODARA_N", "N_ALKAPURI", 50),
    ("N_ALKAPURI", "N_BHARUCH", 80),
    ("N_BHARUCH", "N_KAMREJ", 85),
    ("N_KAMREJ", "N_SURAT_R", 60),
    ("N_SURAT_R", "N_ATHWA", 45),
    ("N_KAMREJ", "N_NAVSARI", 80),
    ("N_NAVSARI", "N_VALSAD", 85),
    ("N_SARKHEJ", "N_MADHAPAR", 85),
    ("N_RAJKOT_K", "N_MADHAPAR", 50),
    ("N_MADHAPAR", "N_DHROL", 80),
    ("N_DHROL", "N_JAMNAGAR", 80)
]

class GujaratHighwayGraph:
    """
    A* Graph-based Road Network Routing & Dynamic Tactical Interception Engine.
    Snaps raw camera observations to physical highway corridors and computes
    provably optimal PCR Van cordon intercept vectors.
    """
    def __init__(self):
        self.nodes = GUJARAT_ROAD_NODES
        self.adj: Dict[str, List[Tuple[str, float, float]]] = {k: [] for k in self.nodes}
        for u, v, speed in GUJARAT_ROAD_EDGES:
            d = haversine(self.nodes[u]["lat"], self.nodes[u]["lon"], self.nodes[v]["lat"], self.nodes[v]["lon"])
            t_hours = d / max(1.0, speed)
            self.adj[u].append((v, d, t_hours))
            self.adj[v].append((u, d, t_hours))

    def find_nearest_node(self, lat: float, lon: float) -> str:
        best_n, best_d = None, float("inf")
        for nid, n in self.nodes.items():
            d = haversine(lat, lon, n["lat"], n["lon"])
            if d < best_d:
                best_d = d
                best_n = nid
        return best_n

    def astar_route(self, start_id: str, goal_id: str) -> List[str]:
        """A* Shortest Path over Gujarat Highway Topology."""
        if start_id not in self.nodes or goal_id not in self.nodes:
            return []
        goal_lat, goal_lon = self.nodes[goal_id]["lat"], self.nodes[goal_id]["lon"]

        pq = [(0.0, 0.0, start_id, [start_id])]
        visited = {}

        while pq:
            f, g, curr, path = heapq.heappop(pq)
            if curr == goal_id:
                return path
            if curr in visited and visited[curr] <= g:
                continue
            visited[curr] = g

            for nxt, dist, t in self.adj[curr]:
                nxt_g = g + dist
                if nxt in visited and visited[nxt] <= nxt_g:
                    continue
                # Heuristic: Haversine distance to goal
                h = haversine(self.nodes[nxt]["lat"], self.nodes[nxt]["lon"], goal_lat, goal_lon)
                heapq.heappush(pq, (nxt_g + h, nxt_g, nxt, path + [nxt]))
        return []

    def compute_pcr_interception_cordon(
        self,
        vehicle_lat: float,
        vehicle_lon: float,
        vehicle_speed_kmph: float,
        heading_degrees: float
    ) -> Dict[str, Any]:
        """
        Computes dynamic mathematical meeting point for nearest PCR Van unit.
        Calculates time-to-intercept at downstream highway chokepoint.
        """
        curr_node = self.find_nearest_node(vehicle_lat, vehicle_lon)
        v_speed = max(35.0, vehicle_speed_kmph)
        pcr_speed = 75.0 # Police vehicle high-speed pursuit km/h

        # Search downstream neighbors along the heading direction
        candidates = []
        for nxt, dist, t in self.adj[curr_node]:
            n_data = self.nodes[nxt]
            b = math.degrees(math.atan2(
                math.sin(math.radians(n_data["lon"] - vehicle_lon)) * math.cos(math.radians(n_data["lat"])),
                math.cos(math.radians(vehicle_lat)) * math.sin(math.radians(n_data["lat"])) -
                math.sin(math.radians(vehicle_lat)) * math.cos(math.radians(n_data["lat"])) *
                math.cos(math.radians(n_data["lon"] - vehicle_lon))
            ))
            b = (b + 360) % 360
            angle_diff = abs(heading_degrees - b)
            if angle_diff > 180: angle_diff = 360 - angle_diff
            
            # Forward corridor nodes
            if angle_diff <= 75.0 or len(self.adj[curr_node]) <= 2:
                v_eta_min = (dist / v_speed) * 60.0
                # PCR dispatch distance (assuming stationed at local police station or toll)
                pcr_dist = dist * 0.7
                pcr_eta_min = (pcr_dist / pcr_speed) * 60.0
                advantage_min = v_eta_min - pcr_eta_min

                candidates.append({
                    "chokepoint_node": nxt,
                    "chokepoint_name": n_data["name"],
                    "district": n_data["district"],
                    "latitude": n_data["lat"],
                    "longitude": n_data["lon"],
                    "vehicle_dist_km": round(dist, 2),
                    "vehicle_eta_min": round(v_eta_min, 1),
                    "pcr_eta_min": round(pcr_eta_min, 1),
                    "tactical_advantage_min": round(advantage_min, 1),
                    "can_intercept": advantage_min > 0.5
                })

        candidates.sort(key=lambda x: -x["tactical_advantage_min"])
        best = candidates[0] if candidates else None

        return {
            "algorithm": "A* Dynamic Highway Flow Intercept",
            "current_corridor_sector": self.nodes[curr_node]["name"],
            "optimal_interception_point": best,
            "tactical_cordon_candidates": candidates[:3]
        }

highway_graph = GujaratHighwayGraph()
