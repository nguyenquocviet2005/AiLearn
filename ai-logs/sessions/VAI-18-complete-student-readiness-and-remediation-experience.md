# VAI-18: Complete student readiness and remediation experience

## Session

- Date: 2026-07-19
- Human owner: Việt Nguyễn Quốc
- AI tool/model: Claude Code (Sonnet 5)
- Linear issue: VAI-18
- Branch: `vai-18-complete-student-readiness-and-remediation-experience`
- Worktree: `/home/viet2005/workspace/AiLearn`
- Pull request: (created after this log was committed — see PR link in the Linear comment / PR
  description)

## Objective

Build the first end-to-end student-facing surface: a student completes a readiness assessment,
gets diagnosed, and works through a remediation path, with offline resume and queued-write
handling. Both backend prerequisites (VAI-14/VAI-17 diagnostics HTTP, VAI-16 remediation engine)
were Done and merged to `main` before this issue started.

## Approved plan defaults

Four decisions were confirmed with the human owner during planning; three expanded scope beyond
pure frontend work, into VAI-11's frozen contract and VAI-16's already-Done backend surface (all
non-default/larger-scope options were explicitly chosen):

1. **Data source**: real HTTP API primary (the issue's "develop against `data/fixtures/`" note was
   stale — VAI-17 had already merged); `data/fixtures/` not wired in as a runtime fallback.
2. **Confidence field**: added an optional `confidence: number | null` to `EvidenceEventV1`
   (additive per the V1 freeze policy) so the UI's confidence input is actually persisted.
3. **Remediation attempt grading**: added `checkpoint_answer` to the remediation route's `content`
   response so the frontend grades objectively instead of self-report.
4. **Remediation attempt idempotency**: added a server-side `attempt_id` dedupe to
   `POST /api/v1/remediation/attempts`, since `RemediationEngine.advance()` has no idempotency of
   its own.

Two design documents (`docs/AILEARN_SYSTEM_UX_BLUEPRINT.md`, `docs/adaptive_tutoring_ux_redesign1.html`
— a working static prototype) were reviewed mid-planning at the human owner's request and replaced
several earlier from-first-principles design choices: the 3-option labeled confidence scale
("Em giải thích được"/"Em chưa chắc"/"Em đang đoán"), the 4-tab student shell, no-immediate-feedback
on readiness questions, an explicit "Lưu và làm sau" pause action, and reframing "hint levels" as a
4-action Help panel (read-aloud via native `speechSynthesis`, replay worked example, local-only
"ask teacher" note, offline-cache viewer) rather than a progressive text reveal.

## AI contributions

- Registered `remediation_router` into `main.py` (was built in VAI-16 but never wired in) and
  added `apps/api/tests/test_remediation.py` (previously zero HTTP-level tests existed for it)
- Added `confidence` end-to-end: `packages/schemas` (Python/TS/JSON Schema), a
  `evidence_events.confidence` migration, `evidence_store.to_persistence_row()`, API request/
  response models, `evidence_client.py` select lists, `routes/diagnostics.py` pass-through
- Added `checkpoint_answer` to the remediation content payload and `attempt_id`-keyed idempotency
  to `POST /remediation/attempts` (per-student processed-attempt-id map, mirroring VAI-17's
  evidence-id approach)
- `apps/web/src/lib/adapters/student-repository.ts` + `student-types.ts`: real HTTP adapter over
  diagnostics + remediation, typed transient session shapes kept out of `@ailearn/schemas`
  (reserved for persisted V1 contracts)
- `apps/web/src/lib/offline/`: `queue.ts` (`PendingWrite[]` in `localStorage`), `sync.ts` (FIFO
  flush, stops at first failure so remediation attempts are never reordered, returns per-write
  results so the UI can react to its own submission), `content-cache.ts` (caches the student's own
  last-fetched data — the actual mechanism behind "cached content accessible offline", not the
  static `data/fixtures/` seed JSON, which covers a different demo student/lesson)
- `apps/web/src/features/student/`: `StudentWorkspace.tsx` (4-tab shell + full flow state machine,
  reload-resilient via `content-cache`), `StudentHome.tsx`, `ReadinessQuestion.tsx`,
  `RemediationPath.tsx` (representation-aware rendering, checkpoint grading, step list,
  escalation screen), `StudentHelp.tsx`, `copy.ts` (the only place technical labels are translated
  to student-facing language), `confidence.ts`, `student.css` (scoped design tokens — see Risks)
- Wired `/student` into `App.tsx` (manual pathname routing, matching the existing `/teacher`
  convention)
