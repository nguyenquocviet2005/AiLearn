import type {
  ClassSnapshotV1,
  EvidenceEventV1,
  OutcomeKind,
  ReadinessStatus,
  SnapshotGroup,
  StudentImprovementPathV1,
  TeacherPlanVersionV1,
  TeachingPriority,
} from "@ailearn/schemas";

export const VIETNAMESE_STUDENT_NAMES = [
  "Nguyễn Minh Anh",
  "Trần Gia Bảo",
  "Lê Hoàng Châu",
  "Phạm Đức Duy",
  "Hoàng Khánh Giang",
  "Vũ Ngọc Hà",
  "Đặng Quang Huy",
  "Bùi Thanh Hương",
  "Đỗ Minh Khang",
  "Hồ Nhật Linh",
  "Ngô Tuấn Minh",
  "Dương Bảo Nam",
  "Lý Hoàng Oanh",
  "Trịnh Gia Phúc",
  "Mai Minh Quân",
  "Tạ Phương Thảo",
  "Cao Anh Thư",
  "Chu Đức Trung",
  "Lương Hải Yến",
  "Nông Thành An",
  "Nguyễn Quốc Bảo",
  "Trần Hải Đăng",
  "Lê Quỳnh Giang",
  "Phạm Minh Hiếu",
  "Hoàng Thu Hương",
  "Vũ Anh Khoa",
  "Đặng Mỹ Linh",
  "Bùi Hoàng Long",
  "Đỗ Tuệ Minh",
  "Hồ Phương Nam",
  "Ngô Khánh Ngọc",
  "Dương Minh Phúc",
  "Lý Thu Quỳnh",
  "Trịnh Đức Thành",
  "Mai Anh Thư",
  "Tạ Minh Trang",
  "Cao Quốc Việt",
  "Chu Hải Yến",
  "Lương Gia Hân",
  "Nông Minh Khôi",
] as const;

const skillLabels: Record<string, string> = {
  skill_ratio_proportion_basics: "Nền tảng tỉ số và tỉ lệ thức",
  skill_distinguish_direct_inverse: "Phân biệt tỉ lệ thuận và tỉ lệ nghịch",
  skill_ratio_equivalence: "Tỉ lệ thức tương đương",
  skill_fraction_multiplication: "Nhân phân số",
  skill_direct_proportion: "Phân biệt tỉ lệ thuận",
  skill_inverse_proportion: "Mô hình tỉ lệ nghịch",
  skill_word_problem_work_rate: "Bài toán năng suất thực tế",
  target_transfer: "Vận dụng độc lập trong tình huống mới",
  teacher_station: "Trạm học có giáo viên hướng dẫn",
  insufficient_evidence: "Cần thu thập thêm minh chứng",
};

export class TeacherDemoValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TeacherDemoValidationError";
  }
}

export type DemoEvidenceEvent = EvidenceEventV1 & {
  sync_state: "synced" | "pending";
  source: "assessment" | "teacher_observation" | "exit_ticket";
  phase: "baseline" | "follow_up";
  independent: boolean;
};

export type DemoStudentOutcome = {
  student_id: string;
  outcome: OutcomeKind;
  evidence_ids: string[];
};

export type TeacherStudentRow = {
  id: string;
  name: string;
  readiness: ReadinessStatus;
  confidence: number;
  rootCauseId: string | null;
  rootCause: string;
  evidenceCount: number;
  contradictingEvidence: number;
  syncState: "Đã đồng bộ" | "Đang chờ" | "Thiếu minh chứng";
  intervention: "Chưa cần" | "Cần củng cố" | "Cần xác minh";
  groupId: string | null;
};

export type TeacherDemoModel = {
  className: "Lớp 7A";
  lessonName: "Đại lượng tỉ lệ nghịch";
  teacherName: "Cô Nguyễn Thu Hà";
  students: TeacherStudentRow[];
  groups: Array<SnapshotGroup & { name: string; target: string }>;
  plan: TeacherPlanVersionV1;
  evidence: DemoEvidenceEvent[];
  outcomes: DemoStudentOutcome[];
  improvementPaths: StudentImprovementPathV1[];
  topPriority: TeachingPriority & { label: string };
  metrics: {
    total: number;
    ready: number;
    needsSupport: number;
    insufficient: number;
    averageConfidence: number;
    evidenceTotal: number;
    pendingSync: number;
    improved: number;
    needsRemediation: number;
    afterReady: number;
  };
  generatedAt: string;
};

