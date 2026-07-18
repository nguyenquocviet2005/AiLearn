import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import App from "./App";

beforeEach(() => {
  window.history.replaceState({}, "", "/");
  vi.stubGlobal("scrollTo", vi.fn());
});

afterEach(() => {
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
        name: "Teacher workspace navigation",
      }),
    ).toBeInTheDocument();
  });
});
