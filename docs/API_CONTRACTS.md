# API Contracts

## Freeze policy (V1 product contracts)

After VAI-11 merge:

- Additive optional fields may be added later.
- Renaming, removing, or changing the meaning/type of a field requires a V2 contract or an
  explicitly approved migration.

Authoritative artifacts:

- JSON Schema: `packages/schemas/json/`
- Pydantic: `ailearn_schemas`
- TypeScript: `@ailearn/schemas`
- Fixtures: `data/fixtures/`

## Assumptions

- Field sets are minimal and derived from VAI-11/12/14/15/16/21 behavioral requirements only.
- Identifiers are stable opaque strings (for example `stu_demo_01`); fixtures are synthetic and
  anonymized.
- Timestamps are ISO-8601.
- Every product contract includes `schema_version: "1"`.
- Auth/roles remain deferred; evidence endpoints use the server-side Supabase service role only.

## `GET /health`

Returns API liveness without checking external dependencies.

```json
{
  "status": "ok"
}
```

## `GET /api/v1/system-status`

Reads the infrastructure-only `system_status` row through the Supabase Data API.

Success response (`200`):

```json
{
  "status": "ok",
  "database": {
    "status": "operational",
    "checked_at": "2026-07-17T00:00:00Z"
  }
}
```

Unavailable response (`503`):

```json
{
  "detail": {
    "code": "supabase_unavailable",
    "message": "System status is unavailable."
  }
}
```

The endpoint accepts no parameters and exposes no Supabase credentials, raw error details, or product data.

## Shared V1 product contracts

### `EvidenceEventV1`

Required: `schema_version`, `id`, `student_id`, `session_id`, `skill_id`, `item_id`, `is_correct`,
`recorded_at`.

Optional: `lesson_id`, `response_label`, `confidence` (0–1, added in VAI-18 — additive per the
freeze policy). `confidence` is captured from the student's self-reported certainty and persisted,
but does not currently influence mastery/diagnosis scoring in `packages/diagnostic`.

Fixture: `data/fixtures/evidence-event.json`.

### `StudentDiagnosticProfileV1`

Required: `schema_version`, `student_id`, `lesson_id`, `target_skill_id`, `readiness_status`
(`ready` | `needs_support` | `abstained`), `confidence` (0–1), `root_causes[]`, `generated_at`.

When `readiness_status` is `abstained`, `root_causes` may be empty.

Fixture: `data/fixtures/diagnostic-profile.json`.

### Domain diagnostic engine (VAI-14)

Pure Python surface in `packages/diagnostic` (no HTTP or LLM calls in the engine itself):

- `diagnose(events, curriculum, items, *, now=None) -> StudentDiagnosticProfileV1`
- Inputs: `EvidenceEventV1` list + curriculum/items loaded from `data/seeds/`
- Deterministic: same events + fixed `now` → identical profile
- No LLM calls. The product Diagnostic HTTP surface that calls this engine is documented below
  (VAI-17).

### `ClassSnapshotV1`

Required: `schema_version`, `class_id`, `lesson_id`, `generated_at`, `students[]`,
`unknown_student_ids[]`, `groups[]` (3–5), `teaching_priorities[]`.

Each student appears once across `students` and `unknown_student_ids`.

Fixture: `data/fixtures/class-snapshot.json`.

### `TeacherLessonPlanV1`

Required: `schema_version`, `id`, `class_id`, `lesson_id`, `status`
(`draft` | `edited` | `approved`), `total_duration_minutes` (≤ 45), `activities[]`, `generated_at`.

Sum of activity durations equals `total_duration_minutes`.

Fixture: `data/fixtures/lesson-plan.json`.

### `TeacherPlanVersionV1`

Immutable teacher-review envelope around a `ClassSnapshotV1` and `TeacherLessonPlanV1`.
It records the stable plan id, monotonically increasing version, parent version, decision
(`pending` | `approved` | `rejected`), and optional `published_at`. A teacher edit, decision, and
publication each append a version; the AI proposal is never overwritten.

### Domain planning engine (VAI-15)

Pure Python surface in `packages/planning` (no new HTTP routes in VAI-15):

- `build_class_snapshot(...) -> ClassSnapshotV1`
- `build_lesson_plan(...) -> TeacherLessonPlanV1`
- `DeterministicInterventionPolicy` for visible priority scoring and intervention-need grouping

Planning consumes valid `StudentDiagnosticProfileV1` values. A roster member without a profile is
listed only in `unknown_student_ids`. Priority rationale strings expose the weighted prevalence,
downstream-impact, lesson-urgency, and diagnostic-confidence components. Teacher edit/approval and
live UI/API wiring remain deferred to VAI-19 and VAI-20.

### `StudentImprovementPathV1`

Required: `schema_version`, `id`, `student_id`, `target_skill_id`, `current_state`,
`representation`, `steps[]`, `updated_at`.

