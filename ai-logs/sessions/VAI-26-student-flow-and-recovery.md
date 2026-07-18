# VAI-26 — Student flow and recovery

- Date: 2026-07-18
- Human owner: haiptd05
- AI tool/model: Codex (GPT-5)
- Linear: VAI-26
- Branch: `VAI-26-student-flow-and-recovery`
- Worktree: `/Users/haipham/Documents/AiLearn`
- Pull request: pending
- Baseline: `0b8c9a116837f37fffd6bfbc7ff02d90a8c1792f`
- Integrated origin/main: `90382f8341739ee4c374aa8f47cdad170e327ba6` (VAI-41 dashboard refresh)

## Objective and supplied context

Verify the student flow, offline resume, demo reset, and six seeded personas. The required outcomes
are a working student flow, reload-safe offline progress without duplicate queued responses, reset
for all six personas, and at least three root-cause patterns plus one abstention case. The human also
asked that the required demo data be logically complete and that VAI-23, VAI-24, and VAI-26 remain a
sequential workflow rather than overlapping implementations.

## Approved plan

1. Validate the six persona records and their evidence-backed learning scenarios.
2. Isolate demo-reset verification from configured external storage without deleting durable rows.
3. Persist the selected synthetic learner only when matching cached progress exists.
4. Prove failed queued writes resume once after reload and are not resent after success.
5. Run frontend, API, golden-case, build, and independent review gates.

## AI contributions

- Added fail-fast validation for persona count, identifiers, profile/student alignment, supported
  root causes, abstention, exit-ticket answers, and reclassification alignment.
- Added a persona-local `EvidenceEventV1` artifact and referential validation for evidence id,
  learner, lesson, skill, correctness, and contradiction semantics.
- Added privacy-bounded active-learner persistence containing only a synthetic id, display name, and
  persona id.
- Restored the selected persona and cached remediation path across reloads.
- Adapted recovery behavior and tests to VAI-41's merged student dashboard shell, and retained the
  previous offline state until a replacement demo path starts successfully.
- Added regression coverage for data invariants, isolated transient reset, reload recovery, and
  non-duplicated queue synchronization.
- Recovered writes interrupted in `SYNCING` exactly once per new JavaScript runtime, retaining the
  existing deterministic server idempotency and avoiding Strict Mode duplicate flushes.
- Added the deterministic student recovery preflight to the Checkpoint 2 demo plan.

## Human decisions

- Accepted: generate and validate all data needed for the assigned demo/recovery workflow.
- Accepted: process VAI-26 before technical verification (VAI-24) and the release parent (VAI-23).
- Not used to expand scope: no production database reset, provider dashboard mutation, new
  dependency, public contract change, or unrelated feature work.

## Files changed

- `apps/api/src/ailearn_api/demo_data.py`
- `apps/api/tests/test_demo.py`
- `apps/web/src/features/student/StudentWorkspace.tsx`
- `apps/web/src/features/student/StudentWorkspace.test.tsx`
- `apps/web/src/lib/offline/active-learner.ts`
- `apps/web/src/lib/offline/active-learner.test.ts`
- `apps/web/src/lib/offline/queue.ts`
- `apps/web/src/lib/offline/queue.test.ts`
- `apps/web/src/lib/offline/sync.ts`
- `apps/web/src/lib/offline/sync.test.ts`
- `data/seeds/demo-personas.json`
- `data/seeds/demo-persona-evidence.json`
- `docs/ARCHITECTURE.md`
- `docs/DEMO_PLAN.md`
- `ai-logs/sessions/VAI-26-student-flow-and-recovery.md`

## Verification evidence

- Focused web tests: 26/26 passed.
- Full web tests after integrating VAI-41: 66/66 passed.
- Web Prettier, ESLint, TypeScript, and production build: passed using the existing local binaries.
- Ruff format/lint: passed for the CI surface.
- Mypy: passed for `apps/api/src` and `packages/planning/src`.
- Python CI test surface with Supabase explicitly disabled: 163 passed, 2 skipped.
- API package build: passed.
- Golden evaluation: 4/4 passed, including three diagnosed patterns and one abstention case.
- `git diff --check`: passed.

`pnpm` itself was not used locally because the installed workspace metadata requested a dependency
purge/reinstall in the non-interactive environment. No dependency installation was needed; the same
web format, lint, type-check, test, and build programs were executed directly. GitHub CI remains the
authoritative clean-install verification.

## Remaining risks and limitations

- Browser automation is unavailable in this environment, so final visual, physical-device, and
  browser-network-panel checks remain post-merge manual verification.
- The production bundle contains the development localhost constant as an inactive branch of the
  centralized resolver. Production behavior continues to select the configured Railway URL; this
  issue does not change API-base resolution.
- Demo reset intentionally does not delete durable Supabase sessions or evidence. It starts a new
  selected synthetic profile and clears only transient local/browser state.
- Independent review found one HIGH issue: a refresh during an in-flight request could leave a
  persisted `SYNCING` write permanently skipped. The fix restores it to a retryable failure once per
  new runtime and adds queue/sync regressions. Two MEDIUM findings identified dangling persona
  evidence references and missing reset-to-path coverage for all six personas. The fix adds validated
  synthetic evidence and exercises every reset profile through remediation startup. Reviewer
  cycle 2 found no remaining BLOCKER, HIGH, or MEDIUM issues and concluded PASS_WITH_NOTES. GitHub
  CI is pending.
