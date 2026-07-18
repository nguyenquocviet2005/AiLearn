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
        <p className="teacher-kicker">Individual evidence</p>
        <h2 id="report-evidence-title">What happened after intervention</h2>
        <div className="report-table-wrap">
          <table>
            <caption>
              Evidence recorded for each representative learner outcome
            </caption>
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
          <p className="teacher-kicker">Remaining gaps</p>
          <h2 id="remaining-gaps-title">Skills that still need attention</h2>
          {report.remaining_gaps.length > 0 ? (
            <ul>
              {report.remaining_gaps.map((gap) => (
                <li key={gap.skill_id}>
                  <strong>
                    {gap.skill_id.replace(/^skill_/, "").replaceAll("_", " ")}
                  </strong>
                  <span>{gap.student_ids.join(", ")}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="teacher-empty">
              No remaining gap is recorded for this intervention.
            </p>
          )}
        </section>
        <section
          className="teacher-panel report-next-focus"
          aria-labelledby="next-focus-title"
        >
          <p className="teacher-kicker">Next lesson</p>
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
    <TeacherShell currentRoute="/teacher/report" onNavigate={onNavigate}>
      {state.kind === "loading" && (
        <section
          className="teacher-loading"
          aria-live="polite"
          aria-busy="true"
        >
          <p className="teacher-kicker">Loading intervention outcomes</p>
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
            <p className="teacher-kicker">Report unavailable</p>
            <h1>We could not load the intervention report.</h1>
            <p>{state.message}</p>
            <button
              className="teacher-button teacher-button-primary"
              onClick={() => setRequestKey((key) => key + 1)}
              type="button"
            >
              Try again
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
                Intervention report · Evidence review
              </p>
              <h1 id="report-title">
                See what changed—and what still needs teaching.
              </h1>
              <p className="teacher-lede">
                Separate supported success from independent transfer, then carry
                remaining gaps into the next lesson.
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
              Open printable view
            </a>
          </div>
          <p className="teacher-context">
            {state.report.class_id} / {state.report.lesson_id}
          </p>
          <InterventionReportDetails report={state.report} />
        </section>
      )}
    </TeacherShell>
  );
}
