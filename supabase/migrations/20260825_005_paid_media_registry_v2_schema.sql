-- Paid Media Registry v2 — schema widening (T1, design D-A / D-E).
--
-- Four independent additions, one transaction:
--   1. Accent-insensitive search: `unaccent` + `pm_unaccent()` wrapper +
--      `search_text` generated column (D-E). The 1-arg `unaccent(text)` is
--      only STABLE (it resolves the default dictionary at call time), so
--      Postgres refuses it inside a generated column; the wrapper pins the
--      2-arg `unaccent(regdictionary, text)` form, which is IMMUTABLE.
--   2. `platform` CHECK widened to accept `linkedin` (previously meta/google/
--      tiktok only).
--   3. `funding_method` becomes an open, seeded lookup table instead of the
--      closed two-value CHECK from 20260821_003 — a sixth value is then a
--      single admin INSERT, not a migration + deploy (mirrors
--      `ad_account_management_status`). Keys are a 1:1 transliteration of
--      the Excel strings (design D-A): never an interpretation, so the seed
--      is safe without resolving what the near-duplicate pairs mean.
--   4. `monthly_budget_note` (new, free text) so budget keeps its numeric
--      column and gains a text escape hatch; and `currency` CONSTRAINED to
--      ARS/USD with an ARS default — that column already existed (Meta's own
--      account currency), so it is tightened, not added. It replaces the
--      three UI sites that used to hardcode USD.
--
-- Seed precedes the FK swap on purpose: the FK would reject any row already
-- pointing at a key that is not yet seeded.
--
-- Two premises in the spec were stale against the real database, and both are
-- handled in place below rather than by a follow-up migration: `funding_method`
-- was not all-NULL (demo data), and `currency` was not a new column.
begin;

-- ---------------------------------------------------------------------------
-- 1. Accent-insensitive search (D-E)
-- ---------------------------------------------------------------------------
create extension if not exists unaccent with schema extensions;

create function public.pm_unaccent(text) returns text
  language sql immutable parallel safe strict as
$$ select extensions.unaccent('extensions.unaccent'::regdictionary, $1) $$;

alter table public.ad_accounts
  add column search_text text
    generated always as (
      lower(public.pm_unaccent(coalesce(client_name, '') || ' ' || coalesce(name, '')))
    ) stored;

-- ---------------------------------------------------------------------------
-- 2. Platform: allow LinkedIn
-- ---------------------------------------------------------------------------
alter table public.ad_accounts
  drop constraint ad_accounts_platform_check;

alter table public.ad_accounts
  add constraint ad_accounts_platform_check
    check (platform in ('meta', 'google', 'tiktok', 'linkedin'));

-- ---------------------------------------------------------------------------
-- 3. funding_method: CHECK → seeded lookup table (design D-A)
-- ---------------------------------------------------------------------------
create table public.ad_account_funding_method (
  key         text primary key,
  label       text not null unique,
  sort_order  int  not null,
  is_active   boolean not null default true
);

alter table public.ad_account_funding_method enable row level security;

create policy ad_account_funding_method_select_authenticated
  on public.ad_account_funding_method
  for select
  to authenticated
  using (true);

insert into public.ad_account_funding_method (key, label, sort_order, is_active) values
  ('con_linea',          'Con línea',          1, true),
  ('tarjeta',            'Tarjeta',            2, true),
  ('sin_linea',          'Sin línea',          3, true),
  ('linea_del_cliente',  'Línea del cliente',  4, true),
  ('tarjeta_de_credito', 'Tarjeta de crédito', 5, true);

-- Clear `funding_method` before the swap.
--
-- The spec assumed all 22 rows were NULL here. That was true when it was
-- written, and went stale on 2026-08-24 when demo data was written into 7
-- real rows (Amsterdam x2, BIOBEN, CEMED, HOTEL ACAPULCO, VIVIERA, TALLON).
-- Those rows carry the OLD CHECK's values — 4 say `linea_credito`, which
-- does not exist in the seed above, so the FK below rejects them and the
-- whole migration aborts.
--
-- `20260825_006` step 1 already nulls these same 7 rows; this just does that
-- one column two minutes earlier, because the constraint cannot wait for it.
-- Nothing real is lost: every non-NULL value here is fictional demo data.
-- Written as a blanket UPDATE rather than an id list so it stays correct if
-- more demo rows appeared since.
update public.ad_accounts
set funding_method = null
where funding_method is not null;

alter table public.ad_accounts
  drop constraint ad_accounts_funding_method_check;

alter table public.ad_accounts
  add constraint ad_accounts_funding_method_fkey
    foreign key (funding_method)
    references public.ad_account_funding_method (key)
    on delete restrict;

-- ---------------------------------------------------------------------------
-- 4. Budget note + currency
-- ---------------------------------------------------------------------------
alter table public.ad_accounts
  add column monthly_budget_note text;

-- `currency` is NOT a new column. The spec said `ad_accounts` "MUST gain" one;
-- it already had it, from the original Meta sync table (it is Meta's own
-- account currency). Adding it again fails outright.
--
-- So this constrains what is already there instead. It happens to hold exactly
-- what D4 asked for: all 22 rows are already 'ARS'. The backfill below is
-- therefore a no-op today and exists only so the NOT NULL cannot fail on a row
-- the Meta sync inserts later without one.
update public.ad_accounts
set currency = 'ARS'
where currency is null;

alter table public.ad_accounts
  alter column currency set default 'ARS',
  alter column currency set not null;

alter table public.ad_accounts
  add constraint ad_accounts_currency_check
    check (currency in ('ARS', 'USD'));

commit;
