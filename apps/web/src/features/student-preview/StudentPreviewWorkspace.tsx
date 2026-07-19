import { useEffect, useReducer } from "react";

import type { StudentDiagnosticProfileV1 } from "@ailearn/schemas";

import { ExitTicket } from "@/features/student/ExitTicket";
import { RemediationPath } from "@/features/student/RemediationPath";
import { StudentHelp } from "@/features/student/StudentHelp";
import { StudentHome } from "@/features/student/StudentHome";
import { ReadinessQuestion } from "@/features/student/ReadinessQuestion";
import type { Stage } from "@/features/student/StudentWorkspace";
import "@/features/student/student.css";
import type {
  ExitTicketOutcome,
  RemediationAttemptOutcome,
  RemediationResponse,
  StartSessionResponse,
} from "@/lib/adapters/student-types";

import { MOCK_LESSON_ID, MOCK_PERSONAS } from "./mock-personas";
import { mockStudentRepository } from "./mock-repository";
import {
  initialPreviewState,
  previewReducer,
  type TabId,
} from "./workspace-machine";

const DEFAULT_PERSONA = MOCK_PERSONAS[0];

const studentNavigation: Array<{
  id: TabId;
  icon: string;
  label: string;
  shortLabel: string;
}> = [
  { id: "home", icon: "⌂", label: "Hôm nay", shortLabel: "Việc cần làm" },
  {
    id: "readiness",
    icon: "◷",
    label: "Bài của em",
    shortLabel: "Khoảng 5 phút",
  },
  {
    id: "path",
    icon: "↗",
    label: "Lộ trình của em",
    shortLabel: "Học từng bước",
  },
  { id: "help", icon: "?", label: "Trợ giúp", shortLabel: "Luôn sẵn sàng" },
];

