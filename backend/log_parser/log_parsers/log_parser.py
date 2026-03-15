import re

def parse_log(file_path):
    current_timestamp = None
    with open(file_path, "r", encoding="utf-8") as file:
        for line in file:
            timestamp_pattern = r"\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}"
            timestamp_match = re.search(timestamp_pattern, line)
            if timestamp_match:
                current_timestamp = timestamp_match.group()

            has_error = "ERROR" in line
            has_failed = "FAILED" in line
            has_exception = "Exception" in line

            if has_error or has_failed or has_exception:
                if current_timestamp:
                    print("TIMESTAMP:", current_timestamp)
                
                if has_error:
                    print("ERROR:", line.strip())
                if has_failed:
                    print("FAILED:", line.strip())
                if has_exception:
                    print("EXCEPTION:", line.strip())
