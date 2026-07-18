import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { fixtureTeacherWorkspaceRepository } from "@/lib/adapters/teacher-fixtures";
import { reportTestRepository } from "@/features/teacher/report/report-test-fixture";
import { PrintableTeacherReport } from "./PrintableTeacherReport";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PrintableTeacherReport", () => {
  it("combines the report and lesson plan in a printable low-bandwidth view", async () => {
    const print = vi.fn();
    vi.stubGlobal("print", print);
    const user = userEvent.setup();

    const planRepository = {
      ...fixtureTeacherWorkspaceRepository,
      getLessonPlan: vi.fn(() =>
        fixtureTeacherWorkspaceRepository.getLessonPlan(),
      ),
    };
    const { container } = render(
      <PrintableTeacherReport
        planRepository={planRepository}
        reportRepository={reportTestRepository}
      />,
    );

    expect(
      await screen.findByRole("heading", {
        name: "Intervention report and lesson plan",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Warm-up confirmation items · 5 min"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Immediate success is not transfer."),
    ).toBeInTheDocument();
    expect(container.querySelector("img")).not.toBeInTheDocument();
    expect(planRepository.getLessonPlan).toHaveBeenCalledWith(
      "plan_demo_fractions_01",
    );

    await user.click(
      screen.getByRole("button", { name: "Print report and lesson plan" }),
    );
    expect(print).toHaveBeenCalledOnce();
  });

  it("keeps the report printable when the matching lesson plan is unavailable", async () => {
    render(
      <PrintableTeacherReport
        planRepository={{
          ...fixtureTeacherWorkspaceRepository,
          getLessonPlan: () => Promise.reject(new Error("offline")),
        }}
        reportRepository={reportTestRepository}
      />,
    );

    expect(
      await screen.findByRole("heading", {
        name: "Intervention report",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("ev_demo_012")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "The matching lesson plan is unavailable",
    );
    expect(
      screen.getByRole("button", { name: "Print report" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Intervention report" }),
    ).toBeInTheDocument();
  });

  it("does not combine the report with a mismatched lesson plan", async () => {
    const mismatchedPlan =
      await fixtureTeacherWorkspaceRepository.getLessonPlan();
    render(
      <PrintableTeacherReport
        planRepository={{
          ...fixtureTeacherWorkspaceRepository,
          getLessonPlan: async () => ({
            ...mismatchedPlan,
            plan_id: "plan_for_another_lesson",
          }),
        }}
        reportRepository={reportTestRepository}
      />,
    );

    expect(await screen.findByRole("status")).toHaveTextContent(
      "The matching lesson plan is unavailable",
    );
    expect(
      screen.getByRole("heading", { name: "Intervention report" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Warm-up confirmation items · 5 min"),
    ).not.toBeInTheDocument();
  });

  it("shows an error if the intervention report cannot load", async () => {
    render(
      <PrintableTeacherReport
        planRepository={fixtureTeacherWorkspaceRepository}
        reportRepository={{
          getReport: () => Promise.reject(new Error("offline")),
        }}
      />,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The printable report is unavailable.",
    );
  });
});
