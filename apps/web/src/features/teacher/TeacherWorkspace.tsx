import { useEffect, useState } from "react";

import type { ClassSnapshotV1, TeacherPlanVersionV1 } from "@ailearn/schemas";

import {
  httpTeacherWorkspaceRepository,
  TeacherRepositoryError,
} from "@/lib/adapters/teacher-repository";
import type { TeacherWorkspaceRepository } from "@/lib/adapters/teacher-workspace-repository";

import { TeacherShell, type TeacherRoute } from "./TeacherShell";

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
  onNavigate: (path: TeacherRoute) => void;
  repository?: TeacherWorkspaceRepository;
};

function humanize(value: string) {
  return value.replace(/^skill_/, "").replaceAll("_", " ");
}

function formatStatus(value: string) {
  const labels: Record<string, string> = {
    approved: "Đã duyệt",
    draft: "Bản nháp",
    pending: "Chờ duyệt",
    published: "Đã xuất bản",
    rejected: "Cần chỉnh sửa",
  };
  return labels[value] ?? value.replaceAll("_", " ");
}

function teacherWorkspaceErrorMessage(error: unknown): string {
  if (error instanceof TeacherRepositoryError) {
    if (error.kind === "configuration") {
      return "Không gian giáo viên chưa được cấu hình cho bản triển khai này.";
    }
    if (error.kind === "unavailable") {
      return "Không thể kết nối dữ liệu lớp học. Vui lòng thử lại sau.";
    }
  }
  return "Không thể tải dữ liệu không gian giáo viên.";
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
          <p className="eyebrow">Tổng quan bằng chứng</p>
          <h1 id="teacher-page-title">
            Bắt đầu kế hoạch dạy học từ bằng chứng.
          </h1>
          <p className="teacher-page-intro">
            Nhìn nhanh mức độ sẵn sàng, khoảng trống kiến thức và nhóm cần ưu
            tiên trước tiết học tiếp theo.
          </p>
        </div>
        <div className="teacher-context">
          <span>Lớp đang xem</span>
          <strong>Toán 7A</strong>
          <small>{snapshot.lesson_id}</small>
        </div>
      </div>

      <section className="teacher-summary" aria-label="Class readiness summary">
        <article className="summary-ready">
          <div className="teacher-summary-label">
            <span>Sẵn sàng</span>
            <i aria-hidden="true">✓</i>
          </div>
          <strong>{readinessCounts.ready ?? 0}</strong>
          <p>Có thể chuyển sang luyện tập vận dụng.</p>
        </article>
        <article className="summary-support">
          <div className="teacher-summary-label">
            <span>Cần hỗ trợ</span>
            <i aria-hidden="true">↗</i>
          </div>
          <strong>{readinessCounts.needs_support ?? 0}</strong>
          <p>Đã có lộ trình can thiệp phù hợp.</p>
        </article>
        <article className="summary-confirm">
          <div className="teacher-summary-label">
            <span>Cần xác nhận</span>
            <i aria-hidden="true">?</i>
          </div>
          <strong>
            {(readinessCounts.abstained ?? 0) +
              snapshot.unknown_student_ids.length}
          </strong>
          <p>Tạm tách riêng cho đến khi có thêm bằng chứng.</p>
        </article>
      </section>

      <div className="teacher-layout">
        <section
          className="teacher-panel teacher-priorities"
          aria-labelledby="priority-title"
        >
          <div className="teacher-panel-heading">
            <div>
              <p className="eyebrow">Ưu tiên giảng dạy</p>
              <h2 id="priority-title">Nội dung cần chú ý trước</h2>
            </div>
            <span className="teacher-panel-count">
              {snapshot.teaching_priorities.length} ưu tiên
            </span>
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
            <h3>Phân bố nguyên nhân gốc</h3>
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
          <span className="teacher-boundary-icon" aria-hidden="true">
            ?
          </span>
          <p className="eyebrow">Ranh giới bằng chứng</p>
          <h2 id="confirmation-title">Luôn hiển thị điều chưa chắc chắn</h2>
          <p>
            {snapshot.unknown_student_ids.length} học sinh chưa được phân loại
            vì dữ liệu hiện tại chưa đủ bằng chứng.
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
          <div>
            <p className="eyebrow">Nhóm can thiệp</p>
            <h2 id="groups-title">Nhóm theo hỗ trợ mỗi em thực sự cần</h2>
          </div>
          <span className="teacher-panel-count">
            {snapshot.groups.length} nhóm
          </span>
        </div>
        <div className="group-grid">
          {snapshot.groups.map((group) => (
            <article key={group.id}>
              <p className="group-count">{group.student_ids.length} học sinh</p>
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
          <p className="eyebrow">Kế hoạch bài dạy</p>
          <h1 id="teacher-page-title">45 phút từ bằng chứng đến hành động.</h1>
          <p className="teacher-page-intro">
            Điều chỉnh thời lượng và nhóm học sinh trước khi duyệt kế hoạch. Mọi
            thay đổi đều được lưu thành một phiên bản mới.
          </p>
        </div>
        <div className="teacher-context">
          <span>Bài học</span>
          <strong>Toán 7A</strong>
          <small>{lessonPlan.lesson_id}</small>
        </div>
      </div>

      <section className="lesson-plan-meta" aria-label="Lesson plan status">
        <div>
          <span>Trạng thái</span>
          <strong>{formatStatus(lessonPlan.status)}</strong>
        </div>
        <div>
          <span>Tổng thời lượng</span>
          <strong>{lessonPlan.total_duration_minutes} phút</strong>
        </div>
        <p>
          <span>Phiên bản hiện tại</span>
          <strong>V{planVersion.version}</strong>
          {formatStatus(planVersion.decision)}
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
                    Số phút
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
                <strong>Bằng chứng mong đợi</strong>
                <span>{activity.expected_evidence}</span>
              </div>
            </article>
          </li>
        ))}
      </ol>

      <section className="teacher-panel" aria-labelledby="group-editor-title">
        <div className="teacher-panel-heading">
          <div>
            <p className="eyebrow">Giáo viên điều chỉnh</p>
            <h2 id="group-editor-title">Điều chỉnh nhóm can thiệp</h2>
          </div>
          <span className="teacher-panel-count">Kéo theo bằng chứng</span>
        </div>
        <div className="teacher-group-editor">
          {snapshot.groups.map((group) => (
            <div key={group.id}>
              <h3>{humanize(group.intervention_need)}</h3>
              {group.student_ids.map((studentId) => (
                <label key={studentId}>
                  <span>{studentId}</span>
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
        </div>
      </section>

      <section
        className="teacher-action-bar"
        aria-label="Teacher approval controls"
      >
        <div>
          <strong>
            {dirty ? "Có thay đổi chưa lưu" : "Kế hoạch đã đồng bộ"}
          </strong>
          <span>Giáo viên là người phê duyệt cuối cùng.</span>
        </div>
        <button
          className="teacher-button secondary"
          disabled={saving || durationInvalid}
          onClick={() => void saveVersion()}
          type="button"
        >
          <span aria-hidden="true">↓</span>
          Lưu chỉnh sửa
        </button>
        <button
          className="teacher-button primary"
          disabled={saving || dirty}
          onClick={() => void decide("approve")}
          type="button"
        >
          <span aria-hidden="true">✓</span>
          Duyệt kế hoạch
        </button>
        <button
          className="teacher-button quiet"
          disabled={saving || dirty}
          onClick={() => void decide("reject")}
          type="button"
        >
          Yêu cầu sửa
        </button>
        <button
          className="teacher-button primary"
          disabled={saving || dirty || planVersion.decision !== "approved"}
          onClick={() => void decide("publish")}
          type="button"
        >
          Xuất bản
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
    <TeacherShell
      current={view === "overview" ? "overview" : "lesson-plan"}
      onNavigate={onNavigate}
    >
      {(!isCurrentView || workspace.kind === "loading") && (
        <div className="teacher-state" aria-live="polite">
          <span className="teacher-state-spinner" aria-hidden="true" />
          <div>
            <strong>Đang chuẩn bị không gian giáo viên</strong>
            <p>AiLearn đang tổng hợp bằng chứng mới nhất của lớp.</p>
          </div>
        </div>
      )}

      {isCurrentView && workspace.kind === "error" && (
        <div className="teacher-state error" role="alert">
          <span className="teacher-state-symbol" aria-hidden="true">
            !
          </span>
          <div>
            <strong>Chưa thể tải dữ liệu</strong>
            <p>{workspace.message}</p>
          </div>
        </div>
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
