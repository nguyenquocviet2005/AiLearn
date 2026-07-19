import type {
  RemediationState,
  StudentDiagnosticProfileV1,
} from "@ailearn/schemas";

import type { StudentRepository } from "@/lib/adapters/student-repository";
import type {
  DemoPersonaSummary,
  DemoResetResponse,
  ExitTicketResponse,
  RemediationContent,
  RemediationResponse,
  StartSessionResponse,
  SubmitResponseResponse,
} from "@/lib/adapters/student-types";

import {
  findPersonaById,
  findPersonaByStudentId,
  MOCK_LESSON_ID,
  MOCK_PERSONAS,
  type MockPersonaScript,
  type ScriptedStep,
} from "./mock-personas";

/**
 * In-memory `StudentRepository` for the `/student-preview` design-review
 * route. No `fetch`, no backend — every method resolves synchronously
 * against the scripted personas in `mock-personas.ts`. Grading still
 * happens "server-side" here (the caller never supplies `is_correct` for a
 * gradable step and has it trusted), matching the real contract's shape so
 * this module is a drop-in swap point once a real backend exists.
 */

interface MockSession {
  persona: MockPersonaScript;
  stepIndex: number;
  consecutiveFailures: number;
  state: RemediationState;
  escalationReason: string | null;
  completed: Set<string>;
}

const sessions = new Map<string, MockSession>();

function nowIso(): string {
  return new Date().toISOString();
}

function contentFor(step: ScriptedStep): RemediationContent {
  return {
    template_id: step.id,
    title: step.title,
    body: step.body,
    checkpoint_question: step.checkpointQuestion,
    is_gradable: step.isGradable,
    representation: step.representation,
    source: "template",
  };
}

function gradeStep(step: ScriptedStep, response: string): boolean {
  const normalized = response.trim().toLowerCase();
  return step.acceptedAnswers.some(
    (accepted) => accepted.trim().toLowerCase() === normalized,
  );
}

function buildResponse(
  session: MockSession,
  lastAttemptCorrect?: boolean,
): RemediationResponse {
  const { persona, stepIndex } = session;
  const isComplete = stepIndex >= persona.steps.length;
  const currentStep = persona.steps[Math.min(stepIndex, persona.steps.length - 1)];

  const response: RemediationResponse = {
    path: {
      schema_version: "1",
      id: `mock_path_${persona.studentId}`,
      student_id: persona.studentId,
      target_skill_id: persona.resolvedProfile.target_skill_id,
      current_state: session.state,
      representation: currentStep.representation,
      steps: persona.steps.map((step) => ({
        id: step.id,
        kind: step.kind,
        state: step.state,
        completed: session.completed.has(step.id),
      })),
      updated_at: nowIso(),
      root_cause_skill_id: persona.resolvedProfile.root_causes[0]?.skill_id ?? null,
    },
    current_step_kind: currentStep.kind,
    is_complete: isComplete,
    transfer_outcome: null,
    escalation_reason: session.escalationReason,
    content: contentFor(currentStep),
  };
  if (isComplete) {
    response.exit_ticket = persona.exitTicket;
  }
  if (lastAttemptCorrect !== undefined) {
    response.last_attempt_correct = lastAttemptCorrect;
  }
  return response;
}

function confirmationResponse(persona: MockPersonaScript): RemediationResponse {
  const placeholder = persona.steps[0];
  return {
    path: {
      schema_version: "1",
      id: `mock_path_${persona.studentId}`,
      student_id: persona.studentId,
      target_skill_id: persona.initialProfile.target_skill_id,
      current_state: "CONFIRMATION",
      representation: placeholder.representation,
      steps: [],
      updated_at: nowIso(),
      root_cause_skill_id: null,
    },
    current_step_kind: placeholder.kind,
    is_complete: false,
    transfer_outcome: null,
    escalation_reason: null,
    content: contentFor(placeholder),
  };
}

function personaSummary(persona: MockPersonaScript): DemoPersonaSummary {
  return {
    id: persona.id,
    label: persona.label,
    student_id: persona.studentId,
    display_name: persona.displayName,
  };
}

function getOrCreateSession(persona: MockPersonaScript): MockSession {
  let session = sessions.get(persona.studentId);
  if (!session) {
    session = {
      persona,
      stepIndex: 0,
      consecutiveFailures: 0,
      state: "REPAIR",
      escalationReason: null,
      completed: new Set(),
    };
    sessions.set(persona.studentId, session);
  }
  return session;
}

