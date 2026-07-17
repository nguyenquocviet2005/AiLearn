create table public.system_status (
  id text primary key,
  status text not null check (status in ('operational', 'degraded', 'maintenance')),
  checked_at timestamptz not null default now(),
  constraint system_status_singleton check (id = 'platform')
);

alter table public.system_status enable row level security;

revoke all on table public.system_status from anon, authenticated;
grant select on table public.system_status to service_role;

insert into public.system_status (id, status)
values ('platform', 'operational');
