-- Same fix as 20260720_001, applied to the one helper that migration missed.
--
-- `is_paid_media()` belongs to the Reportes feature, not the CRM, but it is
-- referenced by 3 RLS policies and was VOLATILE for the same reason the others
-- were: the volatility marker was simply omitted, and Postgres defaults to the
-- most pessimistic one. A VOLATILE function in a policy is re-evaluated once
-- per row and cannot be hoisted into an InitPlan.
--
-- Standing rule for this project: any function used in an RLS policy is
-- STABLE. A policy runs per row by definition, so a volatile function there is
-- always a mistake -- there is no legitimate case for one.
--
-- Independent of the CRM work: safe to merge on its own, in any order.

create or replace function public.is_paid_media()
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
      and p.role = 'paid_media'
  );
$$;
