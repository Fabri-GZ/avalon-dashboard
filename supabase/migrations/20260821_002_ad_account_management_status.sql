-- Slice (b) of the paid media account registry: seeded status lookup table.
--
-- The spreadsheet's ESTADO column becomes its own table instead of a CHECK
-- constraint (D1): a ninth status is then a single admin INSERT, not a
-- migration + deploy. `key` is the stable identity other rows FK against;
-- `label` is presentation and can be renamed later without touching FK rows.
--
-- `sort_order` exists because the dropdown must open with the four
-- most-used values first (Nuevo Cliente, Activo, Pausado, Esperar
-- Confirmación) — alphabetical order would bury `Activo`.
--
-- SELECT-only RLS: a ninth status is an operator INSERT run by hand, not an
-- app feature, so there is no write policy here.
create table public.ad_account_management_status (
  key         text primary key,
  label       text not null unique,
  sort_order  int  not null,
  is_active   boolean not null default true
);

alter table public.ad_account_management_status enable row level security;

create policy ad_account_management_status_select_authenticated
  on public.ad_account_management_status
  for select
  to authenticated
  using (true);

insert into public.ad_account_management_status (key, label, sort_order, is_active) values
  ('nuevo_cliente',          'Nuevo Cliente',            1, true),
  ('activo',                 'Activo',                   2, true),
  ('pausado',                'Pausado',                  3, true),
  ('esperar_confirmacion',   'Esperar Confirmación',     4, true),
  ('saldo_agregado',         'Saldo Agregado',           5, true),
  ('pendiente',              'Pendiente',                6, true),
  ('cuenta_creada',          'Cuenta Creada',            7, true),
  ('activa_cuenta_prepaga',  'Activa cuenta prepaga',    8, true);
