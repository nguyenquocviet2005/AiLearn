# VAI-25 — Demo and teacher flow

## Session

- Date: 2026-07-18
- Human owner: haiptd05
- AI tool: Codex (GPT-5)
- Linear issue: VAI-25
- Branch: `VAI-25-demo-and-teacher-flow`
- Worktree: `/Users/haipham/Documents/AiLearn`
- Pull request: <https://github.com/nguyenquocviet2005/AiLearn/pull/25>
- Baseline: `7d986367914fa91b22183637a0e7732119083bf4`

## Objective and supplied context

Make the Checkpoint 2 teacher workspace submission-ready: generate coherent synthetic demo data, adopt the merged VAI-40 landing-page visual language and official assets, ensure the complete teacher edit/approval/report/print workflow is usable and correct, document the demo and cross-device test, and leave owner-only Vercel dashboard work until after merge.

## Approved plan

1. Reconcile deterministic teacher demo data and validate cross-artifact invariants.
2. Restyle every teacher route using the merged landing-page tokens and official brand assets.
3. Harden navigation, edit/version, approve/reject/publish, loading, validation, error, report, and print behavior with focused tests.
4. Add the Checkpoint 2 presenter script, screenshot matrix, cross-device procedure, and printable fallback guidance.
5. Run changed-area and CI-equivalent verification, independent read-only review, and Draft PR CI.

## Human decisions

- **Accepted:** expand VAI-25 to cover all teacher workspace behavior, coherent demo data, landing-aligned UX/UI, and Checkpoint 2 submission artifacts.
- **Accepted:** use the current merged landing page as the visual source of truth.
- **Accepted:** use `ui-ux-pro-max` for accessibility, interaction, responsive, loading, and form-quality checks.
- **Accepted:** do not mutate Vercel settings; public-link testing is allowed and dashboard verification remains post-merge owner work.
- **Accepted:** use the configured `ailearn_reviewer` for independent read-only verification.

## AI contributions

- Refreshed to the merged VAI-40 baseline and inspected official brand assets and landing tokens.
- Regenerated teacher class and lesson fixtures from the deterministic Grade 7 evidence projection.
- Added cross-artifact tests for fixture equality, chronology, learners, evidence, curriculum skills, class, lesson, and printable plan identity.
- Added a shared branded teacher shell with persistent navigation and keyboard skip link.
- Added responsive, accessible loading, retry, empty, validation, save, approval, rejection, publication, success, conflict, report, and print states.
- Added immutable-version preservation and lifecycle regression tests.
- Authored the presenter script, cross-device procedure, screenshot matrix, print fallback, and post-merge provider checklist.

## Files changed

- Teacher UI and routing tests: `apps/web/src/App.test.tsx`, `apps/web/src/features/teacher/`, `apps/web/src/index.css`, `apps/web/src/lib/adapters/teacher-repository.ts`, and `apps/web/src/test/teacher-fixtures.ts`.
- Canonical web fixtures: `apps/web/src/test/fixtures/class-snapshot.json` and `apps/web/src/test/fixtures/lesson-plan.json`.
- Canonical repository fixtures: `data/fixtures/class-snapshot.json`, `data/fixtures/lesson-plan.json`, `data/fixtures/intervention-report.json`, and `data/fixtures/intervention-evidence.json`.
- Backend invariants: `apps/api/tests/test_teacher_projection.py` and `apps/api/tests/test_reports.py`.
- Submission documentation: `docs/DEMO_PLAN.md` and this AI collaboration log.
- `data/seeds/evidence-events.json` only gained its missing final newline; its 800 readiness events are otherwise unchanged.

## Commands and results

