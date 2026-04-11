"""SQLAlchemy ORM models matching the design spec tables."""

from __future__ import annotations

import uuid
from datetime import date  # noqa: F401

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Text,
    func,
)
from sqlalchemy.orm import DeclarativeBase, relationship


def _uuid() -> str:
    return str(uuid.uuid4())


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id = Column(Text, primary_key=True, default=_uuid)
    email = Column(Text, unique=True, index=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    name = Column(Text, nullable=False)
    llm_provider = Column(Text, nullable=True)
    llm_api_key_encrypted = Column(Text, nullable=True)
    llm_model = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    trips = relationship("Trip", back_populates="user", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="user", cascade="all, delete-orphan")


class Trip(Base):
    __tablename__ = "trips"

    id = Column(Text, primary_key=True, default=_uuid)
    user_id = Column(Text, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    slug = Column(Text, nullable=False)
    destination = Column(Text, nullable=False)
    origin = Column(Text, nullable=False)
    depart_date = Column(Date, nullable=True)
    return_date = Column(Date, nullable=True)
    duration_days = Column(Integer, nullable=True)
    travelers_json = Column(Text, nullable=True)  # JSON string
    preferences_json = Column(Text, nullable=True)  # JSON string
    status = Column(Text, nullable=False, default="planning")
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User", back_populates="trips")
    items = relationship("TripItem", back_populates="trip", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="trip", cascade="all, delete-orphan")
    itinerary_days = relationship("ItineraryDay", back_populates="trip", cascade="all, delete-orphan")


class TripItem(Base):
    __tablename__ = "trip_items"

    id = Column(Text, primary_key=True, default=_uuid)
    trip_id = Column(Text, ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    category = Column(Text, nullable=False)  # flight / hotel / restaurant / attraction
    data_json = Column(Text, nullable=True)  # Full item object as JSON string
    is_selected = Column(Boolean, nullable=False, default=False)
    source_url = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    trip = relationship("Trip", back_populates="items")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Text, primary_key=True, default=_uuid)
    trip_id = Column(Text, ForeignKey("trips.id", ondelete="CASCADE"), nullable=True)
    user_id = Column(Text, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(Text, nullable=False)  # user / assistant / system
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="chat_messages")
    trip = relationship("Trip", back_populates="chat_messages")


class ItineraryDay(Base):
    __tablename__ = "itinerary_days"

    id = Column(Text, primary_key=True, default=_uuid)
    trip_id = Column(Text, ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    day_number = Column(Integer, nullable=False)
    date = Column(Date, nullable=True)
    theme = Column(Text, nullable=True)
    subtitle = Column(Text, nullable=True)
    activities_json = Column(Text, nullable=True)  # JSON array as string
    is_flight_day = Column(Boolean, nullable=False, default=False)

    trip = relationship("Trip", back_populates="itinerary_days")
