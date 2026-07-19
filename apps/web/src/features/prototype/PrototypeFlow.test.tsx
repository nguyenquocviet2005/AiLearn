import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PrototypeFlow } from "./PrototypeFlow";
import { resetPrototypeMockState } from "./mock-repositories";

beforeEach(() => {
  resetPrototypeMockState();
  vi.stubGlobal("scrollTo", vi.fn());
  vi.stubGlobal("fetch", vi.fn());
});

describe("PrototypeFlow", () => {
  it("starts on the intro step and never calls fetch", async () => {
    const user = userEvent.setup();
    render(<PrototypeFlow />);

    expect(
      screen.getByRole("heading", {
        name: "Đi hết vòng học khép kín bằng dữ liệu giả lập.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Mock data/i)).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Bắt đầu từ tổng quan lớp" }),
    );

    await waitFor(() => {
      expect(
        screen.getByRole("heading", {
          name: "Chọn bước dạy tiếp theo bằng bằng chứng.",
        }),
      ).toBeInTheDocument();
    });

    expect(fetch).not.toHaveBeenCalled();
  });

  it("walks teacher plan then student preview without network", async () => {
    const user = userEvent.setup();
    render(<PrototypeFlow />);

    await user.click(screen.getByRole("button", { name: /Kế hoạch/i }));
    await waitFor(() => {
      expect(
        screen.getByRole("heading", {
          name: "Biến bằng chứng thành lộ trình dạy học 45 phút.",
        }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /Học sinh/i }));
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Bắt đầu bài ngắn/i }),
      ).toBeInTheDocument();
    });

    expect(fetch).not.toHaveBeenCalled();
  });
});
