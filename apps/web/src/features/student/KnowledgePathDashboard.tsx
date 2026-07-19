import {
  knowledgeFocusId,
  LESSON_KNOWLEDGE_PATH,
  REPRESENTATION_LABELS,
  STATE_COPY,
  type KnowledgeNode,
} from "./copy";

export interface KnowledgePathDashboardProps {
  rootCauseSkillId?: string | null;
  currentState?: keyof typeof STATE_COPY | null;
  representation?: string | null;
  mode?: "prep" | "path";
  embedded?: boolean;
}

export function KnowledgePathDashboard({
  rootCauseSkillId = null,
  currentState = null,
  representation = null,
  mode = "path",
  embedded = false,
}: KnowledgePathDashboardProps) {
  const focusId = knowledgeFocusId(rootCauseSkillId);
  const focusIndex = focusId
    ? LESSON_KNOWLEDGE_PATH.findIndex((node) => node.id === focusId)
    : -1;
  const focusNode = focusIndex >= 0 ? LESSON_KNOWLEDGE_PATH[focusIndex] : null;
  const stateCopy = currentState ? STATE_COPY[currentState] : null;

  return (
    <section
      className={
        embedded
          ? "student-knowledge-dashboard embedded"
          : "student-panel student-knowledge-dashboard"
      }
      aria-label="Lộ trình kiến thức"
    >
      {!embedded && (
        <div className="student-panel-heading">
          <div>
            <span>
              {mode === "prep" ? "Bản đồ bài học" : "Lộ trình kiến thức"}
            </span>
            <h2>Đại lượng tỉ lệ nghịch · Toán 7</h2>
          </div>
          <span className="student-count-badge">
            {LESSON_KNOWLEDGE_PATH.length} khái niệm
          </span>
        </div>
      )}
      {embedded && (
        <div className="student-knowledge-embed-label">
          <strong>Bản đồ kiến thức bài học</strong>
          <span>{LESSON_KNOWLEDGE_PATH.length} khái niệm</span>
        </div>
      )}

      <div className="student-metric-grid" aria-label="Tóm tắt lộ trình">
        <article>
          <span>Đang tập trung</span>
          <strong>
            {focusNode?.title ??
              (mode === "prep" ? "Soạn bài trước test" : "Toàn bài học")}
          </strong>
          <small>
            {focusNode?.blurb ??
              "Xem các khái niệm theo thứ tự để nắm nền trước khi luyện."}
          </small>
        </article>
        <article>
          <span>Giai đoạn</span>
          <strong>{focusNode?.stage ?? "Chuẩn bị"}</strong>
          <small>
            {stateCopy?.title ??
              (mode === "prep"
                ? "Ôn lý thuyết & video trước bài kiểm tra ngắn"
                : "Theo dõi tiến trình kiến thức của em")}
          </small>
        </article>
        <article>
          <span>Cách trình bày</span>
          <strong>
            {representation
              ? (REPRESENTATION_LABELS[representation] ?? representation)
              : "Chưa chọn"}
          </strong>
          <small>
            {mode === "prep"
              ? "Video + lý thuyết giúp em sẵn sàng làm bài test"
              : "Dạng biểu diễn đang dùng trong phần luyện tập"}
          </small>
        </article>
      </div>

      <ol className="student-knowledge-list">
        {LESSON_KNOWLEDGE_PATH.map((node, index) => (
          <KnowledgeRow
            key={node.id}
            node={node}
            index={index}
            status={nodeStatus(index, focusIndex, mode)}
          />
        ))}
      </ol>
    </section>
  );
}

function nodeStatus(
  index: number,
  focusIndex: number,
  mode: "prep" | "path",
): "done" | "current" | "upcoming" {
  if (focusIndex < 0) {
    return mode === "prep" && index <= 2 ? "current" : "upcoming";
  }
  if (index < focusIndex) {
    return "done";
  }
  if (index === focusIndex) {
    return "current";
  }
  return "upcoming";
}

function KnowledgeRow({
  node,
  index,
  status,
}: {
  node: KnowledgeNode;
  index: number;
  status: "done" | "current" | "upcoming";
}) {
  const marker = status === "done" ? "✓" : String(index + 1).padStart(2, "0");
  const statusLabel =
    status === "done"
      ? "Nền tảng"
      : status === "current"
        ? "Đang tập trung"
        : "Tiếp theo";

  return (
    <li className={status}>
      <span aria-hidden="true">{marker}</span>
      <div>
        <strong>{node.title}</strong>
        <small>
          {node.stage} · {node.blurb}
        </small>
      </div>
      <em>{statusLabel}</em>
    </li>
  );
}
