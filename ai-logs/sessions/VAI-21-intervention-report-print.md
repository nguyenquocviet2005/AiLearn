# VAI-21 — intervention report and printable teacher fallback

- Date: 2026-07-18
- Human owner: haiptd05
- AI tool: Codex
- Branch: `VAI-21-intervention-report-print`
- Baseline: `fe77783c8e68326895338c11ab05306840bb2823`
- Pull request: pending

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

## Files and verification

- API: `ailearn_api.routes.reports`, fixture loading, router registration, and endpoint tests.
- Web: teacher report/print features, typed report repository, routing/navigation, styles, and tests.
- Documentation: API surface, architecture boundary, and README route list.
- PASS: web Prettier check, ESLint, TypeScript typecheck, 36 Vitest tests, and Vite production build.
- PASS: Ruff format/lint, repository CI-scope mypy, 142 Python tests with 2 unchanged JSON-Schema
  skips, and the API source/wheel build.
- PASS: `python3 validate.py` and `git diff --check`.

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

## Risks and limitations

The report is intentionally sourced from synthetic fixture data until VAI-20 connects persisted
outcomes. The production Vercel dashboard and live URL require project-owner access and will remain
a manual verification item; this change does not mutate provider configuration. Browser print
preview and physical output are also manual checks because this session has no interactive browser
print dialog. The print fallback uses only HTML/CSS and existing API payloads, with no external
media or new dependency.
