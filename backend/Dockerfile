# Use official Python image
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Copy dependency file first (for Docker cache optimization)
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy entire backend code
COPY app ./app

# Expose FastAPI port
EXPOSE 8000

# Default command (can be overridden)
CMD ["python", "-u", "-m", "app.worker.worker"]