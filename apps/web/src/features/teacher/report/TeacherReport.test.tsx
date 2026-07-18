import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TeacherRepositoryError } from "@/lib/adapters/teacher-repository";
import { TeacherReport } from "./TeacherReport";
import { reportTestRepository } from "./report-test-fixture";

describe("TeacherReport", () => {
  it("shows outcome counts, individual evidence, and the transfer boundary", async () => {
    const onNavigate = vi.fn();
    const user = userEvent.setup();

    render(
      <TeacherReport
        onNavigate={onNavigate}
        repository={reportTestRepository}
      />,
    );

    expect(
      await screen.findByRole("heading", {
        name: "See what changed—and what still needs teaching.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Immediate success is not transfer."),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Passed independent transfer")).toHaveLength(2);
    expect(screen.getAllByText("Teacher escalation")).toHaveLength(2);
    expect(screen.getByText("ev_demo_012")).toBeInTheDocument();
    expect(screen.getByText("No evidence recorded")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Re-teach equivalent fractions before unlike-fraction addition.",
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Open printable view" }));
    expect(onNavigate).toHaveBeenCalledWith("/teacher/report/print");
  });

  it("shows an explicit error when the report cannot load", async () => {
    render(
      <TeacherReport
        onNavigate={vi.fn()}
        repository={{ getReport: () => Promise.reject(new Error("offline")) }}
      />,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The intervention report data could not be loaded.",
    );
  });

  it("distinguishes deployment configuration from API availability", async () => {
    const { rerender } = render(
      <TeacherReport
        onNavigate={vi.fn()}
        repository={{
          getReport: () =>
            Promise.reject(
              new TeacherRepositoryError("configuration", "invalid URL"),
            ),
        }}
      />,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The intervention report API is not configured for this deployment.",
    );

    rerender(
      <TeacherReport
        onNavigate={vi.fn()}
        repository={{
          getReport: () =>
            Promise.reject(
              new TeacherRepositoryError("unavailable", "offline"),
            ),
        }}
      />,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The intervention report API is unavailable. Try again later.",
    );
  });
});
