"""
MinIO client for TRACE integration.

- fetch_log(build_id)  : download a raw log from the trace-logs bucket
- upload_raw_log(...)  : upload a local log file (kept for dev/seeding)
- list_builds()        : list all build log files stored in the bucket
"""

import os
from datetime import datetime
from minio import Minio
from minio.error import S3Error


def _get_client() -> Minio:
    """Build a Minio client from environment variables."""
    return Minio(
        endpoint=os.getenv("MINIO_ENDPOINT", "minio:9000"),
        access_key=os.getenv("MINIO_ACCESS_KEY", "minioadmin"),
        secret_key=os.getenv("MINIO_SECRET_KEY", "minioadmin"),
        secure=False,  # no TLS in Docker
    )


def list_builds() -> list[dict]:
    """
    List all log files stored in the trace-logs MinIO bucket.

    Returns a list of dicts with keys:
        build_id    : derived name (extension stripped from .log files)
        object_name : actual MinIO object name (use this for fetch_log)
        size_kb     : file size in KB
        modified    : last-modified datetime
    """
    client = _get_client()
    bucket = os.getenv("MINIO_BUCKET", "trace-logs")
    builds = []
    try:
        objects = client.list_objects(bucket)
        for obj in objects:
            name = obj.object_name  # e.g. "build-6.log" or "build-9.log.txt"
            # Derive a clean build_id: strip only a trailing .log for standard files
            build_id = name.removesuffix(".log") if name.endswith(".log") else name
            builds.append({
                "build_id":    build_id,
                "object_name": name,
                "size_kb":     round((obj.size or 0) / 1024, 1),
                "modified":    obj.last_modified,
            })
    except S3Error as e:
        print(f"[MinIO] Error listing objects: {e}")
    return builds


def fetch_log(build_id: str) -> str:
    """
    Fetch a raw log from MinIO by build_id.

    Tries the following object names in order:
      1. {build_id}.log          (standard TRACE convention via API)
      2. {build_id}              (raw filename, e.g. manually uploaded files)

    Returns the log content as a UTF-8 string.
    """
    client = _get_client()
    bucket = os.getenv("MINIO_BUCKET", "trace-logs")

    # Try the standard .log convention first, then fall back to the raw name
    candidates = [f"{build_id}.log", build_id]
    for object_name in candidates:
        try:
            response = client.get_object(bucket, object_name)
            try:
                print(f"[MinIO] Fetching {bucket}/{object_name}")
                return response.read().decode("utf-8", errors="replace")
            finally:
                response.close()
                response.release_conn()
        except S3Error:
            continue

    raise FileNotFoundError(
        f"[MinIO] Could not find log for build_id='{build_id}'. "
        f"Tried: {candidates} in bucket '{bucket}'."
    )


def upload_raw_log(file_path: str, build_id: str | None = None) -> str:
    """
    Upload a raw log file to MinIO.

    If build_id is provided, the object is stored as {build_id}.log
    (matching the TRACE convention).  Otherwise falls back to a
    date-based key for backward compatibility.

    Returns the object key.
    """
    client = _get_client()
    bucket = os.getenv("MINIO_BUCKET", "trace-logs")

    # Ensure the bucket exists
    if not client.bucket_exists(bucket):
        client.make_bucket(bucket)
        print(f"[MinIO] Created bucket: {bucket}")

    if build_id:
        object_key = f"{build_id}.log"
    else:
        now = datetime.now()
        basename = os.path.basename(file_path)
        name, ext = os.path.splitext(basename)
        object_key = f"{now:%Y/%m/%d}/{name}_{now:%Y%m%d_%H%M%S}{ext}"

    client.fput_object(bucket, object_key, file_path)
    print(f"[MinIO] Uploaded  → {bucket}/{object_key}")

    return object_key
