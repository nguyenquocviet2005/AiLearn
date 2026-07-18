# VAI-22 - Add exit ticket, transfer result and demo reset

- Date: 2026-07-18
- Human owner: Hai Nguyen Hong
- AI tool and model: Codex, GPT-5
- Linear: VAI-22
- Branch: `honghainguyen2003/vai-22-add-exit-ticket-transfer-result-and-demo-reset`
- Worktree: `/home/h2n/h2n/worktrees/vai-22-add-exit-ticket-transfer-result-and-demo-reset`
- Pull request: not created

## Objective and approved plan

Implement a final exit-ticket flow, record transfer/escalation outcomes, make a new evidence item
able to select a revised demo diagnostic profile, and provide a one-click reset for six synthetic
demo personas. The human owner approved implementation after VAI-18 was merged and requested that
the latest `main` be pulled first.

## Planning and implementation

- Pulled `main` from `6a2f047` to `fe77783` before creating the worktree.
- Confirmed VAI-18 is Done in Linear and VAI-22 was moved from Backlog to In Progress.
- Read `AGENTS.md`, VAI-22/VAI-18, architecture/contracts, remediation route and state machine,
  VAI-18 student UI/tests, offline queue/sync, seed loader, and related API tests.
- Added `data/seeds/demo-personas.json` for the six anonymized walkthrough states.
- Added demo discovery/reset endpoints and reset helpers scoped only to in-memory session state.
- Added idempotent exit-ticket recording to remediation, with a server-only answer key and a
  deterministic reclassification branch for the designated fixture.
- Added typed browser adapter methods, offline queue support, exit-ticket UI, and seeded-persona
  reset control.

## Files changed

- `apps/api/src/ailearn_api/demo_data.py`
- `apps/api/src/ailearn_api/diagnostic_session_store.py`
- `apps/api/src/ailearn_api/routes/demo.py`
- `apps/api/src/ailearn_api/routes/remediation.py`
- `apps/api/src/ailearn_api/main.py`
- `apps/api/tests/test_demo.py`
- `apps/api/tests/test_remediation.py`
- `apps/web/src/features/student/DemoReset.tsx`
- `apps/web/src/features/student/ExitTicket.tsx`
- `apps/web/src/features/student/StudentHome.tsx`
- `apps/web/src/features/student/StudentWorkspace.tsx`
- `apps/web/src/features/student/StudentWorkspace.test.tsx`
- `apps/web/src/features/student/student.css`
- `apps/web/src/lib/adapters/student-repository.ts`
- `apps/web/src/lib/adapters/student-types.ts`
- `apps/web/src/lib/offline/queue.ts`
- `apps/web/src/lib/offline/queue.test.ts`
- `apps/web/src/lib/offline/sync.ts`
- `apps/web/src/lib/offline/sync.test.ts`
- `data/seeds/demo-personas.json`
- `docs/API_CONTRACTS.md`
- `docs/ARCHITECTURE.md`

## Verification

| Command                                                                                                                                                                               | Result                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `uv run --project apps/api pytest apps/api/tests/test_remediation.py apps/api/tests/test_demo.py`                                                                                     | PASS - 23 tests                                                                              |
| `node --experimental-vm-modules .../pnpm.cjs --filter @ailearn/web typecheck`                                                                                                         | PASS                                                                                         |
| `node --experimental-vm-modules .../pnpm.cjs --filter @ailearn/web test -- src/features/student/StudentWorkspace.test.tsx src/lib/offline/queue.test.ts src/lib/offline/sync.test.ts` | PASS - 33 tests                                                                              |
| `PATH=/tmp/ailearn-vai22-pnpm-bin:$PATH ./scripts/verify.sh`                                                                                                                          | PASS - 34 web tests, 110 Python tests, web build, API package build                          |
| Manual smoke                                                                                                                                                                          | PASS - `/health`, six-persona endpoint, and `http://localhost:5173/student` render correctly |

## Human decisions

- Accepted: implementation of the VAI-22 API/contract additions after VAI-18 was merged.

## Remaining limitations

- Demo reset deliberately clears only transient local/API session state; durable session and
  evidence-pipeline integration remain owned by VAI-20.
