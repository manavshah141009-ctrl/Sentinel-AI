from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, Float
from sqlalchemy.sql import func
from backend.database import Base


class WatchlistEntry(Base):
    __tablename__ = "watchlist"

    id = Column(Integer, primary_key=True, autoincrement=True)
    plate_number = Column(String(32), nullable=False, unique=True, index=True)
    display_plate = Column(String(32), nullable=False)
    category = Column(String(64), nullable=False, index=True)
    severity = Column(String(32), default="HIGH", index=True)
    vehicle_make = Column(String(64))
    vehicle_model = Column(String(64))
    vehicle_color = Column(String(64))
    fir_number = Column(String(64), index=True)
    police_station = Column(String(255))
    incident_date = Column(String(32))
    owner_name = Column(String(128))
    alert_message = Column(Text)
    action_required = Column(Text)
    source_db = Column(String(32), default="egujcop")
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def to_dict(self):
        return {
            "plate_number": self.plate_number,
            "display_plate": self.display_plate,
            "category": self.category,
            "severity": self.severity,
            "vehicle_make": self.vehicle_make,
            "vehicle_model": self.vehicle_model,
            "vehicle_color": self.vehicle_color,
            "fir_number": self.fir_number,
            "police_station": self.police_station,
            "incident_date": self.incident_date,
            "owner_name": self.owner_name,
            "alert_message": self.alert_message,
            "action_required": self.action_required,
            "source_db": self.source_db,
            "is_active": self.is_active,
        }


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    alert_id = Column(String(64), unique=True, index=True)
    timestamp = Column(DateTime(timezone=True), nullable=False)
    matched_plate = Column(String(32), nullable=False)
    category = Column(String(64))
    severity = Column(String(32))
    vehicle_info = Column(String(255))
    fir_number = Column(String(64))
    police_station = Column(String(255))
    owner_name = Column(String(128))
    alert_message = Column(Text)
    action_required = Column(Text)
    camera_id = Column(Integer)
    camera_name = Column(String(255))
    location = Column(String(255))
    district = Column(String(64))
    latitude = Column(Float)
    longitude = Column(Float)
    is_acknowledged = Column(Boolean, default=False)
    acknowledged_at = Column(DateTime, nullable=True)
    dispatched = Column(Boolean, default=False)
    dispatched_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def to_dict(self):
        return {
            "alert_id": self.alert_id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "matched_plate": self.matched_plate,
            "category": self.category,
            "severity": self.severity,
            "vehicle_info": self.vehicle_info,
            "fir_number": self.fir_number,
            "police_station": self.police_station,
            "owner_name": self.owner_name,
            "alert_message": self.alert_message,
            "action_required": self.action_required,
            "camera_id": self.camera_id,
            "camera_name": self.camera_name,
            "location": self.location,
            "district": self.district,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "is_acknowledged": self.is_acknowledged,
            "dispatched": self.dispatched,
        }