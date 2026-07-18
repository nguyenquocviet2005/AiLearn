/**
 * Local write queue (PendingWrite, per docs/AILEARN_SYSTEM_UX_BLUEPRINT.md §12).
 *
 * Every diagnostics-response and remediation-attempt submission goes through this
 * queue first (queue-first architecture) — whether the app is online or offline —
 * so autosave, offline resume, and non-duplicated sync all share one code path.
 */

export type PendingWriteType =
  "DIAGNOSTIC_RESPONSE" | "REMEDIATION_ATTEMPT" | "EXIT_TICKET";

export interface DiagnosticResponsePayload {
  sessionId: string;
  itemId: string;
  responseLabel: string;
  confidence: number | null;
}

export interface RemediationAttemptPayload {
  studentId: string;
  stepId: string;
  attemptId: string;
  /** Free-text answer for a gradable step; the server decides correctness. */
  response?: string;
  /** Student self-report, used only when the step is not auto-gradable. */
  isCorrect?: boolean;
}

export interface ExitTicketPayload {
  studentId: string;
  ticketId: string;
  responseLabel: string;
  submissionId: string;
}

export type PendingWritePayload =
  DiagnosticResponsePayload | RemediationAttemptPayload | ExitTicketPayload;

export type PendingWriteStatus = "PENDING" | "SYNCING" | "SYNCED" | "FAILED";

export interface PendingWrite {
  clientEventId: string;
  type: PendingWriteType;
  payload: PendingWritePayload;
  result?: unknown;
  createdAt: string;
  retryCount: number;
  status: PendingWriteStatus;
}

const STORAGE_KEY = "ailearn.student.pendingWrites.v1";

function generateId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function readAll(): PendingWrite[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw) as PendingWrite[];
  } catch {
    return [];
  }
}

function writeAll(writes: PendingWrite[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(writes));
}

export function enqueue(
  type: PendingWriteType,
  payload: PendingWritePayload,
): PendingWrite {
  const write: PendingWrite = {
    clientEventId: generateId("qw"),
    type,
    payload,
    createdAt: new Date().toISOString(),
    retryCount: 0,
    status: "PENDING",
  };
  const writes = readAll();
  writes.push(write);
  writeAll(writes);
  return write;
}

export function listAll(): PendingWrite[] {
  return readAll();
}

export function listPending(): PendingWrite[] {
  return readAll().filter(
    (w) => w.status === "PENDING" || w.status === "FAILED",
  );
}

export function countPending(): number {
  return listPending().length;
}

export function updateStatus(
  clientEventId: string,
  status: PendingWriteStatus,
  retryCountDelta = 0,
  result?: unknown,
): void {
  const writes = readAll();
  const index = writes.findIndex((w) => w.clientEventId === clientEventId);
  if (index === -1) {
    return;
  }
  const current = writes[index];
  writes[index] = {
    ...current,
    status,
    retryCount: current.retryCount + retryCountDelta,
    ...(result === undefined ? {} : { result }),
  };
  writeAll(writes);
}

export function clearAll(): void {
  writeAll([]);
}

export function generateAttemptId(): string {
  return generateId("att");
}
