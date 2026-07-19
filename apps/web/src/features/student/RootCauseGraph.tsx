import type { StudentDiagnosticProfileV1 } from "@ailearn/schemas";

import {
  criticalPathEdges,
  edgeKey,
  GRAPH_EDGES,
  GRAPH_SKILLS,
  GRAPH_TARGET_SKILL_ID,
  graphAncestors,
  skillLabel,
} from "./knowledge-graph-model";

const NODE_W = 148;
const NODE_H = 54;

export interface RootCauseGraphProps {
  profile: StudentDiagnosticProfileV1;
}

export function RootCauseGraph({ profile }: RootCauseGraphProps) {
  const rankedCauses = [...profile.root_causes].sort(
    (left, right) => left.rank - right.rank,
  );
  const primaryCauseId = rankedCauses[0]?.skill_id ?? null;
  const secondaryCauseIds = new Set(
    rankedCauses.slice(1).map((cause) => cause.skill_id),
  );
  const targetId = profile.target_skill_id || GRAPH_TARGET_SKILL_ID;
  const onTargetPath = new Set([
    ...graphAncestors(targetId),
    targetId,
    ...(primaryCauseId ? graphAncestors(primaryCauseId) : []),
    ...(primaryCauseId ? [primaryCauseId] : []),
  ]);
  const criticalEdges = criticalPathEdges(primaryCauseId, targetId);
  const abstained = profile.readiness_status === "abstained";
  const confidencePct = Math.round(profile.confidence * 100);

  const nodeById = new Map(
    GRAPH_SKILLS.map((node) => [node.skillId, node] as const),
  );

  return (
    <section
      className="student-panel student-root-graph"
      aria-label="Phân tích gốc kiến thức"
    >
      <div className="student-panel-heading">
        <div>
          <span>Phân tích khoảng trống kiến thức</span>
          <h2>
            {abstained
              ? "Chưa đủ minh chứng để kết luận gốc vấn đề"
              : primaryCauseId
                ? `Gốc vấn đề: ${skillLabel(primaryCauseId)}`
                : "Đang lần theo mối quan hệ kiến thức"}
          </h2>
        </div>
        <span className="student-count-badge">Độ tin cậy {confidencePct}%</span>
      </div>

      <p className="student-panel-lead">
        Các ô bên dưới là mảnh kiến thức từ lớp dưới, bài trước và bài hôm nay.
        Mũi tên chỉ quan hệ điều kiện tiên quyết — AiLearn lần ngược để tìm chỗ
        em cần ôn trước.
      </p>

      <div className="student-graph-legend" aria-label="Chú thích">
        <span>
          <i className="lg-root" /> Gốc vấn đề
        </span>
        <span>
          <i className="lg-path" /> Chuỗi liên quan
        </span>
        <span>
          <i className="lg-target" /> Mục tiêu bài học
        </span>
        <span>
          <i className="lg-prior" /> Từ lớp dưới / bài trước
        </span>
      </div>

      <div className="student-graph-canvas">
        <svg
          viewBox="0 0 1000 560"
          role="img"
          aria-label="Đồ thị quan hệ kiến thức và gốc vấn đề"
        >
          <defs>
            <linearGradient id="graphBg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#160b35" />
              <stop offset="55%" stopColor="#27145a" />
              <stop offset="100%" stopColor="#3b1f8a" />
            </linearGradient>
            <linearGradient id="edgeMuted" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#9b8fd0" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#d7ccff" stopOpacity="0.45" />
            </linearGradient>
            <linearGradient id="edgeCritical" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f1d94f" />
              <stop offset="100%" stopColor="#ff8a5b" />
            </linearGradient>
            <filter id="nodeGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <marker
              id="arrowMuted"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#c9bdf5" />
            </marker>
            <marker
              id="arrowCritical"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#ffb26b" />
            </marker>
          </defs>

          <rect
            x="0"
            y="0"
            width="1000"
            height="560"
            rx="18"
            fill="url(#graphBg)"
          />

          {/* subtle constellation dots */}
          {Array.from({ length: 28 }, (_, index) => {
            const x = (index * 97 + 40) % 960;
            const y = (index * 53 + 30) % 520;
            return (
              <circle
                key={`dot-${index}`}
                cx={x}
                cy={y}
                r={index % 4 === 0 ? 1.6 : 1}
                fill="#fff"
                opacity={0.08 + (index % 5) * 0.02}
              />
            );
          })}

          <text x="36" y="42" className="student-graph-layer-label">
            Lớp dưới / bài trước
          </text>
          <text x="36" y="268" className="student-graph-layer-label">
            Kiến thức bài này
          </text>
          <text x="36" y="500" className="student-graph-layer-label">
            Mục tiêu tiết học
          </text>

          {GRAPH_EDGES.map((edge) => {
            const from = nodeById.get(edge.from);
            const to = nodeById.get(edge.to);
            if (!from || !to) {
              return null;
            }
            const critical = criticalEdges.has(edgeKey(edge.from, edge.to));
            const path = curvePath(from.x, from.y, to.x, to.y);
            return (
              <path
                key={edgeKey(edge.from, edge.to)}
                d={path}
                className={
                  critical
                    ? "student-graph-edge critical"
                    : "student-graph-edge"
                }
                markerEnd={
                  critical ? "url(#arrowCritical)" : "url(#arrowMuted)"
                }
                fill="none"
              />
            );
          })}

          {GRAPH_SKILLS.map((node) => {
            const isTarget = node.skillId === targetId;
            const isRoot = node.skillId === primaryCauseId;
            const isSecondary = secondaryCauseIds.has(node.skillId);
            const onPath = onTargetPath.has(node.skillId);
            const roleClass = isRoot
              ? "root"
              : isTarget
                ? "target"
                : isSecondary
                  ? "secondary"
                  : onPath
                    ? "path"
                    : "dim";
            const x = node.x - NODE_W / 2;
            const y = node.y - NODE_H / 2;

            return (
              <g
                key={node.skillId}
                className={`student-graph-node ${roleClass}`}
                transform={`translate(${x} ${y})`}
                filter={isRoot || isTarget ? "url(#nodeGlow)" : undefined}
              >
                {(isRoot || isTarget) && (
                  <rect
                    className="student-graph-halo"
                    x="-6"
                    y="-6"
                    width={NODE_W + 12}
                    height={NODE_H + 12}
                    rx="16"
                  />
                )}
                <rect
                  width={NODE_W}
                  height={NODE_H}
                  rx="14"
                  className="student-graph-card"
                />
                <text x="14" y="22" className="student-graph-band">
                  {node.band}
                </text>
                <text x="14" y="40" className="student-graph-title">
                  {node.shortLabel}
                </text>
                {isRoot && (
                  <text x={NODE_W - 12} y="18" className="student-graph-badge">
                    GỐC
                  </text>
                )}
                {isTarget && !isRoot && (
                  <text x={NODE_W - 12} y="18" className="student-graph-badge">
                    ĐÍCH
                  </text>
                )}
                <title>{node.label}</title>
              </g>
            );
          })}
        </svg>
      </div>

      {!abstained && primaryCauseId && (
        <div className="student-graph-insight" role="status">
          <strong>Vì sao bắt đầu từ đây?</strong>
          <p>
            Bài hôm nay cần <b>{skillLabel(targetId)}</b>. Minh chứng cho thấy
            chỗ yếu sớm hơn là <b>{skillLabel(primaryCauseId)}</b>
            {rankedCauses.length > 1
              ? `, cùng với ${rankedCauses
                  .slice(1)
                  .map((cause) => skillLabel(cause.skill_id))
                  .join(", ")}`
              : ""}
            . Em sẽ luyện từ gốc này trước khi quay lại bài toán mục tiêu.
          </p>
        </div>
      )}
      {abstained && (
        <div className="student-graph-insight muted" role="status">
          <strong>Cần thêm một câu xác nhận</strong>
          <p>
            Đồ thị vẫn cho thấy chuỗi kiến thức của bài học. Sau câu hỏi phân
            biệt, AiLearn sẽ khoanh vùng gốc vấn đề rõ hơn.
          </p>
        </div>
      )}
    </section>
  );
}

function curvePath(x1: number, y1: number, x2: number, y2: number): string {
  const midY = (y1 + y2) / 2;
  return `M ${x1} ${y1 + NODE_H / 2 - 4} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${
    y2 - NODE_H / 2 + 4
  }`;
}
