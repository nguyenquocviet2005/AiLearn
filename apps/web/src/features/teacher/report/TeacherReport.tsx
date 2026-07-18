import { useEffect, useState } from "react";

import type { InterventionReportV1, OutcomeKind } from "@ailearn/schemas";

import type { TeacherReportRepository } from "@/lib/adapters/teacher-report-repository";
import { httpTeacherReportRepository } from "@/lib/adapters/teacher-report-repository";
import { teacherReportErrorMessage } from "@/features/teacher/report/report-errors";
import {
  TeacherShell,
  type TeacherRoute,
} from "@/features/teacher/TeacherShell";

const outcomeLabels: Record<OutcomeKind, string> = {
  passed_transfer: "Đã vận dụng độc lập",
  still_struggling: "Vẫn cần hỗ trợ",
  root_cause_reclassified: "Đã phân loại lại",
  incomplete: "Chưa hoàn thành",
  teacher_escalation: "Cần giáo viên hỗ trợ",
};

const outcomeOrder: OutcomeKind[] = [
  "passed_transfer",
  "still_struggling",
  "root_cause_reclassified",
  "incomplete",
  "teacher_escalation",
];

type ReportState =
  | { kind: "loading" }
  | { kind: "ready"; report: InterventionReportV1 }
  | { kind: "error"; message: string };

export function InterventionReportDetails({
  report,
}: {
  report: InterventionReportV1;
}) {
  return (
    <>
      <section className="report-outcome-grid" aria-label="Tổng hợp kết quả">
        {outcomeOrder.map((outcome) => (
          <article key={outcome}>
            <strong>{report.outcome_counts[outcome]}</strong>
            <span>{outcomeLabels[outcome]}</span>
          </article>
        ))}
      </section>

      <aside className="report-evidence-boundary">
        <span className="report-boundary-icon" aria-hidden="true">
          i
        </span>
        <strong>Một lần làm đúng chưa phải là vận dụng.</strong>
        <p>
          Học sinh chỉ được ghi nhận đã vận dụng khi có bằng chứng độc lập ở một
          nhiệm vụ mới có liên quan, không chỉ là trả lời đúng trong lúc được hỗ
          trợ.
        </p>
      </aside>

      <section
        className="teacher-panel report-evidence"
        aria-labelledby="report-evidence-title"
      >
        <p className="eyebrow">Bằng chứng từng học sinh</p>
        <h2 id="report-evidence-title">Điều gì thay đổi sau can thiệp</h2>
        <div className="report-table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Học sinh</th>
                <th scope="col">Kết quả</th>
                <th scope="col">Bằng chứng</th>
              </tr>
            </thead>
            <tbody>
              {report.student_outcomes.map((student) => (
                <tr key={student.student_id}>
                  <th scope="row">{student.student_id}</th>
                  <td>{outcomeLabels[student.outcome]}</td>
                  <td>
                    {student.evidence_ids.length > 0
                      ? student.evidence_ids.join(", ")
                      : "Chưa có bằng chứng"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="report-follow-up">
        <section
          className="teacher-panel"
          aria-labelledby="remaining-gaps-title"
        >
          <p className="eyebrow">Khoảng trống còn lại</p>
          <h2 id="remaining-gaps-title">Kỹ năng vẫn cần được chú ý</h2>
          <ul>
            {report.remaining_gaps.map((gap) => (
              <li key={gap.skill_id}>
                <strong>{gap.skill_id.replaceAll("_", " ")}</strong>
                <span>{gap.student_ids.join(", ")}</span>
              </li>
            ))}
          </ul>
        </section>
        <section
          className="teacher-panel report-next-focus"
          aria-labelledby="next-focus-title"
        >
          <p className="eyebrow">Tiết học tiếp theo</p>
          <h2 id="next-focus-title">Trọng tâm được đề xuất</h2>
          <p>{report.next_lesson_focus}</p>
        </section>
      </div>
    </>
  );
}

export function TeacherReport({
  onNavigate,
  repository = httpTeacherReportRepository,
}: {
  onNavigate: (path: TeacherRoute) => void;
  repository?: TeacherReportRepository;
}) {
  const [state, setState] = useState<ReportState>({ kind: "loading" });

  useEffect(() => {
    let active = true;
    void repository.getReport().then(
      (report) => active && setState({ kind: "ready", report }),
      (error) =>
        active &&
        setState({ kind: "error", message: teacherReportErrorMessage(error) }),
    );
    return () => {
      active = false;
    };
  }, [repository]);

  return (
    <TeacherShell current="report" onNavigate={onNavigate}>
      {state.kind === "loading" && (
        <div className="teacher-state" aria-live="polite">
          <span className="teacher-state-spinner" aria-hidden="true" />
          <div>
            <strong>Đang chuẩn bị báo cáo can thiệp</strong>
            <p>AiLearn đang đối chiếu kết quả với bằng chứng đã ghi nhận.</p>
          </div>
        </div>
      )}
      {state.kind === "error" && (
        <div className="teacher-state error" role="alert">
          <span className="teacher-state-symbol" aria-hidden="true">
            !
          </span>
          <div>
            <strong>Chưa thể tải báo cáo</strong>
            <p>{state.message}</p>
          </div>
        </div>
      )}
      {state.kind === "ready" && (
        <section
          className="teacher-content report-content"
          aria-labelledby="report-title"
        >
          <div className="teacher-page-heading">
            <div>
              <p className="eyebrow">Báo cáo can thiệp</p>
              <h1 id="report-title">
                Thấy rõ điều đã đổi và điều cần dạy tiếp.
              </h1>
              <p className="teacher-page-intro">
                Kết quả được tách khỏi phán đoán: mỗi đề xuất đều đi cùng bằng
                chứng và phần còn chưa chắc chắn.
              </p>
            </div>
            <a
              className="report-print-link"
              href="/teacher/report/print"
              onClick={(event) => {
                event.preventDefault();
                onNavigate("/teacher/report/print");
              }}
            >
              <span aria-hidden="true">↗</span>
              Mở bản in
            </a>
          </div>
          <div className="teacher-report-context">
            <span>{state.report.class_id}</span>
            <span>{state.report.lesson_id}</span>
          </div>
          <InterventionReportDetails report={state.report} />
        </section>
      )}
    </TeacherShell>
  );
}
