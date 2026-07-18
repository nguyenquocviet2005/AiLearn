import { useEffect, useState } from "react";

import type { StudentDiagnosticProfileV1 } from "@ailearn/schemas";

import {
  httpStudentRepository,
  type StudentRepository,
} from "@/lib/adapters/student-repository";
import type {
  RemediationResponse,
  StartSessionResponse,
} from "@/lib/adapters/student-types";
import { readFromCache, saveToCache } from "@/lib/offline/content-cache";
import { enqueue, generateAttemptId } from "@/lib/offline/queue";
import { flush, onSyncChange, setupAutoSync } from "@/lib/offline/sync";

import "./student.css";

import { RemediationPath } from "./RemediationPath";
import { StudentHelp } from "./StudentHelp";
import { StudentHome } from "./StudentHome";
import { ReadinessQuestion } from "./ReadinessQuestion";

export const DEMO_STUDENT_ID = "stu_g7_001";
export const DEMO_LESSON_ID = "lesson_g7_inverse_proportion_01";
export const DEMO_STUDENT_NAME = "Học sinh 001";

type TabId = "home" | "readiness" | "path" | "help";

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
      setStage(
        cachedRemediation.remediation.is_complete
          ? { kind: "complete", remediation: cachedRemediation.remediation }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingCount, stage.kind]);

  async function startReadiness(): Promise<void> {
    setBusy(true);
    setStage({ kind: "idle" });
    try {
      const session = await repository.startReadinessSession(
        studentId,
        lessonId,
      );
      saveToCache(readinessCacheKey(studentId), { session, currentIndex: 0 });
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
      saveToCache(readinessCacheKey(studentId), {
        session,
        currentIndex: nextIndex,
      });
      setStage({ kind: "readiness", session, currentIndex: nextIndex });
      void flush(repository);
      return;
    }

    saveToCache(readinessCacheKey(studentId), {
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
        studentId,
        lessonId,
      );
      const remediation = await repository.startRemediationSession(profile);

      if (remediation.path.current_state === "CONFIRMATION") {
        const probeSession = await repository.startReadinessSession(
          studentId,
          lessonId,
        );
        setStage({ kind: "probe", remediation, profile, probeSession });
        return;
      }

      saveToCache(remediationCacheKey(studentId), { remediation, profile });
      markRemediationSeen(remediation);
      setStage(
        remediation.is_complete
          ? { kind: "complete", remediation }
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
        studentId,
        lessonId,
      );
      const evidenceSufficient =
        refreshedProfile.readiness_status !== "abstained";
      const confirmed = await repository.confirmEvidence(
        studentId,
        evidenceSufficient,
      );

      if (confirmed.path.current_state === "CONFIRMATION") {
        const probeSession = await repository.startReadinessSession(
          studentId,
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

      saveToCache(remediationCacheKey(studentId), {
        remediation: confirmed,
        profile: refreshedProfile,
      });
      markRemediationSeen(confirmed);
      setStage(
        confirmed.is_complete
          ? { kind: "complete", remediation: confirmed }
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
    enqueue("REMEDIATION_ATTEMPT", { studentId, stepId, isCorrect, attemptId });
    const results = await flush(repository);
    const ours = results.find(
      (r) =>
        r.write.type === "REMEDIATION_ATTEMPT" &&
        (r.write.payload as { attemptId: string }).attemptId === attemptId,
    );
    if (ours?.ok && ours.response) {
      const remediation = ours.response as RemediationResponse;
      saveToCache(remediationCacheKey(studentId), { remediation, profile });
      markRemediationSeen(remediation);
      setStage(
        remediation.is_complete
          ? { kind: "complete", remediation }
          : { kind: "remediation", remediation, profile },
      );
    }
    // If it didn't sync yet (offline), the queue holds it; the current step's
    // content stays on screen until sync catches up and refreshes the cache.
  }

  return (
    <div className="student-shell">
      <header className="student-header">
        <div className="student-identity">
          <b>{DEMO_STUDENT_NAME}</b>
          <small>Toán 7A · Tiến từng bước, không xếp hạng</small>
        </div>
        <button
          type="button"
          className={`student-sync${pendingCount === 0 ? " online" : ""}`}
          onClick={() => void flush(repository)}
        >
          <span>
            {pendingCount === 0
              ? "Đã đồng bộ"
              : `Đang chờ đồng bộ · ${pendingCount}`}
          </span>
        </button>
      </header>

      <nav className="student-nav" aria-label="Điều hướng học sinh">
        {(
          [
            ["home", "Hôm nay"],
            ["readiness", "Bài của em"],
            ["path", "Lộ trình của em"],
            ["help", "Trợ giúp"],
          ] as [TabId, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={activeTab === id ? "active" : ""}
            aria-current={activeTab === id ? "page" : undefined}
            onClick={() => setActiveTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      <main className="student-main">
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
          />
        )}

        {activeTab === "help" && <StudentHelp stage={stage} />}
      </main>
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
}: {
  stage: Stage;
  initialRepresentation: string | null;
  onAttempt: (
    profile: StudentDiagnosticProfileV1,
    stepId: string,
    isCorrect: boolean,
  ) => void;
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
