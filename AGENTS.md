# AGENTS.md

## Purpose

This file defines how human developers and AI coding agents work in the **AiLearn** repository.

It is the shared operational source of truth for:

- Planning, implementation, and verification.
- Linear and GitHub workflow.
- Agent permissions and human approval gates.
- Architecture, testing, privacy, and completion rules.

These instructions apply to Claude Code, Codex, and other coding agents used by the team.

---

## 1. Product Context

**AiLearn** is an adaptive AI tutoring platform for Vietnamese general education.

The system must:

1. Diagnose the root cause of a student's knowledge gap.
2. Trace prerequisite concepts across grade levels.
3. Generate and continuously adapt a personalized practice path.
4. Help teachers group students by need and prioritize interventions.
5. Detect class-wide gaps and suggest concepts for re-teaching.
6. Align content with Vietnam's 2018 General Education Program.
7. Support core workflows offline or under low bandwidth.
8. Protect student and teacher data.

### Product principles

- Teacher-centered, not teacher-replacing.
- Root-cause diagnosis, not only right/wrong scoring.
- Evidence-based recommendations, not opaque AI conclusions.
- Curriculum-aligned and age-appropriate content.
- Offline-first or graceful low-connectivity behavior.
- Student privacy and safety by default.
- Multi-agent components only when responsibilities are genuinely distinct.

---

## 2. Sources of Truth

Use this priority order:

1. Current approved Linear issue.
2. Explicit human decisions recorded in Linear or the pull request.
3. This `AGENTS.md`.
4. Accepted ADRs in `docs/decisions/`.
5. `docs/ARCHITECTURE.md` and `docs/API_CONTRACTS.md`.
6. Existing source code and tests.
7. AI-generated plans and logs.

Existing code is not automatically correct. Report conflicts between code and approved requirements before changing behavior.

As the repository grows, maintain:

```text
docs/PROJECT_BRIEF.md
docs/ARCHITECTURE.md
docs/API_CONTRACTS.md
docs/DEMO_PLAN.md
docs/decisions/
ai-logs/
CONTRIBUTING.md
README.md
```

Do not duplicate detailed rules across many files. Keep this file as the operational map and move deep technical detail into focused documents.

---

## 3. Work Management Model

Recommended mapping:

```text
1 Linear issue
= 1 accountable human owner
= 1 branch
= 1 worktree for non-trivial work
= 1 primary implementation session
= 1 pull request
```

Linear hierarchy:

```text
Project
└── Milestone
    └── Issue
        └── Sub-issue
```

Use a sub-issue only when the child work needs its own owner, status, dependency, or pull request. Use a checklist for small implementation steps.

---

## 4. Definition of Ready

An issue may enter `Ready` only when it has:

- Clear objective.
- Context.
- In-scope behavior.
- Explicit non-goals.
- Testable acceptance criteria.
- Verification requirements.
- Known dependencies.
- Accountable human owner.
- No unresolved implementation-blocking decision.

AI must not begin implementation when critical information is missing.

Use one of these outcomes:

```text
READY_FOR_PLANNING
NEEDS_CLARIFICATION
BLOCKED
```

---

## 5. Required Workflow

For every non-trivial issue:

```text
Linear issue
→ Repository discovery
→ Planning
→ Human approval when required
→ Implementation
→ Local verification
→ Independent verification
→ Draft pull request
→ CI
→ Human review
→ Merge
→ Linear completion
```

Do not jump directly from a vague request to broad code changes.

---

## 6. Planning Rules

Before editing code, read:

- The Linear issue.
- This file.
- Relevant product and architecture documents.
- Relevant contracts and ADRs.
- Existing tests.
- Relevant entry points and at least one similar implementation when available.

The initial file list is a starting point, not an exhaustive boundary. Search for callers, interfaces, tests, documentation, and related contracts.

### Planning restrictions

During the first planning pass:

