from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from backend.database import Base
from backend.models.user import User, Department, Role, Token

__all__ = ["User", "Department", "Role", "Token", "Permission", "UserPermission"]


class Permission(Base):
    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    resource = Column(String(64), nullable=False)
    action = Column(String(32), nullable=False)
    description = Column(String(255))


class UserPermission(Base):
    __tablename__ = "user_permissions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    permission_id = Column(Integer, ForeignKey("permissions.id"), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
