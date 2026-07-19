# VAI-41 — Name the diagnostic core (PACE) and state the RLHF learning loop

- **Date:** 2026-07-19
- **Human owner:** Hải Nguyễn Hồng
- **AI tool / model:** Claude Code (Opus 4.8)
- **Linear issue:** [VAI-41](https://linear.app/vaic-workspace/issue/VAI-41/refresh-teacher-and-student-dashboard-frontend) — homepage technology thread (follow-up in the same series as #29 and #39)
- **Branch:** `vai-41-pace-rlhf-diagnostic-core`
- **Base branch:** `dev`
- **Pull request:** _draft — see PR link once opened_

## Objective and context

The "Diagnostic Intelligence" engine card on the landing page described the
mechanics (mastery, confidence, root-cause rules) but the pipeline had no name,
and the page said nothing about how the system improves over time. The owner
asked to put **PACE** and **RLHF** into that card.

Constraint carried over from the previous session and honoured here:
**frontend-only — no core-engine code.** No package under `packages/` was touched.

## What changed

Presentation-only additions inside the engine-01 card of
`apps/web/src/features/landing/LandingPage.tsx`:

1. `paceStages` — **PACE (Pedagogical Alignment from Classroom Evidence)**, four
   stages that name the pipeline already rendered directly above it
   (`diagnosticFlow`): Pedagogical → Alignment → Classroom → Evidence.
2. `rlhfLoop` — **RLHF (Reinforcement Learning from Human Feedback)** as a
   five-step loop: AI đề xuất → Giáo viên quyết định → Cặp ưu tiên → Hàm thưởng R
   → Chính sách π.
3. `rlhfSignalTiers` — signal tiering the owner specified: teacher **primary**,
   student **secondary**, parent **optional**.
4. A guardrail line: the reward learns only from professional decisions and
   verified transfer outcomes, never from clicks; prerequisite relationships and
   curriculum standards stay owned by the curriculum data and are not writable by
   RLHF (`CLAUDE.md` §10, §22).

Supporting CSS in `landing.css` (`.landing-ai-pace*`, `.landing-ai-rlhf*`, plus
responsive rules at the existing 980px / 680px breakpoints). Test coverage added
in `LandingPage.test.tsx`.

## Accuracy of the claims

PACE is a **name for behaviour that already ships** — the four stages map onto
the deterministic pipeline in `packages/diagnostic` that the same card already
documents, so it introduces no new claim.

RLHF does **not** exist in this repository. A search across `docs/`, all remote
branches, and the master spec found no reward/RL design; the spec specifies only
"Bayesian Knowledge Tracing hoặc mô hình mastery đơn giản có hiệu chỉnh".
It is therefore labelled on the page as **"Lộ trình sau MVP — tín hiệu đang được
thu"**, and the copy states plainly that what exists today is the *signal*
(teacher approve/edit/override audit log + verified transfer outcomes), with
reward-model training in a later phase. A test asserts that this status label is
present, so the roadmap framing cannot be dropped by accident.

## AI contributions

- Drafted the PACE stage copy, the RLHF loop copy, the signal tiers and the
  guardrail line.
- Added the JSX, CSS and test assertions.

## Human decisions

- **Accepted:** placing both blocks inside the Diagnostic Intelligence card;
  teacher-primary / student-secondary / parent-optional tiering.
- **Modified:** widened the RLHF intro from 62ch to 104ch after visual review —
  the paragraph was wrapping into a narrow column with empty space beside it.

## Not changed

- No engine, API, contract or curriculum behaviour.
- An unrelated offline-sync demo prototype explored earlier in the same session
  was dropped at the owner's request and is not part of this branch.

## Files changed

- `apps/web/src/features/landing/LandingPage.tsx`
- `apps/web/src/features/landing/landing.css`
- `apps/web/src/features/landing/LandingPage.test.tsx`
- `ai-logs/sessions/VAI-41-pace-rlhf-diagnostic-core.md` (this log)

## Commands and results

| Check | Command | Result |
|---|---|---|
| Format | `node node_modules/prettier/bin/prettier.cjs --check "src/**/*.{ts,tsx,css}"` | PASS |
| Lint | `node node_modules/eslint/bin/eslint.js src` | PASS |
| Type-check | `node node_modules/typescript/bin/tsc -b` | PASS |
| Tests | `node node_modules/vitest/vitest.mjs run` | PASS (95/95, 14 files) |
| Build | `pnpm build` | NOT RUN — see below |
| Manual check | Rendered at `localhost:5173`, screenshotted the block in place | PASS |

> `pnpm` is broken locally (corepack `ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING`), so
> the workspace binaries were invoked directly from `apps/web/node_modules`.
> Commands were run from `apps/web`. The production build was therefore not run
> locally; CI covers it.

## Remaining risks and limitations

- Copy is Vietnamese and hard-coded, matching the rest of the landing page.
- RLHF remains a roadmap claim. If the AI team's design lands with different
  mechanics (different reward shape, different signal set), this copy must be
  revised to match rather than the other way round.
- Content-only change; no runtime behaviour is affected.
