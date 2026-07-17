# @ailearn/schemas / ailearn-schemas

Shared V1 product contracts for AiLearn.

## Freeze policy

After VAI-11 merge:

- Additive optional fields may be added later.
- Renaming, removing, or changing the meaning/type of a field requires a V2
  contract or an explicitly approved migration.

## Contents

- `json/` — JSON Schema drafts (cross-language contract artifacts)
- `src/` — TypeScript types
- `src/ailearn_schemas/` — Pydantic models

Fixtures that must validate against these schemas live in `data/fixtures/`.
