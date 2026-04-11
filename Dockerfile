# Stage 1: Build React frontend
FROM node:22-alpine AS frontend-build
WORKDIR /app/web
COPY web/package.json web/package-lock.json* ./
RUN npm ci
COPY web/ ./
RUN npm run build

# Stage 2: Python runtime
FROM python:3.12-slim
WORKDIR /app

# Install system deps for bcrypt/cryptography
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY travel_agent/ ./travel_agent/

# Copy Claude skills (system_prompt.py reads from .claude/skills/ at runtime)
COPY .claude/ ./.claude/

# Copy built frontend
COPY --from=frontend-build /app/web/dist ./web/dist

# Create data directory for SQLite
RUN mkdir -p /app/data

# Alembic config (if present)
COPY alembic.ini* ./
COPY travel_agent/db/migrations/ ./travel_agent/db/migrations/

EXPOSE 8000

CMD ["uvicorn", "travel_agent.adapters.fastapi_app:app", "--host", "0.0.0.0", "--port", "8000"]
