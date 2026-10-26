-- Client report recipients (S2 of paid-media-reporte-completo).
-- One main email + an optional CC list per client, stored on the 1:1 extension
-- `client_paid_media` (NOT on `clients`: the clients_paid_media_guard trigger
-- whitelists only company_name/website_url/instagram_url for paid_media users).
-- Depends on 20261026_003 (is_valid_email / are_valid_emails).
-- The email is nullable in the DB because existing clients have none; the form
-- and server actions require it on create and edit.
-- Rollback: drop the two columns and restore the 6-arg function from
-- 20261001_002 (drop the 8-arg one first).
begin;

-- Fix (S1 review): an array holding a NULL element used to pass, because
-- bool_and ignores nulls and is_valid_email(null) is null. Any NULL now fails.
create or replace function public.are_valid_emails(p text[]) returns boolean
language sql immutable set search_path = '' as $$
  select array_position(p, null) is null
     and coalesce(bool_and(public.is_valid_email(e)), true)
    from unnest(p) e $$;

alter table public.client_paid_media
  add column report_email text
    constraint client_paid_media_report_email_check
    check (report_email is null or public.is_valid_email(report_email)),
  add column report_cc_emails text[] not null default '{}'
    constraint client_paid_media_report_cc_check
    check (cardinality(report_cc_emails) <= 10 and public.are_valid_emails(report_cc_emails)),
  -- The main address must not be repeated in CC (it already receives the mail).
  add constraint client_paid_media_cc_excludes_main
    check (report_email is null or not (report_email = any (report_cc_emails)));

-- Signature change: drop the 6-arg version (no overload ambiguity) and recreate
-- with two defaulted params, so old 6-arg calls keep working during deploy.
-- Security settings and grants are identical to 20261001_002.
drop function public.create_paid_media_client(text, text, text, text, text, text);

create function public.create_paid_media_client(
  p_company_name     text,
  p_website_url      text,
  p_instagram_url    text,
  p_pm_name          text,
  p_operator_name    text,
  p_status           text,
  p_report_email     text default null,
  p_report_cc_emails text[] default '{}'
) returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id    uuid := gen_random_uuid();
  v_email text := nullif(lower(btrim(p_report_email)), '');
  v_cc    text[];
begin
  if not (public.is_paid_media() or public.is_admin_global()) then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  if nullif(btrim(p_company_name), '') is null then
    raise exception 'company_name is required' using errcode = '22023';
  end if;

  -- Normalize CC: trim + lowercase, drop blanks/nulls, dedupe (keep first
  -- position), drop the main email. Validity/size stay with the CHECKs (23514).
  select coalesce(array_agg(e order by first_pos), '{}')
    into v_cc
    from (
      select lower(btrim(x)) as e, min(ord) as first_pos
        from unnest(coalesce(p_report_cc_emails, '{}')) with ordinality as t(x, ord)
       where nullif(btrim(x), '') is not null
         and lower(btrim(x)) is distinct from v_email
       group by lower(btrim(x))
    ) s;

  insert into public.clients (id, company_name, portal_enabled, website_url, instagram_url)
  values (
    v_id,
    btrim(p_company_name),
    false,
    nullif(btrim(p_website_url), ''),
    nullif(btrim(p_instagram_url), '')
  );

  insert into public.client_paid_media (client_id, pm_name, operator_name, status, report_email, report_cc_emails)
  values (
    v_id,
    nullif(btrim(p_pm_name), ''),
    nullif(btrim(p_operator_name), ''),
    nullif(btrim(p_status), ''),
    v_email,
    v_cc
  );

  return v_id;
end;
$$;

revoke all on function public.create_paid_media_client(text, text, text, text, text, text, text, text[]) from public, anon;
grant execute on function public.create_paid_media_client(text, text, text, text, text, text, text, text[]) to authenticated;

commit;
