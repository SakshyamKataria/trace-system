"""
Jenkins log parser for TRACE integration.

Two modes:
  1. parse_log_content(build_id, log_text)  — new TRACE flow (from MinIO)
  2. parse_log(file_path)                   — legacy local-file flow
"""

import re
import json
import os
from collections import Counter
from datetime import datetime


# ─── TRACE log format ─────────────────────────────────────────────────────────
# Expected:  2026-03-15T08:10:10Z ERROR tests/test_user.py::test_get_user_by_id FAILED
# Pattern:   <ISO-timestamp> <LEVEL> <message>
_TRACE_LINE_RE = re.compile(
    r"^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)\s+(INFO|WARN|ERROR)\s+(.+)$"
)

# ─── Stage detection heuristics ───────────────────────────────────────────────
_STAGE_PATTERNS = [
    (re.compile(r"\[Pipeline\]\s+stage", re.IGNORECASE), "Init"),
    (re.compile(r"^\s*\+\s*docker", re.IGNORECASE), "Init"),
    (re.compile(r"(compil|build|mvn|gradle|npm run build)", re.IGNORECASE), "Build"),
    (re.compile(r"(test|pytest|junit|unittest|jest|mocha)", re.IGNORECASE), "Test"),
    (re.compile(r"(Finished:|SUCCESS|FAILURE|result)", re.IGNORECASE), "Result"),
]


def _detect_stage(message: str) -> str | None:
    """Try to infer a pipeline stage from the message content."""
    for pattern, stage in _STAGE_PATTERNS:
        if pattern.search(message):
            return stage
    return None


# ═══════════════════════════════════════════════════════════════════════════════
# TRACE flow — parse raw log text fetched from MinIO
# ═══════════════════════════════════════════════════════════════════════════════

def parse_log_content(build_id: str, log_text: str) -> list[dict]:
    """
    Parse raw Jenkins log text and return a list of event dicts
    ready to be inserted into ``parsed_log_events``.
    Filters for meaningful lines (ERROR, WARN, FAILED, PASSED, EXCEPTION).
    """
    events: list[dict] = []

    for line in log_text.splitlines():
        stripped = line.strip()
        if not stripped:
            continue

        # Filter out noise: only keep errors, warnings, failures, exceptions, and passes
        is_error = bool(re.search(r"\bERROR\b", line))
        is_warning = bool(re.search(r"\bWARNING\b", line) or re.search(r"\bWARN\b", line))
        is_failed = bool(re.search(r"\bFAILED\b", line))
        is_passed = stripped == "PASSED" or bool(re.match(r"PASSED\s+\[", stripped))
        is_exception = bool(re.search(r"\b(Exception|Error)\b", line)) and not is_error and not is_warning

        if not (is_error or is_warning or is_failed or is_passed or is_exception):
            continue

        # Determine level
        level_guess = "INFO"
        if is_error or is_failed or is_exception:
            level_guess = "ERROR"
        elif is_warning:
            level_guess = "WARN"

        m = _TRACE_LINE_RE.match(stripped)
        if m:
            ts_str, level_from_regex, message = m.group(1), m.group(2), m.group(3)
            # Override level if regex matches
            if level_from_regex in ["ERROR", "WARN"]:
                level_guess = level_from_regex
            try:
                event_time = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
            except ValueError:
                event_time = None
            stage = _detect_stage(message)

            events.append({
                "build_id":   build_id,
                "event_time": event_time,
                "stage":      stage,
                "level":      level_guess,
                "message":    message.strip(),
            })
        else:
            events.append({
                "build_id":   build_id,
                "event_time": None,
                "stage":      _detect_stage(stripped),
                "level":      level_guess,
                "message":    stripped,
            })

    print(f"[Parser] Extracted {len(events)} meaningful events for build_id={build_id}")
    return events


# ═══════════════════════════════════════════════════════════════════════════════
# Legacy flow — parse from a local file  (kept for backward compatibility)
# ═══════════════════════════════════════════════════════════════════════════════

def classify_failure(message):
    msg = message.lower()
    if "authentication failed" in msg or "jira authentication" in msg:
        return "Authentication Error"
    if "not in running state" in msg or "instance status : failed" in msg:
        return "Infrastructure Error"
    if "rest_client" in msg or "api" in msg:
        return "API Error"
    if "storage cluster id is missing" in msg:
        return "Configuration Error"
    if "assert false" in msg or "assertionerror" in msg:
        return "Test Logic Error"
    if "no matching storage volume" in msg:
        return "Configuration Warning"
    if "exception occurred" in msg:
        return "Runtime Exception"
    if "vm backup failed" in msg or "vm clone failed" in msg:
        return "VM Operation Error"
    if "migration" in msg:
        return "Migration Error"
    if "skipping" in msg:
        return "Skipped Test"
    return "Unknown Error"


