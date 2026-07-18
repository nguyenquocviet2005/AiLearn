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
      screen.getByText("Thấy đúng chỗ vướng. Dạy đúng điều cần thiết."),
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
      screen.getByRole("navigation", {
        name: "Điều hướng giáo viên",
      }),
    ).toBeInTheDocument();
  });

  it("renders the VAI-19 teacher routes on direct navigation", async () => {
    const snapshot = await fixtureTeacherWorkspaceRepository.getClassSnapshot();
    const plan = await reportTestPlan();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    window.history.pushState({}, "", "/teacher");
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => snapshot });
    const { unmount } = render(<App />);
    expect(
      await screen.findByRole("heading", {
        name: "Bắt đầu kế hoạch dạy học từ bằng chứng.",
      }),
    ).toBeInTheDocument();
    unmount();

    window.history.pushState({}, "", "/teacher/lesson-plan");
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => plan });
    render(<App />);
    expect(
      await screen.findByRole("heading", {
        name: "45 phút từ bằng chứng đến hành động.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Duyệt kế hoạch/ }),
    ).toBeEnabled();
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
        name: "Thấy rõ điều đã đổi và điều cần dạy tiếp.",
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
    expect(screen.getByRole("img", { name: "AiLearn" })).toBeInTheDocument();
  });
});
