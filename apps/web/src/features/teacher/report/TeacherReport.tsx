import { useEffect, useState } from "react";

import type { InterventionReportV1, OutcomeKind } from "@ailearn/schemas";

import type { TeacherReportRepository } from "@/lib/adapters/teacher-report-repository";
import { httpTeacherReportRepository } from "@/lib/adapters/teacher-report-repository";
import { teacherReportErrorMessage } from "@/features/teacher/report/report-errors";

const outcomeLabels: Record<OutcomeKind, string> = {
  passed_transfer: "Passed independent transfer",
  still_struggling: "Still struggling",
  root_cause_reclassified: "Root cause reclassified",
  incomplete: "Incomplete",
  teacher_escalation: "Teacher escalation",
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
      <section className="report-outcome-grid" aria-label="Outcome counts">
        {outcomeOrder.map((outcome) => (
          <article key={outcome}>
            <strong>{report.outcome_counts[outcome]}</strong>
            <span>{outcomeLabels[outcome]}</span>
          </article>
        ))}
      </section>

      <aside className="report-evidence-boundary">
        <strong>Immediate success is not transfer.</strong>
        <p>
          Passed transfer requires independent evidence on a new, related
          task—not only a correct answer during supported practice.
        </p>
      </aside>

      <section
        className="teacher-panel report-evidence"
        aria-labelledby="report-evidence-title"
      >
        <p className="eyebrow">Individual evidence</p>
        <h2 id="report-evidence-title">What happened after intervention</h2>
        <div className="report-table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Learner</th>
                <th scope="col">Outcome</th>
                <th scope="col">Evidence</th>
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
                      : "No evidence recorded"}
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
          <p className="eyebrow">Remaining gaps</p>
          <h2 id="remaining-gaps-title">Skills that still need attention</h2>
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
          <p className="eyebrow">Next lesson</p>
          <h2 id="next-focus-title">Recommended focus</h2>
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
  onNavigate: (
    path:
      | "/teacher"
      | "/teacher/lesson-plan"
      | "/teacher/report"
      | "/teacher/report/print",
  ) => void;
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
    <main className="teacher-shell">
      <header className="teacher-header">
        <a
          href="/teacher"
          className="teacher-wordmark"
          onClick={(event) => {
            event.preventDefault();
            onNavigate("/teacher");
          }}
        >
          AiLearn <span>Teacher workspace</span>
        </a>
        <nav aria-label="Teacher workspace navigation">
          <a
            href="/teacher"
            onClick={(event) => {
              event.preventDefault();
              onNavigate("/teacher");
            }}
          >
            Class overview
          </a>
          <a
            href="/teacher/lesson-plan"
            onClick={(event) => {
              event.preventDefault();
              onNavigate("/teacher/lesson-plan");
            }}
          >
            Lesson plan
          </a>
          <a aria-current="page" href="/teacher/report">
            Intervention report
          </a>
        </nav>
      </header>

      {state.kind === "loading" && (
        <p className="teacher-state">Preparing the intervention report...</p>
      )}
      {state.kind === "error" && (
        <p className="teacher-state" role="alert">
          {state.message}
        </p>
      )}
      {state.kind === "ready" && (
        <section
          className="teacher-content report-content"
          aria-labelledby="report-title"
        >
          <div className="teacher-page-heading">
            <div>
              <p className="eyebrow">Intervention report / evidence review</p>
              <h1 id="report-title">
                See what changed—and what still needs teaching.
              </h1>
            </div>
            <a
              className="report-print-link"
              href="/teacher/report/print"
              onClick={(event) => {
                event.preventDefault();
                onNavigate("/teacher/report/print");
              }}
            >
              Open printable view
            </a>
          </div>
          <p className="teacher-context">
            {state.report.class_id} / {state.report.lesson_id}
          </p>
          <InterventionReportDetails report={state.report} />
        </section>
      )}
    </main>
  );
}