- Do not modify production code.
- Do not change the Linear issue.
- Do not invent missing acceptance criteria.
- Do not add a dependency.
- Do not silently choose a major architecture change.

### Required planning output

1. Objective and acceptance criteria.
2. Current behavior and code flow.
3. Existing patterns and conventions.
4. Recommended approach.
5. Exact files likely to change.
6. Data flow and error flow.
7. Ordered implementation tasks.
8. Verification plan.
9. Risks and limitations.
10. Human decisions required.

Use file paths and symbol names where possible.

### Planning stopping conditions

```text
PLAN_APPROVED
PLAN_NEEDS_REVISION
ISSUE_NEEDS_CLARIFICATION
BLOCKED_BY_DEPENDENCY
```

Human approval is required before architecture-sensitive, security-sensitive, cross-module, destructive, or public-contract changes.

---

## 7. Implementation Rules

Implement one bounded task at a time:

1. Read relevant source and tests.
2. Confirm expected observable behavior.
3. Add or update tests where appropriate.
4. Implement the smallest coherent change.
5. Run targeted verification.
6. Inspect the diff.
7. Record progress and remaining work.

Every task should specify:

```text
Goal
Files
Expected behavior
Verification command
Stopping condition
```

### Required behavior

- Stay within approved scope.
- Follow existing architecture and conventions.
- Prefer existing abstractions.
- Add tests for new observable behavior.
- Keep changes small and reviewable.
- Update affected documentation.
- Report failures accurately.

### Prohibited behavior

- Do not add dependencies without approval.
- Do not change public contracts without approval.
- Do not remove or weaken tests to make checks pass.
- Do not hide failures or skipped checks.
- Do not perform unrelated refactoring.
- Do not continue when the approved plan is invalid.

### Implementation stopping conditions

```text
TASK_PASSING
TASK_NEEDS_REVIEW
REQUIREMENT_AMBIGUOUS
BLOCKED_BY_ARCHITECTURE
BLOCKED_BY_DEPENDENCY
SCOPE_CHANGE_REQUIRED
```

---

## 8. Verification Rules

Final verification must use a fresh perspective. The implementation agent's self-review is not the only quality gate.

The verifier must inspect:

- Original Linear issue and acceptance criteria.
- Relevant repository rules and architecture documents.
- Complete diff against the target branch.
- Changed source and test files.
- Verification commands and outputs.
- AI collaboration log.
- CI configuration when relevant.

### Verification responsibilities

1. Map each acceptance criterion to evidence.
2. Identify missing or partial behavior.
3. Detect scope creep.
4. Check architecture and contract compliance.
5. Review correctness, edge cases, and failure handling.
6. Review privacy and security implications.
7. Review test quality.
8. Check documentation accuracy.
9. Confirm reported commands were actually run.
10. Record remaining limitations.

Use these severities:

```text
BLOCKER
HIGH
MEDIUM
LOW
```

Each finding must include severity, confidence, file and line, evidence, impact, and a concrete correction.

The first review pass should report findings before modifying files.

### Verification outcomes

```text
PASS
PASS_WITH_NOTES
CHANGES_REQUIRED
BLOCKER_FOUND
VERIFICATION_INCOMPLETE
```

---

## 9. Standard Commands

Update this section as soon as the technology stack is selected.

```bash
# Install
pnpm install --frozen-lockfile
uv sync --project apps/api --locked --all-groups

# Run locally
uv run --project apps/api uvicorn ailearn_api.main:app --app-dir apps/api/src --reload
pnpm --filter @ailearn/web dev

# Format
pnpm format
uv run --project apps/api ruff format apps/api

# Lint
pnpm lint
uv run --project apps/api ruff check apps/api

# Type-check
pnpm typecheck
uv run --project apps/api mypy apps/api/src

# Targeted tests
pnpm --filter @ailearn/web test
uv run --project apps/api pytest apps/api/tests

# Full tests
./scripts/verify.sh

# Build
pnpm build
uv build --project apps/api

# Preferred future full verification command
./scripts/verify.sh
```

