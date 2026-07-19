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
      <span className="student-demo-reset-hint">Vai demo (QA)</span>
      <div className="student-demo-reset-row">
        <select
          aria-label="Tình huống demo"
          title="Chuyển sang một vai học sinh demo dựng sẵn (dùng để giới thiệu tính năng), không phải bài làm thật của em"
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
          title="Nạp lại vai demo đã chọn từ đầu"
          onClick={onReset}
        >
          Đặt lại
        </button>
      </div>
    </div>
  );
}
