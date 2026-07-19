# Kịch bản demo Không gian giáo viên AiLearn

## 1. Mục tiêu demo

Demo chứng minh AiLearn biến dấu vết học tập thành quyết định dạy học có thể giải thích: tìm nguyên nhân gốc, giữ lại phần chưa chắc chắn, chia nhóm, tạo kế hoạch phân hóa để giáo viên duyệt, ghi nhận kết quả và khép vòng lặp can thiệp.

- Đối tượng: giáo viên, nhà trường, ban giám khảo, đội sản phẩm và kỹ thuật.
- Giá trị cốt lõi: **thấy đúng chỗ vướng, dạy đúng nơi cần, giáo viên luôn là người quyết định**.
- Thời lượng: bản ngắn 3–5 phút; bản đầy đủ 10–15 phút.
- Ngôn ngữ chính: tiếng Việt. Thuật ngữ kỹ thuật tiếng Anh chỉ dùng khi giúp giải thích kiến trúc.

## 2. Checklist chuẩn bị

- Mở URL Vercel Preview của pull request, không dùng production.
- Kiểm tra `/`, `/teacher`, `/teacher/analytics`, `/teacher/lesson-plan` và `/teacher/report` tải được bằng điều hướng trực tiếp.
- Kiểm tra Railway `GET /health` và `GET /api/v1/system-status` nếu có quyền truy cập.
- Xác nhận `VITE_API_BASE_URL` của Preview trỏ tới API staging, không trỏ `localhost`.
- Mở Chrome/Safari ở 1440×900; zoom 100%; tắt extension có thể chặn request.
- Vào `/teacher`, chọn **Đặt lại tiến trình demo → Đặt lại tiến trình demo**.
- Lưu ý: thao tác này không đổi quyết định phê duyệt kế hoạch đang lưu trên API.
- Giữ sẵn một tab `/teacher/report/print` làm phương án dự phòng.
- Nếu mạng chậm, đợi trạng thái “Đang tổng hợp ảnh chụp lớp…” hoàn tất trước khi nói.

## 3. Bối cảnh sản phẩm

Giáo viên thường thấy điểm số hoặc số câu sai nhưng vẫn phải tự đoán vì sao học sinh sai, ai cần được ưu tiên và nên dạy lại nội dung nào. AiLearn dùng chuỗi minh chứng cùng đồ thị kỹ năng tiền đề để tạo chẩn đoán có độ tin cậy. Các hồ sơ được tổng hợp thành ảnh chụp lớp, nhóm nhu cầu và kế hoạch phân hóa. Giáo viên xem bằng chứng, điều chỉnh và phê duyệt trước khi dạy.

**Bộ máy phân tích** là vòng xử lý có thể kiểm chứng:

`Minh chứng → Chẩn đoán → Ảnh chụp lớp → Nhóm học tập → Kế hoạch → Phê duyệt → Giảng dạy → Minh chứng mới → Củng cố → Báo cáo`

Engine không phải một LLM tự do. Các quan hệ chương trình, trạng thái sẵn sàng, độ tin cậy, phân nhóm và tiến trình củng cố dựa trên contract và luật có thể kiểm thử. Nội dung sinh có thể dùng AI nhưng luôn là bản nháp để giáo viên duyệt.

## 4. Kịch bản click-by-click đầy đủ

### Bước 1 — Tổng quan lớp

