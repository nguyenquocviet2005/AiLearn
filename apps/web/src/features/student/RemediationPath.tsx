import { useEffect, useState } from "react";

import type {
  RemediationAttemptOutcome,
  RemediationResponse,
} from "@/lib/adapters/student-types";

import {
  checkpointVerdictCopy,
  escalationReasonCopy,
  REPRESENTATION_LABELS,
  STATE_COPY,
  STEP_KIND_COPY,
  STUDY_MATERIALS,
} from "./copy";
import { MarkdownLite } from "./markdown-lite";

export interface RemediationPathProps {
  remediation: RemediationResponse;
  initialRepresentation: string | null;
  pathNotice?: string | null;
  onAttempt: (stepId: string, outcome: RemediationAttemptOutcome) => void;
}

export function RemediationPath({
  remediation,
  initialRepresentation,
  pathNotice = null,
  onAttempt,
}: RemediationPathProps) {
  const [answer, setAnswer] = useState("");
  const [selfReport, setSelfReport] = useState<boolean | null>(null);

  const {
    path,
    content,
    current_step_kind: currentStepKind,
    escalation_reason: escalationReason,
    last_attempt_correct: lastAttemptCorrect,
  } = remediation;
  const stateCopy = STATE_COPY[path.current_state];
  const currentStep = path.steps.find((step) => step.kind === currentStepKind);
  const representationChanged =
    initialRepresentation !== null &&
    initialRepresentation !== path.representation;
  const hasGradableCheckpoint = content.is_gradable;
  const restartedAfterWrong =
    lastAttemptCorrect === false && currentStepKind === "worked_example";

  // Reset local answer UI whenever the visible step changes — including when
  // the state machine restarts worked_example under a new representation while
  // reusing the same fallback template_id (which used to leave buttons stuck).
  useEffect(() => {
    setAnswer("");
    setSelfReport(null);
  }, [
    content.template_id,
    currentStepKind,
    path.representation,
    currentStep?.id,
  ]);

  function handleGradedSubmit(): void {
    if (!currentStep) {
      return;
    }
    onAttempt(currentStep.id, { kind: "response", response: answer });
    setAnswer("");
  }

  function handleSelfReportSubmit(isCorrect: boolean): void {
    if (!currentStep) {
      return;
    }
    setSelfReport(isCorrect);
    onAttempt(currentStep.id, { kind: "self_report", isCorrect });
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
        <StudyMaterialsPanel />
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
        <StudyMaterialsPanel compact />
      </aside>

      <article className="student-card student-learning-card">
        {pathNotice && (
          <div className="student-path-notice" role="status">
            {pathNotice}
          </div>
        )}
        {lastAttemptCorrect !== undefined && (
          <div className="student-representation-note">
            {checkpointVerdictCopy(lastAttemptCorrect)}
          </div>
        )}
        {restartedAfterWrong && (
          <div className="student-representation-note">
            Em chưa nắm vững tình huống mới. Mình xem lại ví dụ theo cách khác
            trước khi thử lại nhé.
          </div>
        )}
        {representationChanged && (
          <div className="student-representation-note">
            Đã đổi sang{" "}
            {REPRESENTATION_LABELS[path.representation] ?? path.representation}
          </div>
        )}
        <span className="student-pill">{STEP_KIND_COPY[currentStepKind]}</span>
        <h2>{content.title}</h2>
        <div data-representation={content.representation}>
          <MarkdownLite text={content.body} />
        </div>

        {content.checkpoint_question && (
          <>
            <p className="student-field-label student-field-label-spaced">
              {hasGradableCheckpoint
                ? "Câu hỏi kiểm tra"
                : "Em đã theo dõi được ví dụ này chưa?"}
            </p>
            <p className="student-question-note">
              {content.checkpoint_question}
            </p>
            {hasGradableCheckpoint ? (
              <div className="student-answer-form">
                <input
                  className="student-textarea"
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  aria-label="Câu trả lời của em"
                  placeholder="Nhập đáp án của em, ví dụ: 6 hoặc 36, 24, 18"
                />
                <button
                  type="button"
                  className="student-btn teal"
                  disabled={answer.trim().length === 0}
                  onClick={handleGradedSubmit}
                >
                  Kiểm tra <span aria-hidden="true">→</span>
                </button>
              </div>
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
                  Đã hiểu, tiếp tục
                </button>
                <button
                  type="button"
                  className="student-btn"
                  onClick={() => handleSelfReportSubmit(false)}
                  disabled={selfReport !== null}
                >
                  Chưa hiểu, xem lại
                </button>
              </div>
            )}
          </>
        )}
      </article>
    </div>
  );
}

function StudyMaterialsPanel({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={
        compact ? "student-study-materials compact" : "student-study-materials"
      }
      aria-label="Tài liệu gợi ý"
    >
      <strong>Tài liệu gợi ý cho điểm yếu này</strong>
      {!compact && (
        <p>
          Sau khi xác định chỗ em đang vướng, em có thể xem lại lý thuyết hoặc
          video trước khi làm tiếp.
        </p>
      )}
      <ul>
        {STUDY_MATERIALS.map((material) => (
          <li key={material.url}>
            <a href={material.url} target="_blank" rel="noreferrer">
              {material.kind === "video"
                ? "Video"
                : material.kind === "ly_thuyet"
                  ? "Lý thuyết"
                  : "Bài tập"}
              {" · "}
              {material.title}
            </a>
            {!compact && <small>{material.blurb}</small>}
          </li>
        ))}
      </ul>
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
