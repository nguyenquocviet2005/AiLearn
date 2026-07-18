import type { OutcomeKind } from "@ailearn/schemas";

const skillLabels: Record<string, string> = {
  skill_ratio_proportion_basics: "Tỉ số và tỉ lệ thức",
  skill_fraction_multiplication: "Nhân chia số hữu tỉ",
  skill_direct_proportion: "Đại lượng tỉ lệ thuận",
  skill_inverse_proportion_definition: "Định nghĩa đại lượng tỉ lệ nghịch",
  skill_find_constant_k: "Tìm hệ số tỉ lệ k",
  skill_solve_unknown_value: "Tìm giá trị chưa biết",
  skill_distinguish_direct_inverse: "Phân biệt tỉ lệ thuận và tỉ lệ nghịch",
  skill_verify_inverse_by_product: "Kiểm tra tỉ lệ nghịch bằng tích",
  skill_equal_ratios_property: "Tính chất dãy tỉ số bằng nhau",
  skill_word_problem_work_rate: "Bài toán năng suất và thời gian",
  skill_word_problem_speed_distance: "Bài toán vận tốc và thời gian",
  skill_multistep_reasoning: "Suy luận nhiều bước",
};

export const outcomeLabels: Record<OutcomeKind, string> = {
  passed_transfer: "Đã vận dụng độc lập",
  still_struggling: "Vẫn cần hỗ trợ",
  root_cause_reclassified: "Đã xác định lại nguyên nhân gốc",
  incomplete: "Chưa hoàn thành",
  teacher_escalation: "Cần giáo viên can thiệp",
};

export function skillLabel(skillId: string): string {
  return (
    skillLabels[skillId] ?? skillId.replace(/^skill_/, "").replaceAll("_", " ")
  );
}

export function teacherFacingText(value: string): string {
  return Object.entries(skillLabels)
    .reduce(
      (localized, [skillId, label]) => localized.replaceAll(skillId, label),
      value,
    )
    .replaceAll("+", " và ");
}

export function interventionNeedLabel(value: string): string {
  if (value.startsWith("repair:")) {
    return `Củng cố: ${skillLabel(value.slice("repair:".length))}`;
  }
  const labels: Record<string, string> = {
    "mixed_repair:teacher_station": "Trạm giáo viên: củng cố kết hợp",
    "extension:target_transfer": "Vận dụng và mở rộng",
    "confirmation:insufficient_evidence": "Xác nhận thêm bằng chứng",
  };
  return labels[value] ?? value.replaceAll("_", " ");
}

export function learnerLabel(studentId: string): string {
  const sequence = studentId.match(/(\d+)$/)?.[1];
  return sequence ? `Học sinh ${sequence}` : studentId;
}

export function planStatusLabel(value: string): string {
  const labels: Record<string, string> = {
    draft: "Bản nháp",
    edited: "Đã chỉnh sửa",
    approved: "Đã phê duyệt",
    pending: "Chờ quyết định",
    rejected: "Đã từ chối",
    published: "Đã xuất bản",
  };
  return labels[value] ?? value.replaceAll("_", " ");
}

export type PriorityMetrics = {
  affected: number;
  diagnosed: number;
  impactPercent: number;
  urgencyPercent: number;
};

export function priorityMetrics(rationale: string): PriorityMetrics | null {
  const prevalence = rationale.match(/prevalence=[\d.]+ \((\d+)\/(\d+)\)/);
  const impact = rationale.match(/downstream_impact=([\d.]+)/);
  const urgency = rationale.match(/lesson_urgency=([\d.]+)/);
  if (!prevalence || !impact || !urgency) return null;
  return {
    affected: Number(prevalence[1]),
    diagnosed: Number(prevalence[2]),
    impactPercent: Math.round(Number(impact[1]) * 100),
    urgencyPercent: Math.round(Number(urgency[1]) * 100),
  };
}

export function priorityExplanation(rationale: string): string {
  const metrics = priorityMetrics(rationale);
  if (!metrics) return rationale;
  return `${metrics.affected}/${metrics.diagnosed} học sinh · ảnh hưởng ${metrics.impactPercent}% chuỗi tiên quyết · mức cấp thiết ${metrics.urgencyPercent}%`;
}
