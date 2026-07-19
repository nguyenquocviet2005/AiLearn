import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { TeacherRoute } from "../TeacherShell";
import { TeacherRepositoryError } from "@/lib/adapters/teacher-repository";
import { fixtureTeacherWorkspaceRepository } from "@/test/teacher-fixtures";
import { TeacherProductWorkspace } from "./TeacherProductWorkspace";

beforeEach(() => {
  window.sessionStorage.clear();
});

afterEach(() => {
  cleanup();
});

describe("TeacherProductWorkspace", () => {
  it.each([
    ["/teacher", "Chào buổi sáng, cô Hà."],
    ["/teacher/analytics", "Nhìn nhanh lớp 7A trước khi vào tiết."],
    ["/teacher/classes", "Một nơi để theo dõi cả lớp và từng bài học."],
    ["/teacher/prepare", "Chuẩn bị bài dạy từ mục tiêu đến minh chứng."],
    ["/teacher/insights", "Hiểu nguyên nhân trước khi chọn cách dạy."],
    ["/teacher/students", "Không để số liệu trung bình che mất một học sinh."],
    ["/teacher/teaching", "Tập trung vào lớp học, không phải bảng điều khiển."],
    ["/teacher/after-class", "Khép vòng lặp bằng minh chứng sau tiết học."],
    [
      "/teacher/interventions",
      "Củng cố đến khi học sinh thực sự vận dụng được.",
    ],
    ["/teacher/resources", "Học liệu theo nhu cầu của lớp."],
  ] as const)("renders the useful teacher route %s", async (route, heading) => {
    render(
      <TeacherProductWorkspace
        onNavigate={vi.fn()}
        repository={fixtureTeacherWorkspaceRepository}
        route={route}
      />,
    );

    expect(
      await screen.findByRole("heading", { level: 1, name: heading }),
    ).toBeInTheDocument();
    expect(screen.getByText("Cô Nguyễn Thu Hà")).toBeInTheDocument();
    expect(screen.queryByText("Dữ liệu minh hoạ")).not.toBeInTheDocument();
    expect(screen.queryByText(/stu_g7_/)).not.toBeInTheDocument();
  });

  it("calculates class charts and shows Vietnamese priority names", async () => {
    render(
      <TeacherProductWorkspace
        onNavigate={vi.fn()}
        repository={fixtureTeacherWorkspaceRepository}
        route="/teacher/analytics"
      />,
    );

    expect(
      await screen.findByRole("heading", { name: "Toàn lớp" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: /Mức sẵn sàng/ }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText("Nền tảng tỉ số và tỉ lệ thức").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Phân biệt tỉ lệ thuận và tỉ lệ nghịch").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByText(
        "Dành 30 phút trong kế hoạch hiện tại — thời lượng dài nhất.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText("Bài toán năng suất thực tế").length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("Nhân phân số").length).toBeGreaterThan(0);
    expect(
      screen.getByText("Kết nối tri thức với cuộc sống"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Ba buổi cần chuẩn bị" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Từ kiến thức nền đến mục tiêu bài học",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/skill_ratio_proportion_basics/),
    ).not.toBeInTheDocument();
  });

  it("filters the real snapshot rows and opens a Vietnamese student profile", async () => {
    const user = userEvent.setup();
    render(
      <TeacherProductWorkspace
        onNavigate={vi.fn()}
        repository={fixtureTeacherWorkspaceRepository}
        route="/teacher/students"
      />,
    );

    await screen.findByRole("heading", {
      name: "Không để số liệu trung bình che mất một học sinh.",
    });
    await user.type(
      screen.getByRole("textbox", { name: "Tìm học sinh" }),
      "Nguyễn Minh Anh",
    );
    expect(screen.getByText("1 kết quả")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Nguyễn Minh Anh/ }));
    const drawer = screen.getByRole("dialog", { name: "Nguyễn Minh Anh" });
    expect(
      within(drawer).getByText("Kết luận có thể giải thích"),
    ).toBeInTheDocument();
    expect(within(drawer).getByText("Dòng minh chứng")).toBeInTheDocument();
    await user.click(
      within(drawer).getByRole("button", { name: "Yêu cầu thêm minh chứng" }),
    );
    expect(
      within(drawer).getByRole("button", { name: "Đã yêu cầu minh chứng" }),
    ).toBeDisabled();
    const groupSelect = within(drawer).getByLabelText("Nhóm giảng dạy");
    await user.selectOptions(
      groupSelect,
      groupSelect.querySelectorAll("option")[1],
    );
    await user.type(
      within(drawer).getByLabelText("Lý do điều chỉnh *"),
      "Quan sát trực tiếp cho thấy em phù hợp với nhóm này.",
    );
    await user.click(
      within(drawer).getByRole("button", { name: "Lưu điều chỉnh nhóm" }),
    );
    const diagnosisSelect = within(drawer).getByLabelText(
      "Nguyên nhân gốc sau điều chỉnh",
    );
    await user.selectOptions(
      diagnosisSelect,
      diagnosisSelect.querySelectorAll("option")[0],
    );
    await user.type(
      within(drawer).getByLabelText("Lý do chuyên môn *"),
      "Em giải thích đúng kỹ năng khi trao đổi trực tiếp.",
    );
    await user.click(
      within(drawer).getByRole("button", {
        name: "Lưu ghi đè chẩn đoán",
      }),
    );
    await user.click(
      within(drawer).getByRole("button", { name: "Giao lộ trình củng cố" }),
    );
    expect(
      window.sessionStorage.getItem("ailearn-teacher-demo-progress"),
    ).toContain("stu_g7_001");
  });

  it("progresses through teaching mode and can reset the demo safely", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    const pendingPlan = await fixtureTeacherWorkspaceRepository.getLessonPlan();
    const approvedPlan = await fixtureTeacherWorkspaceRepository.approve(
      pendingPlan.plan_id,
      pendingPlan.version,
    );
    const approvedRepository = {
      ...fixtureTeacherWorkspaceRepository,
      async getLessonPlan() {
        return approvedPlan;
      },
    };
    render(
      <TeacherProductWorkspace
        onNavigate={onNavigate}
        repository={approvedRepository}
        route="/teacher/teaching"
      />,
    );

    await user.click(
      await screen.findByRole("button", {
        name: "Bắt đầu Chế độ giảng dạy",
      }),
    );
    expect(screen.getByText(/Đang giảng dạy · Pha 1/)).toBeInTheDocument();
    expect(
      window.sessionStorage.getItem("ailearn-teacher-demo-progress"),
    ).toContain('"teachingStarted":true');

    await user.type(
      screen.getByRole("textbox", { name: /Ghi nhận nhanh/ }),
      "Nhóm A giải thích được tích không đổi.",
    );
    await user.click(screen.getByRole("button", { name: "Lưu quan sát" }));
    expect(
      window.sessionStorage.getItem("ailearn-teacher-demo-progress"),
    ).toContain("Nhóm A giải thích được tích không đổi.");
    while (
      screen.queryByRole("button", { name: "Chuyển sang pha tiếp theo" })
    ) {
      await user.click(
        screen.getByRole("button", { name: "Chuyển sang pha tiếp theo" }),
      );
    }
    await user.click(
      screen.getByRole("button", { name: "Hoàn thành tiết học" }),
    );
    expect(
      screen.getByRole("button", { name: "Xem kết quả sau giờ học" }),
    ).toBeEnabled();

    expect(
      screen.queryByRole("button", { name: "Đặt lại tiến trình demo" }),
    ).not.toBeInTheDocument();
  });

  it("turns teacher preparation, group inspection, and resources into visible actions", async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <TeacherProductWorkspace
        onNavigate={vi.fn()}
        repository={fixtureTeacherWorkspaceRepository}
        route="/teacher/prepare"
      />,
    );

    const objective = await screen.findByLabelText(/Mục tiêu bài học/);
    await user.clear(objective);
    await user.type(objective, "Vận dụng tỉ lệ nghịch để lập kế hoạch.");
    await user.type(
      screen.getByLabelText(/Ghi chú của giáo viên/),
      "Ưu tiên bảng biểu trực quan.",
    );
    await user.click(
      await screen.findByRole("button", { name: "Lưu thông tin chuẩn bị" }),
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Đã lưu thông tin chuẩn bị trong bản demo",
    );
    unmount();
    const nextRender = render(
      <TeacherProductWorkspace
        onNavigate={vi.fn()}
        repository={fixtureTeacherWorkspaceRepository}
        route="/teacher/prepare"
      />,
    );
    expect(await screen.findByLabelText(/Mục tiêu bài học/)).toHaveValue(
      "Vận dụng tỉ lệ nghịch để lập kế hoạch.",
    );

    nextRender.rerender(
      <TeacherProductWorkspace
        onNavigate={vi.fn()}
        repository={fixtureTeacherWorkspaceRepository}
        route="/teacher/insights"
      />,
    );
    await user.click(
      (await screen.findAllByRole("button", { name: "Xem nhóm" }))[0],
    );
    expect(screen.getByRole("status")).toHaveTextContent(/Mục tiêu:/);

    nextRender.rerender(
      <TeacherProductWorkspace
        onNavigate={vi.fn()}
        repository={fixtureTeacherWorkspaceRepository}
        route="/teacher/resources"
      />,
    );
    await user.click(
      (await screen.findAllByRole("button", { name: "Xem trước" }))[0],
    );
    expect(
      screen.getByRole("dialog", { name: /Xem trước Phân biệt tỉ lệ/ }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Đóng xem trước học liệu" }),
    );
    await user.click(
      screen.getAllByRole("button", { name: "Gắn vào kế hoạch" })[0],
    );
    expect(screen.getByRole("button", { name: "Đã gắn" })).toBeDisabled();
  });

  it("distinguishes an API failure and preserves the teacher's saved browser work", async () => {
    const repository = {
      ...fixtureTeacherWorkspaceRepository,
      getClassSnapshot: vi.fn().mockRejectedValue(new Error("unavailable")),
    };
    render(
      <TeacherProductWorkspace
        onNavigate={vi.fn<(path: TeacherRoute) => void>()}
        repository={repository}
        route="/teacher"
      />,
    );

    expect(
      await screen.findByRole("heading", {
        name: "Không thể tải Không gian giáo viên.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Phần việc đã lưu trên trình duyệt vẫn an toàn/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Kiểm tra lại kết nối" }),
    ).toBeEnabled();
  });

  it("explains a missing deployment API configuration precisely", async () => {
    const repository = {
      ...fixtureTeacherWorkspaceRepository,
      getClassSnapshot: vi
        .fn()
        .mockRejectedValue(
          new TeacherRepositoryError("configuration", "missing base URL"),
        ),
    };
    render(
      <TeacherProductWorkspace
        onNavigate={vi.fn()}
        repository={repository}
        route="/teacher"
      />,
    );

    expect(await screen.findByText(/VITE_API_BASE_URL/)).toBeInTheDocument();
    expect(
      screen.getByText("Kết nối dữ liệu bị gián đoạn"),
    ).toBeInTheDocument();
  });

  it("blocks Teaching Mode until the teacher approves the plan", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(
      <TeacherProductWorkspace
        onNavigate={onNavigate}
        repository={fixtureTeacherWorkspaceRepository}
        route="/teacher/teaching"
      />,
    );

    expect(
      await screen.findByRole("heading", {
        name: "Kế hoạch chưa được phê duyệt.",
      }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Xem và phê duyệt kế hoạch" }),
    );
    expect(onNavigate).toHaveBeenCalledWith("/teacher/lesson-plan");
  });

  it("keeps snapshot insights available when only the plan request fails", async () => {
    const repository = {
      ...fixtureTeacherWorkspaceRepository,
      getLessonPlan: vi.fn().mockRejectedValue(new Error("plan unavailable")),
    };
    render(
      <TeacherProductWorkspace
        onNavigate={vi.fn()}
        repository={repository}
        route="/teacher/insights"
      />,
    );

    expect(
      await screen.findByRole("heading", {
        name: "Phân tích lớp vẫn sẵn sàng.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Ảnh chụp lớp đã tải; kế hoạch bài dạy tạm thời gián đoạn.",
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText("40").length).toBeGreaterThan(0);
  });

  it("closes the student dialog with Escape and restores trigger focus", async () => {
    const user = userEvent.setup();
    render(
      <TeacherProductWorkspace
        onNavigate={vi.fn()}
        repository={fixtureTeacherWorkspaceRepository}
        route="/teacher/students"
      />,
    );
    const trigger = await screen.findByRole("button", {
      name: /Nguyễn Minh Anh/,
    });
    await user.click(trigger);
    expect(
      screen.getByRole("dialog", { name: "Nguyễn Minh Anh" }),
    ).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(
      screen.queryByRole("dialog", { name: "Nguyễn Minh Anh" }),
    ).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
