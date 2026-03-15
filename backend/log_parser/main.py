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
        # ── Step 1: Verify build_id exists in build_metadata ──────────────
        print("\n══════════════════════════════════════════")
        print("  Step 1 ▸ Looking up build metadata")
        print("══════════════════════════════════════════")
        build = db.query(BuildMetadata).filter_by(build_id=build_id).first()
        if not build:
            print(f"[ERROR] build_id '{build_id}' not found in build_metadata")
            sys.exit(1)
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
