# ADR 0002: Relocate `ai/diagnostic` and fix the Railway Docker build context

## Status

Accepted.

## Context

Railway deploys of `apps/api` failed to resolve a path. `apps/api/pyproject.toml` declares editable
path dependencies on `ailearn-schemas` and `ailearn-diagnostic`, both living outside `apps/api/`. The
Railway service's dashboard root directory was set to `apps/api`, which scopes the Docker build
context to that subfolder — Docker cannot `COPY` from outside its build context, so the sibling
packages were unreachable during the container build even though the Dockerfile never attempted to
copy them either. `uv sync --project apps/api` worked locally only because the full repo checkout is
present on disk there.

Separately, `ai/diagnostic` is a shared library consumed by `apps/api` — the same role
`packages/schemas` plays — but lived at the top level instead of under `packages/`, which was
inconsistent with the rest of the shared-package layout.

## Decision

1. Move `ai/diagnostic` to `packages/diagnostic`, alongside `packages/schemas`, so all shared
   libraries consumed by `apps/api` live under one parent directory. No import paths change
   (`ailearn_diagnostic` remains the module name); only the `[tool.uv.sources]` path in
   `apps/api/pyproject.toml` and the `uv.lock` entries update.
2. Change the Docker build context for `apps/api` to the repository root instead of `apps/api/`.
   `apps/api/Dockerfile` now explicitly `COPY`s `packages/schemas` and `packages/diagnostic` in
   addition to `apps/api` itself, mirroring the on-disk relative layout so `uv`'s
   `../../packages/...` path sources resolve inside the container.
3. Move `railway.toml` to the repository root with `dockerfilePath = "apps/api/Dockerfile"`. The
   Railway service's dashboard root directory must be set to `.` (repo root) instead of `apps/api` —
   this is a manual dashboard change, not something expressible in the repo.
4. Add a repo-root `.dockerignore` so the now whole-repo build context doesn't ship `apps/web`,
   `node_modules`, `.git`, caches, or docs into the Docker build.

## Consequences

- Railway builds now require the service root directory to be the repo root; this must be updated
  in the Railway dashboard as a follow-up to merging this change.
- `apps/api/Dockerfile` is no longer self-contained to `apps/api/` — it depends on the repo-root
  build context and the `packages/schemas` and `packages/diagnostic` directories being present.
- Any future shared library consumed by `apps/api` via an editable path dependency should live under
  `packages/` and be added to the Dockerfile's explicit `COPY` list, or the same class of bug will
  recur.
- Vercel is unaffected: `apps/web` remains self-contained with its root directory at `apps/web`.
