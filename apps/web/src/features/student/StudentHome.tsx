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
      <article className="student-card student-home-card">
        <div className="student-home-heading">
          <div>
            <span className="student-pill">Hôm nay · khoảng 5 phút</span>
            <h1>Chuẩn bị để tiết Toán dễ hiểu hơn</h1>
            <p>
              Em làm một bài ngắn. Cô sẽ dùng câu trả lời để biết nên giải thích
              phần nào kỹ hơn — không tính điểm và không xếp hạng.
            </p>
          </div>
          <div className="student-home-visual" aria-label="Một việc cần làm">
            <span className="student-home-orbit" aria-hidden="true" />
            <img src="/brand/ailearn-mascot.webp" alt="" />
            <span className="student-home-task">
              <strong>01</strong>
              <span>việc cần làm</span>
            </span>
          </div>
        </div>
        <div className="student-day-rail">
          <div className="student-day-stage current">
            <span className="student-day-index">01</span>
            <small>Trước lớp · Bây giờ</small>
            <b>Cho cô biết chỗ vướng</b>
          </div>
          <div className="student-day-stage">
            <span className="student-day-index">02</span>
            <small>Trong lớp</small>
            <b>Học theo lộ trình phù hợp</b>
          </div>
          <div className="student-day-stage">
            <span className="student-day-index">03</span>
            <small>Sau lớp</small>
            <b>Luyện đúng một bước cần thiết</b>
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
      </article>
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
