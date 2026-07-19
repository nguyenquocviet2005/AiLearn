/**
 * Student-facing knowledge graph for root-cause visualization.
 * Skill ids are matching metadata only — never render them in the UI.
 */

export interface GraphSkillNode {
  skillId: string;
  label: string;
  shortLabel: string;
  band: "Lớp dưới" | "Bài trước" | "Bài này";
  level: 1 | 2 | 3;
  /** SVG center coordinates in a 1000×560 viewBox. */
  x: number;
  y: number;
}

export interface GraphEdge {
  from: string;
  to: string;
}

/** Curated subgraph around the Grade-7 inverse-proportion lesson target. */
export const GRAPH_SKILLS: readonly GraphSkillNode[] = [
  {
    skillId: "skill_ratio_proportion_basics",
    label: "Tỉ số & tỉ lệ thức",
    shortLabel: "Tỉ số",
    band: "Lớp dưới",
    level: 1,
    x: 160,
    y: 96,
  },
  {
    skillId: "skill_fraction_multiplication",
    label: "Nhân chia số hữu tỉ",
    shortLabel: "Phân số",
    band: "Lớp dưới",
    level: 1,
    x: 500,
    y: 72,
  },
  {
    skillId: "skill_direct_proportion",
    label: "Tỉ lệ thuận y = kx",
    shortLabel: "Tỉ lệ thuận",
    band: "Bài trước",
    level: 1,
    x: 340,
    y: 188,
  },
  {
    skillId: "skill_inverse_proportion_definition",
    label: "Định nghĩa tỉ lệ nghịch",
    shortLabel: "Định nghĩa",
    band: "Bài này",
    level: 2,
    x: 250,
    y: 300,
  },
  {
    skillId: "skill_find_constant_k",
    label: "Tìm hệ số tỉ lệ k",
    shortLabel: "Tìm k",
    band: "Bài này",
    level: 2,
    x: 430,
    y: 300,
  },
  {
    skillId: "skill_equal_ratios_property",
    label: "Dãy tỉ số bằng nhau",
    shortLabel: "Tỉ số bằng nhau",
    band: "Bài này",
    level: 2,
    x: 120,
    y: 412,
  },
  {
    skillId: "skill_distinguish_direct_inverse",
    label: "Phân biệt thuận / nghịch",
    shortLabel: "Phân biệt",
    band: "Bài này",
    level: 2,
    x: 300,
    y: 412,
  },
  {
    skillId: "skill_solve_unknown_value",
    label: "Tìm giá trị chưa biết",
    shortLabel: "Tìm ẩn",
    band: "Bài này",
    level: 2,
    x: 520,
    y: 412,
  },
  {
    skillId: "skill_word_problem_work_rate",
    label: "Bài toán năng suất & thời gian",
    shortLabel: "Năng suất",
    band: "Bài này",
    level: 3,
    x: 500,
    y: 520,
  },
] as const;

export const GRAPH_EDGES: readonly GraphEdge[] = [
  { from: "skill_ratio_proportion_basics", to: "skill_direct_proportion" },
  {
    from: "skill_ratio_proportion_basics",
    to: "skill_inverse_proportion_definition",
  },
  {
    from: "skill_direct_proportion",
    to: "skill_inverse_proportion_definition",
  },
  { from: "skill_direct_proportion", to: "skill_distinguish_direct_inverse" },
  {
    from: "skill_inverse_proportion_definition",
    to: "skill_find_constant_k",
  },
  {
    from: "skill_inverse_proportion_definition",
    to: "skill_distinguish_direct_inverse",
  },
  {
    from: "skill_inverse_proportion_definition",
    to: "skill_equal_ratios_property",
  },
  { from: "skill_ratio_proportion_basics", to: "skill_equal_ratios_property" },
  { from: "skill_find_constant_k", to: "skill_solve_unknown_value" },
  { from: "skill_fraction_multiplication", to: "skill_solve_unknown_value" },
  {
    from: "skill_solve_unknown_value",
    to: "skill_word_problem_work_rate",
  },
  {
    from: "skill_distinguish_direct_inverse",
    to: "skill_word_problem_work_rate",
  },
  {
    from: "skill_equal_ratios_property",
    to: "skill_word_problem_work_rate",
  },
] as const;

export const GRAPH_TARGET_SKILL_ID = "skill_word_problem_work_rate";

export function skillLabel(skillId: string): string {
  return (
    GRAPH_SKILLS.find((node) => node.skillId === skillId)?.label ??
    "Khái niệm liên quan"
  );
}

/** Ancestors of `skillId` within the curated graph (not including itself). */
export function graphAncestors(skillId: string): Set<string> {
  const prereq = new Map<string, string[]>();
  for (const edge of GRAPH_EDGES) {
    const list = prereq.get(edge.to) ?? [];
    list.push(edge.from);
    prereq.set(edge.to, list);
  }
  const result = new Set<string>();
  const stack = [...(prereq.get(skillId) ?? [])];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || result.has(current)) {
      continue;
    }
    result.add(current);
    stack.push(...(prereq.get(current) ?? []));
  }
  return result;
}

/** Critical path edges from root cause up to the lesson target. */
export function criticalPathEdges(
  rootCauseSkillId: string | null,
  targetSkillId: string = GRAPH_TARGET_SKILL_ID,
): Set<string> {
  if (!rootCauseSkillId) {
    return new Set();
  }
  const children = new Map<string, string[]>();
  for (const edge of GRAPH_EDGES) {
    const list = children.get(edge.from) ?? [];
    list.push(edge.to);
    children.set(edge.from, list);
  }

  // BFS path root -> target; keep first path found preferring shorter hops.
  const queue: string[][] = [[rootCauseSkillId]];
  const seen = new Set<string>([rootCauseSkillId]);
  while (queue.length > 0) {
    const path = queue.shift();
    if (!path) {
      break;
    }
    const last = path[path.length - 1];
    if (last === targetSkillId) {
      const edgeKeys = new Set<string>();
      for (let index = 0; index < path.length - 1; index += 1) {
        edgeKeys.add(`${path[index]}->${path[index + 1]}`);
      }
      return edgeKeys;
    }
    for (const next of children.get(last) ?? []) {
      if (seen.has(next)) {
        continue;
      }
      seen.add(next);
      queue.push([...path, next]);
    }
  }
  return new Set();
}

export function edgeKey(from: string, to: string): string {
  return `${from}->${to}`;
}
