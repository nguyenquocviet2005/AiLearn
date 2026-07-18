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

The human later supplied the intended hybrid deployment diagram and requested the flat running-stack
logo grid be redrawn as a layered architecture from the browser through local/edge routing, cloud API,
data and workers, learning engines, and cross-cutting controls.

The human then rejected the diagnosis section's rigid three-column, single-math-example presentation
and requested a general, animated relationship graph spanning learners, assignments and evidence,
error categories, location methods, and teaching actions.

The human also rejected the first learning-cycle section's staggered straight-line layout and
uncontrolled wrapping, requesting a presentation that matches the landing page's more fluid visual
language.

After reviewing the closed-orbit draft, the human requested a more literal input-to-output model:
existing videos, learning documents, prior tests, and pre-class lesson preparation should enter the
first stage; each stage should visibly hand an artifact to the next; measurable outcomes should leave
the fourth stage; and those outcomes should loop back into the next cycle's inputs.

The human then requested a deeper algorithm section directly below the running-technology map. The
section needed to explain how the three core engines work, what makes their decisions distinctive, how
their scores are calculated, and how evidence moves from diagnosis through teacher planning and
personalized remediation.

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
- Make the teacher-dashboard and student-experience links in the audience section visually prominent
  framed calls to action.
- Enlarge the hero process, remove the phase lag, and make each phase literal: a moving magnifier for
  observation, sequentially illuminated graph nodes for tracing, and a curved path that straightens
  for adaptation.
- Redraw the running stack as a responsive layered architecture, retaining recognizable stack marks
  while explaining every device, local, edge, service, data, worker, AI, and control layer.
- Correct the runtime-map motion so particles split and merge along the drawn routes, center every
  particle on its connector, visibly connect layer four to layer five, remove all live-status tags,
  and keep only the School Hub expansion tag.
- Replace the concrete Grade 7 misconception walkthrough with a concise many-to-many graph that shows
  how multiple learners, tasks, errors, diagnosis methods, and actions correlate.
- Recompose the closed learning cycle as an actual loop, align it with the landing's motion language,
  and control heading and paragraph wrapping across desktop, tablet, and mobile.
- Turn the learning cycle into a compact transformation pipeline with concrete source artifacts,
  visible handoffs, measurable outcomes, and a right-to-left evidence feedback route.
- Add a visually connected three-engine algorithm explainer below the runtime stack, grounded in the
  implemented scoring rules, thresholds, graph traversal, state transitions, and fallback behavior.
- Center the learning-pipeline output packets on their horizontal connectors and rename the diagnostic
  and intervention artifacts to `Lỗ hổng gốc + độ tin cậy` and `Giáo án đã duyệt`.

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
- Promoted the two audience links into distinct 56px calls to action: white with a purple direction
  control for teachers, and yellow with a black direction control for students. Both include keyboard
  focus, hover feedback, reduced-motion behavior, and mobile-safe wrapping.
- Enlarged the desktop process orbit from 320px to 380px and shortened its loop from 12 to 9 seconds.
  A shared phase timeline now moves the marker and activates each label at the same keyframe, removing
  the previous transition gap.
- Replaced the flat nine-logo runtime grid with a connected hybrid architecture map. The map branches
  the browser application into a planned LAN School Hub and the live Vercel edge, merges both at the
  Railway FastAPI API, then fans out to Supabase/graph data and planned asynchronous workers before
  reaching the three learning engines and cross-cutting controls.
- Added explicit Vietnamese layer names, existing technology marks, animated data pulses, a
  reduced-motion fallback, and single-column mobile routing. Supporting copy distinguishes the current
  core from components that this presentation-only PR does not implement or deploy.
- Replaced center-only branch particles with paired path animations that travel vertically, split
  left/right, and merge back into the center. Layer four now uses a true two-to-one connector into the
  AI layer, while mobile retains one centered vertical path for its stacked layout.
- Removed every `Đang chạy` badge and removed expansion badges from Async Workers and cross-cutting
  controls. School Hub remains the only node-level `Mở rộng` badge; the PWA card retains its scoped
  `Mở rộng offline` label.
- Replaced the single-response diagnosis lab with a general five-family relationship graph. Sixteen
  circular nodes and twenty-two curved links show learner context, task evidence, error categories,
  location methods, and teacher actions as a changing many-to-many network.
- Added directional edge motion and three live signal paths, a reduced-motion fallback, and a grouped
  mobile representation. Removed the former concrete ratio example and its legacy CSS instead of
  retaining the dense taxonomy, hypothesis panel, and one-path skill trace.
- Rebuilt the four-stage learning cycle as a clockwise 2x2 orbit around a mascot-lit verification core.
  A moving signal closes the evidence loop on larger screens; mobile becomes a balanced vertical cycle
  with a visible return path.