- Route: `/teacher/analytics` (chọn **Phân tích lớp** trên thanh điều hướng trên cùng).
- Click: **Đặt lại tiến trình demo** rồi xác nhận nếu trạng thái trình duyệt không ở đầu.
- Kết quả: biểu đồ tròn mức sẵn sàng, biểu đồ thanh nguyên nhân gốc, quy mô nhóm và tiến trình Toán 7 Kết nối tri thức.
- Dữ liệu: 8 em sẵn sàng, 30 em cần hỗ trợ, 2 em cần thêm minh chứng; số liệu được tính từ ảnh chụp lớp.
- Lời nói: “Đây là toàn cảnh lớp 7A. Biểu đồ không chỉ để đẹp: mỗi phần đều dẫn tới danh sách học sinh và minh chứng phía sau.”
- Điểm nhấn: **Nền tảng tỉ số và tỉ lệ thức** nhận 30 phút trong các hoạt động của kế hoạch, dài nhất; **Phân biệt tỉ lệ thuận và tỉ lệ nghịch** được nối trực tiếp với bài hiện tại.
- Ý nghĩa: giáo viên thấy cả nhu cầu của lớp lẫn vị trí của bài 23 trong Chương VI, thay vì chỉ thấy một con điểm trung bình.
- Chuyển: “Từ bức tranh chung, ta đi vào việc cần làm hôm nay.”

### Bước 2 — Hôm nay

- Route: `/teacher`.
- Kết quả: thấy tiết tiếp theo của **Lớp 7A**, 40 học sinh, 5 nhóm và hộp việc cần làm.
- Lời nói: “Màn hình này biến phân tích thành ba việc cụ thể trước tiết học.”
- Chuyển: “Bây giờ ta kiểm tra bối cảnh của lớp và bài học.”

### Bước 3 — Lớp học

- Click: **Thêm → Lớp học** trên thanh điều hướng trên cùng.
- Kết quả: thẻ Lớp 7A, tiến độ minh chứng 38/40 và tiến trình chương Đại lượng tỉ lệ.
- Click: **Chuẩn bị** ở bài “Đại lượng tỉ lệ nghịch”.
- Lời nói: “Một lớp có thể có nhiều bài, nhưng mọi phân tích luôn giữ rõ lớp, bài và thời điểm tạo dữ liệu.”
- Chuyển: “Giáo viên bổ sung mục tiêu và ràng buộc thực tế trước khi engine lập kế hoạch.”

### Bước 4 — Chuẩn bị bài

- Route: `/teacher/prepare`.
- Thao tác: xem mục tiêu, thời lượng 45 phút, chọn “Dạy học theo trạm”, nhập ghi chú “Ưu tiên ví dụ năng suất gần gũi”.
- Click: **Lưu thông tin chuẩn bị**.
- Kết quả: thông báo “Đã lưu thông tin chuẩn bị”.
- Lời nói: “AI nhận mục tiêu, thời gian và chiến lược từ giáo viên. Nó không tự bịa ra điều kiện lớp học.”
- Chuyển: click **Xem chẩn đoán của lớp**.

### Bước 5 — Cách AiLearn phân tích

- Route: `/teacher/insights`.
- Kết quả: chuỗi bước từ Minh chứng đến Kế hoạch; mỗi bước nói rõ đầu vào, xử lý và đầu ra.
- Lời nói: “Đây là phần lõi: một câu sai chỉ là bằng chứng, chưa phải nhãn. Bộ máy xếp hạng nguyên nhân tiền đề, tính độ tin cậy, rồi mới tổng hợp lớp.”
- Điểm nhấn: badge “Có thể truy xuất từng kết luận”.
- Chuyển: “Ta nhìn vào nguyên nhân, không dừng ở trung bình của lớp.”

### Bước 6 — Nguyên nhân gốc và nhóm

- Quan sát: biểu đồ ngang nguyên nhân gốc và 5 nhóm.
- Click: **Xem nhóm** tại “Nhóm cần thêm minh chứng”.
- Kết quả: mở chi tiết nhóm, số học sinh, mục tiêu và lý do ghép nhóm.
- Lời nói: “Hai học sinh chưa đủ dữ liệu được giữ riêng. AiLearn từ chối gán một nhãn chắc chắn khi bằng chứng chưa đủ.”
- Wow moment: 5 nhóm cộng lại đúng 40 học sinh; nhóm không phải nhãn cố định.
- Chuyển: “Mỗi con số tổng hợp đều có thể đi xuống hồ sơ từng em.”

### Bước 7 — Bảng học sinh và bộ lọc

