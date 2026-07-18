import { useEffect, useState } from "react";

import type {
  InterventionReportV1,
  TeacherPlanVersionV1,
} from "@ailearn/schemas";

import { InterventionReportDetails } from "@/features/teacher/report/TeacherReport";
import { teacherReportErrorMessage } from "@/features/teacher/report/report-errors";
import { httpTeacherWorkspaceRepository } from "@/lib/adapters/teacher-repository";
import type { TeacherReportRepository } from "@/lib/adapters/teacher-report-repository";
import { httpTeacherReportRepository } from "@/lib/adapters/teacher-report-repository";
import type { TeacherWorkspaceRepository } from "@/lib/adapters/teacher-workspace-repository";

type PrintState =
  | { kind: "loading" }
  | {
      kind: "ready";
      report: InterventionReportV1;
      plan: TeacherPlanVersionV1 | null;
    }
  | { kind: "error"; message: string };

export function PrintableTeacherReport({
  reportRepository = httpTeacherReportRepository,
  planRepository = httpTeacherWorkspaceRepository,
}: {
  reportRepository?: TeacherReportRepository;
  planRepository?: TeacherWorkspaceRepository;
}) {
  const [state, setState] = useState<PrintState>({ kind: "loading" });

  useEffect(() => {
    let active = true;
    void reportRepository.getReport().then(
      async (report) => {
        try {
          const plan = await planRepository.getLessonPlan(
            report.printable_lesson_plan_id,
          );
          const matchesReport =
            plan.plan_id === report.printable_lesson_plan_id &&
            plan.lesson_plan.class_id === report.class_id &&
            plan.lesson_plan.lesson_id === report.lesson_id;
          if (active) {
            setState({
              kind: "ready",
              report,
              plan: matchesReport ? plan : null,
            });
          }
        } catch {
          if (active) {
            setState({ kind: "ready", report, plan: null });
          }
        }
      },
      (error) =>
        active &&
        setState({ kind: "error", message: teacherReportErrorMessage(error) }),
    );
    return () => {
      active = false;
    };
  }, [planRepository, reportRepository]);

  return (
    <main className="print-shell">
      <div className="print-actions">
        <a href="/teacher/report">← Quay lại báo cáo</a>
        {state.kind === "ready" && (
          <button type="button" onClick={() => window.print()}>
            {state.plan ? "In báo cáo và kế hoạch" : "In báo cáo"}
          </button>
        )}
      </div>
      {state.kind === "loading" && (
        <p aria-live="polite">Đang chuẩn bị bản in tiết kiệm dữ liệu...</p>
      )}
      {state.kind === "error" && <p role="alert">{state.message}</p>}
      {state.kind === "ready" && (
        <article className="print-sheet">
          <header>
            <img
              className="print-brand"
              src="/brand/ailearn-logo.webp"
              alt="AiLearn"
            />
            <p className="eyebrow">Hồ sơ giáo viên</p>
            <h1>
              {state.plan
                ? "Báo cáo can thiệp và kế hoạch bài dạy"
                : "Báo cáo can thiệp"}
            </h1>
            <p>
              {state.report.class_id} / {state.report.lesson_id}
            </p>
          </header>
          <InterventionReportDetails report={state.report} />
          {state.plan ? (
            <section
              className="print-lesson-plan"
              aria-labelledby="print-plan-title"
            >
              <p className="eyebrow">Kế hoạch bài dạy</p>
              <h2 id="print-plan-title">
                Tiến trình dạy học{" "}
                {state.plan.lesson_plan.total_duration_minutes}
                phút
              </h2>
              <ol>
                {state.plan.lesson_plan.activities.map((activity) => (
                  <li key={activity.id}>
                    <strong>
                      {activity.title} · {activity.duration_minutes} phút
                    </strong>
                    <p>{activity.rationale}</p>
                    <span>Bằng chứng: {activity.expected_evidence}</span>
                  </li>
                ))}
              </ol>
            </section>
          ) : (
            <p className="print-plan-warning" role="status">
              Chưa thể tải kế hoạch bài dạy tương ứng. Báo cáo can thiệp vẫn sẵn
              sàng để in.
            </p>
          )}
        </article>
      )}
    </main>
  );
}
