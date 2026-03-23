"""
watcher.py — MinIO bucket event watcher for TRACE.

Subscribes to the MinIO SSE notification stream for the trace-logs bucket.
Handles:
  s3:ObjectCreated:*  → parse the log → insert events into PostgreSQL
  s3:ObjectRemoved:*  → delete parsed events + build metadata from PostgreSQL

Supports multiple simultaneous uploads or deletions — all events are processed
sequentially as they arrive in the stream.

ENV VARS (all have defaults for Docker):
  MINIO_ENDPOINT      minio:9000
  MINIO_ACCESS_KEY    minioadmin
  MINIO_SECRET_KEY    minioadmin
  MINIO_BUCKET        trace-logs
  RECONNECT_DELAY     5   (seconds to wait before reconnecting after an error)
"""

import os
import sys
import time

from dotenv import load_dotenv
load_dotenv()

from minio import Minio

from handlers import handle_create, handle_delete  # type: ignore[import]


# ── Configuration ──────────────────────────────────────────────────────────────
MINIO_ENDPOINT   = os.getenv("MINIO_ENDPOINT",   "minio:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY",  "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY",  "minioadmin")
MINIO_BUCKET     = os.getenv("MINIO_BUCKET",      "trace-logs")
RECONNECT_DELAY  = int(os.getenv("RECONNECT_DELAY", "5"))


# ── MinIO client ───────────────────────────────────────────────────────────────
def _get_client() -> Minio:
    return Minio(
        endpoint=MINIO_ENDPOINT,
        access_key=MINIO_ACCESS_KEY,
        secret_key=MINIO_SECRET_KEY,
        secure=False,
    )


def _wait_for_minio(client: Minio) -> None:
    """Block until MinIO is reachable and the bucket exists."""
    while True:
        try:
            if not client.bucket_exists(MINIO_BUCKET):
                print(f"[Watcher] Bucket '{MINIO_BUCKET}' not found, creating it...")
                client.make_bucket(MINIO_BUCKET)
            print(f"[Watcher] ✅ Connected to MinIO at {MINIO_ENDPOINT}, "
                  f"watching bucket '{MINIO_BUCKET}'")
            return
        except Exception as exc:
            print(f"[Watcher] Waiting for MinIO... ({exc})")
            time.sleep(RECONNECT_DELAY)


# ── Event processing ───────────────────────────────────────────────────────────
def _process_event(event: dict) -> None:
    """
    Parse a single MinIO notification event dict and dispatch to the
    appropriate handler.

    MinIO SSE events look like:
    {
      "Records": [
        {
          "eventName": "s3:ObjectCreated:Put",
          "s3": {
            "object": {"key": "build-6.log", ...}
          }
        },
        ...  # multiple records can arrive in one event
      ]
    }
    """
    records = event.get("Records") or []
    for record in records:
        event_name = record.get("eventName", "")
        try:
            object_name = record["s3"]["object"]["key"]
        except (KeyError, TypeError):
            print(f"[Watcher] ⚠️  Skipping malformed record (no object key): {record}")
            continue

        # URL-decode the key (MinIO URL-encodes object names in events)
        try:
            from urllib.parse import unquote_plus
            object_name = unquote_plus(object_name)
        except Exception:
            pass  # keep the raw key on failure

        if event_name.startswith("s3:ObjectCreated"):
            handle_create(object_name)
        elif event_name.startswith("s3:ObjectRemoved"):
            handle_delete(object_name)
        else:
            print(f"[Watcher] ℹ️  Ignoring event: {event_name} for {object_name!r}")


# ── Main loop ──────────────────────────────────────────────────────────────────
def watch() -> None:
    client = _get_client()
    _wait_for_minio(client)

    print("[Watcher] 🚀 Starting event listener... (Ctrl+C to stop)")

    while True:
        try:
            # listen_bucket_notification returns an iterator over notification events.
            # It blocks inside each iteration until an event arrives.
            events = client.listen_bucket_notification(
                MINIO_BUCKET,
                prefix="",
                suffix="",
                events=[
                    "s3:ObjectCreated:*",
                    "s3:ObjectRemoved:*",
                ],
            )
            for event in events:
                _process_event(event)

        except KeyboardInterrupt:
            print("\n[Watcher] Stopped by user.")
            sys.exit(0)
        except Exception as exc:
            print(f"[Watcher] ❌ Stream error: {exc}. Reconnecting in {RECONNECT_DELAY}s...")
            time.sleep(RECONNECT_DELAY)
            client = _get_client()  # fresh client on reconnect


if __name__ == "__main__":
    watch()
