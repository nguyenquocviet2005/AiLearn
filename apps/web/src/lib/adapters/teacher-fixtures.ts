import type {
  ClassSnapshotV1,
  TeacherLessonPlanV1,
  TeacherPlanVersionV1,
} from "@ailearn/schemas";

import classSnapshotFixture from "../../../../../data/fixtures/class-snapshot.json";
import lessonPlanFixture from "../../../../../data/fixtures/lesson-plan.json";

export interface TeacherWorkspaceRepository {
  getClassSnapshot(): Promise<ClassSnapshotV1>;
  getLessonPlan(): Promise<TeacherPlanVersionV1>;
  createVersion(
    snapshot: ClassSnapshotV1,
    lessonPlan: TeacherLessonPlanV1,
    expectedParentVersion: number,
  ): Promise<TeacherPlanVersionV1>;
  approve(
    planId: string,
    expectedParentVersion: number,
  ): Promise<TeacherPlanVersionV1>;
  reject(
    planId: string,
    expectedParentVersion: number,
  ): Promise<TeacherPlanVersionV1>;
  publish(
    planId: string,
    expectedParentVersion: number,
  ): Promise<TeacherPlanVersionV1>;
}

// VAI-11 validates these frozen fixture artifacts against the shared V1 schemas.
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
    created_at: "2026-07-18T01:15:00Z",
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
