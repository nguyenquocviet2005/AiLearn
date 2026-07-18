import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { TeacherPlanVersionV1 } from "@ailearn/schemas";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createHttpTeacherWorkspaceRepository } from "@/lib/adapters/teacher-repository";
import type { TeacherWorkspaceRepository } from "@/lib/adapters/teacher-workspace-repository";
import { ApiConfigurationError } from "@/lib/api-base-url";
import { fixtureTeacherWorkspaceRepository } from "@/test/teacher-fixtures";
import { TeacherWorkspace } from "./TeacherWorkspace";

afterEach(() => {
  window.history.pushState({}, "", "/");
  vi.unstubAllGlobals();
});

async function statefulTeacherRepository(): Promise<TeacherWorkspaceRepository> {
  let current = await fixtureTeacherWorkspaceRepository.getLessonPlan();
  function preserveCurrentPlan(next: TeacherPlanVersionV1) {
    current = {
      ...next,
      snapshot: current.snapshot,
      lesson_plan: {
        ...current.lesson_plan,
        status: next.lesson_plan.status,
      },
    };
    return current;
  }
  return {
    ...fixtureTeacherWorkspaceRepository,
    async getLessonPlan() {
      return current;
    },
    async createVersion(snapshot, lessonPlan, expectedParentVersion) {
      current = await fixtureTeacherWorkspaceRepository.createVersion(
        snapshot,
        lessonPlan,
        expectedParentVersion,
      );
      return current;
    },
    async approve(planId, expectedParentVersion) {
      return preserveCurrentPlan(
        await fixtureTeacherWorkspaceRepository.approve(
          planId,
          expectedParentVersion,
        ),
      );
    },
    async reject(planId, expectedParentVersion) {
      return preserveCurrentPlan(
        await fixtureTeacherWorkspaceRepository.reject(
          planId,
          expectedParentVersion,
        ),
      );
    },
    async publish(planId, expectedParentVersion) {
      return preserveCurrentPlan(
        await fixtureTeacherWorkspaceRepository.publish(
          planId,
          expectedParentVersion,
        ),
      );
    },
  };
}

function lessonPlanStatus() {
  return screen.getByRole("region", { name: "Lesson plan status" });
}

