-- RLS helper functions: VOLATILE -> STABLE.
--
-- These three functions already existed in the database, but were created
-- outside this migrations folder, so the repo never described them. This
-- migration brings them under version control and fixes their volatility.
--
-- Why it matters: a function with no volatility marker defaults to VOLATILE.
-- Postgres re-evaluates a VOLATILE function once per row in an RLS policy and
-- refuses to hoist it into an InitPlan, so the usual `(select fn())` wrapper
-- buys nothing while the function stays VOLATILE. Marking them STABLE is what
-- makes that wrapper work: the planner evaluates the call once per query.
--
-- Two secondary changes:
--   * plpgsql -> sql, so a STABLE function can also be inlined by the planner.
--   * search_path pinned to '' with every reference schema-qualified, which is
--     the hardening Supabase recommends for SECURITY DEFINER functions
--     (the previous `search_path = public` leaves the resolution order open to
--     whatever else lands in the public schema).
--
-- Return types and argument lists are unchanged, so existing policies that
-- reference these functions keep working without being rewritten. Grants are
-- preserved by CREATE OR REPLACE.

create or replace function public.get_user_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.user_profiles p
  where p.id = auth.uid()
  limit 1;
$$;

create or replace function public.get_user_client_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.client_id
  from public.user_profiles p
  where p.id = auth.uid()
  limit 1;
$$;

create or replace function public.is_admin_global()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_profiles p
    where p.id = auth.uid()
      and p.role = 'admin_global'
  );
$$;
