# VAI-40: Build public product landing page

## Session

- Date: 2026-07-18
- Human owner: Hai Nguyen Hong
- AI tool: Codex
- Linear issue: VAI-40
- Branch: `honghainguyen2003/vai-40-build-public-product-landing-page`
- Worktree: `/home/h2n/h2n/worktrees/vai-40-build-public-product-landing-page`
- Pull request: https://github.com/nguyenquocviet2005/AiLearn/pull/24

## Objective and context

Build a responsive public landing page that introduces AiLearn and gives visitors clear entry points
to the existing teacher and student experiences. The page must follow the supplied product, UX, and
brand materials while keeping AiLearn as the product name.

## Planning and implementation prompts

- Read VAI-40, repository rules, architecture, current routes, tests, and product documentation.
- Review the supplied master specification, teacher-copilot requirements, UX prototype, and 22-page
  logo deck under the local `mat/` reference directory.
- Preserve the existing `/teacher`, `/teacher/lesson-plan`, and `/student` behavior.
- Use the supplied purple, white, and black identity with the real AiLearn logo and mascot assets.
- Verify focused behavior, accessibility basics, production checks, and responsive rendering.

## Approved plan

The human requested implementation after supplying the source materials and clarified that the
product name remains AiLearn. The implementation keeps the existing lightweight browser routing,
adds a landing feature at `/`, uses browser-optimized derivatives of supplied brand assets, and does
not change backend or product contracts.

## AI contributions

- Synthesized the landing narrative from the teacher-first, evidence-led, offline-ready product rules.
- Implemented the public route, responsive page structure, product preview, and workspace navigation.
- Added focused route and navigation tests.
- Updated HTML metadata and repository documentation.

## Human decisions

- Accepted: Build a dedicated public product landing page assigned through VAI-40.
- Accepted: Use the supplied logo deck and purple, white, and black brand direction.
- Modified: Keep the public product name as AiLearn; treat "Mach Hoc" only as product-flow reference
  material, not the brand name.

## Files changed

- `apps/web/index.html`
- `apps/web/public/brand/ailearn-hero.webp`
- `apps/web/public/brand/ailearn-logo.webp`
- `apps/web/public/brand/ailearn-mascot.webp`
- `apps/web/src/App.tsx`
- `apps/web/src/App.test.tsx`
- `apps/web/src/features/landing/LandingPage.tsx`
- `apps/web/src/features/landing/LandingPage.test.tsx`
- `apps/web/src/features/landing/landing.css`
- `README.md`
- `ai-logs/sessions/VAI-40-build-public-product-landing-page.md`

## Commands and results

- `pnpm install --frozen-lockfile` — PASS; reused the existing pnpm store without lockfile changes.
- `pnpm exec prettier --write ...` from the workspace root — FAIL; Prettier is scoped to the web
  package and was not available from the root command.
- `pnpm --filter @ailearn/web exec prettier --write ...` — PASS.
- `pnpm --filter @ailearn/web lint` — PASS.
- `pnpm --filter @ailearn/web typecheck` — PASS.
- `pnpm --filter @ailearn/web test` — initial FAIL because one navigation test asserted a transient
  loading message after the mocked request had already failed; the assertion was corrected to verify
  the teacher workspace navigation and URL. Final result: PASS, 44 tests.
- `pnpm --filter @ailearn/web build` — PASS.
- Chrome visual checks at 1440x900, 500x844, and emulated 390x844 — PASS; the 390px document had
  matching `clientWidth` and `scrollWidth`, with no page-level horizontal overflow.
- `./scripts/verify.sh` — PASS; format, lint, type-check, 44 web tests, web build, Ruff, mypy, 117 API
  and domain tests, and API package build all completed successfully. Three existing Starlette
  deprecation warnings were reported by the API test suite.

## Remaining risks and limitations

- The supplied VAGRounded display font is embedded as a subset in the PDF and is not distributed as a
  reusable webfont, so the page uses the existing system sans-serif stack.
- Authentication and account onboarding remain outside VAI-40.