- Click: **Học sinh**.
- Thao tác: chọn bộ lọc **Cần hỗ trợ**; gõ “Nguyễn” vào ô tìm kiếm.
- Kết quả: số kết quả thay đổi; bảng hiển thị tên Việt Nam, trạng thái, nguyên nhân gốc, độ tin cậy, đồng bộ và can thiệp.
- Lời nói: “Giáo viên có thể tìm, lọc và so sánh nhanh. Tên hiển thị thân thiện; ID kỹ thuật không lộ trên giao diện.”
- Chuyển: click tên **Nguyễn Minh Anh** (xóa bộ lọc nếu cần).

### Bước 8 — Hồ sơ học sinh

- Kết quả: drawer hồ sơ với mức sẵn sàng, độ tin cậy, nguyên nhân gốc, minh chứng hỗ trợ/mâu thuẫn và ghi chú.
- Nhập ghi chú: “Quan sát thêm khi em giải thích bảng giá trị.”
- Click: **Giao lộ trình củng cố**.
- Lời nói: “Giáo viên có thể yêu cầu thêm minh chứng, đổi nhóm hoặc ghi đè chẩn đoán kèm lý do. Trong demo này ta lưu quyết định chuyên môn rồi giao lộ trình.”
- Ý nghĩa: giáo viên có quyền kiểm soát; hành động được lưu trong phiên demo.
- Chuyển: đóng drawer và mở **Kế hoạch**.

### Bước 9 — Kế hoạch phân hóa

- Route: `/teacher/lesson-plan`.
- Kết quả: kế hoạch 45 phút theo phiên bản, hoạt động gắn kỹ năng và minh chứng kỳ vọng.
- Thao tác: chỉnh thời lượng/hướng dẫn trong trường cho phép; click **Lưu thay đổi** nếu có thay đổi.
- Click: **Phê duyệt kế hoạch** khi trạng thái cho phép.
- Lời nói: “AiLearn tạo bản nháp. Cô Hà chỉnh nội dung và phê duyệt. Không có kế hoạch nào tự động đi vào lớp mà bỏ qua giáo viên.”
- Wow moment: vòng đời versioned plan; xung đột phiên bản được phát hiện thay vì ghi đè im lặng.
- Chuyển: click **Dạy học**.

### Bước 10 — Chế độ giảng dạy

- Click: **Bắt đầu Chế độ giảng dạy**.
- Kết quả: giao diện nền tối, giảm nhiễu; thấy pha hiện tại, thời gian, mục tiêu, minh chứng cần quan sát và ba nhóm.
- Click một nhóm khác; nhập “Nhóm 1 vẫn nhầm dấu của đại lượng”; click **Lưu quan sát**.
- Click **Chuyển sang pha tiếp theo**.
- Lời nói: “Khi đứng lớp, giáo viên không cần dashboard dày. Chế độ này chỉ giữ thứ cần để hành động trong vài giây.”
- Chuyển: đi qua các pha và click **Hoàn thành tiết học**, hoặc chuyển sang Sau giờ học để tiết kiệm thời gian demo.

### Bước 11 — Sau giờ học

- Click: **Sau giờ học**.
- Kết quả: trước/sau mức sẵn sàng, số em tiến bộ, cần củng cố, cần thêm minh chứng và đề xuất bài tiếp theo.
- Lời nói: “Một câu đúng khi có hướng dẫn chưa đủ. AiLearn chờ bài chuyển giao độc lập trước khi xác nhận kỹ năng đã được sửa.”
- Click: **Xem danh sách can thiệp**.

### Bước 12 — Can thiệp

- Route: `/teacher/interventions`.
- Kết quả: hàng đợi với nhu cầu, giai đoạn, tiến trình và hành động. Sáu giai đoạn từ xác minh đến duy trì được hiển thị.
- Click: **Giao lộ trình** cho một học sinh; nút chuyển thành **Xem lộ trình**.
- Lời nói: “Lộ trình không dừng ở luyện câu tương tự. Nó đi qua chuyển giao gần, chuyển giao xa và kiểm tra duy trì.”
- Click: **Mở báo cáo can thiệp**.