Never claim a command passed unless it was executed.

Use:

```text
PASS
FAIL
NOT RUN
BLOCKED
```

When a check is not run, state the reason.

### Deployment

- **Vercel** (`apps/web`): project root directory = `apps/web`. Config: `apps/web/vercel.json`
  (SPA fallback rewrite). Self-contained — no dependency on other workspace packages.
- **Railway** (`apps/api`): project root directory = `.` (repo root), **not** `apps/api`. Required
  because `apps/api` depends on `packages/schemas` and `packages/diagnostic` via editable path
  installs, so the Docker build context must span the whole repo to resolve them. Config:
  repo-root `railway.toml` (`dockerfilePath = "apps/api/Dockerfile"`), which `COPY`s
  `apps/api`, `packages/schemas`, and `packages/diagnostic` explicitly. See
  `docs/decisions/0002-relocate-diagnostic-package-and-fix-railway-build.md`.

---

## 10. Architecture Principles

Keep these concerns separate:

- Presentation and UI.
- API or transport.
- Application orchestration.
- Domain logic.
- AI and recommendation logic.
- Curriculum and knowledge graph data.
- Persistence and infrastructure.
- Offline synchronization.

### Adaptive-learning rules

Critical educational behavior must be explainable and testable.

Prefer deterministic or rule-backed logic for:

- Curriculum concept identifiers.
- Prerequisite relationships.
- Mastery thresholds.
- Grade-level mappings.
- Progress calculations.
- Teacher prioritization criteria.
- Offline conflict resolution.

LLMs may assist with explanation generation, practice-item variation, feedback wording, summarization, and teacher-facing insights. LLM output must not be the only source of truth for curriculum relationships or student mastery.

### Teacher dashboard

Recommendations should include evidence such as concepts involved, recent attempts, mastery change, confidence, prioritization reason, and suggested intervention.

Avoid unsupported labels such as “weak student.”

### Offline and low bandwidth

Core workflows should minimize network calls, cache stable curriculum data, queue writes where appropriate, define conflict behavior, and degrade gracefully when AI services are unavailable.

### Multi-agent design

Add a separate agent only when it has:

- Distinct responsibility.
- Clear input and output contract.
- A reason for independent context or tools.
- Measurable verification.
- Defined failure and fallback behavior.

---

## 11. Education Safety and Data Protection

Student data is sensitive.

Never expose or commit:

- Student names or identifiers unless required and approved.
- Parent contact information.
- Authentication tokens.
- API keys or passwords.
- `.env` contents.
- Raw private classroom data.
- Unredacted production logs.

Use synthetic or anonymized data in tests, demos, prompts, and AI logs.

AI-generated student content must be age-appropriate, curriculum-relevant, non-discriminatory, reviewable, and clearly separated from authoritative teacher decisions.

Do not make high-impact educational decisions solely from one model response.

---

## 12. Testing Rules

Every behavior change requires appropriate verification.

Use the smallest sufficient combination of:

- Unit tests.
- Integration tests.
- Contract tests.
- End-to-end tests.
- Curriculum mapping tests.
- Offline synchronization tests.
- Manual verification.

Where relevant, test:

- Root-cause gap traversal.
- Prerequisite chains across grade levels.
- Cyclic or invalid knowledge graphs.
- Mastery updates.
- Personalized path generation.
- Teacher grouping and prioritization.
- Class-wide gap detection.
- Offline read/write and synchronization conflicts.
- AI timeout and fallback behavior.
- Privacy and authorization boundaries.

Test observable behavior rather than implementation details. Do not rely only on mocked success paths.

---

## 13. Git Workflow

### Integration branch policy

`dev` is the mandatory integration branch for routine development.

Before starting any code or documentation change:

1. Fetch and prune the remote branches.
2. Confirm the worktree is clean.
3. Refresh from the current `origin/dev` baseline.
4. Create a new issue or change branch from `origin/dev` before editing.

