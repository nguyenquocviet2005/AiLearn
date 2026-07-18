import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createHttpTeacherWorkspaceRepository } from "@/lib/adapters/teacher-repository";
import { ApiConfigurationError } from "@/lib/api-base-url";
import { fixtureTeacherWorkspaceRepository } from "@/test/teacher-fixtures";
import { TeacherWorkspace } from "./TeacherWorkspace";

afterEach(() => {
  window.history.pushState({}, "", "/");
  vi.unstubAllGlobals();
});

describe("TeacherWorkspace", () => {
  it("loads the class overview through the configured HTTP repository", async () => {
    const snapshot = await fixtureTeacherWorkspaceRepository.getClassSnapshot();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => snapshot,
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <TeacherWorkspace
        onNavigate={vi.fn()}
        repository={createHttpTeacherWorkspaceRepository(
          () => "https://api.example.test",
        )}
        view="overview"
      />,
    );

    expect(
      await screen.findByRole("heading", {
        name: "A teaching plan starts with the evidence.",
      }),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/v1/classes/class_demo_6a/snapshot",
      expect.any(Object),
    );
  });

  it("loads and approves a lesson plan through the configured HTTP repository", async () => {
    const initial = await fixtureTeacherWorkspaceRepository.getLessonPlan();
    const approved = await fixtureTeacherWorkspaceRepository.approve(
      initial.plan_id,
      initial.version,
    );
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => initial })
      .mockResolvedValueOnce({ ok: true, json: async () => approved });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(
      <TeacherWorkspace
        onNavigate={vi.fn()}
        repository={createHttpTeacherWorkspaceRepository(
          () => "https://api.example.test",
        )}
        view="lesson-plan"
      />,
    );

    await screen.findByText("Version 1 · pending decision");
    await user.click(screen.getByRole("button", { name: "Approve plan" }));
    expect(
      await screen.findByText("Version 2 · approved decision"),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenLastCalledWith(
      "https://api.example.test/api/v1/lesson-plans/plan_demo_fractions_01/approve",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("shows an accurate API error when the configured repository cannot connect", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );

    render(
      <TeacherWorkspace
        onNavigate={vi.fn()}
        repository={createHttpTeacherWorkspaceRepository(
          () => "https://api.example.test",
        )}
        view="overview"
      />,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The teacher workspace API is unavailable. Try again later.",
    );
  });

  it("distinguishes deployment configuration errors from data failures", async () => {
    render(
      <TeacherWorkspace
        onNavigate={vi.fn()}
        repository={createHttpTeacherWorkspaceRepository(() => {
          throw new ApiConfigurationError("invalid deployment configuration");
        })}
        view="overview"
      />,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The teacher workspace API is not configured for this deployment.",
    );
  });

  it("renders the fixture class snapshot without calling the backend", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(
      <TeacherWorkspace
        onNavigate={vi.fn()}
        repository={fixtureTeacherWorkspaceRepository}
        view="overview"
      />,
    );

    expect(
      await screen.findByRole("heading", {
        name: "A teaching plan starts with the evidence.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("repair equivalent fractions")).toBeInTheDocument();
    expect(screen.getByText("Root-cause distribution")).toBeInTheDocument();
    expect(screen.queryByText("Unconfirmed")).not.toBeInTheDocument();
    expect(screen.getByText("stu_demo_06")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uses an injected repository and navigates to the lesson plan", async () => {
    const repository = {
      ...fixtureTeacherWorkspaceRepository,
      getClassSnapshot: vi.fn(() =>
        fixtureTeacherWorkspaceRepository.getClassSnapshot(),
      ),
      getLessonPlan: vi.fn(() =>
        fixtureTeacherWorkspaceRepository.getLessonPlan(),
      ),
    };
    const onNavigate = vi.fn();
    const user = userEvent.setup();

    const { rerender } = render(
      <TeacherWorkspace
        onNavigate={onNavigate}
        repository={repository}
        view="overview"
      />,
    );

    expect(
      await screen.findByText("class_demo_6a / lesson_demo_fractions_01"),
    ).toBeInTheDocument();
    expect(repository.getClassSnapshot).toHaveBeenCalledOnce();
    expect(repository.getLessonPlan).not.toHaveBeenCalled();

    await user.click(screen.getByRole("link", { name: "Lesson plan" }));
    expect(onNavigate).toHaveBeenCalledWith("/teacher/lesson-plan");

    rerender(
      <TeacherWorkspace
        onNavigate={onNavigate}
        repository={repository}
        view="lesson-plan"
      />,
    );

    expect(repository.getLessonPlan).toHaveBeenCalledOnce();
    expect(
      await screen.findByRole("heading", {
        name: "A 45-minute path from evidence to action.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Warm-up confirmation items")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Correct identification of two equivalent fraction pairs",
      ),
    ).toBeInTheDocument();
  });

  it("renders the overview when the unused lesson-plan request rejects", async () => {
    const repository = {
      ...fixtureTeacherWorkspaceRepository,
      getClassSnapshot: vi.fn(() =>
        fixtureTeacherWorkspaceRepository.getClassSnapshot(),
      ),
      getLessonPlan: vi.fn(() => Promise.reject(new Error("unavailable"))),
    };

    render(
      <TeacherWorkspace
        onNavigate={vi.fn()}
        repository={repository}
        view="overview"
      />,
    );

    expect(
      await screen.findByText("class_demo_6a / lesson_demo_fractions_01"),
    ).toBeInTheDocument();
    expect(repository.getLessonPlan).not.toHaveBeenCalled();
  });

  it("renders the lesson plan when the unused snapshot request rejects", async () => {
    const repository = {
      ...fixtureTeacherWorkspaceRepository,
      getClassSnapshot: vi.fn(() => Promise.reject(new Error("unavailable"))),
      getLessonPlan: vi.fn(() =>
        fixtureTeacherWorkspaceRepository.getLessonPlan(),
      ),
    };

    render(
      <TeacherWorkspace
        onNavigate={vi.fn()}
        repository={repository}
        view="lesson-plan"
      />,
    );

    expect(
      await screen.findByRole("heading", {
        name: "A 45-minute path from evidence to action.",
      }),
    ).toBeInTheDocument();
    expect(repository.getClassSnapshot).not.toHaveBeenCalled();
  });

  it("creates a new version for a group move and duration edit", async () => {
    const repository = {
      ...fixtureTeacherWorkspaceRepository,
      createVersion: vi.fn((snapshot, lessonPlan, expectedParentVersion) =>
        fixtureTeacherWorkspaceRepository.createVersion(
          snapshot,
          lessonPlan,
          expectedParentVersion,
        ),
      ),
    };
    const user = userEvent.setup();

    render(
      <TeacherWorkspace
        onNavigate={vi.fn()}
        repository={repository}
        view="lesson-plan"
      />,
    );

    await screen.findByText("Warm-up confirmation items");
    await user.clear(
      screen.getByLabelText("Warm-up confirmation items duration"),
    );
    await user.type(
      screen.getByLabelText("Warm-up confirmation items duration"),
      "4",
    );
    await user.selectOptions(
      screen.getByLabelText("Move stu_demo_01"),
      "grp_demo_repair_denominator",
    );
    await user.click(screen.getByRole("button", { name: "Save teacher edit" }));

    expect(repository.createVersion).toHaveBeenCalledOnce();
    const [snapshot, plan] = repository.createVersion.mock.calls[0];
    expect(plan.total_duration_minutes).toBe(44);
    expect(snapshot.groups[0].student_ids).not.toContain("stu_demo_01");
    expect(snapshot.groups[1].student_ids).toContain("stu_demo_01");
    expect(
      await screen.findByText("Version 2 · pending decision"),
    ).toBeInTheDocument();
  });

  it("requires approval before publishing", async () => {
    const user = userEvent.setup();

    render(
      <TeacherWorkspace
        onNavigate={vi.fn()}
        repository={fixtureTeacherWorkspaceRepository}
        view="lesson-plan"
      />,
    );

    await screen.findByText("Version 1 · pending decision");
    expect(screen.getByRole("button", { name: "Publish plan" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Approve plan" }));
    expect(
      await screen.findByText("Version 2 · approved decision"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publish plan" })).toBeEnabled();
  });
});
