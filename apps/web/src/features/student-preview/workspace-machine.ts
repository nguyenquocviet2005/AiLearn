import type { StudentDiagnosticProfileV1 } from "@ailearn/schemas";

import type { Stage } from "@/features/student/StudentWorkspace";
import type { ActiveLearner } from "@/lib/offline/active-learner";
import type {
  DemoPersonaSummary,
  ExitTicketOutcome,
  RemediationResponse,
  StartSessionResponse,
} from "@/lib/adapters/student-types";

/**
 * The redesigned student-flow state machine: every transition is an
 * explicit, typed event handled by one pure `previewReducer`, instead of
 * the ~15 scattered `setStage(...)` calls in the current
 * `StudentWorkspace.tsx`. `Stage` (the per-screen state shape) is reused
 * as-is from the real component — the bug there was never the shape of
 * the states, it was that nothing centralized the transitions between
 * them.
 */

export type TabId = "home" | "readiness" | "path" | "help";

export interface PreviewState {
  activeTab: TabId;
  stage: Stage;
  currentStudent: ActiveLearner;
  personas: DemoPersonaSummary[];
  selectedPersonaId: string;
  busy: boolean;
  initialRepresentation: string | null;
}

export type PreviewAction =
  | { type: "SET_ACTIVE_TAB"; tab: TabId }
  | { type: "SET_BUSY"; busy: boolean }
  | {
      type: "PERSONAS_LOADED";
      personas: DemoPersonaSummary[];
      selectedPersonaId: string;
    }
  | { type: "SELECT_PERSONA"; personaId: string }
  | { type: "READINESS_STARTED"; session: StartSessionResponse }
  | { type: "READINESS_ANSWERED"; nextIndex: number }
  | { type: "DIAGNOSING_STARTED" }
  | {
      type: "PROBE_STARTED";
      remediation: RemediationResponse;
      profile: StudentDiagnosticProfileV1;
      probeSession: StartSessionResponse;
    }
  | {
      type: "REMEDIATION_RESOLVED" | "REMEDIATION_UPDATED";
      remediation: RemediationResponse;
      profile: StudentDiagnosticProfileV1;
    }
  | {
      type: "EXIT_TICKET_RESULT";
      outcome: ExitTicketOutcome;
      remediation: RemediationResponse;
    }
  | { type: "CONTINUE_RECLASSIFIED" }
  | {
      type: "DEMO_RESET";
      learner: ActiveLearner;
      remediation: RemediationResponse;
      profile: StudentDiagnosticProfileV1;
    }
  | {
      type: "DEMO_RESET_TO_PROBE";
      learner: ActiveLearner;
      remediation: RemediationResponse;
      profile: StudentDiagnosticProfileV1;
      probeSession: StartSessionResponse;
    }
  | { type: "ERROR"; message: string };

export function initialPreviewState(learner: ActiveLearner): PreviewState {
  return {
    activeTab: "home",
    stage: { kind: "idle" },
    currentStudent: learner,
    personas: [],
    selectedPersonaId: "",
    busy: false,
    initialRepresentation: null,
  };
}

export function previewReducer(
  state: PreviewState,
  action: PreviewAction,
): PreviewState {
  switch (action.type) {
    case "SET_ACTIVE_TAB":
      return { ...state, activeTab: action.tab };

    case "SET_BUSY":
      return { ...state, busy: action.busy };

    case "PERSONAS_LOADED":
      return {
        ...state,
        personas: action.personas,
        selectedPersonaId: action.selectedPersonaId,
      };

    case "SELECT_PERSONA":
      return { ...state, selectedPersonaId: action.personaId };

    case "READINESS_STARTED":
      return {
        ...state,
        stage: { kind: "readiness", session: action.session, currentIndex: 0 },
        activeTab: "readiness",
        busy: false,
      };

    case "READINESS_ANSWERED": {
      if (state.stage.kind !== "readiness") {
        return state;
      }
      if (action.nextIndex < state.stage.session.items.length) {
        return {
          ...state,
          stage: {
            kind: "readiness",
            session: state.stage.session,
            currentIndex: action.nextIndex,
          },
        };
      }
      return { ...state, stage: { kind: "diagnosing" } };
    }

    case "DIAGNOSING_STARTED":
      return { ...state, stage: { kind: "diagnosing" } };

    case "PROBE_STARTED":
      return {
        ...state,
        stage: {
          kind: "probe",
          remediation: action.remediation,
          profile: action.profile,
          probeSession: action.probeSession,
        },
        activeTab: "readiness",
      };

    case "REMEDIATION_RESOLVED":
    case "REMEDIATION_UPDATED": {
      const { remediation, profile } = action;
      const stage: Stage = remediation.is_complete
        ? { kind: "exit-ticket", remediation, profile }
        : { kind: "remediation", remediation, profile };
      return {
        ...state,
        stage,
        activeTab: action.type === "REMEDIATION_RESOLVED" ? "path" : state.activeTab,
        initialRepresentation:
          state.initialRepresentation ?? remediation.path.representation,
      };
    }

    case "EXIT_TICKET_RESULT":
      return {
        ...state,
        stage: {
          kind: "exit-ticket-result",
          remediation: action.remediation,
          outcome: action.outcome,
          nextProfile: action.outcome.reclassified_profile,
        },
      };

    case "CONTINUE_RECLASSIFIED": {
      if (state.stage.kind !== "exit-ticket-result" || !state.stage.nextProfile) {
        return state;
      }
      const remediation = state.stage.remediation;
      return {
        ...state,
        stage: {
          kind: "remediation",
          remediation,
          profile: state.stage.nextProfile,
        },
        initialRepresentation: remediation.path.representation,
      };
    }

    case "DEMO_RESET": {
      const { remediation, profile, learner } = action;
      const stage: Stage = remediation.is_complete
        ? { kind: "exit-ticket", remediation, profile }
        : { kind: "remediation", remediation, profile };
      return {
        ...state,
        currentStudent: learner,
        stage,
        activeTab: "path",
        busy: false,
        initialRepresentation: remediation.path.representation,
      };
    }

    case "DEMO_RESET_TO_PROBE":
      return {
        ...state,
        currentStudent: action.learner,
        stage: {
          kind: "probe",
          remediation: action.remediation,
          profile: action.profile,
          probeSession: action.probeSession,
        },
        activeTab: "readiness",
        busy: false,
      };

    case "ERROR":
      return { ...state, stage: { kind: "error", message: action.message }, busy: false };

    default:
      return state;
  }
}
