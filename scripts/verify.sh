#!/usr/bin/env sh
set -eu

# Keep pnpm deterministic when verification runs outside an interactive terminal.
export CI="${CI:-true}"

pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build

uv run --project apps/api ruff format --check apps/api
uv run --project apps/api ruff check apps/api
uv run --project apps/api mypy apps/api/src
uv run --project apps/api pytest apps/api/tests
uv build --project apps/api