### Bước 13 — Báo cáo và bài tiếp theo

- Route: `/teacher/report`.
- Kết quả: kết quả chuyển giao, khoảng hổng còn lại, đề xuất trọng tâm bài tiếp theo và link bản in.
- Lời nói: “Báo cáo trả kết quả về đúng vòng lập kế hoạch. Bài tiếp theo bắt đầu từ minh chứng mới, không bắt đầu lại từ một phỏng đoán.”
- Chuyển: mở **Học liệu** để cho thấy đầu ra có thể sử dụng.

### Bước 14 — Học liệu

- Route: `/teacher/resources`.
- Click: **Xem trước** một phiếu; kết quả hiển thị hướng dẫn và tiêu chí thành công.
- Click: **Gắn vào kế hoạch**; nút chuyển thành **Đã gắn**.
- Lời nói: “Nội dung sinh luôn xem trước được, có nguồn/mẫu và phải được giáo viên duyệt.”

## 5. Hành trình đầy đủ

`Phân tích lớp → Hôm nay → Lớp học → Chuẩn bị → Chẩn đoán → Học sinh → Kế hoạch → Dạy học → Sau giờ học → Can thiệp → Báo cáo → Học liệu → Bài tiếp theo`

Các chuyển tiếp quan trọng đều có CTA rõ nghĩa. Trạng thái demo (chuẩn bị, ghi chú, bắt đầu dạy, giao can thiệp) lưu trong `sessionStorage` và **Đặt lại tiến trình demo** phục hồi trạng thái trình duyệt mà không ghi thay đổi vào dữ liệu API. Quyết định phê duyệt trên API được giữ nguyên.

## 6. Giải thích sâu core engine

| Giai đoạn      | Đầu vào                                     | Xử lý                                                   | Đầu ra                       | Độ tin cậy và quyền giáo viên                      | Giá trị                   |
| -------------- | ------------------------------------------- | ------------------------------------------------------- | ---------------------------- | -------------------------------------------------- | ------------------------- |
| Minh chứng     | Câu trả lời, kỹ năng, thời điểm, confidence | Chuẩn hóa `EvidenceEventV1`                             | Chuỗi dấu vết                | Phân biệt sai, thiếu, chưa làm, chờ sync           | Không đoán từ một điểm số |
| Chẩn đoán      | Chuỗi minh chứng + đồ thị tiền đề           | Xếp hạng root cause, kiểm tra mâu thuẫn/abstention      | `StudentDiagnosticProfileV1` | Hiện confidence; giáo viên yêu cầu thêm bằng chứng | Dạy đúng nguyên nhân      |
| Ảnh chụp lớp   | Hồ sơ từng em                               | Tổng hợp counts/priorities                              | `ClassSnapshotV1`            | Luôn drill-down được                               | Thấy khoảng hổng cấp lớp  |
| Nhóm           | Root cause, readiness, confidence           | Ghép nhu cầu; tách insufficient evidence                | `SnapshotGroup[]`            | Giáo viên xem/chỉnh                                | Phân hóa thực tế          |
| Kế hoạch       | Snapshot, mục tiêu, 45 phút                 | Chọn hoạt động và expected evidence                     | `TeacherLessonPlanV1`        | Version, chỉnh sửa, duyệt/từ chối                  | Tiết dạy khả thi          |
| Phê duyệt      | Plan version                                | Kiểm soát version và quyết định                         | `TeacherPlanVersionV1`       | Giáo viên là cổng bắt buộc                         | Audit rõ ràng             |
| Giảng dạy      | Kế hoạch đã chuẩn bị                        | Trình bày từng pha/nhóm                                 | Quan sát nhanh               | Giáo viên điều phối                                | Giảm tải nhận thức        |
| Minh chứng mới | Exit ticket, quan sát                       | Ghi lại và chẩn đoán lại                                | Readiness sau tiết           | Không coi một câu có hướng dẫn là mastery          | Vòng lặp đóng             |
| Củng cố        | Chẩn đoán, lần thử trước                    | Confirmation → repair → practice → transfer → retention | `StudentImprovementPathV1`   | Giáo viên giao và xem lộ trình                     | Sửa bền vững              |
| Báo cáo        | Outcome + evidence                          | Tổng hợp outcome/gap                                    | `InterventionReportV1`       | Có bằng chứng và giới hạn                          | Chuẩn bị bài tiếp theo    |

