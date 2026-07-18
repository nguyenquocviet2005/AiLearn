# AiLearn

AiLearn is an adaptive tutoring platform for Vietnamese general education. This repository contains a
full-stack walking skeleton plus a contract-first V1 foundation: shared schemas/fixtures, evidence
write/read, and the VAI-10 infrastructure status path.

Full diagnostic engines, teacher UI, authentication, offline behavior, and curriculum seeds remain
deferred to later issues.

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
- `POST /api/v1/evidence-events` and `GET /api/v1/evidence-events/{id}` for evidence write/read.
- `/docs` for FastAPI's generated OpenAPI documentation.

## Supabase Migration

`supabase/migrations/` currently includes:

- `20260717000000_create_system_status.sql` — infrastructure singleton for system-status.
- `20260718000000_create_evidence_events.sql` — product table for `EvidenceEventV1` persistence.

Shared V1 contracts and fixtures live in `packages/schemas/` and `data/fixtures/`.

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

Create a Railway service with root directory `.` (repo root) — **not** `apps/api`. `apps/api` depends on
`packages/schemas` and `packages/diagnostic` via editable path installs, so the Docker build context must
span the whole repo to resolve them. The checked-in root-level `railway.toml` points `dockerfilePath` at
`apps/api/Dockerfile` and defines the `$PORT` start command and `/health` health check. Configure `APP_ENV`,
`SUPABASE_URL`, `SUPABASE_SECRET_KEY`, and exact `CORS_ORIGINS` values in Railway's secret store.

## Repository Layout

```text
apps/web           React, Vite, TypeScript, shadcn/ui components
apps/api           FastAPI thin transport adapters
packages/schemas   Shared V1 contracts (JSON Schema, Pydantic, TypeScript)
packages/diagnostic Evidence foundation stubs
data/fixtures      Shared anonymized contract fixtures
supabase           Infrastructure and evidence migrations
docs               Architecture, API contracts, ADRs
tests/unit         Schema and diagnostic unit tests
```
