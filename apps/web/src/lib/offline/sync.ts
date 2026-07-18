/**
 * Sync manager: drains the pending-write queue against the real API.
 *
 * Triggers: on mount, on the browser `online` event, and a manual call (the sync
 * badge is clickable). Flushes FIFO and stops at the first failure so remediation
 * attempts — which are sequential state transitions — are never applied out of
 * order; the rest resume on the next flush.
 */

import type { StudentRepository } from "@/lib/adapters/student-repository";
import type {
  ExitTicketResponse,
  RemediationResponse,
  SubmitResponseResponse,
} from "@/lib/adapters/student-types";

import {
  countPending,
  listPending,
  updateStatus,
  type DiagnosticResponsePayload,
  type ExitTicketPayload,
  type PendingWrite,
  type RemediationAttemptPayload,
} from "./queue";

export type SyncListener = (pendingCount: number) => void;

let listeners: SyncListener[] = [];

export function onSyncChange(listener: SyncListener): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function notify(): void {
  const count = countPending();
  listeners.forEach((listener) => listener(count));
}

export interface FlushResult {
  write: PendingWrite;
  ok: boolean;
  response?: SubmitResponseResponse | RemediationResponse | ExitTicketResponse;
}

async function flushOne(
  write: PendingWrite,
  repository: StudentRepository,
): Promise<FlushResult> {
  updateStatus(write.clientEventId, "SYNCING");
  try {
    let response:
      SubmitResponseResponse | RemediationResponse | ExitTicketResponse;
    if (write.type === "DIAGNOSTIC_RESPONSE") {
      const payload = write.payload as DiagnosticResponsePayload;
      response = await repository.submitReadinessResponse(
        payload.sessionId,
        payload.itemId,
        payload.responseLabel,
        payload.confidence,
      );
    } else if (write.type === "REMEDIATION_ATTEMPT") {
      const payload = write.payload as RemediationAttemptPayload;
      response = await repository.submitRemediationAttempt(
        payload.studentId,
        payload.stepId,
        payload.isCorrect,
        payload.attemptId,
      );
    } else {
      const payload = write.payload as ExitTicketPayload;
      response = await repository.submitExitTicket(
        payload.studentId,
        payload.ticketId,
        payload.responseLabel,
        payload.submissionId,
      );
    }
    updateStatus(write.clientEventId, "SYNCED", 0, response);
    return { write, ok: true, response };
  } catch {
    updateStatus(write.clientEventId, "FAILED", 1);
    return { write, ok: false };
  }
}

export async function flush(
  repository: StudentRepository,
): Promise<FlushResult[]> {
  const pending = listPending();
  const results: FlushResult[] = [];
  // FIFO: writes are awaited sequentially so they are never reordered.
  for (const write of pending) {
    const result = await flushOne(write, repository);
    results.push(result);
    if (!result.ok) {
      break;
    }
  }
  notify();
  return results;
}

export function setupAutoSync(repository: StudentRepository): () => void {
  const handleOnline = (): void => {
    void flush(repository);
  };
  window.addEventListener("online", handleOnline);
  void flush(repository);
  return () => window.removeEventListener("online", handleOnline);
}