## 7. Câu chuyện dữ liệu demo

- Giáo viên: Cô Nguyễn Thu Hà, Trường THCS Nguyễn Du.
- Lớp: Lớp 7A, 40 học sinh, môn Toán 7.
- Bài hiện tại: Đại lượng tỉ lệ nghịch; bài sắp tới: Bài toán thực tế.
- 8 học sinh sẵn sàng vận dụng; 30 cần hỗ trợ; 2 chưa đủ minh chứng.
- 5 nhóm: nền tảng tỉ số, phân biệt thuận/nghịch, trạm giáo viên, vận dụng mở rộng, xác minh thêm.
- Nhân vật ví dụ: Nguyễn Minh Anh và các tên Việt Nam tổng hợp; tên chỉ là presentation mapping, API vẫn dùng ID ổn định.
- Một số hồ sơ có minh chứng mâu thuẫn hoặc đang chờ đồng bộ để minh họa low-bandwidth/failure state.
- Chỉ số sẵn sàng, confidence, group membership và priorities đến từ snapshot do engine tạo; UI không hard-code các tổng số đó.

Chi tiết tham chiếu: [TEACHER_WORKSPACE_DEMO_DATA_MAP.md](./TEACHER_WORKSPACE_DEMO_DATA_MAP.md).

## 8. Ngôn ngữ trình bày gợi ý

- “AiLearn không gọi một em là học sinh yếu. Hệ thống nói: với bài này, tại thời điểm này, bằng chứng gợi ý em đang vướng kỹ năng nào và mức chắc chắn là bao nhiêu.”
- “Root cause là nguyên nhân tiền đề được bằng chứng hỗ trợ mạnh nhất, không phải một nhãn cố định.”
- “Confidence là mức nhất quán và đủ đầy của dấu vết, không phải điểm năng lực.”
- “Contradicting evidence giúp giáo viên thấy khi nào dữ liệu chưa đồng thuận.”
- “Teacher override luôn cần lý do vì quyết định cuối cùng thuộc về giáo viên.”
- “Transfer task kiểm tra học sinh có dùng được kỹ năng trong tình huống mới hay không.”

## 9. Các khoảnh khắc “wow”

1. Từ câu sai tới nguyên nhân gốc thay vì chỉ tô đỏ điểm thấp.
2. Hiện cả confidence và minh chứng mâu thuẫn.
3. Tách nhóm chưa đủ minh chứng thay vì ép nhãn.
4. 5 nhóm tự động nhưng vẫn cho giáo viên kiểm soát.
5. Kế hoạch 45 phút có thể chỉnh sửa và phải được phê duyệt.
6. Chế độ giảng dạy giảm nhiễu theo ngữ cảnh lớp.
7. Minh chứng sau tiết học quay lại engine.
8. Can thiệp kiểm tra transfer và retention, không dừng ở một câu đúng.
9. Báo cáo giải thích vì sao đề xuất trọng tâm bài tiếp theo.

## 10. Bản demo 3–5 phút

1. `/teacher` (30 giây): chỉ hộp việc và 40 học sinh.
2. `/teacher/insights` (60 giây): pipeline, root cause, 5 nhóm, insufficient evidence.
3. `/teacher/students` (45 giây): lọc, mở Nguyễn Minh Anh, giao lộ trình.
4. `/teacher/lesson-plan` (45 giây): plan 45 phút, version, giáo viên phê duyệt.
5. `/teacher/teaching` (30 giây): bắt đầu, đổi nhóm, lưu quan sát.
6. `/teacher/after-class` và `/teacher/interventions` (45 giây): before/after, transfer, next action.
7. Kết: “Một vòng bằng chứng khép kín, giáo viên kiểm soát mọi quyết định.”