Use this worktree-safe sequence:

```bash
git fetch origin --prune
git switch -c <linear-id>-<short-description> origin/dev
```

This sequence is the linked-worktree equivalent of pulling `dev`: it uses the current remote
`dev` commit without requiring the shared local `dev` branch to be checked out. Never develop or
commit directly on `dev`, and never start routine work from `main` or an unmerged feature branch.

Routine pull requests must target `dev`, not `main`. `main` is release-only. Opening a release or
emergency hotfix pull request to `main` requires an explicit human instruction for that specific
pull request.

### Branches

```text
<linear-id>-<short-description>
```

Example:

```text
ail-42-diagnose-prerequisite-gap
```

### Worktrees

Use a separate worktree for non-trivial parallel work:

```bash
git fetch origin

git worktree add \
  ../worktrees/ail-42-diagnose-prerequisite-gap \
  -b ail-42-diagnose-prerequisite-gap \
  origin/dev
```

### Commits

```text
type(scope): description [LINEAR-ID]
```

Examples:

```text
feat(diagnosis): trace prerequisite gaps [AIL-42]
test(diagnosis): cover cyclic prerequisite graph [AIL-42]
docs(api): document diagnosis response [AIL-42]
```

### AI must not

- Push directly to `dev`.
- Push directly to `main`.
- Base routine development on `main`.
- Force-push protected branches.
- Rewrite shared history.
- Delete protected branches.
- Bypass required checks.
- Merge security-sensitive changes without human approval.

---

## 14. Pull Request Workflow

AI may create a **Draft Pull Request** after:

- Planned implementation is complete.
- Targeted verification has run.
- The diff has been inspected.
- Documentation is updated.
- The AI collaboration log exists.

The base branch for every routine pull request is `dev`. Do not target `main` unless a human has
explicitly requested a release or emergency hotfix pull request to `main`.

The PR must include:

- Linear issue reference.
- Objective and summary.
- Explicit non-changes.
- Verification commands and results.
- AI assistance disclosure.
- Risks and limitations.
- Rollback or disable strategy where relevant.

Use `Fixes AIL-42` only when the PR fully completes the issue. Use `Part of AIL-42` when it is one part of larger work.

AI must not finally approve its own PR.

---

## 15. Linear Permission Policy

### ALLOW — AI may perform automatically

- Read assigned issues, projects, milestones, and comments.
- Summarize requirements and identify missing information.
- Add factual progress comments.
- Record commands and verification results.
- Attach branch, PR, preview, and AI-log references.
- Move an assigned `Ready` issue to `In Progress` when work begins.
- Create or update a Draft Pull Request.
- Draft proposals for labels, dependencies, and follow-up work.

### ASK — human approval required

- Change objective, scope, non-goals, or acceptance criteria.
- Change priority, assignee, reviewer, estimate, milestone, cycle, project, or due date.
- Create unrelated issues or sub-issues.
- Mark work `Blocked`, `Duplicate`, `Canceled`, or `Won't Fix`.
- Mark a PR ready for final review.
- Mark an issue `Done` without a merged linked PR.
- Change project-level plans or milestones.

### DENY — AI must never perform

- Delete issues, projects, milestones, comments, or audit evidence.
- Conceal errors or failed verification.
- Claim human approval that did not occur.
- Approve its own implementation as final reviewer.
- Modify workspace members, roles, permissions, API keys, or integrations.
- Change team-wide workflows or automations.
- Expose secrets or sensitive student data.
- Bulk-edit unrelated issues.

Issue completion should normally be driven by a merged GitHub PR and Linear automation.

---

## 16. AI Collaboration Log

For every meaningful AI-assisted issue, create:

```text
ai-logs/sessions/<LINEAR-ID>-<short-description>.md
```

Include:

