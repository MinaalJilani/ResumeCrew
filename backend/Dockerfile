# Hugging Face Spaces Docker — FastAPI backend
# App must listen on port 7860

FROM python:3.11-slim

# Create non-root user (HF requirement)
RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH"

WORKDIR /app

# Install dependencies first (layer caching)
COPY --chown=user requirements.txt requirements.txt
RUN pip install --no-cache-dir uv
RUN uv pip install --system --no-cache -r requirements.txt

# Copy all backend source files
COPY --chown=user . /app

# HuggingFace Spaces requires port 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
