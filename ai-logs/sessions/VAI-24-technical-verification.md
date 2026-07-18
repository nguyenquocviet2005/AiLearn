# VAI-24 — Technical verification

## Session

- Date: 2026-07-19
- Human owner: haiptd05
- AI tool: Codex (GPT-5)
- Linear issue: VAI-24
- Parent issue: VAI-23
- Branch: `VAI-24-technical-verification`
- Target branch: `dev`
- Worktree: `/Users/haipham/Documents/AiLearn-parallel-2`
- Baseline: `12f66d4373994a26a5e1c21dd2b8e2cb2559498d`

## Objective and approved plan

Verify the release candidate's deterministic engines, API/web checks, golden suite, and deployment
configuration. Record only reproducible results and do not expose credentials or mutate production.

## Human decisions

- Accepted: all routine work branches start from `origin/dev` and PRs target `dev`.
- Accepted: use the supplied staging Vercel, Railway, and Supabase URLs; keep Supabase credentials
  server-side only.
- Accepted: apply the reviewed staging migration/seed workflow from an authenticated operator
  environment without exposing credentials to this session. The operator applied the pending schema
  migrations and seeded the staging class and evidence data.

## Findings and correction

- The old fallback API host `https://api-production-8a6d.up.railway.app` returns `404 Application not found`.
- `https://ailearn-production-ec5e.up.railway.app/health` returns `{ "status": "ok" }`.
- The centralized browser production fallback now uses the healthy origin and is covered by a literal
  regression assertion.
- Staging Railway health is `200`, and its CORS response accepts
  `https://ai-learn-web-test.vercel.app`.
- After the operator applied migrations and seeded the explicit staging project, the teacher snapshot
  returns `200` with 40 students, five groups, and four teaching priorities; the lesson-plan endpoint
  returns `200` for the same class and preserves its existing versioned teacher decision state.

## Files changed

- `apps/web/src/lib/api-base-url.ts`
- `apps/web/src/lib/api-base-url.test.ts`
- `README.md`
- `ai-logs/sessions/VAI-24-technical-verification.md`

## Verification

| Command or check | Result |
| --- | --- |
| `./scripts/verify.sh` | PASS — 66 web tests, 123 Python tests, format, lint, types, web build, API build |
| `uv run --project apps/api python scripts/eval_golden.py` | PASS — 4/4 including abstention |
| Staging Railway `/health` | PASS — HTTP 200 |
| Staging CORS for Vercel origin | PASS — exact origin returned |
| Staging teacher snapshot | PASS — HTTP 200; 40 students, 5 groups, 4 priorities |
| Staging lesson plan | PASS — HTTP 200; persisted version 3, rejected/edited state for `class_g7a_demo` |
| Staging CORS | PASS — exact Vercel origin accepted for both teacher endpoints |
| Staging deployed web API target | PASS — `https://ailearn-staging.up.railway.app` embedded |
| Old fallback Railway `/health` | FAIL as expected — HTTP 404 application not found |
| Replacement fallback Railway `/health` | PASS — HTTP 200 |
| Production bundle inspection | PASS — neither the retired host nor `localhost:8000` is present |

## Independent review

- Initial verdict: `CHANGES_REQUIRED`; final verdict after the staging runtime gate: `PASS_WITH_NOTES`.
- No BLOCKER or code/security HIGH finding was identified.
- Documentation corrections requested by review were applied: the canonical seed command now uses
  `uv run --project apps/api`, and remote migration dry-run/approval requirements are explicit.
- The staging runtime gate is now resolved after the authorized operator migration/seed workflow and
  independent read-only endpoint checks.

## Remaining risk and limitations

The staging Supabase project is distinct from production and must remain linked/authenticated deliberately.
The operator applied the reviewed migrations and idempotent seed loader; this session did not read secrets,
change remote data, or deploy production. Browser visual interaction was not automated; HTTP route, CORS,
and production-bundle target checks provide the live evidence for the teacher data boundary.
