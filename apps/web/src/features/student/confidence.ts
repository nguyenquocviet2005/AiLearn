export type ConfidenceLevel = "high" | "mid" | "guess";

export const CONFIDENCE_LEVELS: ConfidenceLevel[] = ["high", "mid", "guess"];

export const CONFIDENCE_LABELS: Record<ConfidenceLevel, string> = {
  high: "Em giải thích được",
  mid: "Em chưa chắc",
  guess: "Em đang đoán",
};

const CONFIDENCE_SCALE: Record<ConfidenceLevel, number> = {
  high: 0.9,
  mid: 0.6,
  guess: 0.3,
};

export function confidenceLevelToValue(level: ConfidenceLevel): number {
  return CONFIDENCE_SCALE[level];
}
