from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON, ForeignKey, Text
from sqlalchemy.sql import func
from backend.database import Base


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(64), unique=True, nullable=False)
    label = Column(String(128), nullable=False)
    color = Column(String(7), default="#2563eb")
    icon = Column(String(32), default="🛡️")
    allowed_camera_view = Column(Boolean, default=True)
    can_view_all = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "label": self.label,
            "color": self.color,
            "icon": self.icon,
            "allowed_camera_view": self.allowed_camera_view,
            "can_view_all": self.can_view_all,
        }


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(64), unique=True, nullable=False)
    permissions = Column(JSON, default=[])
    description = Column(String(255))

    created_at = Column(DateTime(timezone=True), server_default=func.now())


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(64), unique=True, nullable=False, index=True)
    email = Column(String(128), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(128))
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True, index=True)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
    assigned_cameras = Column(JSON, default=[])

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "full_name": self.full_name,
            "is_active": self.is_active,
            "is_admin": self.is_admin,
            "department_id": self.department_id,
            "role_id": self.role_id,
            "assigned_cameras": self.assigned_cameras,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Token(Base):
    __tablename__ = "tokens"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    token = Column(String(512), unique=True, nullable=False)
    token_type = Column(String(32), default="access")
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_revoked = Column(Boolean, default=False)
    ip_address = Column(String(45))
    user_agent = Column(String(255))

    created_at = Column(DateTime(timezone=True), server_default=func.now())