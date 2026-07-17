export const SCHEMA_VERSION_V1 = "1" as const;

export type SchemaVersionV1 = typeof SCHEMA_VERSION_V1;

export type ReadinessStatus = "ready" | "needs_support" | "abstained";

export type LessonPlanStatus = "draft" | "edited" | "approved";

export type RemediationState =
  | "CONFIRMATION"
  | "REPAIR"
  | "PRACTICE"
  | "TRANSFER"
  | "TEACHER_ESCALATION";

export type StepKind =
  | "worked_example"
  | "guided_problem"
  | "independent_problem"
  | "near_transfer"
  | "result";

export type Representation = "text" | "table" | "diagram";

export type OutcomeKind =
  | "passed_transfer"
  | "still_struggling"
  | "root_cause_reclassified"
  | "incomplete"
  | "teacher_escalation";

export interface EvidenceEventV1 {
  schema_version: SchemaVersionV1;
  id: string;
  student_id: string;
  session_id: string;
  skill_id: string;
  item_id: string;
  is_correct: boolean;
  recorded_at: string;
  lesson_id?: string | null;
  response_label?: string | null;
}

export interface RootCauseHypothesis {
  skill_id: string;
  rank: number;
  supporting_evidence_ids: string[];
  contradicting_evidence_ids: string[];
}

export interface StudentDiagnosticProfileV1 {
  schema_version: SchemaVersionV1;
  student_id: string;
  lesson_id: string;
  target_skill_id: string;
  readiness_status: ReadinessStatus;
  confidence: number;
  root_causes: RootCauseHypothesis[];
  generated_at: string;
}

export interface SnapshotStudent {
  student_id: string;
  readiness_status: ReadinessStatus;
  confidence: number;
  primary_root_cause_skill_id: string | null;
}

export interface SnapshotGroup {
  id: string;
  intervention_need: string;
  student_ids: string[];
  rationale: string;
}

export interface TeachingPriority {
  skill_id: string;
  rank: number;
  rationale: string;
}

export interface ClassSnapshotV1 {
  schema_version: SchemaVersionV1;
  class_id: string;
  lesson_id: string;
  generated_at: string;
  students: SnapshotStudent[];
  unknown_student_ids: string[];
  groups: SnapshotGroup[];
  teaching_priorities: TeachingPriority[];
}

export interface LessonActivity {
  id: string;
  title: string;
  duration_minutes: number;
  root_cause_skill_id: string;
  skill_id: string;
  expected_evidence: string;
  rationale: string;
}

export interface TeacherLessonPlanV1 {
  schema_version: SchemaVersionV1;
  id: string;
  class_id: string;
  lesson_id: string;
  status: LessonPlanStatus;
  total_duration_minutes: number;
  activities: LessonActivity[];
  generated_at: string;
}

export interface ImprovementStep {
  id: string;
  kind: StepKind;
  state: RemediationState;
  completed: boolean;
}

export interface StudentImprovementPathV1 {
  schema_version: SchemaVersionV1;
  id: string;
  student_id: string;
  target_skill_id: string;
  current_state: RemediationState;
  representation: Representation;
  steps: ImprovementStep[];
  updated_at: string;
  root_cause_skill_id?: string | null;
}

export interface OutcomeCounts {
  passed_transfer: number;
  still_struggling: number;
  root_cause_reclassified: number;
  incomplete: number;
  teacher_escalation: number;
}

export interface StudentOutcome {
  student_id: string;
  outcome: OutcomeKind;
  evidence_ids: string[];
}

export interface RemainingGap {
  skill_id: string;
  student_ids: string[];
}

export interface InterventionReportV1 {
  schema_version: SchemaVersionV1;
  id: string;
  class_id: string;
  lesson_id: string;
  generated_at: string;
  outcome_counts: OutcomeCounts;
  student_outcomes: StudentOutcome[];
  remaining_gaps: RemainingGap[];
  next_lesson_focus: string;
  printable_lesson_plan_id: string;
}
