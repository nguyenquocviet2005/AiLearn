import { useEffect, useMemo, useRef, useState } from "react";

import {
  httpTeacherWorkspaceRepository,
  TeacherRepositoryError,
} from "@/lib/adapters/teacher-repository";
import type { TeacherWorkspaceRepository } from "@/lib/adapters/teacher-workspace-repository";
import { TeacherShell, type TeacherRoute } from "../TeacherShell";
import { teacherFacingText } from "../teacher-copy";
import {
  buildTeacherDemoModel,
  TeacherDemoValidationError,
  teacherSkillLabel,
  type DemoEvidenceEvent,
  type TeacherDemoModel,
  type TeacherStudentRow,
} from "./teacher-demo-model";
import {
  GRADE7_MATH_KNTT_CHAPTERS,
  GRADE7_MATH_KNTT_LESSON_TOTAL,
  GRADE7_MATH_KNTT_SOURCE,
  getCurrentGrade7MathKnttLesson,
} from "./grade7-math-kntt-syllabus";
import "./teacher-product.css";

type ProductRoute = Exclude<
  TeacherRoute,
  "/teacher/lesson-plan" | "/teacher/report"
>;
type ProductState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | {
      kind: "partial";
      snapshot: Awaited<
        ReturnType<TeacherWorkspaceRepository["getClassSnapshot"]>
      >;
      message: string;
    }
  | { kind: "ready"; model: TeacherDemoModel };

type DemoProgress = {
  teachingStarted: boolean;
  lessonCompleted: boolean;
  selectedStudentId: string | null;
  notes: Record<string, string>;
  assignedInterventions: string[];
  requestedEvidence: string[];
  groupOverrides: Record<string, string>;
  overrideReasons: Record<string, string>;
  diagnosisOverrides: Record<string, { rootCause: string; reason: string }>;
  attachedResources: string[];
  preparationSaved: boolean;
  preparation: {
    objective: string;
    duration: string;
    strategy: string;
    note: string;
  };
  teachingObservations: Array<{
    text: string;
    phase: number;
    groupId: string | null;
    recordedAt: string;
    syncState: "pending";
  }>;
};

const initialPreparation = {
  objective:
    "Học sinh nhận biết, lập và vận dụng được mối quan hệ tỉ lệ nghịch trong tình huống thực tế.",
  duration: "45",
  strategy: "stations",
  note: "",
};

const initialProgress: DemoProgress = {
  teachingStarted: false,
  lessonCompleted: false,
  selectedStudentId: null,
  notes: {},
  assignedInterventions: [],
  requestedEvidence: [],
  groupOverrides: {},
  overrideReasons: {},
  diagnosisOverrides: {},
  attachedResources: [],
  preparationSaved: false,
  preparation: initialPreparation,
  teachingObservations: [],
};

function applyTeacherDecisions(
  model: TeacherDemoModel,
  progress: DemoProgress,
): TeacherDemoModel {
  const effectiveStudents = model.students.map((student) => {
    const diagnosis = progress.diagnosisOverrides[student.id];
    return {
      ...student,
      groupId: progress.groupOverrides[student.id] ?? student.groupId,
      rootCause: diagnosis?.rootCause ?? student.rootCause,
    };
  });
  const effectiveGroups = model.groups.map((group) => ({
    ...group,
    student_ids: effectiveStudents
      .filter((student) => student.groupId === group.id)
      .map((student) => student.id),
  }));
  return { ...model, students: effectiveStudents, groups: effectiveGroups };
}

const routeMeta: Record<
  ProductRoute,
  { eyebrow: string; title: string; description: string }
> = {
  "/teacher": {
    eyebrow: "Hôm nay · Thứ Hai, 20 tháng 7",
    title: "Chào buổi sáng, cô Hà.",
    description:
      "Những việc quan trọng nhất để lớp 7A sẵn sàng cho tiết Toán tiếp theo.",
  },
  "/teacher/analytics": {
    eyebrow: "Toàn cảnh lớp · Toán 7",
    title: "Nhìn nhanh lớp 7A trước khi vào tiết.",
    description:
      "Xem mức sẵn sàng, khoảng hổng và vị trí bài học trong tiến trình Toán 7.",
  },
  "/teacher/classes": {
    eyebrow: "Lớp học · Toán 7",
    title: "Một nơi để theo dõi cả lớp và từng bài học.",
    description:
      "Chọn lớp, xem tiến độ thu thập minh chứng và mở đúng công việc cần chuẩn bị.",
  },
  "/teacher/prepare": {
    eyebrow: "Chuẩn bị bài · Tiết 2",
    title: "Chuẩn bị bài dạy từ mục tiêu đến minh chứng.",
    description:
      "AiLearn đối chiếu mục tiêu, kỹ năng tiền đề và dữ liệu gần nhất trước khi đề xuất cách dạy.",
  },
  "/teacher/insights": {
    eyebrow: "Phân tích lớp · Cập nhật 2 phút trước",
    title: "Hiểu nguyên nhân trước khi chọn cách dạy.",
    description:
      "Đi từ bằng chứng của từng em đến nhóm học tập và ưu tiên giảng dạy có thể giải thích.",
  },
  "/teacher/students": {
    eyebrow: "Học sinh · Hồ sơ học tập",
    title: "Không để số liệu trung bình che mất một học sinh.",
    description:
      "Tìm kiếm, lọc và mở minh chứng đứng sau mỗi kết luận chẩn đoán.",
  },
  "/teacher/teaching": {
    eyebrow: "Chế độ giảng dạy · Tiết 45 phút",
    title: "Tập trung vào lớp học, không phải bảng điều khiển.",
    description:
      "Theo dõi từng pha, chuyển nhanh giữa các nhóm và ghi nhận quan sát ngay trong tiết học.",
  },
  "/teacher/after-class": {
    eyebrow: "Sau giờ học · Đánh giá kết quả",
    title: "Khép vòng lặp bằng minh chứng sau tiết học.",
    description:
      "So sánh trước và sau, xác định em cần củng cố và chuẩn bị hành động cho bài tiếp theo.",
  },
  "/teacher/interventions": {
    eyebrow: "Can thiệp · Theo dõi tiến trình",
    title: "Củng cố đến khi học sinh thực sự vận dụng được.",
    description:
      "Không đánh dấu hoàn thành chỉ vì một câu trả lời đúng khi có hướng dẫn.",
  },
  "/teacher/resources": {
    eyebrow: "Học liệu · Giáo viên duyệt trước",
    title: "Học liệu theo nhu cầu của lớp.",
    description:
      "Xem trước và gắn học liệu đã được giáo viên duyệt vào kế hoạch trước khi sử dụng trên lớp.",
  },
};

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function useModalFocus<T extends HTMLElement>(
  open: boolean,
  onClose: () => void,
) {
  const ref = useRef<T>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    if (!open || !ref.current) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const modal = ref.current;
    const focusable = () =>
      Array.from(
        modal.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [href], [tabindex]:not([tabindex="-1"])',
        ),
      );
    focusable()[0]?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const elements = focusable();
      const first = elements[0];
      const last = elements.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [open]);
  return ref;
}

function readinessLabel(readiness: TeacherStudentRow["readiness"]) {
  if (readiness === "ready") return "Sẵn sàng";
  if (readiness === "needs_support") return "Cần hỗ trợ";
  return "Chưa đủ minh chứng";
}

function PageHeading({
  route,
  model,
}: {
  route: ProductRoute;
  model: TeacherDemoModel;
}) {
  const meta = routeMeta[route];
  return (
    <header className="product-heading">
      <div>
        <p className="teacher-kicker">{meta.eyebrow}</p>
        <h1>{meta.title}</h1>
        <p>{meta.description}</p>
      </div>
      <div className="product-context" aria-label="Ngữ cảnh lớp học">
        <div>
          <span>Lớp đang chọn</span>
          <strong>
            {model.className} · {model.metrics.total} học sinh
          </strong>
        </div>
        <div>
          <span>Bài học</span>
          <strong>{model.lessonName}</strong>
        </div>
      </div>
    </header>
  );
}

export function WorkflowStrip({
  current,
  onNavigate,
}: {
  current: TeacherRoute;
  onNavigate: (route: TeacherRoute) => void;
}) {
  const steps = [
    ["/teacher", "Hôm nay"],
    ["/teacher/analytics", "Phân tích"],
    ["/teacher/classes", "Lớp học"],
    ["/teacher/prepare", "Chuẩn bị"],
    ["/teacher/insights", "Hiểu lớp"],
    ["/teacher/students", "Học sinh"],
    ["/teacher/lesson-plan", "Chốt kế hoạch"],
    ["/teacher/teaching", "Giảng dạy"],
    ["/teacher/after-class", "Sau giờ học"],
    ["/teacher/interventions", "Can thiệp"],
    ["/teacher/resources", "Học liệu"],
    ["/teacher/report", "Báo cáo"],
  ] as const;
  const currentIndex = Math.max(
    0,
    steps.findIndex(([path]) => path === current),
  );
  return (
    <ol className="workflow-strip" aria-label="Tiến trình bài dạy">
      {steps.map(([path, label], index) => (
        <li
          className={`${index <= currentIndex ? "is-reached" : ""} ${path === current ? "is-current" : ""}`}
          key={path}
        >
          <button onClick={() => onNavigate(path)} type="button">
            <span>{index + 1}</span>
            {label}
          </button>
        </li>
      ))}
    </ol>
  );
}

