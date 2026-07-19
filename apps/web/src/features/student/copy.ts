import type { RemediationState, StepKind } from "@ailearn/schemas";

/**
 * Student-friendly copy. This is the single place a technical RemediationState,
 * StepKind, or escalation_reason gets translated into language a student sees —
 * raw skill ids / root_cause_skill_id must never be rendered directly anywhere
 * in the student feature.
 */

export const STATE_COPY: Record<
  RemediationState,
  { title: string; description: string }
> = {
  CONFIRMATION: {
    title: "Một câu để hiểu rõ hơn",
    description: "Hệ thống cần thêm một câu để hiểu em đang vướng ở đâu.",
  },
  REPAIR: {
    title: "Cùng ôn lại bước này",
    description: "Mình xem một ví dụ, sau đó em thử nhé.",
  },
  PRACTICE: {
    title: "Tự làm một bài",
    description: "Không có gợi ý lần này — em thử tự giải nhé.",
  },
  TRANSFER: {
    title: "Thử một tình huống mới",
    description: "Bài này hơi khác một chút, xem em áp dụng được không nhé.",
  },
  TEACHER_ESCALATION: {
    title: "Nhờ cô giúp thêm",
    description: "Em đã cố gắng rất nhiều. Cô sẽ hướng dẫn em kỹ hơn nhé.",
  },
};

export const STEP_KIND_COPY: Record<StepKind, string> = {
  worked_example: "Ví dụ mẫu",
  guided_problem: "Bài có hướng dẫn",
  independent_problem: "Bài tự làm",
  near_transfer: "Thử tình huống mới",
  result: "Kết quả",
};

const ESCALATION_REASON_COPY: Record<string, string> = {
  esc_repeated_failure: "Em đã thử nhiều cách. Cô sẽ giải thích kỹ hơn cho em.",
  esc_abstained_profile:
    "Cần thêm thời gian với cô để hiểu rõ chỗ em đang vướng.",
};

export function escalationReasonCopy(reason: string | null): string {
  if (reason && reason in ESCALATION_REASON_COPY) {
    return ESCALATION_REASON_COPY[reason];
  }
  return "Cô sẽ giúp em ở bước này.";
}

export function checkpointVerdictCopy(isCorrect: boolean): string {
  return isCorrect
    ? "Chính xác! Cùng sang bước tiếp theo."
    : "Chưa đúng — mình đổi cách giải thích và xem lại ví dụ mẫu nhé.";
}

export const REPRESENTATION_LABELS: Record<string, string> = {
  text: "Dạng chữ",
  table: "Dạng bảng",
  diagram: "Dạng hình vẽ",
};

/**
 * Lesson-prep resources (soạn bài) for Grade-7 inverse proportion.
 * Students review these before the readiness check so they have enough
 * background to take the short test and surface weak spots.
 */
export type StudyMaterial =
  | {
      title: string;
      kind: "ly_thuyet" | "bai_tap";
      url: string;
      blurb: string;
    }
  | {
      title: string;
      kind: "video";
      youtubeId: string;
      blurb: string;
    };

export const STUDY_MATERIALS: StudyMaterial[] = [
  {
    title: "Lý thuyết Đại lượng tỉ lệ nghịch (Toán 7)",
    kind: "ly_thuyet",
    url: "https://vietjack.com/toan-lop-7/bai-3-dai-luong-ti-le-nghich.jsp",
    blurb:
      "Đọc định nghĩa xy = a và tính chất tích không đổi trước khi làm bài.",
  },
  {
    title: "Biểu diễn quan hệ & tìm hệ số tỉ lệ nghịch",
    kind: "bai_tap",
    url: "https://www.vietjack.com/toan-lop-7/bieu-dien-quan-he-ti-le-nghich-va-xac-dinh-he-so-sm.jsp",
    blurb:
      "Ví dụ có lời giải — soạn vài dạng bài hay gặp trước khi kiểm tra ngắn.",
  },
  {
    title: "Chuyên đề Đại lượng tỉ lệ nghịch Toán 7",
    kind: "bai_tap",
    url: "https://thcs.toanmath.com/2023/08/chuyen-de-dai-luong-ti-le-nghich-toan-7.html",
    blurb: "Tóm tắt lý thuyết và các dạng bài thường gặp để ôn nhanh.",
  },
  {
    title: "Đại lượng tỉ lệ nghịch — chương trình mới",
    kind: "video",
    youtubeId: "rmQ58CUKioA",
    blurb:
      "Một video bài giảng Toán 7: xem trực tiếp để nắm ý chính trước bài test.",
  },
];

/**
 * Student-facing lesson knowledge map. `skillIds` is matching metadata only —
 * never render those ids in the UI.
 */
export interface KnowledgeNode {
  id: string;
  skillIds: readonly string[];
  title: string;
  blurb: string;
  stage: "Nền tảng" | "Trọng tâm" | "Áp dụng";
}

export const LESSON_KNOWLEDGE_PATH: readonly KnowledgeNode[] = [
  {
    id: "kn_ratio",
    skillIds: ["skill_ratio_proportion_basics"],
    title: "Tỉ số và tỉ lệ thức",
    blurb: "Nắm tỉ số a:b và tỉ lệ thức trước khi vào đại lượng.",
    stage: "Nền tảng",
  },
  {
    id: "kn_direct",
    skillIds: ["skill_direct_proportion"],
    title: "Đại lượng tỉ lệ thuận",
    blurb: "Nhận biết y = kx để phân biệt với tỉ lệ nghịch.",
    stage: "Nền tảng",
  },
  {
    id: "kn_inverse_def",
    skillIds: [
      "skill_inverse_proportion_definition",
      "skill_verify_inverse_by_product",
    ],
    title: "Định nghĩa tỉ lệ nghịch",
    blurb: "Hiểu x·y = k và kiểm tra bằng tích không đổi.",
    stage: "Trọng tâm",
  },
  {
    id: "kn_constant",
    skillIds: ["skill_find_constant_k", "skill_solve_unknown_value"],
    title: "Tìm hệ số k và giá trị chưa biết",
    blurb: "Từ một cặp giá trị suy ra k, rồi tìm ẩn còn lại.",
    stage: "Trọng tâm",
  },
  {
    id: "kn_distinguish",
    skillIds: [
      "skill_distinguish_direct_inverse",
      "skill_equal_ratios_property",
    ],
    title: "Phân biệt thuận / nghịch",
    blurb: "Chọn đúng mô hình trước khi giải bài toán.",
    stage: "Trọng tâm",
  },
  {
    id: "kn_apply",
    skillIds: [
      "skill_word_problem_work_rate",
      "skill_word_problem_speed_distance",
      "skill_multistep_reasoning",
      "skill_fraction_multiplication",
    ],
    title: "Bài toán năng suất & thời gian",
    blurb: "Áp dụng tỉ lệ nghịch vào tình huống thực tế của bài học.",
    stage: "Áp dụng",
  },
];

export function knowledgeFocusId(
  rootCauseSkillId: string | null | undefined,
): string | null {
  if (!rootCauseSkillId) {
    return null;
  }
  return (
    LESSON_KNOWLEDGE_PATH.find((node) =>
      node.skillIds.includes(rootCauseSkillId),
    )?.id ?? null
  );
}
