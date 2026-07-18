import { useEffect, useState } from "react";

import type { StudentRepository } from "@/lib/adapters/student-repository";
import type {
  ProgressState,
  StudentProgressResponse,
} from "@/lib/adapters/student-types";

import { PROGRESS_STATE_COPY } from "./copy";

export interface StudentProgressProps {
  studentId: string;
  lessonId: string;
  repository: StudentRepository;
  /** Bumped by the workspace after new evidence, to refetch. */
  refreshKey: number;
}

type State =
  | { kind: "loading" }
  | { kind: "ready"; data: StudentProgressResponse }
  | { kind: "error" };

export function StudentProgress({
  studentId,
  lessonId,
  repository,
  refreshKey,
}: StudentProgressProps) {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ kind: "loading" });
    repository
      .getProgress(studentId, lessonId)
      .then((data) => {
        if (!cancelled) {
          setState({ kind: "ready", data });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState({ kind: "error" });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [studentId, lessonId, repository, refreshKey]);

  if (state.kind === "loading") {
    return (
      <article className="student-card" aria-live="polite">
        <p>Đang xem lại quá trình học của em...</p>
      </article>
    );
  }

  if (state.kind === "error") {
    return (
      <article className="student-card" role="alert">
        <p>Chưa xem được tiến bộ lúc này. Em thử lại sau nhé.</p>
      </article>
    );
  }

  const { data } = state;

  if (data.total_attempts === 0) {
    return (
      <article className="student-card">
        <span className="student-pill">Tiến bộ</span>
        <h1>Em chưa có bài nào được ghi nhận</h1>
        <p>Làm bài chuẩn bị ở tab &quot;Hôm nay&quot; để bắt đầu nhé.</p>
      </article>
    );
  }

  return (
    <article className="student-card">
      <span className="student-pill">Tiến bộ</span>
      <h1>Những gì em đã cho cô thấy</h1>
      <p>
        Đây không phải điểm số hay xếp hạng — chỉ là những phần em đã có đủ bài
        làm để cô hiểu rõ.
      </p>

      <div className="student-progress-stats">
        <div>
          <b>{data.total_attempts}</b>
          <small>câu đã làm</small>
        </div>
        <div>
          <b>{data.skills_with_sufficient_evidence}</b>
          <small>phần đã đủ minh chứng</small>
        </div>
        <div>
          <b>{data.practice_attempts}</b>
          <small>lượt luyện thêm</small>
        </div>
      </div>

      <div className="student-skill-list" aria-label="Các phần kiến thức">
        {data.skills.map((skill) => {
          const copy = PROGRESS_STATE_COPY[skill.state as ProgressState];
          return (
            <div key={skill.skill_id} className="student-skill-row">
              <div>
                <b>{skill.skill_name}</b>
                {skill.is_target && (
                  <span className="student-pill indigo">Bài hôm nay</span>
                )}
                <small>
                  {skill.correct}/{skill.attempts} câu đúng
                </small>
              </div>
              <span className={`student-state-chip ${copy.tone}`}>
                {copy.label}
              </span>
            </div>
          );
        })}
      </div>
    </article>
  );
}
