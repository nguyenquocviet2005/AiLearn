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

/** Curated Grade-7 inverse-proportion resources for the demo help panel. */
export interface StudyMaterial {
  title: string;
  kind: "video" | "ly_thuyet" | "bai_tap";
  url: string;
  blurb: string;
}

export const STUDY_MATERIALS: StudyMaterial[] = [
  {
    title: "Lý thuyết Đại lượng tỉ lệ nghịch (Toán 7)",
    kind: "ly_thuyet",
    url: "https://vietjack.com/toan-lop-7/bai-3-dai-luong-ti-le-nghich.jsp",
    blurb: "Định nghĩa xy = a, tính chất tích không đổi — bám SGK lớp 7.",
  },
  {
    title: "Biểu diễn quan hệ & tìm hệ số tỉ lệ nghịch",
    kind: "bai_tap",
    url: "https://www.vietjack.com/toan-lop-7/bieu-dien-quan-he-ti-le-nghich-va-xac-dinh-he-so-sm.jsp",
    blurb: "Ví dụ có lời giải + bài tự luyện tìm hệ số a.",
  },
  {
    title: "Chuyên đề Đại lượng tỉ lệ nghịch Toán 7",
    kind: "bai_tap",
    url: "https://thcs.toanmath.com/2023/08/chuyen-de-dai-luong-ti-le-nghich-toan-7.html",
    blurb: "Tóm tắt lý thuyết và các dạng bài thường gặp (41 trang).",
  },
  {
    title: "Video bài giảng tỉ lệ nghịch lớp 7",
    kind: "video",
    url: "https://www.youtube.com/results?search_query=%C4%90%E1%BA%A1i+l%C6%B0%E1%BB%A3ng+t%E1%BB%89+l%E1%BB%87+ngh%E1%BB%8Bch+l%E1%BB%9Bp+7",
    blurb: "Danh sách video YouTube bài giảng tỉ lệ nghịch lớp 7 (VietJack / các thầy cô).",
  },
];
