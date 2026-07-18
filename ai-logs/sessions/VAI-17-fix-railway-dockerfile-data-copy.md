# VAI-17 (follow-up): Fix Railway deploy — copy data/ and eval/ into the API Docker image

## Session

- Date: 2026-07-18
- Human owner: Việt Nguyễn Quốc
- AI tool/model: Claude Code (Sonnet 5)
- Linear issue: VAI-17 (post-merge production deploy fix)
- Branch: `vai-17-fix-railway-dockerfile-data-copy`
- Worktree: `/home/viet2005/workspace/AiLearn`
- Pull request: (to be attached once opened)

## Objective

The Railway `production` deploy of `apps/api` failed a few minutes after PR #14 (VAI-17) merged to
`main`. Diagnose the failure and fix it if possible.

## Diagnosis

`railway status` showed the `AiLearn` service `Online · Deploy failed`, still serving the prior
good deployment (VAI-16, commit `23e4814`) because Railway does not cut traffic to an unhealthy
deployment. `railway logs --build --latest` showed the Docker build itself succeeding; `railway
logs --deployment --latest` showed the container crashing on startup:

```
FileNotFoundError: [Errno 2] No such file or directory: '/app/data/seeds/curriculum.json'
```

Root cause: VAI-17 (`b15bc2d`) added `apps/api/src/ailearn_api/curriculum.py`, which calls
`load_curriculum()`/`load_items()` at import time — these read `data/seeds/curriculum.json` and
`data/seeds/items.json` (resolved relative to repo root via
`packages/diagnostic/src/ailearn_diagnostic/loaders.py:REPO_ROOT`). `apps/api/Dockerfile` was never
updated to `COPY` the repo's `data/` (or `eval/`, used by `scripts/eval_golden.py` via the same
`REPO_ROOT`-relative resolution) directories into the image, so the module import — and therefore
the whole app — crashed before `/health` could bind. This is the same class of bug documented in
[`docs/decisions/0002-relocate-diagnostic-package-and-fix-railway-build.md`](../../docs/decisions/0002-relocate-diagnostic-package-and-fix-railway-build.md):
a path the app needs at runtime that isn't in the Docker build context/COPY list.

## AI contributions

- Added `COPY data data` and `COPY eval eval` to `apps/api/Dockerfile`.
- Verified locally: `docker build -f apps/api/Dockerfile -t ailearn-api-test .` from repo root
  (matching Railway's build context), then `docker run` + `curl /health` → `200 {"status":"ok"}`.
- Created this session log and a new branch/PR off `origin/main` (the previous VAI-17 branch was
  already merged).

## Human decisions

- Confirmed to proceed with: new branch + draft PR (rather than a local-only commit or no further
  action).

## Files changed

- `apps/api/Dockerfile` (+2 lines: `COPY data data`, `COPY eval eval`)

## Commands and results

| Command | Result |
|---|---|
| `railway status` | Showed `Deploy failed` on the service |
| `railway logs --build --latest -n 300` | PASS (build succeeded) |
| `railway logs --deployment --latest -n 300` | Showed the `FileNotFoundError` crash traceback |
| `docker build -f apps/api/Dockerfile -t ailearn-api-test .` | PASS |
| `docker run -d -p 18080:8000 -e PORT=8000 ailearn-api-test` + `curl /health` | PASS (`200 {"status":"ok"}`) |

Full project verification (`./scripts/verify.sh`) was not re-run since the only change is a
Dockerfile `COPY` addition with no source or test changes; CI will still run it against the PR.

## Remaining risks and limitations

- `scripts/eval_golden.py` and `apps/api/src/ailearn_api/scripts/seed_fixtures.py` are dev/ops
  tools, not invoked by the running container's start command — copying `eval/` into the image is
  for consistency/parity with `data/`, not because the running service currently needs it.
- The Railway dashboard's service root directory must remain the repo root (`.`), per ADR 0002 —
  unchanged by this fix.

## References

- Linear: VAI-17
- Branch: `vai-17-fix-railway-dockerfile-data-copy`
- Pull request: (pending)
- AI log: this file
