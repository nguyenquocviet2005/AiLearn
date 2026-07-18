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
    expect(screen.getByText("Quét dấu vết")).toBeInTheDocument();
    expect(screen.getByText("Truy vết")).toBeInTheDocument();
    expect(screen.getByText("Lần theo nguyên nhân")).toBeInTheDocument();
    expect(screen.getByText("Nắn lại đường học")).toBeInTheDocument();
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
    expect(
      screen.getByText("Vá đúng gap bằng một đường học vừa đủ"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Ứng dụng giáo viên và học sinh"),
    ).toBeInTheDocument();
    expect(screen.getByText("Mở rộng offline")).toBeInTheDocument();
    expect(screen.queryByText("Lõi đang vận hành")).not.toBeInTheDocument();
    expect(screen.getByText("School Hub cục bộ")).toBeInTheDocument();
    expect(screen.getByText("FastAPI Cloud API")).toBeInTheDocument();
    expect(
      screen.getByText("Async Workers").closest("article"),
    ).not.toHaveClass("landing-runtime-node--planned");
    expect(screen.getByText("AI Control Plane")).toBeInTheDocument();
    expect(
      screen.getByText("Một lớp bảo vệ cho toàn hệ thống"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Một lớp bảo vệ cho toàn hệ thống").closest("article"),
    ).not.toHaveClass("landing-runtime-node--planned");
    expect(
      screen.getByText("Một phương án sai đi qua hệ thống như thế nào?"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Từ lựa chọn sai đến kỹ năng gốc",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Đồ thị kỹ năng GDPT 2018/)).toBeInTheDocument();
    expect(screen.getByText("Đại lượng tỉ lệ thuận")).toBeInTheDocument();
    expect(screen.getByText("Tỉ số và tỉ lệ thức")).toBeInTheDocument();
    expect(screen.getByText("Cần hỏi thêm")).toBeInTheDocument();
    expect(screen.getByText("Vũ Trung Quân")).toBeInTheDocument();
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
    await user.click(
      screen.getByRole("link", { name: "Vào dashboard giáo viên" }),
    );
    await user.click(
      screen.getByRole("link", { name: "Bắt đầu trải nghiệm học sinh" }),
    );

    expect(onNavigate).toHaveBeenNthCalledWith(1, "/teacher");
    expect(onNavigate).toHaveBeenNthCalledWith(2, "/student");
    expect(onNavigate).toHaveBeenNthCalledWith(3, "/teacher");
    expect(onNavigate).toHaveBeenNthCalledWith(4, "/student");
  });
});
