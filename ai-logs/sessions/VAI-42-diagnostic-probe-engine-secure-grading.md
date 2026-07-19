# VAI-42: Real diagnostic probe engine + secure server-side checkpoint grading

## Session

- Date: 2026-07-18
- Human owner: Việt Nguyễn Quốc
- AI tool/model: Claude Code (Sonnet 5)
- Linear issue: VAI-42
- Branch: `vai-42-diagnostic-probe-engine-secure-grading` (off `origin/dev`)
- Pull request: (to be opened)

## Objective

The user asked to branch from `dev` and improve the student flow and the underlying AI
engine, strictly per `docs/AILEARN_SYSTEM_UX_BLUEPRINT.md`. The locally checked-out branch
(`vai-18-complete-student-readiness-and-remediation-experience`) turned out to be stale —
`dev` had diverged far ahead (VAI-19 through VAI-41 merged) with a different student-screen
layout. Auditing `dev` directly (`git show dev:...`, no checkout) surfaced two concrete,
still-live gaps against the blueprint:

1. **Blueprint §9.3 "Câu hỏi phân biệt" was faked.** When diagnosis abstains, the student
   flow restarted a full 5–7 item readiness session and only rendered `items[0]`
   (`total` hard-coded to `1`), silently discarding the rest. No engine existed to select a
   single discriminating item.
2. **The checkpoint answer key leaked to the client, and the server trusted the client's own
   grading.** `routes/remediation.py::_content_payload()` serialized `checkpoint_answer`
   straight into the JSON response; `RemediationPath.tsx` graded client-side and sent its own
   verdict as `is_correct: bool`, which the server accepted unconditionally.

## Approved plan

Full plan at `.claude/plans/checkout-a-new-branch-mighty-minsky.md` (this session's plan
file). Scope was narrowed by explicit user choice: fix the probe engine and secure grading
now; leave VAI-33 (student progress/help screens) untouched. Per AGENTS.md's issue-approval
gate, a new Linear issue (VAI-42) was drafted and shown to the user for approval — including
a milestone choice (Milestone 1, since these are correctness fixes to already-shipped M1
behavior, not new platform polish) — before creation.

## AI contributions

**Backend — probe engine** (`packages/diagnostic/probe.py`, new):
- `select_probe_item(events, curriculum, items) -> ProbeSelection | None` — deterministic
  single-item selection among unanswered items, with reason codes
  `targets_primary_hypothesis` (retest the ambiguous skill), `isolates_competing_hypothesis`
  (an item whose wrong-answer option maps to the same misconception as the primary skill),
  `covers_unobserved_skill`, and a `next_unanswered_item` fallback. Tie-broken by reason
  priority, then skill level, then item id. Returns `None` once every item is answered.
- `POST /api/v1/diagnostics/probe` (`routes/diagnostics.py`): fetches the student's real
  evidence, calls `select_probe_item`, builds a genuine **one-item** session via the existing
  `create_session`/`new_session` + durable-store branch (same pattern as `/diagnostics/start`),
  and returns the existing `StartSessionResponse` shape plus an optional `reason` field. 404
  when no evidence exists yet, 409 (`probe_exhausted`) when every item is already answered.

**Backend — secure server-side grading** (`packages/content`, `apps/api`):
- `packages/content/src/ailearn_content/grading.py` (new): normalized string/bare-number
  comparison — never an LLM call, per the blueprint's deterministic-core rule.
- `Template` gains `accepted_answers` (curated per template in
  `intervention-templates.json`, falling back to the old `checkpoint_answer` if uncurated);
  `Content` drops `checkpoint_answer` entirely and gains `is_gradable: bool`.
  `ContentGenerator.grade(template_id, response) -> bool` grades without ever exposing the
  accepted answers to the caller.
- `routes/remediation.py::submit_attempt`: recomputes the content shown for the current step
  (same inputs `_content_payload` uses) *before* advancing. If `is_gradable`, grades
  `req.response` server-side and **ignores any client-sent `is_correct`**; otherwise requires
  `req.is_correct` (legitimate self-report for non-gradable steps). Adds
  `last_attempt_correct` to the attempt response.

