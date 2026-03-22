"""
run_pipeline.py — Unified TRACE Log Parser Pipeline

Three modes:

  1. LIST — show all logs currently stored in MinIO:
       python run_pipeline.py --list

  2. PARSE — parse an existing MinIO log by build_id (no local file needed):
       python run_pipeline.py --build-id build-6

  3. INGEST + PARSE — upload a new local log file to MinIO, then parse it:
       python run_pipeline.py --file logs/my_log.txt --build-id build-9
"""

import argparse
import os
import subprocess
import sys
import time
from datetime import datetime

import requests

# Add the parser directory to path so we can import list_builds directly
PARSER_DIR = os.path.join(os.path.dirname(__file__), "backend", "log_parser")
sys.path.insert(0, PARSER_DIR)


# ── Configuration ──────────────────────────────────────────────────────────────
BACKEND_URL         = os.getenv("BACKEND_URL",    "http://localhost:8000/api/v1/ingest-log")
PG_HOST             = os.getenv("PG_HOST",        "localhost")
MINIO_ENDPOINT      = os.getenv("MINIO_ENDPOINT", "localhost:9000")
WORKER_WAIT_SECONDS = int(os.getenv("WORKER_WAIT", "5"))


def parse_args():
    parser = argparse.ArgumentParser(
        description="TRACE Log Parser Pipeline",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Examples:\n"
            "  List all builds in MinIO:\n"
            "    python run_pipeline.py --list\n\n"
            "  Parse an existing MinIO build (no upload needed):\n"
            "    python run_pipeline.py --build-id build-6\n\n"
            "  Upload a new log file and parse it:\n"
            "    python run_pipeline.py --file logs/my_log.txt --build-id build-9\n"
        )
    )
    parser.add_argument("--list",  "-l", action="store_true",
                        help="List all log files currently stored in MinIO")
    parser.add_argument("--build-id", "-b",
                        help="Build ID to parse (e.g. build-6). Required unless --list is used.")
    parser.add_argument("--file", "-f",
                        help="Path to a local log file. If given, the file is uploaded first.")
    parser.add_argument("--project",   default="TRACE",              help="Project name (default: TRACE)")
    parser.add_argument("--branch",    default="feature/log-parser", help="Git branch")
    parser.add_argument("--commit-id", default="abc123def456",       help="Commit hash")
    parser.add_argument("--status",    default="SUCCESS",            help="Build status: SUCCESS or FAILURE")
    return parser.parse_args()


def step_read_log(file_path: str) -> str:
    print(f"\n[1/4] Reading log file: {file_path}")
    if not os.path.exists(file_path):
        print(f"      ❌ File not found: {file_path}")
        sys.exit(1)
    with open(file_path, "r", encoding="utf-8", errors="replace") as f:
        content = f.read()
    size_kb = len(content.encode("utf-8")) / 1024
    print(f"      ✅ Read {size_kb:.1f} KB")
    return content


def step_ingest(build_id: str, log_content: str, args) -> None:
    print(f"\n[2/4] Sending log to backend (build_id={build_id})...")
    payload = {
        "build_id":  build_id,
        "project":   args.project,
        "branch":    args.branch,
        "commit_id": args.commit_id,
        "status":    args.status,
        "timestamp": datetime.now().isoformat(),
        "log":       log_content,
    }
    try:
        response = requests.post(BACKEND_URL, json=payload, timeout=30)
        if response.status_code == 200:
            print(f"      ✅ Log queued to Redis. Backend will save to MinIO & PostgreSQL.")
        else:
            print(f"      ❌ Backend returned HTTP {response.status_code}: {response.text}")
            sys.exit(1)
    except requests.exceptions.ConnectionError:
        print("      ❌ Connection Error: Is the backend running? Try: docker-compose up -d")
        sys.exit(1)


def step_wait(seconds: int) -> None:
    print(f"\n[3/4] Waiting {seconds}s for backend worker to process...")
    for i in range(seconds, 0, -1):
        print(f"      {i}...", end="\r")
        time.sleep(1)
    print("      ✅ Done waiting.")


def step_list_builds() -> None:
    """Print all log files stored in MinIO."""
    os.environ["MINIO_ENDPOINT"] = MINIO_ENDPOINT
    # Import here so env var is already set
    from storage.minio_client import list_builds
    builds = list_builds()
    if not builds:
        print("  No log files found in MinIO bucket 'trace-logs'.")
        return
    print(f"\n  {'BUILD ID':<20} {'SIZE (KB)':>10}  {'LAST MODIFIED'}")
    print("  " + "-" * 65)
    for b in builds:
        modified = b["modified"].strftime("%Y-%m-%d %H:%M:%S") if b["modified"] else "N/A"
        print(f"  {b['build_id']:<20} {b['size_kb']:>10.1f}  {modified}")
    print()


def step_parse(build_id: str, step_prefix: str = "[4/4]") -> None:
    print(f"\n{step_prefix} Running parser for build_id={build_id}...")
    env = os.environ.copy()
    env["PG_HOST"]        = PG_HOST
    env["MINIO_ENDPOINT"] = MINIO_ENDPOINT

    result = subprocess.run(
        [sys.executable, "main.py", build_id],
        cwd=PARSER_DIR,
        env=env,
    )
    if result.returncode != 0:
        print(f"\n      ❌ Parser exited with code {result.returncode}.")
        sys.exit(result.returncode)


def main():
    args = parse_args()

    # ── MODE 1: --list ────────────────────────────────────────────────────────
    if args.list:
        print("=" * 50)
        print("  MinIO — Available Builds")
        print("=" * 50)
        step_list_builds()
        return

    # All other modes need --build-id
    if not args.build_id:
        print("❌ --build-id is required unless you use --list.")
        print("   Run: python run_pipeline.py --help")
        sys.exit(1)

    # ── MODE 2: --build-id only (parse existing MinIO log) ───────────────────
    if not args.file:
        print("=" * 50)
        print("  TRACE Log Parser — Parse Mode")
        print("=" * 50)
        print(f"  Build ID : {args.build_id}")
        print(f"  Source   : MinIO (existing log)")
        print("=" * 50)
        step_parse(args.build_id, step_prefix="[1/1]")
        print("\n" + "=" * 50)
        print("  🎉 Parse complete!")
        print(f"     build_id={args.build_id} events are now in PostgreSQL.")
        print("=" * 50 + "\n")
        return

    # ── MODE 3: --file + --build-id (upload new log, then parse) ─────────────
    print("=" * 50)
    print("  TRACE Log Parser — Ingest + Parse Mode")
    print("=" * 50)
    print(f"  File     : {args.file}")
    print(f"  Build ID : {args.build_id}")
    print(f"  Project  : {args.project}")
    print(f"  Status   : {args.status}")
    print("=" * 50)

    log_content = step_read_log(args.file)
    step_ingest(args.build_id, log_content, args)
    step_wait(WORKER_WAIT_SECONDS)
    step_parse(args.build_id)

    print("\n" + "=" * 50)
    print("  🎉 Full pipeline complete!")
    print(f"     build_id={args.build_id} is now in PostgreSQL.")
    print("=" * 50 + "\n")


if __name__ == "__main__":
    main()
