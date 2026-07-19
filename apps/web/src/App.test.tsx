import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  reportTestFixture,
  reportTestPlan,
} from "@/features/teacher/report/report-test-fixture";
import { fixtureTeacherWorkspaceRepository } from "@/test/teacher-fixtures";
import App from "./App";

beforeEach(() => {
  window.history.replaceState({}, "", "/");
  vi.stubGlobal("scrollTo", vi.fn());
});

afterEach(() => {
  window.history.pushState({}, "", "/");
  vi.unstubAllGlobals();
  window.history.replaceState({}, "", "/");
});

describe("App", () => {
  it("renders the AiLearn public landing page at the default route", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { level: 1, name: "AiLearn" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Thấy đúng chỗ vướng. Dạy đúng nơi cần."),
    ).toBeInTheDocument();
  });

  it("navigates from the landing page into the teacher workspace", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      screen.getByRole("link", { name: "Mở không gian giáo viên" }),
    );

    expect(window.location.pathname).toBe("/teacher");
    expect(
      screen.queryByRole("navigation", {
        name: "Điều hướng giáo viên",
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "AiLearn - trang chủ" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Quyết định thuộc về giáo viên"),
    ).toBeInTheDocument();
  });

  it("renders the teacher product and lesson-plan routes on direct navigation", async () => {
    const snapshot = await fixtureTeacherWorkspaceRepository.getClassSnapshot();
    const plan = await reportTestPlan();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    window.history.pushState({}, "", "/teacher");
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => snapshot })
      .mockResolvedValueOnce({ ok: true, json: async () => plan });
    const { unmount } = render(<App />);
    expect(
      await screen.findByRole("heading", {
        name: "Chào buổi sáng, cô Hà.",
      }),
    ).toBeInTheDocument();
    unmount();

    window.history.pushState({}, "", "/teacher/lesson-plan");
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => plan });
    render(<App />);
    expect(
      await screen.findByRole("heading", {
        name: "Biến bằng chứng thành lộ trình dạy học 45 phút.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Phê duyệt kế hoạch" }),
    ).toBeEnabled();
  });

  it.each([
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
  ])("supports direct navigation to %s", async (route, heading) => {
    const snapshot = await fixtureTeacherWorkspaceRepository.getClassSnapshot();
    const plan = await reportTestPlan();
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({ ok: true, json: async () => snapshot })
        .mockResolvedValueOnce({ ok: true, json: async () => plan }),
    );
    window.history.pushState({}, "", route);

    render(<App />);

    expect(
      await screen.findByRole("heading", { level: 1, name: heading }),
    ).toBeInTheDocument();
  });

  it("renders the VAI-21 report routes on direct navigation", async () => {
    const plan = await reportTestPlan();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    window.history.pushState({}, "", "/teacher/report");
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => reportTestFixture,
    });
    const { unmount } = render(<App />);
    expect(
      await screen.findByRole("heading", {
        name: "Nhìn rõ điều đã thay đổi và nội dung vẫn cần dạy.",
      }),
    ).toBeInTheDocument();
    unmount();

    window.history.pushState({}, "", "/teacher/report/print");
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => reportTestFixture })
      .mockResolvedValueOnce({ ok: true, json: async () => plan });
    render(<App />);
    expect(
      await screen.findByRole("heading", {
        name: "Báo cáo can thiệp và kế hoạch bài dạy",
      }),
    ).toBeInTheDocument();
  });

  it("renders the student route on direct navigation", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ personas: [] }),
      }),
    );
    window.history.pushState({}, "", "/student");

    render(<App />);

    expect(
      await screen.findByRole("heading", {
        name: "Chuẩn bị để tiết Toán dễ hiểu hơn",
      }),
    ).toBeInTheDocument();
  });
});
