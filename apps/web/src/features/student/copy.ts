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

export const REPRESENTATION_LABELS: Record<string, string> = {
  text: "Dạng chữ",
  table: "Dạng bảng",
  diagram: "Dạng hình vẽ",
};
