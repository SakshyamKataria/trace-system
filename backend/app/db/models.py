from sqlalchemy import Column, Integer, String, DateTime
from app.db.database import Base


class BuildMetadata(Base):
    __tablename__ = "build_metadata"

    id = Column(Integer, primary_key=True, index=True)

    build_id = Column(String, unique=True, index=True, nullable=False)
    project = Column(String, index=True, nullable=False)
    branch = Column(String, nullable=False)
    commit_id = Column(String, nullable=False)

    status = Column(String, index=True, nullable=False)

    timestamp = Column(DateTime, index=True, nullable=False)

    log_path = Column(String, nullable=False)