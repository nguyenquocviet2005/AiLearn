# VAI-19 — teacher dashboard, editing and approval

- Date: 2026-07-18
- Human owner: haiptd05
- AI tool: Codex
- Branch: `VAI-19-teacher-dashboard-approval`
- Baseline: `6a2f047669182ea1d3efc8e6cc309fd76ad11062`

## Context and decision

VAI-19 requires evidence inspection, teacher group and duration edits, explicit approval or
rejection, immutable edit versions, and a publish gate. The original issue did not define the
versioned API/persistence contract. The human approved option (b): implement that contract and its
persistence only for VAI-19.

## Plan

1. Add the additive `TeacherPlanVersionV1` envelope and an append-only Supabase migration.
2. Add thin class/lesson-plan routes with a validated publish gate and API tests.
3. Replace the fixture-only default teacher adapter with the typed HTTP adapter; retain fixture
   injection for isolated UI tests.
4. Run changed-area checks and independent review before a draft PR.

## Files and verification

- Contracts: `TeacherPlanVersionV1` in Pydantic, TypeScript, and JSON Schema.
- API: class/lesson-plan routes, append-only Supabase adapter, and migration.
- Web: HTTP teacher repository, editable groups/durations, version/decision controls, and UI tests.
- Documentation: API and architecture contract notes.
- PASS: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (30 tests), `pnpm build`.
- PASS: Ruff format/lint, focused mypy, CI-equivalent Python tests (140 passed, 2 known skips),
  `uv build --project apps/api`, `python3 validate.py`, `git diff --check`.

## Independent review

The first read-only review found a first-write FK failure, invalid duration flow, unbounded edit
payload, dirty-decision loss, contract requiredness, and concurrency gaps. The implementation was
updated to remove the synthetic-parent FK, type and bound edit requests, validate exact group
membership, enforce a 1–45 minute UI guard, disable decisions while edits are unsaved, align
requiredness, and require optimistic expected-version values for every mutation. The second review
reported no blocker; its final concurrency HIGH was resolved before the final targeted verification.

## Limitations

The normal Supabase migration release and live Vercel/Railway validation require human/provider
access and are not performed by this session. The synthetic v1 proposal intentionally has no row in
`lesson_plan_versions`; `parent_version_id` is therefore an audit reference, not an enforced foreign
key, until a future seed/migration strategy persists proposals. No secrets or student data are
recorded here.