function TodayPage({
  model,
  navigate,
}: {
  model: TeacherDemoModel;
  navigate: (route: TeacherRoute) => void;
}) {
  const planAttention =
    model.plan.decision === "approved"
      ? {
          title: "Kế hoạch bài dạy đã được phê duyệt",
          body: `Phiên bản ${model.plan.version} đã sẵn sàng để sử dụng trong lớp.`,
          action: "Bắt đầu giảng dạy",
          route: "/teacher/teaching" as const,
        }
      : model.plan.decision === "rejected"
        ? {
            title: "Kế hoạch cần được chỉnh sửa",
            body: `Phiên bản ${model.plan.version} đã được yêu cầu sửa trước khi giảng dạy.`,
            action: "Mở bản cần chỉnh sửa",
            route: "/teacher/lesson-plan" as const,
          }
        : {
            title: "Kế hoạch bài dạy đang chờ quyết định",
            body: `Phiên bản ${model.plan.version} gồm ${model.plan.lesson_plan.activities.length} hoạt động phân hóa trong 45 phút.`,
            action: "Duyệt kế hoạch",
            route: "/teacher/lesson-plan" as const,
          };
  const attention = [
    {
      tone: "urgent",
      title: `${model.metrics.insufficient} học sinh chưa đủ minh chứng`,
      body: "Nếu xếp nhóm ngay, các em có thể nhận sai hình thức hỗ trợ.",
      action: "Xem học sinh cần xác minh",
      route: "/teacher/students" as const,
    },
    {
      tone: "purple",
      ...planAttention,
    },
    {
      tone: "cyan",
      title: `${model.metrics.needsSupport} học sinh cần hỗ trợ có mục tiêu`,
      body: "Các em đã được ghép nhóm theo nguyên nhân gốc, không chỉ theo điểm số.",
      action: "Xem nhóm đề xuất",
      route: "/teacher/insights" as const,
    },
  ];
  return (
    <>
      <section className="today-hero">
        <div>
          <span className="product-chip">Tiết tiếp theo · 08:00</span>
          <h2>
            {model.className} · {model.lessonName}
          </h2>
          <p>45 phút · Phòng A203 · {model.metrics.total} học sinh</p>
        </div>
        <button
          className="product-primary"
          onClick={() => navigate("/teacher/prepare")}
          type="button"
        >
          Chuẩn bị tiết học
        </button>
      </section>
      <section className="metric-grid" aria-label="Tổng quan hôm nay">
        <article>
          <span>Mức sẵn sàng</span>
          <strong>
            {model.metrics.ready}/{model.metrics.total}
          </strong>
          <small>học sinh sẵn sàng vận dụng</small>
        </article>
        <article>
          <span>Độ tin cậy trung bình</span>
          <strong>{formatPercent(model.metrics.averageConfidence)}</strong>
          <small>từ chẩn đoán của từng em</small>
        </article>
        <article>
          <span>Nhóm học tập</span>
          <strong>{model.groups.length}</strong>
          <small>
            có{" "}
            {
              model.groups.filter((group) =>
                group.intervention_need.includes("confirmation"),
              ).length
            }{" "}
            nhóm cần thêm minh chứng
          </small>
        </article>
        <article>
          <span>Trạng thái kế hoạch</span>
          <strong>
            {model.plan.decision === "approved"
              ? "Đã duyệt"
              : model.plan.decision === "rejected"
                ? "Cần chỉnh sửa"
                : "Chờ duyệt"}
          </strong>
          <small>phiên bản {model.plan.version}</small>
        </article>
      </section>
      <div className="product-two-column">
        <section className="product-panel">
          <div className="panel-heading">
            <div>
              <span>Hộp việc cần làm</span>
              <h2>Ưu tiên của cô hôm nay</h2>
            </div>
            <span className="count-badge">{attention.length} việc</span>
          </div>
          <div className="attention-list">
            {attention.map((item) => (
              <article
                className={`attention-card ${item.tone}`}
                key={item.title}
              >
                <span className="attention-mark" aria-hidden="true" />
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </div>
                <button onClick={() => navigate(item.route)} type="button">
                  {item.action} <span aria-hidden="true">→</span>
                </button>
              </article>
            ))}
          </div>
        </section>
        <aside className="product-panel activity-panel">
          <div className="panel-heading">
            <div>
              <span>Hoạt động gần đây</span>
              <h2>Dòng thời gian lớp 7A</h2>
            </div>
          </div>
          <ol>
            <li>
              <time>07:42</time>
              <div>
                <strong>Đã đồng bộ minh chứng</strong>
                <span>
                  {model.metrics.total - model.metrics.insufficient} hồ sơ hợp
                  lệ, {model.metrics.insufficient} hồ sơ cần xác minh.
                </span>
              </div>
            </li>
            <li>
              <time>07:39</time>
              <div>
                <strong>AiLearn cập nhật nhóm</strong>
                <span>Nhóm được tính lại từ ảnh chụp lớp mới nhất.</span>
              </div>
            </li>
            <li>
              <time>Hôm qua</time>
              <div>
                <strong>Cô Hà đã lưu ghi chú</strong>
                <span>Ưu tiên ví dụ thực tế về năng suất.</span>
              </div>
            </li>
          </ol>
        </aside>
      </div>
    </>
  );
}

function ClassesPage({
  model,
  navigate,
}: {
  model: TeacherDemoModel;
  navigate: (route: TeacherRoute) => void;
}) {
  return (
    <div className="product-two-column classes-layout">
      <section className="product-panel class-card">
        <div className="class-card-header">
          <span>7A</span>
          <div>
            <h2>{model.className}</h2>
            <p>Toán · Học kỳ I · {model.metrics.total} học sinh</p>
          </div>
          <span className="status-pill success">Đang hoạt động</span>
        </div>
        <div className="class-progress">
          <div>
            <span>Minh chứng đã sẵn sàng</span>
            <strong>
              {model.metrics.total - model.metrics.insufficient}/
              {model.metrics.total}
            </strong>
          </div>
          <progress
            value={model.metrics.total - model.metrics.insufficient}
            max={model.metrics.total}
          />
        </div>
        <div className="class-stat-row">
          <span>
            <strong>{model.metrics.needsSupport}</strong>Cần hỗ trợ
          </span>
          <span>
            <strong>{model.metrics.ready}</strong>Sẵn sàng
          </span>
          <span>
            <strong>{model.metrics.insufficient}</strong>Cần xác minh
          </span>
        </div>
        <button
          className="product-secondary"
          onClick={() => navigate("/teacher/analytics")}
          type="button"
        >
          Mở phân tích lớp
        </button>
      </section>
      <section className="product-panel lesson-list">
        <div className="panel-heading">
          <div>
            <span>Tiến trình chương</span>
            <h2>Đại lượng tỉ lệ</h2>
          </div>
        </div>
        <ol>
          <li className="done">
            <span>✓</span>
            <div>
              <strong>Đại lượng tỉ lệ thuận</strong>
              <small>Đã hoàn thành · 17/07</small>
            </div>
          </li>
          <li className="current">
            <span>2</span>
            <div>
              <strong>{model.lessonName}</strong>
              <small>Tiết tiếp theo · đang chuẩn bị</small>
            </div>
            <button onClick={() => navigate("/teacher/prepare")} type="button">
              Chuẩn bị
            </button>
          </li>
          <li>
            <span>3</span>
            <div>
              <strong>Bài toán thực tế</strong>
              <small>Sắp tới · chưa mở</small>
            </div>
          </li>
        </ol>
      </section>
    </div>
  );
}

function PreparePage({
  model,
  navigate,
  progress,
  setProgress,
}: {
  model: TeacherDemoModel;
  navigate: (route: TeacherRoute) => void;
  progress: DemoProgress;
  setProgress: (next: DemoProgress) => void;
}) {
  return (
    <div className="prepare-grid">
      <form
        className="product-panel preparation-form"
        onSubmit={(event) => {
          event.preventDefault();
          setProgress({ ...progress, preparationSaved: true });
        }}
      >
        <div className="panel-heading">
          <div>
            <span>Thông tin bài học</span>
            <h2>Mục tiêu và điều kiện giảng dạy</h2>
          </div>
          <span className="required-note">* Bắt buộc</span>
        </div>
        <label>
          <span>Mục tiêu bài học *</span>
          <textarea
            onChange={(event) =>
              setProgress({
                ...progress,
                preparationSaved: false,
                preparation: {
                  ...progress.preparation,
                  objective: event.target.value,
                },
              })
            }
            required
            rows={3}
            value={progress.preparation.objective}
          />
          <small>Viết điều học sinh có thể chứng minh sau tiết học.</small>
        </label>
        <div className="form-row">
          <label>
            <span>Thời lượng *</span>
            <input
              aria-describedby="duration-help"
              onChange={(event) =>
                setProgress({
                  ...progress,
                  preparationSaved: false,
                  preparation: {
                    ...progress.preparation,
                    duration: event.target.value,
                  },
                })
              }
              inputMode="numeric"
              max="90"
              min="15"
              required
              type="number"
              value={progress.preparation.duration}
            />
            <small id="duration-help">
              Tổng thời gian của mọi hoạt động phải bằng 45 phút.
            </small>
          </label>
          <label>
            <span>Chiến lược ưu tiên</span>
            <select
              onChange={(event) =>
                setProgress({
                  ...progress,
                  preparationSaved: false,
                  preparation: {
                    ...progress.preparation,
                    strategy: event.target.value,
                  },
                })
              }
              value={progress.preparation.strategy}
            >
              <option value="stations">Dạy học theo trạm</option>
              <option>Hướng dẫn trực tiếp</option>
              <option>Học theo cặp</option>
            </select>
            <small>AiLearn dùng lựa chọn này khi đề xuất hoạt động.</small>
          </label>
        </div>
        <label>
          <span>
            Ghi chú của giáo viên <em>Không bắt buộc</em>
          </span>
          <textarea
            onChange={(event) =>
              setProgress({
                ...progress,
                preparationSaved: false,
                preparation: {
                  ...progress.preparation,
                  note: event.target.value,
                },
              })
            }
            placeholder="Ví dụ: Lớp phản hồi tốt với sơ đồ và tình huống gần gũi…"
            rows={3}
            value={progress.preparation.note}
          />
          <small>
            Ghi chú được lưu trong phiên demo này; chỉ thay đổi kế hoạch khi cô
            lưu tại trang Kế hoạch bài dạy.
          </small>
        </label>
        <div className="form-actions">
          {progress.preparationSaved && (
            <span role="status">
              ✓ Đã lưu thông tin chuẩn bị trong bản demo
            </span>
          )}
          <button className="product-secondary" type="submit">
            Lưu thông tin chuẩn bị
          </button>
        </div>
      </form>
      <aside className="product-panel readiness-check">
        <div className="panel-heading">
          <div>
            <span>Kiểm tra đầu vào</span>
            <h2>Sẵn sàng tạo kế hoạch</h2>
          </div>
        </div>
        <ul>
          <li className="pass">
            <span>✓</span>
            <div>
              <strong>Mục tiêu rõ ràng</strong>
              <small>Đã gắn với bài {model.lessonName.toLowerCase()}.</small>
            </div>
          </li>
          <li className="pass">
            <span>✓</span>
            <div>
              <strong>
                {model.metrics.total - model.metrics.insufficient} hồ sơ đủ minh
                chứng
              </strong>
              <small>Ảnh chụp lớp được tính từ dữ liệu mới nhất.</small>
            </div>
          </li>
          <li className="warn">
            <span>!</span>
            <div>
              <strong>{model.metrics.insufficient} hồ sơ cần xác minh</strong>
              <small>
                Các em được giữ ở nhóm riêng, không bị gán nhãn chắc chắn.
              </small>
            </div>
          </li>
        </ul>
        <button
          className="product-primary"
          onClick={() => navigate("/teacher/insights")}
          type="button"
        >
          Xem chẩn đoán của lớp
        </button>
      </aside>
    </div>
  );
}

