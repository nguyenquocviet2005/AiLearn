import { useState } from "react";

import type { RemediationResponse } from "@/lib/adapters/student-types";

import {
  escalationReasonCopy,
  REPRESENTATION_LABELS,
  STATE_COPY,
  STEP_KIND_COPY,
} from "./copy";

export interface RemediationPathProps {
  remediation: RemediationResponse;
  initialRepresentation: string | null;
  /**
   * Submit one attempt. A gradable step sends the typed answer for the server
   * to grade; a self-report step sends the student's own judgement.
   */
  onAttempt: (
    stepId: string,
    outcome: { response?: string; isCorrect?: boolean },
  ) => void;
}

export function RemediationPath({
  remediation,
  initialRepresentation,
  onAttempt,
}: RemediationPathProps) {
  const [answer, setAnswer] = useState("");
  const [selfReport, setSelfReport] = useState<boolean | null>(null);

  const {
    path,
    content,
    grading,
    current_step_kind: currentStepKind,
    escalation_reason: escalationReason,
  } = remediation;
  const stateCopy = STATE_COPY[path.current_state];
  const currentStep = path.steps.find((step) => step.kind === currentStepKind);
  const representationChanged =
    initialRepresentation !== null &&
    initialRepresentation !== path.representation;

  function handleGradedSubmit(): void {
    if (!currentStep) {
      return;
    }
    // Correctness is decided on the server: the answer key never reaches here.
    onAttempt(currentStep.id, { response: answer });
    setAnswer("");
  }

  function handleSelfReportSubmit(isCorrect: boolean): void {
    if (!currentStep) {
      return;
    }
    setSelfReport(isCorrect);
    onAttempt(currentStep.id, { isCorrect });
  }

  if (remediation.is_complete) {
    return (
      <article className="student-card student-status-card complete">
        <span className="student-status-icon" aria-hidden="true">
          ✓
        </span>
        <span className="student-pill teal">Hoàn thành</span>
        <h1>Em đã hoàn thành lộ trình hôm nay!</h1>
        <p>Cô sẽ xem lại cùng em ở buổi học tiếp theo. Làm tốt lắm!</p>
        <StepList steps={path.steps} currentKind={currentStepKind} />
      </article>
    );
  }

  if (path.current_state === "TEACHER_ESCALATION") {
    return (
      <article className="student-card student-status-card support">
        <span className="student-status-icon" aria-hidden="true">
          ?
        </span>
        <span className="student-pill">{stateCopy.title}</span>
        <h1>{escalationReasonCopy(escalationReason)}</h1>
        <p>{stateCopy.description}</p>
      </article>
    );
  }

  return (
    <div className="student-path-layout">
      <aside className="student-path-progress">
        <span className="student-pill indigo">{stateCopy.title}</span>
        <h2>Lộ trình từng bước</h2>
        <p>{stateCopy.description}</p>
        <StepList steps={path.steps} currentKind={currentStepKind} />
      </aside>

      <article className="student-card student-learning-card">
        {representationChanged && (
          <div className="student-representation-note">
            Đã đổi sang{" "}
            {REPRESENTATION_LABELS[path.representation] ?? path.representation}
          </div>
        )}
        <span className="student-pill">{STEP_KIND_COPY[currentStepKind]}</span>
        <h2>{content.title}</h2>
        <div data-representation={content.representation}>
          <p>{content.body}</p>
        </div>

        {grading?.graded && (
          <div
            className={`student-feedback${grading.is_correct ? " correct" : ""}`}
            role="status"
            aria-live="polite"
          >
            {grading.is_correct
              ? "Chính xác! Em làm đúng bước này."
              : "Chưa đúng. Mình cùng xem lại theo cách khác nhé."}
          </div>
        )}

        {content.checkpoint_question && (
          <>
            <p className="student-field-label student-field-label-spaced">
              {content.checkpoint_question}
            </p>
            {content.is_gradable ? (
              <>
                <input
                  className="student-textarea"
                  style={{ minHeight: "auto" }}
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  aria-label="Câu trả lời của em"
                />
                <button
                  type="button"
                  className="student-btn teal"
                  disabled={answer.trim().length === 0}
                  onClick={handleGradedSubmit}
                >
                  Kiểm tra <span aria-hidden="true">→</span>
                </button>
              </>
            ) : (
              <div
                className="student-support-row"
                role="group"
                aria-label="Tự đánh giá"
              >
                <button
                  type="button"
                  className="student-btn teal"
                  onClick={() => handleSelfReportSubmit(true)}
                  disabled={selfReport !== null}
                >
                  Em làm đúng
                </button>
                <button
                  type="button"
                  className="student-btn"
                  onClick={() => handleSelfReportSubmit(false)}
                  disabled={selfReport !== null}
                >
                  Em cần giúp thêm
                </button>
              </div>
            )}
          </>
        )}
      </article>
    </div>
  );
}

function StepList({
  steps,
  currentKind,
}: {
  steps: RemediationResponse["path"]["steps"];
  currentKind: RemediationResponse["current_step_kind"];
}) {
  return (
    <div className="student-step-list" aria-label="Các bước của lộ trình">
      {steps.map((step) => {
        const status = step.completed
          ? "done"
          : step.kind === currentKind
            ? "current"
            : "";
        return (
          <div key={step.id} className={`student-step-row ${status}`.trim()}>
            <span className="student-step-marker">
              {step.completed ? "✓" : ""}
            </span>
            <span>{STEP_KIND_COPY[step.kind]}</span>
          </div>
        );
      })}
    </div>
  );
}
