# syntax=docker/dockerfile:1

# -------------------------------------------------------------
# Stage 1: Build virtualenv with uv
# -------------------------------------------------------------
FROM python:3.11-slim-bookworm AS builder

# Install uv from the official image
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

WORKDIR /app

# Copy dependency specifications first to leverage Docker layer caching
COPY pyproject.toml uv.lock ./

# Install locked dependencies into /app/.venv without installing root package
RUN uv sync --frozen --no-dev --no-install-project

# -------------------------------------------------------------
# Stage 2: Minimal production runtime
# -------------------------------------------------------------
FROM python:3.11-slim-bookworm AS runner

# Install essential system dependencies (curl for container healthchecks)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user and group
RUN groupadd -r -g 1000 appgroup && \
    useradd -r -u 1000 -g appgroup -d /app appuser

WORKDIR /app

# Copy virtual environment from builder stage
COPY --from=builder /app/.venv /app/.venv

# Configure environment variables
ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONPATH="/app/apps/backend:$PYTHONPATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Copy application source code and entrypoint
COPY apps/backend /app/apps/backend
COPY infra/scripts/entrypoint.sh /app/entrypoint.sh

# Create staticfiles & media mount directories and set proper permissions
RUN mkdir -p /app/apps/backend/staticfiles /app/apps/backend/media && \
    chmod +x /app/entrypoint.sh && \
    chown -R appuser:appgroup /app

USER appuser

EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "2", "--threads", "4", "--timeout", "60"]
