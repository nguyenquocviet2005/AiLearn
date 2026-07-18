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
  sessionStorage.clear();
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
      screen.getByRole("navigation", {
        name: "Điều hướng giáo viên",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Lớp 7A · Mốc kiểm tra 2")).toBeInTheDocument();
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
        name: "Chọn bước dạy tiếp theo bằng bằng chứng.",
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

  it("logs in at /admin/login and redirects into the admin workspace", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    window.history.pushState({}, "", "/admin/login");
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        token: "test-token",
        expires_at: new Date(Date.now() + 60_000).toISOString(),
        email: "admin@example.com",
        role: "admin",
      }),
    });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ email: "admin@example.com", role: "admin" }),
    });

    render(<App />);

    await user.type(screen.getByLabelText("Email"), "admin@example.com");
    await user.type(screen.getByLabelText("Mật khẩu"), "correct-password");
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));

    expect(
      await screen.findByRole("navigation", { name: "Điều hướng quản trị" }),
    ).toBeInTheDocument();
    expect(window.location.pathname).toBe("/admin");
    expect(screen.getByText("admin@example.com")).toBeInTheDocument();
  });

  it("redirects /admin to /admin/login when there is no stored admin session", async () => {
    vi.stubGlobal("fetch", vi.fn());
    window.history.pushState({}, "", "/admin");

    render(<App />);

    expect(
      await screen.findByRole("heading", { name: "Đăng nhập quản trị viên" }),
    ).toBeInTheDocument();
    expect(window.location.pathname).toBe("/admin/login");
  });

  it("renders the admin shell directly at /admin with a valid stored session", async () => {
    sessionStorage.setItem(
      "ailearn_admin_session",
      JSON.stringify({
        token: "test-token",
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      }),
    );
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ email: "admin@example.com", role: "admin" }),
      }),
    );
    window.history.pushState({}, "", "/admin");

    render(<App />);

    expect(
      await screen.findByRole("navigation", { name: "Điều hướng quản trị" }),
    ).toBeInTheDocument();
  });

  it("redirects /admin to /admin/login when the stored session is expired", async () => {
    sessionStorage.setItem(
      "ailearn_admin_session",
      JSON.stringify({
        token: "stale-token",
        expiresAt: new Date(Date.now() - 60_000).toISOString(),
      }),
    );
    vi.stubGlobal("fetch", vi.fn());
    window.history.pushState({}, "", "/admin");

    render(<App />);

    expect(
      await screen.findByRole("heading", { name: "Đăng nhập quản trị viên" }),
    ).toBeInTheDocument();
    expect(window.location.pathname).toBe("/admin/login");
  });
});
