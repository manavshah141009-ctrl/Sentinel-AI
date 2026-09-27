from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text
from sqlalchemy.dialects.postgresql import ARRAY, INET
from sqlalchemy.sql import func
from backend.database import Base


class Camera(Base):
    __tablename__ = "cameras"

    id = Column(Integer, primary_key=True, autoincrement=True)
    cam_code = Column(String(32), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    department = Column(String(32), nullable=False, index=True)
    department_label = Column(String(128), nullable=False)
    location = Column(String(255), nullable=False)
    district = Column(String(64), nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    codec = Column(String(16), default="h264")
    resolution = Column(String(32), default="1920x1080")
    declared_fps = Column(Integer, default=25)
    bitrate_kbps = Column(Integer, default=4096)
    live = Column(Boolean, default=True)
    vms_vendor = Column(String(64), default="Generic RTSP")
    rtsp_url = Column(Text, default="")
    hls_url = Column(Text, default="")
    stream_path = Column(String(128), default="")
    owner_department = Column(String(32), default="Police")

    geo_point = Column(String(128), default="")

    status = Column(String(32), default="online")
    last_seen = Column(DateTime, nullable=True)
    uptime_percentage = Column(Float, default=100.0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())



    def to_dict(self):
        return {
            "id": self.id,
            "cam_code": self.cam_code,
            "name": self.name,
            "department": self.department,
            "department_label": self.department_label,
            "location": self.location,
            "district": self.district,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "codec": self.codec,
            "resolution": self.resolution,
            "declared_fps": self.declared_fps,
            "bitrate_kbps": self.bitrate_kbps,
            "live": self.live,
            "vms_vendor": self.vms_vendor,
            "rtsp_url": self.rtsp_url,
            "hls_url": self.hls_url,
            "stream_path": self.stream_path,
            "status": self.status,
            "last_seen": self.last_seen.isoformat() if self.last_seen else None,
            "uptime_percentage": self.uptime_percentage,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class CameraMetadata(Base):
    __tablename__ = "camera_metadata"

    id = Column(Integer, primary_key=True, autoincrement=True)
    camera_id = Column(Integer, nullable=False, index=True)
    key = Column(String(128), nullable=False)
    value = Column(Text)
    metadata_type = Column(String(32), default="custom")

    created_at = Column(DateTime(timezone=True), server_default=func.now())


class CameraHealth(Base):
    __tablename__ = "camera_health"

    id = Column(Integer, primary_key=True, autoincrement=True)
    camera_id = Column(Integer, nullable=False, index=True)
    status = Column(String(32), default="online")
    latency_ms = Column(Float, default=0.0)
    last_packet_time = Column(DateTime, nullable=True)
    stream_uptime = Column(Float, default=100.0)
    error_count = Column(Integer, default=0)

    checked_at = Column(DateTime(timezone=True), server_default=func.now())