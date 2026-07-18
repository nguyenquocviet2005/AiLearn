# VAI-41 - Refresh teacher and student dashboard frontend

## Session

- Date: 2026-07-18
- Human owner: Hải Nguyễn Hồng
- AI tool: Codex (GPT-5)
- Linear issue: https://linear.app/vaic-workspace/issue/VAI-41/refresh-teacher-and-student-dashboard-frontend
- Primary branch: `honghainguyen2003/vai-41-refresh-teacher-and-student-dashboard-frontend`
- Follow-up branch: `vai-41-homepage-technology`
- Review branch: `vai-41-landing-review-fixes`
- Worktree: `/home/h2n/h2n/worktrees/vai-41-refresh-dashboard-frontend`
- Primary pull request: https://github.com/nguyenquocviet2005/AiLearn/pull/26 (merged)
- Technology pull request: https://github.com/nguyenquocviet2005/AiLearn/pull/29 (merged)
- Classification pull request: https://github.com/nguyenquocviet2005/AiLearn/pull/30 (merged)
- Motion and review pull request: https://github.com/nguyenquocviet2005/AiLearn/pull/32 (draft)

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

The human then requested a homepage team section using the member information and portraits from page
9 of `/home/h2n/h2n/AiLearn/mat/Bản sao của Vison.pdf`.

After the first draft pull request was published, the human requested a prominent homepage technology
section grounded in the repository documentation and running implementation. The human also selected
`/home/h2n/h2n/AiLearn/mat/KAWAII]_Final - LOGO - 1 – Đã sửa (1).png` as the public header logo.

After the technology pull request merged, the human requested a concrete misconception-classification
case, the exact slogan `Thấy đúng chỗ vướng. Dạy đúng nơi cần.`, and the member name Vũ Trung Quân.
The post-merge review then checked the complete PR #29/#30 change set for content accuracy,
accessibility, dead CSS, asset consistency, and verification evidence.

## Planning and Implementation Prompts

- Create a new Linear issue assigned to the human owner and begin implementation.
- Modernize both dashboard experiences with the existing branding guide and mascot/icon language.
- Preserve the current product direction and workflow behavior.
- Revise the landing page and dashboards to remove the dense boxed appearance, share one floating
  header, add purposeful motion, and make side navigation adaptive.
- Remove redundant dashboard headers, stabilize rail dimensions, and strengthen the firefly light
  motif across the landing and student experience.
- Add the six-person AiLearn team to the public homepage using the approved vision-deck portraits,
  names, and roles.
- Explain the running algorithms, database, curriculum sources, and deployable stack on the homepage.
- Replace the public-header identity with the selected final AiLearn logo asset.
- Replace the dense formula-led technology composition with three Vietnamese product pillars, make
  Personalized Remediation the third pillar, and present the runtime as a recognizable logo stack.
- Explain how a wrong response maps to a misconception, related skills, competing evidence, a next
  probe, and a teacher action.
- Standardize the public slogan and replace the fourth team member's displayed name with Vũ Trung Quân.
- Review every technology and classification commit after merge and correct confirmed findings.
- Turn the hero's Observe, Explain, and Adapt orbit into a vivid looping process illustration.

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
- Extracted the six source portraits from the vision PDF, converted them to compact WebP assets, and
  added an editorial staggered team section with direct header and footer navigation.
- Added a connected technology narrative covering the evidence-updated learner model, skill-graph and
  misconception diagnosis, Personalized Remediation, CTGDPT 2018 seed and golden-case inputs, current
  React/Vite/FastAPI/Supabase runtime, Railway/Vercel deployment, and FIFO offline queue.
- Replaced formula-heavy English labels with Vietnamese product outcomes and a clean three-stage flow:
  understand mastery, find the root gap, and personalize a short path to repair it.
- Added locally served brand marks for the running stack. Neo4j, pgvector, and LangGraph appear only in
  a clearly labeled expansion lane; the current Python graph engine and optional LLM boundary remain
  explicit.
- Derived a 508px transparent PNG from the human-selected final logo and aligned it within the shared
  Dynamic Island header at desktop and mobile widths.
- Replaced the generic decision preview with the four seeded misconception groups and an inspectable
  response-to-action graph grounded in the curriculum and item fixtures. The graph follows the wrong
  option through its mapped misconception, related skills, shared prerequisite, and deeper foundation.
- Standardized the hero and SEO title slogan, updated the fourth team member to Vũ Trung Quân, and
  aligned the portrait asset filename with the displayed identity.
- Reviewed PR #29 and PR #30 after merge, corrected the low-contrast diagnosis labels, and removed
  preview/runtime selectors that no longer had a source reference.
- Rebuilt the static hero orbit as a 12-second browser-native motion loop. The active phase now moves
  from collected evidence bars, through a small causal graph, to a new learning path while a colored
  light completes the circular journey around the mascot.
- Kept the motion loop dependency-free, paused it on interaction, supplied a static reduced-motion
  state, and removed it at the narrow mobile breakpoint where it would compete with the primary copy.
- Fetched merged VAI-25 work from `origin/main` at `0b8c9a1`, preserved its expanded teacher demo flow,
  and adapted the VAI-41 companion rail to the new `TeacherShell` contract and `teacher.css` ownership.
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
- Accepted: Publish the six team members and portraits from the supplied product vision deck on the
  homepage.
- Accepted: Make the repository's implemented technology and data provenance a prominent homepage
  story.
- Accepted: Use the supplied `KAWAII]_Final - LOGO - 1 – Đã sửa (1).png` artwork in the public header.
- Modified: Distinguish implemented runtime capabilities from proposed architecture so the homepage
  does not present LangGraph, pgvector, or an LLM provider as already deployed.
