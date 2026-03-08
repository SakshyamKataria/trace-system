import time
from fastapi import FastAPI, HTTPException, Query
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from app.db.database import engine, Base, SessionLocal
from app.db.models import BuildMetadata
from app.services.redis_queue import enqueue_log
from app.schemas import LogIngestRequest, BuildResponse


app = FastAPI(title="TRACE Backend")


# -----------------------------
# Database Startup Handling
# -----------------------------
def wait_for_database():
    while True:
        try:
            Base.metadata.create_all(bind=engine)
            print("Database ready.")
            return
        except OperationalError:
            print("Waiting for PostgreSQL (backend)...")
            time.sleep(2)


@app.on_event("startup")
def startup_event():
    wait_for_database()


# -----------------------------
# Dependency
# -----------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# -----------------------------
# Health Check
# -----------------------------
@app.get("/health")
def health():
    return {"status": "ok"}


# -----------------------------
# Ingest Endpoint (Versioned)
# -----------------------------
@app.post("/api/v1/ingest-log")
def ingest_log(payload: LogIngestRequest):
    try:
        data = payload.model_dump()

        # Convert datetime to ISO string for Redis
        data["timestamp"] = data["timestamp"].isoformat()

        enqueue_log(data)

        return {"message": "Log queued successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -----------------------------
# GET All Builds (Paginated)
# -----------------------------
@app.get("/api/v1/builds", response_model=List[BuildResponse])
def get_builds(
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    db: Session = SessionLocal()

    builds = (
        db.query(BuildMetadata)
        .order_by(BuildMetadata.timestamp.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    db.close()
    return builds


# -----------------------------
# GET Single Build
# -----------------------------
@app.get("/api/v1/builds/{build_id}", response_model=BuildResponse)
def get_build(build_id: str):
    db: Session = SessionLocal()

    build = db.query(BuildMetadata).filter_by(build_id=build_id).first()
    db.close()

    if not build:
        raise HTTPException(status_code=404, detail="Build not found")

    return build