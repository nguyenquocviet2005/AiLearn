FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

COPY apps/api/pyproject.toml apps/api/uv.lock apps/api/
COPY packages/schemas packages/schemas
COPY packages/diagnostic packages/diagnostic
COPY packages/planning packages/planning
COPY packages/content packages/content
COPY packages/remediation packages/remediation
COPY data data
COPY eval eval

WORKDIR /app/apps/api
RUN uv sync --frozen --no-dev --no-install-project

COPY apps/api/src ./src
RUN uv sync --frozen --no-dev

EXPOSE 8000

CMD ["uv", "run", "--no-sync", "uvicorn", "ailearn_api.main:app", "--host", "0.0.0.0", "--port", "8000"]
