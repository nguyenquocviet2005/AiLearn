# VAI-20 - Connect the complete evidence pipeline

- Date: 2026-07-18
- Human owner: Hai Nguyen Hong
- AI tool and model: Codex, GPT-5
- Linear: VAI-20
- Branch: `honghainguyen2003/vai-20-connect-the-complete-evidence-pipeline`
- Worktree: `/home/h2n/h2n/worktrees/vai-20-connect-evidence-pipeline`
- Pull request: https://github.com/nguyenquocviet2005/AiLearn/pull/23 (Draft)

## Objective and approved plan

Connect the student evidence loop to the teacher intervention loop: retain resumable diagnostic and
remediation state, write transfer results into the canonical evidence stream, and generate the
teacher's class snapshot and initial plan from the same roster and evidence.

The human owner approved use of the committed G7 seed (`class_g7a_demo` and the
inverse-proportion lesson) as the canonical demo data, replacing the disconnected G6 teacher
fixture at the runtime boundary while preserving existing API response shapes.

## Planning and implementation

- Read `AGENTS.md`, VAI-20 and dependency status in Linear, architecture/contracts, migrations,
  seed data, student and teacher routes, adapters, and relevant tests.
- Added RLS-protected `diagnostic_sessions` and `remediation_sessions` migration. The service role
  receives only the insert/select/update access required by the API; the migration grants no delete
  permission.
- Persisted diagnostic selected-item state and rehydrated answered state from immutable
  `evidence_events`, so configured deployments resume after a process restart.
- Persisted remediation state and attempt/exit-ticket idempotency results. Existing in-memory maps
  remain only for an unconfigured local-development API.
- Recorded a validated, server-derived evidence event when an exit ticket is submitted in a
  configured deployment, so new transfer evidence feeds live diagnostics and class planning.
- Added a deterministic teacher projection that reads the G7 roster and lesson evidence directly;
  existing persisted teacher-plan versions still win so edits are preserved.
- Aligned the production teacher web adapter to the G7 class and plan identifiers.
- Kept VAI-22 demo reset non-destructive: it clears only local fallback dictionaries and never
  changes Supabase durable sessions or evidence rows.

## Files changed

- `apps/api/src/ailearn_api/durable_session_store.py`
- `apps/api/src/ailearn_api/teacher_projection.py`
- `apps/api/src/ailearn_api/evidence_client.py`
- `apps/api/src/ailearn_api/students_client.py`
- `apps/api/src/ailearn_api/routes/diagnostics.py`
- `apps/api/src/ailearn_api/routes/remediation.py`
- `apps/api/src/ailearn_api/routes/classes.py`
- `apps/api/src/ailearn_api/routes/lesson_plans.py`
- `apps/api/src/ailearn_api/routes/demo.py`
- `apps/api/src/ailearn_api/diagnostic_session_store.py`
- `apps/api/src/ailearn_api/teacher_fixtures.py`
- `apps/api/tests/test_durable_session_store.py`
- `apps/api/tests/test_durable_routes.py`
- `apps/api/tests/test_teacher_projection.py`
- `apps/api/tests/test_diagnostics_session.py`
- `apps/web/src/lib/adapters/teacher-repository.ts`
- `apps/web/src/features/teacher/TeacherWorkspace.test.tsx`
- `supabase/migrations/20260722000000_create_learning_sessions.sql`
- `docs/ARCHITECTURE.md`
- `docs/API_CONTRACTS.md`
- `README.md`

## Verification

| Command | Result |
| --- | --- |
| `uv run pytest tests/test_durable_routes.py tests/test_durable_session_store.py tests/test_teacher_projection.py tests/test_diagnostics_session.py tests/test_remediation.py tests/test_demo.py tests/test_lesson_plans.py` | PASS - 47 tests |
| `PATH=/tmp/ailearn-vai22-pnpm-bin:$PATH pnpm --filter @ailearn/web test -- --run apps/web/src/features/teacher/TeacherWorkspace.test.tsx` | PASS - 42 tests |
| `PATH=/tmp/ailearn-vai22-pnpm-bin:$PATH ./scripts/verify.sh` | PASS - formatting, lint, TypeScript and Python type checks, 42 web tests, 117 Python tests, web build, API package build |
| Live Supabase/Railway smoke | NOT RUN - no project credentials or deployment access in this session |

## Human decisions

- Accepted: use the existing G7 roster/evidence seed as the canonical teacher demo instead of
  retaining a disconnected G6 fixture.
- Accepted: preserve existing endpoint shapes and VAI-22's no-Supabase-mutation reset contract.

## Remaining limitations

- The remote migration must be applied through the approved deployment workflow; it was not applied
  from this session.
- VAI-21's submission presentation remains a separate open pull request; this issue supplies the
  durable evidence and projection behavior it can consume.