def parse_log(file_path):
    """
    Legacy parser: reads a local log file and returns (events, summary).
    Kept for backward compatibility and local development.
    """
    with open(file_path, "r", encoding="utf-8", errors="replace") as f:
        raw_lines = f.readlines()

    print(f"[DEBUG] Total lines in file: {len(raw_lines)}")

    all_events = []
    current_timestamp = None
    current_test_name = None
    current_test_file = None

    for idx, line in enumerate(raw_lines):
        stripped = line.strip()
        if not stripped:
            continue

        ts_match = re.search(r"\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}", line)
        if ts_match:
            current_timestamp = ts_match.group()

        test_ctx = re.match(
            r"([\w/\\]+\.py)::(\w+)(?:::(\w+))?\s", stripped
        )
        if test_ctx:
            current_test_file = test_ctx.group(1)
            current_test_name = test_ctx.group(3) or test_ctx.group(2)

        is_error = bool(re.search(r"\bERROR\b", line))
        is_warning = bool(re.search(r"\bWARNING\b", line))
        is_failed = bool(re.search(r"\bFAILED\b", line))
        is_passed = stripped == "PASSED" or re.match(r"PASSED\s+\[", stripped)
        is_exception = bool(
            re.search(r"\b(Exception|Error)\b", line)
        ) and not is_error and not is_warning

        if not (is_error or is_warning or is_failed or is_passed or is_exception):
            continue

        if stripped.startswith(("ERROR:", "WARNING:", "INFO:")):
            if (
                idx + 1 < len(raw_lines)
                and re.search(r"\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}", raw_lines[idx + 1])
            ):
                continue

        if is_failed:
            status = "FAILED"
        elif is_passed:
            status = "PASSED"
        elif is_error:
            status = "ERROR"
        elif is_warning:
            status = "WARNING"
        else:
            status = "EXCEPTION"

        test_file = current_test_file
        test_name = current_test_name

        fail_detail = re.match(
            r"FAILED\s+([\w/\\]+\.py)::(\w+)(?:::(\w+))?", stripped
        )
        if fail_detail:
            test_file = fail_detail.group(1)
            test_name = fail_detail.group(3) or fail_detail.group(2)

        error_type = None
        et_match = re.search(r"\b([A-Za-z]+(?:Error|Exception))\b", line)
        if et_match:
            error_type = et_match.group(1)

        msg_match = re.search(
            r"(?:ERROR|WARNING|INFO)\s*:\s*(.+)", stripped
        )
        message = msg_match.group(1).strip() if msg_match else stripped

        failure_category = None
        if status in ("FAILED", "ERROR", "EXCEPTION", "WARNING"):
            failure_category = classify_failure(message)

        stack_trace = []
        look_start = max(0, idx - 10)
        for wline in raw_lines[look_start:idx]:
            if re.match(r'\s+File "', wline):
                stack_trace.append(wline.rstrip())

        event = {
            "line_number": idx + 1,
            "timestamp": current_timestamp,
            "test_file": test_file,
            "test_name": test_name,
            "status": status,
            "message": message,
            "error_type": error_type,
            "failure_category": failure_category,
            "stack_trace": stack_trace if stack_trace else None,
        }
        all_events.append(event)

    seen = set()
    unique_events = []
    for e in all_events:
        key = (e["message"], e["timestamp"], e["status"])
        if key not in seen:
            seen.add(key)
            unique_events.append(e)

    all_events = unique_events
    print(f"[DEBUG] Total unique events extracted: {len(all_events)}")

    errors = [e for e in all_events if e["status"] == "ERROR"]
    warnings = [e for e in all_events if e["status"] == "WARNING"]
    failures = [e for e in all_events if e["status"] == "FAILED"]
    passes = [e for e in all_events if e["status"] == "PASSED"]
    exceptions = [e for e in all_events if e["status"] == "EXCEPTION"]

    os.makedirs("output", exist_ok=True)
    with open("output/parsed_logs.json", "w") as f:
        json.dump(all_events, f, indent=4)

    categories = [e["failure_category"] for e in all_events if e["failure_category"]]
    failed_tests = list(set(e["test_name"] for e in failures if e["test_name"]))
    passed_tests = list(set(e["test_name"] for e in passes if e["test_name"]))
    error_messages = [e["message"][:120] for e in errors + failures + exceptions]

    summary = {
        "total_lines_parsed": len(raw_lines),
        "total_events": len(all_events),
        "error_count": len(errors),
        "warning_count": len(warnings),
        "failure_count": len(failures),
        "passed_count": len(passes),
        "exception_count": len(exceptions),
        "failed_tests": failed_tests,
        "passed_tests": passed_tests,
        "failure_category_breakdown": dict(Counter(categories).most_common()),
        "top_error_messages": dict(Counter(error_messages).most_common(10)),
        "most_common_failure_category": (
            Counter(categories).most_common(1)[0][0] if categories else None
        ),
        "total_failures": len(failures),
        "most_common_failure_reason": (
            Counter(error_messages).most_common(1)[0][0] if error_messages else None
        ),
    }

    with open("output/build_summary.json", "w") as f:
        json.dump(summary, f, indent=4)

    print("✅ Logs parsed successfully")
    print(f"   Total events  → {len(all_events)}")
    print(f"   Detailed logs → output/parsed_logs.json")
    print(f"   Build summary → output/build_summary.json")

    return all_events, summary