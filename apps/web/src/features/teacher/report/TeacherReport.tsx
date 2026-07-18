import { useEffect, useState } from "react";

import type { InterventionReportV1, OutcomeKind } from "@ailearn/schemas";

import type { TeacherReportRepository } from "@/lib/adapters/teacher-report-repository";
import { httpTeacherReportRepository } from "@/lib/adapters/teacher-report-repository";
import { teacherReportErrorMessage } from "@/features/teacher/report/report-errors";
import { WorkflowStrip } from "@/features/teacher/product/TeacherProductWorkspace";
import {
  TeacherShell,
  type TeacherRoute,
} from "@/features/teacher/TeacherShell";
import {
  learnerLabel,
  outcomeLabels,
  skillLabel,
} from "@/features/teacher/teacher-copy";

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
        <strong>Làm đúng khi có hỗ trợ chưa phải là vận dụng.</strong>
        <p>
          Kết quả vận dụng chỉ được xác nhận bằng bài làm độc lập ở một tình
          huống mới có liên quan, không chỉ bằng câu trả lời đúng khi đang được
          hướng dẫn.
        </p>
      </aside>

      <section
        className="teacher-panel report-evidence"
        aria-labelledby="report-evidence-title"
      >
        <p className="teacher-kicker">Bằng chứng từng học sinh</p>
        <h2 id="report-evidence-title">Điều gì thay đổi sau can thiệp</h2>
        <div className="report-table-wrap">
          <table>
            <caption>
              Bằng chứng được ghi nhận cho từng kết quả đại diện
            </caption>
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
                  <th scope="row">{learnerLabel(student.student_id)}</th>
                  <td>{outcomeLabels[student.outcome]}</td>
                  <td>
                    {student.evidence_ids.length > 0
                      ? `${student.evidence_ids.length} minh chứng sau can thiệp`
                      : "Chưa ghi nhận bằng chứng"}
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
          <p className="teacher-kicker">Khoảng hổng còn lại</p>
          <h2 id="remaining-gaps-title">Kỹ năng vẫn cần được chú ý</h2>
          {report.remaining_gaps.length > 0 ? (
            <ul>
              {report.remaining_gaps.map((gap) => (
                <li key={gap.skill_id}>
                  <strong>{skillLabel(gap.skill_id)}</strong>
                  <span>{gap.student_ids.map(learnerLabel).join(", ")}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="teacher-empty">
              Không còn khoảng hổng nào được ghi nhận sau can thiệp này.
            </p>
          )}
        </section>
        <section
          className="teacher-panel report-next-focus"
          aria-labelledby="next-focus-title"
        >
          <p className="teacher-kicker">Bài học tiếp theo</p>
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
  onNavigate: (path: TeacherRoute | "/teacher/report/print") => void;
  repository?: TeacherReportRepository;
}) {
  const [state, setState] = useState<ReportState>({ kind: "loading" });
  const [requestKey, setRequestKey] = useState(0);

  useEffect(() => {
    let active = true;
    setState({ kind: "loading" });
    void repository.getReport().then(
      (report) => active && setState({ kind: "ready", report }),
      (error) =>
        active &&
        setState({ kind: "error", message: teacherReportErrorMessage(error) }),
    );
    return () => {
      active = false;
    };
  }, [repository, requestKey]);

  return (
    <TeacherShell
      connectionStatus={
        state.kind === "loading"
          ? "loading"
          : state.kind === "error"
            ? "error"
            : "connected"
      }
      currentRoute="/teacher/report"
      onNavigate={onNavigate}
    >
      <div className="teacher-product teacher-product-embedded-flow">
        <WorkflowStrip current="/teacher/report" onNavigate={onNavigate} />
      </div>
      {state.kind === "loading" && (
        <section
          className="teacher-loading"
          aria-live="polite"
          aria-busy="true"
        >
          <p className="teacher-kicker">Đang tải kết quả can thiệp</p>
          <div className="teacher-skeleton teacher-skeleton-title" />
          <div className="teacher-skeleton-grid" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </section>
      )}
      {state.kind === "error" && (
        <section className="teacher-state-card" role="alert">
          <img src="/brand/ailearn-mascot.webp" alt="" />
          <div>
            <p className="teacher-kicker">Báo cáo tạm thời gián đoạn</p>
            <h1>Không thể tải báo cáo can thiệp.</h1>
            <p>{state.message}</p>
            <button
              className="teacher-button teacher-button-primary"
              onClick={() => setRequestKey((key) => key + 1)}
              type="button"
            >
              Thử lại
            </button>
          </div>
        </section>
      )}
      {state.kind === "ready" && (
        <section
          className="teacher-content report-content"
          aria-labelledby="report-title"
        >
          <div className="teacher-page-heading">
            <div>
              <p className="teacher-kicker">
                Báo cáo can thiệp · Rà soát bằng chứng
              </p>
              <h1 id="report-title">
                Nhìn rõ điều đã thay đổi và nội dung vẫn cần dạy.
              </h1>
              <p className="teacher-lede">
                Phân biệt thành công khi có hỗ trợ với khả năng vận dụng độc
                lập, rồi đưa khoảng hổng còn lại vào bài học tiếp theo.
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
              Mở bản in
            </a>
          </div>
          <p className="teacher-context">
            Lớp: Lớp 7A / Bài học: Đại lượng tỉ lệ nghịch
          </p>
          <InterventionReportDetails report={state.report} />
        </section>
      )}
    </TeacherShell>
  );
}
