# VAI-12: Create Teacher Workspace Using Fixtures

## Session Metadata

- Date: 2026-07-18
- Human owner: haiptd05
- AI tool: Codex
- Linear issue: VAI-12
- Branch: `VAI-12-create-teacher-workspace-using-fixtures`
- Worktree: `/Users/haipham/Documents/AiLearn` (primary working tree)
- Pull request: Not created

## Objective

Create a fixture-only teacher workspace in the existing React SPA. It must
render the frozen VAI-11 `ClassSnapshotV1` and `TeacherLessonPlanV1` contracts
without a real backend, while preserving an adapter boundary for future HTTP
integration.

## Approved Decisions

- Use VAI-11 merged `origin/main` commit `508e44c` as the baseline.
- Add the existing internal `@ailearn/schemas` workspace dependency to the web
  package. No external dependency was added.
- Use dependency-free pathname routing for `/teacher` and
  `/teacher/lesson-plan`.
- Keep the lesson-plan view read-only. Editing, approval, policy generation,
  backend integration, database changes, and AI behavior remain out of scope.

## Approved Plan

- Add a fixture-backed repository interface using frozen VAI-11 contracts.
- Provide dependency-free `/teacher` and `/teacher/lesson-plan` routes.
- Render fixture evidence only; defer teacher edits, policy generation, and live
  API integration to their assigned follow-up issues.

## Contributions

- Added a fixture-backed `TeacherWorkspaceRepository` interface.
- Added evidence-focused class overview, root-cause distribution, and lesson-plan views.
- Added UI tests for fixture rendering, no backend request, repository
  substitution, and route navigation.
- Preserved the existing platform-status landing page at `/`.

## Files Changed

- `apps/web/package.json`
- `apps/web/tsconfig.app.json`
- `apps/web/src/App.tsx`
- `apps/web/src/features/teacher/TeacherWorkspace.tsx`
- `apps/web/src/features/teacher/TeacherWorkspace.test.tsx`
- `apps/web/src/index.css`
- `apps/web/src/lib/adapters/teacher-fixtures.ts`
- `pnpm-lock.yaml`

## Verification

| Command or check | Result |
| --- | --- |
| `pnpm --filter @ailearn/web typecheck` | PASS |
| `CI=true pnpm install --frozen-lockfile` | PASS |
| `pnpm --filter @ailearn/web test` | PASS, 6 tests |
| `pnpm --filter @ailearn/web build` | PASS |
| `pnpm --filter @ailearn/web format:check` | PASS |
| `pnpm --filter @ailearn/web lint` | PASS |
| `./scripts/verify.sh` | PASS; 6 web tests and 28 API/schema tests |
| Local Vite `/teacher` | PASS, HTTP 200 |
| Local Vite `/teacher/lesson-plan` | PASS, HTTP 200 |
| `git diff --check` | PASS |

## Limitations

- Manual browser visual review remains required.
- The repository adapter intentionally uses only synthetic VAI-11 fixture data.
- Teacher edits, approval, and publishing are deferred to VAI-19.

## Human Decisions

- Accepted: internal workspace-schema dependency and dependency-free routing.
- Required next: independent review and human review before merge.

## Independent Review Follow-up

- Accepted: exclude null root-cause IDs from the root-cause distribution.
- Accepted: make the injected repository test use the schema-validated VAI-11 fixture.
- Accepted: record the worktree and approved-plan summary in this log.
- Verification: focused web test and final `./scripts/verify.sh` both PASS after
  the corrections.
- Accepted: load only the fixture required by the selected teacher view; an
  unavailable unused resource must not block that route.
- Added regression coverage for overview rendering when the lesson-plan method
  rejects, and lesson-plan rendering when the snapshot method rejects.
- Verification: frozen dependency install, web format, lint, type-check, test,
  build, and final `./scripts/verify.sh` all PASS after the route-isolation fix.