Optional: `root_cause_skill_id` (required when `current_state` is not `CONFIRMATION`).

Fixture: `data/fixtures/improvement-path.json`.

### `InterventionReportV1`

Required: `schema_version`, `id`, `class_id`, `lesson_id`, `generated_at`, `outcome_counts`,
`student_outcomes[]`, `remaining_gaps[]`, `next_lesson_focus`, `printable_lesson_plan_id`.

Fixture: `data/fixtures/intervention-report.json`.

## Teacher planning endpoints

- `GET /api/v1/classes/{class_id}/snapshot` returns the synthetic demo snapshot used for the
  teacher proposal.
- `GET /api/v1/lesson-plans/{plan_id}` returns the latest persisted `TeacherPlanVersionV1`, or the
  immutable synthetic proposal when no edit version exists.
- `POST /api/v1/lesson-plans/{plan_id}/versions` appends an edited version with a validated snapshot
  and lesson plan.
- `POST /api/v1/lesson-plans/{plan_id}/approve` and `/reject` append the teacher decision.
- `POST /api/v1/lesson-plans/{plan_id}/publish` returns `409 lesson_plan_not_approved` unless the
  latest version is approved; publication itself appends an auditable version with `published_at`.

Teacher-plan versions are stored in Supabase `lesson_plan_versions`. The service-role API is the
only configured database access path while authentication remains deferred.

## `POST /api/v1/evidence-events`

Writes one `EvidenceEventV1` to Supabase `evidence_events`.

Success response (`201`): the stored evidence event.

Unavailable response (`503`):

```json
{
  "detail": {
    "code": "supabase_unavailable",
    "message": "Evidence storage is unavailable."
  }
}
```

## `GET /api/v1/evidence-events/{id}`

Reads one evidence event by id.

Success response (`200`): the stored evidence event.

Not found (`404`):

```json
{
  "detail": {
    "code": "evidence_event_not_found",
    "message": "Evidence event was not found."
  }
}
```

Unavailable response (`503`) uses the same sanitized shape as other Supabase failures.

## `POST /api/v1/diagnostics/start`

Starts a readiness session for one student against the (single, demo) lesson curriculum, using
`build_readiness_session()` from `packages/diagnostic`. Session state is held in an in-memory
store scoped to the running API process — see "Operational behavior" in
`docs/ARCHITECTURE.md`. Returned items never include the answer key (`is_correct`,
`misconception_id` are stripped from each option).

Request:

```json
{
  "student_id": "stu_demo_01",
  "lesson_id": "lesson_g7_inverse_proportion_01"
}
```

Success response (`201`):

```json
{
  "session_id": "sess_stu_demo_01_readiness_1a2b3c4d",
  "student_id": "stu_demo_01",
  "lesson_id": "lesson_g7_inverse_proportion_01",
  "target_skill_id": "skill_word_problem_work_rate",
  "items": [
    {
      "item_id": "item_inv_prop_01",
      "skill_ids": ["skill_ratio_proportion_basics"],
      "form": "Dạng 1.1",
      "stem": "Từ tỉ lệ thức 3/4 = x/12, giá trị của x là:",
      "options": [{ "label": "9" }, { "label": "16" }, { "label": "8" }, { "label": "36" }]
    }
  ]
}
```

Unknown lesson (`404`):

```json
{
  "detail": { "code": "lesson_not_found", "message": "Unknown lesson_id." }
}
```

Readiness session could not be built (`422`):

```json
{
  "detail": {
    "code": "readiness_session_unavailable",
    "message": "Could not build a readiness session for this lesson."
  }
}
```

## `POST /api/v1/diagnostics/{session_id}/responses`

Records one student answer as an `EvidenceEventV1`. Correctness is always derived server-side
from the session's assessment item — the client only sends which option label the student picked,
never `is_correct`. The evidence event id is deterministic (`ev_{session_id}_{item_id}`), so a
retried request for the same session and item is idempotent: it replays the first recorded answer
instead of creating a duplicate or erroring.

Request (`confidence` is optional, 0–1, added in VAI-18):

```json
{
  "item_id": "item_inv_prop_01",
  "response_label": "9",
  "confidence": 0.9
}
```

Success response (`200`):

```json
{
  "evidence_event": {
    "schema_version": "1",
    "id": "ev_sess_stu_demo_01_readiness_1a2b3c4d_item_inv_prop_01",
    "student_id": "stu_demo_01",
    "session_id": "sess_stu_demo_01_readiness_1a2b3c4d",
    "skill_id": "skill_ratio_proportion_basics",
    "item_id": "item_inv_prop_01",
    "is_correct": true,
    "recorded_at": "2026-07-19T10:20:00Z",
    "lesson_id": "lesson_g7_inverse_proportion_01",
    "response_label": "9",
    "confidence": 0.9
  },
  "remaining_item_ids": ["item_inv_prop_02", "item_inv_prop_03"],
  "session_complete": false
}
```