export function teacherSkillLabel(skillId: string | null): string {
  if (!skillId) return "Chưa đủ minh chứng để kết luận";
  return skillLabels[skillId] ?? "Kỹ năng tiền đề cần củng cố";
}

function validateWorkspaceContracts(
  snapshot: ClassSnapshotV1,
  plan: TeacherPlanVersionV1,
) {
  if (
    plan.snapshot.class_id !== snapshot.class_id ||
    plan.lesson_plan.class_id !== snapshot.class_id
  ) {
    throw new TeacherDemoValidationError(
      "Kế hoạch và ảnh chụp lớp không cùng một lớp học.",
    );
  }
  if (
    plan.snapshot.lesson_id !== snapshot.lesson_id ||
    plan.lesson_plan.lesson_id !== snapshot.lesson_id
  ) {
    throw new TeacherDemoValidationError(
      "Kế hoạch và ảnh chụp lớp không cùng một bài học.",
    );
  }
  const studentIds = snapshot.students.map((student) => student.student_id);
  if (new Set(studentIds).size !== studentIds.length) {
    throw new TeacherDemoValidationError("Ảnh chụp lớp có học sinh bị lặp.");
  }
  const knownIds = new Set([...studentIds, ...snapshot.unknown_student_ids]);
  const groupedIds = snapshot.groups.flatMap((group) => group.student_ids);
  const invalidGroupId = groupedIds.find(
    (studentId) => !knownIds.has(studentId),
  );
  if (invalidGroupId) {
    throw new TeacherDemoValidationError(
      "Nhóm học tập tham chiếu học sinh không thuộc lớp.",
    );
  }
  if (new Set(groupedIds).size !== groupedIds.length) {
    throw new TeacherDemoValidationError(
      "Một học sinh xuất hiện trong nhiều nhóm học tập.",
    );
  }
  const ungrouped = studentIds.find(
    (studentId) => !groupedIds.includes(studentId),
  );
  if (ungrouped) {
    throw new TeacherDemoValidationError(
      "Có học sinh chưa được ánh xạ vào nhóm học tập.",
    );
  }
  if (snapshot.teaching_priorities.length === 0) {
    throw new TeacherDemoValidationError(
      "Ảnh chụp lớp chưa có ưu tiên giảng dạy.",
    );
  }
}

function buildEvidence(snapshot: ClassSnapshotV1): DemoEvidenceEvent[] {
  return snapshot.students.flatMap((student) => {
    const eventCount =
      student.readiness_status === "abstained"
        ? 2
        : student.confidence >= 0.8
          ? 7
          : 5;
    const skillId =
      student.primary_root_cause_skill_id ?? "skill_inverse_proportion";
    const baseline = Array.from({ length: eventCount }, (_, eventIndex) => {
      const isLast = eventIndex === eventCount - 1;
      const isCorrect =
        student.readiness_status === "ready"
          ? eventIndex >= 1
          : student.readiness_status === "abstained"
            ? eventIndex === 1
            : isLast && student.confidence >= 0.75;
      return {
        schema_version: "1" as const,
        id: `demo_ev_${student.student_id}_${String(eventIndex + 1).padStart(2, "0")}`,
        student_id: student.student_id,
        session_id: `demo_session_${student.student_id}`,
        skill_id: skillId,
        item_id: `demo_item_${skillId}_${eventIndex + 1}`,
        is_correct: isCorrect,
        recorded_at: `2026-07-19T0${Math.min(9, 7 + Math.floor(eventIndex / 3))}:${String((eventIndex * 7) % 60).padStart(2, "0")}:00Z`,
        lesson_id: snapshot.lesson_id,
        response_label: isCorrect ? "Đáp án hợp lý" : "Cần xem lại lập luận",
        confidence: student.confidence,
        sync_state:
          student.readiness_status === "abstained" && isLast
            ? ("pending" as const)
            : ("synced" as const),
        source: isLast
          ? ("teacher_observation" as const)
          : ("assessment" as const),
        phase: "baseline" as const,
        independent: false,
      };
    });
    const followUpResults =
      student.readiness_status === "abstained"
        ? [false]
        : student.readiness_status === "ready" || student.confidence >= 0.82
          ? [true, true]
          : student.confidence >= 0.68
            ? [false, false]
            : [true, false];
    const followUp = followUpResults.map((isCorrect, index) => ({
      schema_version: "1" as const,
      id: `demo_exit_${student.student_id}_${index + 1}`,
      student_id: student.student_id,
      session_id: `demo_follow_up_${student.student_id}`,
      skill_id: skillId,
      item_id: `demo_transfer_${skillId}_${index + 1}`,
      is_correct: isCorrect,
      recorded_at: `2026-07-19T09:${String(40 + index * 3).padStart(2, "0")}:00Z`,
      lesson_id: snapshot.lesson_id,
      response_label: isCorrect
        ? "Vận dụng độc lập chính xác"
        : "Cần tiếp tục củng cố",
      confidence: student.confidence,
      sync_state:
        student.readiness_status === "abstained"
          ? ("pending" as const)
          : ("synced" as const),
      source: "exit_ticket" as const,
      phase: "follow_up" as const,
      independent: true,
    }));
    return [...baseline, ...followUp];
  });
}

