# Architecture

## Current Boundary

VAI-10 established the infrastructure walking skeleton. VAI-11 added shared V1 contracts,
fixtures, and evidence persistence. VAI-13 added demo curriculum seeds and golden cases.
VAI-14 added a deterministic diagnostic engine in `packages/diagnostic/` (domain-only; no HTTP).
VAI-17 exposes that engine over HTTP and adds a `students` table:

```text
React/Vite browser application
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
```

The web application contains presentation and a typed API client. The API owns transport validation,
CORS configuration, failure sanitization, and the server-side Supabase credential. The browser never
calls Supabase directly. Evidence validation and diagnosis live in `ailearn_schemas` /
`ailearn_diagnostic`; routes remain thin adapters.

Product Diagnostic HTTP (`POST /diagnostics/start`, `POST /diagnostics/{id}/responses`,
`GET /students/{id}/diagnostic-profile`) is implemented in VAI-17. Readiness-session state
(selected items, which item ids are answered) is held in an **in-memory, per-process dict**
(`ailearn_api.diagnostic_session_store`), the same pattern `routes/remediation.py` established in
VAI-16. It does not survive an API process restart; VAI-20 owns swapping all routers (remediation
and diagnostics) to durable Supabase-backed session storage as part of the full evidence-pipeline
integration. Submitted responses themselves are persisted immediately as `EvidenceEventV1` rows in
`evidence_events`, so no student evidence is lost on a restart — only an in-progress, unsubmitted
session's item selection would need to be re-started.

`GET /students/{id}/diagnostic-profile` does not read from a persisted profile table: it fetches
the student's `evidence_events` and calls `diagnose()` live on every request, keeping the engine as
the single source of truth (no manual copying of data between engines).

## Deferred Architecture

Authentication roles, authorization, offline storage, synchronization, teacher planning engines,
remediation state machines, AI orchestration, and a separate model service remain deferred to later
issues. Durable (Supabase-backed) diagnostic session storage is deferred to VAI-20.

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
- A missing configuration, timeout, malformed row, or Supabase HTTP failure returns a sanitized
  `503` (or `404` when a student, evidence id, or diagnostic profile is missing).
- Browser CORS access is restricted to the comma-separated exact origins in `CORS_ORIGINS`.
  Allowed methods are `GET` and `POST`.
- `apps/api/src/ailearn_api/scripts/seed_fixtures.py` upserts `data/seeds/students.json` and
  `data/seeds/evidence-events.json` into Supabase (idempotent, re-runnable). `scripts/eval_golden.py`
  runs every case in `eval/golden/golden-cases.json` through `diagnose()` from one command.
