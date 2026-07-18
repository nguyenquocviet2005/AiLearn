# VAI-15: Class planning and grouping policies

## Session

- Date: 2026-07-18
- Human owner: haiptd05@gmail.com
- AI tool/model: Codex / GPT-5
- Linear issue: VAI-15
- Branch: `VAI-15-class-planning-grouping-policies`
- Worktree: `/Users/haipham/Documents/AiLearn`
- Baseline: `23e48142d4d6ba2692919702a00e90a2dbdc625e`
- Pull request: pending

## Objective and supplied context

Implement deterministic class snapshot aggregation, visible teaching priorities, 3–5 groups based
on intervention need, and a structured 45-minute draft lesson plan. Unknown students must remain
separate and every lesson activity must identify its root cause, skill, expected evidence, and
rationale.

The user supplied a controlled sequential Linear workflow and accepted the documented repository
baseline debt. Repository `AGENTS.md`, current Linear data, merged code, contracts, tests, CI, and
architecture documents were reread before implementation.

## Approved plan

1. Add `packages/planning` using the current shared-package architecture rather than the issue's stale
   `ai/planning` path.
2. Build only the domain policy and contract-producing functions; defer public HTTP, teacher editing,
   approval, persistence, and live UI wiring.
3. Verify all 40 seeded students through valid profiles produced by the merged diagnostic engine,
   avoiding any weakening of the current Pydantic contract for the ten invalid ready-profile seed rows.
4. Wire the local package into the locked API environment, CI test list, verification script, and
   Railway Docker build context.
5. Run changed-area and CI-equivalent checks, then independent read-only review before commit.

## AI contributions

- Selected VAI-15 from the complete assigned queue after reconciling Linear and merged GitHub work.
- Verified VAI-11, VAI-13, and VAI-14 dependencies on `origin/main`.
- Added deterministic priority, grouping, class snapshot, and draft lesson-plan behavior.
- Added seed-level and focused policy tests.
- Updated package/build/CI wiring and current architecture documentation.

## Human decisions

- Accepted: execute one issue autonomously through a CI-passing pull request.
- Modified: none.
- Rejected: none.

## Files changed

- `packages/planning/` — deterministic policy, service, package metadata, and README.
- `tests/unit/planning/test_planning.py` — seed integration and policy constraints.
- `apps/api/pyproject.toml`, `apps/api/uv.lock`, `apps/api/Dockerfile` — locked local-package and
  Docker-context wiring.
- `.github/workflows/ci.yml`, `scripts/verify.sh` — planning test coverage.
- `README.md`, `docs/ARCHITECTURE.md`, `docs/API_CONTRACTS.md` — current domain and deployment
  boundaries.
- `ai-logs/sessions/VAI-15-class-planning-grouping-policies.md` — collaboration evidence.

## Commands and results

| Command | Result |
|---|---|
| `python3 validate.py` | PASS |
| `uv run --project apps/api --locked pytest tests/unit/schemas tests/unit/diagnostic` | PASS (27) |
| `uv run --project apps/api --locked pytest tests/unit/planning -q` | PASS (10) |
| `uv run --project apps/api --locked ruff format --check packages/planning tests/unit/planning` | PASS |
| `uv run --project apps/api --locked ruff check packages/planning tests/unit/planning` | PASS |
| `uv run --project apps/api --locked mypy packages/planning/src` | PASS |
| `uv sync --project apps/api --locked --all-groups` | PASS |
| `uv run --project apps/api --locked ruff format --check apps/api` | PASS |
| `uv run --project apps/api --locked ruff check apps/api` | PASS |
| `uv run --project apps/api --locked mypy apps/api/src` | PASS |
| CI Python pytest set (schemas, diagnostic, planning, content, remediation, API) | PASS (92, 2 skipped) |
| `pnpm format:check` / `lint` / `typecheck` / `test` / `build` | PASS (6 web tests) |
| `./scripts/verify.sh` | PASS (51 Python tests in its narrower set) |
| `uv build --project packages/planning --out-dir /private/tmp/ailearn-vai15-planning-dist` | PASS |
| Railway TOML parse and Docker/start/health path inspection | PASS |
| Docker image build | NOT RUN — Docker CLI unavailable |
| Independent review cycle 1 | CHANGES_REQUIRED (1 HIGH, 1 MEDIUM, 1 LOW) |
| Independent review cycle 2 | PASS_WITH_NOTES (no unresolved BLOCKER/HIGH/MEDIUM) |

## Independent review findings and resolutions

- HIGH: homogeneous or two-need classes could produce fewer than three cohorts and fail snapshot
  creation. Resolved with deterministic parallel-cohort splitting that preserves intervention need;
  added homogeneous, two-need, and overflow regression tests.
- MEDIUM: profile target skills and root-cause skills were not validated against the selected
  curriculum. Resolved with explicit pre-scoring validation and focused mismatch tests.
- LOW: CI static analysis covered only `apps/api`. Resolved by adding planning source/tests to CI and
  `scripts/verify.sh` Ruff/mypy commands.
- Final LOW note: this collaboration log contained pre-fix counts and a pending verdict. Resolved by
  recording the 10/92 post-fix results and the final `PASS_WITH_NOTES` verdict here.

## Remaining risks and limitations

- The ten ready rows in `data/seeds/diagnostic-profiles.json` remain invalid under the current
  `StudentDiagnosticProfileV1` root-cause invariant; VAI-15 does not change that contract or seed debt.
- Planning is domain-only in this issue. Public API, persistence, UI editing/approval, and closed-loop
  wiring remain deferred.
- Provider dashboards and live Railway/Vercel/Supabase environments are not mutated or inspected.
- The previously reported repository mypy failure did not reproduce: both the exact API CI mypy
  command and focused planning mypy passed on this branch. This log records the live result rather
  than treating the earlier review summary as current truth.
