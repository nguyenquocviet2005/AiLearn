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
      <article className="student-card">
        <span className="student-pill">Hôm nay · 1 việc · khoảng 5 phút</span>
        <h1>Chuẩn bị để tiết Toán dễ hiểu hơn</h1>
        <p>
          Em làm một bài ngắn. Cô sẽ dùng câu trả lời để biết nên giải thích
          phần nào kỹ hơn — không tính điểm và không xếp hạng.
        </p>
        <div className="student-day-rail">
          <div className="student-day-stage current">
            <small>TRƯỚC LỚP · BÂY GIỜ</small>
            <b>Cho cô biết chỗ vướng</b>
          </div>
          <div className="student-day-stage">
            <small>TRONG LỚP</small>
            <b>Học theo lộ trình phù hợp</b>
          </div>
          <div className="student-day-stage">
            <small>SAU LỚP</small>
            <b>Luyện đúng một bước cần thiết</b>
          </div>
        </div>
        <button
          type="button"
          className="student-btn teal"
          onClick={onStart}
          disabled={busy}
          style={{ marginTop: "1rem" }}
        >
          Bắt đầu bài ngắn →
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
      <article className="student-card">
        <p>Em đang làm dở bài chuẩn bị.</p>
        <button
          type="button"
          className="student-btn primary"
          onClick={() => onContinue("readiness")}
        >
          Tiếp tục bài của em →
        </button>
      </article>
    );
  }

  if (stage.kind === "diagnosing") {
    return (
      <article className="student-card" aria-live="polite">
        <p>Đang xem xét câu trả lời của em...</p>
      </article>
    );
  }

  if (stage.kind === "remediation" || stage.kind === "complete") {
    return (
      <article className="student-card">
        <p>
          {stage.kind === "complete"
            ? "Em đã hoàn thành lộ trình hôm nay!"
            : "Em có một lộ trình đang chờ."}
        </p>
        <button
          type="button"
          className="student-btn primary"
          onClick={() => onContinue("path")}
        >
          Xem lộ trình của em →
        </button>
      </article>
    );
  }

  if (stage.kind === "error") {
    return (
      <article className="student-card" role="alert">
        <p>{stage.message}</p>
        <button type="button" className="student-btn" onClick={onStart}>
          Thử lại
        </button>
      </article>
    );
  }

  return null;
}
