create table public.evidence_events (
  id text primary key,
  schema_version text not null check (schema_version = '1'),
  student_id text not null,
  session_id text not null,
  skill_id text not null,
  item_id text not null,
  is_correct boolean not null,
  recorded_at timestamptz not null,
  lesson_id text,
  response_label text,
  created_at timestamptz not null default now()
);

create index evidence_events_student_id_idx on public.evidence_events (student_id);
create index evidence_events_session_id_idx on public.evidence_events (session_id);

alter table public.evidence_events enable row level security;

revoke all on table public.evidence_events from anon, authenticated;
grant select, insert on table public.evidence_events to service_role;
