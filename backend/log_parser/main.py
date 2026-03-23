import os
import sys

from dotenv import load_dotenv

# Load .env BEFORE importing other modules so env vars are available
load_dotenv()

import parser.log_parser as log_parser
from storage.minio_client import fetch_log, upload_raw_log
from app.db.database import Base, engine, SessionLocal
from app.db.models import BuildMetadata, ParsedLogEvent


# ═══════════════════════════════════════════════════════════════════════════════
# TRACE flow — parse by build_id
# ═══════════════════════════════════════════════════════════════════════════════

def parse_build(build_id: str):
    """
    Full TRACE pipeline:
      1. Look up build_id in build_metadata
      2. Fetch the raw log from MinIO
      3. Parse the log content
      4. Insert parsed events into parsed_log_events
    """

    # Ensure the parsed_log_events table exists
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # ── Step 1: Verify / auto-register build_id in build_metadata ────────
        print("\n══════════════════════════════════════════")
        print("  Step 1 ▸ Looking up build metadata")
        print("══════════════════════════════════════════")
        build = db.query(BuildMetadata).filter_by(build_id=build_id).first()
        if not build:
            print(f"  [INFO] build_id '{build_id}' not found in build_metadata.")
            print(f"  [INFO] Auto-registering a placeholder record (manual MinIO upload detected).")
            from datetime import datetime as _dt
            build = BuildMetadata(
                build_id  = build_id,
                project   = "MANUAL",
                branch    = "unknown",
                commit_id = "unknown",
                status    = "unknown",
                timestamp = _dt.utcnow(),
                log_path  = f"minio://trace-logs/{build_id}",
            )
            db.add(build)
            db.commit()
            db.refresh(build)
        print(f"  Found: project={build.project}, branch={build.branch}, "
              f"status={build.status}")

        # ── Step 2: Fetch raw log from MinIO ──────────────────────────────
        print("\n══════════════════════════════════════════")
        print("  Step 2 ▸ Fetching log from MinIO")
        print("══════════════════════════════════════════")
        log_text = fetch_log(build_id)
        print(f"  Downloaded {len(log_text)} bytes")

        # ── Step 3: Parse the log content ─────────────────────────────────
        print("\n══════════════════════════════════════════")
        print("  Step 3 ▸ Parsing log content")
        print("══════════════════════════════════════════")
        events = log_parser.parse_log_content(build_id, log_text)

        # ── Step 4: Insert into parsed_log_events ─────────────────────────
        print("\n══════════════════════════════════════════")
        print("  Step 4 ▸ Inserting events into PostgreSQL")
        print("══════════════════════════════════════════")

        # Idempotency: clear any existing events for this build before inserting.
        # This ensures re-uploading the same file refreshes the data instead of
        # creating duplicate rows.
        existing_count = (
            db.query(ParsedLogEvent)
            .filter(ParsedLogEvent.build_id == build_id)
            .count()
        )
        if existing_count > 0:
            db.query(ParsedLogEvent).filter(
                ParsedLogEvent.build_id == build_id
            ).delete(synchronize_session=False)
            print(f"  [Idempotency] Cleared {existing_count} old rows for build_id={build_id!r}")

        for evt in events:
            db.add(ParsedLogEvent(
                build_id=evt["build_id"],
                event_time=evt["event_time"],
                stage=evt["stage"],
                level=evt["level"],
                message=evt["message"],
            ))
        db.commit()
        print(f"  Inserted {len(events)} rows into parsed_log_events")

        # ── Done ──────────────────────────────────────────────────────────
        print("\n══════════════════════════════════════════")
        print("  ✅ Pipeline complete!")
        print(f"     build_id     : {build_id}")
        print(f"     Events saved : {len(events)}")
        print("══════════════════════════════════════════\n")

    finally:
        db.close()


# ═══════════════════════════════════════════════════════════════════════════════
# Delete flow — remove parsed data from PostgreSQL for a given build_id
# ═══════════════════════════════════════════════════════════════════════════════

def delete_build_data(build_id: str):
    """
    Remove all parsed data for build_id from PostgreSQL:
      1. Delete all rows from parsed_log_events
      2. Delete the row from build_metadata
    """
    # Ensure tables exist before querying
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        print("\n══════════════════════════════════════════")
        print("  Delete ▸ Removing parsed data from PostgreSQL")
        print("══════════════════════════════════════════")

        # Step 1: Delete parsed_log_events
        deleted_events = (
            db.query(ParsedLogEvent)
            .filter(ParsedLogEvent.build_id == build_id)
            .delete(synchronize_session=False)
        )
        print(f"  Deleted {deleted_events} rows from parsed_log_events")

        # Step 2: Delete build_metadata row
        deleted_meta = (
            db.query(BuildMetadata)
            .filter(BuildMetadata.build_id == build_id)
            .delete(synchronize_session=False)
        )
        print(f"  Deleted {deleted_meta} rows from build_metadata")

        db.commit()

        print("\n══════════════════════════════════════════")
        print("  ✅ Deletion complete!")
        print(f"     build_id : {build_id}")
        print(f"     Events   : -{deleted_events}  |  Metadata : -{deleted_meta}")
        print("══════════════════════════════════════════\n")

    except Exception as exc:
        db.rollback()
        print(f"  ❌ Error deleting build_id={build_id!r}: {exc}")
        raise
    finally:
        db.close()


# ═══════════════════════════════════════════════════════════════════════════════
# Legacy flow — parse a local file (kept for backward compat / dev)
# ═══════════════════════════════════════════════════════════════════════════════

def main_legacy():
    """Original local-file pipeline (no MinIO fetch, no build_id)."""
    log_file = "logs/jenkins_logs.txt"

    print("\n══════════════════════════════════════════")
    print("  Step 1 ▸ Parsing log file (legacy mode)")
    print("══════════════════════════════════════════")
    parsed_logs, summary = log_parser.parse_log(log_file)

    print("\n══════════════════════════════════════════")
    print("  Step 2 ▸ Uploading raw log to MinIO")
    print("══════════════════════════════════════════")
    object_key = upload_raw_log(log_file)

    print("\n══════════════════════════════════════════")
    print("  ✅ Legacy pipeline complete!")
    print(f"     Raw log  → MinIO  : {object_key}")
    print("══════════════════════════════════════════\n")


# ═══════════════════════════════════════════════════════════════════════════════
# CLI entry point
# ═══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    if len(sys.argv) > 1:
        # TRACE mode: python main.py <build_id>
        build_id = sys.argv[1]
        parse_build(build_id)
    else:
        # Legacy mode: python main.py  (no args)
        print("[INFO] No build_id provided, running in legacy mode.")
        print("[INFO] Usage: python main.py <build_id>")
        main_legacy()
