# VAI-18: Complete student readiness and remediation experience

## Session

- Date: 2026-07-19
- Human owner: Việt Nguyễn Quốc
- AI tool/model: Claude Code (Sonnet 5)
- Linear issue: VAI-18
- Branch: `vai-18-complete-student-readiness-and-remediation-experience`
- Worktree: `/home/viet2005/workspace/AiLearn`
- Pull request: https://github.com/nguyenquocviet2005/AiLearn/pull/16 (Draft)

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

---

## Session 2 — core AI engines, reconciled onto current main

- Date: 2026-07-19
- Human owner: Việt Nguyễn Quốc
- AI tool/model: Claude Code (Opus 4.8 / Sonnet 5, mixed across the session)
- Branch: `vai-18-followup-engines-on-main`
- Worktree: `/home/viet2005/workspace/worktrees/vai-18-followup-engines-on-main`
- Objective: prompt was "make the student user flow fully-fledged and complete, focus on core
  AI engines... for a hackathon challenge." Session 1 shipped the UI shell and offline queue
  against the (then-current) backend; this session was meant to make the underlying engines real.

### False start (discovered, not shipped)

Work began on the old `vai-18-complete-student-readiness-and-remediation-experience` branch,
unaware that PR #16 (Session 1) had already merged and that `origin/main` had since moved forward
~20 commits (VAI-19 through VAI-41): a durable Supabase-backed session store, an exit-ticket flow,
demo personas, class planning/lesson-plan generation, intervention reports, and a full teacher +
student UI redesign (student.css alone changed ~2000 lines). Five commits were built on the stale
base (in-memory evidence-repository fallback, a from-scratch demo-reset endpoint, a full new
"probe" HTTP surface) before this was caught via `git fetch` + `git log 4970714..origin/main`.
Comparing the two branches' `routes/demo.py` showed genuinely incompatible designs (persona-based
reset vs. storage-mode-based reset). Rather than rebase and hand-resolve conflicts across files
neither side had reviewed, a fresh worktree was created from `origin/main` and only the pieces
confirmed absent upstream were re-implemented against it. The stale branch/commits were left
untouched (not deleted) for reference.

### AI contributions (delivered, on `vai-18-followup-engines-on-main`)

Confirmed genuinely missing on `origin/main` before writing anything (each checked via `git show
origin/main:<path>` before porting):

- No `packages/diagnostic/probe.py` or `progress.py` existed.
- No `packages/content/grading.py` existed; `RemediationPath.tsx` still graded checkpoints
  client-side (`normalize(answer) === normalize(content.checkpoint_answer)`) and the API still
  shipped `checkpoint_answer` in the wire payload.
- The "probe" (CONFIRMATION disambiguation) still called `startReadinessSession()` and took
  `items[0]` — the same stopgap flagged in the earlier (unmerged) work.
- `explanation` (self-report field) was captured in `ReadinessQuestion.tsx` state but never sent
  anywhere — deprioritized this session; not part of the agreed scope.

Delivered:

- `packages/diagnostic/probe.py` — deterministic discriminating-item selection with 7 named
  reason codes; `POST /api/v1/diagnostics/probe`, wired into `routes/diagnostics.py`'s existing
  durable/local dual-path pattern (not a new persistence mechanism).
- `packages/diagnostic/progress.py` — `summarize_progress()`: per-skill evidence sufficiency
  (`sufficient_secure`/`sufficient_gap`/`emerging`/`insufficient`), never a score or rank;
  `GET /api/v1/students/{id}/progress`, added to `routes/students.py` alongside the existing
  diagnostic-profile endpoint (extracted a shared `_load_evidence()` helper).
- `packages/content/grading.py` — deterministic server-side checkpoint grading (numeric answers
  require a standalone-token match so "15" doesn't match "150"). `routes/remediation.py`'s
  `_content_payload` no longer serializes `checkpoint_answer`; exposes `is_gradable` instead.
  `AttemptRequest` accepts `response` (graded server-side) or `is_correct` (self-report),
  preserving the existing durable-session-store, exit-ticket, and attempt-idempotency logic
  unchanged.
- Two bug fixes, applied to main's current code (both still present there, confirmed before and
  after with a regenerated fixture diff):
  1. `AbstentionPolicy.conflicting_top_skill([])` returned `True`, so an all-correct evidence
     sequence (empty ranked list) was misclassified as "conflicting" and forced into `abstained`
     — the `diagnose()` `ready` branch was unreachable. Regenerating the committed teacher demo
     fixtures (`data/fixtures/class-snapshot.json`, mirrored under `apps/web/src/test/fixtures/`)
     surfaced the concrete impact: two seeded "strong" persona students
     (`stu_g7_029`, `stu_g7_032`) were being shown to the teacher view as `abstained` instead of
     `ready`. Updated `TeacherWorkspace.test.tsx`'s hardcoded "17 learners need confirmation" to
     "15" to match.
  2. `ContentGenerator._select()`'s score threshold (`>= 4`) was reachable by
     representation+state+kind agreement alone (2+1+1) with no skill/misconception match, so an
     unknown skill could return unrelated template content. A skill or misconception match is now
     a hard precondition for candidacy.