## 11. Bản demo 10–15 phút

Theo toàn bộ 13 bước ở mục 4. Dành thêm thời gian tại pipeline, hồ sơ học sinh, lifecycle kế hoạch và transfer/retention. Luôn nói rõ đâu là engine thật (snapshot/plan contract), đâu là interaction state của demo và đâu là nội dung mẫu cần giáo viên duyệt.

## 12. Kịch bản lỗi và phương án dự phòng

- Backend unavailable: chỉ vào thông báo “Kết nối dữ liệu bị gián đoạn”; nói rằng việc lưu trên trình duyệt vẫn an toàn; click **Kiểm tra lại kết nối**. Chuyển sang tab bản in nếu API chưa trở lại.
- Deployment còn loading: đợi skeleton; không refresh liên tục; kiểm tra Railway `/health`.
- Data fails validation: không bỏ validation hoặc đổi sang fixture ngầm. Báo đây là contract protection và dùng ảnh/video dự phòng.
- Route lỗi: điều hướng về `/teacher`; nếu deep link 404, kiểm tra `apps/web/vercel.json` SPA rewrite.
- Internet chậm: giữ tab đã tải sẵn; nhấn mạnh session state và thiết kế graceful low-bandwidth.
- Demo state sai: **Đặt lại tiến trình demo**, xác nhận; thao tác này không đổi dữ liệu hoặc quyết định phê duyệt trên API.

## 13. Câu hỏi thường gặp từ giám khảo

**Đây có thật sự là AI không?**
Có nhiều lớp thông minh: engine chẩn đoán xếp hạng giả thuyết từ bằng chứng và đồ thị tiền đề; engine lập kế hoạch tối ưu nhóm/thời gian; AI tạo nội dung hỗ trợ. Các quyết định quan trọng được ràng buộc bằng schema, luật và confidence.

**Vì sao không chỉ dùng LLM?**
LLM phù hợp diễn giải và biến thể nội dung nhưng không nên là nguồn chân lý cho mastery, quan hệ chương trình hay nhóm can thiệp. AiLearn dùng deterministic/rule-backed logic cho phần đó.

**Root cause được tính thế nào?**
Engine đối chiếu sai/đúng theo skill, đi ngược quan hệ tiền đề, xếp hạng giả thuyết bằng bằng chứng hỗ trợ và mâu thuẫn, rồi abstain khi chưa đủ dữ liệu.

**Tránh hallucination thế nào?**
Structured contracts, validation, curriculum IDs, provenance, template fallback và teacher approval. Nội dung sinh không tự động trở thành quyết định.

**Giáo viên kiểm soát ở đâu?**
Xem từng minh chứng, yêu cầu thêm dữ liệu, đổi nhóm hoặc ghi đè chẩn đoán có lý do, sửa và phê duyệt kế hoạch, xem trước/gắn học liệu đã duyệt, giao và xem can thiệp.

**Khi thiếu minh chứng?**
Hệ thống abstain và đưa học sinh vào nhóm xác minh, không ép vào một nhãn chắc chắn.

**Dữ liệu học sinh có riêng tư không?**
Demo dùng tên và dữ liệu tổng hợp. Sản phẩm thật cần authentication, authorization, RLS, retention policy và audit theo phạm vi trường. Không dùng dữ liệu thật trong fixture/demo.

**Có chạy khi mạng yếu không?**
UI phân biệt pending sync, giữ session state và giảm phụ thuộc call không cần thiết. Offline write queue là hướng kiến trúc; các thao tác cần API vẫn báo rõ trạng thái.

**Đâu là thật, đâu là mock?**
Snapshot, groups, priorities và versioned plan được tải qua repository/API và tuân theo shared contracts. Follow-up evidence, outcomes và improvement paths là typed deterministic demo records; mọi aggregate sau giờ học được tính lại từ các records đó. Tên hiển thị và activity feed là presentation context, không giả là dữ liệu sản xuất.

