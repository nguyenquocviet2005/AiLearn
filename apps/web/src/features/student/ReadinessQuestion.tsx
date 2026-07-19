import { useState } from "react";

import type { AssessmentItemPublic } from "@/lib/adapters/student-types";

export interface ReadinessQuestionProps {
  item: AssessmentItemPublic;
  index: number;
  total: number;
  variant: "readiness" | "probe";
  onSubmit: (itemId: string, responseLabel: string) => void;
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

  const canSubmit = selectedLabel !== null;

  function handleReadAloud(): void {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(item.stem));
    }
  }

  function handleSubmit(): void {
    if (!selectedLabel) {
      return;
    }
    onSubmit(item.item_id, selectedLabel);
    setSelectedLabel(null);
  }

  return (
    <article
      className="student-card student-question-card"
      aria-label="Câu hỏi"
    >
      <div className="student-question-meta">
        <span className="student-pill teal">
          {variant === "probe"
            ? "Một câu để hiểu rõ hơn"
            : `Câu ${index + 1} / ${total}`}
        </span>
        <span>{Math.round(((index + 1) / total) * 100)}% hoàn thành</span>
      </div>
      {variant === "probe" && (
        <p>Hệ thống cần thêm một câu để hiểu em đang vướng ở đâu.</p>
      )}
      <div className="student-progress-track">
        <span
          className="student-progress-fill"
          style={{ width: `${Math.round(((index + 1) / total) * 100)}%` }}
        />
      </div>
      <h1 className="student-question-title">{item.stem}</h1>
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

      <div className="student-support-row">
        <button
          type="button"
          className="student-text-btn"
          onClick={handleReadAloud}
        >
          <span aria-hidden="true">◖</span>
          Đọc câu hỏi
        </button>
        <button
          type="button"
          className="student-text-btn"
          onClick={onSaveAndExit}
        >
          <span aria-hidden="true">↓</span>
          Lưu và làm sau
        </button>
      </div>

      <p className="student-question-note">
        Không báo đúng/sai ngay; hệ thống sẽ hỏi thêm nếu cần phân biệt nguyên
        nhân.
      </p>
      <button
        type="button"
        className="student-btn teal"
        disabled={!canSubmit}
        onClick={handleSubmit}
      >
        Gửi câu trả lời <span aria-hidden="true">→</span>
      </button>
    </article>
  );
}
