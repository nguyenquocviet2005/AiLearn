# Architecture

## Current Boundary

VAI-10 established the infrastructure walking skeleton. VAI-11 added shared V1 contracts,
fixtures, and evidence persistence. VAI-13 added demo curriculum seeds and golden cases.
VAI-14 added a deterministic diagnostic engine in `packages/diagnostic/` (domain-only; no HTTP).
VAI-17 exposes that engine over HTTP and adds a `students` table. VAI-16 built the remediation
engine (`packages/remediation`, `packages/content`) and its thin HTTP surface; VAI-18 registers
that router (it existed as code but was unreachable until now) and adds the student-facing web UI.
VAI-15 adds deterministic class aggregation and lesson planning in `packages/planning/`:

```text
React/Vite browser application
  -> features/student (readiness + remediation UI, offline-first)
  -> features/teacher
  -> FastAPI HTTP API
    -> Supabase Data API
      -> system_status infrastructure row
      -> evidence_events product table
      -> students product table
      -> diagnostic_sessions resumable readiness selections
      -> remediation_sessions remediation state and idempotency results

Shared contracts:
  packages/schemas + data/fixtures
Curriculum / golden inputs:
  data/seeds + eval/golden
Diagnostic engine (pure domain):
  packages/diagnostic  (MasteryEstimator, RootCauseRanker, diagnose, build_readiness_session)
Planning engine (pure domain):
  packages/planning    (DeterministicInterventionPolicy, snapshot + draft plan builders)
Remediation engine (pure domain):
  packages/remediation (RemediationEngine, state machine)
  packages/content     (ContentGenerator, template-first + optional LLM enrichment)
```

VAI-19 adds the teacher planning HTTP/UI boundary. `lesson_plan_versions` is append-only through
the service-role API: each teacher edit, approval/rejection decision, and publication creates a new
`TeacherPlanVersionV1` row. The original deterministic proposal remains intact. Publication is
allowed only when the latest version is teacher-approved. VAI-20 derives the initial proposal for
`class_g7a_demo` directly from its roster and evidence, rather than a hand-maintained teacher
fixture. A persisted teacher version takes precedence so edits are never overwritten. The committed
G7 seed projection remains inspectable when Supabase configuration is absent; writes correctly
return a sanitized `503` without storage.

VAI-21 adds the teacher intervention-report boundary. The API validates and serves the frozen
`InterventionReportV1` fixture, while `/teacher/report` presents outcome counts, individual evidence,
remaining gaps, and next-lesson focus. `/teacher/report/print` combines the same report with the
lesson plan in a self-contained print stylesheet and does not load external media. Live event-to-report
aggregation remains the VAI-20 boundary.

The web application contains presentation and a typed API client. The API owns transport validation,
CORS configuration, failure sanitization, and the server-side Supabase credential. The browser never
calls Supabase directly. Evidence validation, diagnosis, and planning live in `ailearn_schemas`,
`ailearn_diagnostic`, and `ailearn_planning`; routes remain thin adapters.

Product Diagnostic HTTP (`POST /diagnostics/start`, `POST /diagnostics/{id}/responses`,
`GET /students/{id}/diagnostic-profile`) is implemented in VAI-17. Remediation HTTP
(`POST /remediation/sessions`, `POST /remediation/attempts`, `POST /remediation/confirm`,
`POST /remediation/exit-tickets`, `GET /remediation/sessions/{id}`) was built in VAI-16 and
registered into `create_app()` in VAI-18. VAI-22 adds a final exit-ticket response above the
existing near-transfer check. It records a passing transfer, teacher escalation, or a deterministic
reclassification for the designated synthetic demo persona; the answer key stays server-side.
VAI-20 persists a readiness session's selected item ids in `diagnostic_sessions` and rehydrates the
items from the current curriculum. Its answered state is derived from immutable `evidence_events`,
so a configured API can resume safely after a process restart. Remediation state plus the processed
attempt/exit-ticket idempotency maps live in `remediation_sessions`. The existing local dictionaries
remain only as an unconfigured local-development fallback. Completed exit tickets add a validated,
server-derived `EvidenceEventV1` to the same evidence stream, making the outcome visible to a live
student diagnostic profile and teacher class projection.

`GET /students/{id}/diagnostic-profile` does not read from a persisted profile table: it fetches
the student's `evidence_events` and calls `diagnose()` live on every request, keeping the engine as
the single source of truth (no manual copying of data between engines).

### Student feature (`apps/web/src/features/student/`, VAI-18)

Orchestrates readiness (diagnostics API) → diagnosis → remediation (remediation API) in one
component (`StudentWorkspace.tsx`) with a 4-tab shell (Hôm nay / Bài của em / Lộ trình của em /
Trợ giúp). Never renders a raw `skill_id`/`root_cause_skill_id` — all state/step copy is translated
through `features/student/copy.ts`. Uses its own scoped design tokens
(`features/student/student.css`, a `.student-shell`-scoped palette from
`docs/AILEARN_SYSTEM_UX_BLUEPRINT.md`) rather than touching the app's existing (different) tokens
in `index.css`.

