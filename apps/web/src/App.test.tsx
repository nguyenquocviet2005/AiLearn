import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import App from "./App";

afterEach(() => {
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
});
