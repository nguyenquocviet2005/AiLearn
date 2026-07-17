# VAI-11: Shared Schemas, Fixtures, and Evidence Foundation

## Session

- Date: 2026-07-18
- Human owner: Việt Nguyễn Quốc
- AI tool/model: Cursor Composer
- Linear issue: VAI-11
- Branch: `vai-11-add-shared-schemas-fixtures-and-evidence-foundation`
- Worktree: `/home/viet2005/workspace/AiLearn`
- Pull request: pending

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

## AI contributions

- Created `packages/schemas` with JSON Schema, Pydantic, and TypeScript for six V1 contracts.
- Added six anonymized fixtures under `data/fixtures/`.
- Added `ai/diagnostic` evidence store stubs.
- Added `evidence_events` Supabase migration and thin FastAPI write/read adapters.
- Extended CORS to allow POST.
- Wired workspace/verify/CI for path packages and unit tests.
- Updated API contracts, architecture, ADR, and README.

## Human decisions

- Accepted: Option A field source
- Accepted: shared-file wiring in Draft PR with release-captain review gate

## Commands and results

| Command | Result |
|---|---|
| `uv lock --project apps/api` | PASS |
| `uv sync --project apps/api --locked --all-groups` | PASS |
| `uv run --project apps/api pytest tests/unit/schemas tests/unit/diagnostic apps/api/tests` | PASS (28 tests) |
| `pnpm --filter @ailearn/schemas typecheck` | PASS |
| `./scripts/verify.sh` | PASS |

## Remaining risks and limitations

- V1 fields are intentionally thin for downstream unblocking, not a complete domain model.
- Evidence API uses service-role server credentials only; auth/roles remain deferred.
- Shared-file wiring requires release-captain approval before merge.
- Evidence migration must be applied to linked Supabase projects before live write/read works.
