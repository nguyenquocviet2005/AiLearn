import { useEffect, useState } from "react";

import type { StudentDiagnosticProfileV1 } from "@ailearn/schemas";

import { AppHeader } from "@/components/navigation/AppHeader";

import {
  httpStudentRepository,
  type StudentRepository,
} from "@/lib/adapters/student-repository";
import type {
  DemoPersonaSummary,
  ExitTicketOutcome,
  ExitTicketResponse,
  RemediationResponse,
  StartSessionResponse,
} from "@/lib/adapters/student-types";
import {
  clearCache,
  readFromCache,
  saveToCache,
} from "@/lib/offline/content-cache";
import {
  clearAll,
  enqueue,
  generateAttemptId,
  listAll,
} from "@/lib/offline/queue";
import { flush, onSyncChange, setupAutoSync } from "@/lib/offline/sync";

import "./student.css";

import { DemoReset } from "./DemoReset";
import { ExitTicket } from "./ExitTicket";
import { RemediationPath } from "./RemediationPath";
import { StudentHelp } from "./StudentHelp";
import { StudentHome } from "./StudentHome";
import { ReadinessQuestion } from "./ReadinessQuestion";

export const DEMO_STUDENT_ID = "stu_g7_001";
export const DEMO_LESSON_ID = "lesson_g7_inverse_proportion_01";
export const DEMO_STUDENT_NAME = "Học sinh 001";

type TabId = "home" | "readiness" | "path" | "help";

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

export type Stage =
  | { kind: "idle" }
  | { kind: "readiness"; session: StartSessionResponse; currentIndex: number }
  | { kind: "waiting-to-sync"; session: StartSessionResponse }
  | { kind: "diagnosing" }
  | {
      kind: "probe";
      remediation: RemediationResponse;
      profile: StudentDiagnosticProfileV1;
      probeSession: StartSessionResponse;
    }
  | {
      kind: "probe-waiting-to-sync";
      remediation: RemediationResponse;
      profile: StudentDiagnosticProfileV1;
    }
  | {
      kind: "remediation";
      remediation: RemediationResponse;
      profile: StudentDiagnosticProfileV1;
    }
  | { kind: "complete"; remediation: RemediationResponse }
  | {
      kind: "exit-ticket";
      remediation: RemediationResponse;
      profile: StudentDiagnosticProfileV1;
    }
  | {
      kind: "exit-ticket-pending";
      remediation: RemediationResponse;
      profile: StudentDiagnosticProfileV1;
      submissionId: string;
    }
  | {
      kind: "exit-ticket-result";
      remediation: RemediationResponse;
      outcome: ExitTicketOutcome;
      nextProfile: StudentDiagnosticProfileV1 | null;
    }
  | { kind: "error"; message: string };

function readinessCacheKey(studentId: string): string {
  return `readiness-progress:${studentId}`;
}

function remediationCacheKey(studentId: string): string {
  return `remediation-progress:${studentId}`;
}

interface CachedReadiness {
  session: StartSessionResponse;
  currentIndex: number;
}

interface CachedRemediation {
  remediation: RemediationResponse;
  profile: StudentDiagnosticProfileV1;
  exitTicketResult?: ExitTicketResponse;
  exitTicketPending?: { submissionId: string };
}

export interface StudentWorkspaceProps {
  studentId?: string;
  lessonId?: string;
  repository?: StudentRepository;
}

