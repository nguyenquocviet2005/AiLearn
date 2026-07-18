import { useEffect, useState } from "react";

import type { ClassSnapshotV1, TeacherPlanVersionV1 } from "@ailearn/schemas";

import {
  httpTeacherWorkspaceRepository,
  TeacherRepositoryError,
} from "@/lib/adapters/teacher-repository";
import type { TeacherWorkspaceRepository } from "@/lib/adapters/teacher-workspace-repository";
import { WorkflowStrip } from "./product/TeacherProductWorkspace";
import { TeacherShell, type TeacherRoute } from "./TeacherShell";
import {
  interventionNeedLabel,
  learnerLabel,
  planStatusLabel,
  priorityExplanation,
  priorityMetrics,
  skillLabel,
  teacherFacingText,
} from "./teacher-copy";

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

function teacherWorkspaceErrorMessage(error: unknown): string {
  if (error instanceof TeacherRepositoryError) {
    if (error.kind === "configuration") {
      return "API không gian giáo viên chưa được cấu hình cho bản triển khai này.";
    }
    if (error.kind === "unavailable") {
      return "API không gian giáo viên đang không khả dụng. Hãy kiểm tra kết nối và thử lại.";
    }
  }
  return "Không thể tải dữ liệu không gian giáo viên. Vui lòng thử lại.";
}

function actionErrorMessage(error: unknown): string {
  if (error instanceof TeacherRepositoryError) {
    if (error.code === "stale_lesson_plan_version" || error.status === 409) {
      return "Kế hoạch đã thay đổi trong một phiên khác. Hãy tải phiên bản mới nhất trước khi tiếp tục.";
    }
    if (error.kind === "unavailable") {
      return "Không thể gửi thay đổi tới API giáo viên. Hãy kiểm tra kết nối và thử lại.";
    }
    if (error.kind === "configuration") {
      return "Bản triển khai này đang thiếu cấu hình API giáo viên.";
    }
    if (error.kind === "response") {
      if (error.status === 422) {
        return "Thay đổi chưa hợp lệ với cấu trúc kế hoạch hiện tại. Hãy kiểm tra lại nhóm và thời lượng.";
      }
      return "API đã từ chối thay đổi. Vui lòng tải lại phiên bản mới nhất và thử lại.";
    }
  }
  return "Không thể cập nhật quyết định của giáo viên. Vui lòng thử lại.";
}

