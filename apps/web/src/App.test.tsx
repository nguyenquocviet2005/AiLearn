import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  reportTestFixture,
  reportTestPlan,
} from "@/features/teacher/report/report-test-fixture";
import { fixtureTeacherWorkspaceRepository } from "@/test/teacher-fixtures";
import App from "./App";

afterEach(() => {
  window.history.pushState({}, "", "/");
  vi.unstubAllGlobals();
});

describe("App", () => {
  it("renders the Supabase-backed status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: "ok",
          database: {
            status: "operational",
            checked_at: "2026-07-17T00:00:00Z",
          },
        }),
      }),
    );

    render(<App />);

    expect(
      screen.getByText("Checking the API connection…"),
    ).toBeInTheDocument();
    expect(await screen.findByText(/Supabase is/i)).toHaveTextContent(
      "operational",
    );
  });

  it("renders an actionable unavailable state and retries", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: "ok",
          database: {
            status: "operational",
            checked_at: "2026-07-17T00:00:00Z",
          },
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<App />);

    await screen.findByText("The platform status is currently unavailable.");
    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByText(/Supabase is/i)).toHaveTextContent(
      "operational",
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
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
        name: "A teaching plan starts with the evidence.",
      }),
    ).toBeInTheDocument();
    unmount();

    window.history.pushState({}, "", "/teacher/lesson-plan");
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => plan });
    render(<App />);
    expect(
      await screen.findByRole("heading", {
        name: "A 45-minute path from evidence to action.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Approve plan" })).toBeEnabled();
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
        name: "See what changed—and what still needs teaching.",
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
        name: "Intervention report and lesson plan",
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