- Shortened the section heading and step descriptions, then applied balanced heading wrapping, pretty
  paragraph wrapping, stable copy widths, and breakpoint-specific cleanup so titles no longer break at
  arbitrary words.
- Replaced the orbit draft with a compact six-stop learning pipeline. Video and lecture content,
  learning documents, prior tests, and pre-class lesson preparation converge on evidence encoding;
  animated artifact packets then move through gap location, approved intervention, verification, and
  three measurable after-class outcomes.
- Moved the outcome cluster to the right of stage four on desktop and added a U-shaped return route
  from that far-right output back into the source cluster. Tablet retains the horizontal four-stage
  flow, while mobile uses a clear vertical route and a two-column source list without overflow.
- Added a three-engine algorithm narrative beneath the runtime architecture. Diagnostic Intelligence
  now exposes the Beta-Bernoulli mastery posterior, 0.70 threshold, confidence formula, root-cause
  graph ranking, and abstention boundaries instead of implying an opaque AI score.
- Visualized Teacher Orchestration's exact `40% prevalence + 25% downstream impact + 20% lesson
urgency + 15% diagnostic confidence` score and its path into three-to-five need groups, a 45-minute
  lesson plan, and teacher approval without ranking students.
- Visualized Personalized Remediation as a deterministic five-step state path. Continued failure first
  changes representation, then steps back through graph prerequisites, and finally escalates; content
  selection shows the implemented 8/4/2/1/1 template score and the result returns as a new evidence
  event for diagnosis.
- Kept the engine composition unframed and responsive: horizontal score and state flows on desktop,
  vertical traceable paths on mobile, animated evidence signals, and reduced-motion fallbacks.
- Recentered the enlarged learning-pipeline packets by half their visual radius so every moving artifact
  remains on the connector from stage one through stage four. The mobile packet path retains its
  separate vertical alignment rule.
- Replaced the abstract phase marks with a scanning CSS magnifier, a four-node chase-light graph, and
  a four-point curved path that visibly settles into a straight line. Renamed the middle phase to the
  more concrete `Truy vết` while retaining its root-cause purpose.
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
- Accepted: Place the teacher and student entry links in branded frames that invite a clear click.
- Accepted: Use literal moving illustrations for observation, graph tracing, and path adaptation, and
  make the full process larger and faster.
- Accepted: Present the supplied hybrid system design as a readable layered stack rather than a flat
  collection of logos.
- Modified: Separate the current React/Vite/FastAPI/Supabase/Railway/Vercel core from scale-up layers
  so planned PWA storage, School Hub, worker, observability, and governance components are not described
  as already deployed.
- Accepted: Remove live-status badges, keep School Hub visibly marked as expansion work, and present
  Async Workers and cross-cutting controls without expansion tags.
- Accepted: Generalize the insight section beyond one mathematics example and visualize correlations
  across learners, assignments, error families, diagnostic methods, and actions.
- Accepted: Replace the staggered straight learning timeline with a genuinely closed visual orbit and
  deliberate line wrapping.
- Modified: Replace the abstract orbit center with a compact source-to-outcome pipeline whose animated
  artifacts and return route make every stage's input and output explicit.
- Accepted: Explain the three core engines in depth immediately below the running technology stack,
  including their scores, thresholds, operating flow, and differentiating behavior.
- Modified: Present the implemented deterministic rules as the decision core and LLM as optional
  wording enrichment only; student self-reported confidence remains stored evidence but is explicitly
  identified as not contributing to mastery or diagnosis confidence in the current version.
- Accepted: Use `Lỗ hổng gốc + độ tin cậy` and `Giáo án đã duyệt` as the pipeline's teacher-facing
  artifact names.
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

| Command                                                                       | Result                                                                                                     |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `git pull --ff-only origin main`                                              | PASS - updated through merged VAI-40                                                                       |
| `pnpm --filter @ailearn/web test` (baseline)                                  | FAIL - 56/57 passed; pre-existing lesson-plan save test timing failure                                     |
| `pnpm --filter @ailearn/web typecheck`                                        | PASS                                                                                                       |
| Focused teacher workspace tests                                               | PASS - 10/10                                                                                               |
| Focused student workspace tests                                               | PASS - 11/11                                                                                               |
| Focused teacher report and print tests                                        | PASS - 7/7                                                                                                 |
| Focused app route tests                                                       | PASS - 5/5                                                                                                 |
| Chrome desktop and 390px responsive inspection                                | PASS - no horizontal overflow after width correction                                                       |
| Shared header and primary navigation tests after design revision              | PASS - 58/58 web tests                                                                                     |
| Chrome desktop and true 390px inspection after design revision                | PASS - landing, teacher overview/lesson/report, and student home have no horizontal overflow               |
| `PATH=/tmp/ailearn-vai41-bin:$PATH ./scripts/verify.sh` after design revision | PASS - format, lint, type-check, 58 web tests, web build, Ruff, mypy, 120 API/domain tests, and API build  |
| Focused web tests after final feedback                                        | PASS - 58/58 web tests                                                                                     |
| Final Chrome desktop and 390px inspection                                     | PASS - rails remain 76/272px by 968px; mobile tap targets do not overlap; no horizontal overflow           |
| `PATH=/tmp/ailearn-vai41-bin:$PATH ./scripts/verify.sh` after final feedback  | PASS - format, lint, type-check, 58 web tests, web build, Ruff, mypy, 120 API/domain tests, and API build  |
| Chrome 967px transition alignment check                                       | PASS - mascot centered on the 64% boundary; no horizontal overflow                                         |
| Web tests after team-section addition                                         | PASS - 58/58 web tests                                                                                     |
| Chrome 1440px and 390px team-section inspection                               | PASS - all six portraits render; long names wrap; no horizontal overflow                                   |
| `PATH=/tmp/ailearn-vai41-bin:$PATH ./scripts/verify.sh` after team addition   | PASS - format, lint, type-check, 58 web tests, web build, Ruff, mypy, 120 API/domain tests, and API build  |
| `git fetch origin` before publication                                         | PASS - updated `origin/main` through merged PR #25 at `0b8c9a1`                                            |
| Web tests after VAI-25 merge resolution                                       | PASS - 59/59 web tests                                                                                     |
| Chrome desktop and 390px inspection after VAI-25 merge                        | PASS - landing, teacher rail, and student dock render without horizontal overflow                          |
| `PATH=/tmp/ailearn-vai41-bin:$PATH ./scripts/verify.sh` after VAI-25 merge    | PASS - format, lint, type-check, 59 web tests, web build, Ruff, mypy, 121 API/domain tests, and API build  |
| Draft pull request publication                                                | PASS - https://github.com/nguyenquocviet2005/AiLearn/pull/26                                               |
| Web tests after technology and header-logo addition                           | PASS - 59/59 web tests                                                                                     |
| Web lint, type-check, and production build after technology addition          | PASS                                                                                                       |
| Chrome 1440px and 390px technology-section inspection                         | PASS - logo remains aligned, technology flow is readable, and no horizontal overflow is present            |
| `PATH=/tmp/ailearn-vai41-bin:$PATH ./scripts/verify.sh` after technology work | PASS - format, lint, type-check, 59 web tests, web build, Ruff, mypy, 121 API/domain tests, and API build  |
| Web tests after technology feedback pass                                      | PASS - 59/59 web tests                                                                                     |
| Chrome 1440px, 900px, and 390px technology inspection                         | PASS - clean lanes, readable stack logos, and no horizontal overflow                                       |
| `PATH=/tmp/ailearn-vai41-bin:$PATH ./scripts/verify.sh` after feedback pass   | PASS - format, lint, type-check, 59 web tests, web build, Ruff, mypy, 121 API/domain tests, and API build  |
| Follow-up draft pull request publication                                      | PASS - https://github.com/nguyenquocviet2005/AiLearn/pull/29                                               |
| PR #29 and PR #30 merged-state and CI audit                                   | PASS - both merged; web, API, and Vercel checks passed                                                     |
| Post-merge desktop and 390px diagnosis inspection                             | PASS_WITH_NOTES - no overflow; found low-contrast cyan labels on white                                     |
| Desktop and 390px graph inspection after review fixes                         | PASS - graph relations remain readable; labels reach 11.4:1 contrast; no overlap or horizontal overflow    |
| `PATH=/tmp/ailearn-vai41-bin:$PATH ./scripts/verify.sh` after graph fixes     | PASS - format, lint, type-check, 66 web tests, web build, Ruff, mypy, 123 API/domain tests, and API build  |
| Chrome 1440px, 900px, and 390px hero motion inspection                        | PASS - all three phases render; tablet labels stay in frame; no horizontal overflow                        |
| `PATH=/tmp/ailearn-vai41-bin:$PATH ./scripts/verify.sh` after hero motion     | PASS - format, lint, type-check, 66 web tests, web build, Ruff, mypy, 123 API/domain tests, and API build  |
| Review-fix draft pull request publication                                     | PASS - https://github.com/nguyenquocviet2005/AiLearn/pull/32                                               |
| Chrome 1440px and 390px audience CTA inspection                               | PASS - both framed actions remain readable, balanced, and within the viewport                              |
| `PATH=/tmp/ailearn-vai41-bin:$PATH ./scripts/verify.sh` after audience CTAs   | PASS - format, lint, type-check, 66 web tests, web build, Ruff, mypy, 123 API/domain tests, and API build  |
| Chrome 1440px and 900px literal phase-motion inspection                       | PASS - magnifier, node chase, straightening path, and synchronized marker remain in frame                  |
| `PATH=/tmp/ailearn-vai41-bin:$PATH ./scripts/verify.sh` after motion revision | PASS - format, lint, type-check, 66 web tests, web build, Ruff, mypy, 123 API/domain tests, and API build  |
| Focused web tests and type-check after layered-stack redesign                 | PASS - 66/66 web tests and TypeScript project build                                                        |
| Chrome 1440px, 900px, and 390px layered-stack inspection                      | PASS - route branches, stack marks, status labels, and mobile flow render without horizontal overflow      |
| `PATH=/tmp/ailearn-vai41-bin:$PATH ./scripts/verify.sh` after stack redesign  | PASS - format, lint, type-check, 66 web tests, web build, Ruff, mypy, 123 API/domain tests, and API build  |
| Focused web tests and type-check after connector corrections                  | PASS - 66/66 web tests and TypeScript project build                                                        |
| Chrome 1440px and 390px connector inspection                                  | PASS - paired particles follow split/merge paths, remain line-centered, and layer 4 connects to layer 5    |
| `PATH=/tmp/ailearn-vai41-bin:$PATH ./scripts/verify.sh` after connector fixes | PASS - format, lint, type-check, 66 web tests, web build, Ruff, mypy, 123 API/domain tests, and API build  |
| First focused test after insight-graph replacement                            | FAIL - one stale assertion still required the removed concrete Grade 7 example                             |
| Focused web tests and type-check after assertion update                       | PASS - 66/66 web tests and TypeScript project build                                                        |
| Chrome 1440px, 900px, and 390px relationship-graph inspection                 | PASS - many-to-many paths remain legible; mobile groups do not overlap or overflow                         |
| `PATH=/tmp/ailearn-vai41-bin:$PATH ./scripts/verify.sh` after insight refresh | PASS - format, lint, type-check, 66 web tests, web build, Ruff, mypy, 123 API/domain tests, and API build  |
| Focused web tests and type-check after learning-cycle redesign                | PASS - 66/66 web tests and TypeScript project build                                                        |
| Chrome 1440px, 900px, and 390px learning-cycle inspection                     | PASS - orbit alignment, intentional wrapping, and mobile return path render without overflow               |
| First full verification after learning-cycle redesign                         | FAIL - one known teacher lesson-plan save timing test did not enable its button before the assertion       |
| Focused teacher workspace retry                                               | PASS - 10/10 teacher workspace tests                                                                       |
| `PATH=/tmp/ailearn-vai41-bin:$PATH ./scripts/verify.sh` after learning cycle  | PASS - format, lint, type-check, 66 web tests, web build, Ruff, mypy, 123 API/domain tests, and API build  |
| First web suite after explicit input/output redesign                          | FAIL - landing passed; the known teacher save timing assertion failed once at 65/66 web tests              |
| Focused landing and teacher workspace retry                                   | PASS - 12/12 focused tests and TypeScript project build                                                    |
| Chrome 1440px, 900px, and 390px six-stop flow inspection                      | PASS - source convergence, handoff packets, outcome release, return route, and wrapping stay in frame      |
| `PATH=/tmp/ailearn-vai41-bin:$PATH ./scripts/verify.sh` after pipeline pass   | PASS - format, lint, type-check, 66 web tests, web build, Ruff, mypy, 123 API/domain tests, and API build  |
| Focused landing test and type-check after three-engine addition               | PASS - 2/2 landing tests and TypeScript project build                                                      |
| Chrome 1440px, 900px, and 390px three-engine inspection                       | PASS - formulas, weighted score, state paths, and mobile flows remain readable without horizontal overflow |
| `PATH=/tmp/ailearn-vai41-bin:$PATH ./scripts/verify.sh` after engine section  | PASS - format, lint, type-check, 66 web tests, web build, Ruff, mypy, 123 API/domain tests, and API build  |
| Focused landing test and type-check after pipeline alignment                  | PASS - 2/2 landing tests and TypeScript project build                                                      |
| Chrome 1440px, 900px, and 390px packet-alignment inspection                   | PASS - all inter-stage packets remain centered on their horizontal or vertical connectors                  |
| `PATH=/tmp/ailearn-vai41-bin:$PATH ./scripts/verify.sh` after label alignment | PASS - format, lint, type-check, 66 web tests, web build, Ruff, mypy, 123 API/domain tests, and API build  |

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
- The relationship graph is an explanatory visualization of the product model; it does not read or
  expose live student records.
