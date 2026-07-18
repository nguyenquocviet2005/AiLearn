import type { ClassSnapshotV1, TeacherLessonPlanV1 } from "@ailearn/schemas";

import classSnapshotFixture from "../../../../../data/fixtures/class-snapshot.json";
import lessonPlanFixture from "../../../../../data/fixtures/lesson-plan.json";

export interface TeacherWorkspaceRepository {
  getClassSnapshot(): Promise<ClassSnapshotV1>;
  getLessonPlan(): Promise<TeacherLessonPlanV1>;
}

// VAI-11 validates these frozen fixture artifacts against the shared V1 schemas.
const classSnapshot = classSnapshotFixture as ClassSnapshotV1;
const lessonPlan = lessonPlanFixture as TeacherLessonPlanV1;

export const fixtureTeacherWorkspaceRepository: TeacherWorkspaceRepository = {
  async getClassSnapshot() {
    return classSnapshot;
  },
  async getLessonPlan() {
    return lessonPlan;
  },
};
