import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { LandingPage } from "./LandingPage";

describe("LandingPage", () => {
  it("explains the learning loop and both product experiences", () => {
    render(<LandingPage onNavigate={vi.fn()} />);

    const brand = within(screen.getByRole("banner")).getByRole("link", {
      name: "AiLearn - trang chủ",
    });
    expect(brand).toBeInTheDocument();
    expect(brand.querySelector("img")).toHaveAttribute(
      "src",
      "/brand/ailearn-header-logo.png",
    );

    expect(
      screen.getByRole("heading", {
        name: "Từ một câu trả lời đến một quyết định dạy học.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Ba quyết định rõ ràng trước giờ lên lớp.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Một bước vừa đủ cho chỗ em đang cần.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Không đoán mò. AiLearn lần theo từng dấu vết học tập.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Beta-Bernoulli mastery")).toBeInTheDocument();
    expect(screen.getByText("Supabase PostgreSQL")).toBeInTheDocument();
    expect(
      screen.getByAltText("Linh vật ánh sáng của AiLearn"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Những người cùng thắp sáng AiLearn.",
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByAltText(/^Chân dung /)).toHaveLength(6);
  });

  it("opens the requested workspace from the primary calls to action", async () => {
    const onNavigate = vi.fn();
    const user = userEvent.setup();
    render(<LandingPage onNavigate={onNavigate} />);

    await user.click(
      screen.getByRole("link", { name: "Mở không gian giáo viên" }),
    );
    await user.click(
      screen.getByRole("link", { name: "Xem trải nghiệm học sinh" }),
    );

    expect(onNavigate).toHaveBeenNthCalledWith(1, "/teacher");
    expect(onNavigate).toHaveBeenNthCalledWith(2, "/student");
  });
});