export function calculateStudentOutcome(
  evidence: DemoEvidenceEvent[],
): OutcomeKind {
  const followUp = evidence.filter(
    (event) =>
      event.phase === "follow_up" &&
      event.source === "exit_ticket" &&
      event.independent,
  );
  if (
    followUp.length < 2 ||
    followUp.some((event) => event.sync_state !== "synced")
  )
    return "incomplete";
  const correct = followUp.filter((event) => event.is_correct).length;
  if (correct === followUp.length) return "passed_transfer";
  if (correct === 0) return "still_struggling";
  return "root_cause_reclassified";
}

function buildOutcomes(
  snapshot: ClassSnapshotV1,
  evidence: DemoEvidenceEvent[],
): DemoStudentOutcome[] {
  return snapshot.students.map((student) => ({
    student_id: student.student_id,
    outcome: calculateStudentOutcome(
      evidence.filter((event) => event.student_id === student.student_id),
    ),
    evidence_ids: evidence
      .filter(
        (event) =>
          event.student_id === student.student_id &&
          event.phase === "follow_up",
      )
      .map((event) => event.id),
  }));
}

function buildImprovementPaths(
  snapshot: ClassSnapshotV1,
  outcomes: DemoStudentOutcome[],
): StudentImprovementPathV1[] {
  const stepKinds = [
    "worked_example",
    "guided_problem",
    "independent_problem",
    "near_transfer",
    "result",
  ] as const;
  return snapshot.students
    .filter((student) => student.readiness_status !== "ready")
    .map((student) => {
      const outcome = outcomes.find(
        (item) => item.student_id === student.student_id,
      )?.outcome;
      const completedCount =
        outcome === "passed_transfer"
          ? 5
          : outcome === "still_struggling"
            ? 2
            : outcome === "root_cause_reclassified"
              ? 1
              : 0;
      const currentState =
        student.readiness_status === "abstained"
          ? ("CONFIRMATION" as const)
          : completedCount >= 4
            ? ("TRANSFER" as const)
            : completedCount >= 2
              ? ("PRACTICE" as const)
              : ("REPAIR" as const);
      return {
        schema_version: "1" as const,
        id: `demo_path_${student.student_id}`,
        student_id: student.student_id,
        target_skill_id: "skill_inverse_proportion",
        current_state: currentState,
        representation: "table" as const,
        steps: stepKinds.map((kind, index) => ({
          id: `demo_step_${student.student_id}_${index + 1}`,
          kind,
          state:
            index < 1
              ? ("REPAIR" as const)
              : index < 3
                ? ("PRACTICE" as const)
                : ("TRANSFER" as const),
          completed: index < completedCount,
        })),
        updated_at: snapshot.generated_at,
        root_cause_skill_id: student.primary_root_cause_skill_id,
      };
    });
}

