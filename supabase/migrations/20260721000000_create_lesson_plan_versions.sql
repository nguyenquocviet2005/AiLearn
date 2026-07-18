create table public.lesson_plan_versions (
  id text primary key,
  plan_id text not null,
  version integer not null check (version >= 1),
  parent_version_id text,
  decision text not null check (decision in ('pending', 'approved', 'rejected')),
  published_at timestamptz,
  created_at timestamptz not null,
  schema_version text not null check (schema_version = '1'),
  snapshot jsonb not null,
  lesson_plan jsonb not null,
  unique (plan_id, version)
);

create index lesson_plan_versions_plan_id_idx on public.lesson_plan_versions (plan_id, version desc);

alter table public.lesson_plan_versions enable row level security;
revoke all on table public.lesson_plan_versions from anon, authenticated;
grant select, insert on table public.lesson_plan_versions to service_role;
