import { beforeEach, describe, expect, it, vi } from "vitest";

import type { StudentRepository } from "@/lib/adapters/student-repository";

import { clearAll, enqueue, listAll } from "./queue";
import { flush, onSyncChange } from "./sync";

function fakeRepository(
  overrides: Partial<StudentRepository> = {},
): StudentRepository {
  return {
    startReadinessSession: vi.fn(),
    submitReadinessResponse: vi.fn().mockResolvedValue({
      evidence_event: {},
      remaining_item_ids: [],
      session_complete: true,
    }),
    getDiagnosticProfile: vi.fn(),
    startRemediationSession: vi.fn(),
    submitRemediationAttempt: vi.fn().mockResolvedValue({}),
    confirmEvidence: vi.fn(),
    ...overrides,
  } as unknown as StudentRepository;
}

beforeEach(() => {
  clearAll();
});

describe("sync", () => {
  it("does nothing when the queue is empty", async () => {
    const repository = fakeRepository();

    await flush(repository);

    expect(repository.submitReadinessResponse).not.toHaveBeenCalled();
  });

  it("flushes a pending diagnostic response and marks it SYNCED", async () => {
    const repository = fakeRepository();
    enqueue("DIAGNOSTIC_RESPONSE", {
      sessionId: "sess_1",
      itemId: "item_1",
      responseLabel: "A",
      confidence: 0.9,
    });

    await flush(repository);

    expect(repository.submitReadinessResponse).toHaveBeenCalledWith(
      "sess_1",
      "item_1",
      "A",
      0.9,
    );
    expect(listAll()[0].status).toBe("SYNCED");
  });

  it("does not resend a write that already synced on a later flush", async () => {
    const repository = fakeRepository();
    enqueue("DIAGNOSTIC_RESPONSE", {
      sessionId: "sess_1",
      itemId: "item_1",
      responseLabel: "A",
      confidence: null,
    });

    await flush(repository);
    await flush(repository);
    await flush(repository);

    expect(repository.submitReadinessResponse).toHaveBeenCalledTimes(1);
  });

  it("stops at the first failure to preserve write order", async () => {
    const repository = fakeRepository({
      submitRemediationAttempt: vi
        .fn()
        .mockRejectedValueOnce(new Error("offline"))
        .mockResolvedValue({}),
    });
    enqueue("REMEDIATION_ATTEMPT", {
      studentId: "stu_1",
      stepId: "step_1",
      isCorrect: true,
      attemptId: "att_1",
    });
    enqueue("REMEDIATION_ATTEMPT", {
      studentId: "stu_1",
      stepId: "step_2",
      isCorrect: true,
      attemptId: "att_2",
    });

    await flush(repository);

    expect(repository.submitRemediationAttempt).toHaveBeenCalledTimes(1);
    const writes = listAll();
    expect(writes[0].status).toBe("FAILED");
    expect(writes[0].retryCount).toBe(1);
    expect(writes[1].status).toBe("PENDING");
  });

  it("resumes and drains remaining writes once the failure clears", async () => {
    const submitRemediationAttempt = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue({});
    const repository = fakeRepository({ submitRemediationAttempt });
    enqueue("REMEDIATION_ATTEMPT", {
      studentId: "stu_1",
      stepId: "step_1",
      isCorrect: true,
      attemptId: "att_1",
    });
    enqueue("REMEDIATION_ATTEMPT", {
      studentId: "stu_1",
      stepId: "step_2",
      isCorrect: true,
      attemptId: "att_2",
    });

    await flush(repository); // first write fails, second untouched
    await flush(repository); // retry: both succeed in order

    expect(submitRemediationAttempt).toHaveBeenCalledTimes(3);
    expect(listAll().every((w) => w.status === "SYNCED")).toBe(true);
  });

  it("notifies listeners with the current pending count after a flush", async () => {
    const repository = fakeRepository();
    enqueue("DIAGNOSTIC_RESPONSE", {
      sessionId: "sess_1",
      itemId: "item_1",
      responseLabel: "A",
      confidence: null,
    });
    const counts: number[] = [];
    const unsubscribe = onSyncChange((count) => counts.push(count));

    await flush(repository);
    unsubscribe();

    expect(counts).toEqual([0]);
  });
});
