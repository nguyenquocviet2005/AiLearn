# ADR 0001: Shared V1 contracts and evidence foundation

## Status

Accepted for VAI-11 (pending release-captain review of shared workspace wiring).

## Context

Coder B and Coder C need frozen contracts and fixtures before diagnostic, planning, and remediation
engines exist. VAI-10 only shipped infrastructure endpoints.

## Decision

1. Introduce `packages/schemas` with JSON Schema, Pydantic, and TypeScript representations of six V1
   contracts.
2. Ship anonymized fixtures under `data/fixtures/` that validate against those schemas.
3. Keep diagnostic domain stubs in `ai/diagnostic/` and thin HTTP adapters in `apps/api`.
4. Persist `EvidenceEventV1` in Supabase `evidence_events` with service-role access and RLS enabled.
5. Freeze V1 after merge: additive optional fields only; breaking changes require V2 or an approved
   migration.

## Consequences

- Downstream issues can build against fixtures without waiting for engine completeness.
- Shared workspace files (`pnpm-workspace.yaml`, `apps/api` path deps, verify/CI) must wire the new
  packages.
- Auth/roles remain deferred; evidence endpoints are server-credentialed only.
