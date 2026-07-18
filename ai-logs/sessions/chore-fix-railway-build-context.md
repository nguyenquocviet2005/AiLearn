# chore: fix Railway Docker build context and relocate diagnostic package

## Session

- Date: 2026-07-18
- Human owner: viet2005
- AI tool/model: Claude Code (Sonnet 5)
- Linear issue: none (ad hoc maintenance/deploy-fix task, no ticket assigned)
- Branch: `chore/fix-railway-build-context`
- Worktree: `/home/viet2005/workspace/worktrees/chore-fix-railway-build-context`
- Pull request: (recorded after creation)

## Objective

Fix a Railway deploy failure where `apps/api`'s Docker build could not resolve a path, and fold
`ai/diagnostic` into `packages/diagnostic` for consistency with `packages/schemas`, without a
broader folder reorganization.

## Context supplied

User reported Railway deploys of `apps/api/Dockerfile` fail to resolve a path and asked for a
folder-structure refactor to fix it, plus documentation updates to AGENTS.md/CLAUDE.md covering
Vercel/Railway root-directory settings.

## Root cause (found during planning)

- Railway's dashboard root directory for the `apps/api` service was set to `apps/api`, scoping the
  Docker build context to that subfolder.
- `apps/api/pyproject.toml` declares editable path dependencies reaching outside that folder:
  `ailearn-schemas` (`../../packages/schemas`) and `ailearn-diagnostic` (`../../ai/diagnostic`).
- `apps/api/Dockerfile` never `COPY`'d those sibling directories, and Docker's build context
  couldn't reach them anyway once scoped to `apps/api/`.
- Worked locally only because `uv sync` resolves against the full repo checkout on disk.

## Approved decisions

- Scope: targeted fix (Docker build context + Railway root directory) plus folding `ai/diagnostic`
  into `packages/diagnostic` — no broader reorg of `tests/`, `data/`, `eval/`, etc.
- No Linear issue exists for this work; use a descriptive branch name and skip the `[LINEAR-ID]`
  commit tag, but still write this session log.
- Isolate the work in a fresh `git worktree` off `origin/main` rather than the current directory,
  since the current directory had unrelated uncommitted VAI-14 work.

## Completed

- Moved `ai/diagnostic` → `packages/diagnostic` (`git mv`), removed the now-empty `ai/` directory.
- Updated `apps/api/pyproject.toml`'s `[tool.uv.sources]` path and regenerated `apps/api/uv.lock`
  via `uv lock --project apps/api`.
- Rewrote `apps/api/Dockerfile` to build from the repo root, explicitly `COPY`ing
  `apps/api`, `packages/schemas`, and `packages/diagnostic`.
- Moved `railway.toml` from `apps/api/` to the repo root; updated `dockerfilePath` to
  `apps/api/Dockerfile`.
- Added a repo-root `.dockerignore`.
- Updated `README.md` (repository layout table, Deployment/Railway section) and
  `docs/ARCHITECTURE.md` (path references) to reflect the new package location and Railway root
  directory.
- Added `docs/decisions/0002-relocate-diagnostic-package-and-fix-railway-build.md`.
- Added a "Deployment" subsection to `AGENTS.md` documenting Vercel (`apps/web`) and Railway
  (repo root) project root directories; created `CLAUDE.md` as an identical copy (it did not
  previously exist on `main`, consistent with the repo's convention of keeping the two files in
  sync).

## AI contributions

All of the above — root-cause investigation, plan, implementation, and verification were performed
by Claude Code with the user confirming scope and two process decisions (Linear-ID handling,
worktree isolation) via explicit questions before implementation began.

## Human decisions

- Accepted: targeted fix + light cleanup scope (over a full structural refactor or a zero-move
  deploy-only fix).
- Accepted: no Linear ID, descriptive branch name.
- Accepted: fresh worktree off `origin/main` to isolate from unrelated in-progress VAI-14 changes.

## Files changed

- `apps/api/Dockerfile`
- `apps/api/pyproject.toml`
- `apps/api/uv.lock`
- `railway.toml` (moved from `apps/api/railway.toml`)
- `.dockerignore` (new)
- `ai/diagnostic/*` → `packages/diagnostic/*` (moved)
- `README.md`
- `docs/ARCHITECTURE.md`
- `docs/decisions/0002-relocate-diagnostic-package-and-fix-railway-build.md` (new)
- `AGENTS.md`
- `CLAUDE.md` (new)
- `ai-logs/sessions/chore-fix-railway-build-context.md` (this file)

## Verification

| Check | Command | Result |
|---|---|---|
| Lockfile consistency | `uv sync --project apps/api --locked --all-groups` | PASS |
| Python tests | `uv run --project apps/api pytest tests/unit/schemas tests/unit/diagnostic apps/api/tests` | PASS (28) |
| Ruff format | `uv run --project apps/api ruff format --check apps/api` | PASS |
| Ruff lint | `uv run --project apps/api ruff check apps/api` | PASS |
| Mypy | `uv run --project apps/api mypy apps/api/src` | PASS |
| API build | `uv build --project apps/api` | PASS |
| Web format | `pnpm format:check` | PASS |
| Web lint | `pnpm lint` | PASS |
| Web/schemas typecheck | `pnpm typecheck` | PASS |
| Web tests | `pnpm test` | PASS (6) |
| Web build | `pnpm build` | PASS |
| Full gate | `./scripts/verify.sh` | PASS |
| Docker build (repo-root context) | `docker build -f apps/api/Dockerfile -t ailearn-api-test .` | PASS — this is the direct reproduction of the Railway build; it failed before this fix in the same configuration (build context = `apps/api/` only) and succeeds now with repo-root context |
| Container smoke test | `docker run ... ailearn-api-test` then `curl /health` | PASS — `{"status":"ok"}` |

## Remaining limitations

- **Manual step required**: the Railway dashboard's service root directory must be changed from
  `apps/api` to `.` (repo root) after this PR merges. This cannot be done from the repository — it
  is a dashboard-only setting. Documented in `README.md`, `AGENTS.md`/`CLAUDE.md`, and the ADR.
  Until that dashboard change is made, Railway deploys will still fail the same way.
  - Untried alternative (rejected): flatten `apps/api` to be fully self-contained so no repo-root
    context is needed at all — this would mean vendoring or duplicating `packages/schemas` and
    `packages/diagnostic`, or moving `apps/api` to depend on published packages instead of
    editable path installs. Rejected as a much larger change than the reported bug required.
- A live Railway deploy was not performed (no access to the Railway dashboard/account from this
  environment); verification instead reproduced the exact same Docker build Railway will run,
  locally, with the corrected build context, which succeeded.
- Vercel configuration and root directory were unaffected by this change; only documented for
  completeness per the user's request.
