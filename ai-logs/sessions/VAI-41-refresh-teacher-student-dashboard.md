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

After reviewing the first implementation, the human expanded the presentation scope to include the
landing page and requested a less rectangular composition, one Dynamic Island-inspired translucent
header across the web, more expressive motion, and adaptive side navigation that behaves like a
companion.

In the final feedback pass, the human requested the dashboard headers be consolidated into the side
rails, the landing header lose its white logo background while retaining blur, the hero copy move up,
and the firefly mascot use its glowing tail as a recurring light source.

## Planning and Implementation Prompts

- Create a new Linear issue assigned to the human owner and begin implementation.
- Modernize both dashboard experiences with the existing branding guide and mascot/icon language.
- Preserve the current product direction and workflow behavior.
- Revise the landing page and dashboards to remove the dense boxed appearance, share one floating
  header, add purposeful motion, and make side navigation adaptive.
- Remove redundant dashboard headers, stabilize rail dimensions, and strengthen the firefly light
  motif across the landing and student experience.

## Approved Plan

1. Introduce shared branding tokens and a reusable floating public application header.
2. Recompose the landing page around the brand image, an animated evidence loop, and open content bands.
3. Refresh teacher overview, lesson plan, report, loading/error, and print surfaces.
4. Refresh student home, readiness, remediation, help, and offline states around an adaptive companion
   rail that becomes a mobile dock.
5. Update focused tests, documentation, and this collaboration log.
6. Run full verification and inspect desktop/mobile screenshots.

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
- Added a semantic `AppHeader` to the landing page with a transparent, blurred Dynamic Island-inspired
  interaction state and removed the white-backed logo treatment.
- Reworked both dashboard sidebars as compact companion rails that expand on interaction and become
  bottom docks on smaller viewports.
- Consolidated dashboard identity and workspace controls into the companion rails, fixed both rails at
  `76px` collapsed and `272px` expanded without changing height, and corrected overlapping mobile tap
  targets.
- Revisited the landing learning loop, audience bands, evidence preview, hero signal, and motion system
  to reduce repetitive rectangular surfaces.
- Lifted the hero copy, changed the teacher/student transition to a curved composition, and reused the
  mascot's illuminated tail as the hero, transition, trust, rail, and student-progress light source.
- Anchored the transition mascot to the `64%` teacher/student boundary at tablet widths after the final
  visual review exposed a breakpoint-specific horizontal offset.
- Added reduced-motion fallbacks for every new continuous or entrance animation.
- Localized teacher-facing interface copy to Vietnamese without changing API-provided evidence text.
- Updated tests for the new observable labels, branding, navigation state, and asynchronous save guard.
- Performed desktop and true 390px viewport checks through Chrome DevTools Protocol.

## Human Decisions

- Accepted: Keep the product name AiLearn.
- Accepted: Reuse the VAI-40 branding guide and local brand assets.
- Accepted: Refresh both teacher and student dashboards in one bounded issue.
- Accepted: Expand the presentation scope to include the landing page and a shared site-wide header.
- Accepted: Use a Dynamic Island-inspired translucent header and adaptive companion navigation.
- Accepted: Keep the public header transparent and blurred, while moving dashboard context and actions
  into the side rails.
- Accepted: Use the firefly tail as a purposeful glowing-light motif instead of decorative mascot
  placement alone.
- Modified: No new icon dependency was added because the repository has no approved icon library;
  familiar system symbols and the approved mascot asset are used instead.
- Rejected: None.

## Files Changed

- `README.md`
- `ai-logs/sessions/VAI-41-refresh-teacher-student-dashboard.md`
- `apps/web/src/App.test.tsx`
- `apps/web/src/index.css`
- `apps/web/src/components/navigation/AppHeader.tsx`
- `apps/web/src/features/landing/LandingPage.tsx`
- `apps/web/src/features/landing/LandingPage.test.tsx`
- `apps/web/src/features/landing/landing.css`
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

| Command                                                                       | Result                                                                                                    |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `git pull --ff-only origin main`                                              | PASS - updated through merged VAI-40                                                                      |
| `pnpm --filter @ailearn/web test` (baseline)                                  | FAIL - 56/57 passed; pre-existing lesson-plan save test timing failure                                    |
| `pnpm --filter @ailearn/web typecheck`                                        | PASS                                                                                                      |
| Focused teacher workspace tests                                               | PASS - 10/10                                                                                              |
| Focused student workspace tests                                               | PASS - 11/11                                                                                              |
| Focused teacher report and print tests                                        | PASS - 7/7                                                                                                |
| Focused app route tests                                                       | PASS - 5/5                                                                                                |
| Chrome desktop and 390px responsive inspection                                | PASS - no horizontal overflow after width correction                                                      |
| Shared header and primary navigation tests after design revision              | PASS - 58/58 web tests                                                                                    |
| Chrome desktop and true 390px inspection after design revision                | PASS - landing, teacher overview/lesson/report, and student home have no horizontal overflow              |
| `PATH=/tmp/ailearn-vai41-bin:$PATH ./scripts/verify.sh` after design revision | PASS - format, lint, type-check, 58 web tests, web build, Ruff, mypy, 120 API/domain tests, and API build |
| Focused web tests after final feedback                                        | PASS - 58/58 web tests                                                                                    |
| Final Chrome desktop and 390px inspection                                     | PASS - rails remain 76/272px by 968px; mobile tap targets do not overlap; no horizontal overflow          |
| `PATH=/tmp/ailearn-vai41-bin:$PATH ./scripts/verify.sh` after final feedback  | PASS - format, lint, type-check, 58 web tests, web build, Ruff, mypy, 120 API/domain tests, and API build |
| Chrome 967px transition alignment check                                       | PASS - mascot centered on the 64% boundary; no horizontal overflow                                        |

An initial scoped Prettier invocation used `../../../` instead of `../../` for the two root-level
documentation files and exited before verification started. The paths were corrected, both files were
formatted, and the complete verification command above passed.

The first focused test run after moving student identity into the rail passed 57/58 tests because the
existing assertion expected one student-name label. The new layout intentionally exposes the name in
both the rail and page context; the semantic assertion now expects both labels and the rerun passed
58/58.

The shell's Corepack CJS launcher fails on this machine with
`ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING`; verification uses the same pinned pnpm 11.13.1 package via
its ESM launcher at `/home/h2n/.cache/node/corepack/pnpm/11.13.1/bin/pnpm.mjs`.

After the machine restart, one root-scoped Prettier command could not find the web-local binary and the
first verify attempt reached the broken Corepack launcher because the temporary pnpm wrapper had been
removed. Prettier was rerun through `@ailearn/web`, the wrapper was restored as a symlink to the pinned
ESM launcher, and the complete verification command above passed from the beginning.

## Remaining Risks and Limitations

- API-provided fixture rationale and skill labels remain in English; translating domain data is outside
  this frontend-only issue.
- No third-party icon dependency was approved or added.
- Full verification reports three existing Starlette/FastAPI deprecation warnings; no test fails.
- Pull request and CI evidence will be recorded after publication.
