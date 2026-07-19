# Phiên làm việc AI — Dashboard điều hành tiết học

- Ngày: 19-07-2026
- Công cụ: Codex
- Nhánh: `feat/teacher-operations-dashboard`
- Nền tảng: `origin/dev` tại `6f43f92da6f36d2c209af369c67eaec975765103`
- Linear: không có issue được gắn.

## Mục tiêu đã duyệt

- Dùng ảnh trong `monitordashboard/` làm tham chiếu bố cục, không đưa ảnh vào sản phẩm.
- Bổ sung dashboard điều hành tiết học: luồng chuẩn bị, ba buổi sắp tới, sơ đồ chẩn đoán và ưu tiên.
- Di chuyển Tổng quan và Phân tích lớp về thanh trái; bỏ điều hướng `Thêm` và các mục kế hoạch/dạy học trên thanh trên.
- Sửa chuỗi lý do kỹ thuật trong Kế hoạch thành diễn giải tiếng Việt cho giáo viên.

## Ranh giới dữ liệu

- Chỉ số dashboard đến từ `TeacherDemoModel`, ảnh chụp lớp và kế hoạch bài dạy.
- Các buổi sắp tới là ngữ cảnh demo; không được trình bày là dữ liệu lịch thật.
- Không dùng dữ liệu học sinh thật hoặc ảnh tham chiếu trong giao diện.

## Kiểm tra

- Sẽ ghi kết quả format, lint, typecheck, frontend tests và production build trước khi tạo PR.
