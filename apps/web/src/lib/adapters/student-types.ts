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
  /** Why this item was chosen. Only populated by /diagnostics/probe. */
  reason?: string | null;
}

export interface SubmitResponseResponse {
  evidence_event: EvidenceEventV1;
  remaining_item_ids: string[];
  session_complete: boolean;
}

export interface RemediationContent {
  template_id: string;
  title: string;
  body: string;
  checkpoint_question: string;
  /** Whether this checkpoint is graded server-side from a typed `response`. */
  is_gradable: boolean;
  representation: Representation;
  source: "template" | "template+llm" | "generic_fallback";
}

export interface RemediationResponse {
  path: StudentImprovementPathV1;
  current_step_kind: StepKind;
  is_complete: boolean;
  transfer_outcome: boolean | null;
  escalation_reason: string | null;
  content: RemediationContent;
  exit_ticket?: ExitTicket;
  /** The server's verdict on the attempt just submitted. Only present on attempt responses. */
  last_attempt_correct?: boolean;
}

export type RemediationAttemptOutcome =
  | { kind: "response"; response: string }
  | { kind: "self_report"; isCorrect: boolean };

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
