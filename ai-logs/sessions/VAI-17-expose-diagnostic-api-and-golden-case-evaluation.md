# VAI-17: Expose Diagnostic API and golden-case evaluation

## Session

- Date: 2026-07-18
- Human owner: Việt Nguyễn Quốc
- AI tool/model: Claude Code (Sonnet 5)
- Linear issue: VAI-17
- Branch: `vai-17-expose-diagnostic-api-and-golden-case-evaluation`
- Worktree: `/home/viet2005/workspace/AiLearn`
- Pull request: https://github.com/nguyenquocviet2005/AiLearn/pull/14 (Draft)

## Objective

Expose the deterministic diagnostic engine (VAI-14) over HTTP — `POST /diagnostics/start`,
`POST /diagnostics/{id}/responses`, `GET /students/{id}/diagnostic-profile` — plus a
fixture-to-Supabase seed loader and a one-command golden-case evaluation runner, so student
clients can complete a readiness session against real profiles.

## Approved plan defaults

Four architecture-sensitive decisions were confirmed with the human owner during planning (all
recommended options accepted):

1. **Idempotency**: reuse `evidence_events.id` as the idempotency key. A retried write hits a
   Supabase primary-key conflict (`409`), which `insert_evidence_event` catches and treats as
   "already recorded" by replaying the existing row — no new migration.
2. **Session storage**: in-memory dict (`ailearn_api.diagnostic_session_store`), matching the
   `routes/remediation.py` (VAI-16) precedent. VAI-20 owns swapping all routers to durable
   Supabase-backed storage.
3. **"Diagnostic fallback when optional model calls fail"**: dropped. `packages/diagnostic`
   forbids LLM/model imports (enforced by an existing test) and no optional model call exists
   anywhere in this path.
4. **Profile source**: `GET /students/{id}/diagnostic-profile` computes the profile live via
   `diagnose()` from the student's persisted `evidence_events`, rather than reading a precomputed
   table. `data/seeds/diagnostic-profiles.json` was not loaded into a new table.

## AI contributions

- `students` migration + `students_client.py` + `models/student.py` + `routes/students.py`
  (`GET /api/v1/students/{id}/diagnostic-profile`, computed live via `diagnose()`)
- `evidence_client.py`: `fetch_evidence_events_for_student()` + idempotent PK-conflict handling in
  `insert_evidence_event()`
- `diagnostic_session_store.py` (in-memory) + `models/diagnostic_session.py` +
  `POST /api/v1/diagnostics/start` (wraps `build_readiness_session()`, strips the answer key from
  returned items) + `POST /api/v1/diagnostics/{id}/responses` (server-side correctness derivation,
  deterministic evidence-event id, idempotent insert, remaining-item/completion tracking)
- `scripts/eval_golden.py`: one-command golden-case evaluation CLI reusing
  `load_golden_suite/load_curriculum/load_items/diagnose`; asserts readiness status, ranked
  root-cause order, and evidence traceability per case; fails if no case abstains
- `apps/api/src/ailearn_api/scripts/seed_fixtures.py`: idempotent (merge-duplicates upsert)
  fixture loader for `students.json` and `evidence-events.json`
- Added `AssessmentItem`, `Curriculum`, `GoldenCase`, `GoldenSuite`, `ItemIndex`, `ItemOption` to
  `packages/diagnostic`'s public `__init__.py` exports (additive only — no engine logic touched)
  so the thin API layer can type against the engine's existing return types instead of reaching
  into the internal `models` submodule
- Tests: `test_students.py`, `test_students_client.py`, `test_diagnostics_session.py`,
  `test_eval_golden.py` (subprocess), `test_seed_fixtures.py`, plus idempotency/fetch-by-student
  tests added to `test_evidence.py`
- Updated `docs/API_CONTRACTS.md` (three new endpoint contracts) and `docs/ARCHITECTURE.md`
  (in-memory session store + its VAI-20 follow-up, live-computed profile, new `students` table)

## Human decisions

- Accepted: all four architecture-sensitive decisions above (idempotency mechanism, session
  storage, dropping the inapplicable model-call-fallback line, live-computed profile source).

## Files changed

See PR diff. Summary: 7 modified files (`evidence_client.py`, `main.py`, `routes/diagnostics.py`,
`test_evidence.py`, `docs/API_CONTRACTS.md`, `docs/ARCHITECTURE.md`,
`packages/diagnostic/.../__init__.py`) + 15 new files (routers, clients, models, session store,
seed loader, golden-eval script, migration, tests).

## Commands and results

| Command | Result |
|---|---|
| `uv run --project apps/api pytest apps/api/tests tests/unit/diagnostic -q` (prerequisite check, before changes) | PASS (31) |
| `uv run --project apps/api pytest apps/api/tests -q` | PASS (38) |
| `uv run --project apps/api pytest tests/unit/diagnostic -q` | PASS (17) |
| `uv run --project apps/api python scripts/eval_golden.py` | PASS (4/4 cases, incl. `gc_04_insufficient_evidence` abstained) |
| `uv run --project apps/api ruff format apps/api scripts/eval_golden.py` | 3 files reformatted, then clean |
| `uv run --project apps/api ruff check apps/api scripts/eval_golden.py` | PASS (after removing one unused import) |
| `uv run --project apps/api mypy apps/api/src` | PASS (21 source files, strict mode) |
| `./scripts/verify.sh` | PASS (pnpm format/lint/typecheck/test/build for web+schemas; ruff format/check + mypy + pytest (65) + `uv build` for api) |

## Remaining risks and limitations

- In-memory diagnostic sessions do not survive an API process restart (Railway redeploy). By
  design per decision #2 — VAI-20 owns the durable-storage swap. Submitted responses are persisted
  immediately as `evidence_events`, so no student evidence is lost, only an in-progress unsubmitted
  session's item selection would need restarting.
- A retry that reuses the same deterministic evidence id is idempotent, but two concurrent
  requests for a genuinely new (session, item) pair with different generated ids could both
  succeed as separate evidence events. Accepted as out of scope for this milestone.
- `load_curriculum()`/`load_items()` only ever load the single seeded demo lesson;
  `POST /diagnostics/start` validates `lesson_id` against it but does not yet select among
  multiple lessons.
- `data/seeds/diagnostic-profiles.json` (40 precomputed demo profiles) is not loaded anywhere by
  `seed_fixtures.py` — it was intentionally treated as a verification reference, not a seed
  target, per decision #4.
- Manual end-to-end verification against a live Supabase project (seed → start → responses →
  profile, diffed against `diagnostic-profiles.json`) was not run in this session — only unit/
  integration tests against mocked Supabase responses. Flagged in the completion report as a
  remaining limitation.
