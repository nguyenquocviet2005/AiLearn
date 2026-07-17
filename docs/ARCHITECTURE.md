# Architecture

## Current Boundary

VAI-10 established the infrastructure walking skeleton. VAI-11 added shared V1 contracts,
fixtures, and evidence persistence. VAI-13 added demo curriculum seeds and golden cases.
VAI-14 adds a deterministic diagnostic engine in `ai/diagnostic/` (domain-only; no product HTTP):

```text
React/Vite browser application
  -> FastAPI HTTP API
    -> Supabase Data API
      -> system_status infrastructure row
      -> evidence_events product table

Shared contracts:
  packages/schemas + data/fixtures
Curriculum / golden inputs:
  data/seeds + eval/golden
Diagnostic engine (pure domain):
  ai/diagnostic  (MasteryEstimator, RootCauseRanker, diagnose)
```

The web application contains presentation and a typed API client. The API owns transport validation,
CORS configuration, failure sanitization, and the server-side Supabase credential. The browser never
calls Supabase directly. Evidence validation and diagnosis live in `ailearn_schemas` /
`ailearn_diagnostic`; routes remain thin adapters. Product Diagnostic HTTP
(`POST /diagnostics/start`, profile GET) remains deferred to VAI-17.

## Deferred Architecture

Authentication roles, authorization, offline storage, synchronization, teacher planning engines,
remediation state machines, AI orchestration, and a separate model service remain deferred to later
issues.

## Operational Behavior

- `/health` is an API liveness endpoint and does not call Supabase.
- `/api/v1/system-status` is a bounded Supabase read from a singleton infrastructure table.
- `/api/v1/evidence-events` supports write and read of `EvidenceEventV1` rows.
- `diagnose(events, curriculum, items)` in `ai/diagnostic` produces `StudentDiagnosticProfileV1`
  deterministically without LLM calls.
- A missing configuration, timeout, malformed row, or Supabase HTTP failure returns a sanitized
  `503` (or `404` when an evidence id is missing).
- Browser CORS access is restricted to the comma-separated exact origins in `CORS_ORIGINS`.
  Allowed methods are `GET` and `POST`.
