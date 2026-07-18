import type {
  EvidenceEventV1,
  Representation,
  StepKind,
  StudentDiagnosticProfileV1,
  StudentImprovementPathV1,
} from "@ailearn/schemas";

/**
 * Transient diagnostics-session / remediation HTTP shapes.
 *
 * These are session-scoped API request/response shapes, not persisted V1 product
 * contracts, so they live here rather than in @ailearn/schemas (which is reserved
 * for the frozen, persisted contracts).
 */

export interface ItemOptionPublic {
  label: string;
}

export interface AssessmentItemPublic {
  item_id: string;
  skill_ids: string[];
  form: string;
  stem: string;
  options: ItemOptionPublic[];
}

export interface StartSessionResponse {
  session_id: string;
  student_id: string;
  lesson_id: string;
  target_skill_id: string;
  items: AssessmentItemPublic[];
}

export interface SubmitResponseResponse {
  evidence_event: EvidenceEventV1;
  remaining_item_ids: string[];
  session_complete: boolean;
}

/**
 * Content for the current remediation step. The answer key is deliberately
 * absent: checkpoints are graded on the server (see `AttemptGrading`).
 */
export interface RemediationContent {
  template_id: string;
  title: string;
  body: string;
  checkpoint_question: string;
  /** True when a typed answer is auto-graded; false means student self-report. */
  is_gradable: boolean;
  representation: Representation;
  source: "template" | "template+llm" | "generic_fallback";
}

export interface AttemptGrading {
  /** True when the server graded a typed answer, false for self-report. */
  graded: boolean;
  is_correct: boolean;
}

export interface RemediationResponse {
  path: StudentImprovementPathV1;
  current_step_kind: StepKind;
  is_complete: boolean;
  transfer_outcome: boolean | null;
  escalation_reason: string | null;
  content: RemediationContent;
  grading?: AttemptGrading | null;
  exit_ticket?: ExitTicket;
}

/** Why the engine chose this discriminating follow-up question. */
export interface ProbeContext {
  focus_skill_ids: string[];
  reason_codes: string[];
  readiness_status: string;
}

export interface StartProbeResponse extends StartSessionResponse {
  probe: ProbeContext;
}

export type ProgressState =
  "sufficient_secure" | "sufficient_gap" | "emerging" | "insufficient";

export interface SkillProgress {
  skill_id: string;
  skill_name: string;
  level: number;
  attempts: number;
  correct: number;
  state: ProgressState;
  is_target: boolean;
}

export interface StudentProgressResponse {
  schema_version: "1";
  student_id: string;
  lesson_id: string;
  target_skill_id: string;
  total_attempts: number;
  skills_practiced: number;
  skills_with_sufficient_evidence: number;
  practice_attempts: number;
  skills: SkillProgress[];
}

export interface ExitTicket {
  id: string;
  question: string;
  options: string[];
}

export type ExitTicketOutcomeKind =
  "transfer_passed" | "teacher_escalation" | "diagnosis_reclassified";

export interface ExitTicketOutcome {
  kind: ExitTicketOutcomeKind;
  recorded_at: string;
  message: string;
  reclassified_profile: StudentDiagnosticProfileV1 | null;
}

export interface ExitTicketResponse {
  outcome: ExitTicketOutcome;
  remediation: RemediationResponse;
}

export interface DemoPersonaSummary {
  id: string;
  label: string;
  student_id: string;
  display_name: string;
}

export interface DemoResetResponse {
  persona: DemoPersonaSummary & { profile: StudentDiagnosticProfileV1 };
}