export function StudentWorkspace({
  studentId = DEMO_STUDENT_ID,
  lessonId = DEMO_LESSON_ID,
  repository = httpStudentRepository,
}: StudentWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [stage, setStage] = useState<Stage>({ kind: "idle" });
  const [currentStudent, setCurrentStudent] = useState({
    id: studentId,
    displayName: DEMO_STUDENT_NAME,
  });
  const [personas, setPersonas] = useState<DemoPersonaSummary[]>([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState("");
  const [pendingCount, setPendingCount] = useState(0);
  const [busy, setBusy] = useState(false);
  // First-seen representation for this remediation path, so the UI can show a
  // "representation changed" note (AC6) after a failed attempt switches it.
  const [initialRepresentation, setInitialRepresentation] = useState<
    string | null
  >(null);

  function markRemediationSeen(remediation: RemediationResponse): void {
    setInitialRepresentation(
      (current) => current ?? remediation.path.representation,
    );
  }

  // Resume after a reload / simulated network interruption: prefer the most
  // advanced cached progress (remediation over readiness) rather than starting over.
  useEffect(() => {
    const cachedRemediation = readFromCache<CachedRemediation>(
      remediationCacheKey(studentId),
    );
    if (cachedRemediation) {
      markRemediationSeen(cachedRemediation.remediation);
      if (cachedRemediation.exitTicketResult) {
        setStage({
          kind: "exit-ticket-result",
          remediation: cachedRemediation.exitTicketResult.remediation,
          outcome: cachedRemediation.exitTicketResult.outcome,
          nextProfile:
            cachedRemediation.exitTicketResult.outcome.reclassified_profile,
        });
        return;
      }
      if (cachedRemediation.exitTicketPending) {
        setStage({
          kind: "exit-ticket-pending",
          remediation: cachedRemediation.remediation,
          profile: cachedRemediation.profile,
          submissionId: cachedRemediation.exitTicketPending.submissionId,
        });
        return;
      }
      setStage(
        cachedRemediation.remediation.is_complete
          ? {
              kind: "exit-ticket",
              remediation: cachedRemediation.remediation,
              profile: cachedRemediation.profile,
            }
          : {
              kind: "remediation",
              remediation: cachedRemediation.remediation,
              profile: cachedRemediation.profile,
            },
      );
      return;
    }
    const cachedReadiness = readFromCache<CachedReadiness>(
      readinessCacheKey(studentId),
    );
    if (
      cachedReadiness &&
      cachedReadiness.currentIndex < cachedReadiness.session.items.length
    ) {
      setStage({
        kind: "readiness",
        session: cachedReadiness.session,
        currentIndex: cachedReadiness.currentIndex,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  useEffect(() => {
    let active = true;
    void repository
      .listDemoPersonas()
      .then((availablePersonas) => {
        if (!active) {
          return;
        }
        setPersonas(availablePersonas);
        setSelectedPersonaId(availablePersonas[0]?.id ?? "");
      })
      .catch(() => {
        // The existing student flow stays usable when the optional demo API is offline.
      });
    return () => {
      active = false;
    };
  }, [repository]);

  useEffect(() => {
    setPendingCount((current) => current); // seed with current value on mount
    const unsubscribe = onSyncChange(setPendingCount);
    const teardown = setupAutoSync(repository);
    return () => {
      unsubscribe();
      teardown();
    };
  }, [repository]);

  // Once a delayed sync catches up, move a waiting stage forward automatically.
  useEffect(() => {
    if (stage.kind === "waiting-to-sync" && pendingCount === 0) {
      void diagnoseAndStartRemediation();
    }
    if (stage.kind === "probe-waiting-to-sync" && pendingCount === 0) {
      void resolveConfirmation();
    }
    if (stage.kind === "exit-ticket-pending" && pendingCount === 0) {
      finalizeQueuedExitTicket(stage.profile, stage.submissionId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingCount, stage.kind]);

  async function startReadiness(): Promise<void> {
    setBusy(true);
    setStage({ kind: "idle" });
    try {
      const session = await repository.startReadinessSession(
        currentStudent.id,
        lessonId,
      );
      saveToCache(readinessCacheKey(currentStudent.id), {
        session,
        currentIndex: 0,
      });
      setStage({ kind: "readiness", session, currentIndex: 0 });
      setActiveTab("readiness");
    } catch (error) {
      setStage({ kind: "error", message: describeError(error) });
    } finally {
      setBusy(false);
    }
  }

  async function submitReadinessAnswer(
    session: StartSessionResponse,
    currentIndex: number,
    itemId: string,
    responseLabel: string,
    confidence: number,
  ): Promise<void> {
    enqueue("DIAGNOSTIC_RESPONSE", {
      sessionId: session.session_id,
      itemId,
      responseLabel,
      confidence,
    });
    const nextIndex = currentIndex + 1;

    if (nextIndex < session.items.length) {
      saveToCache(readinessCacheKey(currentStudent.id), {
        session,
        currentIndex: nextIndex,
      });
      setStage({ kind: "readiness", session, currentIndex: nextIndex });
      void flush(repository);
      return;
    }

    saveToCache(readinessCacheKey(currentStudent.id), {
      session,
      currentIndex: nextIndex,
    });
    setStage({ kind: "waiting-to-sync", session });
    // Do not also call diagnoseAndStartRemediation() here: the pendingCount effect
    // below reacts once flush() settles (immediately or after a later reconnect),
    // so triggering it here too would race and double-invoke it.
    await flush(repository);
  }

  async function diagnoseAndStartRemediation(): Promise<void> {
    setStage({ kind: "diagnosing" });
    try {
      const profile = await repository.getDiagnosticProfile(
        currentStudent.id,
        lessonId,
      );
      const remediation = await repository.startRemediationSession(profile);

      if (remediation.path.current_state === "CONFIRMATION") {
        const probeSession = await repository.startReadinessSession(
          currentStudent.id,
          lessonId,
        );
        setStage({ kind: "probe", remediation, profile, probeSession });
        return;
      }

      saveToCache(remediationCacheKey(currentStudent.id), {
        remediation,
        profile,
      });
      markRemediationSeen(remediation);
      setStage(
        remediation.is_complete
          ? { kind: "exit-ticket", remediation, profile }
          : { kind: "remediation", remediation, profile },
      );
      setActiveTab("path");
    } catch (error) {
      setStage({ kind: "error", message: describeError(error) });
    }
  }

  async function submitProbeAnswer(
    profile: StudentDiagnosticProfileV1,
    remediation: RemediationResponse,
    probeSession: StartSessionResponse,
    itemId: string,
    responseLabel: string,
    confidence: number,
  ): Promise<void> {
    enqueue("DIAGNOSTIC_RESPONSE", {
      sessionId: probeSession.session_id,
      itemId,
      responseLabel,
      confidence,
    });
    setStage({ kind: "probe-waiting-to-sync", remediation, profile });
    // See the note in submitReadinessAnswer: the pendingCount effect handles the
    // transition once flush() settles, so we don't also call it directly here.
    await flush(repository);
  }

  async function resolveConfirmation(): Promise<void> {
    setStage({ kind: "diagnosing" });
    try {
      const refreshedProfile = await repository.getDiagnosticProfile(
        currentStudent.id,
        lessonId,
      );
      const evidenceSufficient =
        refreshedProfile.readiness_status !== "abstained";
      const confirmed = await repository.confirmEvidence(
        currentStudent.id,
        evidenceSufficient,
      );

      if (confirmed.path.current_state === "CONFIRMATION") {
        const probeSession = await repository.startReadinessSession(
          currentStudent.id,
          lessonId,
        );
        setStage({
          kind: "probe",
          remediation: confirmed,
          profile: refreshedProfile,
          probeSession,
        });
        return;
      }

      saveToCache(remediationCacheKey(currentStudent.id), {
        remediation: confirmed,
        profile: refreshedProfile,
      });
      markRemediationSeen(confirmed);
      setStage(
        confirmed.is_complete
          ? {
              kind: "exit-ticket",
              remediation: confirmed,
              profile: refreshedProfile,
            }
          : {
              kind: "remediation",
              remediation: confirmed,
              profile: refreshedProfile,
            },
      );
      setActiveTab("path");
    } catch (error) {
      setStage({ kind: "error", message: describeError(error) });
    }
  }

  async function submitRemediationAttempt(
    profile: StudentDiagnosticProfileV1,
    stepId: string,
    isCorrect: boolean,
  ): Promise<void> {
    const attemptId = generateAttemptId();
    enqueue("REMEDIATION_ATTEMPT", {
      studentId: currentStudent.id,
      stepId,
      isCorrect,
      attemptId,
    });
    const results = await flush(repository);
    const ours = results.find(
      (r) =>
        r.write.type === "REMEDIATION_ATTEMPT" &&
        (r.write.payload as { attemptId: string }).attemptId === attemptId,
    );
    if (ours?.ok && ours.response) {
      const remediation = ours.response as RemediationResponse;
      saveToCache(remediationCacheKey(currentStudent.id), {
        remediation,
        profile,
      });
      markRemediationSeen(remediation);
      setStage(
        remediation.is_complete
          ? { kind: "exit-ticket", remediation, profile }
          : { kind: "remediation", remediation, profile },
      );
    }
    // If it didn't sync yet (offline), the queue holds it; the current step's
    // content stays on screen until sync catches up and refreshes the cache.
  }

  function showExitTicketResult(
    profile: StudentDiagnosticProfileV1,
    exitTicketResult: ExitTicketResponse,
  ): void {
    const nextProfile = exitTicketResult.outcome.reclassified_profile;
    saveToCache(remediationCacheKey(currentStudent.id), {
      remediation: exitTicketResult.remediation,
      profile: nextProfile ?? profile,
      exitTicketResult,
    });
    setStage({
      kind: "exit-ticket-result",
      remediation: exitTicketResult.remediation,
      outcome: exitTicketResult.outcome,
      nextProfile,
    });
  }

  function finalizeQueuedExitTicket(
    profile: StudentDiagnosticProfileV1,
    submissionId: string,
  ): void {
    const write = listAll().find(
      (candidate) =>
        candidate.type === "EXIT_TICKET" &&
        (candidate.payload as { submissionId: string }).submissionId ===
          submissionId,
    );
    if (write?.status === "SYNCED" && write.result) {
      showExitTicketResult(profile, write.result as ExitTicketResponse);
    }
  }

  async function submitExitTicket(
    profile: StudentDiagnosticProfileV1,
    ticketId: string,
    responseLabel: string,
  ): Promise<void> {
    const submissionId = generateAttemptId();
    setBusy(true);
    enqueue("EXIT_TICKET", {
      studentId: currentStudent.id,
      ticketId,
      responseLabel,
      submissionId,
    });
    if (stage.kind !== "exit-ticket") {
      setBusy(false);
      return;
    }
    saveToCache(remediationCacheKey(currentStudent.id), {
      remediation: stage.remediation,
      profile,
      exitTicketPending: { submissionId },
    });
    setStage({
      kind: "exit-ticket-pending",
      remediation: stage.remediation,
      profile,
      submissionId,
    });
    try {
      const results = await flush(repository);
      const ours = results.find(
        (result) =>
          result.write.type === "EXIT_TICKET" &&
          (result.write.payload as { submissionId: string }).submissionId ===
            submissionId,
      );
      if (ours?.ok && ours.response) {
        showExitTicketResult(profile, ours.response as ExitTicketResponse);
      }
    } finally {
      setBusy(false);
    }
  }

  async function resetDemo(): Promise<void> {
    if (!selectedPersonaId) {
      return;
    }
    setBusy(true);
    try {
      const reset = await repository.resetDemo(selectedPersonaId);
      clearAll();
      clearCache();
      const remediation = await repository.startRemediationSession(
        reset.persona.profile,
      );
      setCurrentStudent({
        id: reset.persona.student_id,
        displayName: reset.persona.display_name,
      });
      setInitialRepresentation(remediation.path.representation);
      saveToCache(remediationCacheKey(reset.persona.student_id), {
        remediation,
        profile: reset.persona.profile,
      });
      setStage(
        remediation.is_complete
          ? {
              kind: "exit-ticket",
              remediation,
              profile: reset.persona.profile,
            }
          : {
              kind: "remediation",
              remediation,
              profile: reset.persona.profile,
            },
      );
      setActiveTab("path");
    } catch (error) {
      setStage({ kind: "error", message: describeError(error) });
    } finally {
      setBusy(false);
    }
  }

  function continueReclassifiedPath(): void {
    if (stage.kind !== "exit-ticket-result" || !stage.nextProfile) {
      return;
    }
    saveToCache(remediationCacheKey(currentStudent.id), {
      remediation: stage.remediation,
      profile: stage.nextProfile,
    });
    setInitialRepresentation(stage.remediation.path.representation);
    setStage({
      kind: "remediation",
      remediation: stage.remediation,
      profile: stage.nextProfile,
    });
  }

  return (
    <div className="student-shell">
      <a className="dashboard-skip-link" href="#student-main">
        Đi tới nội dung chính
      </a>
      <AppHeader
        className="dashboard-island student-island"
        context={
          <div className="app-island-workspace student-profile">
            <span className="app-island-live" aria-hidden="true" />
            <span className="student-identity">
              <b>{currentStudent.displayName}</b>
              <small>Toán 7A · Tiến từng bước, không xếp hạng</small>
            </span>
          </div>
        }
        actions={
          <>
            <DemoReset
              personas={personas}
              selectedPersonaId={selectedPersonaId}
              busy={busy}
              onSelect={setSelectedPersonaId}
              onReset={() => void resetDemo()}
            />
            <button
              type="button"
              className={`student-sync${pendingCount === 0 ? " online" : ""}`}
              title={
                pendingCount === 0
                  ? "Đã đồng bộ - nhấn để kiểm tra lại"
                  : `${pendingCount} thay đổi đang chờ đồng bộ`
              }
              onClick={() => void flush(repository)}
            >
              <span className="student-sync-icon" aria-hidden="true">
                ↻
              </span>
              <span className="student-sync-dot" aria-hidden="true" />
              <span>
                {pendingCount === 0
                  ? "Đã đồng bộ"
                  : `Đang chờ đồng bộ · ${pendingCount}`}
              </span>
            </button>
          </>
        }
      />

      <div className="student-layout">
        <aside className="student-sidebar">
          <nav className="student-nav" aria-label="Điều hướng học sinh">
            {studentNavigation.map((item) => (
              <button
                key={item.id}
                type="button"
                className={activeTab === item.id ? "active" : ""}
                aria-current={activeTab === item.id ? "page" : undefined}
                onClick={() => setActiveTab(item.id)}
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
              <span className="student-kicker">Không gian học tập</span>
              <strong>
                {studentNavigation.find((item) => item.id === activeTab)?.label}
              </strong>
            </div>
            <span>Toán 7A</span>
          </div>

          {activeTab === "home" && (
            <StudentHome
              stage={stage}
              busy={busy}
              onStart={() => void startReadiness()}
              onContinue={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === "readiness" && (
            <ReadinessSection
              stage={stage}
              onAnswer={submitReadinessAnswer}
              onProbeAnswer={submitProbeAnswer}
              onSaveAndExit={() => setActiveTab("home")}
            />
          )}

          {activeTab === "path" && (
            <RemediationSection
              stage={stage}
              initialRepresentation={initialRepresentation}
              onAttempt={submitRemediationAttempt}
              onExitTicket={submitExitTicket}
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
    confidence: number,
  ) => void;
  onProbeAnswer: (
    profile: StudentDiagnosticProfileV1,
    remediation: RemediationResponse,
    probeSession: StartSessionResponse,
    itemId: string,
    responseLabel: string,
    confidence: number,
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
        onSubmit={(itemId, label, confidence) =>
          onAnswer(stage.session, stage.currentIndex, itemId, label, confidence)
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
        onSubmit={(itemId, label, confidence) =>
          onProbeAnswer(
            stage.profile,
            stage.remediation,
            stage.probeSession,
            itemId,
            label,
            confidence,
          )
        }
        onSaveAndExit={onSaveAndExit}
      />
    );
  }
  if (
    stage.kind === "waiting-to-sync" ||
    stage.kind === "probe-waiting-to-sync"
  ) {
    return (
      <div className="student-card" aria-live="polite">
        <p>Đã lưu câu trả lời trên máy. Đang chờ kết nối để gửi đi...</p>
      </div>
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
    isCorrect: boolean,
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
        onAttempt={(stepId, isCorrect) =>
          onAttempt(stage.profile, stepId, isCorrect)
        }
      />
    );
  }
  if (stage.kind === "complete") {
    return (
      <RemediationPath
        remediation={stage.remediation}
        initialRepresentation={initialRepresentation}
        onAttempt={() => undefined}
      />
    );
  }
  if (stage.kind === "exit-ticket") {
    if (!stage.remediation.exit_ticket) {
      return (
        <div className="student-card" role="alert">
          <p>Chưa tải được bài cuối. Vui lòng đồng bộ lại.</p>
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
  if (stage.kind === "exit-ticket-pending") {
    return (
      <div className="student-card" aria-live="polite">
        <p>Đã lưu bài cuối trên máy. Đang chờ kết nối để gửi đi...</p>
      </div>
    );
  }
  if (stage.kind === "exit-ticket-result") {
    return (
      <article className="student-card">
        <span className="student-pill teal">Kết quả</span>
        <h1>{stage.outcome.message}</h1>
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

function describeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Đã có lỗi xảy ra. Vui lòng thử lại.";
}