**Sau demo sẽ làm gì?**
Kết nối roster/name service được ủy quyền, evidence list endpoint phân trang, lưu notes/overrides có audit, authorization theo trường và kiểm thử offline đầy đủ.

**Tốt hơn dashboard ở đâu?**
Nó nối dữ liệu với hành động: chuẩn bị → hiểu → duyệt → dạy → đo lại → can thiệp, thay vì dừng ở biểu đồ.

**Kiểm chứng khuyến nghị thế nào?**
Contract tests, engine tests, consistency tests, drill-down evidence, confidence/abstention, teacher review và so sánh outcome sau can thiệp.

## 14. Phụ lục kỹ thuật

### Route map

- `/` — Landing page, read-only trong thay đổi này.
- `/teacher` — Hôm nay.
- `/teacher/classes` — Lớp học.
- `/teacher/prepare` — Chuẩn bị bài.
- `/teacher/insights` — Pipeline, chẩn đoán, nhóm.
- `/teacher/students` — Tìm kiếm/bộ lọc/hồ sơ.
- `/teacher/lesson-plan` — Versioned lesson plan editor/approval.
- `/teacher/teaching` — Chế độ giảng dạy.
- `/teacher/after-class` — Kết quả sau tiết.
- `/teacher/interventions` — Hàng đợi củng cố.
- `/teacher/resources` — Học liệu.
- `/teacher/report` — Báo cáo can thiệp.
- `/teacher/report/print` — Bản in.

### Contracts và boundary

- Frontend gọi `TeacherWorkspaceRepository`; production adapter dùng `VITE_API_BASE_URL` hoặc Railway origin được repository chấp thuận.
- Core contracts: `EvidenceEventV1`, `StudentDiagnosticProfileV1`, `ClassSnapshotV1`, `TeacherLessonPlanV1`, `TeacherPlanVersionV1`, `StudentImprovementPathV1`, `InterventionReportV1`.
- `buildTeacherDemoModel` chuyển snapshot thành presentation model và tính aggregate từ source rows.
- Tên Việt Nam chỉ là lớp hiển thị deterministic; không thay đổi `student_id` nội bộ.
- Vercel root là `apps/web`; runtime không nhập fixture từ ngoài root. `vercel.json` rewrite mọi deep link về `index.html`.

### Giới hạn đã biết

- Notes, teaching progress, resource attach và reset là session-level demo state, chưa được ghi vào backend.
- Evidence timeline dùng `DemoEvidenceEvent` có typed fields và cùng nguồn với các aggregate follow-up trong demo. Đây là dữ liệu demo deterministic được tạo nhất quán từ snapshot, chưa phải danh sách event production vì API snapshot chưa trả event detail.
- Demo chưa xác minh dashboard Vercel/Railway; Preview phải được kiểm tra sau push.
- Không thay đổi student workspace, auth, database, migration hoặc deployment config trong công việc này.

## 15. Checklist một trang trước khi trình bày

- [ ] Preview deployment mới nhất, base PR là `dev`.
- [ ] API staging health xanh; CORS cho Preview/staging domain.
- [ ] `/teacher` không gọi `localhost:8000`.
- [ ] Reset Demo hoàn tất.
- [ ] Hôm nay hiển thị 40 học sinh và 5 nhóm.
- [ ] Insights hiển thị 2 học sinh thiếu minh chứng.
- [ ] Search “Nguyễn Minh Anh” mở đúng drawer.
- [ ] Lesson plan tải và nút quyết định đúng trạng thái.
- [ ] Teaching Mode bắt đầu, đổi nhóm, lưu quan sát.
- [ ] After Class và Interventions tải.
- [ ] Report và bản in tải.
- [ ] Resources preview/attach hoạt động.
- [ ] Không có lỗi console/network; direct refresh các route hoạt động.
- [ ] Tab dự phòng/ảnh chụp sẵn sàng.
- [ ] Kết bằng thông điệp: **evidence-backed, explainable, teacher-controlled**.
