import { KnowledgePathDashboard } from "./KnowledgePathDashboard";
import { StudyMaterialsPanel } from "./StudyMaterials";
import type { Stage } from "./StudentWorkspace";

export interface StudentHomeProps {
  stage: Stage;
  busy: boolean;
  onStart: () => void;
  onContinue: (tab: "readiness" | "path") => void;
}

export function StudentHome({
  stage,
  busy,
  onStart,
  onContinue,
}: StudentHomeProps) {
  if (stage.kind === "idle") {
    return (
      <div className="student-home-stack">
        <section className="student-panel student-home-prep">
          <div className="student-panel-heading">
            <div>
              <span>Bước 01</span>
              <h2>Chuẩn bị kiến thức</h2>
            </div>
            <span className="student-count-badge">Soạn bài</span>
          </div>
          <p className="student-panel-lead">
            Em xem lý thuyết và video trước. Có kiến thức sẵn sẽ giúp làm bài
            test ngắn và tìm đúng chỗ còn yếu.
          </p>
          <KnowledgePathDashboard mode="prep" embedded />
          <StudyMaterialsPanel />
        </section>

        <section className="student-panel student-home-test">
          <div className="student-panel-heading">
            <div>
              <span>Bước 02</span>
              <h2>Làm bài test</h2>
            </div>
            <span className="student-count-badge">Khoảng 5 phút</span>
          </div>
          <div className="student-home-heading student-home-heading-nested">
            <div>
              <span className="student-pill">
                Không tính điểm · Không xếp hạng
              </span>
              <h1>Cho cô biết chỗ em đang vướng</h1>
              <p>
                Em làm một bài ngắn. Cô dùng câu trả lời để biết nên giải thích
                phần nào kỹ hơn trên lớp.
              </p>
            </div>
            <div className="student-home-visual" aria-label="Một việc cần làm">
              <span className="student-home-orbit" aria-hidden="true" />
              <img src="/brand/ailearn-mascot.webp" alt="" />
              <span className="student-firefly-tail" aria-hidden="true" />
              <span className="student-home-task">
                <strong>02</strong>
                <span>làm bài test</span>
              </span>
            </div>
          </div>
          <div className="student-day-rail">
            <div className="student-day-stage">
              <span className="student-day-index">01</span>
              <small>Trước test</small>
              <b>Soạn bài & xem video</b>
            </div>
            <div className="student-day-stage current">
              <span className="student-day-index">02</span>
              <small>Bây giờ</small>
              <b>Làm bài kiểm tra ngắn</b>
            </div>
            <div className="student-day-stage">
              <span className="student-day-index">03</span>
              <small>Sau test</small>
              <b>Học đúng chỗ còn yếu</b>
            </div>
          </div>
          <button
            type="button"
            className="student-btn teal"
            onClick={onStart}
            disabled={busy}
          >
            Bắt đầu bài ngắn <span aria-hidden="true">→</span>
          </button>
        </section>
      </div>
    );
  }

  if (
    stage.kind === "readiness" ||
    stage.kind === "waiting-to-sync" ||
    stage.kind === "probe" ||
    stage.kind === "probe-waiting-to-sync"
  ) {
    return (
      <article className="student-card student-status-card">
        <span className="student-status-icon" aria-hidden="true">
          ◷
        </span>
        <h1>Tiếp tục nơi em đang học</h1>
        <p>Em đang làm dở bài chuẩn bị.</p>
        <button
          type="button"
          className="student-btn primary"
          onClick={() => onContinue("readiness")}
        >
          Tiếp tục bài của em <span aria-hidden="true">→</span>
        </button>
      </article>
    );
  }

  if (stage.kind === "diagnosing") {
    return (
      <article className="student-card student-status-card" aria-live="polite">
        <span className="student-status-loader" aria-hidden="true" />
        <h1>AiLearn đang xem lại câu trả lời</h1>
        <p>Đang xem xét câu trả lời của em...</p>
      </article>
    );
  }

  if (
    stage.kind === "remediation" ||
    stage.kind === "complete" ||
    stage.kind === "exit-ticket" ||
    stage.kind === "exit-ticket-pending" ||
    stage.kind === "exit-ticket-result"
  ) {
    return (
      <article className="student-card student-status-card">
        <span className="student-status-icon" aria-hidden="true">
          ↗
        </span>
        <h1>Lộ trình hôm nay đang chờ em</h1>
        <p>
          {stage.kind === "exit-ticket"
            ? "Em có một bài cuối để thử sức."
            : stage.kind === "exit-ticket-pending"
              ? "Bài cuối đã được lưu và đang chờ đồng bộ."
              : stage.kind === "exit-ticket-result"
                ? "Kết quả bài cuối của em đã sẵn sàng."
                : stage.kind === "complete"
                  ? "Em đã hoàn thành lộ trình hôm nay!"
                  : "Em có một lộ trình đang chờ."}
        </p>
        <button
          type="button"
          className="student-btn primary"
          onClick={() => onContinue("path")}
        >
          Xem lộ trình của em <span aria-hidden="true">→</span>
        </button>
      </article>
    );
  }

  if (stage.kind === "error") {
    return (
      <article className="student-card student-status-card error" role="alert">
        <span className="student-status-icon" aria-hidden="true">
          !
        </span>
        <h1>Chưa thể bắt đầu bài học</h1>
        <p>{stage.message}</p>
        <button type="button" className="student-btn" onClick={onStart}>
          Thử lại
        </button>
      </article>
    );
  }

  return null;
}
