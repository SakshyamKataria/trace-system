import re
import json
import os
from collections import Counter


# -----------------------------
# FAILURE CLASSIFICATION
# -----------------------------
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


# -----------------------------
# MAIN PARSER
# -----------------------------
def parse_log(file_path):
    """
    Parse the entire Jenkins log file and extract ALL meaningful events:
      - ERROR lines
      - WARNING lines
      - FAILED test results
      - PASSED test results
      - Exception lines
      - Test summary (pytest output at the bottom)
    """

    with open(file_path, "r", encoding="utf-8", errors="replace") as f:
        raw_lines = f.readlines()

    print(f"[DEBUG] Total lines in file: {len(raw_lines)}")

    all_events = []
    current_timestamp = None
    current_test_name = None
    current_test_file = None

    # ── Track the latest timestamp & test context as we scan ──────────────
    for idx, line in enumerate(raw_lines):
        stripped = line.strip()
        if not stripped:
            continue

        # Update running timestamp
        ts_match = re.search(r"\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}", line)
        if ts_match:
            current_timestamp = ts_match.group()

        # Track current test from pytest output  e.g.
        # morpheus_automation/tests/api/test_vme_storage_plugin_e2e.py::TestVMEStoragePlugin::test_create_update_storage_server
        test_ctx = re.match(
            r"([\w/\\]+\.py)::(\w+)(?:::(\w+))?\s", stripped
        )
        if test_ctx:
            current_test_file = test_ctx.group(1)
            current_test_name = test_ctx.group(3) or test_ctx.group(2)

        # ── Detect events ──────────────────────────────────────────────────

        is_error = bool(re.search(r"\bERROR\b", line))
        is_warning = bool(re.search(r"\bWARNING\b", line))
        is_failed = bool(re.search(r"\bFAILED\b", line))
        is_passed = stripped == "PASSED" or re.match(r"PASSED\s+\[", stripped)
        is_exception = bool(
            re.search(r"\b(Exception|Error)\b", line)
        ) and not is_error and not is_warning

        if not (is_error or is_warning or is_failed or is_passed or is_exception):
            continue

        # Skip duplicated Python-logging lines (e.g.
        # "INFO:module.name:msg" immediately followed by
        # "2026-02-25 21:12:04 MST file.py:NNN  INFO : msg")
        # Keep only the timestamped variant to avoid double-counting.
        if stripped.startswith(("ERROR:", "WARNING:", "INFO:")):
            # This is the python-logging short form; the next line is the
            # timestamped equivalent.  Skip this one.
            if (
                idx + 1 < len(raw_lines)
                and re.search(r"\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}", raw_lines[idx + 1])
            ):
                continue

        # Determine event level / status
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

        # ── Extract test file/name from FAILED summary lines ──────────────
        test_file = current_test_file
        test_name = current_test_name

        # Summary FAILED line:  FAILED morpheus_automation/.../test_foo.py::Class::method
        fail_detail = re.match(
            r"FAILED\s+([\w/\\]+\.py)::(\w+)(?:::(\w+))?", stripped
        )
        if fail_detail:
            test_file = fail_detail.group(1)
            test_name = fail_detail.group(3) or fail_detail.group(2)

        # ── Extract error type (AssertionError, ValueError, etc.) ─────────
        error_type = None
        et_match = re.search(r"\b([A-Za-z]+(?:Error|Exception))\b", line)
        if et_match:
            error_type = et_match.group(1)

        # ── Extract the message content ───────────────────────────────────
        # Try to get the part after "ERROR :" or "WARNING :" etc.
        msg_match = re.search(
            r"(?:ERROR|WARNING|INFO)\s*:\s*(.+)", stripped
        )
        message = msg_match.group(1).strip() if msg_match else stripped

        # ── Classify ──────────────────────────────────────────────────────
        failure_category = None
        if status in ("FAILED", "ERROR", "EXCEPTION", "WARNING"):
            failure_category = classify_failure(message)

        # ── Gather small stack-trace window (3 lines above if they are
        #    "  File ..." lines) ──────────────────────────────────────────
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

    # ── De-duplicate by (message, timestamp) ────────────────────────────────
    seen = set()
    unique_events = []
    for e in all_events:
        key = (e["message"], e["timestamp"], e["status"])
        if key not in seen:
            seen.add(key)
            unique_events.append(e)

    all_events = unique_events
    print(f"[DEBUG] Total unique events extracted: {len(all_events)}")

    # ── Split into categories for counts ────────────────────────────────────
    errors = [e for e in all_events if e["status"] == "ERROR"]
    warnings = [e for e in all_events if e["status"] == "WARNING"]
    failures = [e for e in all_events if e["status"] == "FAILED"]
    passes = [e for e in all_events if e["status"] == "PASSED"]
    exceptions = [e for e in all_events if e["status"] == "EXCEPTION"]

    print(f"[DEBUG]   ERRORS: {len(errors)}")
    print(f"[DEBUG]   WARNINGS: {len(warnings)}")
    print(f"[DEBUG]   FAILURES: {len(failures)}")
    print(f"[DEBUG]   PASSED: {len(passes)}")
    print(f"[DEBUG]   EXCEPTIONS: {len(exceptions)}")

    # ── Save detailed JSON ───────────────────────────────────────────────────
    os.makedirs("output", exist_ok=True)

    with open("output/parsed_logs.json", "w") as f:
        json.dump(all_events, f, indent=4)

    # ── Build summary ────────────────────────────────────────────────────────
    categories = [
        e["failure_category"]
        for e in all_events
        if e["failure_category"]
    ]
    failed_tests = list(
        set(e["test_name"] for e in failures if e["test_name"])
    )
    passed_tests = list(
        set(e["test_name"] for e in passes if e["test_name"])
    )

    category_counts = dict(Counter(categories).most_common())

    # Top error messages
    error_messages = [e["message"][:120] for e in errors + failures + exceptions]
    top_messages = dict(Counter(error_messages).most_common(10))

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
        "failure_category_breakdown": category_counts,
        "top_error_messages": top_messages,
        "most_common_failure_category": (
            Counter(categories).most_common(1)[0][0] if categories else None
        ),
        # kept for backward compat with the PostgreSQL schema
        "total_failures": len(failures),
        "most_common_failure_reason": (
            Counter(error_messages).most_common(1)[0][0]
            if error_messages
            else None
        ),
    }

    with open("output/build_summary.json", "w") as f:
        json.dump(summary, f, indent=4)

    print("✅ Logs parsed successfully")
    print(f"   Total events  → {len(all_events)}")
    print(f"   Detailed logs → output/parsed_logs.json")
    print(f"   Build summary → output/build_summary.json")

    return all_events, summary