- Found and fixed a real bug during test-writing: `diagnoseAndStartRemediation()` /
  `resolveConfirmation()` were each triggered twice (once directly, once via a `pendingCount`
  effect), racing and consuming a mocked repository call meant for a different step. Fixed by
  removing the direct calls and relying solely on the effect.
- Tests: `test_remediation.py` (12 cases incl. idempotency + `checkpoint_answer`), confidence
  coverage added to `test_evidence.py`/`test_diagnostics_session.py`, `queue.test.ts`,
  `sync.test.ts`, `content-cache.test.ts`, `StudentWorkspace.test.tsx` (7 cases: full flow with a
  no-technical-label assertion, confidence-required-to-submit, representation-change note,
  CONFIRMATION disambiguation, offline/reconnect no-duplicate-resend, reload-resume, offline
  help-tab content list)
- Updated `docs/API_CONTRACTS.md` (confidence field, full `/api/v1/remediation/*` section — was
  entirely undocumented) and `docs/ARCHITECTURE.md` (remediation registration, attempt
  idempotency, student feature + offline layer description)

## Human decisions

- Accepted: all four architecture-sensitive decisions above.
- Directed: reference `docs/AILEARN_SYSTEM_UX_BLUEPRINT.md` and
  `docs/adaptive_tutoring_ux_redesign1.html` for design, plan revised accordingly before
  implementation began.

## Files changed

15 modified files (backend confidence plumbing, remediation route, `App.tsx`, docs) + 19 new files
(student feature components, offline lib, adapters, migration, tests). See PR diff for the full
list.

## Commands and results

| Command | Result |
|---|---|
| `uv run --project apps/api pytest apps/api/tests tests/unit/diagnostic tests/unit/remediation tests/unit/content tests/unit/schemas -q` (prerequisite check, before changes) | PASS (106 passed, 2 skipped) |
| `uv run --project apps/api pytest apps/api/tests/test_remediation.py -q` | PASS (12) |
| `uv run --project apps/api pytest apps/api/tests tests/unit/diagnostic tests/unit/remediation tests/unit/content tests/unit/schemas -q` (after changes) | PASS (124 passed, 2 skipped) |
| `uv run --project apps/api ruff check apps/api` / `ruff format apps/api` | PASS |
| `uv run --project apps/api mypy apps/api/src` | PASS (21 files, strict) |
| `pnpm --filter @ailearn/web test` | PASS (28: offline lib 15, App 2, TeacherWorkspace 4, StudentWorkspace 7) |
| `pnpm --filter @ailearn/web lint` / `typecheck` / `format` | PASS |
| `pnpm --filter @ailearn/web build` | PASS |
| `./scripts/verify.sh` | PASS (pnpm format/lint/typecheck/test/build; api ruff/mypy/pytest(83)/`uv build`) |
| `pnpm exec vite` + `curl /student` | Dev server boots, SPA shell serves `200` |

## Remaining limitations

- No live browser walkthrough was performed — this environment has no live Supabase-backed
  deployment or browser-automation tool available. Verification instead relied on: the full
  backend integration test suite (mocked Supabase), and React Testing Library integration tests
  that exercise the actual component tree, state machine, and offline queue in jsdom (including a
  test that caught a real double-invocation race bug before it shipped). A manual browser
  walkthrough per `docs/AILEARN_SYSTEM_UX_BLUEPRINT.md`'s stated verification is still recommended
  before merge.
- The demo student id (`stu_g7_001`) is hardcoded and must already exist in the `students` table
  (via `seed_fixtures.py`) for the full flow — including the `GET .../diagnostic-profile` step —
  to work against a real deployment. No login/student-selection flow exists.
- In-memory remediation/diagnostic sessions still do not survive an API process restart (VAI-20's
  scope); client-side reload-resume (via `content-cache.ts`) covers the browser-reload case but not
  a server-side restart mid-session.
- The "Nhờ cô giải thích" (ask teacher) help action is local-only — no teacher inbox exists yet to
  receive it (flagged explicitly in the UI copy and in `docs/ARCHITECTURE.md`).
- `scripts/verify.sh`'s pytest scope does not include `tests/unit/remediation`/`tests/unit/content`
  (pre-existing gap predating this issue, not in VAI-18's owned files) — run explicitly as a
  separate regression check instead of fixing shared CI infra as an incidental change.
- Remediation-attempt idempotency has one narrow remaining gap: if a request reaches the server but
  the client never receives the ack, a *different* manually-retried `attempt_id` would still
  double-count. The client always reuses the same `attempt_id` for a given queued entry to avoid
  this in the realistic "never sent" case.
