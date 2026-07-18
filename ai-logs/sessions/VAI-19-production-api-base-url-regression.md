# VAI-19 production API base URL regression

- Date: 2026-07-18
- Human owner: haiptd05@gmail.com
- AI: Codex
- Linear issue: VAI-19 (merged follow-up regression)
- Branch: `fix/VAI-19-production-api-base-url`
- Baseline: `fe77783c8e68326895338c11ab05306840bb2823`

## Objective and evidence

The merged VAI-19 teacher shell loaded its real HTTP repository from a scattered
`VITE_API_BASE_URL ?? "http://localhost:8000"` expression. A production build without the variable
contained three localhost origins. A direct request reproduced `TypeError: fetch failed` with
`ECONNREFUSED`; `TeacherWorkspace` discarded that exception and rendered a misleading fixture error.

The repository's VAI-10 deployment record identifies
`https://api-production-8a6d.up.railway.app` as the public backend and README requires Vercel to set
`VITE_API_BASE_URL` to the Railway origin.

## Changes

- Centralized API-origin resolution for platform, student, and teacher HTTP clients.
- Kept localhost only for development, honored explicit configuration, and used the established
  Railway origin when production configuration is absent.
- Added typed teacher repository error categories and accurate deployment/API/data messages.
- Removed the production runtime type dependency on the fixture adapter.
- Added resolver and real HTTP repository/UI regression tests for overview, approval, and failures.

## Verification

- Frontend format check: PASS
- Frontend lint: PASS
- Frontend typecheck: PASS
- Frontend tests: PASS (38 tests)
- Frontend production build: PASS
- Production bundle localhost search: PASS (no occurrence)
- Production bundle Railway origin search: PASS
- Production bundle fixture-path search: PASS (no occurrence)
- Production build from Vercel root assumption (`apps/web`): PASS
- `git diff --check`: PASS
- Independent reviewer: PASS_WITH_NOTES; no unresolved findings

## Limitations

- Vercel dashboard variables and the live post-deploy teacher flow were not inspected in this session.
- Web-local test fixtures mirror the shared V1 artifacts; production runtime code and the build no
  longer resolve files outside `apps/web`.
