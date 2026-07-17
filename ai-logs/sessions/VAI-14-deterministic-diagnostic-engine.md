# VAI-14: Deterministic Diagnostic Engine

## Session

- Date: 2026-07-18
- Human owner: Việt Nguyễn Quốc
- AI tool/model: Cursor Composer
- Linear issue: VAI-14
- Branch: `vai-14-implement-deterministic-diagnostic-engine`
- Worktree: `/home/viet2005/workspace/AiLearn`
- Pull request: https://github.com/nguyenquocviet2005/AiLearn/pull/9 (Draft)

## Objective

Implement deterministic diagnosis: evidence → Beta-Bernoulli mastery → Top-k root causes with
abstention → `StudentDiagnosticProfileV1`, validated against VAI-13 golden cases.

## Approved plan defaults

- Domain-only `diagnose()` API; product HTTP deferred to VAI-17
- Golden tests assert readiness status, ordered root-cause skill IDs, and evidence traceability
  (not exact confidence floats)
- Seed `ready` + empty `root_causes` profiles ignored as oracles

## AI contributions

- Curriculum/item/golden loaders and internal models
- `BetaBernoulliMasteryEstimator`, `DeterministicRootCauseRanker`, `AbstentionPolicy`
- `diagnose()` orchestration and `build_readiness_session` (3–7 items)
- Unit tests for mastery, ranking, abstention, session, loaders, and golden cases `gc_01`–`gc_04`
- Architecture and API contract notes

## Commands and results

| Command | Result |
|---|---|
| `uv run --project apps/api pytest tests/unit/diagnostic -q` | PASS (17) |
| `./scripts/verify.sh` | PASS (41 pytest total) |

## Remaining risks and limitations

- Confidence values are deterministic but not calibrated to golden floats
- Product Diagnostic HTTP and golden eval CLI remain VAI-17
- Seed `diagnostic-profiles.json` ready rows still violate V1 empty-root-cause rule
