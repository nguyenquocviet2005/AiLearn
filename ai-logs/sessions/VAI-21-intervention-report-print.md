# VAI-21 — intervention report and printable teacher fallback

- Date: 2026-07-18
- Human owner: haiptd05
- AI tool: Codex
- Branch: `VAI-21-intervention-report-print`
- Original baseline: `fe77783c8e68326895338c11ab05306840bb2823`
- Adaptation baseline: `c36ea9641c03470e2861dfa012ba732c3cb50343`
- Pull request: https://github.com/nguyenquocviet2005/AiLearn/pull/19

## Objective and context

Expose the fixed `InterventionReportV1` personas to teachers, make immediate practice success
visibly distinct from independent transfer, and provide a self-contained printable report and
lesson-plan fallback. VAI-16 and VAI-19 were verified on `origin/main` before work began. Live
event aggregation and report persistence remain VAI-20 scope.

## Approved plan and AI contribution

1. Add a validated, read-only report endpoint over the frozen intervention fixture.
2. Add teacher report and print routes with typed HTTP and fixture adapters.
3. Cover seeded outcomes, evidence, error states, print behavior, and navigation with focused tests.
4. Run CI-equivalent verification and an independent read-only review before opening a draft PR.

Codex implemented the endpoint, UI routes, low-bandwidth print stylesheet, tests, and affected
documentation. The human had already approved the sequential issue workflow and bounded routine
planning. No public contract, database migration, dependency, auth policy, provider setting, or
secret was changed.

After the VAI-19 production API-base correction and VAI-22 were merged, Codex preserved the
existing VAI-21 commit and merged current `origin/main` normally into the shared branch. The
adaptation keeps VAI-19's centralized `getApiBaseUrl` resolver, typed repository errors, and
production-safe configuration behavior. VAI-21's report repository now uses that resolver instead
of defining its own localhost fallback, and its report and print surfaces distinguish deployment
configuration, API availability, and application-data errors. Direct-route regression coverage
now includes the VAI-19 and VAI-21 teacher routes.

## Files and verification

- API: `ailearn_api.routes.reports`, fixture loading, router registration, and endpoint tests.
- Web: teacher report/print features, typed report repository, routing/navigation, styles, and tests.
- Documentation: API surface, architecture boundary, and README route list.
- PASS: web Prettier check, ESLint, TypeScript typecheck, 36 Vitest tests, and Vite production build.
- PASS: Ruff format/lint, repository CI-scope mypy, 142 Python tests with 2 unchanged JSON-Schema
  skips, and the API source/wheel build.
- PASS: `python3 validate.py` and `git diff --check`.
- PASS during VAI-19 adaptation: focused TypeScript build and 28 Vitest tests covering the API-base
  resolver, VAI-19 teacher workspace, VAI-21 report/print views, repositories, and direct routing.
- PASS after adaptation: web Prettier, ESLint, TypeScript, 55 Vitest tests, and a production Vite
  build configured with the verified Railway origin. The production bundle contains no
  `localhost:8000`; the source occurrence is the intentional development-only constant. All six
  current routes returned the production SPA shell and asset with HTTP 200 in local preview, with
  route-specific rendering covered by direct-navigation tests.
- PASS after adaptation: Ruff format/lint, API/planning mypy, 153 CI-scope Python tests with two
  unchanged JSON-Schema skips, API source/wheel build, schema validation, and diff checks. A first
  local test run inherited Supabase values from the developer `.env` and failed two tests that
  explicitly require an unconfigured service; rerunning with those settings unset, matching CI,
  passed without code changes or secret inspection.

## Independent review

The first read-only review found one HIGH data-integrity issue: the seeded count claimed two
struggling learners but exposed only one corresponding learner record. The fixture was corrected
and the API test now proves every outcome count equals the records in `student_outcomes`. Two
in-scope MEDIUM findings were also resolved: the print view now fetches the contract-selected
`printable_lesson_plan_id`, rejects a class/lesson/plan mismatch, and keeps the validated report
printable when the lesson-plan request fails. Regression tests cover the identifier, mismatch, and
degraded report-only behavior. The second read-only review returned `PASS_WITH_NOTES` with no
BLOCKER, HIGH, or MEDIUM findings; its one LOW copy-clarity note was also resolved by labeling the
report-only fallback without implying that a lesson plan is present.

The post-VAI-19 adaptation review returned `PASS_WITH_NOTES` with no BLOCKER, HIGH, or MEDIUM
findings. Its print-control LOW finding was accepted: the print action is now rendered only after a
validated report is ready, with loading/error regression coverage. A LOW suggestion to add ad hoc
runtime contract parsing in the web adapter was not adopted because the repository has no existing
browser runtime validator and duplicating `InterventionReportV1` validation would expand contract
architecture; malformed payloads remain a documented limitation for the shared-contract follow-up.

## Risks and limitations

The report is intentionally sourced from synthetic fixture data until VAI-20 connects persisted
outcomes. The production Vercel dashboard and live URL require project-owner access and will remain
a manual verification item; this change does not mutate provider configuration. Browser print
preview and physical output are also manual checks because this session has no interactive browser
print dialog. The print fallback uses only HTML/CSS and existing API payloads, with no external
media or new dependency.
