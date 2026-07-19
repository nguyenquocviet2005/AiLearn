import { beforeEach, describe, expect, it } from "vitest";

import {
  clearAll,
  countPending,
  enqueue,
  generateAttemptId,
  hasPendingDiagnosticForSession,
  listAll,
  listPending,
  recoverInterruptedWrites,
  updateStatus,
} from "./queue";

beforeEach(() => {
  clearAll();
});

describe("queue", () => {
  it("enqueues a write as PENDING with a unique clientEventId", () => {
    const first = enqueue("DIAGNOSTIC_RESPONSE", {
      sessionId: "sess_1",
      itemId: "item_1",
      responseLabel: "A",
      confidence: 0.9,
    });
    const second = enqueue("REMEDIATION_ATTEMPT", {
      studentId: "stu_1",
      stepId: "step_1",
      response: null,
      isCorrect: true,
      attemptId: "att_1",
    });
    const third = enqueue("EXIT_TICKET", {
      studentId: "stu_1",
      ticketId: "exit_1",
      responseLabel: "Giảm xuống",
      submissionId: "exit_submission_1",
    });

    expect(first.status).toBe("PENDING");
    expect(first.clientEventId).not.toBe(second.clientEventId);
    expect(second.clientEventId).not.toBe(third.clientEventId);
    expect(listAll()).toHaveLength(3);
  });

  it("lists only PENDING and FAILED writes as pending", () => {
    const a = enqueue("DIAGNOSTIC_RESPONSE", {
      sessionId: "sess_1",
      itemId: "item_1",
      responseLabel: "A",
      confidence: null,
    });
    const b = enqueue("DIAGNOSTIC_RESPONSE", {
      sessionId: "sess_1",
      itemId: "item_2",
      responseLabel: "B",
      confidence: null,
    });

    updateStatus(a.clientEventId, "SYNCED");
    updateStatus(b.clientEventId, "FAILED", 1);

    const pending = listPending();
    expect(pending).toHaveLength(1);
    expect(pending[0].clientEventId).toBe(b.clientEventId);
    expect(pending[0].retryCount).toBe(1);
  });

  it("countPending reflects only unsynced writes", () => {
    expect(countPending()).toBe(0);
    enqueue("DIAGNOSTIC_RESPONSE", {
      sessionId: "sess_1",
      itemId: "item_1",
      responseLabel: "A",
      confidence: null,
    });
    expect(countPending()).toBe(1);
  });

  it("generateAttemptId produces distinct ids", () => {
    const ids = new Set(Array.from({ length: 20 }, () => generateAttemptId()));
    expect(ids.size).toBe(20);
  });

  it("persists across reads from localStorage", () => {
    enqueue("DIAGNOSTIC_RESPONSE", {
      sessionId: "sess_1",
      itemId: "item_1",
      responseLabel: "A",
      confidence: null,
    });

    // A second "read" (new listAll call) should see the same persisted state.
    expect(listAll()).toHaveLength(1);
  });

  it("makes an interrupted in-flight write retryable after a new runtime starts", () => {
    const write = enqueue("DIAGNOSTIC_RESPONSE", {
      sessionId: "sess_1",
      itemId: "item_1",
      responseLabel: "A",
      confidence: null,
    });
    updateStatus(write.clientEventId, "SYNCING");

    recoverInterruptedWrites();

    expect(listPending()).toHaveLength(1);
    expect(listAll()[0]).toMatchObject({ status: "FAILED", retryCount: 1 });
  });

  it("scopes diagnostic pending checks to one session id", () => {
    enqueue("DIAGNOSTIC_RESPONSE", {
      sessionId: "sess_a",
      itemId: "item_1",
      responseLabel: "A",
      confidence: null,
    });
    enqueue("DIAGNOSTIC_RESPONSE", {
      sessionId: "sess_b",
      itemId: "item_2",
      responseLabel: "B",
      confidence: null,
    });
    enqueue("REMEDIATION_ATTEMPT", {
      studentId: "stu_1",
      stepId: "step_1",
      response: null,
      isCorrect: true,
      attemptId: "att_1",
    });

    expect(hasPendingDiagnosticForSession("sess_a")).toBe(true);
    expect(hasPendingDiagnosticForSession("sess_b")).toBe(true);
    expect(hasPendingDiagnosticForSession("sess_missing")).toBe(false);

    const [first] = listAll();
    updateStatus(first.clientEventId, "SYNCED");
    expect(hasPendingDiagnosticForSession("sess_a")).toBe(false);
    expect(hasPendingDiagnosticForSession("sess_b")).toBe(true);
  });
});
