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
  return screen.getByRole("region", {
    name: "Trạng thái kế hoạch bài dạy",
  });
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
        name: "Chọn bước dạy tiếp theo bằng bằng chứng.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Lớp: Lớp 7A")).toBeInTheDocument();
    expect(
      screen.getByText("Bài học: Đại lượng tỉ lệ nghịch"),
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
      name: "Chọn bước dạy tiếp theo bằng bằng chứng.",
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

    await user.click(screen.getByRole("button", { name: "4 Chốt kế hoạch" }));
    expect(onNavigate).toHaveBeenCalledWith("/teacher/lesson-plan");
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
      name: "Chọn bước dạy tiếp theo bằng bằng chứng.",
    });
    const summary = screen.getByRole("region", {
      name: "Tóm tắt mức sẵn sàng của lớp",
    });
    expect(within(summary).getByText("40")).toBeInTheDocument();
    expect(screen.getAllByText("Tỉ số và tỉ lệ thức").length).toBeGreaterThan(
      0,
    );
    expect(screen.getByText("Phân bố nguyên nhân gốc")).toBeInTheDocument();
    expect(
      screen.getByText(/2 học sinh cần được xác nhận/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Nhầm tỉ lệ thuận và tỉ lệ nghịch",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Tỉ số và tỉ lệ thức",
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("11 học sinh")).not.toHaveLength(0);
    expect(screen.getAllByText("4 học sinh")).not.toHaveLength(0);
    expect(screen.queryByText(/skill_/)).not.toBeInTheDocument();
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
      "Không thể tải dữ liệu không gian giáo viên. Vui lòng thử lại.",
    );
    await user.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(
      await screen.findByRole("heading", {
        name: "Chọn bước dạy tiếp theo bằng bằng chứng.",
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
      "API không gian giáo viên chưa được cấu hình cho bản triển khai này.",
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
      "API không gian giáo viên đang không khả dụng. Hãy kiểm tra kết nối và thử lại.",
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
      name: "Biến bằng chứng thành lộ trình dạy học 45 phút.",
    });
    await user.click(
      screen.getByRole("button", { name: "Phê duyệt kế hoạch" }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Đã phê duyệt kế hoạch ở phiên bản 2.",
    );
    expect(
      within(lessonPlanStatus()).getAllByText("Đã phê duyệt"),
    ).toHaveLength(2);
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

    await screen.findByText("Khởi động xác nhận mức sẵn sàng");
    await user.clear(
      screen.getByLabelText("Thời lượng Khởi động xác nhận mức sẵn sàng"),
    );
    await user.type(
      screen.getByLabelText("Thời lượng Khởi động xác nhận mức sẵn sàng"),
      "4",
    );
    await user.selectOptions(
      screen.getByLabelText("Chuyển Phạm Đức Duy"),
      "grp_02_skill_distinguish_direct_inverse",
    );
    expect(screen.getByRole("button", { name: "Lưu chỉnh sửa" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Lưu chỉnh sửa" }));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Đã lưu chỉnh sửa của giáo viên thành phiên bản 2.",
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
      "Thời lượng Khởi động xác nhận mức sẵn sàng",
    );
    expect(within(lessonPlanStatus()).getByText("2")).toBeInTheDocument();
    expect(screen.getByLabelText("Chuyển Phạm Đức Duy")).toHaveValue(
      "grp_02_skill_distinguish_direct_inverse",
    );

    await user.click(
      screen.getByRole("button", { name: "Phê duyệt kế hoạch" }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Đã phê duyệt kế hoạch ở phiên bản 3.",
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
      "Thời lượng Khởi động xác nhận mức sẵn sàng",
    );
    expect(
      within(lessonPlanStatus()).getAllByText("Đã phê duyệt"),
    ).toHaveLength(2);
    expect(
      screen.getByRole("button", { name: "Xuất bản kế hoạch" }),
    ).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Xuất bản kế hoạch" }));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Đã xuất bản kế hoạch ở phiên bản 4.",
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
      "Thời lượng Khởi động xác nhận mức sẵn sàng",
    );
    expect(
      within(lessonPlanStatus()).getByText("Đã xuất bản"),
    ).toBeInTheDocument();
    expect(
      within(lessonPlanStatus()).getByText("Đã phê duyệt"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Xuất bản kế hoạch" }),
    ).toBeDisabled();
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
      name: "Biến bằng chứng thành lộ trình dạy học 45 phút.",
    });
    await user.click(screen.getByRole("button", { name: "Từ chối bản nháp" }));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Đã từ chối kế hoạch ở phiên bản 2",
    );
    expect(
      screen.getByRole("button", { name: "Từ chối bản nháp" }),
    ).toBeDisabled();

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
        await screen.findByRole("region", {
          name: "Trạng thái kế hoạch bài dạy",
        }),
      ).getByText("Đã từ chối"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Từ chối bản nháp" }),
    ).toBeDisabled();
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
      name: "Biến bằng chứng thành lộ trình dạy học 45 phút.",
    });
    expect(
      screen.getByRole("button", { name: "Lưu chỉnh sửa" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Xuất bản kế hoạch" }),
    ).toBeDisabled();

    await user.click(
      screen.getByRole("button", { name: "Phê duyệt kế hoạch" }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Đã phê duyệt kế hoạch ở phiên bản 2.",
    );
    expect(
      screen.getByRole("button", { name: "Phê duyệt kế hoạch" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Xuất bản kế hoạch" }),
    ).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Xuất bản kế hoạch" }));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Đã xuất bản kế hoạch ở phiên bản 3.",
    );
    expect(
      screen.getByRole("button", { name: "Xuất bản kế hoạch" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Từ chối bản nháp" }),
    ).toBeDisabled();
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

    await screen.findByText("Khởi động xác nhận mức sẵn sàng");
    await user.click(
      screen.getByRole("button", { name: "Phê duyệt kế hoạch" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Kế hoạch đã thay đổi trong một phiên khác. Hãy tải phiên bản mới nhất trước khi tiếp tục.",
    );

    await user.clear(
      screen.getByLabelText("Thời lượng Khởi động xác nhận mức sẵn sàng"),
    );
    await user.type(
      screen.getByLabelText("Thời lượng Khởi động xác nhận mức sẵn sàng"),
      "46",
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Mỗi hoạt động cần số phút nguyên",
    );
    expect(
      screen.getByRole("button", { name: "Lưu chỉnh sửa" }),
    ).toBeDisabled();
  });
});
