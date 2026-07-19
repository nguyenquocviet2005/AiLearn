/**
 * In-memory repositories for the `/prototype` design-review flow.
 * No `fetch`, no backend — deterministic Grade 7 inverse-proportion demo data.
 */

import type {
  ClassSnapshotV1,
  InterventionReportV1,
  TeacherLessonPlanV1,
  TeacherPlanVersionV1,
} from "@ailearn/schemas";

import type { TeacherReportRepository } from "@/lib/adapters/teacher-report-repository";
import type { TeacherWorkspaceRepository } from "@/lib/adapters/teacher-workspace-repository";
import classSnapshotFixture from "@/test/fixtures/class-snapshot.json";
import lessonPlanFixture from "@/test/fixtures/lesson-plan.json";

const classSnapshot = structuredClone(
  classSnapshotFixture,
) as ClassSnapshotV1;
const baseLessonPlan = structuredClone(lessonPlanFixture) as TeacherLessonPlanV1;

/** Mutable plan store so save/approve/publish feel real inside the prototype. */
let planStore: TeacherPlanVersionV1 = versionFor(1);

function versionFor(
  version: number,
  decision: TeacherPlanVersionV1["decision"] = "pending",
  publishedAt: string | null = null,
  snapshot: ClassSnapshotV1 = classSnapshot,
  lessonPlan: TeacherLessonPlanV1 = baseLessonPlan,
): TeacherPlanVersionV1 {
  const status =
    decision === "approved" ? "approved" : version === 1 ? "draft" : "edited";
  return {
    schema_version: "1",
    id: `${baseLessonPlan.id}:v${version}`,
    plan_id: baseLessonPlan.id,
    version,
    parent_version_id:
      version === 1 ? null : `${baseLessonPlan.id}:v${version - 1}`,
    decision,
    published_at: publishedAt,
    created_at: baseLessonPlan.generated_at,
    snapshot,
    lesson_plan: { ...lessonPlan, status },
  };
}

export function resetPrototypeMockState(): void {
  planStore = versionFor(1);
}

export const mockTeacherWorkspaceRepository: TeacherWorkspaceRepository = {
  async getClassSnapshot() {
    return structuredClone(classSnapshot);
  },
  async getLessonPlan() {
    return structuredClone(planStore);
  },
  async createVersion(snapshot, updatedPlan, expectedParentVersion) {
    planStore = {
      ...versionFor(
        expectedParentVersion + 1,
        "pending",
        null,
        snapshot,
        updatedPlan,
      ),
      lesson_plan: { ...updatedPlan, status: "edited" },
    };
    return structuredClone(planStore);
  },
  async approve(planId, expectedParentVersion) {
    planStore = {
      ...versionFor(
        expectedParentVersion + 1,
        "approved",
        null,
        planStore.snapshot,
        planStore.lesson_plan,
      ),
      plan_id: planId,
    };
    return structuredClone(planStore);
  },
  async reject(planId, expectedParentVersion) {
    planStore = {
      ...versionFor(
        expectedParentVersion + 1,
        "rejected",
        null,
        planStore.snapshot,
        planStore.lesson_plan,
      ),
      plan_id: planId,
    };
    return structuredClone(planStore);
  },
  async publish(planId, expectedParentVersion) {
    planStore = {
      ...versionFor(
        expectedParentVersion + 1,
        "approved",
        "2026-07-19T04:00:00Z",
        planStore.snapshot,
        planStore.lesson_plan,
      ),
      plan_id: planId,
    };
    return structuredClone(planStore);
  },
};

export const mockInterventionReport: InterventionReportV1 = {
  schema_version: "1",
  id: "report_demo_01",
  class_id: "class_g7a_demo",
  lesson_id: "lesson_g7_inverse_proportion_01",
  generated_at: "2026-07-18T22:30:00Z",
  outcome_counts: {
    passed_transfer: 1,
    still_struggling: 1,
    root_cause_reclassified: 1,
    incomplete: 1,
    teacher_escalation: 1,
  },
  student_outcomes: [
    {
      student_id: "stu_g7_001",
      outcome: "passed_transfer",
      evidence_ids: ["ev_stu_g7_001_post_001", "ev_stu_g7_001_post_002"],
    },
    {
      student_id: "stu_g7_002",
      outcome: "still_struggling",
      evidence_ids: ["ev_stu_g7_002_post_001", "ev_stu_g7_002_post_002"],
    },
    {
      student_id: "stu_g7_003",
      outcome: "root_cause_reclassified",
      evidence_ids: ["ev_stu_g7_003_post_001", "ev_stu_g7_003_post_002"],
    },
    {
      student_id: "stu_g7_004",
      outcome: "teacher_escalation",
      evidence_ids: ["ev_stu_g7_004_post_001", "ev_stu_g7_004_post_002"],
    },
    {
      student_id: "stu_g7_005",
      outcome: "incomplete",
      evidence_ids: [],
    },
  ],
  remaining_gaps: [
    {
      skill_id: "skill_fraction_multiplication",
      student_ids: ["stu_g7_002", "stu_g7_004"],
    },
    {
      skill_id: "skill_inverse_proportion_definition",
      student_ids: ["stu_g7_003"],
    },
  ],
  next_lesson_focus:
    "Củng cố cách lập quan hệ tỉ lệ nghịch và phép nhân phân số trước khi vận dụng vào bài toán năng suất.",
  printable_lesson_plan_id:
    "plan_class_g7a_demo_lesson_g7_inverse_proportion_01",
};

export const mockTeacherReportRepository: TeacherReportRepository = {
  async getReport() {
    return structuredClone(mockInterventionReport);
  },
};
