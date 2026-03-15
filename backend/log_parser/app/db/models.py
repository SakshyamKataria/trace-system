"""
SQLAlchemy models for TRACE integration.

- BuildMetadata: read-only, populated by the backend.
- ParsedLogEvent: written by this parser.
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base


class BuildMetadata(Base):
    """Existing table populated by the TRACE backend. Read-only for the parser."""
    __tablename__ = "build_metadata"

    id        = Column(Integer, primary_key=True, index=True)
    build_id  = Column(String, unique=True, nullable=False, index=True)
    project   = Column(String)
    branch    = Column(String)
    commit_id = Column(String)
    status    = Column(String)           # "success" or "failure"
    timestamp = Column(DateTime)
    log_path  = Column(String)           # e.g. "minio://trace-logs/build-abc-123.log"

    events = relationship("ParsedLogEvent", back_populates="build")


class ParsedLogEvent(Base):
    """Table written by the parser — one row per log line event."""
    __tablename__ = "parsed_log_events"

    id         = Column(Integer, primary_key=True, index=True)
    build_id   = Column(String, ForeignKey("build_metadata.build_id"), nullable=False, index=True)
    event_time = Column(DateTime, nullable=True)
    stage      = Column(String, nullable=True)
    level      = Column(String, nullable=False)   # INFO | WARN | ERROR
    message    = Column(String, nullable=False)

    build = relationship("BuildMetadata", back_populates="events")
