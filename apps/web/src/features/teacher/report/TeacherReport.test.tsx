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
        name: "Thấy rõ điều đã đổi và điều cần dạy tiếp.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Một lần làm đúng chưa phải là vận dụng."),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Đã vận dụng độc lập")).toHaveLength(2);
    expect(screen.getAllByText("Cần giáo viên hỗ trợ")).toHaveLength(2);
    expect(screen.getByText("ev_stu_g7_003_001")).toBeInTheDocument();
    expect(screen.getByText("Chưa có bằng chứng")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Re-teach inverse-proportion setup and fraction multiplication before work-rate transfer.",
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: /Mở bản in/ }));
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
