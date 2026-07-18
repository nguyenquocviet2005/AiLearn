create table public.students (
  id text primary key,
  display_name text not null,
  class_id text not null,
  created_at timestamptz not null default now()
);

create index students_class_id_idx on public.students (class_id);

alter table public.students enable row level security;

revoke all on table public.students from anon, authenticated;
grant select, insert on table public.students to service_role;
