import { useEffect, useState } from "react";

import type { ExitTicket as ExitTicketData } from "@/lib/adapters/student-types";

export interface ExitTicketProps {
  ticket: ExitTicketData;
  busy: boolean;
  onSubmit: (ticketId: string, responseLabel: string) => void;
}

export function ExitTicket({ ticket, busy, onSubmit }: ExitTicketProps) {
  const [responseLabel, setResponseLabel] = useState<string | null>(null);

  useEffect(() => {
    setResponseLabel(null);
  }, [ticket.id]);

  return (
    <article className="student-card student-question-card">
      <span className="student-pill teal">Bài cuối</span>
      <h1>Thử một tình huống mới</h1>
      <p>{ticket.question}</p>
      <div
        className="student-options"
        role="radiogroup"
        aria-label="Chọn câu trả lời"
      >
        {ticket.options.map((option) => (
          <label
            key={option}
            className={`student-option${responseLabel === option ? " selected" : ""}`}
          >
            <input
              type="radio"
              name="exit-ticket"
              checked={responseLabel === option}
              onChange={() => setResponseLabel(option)}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
      <button
        type="button"
        className="student-btn teal"
        disabled={busy || responseLabel === null}
        onClick={() => responseLabel && onSubmit(ticket.id, responseLabel)}
      >
        Gửi bài cuối <span aria-hidden="true">→</span>
      </button>
    </article>
  );
}
