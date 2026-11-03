-- Complete report child tables (S1 of paid-media-reporte-completo).
-- report_texts (AI draft + human edits), report_renders (one published URL per
-- render), report_deliveries (email + Drive sends), plus helper functions.
-- Depends on 20261026_001_reports_versioning.sql. Purely additive: no existing
-- table is altered. Rollback while empty: drop the 3 tables, then the functions.
begin;

create function public.report_tables_set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;

create function public.is_valid_email(p text) returns boolean
language sql immutable set search_path = '' as $$
  select p ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' $$;

create function public.are_valid_emails(p text[]) returns boolean
language sql immutable set search_path = '' as $$
  select coalesce(bool_and(public.is_valid_email(e)), true) from unnest(p) e $$;

-- 32 symbols (no l/o/0/1) -> byte % 32 has no modulo bias. 8 chars = 2^40.
-- PRE-MERGE CHECK: `extensions.gen_random_bytes` (pgcrypto) must exist in the
-- target project. Fallback if it does not: build the bytes from
-- uuid_send(gen_random_uuid()).
create function public.gen_report_public_id() returns text
language plpgsql volatile set search_path = '' as $$
declare
  alphabet constant text := 'abcdefghijkmnpqrstuvwxyz23456789';
  b bytea := extensions.gen_random_bytes(8);
  r text := '';
begin
  for i in 0..7 loop
    r := r || substr(alphabet, (get_byte(b, i) % 32) + 1, 1);
  end loop;
  return r;
end; $$;

create table public.report_texts (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  section_key text not null check (section_key ~ '^[a-z0-9_]{1,64}$'),
  section_label text not null,
  sort_order smallint not null default 0,
  ai_text text not null,
  ai_rationale text,
  edited_text text check (edited_text is null or char_length(edited_text) <= 10000),
  edited_by uuid references auth.users(id) on delete set null,
  edited_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint report_texts_report_section_key unique (report_id, section_key)
);

-- Stamps the editor; blank -> null (falls back to the AI text); human edits are
-- only allowed while the report is draft_ready. auth.uid() is null for
-- service_role (n8n), which is therefore not gated.
create function public.report_texts_stamp_edit() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.edited_text := nullif(btrim(new.edited_text), '');
  if new.edited_text is distinct from old.edited_text then
    if auth.uid() is not null and not exists (
      select 1 from public.reports r where r.id = new.report_id and r.status = 'draft_ready'
    ) then
      raise exception 'report not editable' using errcode = '42501';
    end if;
    new.edited_by := auth.uid();
    new.edited_at := now();
  end if;
  return new;
end; $$;

create trigger report_texts_stamp_edit before update on public.report_texts
  for each row execute function public.report_texts_stamp_edit();

create table public.report_renders (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete restrict,
  public_id text not null default public.gen_report_public_id()
    check (public_id ~ '^[a-z2-9]{8}$'),
  status text not null default 'pending'
    check (status in ('pending','running','done','error')),
  texts_snapshot jsonb not null check (jsonb_typeof(texts_snapshot) = 'array'),
  report_url text, pdf_url text, error text, error_detail jsonb,
  rendered_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint report_renders_public_id_key unique (public_id),
  constraint report_renders_done_has_url check (status <> 'done' or report_url is not null)
);
create index report_renders_report_idx on public.report_renders (report_id, created_at desc);
-- One active render per report: a double click is rejected by the DB (23505).
create unique index report_renders_one_active_uidx on public.report_renders (report_id)
  where status in ('pending','running');

create table public.report_deliveries (
  id uuid primary key default gen_random_uuid(),
  render_id uuid not null references public.report_renders(id) on delete restrict,
  to_email text not null check (public.is_valid_email(to_email)),
  cc_emails text[] not null default '{}'
    check (cardinality(cc_emails) <= 10 and public.are_valid_emails(cc_emails)),
  drive_file_name text not null,
  status text not null default 'pending'
    check (status in ('pending','sending','sent','error')),
  drive_url text, error text, error_detail jsonb,
  sent_by uuid not null references auth.users(id),
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint report_deliveries_sent_has_ts check (status <> 'sent' or sent_at is not null)
);
create index report_deliveries_render_idx on public.report_deliveries (render_id, created_at desc);
create unique index report_deliveries_one_active_uidx on public.report_deliveries (render_id)
  where status in ('pending','sending');

-- report_texts_stamp_edit and report_texts_updated_at are both BEFORE UPDATE
-- triggers on independent columns, so their relative order is irrelevant.
create trigger report_texts_updated_at before update on public.report_texts
  for each row execute function public.report_tables_set_updated_at();
create trigger report_renders_updated_at before update on public.report_renders
  for each row execute function public.report_tables_set_updated_at();
create trigger report_deliveries_updated_at before update on public.report_deliveries
  for each row execute function public.report_tables_set_updated_at();

alter table public.report_texts enable row level security;
alter table public.report_renders enable row level security;
alter table public.report_deliveries enable row level security;

create policy report_texts_select on public.report_texts for select to authenticated
  using ((select public.is_admin_global()) or (select public.is_paid_media()));
-- UPDATE policy is row-level only; the column grant below limits it to edited_text.
create policy report_texts_update on public.report_texts for update to authenticated
  using ((select public.is_admin_global()) or (select public.is_paid_media()))
  with check ((select public.is_admin_global()) or (select public.is_paid_media()));
create policy report_renders_select on public.report_renders for select to authenticated
  using ((select public.is_admin_global()) or (select public.is_paid_media()));
create policy report_deliveries_select on public.report_deliveries for select to authenticated
  using ((select public.is_admin_global()) or (select public.is_paid_media()));

-- Browser clients can read; the only writable column is report_texts.edited_text.
-- All job rows are written by service_role (app server + n8n).
revoke all on public.report_texts, public.report_renders, public.report_deliveries from anon, authenticated;
grant select on public.report_texts, public.report_renders, public.report_deliveries to authenticated;
grant update (edited_text) on public.report_texts to authenticated;

-- The public_id default runs with the INSERTING role's privileges, so
-- service_role needs EXECUTE explicitly once PUBLIC is revoked.
revoke all on function public.gen_report_public_id() from public, anon, authenticated;
grant execute on function public.gen_report_public_id() to service_role;

commit;