function AnalyticsPage({
  model,
  navigate,
}: {
  model: TeacherDemoModel;
  navigate: (route: TeacherRoute) => void;
}) {
  const currentLesson = getCurrentGrade7MathKnttLesson();
  const readiness = [
    { label: "Sẵn sàng", count: model.metrics.ready, tone: "ready" },
    { label: "Cần hỗ trợ", count: model.metrics.needsSupport, tone: "support" },
    {
      label: "Chưa đủ minh chứng",
      count: model.metrics.insufficient,
      tone: "evidence",
    },
  ];
  const rootCauses = Array.from(
    model.students.reduce((counts, student) => {
      if (!student.rootCauseId) return counts;
      counts.set(
        student.rootCauseId,
        (counts.get(student.rootCauseId) ?? 0) + 1,
      );
      return counts;
    }, new Map<string, number>()),
  )
    .map(([skill, count]) => ({
      skill,
      label: teacherSkillLabel(skill),
      count,
    }))
    .sort((left, right) => right.count - left.count);
  const maxCauseCount = Math.max(...rootCauses.map((cause) => cause.count), 1);
  const priorityRows = model.teachingPriorities.slice(0, 2).map((priority) => ({
    ...priority,
    duration: model.plan.lesson_plan.activities
      .filter((activity) => activity.root_cause_skill_id === priority.skill_id)
      .reduce((total, activity) => total + activity.duration_minutes, 0),
  }));
  const groupRows = model.groups.map((group) => ({
    label: group.name,
    count: group.student_ids.length,
    target: group.target,
  }));
  const maxGroupCount = Math.max(...groupRows.map((group) => group.count), 1);
  const currentChapterLessons = currentLesson.chapter.lessons;
  const currentLessonIndex = currentChapterLessons.findIndex(
    (lesson) => lesson.id === currentLesson.lesson.id,
  );
  const nextLesson = currentChapterLessons[currentLessonIndex + 1] ?? null;
  const lessonStatus =
    model.plan.decision === "approved" ? "Sẵn sàng dạy" : "Cần chốt cách dạy";
  const operationSteps = [
    {
      label: "Kiểm tra minh chứng đầu vào",
      note: `${model.metrics.evidenceTotal} minh chứng đã ghi nhận`,
      state: "neutral",
      route: "/teacher/prepare" as const,
    },
    {
      label: "Thu bài và chẩn đoán",
      note: `${model.metrics.total - model.metrics.insufficient}/${model.metrics.total} hồ sơ có thể hành động`,
      state: "neutral",
      route: "/teacher/insights" as const,
    },
    {
      label: "Chốt cách dạy",
      note:
        model.plan.decision === "approved"
          ? "Kế hoạch đã được phê duyệt"
          : "Giáo viên duyệt phương án đề xuất",
      state: model.plan.decision === "approved" ? "done" : "current",
      route: "/teacher/lesson-plan" as const,
    },
    {
      label: "Dạy trên lớp",
      note: "Mở chế độ giảng dạy khi vào tiết",
      state: "neutral",
      status: "Mở công cụ",
      route: "/teacher/teaching" as const,
    },
  ];
  let accumulated = 0;

  return (
    <div className="analytics-page">
      <section
        className="analytics-summary"
        aria-labelledby="analytics-summary-title"
      >
        <div>
          <span className="product-chip">
            Dữ liệu lớp cập nhật 2 phút trước
          </span>
          <h2 id="analytics-summary-title">
            Điều gì cần ưu tiên trong tiết này?
          </h2>
          <p>
            Kết quả dưới đây được tính từ hồ sơ chẩn đoán, minh chứng và nhóm
            học tập của {model.metrics.total} học sinh lớp 7A.
          </p>
        </div>
        <button
          className="product-primary"
          onClick={() => navigate("/teacher/insights")}
          type="button"
        >
          Xem minh chứng chi tiết
        </button>
      </section>

      <div className="operations-grid">
        <section
          className="product-panel lesson-operation"
          aria-labelledby="lesson-operation-title"
        >
          <div className="panel-heading">
            <div>
              <span>Tiết học sắp tới</span>
              <h2 id="lesson-operation-title">
                {model.className} · {model.lessonName}
              </h2>
            </div>
            <span
              className={`status-pill ${model.plan.decision === "approved" ? "success" : "warning"}`}
            >
              {lessonStatus}
            </span>
          </div>
          <div className="operation-metrics">
            <strong>
              {model.metrics.total - model.metrics.insufficient}/
              {model.metrics.total}
            </strong>
            <span>hồ sơ đã đủ minh chứng</span>
            <strong>{rootCauses.length}</strong>
            <span>nguyên nhân chính cần xử lý</span>
          </div>
          <ol className="lesson-operation-steps">
            {operationSteps.map((step, index) => (
              <li className={`is-${step.state}`} key={step.label}>
                <button onClick={() => navigate(step.route)} type="button">
                  <span>{step.state === "done" ? "✓" : index + 1}</span>
                  <div>
                    <strong>{step.label}</strong>
                    <small>{step.note}</small>
                  </div>
                  <b>
                    {step.status ??
                      (step.state === "done"
                        ? "Đã duyệt"
                        : step.state === "current"
                          ? "Cần xử lý"
                          : step.state === "neutral"
                            ? "Xem dữ liệu"
                            : "Mở")}
                  </b>
                </button>
              </li>
            ))}
          </ol>
        </section>

        <section
          className="product-panel upcoming-lessons"
          aria-labelledby="upcoming-lessons-title"
        >
          <div className="panel-heading">
            <div>
              <span>Lịch học sắp tới</span>
              <h2 id="upcoming-lessons-title">Ba buổi cần chuẩn bị</h2>
            </div>
          </div>
          <ol>
            <li className="is-current">
              <time>
                Hôm nay<small>Tiết 2</small>
              </time>
              <div>
                <strong>
                  {model.className} · {model.lessonName}
                </strong>
                <span>Đã chẩn đoán · {lessonStatus.toLowerCase()}</span>
              </div>
              <b>{lessonStatus}</b>
            </li>
            <li>
              <time>
                Ngày mai<small>Tiết 4</small>
              </time>
              <div>
                <strong>
                  {model.className} · {nextLesson?.title ?? "Bài học tiếp theo"}
                </strong>
                <span>Chưa có minh chứng lớp</span>
              </div>
              <b>Chuẩn bị</b>
            </li>
            <li>
              <time>
                Tuần sau<small>Tiết 1</small>
              </time>
              <div>
                <strong>{model.className} · Ôn tập đại lượng tỉ lệ</strong>
                <span>Dùng kết quả sau giờ học làm đầu vào</span>
              </div>
              <b>Chưa mở</b>
            </li>
          </ol>
        </section>
      </div>

      <div className="analytics-grid analytics-grid-top">
        <section
          className="product-panel chart-panel"
          aria-labelledby="readiness-title"
        >
          <div className="panel-heading">
            <div>
              <span>Mức sẵn sàng</span>
              <h2 id="readiness-title">Toàn lớp</h2>
            </div>
            <span className="count-badge">{model.metrics.total} học sinh</span>
          </div>
          <div className="readiness-chart">
            <svg
              aria-label={`Mức sẵn sàng: ${readiness.map((item) => `${item.label} ${item.count} học sinh`).join(", ")}`}
              className="readiness-donut"
              role="img"
              viewBox="0 0 120 120"
            >
              <circle className="donut-track" cx="60" cy="60" r="45" />
              {readiness.map((item) => {
                const fraction = item.count / model.metrics.total;
                const dash = fraction * 282.74;
                const element = (
                  <circle
                    className={`donut-segment is-${item.tone}`}
                    cx="60"
                    cy="60"
                    key={item.label}
                    r="45"
                    strokeDasharray={`${dash} ${282.74 - dash}`}
                    strokeDashoffset={-accumulated * 282.74}
                  />
                );
                accumulated += fraction;
                return element;
              })}
              <text className="donut-total" x="60" y="57">
                {model.metrics.total}
              </text>
              <text className="donut-caption" x="60" y="72">
                học sinh
              </text>
            </svg>
            <ul className="chart-legend">
              {readiness.map((item) => (
                <li key={item.label}>
                  <i className={`legend-dot is-${item.tone}`} />
                  <span>{item.label}</span>
                  <strong>{item.count}</strong>
                </li>
              ))}
            </ul>
          </div>
          <p className="chart-note">
            {model.metrics.insufficient} em chưa được xếp vào nhóm chắc chắn vì
            minh chứng còn thiếu hoặc mâu thuẫn.
          </p>
        </section>

        <section
          className="product-panel chart-panel"
          aria-labelledby="priority-title"
        >
          <div className="panel-heading">
            <div>
              <span>Ưu tiên giảng dạy</span>
              <h2 id="priority-title">Nối lại với bài đang học</h2>
            </div>
          </div>
          <ol className="teaching-priorities">
            {priorityRows.map((priority) => (
              <li key={priority.skill_id}>
                <span>{priority.rank}</span>
                <div>
                  <strong>{priority.label}</strong>
                  <p>
                    {priority.duration > 0
                      ? `Dành ${priority.duration} phút trong kế hoạch hiện tại${priority.rank === 1 ? " — thời lượng dài nhất." : "."}`
                      : "Cần thêm hoạt động phù hợp trong kế hoạch."}
                    {priority.rank === 2
                      ? ` Liên hệ trực tiếp với mục tiêu của bài ${currentLesson.lesson.title.toLowerCase()}.`
                      : ""}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <p className="chart-note">
            Đây là gợi ý từ chẩn đoán lớp; cô có thể điều chỉnh trong kế hoạch
            bài dạy.
          </p>
        </section>
      </div>

      <div className="analytics-grid">
        <section
          className="product-panel chart-panel"
          aria-labelledby="cause-title"
        >
          <div className="panel-heading">
            <div>
              <span>Khoảng hổng theo nguyên nhân</span>
              <h2 id="cause-title">Cần xử lý trước</h2>
            </div>
          </div>
          <ul
            className="bar-chart"
            aria-label="Số học sinh theo nguyên nhân gốc"
          >
            {rootCauses.map((cause) => (
              <li key={cause.skill}>
                <div>
                  <span>{cause.label}</span>
                  <strong>{cause.count} em</strong>
                </div>
                <i aria-hidden="true">
                  <b
                    style={{ width: `${(cause.count / maxCauseCount) * 100}%` }}
                  />
                </i>
              </li>
            ))}
          </ul>
          <button
            className="product-text-button"
            onClick={() => navigate("/teacher/students")}
            type="button"
          >
            Mở danh sách học sinh <span aria-hidden="true">→</span>
          </button>
        </section>

        <section
          className="product-panel chart-panel"
          aria-labelledby="group-chart-title"
        >
          <div className="panel-heading">
            <div>
              <span>Nhóm học tập</span>
              <h2 id="group-chart-title">Quy mô và trọng tâm</h2>
            </div>
          </div>
          <ul
            className="bar-chart group-bar-chart"
            aria-label="Số học sinh theo nhóm học tập"
          >
            {groupRows.map((group) => (
              <li key={group.label}>
                <div>
                  <span>{group.label}</span>
                  <strong>{group.count} em</strong>
                </div>
                <i aria-hidden="true">
                  <b
                    style={{ width: `${(group.count / maxGroupCount) * 100}%` }}
                  />
                </i>
                <small>{group.target}</small>
              </li>
            ))}
          </ul>
          <button
            className="product-text-button"
            onClick={() => navigate("/teacher/insights")}
            type="button"
          >
            Xem nhóm và minh chứng <span aria-hidden="true">→</span>
          </button>
        </section>
      </div>

      <section
        className="product-panel diagnostic-map"
        aria-labelledby="diagnostic-map-title"
      >
        <div className="panel-heading">
          <div>
            <span>Sơ đồ chẩn đoán lớp</span>
            <h2 id="diagnostic-map-title">
              Từ kiến thức nền đến mục tiêu bài học
            </h2>
          </div>
          <button
            className="product-text-button"
            onClick={() => navigate("/teacher/students")}
            type="button"
          >
            Mở học sinh cần ưu tiên <span aria-hidden="true">→</span>
          </button>
        </div>
        <p>
          Đường nối thể hiện quan hệ tiền đề cần kiểm tra; mỗi thẻ cho biết số
          học sinh đang bị ảnh hưởng.
        </p>
        <div className="diagnostic-map-flow">
          <article className="map-foundation">
            <span>Kiến thức nền</span>
            <strong>Nền tảng tỉ số và tỉ lệ thức</strong>
            <b>
              {rootCauses.find(
                (item) => item.skill === "skill_ratio_proportion_basics",
              )?.count ?? 0}{" "}
              em
            </b>
          </article>
          <div className="map-causes">
            {rootCauses.slice(0, 3).map((cause) => (
              <button
                key={cause.skill}
                onClick={() => navigate("/teacher/students")}
                type="button"
              >
                <strong>{cause.count}</strong>
                <span>{cause.label}</span>
              </button>
            ))}
          </div>
          <article className="map-goal">
            <span>Mục tiêu bài hiện tại</span>
            <strong>{currentLesson.lesson.title}</strong>
            <b>{model.metrics.ready} em sẵn sàng vận dụng</b>
          </article>
        </div>
        <small>
          Nhấp vào một vùng để mở danh sách học sinh; giáo viên vẫn xem minh
          chứng trước khi chốt can thiệp.
        </small>
      </section>

      <section
        className="product-panel syllabus-panel"
        aria-labelledby="syllabus-title"
      >
        <div className="panel-heading">
          <div>
            <span>Tiến trình môn Toán 7</span>
            <h2 id="syllabus-title">Kết nối tri thức với cuộc sống</h2>
          </div>
          <span className="count-badge">
            Bài {currentLesson.lesson.number}/{GRADE7_MATH_KNTT_LESSON_TOTAL}
          </span>
        </div>
        <p>
          Bài hiện tại thuộc{" "}
          <strong>
            Chương {currentLesson.chapter.number}: {currentLesson.chapter.title}
          </strong>
          . Danh mục này giúp đặt bài dạy vào mạch học; kết quả lớp vẫn chỉ dựa
          trên minh chứng đã thu thập.
        </p>
        <div className="syllabus-chapters">
          {GRADE7_MATH_KNTT_CHAPTERS.map((chapter) => {
            const currentInChapter = chapter.lessons.some(
              (lesson) => lesson.id === currentLesson.lesson.id,
            );
            return (
              <details key={chapter.id} open={currentInChapter}>
                <summary>
                  <span>{chapter.number}</span>
                  <strong>{chapter.title}</strong>
                  <small>{chapter.lessons.length} bài</small>
                </summary>
                <ol>
                  {chapter.lessons.map((lesson) => {
                    const state =
                      lesson.id === currentLesson.lesson.id
                        ? "current"
                        : "upcoming";
                    return (
                      <li className={state} key={lesson.id}>
                        <span>{lesson.number}</span>
                        {lesson.title}
                        {state === "current" && <b>Đang chuẩn bị</b>}
                        {lesson.number < currentLesson.lesson.number && (
                          <small>Trước bài hiện tại</small>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </details>
            );
          })}
        </div>
        <small className="syllabus-source">
          Danh mục chương và bài:{" "}
          <a href={GRADE7_MATH_KNTT_SOURCE} rel="noreferrer" target="_blank">
            tài liệu tập huấn Toán 7 Kết nối tri thức
          </a>
          . Không sao chép nội dung sách giáo khoa.
        </small>
      </section>
    </div>
  );
}

function EnginePipeline() {
  const stages = [
    ["01", "Minh chứng", "Câu trả lời, thời gian và quan sát"],
    ["02", "Chẩn đoán", "Xếp hạng nguyên nhân gốc và độ tin cậy"],
    ["03", "Ảnh chụp lớp", "Tổng hợp mà không che mất từng em"],
    ["04", "Nhóm học tập", "Ghép theo nhu cầu và mức chắc chắn"],
    ["05", "Kế hoạch", "Hoạt động phân hóa để giáo viên duyệt"],
    ["06", "Phê duyệt", "Giáo viên chỉnh sửa và ra quyết định"],
    ["07", "Giảng dạy", "Thực hiện theo pha và ghi nhận nhanh"],
    ["08", "Minh chứng mới", "Kiểm tra chuyển giao độc lập"],
    ["09", "Củng cố", "Sửa hiểu sai, luyện tập và duy trì"],
    ["10", "Bài tiếp theo", "Báo cáo trở thành đầu vào mới"],
  ];
  return (
    <section className="engine-pipeline" aria-labelledby="engine-title">
      <div className="panel-heading">
        <div>
          <span>Cách AiLearn phân tích</span>
          <h2 id="engine-title">Từ dữ liệu đến hành động của giáo viên</h2>
        </div>
        <span className="count-badge">Có thể truy xuất từng kết luận</span>
      </div>
      <ol>
        {stages.map(([number, title, copy]) => (
          <li key={number}>
            <span>{number}</span>
            <div>
              <strong>{title}</strong>
              <small>{copy}</small>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function InsightsPage({ model }: { model: TeacherDemoModel }) {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const selectedGroup = model.groups.find(
    (group) => group.id === selectedGroupId,
  );
  return (
    <>
      <EnginePipeline />
      <section
        className="metric-grid insight-metrics"
        aria-label="Chỉ số phân tích lớp"
      >
        <article>
          <span>Đủ minh chứng</span>
          <strong>
            {model.metrics.total - model.metrics.insufficient}/
            {model.metrics.total}
          </strong>
          <small>hồ sơ có thể hành động</small>
        </article>
        <article>
          <span>Cần hỗ trợ</span>
          <strong>{model.metrics.needsSupport}</strong>
          <small>được phân theo nguyên nhân gốc</small>
        </article>
        <article>
          <span>Độ tin cậy</span>
          <strong>{formatPercent(model.metrics.averageConfidence)}</strong>
          <small>trung bình toàn lớp</small>
        </article>
        <article>
          <span>Ưu tiên số 1</span>
          <strong className="metric-text">{model.topPriority.label}</strong>
          <small>hạng {model.topPriority.rank} theo engine của lớp</small>
        </article>
      </section>
      <div className="product-two-column insights-grid">
        <section className="product-panel cause-panel">
          <div className="panel-heading">
            <div>
              <span>Nguyên nhân gốc</span>
              <h2>Khoảng hổng cần xử lý trước</h2>
            </div>
          </div>
          {model.groups.map((group) => {
            const count = group.student_ids.length;
            return (
              <article key={group.id}>
                <div>
                  <strong>{group.target}</strong>
                  <small>
                    {group.rationale.replace(
                      /skill_[a-z_+]+/g,
                      "kỹ năng tiền đề",
                    )}
                  </small>
                </div>
                <span>{count} em</span>
                <div className="bar">
                  <i
                    style={{
                      width: `${Math.max(8, (count / model.metrics.total) * 100)}%`,
                    }}
                  />
                </div>
              </article>
            );
          })}
        </section>
        <section className="product-panel groups-panel">
          <div className="panel-heading">
            <div>
              <span>Nhóm đề xuất</span>
              <h2>{model.groups.length} nhóm cho tiết học này</h2>
            </div>
            <span className="count-badge">Tổng {model.metrics.total} em</span>
          </div>
          <div className="group-list">
            {model.groups.map((group, index) => (
              <article key={group.id}>
                <span className={`group-letter group-${index + 1}`}>
                  {index + 1}
                </span>
                <div>
                  <h3>{group.name}</h3>
                  <p>
                    {group.student_ids.length} học sinh · {group.target}
                  </p>
                  <small>
                    {index === model.groups.length - 1
                      ? "Xác minh trước khi giao nhiệm vụ"
                      : "Đề xuất: hoạt động 8–12 phút"}
                  </small>
                </div>
                <button
                  onClick={() => setSelectedGroupId(group.id)}
                  type="button"
                >
                  Xem nhóm
                </button>
              </article>
            ))}
          </div>
          {selectedGroup && (
            <aside className="group-detail" role="status">
              <div>
                <strong>{selectedGroup.name}</strong>
                <span>
                  {selectedGroup.student_ids.length} học sinh · Mục tiêu:{" "}
                  {selectedGroup.target}
                </span>
              </div>
              <p>
                {selectedGroup.rationale.replace(
                  /skill_[a-z_+]+/g,
                  "kỹ năng tiền đề",
                )}
              </p>
              <button
                aria-label="Đóng chi tiết nhóm"
                onClick={() => setSelectedGroupId(null)}
                type="button"
              >
                ×
              </button>
            </aside>
          )}
        </section>
      </div>
    </>
  );
}

function StudentDrawer({
  student,
  evidence,
  groups,
  onClose,
  onAssign,
  onRequestEvidence,
  onSaveGroupOverride,
  onSaveDiagnosisOverride,
  requestedEvidence,
  note,
  onNote,
  currentGroupId,
  currentOverrideReason,
  currentDiagnosisOverride,
}: {
  student: TeacherStudentRow;
  evidence: DemoEvidenceEvent[];
  groups: TeacherDemoModel["groups"];
  onClose: () => void;
  onAssign: () => void;
  onRequestEvidence: () => void;
  onSaveGroupOverride: (groupId: string, reason: string) => void;
  onSaveDiagnosisOverride: (rootCause: string, reason: string) => void;
  requestedEvidence: boolean;
  note: string;
  onNote: (note: string) => void;
  currentGroupId: string;
  currentOverrideReason: string;
  currentDiagnosisOverride?: { rootCause: string; reason: string };
}) {
  const [selectedGroupId, setSelectedGroupId] = useState(currentGroupId);
  const [overrideReason, setOverrideReason] = useState(currentOverrideReason);
  const [diagnosisRootCause, setDiagnosisRootCause] = useState(
    currentDiagnosisOverride?.rootCause ?? student.rootCause,
  );
  const [diagnosisReason, setDiagnosisReason] = useState(
    currentDiagnosisOverride?.reason ?? "",
  );
  const dialogRef = useModalFocus<HTMLElement>(true, onClose);
  return (
    <div className="drawer-backdrop" onMouseDown={onClose} role="presentation">
      <aside
        aria-labelledby="student-drawer-title"
        aria-modal="true"
        className="student-drawer"
        onMouseDown={(event) => event.stopPropagation()}
        ref={dialogRef}
        role="dialog"
      >
        <header>
          <div>
            <span>Hồ sơ học sinh</span>
            <h2 id="student-drawer-title">{student.name}</h2>
          </div>
          <button
            aria-label="Đóng hồ sơ học sinh"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </header>
        <div className="student-summary">
          <span className={`status-pill ${student.readiness}`}>
            {readinessLabel(student.readiness)}
          </span>
          <strong>{formatPercent(student.confidence)} tin cậy</strong>
        </div>
        <section>
          <h3>Kết luận có thể giải thích</h3>
          <div className="diagnosis-card">
            <span>Nguyên nhân được xếp hạng cao nhất</span>
            <strong>{student.rootCause}</strong>
            <p>
              Kết luận dựa trên chuỗi minh chứng gần đây và quan hệ kỹ năng tiền
              đề. Giáo viên có thể yêu cầu thêm minh chứng hoặc ghi đè kèm lý
              do.
            </p>
          </div>
        </section>
        <section>
          <h3>Dòng minh chứng</h3>
          <ol className="evidence-timeline">
            {evidence
              .slice(-4)
              .reverse()
              .map((event) => (
                <li key={event.id}>
                  <span className={event.is_correct ? "right" : "wrong"}>
                    {event.is_correct ? "Đúng" : "Sai"}
                  </span>
                  <div>
                    <strong>{teacherSkillLabel(event.skill_id)}</strong>
                    <small>
                      {event.source === "teacher_observation"
                        ? "Quan sát giáo viên"
                        : "Bài kiểm tra"}{" "}
                      ·{" "}
                      {event.sync_state === "pending"
                        ? "Đang chờ đồng bộ"
                        : "Đã đồng bộ"}
                    </small>
                  </div>
                </li>
              ))}
          </ol>
        </section>
        <section className="group-override-form">
          <h3>Điều chỉnh nhóm với lý do</h3>
          <label>
            <span>Nhóm giảng dạy</span>
            <select
              value={selectedGroupId}
              onChange={(event) => setSelectedGroupId(event.target.value)}
            >
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Lý do điều chỉnh *</span>
            <textarea
              value={overrideReason}
              onChange={(event) => setOverrideReason(event.target.value)}
              placeholder="Ví dụ: Quan sát trực tiếp cho thấy em đã giải thích đúng quan hệ…"
              rows={2}
            />
          </label>
          <button
            className="product-secondary"
            disabled={
              !overrideReason.trim() || selectedGroupId === currentGroupId
            }
            onClick={() =>
              onSaveGroupOverride(selectedGroupId, overrideReason.trim())
            }
            type="button"
          >
            Lưu điều chỉnh nhóm
          </button>
        </section>
        <section className="group-override-form">
          <h3>Ghi đè chẩn đoán của AiLearn</h3>
          <p className="form-helper">
            Chỉ dùng khi quan sát chuyên môn của cô khác với đề xuất. Lý do được
            lưu trong audit của phiên demo.
          </p>
          <label>
            <span>Nguyên nhân gốc sau điều chỉnh</span>
            <select
              value={diagnosisRootCause}
              onChange={(event) => setDiagnosisRootCause(event.target.value)}
            >
              {[...new Set(groups.map((group) => group.target))].map(
                (target) => (
                  <option key={target}>{target}</option>
                ),
              )}
            </select>
          </label>
          <label>
            <span>Lý do chuyên môn *</span>
            <textarea
              value={diagnosisReason}
              onChange={(event) => setDiagnosisReason(event.target.value)}
              placeholder="Ví dụ: Em giải thích đúng kỹ năng tiền đề khi trao đổi trực tiếp…"
              rows={2}
            />
          </label>
          <button
            className="product-secondary"
            disabled={
              !diagnosisReason.trim() ||
              diagnosisRootCause === student.rootCause
            }
            onClick={() =>
              onSaveDiagnosisOverride(
                diagnosisRootCause,
                diagnosisReason.trim(),
              )
            }
            type="button"
          >
            Lưu ghi đè chẩn đoán
          </button>
          {currentDiagnosisOverride && (
            <span className="saved-decision" role="status">
              ✓ Đã lưu quyết định ghi đè kèm lý do
            </span>
          )}
        </section>
        <label className="drawer-note">
          <span>Ghi chú của giáo viên</span>
          <textarea
            onChange={(event) => onNote(event.target.value)}
            placeholder="Ghi lại quan sát hoặc lý do điều chỉnh…"
            rows={3}
            value={note}
          />
          <small>Ghi chú không tự động thay đổi chẩn đoán.</small>
        </label>
        <div className="drawer-actions">
          <button
            className="product-secondary"
            disabled={requestedEvidence}
            onClick={onRequestEvidence}
            type="button"
          >
            {requestedEvidence
              ? "Đã yêu cầu minh chứng"
              : "Yêu cầu thêm minh chứng"}
          </button>
          <button className="product-primary" onClick={onAssign} type="button">
            Giao lộ trình củng cố
          </button>
        </div>
      </aside>
    </div>
  );
}

function StudentsPage({
  model,
  progress,
  setProgress,
}: {
  model: TeacherDemoModel;
  progress: DemoProgress;
  setProgress: (next: DemoProgress) => void;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("name");
  const selected =
    model.students.find(
      (student) => student.id === progress.selectedStudentId,
    ) ?? null;
  const filtered = useMemo(
    () =>
      model.students
        .filter(
          (student) =>
            (status === "all" || student.readiness === status) &&
            student.name
              .toLocaleLowerCase("vi")
              .includes(query.toLocaleLowerCase("vi")),
        )
        .sort((left, right) => {
          if (sort === "confidence") return right.confidence - left.confidence;
          if (sort === "evidence")
            return right.evidenceCount - left.evidenceCount;
          return left.name.localeCompare(right.name, "vi");
        }),
    [model.students, query, sort, status],
  );
  return (
    <>
      <section className="product-panel student-table-panel">
        <div className="table-toolbar">
          <label className="search-control">
            <span className="sr-only">Tìm học sinh</span>
            <input
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm theo tên học sinh…"
              value={query}
            />
          </label>
          <label>
            <span className="sr-only">Lọc theo mức sẵn sàng</span>
            <select
              onChange={(event) => setStatus(event.target.value)}
              value={status}
            >
              <option value="all">Tất cả mức sẵn sàng</option>
              <option value="ready">Sẵn sàng</option>
              <option value="needs_support">Cần hỗ trợ</option>
              <option value="abstained">Chưa đủ minh chứng</option>
            </select>
          </label>
          <label>
            <span className="sr-only">Sắp xếp học sinh</span>
            <select
              onChange={(event) => setSort(event.target.value)}
              value={sort}
            >
              <option value="name">Tên A–Z</option>
              <option value="confidence">Độ tin cậy cao trước</option>
              <option value="evidence">Nhiều minh chứng trước</option>
            </select>
          </label>
          {(query || status !== "all") && (
            <button
              onClick={() => {
                setQuery("");
                setStatus("all");
              }}
              type="button"
            >
              Xóa bộ lọc
            </button>
          )}
          <strong>{filtered.length} kết quả</strong>
        </div>
        <div className="product-table-wrap">
          <table>
            <caption>Hồ sơ chẩn đoán của học sinh lớp 7A</caption>
            <thead>
              <tr>
                <th scope="col">Học sinh</th>
                <th scope="col">Mức sẵn sàng</th>
                <th scope="col">Nguyên nhân gốc</th>
                <th scope="col">Tin cậy</th>
                <th scope="col">Minh chứng</th>
                <th scope="col">Đồng bộ</th>
                <th scope="col">Can thiệp</th>
                <th scope="col">
                  <span className="sr-only">Thao tác</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((student) => (
                <tr key={student.id}>
                  <th scope="row">
                    <button
                      className="student-name-button"
                      onClick={() =>
                        setProgress({
                          ...progress,
                          selectedStudentId: student.id,
                        })
                      }
                      type="button"
                    >
                      <span>
                        {student.name
                          .split(" ")
                          .slice(-2)
                          .map((word) => word[0])
                          .join("")}
                      </span>
                      {student.name}
                    </button>
                  </th>
                  <td>
                    <span className={`status-pill ${student.readiness}`}>
                      {readinessLabel(student.readiness)}
                    </span>
                  </td>
                  <td>
                    {progress.diagnosisOverrides[student.id]?.rootCause ??
                      student.rootCause}
                    {progress.diagnosisOverrides[student.id] && (
                      <small className="teacher-override-label">
                        Giáo viên đã điều chỉnh
                      </small>
                    )}
                  </td>
                  <td>
                    <strong>{formatPercent(student.confidence)}</strong>
                    {student.contradictingEvidence > 0 && (
                      <small className="contradiction">
                        Có minh chứng mâu thuẫn
                      </small>
                    )}
                  </td>
                  <td>
                    <strong>{student.evidenceCount}</strong> sự kiện
                    {student.contradictingEvidence > 0 && (
                      <small className="contradiction">Có mâu thuẫn</small>
                    )}
                  </td>
                  <td>
                    <span
                      className={`sync-label ${student.syncState === "Đang chờ" ? "pending" : ""}`}
                    >
                      {student.syncState}
                    </span>
                  </td>
                  <td>
                    {progress.assignedInterventions.includes(student.id)
                      ? "Đã giao"
                      : student.intervention}
                  </td>
                  <td>
                    <button
                      className="row-action"
                      onClick={() =>
                        setProgress({
                          ...progress,
                          selectedStudentId: student.id,
                        })
                      }
                      type="button"
                    >
                      Mở hồ sơ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="empty-filter">
            <strong>Không tìm thấy học sinh phù hợp.</strong>
            <p>Hãy thử từ khóa khác hoặc xóa bộ lọc hiện tại.</p>
          </div>
        )}
      </section>
      {selected && (
        <StudentDrawer
          currentDiagnosisOverride={progress.diagnosisOverrides[selected.id]}
          currentGroupId={
            progress.groupOverrides[selected.id] ?? selected.groupId ?? ""
          }
          currentOverrideReason={progress.overrideReasons[selected.id] ?? ""}
          evidence={model.evidence.filter(
            (event) => event.student_id === selected.id,
          )}
          groups={model.groups}
          note={progress.notes[selected.id] ?? ""}
          onAssign={() =>
            setProgress({
              ...progress,
              assignedInterventions: [
                ...new Set([...progress.assignedInterventions, selected.id]),
              ],
            })
          }
          onClose={() => setProgress({ ...progress, selectedStudentId: null })}
          onNote={(note) =>
            setProgress({
              ...progress,
              notes: { ...progress.notes, [selected.id]: note },
            })
          }
          onRequestEvidence={() =>
            setProgress({
              ...progress,
              requestedEvidence: [
                ...new Set([...progress.requestedEvidence, selected.id]),
              ],
            })
          }
          onSaveDiagnosisOverride={(rootCause, reason) =>
            setProgress({
              ...progress,
              diagnosisOverrides: {
                ...progress.diagnosisOverrides,
                [selected.id]: { rootCause, reason },
              },
            })
          }
          onSaveGroupOverride={(groupId, reason) =>
            setProgress({
              ...progress,
              groupOverrides: {
                ...progress.groupOverrides,
                [selected.id]: groupId,
              },
              overrideReasons: {
                ...progress.overrideReasons,
                [selected.id]: reason,
              },
            })
          }
          requestedEvidence={progress.requestedEvidence.includes(selected.id)}
          student={selected}
        />
      )}
    </>
  );
}

function TeachingPage({
  model,
  progress,
  setProgress,
  navigate,
}: {
  model: TeacherDemoModel;
  progress: DemoProgress;
  setProgress: (next: DemoProgress) => void;
  navigate: (route: TeacherRoute) => void;
}) {
  const [phase, setPhase] = useState(0);
  const [activeGroupId, setActiveGroupId] = useState(model.groups[0]?.id);
  const [quickNote, setQuickNote] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);
  const activities = model.plan.lesson_plan.activities;
  if (model.plan.decision !== "approved") {
    return (
      <section className="teaching-start product-panel">
        <span className="product-chip">Cần quyết định của giáo viên</span>
        <h2>Kế hoạch chưa được phê duyệt.</h2>
        <p>
          Chế độ giảng dạy chỉ mở sau khi giáo viên xem lại và phê duyệt đúng
          phiên bản kế hoạch. AiLearn không tự đưa bản nháp vào lớp học.
        </p>
        <button
          className="product-primary"
          onClick={() => navigate("/teacher/lesson-plan")}
          type="button"
        >
          Xem và phê duyệt kế hoạch
        </button>
      </section>
    );
  }
  if (progress.lessonCompleted) {
    return (
      <section className="teaching-start product-panel" role="status">
        <span className="product-chip">Đã hoàn thành tiết học</span>
        <h2>Minh chứng mới đã sẵn sàng để xem lại.</h2>
        <p>
          {progress.teachingObservations.length} quan sát nhanh đã được lưu
          trong phiên demo. Tiếp tục sang Sau giờ học để đối chiếu thẻ cuối giờ,
          kết quả chuyển giao và nhu cầu can thiệp.
        </p>
        <button
          className="product-primary"
          onClick={() => navigate("/teacher/after-class")}
          type="button"
        >
          Xem kết quả sau giờ học
        </button>
      </section>
    );
  }
  if (!progress.teachingStarted)
    return (
      <section className="teaching-start product-panel">
        <span className="product-chip">
          Kế hoạch phiên bản {model.plan.version}
        </span>
        <h2>Sẵn sàng bắt đầu tiết dạy?</h2>
        <p>
          Chế độ giảng dạy sẽ rút gọn giao diện, giữ lại thời gian, hướng dẫn
          nhóm và ghi nhận nhanh. Tiến trình demo được lưu trong phiên trình
          duyệt này.
        </p>
        <div className="teaching-checks">
          <span>✓ {activities.length} hoạt động</span>
          <span>✓ {model.groups.length} nhóm</span>
          <span>✓ Học liệu đã sẵn sàng</span>
        </div>
        <button
          className="product-primary"
          onClick={() => setProgress({ ...progress, teachingStarted: true })}
          type="button"
        >
          Bắt đầu Chế độ giảng dạy
        </button>
      </section>
    );
  const activity = activities[Math.min(phase, activities.length - 1)];
  return (
    <section className="teaching-mode">
      <header>
        <div>
          <span>
            Đang giảng dạy · Pha {phase + 1}/{activities.length}
          </span>
          <h2>{activity.title}</h2>
        </div>
        <strong>{activity.duration_minutes}:00</strong>
      </header>
      <div className="teaching-progress">
        <i style={{ width: `${((phase + 1) / activities.length) * 100}%` }} />
      </div>
      <div className="teaching-columns">
        <article>
          <span>Mục tiêu của pha</span>
          <h3>{teacherSkillLabel(activity.skill_id)}</h3>
          <p>{teacherFacingText(activity.rationale)}</p>
          <aside>
            <strong>Minh chứng cần quan sát</strong>
            {activity.expected_evidence}
          </aside>
        </article>
        <section>
          <span>Nhóm đang làm việc</span>
          {model.groups.slice(0, 3).map((group) => (
            <button
              className={activeGroupId === group.id ? "active" : ""}
              key={group.id}
              onClick={() => setActiveGroupId(group.id)}
              type="button"
            >
              <strong>{group.name}</strong>
              <small>
                {group.student_ids.length} học sinh · {group.target}
              </small>
            </button>
          ))}
        </section>
      </div>
      <label className="quick-note">
        <span>Ghi nhận nhanh</span>
        <input
          onChange={(event) => {
            setQuickNote(event.target.value);
            setNoteSaved(false);
          }}
          placeholder="Ví dụ: Nhóm 1 vẫn nhầm dấu của đại lượng…"
          value={quickNote}
        />
        <button
          disabled={!quickNote.trim()}
          onClick={() => {
            setProgress({
              ...progress,
              teachingObservations: [
                ...progress.teachingObservations,
                {
                  text: quickNote.trim(),
                  phase,
                  groupId: activeGroupId ?? null,
                  recordedAt: model.generatedAt,
                  syncState: "pending",
                },
              ],
            });
            setQuickNote("");
            setNoteSaved(true);
          }}
          type="button"
        >
          Lưu quan sát
        </button>
        {noteSaved && (
          <span role="status">
            Đã lưu · chờ đồng bộ ({progress.teachingObservations.length})
          </span>
        )}
      </label>
      <footer>
        <button
          className="product-secondary"
          disabled={phase === 0}
          onClick={() => setPhase(Math.max(0, phase - 1))}
          type="button"
        >
          Pha trước
        </button>
        {phase < activities.length - 1 ? (
          <button
            className="product-primary"
            onClick={() => setPhase(phase + 1)}
            type="button"
          >
            Chuyển sang pha tiếp theo
          </button>
        ) : (
          <button
            className="product-primary"
            onClick={() => setProgress({ ...progress, lessonCompleted: true })}
            type="button"
          >
            Hoàn thành tiết học
          </button>
        )}
      </footer>
    </section>
  );
}

function AfterClassPage({
  model,
  progress,
  navigate,
}: {
  model: TeacherDemoModel;
  progress: DemoProgress;
  navigate: (route: TeacherRoute) => void;
}) {
  return (
    <>
      {!progress.lessonCompleted && (
        <aside className="state-banner">
          <span>i</span>
          <div>
            <strong>Đây là kết quả demo dự kiến.</strong>
            <p>
              Hoàn thành Chế độ giảng dạy để ghi nhận tiến trình trong phiên
              demo.
            </p>
          </div>
          <button onClick={() => navigate("/teacher/teaching")} type="button">
            Mở Chế độ giảng dạy
          </button>
        </aside>
      )}
      <section className="metric-grid">
        <article>
          <span>Đã tiến bộ</span>
          <strong>{model.metrics.improved}</strong>
          <small>em có minh chứng tốt hơn sau tiết học</small>
        </article>
        <article>
          <span>Sẵn sàng vận dụng</span>
          <strong>{model.metrics.afterReady}</strong>
          <small>kết quả theo bài kiểm tra cuối giờ</small>
        </article>
        <article>
          <span>Cần củng cố</span>
          <strong>{model.metrics.needsRemediation}</strong>
          <small>không kết luận từ một câu đúng</small>
        </article>
        <article>
          <span>Cần thêm minh chứng</span>
          <strong>{model.metrics.insufficient}</strong>
          <small>được giữ ngoài nhãn chẩn đoán chắc chắn</small>
        </article>
      </section>
      <div className="product-two-column">
        <section className="product-panel outcome-chart">
          <div className="panel-heading">
            <div>
              <span>Trước và sau tiết học</span>
              <h2>Mức sẵn sàng đã thay đổi thế nào?</h2>
            </div>
          </div>
          <div>
            <label>
              Trước tiết học{" "}
              <span>
                {model.metrics.ready}/{model.metrics.total}
              </span>
            </label>
            <progress value={model.metrics.ready} max={model.metrics.total} />
            <label>
              Sau tiết học{" "}
              <span>
                {model.metrics.afterReady}/{model.metrics.total}
              </span>
            </label>
            <progress
              value={model.metrics.afterReady}
              max={model.metrics.total}
            />
          </div>
          <p>
            Kết quả sau tiết học dùng minh chứng mới; học sinh chỉ được coi là
            vận dụng khi làm được tình huống chuyển giao độc lập.
          </p>
        </section>
        <aside className="product-panel next-action">
          <span>Bước dạy tiếp theo</span>
          <h2>
            Dành 8 phút đầu tiết để củng cố{" "}
            {model.topPriority.label.toLowerCase()}.
          </h2>
          <p>
            Đây là nguyên nhân có tác động hạ nguồn lớn nhất. Sau đó, xác minh
            riêng hai học sinh còn thiếu minh chứng.
          </p>
          <button
            className="product-primary"
            onClick={() => navigate("/teacher/interventions")}
            type="button"
          >
            Xem danh sách can thiệp
          </button>
        </aside>
      </div>
    </>
  );
}

function InterventionsPage({
  model,
  progress,
  setProgress,
  navigate,
}: {
  model: TeacherDemoModel;
  progress: DemoProgress;
  setProgress: (next: DemoProgress) => void;
  navigate: (route: TeacherRoute) => void;
}) {
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
  const queue = model.students.filter(
    (student) => student.intervention !== "Chưa cần",
  );
  const stateLabels: Record<string, string> = {
    CONFIRMATION: "Xác minh minh chứng",
    REPAIR: "Sửa hiểu sai nền tảng",
    PRACTICE: "Luyện tập có hướng dẫn",
    TRANSFER: "Vận dụng chuyển giao",
  };
  const stepLabels: Record<string, string> = {
    worked_example: "Ví dụ mẫu",
    guided_problem: "Bài tập có hướng dẫn",
    independent_problem: "Bài tập độc lập",
    near_transfer: "Vận dụng tình huống gần",
    result: "Kiểm tra kết quả",
  };
  return (
    <section className="product-panel intervention-panel">
      <div className="panel-heading">
        <div>
          <span>Hàng đợi can thiệp</span>
          <h2>{queue.length} học sinh cần hành động tiếp theo</h2>
        </div>
        <button
          className="product-secondary"
          onClick={() => navigate("/teacher/report")}
          type="button"
        >
          Mở báo cáo can thiệp
        </button>
      </div>
      <div className="stage-key" aria-label="Các giai đoạn củng cố">
        <span className="active">1 Xác minh</span>
        <span>2 Sửa hiểu sai</span>
        <span>3 Luyện có hướng dẫn</span>
        <span>4 Chuyển giao gần</span>
        <span>5 Chuyển giao xa</span>
        <span>6 Duy trì</span>
      </div>
      <div className="product-table-wrap">
        <table>
          <caption>Tiến trình củng cố của học sinh</caption>
          <thead>
            <tr>
              <th scope="col">Học sinh</th>
              <th scope="col">Nhu cầu chẩn đoán</th>
              <th scope="col">Giai đoạn hiện tại</th>
              <th scope="col">Tiến trình</th>
              <th scope="col">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {queue.map((student) => {
              const assigned = progress.assignedInterventions.includes(
                student.id,
              );
              const path = model.improvementPaths.find(
                (item) => item.student_id === student.id,
              );
              const value =
                assigned && path
                  ? Math.round(
                      (path.steps.filter((step) => step.completed).length /
                        path.steps.length) *
                        100,
                    )
                  : 0;
              return (
                <tr key={student.id}>
                  <th>{student.name}</th>
                  <td>{student.rootCause}</td>
                  <td>
                    {student.readiness === "abstained"
                      ? "Xác minh minh chứng"
                      : assigned
                        ? "Luyện có hướng dẫn"
                        : "Chưa bắt đầu"}
                  </td>
                  <td>
                    <progress value={value} max={100} />
                    <small>{value}%</small>
                  </td>
                  <td>
                    {assigned ? (
                      <button
                        className="row-action"
                        onClick={() => path && setSelectedPathId(path.id)}
                        type="button"
                      >
                        Xem lộ trình
                      </button>
                    ) : (
                      <button
                        className="row-action"
                        onClick={() =>
                          setProgress({
                            ...progress,
                            assignedInterventions: [
                              ...progress.assignedInterventions,
                              student.id,
                            ],
                          })
                        }
                        type="button"
                      >
                        Giao lộ trình
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {selectedPathId &&
        (() => {
          const path = model.improvementPaths.find(
            (item) => item.id === selectedPathId,
          );
          if (!path) return null;
          return (
            <aside className="path-detail" role="status">
              <div>
                <strong>Lộ trình củng cố</strong>
                <span>
                  Giai đoạn hiện tại: {stateLabels[path.current_state]}
                </span>
              </div>
              <ol>
                {path.steps.map((step) => (
                  <li className={step.completed ? "done" : ""} key={step.id}>
                    {step.completed ? "✓" : "○"}{" "}
                    {stepLabels[step.kind] ?? "Hoạt động củng cố"}
                  </li>
                ))}
              </ol>
              <button
                aria-label="Đóng lộ trình"
                onClick={() => setSelectedPathId(null)}
                type="button"
              >
                ×
              </button>
            </aside>
          );
        })()}
    </section>
  );
}

function ResourcesPage({
  model,
  progress,
  setProgress,
}: {
  model: TeacherDemoModel;
  progress: DemoProgress;
  setProgress: (next: DemoProgress) => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const closePreview = () => setPreview(null);
  const previewRef = useModalFocus<HTMLElement>(Boolean(preview), closePreview);
  const resources = [
    {
      type: "Phiếu hoạt động",
      title: "Phân biệt tỉ lệ thuận và nghịch qua bảng giá trị",
      group: model.groups[1]?.name,
      status: "Đã duyệt",
    },
    {
      type: "Ví dụ có hướng dẫn",
      title: "Năng suất làm việc và số người tham gia",
      group: model.groups[2]?.name,
      status: "Cần xem lại",
    },
    {
      type: "Thẻ kiểm tra cuối giờ",
      title: "Ba tình huống chuyển giao độc lập",
      group: "Cả lớp",
      status: "Đã duyệt",
    },
    {
      type: "Lộ trình củng cố",
      title: "Ôn tỉ số và tính chất tỉ lệ thức",
      group: model.groups[0]?.name,
      status: "Bản nháp",
    },
    {
      type: "Hoạt động mở rộng",
      title: "Thiết kế kế hoạch phân công trực nhật",
      group: model.groups[3]?.name,
      status: "Đã duyệt",
    },
    {
      type: "Câu hỏi xác minh",
      title: "Hai câu ngắn kiểm tra mức sẵn sàng",
      group: model.groups[4]?.name,
      status: "Đã duyệt",
    },
  ];
  return (
    <section className="resource-grid">
      {resources.map((resource) => (
        <article className="product-panel" key={resource.title}>
          <div>
            <span className="resource-type">{resource.type}</span>
            <span
              className={`status-pill ${resource.status === "Đã duyệt" ? "success" : ""}`}
            >
              {resource.status}
            </span>
          </div>
          <h2>{resource.title}</h2>
          <p>Dành cho: {resource.group}</p>
          <small>
            Nguồn: mẫu chương trình Toán 7 · AiLearn điều chỉnh theo ảnh chụp
            lớp
          </small>
          <footer>
            <button
              className="product-secondary"
              onClick={() => setPreview(resource.title)}
              type="button"
            >
              Xem trước
            </button>
            <button
              className="row-action"
              disabled={progress.attachedResources.includes(resource.title)}
              onClick={() =>
                setProgress({
                  ...progress,
                  attachedResources: [
                    ...progress.attachedResources,
                    resource.title,
                  ],
                })
              }
              type="button"
            >
              {progress.attachedResources.includes(resource.title)
                ? "Đã gắn"
                : "Gắn vào kế hoạch"}
            </button>
          </footer>
        </article>
      ))}
      {preview && (
        <div className="modal-backdrop" role="presentation">
          <aside
            aria-label={`Xem trước ${preview}`}
            aria-modal="true"
            className="resource-preview"
            ref={previewRef}
            role="dialog"
          >
            <button
              aria-label="Đóng xem trước học liệu"
              onClick={closePreview}
              type="button"
            >
              ×
            </button>
            <span>Xem trước học liệu</span>
            <h2>{preview}</h2>
            <p>
              <strong>Hướng dẫn cho học sinh:</strong> Đọc tình huống, xác định
              hai đại lượng và giải thích vì sao tích của chúng không đổi. Hãy
              trình bày bằng bảng trước khi viết biểu thức.
            </p>
            <p>
              <strong>Tiêu chí thành công:</strong> Xác định đúng quan hệ, lập
              được bảng và giải thích bằng lời của mình.
            </p>
          </aside>
        </div>
      )}
    </section>
  );
}

function productErrorMessage(error: unknown): string {
  if (error instanceof TeacherDemoValidationError) {
    return `Dữ liệu lớp học không khớp hợp đồng: ${error.message} Dữ liệu đã lưu trên trình duyệt vẫn an toàn.`;
  }
  if (error instanceof TeacherRepositoryError) {
    if (error.kind === "configuration") {
      return "Bản triển khai chưa cấu hình API cho Không gian giáo viên. Hãy kiểm tra VITE_API_BASE_URL rồi triển khai lại.";
    }
    if (error.kind === "unavailable") {
      return "Không thể kết nối tới API giáo viên. Hãy kiểm tra mạng hoặc trạng thái Railway rồi thử lại.";
    }
    return error.status === 403
      ? "Tài khoản hiện tại chưa có quyền đọc dữ liệu lớp học này. Hãy liên hệ quản trị viên trường."
      : "API đã trả về dữ liệu không thể sử dụng cho màn hình này. Hãy kiểm tra phiên bản contract và thử lại.";
  }
  return "Không thể xử lý dữ liệu Không gian giáo viên. Phần việc đã lưu trên trình duyệt vẫn an toàn; hãy thử lại.";
}

function PartialSnapshotWorkspace({
  message,
  snapshot,
  onRetry,
}: {
  message: string;
  snapshot: Awaited<ReturnType<TeacherWorkspaceRepository["getClassSnapshot"]>>;
  onRetry: () => void;
}) {
  const ready = snapshot.students.filter(
    (student) => student.readiness_status === "ready",
  ).length;
  const needsSupport = snapshot.students.filter(
    (student) => student.readiness_status === "needs_support",
  ).length;
  return (
    <div className="teacher-product">
      <section className="state-banner" role="status">
        <span>!</span>
        <div>
          <strong>
            Ảnh chụp lớp đã tải; kế hoạch bài dạy tạm thời gián đoạn.
          </strong>
          <p>{message}</p>
        </div>
        <button onClick={onRetry} type="button">
          Tải lại kế hoạch
        </button>
      </section>
      <header className="product-heading">
        <div>
          <p className="teacher-kicker">Chế độ dữ liệu một phần</p>
          <h1>Phân tích lớp vẫn sẵn sàng.</h1>
          <p>
            Cô vẫn có thể xem mức sẵn sàng và nhóm đã tính từ snapshot; các thao
            tác cần kế hoạch đang được khóa để tránh dùng dữ liệu cũ.
          </p>
        </div>
      </header>
      <section className="metric-grid" aria-label="Ảnh chụp lớp tải một phần">
        <article>
          <span>Tổng học sinh</span>
          <strong>{snapshot.students.length}</strong>
          <small>từ snapshot mới nhất</small>
        </article>
        <article>
          <span>Sẵn sàng</span>
          <strong>{ready}</strong>
          <small>có thể vận dụng</small>
        </article>
        <article>
          <span>Cần hỗ trợ</span>
          <strong>{needsSupport}</strong>
          <small>có nguyên nhân gốc</small>
        </article>
        <article>
          <span>Nhóm học tập</span>
          <strong>{snapshot.groups.length}</strong>
          <small>không bao gồm kế hoạch đang lỗi</small>
        </article>
      </section>
    </div>
  );
}

export function TeacherProductWorkspace({
  route,
  onNavigate,
  repository = httpTeacherWorkspaceRepository,
}: {
  route: ProductRoute;
  onNavigate: (path: TeacherRoute) => void;
  repository?: TeacherWorkspaceRepository;
}) {
  const [state, setState] = useState<ProductState>({ kind: "loading" });
  const [requestKey, setRequestKey] = useState(0);
  const [resetOpen, setResetOpen] = useState(false);
  const [progress, setProgressState] = useState<DemoProgress>(() => {
    try {
      const stored = window.sessionStorage.getItem(
        "ailearn-teacher-demo-progress",
      );
      if (!stored) return initialProgress;
      const parsed = JSON.parse(stored) as Partial<DemoProgress>;
      return {
        ...initialProgress,
        ...parsed,
        preparation: {
          ...initialPreparation,
          ...(parsed.preparation ?? {}),
        },
        teachingObservations: parsed.teachingObservations ?? [],
      };
    } catch {
      return initialProgress;
    }
  });
  const closeReset = () => setResetOpen(false);
  const resetRef = useModalFocus<HTMLElement>(resetOpen, closeReset);
  function setProgress(next: DemoProgress) {
    setProgressState(next);
    try {
      window.sessionStorage.setItem(
        "ailearn-teacher-demo-progress",
        JSON.stringify(next),
      );
    } catch {
      /* Session persistence is best-effort in restricted browsers. */
    }
  }
  useEffect(() => {
    let active = true;
    setState({ kind: "loading" });
    void Promise.allSettled([
      repository.getClassSnapshot(),
      repository.getLessonPlan(),
    ]).then(([snapshotResult, planResult]) => {
      if (!active) return;
      if (snapshotResult.status === "rejected") {
        setState({
          kind: "error",
          message: productErrorMessage(snapshotResult.reason),
        });
        return;
      }
      if (planResult.status === "rejected") {
        setState({
          kind: "partial",
          snapshot: snapshotResult.value,
          message: productErrorMessage(planResult.reason),
        });
        return;
      }
      try {
        setState({
          kind: "ready",
          model: buildTeacherDemoModel(snapshotResult.value, planResult.value),
        });
      } catch (error) {
        setState({ kind: "error", message: productErrorMessage(error) });
      }
    });
    return () => {
      active = false;
    };
  }, [repository, requestKey]);
  const connectionStatus =
    state.kind === "loading"
      ? "loading"
      : state.kind === "ready"
        ? "connected"
        : state.kind === "partial"
          ? "degraded"
          : "error";
  const effectiveModel =
    state.kind === "ready"
      ? applyTeacherDecisions(state.model, progress)
      : null;
  return (
    <TeacherShell
      connectionStatus={connectionStatus}
      currentRoute={route}
      onNavigate={onNavigate}
      toolbarAction={
        <button onClick={() => setResetOpen(true)} type="button">
          Đặt lại tiến trình demo
        </button>
      }
    >
      {state.kind === "loading" && (
        <section
          aria-busy="true"
          aria-live="polite"
          className="product-loading"
        >
          <span />
          <span />
          <span />
          <p>Đang tổng hợp ảnh chụp lớp từ bằng chứng mới nhất…</p>
        </section>
      )}
      {state.kind === "error" && (
        <section className="product-error" role="alert">
          <span aria-hidden="true">!</span>
          <div>
            <p className="teacher-kicker">Kết nối dữ liệu bị gián đoạn</p>
            <h1>Không thể tải Không gian giáo viên.</h1>
            <p>{state.message}</p>
            <button
              className="product-primary"
              onClick={() => setRequestKey((key) => key + 1)}
              type="button"
            >
              Kiểm tra lại kết nối
            </button>
          </div>
        </section>
      )}
      {state.kind === "partial" && (
        <PartialSnapshotWorkspace
          message={state.message}
          onRetry={() => setRequestKey((key) => key + 1)}
          snapshot={state.snapshot}
        />
      )}
      {state.kind === "ready" && effectiveModel && (
        <div className="teacher-product">
          <PageHeading model={effectiveModel} route={route} />
          <WorkflowStrip current={route} onNavigate={onNavigate} />
          {route === "/teacher" && (
            <TodayPage model={effectiveModel} navigate={onNavigate} />
          )}
          {route === "/teacher/analytics" && (
            <AnalyticsPage model={effectiveModel} navigate={onNavigate} />
          )}
          {route === "/teacher/classes" && (
            <ClassesPage model={effectiveModel} navigate={onNavigate} />
          )}
          {route === "/teacher/prepare" && (
            <PreparePage
              model={effectiveModel}
              navigate={onNavigate}
              progress={progress}
              setProgress={setProgress}
            />
          )}
          {route === "/teacher/insights" && (
            <InsightsPage model={effectiveModel} />
          )}
          {route === "/teacher/students" && (
            <StudentsPage
              model={effectiveModel}
              progress={progress}
              setProgress={setProgress}
            />
          )}
          {route === "/teacher/teaching" && (
            <TeachingPage
              model={effectiveModel}
              navigate={onNavigate}
              progress={progress}
              setProgress={setProgress}
            />
          )}
          {route === "/teacher/after-class" && (
            <AfterClassPage
              model={effectiveModel}
              navigate={onNavigate}
              progress={progress}
            />
          )}
          {route === "/teacher/interventions" && (
            <InterventionsPage
              model={effectiveModel}
              navigate={onNavigate}
              progress={progress}
              setProgress={setProgress}
            />
          )}
          {route === "/teacher/resources" && (
            <ResourcesPage
              model={effectiveModel}
              progress={progress}
              setProgress={setProgress}
            />
          )}
        </div>
      )}
      {resetOpen && (
        <div className="modal-backdrop" role="presentation">
          <section
            aria-labelledby="reset-title"
            aria-modal="true"
            className="reset-dialog"
            ref={resetRef}
            role="dialog"
          >
            <span aria-hidden="true">↺</span>
            <h2 id="reset-title">Đặt lại tiến trình trên trình duyệt?</h2>
            <p>
              Nhóm đã chỉnh, ghi chú, chuẩn bị, trạng thái giảng dạy và can
              thiệp sẽ trở về điểm bắt đầu. Quyết định phê duyệt kế hoạch nằm
              trên API nên không bị thay đổi và dữ liệu thật vẫn an toàn.
            </p>
            <div>
              <button
                className="product-secondary"
                onClick={() => setResetOpen(false)}
                type="button"
              >
                Giữ trạng thái hiện tại
              </button>
              <button
                className="product-primary"
                onClick={() => {
                  setProgress(initialProgress);
                  setResetOpen(false);
                  onNavigate("/teacher");
                }}
                type="button"
              >
                Đặt lại tiến trình demo
              </button>
            </div>
          </section>
        </div>
      )}
    </TeacherShell>
  );
}
