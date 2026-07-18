# VAI-23 — Release candidate and submission package

## Session

- Date: 2026-07-19
- Human owner: haiptd05
- AI tool: Codex (GPT-5)
- Linear issue: VAI-23
- Branch: `VAI-23-release-candidate-submission-package`
- Target branch: `dev`
- Worktree: `/Users/haipham/Documents/AiLearn-parallel-2`
- Baseline: `841f3984dff6cf59fdc7c62a83e455528be078db`

## Scope

Release verification only. No new product feature, contract, migration, secret, or deployment change was made.

## Child-issue reconciliation

- VAI-24: merged into `dev` via PR #35; live staging teacher snapshot and lesson-plan verification passed.
- VAI-25: human-confirmed complete; its merged PRs #25 and #28 are linked in Linear.
- VAI-26: Done in Linear; merged PR #27.

## Live staging evidence

- All current SPA routes returned HTTP 200 on `https://ai-learn-web-test.vercel.app`:
  `/`, `/student`, `/teacher`, `/teacher/lesson-plan`, `/teacher/report`, and `/teacher/report/print`.
- Safe API GETs returned HTTP 200 from `https://ailearn-staging.up.railway.app`:
  `/health`, `/api/v1/system-status`, `/api/v1/demo/personas`, the teacher snapshot, lesson plan,
  and `/api/v1/reports/report_demo_01`.
- Teacher snapshot has 40 students, five groups, and four priorities. The report contains five outcome
  categories and a Vietnamese next-lesson focus. CORS permits the staging Vercel origin.
- The deployed staging web bundle targets the staging Railway API; no request is expected to target localhost.

## Verification

| Command or check | Result |
| --- | --- |
| `./scripts/verify.sh` | PASS — format, lint, types, 66 web tests, 123 Python tests, web/API builds |
| `uv run --project apps/api python scripts/eval_golden.py` | PASS — 4/4 cases including abstention |
| Public SPA deep links | PASS — all six current routes returned HTTP 200 |
| Safe staging API reads | PASS — all six checked endpoints returned HTTP 200 |
| `git diff --check` | PASS |

## Limitations

- HTTP route and API smoke checks were performed; browser visual interaction and another-device manual
  walkthrough were not automated in this session.
- This PR records release evidence only. Human review and merge are still required before closing VAI-23.
