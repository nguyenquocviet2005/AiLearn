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
        name: "Nhìn rõ điều đã thay đổi và nội dung vẫn cần dạy.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Làm đúng khi có hỗ trợ chưa phải là vận dụng."),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Đã vận dụng độc lập")).toHaveLength(2);
    expect(screen.getAllByText("Cần giáo viên can thiệp")).toHaveLength(2);
    expect(screen.getByText(/ev_stu_g7_003_post_001/)).toBeInTheDocument();
    expect(screen.getByText("Chưa ghi nhận bằng chứng")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Củng cố cách lập quan hệ tỉ lệ nghịch và phép nhân phân số trước khi vận dụng vào bài toán năng suất.",
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Mở bản in" }));
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
      "Không thể tải dữ liệu báo cáo can thiệp.",
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
      "Không thể tải dữ liệu báo cáo can thiệp.",
    );
    await user.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(screen.getByText("Đang tải kết quả can thiệp")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Thử lại" })).toBeNull();
    resolveRetry(reportTestFixture);
    expect(
      await screen.findByRole("heading", {
        name: "Nhìn rõ điều đã thay đổi và nội dung vẫn cần dạy.",
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
      "API báo cáo can thiệp chưa được cấu hình cho bản triển khai này.",
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
      "API báo cáo can thiệp đang không khả dụng. Vui lòng thử lại sau.",
    );
  });
});
