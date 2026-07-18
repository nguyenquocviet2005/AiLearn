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

/**
 * Student-facing translation of the probe engine's reason codes. The engine
 * reasons about skills and hypotheses; the student is told, in plain language,
 * why one more question helps — never the technical root cause.
 */
const PROBE_REASON_COPY: Record<string, string> = {
  targets_primary_hypothesis:
    "Câu này giúp cô kiểm tra đúng chỗ em đang vướng.",
  isolates_competing_hypothesis:
    "Có hai chỗ em có thể đang vướng — câu này giúp phân biệt rõ.",
  verifies_target_readiness:
    "Em làm khá tốt rồi; câu này để chắc chắn em đã sẵn sàng.",
  covers_unobserved_skill: "Đây là phần em chưa làm câu nào.",
  distractors_attribute_error:
    "Cách em chọn sẽ cho cô biết em đang nghĩ theo hướng nào.",
  probes_dominant_misconception:
    "Câu này kiểm tra lại cách hiểu xuất hiện nhiều nhất trong bài của em.",
  follows_high_confidence_error:
    "Có câu em rất chắc chắn nhưng chưa đúng — mình cùng xem lại nhé.",
};

/** First recognised reason, so the student sees one clear sentence. */
export function probeReasonCopy(reasonCodes: string[]): string {
  for (const code of reasonCodes) {
    if (code in PROBE_REASON_COPY) {
      return PROBE_REASON_COPY[code];
    }
  }
  return "Hệ thống cần thêm một câu để hiểu em đang vướng ở đâu.";
}

/**
 * Progress is described by evidence sufficiency, never by a score or ranking
 * (blueprint §9.5) — hence "đã có đủ minh chứng" rather than "thành thạo".
 */
export const PROGRESS_STATE_COPY: Record<
  "sufficient_secure" | "sufficient_gap" | "emerging" | "insufficient",
  { label: string; tone: string }
> = {
  sufficient_secure: { label: "Đã đủ minh chứng", tone: "green" },
  sufficient_gap: { label: "Cần ôn thêm", tone: "pink" },
  emerging: { label: "Đang hình thành", tone: "cyan" },
  insufficient: { label: "Chưa đủ bài để kết luận", tone: "" },
};
