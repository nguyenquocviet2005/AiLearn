import { useEffect, useState } from "react";

import type { StudentDiagnosticProfileV1 } from "@ailearn/schemas";

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
} from "./copy";
import { MarkdownLite } from "./markdown-lite";
import { RootCauseGraph } from "./RootCauseGraph";
import { StudyMaterialsPanel } from "./StudyMaterials";

export interface RemediationPathProps {
  remediation: RemediationResponse;
  profile: StudentDiagnosticProfileV1;
  initialRepresentation: string | null;
  pathNotice?: string | null;
  onAttempt: (stepId: string, outcome: RemediationAttemptOutcome) => void;
}

export function RemediationPath({
  remediation,
  profile,
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
      <div className="student-path-stack">
        <RootCauseGraph profile={profile} />
        <article className="student-card student-status-card complete">
          <span className="student-status-icon" aria-hidden="true">
            ✓
          </span>
          <span className="student-pill teal">Hoàn thành</span>
          <h1>Em đã hoàn thành lộ trình hôm nay!</h1>
          <p>Cô sẽ xem lại cùng em ở buổi học tiếp theo. Làm tốt lắm!</p>
          <StepList steps={path.steps} currentKind={currentStepKind} />
        </article>
      </div>
    );
  }

  if (path.current_state === "TEACHER_ESCALATION") {
    return (
      <div className="student-path-stack">
        <RootCauseGraph profile={profile} />
        <article className="student-card student-status-card support">
          <span className="student-status-icon" aria-hidden="true">
            ?
          </span>
          <span className="student-pill">{stateCopy.title}</span>
          <h1>{escalationReasonCopy(escalationReason)}</h1>
          <p>{stateCopy.description}</p>
          <StudyMaterialsPanel />
        </article>
      </div>
    );
  }

  return (
    <div className="student-path-stack">
      <RootCauseGraph profile={profile} />

      <section
        className="student-panel student-practice-panel"
        aria-label="Luyện tập"
      >
        <div className="student-panel-heading">
          <div>
            <span>Phần luyện tập</span>
            <h2>{stateCopy.title}</h2>
          </div>
          <span className="student-count-badge">
            {path.steps.filter((step) => step.completed).length}/
            {path.steps.length} bước
          </span>
        </div>
        <p className="student-panel-lead">{stateCopy.description}</p>

        <div className="student-path-layout">
          <aside className="student-path-progress">
            <span className="student-pill indigo">Các bước luyện</span>
            <h3>Tiến trình luyện tập</h3>
            <StepList steps={path.steps} currentKind={currentStepKind} />
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
                Em chưa nắm vững tình huống mới. Mình xem lại ví dụ theo cách
                khác trước khi thử lại nhé.
              </div>
            )}
            {representationChanged && (
              <div className="student-representation-note">
                Đã đổi sang{" "}
                {REPRESENTATION_LABELS[path.representation] ??
                  path.representation}
              </div>
            )}
            <span className="student-pill">
              {STEP_KIND_COPY[currentStepKind]}
            </span>
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
      </section>
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
    <div className="student-step-list" aria-label="Các bước luyện tập">
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
