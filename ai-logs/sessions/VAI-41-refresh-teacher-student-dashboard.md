# VAI-41 - Refresh teacher and student dashboard frontend

## Session

- Date: 2026-07-18
- Human owner: Hải Nguyễn Hồng
- AI tool: Codex (GPT-5)
- Linear issue: https://linear.app/vaic-workspace/issue/VAI-41/refresh-teacher-and-student-dashboard-frontend
- Branch: `honghainguyen2003/vai-41-refresh-teacher-and-student-dashboard-frontend`
- Worktree: `/home/h2n/h2n/worktrees/vai-41-refresh-dashboard-frontend`
- Pull request: Pending

## Objective and Context

Refresh the teacher and student dashboards so they use the same AiLearn branding as the public landing
page. Reuse the approved purple, white, and black visual system, logo, and mascot while preserving the
existing teacher planning, reporting, student diagnostic, remediation, and offline behavior.

## Planning and Implementation Prompts

- Create a new Linear issue assigned to the human owner and begin implementation.
- Modernize both dashboard experiences with the existing branding guide and mascot/icon language.
- Preserve the current product direction and workflow behavior.

## Approved Plan

1. Introduce shared dashboard branding tokens and a reusable teacher shell.
2. Refresh teacher overview, lesson plan, report, loading/error, and print surfaces.
3. Refresh student header, navigation, home, readiness, remediation, help, and offline states.
4. Update focused tests, documentation, and this collaboration log.
5. Run full verification and inspect desktop/mobile screenshots.

The human explicitly requested issue creation and immediate implementation, so no additional approval
gate was required for this presentation-only change. No dependency, public contract, or backend change
was introduced.

## AI Contributions

- Created VAI-41 as an urgent AiLearn issue, assigned it to the human owner, related it to VAI-40, and
  moved it to In Progress.
- Synced `main` after the VAI-40 merge and created the issue worktree/branch.
- Added a reusable teacher dashboard shell with branded navigation, role context, and mascot guidance.
- Reworked teacher overview, lesson plan, intervention report, loading/error, and printable layouts.
- Reworked the student shell, home, readiness, remediation path, exit ticket, and help/offline layouts.
- Localized teacher-facing interface copy to Vietnamese without changing API-provided evidence text.
- Updated tests for the new observable labels, branding, navigation state, and asynchronous save guard.
- Performed desktop and true 390px viewport checks through Chrome DevTools Protocol.

## Human Decisions

- Accepted: Keep the product name AiLearn.
- Accepted: Reuse the VAI-40 branding guide and local brand assets.
- Accepted: Refresh both teacher and student dashboards in one bounded issue.
- Modified: No new icon dependency was added because the repository has no approved icon library;
  familiar system symbols and the approved mascot asset are used instead.
- Rejected: None.

## Files Changed

- `README.md`
- `ai-logs/sessions/VAI-41-refresh-teacher-student-dashboard.md`
- `apps/web/src/App.test.tsx`
- `apps/web/src/index.css`
- `apps/web/src/features/teacher/TeacherShell.tsx`
- `apps/web/src/features/teacher/TeacherWorkspace.tsx`
- `apps/web/src/features/teacher/TeacherWorkspace.test.tsx`
- `apps/web/src/features/teacher/report/TeacherReport.tsx`
- `apps/web/src/features/teacher/report/TeacherReport.test.tsx`
- `apps/web/src/features/teacher/print/PrintableTeacherReport.tsx`
- `apps/web/src/features/teacher/print/PrintableTeacherReport.test.tsx`
- `apps/web/src/features/student/StudentWorkspace.tsx`
- `apps/web/src/features/student/StudentWorkspace.test.tsx`
- `apps/web/src/features/student/StudentHome.tsx`
- `apps/web/src/features/student/ReadinessQuestion.tsx`
- `apps/web/src/features/student/RemediationPath.tsx`
- `apps/web/src/features/student/ExitTicket.tsx`
- `apps/web/src/features/student/StudentHelp.tsx`
- `apps/web/src/features/student/student.css`

## Commands and Results

| Command | Result |
|---|---|
| `git pull --ff-only origin main` | PASS - updated through merged VAI-40 |
| `pnpm --filter @ailearn/web test` (baseline) | FAIL - 56/57 passed; pre-existing lesson-plan save test timing failure |
| `pnpm --filter @ailearn/web typecheck` | PASS |
| Focused teacher workspace tests | PASS - 10/10 |
| Focused student workspace tests | PASS - 11/11 |
| Focused teacher report and print tests | PASS - 7/7 |
| Focused app route tests | PASS - 5/5 |
| Chrome desktop and 390px responsive inspection | PASS - no horizontal overflow after width correction |
| `PATH=/tmp/ailearn-vai41-bin:$PATH ./scripts/verify.sh` | PASS - format, lint, type-check, 58 web tests, web build, Ruff, mypy, 120 API/domain tests, and API build |

The shell's Corepack CJS launcher fails on this machine with
`ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING`; verification uses the same pinned pnpm 11.13.1 package via
its ESM launcher at `/home/h2n/.cache/node/corepack/pnpm/11.13.1/bin/pnpm.mjs`.

## Remaining Risks and Limitations

- API-provided fixture rationale and skill labels remain in English; translating domain data is outside
  this frontend-only issue.
- No third-party icon dependency was approved or added.
- Full verification reports three existing Starlette/FastAPI deprecation warnings; no test fails.
- Pull request and CI evidence will be recorded after publication.
