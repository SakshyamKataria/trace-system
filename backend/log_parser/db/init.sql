-- ============================================================
-- Schema for TRACE — Jenkins Log Parser
-- ============================================================

-- build_metadata: populated by the TRACE backend (read-only for the parser)
CREATE TABLE IF NOT EXISTS build_metadata (
    id          SERIAL PRIMARY KEY,
    build_id    VARCHAR(256) UNIQUE NOT NULL,
    project     VARCHAR(256),
    branch      VARCHAR(256),
    commit_id   VARCHAR(256),
    status      VARCHAR(32),                          -- "success" or "failure"
    timestamp   TIMESTAMP,
    log_path    VARCHAR(1024)                         -- e.g. "minio://trace-logs/build-abc-123.log"
);

CREATE INDEX IF NOT EXISTS idx_build_metadata_build_id
    ON build_metadata(build_id);

-- parsed_log_events: written by the parser (one row per log line event)
CREATE TABLE IF NOT EXISTS parsed_log_events (
    id          SERIAL PRIMARY KEY,
    build_id    VARCHAR(256) NOT NULL REFERENCES build_metadata(build_id),
    event_time  TIMESTAMP,
    stage       VARCHAR(128),
    level       VARCHAR(32)  NOT NULL,                -- INFO | WARN | ERROR
    message     TEXT         NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_parsed_log_events_build_id
    ON parsed_log_events(build_id);
