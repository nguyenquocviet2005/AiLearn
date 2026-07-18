import { describe, expect, it } from "vitest";

import { fixtureTeacherWorkspaceRepository } from "@/test/teacher-fixtures";

import {
  buildTeacherDemoModel,
  calculateStudentOutcome,
  TeacherDemoValidationError,
} from "./teacher-demo-model";

describe("buildTeacherDemoModel", () => {
  it("derives every teacher metric and group membership from engine output", async () => {
    const snapshot = await fixtureTeacherWorkspaceRepository.getClassSnapshot();
    const plan = await fixtureTeacherWorkspaceRepository.getLessonPlan();
    const model = buildTeacherDemoModel(snapshot, plan);

    expect(model.metrics.total).toBe(snapshot.students.length);
    expect(
      model.metrics.ready +
        model.metrics.needsSupport +
        model.metrics.insufficient,
    ).toBe(snapshot.students.length);
    expect(model.groups.flatMap((group) => group.student_ids).sort()).toEqual(
      snapshot.students.map((student) => student.student_id).sort(),
    );
    expect(
      model.students.every((student) => !student.name.includes("stu_")),
    ).toBe(true);
    expect(model.metrics.evidenceTotal).toBe(
      model.students.reduce((sum, student) => sum + student.evidenceCount, 0),
    );
    expect(model.metrics.improved).toBe(
      model.outcomes.filter((outcome) =>
        ["passed_transfer", "root_cause_reclassified"].includes(
          outcome.outcome,
        ),
      ).length,
    );
    expect(model.metrics.needsRemediation).toBe(
      model.outcomes.filter((outcome) => outcome.outcome === "still_struggling")
        .length,
    );
    expect(model.topPriority.rank).toBe(
      Math.min(
        ...snapshot.teaching_priorities.map((priority) => priority.rank),
      ),
    );
    expect(
      model.evidence.every((event) =>
        snapshot.students.some(
          (student) => student.student_id === event.student_id,
        ),
      ),
    ).toBe(true);
    expect(
      model.outcomes.every((outcome) =>
        outcome.evidence_ids.every((id) =>
          model.evidence.some(
            (event) =>
              event.id === id &&
              event.phase === "follow_up" &&
              event.source === "exit_ticket",
          ),
        ),
      ),
    ).toBe(true);
    expect(
      model.improvementPaths.every((path) =>
        path.steps.every((step) => typeof step.completed === "boolean"),
      ),
    ).toBe(true);
  });

  it("recalculates an outcome when independent transfer evidence changes", async () => {
    const snapshot = await fixtureTeacherWorkspaceRepository.getClassSnapshot();
    const plan = await fixtureTeacherWorkspaceRepository.getLessonPlan();
    const model = buildTeacherDemoModel(snapshot, plan);
    const original = model.outcomes.find(
      (outcome) => outcome.outcome === "passed_transfer",
    );
    expect(original).toBeDefined();
    const evidence = model.evidence
      .filter((event) => event.student_id === original?.student_id)
      .map((event) =>
        event.phase === "follow_up" ? { ...event, is_correct: false } : event,
      );

    expect(calculateStudentOutcome(evidence)).toBe("still_struggling");
  });

  it("rejects a plan for a different class or lesson", async () => {
    const snapshot = await fixtureTeacherWorkspaceRepository.getClassSnapshot();
    const plan = await fixtureTeacherWorkspaceRepository.getLessonPlan();

    expect(() =>
      buildTeacherDemoModel(snapshot, {
        ...plan,
        lesson_plan: { ...plan.lesson_plan, class_id: "another_class" },
      }),
    ).toThrow(TeacherDemoValidationError);
  });

  it("rejects duplicate, missing, and unknown group membership", async () => {
    const snapshot = await fixtureTeacherWorkspaceRepository.getClassSnapshot();
    const plan = await fixtureTeacherWorkspaceRepository.getLessonPlan();
    const groups = snapshot.groups.map((group) => ({
      ...group,
      student_ids: [...group.student_ids],
    }));
    groups[0].student_ids.push(groups[1].student_ids[0]);

    expect(() => buildTeacherDemoModel({ ...snapshot, groups }, plan)).toThrow(
      /nhiều nhóm/,
    );
  });
});
