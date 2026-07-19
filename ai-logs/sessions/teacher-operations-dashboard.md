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

- `CI=true pnpm --filter @ailearn/web format`: PASS.
- `CI=true pnpm --filter @ailearn/web test`: PASS (17 tệp, 105 kiểm tra).
- `pnpm --filter @ailearn/web lint`: PASS.
- `pnpm --filter @ailearn/web typecheck`: PASS.
- `pnpm --filter @ailearn/web build`: PASS.
- `git diff --check`: PASS.

## Rà soát độc lập và điều chỉnh cuối

- Rà soát độc lập phát hiện thanh trái rút gọn có thể làm mất đường vào một số mô-đun và trạng thái vận hành có nguy cơ được hiểu là tiến độ đã xác nhận.
- Đã sửa bằng thanh tiến trình có thể nhấp, bao phủ toàn bộ tuyến giáo viên; thanh trái chỉ giữ hai điểm vào chính là Tổng quan và Phân tích lớp.
- Các bước chưa có dữ liệu hoàn thành xác nhận hiển thị là `Xem dữ liệu`; chỉ trạng thái phê duyệt kế hoạch dùng nhãn `Đã duyệt` khi mô hình thực sự cho biết kế hoạch đã được phê duyệt.
- Mục Dạy trên lớp cũng dùng trạng thái trung tính và nhãn `Mở công cụ`, vì dashboard hiện không nhận tiến trình giảng dạy trực tiếp.
- Kiểm tra PrototypeFlow được thu hẹp vào thanh điều hướng prototype để không nhầm nút Học sinh hợp lệ trong thanh tiến trình giáo viên.
