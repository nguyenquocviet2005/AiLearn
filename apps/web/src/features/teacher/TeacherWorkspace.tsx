import { useEffect, useState } from "react";

import type { ClassSnapshotV1, TeacherPlanVersionV1 } from "@ailearn/schemas";

import {
  httpTeacherWorkspaceRepository,
  TeacherRepositoryError,
} from "@/lib/adapters/teacher-repository";
import type { TeacherWorkspaceRepository } from "@/lib/adapters/teacher-workspace-repository";
import { TeacherShell, type TeacherRoute } from "./TeacherShell";

type TeacherView = "overview" | "lesson-plan";
type PlanAction = "save" | "approve" | "reject" | "publish";

type WorkspaceState =
  | { kind: "loading"; view: TeacherView }
  | { kind: "ready"; view: "overview"; snapshot: ClassSnapshotV1 }
  | {
      kind: "ready";
      view: "lesson-plan";
      planVersion: TeacherPlanVersionV1;
    }
  | { kind: "error"; view: TeacherView; message: string };

type TeacherWorkspaceProps = {
  view: TeacherView;
  onNavigate: (path: TeacherRoute) => void;
  repository?: TeacherWorkspaceRepository;
};

function humanize(value: string) {
  return value
    .replace(/^(skill_|repair:|confirmation:)/, "")
    .replaceAll("_", " ");
}

function formatStatus(value: string) {
  return value.replaceAll("_", " ");
}

function learnerLabel(studentId: string) {
  const sequence = studentId.match(/(\d+)$/)?.[1];
  return sequence ? `Learner ${sequence}` : studentId;
}

function priorityExplanation(rationale: string) {
  const prevalence = rationale.match(/prevalence=[\d.]+ \((\d+)\/(\d+)\)/);
  const impact = rationale.match(/downstream_impact=([\d.]+)/);
  const urgency = rationale.match(/lesson_urgency=([\d.]+)/);
  if (!prevalence || !impact || !urgency) {
    return rationale;
  }
  return `${prevalence[1]} of ${prevalence[2]} learners · ${Math.round(
    Number(impact[1]) * 100,
  )}% prerequisite impact · ${Math.round(Number(urgency[1]) * 100)}% lesson urgency`;
}

function teacherWorkspaceErrorMessage(error: unknown): string {
  if (error instanceof TeacherRepositoryError) {
    if (error.kind === "configuration") {
      return "The teacher workspace API is not configured for this deployment.";
    }
    if (error.kind === "unavailable") {
      return "The teacher workspace API is unavailable. Check the connection and try again.";
    }
  }
  return "The teacher workspace data could not be loaded. Try again.";
}

function actionErrorMessage(error: unknown): string {
  if (error instanceof TeacherRepositoryError) {
    if (error.code === "stale_lesson_plan_version" || error.status === 409) {
      return "This plan changed in another session. Reload the latest version before continuing.";
    }
    if (error.kind === "unavailable") {
      return "The change could not reach the teacher API. Check the connection and try again.";
    }
    if (error.kind === "configuration") {
      return "This deployment is missing its teacher API configuration.";
    }
    if (error.kind === "response") {
      return error.message;
    }
  }
  return "The teacher decision could not be updated. Try again.";
}

function TeacherLoadingState() {
  return (
    <section className="teacher-loading" aria-live="polite" aria-busy="true">
      <p className="teacher-kicker">Loading teacher evidence</p>
      <div className="teacher-skeleton teacher-skeleton-title" />
      <div className="teacher-skeleton-grid" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </section>
  );
}

function TeacherErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <section className="teacher-state-card" role="alert">
      <img src="/brand/ailearn-mascot.webp" alt="" />
      <div>
        <p className="teacher-kicker">Workspace unavailable</p>
        <h1>We could not load this teacher view.</h1>
        <p>{message}</p>
        <button
          className="teacher-button teacher-button-primary"
          onClick={onRetry}
          type="button"
        >
          Try again
        </button>
      </div>
    </section>
  );
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
      if (rootCause) counts[rootCause] = (counts[rootCause] ?? 0) + 1;
      return counts;
    },
    {},
  );
  const confirmationCount =
    (readinessCounts.abstained ?? 0) + snapshot.unknown_student_ids.length;
  const totalLearners =
    snapshot.students.length + snapshot.unknown_student_ids.length;

  return (
    <section className="teacher-content" aria-labelledby="teacher-page-title">
      <div className="teacher-page-heading">
        <div>
          <p className="teacher-kicker">Class evidence · Grade 7 mathematics</p>
          <h1 id="teacher-page-title">
            Choose the next teaching move with evidence.
          </h1>
          <p className="teacher-lede">
            Review readiness, keep uncertainty visible, and group learners by
            the support they need now.
          </p>
        </div>
        <p className="teacher-context">
          <span>{snapshot.class_id}</span>
          <span>{snapshot.lesson_id}</span>
        </p>
      </div>

      <section className="teacher-summary" aria-label="Class readiness summary">
        <article>
          <span>Total learners</span>
          <strong>{totalLearners}</strong>
          <p>Included in this synthetic class demonstration.</p>
        </article>
        <article>
          <span>Ready</span>
          <strong>{readinessCounts.ready ?? 0}</strong>
          <p>Can move into independent transfer practice.</p>
        </article>
        <article>
          <span>Needs support</span>
          <strong>{readinessCounts.needs_support ?? 0}</strong>
          <p>Have a diagnosed prerequisite or target-skill gap.</p>
        </article>
        <article className="teacher-summary-attention">
          <span>Needs confirmation</span>
          <strong>{confirmationCount}</strong>
          <p>Remain unlabelled until enough evidence is available.</p>
        </article>
      </section>

      <div className="teacher-layout">
        <section
          className="teacher-panel teacher-priorities"
          aria-labelledby="priority-title"
        >
          <div className="teacher-panel-heading">
            <p className="teacher-kicker">Teaching priorities</p>
            <h2 id="priority-title">What needs attention first</h2>
          </div>
          {snapshot.teaching_priorities.length > 0 ? (
            <ol>
              {snapshot.teaching_priorities.map((priority) => (
                <li key={priority.skill_id}>
                  <span className="priority-rank">
                    {String(priority.rank).padStart(2, "0")}
                  </span>
                  <div>
                    <h3>{humanize(priority.skill_id)}</h3>
                    <p>{priorityExplanation(priority.rationale)}</p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="teacher-empty">
              No teaching priority can be ranked until more evidence arrives.
            </p>
          )}
          <div className="root-cause-distribution">
            <h3>Root-cause distribution</h3>
            {Object.keys(rootCauseCounts).length > 0 ? (
              <ul>
                {Object.entries(rootCauseCounts).map(([skillId, count]) => (
                  <li key={skillId}>
                    <span>{humanize(skillId)}</span>
                    <strong>{count}</strong>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="teacher-empty">No confirmed root cause yet.</p>
            )}
          </div>
        </section>

        <section
          className="teacher-panel teacher-confirmation"
          aria-labelledby="confirmation-title"
        >
          <p className="teacher-kicker">Evidence boundary</p>
          <h2 id="confirmation-title">Uncertainty stays visible.</h2>
          <p>
            {confirmationCount > 0
              ? `${confirmationCount} learners need confirmation before the system recommends targeted support.`
              : "Every learner currently has enough evidence for a provisional recommendation."}
          </p>
          {snapshot.unknown_student_ids.length > 0 && (
            <ul aria-label="Learners without enough evidence">
              {snapshot.unknown_student_ids.map((studentId) => (
                <li key={studentId}>{learnerLabel(studentId)}</li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section
        className="teacher-panel teacher-groups"
        aria-labelledby="groups-title"
      >
        <div className="teacher-panel-heading">
          <p className="teacher-kicker">Intervention groups</p>
          <h2 id="groups-title">
            Group by today’s learning need—not a fixed label.
          </h2>
        </div>
        {snapshot.groups.length > 0 ? (
          <div className="group-grid">
            {snapshot.groups.map((group) => (
              <article key={group.id}>
                <p className="group-count">
                  {group.student_ids.length} learners
                </p>
                <h3>{humanize(group.intervention_need)}</h3>
                <p>{group.rationale}</p>
                <details>
                  <summary>View learner list</summary>
                  <ul aria-label={`${group.id} students`}>
                    {group.student_ids.map((studentId) => (
                      <li key={studentId}>{learnerLabel(studentId)}</li>
                    ))}
                  </ul>
                </details>
              </article>
            ))}
          </div>
        ) : (
          <p className="teacher-empty">
            No intervention groups are available yet.
          </p>
        )}
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
  const [pendingAction, setPendingAction] = useState<PlanAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
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
  const busy = pendingAction !== null;
  const published = planVersion.published_at !== null;

  useEffect(() => {
    setSnapshot(planVersion.snapshot);
    setLessonPlan(planVersion.lesson_plan);
    setError(null);
  }, [planVersion]);

  async function saveVersion() {
    setPendingAction("save");
    setError(null);
    setFeedback(null);
    try {
      const next = await repository.createVersion(
        snapshot,
        lessonPlan,
        planVersion.version,
      );
      onVersionChange(next);
      setFeedback(`Teacher edit saved as version ${next.version}.`);
    } catch (caught) {
      setError(actionErrorMessage(caught));
    } finally {
      setPendingAction(null);
    }
  }

  async function decide(action: Exclude<PlanAction, "save">) {
    setPendingAction(action);
    setError(null);
    setFeedback(null);
    try {
      const next = await repository[action](
        planVersion.plan_id,
        planVersion.version,
      );
      onVersionChange(next);
      const messages = {
        approve: `Plan approved as version ${next.version}.`,
        reject: `Plan rejected as version ${next.version}; it remains editable.`,
        publish: `Plan published as version ${next.version}.`,
      };
      setFeedback(messages[action]);
    } catch (caught) {
      setError(actionErrorMessage(caught));
    } finally {
      setPendingAction(null);
    }
  }

  function moveStudent(
    studentId: string,
    fromGroupId: string,
    toGroupId: string,
  ) {
    if (fromGroupId === toGroupId) return;
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
    setError(null);
    setFeedback(null);
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
    setError(null);
    setFeedback(null);
  }

  return (
    <section className="teacher-content" aria-labelledby="teacher-page-title">
      <div className="teacher-page-heading">
        <div>
          <p className="teacher-kicker">Teacher-reviewed lesson plan</p>
          <h1 id="teacher-page-title">
            Shape a 45-minute path from evidence to action.
          </h1>
          <p className="teacher-lede">
            Adjust timing and temporary intervention groups, then approve the
            version you want to teach.
          </p>
        </div>
        <p className="teacher-context">
          <span>{lessonPlan.class_id}</span>
          <span>{lessonPlan.lesson_id}</span>
        </p>
      </div>

      <section className="lesson-plan-meta" aria-label="Lesson plan status">
        <div>
          <span>Plan status</span>
          <strong>{formatStatus(lessonPlan.status)}</strong>
        </div>
        <div>
          <span>Total time</span>
          <strong>{lessonPlan.total_duration_minutes} min</strong>
        </div>
        <div>
          <span>Version</span>
          <strong>{planVersion.version}</strong>
        </div>
        <div>
          <span>Teacher decision</span>
          <strong>
            {published ? "published" : formatStatus(planVersion.decision)}
          </strong>
        </div>
      </section>

      <section
        className="teacher-decision-panel"
        aria-labelledby="decision-title"
      >
        <div>
          <p className="teacher-kicker">Decision checkpoint</p>
          <h2 id="decision-title">
            {dirty
              ? "Save this edit before deciding."
              : "This version is ready for a teacher decision."}
          </h2>
          <p>
            {dirty
              ? "Your changes are local until a new immutable version is saved."
              : published
                ? "This approved version is published and preserved in the audit trail."
                : "Approval and publication create separate auditable versions."}
          </p>
        </div>
        <div className="teacher-actions">
          <button
            className="teacher-button teacher-button-primary"
            disabled={busy || !dirty || durationInvalid}
            onClick={() => void saveVersion()}
            type="button"
          >
            {pendingAction === "save" ? "Saving…" : "Save teacher edit"}
          </button>
          <button
            className="teacher-button teacher-button-primary"
            disabled={busy || dirty || planVersion.decision === "approved"}
            onClick={() => void decide("approve")}
            type="button"
          >
            {pendingAction === "approve" ? "Approving…" : "Approve plan"}
          </button>
          <button
            className="teacher-button teacher-button-secondary teacher-button-danger"
            disabled={
              busy || dirty || planVersion.decision === "rejected" || published
            }
            onClick={() => void decide("reject")}
            type="button"
          >
            {pendingAction === "reject" ? "Rejecting…" : "Reject draft"}
          </button>
          <button
            className="teacher-button teacher-button-secondary"
            disabled={
              busy || dirty || planVersion.decision !== "approved" || published
            }
            onClick={() => void decide("publish")}
            type="button"
          >
            {pendingAction === "publish" ? "Publishing…" : "Publish plan"}
          </button>
        </div>
        {durationInvalid && (
          <p className="teacher-inline-error" role="alert">
            Each activity needs a whole number of minutes and the plan total
            must be between 1 and 45 minutes.
          </p>
        )}
        {error && (
          <p className="teacher-inline-error" role="alert">
            {error}
          </p>
        )}
        {feedback && (
          <p className="teacher-success" role="status">
            {feedback}
          </p>
        )}
      </section>

      <section aria-labelledby="activities-title">
        <div className="teacher-section-heading">
          <div>
            <p className="teacher-kicker">Teaching sequence</p>
            <h2 id="activities-title">Four evidence-led activities</h2>
          </div>
          <p>Change minutes directly. The total updates automatically.</p>
        </div>
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
                      className="teacher-duration-label"
                      htmlFor={`duration-${activity.id}`}
                    >
                      Minutes
                      <input
                        id={`duration-${activity.id}`}
                        aria-label={`${activity.title} duration`}
                        inputMode="numeric"
                        min="1"
                        max="45"
                        type="number"
                        value={activity.duration_minutes}
                        onChange={(event) =>
                          updateDuration(
                            activity.id,
                            Number(event.target.value),
                          )
                        }
                      />
                    </label>
                    <h3>{activity.title}</h3>
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

      <section
        className="teacher-panel teacher-group-editor"
        aria-labelledby="group-editor-title"
      >
        <div className="teacher-panel-heading">
          <p className="teacher-kicker">Teacher edit</p>
          <h2 id="group-editor-title">Adjust temporary intervention groups</h2>
          <p>
            Move learners when classroom knowledge adds context. A group’s final
            learner stays in place so every diagnosed learner remains assigned.
          </p>
        </div>
        {snapshot.groups.map((group) => (
          <details key={group.id}>
            <summary>
              <span>{humanize(group.intervention_need)}</span>
              <small>{group.student_ids.length} learners</small>
            </summary>
            <div className="teacher-group-list">
              {group.student_ids.map((studentId) => (
                <label key={studentId}>
                  <span>
                    <strong>{learnerLabel(studentId)}</strong>
                    <small>{studentId}</small>
                  </span>
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
          </details>
        ))}
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
  const [requestKey, setRequestKey] = useState(0);

  useEffect(() => {
    let active = true;
    setWorkspace({ kind: "loading", view });
    const request =
      view === "overview"
        ? repository.getClassSnapshot()
        : repository.getLessonPlan();
    void request.then(
      (payload) => {
        if (!active) return;
        if (view === "overview") {
          setWorkspace({
            kind: "ready",
            view,
            snapshot: payload as ClassSnapshotV1,
          });
        } else {
          setWorkspace({
            kind: "ready",
            view,
            planVersion: payload as TeacherPlanVersionV1,
          });
        }
      },
      (error) => {
        if (active)
          setWorkspace({
            kind: "error",
            view,
            message: teacherWorkspaceErrorMessage(error),
          });
      },
    );
    return () => {
      active = false;
    };
  }, [repository, requestKey, view]);

  const currentRoute: TeacherRoute =
    view === "overview" ? "/teacher" : "/teacher/lesson-plan";
  const isCurrentView = workspace.view === view;

  return (
    <TeacherShell currentRoute={currentRoute} onNavigate={onNavigate}>
      {(!isCurrentView || workspace.kind === "loading") && (
        <TeacherLoadingState />
      )}
      {isCurrentView && workspace.kind === "error" && (
        <TeacherErrorState
          message={workspace.message}
          onRetry={() => setRequestKey((key) => key + 1)}
        />
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
    </TeacherShell>
  );
}
