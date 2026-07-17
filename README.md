# AiLearn

AiLearn is an adaptive tutoring platform for Vietnamese general education. This repository currently
contains a solution-agnostic full-stack walking skeleton: a React landing page calls a FastAPI endpoint,
which reads a small infrastructure status row from Supabase.

Product flows, authentication, offline behavior, adaptive-learning logic, AI agents, and all
product-specific data models are deliberately deferred.

## Prerequisites

- Node.js 22.x
- pnpm 11.x
- Python 3.12, managed by uv
- Docker-compatible runtime and the Supabase CLI only when validating migrations locally

The committed `.node-version` and `.python-version` files record the supported runtime baselines.

## Install

```bash
pnpm install --frozen-lockfile
uv sync --project apps/api --locked --all-groups
```

## Environment

Copy only the variables relevant to each application from `.env.example`.

```bash
# apps/web/.env.local
VITE_API_BASE_URL=http://localhost:8000

# apps/api/.env
APP_ENV=development
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=sb_secret_replace_me
CORS_ORIGINS=http://localhost:5173
LOG_LEVEL=INFO
```

`SUPABASE_SECRET_KEY` is backend-only. Never add it to a `VITE_*` variable, source file, log, or Git.

## Run Locally

Start the API:

```bash
uv run --project apps/api uvicorn ailearn_api.main:app --app-dir apps/api/src --reload
```

Start the web application in another terminal:

```bash
pnpm --filter @ailearn/web dev
```

The API exposes:

- `GET /health` for liveness without requiring Supabase.
- `GET /api/v1/system-status` for the Supabase-backed infrastructure check.
- `/docs` for FastAPI's generated OpenAPI documentation.

## Supabase Migration

`supabase/migrations/20260717000000_create_system_status.sql` contains the only schema in this
bootstrap: an infrastructure-only singleton used by the system-status endpoint. It is not a product model.

With a local Supabase CLI and Docker-compatible runtime:

```bash
supabase start
supabase db reset --local
```

Remote migration application is intentionally not automated by this repository. Run `supabase db push
--dry-run` first, then obtain environment-specific approval before applying a migration.

## Verification

```bash
./scripts/verify.sh
```

The script checks web and API format, lint, type safety, tests, and builds. It does not need live Supabase
credentials because API tests substitute the infrastructure client.

## Deployment

### Vercel

Create a Vercel project with root directory `apps/web`. Set `VITE_API_BASE_URL` to the Railway API origin.
`apps/web/vercel.json` provides the SPA fallback.

### Railway

Create a Railway service with root directory `apps/api`. The checked-in `railway.toml` defines the
Dockerfile build, `$PORT` start command, and `/health` health check. Configure `APP_ENV`, `SUPABASE_URL`,
`SUPABASE_SECRET_KEY`, and exact `CORS_ORIGINS` values in Railway's secret store.

## Repository Layout

```text
apps/web  React, Vite, TypeScript, shadcn/ui components
apps/api  FastAPI, Pydantic, Supabase Data API client
supabase  Infrastructure-only migration configuration
docs      Architecture and API contracts
```
