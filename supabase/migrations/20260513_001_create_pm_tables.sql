-- PM Tracker tables: clients, sections, tasks, briefs, reports
-- Migrated from pm_crm project (separate Supabase instance)

create table public.pm_clients (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  asana_project_id text not null unique,
  status           text check (status in ('green', 'yellow', 'red')),
  created_at       timestamptz not null default now()
);

create table public.pm_sections (
  id                uuid primary key default gen_random_uuid(),
  client_id         uuid not null references public.pm_clients(id) on delete cascade,
  name              text not null,
  asana_section_id  text not null unique,
  "order"           integer,
  created_at        timestamptz not null default now()
);

create index pm_sections_client_id_idx on public.pm_sections(client_id);

create table public.pm_tasks (
  id               uuid primary key default gen_random_uuid(),
  client_id        uuid not null references public.pm_clients(id) on delete cascade,
  section_id       uuid references public.pm_sections(id) on delete set null,
  asana_task_id    text not null unique,
  name             text not null,
  assignee         text,
  start_date       date,
  due_date         date,
  completed        boolean not null default false,
  completed_at     timestamptz,
  notes            text,
  field_aprobado   text,
  field_areas      text,
  field_proceso    text,
  field_plataforma text,
  field_prioridad  text,
  created_at       timestamptz not null default now()
);

create index pm_tasks_client_id_idx on public.pm_tasks(client_id);
create index pm_tasks_section_id_idx on public.pm_tasks(section_id);

create table public.pm_briefs (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references public.pm_clients(id) on delete cascade,
  content    text not null,
  source     text not null default 'text',
  created_at timestamptz not null default now()
);

create index pm_briefs_client_id_idx on public.pm_briefs(client_id);

create table public.pm_reports (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references public.pm_clients(id) on delete cascade,
  brief_id        uuid references public.pm_briefs(id) on delete set null,
  status          text not null check (status in ('green', 'yellow', 'red')),
  summary         text,
  deviations      jsonb not null default '[]',
  risks           jsonb not null default '[]',
  recommendations jsonb not null default '[]',
  raw_response    jsonb,
  generated_at    timestamptz not null default now()
);

create index pm_reports_client_id_idx on public.pm_reports(client_id);

-- RLS
alter table public.pm_clients  enable row level security;
alter table public.pm_sections enable row level security;
alter table public.pm_tasks    enable row level security;
alter table public.pm_briefs   enable row level security;
alter table public.pm_reports  enable row level security;

-- Read policies: any authenticated user (route-level RBAC enforced by middleware)
create policy "pm_clients_select"  on public.pm_clients  for select to authenticated using (true);
create policy "pm_sections_select" on public.pm_sections for select to authenticated using (true);
create policy "pm_tasks_select"    on public.pm_tasks    for select to authenticated using (true);
create policy "pm_briefs_select"   on public.pm_briefs   for select to authenticated using (true);
create policy "pm_reports_select"  on public.pm_reports  for select to authenticated using (true);

-- Write policy: pm_briefs INSERT via browser client (BriefTab)
create policy "pm_briefs_insert"   on public.pm_briefs   for insert to authenticated with check (true);
