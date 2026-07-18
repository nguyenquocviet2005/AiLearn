import type {
  ClassSnapshotV1,
  TeacherLessonPlanV1,
  TeacherPlanVersionV1,
} from "@ailearn/schemas";

import type { TeacherWorkspaceRepository } from "@/lib/adapters/teacher-workspace-repository";
import classSnapshotFixture from "./fixtures/class-snapshot.json";
import lessonPlanFixture from "./fixtures/lesson-plan.json";

// Test-only data is generated from the same deterministic G7 projection as the API fallback.
const classSnapshot = classSnapshotFixture as ClassSnapshotV1;
const lessonPlan = lessonPlanFixture as TeacherLessonPlanV1;

function versionFor(
  version: number,
  decision: TeacherPlanVersionV1["decision"] = "pending",
  publishedAt: string | null = null,
): TeacherPlanVersionV1 {
  const status =
    decision === "approved" ? "approved" : version === 1 ? "draft" : "edited";
  return {
    schema_version: "1",
    id: `${lessonPlan.id}:v${version}`,
    plan_id: lessonPlan.id,
    version,
    parent_version_id:
      version === 1 ? null : `${lessonPlan.id}:v${version - 1}`,
    decision,
    published_at: publishedAt,
    created_at: lessonPlan.generated_at,
    snapshot: classSnapshot,
    lesson_plan: { ...lessonPlan, status },
  };
}

export const fixtureTeacherWorkspaceRepository: TeacherWorkspaceRepository = {
  async getClassSnapshot() {
    return classSnapshot;
  },
  async getLessonPlan() {
    return versionFor(1);
  },
  async createVersion(snapshot, updatedPlan, expectedParentVersion) {
    return {
      ...versionFor(expectedParentVersion + 1),
      snapshot,
      lesson_plan: { ...updatedPlan, status: "edited" },
    };
  },
  async approve(planId, expectedParentVersion) {
    return {
      ...versionFor(expectedParentVersion + 1, "approved"),
      plan_id: planId,
    };
  },
  async reject(planId, expectedParentVersion) {
    return {
      ...versionFor(expectedParentVersion + 1, "rejected"),
      plan_id: planId,
    };
  },
  async publish(planId, expectedParentVersion) {
    return {
      ...versionFor(
        expectedParentVersion + 1,
        "approved",
        "2026-07-18T02:00:00Z",
      ),
      plan_id: planId,
    };
  },
};
