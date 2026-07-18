import type {
  ClassSnapshotV1,
  TeacherLessonPlanV1,
  TeacherPlanVersionV1,
} from "@ailearn/schemas";

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
