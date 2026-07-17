# VAI-11: Shared Schemas, Fixtures, and Evidence Foundation

## Session

- Date: 2026-07-18
- Human owner: Việt Nguyễn Quốc
- AI tool/model: Cursor Composer
- Linear issue: VAI-11
- Branch: `vai-11-add-shared-schemas-fixtures-and-evidence-foundation`
- Worktree: `/home/viet2005/workspace/AiLearn`
- Pull request: https://github.com/nguyenquocviet2005/AiLearn/pull/5 (Draft)

## Objective

Extend the VAI-10 walking skeleton with frozen shared V1 contracts, evidence storage,
and fixtures so Coder B and C can work independently.

## Approved decisions

- Accepted: Option A — author minimal V1 schemas from VAI-11/12/14/15/16/21 behavioral requirements.
- Accepted: Draft PR may include minimum shared-file wiring (`pnpm-workspace.yaml`,
  `apps/api/pyproject.toml`, `uv.lock`, `scripts/verify.sh`, CI) with release-captain review.
- Freeze policy: after merge, additive optional fields only; renames/removals/type changes need V2
  or an explicitly approved migration.

## Assumptions (contract fields)

Recorded in `docs/API_CONTRACTS.md` and ADR `docs/decisions/0001-shared-v1-contracts.md`.

Field sets include only fields required by known downstream behavior. Fixtures use synthetic
anonymized IDs (`stu_demo_01`, etc.).

## Completed

- Six frozen V1 contracts (`packages/schemas`: JSON Schema + Pydantic + TypeScript)
- Six anonymized fixtures (`data/fixtures/`)
- Diagnostic interfaces and stubs (`ai/diagnostic` evidence store helpers only)
- Evidence migration (`supabase/migrations/20260718000000_create_evidence_events.sql`)
- Evidence POST/GET API (`/api/v1/evidence-events`)
- Automated schema, diagnostic, and API tests
- Workspace, verification, and CI wiring (separate chore commit)
- Documentation and ADR updates

## AI contributions

- Created `packages/schemas` with JSON Schema, Pydantic, and TypeScript for six V1 contracts.
- Added six anonymized fixtures under `data/fixtures/`.
- Added `ai/diagnostic` evidence store stubs (no mastery/root-cause engine).
- Added `evidence_events` Supabase migration and thin FastAPI write/read adapters.
- Extended CORS to allow POST (intentional for evidence write).
- Wired workspace/verify/CI for path packages and unit tests.
- Updated API contracts, architecture, ADR, and README.
- Performed repository-only final verification (2026-07-18).

## Human decisions

- Accepted: Option A field source
- Accepted: shared-file wiring in Draft PR with release-captain review gate
- Live remote migration intentionally deferred pending SQL apply on linked project

## Verification

| Check | Command | Result |
|---|---|---|
| Schema fixture tests | `uv run --project apps/api pytest tests/unit/schemas` | PASS (10) |
| Diagnostic stub tests | `uv run --project apps/api pytest tests/unit/diagnostic` | PASS (4) |
| Evidence API tests | `uv run --project apps/api pytest apps/api/tests/test_evidence.py` | PASS (7) |
| Existing API regression | `pytest apps/api/tests/test_health.py test_system_status.py test_config.py` | PASS (7) |
| Full gate | `./scripts/verify.sh` | PASS (28 pytest total) |
| Live Supabase evidence POST/GET | remote write/read smoke | NOT RUN |

### Deferred environment verification

```text
Live Supabase evidence POST/GET: NOT RUN

Reason:
The linked development project does not yet contain
public.evidence_events.

Required deployment step:
Apply
supabase/migrations/20260718000000_create_evidence_events.sql

Observed before deferral:
PGRST205 — table not found in PostgREST schema cache
```

Live Supabase evidence: **NOT_VERIFIABLE — remote migration intentionally deferred**

## Repository-only review notes

- Six contracts exported from Pydantic `__init__` and TypeScript `index.ts`; six JSON Schema files present.
- Diagnostic package limited to validate/persist stubs; no VAI-14 mastery/root-cause/abstention engine.
- No teacher UI (VAI-12/15), no remediation state machine (VAI-16).
- VAI-10 health/system-status routes unchanged; `main.py` only adds diagnostics router and CORS `POST`.
- No committed secrets or real student PII in fixtures/diff.
- Shared wiring commit remains subject to release-captain approval before merge.

## Remaining risks and limitations

- V1 fields are intentionally thin for downstream unblocking, not a complete domain model.
- Evidence API uses service-role server credentials only; auth/roles remain deferred.
- Shared-file wiring requires release-captain approval before merge.
- Evidence migration must be applied to linked Supabase projects before live write/read works.
