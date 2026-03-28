# FastAPI backend — DigitalOcean App Platform

FROM python:3.11-slim

WORKDIR /app

# Install dependencies (using uv for speed)
COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir uv
RUN uv pip install --system --no-cache --index-strategy unsafe-best-match -r requirements.txt

# Copy all backend source files
COPY . .

# DigitalOcean dynamically provides the port via the $PORT environment variable
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}"]
