const STORAGE_KEY = "ailearn.student.activeLearner.v1";

export interface ActiveLearner {
  id: string;
  displayName: string;
  personaId?: string;
}

export function readActiveLearner(): ActiveLearner | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const learner = JSON.parse(raw) as Partial<ActiveLearner>;
    if (
      typeof learner.id !== "string" ||
      learner.id.length === 0 ||
      typeof learner.displayName !== "string" ||
      learner.displayName.length === 0 ||
      (learner.personaId !== undefined && typeof learner.personaId !== "string")
    ) {
      return null;
    }
    return learner as ActiveLearner;
  } catch {
    return null;
  }
}

export function saveActiveLearner(learner: ActiveLearner): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(learner));
}
