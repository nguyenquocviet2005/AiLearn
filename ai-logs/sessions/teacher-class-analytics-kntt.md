# Phiên làm việc AI — Phân tích lớp Toán 7 Kết nối tri thức

- Ngày: 19-07-2026
- Công cụ: Codex
- Nhánh: `feat/teacher-class-analytics-kntt`
- Nền tảng: `origin/dev` tại `407f6346fa040ad1e778772eac3ee59a1fe138ea`
- Linear: không có issue được gắn cho thay đổi này.

## Mục tiêu và quyết định đã duyệt

- Thêm màn hình phân tích lớp có biểu đồ tròn và biểu đồ thanh.
- Dùng chỉ mục đầy đủ Toán 7, bộ Kết nối tri thức với cuộc sống để đặt bài hiện tại vào mạch học.
- Rút gọn thanh điều hướng trái; điều hướng chính nằm trên thanh trên.
- Hiển thị tiếng Việt cho giáo viên, không lộ mã kỹ năng nội bộ.
- Liên hệ ưu tiên thứ hai với bài hiện tại; dành thời lượng hướng dẫn dài nhất cho nền tảng tỉ số và tỉ lệ thức.

## Phạm vi thực hiện

- Tạo route `/teacher/analytics` với biểu đồ mức sẵn sàng, nguyên nhân gốc và nhóm học tập. Các giá trị được tính từ `TeacherDemoModel`, không gắn số liệu rời rạc ở giao diện.
- Tạo chỉ mục 10 chương, 37 bài; bài hiện tại là Bài 23 thuộc Chương VI. Chỉ dùng tiêu đề/chỉ mục và nêu nguồn NXB Giáo dục Việt Nam, không sao chép nội dung sách.
- Chuyển các nhãn giao diện sang tiếng Việt gọn: `Dữ liệu minh hoạ`, `Cách AiLearn phân tích`, `Học liệu theo nhu cầu của lớp`.
- Cập nhật kịch bản demo và bản đồ dữ liệu để khớp route mới.

## Kiểm tra đã chạy

| Hạng mục | Lệnh | Kết quả |
| --- | --- | --- |
| Định dạng | `pnpm --filter @ailearn/web format` | PASS |
| Kiểm tra kiểu | `pnpm --filter @ailearn/web typecheck` | PASS |
| Kiểm tra mã | `pnpm --filter @ailearn/web lint` | PASS |
| Kiểm thử giao diện | `pnpm --filter @ailearn/web test` | PASS — 104 tests |
| Production build | `pnpm --filter @ailearn/web build` | PASS |
| Kiểm tra diff | `git diff --check` | PASS |

## Rà soát độc lập

- Lần 1 phát hiện danh mục 38 bài sai, biểu đồ nguyên nhân gốc dịch nhãn hai lần và ưu tiên/thời lượng ghi cứng. Đã sửa thành 37 bài theo nguồn, tổng hợp theo `rootCauseId`, và dẫn xuất ưu tiên/thời lượng từ ảnh chụp lớp cùng kế hoạch.
- Lần 2 xác nhận các sửa kỹ thuật; đã đồng bộ lại kịch bản demo từ 16 phút thành 30 phút theo kế hoạch thực tế.

## Giới hạn

- Đây là dữ liệu minh hoạ xác định; kết quả màn hình được dẫn xuất từ ảnh chụp lớp và hồ sơ hiện có, không phải dữ liệu học sinh thật.
- Chỉ mục chương/bài là mạch tham chiếu. Chưa có API curriculum đầy đủ để xác nhận tiến độ thực tế của từng bài.
- Vercel Preview và CI sẽ được kiểm tra sau khi tạo pull request.
