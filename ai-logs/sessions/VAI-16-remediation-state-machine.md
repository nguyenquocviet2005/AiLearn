# VAI-16 — Remediation state machine and content fallback

## Approach

Rewrote from scratch after an earlier draft was found to violate the shared contract
and two acceptance criteria. Key decisions:

1. **Enum values are the contract.** `RemediationState`, `StepKind`, `Representation`
   serialize straight into `StudentImprovementPathV1`, so their values match
   `improvement-path.v1.schema.json` exactly (`"CONFIRMATION"`, not `"confirmation"`).
   `tests/unit/remediation/test_schema_contract.py` asserts enum parity against the real
   schema file, so drift fails CI instead of surfacing at integration (VAI-20).

2. **Policy is data, not constants.** Escalation thresholds and representation fallback
   order are read from `ai/content/intervention-templates.json` (VAI-13 seed data) via
   `policy.py`. Prerequisites come from `data/seeds/curriculum.json`. Tuning the
   pedagogy needs no code change.

3. **AC4 is a sequence gate, not a transition table.** A single correct answer moves the
   student one step along `worked_example → guided_problem → independent_problem →
   near_transfer → result`; state follows the step. Repair cannot be completed by being
   right once — an earlier draft transitioned `REPAIR --pass--> PRACTICE` immediately,
   which contradicts AC4.

4. **LLM is decoration.** `ai/remediation` imports nothing from `ai/content` and never
   touches an LLM. `ContentGenerator` resolves a deterministic template first;
   `enrich=True` is opt-in and any exception, timeout, or blank response falls back to
   the template. Tested with `ExplodingLLM`, `SlowTimeoutLLM`, `EmptyLLM`, and a missing
   templates file.

## Verification

```
43 tests: 20 state machine + 10 schema contract + 13 content
```

E2E against the four VAI-13 golden cases, using real seed data:

| Golden case | readiness | → state | representation | content |
|---|---|---|---|---|
| gc_01_foundational_gap | needs_support | REPAIR | text | generic_fallback ⚠️ |
| gc_02_direct_inverse_misconception | needs_support | REPAIR | table | tpl_repair_direct_vs_inverse_table |
| gc_03_language_representation | needs_support | REPAIR | table | tpl_repair_word_problem_table |
| gc_04_insufficient_evidence | abstained | **CONFIRMATION** | text | tpl_repair_computation_steps_text |

All four serialize to schema-valid `StudentImprovementPathV1`.

## Known gaps

* **GC1 has no matching template.** Level-1 skills (`skill_ratio_proportion_basics`,
  `skill_fraction_multiplication`, `skill_direct_proportion`) are not covered by the six
  VAI-13 templates, so foundational-gap students get `generic_fallback`. The flow is
  correct and never crashes, but the content is weak. Suggest adding 2–3 foundation
  templates in VAI-18.
* Session storage is in-memory in `routes/remediation.py`; persistence belongs to VAI-20.
* `esc_abstained_profile` is exposed via `engine.escalate()` but the caller decides when
  to give up on confirmation — that policy is a VAI-18 UX decision.
