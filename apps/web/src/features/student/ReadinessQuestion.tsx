import { useState } from "react";

import type { AssessmentItemPublic } from "@/lib/adapters/student-types";

import {
  CONFIDENCE_LABELS,
  CONFIDENCE_LEVELS,
  confidenceLevelToValue,
  type ConfidenceLevel,
} from "./confidence";

export interface ReadinessQuestionProps {
  item: AssessmentItemPublic;
  index: number;
  total: number;
  variant: "readiness" | "probe";
  onSubmit: (itemId: string, responseLabel: string, confidence: number) => void;
  onSaveAndExit: () => void;
}

export function ReadinessQuestion({
  item,
  index,
  total,
  variant,
  onSubmit,
  onSaveAndExit,
}: ReadinessQuestionProps) {
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [confidenceLevel, setConfidenceLevel] =
    useState<ConfidenceLevel | null>(null);
  const [explanation, setExplanation] = useState("");

  const canSubmit = selectedLabel !== null && confidenceLevel !== null;

  function handleReadAloud(): void {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(item.stem));
    }
  }

  function handleSubmit(): void {
    if (!selectedLabel || !confidenceLevel) {
      return;
    }
    onSubmit(
      item.item_id,
      selectedLabel,
      confidenceLevelToValue(confidenceLevel),
    );
    setSelectedLabel(null);
    setConfidenceLevel(null);
    setExplanation("");
  }

  return (
    <article className="student-card" aria-label="Câu hỏi">
      <span className="student-pill teal">
        {variant === "probe"
          ? "Một câu để hiểu rõ hơn"
          : `Câu ${index + 1} / ${total}`}
      </span>
      {variant === "probe" && (
        <p>Hệ thống cần thêm một câu để hiểu em đang vướng ở đâu.</p>
      )}
      <div className="student-progress-track">
        <span
          className="student-progress-fill"
          style={{ width: `${Math.round(((index + 1) / total) * 100)}%` }}
        />
      </div>
      <h1>{item.stem}</h1>
      <div
        className="student-options"
        role="radiogroup"
        aria-label="Các lựa chọn"
      >
        {item.options.map((option, optionIndex) => (
          <button
            key={option.label}
            type="button"
            role="radio"
            aria-checked={selectedLabel === option.label}
            className={`student-option${selectedLabel === option.label ? " selected" : ""}`}
            onClick={() => setSelectedLabel(option.label)}
          >
            <span className="student-option-key">
              {String.fromCharCode(65 + optionIndex)}
            </span>
            {option.label}
          </button>
        ))}
      </div>

      <p style={{ fontWeight: 700 }}>
        Em chọn như vậy vì… (có thể viết rất ngắn)
      </p>
      <textarea
        className="student-textarea"
        value={explanation}
        onChange={(event) => setExplanation(event.target.value)}
        placeholder="Không bắt buộc"
        aria-label="Giải thích của em"
      />

      <p style={{ fontWeight: 700, marginTop: "0.75rem" }}>
        Em thấy câu này thế nào?
      </p>
      <div className="student-confidence">
        {CONFIDENCE_LEVELS.map((level) => (
          <button
            key={level}
            type="button"
            aria-pressed={confidenceLevel === level}
            className={confidenceLevel === level ? "selected" : ""}
            onClick={() => setConfidenceLevel(level)}
          >
            {CONFIDENCE_LABELS[level]}
          </button>
        ))}
      </div>

      <div className="student-support-row">
        <button
          type="button"
          className="student-text-btn"
          onClick={handleReadAloud}
        >
          🔊 Đọc câu hỏi
        </button>
        <button
          type="button"
          className="student-text-btn"
          onClick={onSaveAndExit}
        >
          Lưu và làm sau
        </button>
      </div>

      <p style={{ color: "var(--student-muted)", fontSize: "0.8rem" }}>
        Không báo đúng/sai ngay; hệ thống sẽ hỏi thêm nếu cần phân biệt nguyên
        nhân.
      </p>
      <button
        type="button"
        className="student-btn teal"
        disabled={!canSubmit}
        onClick={handleSubmit}
      >
        Gửi câu trả lời →
      </button>
    </article>
  );
}
