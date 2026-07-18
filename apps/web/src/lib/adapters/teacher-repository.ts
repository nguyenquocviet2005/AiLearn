import type { ClassSnapshotV1, TeacherPlanVersionV1 } from "@ailearn/schemas";

import { ApiConfigurationError, getApiBaseUrl } from "@/lib/api-base-url";

import type { TeacherWorkspaceRepository } from "./teacher-workspace-repository";

const planId = "plan_class_g7a_demo_lesson_g7_inverse_proportion_01";
const classId = "class_g7a_demo";

export type TeacherRepositoryErrorKind =
  "configuration" | "unavailable" | "response";

export class TeacherRepositoryError extends Error {
  readonly kind: TeacherRepositoryErrorKind;

  constructor(kind: TeacherRepositoryErrorKind, message: string) {
    super(message);
    this.name = "TeacherRepositoryError";
    this.kind = kind;
  }
}

export function createHttpTeacherWorkspaceRepository(
  resolveBaseUrl: () => string = getApiBaseUrl,
): TeacherWorkspaceRepository {
  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    let apiBaseUrl: string;
    try {
      apiBaseUrl = resolveBaseUrl();
    } catch (error) {
      if (error instanceof ApiConfigurationError) {
        throw new TeacherRepositoryError("configuration", error.message);
      }
      throw error;
    }

    let response: Response;
    try {
      response = await fetch(`${apiBaseUrl}${path}`, {
        ...init,
        headers: { "Content-Type": "application/json", ...init?.headers },
      });
    } catch {
      throw new TeacherRepositoryError(
        "unavailable",
        "Teacher workspace API request failed.",
      );
    }
    if (!response.ok) {
      throw new TeacherRepositoryError(
        "response",
        "Teacher workspace data request was rejected.",
      );
    }
    return (await response.json()) as T;
  }

  return {
    getClassSnapshot() {
      return request<ClassSnapshotV1>(`/api/v1/classes/${classId}/snapshot`);
    },
    getLessonPlan(requestedPlanId = planId) {
      return request<TeacherPlanVersionV1>(
        `/api/v1/lesson-plans/${requestedPlanId}`,
      );
    },
    createVersion(snapshot, lessonPlan, expectedParentVersion) {
      return request<TeacherPlanVersionV1>(
        `/api/v1/lesson-plans/${planId}/versions`,
        {
          method: "POST",
          body: JSON.stringify({
            expected_parent_version: expectedParentVersion,
            snapshot,
            lesson_plan: lessonPlan,
          }),
        },
      );
    },
    approve(id, expectedParentVersion) {
      return request<TeacherPlanVersionV1>(
        `/api/v1/lesson-plans/${id}/approve`,
        {
          method: "POST",
          body: JSON.stringify({
            expected_parent_version: expectedParentVersion,
          }),
        },
      );
    },
    reject(id, expectedParentVersion) {
      return request<TeacherPlanVersionV1>(
        `/api/v1/lesson-plans/${id}/reject`,
        {
          method: "POST",
          body: JSON.stringify({
            expected_parent_version: expectedParentVersion,
          }),
        },
      );
    },
    publish(id, expectedParentVersion) {
      return request<TeacherPlanVersionV1>(
        `/api/v1/lesson-plans/${id}/publish`,
        {
          method: "POST",
          body: JSON.stringify({
            expected_parent_version: expectedParentVersion,
          }),
        },
      );
    },
  };
}

export const httpTeacherWorkspaceRepository =
  createHttpTeacherWorkspaceRepository();
