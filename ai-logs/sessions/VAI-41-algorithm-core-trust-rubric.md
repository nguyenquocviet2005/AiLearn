# VAI-41 — Strengthen verifiable algorithm-core story on the landing page

- **Date:** 2026-07-19
- **Human owner:** Hải Nguyễn Hồng
- **AI tool / model:** Claude Code (Opus 4.8)
- **Linear issue:** [VAI-41](https://linear.app/vaic-workspace/issue/VAI-41/refresh-teacher-and-student-dashboard-frontend) — homepage technology thread (Done; this is a follow-up PR in the same series as #29)
- **Branch:** `vai-41-algorithm-core-trust-rubric`
- **Base branch:** `dev`
- **Pull request:** _draft — see PR link once opened_

## Objective and context

The "Lõi thuật toán có thể kiểm chứng" (verifiable algorithm core) section of the
public landing page under-sold the real engineering behind AiLearn and did not map
onto the competition scoring rubric (barem, 6 criteria / 100 points). The goal was to
surface, **frontend-only**, five defensible technical properties of the core and to
show explicitly how the core touches each judging criterion.

Explicit constraint from the owner: **do not modify core-engine code — only edit the
frontend homepage descriptions.** No package under `packages/` was touched.

## What changed

Presentation-only additions inside the existing algorithm-core section of
`apps/web/src/features/landing/LandingPage.tsx`:

1. `coreTrustProperties` — five trust properties, each grounded in existing engine
   behavior:
   - Runs well on low-resource machines (closed-form Beta-Bernoulli on CPU, no GPU/LLM
     required for a diagnosis).
   - Multi-layer protection / abstention ("knows when to stay silent").
   - Calibrated confidence (`C = 0.2 + 0.03N + 0.4·S/(S+K)`).
   - 100% reproducible trace (deterministic, evidence IDs on every hypothesis).
   - Continual online loop (Bayesian update per evidence + closed evidence loop).
2. `rubricAlignment` — six rows mapping the core to the barem criteria
   (20/20/20/15/15/10) with concrete supporting evidence per criterion.

Supporting CSS in `landing.css` (`.landing-ai-properties`, `.landing-ai-rubric`, and
responsive rules at 980px / 680px). Test coverage updated in `LandingPage.test.tsx`.

Claims were cross-checked against the actual engine source (read-only):
`packages/diagnostic/.../engine.py` confidence formula and abstention policy,
`mastery.py` Beta-Bernoulli update, `root_cause.py` deterministic ranker,
`planning/models.py` priority score, `remediation/state_machine.py`.

## AI contributions

- Drafted the five trust properties and the rubric-alignment copy, grounded in engine code.
- Added the JSX blocks, CSS, and test assertions.

## Human decisions

- **Accepted:** frontend-only approach; honest framing of continual learning as an
  online Bayesian update + closed evidence loop (not offline batch retraining).
- **Modified:** removed the "Sáu tiêu chí, tổng 100 điểm" heading; reframed "no GPU" as
  a positive ("runs well on low-resource machines, GPU not required") rather than a lack.

## Files changed

- `apps/web/src/features/landing/LandingPage.tsx`
- `apps/web/src/features/landing/landing.css`
- `apps/web/src/features/landing/LandingPage.test.tsx`
- `ai-logs/sessions/VAI-41-algorithm-core-trust-rubric.md` (this log)

## Commands and results

| Check | Command | Result |
|---|---|---|
| Tests | `node node_modules/vitest/vitest.mjs run src/features/landing/LandingPage.test.tsx` | PASS (2/2) |
| Type-check | `node node_modules/typescript/bin/tsc -b` | PASS |
| Lint | `node node_modules/eslint/bin/eslint.js src/features/landing/*.tsx` | PASS |
| Format | `node node_modules/prettier/bin/prettier.cjs --check src/features/landing/*` | PASS |

> `pnpm` is broken locally (corepack `ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING`), so the
> workspace binaries were invoked directly from `apps/web/node_modules`. Commands were
> run from `apps/web`.

## Remaining risks and limitations

- Copy is Vietnamese, hard-coded (matches the rest of the landing page).
- No production `pnpm build` / `./scripts/verify.sh` run because of the local corepack
  breakage; typecheck + targeted tests + lint + format cover the changed surface.
- Content-only change; no engine, API, or contract behavior is affected.
