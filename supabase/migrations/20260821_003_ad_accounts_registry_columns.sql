-- Slice (b) of the paid media account registry: remaining registry columns.
--
-- All additive and nullable — no data is populated here. The initial load
-- for the 22 existing rows is a separate, user-executed migration
-- (20260821_004, out of scope for this slice).
--
-- `management_status` FKs to the lookup table created in
-- 20260821_002_ad_account_management_status.sql. `on delete restrict`: a
-- status in use cannot be deleted out from under the rows that reference it
-- (retire it via `is_active = false` instead).
--
-- `funding_method` stays a CHECK, not a lookup (D2, settled): it is a closed
-- two-value list confirmed by the user, unlike the open-ended status axis.
--
-- `deleted_at` backs soft delete (slice d). The partial index only covers
-- active rows because that is the only lookup pattern the Clientes list
-- uses (`.is('deleted_at', null)`); there are 22 rows total, so an index on
-- `deleted_at` alone would add cost without a query to justify it.
alter table public.ad_accounts
  add column management_status text references public.ad_account_management_status(key) on delete restrict,
  add column funding_method    text check (funding_method in ('linea_credito', 'tarjeta')),
  add column client_name       text,
  add column pm_name           text,
  add column operator_name     text,
  add column geo               text,
  add column strategy_url      text,
  add column notes             text,
  add column website_url       text,
  add column instagram_url     text,
  add column monthly_budget    numeric check (monthly_budget >= 0),
  add column deleted_at        timestamptz;

create index ad_accounts_client_name_active_idx
  on public.ad_accounts (client_name)
  where deleted_at is null;
