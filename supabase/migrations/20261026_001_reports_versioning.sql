-- Reports versioning (S0 of paid-media-reporte-completo).
-- Adds report_type / version / platform / report_data and the `draft_ready`
-- status. Additive (expand step): the legacy UNIQUE(account_id, period_year,
-- period_month) stays in place until the S3 cutover migration drops it, so
-- the live small-report flow keeps working untouched.
begin;

-- Baseline: `reports` was created by hand in production. This block only runs
-- on a fresh database and is a no-op where the table already exists.
do $$ begin
  if to_regclass('public.reports') is null then
    create table public.reports (
      id uuid primary key default gen_random_uuid(),
      account_id text not null references public.ad_accounts(id),
      account_name text not null,
      period_year int not null,
      period_month int not null,
      status text not null default 'pending',
      report_url text, pdf_url text, error text, error_detail jsonb, manifest jsonb,
      requested_by uuid references auth.users(id),
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique (account_id, period_year, period_month)
    );
    alter table public.reports enable row level security;
    create policy reports_select on public.reports for select to authenticated
      using ((select public.is_admin_global()) or (select public.is_paid_media()));
    create policy reports_insert on public.reports for insert to authenticated
      with check ((select public.is_admin_global()) or (select public.is_paid_media()));
  end if;
end $$;

alter table public.reports
  add column report_type text not null default 'summary'
    constraint reports_report_type_check check (report_type in ('summary','complete')),
  add column version smallint not null default 1
    constraint reports_version_check check (version >= 1),
  add column platform text not null default 'meta',
  add column report_data jsonb;

-- Widen the status CHECK. The live constraint name is unknown (table was
-- created by hand), so drop whichever CHECK mentions `status`.
do $$ declare c text; begin
  for c in select conname from pg_constraint
    where conrelid = 'public.reports'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%' loop
    execute format('alter table public.reports drop constraint %I', c);
  end loop;
end $$;

alter table public.reports
  add constraint reports_status_check
    check (status in ('pending','running','draft_ready','done','error')),
  add constraint reports_draft_ready_complete
    check (status <> 'draft_ready' or report_type = 'complete'),
  add constraint reports_summary_v1
    check (report_type <> 'summary' or version = 1);

-- New identity key. Non-partial on purpose: the summary upsert in
-- /api/reportes uses it as its ON CONFLICT arbiter.
create unique index reports_period_type_version_uidx
  on public.reports (account_id, period_year, period_month, report_type, version);

commit;