describe("TeacherWorkspace", () => {
  it("loads the deterministic Grade 7 class overview through the configured API", async () => {
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
        name: "Choose the next teaching move with evidence.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("class_g7a_demo")).toBeInTheDocument();
    expect(
      screen.getByText("lesson_g7_inverse_proportion_01"),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/v1/classes/class_g7a_demo/snapshot",
      expect.any(Object),
    );
  });

  it("uses the shared brand link, skip link, and persistent navigation", async () => {
    const onNavigate = vi.fn();
    const user = userEvent.setup();
    render(
      <TeacherWorkspace
        onNavigate={onNavigate}
        repository={fixtureTeacherWorkspaceRepository}
        view="overview"
      />,
    );

    await screen.findByRole("heading", {
      name: "Choose the next teaching move with evidence.",
    });
    const rail = screen.getByRole("complementary", {
      name: "Không gian giáo viên",
    });
    const brandLink = within(rail).getByRole("link", {
      name: "AiLearn - trang chủ",
    });
    expect(brandLink).toHaveAttribute("href", "/");
    expect(brandLink.querySelector("img")).toHaveAttribute(
      "src",
      "/brand/ailearn-mascot.webp",
    );
    expect(
      screen.getByRole("link", { name: "Đi tới nội dung chính" }),
    ).toHaveAttribute("href", "#teacher-main");
    expect(screen.getByRole("link", { name: "Tổng quan lớp" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await user.click(screen.getByRole("link", { name: "Kế hoạch bài dạy" }));
    expect(onNavigate).toHaveBeenCalledWith("/teacher/lesson-plan");
    await user.click(screen.getByRole("link", { name: "Báo cáo can thiệp" }));
    expect(onNavigate).toHaveBeenCalledWith("/teacher/report");
  });

  it("renders the complete synthetic class without calling the backend", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(
      <TeacherWorkspace
        onNavigate={vi.fn()}
        repository={fixtureTeacherWorkspaceRepository}
        view="overview"
      />,
    );

    await screen.findByRole("heading", {
      name: "Choose the next teaching move with evidence.",
    });
    const summary = screen.getByRole("region", {
      name: "Class readiness summary",
    });
    expect(within(summary).getByText("40")).toBeInTheDocument();
    expect(
      screen.getAllByText("ratio proportion basics").length,
    ).toBeGreaterThan(0);
    expect(screen.getByText("Root-cause distribution")).toBeInTheDocument();
    expect(
      screen.getByText(/15 learners need confirmation/),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("retries a failed overview request", async () => {
    const repository = {
      ...fixtureTeacherWorkspaceRepository,
      getClassSnapshot: vi
        .fn()
        .mockRejectedValueOnce(new Error("offline"))
        .mockImplementationOnce(() =>
          fixtureTeacherWorkspaceRepository.getClassSnapshot(),
        ),
    };
    const user = userEvent.setup();

    render(
      <TeacherWorkspace
        onNavigate={vi.fn()}
        repository={repository}
        view="overview"
      />,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The teacher workspace data could not be loaded. Try again.",
    );
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(
      await screen.findByRole("heading", {
        name: "Choose the next teaching move with evidence.",
      }),
    ).toBeInTheDocument();
    expect(repository.getClassSnapshot).toHaveBeenCalledTimes(2);
  });

  it("distinguishes deployment configuration from API availability", async () => {
    const { rerender } = render(
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

    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );
    rerender(
      <TeacherWorkspace
        onNavigate={vi.fn()}
        repository={createHttpTeacherWorkspaceRepository(
          () => "https://api.example.test",
        )}
        view="overview"
      />,
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The teacher workspace API is unavailable. Check the connection and try again.",
    );
  });

  it("loads and approves a lesson plan through the configured API", async () => {
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

    await screen.findByRole("heading", {
      name: "Shape a 45-minute path from evidence to action.",
    });
    await user.click(screen.getByRole("button", { name: "Approve plan" }));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Plan approved as version 2.",
    );
    expect(within(lessonPlanStatus()).getAllByText("approved")).toHaveLength(2);
    expect(fetchMock).toHaveBeenLastCalledWith(
      "https://api.example.test/api/v1/lesson-plans/plan_class_g7a_demo_lesson_g7_inverse_proportion_01/approve",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("preserves a saved edit through reload, approval, publication, and later reloads", async () => {
    const repository = await statefulTeacherRepository();
    const user = userEvent.setup();
    let view = render(
      <TeacherWorkspace
        onNavigate={vi.fn()}
        repository={repository}
        view="lesson-plan"
      />,
    );

    await screen.findByText("Readiness confirmation warm-up");
    await user.clear(
      screen.getByLabelText("Readiness confirmation warm-up duration"),
    );
    await user.type(
      screen.getByLabelText("Readiness confirmation warm-up duration"),
      "4",
    );
    await user.selectOptions(
      screen.getByLabelText("Move stu_g7_004"),
      "grp_02_skill_fraction_multiplication",
    );
    expect(
      screen.getByRole("button", { name: "Save teacher edit" }),
    ).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Save teacher edit" }));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Teacher edit saved as version 2.",
    );
    expect(within(lessonPlanStatus()).getByText("2")).toBeInTheDocument();

    view.unmount();
    view = render(
      <TeacherWorkspace
        onNavigate={vi.fn()}
        repository={repository}
        view="lesson-plan"
      />,
    );
    expect(await screen.findByDisplayValue("4")).toHaveAttribute(
      "aria-label",
      "Readiness confirmation warm-up duration",
    );
    expect(within(lessonPlanStatus()).getByText("2")).toBeInTheDocument();
    expect(screen.getByLabelText("Move stu_g7_004")).toHaveValue(
      "grp_02_skill_fraction_multiplication",
    );

    await user.click(screen.getByRole("button", { name: "Approve plan" }));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Plan approved as version 3.",
    );

    view.unmount();
    view = render(
      <TeacherWorkspace
        onNavigate={vi.fn()}
        repository={repository}
        view="lesson-plan"
      />,
    );
    expect(await screen.findByDisplayValue("4")).toHaveAttribute(
      "aria-label",
      "Readiness confirmation warm-up duration",
    );
    expect(within(lessonPlanStatus()).getAllByText("approved")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Publish plan" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Publish plan" }));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Plan published as version 4.",
    );

    view.unmount();
    render(
      <TeacherWorkspace
        onNavigate={vi.fn()}
        repository={repository}
        view="lesson-plan"
      />,
    );
    expect(await screen.findByDisplayValue("4")).toHaveAttribute(
      "aria-label",
      "Readiness confirmation warm-up duration",
    );
    expect(
      within(lessonPlanStatus()).getByText("published"),
    ).toBeInTheDocument();
    expect(
      within(lessonPlanStatus()).getByText("approved"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publish plan" })).toBeDisabled();
  });

  it("preserves a rejected decision after reload and prevents a duplicate rejection", async () => {
    const repository = await statefulTeacherRepository();
    const user = userEvent.setup();
    const view = render(
      <TeacherWorkspace
        onNavigate={vi.fn()}
        repository={repository}
        view="lesson-plan"
      />,
    );

    await screen.findByRole("heading", {
      name: "Shape a 45-minute path from evidence to action.",
    });
    await user.click(screen.getByRole("button", { name: "Reject draft" }));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Plan rejected as version 2",
    );
    expect(screen.getByRole("button", { name: "Reject draft" })).toBeDisabled();

    view.unmount();
    render(
      <TeacherWorkspace
        onNavigate={vi.fn()}
        repository={repository}
        view="lesson-plan"
      />,
    );
    expect(
      within(
        await screen.findByRole("region", { name: "Lesson plan status" }),
      ).getByText("rejected"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reject draft" })).toBeDisabled();
  });

  it("enforces approval before one-time publication", async () => {
    const repository = await statefulTeacherRepository();
    const user = userEvent.setup();
    render(
      <TeacherWorkspace
        onNavigate={vi.fn()}
        repository={repository}
        view="lesson-plan"
      />,
    );

    await screen.findByRole("heading", {
      name: "Shape a 45-minute path from evidence to action.",
    });
    expect(
      screen.getByRole("button", { name: "Save teacher edit" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Publish plan" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Approve plan" }));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Plan approved as version 2.",
    );
    expect(screen.getByRole("button", { name: "Approve plan" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Publish plan" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Publish plan" }));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Plan published as version 3.",
    );
    expect(screen.getByRole("button", { name: "Publish plan" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reject draft" })).toBeDisabled();
  });

  it("explains invalid duration and stale-version failures", async () => {
    const initial = await fixtureTeacherWorkspaceRepository.getLessonPlan();
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({ ok: true, json: async () => initial })
        .mockResolvedValueOnce({
          ok: false,
          status: 409,
          json: async () => ({
            detail: {
              code: "stale_lesson_plan_version",
              message: "Refresh before changing the teacher plan.",
            },
          }),
        }),
    );
    const repository = createHttpTeacherWorkspaceRepository(
      () => "https://api.example.test",
    );
    const user = userEvent.setup();
    render(
      <TeacherWorkspace
        onNavigate={vi.fn()}
        repository={repository}
        view="lesson-plan"
      />,
    );

    await screen.findByText("Readiness confirmation warm-up");
    await user.click(screen.getByRole("button", { name: "Approve plan" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This plan changed in another session. Reload the latest version before continuing.",
    );

    await user.clear(
      screen.getByLabelText("Readiness confirmation warm-up duration"),
    );
    await user.type(
      screen.getByLabelText("Readiness confirmation warm-up duration"),
      "46",
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Each activity needs a whole number of minutes",
    );
    expect(
      screen.getByRole("button", { name: "Save teacher edit" }),
    ).toBeDisabled();
  });
});
