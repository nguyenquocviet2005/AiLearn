import { useState } from "react";

import { listCacheEntries } from "@/lib/offline/content-cache";

import { StudyMaterialsPanel } from "./StudyMaterials";
import type { Stage } from "./StudentWorkspace";

export interface StudentHelpProps {
  stage: Stage;
}

export function StudentHelp({ stage }: StudentHelpProps) {
  const [showExample, setShowExample] = useState(false);
  const [teacherNoted, setTeacherNoted] = useState(false);
  const [showOffline, setShowOffline] = useState(false);

  const currentBody =
    stage.kind === "remediation" || stage.kind === "complete"
      ? stage.remediation.content.body
      : null;
  const currentStem =
    stage.kind === "readiness"
      ? (stage.session.items[stage.currentIndex]?.stem ?? null)
      : stage.kind === "probe"
        ? (stage.probeSession.items[0]?.stem ?? null)
        : null;
  const readAloudText = currentStem ?? currentBody;

  function handleReadAloud(): void {
    if (readAloudText && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(readAloudText));
    }
  }

  return (
    <article className="student-card student-help-card">
      <span className="student-pill">Trợ giúp</span>
      <h1>Em cần hỗ trợ theo cách nào?</h1>
      <p>Các lựa chọn đều dùng được khi mạng yếu.</p>
      <div className="student-help-grid">
        <button
          type="button"
          className="student-help-action"
          onClick={handleReadAloud}
          disabled={!readAloudText}
        >
          <span className="student-help-icon" aria-hidden="true">
            ◖
          </span>
          <b>Đọc chậm hơn</b>
          <small>Nghe lại câu hỏi hiện tại.</small>
        </button>
        <button
          type="button"
          className="student-help-action"
          onClick={() => setShowExample(true)}
          disabled={!currentBody}
        >
          <span className="student-help-icon" aria-hidden="true">
            ▦
          </span>
          <b>Xem một ví dụ</b>
          <small>Xem lại ví dụ của bước hiện tại.</small>
        </button>
        <button
          type="button"
          className="student-help-action"
          onClick={() => setTeacherNoted(true)}
        >
          <span className="student-help-icon" aria-hidden="true">
            ?
          </span>
          <b>Nhờ cô giải thích</b>
          <small>
            {teacherNoted
              ? "Đã ghi lại trên máy của em."
              : "Ghi lại để xem cùng cô sau."}
          </small>
        </button>
        <button
          type="button"
          className="student-help-action"
          onClick={() => setShowOffline((value) => !value)}
        >
          <span className="student-help-icon" aria-hidden="true">
            ↻
          </span>
          <b>Kiểm tra bài đã lưu</b>
          <small>Xem nội dung có thể học khi mất mạng.</small>
        </button>
      </div>
      {showExample && currentBody && (
        <div className="student-help-detail">
          <strong>Ví dụ ở bước hiện tại</strong>
          <p>{currentBody}</p>
        </div>
      )}
      {showOffline && <OfflineCacheList />}
      <StudyMaterialsPanel />
    </article>
  );
}

function OfflineCacheList() {
  const entries = listCacheEntries();
  return (
    <div className="student-help-detail" aria-label="Nội dung đã lưu offline">
      <strong>Nội dung có thể mở khi mất mạng</strong>
      {entries.length === 0 ? (
        <p>Chưa có nội dung nào được lưu.</p>
      ) : (
        <ul>
          {entries.map((entry) => (
            <li key={entry.key}>{entry.key}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
