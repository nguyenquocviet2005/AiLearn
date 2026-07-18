create table public.diagnostic_sessions (
  id text primary key,
  student_id text not null,
  lesson_id text not null,
  target_skill_id text not null,
  item_ids jsonb not null,
  created_at timestamptz not null default now()
);

create index diagnostic_sessions_student_id_idx
  on public.diagnostic_sessions (student_id, lesson_id);

create table public.remediation_sessions (
  student_id text primary key,
  state jsonb not null,
  processed_attempts jsonb not null default '{}'::jsonb,
  processed_exit_tickets jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.diagnostic_sessions enable row level security;
alter table public.remediation_sessions enable row level security;

revoke all on table public.diagnostic_sessions from anon, authenticated;
revoke all on table public.remediation_sessions from anon, authenticated;

grant select, insert on table public.diagnostic_sessions to service_role;
grant select, insert, update on table public.remediation_sessions to service_role;
