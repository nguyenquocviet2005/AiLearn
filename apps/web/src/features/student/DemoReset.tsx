import type { DemoPersonaSummary } from "@/lib/adapters/student-types";

export interface DemoResetProps {
  personas: DemoPersonaSummary[];
  selectedPersonaId: string;
  busy: boolean;
  onSelect: (personaId: string) => void;
  onReset: () => void;
}

export function DemoReset({
  personas,
  selectedPersonaId,
  busy,
  onSelect,
  onReset,
}: DemoResetProps) {
  if (personas.length === 0) {
    return null;
  }

  return (
    <div className="student-demo-reset">
      <select
        aria-label="Tình huống demo"
        value={selectedPersonaId}
        disabled={busy}
        onChange={(event) => onSelect(event.target.value)}
      >
        {personas.map((persona) => (
          <option key={persona.id} value={persona.id}>
            {persona.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="student-reset"
        disabled={busy}
        onClick={onReset}
      >
        Đặt lại
      </button>
    </div>
  );
}
