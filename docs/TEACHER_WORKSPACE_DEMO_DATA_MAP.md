# Teacher Workspace Demo Data Map

## Ngữ cảnh

| Thực thể     | Giá trị hiển thị       | Nguồn                                |
| ------------ | ---------------------- | ------------------------------------ |
| Giáo viên    | Cô Nguyễn Thu Hà       | Presentation model                   |
| Trường       | THCS Nguyễn Du         | Presentation shell                   |
| Lớp          | Lớp 7A, 40 học sinh    | Engine snapshot + presentation label |
| Bài hiện tại | Đại lượng tỉ lệ nghịch | Engine lesson ID + curriculum label  |
| Bài sắp tới  | Bài toán thực tế       | Deterministic demo journey           |
| Kế hoạch     | 45 phút, versioned     | `TeacherPlanVersionV1` từ API        |

## Nguồn → tính toán → màn hình

| Source record                    | Phép tính                                       | Nơi hiển thị                          |
| -------------------------------- | ----------------------------------------------- | ------------------------------------- |
| `snapshot.students[]`            | Tổng số, readiness counts, average confidence   | Today, Classes, Insights, After Class |
| `snapshot.groups[]`              | Group count; membership sum; target mapping     | Today, Insights, Teaching             |
| `snapshot.teaching_priorities[]` | Thứ tự ưu tiên do engine tạo                    | Insights, next-lesson recommendation  |
| `plan.lesson_plan.activities[]`  | Số pha, thời lượng, mục tiêu, expected evidence | Today, Lesson Plan, Teaching Mode     |
| `plan.version/decision`          | Trạng thái và version                           | Today, Lesson Plan, Teaching Mode     |
| `report.student_outcomes[]`      | Outcome evidence                                | Report                                |
| `DemoEvidenceEvent[]`            | Evidence count, đúng/sai, mâu thuẫn, sync state | Students, student drawer              |
| `DemoStudentOutcome[]`           | Improved, after-ready, remediation counts       | After Class                           |
| `StudentImprovementPathV1[]`     | Completed steps và progress                     | Interventions                         |
| Session demo state               | Notes, teaching state, assigned interventions   | Students, Teaching, Interventions     |

## Phân bố lớp từ snapshot

- 40 học sinh tổng cộng.
- 8 sẵn sàng vận dụng.
- 30 cần hỗ trợ theo nguyên nhân gốc.
- 2 chưa đủ minh chứng và được tách khỏi nhãn chắc chắn.
- 5 nhóm có tổng membership bằng 40.

## Nhóm học tập

| Nhóm hiển thị                                  | Số học sinh | Nhu cầu                                  | Hành động                         |
| ---------------------------------------------- | ----------: | ---------------------------------------- | --------------------------------- |
| Nhóm A · Nền tảng tỉ số và tỉ lệ thức          |           4 | Sửa kỹ năng tiền đề có tác động hạ nguồn | Worked example + guided practice  |
| Nhóm B · Phân biệt tỉ lệ thuận và tỉ lệ nghịch |          11 | Sửa misconception chính                  | Bảng so sánh và câu hỏi phân biệt |
| Nhóm giáo viên đồng hành                       |          15 | Nhiều nhu cầu ít phổ biến                | Trạm có giáo viên hướng dẫn       |
| Nhóm mở rộng · Vận dụng độc lập                |           8 | Đã sẵn sàng                              | Near/far transfer task            |
| Nhóm cần thêm minh chứng                       |           2 | Evidence thiếu/mâu thuẫn                 | Hai câu xác minh trước can thiệp  |

## Học sinh và tên hiển thị

40 `student_id` ổn định trong snapshot được ánh xạ theo thứ tự sang 40 tên Việt Nam tổng hợp, bắt đầu bằng Nguyễn Minh Anh, Trần Gia Bảo, Lê Hoàng Châu và Phạm Đức Duy. Mapping chỉ phục vụ trình bày; mọi quan hệ group/API tiếp tục dùng ID gốc. Giao diện không hiển thị ID kỹ thuật như tên học sinh.

## Kỹ năng trọng tâm

- Nền tảng tỉ số và tỉ lệ thức.
- Phân biệt tỉ lệ thuận và tỉ lệ nghịch.
- Nhân phân số.
- Bài toán năng suất thực tế.
- Mô hình tỉ lệ nghịch.
- Vận dụng độc lập trong tình huống mới.

## Tính nhất quán được kiểm thử

- Readiness counts cộng bằng class size.
- Group membership cộng bằng class size và khớp `groupId` từng student row.
- Average confidence được tính từ tất cả student rows.
- Không có tên hiển thị chứa `stu_`.
- Routes dùng cùng một snapshot/plan repository boundary.
- API failure không bị che bằng fixture fallback.

## Ranh giới demo

Engine outputs (snapshot, grouping, priorities, plan version) là dữ liệu contract-backed. Typed evidence, outcomes và improvement paths là một scenario demo deterministic duy nhất; các bảng và aggregate sau giờ học đều tính từ records đó thay vì dùng số rời rạc. Display names, recent activity và resource review state là presentation context. Khi backend cung cấp roster/evidence/outcome endpoints đầy đủ, builder có thể thay các records demo mà không đổi shared contract hiện tại.