- Date and human owner.
- AI tool and model.
- Linear issue, branch, worktree, and PR.
- Objective and context supplied.
- Planning and implementation prompts.
- Approved plan.
- AI contributions.
- Human decisions: Accepted, Modified, Rejected.
- Files changed.
- Commands and results.
- Remaining risks and limitations.

Never store secrets, sensitive student data, or raw private conversations in AI logs.

---

## 17. Stop and Escalate

Stop and ask for human input when:

- Requirements conflict or are not testable.
- Scope expansion is needed.
- A dependency must be added.
- A public API must change.
- A database migration is destructive.
- Privacy, security, or curriculum alignment is uncertain.
- Required external services are unavailable.
- Verification cannot be completed.
- Repeated attempts produce no measurable progress.

Default bounds:

- Maximum two retries for the same failing approach.
- Maximum one major architectural re-plan without human review.
- Stop when the next action exceeds approved scope.

---

## 18. Definition of Done

An issue is complete only when:

- Objective and acceptance criteria are satisfied.
- No unapproved scope expansion remains.
- Required format, lint, type-check, tests, and build pass.
- Manual, offline, or fallback verification is completed where relevant.
- Documentation is updated.
- AI collaboration log is committed.
- Independent verification has no unresolved blocker.
- Human review is complete.
- Review discussions are resolved.
- PR is merged.
- Linear is updated through the agreed workflow.

Writing code is not equivalent to completing an issue.

---

## 19. Required Completion Report

At the end of a work session, report:

```markdown
## Status
PASS / PASS_WITH_NOTES / CHANGES_REQUIRED / BLOCKED

## Completed
- ...

## Files Changed
- `path/to/file`

## Verification
| Check | Command | Result |
|---|---|---|
| Format | `...` | PASS/FAIL/NOT RUN |
| Lint | `...` | PASS/FAIL/NOT RUN |
| Type-check | `...` | PASS/FAIL/NOT RUN |
| Tests | `...` | PASS/FAIL/NOT RUN |
| Build | `...` | PASS/FAIL/NOT RUN |
| Manual check | `...` | PASS/FAIL/NOT RUN |

## Remaining Limitations
- ...

## Human Decisions Required
- ...

## References
- Linear:
- Branch:
- Pull request:
- AI log:
```

Never represent planned, assumed, or skipped work as completed.

---

## 20. Bounded AI Engineering Loop

For every approved Linear issue, divide implementation into bounded tasks.

Each bounded task must follow:

1. Read relevant requirements, source, contracts, and tests.
2. State the expected observable behavior.
3. Add or update focused tests before or alongside implementation.
4. Implement the smallest coherent change.
5. Run targeted verification.
6. Retry a failing approach no more than two times.
7. Inspect the task diff.
8. Record evidence in the issue AI collaboration log.
9. Continue only when the bounded task passes.

Run full verification only after all bounded tasks pass.

Stop and request human input when:

- requirements are missing or conflicting;
- scope, architecture, public contracts, or dependencies must change;
- a destructive migration or production action is required;
- secrets, personal data, or security boundaries are involved;
- verification cannot be completed;
- the same approach fails twice.

## 21. Task-Specific AI Tooling

Before installing a skill, MCP server, plugin, or agent framework:

- establish that it materially improves the active issue;
- prefer official or reputable sources;
- document required permissions and security risks;
- apply least privilege and read-only access by default;
- obtain human approval before installation;
- pin or record the installed version;
- verify the integration with a bounded test;
- disable or remove tools that are no longer required.

Do not install tools merely to increase the apparent number of AI integrations.

## 22. AI Runtime Guardrails

Any product feature that calls an AI model must define:

- trusted and untrusted input boundaries;
- schema and size validation;
- sensitive-data handling;
- tool allowlists and approval rules;
- structured output validation;
- grounding and confidence behavior;
- timeouts, retry limits, and fallback;
- human override for consequential decisions;
- safe audit metadata;
- evaluation and regression tests.

AI-generated output must not be treated as authoritative without the
validation appropriate to the use case.
