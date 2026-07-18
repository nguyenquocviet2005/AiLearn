#!/usr/bin/env sh
set -eu

# Keep pnpm deterministic when verification runs outside an interactive terminal.
export CI="${CI:-true}"

pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build

uv run --project apps/api ruff format --check apps/api packages/planning tests/unit/planning
uv run --project apps/api ruff check apps/api packages/planning tests/unit/planning
uv run --project apps/api mypy apps/api/src packages/planning/src
uv run --project apps/api pytest \
  tests/unit/schemas \
  tests/unit/diagnostic \
  tests/unit/planning \
  apps/api/tests
uv build --project apps/api
