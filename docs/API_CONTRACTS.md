# API Contracts

## `GET /health`

Returns API liveness without checking external dependencies.

```json
{
  "status": "ok"
}
```

## `GET /api/v1/system-status`

Reads the infrastructure-only `system_status` row through the Supabase Data API.

Success response (`200`):

```json
{
  "status": "ok",
  "database": {
    "status": "operational",
    "checked_at": "2026-07-17T00:00:00Z"
  }
}
```

Unavailable response (`503`):

```json
{
  "detail": {
    "code": "supabase_unavailable",
    "message": "System status is unavailable."
  }
}
```

The endpoint accepts no parameters and exposes no Supabase credentials, raw error details, or product data.
