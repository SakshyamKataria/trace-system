"""
PostgreSQL client – stores parsed log metadata in the jenkins_logs database.
"""

import os
from typing import Any

import psycopg2
from psycopg2.extras import Json


# ── connection helper ──────────────────────────────────────────────────────────

def get_connection():
    """Return a new psycopg2 connection using environment variables."""
    return psycopg2.connect(
        host=os.getenv("PG_HOST", "localhost"),
        port=int(os.getenv("PG_PORT", "5432")),
        dbname=os.getenv("PG_DATABASE", "jenkins_logs"),
        user=os.getenv("PG_USER", "postgres"),
        password=os.getenv("PG_PASSWORD", "postgres"),
    )


# ── insert helpers ─────────────────────────────────────────────────────────────

def insert_build_run(
    summary: dict[str, Any],
    minio_object_key: str,
    log_filename: str,
) -> int:
    """
    Insert a row into `build_runs` and return the generated id.
    """
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            """
            INSERT INTO build_runs (
                log_filename,
                minio_object_key,
                total_lines_parsed,
                total_events,
                error_count,
                warning_count,
                failure_count,
                passed_count,
                exception_count,
                most_common_failure_category,
                most_common_failure_reason,
                failed_tests,
                passed_tests,
                failure_category_breakdown,
                top_error_messages
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (
                log_filename,
                minio_object_key,
                summary.get("total_lines_parsed", 0),
                summary.get("total_events", 0),
                summary.get("error_count", 0),
                summary.get("warning_count", 0),
                summary.get("failure_count", 0),
                summary.get("passed_count", 0),
                summary.get("exception_count", 0),
                summary.get("most_common_failure_category"),
                summary.get("most_common_failure_reason"),
                Json(summary.get("failed_tests")),
                Json(summary.get("passed_tests")),
                Json(summary.get("failure_category_breakdown")),
                Json(summary.get("top_error_messages")),
            ),
        )
        row = cur.fetchone()
        build_run_id: int = row[0] if row else 0
        conn.commit()
        print(f"[Postgres] Inserted build_run  id={build_run_id}")
        return build_run_id
    finally:
        cur.close()
        conn.close()


def insert_log_events(build_run_id: int, events: list[dict]) -> int:
    """
    Bulk-insert all log events linked to the given build run.

    Returns the number of rows inserted.
    """
    conn = get_connection()
    cur = conn.cursor()
    try:
        for event in events:
            cur.execute(
                """
                INSERT INTO log_events (
                    build_run_id,
                    line_number,
                    timestamp,
                    test_file,
                    test_name,
                    status,
                    message,
                    error_type,
                    failure_category,
                    stack_trace
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    build_run_id,
                    event.get("line_number"),
                    event.get("timestamp"),
                    event.get("test_file"),
                    event.get("test_name"),
                    event.get("status", "UNKNOWN"),
                    event.get("message"),
                    event.get("error_type"),
                    event.get("failure_category"),
                    Json(event.get("stack_trace")),
                ),
            )
        conn.commit()
        count = len(events)
        print(f"[Postgres] Inserted {count} log_events for build_run_id={build_run_id}")
        return count
    finally:
        cur.close()
        conn.close()
