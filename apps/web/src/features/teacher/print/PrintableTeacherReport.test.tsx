import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  reportTestPlan,
  reportTestRepository,
} from "@/features/teacher/report/report-test-fixture";
import { fixtureTeacherWorkspaceRepository } from "@/test/teacher-fixtures";
import { PrintableTeacherReport } from "./PrintableTeacherReport";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PrintableTeacherReport", () => {
  it("combines the report and lesson plan in a printable low-bandwidth view", async () => {
    const print = vi.fn();
    vi.stubGlobal("print", print);
    const user = userEvent.setup();

    const plan = await reportTestPlan();
    const planRepository = {
      ...fixtureTeacherWorkspaceRepository,
      getLessonPlan: vi.fn().mockResolvedValue(plan),
    };
    const { container } = render(
      <PrintableTeacherReport
        planRepository={planRepository}
        reportRepository={reportTestRepository}
      />,
    );

    expect(
      await screen.findByRole("heading", {
        name: "Báo cáo can thiệp và kế hoạch bài dạy",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Khởi động xác nhận mức sẵn sàng · 5 phút"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Làm đúng khi có hỗ trợ chưa phải là vận dụng."),
    ).toBeInTheDocument();
    expect(container.querySelector("img")).not.toBeInTheDocument();
    expect(planRepository.getLessonPlan).toHaveBeenCalledWith(
      "plan_class_g7a_demo_lesson_g7_inverse_proportion_01",
    );

    await user.click(
      screen.getByRole("button", {
        name: "In báo cáo và kế hoạch bài dạy",
      }),
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
        name: "Báo cáo can thiệp",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/ev_stu_g7_003_post_001/)).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Không tìm thấy kế hoạch bài dạy tương ứng",
    );
    expect(
      screen.getByRole("button", { name: "In báo cáo" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Báo cáo can thiệp" }),
    ).toBeInTheDocument();
  });

  it("does not combine the report with a mismatched lesson plan", async () => {
    const mismatchedPlan = await reportTestPlan();
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
      "Không tìm thấy kế hoạch bài dạy tương ứng",
    );
    expect(
      screen.getByRole("heading", { name: "Báo cáo can thiệp" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Khởi động xác nhận mức sẵn sàng · 5 phút"),
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

    expect(screen.queryByRole("button", { name: /In báo cáo/ })).toBeNull();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Không thể tải dữ liệu báo cáo can thiệp.",
    );
    expect(screen.queryByRole("button", { name: /In báo cáo/ })).toBeNull();
  });
});
