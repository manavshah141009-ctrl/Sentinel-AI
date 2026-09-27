from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from backend.database import Base


class StreamSession(Base):
    __tablename__ = "stream_sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    camera_id = Column(Integer, nullable=False, index=True)
    session_id = Column(String(64), unique=True, nullable=False)
    stream_url = Column(Text)
    protocol = Column(String(16), default="rtsp")
    status = Column(String(32), default="active")
    started_at = Column(DateTime(timezone=True), nullable=False)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    duration_seconds = Column(Float, default=0.0)
    bitrate_kbps = Column(Integer, default=4096)
    frames_decoded = Column(Integer, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "camera_id": self.camera_id,
            "session_id": self.session_id,
            "stream_url": self.stream_url,
            "protocol": self.protocol,
            "status": self.status,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "ended_at": self.ended_at.isoformat() if self.ended_at else None,
            "duration_seconds": self.duration_seconds,
            "bitrate_kbps": self.bitrate_kbps,
            "frames_decoded": self.frames_decoded,
        }