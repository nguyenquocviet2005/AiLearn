# Architecture

## Current Boundary

VAI-10 established the infrastructure walking skeleton. VAI-11 adds a contract-first product
foundation without implementing engines or teacher UI:

```text
React/Vite browser application
  -> FastAPI HTTP API
    -> Supabase Data API
      -> system_status infrastructure row
      -> evidence_events product table

Shared contracts:
  packages/schemas + data/fixtures
Evidence stubs:
  packages/diagnostic
```

The web application contains presentation and a typed API client. The API owns transport validation,
CORS configuration, failure sanitization, and the server-side Supabase credential. The browser never
calls Supabase directly. Domain validation for evidence events lives in `ailearn_schemas` /
`ailearn_diagnostic`; routes remain thin adapters.

## Deferred Architecture

Authentication roles, authorization, offline storage, synchronization, curriculum graph,
adaptive-learning engines, AI orchestration, and a separate model service remain deferred to later
issues (VAI-12+).

## Operational Behavior

- `/health` is an API liveness endpoint and does not call Supabase.
- `/api/v1/system-status` is a bounded Supabase read from a singleton infrastructure table.
- `/api/v1/evidence-events` supports write and read of `EvidenceEventV1` rows.
- A missing configuration, timeout, malformed row, or Supabase HTTP failure returns a sanitized
  `503` (or `404` when an evidence id is missing).
- Browser CORS access is restricted to the comma-separated exact origins in `CORS_ORIGINS`.
  Allowed methods are `GET` and `POST`.
