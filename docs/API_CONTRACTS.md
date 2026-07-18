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

Optional: `lesson_id`, `response_label`.

Fixture: `data/fixtures/evidence-event.json`.

### `StudentDiagnosticProfileV1`

Required: `schema_version`, `student_id`, `lesson_id`, `target_skill_id`, `readiness_status`
(`ready` | `needs_support` | `abstained`), `confidence` (0–1), `root_causes[]`, `generated_at`.

When `readiness_status` is `abstained`, `root_causes` may be empty.

Fixture: `data/fixtures/diagnostic-profile.json`.

### Domain diagnostic engine (VAI-14)

Pure Python surface in `packages/diagnostic` (no new HTTP routes in VAI-14):

- `diagnose(events, curriculum, items, *, now=None) -> StudentDiagnosticProfileV1`
- Inputs: `EvidenceEventV1` list + curriculum/items loaded from `data/seeds/`
- Deterministic: same events + fixed `now` → identical profile
- No LLM calls; product Diagnostic HTTP remains VAI-17

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
