alter table public.evidence_events
  add column confidence double precision;

alter table public.evidence_events
  add constraint evidence_events_confidence_range
  check (confidence is null or (confidence >= 0.0 and confidence <= 1.0));