- Content gap: `skill_ratio_proportion_basics`, `skill_direct_proportion`, and
  `skill_fraction_multiplication` had no intervention templates, so the prerequisite-gap demo
  persona fell back to generic filler. Added two templates with `accepted_answers`; all 12
  curriculum skills now have coverage.
- Frontend: real `startProbe()` replacing the readiness-session stopgap in both call sites
  (`diagnoseAndStartRemediation`, `resolveConfirmation`); `RemediationPath.tsx` submits the typed
  answer for server grading and renders the returned verdict; new `StudentProgress.tsx` tab
  ("Tiến bộ") using the current redesign's CSS custom properties (`--student-purple/cyan/pink/
  green`), refetching whenever the offline queue drains to empty; probe reason codes translated
  to one plain-language sentence in `copy.ts` (no skill ids or hypothesis language reaches the
  student, verified by an explicit test assertion).
- Added missing test coverage this session almost shipped without: API-level tests for
  `POST /diagnostics/probe` and `GET /students/{id}/progress`, following the codebase's existing
  monkeypatch-the-evidence-client convention (`test_diagnostics_probe.py`,
  additions to `test_students.py`) rather than the in-memory demo store the abandoned branch had
  invented — package-level unit tests alone had passed but gave false confidence about HTTP-level
  wiring.

### Human decisions

- Confirmed: continue reconciling onto current `main` rather than mechanically rebasing the stale
  branch, after being shown the scale of divergence (durable store, exit tickets, demo personas,
  927-line workspace file, ~2000-line CSS rewrite).
- Confirmed: for the demo-reset/evidence-storage conflict specifically, keep main's more mature
  design (persona-based reset, durable Supabase-backed session store) and adapt the new engines to
  it, rather than keeping the from-scratch in-memory approach built on the stale base.
- Confirmed: proceed with the frontend port at its actual scope (927-line file, full CSS
  rewrite) rather than stopping for a description-only summary first.

### Files changed

Backend: `packages/diagnostic/{probe,progress}.py` (new), `packages/content/grading.py` (new),
`packages/diagnostic/{__init__,abstention}.py`, `packages/content/{__init__,generator}.py`,
`packages/content/intervention-templates.json`, `apps/api/src/ailearn_api/models/{diagnostic_
session,progress}.py`, `apps/api/src/ailearn_api/routes/{diagnostics,students,remediation}.py`.
Frontend: `StudentWorkspace.tsx`, `RemediationPath.tsx`, `ReadinessQuestion.tsx`,
`StudentProgress.tsx` (new), `copy.ts`, `student.css`, `student-repository.ts`, `student-types.ts`,
`offline/{queue,sync}.ts`.
Tests: `test_diagnostics_probe.py` (new), additions to `test_students.py`, `test_remediation.py`,
`tests/unit/diagnostic/{test_probe,test_abstention}.py`, `tests/unit/content/{test_grading,
test_generator}.py`, `StudentWorkspace.test.tsx`, `TeacherWorkspace.test.tsx` (fixture-count fix).
Fixtures: `data/fixtures/class-snapshot.json` + its frontend mirror, regenerated after the
abstention fix (verified via the existing `test_committed_teacher_demo_fixtures_match_the_
deterministic_projection` snapshot test).

### Commands and results

| Command | Result |
|---|---|
| `pnpm format:check` / `ruff format --check` | PASS |
| `pnpm lint` / `ruff check apps/api packages` | PASS |
| `pnpm typecheck` / `mypy apps/api/src` | PASS (0 errors, 31 files) |
| `pnpm --filter @ailearn/web test` | PASS (60 tests, 11 files) |
| `uv run --project apps/api pytest apps/api/tests tests/unit -q` | PASS (185 passed, 2 skipped) |
| `pnpm build` / `uv build --project apps/api` | PASS |
| `uv run --project apps/api python scripts/eval_golden.py` | PASS (4/4, incl. abstention case) |
| Live curl walkthrough against this branch (demo-mode Settings) | Partial — readiness-session
  item selection worked without Supabase, but evidence writes/reads on this branch require a real
  Supabase project (unlike the abandoned branch's in-memory store); full-loop verification
  instead relied on the HTTP-level pytest suite above (monkeypatched evidence client), matching
  how the existing suite already tests this dual-path code. |

### Remaining limitations

- This branch's demo experience needs a configured Supabase project to complete the
  readiness → diagnosis → probe → remediation loop end-to-end; a bare `git clone` with no
  secrets can only exercise item selection. This is consistent with main's existing design
  (persona-based reset assumes a live seeded Supabase project) and was a deliberate trade-off
  per the human owner's direction, not an oversight.
- Self-explanation (`explanation` field already captured in `ReadinessQuestion.tsx` state) is
  still not sent anywhere — left out of this session's scope.
- Grading is deterministic string/substring matching, not semantic.
- Teacher-facing evidence from remediation *practice* attempts (as opposed to readiness-session
  responses) is not written back to the shared evidence stream in this session's scope — checked
  that `teacher_projection.py` feeds all of a student's evidence into `diagnose()` for the class
  snapshot, and deferred writing practice-attempt evidence rather than risk skewing that pipeline
  without auditing it fully.
