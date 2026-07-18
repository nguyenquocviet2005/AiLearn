# AI Collaboration Log — Teacher Workspace Product Demo

## Session

- Date: 2026-07-19
- Human owner: Hai Pham
- AI tool/model: OpenAI Codex
- Linear issue: None associated; no issue was invented or modified.
- Branch: `feat/teacher-workspace-product-demo`
- Worktree: `/Users/haipham/Documents/AiLearn-parallel-2`
- Target: `origin/dev` / pull request to `dev`
- Baseline: `3405ba81b4d8ec4e9656df4096b14908a92036aa`

## Objective

Turn the existing teacher engine views into a cohesive, Vietnamese, demo-ready Teacher Workspace while preserving the landing page and avoiding the separately owned student workspace. Engine metrics must be derived from current API contracts rather than hard-coded display totals.

## Context and approved plan

- Human explicitly excluded PR #31/student workspace.
- Human approved the implementation plan with `PLAN_APPROVED`.
- Landing page was inspected read-only as the design source of truth.
- UIUX Pro Max was loaded and applied before implementation and during the second UX pass.
- No database access was required because the current class snapshot, lesson plan and report APIs provide the authoritative engine boundary.

## AI contributions

- Audited routes, teacher repositories, shared contracts, fixtures, engine outputs, deployment configuration and active work.
- Extracted landing design tokens and adapted them to a denser teacher application.
- Built a typed presentation model with deterministic Vietnamese display names and derived readiness/group metrics.
- Expanded the teacher shell and implemented Today, Classes, Preparation, Insights, Students, Teaching Mode, After Class, Interventions and Resources.
- Preserved the existing versioned lesson-plan editor, approval flow and intervention report.
- Added search, filtering, group drill-down, student drawer, notes, demo session state, reset confirmation, teaching progression and resource actions.
- Added route, interaction, failure-state and data-consistency tests.
- Authored the complete demo script and data map.

## Human decisions

- Accepted: base from `origin/dev`; PR target `dev`.
- Accepted: focus only on Teacher Workspace and ignore PR #31/student workspace.
- Accepted: rich Vietnamese synthetic presentation data backed by real engine snapshot calculations.
- Accepted: proceed without database access unless a missing backend contract made it necessary.
- Modified/rejected: none recorded during implementation.

## Files changed

- `apps/web/src/App.tsx`
- `apps/web/src/App.test.tsx`
- `apps/web/src/features/teacher/TeacherShell.tsx`
- `apps/web/src/features/teacher/product/TeacherProductWorkspace.tsx`
- `apps/web/src/features/teacher/product/TeacherProductWorkspace.test.tsx`
- `apps/web/src/features/teacher/product/teacher-demo-model.ts`
- `apps/web/src/features/teacher/product/teacher-demo-model.test.ts`
- `apps/web/src/features/teacher/product/teacher-product.css`
- `docs/TEACHER_WORKSPACE_DEMO_SCRIPT.md`
- `docs/TEACHER_WORKSPACE_DEMO_DATA_MAP.md`
- `ai-logs/sessions/teacher-workspace-product-demo.md`

Landing and student feature source files were not changed.

## Verification record

| Command                                        | Result                                                                                            |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `CI=true pnpm --filter @ailearn/web test`      | PASS — 14 files, 79 tests after initial expected-test update                                      |
| `CI=true pnpm --filter @ailearn/web typecheck` | PASS                                                                                              |
| `git diff --check`                             | PASS at bounded checkpoints                                                                       |
| UIUX Pro Max UX/style searches                 | PASS — table overflow, announced errors, loading feedback, contrast/focus and drill-down reviewed |
| `CI=true pnpm --filter @ailearn/web format:check` | PASS |
| `CI=true pnpm --filter @ailearn/web lint` | PASS |
| `CI=true pnpm --filter @ailearn/web typecheck` | PASS |
| `CI=true pnpm --filter @ailearn/schemas typecheck` | PASS |
| `CI=true pnpm --filter @ailearn/web test` | PASS — 14 files, 95 tests |
| `CI=true pnpm --filter @ailearn/web build` | PASS |
| `git diff --check` | PASS |
| Production bundle search | PASS — no `localhost:8000`, root fixture path, seed path or fixture JSON import |
| Local production Preview route probes | PASS — `/` and all 12 teacher routes returned HTTP 200, including deep links |

## Independent review

- First code review: `CHANGES_REQUIRED`. It identified demo outcomes inferred from snapshot fields, a missing plan approval gate, inert actions, generic errors, focus gaps, and contract/test gaps.
- First UIUX Pro Max review: `CHANGES_REQUIRED`. It additionally identified mobile navigation density, disconnected workflow chrome, table semantics, hard-coded summaries, and incomplete workflow transitions.
- Second/final code review: `CHANGES_REQUIRED` with one HIGH and three MEDIUM findings. The final correction added explicit independent exit-ticket evidence and evidence-calculated outcomes; persisted preparation and teaching observations; derived Today copy from plan decision; and reconciled teacher overrides into the effective student/group view.
- Second/final UIUX Pro Max review: `CHANGES_REQUIRED` with no BLOCKER. The final correction also added a visible Teaching → After Class completion state, truthful browser-only reset semantics, Vietnamese intervention labels, complete intervention rows/headings, and a 901–1324px rail-safe layout.
- No third review cycle was run, respecting the two-cycle limit. The post-review correction is covered by 95 passing tests, typecheck, lint, format, production build, bundle inspection and direct-route probes.
- Browser automation and screenshot capture were unavailable. No browser-only visual claim is recorded; responsive behavior was evaluated from CSS breakpoints, DOM interaction tests and production route probes.

## Risks and limitations

- Detailed evidence, outcomes and improvement paths are typed deterministic demo records because the current snapshot API does not expose all source events/outcomes in one teacher payload. All related displayed aggregates are derived from those shared records; they are explicitly demo data, not production observations.
- Authoritative readiness, confidence, group membership, priorities and plan version come from the repository/API contract and are not replaced by fixture fallback.
- Demo interaction state is session-level; production persistence/audit for notes, overrides and resource attachments needs an explicit future backend scope.
- Vercel and Railway dashboards were not inspected; Preview behavior and repository-visible configuration are the available deployment evidence.
- Student workspace, auth, migrations and infrastructure are outside scope and were not changed.
