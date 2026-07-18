import { useEffect, useState } from "react";

import type { ClassSnapshotV1, TeacherPlanVersionV1 } from "@ailearn/schemas";

import {
  httpTeacherWorkspaceRepository,
  TeacherRepositoryError,
} from "@/lib/adapters/teacher-repository";
import type { TeacherWorkspaceRepository } from "@/lib/adapters/teacher-workspace-repository";

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
      planVersion: TeacherPlanVersionV1;
    }
  | { kind: "error"; view: TeacherView; message: string };

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

function teacherWorkspaceErrorMessage(error: unknown): string {
  if (error instanceof TeacherRepositoryError) {
    if (error.kind === "configuration") {
      return "The teacher workspace API is not configured for this deployment.";
    }
    if (error.kind === "unavailable") {
      return "The teacher workspace API is unavailable. Try again later.";
    }
  }
  return "The teacher workspace data could not be loaded.";
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

function LessonPlanView({
  planVersion,
  repository,
  onVersionChange,
}: {
  planVersion: TeacherPlanVersionV1;
  repository: TeacherWorkspaceRepository;
  onVersionChange: (version: TeacherPlanVersionV1) => void;
}) {
  const [snapshot, setSnapshot] = useState(planVersion.snapshot);
  const [lessonPlan, setLessonPlan] = useState(planVersion.lesson_plan);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty =
    snapshot !== planVersion.snapshot || lessonPlan !== planVersion.lesson_plan;
  const durationInvalid =
    lessonPlan.total_duration_minutes < 1 ||
    lessonPlan.total_duration_minutes > 45 ||
    lessonPlan.activities.some(
      (activity) =>
        !Number.isInteger(activity.duration_minutes) ||
        activity.duration_minutes < 1,
    );

  useEffect(() => {
    setSnapshot(planVersion.snapshot);
    setLessonPlan(planVersion.lesson_plan);
    setError(null);
  }, [planVersion]);

  async function saveVersion() {
    setSaving(true);
    setError(null);
    try {
      onVersionChange(
        await repository.createVersion(
          snapshot,
          lessonPlan,
          planVersion.version,
        ),
      );
    } catch {
      setError("Could not save this teacher edit.");
    } finally {
      setSaving(false);
    }
  }

  async function decide(action: "approve" | "reject" | "publish") {
    setSaving(true);
    setError(null);
    try {
      const next = await repository[action](
        planVersion.plan_id,
        planVersion.version,
      );
      onVersionChange(next);
    } catch {
      setError("Could not update the teacher decision.");
    } finally {
      setSaving(false);
    }
  }

  function moveStudent(
    studentId: string,
    fromGroupId: string,
    toGroupId: string,
  ) {
    setSnapshot((current) => ({
      ...current,
      groups: current.groups.map((group) => {
        if (group.id === fromGroupId) {
          return {
            ...group,
            student_ids: group.student_ids.filter((id) => id !== studentId),
          };
        }
        if (group.id === toGroupId) {
          return {
            ...group,
            student_ids: [...group.student_ids, studentId].sort(),
          };
        }
        return group;
      }),
    }));
  }

  function updateDuration(activityId: string, duration: number) {
    const activities = lessonPlan.activities.map((activity) =>
      activity.id === activityId
        ? { ...activity, duration_minutes: duration }
        : activity,
    );
    setLessonPlan({
      ...lessonPlan,
      activities,
      total_duration_minutes: activities.reduce(
        (total, activity) => total + activity.duration_minutes,
        0,
      ),
    });
  }

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
          Version {planVersion.version} · {formatStatus(planVersion.decision)}{" "}
          decision
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
                  <label
                    className="eyebrow"
                    htmlFor={`duration-${activity.id}`}
                  >
                    Minutes
                    <input
                      id={`duration-${activity.id}`}
                      aria-label={`${activity.title} duration`}
                      min="1"
                      max="45"
                      type="number"
                      value={activity.duration_minutes}
                      onChange={(event) =>
                        updateDuration(activity.id, Number(event.target.value))
                      }
                    />
                  </label>
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

      <section className="teacher-panel" aria-labelledby="group-editor-title">
        <p className="eyebrow">Teacher edit</p>
        <h2 id="group-editor-title">Adjust intervention groups</h2>
        {snapshot.groups.map((group) => (
          <div key={group.id}>
            <h3>{humanize(group.intervention_need)}</h3>
            {group.student_ids.map((studentId) => (
              <label key={studentId}>
                {studentId}
                <select
                  aria-label={`Move ${studentId}`}
                  disabled={group.student_ids.length === 1}
                  value={group.id}
                  onChange={(event) =>
                    moveStudent(studentId, group.id, event.target.value)
                  }
                >
                  {snapshot.groups.map((target) => (
                    <option key={target.id} value={target.id}>
                      {humanize(target.intervention_need)}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        ))}
      </section>

      <section className="teacher-panel" aria-label="Teacher approval controls">
        <button
          disabled={saving || durationInvalid}
          onClick={() => void saveVersion()}
          type="button"
        >
          Save teacher edit
        </button>
        <button
          disabled={saving || dirty}
          onClick={() => void decide("approve")}
          type="button"
        >
          Approve plan
        </button>
        <button
          disabled={saving || dirty}
          onClick={() => void decide("reject")}
          type="button"
        >
          Reject plan
        </button>
        <button
          disabled={saving || dirty || planVersion.decision !== "approved"}
          onClick={() => void decide("publish")}
          type="button"
        >
          Publish plan
        </button>
        {error && <p role="alert">{error}</p>}
        {durationInvalid && (
          <p role="alert">A lesson plan cannot exceed 45 minutes.</p>
        )}
      </section>
    </section>
  );
}

export function TeacherWorkspace({
  view,
  onNavigate,
  repository = httpTeacherWorkspaceRepository,
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
        (error) => {
          if (active) {
            setWorkspace({
              kind: "error",
              view,
              message: teacherWorkspaceErrorMessage(error),
            });
          }
        },
      );
    } else {
      void repository.getLessonPlan().then(
        (planVersion) => {
          if (active) {
            setWorkspace({ kind: "ready", view, planVersion });
          }
        },
        (error) => {
          if (active) {
            setWorkspace({
              kind: "error",
              view,
              message: teacherWorkspaceErrorMessage(error),
            });
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
          Preparing the teacher workspace...
        </p>
      )}

      {isCurrentView && workspace.kind === "error" && (
        <p className="teacher-state" role="alert">
          {workspace.message}
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
          <LessonPlanView
            onVersionChange={(planVersion) =>
              setWorkspace({ kind: "ready", view: "lesson-plan", planVersion })
            }
            planVersion={workspace.planVersion}
            repository={repository}
          />
        )}
    </main>
  );
}
