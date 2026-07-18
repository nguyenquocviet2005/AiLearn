import { beforeEach, describe, expect, it } from "vitest";

import {
  clearAll,
  countPending,
  enqueue,
  generateAttemptId,
  listAll,
  listPending,
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
      isCorrect: true,
      attemptId: "att_1",
    });

    expect(first.status).toBe("PENDING");
    expect(first.clientEventId).not.toBe(second.clientEventId);
    expect(listAll()).toHaveLength(2);
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
});
