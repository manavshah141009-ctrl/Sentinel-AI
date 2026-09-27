from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, JSON
from sqlalchemy.sql import func
from backend.database import Base


class VehicleObservation(Base):
    __tablename__ = "vehicle_observations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    observation_id = Column(String(64), unique=True, index=True)
    
    camera_id = Column(Integer, nullable=False, index=True)
    camera_name = Column(String(255))
    location = Column(String(255))
    
    # Timing
    timestamp = Column(DateTime(timezone=True), nullable=False)
    pts_timestamp = Column(Float, nullable=True) # PTS from video stream
    
    # Vehicle features
    vehicle_track_id = Column(String(64), index=True)
    vehicle_type = Column(String(64))
    vehicle_confidence = Column(Float)
    vehicle_bbox = Column(JSON)
    
    # Plate features
    plate_number = Column(String(32), index=True)
    plate_confidence = Column(Float)
    plate_bbox = Column(JSON)
    
    # Images (paths or URLs)
    vehicle_image_url = Column(Text)
    plate_image_url = Column(Text)
    
    # OCR and Model versions
    model_version = Column(String(64))
    ocr_version = Column(String(64))
    
    # Watchlist
    is_watchlist_alert = Column(Boolean, default=False)
    
    # GIS
    latitude = Column(Float)
    longitude = Column(Float)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def to_dict(self):
        return {
            "observation_id": self.observation_id,
            "camera_id": self.camera_id,
            "camera_name": self.camera_name,
            "location": self.location,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "pts_timestamp": self.pts_timestamp,
            "vehicle_track_id": self.vehicle_track_id,
            "vehicle_type": self.vehicle_type,
            "vehicle_confidence": self.vehicle_confidence,
            "vehicle_bbox": self.vehicle_bbox,
            "plate_number": self.plate_number,
            "plate_confidence": self.plate_confidence,
            "plate_bbox": self.plate_bbox,
            "vehicle_image_url": self.vehicle_image_url,
            "plate_image_url": self.plate_image_url,
            "model_version": self.model_version,
            "ocr_version": self.ocr_version,
            "is_watchlist_alert": self.is_watchlist_alert,
            "latitude": self.latitude,
            "longitude": self.longitude,
        }


class Journey(Base):
    __tablename__ = "journeys"

    id = Column(Integer, primary_key=True, autoincrement=True)
    plate_number = Column(String(32), nullable=False, index=True)
    normalized_plate = Column(String(32), nullable=False, unique=True, index=True)
    query_plate = Column(String(32), nullable=False)
    is_watchlist_match = Column(Boolean, default=False)
    total_checkpoints = Column(Integer, default=0)
    total_distance_km = Column(Float, default=0.0)
    first_seen_location = Column(String(255))
    last_seen_location = Column(String(255))
    first_seen_timestamp = Column(DateTime(timezone=True))
    last_seen_timestamp = Column(DateTime(timezone=True))
    watchlist_info = Column(Text)
    status = Column(String(64), default="ROUTE_RECONSTRUCTED")

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "query_plate": self.query_plate,
            "normalized_plate": self.normalized_plate,
            "is_watchlist_match": self.is_watchlist_match,
            "total_checkpoints": self.total_checkpoints,
            "total_distance_km": self.total_distance_km,
            "first_sighted": {
                "location": self.first_seen_location,
                "timestamp": self.first_seen_timestamp.isoformat() if self.first_seen_timestamp else None,
            },
            "last_sighted": {
                "location": self.last_seen_location,
                "timestamp": self.last_seen_timestamp.isoformat() if self.last_seen_timestamp else None,
            },
            "status": self.status,
        }


class Waypoint(Base):
    __tablename__ = "waypoints"

    id = Column(Integer, primary_key=True, autoincrement=True)
    journey_id = Column(Integer, ForeignKey("journeys.id"), nullable=False, index=True)
    step = Column(Integer, nullable=False)
    camera_id = Column(Integer)
    camera_name = Column(String(255))
    location = Column(String(255))
    district = Column(String(64))
    department = Column(String(32))
    latitude = Column(Float)
    longitude = Column(Float)
    timestamp = Column(DateTime(timezone=True), nullable=False)
    confidence = Column(Float, default=0.95)
    speed_kmph = Column(Integer)
    lane = Column(String(32))
    direction = Column(String(128))
    image_url = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def to_dict(self):
        return {
            "step": self.step,
            "camera_id": self.camera_id,
            "camera_name": self.camera_name,
            "location": self.location,
            "district": self.district,
            "department": self.department,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "confidence": self.confidence,
            "speed_kmph": self.speed_kmph,
            "lane": self.lane,
            "direction": self.direction,
            "image_url": self.image_url,
        }