| Command                                                                                                                                                                                     | Result                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `apps/web/node_modules/.bin/prettier --check ...`                                                                                                                                           | PASS                                                                                                |
| `apps/web/node_modules/.bin/eslint .`                                                                                                                                                       | PASS                                                                                                |
| `apps/web/node_modules/.bin/tsc -b --pretty false`                                                                                                                                          | PASS                                                                                                |
| `apps/web/node_modules/.bin/vitest run`                                                                                                                                                     | PASS — 58 tests                                                                                     |
| `VITE_API_BASE_URL=https://ailearn-production-ec5e.up.railway.app apps/web/node_modules/.bin/vite build`                                                                                    | PASS; built bundle contains no `localhost:8000` or `127.0.0.1:8000`                                 |
| `uv run --project apps/api ruff format --check apps/api packages/planning tests/unit/planning`                                                                                              | PASS                                                                                                |
| `uv run --project apps/api ruff check apps/api packages/planning tests/unit/planning`                                                                                                       | PASS                                                                                                |
| `uv run --project apps/api mypy apps/api/src packages/planning/src`                                                                                                                         | PASS                                                                                                |
| `SUPABASE_URL= SUPABASE_SECRET_KEY= uv run --project apps/api pytest tests/unit/schemas tests/unit/diagnostic tests/unit/planning tests/unit/content tests/unit/remediation apps/api/tests` | PASS — 162 passed, 2 known JSON-Schema skips                                                        |
| `uv build --project apps/api`                                                                                                                                                               | PASS                                                                                                |
| `apps/api/.venv/bin/python validate.py`                                                                                                                                                     | PASS — 800 readiness events, 40 synthetic learners, 40 profiles, and four golden cases              |
| Local final production bundle: direct GET of `/`, `/teacher`, `/teacher/lesson-plan`, `/teacher/report`, `/teacher/report/print`, and `/student`                                            | PASS — six HTTP 200 responses                                                                       |
| Local credential-free API: `/health`, class snapshot, lesson plan, and report                                                                                                               | PASS — four HTTP 200 responses; report cites the new post-intervention evidence                     |
| Public `https://ai-learn-web-eight.vercel.app` direct route GETs                                                                                                                            | PASS — current merged production returned HTTP 200 for all six routes; this branch is not deployed  |
| Current live Railway API discovered from the public bundle: health, class snapshot, lesson plan, report, and frontend-origin CORS                                                           | PASS — safe GET-only checks                                                                         |
| Standard `pnpm --filter @ailearn/web test`                                                                                                                                                  | BLOCKED — local pnpm metadata requests a dependency purge/reinstall; dependencies were not modified |

## Independent review

- Cycle 1: `CHANGES_REQUIRED` with one HIGH data-coherence finding, three MEDIUM findings, and two LOW findings.
- Resolved HIGH: added distinct post-plan intervention evidence and contract/chronology/semantic validation; the readiness planning projection remains frozen at its explicit cutoff.
- Resolved MEDIUM: preserved teacher edits across the complete decision lifecycle, added reload regressions, removed superseded global teacher CSS, and made print styling self-contained.
- Resolved LOW: retry now exposes a loading state; this log was finalized.
- Cycle 2: no BLOCKER or HIGH remained. The reviewer found one final MEDIUM test-fixture mismatch: approval status and fixture timestamps did not mirror the backend contract.
- Final correction: fixture versions now use chronological creation times and backend-equivalent `draft`/`edited`/`approved` statuses while preserving edited content. Focused ESLint, TypeScript, and 15 workspace/app tests pass after this correction. No third review cycle was run because the workflow caps review/fix cycles at two.

## Remaining risks and limitations

- Final screenshots and the PDF require the merged production deployment; their exact capture matrix is ready in `docs/DEMO_PLAN.md`.
- The explicit second-physical-device check remains a post-merge human production verification step and is not represented as complete.
- Safari WebDriver was attempted, but local Safari has **Allow remote automation** disabled; browser-only visual and responsive claims were not made.
- Vercel dashboard settings are owner-only and were not inspected or modified.
- Two JSON-Schema tests remain skipped because `jsonschema` is unavailable in the locked environment.
- `validate.py` still has the known baseline limitation that it does not reject every invalid root-cause condition; the new intervention fixture is instead parsed through `EvidenceEventV1` in the API regression test.
- No backend runtime source, public contract, deployment configuration, dependency, secret, or production data was changed.