**Frontend** (`apps/web`):
- `student-repository.ts`: new `startProbe()`; `submitRemediationAttempt()` now sends
  `{ response }` or `{ is_correct }` instead of always `is_correct`. `queue.ts`/`sync.ts`
  updated to carry both fields through the offline write queue.
- `StudentWorkspace.tsx`: both call sites that faked the probe by calling
  `startReadinessSession()` again now call `startProbe()`.
- `RemediationPath.tsx`: deleted the client-side `normalize()`/string-compare grading
  entirely; `hasGradableCheckpoint` now reads the server's `content.is_gradable`; shows the
  server's `last_attempt_correct` verdict via a new `checkpointVerdictCopy()` in `copy.ts`.

**Tests**: `tests/unit/diagnostic/test_probe.py`, `apps/api/tests/test_diagnostics_probe.py`,
`tests/unit/content/test_grading.py`, extensions to `tests/unit/content/test_generator.py`,
`apps/api/tests/test_remediation.py`, `apps/api/tests/test_durable_routes.py`, and updates to
`apps/web`'s `sync.test.ts`, `queue.test.ts`, `StudentWorkspace.test.tsx` for the new payload
shapes.

## Bugs found while writing tests (not part of the original plan)

- `packages/content/_select()`'s scoring can pick a template regardless of skill match once
  representation+state+kind alone reach the `>= 4` threshold (e.g. `tpl_practice_equal_ratios_text`
  for an unrelated root-cause skill at the `independent_problem` step). Pre-existing on `dev`,
  not introduced by this change; worked around in tests (submit whatever that template's real
  accepted answer is) rather than changing `_select()`'s threshold, which is out of this
  issue's scope.
- `apps/api/.env` (gitignored, not committed) holds real Supabase credentials, so any test that
  doesn't explicitly force `Settings(supabase_url=None, supabase_secret_key=None)` hits the
  live network. In this sandbox that live network call is intermittently flaky (503s), causing
  a handful of pre-existing tests (`test_confirm_evidence_sufficient_moves_to_repair`,
  `test_exit_ticket_records_passing_transfer_idempotently`, others) to fail nondeterministically
  **independent of any change in this branch** — confirmed by stashing this branch's diff and
  re-running the same tests against unmodified `dev`. Added `_configure()` to every new test in
  this session so they're deterministic; did not touch the pre-existing flaky tests (out of
  scope for VAI-42).

## Human decisions

- Scope: probe engine + secure grading now; VAI-33 (progress/help screens) explicitly deferred.
- Linear: draft-then-approve a new issue (VAI-42) rather than silently creating one or skipping
  Linear; milestone confirmed as Milestone 1 (correctness fix to shipped M1 behavior).
- No other architecture-sensitive decisions arose — the two API additions (new probe endpoint,
  additive `reason`/`is_gradable`/`last_attempt_correct` fields) are additive to `apps/api`'s
  internal models, not the shared `packages/schemas` V1 contracts, so no cross-team contract PR
  was needed per the blueprint's Milestone-1 integration rule.

## Files changed

Backend: `packages/diagnostic/src/ailearn_diagnostic/probe.py` (new), `__init__.py`;
`packages/content/src/ailearn_content/grading.py` (new), `generator.py`;
`packages/content/intervention-templates.json`; `apps/api/src/ailearn_api/routes/diagnostics.py`,
`routes/remediation.py`, `models/diagnostic_session.py`.
Frontend: `student-repository.ts`, `student-types.ts`, `offline/queue.ts`, `offline/sync.ts`,
`StudentWorkspace.tsx`, `RemediationPath.tsx`, `copy.ts`.
Tests: `tests/unit/diagnostic/test_probe.py` (new), `tests/unit/content/test_grading.py` (new),
`tests/unit/content/test_generator.py`, `apps/api/tests/test_diagnostics_probe.py` (new),
`apps/api/tests/test_remediation.py`, `apps/api/tests/test_durable_routes.py`,
`apps/web/src/lib/offline/{sync,queue}.test.ts`, `StudentWorkspace.test.tsx`.

