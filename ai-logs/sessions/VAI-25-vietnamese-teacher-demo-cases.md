# VAI-25 — Vietnamese teacher demo cases

## Session

- Date: 2026-07-18
- Human owner: haiptd05
- AI tool: Codex (GPT-5)
- Linear issue: VAI-25
- Branch: `VAI-25-vietnamese-teacher-demo-cases`
- Worktree: `/Users/haipham/Documents/AiLearn-parallel-2`
- Baseline: `90382f8341739ee4c374aa8f47cdad170e327ba6`
- Pull request: pending

## Objective and supplied context

Enrich the synthetic Grade 7 teacher workspace with at least two explainable core-engine cases, make all teacher-facing routes Vietnamese, and prove the diagnostic, prioritization, grouping, and lesson-planning logic before any commit.

## Approved plan

1. Measure the merged synthetic projection and add exact domain invariants.
2. Generate coherent evidence, diagnoses, class groups, priorities, and the lesson plan through the real deterministic engines.
3. Present two engine-derived showcase cases and translate the complete teacher overview, lesson-plan, report, print, loading, and error experience.
4. Run targeted and full verification, then request an independent read-only review before commit.

## Human decisions

- **Accepted:** use synthetic Vietnamese Grade 7 inverse-proportion evidence and anonymized learner identifiers.
- **Accepted:** add rich teacher content only after verifying the core engine logic.
- **Accepted:** do not commit until implementation, tests, and independent review are complete.

## AI contributions

- Found and corrected an engine ordering defect that classified all-correct evidence as conflicting instead of ready.
- Added a reproducible generator that passes synthetic responses through the schema, diagnostic engine, teacher projection, grouping policy, and lesson-plan builder.
- Created two principal cases: a high-prevalence direct/inverse misconception and a lower-prevalence foundational ratio gap whose curriculum impact makes it the first teaching priority.
- Added exact readiness, root-cause, priority, partition, and Vietnamese 45-minute plan assertions.
- Localized teacher navigation, overview, evidence boundary, groups, plan lifecycle, report, printable view, loading, and safe error messages.
- Kept curriculum skill IDs in the shared contracts while mapping them to Vietnamese labels only at the presentation boundary.
- Refreshed onto merged VAI-41 before commit, preserved its new sidebar and visual system, and reapplied only the compatible VAI-25 content and behavior.

## Files changed

- Core diagnosis and tests: `packages/diagnostic/src/ailearn_diagnostic/engine.py`, `tests/unit/diagnostic/test_engine_golden.py`.
- Reproducible synthetic projection: `scripts/generate_teacher_demo_data.py`, `data/seeds/`, `data/fixtures/`, and mirrored web fixtures.
- Planning copy and invariants: `packages/planning/src/ailearn_planning/`, `apps/api/tests/test_teacher_projection.py`.
- Vietnamese teacher experience and tests: `apps/web/src/features/teacher/`, `apps/web/src/App.test.tsx`.
- Demo guidance: `docs/DEMO_PLAN.md`.

## Commands and results

| Command | Result |
| --- | --- |
| `pnpm format:check` | PASS |
| `pnpm lint` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm test` | PASS — 59 tests |
| `pnpm build` | PASS — production Vite build |
| `uv run --project apps/api ruff format --check ...` | PASS |
| `uv run --project apps/api ruff check ...` | PASS |
| `uv run --project apps/api mypy apps/api/src packages/diagnostic/src packages/planning/src` | PASS — 43 source files |
| `SUPABASE_URL= SUPABASE_SECRET_KEY= uv run --project apps/api pytest ...` | PASS — 163 passed, 2 known schema skips |
| `uv build --project apps/api` | PASS — source distribution and wheel |
| `uv run --project apps/api python validate.py` | PASS — 20 items, 40 synthetic learners, 766 events, 40 profiles, 4 golden cases |
| `uv run --project apps/api python scripts/generate_teacher_demo_data.py` plus web fixture formatting and before/after SHA-256 comparison | PASS — byte-stable outputs |
| Production bundle search for `localhost:8000`, `127.0.0.1:8000`, root fixture paths, and seed filenames | PASS — zero matches |
| `git diff --check` | PASS |

## Independent review

- Initial verdict: `CHANGES_REQUIRED`, with no BLOCKER or HIGH findings.
- MEDIUM resolved: translated the final visible sidebar phrase from `Checkpoint 2` to `Mốc kiểm tra 2` and added a rendered-shell assertion.
- LOW resolved: finalized this verification record before commit.
- Reviewer independently regenerated the 766 events, re-ran all 40 diagnoses, and confirmed exact semantic agreement with the committed profiles, snapshot, plan, priority order, group partition, and two showcase cases.
- Final review verdict after corrections: `PASS`, with no unresolved BLOCKER, HIGH, or MEDIUM findings.

## Live custom-domain diagnosis

- `https://ailearn-vaic.cloud/teacher` serves the deployed Vercel application successfully.
- Its public bundle explicitly selects `https://ailearn-production-ec5e.up.railway.app` through the deployed `VITE_API_BASE_URL` value, rather than the repository's production fallback origin.
- The Railway teacher snapshot request returns HTTP 200, but omits `Access-Control-Allow-Origin` for both `https://ailearn-vaic.cloud` and `https://www.ailearn-vaic.cloud` while returning the header for `https://ai-learn-web-eight.vercel.app`.
- A custom-domain lesson-plan POST preflight returns HTTP 400. The browser therefore blocks otherwise successful teacher API responses and the UI accurately reports that the API is unavailable.
- Required owner action: add both exact custom origins to Railway `CORS_ORIGINS`, retain any still-used Vercel origins, redeploy the API, and repeat GET/preflight/browser checks. No provider configuration, secret, or deployment was changed in this session.

## Remaining risks and limitations

- Synthetic evidence demonstrates deterministic policy behavior; it is not production classroom data and must not be interpreted as validated learning science outcomes.
- No Vercel dashboard setting or production deployment was inspected or modified in this session.
- The live custom domain remains blocked by Railway CORS until the owner completes the documented provider action.
- Two JSON-Schema tests remain skipped because the optional `jsonschema` dependency is unavailable in the locked environment; all other 163 backend/core tests pass.