function TeacherLoadingState() {
  return (
    <section className="teacher-loading" aria-live="polite" aria-busy="true">
      <p className="teacher-kicker">Đang tải bằng chứng của lớp</p>
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
        <p className="teacher-kicker">Không gian tạm thời gián đoạn</p>
        <h1>Không thể tải màn hình giáo viên.</h1>
        <p>{message}</p>
        <button
          className="teacher-button teacher-button-primary"
          onClick={onRetry}
          type="button"
        >
          Thử lại
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
  const misconceptionPriority = snapshot.teaching_priorities.find(
    (priority) => priority.skill_id === "skill_distinguish_direct_inverse",
  );
  const foundationPriority = snapshot.teaching_priorities.find(
    (priority) => priority.skill_id === "skill_ratio_proportion_basics",
  );
  const misconceptionMetrics = misconceptionPriority
    ? priorityMetrics(misconceptionPriority.rationale)
    : null;
  const foundationMetrics = foundationPriority
    ? priorityMetrics(foundationPriority.rationale)
    : null;

  return (
    <section className="teacher-content" aria-labelledby="teacher-page-title">
      <div className="teacher-page-heading">
        <div>
          <p className="teacher-kicker">Bằng chứng lớp học · Toán 7</p>
          <h1 id="teacher-page-title">
            Chọn bước dạy tiếp theo bằng bằng chứng.
          </h1>
          <p className="teacher-lede">
            Xem mức sẵn sàng, giữ rõ phần chưa chắc chắn và chia nhóm theo đúng
            hỗ trợ học sinh cần trong tiết học này.
          </p>
        </div>
        <p className="teacher-context">
          <span>Lớp: Lớp 7A</span>
          <span>Bài học: Đại lượng tỉ lệ nghịch</span>
        </p>
      </div>

      <section
        className="teacher-summary"
        aria-label="Tóm tắt mức sẵn sàng của lớp"
      >
        <article>
          <span>Tổng số học sinh</span>
          <strong>{totalLearners}</strong>
          <p>Dữ liệu tổng hợp của lớp học mô phỏng.</p>
        </article>
        <article>
          <span>Đã sẵn sàng</span>
          <strong>{readinessCounts.ready ?? 0}</strong>
          <p>Có thể chuyển sang bài vận dụng độc lập.</p>
        </article>
        <article>
          <span>Cần hỗ trợ</span>
          <strong>{readinessCounts.needs_support ?? 0}</strong>
          <p>Đã xác định khoảng hổng tiên quyết hoặc kỹ năng mục tiêu.</p>
        </article>
        <article className="teacher-summary-attention">
          <span>Cần xác nhận</span>
          <strong>{confirmationCount}</strong>
          <p>Chưa gắn nhãn can thiệp khi bằng chứng chưa đủ.</p>
        </article>
      </section>

      <section
        className="teacher-showcases"
        aria-label="Hai ca điển hình của động cơ phân nhóm"
      >
        <article>
          <p className="teacher-kicker">Ca điển hình 01 · Sai lầm phổ biến</p>
          <h2>Nhầm tỉ lệ thuận và tỉ lệ nghịch</h2>
          <strong>{misconceptionMetrics?.affected ?? 0} học sinh</strong>
          <p>
            Đây là khoảng hổng có độ phổ biến cao nhất. Động cơ giữ nhóm này
            riêng để giáo viên sửa mô hình “tăng–giảm” trước khi giải bài toán
            năng suất.
          </p>
          <span>Ưu tiên số {misconceptionPriority?.rank ?? "—"}</span>
        </article>
        <article>
          <p className="teacher-kicker">Ca điển hình 02 · Khoảng hổng gốc</p>
          <h2>Tỉ số và tỉ lệ thức</h2>
          <strong>{foundationMetrics?.affected ?? 0} học sinh</strong>
          <p>
            Dù ít học sinh hơn, kỹ năng này ảnh hưởng tới khoảng{" "}
            {foundationMetrics?.impactPercent ?? 0}% chuỗi tiên quyết nên được
            xếp trước để tránh sửa phần ngọn.
          </p>
          <span>Ưu tiên số {foundationPriority?.rank ?? "—"}</span>
        </article>
      </section>

      <div className="teacher-layout">
        <section
          className="teacher-panel teacher-priorities"
          aria-labelledby="priority-title"
        >
          <div className="teacher-panel-heading">
            <p className="teacher-kicker">Ưu tiên giảng dạy</p>
            <h2 id="priority-title">Nội dung cần chú ý trước</h2>
          </div>
          {snapshot.teaching_priorities.length > 0 ? (
            <ol>
              {snapshot.teaching_priorities.map((priority) => (
                <li key={priority.skill_id}>
                  <span className="priority-rank">
                    {String(priority.rank).padStart(2, "0")}
                  </span>
                  <div>
                    <h3>{skillLabel(priority.skill_id)}</h3>
                    <p>{priorityExplanation(priority.rationale)}</p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="teacher-empty">
              Chưa thể xếp ưu tiên cho tới khi có thêm bằng chứng.
            </p>
          )}
          <div className="root-cause-distribution">
            <h3>Phân bố nguyên nhân gốc</h3>
            {Object.keys(rootCauseCounts).length > 0 ? (
              <ul>
                {Object.entries(rootCauseCounts).map(([skillId, count]) => (
                  <li key={skillId}>
                    <span>{skillLabel(skillId)}</span>
                    <strong>{count}</strong>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="teacher-empty">
                Chưa có nguyên nhân gốc được xác nhận.
              </p>
            )}
          </div>
        </section>

        <section
          className="teacher-panel teacher-confirmation"
          aria-labelledby="confirmation-title"
        >
          <p className="teacher-kicker">Ranh giới bằng chứng</p>
          <h2 id="confirmation-title">Không che giấu phần chưa chắc chắn.</h2>
          <p>
            {confirmationCount > 0
              ? `${confirmationCount} học sinh cần được xác nhận trước khi hệ thống đề xuất hỗ trợ có mục tiêu.`
              : "Tất cả học sinh hiện đã có đủ bằng chứng cho đề xuất ban đầu."}
          </p>
          {snapshot.unknown_student_ids.length > 0 && (
            <ul aria-label="Học sinh chưa có đủ bằng chứng">
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
          <p className="teacher-kicker">Nhóm can thiệp</p>
          <h2 id="groups-title">
            Chia theo nhu cầu hôm nay, không gắn nhãn cố định.
          </h2>
        </div>
        {snapshot.groups.length > 0 ? (
          <div className="group-grid">
            {snapshot.groups.map((group) => (
              <article key={group.id}>
                <p className="group-count">
                  {group.student_ids.length} học sinh
                </p>
                <h3>{interventionNeedLabel(group.intervention_need)}</h3>
                <p>{teacherFacingText(group.rationale)}</p>
                <details>
                  <summary>Xem danh sách học sinh</summary>
                  <ul
                    aria-label={`Học sinh trong nhóm ${interventionNeedLabel(group.intervention_need)}`}
                  >
                    {group.student_ids.map((studentId) => (
                      <li key={studentId}>{learnerLabel(studentId)}</li>
                    ))}
                  </ul>
                </details>
              </article>
            ))}
          </div>
        ) : (
          <p className="teacher-empty">Chưa có nhóm can thiệp phù hợp.</p>
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
      setFeedback(
        `Đã lưu chỉnh sửa của giáo viên thành phiên bản ${next.version}.`,
      );
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
        approve: `Đã phê duyệt kế hoạch ở phiên bản ${next.version}.`,
        reject: `Đã từ chối kế hoạch ở phiên bản ${next.version}; vẫn có thể tiếp tục chỉnh sửa.`,
        publish: `Đã xuất bản kế hoạch ở phiên bản ${next.version}.`,
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
          <p className="teacher-kicker">
            Kế hoạch bài dạy do giáo viên rà soát
          </p>
          <h1 id="teacher-page-title">
            Biến bằng chứng thành lộ trình dạy học 45 phút.
          </h1>
          <p className="teacher-lede">
            Điều chỉnh thời lượng và nhóm can thiệp tạm thời, sau đó phê duyệt
            phiên bản giáo viên muốn sử dụng.
          </p>
        </div>
        <p className="teacher-context">
          <span>Lớp: Lớp 7A</span>
          <span>Bài học: Đại lượng tỉ lệ nghịch</span>
        </p>
      </div>

      <section
        className="lesson-plan-meta"
        aria-label="Trạng thái kế hoạch bài dạy"
      >
        <div>
          <span>Trạng thái</span>
          <strong>{planStatusLabel(lessonPlan.status)}</strong>
        </div>
        <div>
          <span>Tổng thời lượng</span>
          <strong>{lessonPlan.total_duration_minutes} phút</strong>
        </div>
        <div>
          <span>Phiên bản</span>
          <strong>{planVersion.version}</strong>
        </div>
        <div>
          <span>Quyết định giáo viên</span>
          <strong>
            {planStatusLabel(published ? "published" : planVersion.decision)}
          </strong>
        </div>
      </section>

      <section
        className="teacher-decision-panel"
        aria-labelledby="decision-title"
      >
        <div>
          <p className="teacher-kicker">Điểm kiểm tra quyết định</p>
          <h2 id="decision-title">
            {dirty
              ? "Hãy lưu chỉnh sửa trước khi quyết định."
              : "Phiên bản này đã sẵn sàng để giáo viên quyết định."}
          </h2>
          <p>
            {dirty
              ? "Các thay đổi chỉ ở máy hiện tại cho tới khi một phiên bản bất biến mới được lưu."
              : published
                ? "Phiên bản đã phê duyệt được xuất bản và lưu trong lịch sử kiểm tra."
                : "Phê duyệt và xuất bản tạo thành các phiên bản có thể kiểm tra riêng biệt."}
          </p>
        </div>
        <div className="teacher-actions">
          <button
            className="teacher-button teacher-button-primary"
            disabled={busy || !dirty || durationInvalid}
            onClick={() => void saveVersion()}
            type="button"
          >
            {pendingAction === "save" ? "Đang lưu…" : "Lưu chỉnh sửa"}
          </button>
          <button
            className="teacher-button teacher-button-primary"
            disabled={busy || dirty || planVersion.decision === "approved"}
            onClick={() => void decide("approve")}
            type="button"
          >
            {pendingAction === "approve"
              ? "Đang phê duyệt…"
              : "Phê duyệt kế hoạch"}
          </button>
          <button
            className="teacher-button teacher-button-secondary teacher-button-danger"
            disabled={
              busy || dirty || planVersion.decision === "rejected" || published
            }
            onClick={() => void decide("reject")}
            type="button"
          >
            {pendingAction === "reject" ? "Đang từ chối…" : "Từ chối bản nháp"}
          </button>
          <button
            className="teacher-button teacher-button-secondary"
            disabled={
              busy || dirty || planVersion.decision !== "approved" || published
            }
            onClick={() => void decide("publish")}
            type="button"
          >
            {pendingAction === "publish"
              ? "Đang xuất bản…"
              : "Xuất bản kế hoạch"}
          </button>
        </div>
        {durationInvalid && (
          <p className="teacher-inline-error" role="alert">
            Mỗi hoạt động cần số phút nguyên và tổng thời lượng kế hoạch phải từ
            1 đến 45 phút.
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
            <p className="teacher-kicker">Tiến trình dạy học</p>
            <h2 id="activities-title">Bốn hoạt động dựa trên bằng chứng</h2>
          </div>
          <p>Thay đổi số phút trực tiếp; tổng thời lượng sẽ tự cập nhật.</p>
        </div>
        <ol
          className="lesson-timeline"
          aria-label="Các hoạt động trong bài dạy"
        >
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
                      Phút
                      <input
                        id={`duration-${activity.id}`}
                        aria-label={`Thời lượng ${activity.title}`}
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
                  <span>{skillLabel(activity.skill_id)}</span>
                </div>
                <p>{teacherFacingText(activity.rationale)}</p>
                <div className="activity-evidence">
                  <strong>Bằng chứng mong đợi</strong>
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
          <p className="teacher-kicker">Giáo viên điều chỉnh</p>
          <h2 id="group-editor-title">Điều chỉnh nhóm can thiệp tạm thời</h2>
          <p>
            Chuyển học sinh khi quan sát trên lớp bổ sung thêm bối cảnh. Học
            sinh cuối cùng của mỗi nhóm được giữ lại để không ai bị mất phân
            nhóm.
          </p>
        </div>
        {snapshot.groups.map((group) => (
          <details key={group.id}>
            <summary>
              <span>{interventionNeedLabel(group.intervention_need)}</span>
              <small>{group.student_ids.length} học sinh</small>
            </summary>
            <div className="teacher-group-list">
              {group.student_ids.map((studentId) => (
                <label key={studentId}>
                  <span>
                    <strong>{learnerLabel(studentId)}</strong>
                    <small>Mã: {studentId}</small>
                  </span>
                  <select
                    aria-label={`Chuyển ${learnerLabel(studentId)}`}
                    disabled={group.student_ids.length === 1}
                    value={group.id}
                    onChange={(event) =>
                      moveStudent(studentId, group.id, event.target.value)
                    }
                  >
                    {snapshot.groups.map((target) => (
                      <option key={target.id} value={target.id}>
                        {interventionNeedLabel(target.intervention_need)}
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
    <TeacherShell
      connectionStatus={
        workspace.kind === "loading"
          ? "loading"
          : workspace.kind === "error"
            ? "error"
            : "connected"
      }
      currentRoute={currentRoute}
      onNavigate={onNavigate}
    >
      <div className="teacher-product teacher-product-embedded-flow">
        <WorkflowStrip current={currentRoute} onNavigate={onNavigate} />
      </div>
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
