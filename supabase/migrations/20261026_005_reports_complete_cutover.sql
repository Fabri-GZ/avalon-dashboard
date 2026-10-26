-- S3 cutover (contract step): complete reports need several rows per
-- (account, year, month), so the legacy 3-column unique key must go. The
-- 5-column key reports_period_type_version_uidx (S0) already guards uniqueness
-- per (account, period, type, version).
--
-- IRREVERSIBLE once complete rows exist: re-adding the 3-column unique key would
-- fail on the duplicates. Apply it right before deploying the S3 app code.
--
-- Idempotent: the constraint name is discovered by definition (the table was
-- created by hand), so re-running is a no-op.
begin;

do $$
declare
  c text;
begin
  for c in
    select conname
      from pg_constraint
     where conrelid = 'public.reports'::regclass
       and contype = 'u'
       and pg_get_constraintdef(oid) = 'UNIQUE (account_id, period_year, period_month)'
  loop
    execute format('alter table public.reports drop constraint %I', c);
  end loop;
end $$;

-- One in-flight complete generation per account+period: a double click or two
-- tabs get a 23505 that the route maps to "in_progress".
create unique index if not exists reports_complete_one_active_uidx
  on public.reports (account_id, period_year, period_month)
  where report_type = 'complete' and status in ('pending', 'running');

commit;