export function buildTeacherDemoModel(
  snapshot: ClassSnapshotV1,
  plan: TeacherPlanVersionV1,
): TeacherDemoModel {
  validateWorkspaceContracts(snapshot, plan);
  const evidence = buildEvidence(snapshot);
  const outcomes = buildOutcomes(snapshot, evidence);
  const improvementPaths = buildImprovementPaths(snapshot, outcomes);
  const groupByStudent = new Map<string, string>();
  snapshot.groups.forEach((group) =>
    group.student_ids.forEach((studentId) =>
      groupByStudent.set(studentId, group.id),
    ),
  );

  const students = snapshot.students.map(
    (student, index): TeacherStudentRow => {
      const studentEvidence = evidence.filter(
        (event) => event.student_id === student.student_id,
      );
      const rootEvidence = studentEvidence.filter(
        (event) => event.skill_id === student.primary_root_cause_skill_id,
      );
      const hasCorrect = rootEvidence.some((event) => event.is_correct);
      const hasIncorrect = rootEvidence.some((event) => !event.is_correct);
      const isInsufficient = student.readiness_status === "abstained";
      return {
        id: student.student_id,
        name: VIETNAMESE_STUDENT_NAMES[index] ?? `Học sinh ${index + 1}`,
        readiness: student.readiness_status,
        confidence: student.confidence,
        rootCauseId: student.primary_root_cause_skill_id,
        rootCause: teacherSkillLabel(student.primary_root_cause_skill_id),
        evidenceCount: studentEvidence.length,
        contradictingEvidence: hasCorrect && hasIncorrect ? 1 : 0,
        syncState: isInsufficient
          ? studentEvidence.some((event) => event.sync_state === "pending")
            ? "Đang chờ"
            : "Thiếu minh chứng"
          : "Đã đồng bộ",
        intervention: isInsufficient
          ? "Cần xác minh"
          : student.readiness_status === "needs_support"
            ? "Cần củng cố"
            : "Chưa cần",
        groupId: groupByStudent.get(student.student_id) ?? null,
      };
    },
  );

  const groups = snapshot.groups.map((group, index) => ({
    ...group,
    name:
      group.intervention_need.includes("insufficient") ||
      group.intervention_need.includes("confirmation")
        ? "Nhóm cần thêm minh chứng"
        : group.intervention_need.includes("target_transfer")
          ? "Nhóm mở rộng · Vận dụng độc lập"
          : group.intervention_need.includes("teacher_station")
            ? "Nhóm giáo viên đồng hành"
            : `Nhóm ${String.fromCharCode(65 + index)} · ${teacherSkillLabel(
                group.intervention_need.split(":").at(-1) ?? null,
              )}`,
    target: teacherSkillLabel(
      group.intervention_need.split(":").at(-1) ?? null,
    ),
  }));

  const topPriority = [...snapshot.teaching_priorities].sort(
    (left, right) => left.rank - right.rank,
  )[0];
  const improved = outcomes.filter(
    (outcome) =>
      outcome.outcome === "passed_transfer" ||
      outcome.outcome === "root_cause_reclassified",
  ).length;
  const needsRemediation = outcomes.filter(
    (outcome) => outcome.outcome === "still_struggling",
  ).length;

  return {
    className: "Lớp 7A",
    lessonName: "Đại lượng tỉ lệ nghịch",
    teacherName: "Cô Nguyễn Thu Hà",
    students,
    groups,
    plan,
    evidence,
    outcomes,
    improvementPaths,
    topPriority: {
      ...topPriority,
      label: teacherSkillLabel(topPriority.skill_id),
    },
    metrics: {
      total: students.length,
      ready: students.filter((student) => student.readiness === "ready").length,
      needsSupport: students.filter(
        (student) => student.readiness === "needs_support",
      ).length,
      insufficient: students.filter(
        (student) => student.readiness === "abstained",
      ).length,
      averageConfidence:
        students.reduce((sum, student) => sum + student.confidence, 0) /
        Math.max(1, students.length),
      evidenceTotal: evidence.length,
      pendingSync: students.filter(
        (student) => student.syncState === "Đang chờ",
      ).length,
      improved,
      needsRemediation,
      afterReady: outcomes.filter(
        (outcome) => outcome.outcome === "passed_transfer",
      ).length,
    },
    generatedAt: snapshot.generated_at,
  };
}
