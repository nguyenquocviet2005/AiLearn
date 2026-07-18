# AiLearn planning domain

`ailearn_planning` turns valid `StudentDiagnosticProfileV1` records into a
`ClassSnapshotV1` and a teacher-reviewable `TeacherLessonPlanV1`.

The package is deterministic and does not call an LLM. Its priority score is visible in every
`TeachingPriority.rationale`:

```text
0.40 × class prevalence
+ 0.25 × downstream curriculum impact
+ 0.20 × current-lesson urgency
+ 0.15 × mean diagnostic confidence
```

Students with no diagnostic profile stay in `unknown_student_ids` and are not placed in an
intervention group. Diagnosed students are grouped by primary intervention need, with ready and
abstained students handled as transfer/extension and confirmation cohorts respectively. The planner
requires class data that yields three to five non-empty actionable cohorts rather than fabricating
groups from a score split.

Public functions:

- `build_class_snapshot(...) -> ClassSnapshotV1`
- `build_lesson_plan(...) -> TeacherLessonPlanV1`

HTTP endpoints, teacher editing/approval, persistence, and live UI wiring remain outside VAI-15.
