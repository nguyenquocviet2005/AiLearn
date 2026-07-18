# Architecture

## Current Boundary

VAI-10 established the infrastructure walking skeleton. VAI-11 added shared V1 contracts,
fixtures, and evidence persistence. VAI-13 added demo curriculum seeds and golden cases.
VAI-14 added a deterministic diagnostic engine in `packages/diagnostic/` (domain-only; no HTTP).
VAI-17 exposes that engine over HTTP and adds a `students` table. VAI-16 built the remediation
engine (`packages/remediation`, `packages/content`) and its thin HTTP surface; VAI-18 registers
that router (it existed as code but was unreachable until now) and adds the student-facing web UI:

```text
React/Vite browser application
  -> features/student (readiness + remediation UI, offline-first)
  -> features/teacher
  -> FastAPI HTTP API
    -> Supabase Data API
      -> system_status infrastructure row
      -> evidence_events product table
      -> students product table

Shared contracts:
  packages/schemas + data/fixtures
Curriculum / golden inputs:
  data/seeds + eval/golden
Diagnostic engine (pure domain):
  packages/diagnostic  (MasteryEstimator, RootCauseRanker, diagnose, build_readiness_session)
Remediation engine (pure domain):
  packages/remediation (RemediationEngine, state machine)
  packages/content     (ContentGenerator, template-first + optional LLM enrichment)
```

The web application contains presentation and a typed API client. The API owns transport validation,
CORS configuration, failure sanitization, and the server-side Supabase credential. The browser never
calls Supabase directly. Evidence validation and diagnosis live in `ailearn_schemas` /
`ailearn_diagnostic`; routes remain thin adapters.

Product Diagnostic HTTP (`POST /diagnostics/start`, `POST /diagnostics/{id}/responses`,
`GET /students/{id}/diagnostic-profile`) is implemented in VAI-17. Remediation HTTP
(`POST /remediation/sessions`, `POST /remediation/attempts`, `POST /remediation/confirm`,
`GET /remediation/sessions/{id}`) was built in VAI-16 and registered into `create_app()` in VAI-18.
Both routers hold session state in an **in-memory, per-process dict**
(`ailearn_api.diagnostic_session_store`, `ailearn_api.routes.remediation._sessions`). Neither
survives an API process restart; VAI-20 owns swapping both routers to durable Supabase-backed
session storage as part of the full evidence-pipeline integration. Submitted diagnostic responses
are persisted immediately as `EvidenceEventV1` rows in `evidence_events`, so no student evidence is
lost on a restart — only an in-progress, unsubmitted session's item selection would need to be
re-started. Remediation attempts are not separately persisted (the path is re-derivable from
`RemediationEngine.start()` given the profile, but the step-by-step history within a session is
in-memory only until VAI-20).

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
and non-duplicated sync all share one code path.

`apps/web/src/lib/adapters/student-repository.ts` is the real HTTP adapter (`data/fixtures/`
develop-against-fixtures note in the original issue text is superseded — VAI-17's real API is live).

## Deferred Architecture

Authentication roles, authorization, synchronization across devices, teacher planning engines, AI
orchestration, and a separate model service remain deferred to later issues. Durable
(Supabase-backed) diagnostic/remediation session storage is deferred to VAI-20. A teacher-facing
inbox to receive the student "Nhờ cô giải thích" (ask teacher) help action does not exist yet — it
is captured client-side only (see Operational Behavior).

## Operational Behavior

- `/health` is an API liveness endpoint and does not call Supabase.
- `/api/v1/system-status` is a bounded Supabase read from a singleton infrastructure table.
- `/api/v1/evidence-events` supports write and read of `EvidenceEventV1` rows.
- `/api/v1/diagnostics/start` builds a 3–7 item readiness session via `build_readiness_session()`
  and returns items with their answer key stripped.
- `/api/v1/diagnostics/{id}/responses` derives correctness server-side and writes an
  `EvidenceEventV1`. The evidence id is deterministic per (session, item), so retried submissions
  are idempotent: `insert_evidence_event` treats a primary-key conflict on `evidence_events.id` as
  "already recorded" and replays the existing row instead of erroring or duplicating it.
- `/api/v1/students/{id}/diagnostic-profile` computes a `StudentDiagnosticProfileV1` live via
  `diagnose()` from that student's `evidence_events`.
- `diagnose(events, curriculum, items)` in `packages/diagnostic` produces `StudentDiagnosticProfileV1`
  deterministically without LLM calls.
- `/api/v1/remediation/sessions` / `/attempts` / `/confirm` / `sessions/{id}` are thin adapters over
  `RemediationEngine`/`ContentGenerator`. `/attempts` requires a client-supplied `attempt_id`; a
  repeated `attempt_id` for the same student replays the first recorded response instead of calling
  `RemediationEngine.advance()` again (route-level idempotency, since the engine itself has none).
  `confirm` is naturally idempotent — it only acts while the session is in `CONFIRMATION`.
- A missing configuration, timeout, malformed row, or Supabase HTTP failure returns a sanitized
  `503` (or `404` when a student, evidence id, or diagnostic profile is missing).
- Browser CORS access is restricted to the comma-separated exact origins in `CORS_ORIGINS`.
  Allowed methods are `GET` and `POST`.
- `apps/api/src/ailearn_api/scripts/seed_fixtures.py` upserts `data/seeds/students.json` and
  `data/seeds/evidence-events.json` into Supabase (idempotent, re-runnable). `scripts/eval_golden.py`
  runs every case in `eval/golden/golden-cases.json` through `diagnose()` from one command.
