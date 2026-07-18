import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TeacherRepositoryError } from "@/lib/adapters/teacher-repository";
import { TeacherReport } from "./TeacherReport";
import { reportTestFixture, reportTestRepository } from "./report-test-fixture";

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
    expect(screen.getByText(/ev_stu_g7_003_post_001/)).toBeInTheDocument();
    expect(screen.getByText("No evidence recorded")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Re-teach inverse-proportion setup and fraction multiplication before work-rate transfer.",
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

  it("retries the report request after a temporary failure", async () => {
    let resolveRetry!: (report: typeof reportTestFixture) => void;
    const retryRequest = new Promise<typeof reportTestFixture>((resolve) => {
      resolveRetry = resolve;
    });
    const repository = {
      getReport: vi
        .fn()
        .mockRejectedValueOnce(new Error("offline"))
        .mockReturnValueOnce(retryRequest),
    };
    const user = userEvent.setup();

    render(<TeacherReport onNavigate={vi.fn()} repository={repository} />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The intervention report data could not be loaded.",
    );
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(
      screen.getByText("Loading intervention outcomes"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
    resolveRetry(reportTestFixture);
    expect(
      await screen.findByRole("heading", {
        name: "See what changed—and what still needs teaching.",
      }),
    ).toBeInTheDocument();
    expect(repository.getReport).toHaveBeenCalledTimes(2);
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