function generateId(): string {
  return `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function describeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Đã có lỗi xảy ra. Vui lòng thử lại.";
}

/**
 * Design-review prototype of the redesigned student flow: same visual
 * style and screens as the real `/student` route, but backed entirely by
 * `mockStudentRepository` (in-memory, scripted personas — no `fetch`, no
 * backend) and driven by a `useReducer` state machine instead of the
 * current component's hand-rolled `Stage` transitions. Swapping
 * `mockStudentRepository` for a real repository is the only change needed
 * to wire this up once the backend rewrite lands.
 */
export function StudentPreviewWorkspace() {
  const [state, dispatch] = useReducer(
    previewReducer,
    initialPreviewState({
      id: DEFAULT_PERSONA.studentId,
      displayName: DEFAULT_PERSONA.displayName,
      personaId: DEFAULT_PERSONA.id,
    }),
  );
  const {
    activeTab,
    stage,
    currentStudent,
    personas,
    selectedPersonaId,
    busy,
    initialRepresentation,
  } = state;

  useEffect(() => {
    let active = true;
    void mockStudentRepository.listDemoPersonas().then((loaded) => {
      if (!active) {
        return;
      }
      dispatch({
        type: "PERSONAS_LOADED",
        personas: loaded,
        selectedPersonaId: currentStudent.personaId ?? loaded[0]?.id ?? "",
      });
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  async function startReadiness(): Promise<void> {
    dispatch({ type: "SET_BUSY", busy: true });
    try {
      const session = await mockStudentRepository.startReadinessSession(
        currentStudent.id,
        MOCK_LESSON_ID,
      );
      dispatch({ type: "READINESS_STARTED", session });
    } catch (error) {
      dispatch({ type: "ERROR", message: describeError(error) });
    } finally {
      dispatch({ type: "SET_BUSY", busy: false });
    }
  }

  async function diagnoseAndStartRemediation(): Promise<void> {
    dispatch({ type: "DIAGNOSING_STARTED" });
    try {
      const profile = await mockStudentRepository.getDiagnosticProfile(
        currentStudent.id,
        MOCK_LESSON_ID,
      );
      const remediation =
        await mockStudentRepository.startRemediationSession(profile);
      if (remediation.path.current_state === "CONFIRMATION") {
        const probeSession = await mockStudentRepository.startProbe(
          currentStudent.id,
          MOCK_LESSON_ID,
        );
        dispatch({ type: "PROBE_STARTED", remediation, profile, probeSession });
        return;
      }
      dispatch({ type: "REMEDIATION_RESOLVED", remediation, profile });
    } catch (error) {
      dispatch({ type: "ERROR", message: describeError(error) });
    }
  }

  async function submitReadinessAnswer(
    session: StartSessionResponse,
    currentIndex: number,
    itemId: string,
    responseLabel: string,
  ): Promise<void> {
    await mockStudentRepository.submitReadinessResponse(
      session.session_id,
      itemId,
      responseLabel,
      null,
    );
    const nextIndex = currentIndex + 1;
    dispatch({ type: "READINESS_ANSWERED", nextIndex });
    if (nextIndex >= session.items.length) {
      await diagnoseAndStartRemediation();
    }
  }

  async function resolveConfirmation(): Promise<void> {
    dispatch({ type: "DIAGNOSING_STARTED" });
    try {
      const refreshedProfile = await mockStudentRepository.getDiagnosticProfile(
        currentStudent.id,
        MOCK_LESSON_ID,
      );
      const evidenceSufficient =
        refreshedProfile.readiness_status !== "abstained";
      const confirmed = await mockStudentRepository.confirmEvidence(
        currentStudent.id,
        evidenceSufficient,
      );
      dispatch({
        type: "REMEDIATION_RESOLVED",
        remediation: confirmed,
        profile: refreshedProfile,
      });
    } catch (error) {
      dispatch({ type: "ERROR", message: describeError(error) });
    }
  }

  async function submitProbeAnswer(
    _profile: StudentDiagnosticProfileV1,
    _remediation: RemediationResponse,
    probeSession: StartSessionResponse,
    itemId: string,
    responseLabel: string,
  ): Promise<void> {
    await mockStudentRepository.submitReadinessResponse(
      probeSession.session_id,
      itemId,
      responseLabel,
      null,
    );
    await resolveConfirmation();
  }

  async function submitRemediationAttempt(
    profile: StudentDiagnosticProfileV1,
    stepId: string,
    outcome: RemediationAttemptOutcome,
  ): Promise<void> {
    const remediation = await mockStudentRepository.submitRemediationAttempt(
      currentStudent.id,
      stepId,
      generateId(),
      outcome.kind === "response" ? outcome.response : null,
      outcome.kind === "self_report" ? outcome.isCorrect : null,
    );
    dispatch({ type: "REMEDIATION_UPDATED", remediation, profile });
  }

  async function submitExitTicket(
    _profile: StudentDiagnosticProfileV1,
    ticketId: string,
    responseLabel: string,
  ): Promise<void> {
    dispatch({ type: "SET_BUSY", busy: true });
    try {
      const result = await mockStudentRepository.submitExitTicket(
        currentStudent.id,
        ticketId,
        responseLabel,
        generateId(),
      );
      dispatch({
        type: "EXIT_TICKET_RESULT",
        outcome: result.outcome,
        remediation: result.remediation,
      });
    } finally {
      dispatch({ type: "SET_BUSY", busy: false });
    }
  }

  function continueReclassifiedPath(): void {
    dispatch({ type: "CONTINUE_RECLASSIFIED" });
  }

  async function resetDemo(): Promise<void> {
    if (!selectedPersonaId) {
      return;
    }
    dispatch({ type: "SET_BUSY", busy: true });
    try {
      const reset = await mockStudentRepository.resetDemo(selectedPersonaId);
      const learner = {
        id: reset.persona.student_id,
        displayName: reset.persona.display_name,
        personaId: reset.persona.id,
      };
      const remediation = await mockStudentRepository.startRemediationSession(
        reset.persona.profile,
      );
      if (remediation.path.current_state === "CONFIRMATION") {
        const probeSession = await mockStudentRepository.startProbe(
          learner.id,
          MOCK_LESSON_ID,
        );
        dispatch({
          type: "DEMO_RESET_TO_PROBE",
          learner,
          remediation,
          profile: reset.persona.profile,
          probeSession,
        });
        return;
      }
      dispatch({
        type: "DEMO_RESET",
        learner,
        remediation,
        profile: reset.persona.profile,
      });
    } catch (error) {
      dispatch({ type: "ERROR", message: describeError(error) });
    } finally {
      dispatch({ type: "SET_BUSY", busy: false });
    }
  }

  return (
    <div className="student-shell">
      <a className="dashboard-skip-link" href="#student-main">
        Đi tới nội dung chính
      </a>
      <div className="student-layout">
        <aside className="student-sidebar" aria-label="Đồng hành học tập">
          <a
            className="dashboard-rail-brand"
            href="/student-preview"
            aria-label="AiLearn - trang chủ"
          >
            <span className="rail-firefly" aria-hidden="true">
              <img src="/brand/ailearn-mascot.webp" alt="" />
            </span>
            <span>AiLearn</span>
          </a>

          <div className="student-profile dashboard-rail-identity">
            <span className="student-avatar" aria-hidden="true">
              HS
            </span>
            <span className="student-identity">
              <b>{currentStudent.displayName}</b>
              <small>Toán 7A · Tiến từng bước, không xếp hạng</small>
            </span>
          </div>

          <nav className="student-nav" aria-label="Điều hướng học sinh">
            {studentNavigation.map((item) => (
              <button
                key={item.id}
                type="button"
                className={activeTab === item.id ? "active" : ""}
                aria-current={activeTab === item.id ? "page" : undefined}
                onClick={() =>
                  dispatch({ type: "SET_ACTIVE_TAB", tab: item.id })
                }
              >
                <span className="dashboard-nav-icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span>
                  <b>{item.label}</b>
                  <small>{item.shortLabel}</small>
                </span>
              </button>
            ))}
          </nav>

          <div className="student-rail-controls">
            <div className="student-demo-reset">
              <select
                aria-label="Tình huống mẫu"
                value={selectedPersonaId}
                disabled={busy}
                onChange={(event) =>
                  dispatch({
                    type: "SELECT_PERSONA",
                    personaId: event.target.value,
                  })
                }
              >
                {personas.map((persona) => (
                  <option key={persona.id} value={persona.id}>
                    {persona.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="student-reset"
                disabled={busy}
                onClick={() => void resetDemo()}
              >
                Đặt lại
              </button>
            </div>
            <button
              type="button"
              className="student-sync online"
              disabled
              title="Bản xem trước dùng dữ liệu mẫu, không kết nối máy chủ."
            >
              <span className="student-sync-icon" aria-hidden="true">
                ↻
              </span>
              <span className="student-sync-dot" aria-hidden="true" />
              <span>Bản xem trước · dữ liệu mẫu</span>
            </button>
          </div>

          <div className="student-companion">
            <span className="companion-presence">
              <img src="/brand/ailearn-mascot.webp" alt="" />
            </span>
            <div>
              <strong>Em không học một mình</strong>
              <p>AiLearn sẽ đổi cách giải thích khi em cần.</p>
            </div>
          </div>
        </aside>

        <main id="student-main" className="student-main">
          <div className="student-page-context">
            <div>
              <span className="student-kicker">
                Không gian học tập (bản xem trước)
              </span>
              <strong>
                {studentNavigation.find((item) => item.id === activeTab)?.label}
              </strong>
            </div>
            <span className="student-page-meta">
              <b>{currentStudent.displayName}</b>
              <small>Toán 7A</small>
            </span>
          </div>

          {activeTab === "home" && (
            <StudentHome
              stage={stage}
              busy={busy}
              onStart={() => void startReadiness()}
              onContinue={(tab) => dispatch({ type: "SET_ACTIVE_TAB", tab })}
            />
          )}

          {activeTab === "readiness" && (
            <ReadinessSection
              stage={stage}
              onAnswer={(session, currentIndex, itemId, label) =>
                void submitReadinessAnswer(session, currentIndex, itemId, label)
              }
              onProbeAnswer={(
                profile,
                remediation,
                probeSession,
                itemId,
                label,
              ) =>
                void submitProbeAnswer(
                  profile,
                  remediation,
                  probeSession,
                  itemId,
                  label,
                )
              }
              onSaveAndExit={() =>
                dispatch({ type: "SET_ACTIVE_TAB", tab: "home" })
              }
            />
          )}

          {activeTab === "path" && (
            <RemediationSection
              stage={stage}
              initialRepresentation={initialRepresentation}
              onAttempt={(profile, stepId, outcome) =>
                void submitRemediationAttempt(profile, stepId, outcome)
              }
              onExitTicket={(profile, ticketId, responseLabel) =>
                void submitExitTicket(profile, ticketId, responseLabel)
              }
              onContinueReclassifiedPath={continueReclassifiedPath}
              busy={busy}
            />
          )}

          {activeTab === "help" && <StudentHelp stage={stage} />}
        </main>
      </div>
    </div>
  );
}

function ReadinessSection({
  stage,
  onAnswer,
  onProbeAnswer,
  onSaveAndExit,
}: {
  stage: Stage;
  onAnswer: (
    session: StartSessionResponse,
    currentIndex: number,
    itemId: string,
    responseLabel: string,
  ) => void;
  onProbeAnswer: (
    profile: StudentDiagnosticProfileV1,
    remediation: RemediationResponse,
    probeSession: StartSessionResponse,
    itemId: string,
    responseLabel: string,
  ) => void;
  onSaveAndExit: () => void;
}) {
  if (stage.kind === "readiness") {
    return (
      <ReadinessQuestion
        item={stage.session.items[stage.currentIndex]}
        index={stage.currentIndex}
        total={stage.session.items.length}
        variant="readiness"
        onSubmit={(itemId, label) =>
          onAnswer(stage.session, stage.currentIndex, itemId, label)
        }
        onSaveAndExit={onSaveAndExit}
      />
    );
  }
  if (stage.kind === "probe") {
    return (
      <ReadinessQuestion
        item={stage.probeSession.items[0]}
        index={0}
        total={1}
        variant="probe"
        onSubmit={(itemId, label) =>
          onProbeAnswer(
            stage.profile,
            stage.remediation,
            stage.probeSession,
            itemId,
            label,
          )
        }
        onSaveAndExit={onSaveAndExit}
      />
    );
  }
  if (stage.kind === "diagnosing") {
    return (
      <div className="student-card" aria-live="polite">
        <p>Đang xem xét câu trả lời của em...</p>
      </div>
    );
  }
  if (stage.kind === "error") {
    return (
      <div className="student-card" role="alert">
        <p>{stage.message}</p>
      </div>
    );
  }
  return (
    <div className="student-card">
      <p>Hãy bắt đầu từ tab &quot;Hôm nay&quot; để làm bài chuẩn bị.</p>
    </div>
  );
}

function RemediationSection({
  stage,
  initialRepresentation,
  onAttempt,
  onExitTicket,
  onContinueReclassifiedPath,
  busy,
}: {
  stage: Stage;
  initialRepresentation: string | null;
  onAttempt: (
    profile: StudentDiagnosticProfileV1,
    stepId: string,
    outcome: RemediationAttemptOutcome,
  ) => void;
  onExitTicket: (
    profile: StudentDiagnosticProfileV1,
    ticketId: string,
    responseLabel: string,
  ) => void;
  onContinueReclassifiedPath: () => void;
  busy: boolean;
}) {
  if (stage.kind === "remediation") {
    return (
      <RemediationPath
        remediation={stage.remediation}
        initialRepresentation={initialRepresentation}
        onAttempt={(stepId, outcome) =>
          onAttempt(stage.profile, stepId, outcome)
        }
      />
    );
  }
  if (stage.kind === "exit-ticket") {
    if (!stage.remediation.exit_ticket) {
      return (
        <div className="student-card" role="alert">
          <p>Chưa tải được bài cuối.</p>
        </div>
      );
    }
    return (
      <ExitTicket
        ticket={stage.remediation.exit_ticket}
        busy={busy}
        onSubmit={(ticketId, responseLabel) =>
          onExitTicket(stage.profile, ticketId, responseLabel)
        }
      />
    );
  }
  if (stage.kind === "exit-ticket-result") {
    const outcome: ExitTicketOutcome = stage.outcome;
    return (
      <article className="student-card">
        <span className="student-pill teal">Kết quả</span>
        <h1>{outcome.message}</h1>
        {stage.nextProfile && (
          <button
            type="button"
            className="student-btn primary"
            onClick={onContinueReclassifiedPath}
          >
            Tiếp tục bài phù hợp →
          </button>
        )}
      </article>
    );
  }
  if (stage.kind === "diagnosing") {
    return (
      <div className="student-card" aria-live="polite">
        <p>Đang chuẩn bị lộ trình học tập của em...</p>
      </div>
    );
  }
  return (
    <div className="student-card">
      <p>Lộ trình sẽ xuất hiện sau khi em hoàn thành bài chuẩn bị.</p>
    </div>
  );
}
