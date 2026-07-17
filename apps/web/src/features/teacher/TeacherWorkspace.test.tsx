import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import App from "@/App";
import { fixtureTeacherWorkspaceRepository } from "@/lib/adapters/teacher-fixtures";
import { TeacherWorkspace } from "./TeacherWorkspace";

afterEach(() => {
  window.history.pushState({}, "", "/");
  vi.unstubAllGlobals();
});

describe("TeacherWorkspace", () => {
  it("renders the fixture class snapshot without calling the backend", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    window.history.pushState({}, "", "/teacher");

    render(<App />);

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
});
