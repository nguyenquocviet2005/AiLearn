import { useEffect, useState } from "react";

import type { StudentDiagnosticProfileV1 } from "@ailearn/schemas";

import {
  ApiError,
  httpStudentRepository,
  type StudentRepository,
} from "@/lib/adapters/student-repository";
import type {
  DemoPersonaSummary,
  ExitTicketOutcome,
  ExitTicketResponse,
  RemediationAttemptOutcome,
  RemediationResponse,
  StartSessionResponse,
} from "@/lib/adapters/student-types";
import {
  clearCache,
  readFromCache,
  saveToCache,
} from "@/lib/offline/content-cache";
import {
  readActiveLearner,
  saveActiveLearner,
  type ActiveLearner,
} from "@/lib/offline/active-learner";
import {
  clearAll,
  enqueue,
  generateAttemptId,
  hasPendingDiagnosticForSession,
  hasPendingExitTicket,
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
      probeSession: StartSessionResponse;
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

function initialLearner(studentId: string): ActiveLearner {
  const persisted = readActiveLearner();
  if (
    persisted &&
    (readFromCache(readinessCacheKey(persisted.id)) ||
      readFromCache(remediationCacheKey(persisted.id)))
  ) {
    return persisted;
  }
  return { id: studentId, displayName: DEMO_STUDENT_NAME };
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
  const [currentStudent, setCurrentStudent] = useState(() =>
    initialLearner(studentId),
  );
  const [personas, setPersonas] = useState<DemoPersonaSummary[]>([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState("");
  const [pendingCount, setPendingCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [pathNotice, setPathNotice] = useState<string | null>(null);
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
      remediationCacheKey(currentStudent.id),
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
      readinessCacheKey(currentStudent.id),
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
        setSelectedPersonaId(
          availablePersonas.some(
            (persona) => persona.id === currentStudent.personaId,
          )
            ? (currentStudent.personaId ?? "")
            : (availablePersonas[0]?.id ?? ""),
        );
      })
      .catch(() => {
        // The existing student flow stays usable when the optional demo API is offline.
      });
    return () => {
      active = false;
    };
  }, [currentStudent.personaId, repository]);

  useEffect(() => {
    setPendingCount((current) => current); // seed with current value on mount
    const unsubscribe = onSyncChange(setPendingCount);
    const teardown = setupAutoSync(repository);
    return () => {
      unsubscribe();
      teardown();
    };
  }, [repository]);

  // Once this stage's own writes sync, move forward. Do not wait for unrelated
  // older queue items (they previously blocked the whole learner flow).
  useEffect(() => {
    const readinessReady =
      stage.kind === "waiting-to-sync" &&
      !hasPendingDiagnosticForSession(stage.session.session_id);
    const probeReady =
      stage.kind === "probe-waiting-to-sync" &&
      !hasPendingDiagnosticForSession(stage.probeSession.session_id);
    const exitReady =
      stage.kind === "exit-ticket-pending" &&
      !hasPendingExitTicket(stage.submissionId);

    if (readinessReady) {
      void diagnoseAndStartRemediation();
    }
    if (probeReady) {
      void resolveConfirmation();
    }
    if (exitReady && stage.kind === "exit-ticket-pending") {
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
  ): Promise<void> {
    enqueue("DIAGNOSTIC_RESPONSE", {
      sessionId: session.session_id,
      itemId,
      responseLabel,
      confidence: null,
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
    const flushResults = await flush(repository);
  }

  async function diagnoseAndStartRemediation(): Promise<void> {
    setStage({ kind: "diagnosing" });
    const maxAttempts = 3;
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const profile = await repository.getDiagnosticProfile(
          currentStudent.id,
          lessonId,
        );
        const remediation = await repository.startRemediationSession(profile);

        if (remediation.path.current_state === "CONFIRMATION") {
          const probeSession = await repository.startProbe(
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
        return;
      } catch (error) {
        lastError = error;
        const retryable =
          error instanceof ApiError &&
          error.status === 503 &&
          attempt < maxAttempts;
        if (!retryable) {
          break;
        }
        await new Promise((resolve) => {
          window.setTimeout(resolve, 400 * attempt);
        });
      }
    }

    setStage({ kind: "error", message: describeError(lastError) });
  }

  async function submitProbeAnswer(
    profile: StudentDiagnosticProfileV1,
    remediation: RemediationResponse,
    probeSession: StartSessionResponse,
    itemId: string,
    responseLabel: string,
  ): Promise<void> {
    enqueue("DIAGNOSTIC_RESPONSE", {
      sessionId: probeSession.session_id,
      itemId,
      responseLabel,
      confidence: null,
    });
    setStage({
      kind: "probe-waiting-to-sync",
      remediation,
      profile,
      probeSession,
    });
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
        const probeSession = await repository.startProbe(
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
    outcome: RemediationAttemptOutcome,
  ): Promise<void> {
    const attemptId = generateAttemptId();
    enqueue("REMEDIATION_ATTEMPT", {
      studentId: currentStudent.id,
      stepId,
      attemptId,
      response: outcome.kind === "response" ? outcome.response : null,
      isCorrect: outcome.kind === "self_report" ? outcome.isCorrect : null,
    });
    const results = await flush(repository);
    const ours = results.find(
      (r) =>
        r.write.type === "REMEDIATION_ATTEMPT" &&
        (r.write.payload as { attemptId: string }).attemptId === attemptId,
    );
    // Auto-sync may have drained this write on a prior chained flush; recover
    // the SYNCED result from the queue so the path still advances.
    const recovered =
      ours?.response ??
      (listAll().find(
        (write) =>
          write.type === "REMEDIATION_ATTEMPT" &&
          (write.payload as { attemptId: string }).attemptId === attemptId &&
          write.status === "SYNCED" &&
          write.result,
      )?.result as RemediationResponse | undefined);
    if (recovered) {
      setPathNotice(null);
      saveToCache(remediationCacheKey(currentStudent.id), {
        remediation: recovered,
        profile,
      });
      markRemediationSeen(recovered);
      setStage(
        recovered.is_complete
          ? { kind: "exit-ticket", remediation: recovered, profile }
          : { kind: "remediation", remediation: recovered, profile },
      );
      return;
    }
    // Keep the student on the current path step — a hard error stage made the
    // frequent sync race look like the whole lesson broke.
    setPathNotice(
      "Chưa gửi được câu trả lời. Em hãy bấm đồng bộ trên thanh bên rồi thử lại bước này.",
    );
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
      const remediation = await repository.startRemediationSession(
        reset.persona.profile,
      );
      // Keep the previous offline recovery state until the replacement path is
      // actually available. A partial reset must not strand the learner.
      clearAll();
      clearCache();
      setPendingCount(0);
      const learner = {
        id: reset.persona.student_id,
        displayName: reset.persona.display_name,
        personaId: reset.persona.id,
      };
      saveActiveLearner(learner);
      setCurrentStudent(learner);
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

  // Lets a student (or a tester) retake their own diagnostic from scratch,
  // without going through the demo persona switcher — which resets identity
  // and is meant for showcasing scripted personas, not for a real retake.
  function restartOwnProgress(): void {
    clearAll();
    clearCache();
    setPendingCount(0);
    setInitialRepresentation(null);
    // Also drop back to the real student identity: if this is clicked while a
    // demo persona is active, its synthetic id has no row in the students
    // table, so a fresh readiness submission would 404 on diagnostic-profile
    // lookup (the persona-reset path avoids that by never calling it).
    const learner = { id: studentId, displayName: DEMO_STUDENT_NAME };
    saveActiveLearner(learner);
    setCurrentStudent(learner);
    setStage({ kind: "idle" });
    setActiveTab("home");
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
      <div className="student-layout">
        <aside className="student-sidebar" aria-label="Đồng hành học tập">
          <a
            className="dashboard-rail-brand"
            href="/"
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

          <div className="student-rail-controls" ref={(node) => {}}>
            <button
              type="button"
              className="student-reset"
              disabled={busy || stage.kind === "idle"}
              title="Xoá bài đang làm trên máy này và bắt đầu lại từ đầu"
              onClick={() => restartOwnProgress()}
            >
              Làm lại từ đầu
            </button>
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
              <span className="student-kicker">Không gian học tập</span>
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
              onContinue={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === "readiness" && (
            <ReadinessSection
              stage={stage}
              pendingCount={pendingCount}
              onAnswer={submitReadinessAnswer}
              onProbeAnswer={submitProbeAnswer}
              onSaveAndExit={() => setActiveTab("home")}
              onRetrySync={() => void flush(repository)}
              onRetryDiagnose={() => void diagnoseAndStartRemediation()}
            />
          )}

          {activeTab === "path" && (
            <RemediationSection
              stage={stage}
              initialRepresentation={initialRepresentation}
              pathNotice={pathNotice}
              onAttempt={submitRemediationAttempt}
              onExitTicket={submitExitTicket}
              onContinueReclassifiedPath={continueReclassifiedPath}
              onDone={() => setActiveTab("home")}
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
  pendingCount,
  onAnswer,
  onProbeAnswer,
  onSaveAndExit,
  onRetrySync,
  onRetryDiagnose,
}: {
  stage: Stage;
  pendingCount: number;
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
  onRetrySync: () => void;
  onRetryDiagnose: () => void;
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
  if (
    stage.kind === "waiting-to-sync" ||
    stage.kind === "probe-waiting-to-sync"
  ) {
    const sessionId =
      stage.kind === "waiting-to-sync"
        ? stage.session.session_id
        : stage.probeSession.session_id;
    const sessionStillPending = hasPendingDiagnosticForSession(sessionId);
    return (
      <div className="student-card" aria-live="polite">
        <p>
          {sessionStillPending
            ? "Đã lưu câu trả lời trên máy. Đang gửi lên máy chủ để xem xét..."
            : "Đã nhận câu trả lời. Đang xem xét để mở lộ trình phù hợp..."}
        </p>
        {sessionStillPending && (
          <>
            <p className="student-question-note">
              {pendingCount > 0
                ? `Còn ${pendingCount} thay đổi chờ đồng bộ. Nếu mạng ổn định mà vẫn chờ, hãy thử gửi lại.`
                : "Đang thử gửi lại câu trả lời của em."}
            </p>
            <button
              type="button"
              className="student-btn teal"
              onClick={onRetrySync}
            >
              Thử đồng bộ lại
            </button>
          </>
        )}
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
        <button
          type="button"
          className="student-btn primary"
          onClick={onRetryDiagnose}
        >
          Thử lại
        </button>
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
  pathNotice,
  onAttempt,
  onExitTicket,
  onContinueReclassifiedPath,
  onDone,
  busy,
}: {
  stage: Stage;
  initialRepresentation: string | null;
  pathNotice: string | null;
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
  onDone: () => void;
  busy: boolean;
}) {
  if (stage.kind === "remediation") {
    return (
      <RemediationPath
        remediation={stage.remediation}
        initialRepresentation={initialRepresentation}
        pathNotice={pathNotice}
        onAttempt={(stepId, outcome) =>
          onAttempt(stage.profile, stepId, outcome)
        }
      />
    );
  }
  if (stage.kind === "complete") {
    return (
      <RemediationPath
        remediation={stage.remediation}
        initialRepresentation={initialRepresentation}
        pathNotice={pathNotice}
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
        {stage.nextProfile ? (
          <>
            <p>
              Hệ thống thấy em cần thêm một lộ trình khác để nắm chắc phần này.
            </p>
            <button
              type="button"
              className="student-btn primary"
              onClick={onContinueReclassifiedPath}
            >
              Tiếp tục bài phù hợp →
            </button>
          </>
        ) : (
          <>
            <p>
              Em đã học xong lộ trình hôm nay. Cô sẽ xem lại kết quả này ở buổi
              học tiếp theo — em không cần làm thêm gì bây giờ.
            </p>
            <button
              type="button"
              className="student-btn primary"
              onClick={onDone}
            >
              Về trang chủ hôm nay →
            </button>
          </>
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
  if (stage.kind === "error") {
    return (
      <div className="student-card" role="alert">
        <p>{stage.message}</p>
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
  if (error instanceof ApiError) {
    if (
      error.status === 503 &&
      (error.code === "supabase_unavailable" ||
        /Evidence storage is unavailable/i.test(error.message))
    ) {
      return "Chưa tải được dữ liệu bài làm. Em hãy bấm Thử lại sau vài giây.";
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Đã có lỗi xảy ra. Vui lòng thử lại.";
}
