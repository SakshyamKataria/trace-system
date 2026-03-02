from minio import Minio
from io import BytesIO
import time

MINIO_CLIENT = Minio(
    "minio:9000",   # docker service name
    access_key="minioadmin",
    secret_key="minioadmin",
    secure=False
)

BUCKET_NAME = "trace-logs"


def ensure_bucket_exists():
    while True:
        try:
            if not MINIO_CLIENT.bucket_exists(BUCKET_NAME):
                MINIO_CLIENT.make_bucket(BUCKET_NAME)
                print(f"Bucket '{BUCKET_NAME}' created.")
            return
        except Exception:
            print("Waiting for MinIO...")
            time.sleep(2)


def upload_log(build_id: str, log_text: str) -> str:
    ensure_bucket_exists()   # 👈 CALL IT HERE

    object_name = f"{build_id}.log"

    data_bytes = log_text.encode("utf-8")
    data_stream = BytesIO(data_bytes)

    MINIO_CLIENT.put_object(
        BUCKET_NAME,
        object_name,
        data_stream,
        len(data_bytes)
    )

    return f"minio://{BUCKET_NAME}/{object_name}"