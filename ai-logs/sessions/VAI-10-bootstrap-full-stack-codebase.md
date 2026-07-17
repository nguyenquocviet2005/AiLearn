# VAI-10: Bootstrap Full-Stack Codebase

## Session

- Date: 2026-07-17
- Human owner: haiptd05@gmail.com
- AI tool/model: Codex, GPT-5
- Linear issue: VAI-10
- Branch: `VAI-10-bootstrap-codebase`
- Worktree: `/Users/haipham/Documents/AiLearn`
- Pull request: none

## Objective

Create a solution-agnostic walking skeleton using React/Vite/TypeScript/shadcn/ui, FastAPI/Pydantic,
Supabase, GitHub Actions, Vercel, and Railway.

## Approved Boundaries

- Accepted: monorepo layout, React to FastAPI to Supabase system-status flow, pnpm, uv, README, CI,
  `.env.example`, and this log.
- Deferred: authentication, offline storage, product-specific schemas, adaptive-learning logic,
  multi-agent product implementation, and a separate model service.
- No commit, push, pull request, deployment, remote migration, or Linear modification is authorized.

## AI Contributions

- Created the workspace, API, web application, infrastructure-only Supabase migration, CI, deployment
  configuration, documentation, and verification script.
- Added focused API and UI tests for the system-status flow and unavailable-state behavior.
- Installed the local Node.js 22 and pnpm toolchain after approval.

## Independent Review Follow-up

Human accepted two HIGH findings for VAI-10:

- `CORS_ORIGINS` was decoded as JSON before its comma-separated validator ran.
- `env_file=".env"` depended on the repository working directory instead of the documented
  `apps/api/.env` location.

Fixes applied:

- Added `NoDecode` to `cors_origins` and preserved comma-separated parsing.
- Resolved the dotenv path from the API package location.
- Added focused configuration tests for both behaviors.

## Commands and Results

| Command | Result |
|---|---|
| `uv lock --project apps/api` | PASS |
| `uv sync --project apps/api --locked --all-groups` | PASS |
| API format, lint, mypy, and tests | PASS |
| `pnpm install` | PASS after explicit esbuild build approval |
| Web lint, type-check, tests, and build | PASS |
| `./scripts/verify.sh` | PASS |
| Manual API smoke test: `/health`, `/docs`, unconfigured system status | PASS |
| `pytest apps/api/tests/test_config.py` after review fixes | PASS, 2 tests |
| `./scripts/verify.sh` after review fixes | PASS, 7 API tests |

## Human Manual Verification

Date: 2026-07-18

The initial `SUPABASE_URL` and backend secret key belonged to inconsistent projects. The local
`apps/api/.env` was corrected with matching credentials for the linked Supabase project. No credential
values are recorded in this log, and no application code change was required.

| Check | Result |
|---|---|
| Supabase migration local/remote versions match | PASS |
| `GET /health` | PASS, HTTP 200 |
| `GET /api/v1/system-status` | PASS, HTTP 200 |
| Backend read from linked Supabase project | PASS |
| Frontend loaded successfully | PASS |
| Frontend called local FastAPI | PASS |
| Frontend rendered database status `operational` | PASS |
| Browser Network request to `/api/v1/system-status` | PASS, HTTP 200 |
| CORS | PASS |
| Frontend error state with backend unavailable | PASS |
| Retry after backend restart | PASS |
| Real `.env` files remain Git-ignored | PASS |

## Remaining Risks

- Independent verification and human review remain required before merge.
## Production Deployment Verification

### Deployment targets

- Frontend:
  https://ai-learn-web-eight.vercel.app
- Backend:
  https://api-production-8a6d.up.railway.app
- Production branch:
  `main`

### Provider configuration

#### Vercel

- Root directory: `apps/web`
- Framework: Vite
- API base URL configured through `VITE_API_BASE_URL`
- No backend or Supabase secret was exposed to the frontend

#### Railway

- Root directory: `/apps/api`
- Config file: `/apps/api/railway.toml`
- Healthcheck path: `/health`
- Application binds to Railway-provided `$PORT`
- Production CORS origin:
  `https://ai-learn-web-eight.vercel.app`

### Deployment corrections

1. Added `.vite/` to `apps/web/.prettierignore` because generated Vite
   metadata caused local formatting verification to fail.

2. Wrapped the Railway start command in `sh -c` so `$PORT` is expanded
   before uvicorn receives it.

3. Used `exec` in the Railway start command to preserve correct process
   signal handling.

4. Configured the Vercel production API URL and Railway production CORS
   origin.

### Public verification

```text
GET /health
HTTP 200
{"status":"ok"}
