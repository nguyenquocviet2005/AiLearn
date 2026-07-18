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

import "@/features/teacher/teacher.css";

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
    <main className="print-shell teacher-print">
      <div className="print-actions">
        <a href="/teacher/report">Back to report</a>
        {state.kind === "ready" && (
          <button
            className="teacher-button teacher-button-primary"
            type="button"
            onClick={() => window.print()}
          >
            {state.plan ? "Print report and lesson plan" : "Print report"}
          </button>
        )}
      </div>
      {state.kind === "loading" && (
        <p className="teacher-print-state" aria-live="polite">
          Preparing a low-bandwidth printable view...
        </p>
      )}
      {state.kind === "error" && (
        <p className="teacher-print-state" role="alert">
          {state.message}
        </p>
      )}
      {state.kind === "ready" && (
        <article className="print-sheet">
          <header>
            <p className="teacher-print-kicker">AiLearn / teacher record</p>
            <h1>
              {state.plan
                ? "Intervention report and lesson plan"
                : "Intervention report"}
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
              <p className="teacher-print-kicker">Printable lesson plan</p>
              <h2 id="print-plan-title">
                {state.plan.lesson_plan.total_duration_minutes}-minute teaching
                sequence
              </h2>
              <ol>
                {state.plan.lesson_plan.activities.map((activity) => (
                  <li key={activity.id}>
                    <strong>
                      {activity.title} · {activity.duration_minutes} min
                    </strong>
                    <p>{activity.rationale}</p>
                    <span>Evidence: {activity.expected_evidence}</span>
                  </li>
                ))}
              </ol>
            </section>
          ) : (
            <p className="print-plan-warning" role="status">
              The matching lesson plan is unavailable. The intervention report
              remains ready to print.
            </p>
          )}
        </article>
      )}
    </main>
  );
}