`apps/web/src/lib/offline/` implements the client-side write queue (`queue.ts`, a `PendingWrite[]`
in `localStorage`), the FIFO sync manager (`sync.ts`, stops at the first failure so remediation
attempts are never applied out of order), and a content cache (`content-cache.ts`) of the student's
own last-fetched readiness/remediation data — this is what backs "cached content remains accessible
offline" and the "Trợ giúp → Kiểm tra bài đã lưu" action, not the static `data/fixtures/` seed JSON
(which covers a different demo student/lesson). Every diagnostics-response and remediation-attempt
submission goes through this queue first, whether online or offline, so autosave, reload-resume,
and non-duplicated sync all share one code path. A new browser runtime converts writes left in
`SYNCING` by an interrupted page into retryable failures exactly once before auto-sync. The API's
deterministic evidence ids, attempt ids, and exit-ticket submission ids make that recovery
idempotent, while the once-per-runtime guard prevents duplicate recovery during React effect replay.

`active-learner.ts` stores only the selected synthetic learner id, display name, and persona id.
On reload, the workspace restores that identity only when matching readiness or remediation content
is still cached; otherwise it safely returns to the default demo learner. This keeps a reset persona
and its path aligned across an offline refresh without storing answers or private classroom data.

`apps/web/src/lib/adapters/student-repository.ts` is the real HTTP adapter (`data/fixtures/`
develop-against-fixtures note in the original issue text is superseded — VAI-17's real API is live).

### Demo personas and reset (`VAI-22`)

`data/seeds/demo-personas.json` defines six synthetic, anonymized walkthrough personas: foundational
gap, misconception, root-cause reclassification after new evidence, insufficient evidence, passing
transfer, and teacher escalation. `GET /api/v1/demo/personas` exposes only their display metadata.
`POST /api/v1/demo/reset` clears only local fallback diagnostic/remediation dictionaries and returns
the selected seeded profile. It never deletes or rewrites Supabase rows, including durable sessions
or evidence. The browser clears its own content cache and pending-write queue only after that reset
succeeds, then starts the returned remediation profile.

Exit-ticket submissions use the existing FIFO local write queue with a client `submission_id` and
route-level idempotency. This preserves the outcome during a temporary network interruption and
avoids duplicating a recorded transfer/escalation result after reconnection.

## Deferred Architecture

Authentication roles, authorization, synchronization across devices, AI orchestration, and a
separate model service remain deferred to later issues. A teacher-facing inbox to receive the
student "Nhờ cô giải thích" (ask teacher) help action does not
exist yet — it is captured client-side only (see Operational Behavior).

## Operational Behavior

- `/health` is an API liveness endpoint and does not call Supabase.
- `/api/v1/system-status` is a bounded Supabase read from a singleton infrastructure table.
- `/api/v1/evidence-events` supports write and read of `EvidenceEventV1` rows.
- `/api/v1/diagnostics/start` builds a 3–7 item readiness session via `build_readiness_session()`
  and returns items with their answer key stripped. When Supabase is configured, the selected item
  ids are persisted in `diagnostic_sessions` before the response is returned.
- `/api/v1/diagnostics/{id}/responses` derives correctness server-side and writes an
  `EvidenceEventV1`. The evidence id is deterministic per (session, item), so retried submissions
  are idempotent: `insert_evidence_event` treats a primary-key conflict on `evidence_events.id` as
  "already recorded" and replays the existing row instead of erroring or duplicating it.
- `/api/v1/students/{id}/diagnostic-profile` computes a `StudentDiagnosticProfileV1` live via
  `diagnose()` from that student's `evidence_events`.
- `GET /api/v1/classes/class_g7a_demo/snapshot` derives the snapshot from the G7 roster in
  `students` and lesson evidence. It returns an existing `lesson_plan_versions` snapshot first to
  preserve teacher changes; otherwise it builds a fresh deterministic projection.
- `diagnose(events, curriculum, items)` in `packages/diagnostic` produces `StudentDiagnosticProfileV1`
  deterministically without LLM calls.
- `build_class_snapshot(...)` in `packages/planning` keeps unknown students separate, groups diagnosed
  students by intervention need, and exposes deterministic priority-score components in each rationale.
- `build_lesson_plan(...)` produces a 45-minute `TeacherLessonPlanV1` draft whose activities identify
  a root cause, instructional skill, expected evidence, and rationale.
- `/api/v1/remediation/sessions` / `/attempts` / `/confirm` / `sessions/{id}` are thin adapters over
  `RemediationEngine`/`ContentGenerator`. `/attempts` requires a client-supplied `attempt_id`; a
  repeated `attempt_id` for the same student replays the first recorded response instead of calling
  `RemediationEngine.advance()` again (route-level idempotency, since the engine itself has none).
  In configured environments the state and idempotency results are stored in
  `remediation_sessions`.
  `confirm` is naturally idempotent — it only acts while the session is in `CONFIRMATION`.
- `/api/v1/remediation/exit-tickets` validates the answer server-side and persists its transfer
  result as an `EvidenceEventV1` before saving the resulting remediation state.
- A missing configuration, timeout, malformed row, or Supabase HTTP failure returns a sanitized
  `503` (or `404` when a student, evidence id, or diagnostic profile is missing).
- Browser CORS access is restricted to the comma-separated exact origins in `CORS_ORIGINS`.
  Allowed methods are `GET` and `POST`.
- `apps/api/src/ailearn_api/scripts/seed_fixtures.py` upserts `data/seeds/students.json` and
  `data/seeds/evidence-events.json` into Supabase (idempotent, re-runnable). `scripts/eval_golden.py`
  runs every case in `eval/golden/golden-cases.json` through `diagnose()` from one command.
