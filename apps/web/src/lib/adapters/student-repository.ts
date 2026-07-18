import type { StudentDiagnosticProfileV1 } from "@ailearn/schemas";

import { getApiBaseUrl } from "@/lib/api-base-url";

import type {
  DemoPersonaSummary,
  DemoResetResponse,
  ExitTicketResponse,
  RemediationResponse,
  StartSessionResponse,
  SubmitResponseResponse,
} from "./student-types";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export interface StudentRepository {
  startReadinessSession(
    studentId: string,
    lessonId: string,
  ): Promise<StartSessionResponse>;
  submitReadinessResponse(
    sessionId: string,
    itemId: string,
    responseLabel: string,
    confidence: number | null,
  ): Promise<SubmitResponseResponse>;
  getDiagnosticProfile(
    studentId: string,
    lessonId: string,
  ): Promise<StudentDiagnosticProfileV1>;
  startRemediationSession(
    profile: StudentDiagnosticProfileV1,
  ): Promise<RemediationResponse>;
  submitRemediationAttempt(
    studentId: string,
    stepId: string,
    isCorrect: boolean,
    attemptId: string,
  ): Promise<RemediationResponse>;
  confirmEvidence(
    studentId: string,
    evidenceSufficient: boolean,
  ): Promise<RemediationResponse>;
  submitExitTicket(
    studentId: string,
    ticketId: string,
    responseLabel: string,
    submissionId: string,
  ): Promise<ExitTicketResponse>;
  listDemoPersonas(): Promise<DemoPersonaSummary[]>;
  resetDemo(personaId: string): Promise<DemoResetResponse>;
}

interface ErrorDetail {
  detail?: { code?: string; message?: string };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!response.ok) {
    const body: ErrorDetail | null = await response.json().catch(() => null);
    throw new ApiError(
      response.status,
      body?.detail?.code ?? "unknown_error",
      body?.detail?.message ?? "The request failed.",
    );
  }

  return (await response.json()) as T;
}

export const httpStudentRepository: StudentRepository = {
  async startReadinessSession(studentId, lessonId) {
    return request<StartSessionResponse>("/api/v1/diagnostics/start", {
      method: "POST",
      body: JSON.stringify({ student_id: studentId, lesson_id: lessonId }),
    });
  },

  async submitReadinessResponse(sessionId, itemId, responseLabel, confidence) {
    return request<SubmitResponseResponse>(
      `/api/v1/diagnostics/${sessionId}/responses`,
      {
        method: "POST",
        body: JSON.stringify({
          item_id: itemId,
          response_label: responseLabel,
          confidence,
        }),
      },
    );
  },

  async getDiagnosticProfile(studentId, lessonId) {
    return request<StudentDiagnosticProfileV1>(
      `/api/v1/students/${studentId}/diagnostic-profile?lesson_id=${encodeURIComponent(lessonId)}`,
    );
  },

  async startRemediationSession(profile) {
    return request<RemediationResponse>("/api/v1/remediation/sessions", {
      method: "POST",
      body: JSON.stringify({ profile }),
    });
  },

  async submitRemediationAttempt(studentId, stepId, isCorrect, attemptId) {
    return request<RemediationResponse>("/api/v1/remediation/attempts", {
      method: "POST",
      body: JSON.stringify({
        student_id: studentId,
        step_id: stepId,
        is_correct: isCorrect,
        attempt_id: attemptId,
      }),
    });
  },

  async confirmEvidence(studentId, evidenceSufficient) {
    return request<RemediationResponse>("/api/v1/remediation/confirm", {
      method: "POST",
      body: JSON.stringify({
        student_id: studentId,
        evidence_sufficient: evidenceSufficient,
      }),
    });
  },

  async submitExitTicket(studentId, ticketId, responseLabel, submissionId) {
    return request<ExitTicketResponse>("/api/v1/remediation/exit-tickets", {
      method: "POST",
      body: JSON.stringify({
        student_id: studentId,
        ticket_id: ticketId,
        response_label: responseLabel,
        submission_id: submissionId,
      }),
    });
  },

  async listDemoPersonas() {
    const response = await request<{ personas: DemoPersonaSummary[] }>(
      "/api/v1/demo/personas",
    );
    return response.personas;
  },

  async resetDemo(personaId) {
    return request<DemoResetResponse>("/api/v1/demo/reset", {
      method: "POST",
      body: JSON.stringify({ persona_id: personaId }),
    });
  },
};
