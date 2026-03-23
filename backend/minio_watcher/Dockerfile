FROM python:3.11-slim

WORKDIR /app

# Install watcher dependencies
# (build context = ./backend, so minio_watcher/requirements.txt)
COPY minio_watcher/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy watcher source (relative to build context ./backend)
COPY minio_watcher/ /app/watcher/

# Copy the log_parser package so we can reuse parse_build + delete_build_data
COPY log_parser/ /app/log_parser/

# Add both directories to PYTHONPATH
ENV PYTHONPATH="/app/log_parser:/app/watcher:/app"

CMD ["python", "/app/watcher/watcher.py"]
