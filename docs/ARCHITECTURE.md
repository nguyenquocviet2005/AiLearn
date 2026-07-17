# Architecture

## Current Boundary

VAI-10 establishes only an infrastructure walking skeleton:

```text
React/Vite browser application
  -> FastAPI HTTP API
  -> Supabase Data API
  -> system_status infrastructure row
```

The web application contains presentation and a typed API client. The API owns transport validation,
CORS configuration, failure sanitization, and the server-side Supabase credential. The browser never calls
Supabase directly.

## Deferred Architecture

The repository intentionally has no product domain, authentication roles, authorization, offline storage,
synchronization, curriculum graph, adaptive-learning behavior, AI orchestration, or separate model service.
Those concerns require separate approved decisions and issues.

## Operational Behavior

- `/health` is an API liveness endpoint and does not call Supabase.
- `/api/v1/system-status` is a bounded Supabase read from a singleton infrastructure table.
- A missing configuration, timeout, malformed row, or Supabase HTTP failure returns a sanitized `503`.
- Browser CORS access is restricted to the comma-separated exact origins in `CORS_ORIGINS`.
