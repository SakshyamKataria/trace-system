"""
handlers.py — MinIO event handlers for the TRACE watcher service.

handle_create(object_name) → parse the log and insert events into PostgreSQL.
handle_delete(object_name) → remove all parsed data for the build from PostgreSQL.
"""

import os
import sys

# Ensure the log_parser package directory is on the path
LOG_PARSER_DIR = os.getenv("LOG_PARSER_DIR", "/app/log_parser")
if LOG_PARSER_DIR not in sys.path:
    sys.path.insert(0, LOG_PARSER_DIR)


def _build_id_from_object(object_name: str) -> str:
    """
    Derive a clean build_id from a MinIO object name.

    Examples:
      'build-6.log'      → 'build-6'
      'build-9.log.txt'  → 'build-9.log.txt'   (non-standard, kept as-is)
      'build-11'         → 'build-11'
    """
    if object_name.endswith(".log"):
        return object_name[:-4]  # strip ".log"
    return object_name


# ── CREATE ──────────────────────────────────────────────────────────────────────

def handle_create(object_name: str) -> None:
    """
    Called when a new object is uploaded to MinIO.
    Parses the log and inserts events into PostgreSQL.
    """
    build_id = _build_id_from_object(object_name)
    print(f"[Watcher][CREATE] Detected upload: {object_name!r}  →  build_id={build_id!r}")

    try:
        # Import here so env vars are already loaded
        from main import parse_build  # type: ignore[import]
        parse_build(build_id)
        print(f"[Watcher][CREATE] ✅ Successfully parsed build_id={build_id!r}")
    except Exception as exc:
        print(f"[Watcher][CREATE] ❌ Error parsing build_id={build_id!r}: {exc}")


# ── DELETE ──────────────────────────────────────────────────────────────────────

def handle_delete(object_name: str) -> None:
    """
    Called when an object is removed from MinIO.
    Deletes all parsed events + build metadata for that build from PostgreSQL.
    """
    build_id = _build_id_from_object(object_name)
    print(f"[Watcher][DELETE] Detected deletion: {object_name!r}  →  build_id={build_id!r}")

    try:
        from main import delete_build_data  # type: ignore[import]
        delete_build_data(build_id)
        print(f"[Watcher][DELETE] ✅ Cleaned up PostgreSQL for build_id={build_id!r}")
    except Exception as exc:
        print(f"[Watcher][DELETE] ❌ Error cleaning up build_id={build_id!r}: {exc}")
