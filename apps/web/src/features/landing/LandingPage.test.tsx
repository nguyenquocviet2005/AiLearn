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
        name: /Mỗi đầu vào đều đi\sra bằng một thay đổi có thể kiểm chứng\./,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Video & bài giảng")).toBeInTheDocument();
    expect(screen.getByText("Tài liệu học tập")).toBeInTheDocument();
    expect(screen.getByText("Bài kiểm tra đã có")).toBeInTheDocument();
    expect(screen.getByText("Soạn bài trước giờ")).toBeInTheDocument();
    expect(screen.getByText("Hồ sơ minh chứng")).toBeInTheDocument();
    expect(screen.getByText("Lỗ hổng gốc + độ tin cậy")).toBeInTheDocument();
    expect(screen.getByText("Giáo án đã duyệt")).toBeInTheDocument();
    expect(screen.getByText("Tiến bộ có bằng chứng")).toBeInTheDocument();
    expect(screen.getByText("Tăng đúng kỹ năng")).toBeInTheDocument();
    expect(screen.getByText("Được thu hẹp")).toBeInTheDocument();
    expect(
      screen.getByText("Kết quả trở thành minh chứng mới."),
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
      screen.getByRole("heading", {
        name: "Ba engine AI ra quyết định như thế nào?",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "P(thành thạo) = (1 + số câu đúng) / (2 + tổng lần thử)",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Điểm ưu tiên = 0,40P + 0,25G + 0,20U + 0,15C"),
    ).toBeInTheDocument();
    expect(screen.getByText("3–5 nhóm nhu cầu")).toBeInTheDocument();
    expect(screen.getByText("Làm có hướng dẫn")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Vá đúng lỗ hổng, đổi cách biểu diễn và kiểm chứng chuyển giao.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Ghi lại EvidenceEventV1 và chẩn đoán lại"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Pedagogical Alignment from Classroom Evidence"),
    ).toBeInTheDocument();
    expect(screen.getByText("Gióng vào chương trình")).toBeInTheDocument();
    expect(screen.getByText("Chốt bằng minh chứng")).toBeInTheDocument();
    expect(
      screen.getByText("Reinforcement Learning from Human Feedback"),
    ).toBeInTheDocument();
    // RLHF must stay labelled as roadmap, not as shipped behaviour.
    expect(
      screen.getByText("Lộ trình sau MVP — tín hiệu đang được thu"),
    ).toBeInTheDocument();
    expect(screen.getByText("Hàm thưởng R")).toBeInTheDocument();
    expect(screen.getByText("Chính sách π")).toBeInTheDocument();
    expect(screen.getByText("Giáo viên quyết định")).toBeInTheDocument();
    expect(
      screen.getByText("Năm thuộc tính khiến lõi này đáng tin"),
    ).toBeInTheDocument();
    expect(screen.getByText("Biết khi nào nên im lặng")).toBeInTheDocument();
    expect(
      screen.getByText("Cập nhật online theo dòng minh chứng"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Lõi này chạm tới từng tiêu chí đánh giá.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("An toàn AI, Grounding & Độ tin cậy"),
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
      screen.getByText("Một dấu vết. Nhiều giả thuyết. Nhiều đường hành động."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Một phương án sai đi qua hệ thống như thế nào?"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Nhóm nhu cầu")).toBeInTheDocument();
    expect(screen.getByText("Chuỗi lần thử")).toBeInTheDocument();
    expect(screen.getByText("Nhầm khái niệm")).toBeInTheDocument();
    expect(screen.getByText("Lỗi biểu diễn")).toBeInTheDocument();
    expect(screen.getByText("Truy kỹ năng nền")).toBeInTheDocument();
    expect(screen.getByText("Hỏi phân biệt")).toBeInTheDocument();
    expect(screen.getByText("Dạy lại đúng chỗ")).toBeInTheDocument();
    expect(screen.getByText("Lộ trình cá nhân")).toBeInTheDocument();
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
