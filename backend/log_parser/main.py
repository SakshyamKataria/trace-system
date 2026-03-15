import os

from dotenv import load_dotenv

# Load .env BEFORE importing storage modules so env vars are available
load_dotenv()

import parser.log_parser as log_parser
from storage.minio_client import upload_raw_log
from storage.postgres_client import insert_build_run, insert_log_events


def main():
    log_file = "logs/jenkins_logs.txt"

    # ── Step 1: Parse the log file ─────────────────────────────────────────
    print("\n══════════════════════════════════════════")
    print("  Step 1 ▸ Parsing log file")
    print("══════════════════════════════════════════")
    parsed_logs, summary = log_parser.parse_log(log_file)

    # ── Step 2: Upload raw log to MinIO ────────────────────────────────────
    print("\n══════════════════════════════════════════")
    print("  Step 2 ▸ Uploading raw log to MinIO")
    print("══════════════════════════════════════════")
    object_key = upload_raw_log(log_file)

    # ── Step 3: Store metadata in PostgreSQL ───────────────────────────────
    print("\n══════════════════════════════════════════")
    print("  Step 3 ▸ Storing metadata in PostgreSQL")
    print("══════════════════════════════════════════")
    log_filename = os.path.basename(log_file)
    build_run_id = insert_build_run(summary, object_key, log_filename)
    insert_log_events(build_run_id, parsed_logs)

    # ── Done ───────────────────────────────────────────────────────────────
    print("\n══════════════════════════════════════════")
    print("  ✅ Pipeline complete!")
    print(f"     Raw log  → MinIO  : {object_key}")
    print(f"     Metadata → Postgres: build_run_id={build_run_id}")
    print("══════════════════════════════════════════\n")


if __name__ == "__main__":
    main()