## Commands and results

| Command | Result |
|---|---|
| `uv run --project apps/api pytest tests/unit/diagnostic tests/unit/content apps/api/tests -q` (with `SUPABASE_URL=`/`SUPABASE_SECRET_KEY=` forced empty, to avoid the pre-existing live-network flakiness described above) | PASS (148) |
| `pnpm --filter @ailearn/web test -- --run` | PASS (66, 12 files) |
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS |
| `uv run --project apps/api ruff check apps/api packages/diagnostic packages/content tests/unit` | PASS |
| `uv run --project apps/api ruff format --check ...` (files touched by this branch) | PASS (2 pre-existing unformatted files elsewhere on `dev`, unrelated, left untouched) |
| `uv run --project apps/api mypy apps/api/src packages/diagnostic/src packages/content/src` | PASS (43 files) |
| Manual, live: started real `uvicorn` + `vite` dev servers against the project's actual (real, gitignored) Supabase instance; drove `/api/v1/diagnostics/start` → answered 3/5 items → `POST /api/v1/diagnostics/probe` | Returned exactly **1** item (`item_inv_prop_04`, reason `covers_unobserved_skill`), not a restarted session |
| Manual, live: `POST /api/v1/remediation/sessions` for a `skill_distinguish_direct_inverse` profile → inspected the raw JSON | `content.is_gradable: true` present; **no** `checkpoint_answer`/`accepted_answers` key anywhere in the body |
| Manual, live: `POST /api/v1/remediation/attempts` with a **wrong** `response` and a client-injected `is_correct: true` | Server returned `last_attempt_correct: false` and did not advance the step — proves the client's claim is ignored |
| Manual, live: same endpoint with the **correct** `response` | Server returned `last_attempt_correct: true` and advanced to `guided_problem` |
| `./scripts/verify.sh` | BLOCKED at its first step (`prettier --check .`) by a pre-existing, gitignored, untracked local artifact (`apps/web/.vercel/project.json`, predates this session, not part of this diff) — not something this branch should touch. Ran every other constituent check individually instead (all below), plus `pnpm --filter @ailearn/web build` (PASS, 57 modules) and `uv build --project apps/api` (PASS, sdist+wheel) |

## Remaining risks and limitations

- `accepted_answers` curation in `intervention-templates.json` is a manual judgment call per
  template; some existing `checkpoint_answer` values are full derivations rather than short
  answers a student would plausibly type. Curated short forms for all 6 templates but flagged
  this as inherently approximate, not exhaustive of every valid phrasing.
- The `probe_exhausted` (409) path has no dedicated frontend UI — it falls through to the
  existing generic error-state message. No new UX was designed for it, per the plan's stated
  minimal scope.
- The pre-existing `_select()` skill-match quirk and the `apps/api/.env`-driven test flakiness
  (both described above) were discovered but intentionally left unfixed — out of scope for this
  issue. Flagging both explicitly for a future cleanup issue.
- Did not touch VAI-33 (student progress/help screens), demo-mode in-memory evidence storage,
  or anything beyond the two engine gaps — by explicit user scope choice.

## Follow-up (2026-07-19): deploy probe_exhausted UX

**Symptom:** After readiness on shared demo students, FE showed English "Every assessment item has already been answered." + Thử lại.

**Cause:** Diagnosis CONFIRMATION → `POST /diagnostics/probe` → `select_probe_item` returned None when every bank item was already in evidence → API 409 `probe_exhausted` → FE `describeError` echoed raw English detail.

**Fix:** Prefer unanswered items; if exhausted, reuse least-recently-answered (`reuse_least_recent`) instead of 409. FE maps legacy 409 to Vietnamese copy. Tests updated; 503 probe test now hermetic via `_configure`.
