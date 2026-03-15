"""
MinIO client for TRACE integration.

- fetch_log(build_id)  : download a raw log from the trace-logs bucket
- upload_raw_log(...)  : upload a local log file (kept for dev/seeding)
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


def fetch_log(build_id: str) -> str:
    """
    Fetch a raw log from MinIO by build_id.

    Object name convention: {build_id}.log
    Bucket: trace-logs (from env MINIO_BUCKET)

    Returns the log content as a UTF-8 string.
    """
    client = _get_client()
    bucket = os.getenv("MINIO_BUCKET", "trace-logs")
    object_name = f"{build_id}.log"

    response = client.get_object(bucket, object_name)
    try:
        return response.read().decode("utf-8")
    finally:
        response.close()
        response.release_conn()


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
