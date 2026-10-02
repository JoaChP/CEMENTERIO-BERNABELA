from datetime import date, datetime, timezone
import uuid

from sqlalchemy import Date, DateTime, String, Text, Float, Boolean, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Administrator(Base):
    __tablename__ = "administrators"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(200), default='', nullable=False)
    role: Mapped[str] = mapped_column(String(20), default='administrator', nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    session_version: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)


class Deceased(Base):
    __tablename__ = "deceased"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    full_name: Mapped[str] = mapped_column(String(200), index=True, nullable=False)
    known_as: Mapped[str | None] = mapped_column(String(200), nullable=True)
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    date_of_death: Mapped[date] = mapped_column(Date, nullable=False)
    burial_date: Mapped[date] = mapped_column(Date, nullable=False)
    sector: Mapped[str] = mapped_column(String(120), nullable=False)
    row: Mapped[str | None] = mapped_column(String(120), nullable=True)
    grave_number: Mapped[str | None] = mapped_column(String(120), nullable=True)
    map_x: Mapped[float | None] = mapped_column(Float, nullable=True)
    map_y: Mapped[float | None] = mapped_column(Float, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)


class AuditLog(Base):
    __tablename__ = 'audit_logs'
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    actor_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    actor_username: Mapped[str] = mapped_column(String(80), nullable=False)
    action: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    entity_type: Mapped[str] = mapped_column(String(20), nullable=False)
    entity_id: Mapped[str] = mapped_column(String(36), nullable=False)
    entity_name: Mapped[str] = mapped_column(String(200), nullable=False)
    before: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    after: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True, nullable=False)