Unknown session or item not in the session (`404`):

```json
{
  "detail": {
    "code": "diagnostic_session_not_found",
    "message": "Diagnostic session was not found."
  }
}
```

Unrecognized option label (`422`):

```json
{
  "detail": {
    "code": "invalid_response_label",
    "message": "response_label does not match any option for this item."
  }
}
```

Unavailable response (`503`) uses the same sanitized shape as other Supabase failures.

## `POST /api/v1/remediation/sessions`

Starts a remediation session from a `StudentDiagnosticProfileV1`, using `RemediationEngine.start()`
from `packages/remediation`. Session state is held in an in-memory store scoped to the running API
process (registered in VAI-18; see "Operational behavior" below — this route existed as code since
VAI-16 but was not wired into the app until VAI-18).

Request:

```json
{
  "profile": {
    "schema_version": "1",
    "student_id": "stu_demo_01",
    "lesson_id": "lesson_g7_inverse_proportion_01",
    "target_skill_id": "skill_word_problem_work_rate",
    "readiness_status": "needs_support",
    "confidence": 0.8,
    "root_causes": [
      { "skill_id": "skill_ratio_proportion_basics", "rank": 1, "supporting_evidence_ids": [], "contradicting_evidence_ids": [] }
    ],
    "generated_at": "2026-07-19T10:50:00Z"
  }
}
```

Success response (`200`):

```json
{
  "path": {
    "schema_version": "1",
    "id": "path_stu_demo_01_skill_word_problem_work_rate",
    "student_id": "stu_demo_01",
    "target_skill_id": "skill_word_problem_work_rate",
    "current_state": "REPAIR",
    "representation": "text",
    "steps": [
      { "id": "step_stu_demo_01_worked_example", "kind": "worked_example", "state": "REPAIR", "completed": false }
    ],
    "updated_at": "2026-07-19T11:00:00Z",
    "root_cause_skill_id": "skill_ratio_proportion_basics"
  },
  "current_step_kind": "worked_example",
  "is_complete": false,
  "escalation_reason": null,
  "content": {
    "template_id": "tpl_1",
    "title": "Ví dụ mẫu",
    "body": "...",
    "checkpoint_question": "...",
    "checkpoint_answer": "...",
    "representation": "text",
    "source": "template"
  }
}
```

`checkpoint_answer` was added in VAI-18 so a caller can grade the checkpoint objectively (it was
previously withheld from the wire response — safe to add because this route had no live caller
before VAI-18 registered it). Invalid profile shape (`422`):

```json
{ "detail": "Invalid profile: ..." }
```

## `POST /api/v1/remediation/attempts`

Records one attempt outcome and advances the path via `RemediationEngine.advance()`.

Request (`attempt_id` added in VAI-18 for idempotency):

```json
{
  "student_id": "stu_demo_01",
  "step_id": "step_stu_demo_01_worked_example",
  "is_correct": true,
  "attempt_id": "att_stu_demo_01_worked_example_1"
}
```

Success response (`200`): same shape as `POST /api/v1/remediation/sessions`. A retried request
with the same `attempt_id` replays the response recorded the first time instead of calling
`advance()` again — `RemediationEngine.advance()` has no idempotency of its own, so this is
enforced at the route layer via a per-student processed-attempt-id map.

Unknown student/session (`404`):

```json
{ "detail": "No session for stu_unknown" }
```

## `POST /api/v1/remediation/confirm`

Resolves `CONFIRMATION` once more evidence is available, via `RemediationEngine.confirm()`. Only
acts while the session is in `CONFIRMATION`; otherwise a no-op (naturally idempotent, no
`attempt_id` needed).

Request:

```json
{ "student_id": "stu_demo_01", "evidence_sufficient": true }
```

Success response (`200`): same shape as `POST /api/v1/remediation/sessions`.

## `GET /api/v1/remediation/sessions/{student_id}`

Reads the current remediation session state. Success response (`200`): same shape as
`POST /api/v1/remediation/sessions`. Unknown student (`404`) uses the same shape as `/attempts`.

## `GET /api/v1/students/{student_id}/diagnostic-profile`

Computes a student's `StudentDiagnosticProfileV1` **live** by fetching that student's recorded
`evidence_events` (optionally filtered by the `lesson_id` query parameter, which defaults to the
single demo lesson) and calling `diagnose()`. No profile is persisted — the engine's evidence
input is always the source of truth.

Success response (`200`): a `StudentDiagnosticProfileV1` (see contract above).

Unknown student (`404`):

```json
{
  "detail": { "code": "student_not_found", "message": "Student was not found." }
}
```

No evidence recorded yet (`404`):

```json
{
  "detail": {
    "code": "diagnostic_profile_not_found",
    "message": "No readiness evidence has been recorded for this student yet."
  }
}
```

Unavailable response (`503`) uses the same sanitized shape as other Supabase failures.