export const mockStudentRepository: StudentRepository = {
  async startReadinessSession(
    studentId: string,
    lessonId: string,
  ): Promise<StartSessionResponse> {
    const persona =
      findPersonaByStudentId(studentId) ?? MOCK_PERSONAS[0];
    return {
      session_id: `mock_readiness_${persona.studentId}`,
      student_id: persona.studentId,
      lesson_id: lessonId || MOCK_LESSON_ID,
      target_skill_id: persona.initialProfile.target_skill_id,
      items: persona.readinessItems,
    };
  },

  async startProbe(
    studentId: string,
    lessonId: string,
  ): Promise<StartSessionResponse> {
    const persona = findPersonaByStudentId(studentId);
    const item = persona?.probeItem ?? MOCK_PERSONAS[0].readinessItems[0];
    return {
      session_id: `mock_probe_${studentId}`,
      student_id: studentId,
      lesson_id: lessonId || MOCK_LESSON_ID,
      target_skill_id: persona?.initialProfile.target_skill_id ?? "",
      items: [item],
      reason: "targets_primary_hypothesis",
    };
  },

  async submitReadinessResponse(
    sessionId: string,
    itemId: string,
    responseLabel: string,
    confidence: number | null,
  ): Promise<SubmitResponseResponse> {
    return {
      evidence_event: {
        schema_version: "1",
        id: `mock_ev_${sessionId}_${itemId}`,
        student_id: sessionId,
        session_id: sessionId,
        skill_id: "unknown",
        item_id: itemId,
        is_correct: false,
        recorded_at: nowIso(),
        response_label: responseLabel,
        confidence,
      },
      remaining_item_ids: [],
      session_complete: true,
    };
  },

  async getDiagnosticProfile(
    studentId: string,
  ): Promise<StudentDiagnosticProfileV1> {
    const persona = findPersonaByStudentId(studentId) ?? MOCK_PERSONAS[0];
    const session = sessions.get(persona.studentId);
    return session ? persona.resolvedProfile : persona.initialProfile;
  },

  async startRemediationSession(
    profile: StudentDiagnosticProfileV1,
  ): Promise<RemediationResponse> {
    const persona = findPersonaByStudentId(profile.student_id) ?? MOCK_PERSONAS[0];
    if (profile.readiness_status === "abstained" && !sessions.has(persona.studentId)) {
      return confirmationResponse(persona);
    }
    const session = getOrCreateSession(persona);
    return buildResponse(session);
  },

  async submitRemediationAttempt(
    studentId: string,
    stepId: string,
    _attemptId: string,
    response: string | null,
    isCorrect: boolean | null,
  ): Promise<RemediationResponse> {
    const persona = findPersonaByStudentId(studentId) ?? MOCK_PERSONAS[0];
    const session = getOrCreateSession(persona);
    const step = persona.steps.find((candidate) => candidate.id === stepId) ??
      persona.steps[session.stepIndex];

    // The server always decides correctness for gradable steps; a client
    // verdict is never trusted, mirroring the real contract.
    const correct = step.isGradable
      ? gradeStep(step, response ?? "")
      : (isCorrect ?? false);

    if (correct) {
      session.consecutiveFailures = 0;
      session.completed.add(step.id);
      session.stepIndex += 1;
    } else {
      session.consecutiveFailures += 1;
      if (persona.escalatesOnRepeatedFailure && session.consecutiveFailures >= 2) {
        session.state = "TEACHER_ESCALATION";
        session.escalationReason = "esc_repeated_failure";
      }
    }

    return buildResponse(session, correct);
  },

  async confirmEvidence(studentId: string): Promise<RemediationResponse> {
    const persona = findPersonaByStudentId(studentId) ?? MOCK_PERSONAS[0];
    const session = getOrCreateSession(persona);
    return buildResponse(session);
  },

  async submitExitTicket(
    studentId: string,
    ticketId: string,
    responseLabel: string,
  ): Promise<ExitTicketResponse> {
    const persona = findPersonaByStudentId(studentId) ?? MOCK_PERSONAS[0];
    const session = getOrCreateSession(persona);
    const recordedAt = nowIso();

    if (responseLabel === persona.exitTicketCorrectLabel) {
      return {
        outcome: {
          kind: "transfer_passed",
          recorded_at: recordedAt,
          message: "Em đã áp dụng được kiến thức vào một tình huống mới.",
          reclassified_profile: null,
        },
        remediation: buildResponse(session),
      };
    }

    session.state = "TEACHER_ESCALATION";
    session.escalationReason = "esc_exit_ticket";
    return {
      outcome: {
        kind: "teacher_escalation",
        recorded_at: recordedAt,
        message: "Cô sẽ cùng em xem lại bước này ở buổi học tiếp theo.",
        reclassified_profile: null,
      },
      remediation: buildResponse(session),
    };
  },

  async listDemoPersonas(): Promise<DemoPersonaSummary[]> {
    return MOCK_PERSONAS.map(personaSummary);
  },

  async resetDemo(personaId: string): Promise<DemoResetResponse> {
    const persona = findPersonaById(personaId) ?? MOCK_PERSONAS[0];
    sessions.delete(persona.studentId);
    return {
      persona: { ...personaSummary(persona), profile: persona.initialProfile },
    };
  },
};
