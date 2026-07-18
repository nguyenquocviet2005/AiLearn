import type { ClassSnapshotV1, TeacherPlanVersionV1 } from "@ailearn/schemas";

import type { TeacherWorkspaceRepository } from "./teacher-fixtures";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
const planId = "plan_demo_fractions_01";
const classId = "class_demo_6a";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    throw new Error("Teacher plan service is unavailable.");
  }
  return (await response.json()) as T;
}

export const httpTeacherWorkspaceRepository: TeacherWorkspaceRepository = {
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
    return request<TeacherPlanVersionV1>(`/api/v1/lesson-plans/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ expected_parent_version: expectedParentVersion }),
    });
  },
  reject(id, expectedParentVersion) {
    return request<TeacherPlanVersionV1>(`/api/v1/lesson-plans/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ expected_parent_version: expectedParentVersion }),
    });
  },
  publish(id, expectedParentVersion) {
    return request<TeacherPlanVersionV1>(`/api/v1/lesson-plans/${id}/publish`, {
      method: "POST",
      body: JSON.stringify({ expected_parent_version: expectedParentVersion }),
    });
  },
};
