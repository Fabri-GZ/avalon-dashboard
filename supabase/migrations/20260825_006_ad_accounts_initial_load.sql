-- Slice (e) of the paid media account registry: initial load of the 22
-- existing ad accounts.
--
-- READ THIS BEFORE APPLYING. This migration is meant to be reviewed and
-- edited first, not run blind. One section still needs a human decision,
-- marked CONFIRM below (Step 2's two ⚠️ Amsterdam name checks).
--
-- Scope, and what is deliberately NOT here:
--   * `client_name` is populated for 21 of 22 accounts: the 14 that already
--     carried a `pm_client_id` (Step 2), plus 7 orphans matched to the
--     Excel by `act_id` (Step 3). Only SEPINO stays unassigned.
--   * `pm_name`, `operator_name`, `management_status` and `funding_method`
--     are populated for the 16 accounts with a traceable `act_id` row in
--     the Excel (Step 4). The other 6 (both Amsterdam accounts, BIOBEN,
--     MANSILLA CARD, VIVIERA, SEPINO) have no such row and stay NULL —
--     fill via UI once known.
--   * `monthly_budget`, `geo` and `strategy_url` are NOT populated for
--     anyone — explicitly out of scope for this migration (spec).
--   * Step 4b then overrides `management_status` to 'pausado' for the 4
--     accounts lost this month (per the Avalon group message of 2026-08-25,
--     which is newer than the spreadsheet). They stay in the registry.
--   * SEPINO is left with a NULL `client_name` on purpose — it has no
--     `act_id` anywhere in the Excel (design decision D6). It is the input
--     for the "Cuentas sin asignar" table.
--
-- The whole file is idempotent: re-running it produces the same state.
--
-- *** APPLY PHASE — sdd-apply, paid-media-registry-v2, T2 (RESOLVED 2026-08-25) ***
-- The 7 orphans were matched against the Excel by `act_id`, not by
-- `ad_accounts.name` as originally planned — the live DB rows were pulled
-- for this session, and matching on the numeric id sidesteps every name
-- typo/casing mismatch that made the name-match plan risky in the first
-- place. Only 16 of the 22 accounts have a traceable `act_id` row in the
-- Excel (`ESTADO DE CUENTAS FACEBOOK`, column `Cuenta`); those 16 get
-- `pm_name`/`operator_name`/`management_status`/`funding_method` below —
-- the other 6 (both Amsterdam accounts, BIOBEN, MANSILLA CARD, VIVIERA,
-- SEPINO) have no `act_id` row in the sheet and stay NULL on those four
-- columns, same as before — fill via UI once known.
--
-- ⚠️ CEMED (`act_1476590597429959`) appears twice in the Excel with
-- different values: row with the `act_id` says Activo/Sabi/SALMI; a second,
-- id-less row says Pausado/Seba, dated later in its own note. The id-less
-- row is not traceably this account, so the id-bearing row wins here — but
-- if Ivo says CEMED is actually paused, that second row is why.
--
-- `monthly_budget`, `monthly_budget_note` and `currency` remain untouched,
-- as scoped (spec: "migration leaves budget columns untouched").

begin;

-- ---------------------------------------------------------------------------
-- Step 1 — clear the demo data written on 2026-08-24
-- ---------------------------------------------------------------------------
-- Seven real rows were filled with fictional values to make the Clientes
-- screen reviewable while it had no data at all. This undoes that, so the
-- real load below starts from the same blank slate the table had before.
--
-- `match_confidence` is restored to its pre-demo value: the demo set all
-- seven to 'manual', but five of them were 'exact'.
update public.ad_accounts set
  client_name       = null,
  pm_name           = null,
  operator_name     = null,
  management_status = null,
  funding_method    = null,
  monthly_budget    = null
where id in (
  'act_174708067923340',   -- Amsterdam Importador
  'act_142385057910346',   -- Amsterdam Importador 2
  'act_790363710428812',   -- BIOBEN
  'act_1476590597429959',  -- CEMED
  'act_2548292108801414',  -- HOTEL ACAPULCO
  'act_483838199392485',   -- VIVIERA
  'act_2389931344859869'   -- TALLON
);

update public.ad_accounts set match_confidence = 'exact'
where id in (
  'act_790363710428812',   -- BIOBEN
  'act_1476590597429959',  -- CEMED
  'act_2548292108801414',  -- HOTEL ACAPULCO
  'act_483838199392485',   -- VIVIERA
  'act_2389931344859869'   -- TALLON
);

-- ---------------------------------------------------------------------------
-- Step 2 — CONFIRM: the client name of each linked account
-- ---------------------------------------------------------------------------
-- These 14 accounts already point at a `pm_clients` row, so the link itself
-- is not in question — only the name to display.
--
-- The names are written out one by one instead of derived from
-- `pm_clients.name`, because Asana's names do not match the account names
-- and several are wrong at the source: trailing spaces ('SISTER SRL ',
-- 'GRUPO NORTE '), a typo ('Amsterdamn'), and a missing apostrophe
-- ('D BENEDETTO Constructora'). Deriving would carry all of that into the
-- screen; this way the value is a decision, not an accident.
--
-- Two rows marked ⚠️ still need confirmation before applying (the third,
-- Las Mercedes, was resolved per the paid media Excel during apply). The
-- rest match their Asana name closely enough to be safe.
update public.ad_accounts as a
set client_name = d.client_name
from (values
  -- account id              account name               → client_name
  ('act_174708067923340',  'Amsterdam Importador'),   -- ⚠️ Asana says 'Amsterdamn' (typo). Both accounts share this name so they group into one row.
  ('act_142385057910346',  'Amsterdam Importador'),   -- ⚠️ same client, second account — this is the 1→N case
  ('act_705572891993970',  'Las Mercedes'),           -- Corrected per Excel (`AVALON - Equipo paid media RRSS.xlsx`, "SOLICITUD DE SALDO"/"ESTADO DE CUENTAS FACEBOOK" both say LAS MERCEDES) — was 'La Merced' (typo).
  ('act_790363710428812',  'Bioben'),
  ('act_1476590597429959', 'Cemed'),
  ('act_1205564487597887', 'D''Benedetto Constructora'),
  ('act_853553054469285',  'Garden Free'),
  ('act_1230943727046679', 'Garzón Deco'),
  ('act_1964249130841911', 'Grupo Norte'),            -- matches clients.company_name
  ('act_2548292108801414', 'Hotel Acapulco'),
  ('act_1340872592673718', 'Mansilla Cards'),
  ('act_868338656152291',  'Sister SRL'),
  ('act_2389931344859869', 'Tallón'),
  ('act_483838199392485',  'Viviera')
) as d(id, client_name)
where a.id = d.id;

-- ---------------------------------------------------------------------------
-- Step 3 — the 7 orphans, matched to the Excel by `act_id`
-- ---------------------------------------------------------------------------
-- Matched on the numeric `act_id` in the Excel's `Cuenta` column, not on
-- `name` — sidesteps every casing/typo mismatch a name match would hit.
-- SEPINO is deliberately absent: no `act_id` row for it exists anywhere in
-- the sheet, so it stays unassigned (design decision D6).
update public.ad_accounts as a
set client_name = d.client_name
from (values
  -- account id              account name       → client_name (Title Case, per Excel spelling)
  ('act_2426806337812106', 'ASISCOM',          'Asiscom'),
  ('act_492132878573646',  'AVALON3',          'Avalon Agency'),   -- Excel: 'AVALON AGENCY'
  ('act_1316587363707253', 'BOMBEROS 3F',      'Bomberos 3F'),
  ('act_1405613141237143', 'DECOPOINT',        'Decopoint'),
  ('act_523824768788517',  'LAS VICAS',        'Las Vicas'),
  ('act_334528044691915',  'MARIA LUJAN',      'Maria Luján'),     
  ('act_1338675640722091', 'Open Pilar',       'Openn Pilar')      -- Excel: 'OPENN PILAR'
) as d(id, expected_name, client_name)
where a.id = d.id;

-- ---------------------------------------------------------------------------
-- Step 4 — PM / operador / estado / forma de pago for the 16 accounts with
-- a traceable `act_id` row in the Excel (9 already-linked + these 7 orphans)
-- ---------------------------------------------------------------------------
-- `management_status` keys come from the pre-existing `ad_account_management_status`
-- lookup (nuevo_cliente / activo / pausado / esperar_confirmacion / pendiente /
-- saldo_agregado / cuenta_creada / activa_cuenta_prepaga).
-- `funding_method` keys come from T1's `ad_account_funding_method` seed
-- (con_linea / tarjeta / sin_linea / linea_del_cliente / tarjeta_de_credito).
-- Every one of these 16 rows says "Con Linea" in the Excel → con_linea.
update public.ad_accounts as a
set
  pm_name           = d.pm_name,
  operator_name     = d.operator_name,
  management_status = d.management_status,
  funding_method    = d.funding_method
from (values
  -- account id              pm       operator   management_status   funding_method
  ('act_2426806337812106', 'CARO',  'Gus',   'activo',   'con_linea'),  -- ASISCOM
  ('act_492132878573646',  'GER',   'Ivan',  'activo',   'con_linea'),  -- AVALON3 / Avalon Agency
  ('act_1316587363707253', 'GER',   'Gus',   'activo',   'con_linea'),  -- BOMBEROS 3F
  ('act_1476590597429959', 'SALMI', 'Sabi',  'pausado',   'con_linea'),  -- CEMED — see ⚠️ above, conflicting id-less row says Pausado/Seba
  ('act_1405613141237143', 'LUCAS', 'Gus',   'pausado',  'con_linea'),  -- DECOPOINT
  ('act_853553054469285',  'SALMI', 'Gus',   'activo',   'con_linea'),  -- GARDEN FREE
  ('act_1230943727046679', 'SALMI', 'Ivan',  'activo',   'con_linea'),  -- GARZÓN DECO
  ('act_1964249130841911', 'LUCAS', 'Ivan',  'activo',   'con_linea'),  -- GRUPO NORTE LINEA
  ('act_2548292108801414', 'LUCAS', 'Sabi',  'activo',   'con_linea'),  -- HOTEL ACAPULCO
  ('act_705572891993970',  'LUCAS', 'Ivan',  'pausado',  'con_linea'),  -- Las Mercedes
  ('act_523824768788517',  'IVAN',  'Ivan',  'activo',   'con_linea'),  -- LAS VICAS
  ('act_334528044691915',  'SALMI', 'Ivan',  'activo',   'con_linea'),  -- MARIA LUJAN
  ('act_868338656152291',  'LUCAS', 'Sabi',  'activo',   'con_linea'),  -- SISTER
  ('act_2389931344859869', 'SALMI', 'Ivan',  'pausado',  'con_linea'),  -- TALLON
  ('act_1205564487597887', 'LUCAS', 'Gus',   'pausado',  'con_linea'),  -- D'BENEDETTO CONSTRUCTORA
  ('act_1338675640722091', 'GER',   'Ivan',  'pausado',  'con_linea')   -- Open Pilar / Openn Pilar
) as d(id, pm_name, operator_name, management_status, funding_method)
where a.id = d.id;

-- ---------------------------------------------------------------------------
-- Step 4b — churn correction: 4 accounts lost this month
-- ---------------------------------------------------------------------------
-- Source: Avalon group message, 2026-08-25 — NOT the Excel. This runs after
-- Step 4 on purpose: the spreadsheet is a snapshot and this is newer, so it
-- overrides. LAS VICAS is the visible case — the Excel still lists it
-- 'activo'; loading that unchanged would have put a lost client on screen as
-- an active one.
--
-- Only `management_status` is touched. These stay in the registry, visible
-- and reversible — deliberately NOT soft-deleted via `deleted_at`, since a
-- pause can be undone from the UI and a delete currently cannot (the trash /
-- restore UI is slice (d), still unbuilt).
--
-- Amsterdam's two accounts get their status from this message alone. Their
-- PM / operator / funding stay NULL: the sheet's AMSTERDAMN rows carry no
-- `act_id`, and one sheet row cannot be split across two real accounts
-- without guessing which is which.
--
-- The 4th loss reported, MPF Impresos, is absent here on purpose: it has no
-- row in `ad_accounts` at all (no `act_id`, never synced from Meta), so
-- there is nothing to update.
update public.ad_accounts
set management_status = 'pausado'
where id in (
  'act_523824768788517',   -- LAS VICAS            (Excel said 'activo' — stale)
  'act_705572891993970',   -- Las Mercedes         (Excel already said 'pausado')
  'act_174708067923340',   -- Amsterdam Importador
  'act_142385057910346'    -- Amsterdam Importador 2
);

-- ---------------------------------------------------------------------------
-- Step 5 — CONFIRM: SEPINO is the only account left unassigned
-- ---------------------------------------------------------------------------
-- After Step 3, exactly one account should have no `client_name`: SEPINO,
-- which has no `act_id` anywhere in the Excel. It surfaces in the "Cuentas
-- sin asignar" table, to be assigned from the UI once Ivo has an act_ for it.
--
-- This statement asserts that expectation rather than changing anything: it
-- fails loudly if the unassigned count drifts, which means this migration
-- is stale and needs re-checking before it is trusted.
do $$
declare
  unassigned_count integer;
  unassigned_name text;
begin
  select count(*) into unassigned_count
  from public.ad_accounts
  where client_name is null;

  if unassigned_count <> 1 then
    raise exception
      'Expected exactly 1 account without a client_name (SEPINO), found %. The unassigned list in this migration is out of date — re-check it before applying.',
      unassigned_count;
  end if;

  select name into unassigned_name
  from public.ad_accounts
  where client_name is null;

  if unassigned_name <> 'SEPINO' then
    raise exception
      'The one unassigned account is "%", expected SEPINO. The unassigned list in this migration is out of date — re-check it before applying.',
      unassigned_name;
  end if;
end $$;

commit;