- Accepted: Make Personalized Remediation the third technology pillar and emphasize how AiLearn repairs
  a gap instead of foregrounding mathematical formulas.
- Accepted: Show Railway and the wider running stack through recognizable logos; show Neo4j only as a
  graph-database expansion option because it is not a current repository dependency.
- Accepted: Show the seeded error taxonomy and how AiLearn locates a misconception before suggesting
  an intervention.
- Accepted: Render the location process as a visible skill graph instead of a linear text trace.
- Accepted: Present Observe, Explain, and Adapt as a continuously looping hero illustration rather
  than shipping a heavier prerecorded video asset.
- Accepted: Use the exact slogan `Thấy đúng chỗ vướng. Dạy đúng nơi cần.` in the hero and SEO title.
- Accepted: Replace Phạm Tuấn Phong with Vũ Trung Quân in the published team list.
- Modified: No new icon dependency was added because the repository has no approved icon library;
  familiar system symbols and the approved mascot asset are used instead.
- Rejected: None.

## Files Changed

- `README.md`
- `ai-logs/sessions/VAI-41-refresh-teacher-student-dashboard.md`
- `apps/web/src/App.test.tsx`
- `apps/web/src/index.css`
- `apps/web/src/components/navigation/AppHeader.tsx`
- `apps/web/public/brand/ailearn-header-logo.png`
- `apps/web/public/technology/*.svg`
- `apps/web/src/features/landing/LandingPage.tsx`
- `apps/web/src/features/landing/LandingPage.test.tsx`
- `apps/web/src/features/landing/landing.css`
- `apps/web/public/team/*.webp`
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
| Web tests after team-section addition                                         | PASS - 58/58 web tests                                                                                    |
| Chrome 1440px and 390px team-section inspection                               | PASS - all six portraits render; long names wrap; no horizontal overflow                                  |
| `PATH=/tmp/ailearn-vai41-bin:$PATH ./scripts/verify.sh` after team addition   | PASS - format, lint, type-check, 58 web tests, web build, Ruff, mypy, 120 API/domain tests, and API build |
| `git fetch origin` before publication                                         | PASS - updated `origin/main` through merged PR #25 at `0b8c9a1`                                           |
| Web tests after VAI-25 merge resolution                                       | PASS - 59/59 web tests                                                                                    |
| Chrome desktop and 390px inspection after VAI-25 merge                        | PASS - landing, teacher rail, and student dock render without horizontal overflow                         |
| `PATH=/tmp/ailearn-vai41-bin:$PATH ./scripts/verify.sh` after VAI-25 merge    | PASS - format, lint, type-check, 59 web tests, web build, Ruff, mypy, 121 API/domain tests, and API build |
| Draft pull request publication                                                | PASS - https://github.com/nguyenquocviet2005/AiLearn/pull/26                                              |
| Web tests after technology and header-logo addition                           | PASS - 59/59 web tests                                                                                    |
| Web lint, type-check, and production build after technology addition          | PASS                                                                                                      |
| Chrome 1440px and 390px technology-section inspection                         | PASS - logo remains aligned, technology flow is readable, and no horizontal overflow is present           |
| `PATH=/tmp/ailearn-vai41-bin:$PATH ./scripts/verify.sh` after technology work | PASS - format, lint, type-check, 59 web tests, web build, Ruff, mypy, 121 API/domain tests, and API build |
| Web tests after technology feedback pass                                      | PASS - 59/59 web tests                                                                                    |
| Chrome 1440px, 900px, and 390px technology inspection                         | PASS - clean lanes, readable stack logos, and no horizontal overflow                                      |
| `PATH=/tmp/ailearn-vai41-bin:$PATH ./scripts/verify.sh` after feedback pass   | PASS - format, lint, type-check, 59 web tests, web build, Ruff, mypy, 121 API/domain tests, and API build |
| Follow-up draft pull request publication                                      | PASS - https://github.com/nguyenquocviet2005/AiLearn/pull/29                                              |
| PR #29 and PR #30 merged-state and CI audit                                   | PASS - both merged; web, API, and Vercel checks passed                                                    |
| Post-merge desktop and 390px diagnosis inspection                             | PASS_WITH_NOTES - no overflow; found low-contrast cyan labels on white                                    |
| Desktop and 390px graph inspection after review fixes                         | PASS - graph relations remain readable; labels reach 11.4:1 contrast; no overlap or horizontal overflow   |
| `PATH=/tmp/ailearn-vai41-bin:$PATH ./scripts/verify.sh` after graph fixes     | PASS - format, lint, type-check, 66 web tests, web build, Ruff, mypy, 123 API/domain tests, and API build |
| Chrome 1440px, 900px, and 390px hero motion inspection                        | PASS - all three phases render; tablet labels stay in frame; no horizontal overflow                       |
| `PATH=/tmp/ailearn-vai41-bin:$PATH ./scripts/verify.sh` after hero motion     | PASS - format, lint, type-check, 66 web tests, web build, Ruff, mypy, 123 API/domain tests, and API build |
| Review-fix draft pull request publication                                     | PASS - https://github.com/nguyenquocviet2005/AiLearn/pull/32                                              |

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

The first web test run after merging VAI-25 passed 57/59 tests. Both failures were stale semantic
assertions for VAI-25's former English header and white-backed logo. The assertions were updated to the
Vietnamese companion-rail navigation and mascot brand link; the next run passed 59/59 before full
verification.

## Remaining Risks and Limitations

- API-provided fixture rationale and skill labels remain in English; translating domain data is outside
  this frontend-only issue.
- No third-party icon dependency was approved or added.
- Full verification reports three existing Starlette/FastAPI deprecation warnings; no test fails.
- The diagnosis preview uses synthetic counts and labels itself as aggregated sample data; it does not
  read live student records.
