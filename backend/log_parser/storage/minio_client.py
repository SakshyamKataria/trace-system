"""
MinIO client – uploads raw Jenkins log files to object storage.
"""

import os
from datetime import datetime
from minio import Minio
from minio.error import S3Error


def _get_client() -> Minio:
    """Build a Minio client from environment variables."""
    return Minio(
        endpoint=os.getenv("MINIO_ENDPOINT", "localhost:9000"),
        access_key=os.getenv("MINIO_ACCESS_KEY", "minioadmin"),
        secret_key=os.getenv("MINIO_SECRET_KEY", "minioadmin"),
        secure=False,  # local dev – no TLS
    )


def upload_raw_log(file_path: str) -> str:
    """
    Upload a raw log file to MinIO.

    Parameters
    ----------
    file_path : str
        Local path to the log file (e.g. "logs/jenkins_logs.txt").

    Returns
    -------
    str
        The object key under which the file was stored in MinIO.
    """
    client = _get_client()
    bucket = os.getenv("MINIO_BUCKET", "jenkins-logs")

    # Ensure the bucket exists
    if not client.bucket_exists(bucket):
        client.make_bucket(bucket)
        print(f"[MinIO] Created bucket: {bucket}")

    # Build a unique object key  e.g.  2026/03/15/jenkins_logs_20260315_184600.txt
    now = datetime.now()
    basename = os.path.basename(file_path)
    name, ext = os.path.splitext(basename)
    object_key = f"{now:%Y/%m/%d}/{name}_{now:%Y%m%d_%H%M%S}{ext}"

    client.fput_object(bucket, object_key, file_path)
    print(f"[MinIO] Uploaded  → {bucket}/{object_key}")

    return object_key
