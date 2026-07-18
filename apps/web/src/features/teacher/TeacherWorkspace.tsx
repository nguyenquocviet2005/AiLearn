import { useEffect, useState } from "react";

import type { ClassSnapshotV1, TeacherLessonPlanV1 } from "@ailearn/schemas";

import {
  fixtureTeacherWorkspaceRepository,
  type TeacherWorkspaceRepository,
} from "@/lib/adapters/teacher-fixtures";

type TeacherView = "overview" | "lesson-plan";

type WorkspaceState =
  | { kind: "loading"; view: TeacherView }
  | {
      kind: "ready";
      view: "overview";
      snapshot: ClassSnapshotV1;
    }
  | {
      kind: "ready";
      view: "lesson-plan";
      lessonPlan: TeacherLessonPlanV1;
    }
  | { kind: "error"; view: TeacherView };

type TeacherWorkspaceProps = {
  view: TeacherView;
  onNavigate: (path: "/teacher" | "/teacher/lesson-plan") => void;
  repository?: TeacherWorkspaceRepository;
};

function humanize(value: string) {
  return value.replace(/^skill_/, "").replaceAll("_", " ");
}

function formatStatus(value: string) {
  return value.replaceAll("_", " ");
}

function TeacherOverview({ snapshot }: { snapshot: ClassSnapshotV1 }) {
  const readinessCounts = snapshot.students.reduce<Record<string, number>>(
    (counts, student) => {
      counts[student.readiness_status] =
        (counts[student.readiness_status] ?? 0) + 1;
      return counts;
    },
    {},
  );
  const rootCauseCounts = snapshot.students.reduce<Record<string, number>>(
    (counts, student) => {
      const rootCause = student.primary_root_cause_skill_id;
      if (rootCause) {
        counts[rootCause] = (counts[rootCause] ?? 0) + 1;
      }
      return counts;
    },
    {},
  );

  return (
    <section className="teacher-content" aria-labelledby="teacher-page-title">
      <div className="teacher-page-heading">
        <div>
          <p className="eyebrow">Class snapshot / fixture preview</p>
          <h1 id="teacher-page-title">
            A teaching plan starts with the evidence.
          </h1>
        </div>
        <p className="teacher-context">
          {snapshot.class_id} / {snapshot.lesson_id}
        </p>
      </div>

      <section className="teacher-summary" aria-label="Class readiness summary">
        <article>
          <span>Ready</span>
          <strong>{readinessCounts.ready ?? 0}</strong>
          <p>Can move into transfer practice.</p>
        </article>
        <article>
          <span>Needs support</span>
          <strong>{readinessCounts.needs_support ?? 0}</strong>
          <p>Have a supported intervention path.</p>
        </article>
        <article>
          <span>Needs confirmation</span>
          <strong>
            {(readinessCounts.abstained ?? 0) +
              snapshot.unknown_student_ids.length}
          </strong>
          <p>Stay separate until more evidence is available.</p>
        </article>
      </section>

      <div className="teacher-layout">
        <section
          className="teacher-panel teacher-priorities"
          aria-labelledby="priority-title"
        >
          <div className="teacher-panel-heading">
            <p className="eyebrow">Teaching priorities</p>
            <h2 id="priority-title">What needs attention first</h2>
          </div>
          <ol>
            {snapshot.teaching_priorities.map((priority) => (
              <li key={priority.skill_id}>
                <span className="priority-rank">0{priority.rank}</span>
                <div>
                  <h3>{humanize(priority.skill_id)}</h3>
                  <p>{priority.rationale}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="root-cause-distribution">
            <h3>Root-cause distribution</h3>
            <ul>
              {Object.entries(rootCauseCounts).map(([skillId, count]) => (
                <li key={skillId}>
                  <span>{humanize(skillId)}</span>
                  <strong>{count}</strong>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          className="teacher-panel teacher-confirmation"
          aria-labelledby="confirmation-title"
        >
          <p className="eyebrow">Evidence boundary</p>
          <h2 id="confirmation-title">Keep uncertainty visible</h2>
          <p>
            {snapshot.unknown_student_ids.length} student
            {snapshot.unknown_student_ids.length === 1 ? " is" : "s are"} not
            classified because the snapshot has insufficient evidence.
          </p>
          <ul>
            {snapshot.unknown_student_ids.map((studentId) => (
              <li key={studentId}>{studentId}</li>
            ))}
          </ul>
        </section>
      </div>

      <section
        className="teacher-panel teacher-groups"
        aria-labelledby="groups-title"
      >
        <div className="teacher-panel-heading">
          <p className="eyebrow">Intervention groups</p>
          <h2 id="groups-title">Group by the help each learner needs</h2>
        </div>
        <div className="group-grid">
          {snapshot.groups.map((group) => (
            <article key={group.id}>
              <p className="group-count">{group.student_ids.length} learners</p>
              <h3>{humanize(group.intervention_need)}</h3>
              <p>{group.rationale}</p>
              <ul aria-label={`${group.id} students`}>
                {group.student_ids.map((studentId) => (
                  <li key={studentId}>{studentId}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function LessonPlanView({ lessonPlan }: { lessonPlan: TeacherLessonPlanV1 }) {
  return (
    <section className="teacher-content" aria-labelledby="teacher-page-title">
      <div className="teacher-page-heading">
        <div>
          <p className="eyebrow">Lesson plan / fixture preview</p>
          <h1 id="teacher-page-title">
            A 45-minute path from evidence to action.
          </h1>
        </div>
        <p className="teacher-context">{lessonPlan.lesson_id}</p>
      </div>

      <section className="lesson-plan-meta" aria-label="Lesson plan status">
        <div>
          <span>Plan status</span>
          <strong>{formatStatus(lessonPlan.status)}</strong>
        </div>
        <div>
          <span>Total time</span>
          <strong>{lessonPlan.total_duration_minutes} minutes</strong>
        </div>
        <p>
          This is a read-only fixture view. Teacher edits and approval are
          intentionally deferred to VAI-19.
        </p>
      </section>

      <ol className="lesson-timeline" aria-label="Lesson activities">
        {lessonPlan.activities.map((activity, index) => (
          <li key={activity.id}>
            <span className="timeline-index">
              {String(index + 1).padStart(2, "0")}
            </span>
            <article>
              <div className="activity-heading">
                <div>
                  <p className="eyebrow">{activity.duration_minutes} minutes</p>
                  <h2>{activity.title}</h2>
                </div>
                <span>{humanize(activity.skill_id)}</span>
              </div>
              <p>{activity.rationale}</p>
              <div className="activity-evidence">
                <strong>Expected evidence</strong>
                <span>{activity.expected_evidence}</span>
              </div>
            </article>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function TeacherWorkspace({
  view,
  onNavigate,
  repository = fixtureTeacherWorkspaceRepository,
}: TeacherWorkspaceProps) {
  const [workspace, setWorkspace] = useState<WorkspaceState>({
    kind: "loading",
    view,
  });

  useEffect(() => {
    let active = true;

    setWorkspace({ kind: "loading", view });

    if (view === "overview") {
      void repository.getClassSnapshot().then(
        (snapshot) => {
          if (active) {
            setWorkspace({ kind: "ready", view, snapshot });
          }
        },
        () => {
          if (active) {
            setWorkspace({ kind: "error", view });
          }
        },
      );
    } else {
      void repository.getLessonPlan().then(
        (lessonPlan) => {
          if (active) {
            setWorkspace({ kind: "ready", view, lessonPlan });
          }
        },
        () => {
          if (active) {
            setWorkspace({ kind: "error", view });
          }
        },
      );
    }

    return () => {
      active = false;
    };
  }, [repository, view]);

  const isCurrentView = workspace.view === view;

  return (
    <main className="teacher-shell">
      <header className="teacher-header">
        <a
          className="teacher-wordmark"
          href="/teacher"
          onClick={(event) => {
            event.preventDefault();
            onNavigate("/teacher");
          }}
        >
          AiLearn <span>Teacher workspace</span>
        </a>
        <nav aria-label="Teacher workspace navigation">
          <a
            aria-current={view === "overview" ? "page" : undefined}
            href="/teacher"
            onClick={(event) => {
              event.preventDefault();
              onNavigate("/teacher");
            }}
          >
            Class overview
          </a>
          <a
            aria-current={view === "lesson-plan" ? "page" : undefined}
            href="/teacher/lesson-plan"
            onClick={(event) => {
              event.preventDefault();
              onNavigate("/teacher/lesson-plan");
            }}
          >
            Lesson plan
          </a>
        </nav>
      </header>

      {(!isCurrentView || workspace.kind === "loading") && (
        <p className="teacher-state" aria-live="polite">
          Preparing the fixture workspace...
        </p>
      )}

      {isCurrentView && workspace.kind === "error" && (
        <p className="teacher-state" role="alert">
          The teacher fixture workspace is unavailable.
        </p>
      )}

      {isCurrentView &&
        workspace.kind === "ready" &&
        workspace.view === "overview" && (
          <TeacherOverview snapshot={workspace.snapshot} />
        )}

      {isCurrentView &&
        workspace.kind === "ready" &&
        workspace.view === "lesson-plan" && (
          <LessonPlanView lessonPlan={workspace.lessonPlan} />
        )}
    </main>
  );
}
