import { beforeEach, describe, expect, it } from "vitest";

import { readActiveLearner, saveActiveLearner } from "./active-learner";

beforeEach(() => {
  localStorage.clear();
});

describe("active learner persistence", () => {
  it("round-trips the selected synthetic learner without private data", () => {
    saveActiveLearner({
      id: "stu_demo_foundation_01",
      displayName: "Bạn An",
      personaId: "foundational-gap",
    });

    expect(readActiveLearner()).toEqual({
      id: "stu_demo_foundation_01",
      displayName: "Bạn An",
      personaId: "foundational-gap",
    });
  });

  it("ignores malformed persisted state", () => {
    localStorage.setItem(
      "ailearn.student.activeLearner.v1",
      JSON.stringify({ id: "stu_demo_foundation_01" }),
    );

    expect(readActiveLearner()).toBeNull();
  });
});
