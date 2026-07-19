# Phiên làm việc AI — Bỏ đối chiếu barem Landing Page

- Ngày: 19-07-2026
- Công cụ: Codex
- Nhánh: `fix/remove-landing-rubric`
- Nền tảng: `origin/main` tại `271bb5dd9d2a7bf3e5d38527376e09fd21ef0858`
- Linear: không có issue được gắn.

## Thay đổi

- Xoá khối “Đối chiếu barem chấm điểm” khỏi Landing Page, gồm dữ liệu, markup và CSS chỉ dùng cho khối này.
- Điều chỉnh test Landing Page để xác nhận nội dung không còn xuất hiện.

## Ranh giới

- Không thay đổi backend, database, API, hợp đồng, hoặc các màn hình giáo viên/học sinh.

## Kiểm tra

- `CI=true pnpm --filter @ailearn/web format`: PASS.
- `CI=true pnpm --filter @ailearn/web test`: PASS (16 tệp, 103 kiểm tra).
- `pnpm --filter @ailearn/web lint`: PASS.
- `pnpm --filter @ailearn/web typecheck`: PASS.
- `pnpm --filter @ailearn/web build`: PASS.
- `git diff --check`: PASS.
