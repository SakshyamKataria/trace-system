import redis
import json
import time
from datetime import datetime
from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from app.db.database import SessionLocal
from app.db.database import Base, engine
from app.db.models import BuildMetadata
from app.services.minio_client import upload_log


REDIS_HOST = "redis"
REDIS_PORT = 6379
QUEUE_NAME = "build_logs"


def wait_for_redis():
    while True:
        try:
            client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=0)
            client.ping()
            print("Connected to Redis.")
            return client
        except redis.exceptions.ConnectionError:
            print("Waiting for Redis...")
            time.sleep(2)


def wait_for_database():
    while True:
        try:
            db = SessionLocal()
            db.execute(text("SELECT 1"))
            db.close()

            Base.metadata.create_all(bind=engine)

            print("Connected to PostgreSQL.")
            return
        except OperationalError:
            print("Waiting for PostgreSQL...")
            time.sleep(2)


def main():
    print("Worker starting...")

    redis_client = wait_for_redis()
    wait_for_database()

    print("Worker ready. Listening for jobs...")

    while True:
        try:
            # Blocking pop (better than lpop polling)
            job = redis_client.brpop(QUEUE_NAME, timeout=5)

            if job:
                _, raw_data = job
                data = json.loads(raw_data)

                db = SessionLocal()

                try:
                    existing = db.query(BuildMetadata).filter_by(
                        build_id=data["build_id"]
                    ).first()

                    if existing:
                        print(f"Build already exists: {data['build_id']}")
                    else:
                        log_path = upload_log(
                            data["build_id"],
                            data["log"]
                        )

                        metadata = BuildMetadata(
                            build_id=data["build_id"],
                            project=data["project"],
                            branch=data["branch"],
                            commit_id=data["commit_id"],
                            status=data["status"],
                            timestamp=datetime.fromisoformat(data["timestamp"]),
                            log_path=log_path
                        )

                        db.add(metadata)
                        db.commit()

                        print(f"Inserted build: {data['build_id']}")

                except Exception as db_error:
                    db.rollback()
                    print("Database error:", str(db_error))

                finally:
                    db.close()

        except Exception as e:
            print("Worker runtime error:", str(e))
            time.sleep(2)


if __name__ == "__main__":
    main()