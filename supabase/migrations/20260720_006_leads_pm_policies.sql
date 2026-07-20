-- Restores PM access to the CRM, which migration 002 dropped by omission.
--
-- The old gn_leads/gn_messages policies had a "pm reads linked" branch; the new
-- leads/messages policies only covered admin_global and client_user. Without
-- this, a PM opening the CRM after the cutover gets an empty board with no
-- error -- RLS hides rows, it does not raise. Verified before writing: one PM
-- (lucas@avalon3.com) currently sees all 255 Grupo Norte leads through the old
-- policy, so this is a live regression, not a hypothetical one.
--
-- These are additive PERMISSIVE policies. Postgres ORs permissive policies for
-- the same command together, so nothing has to be dropped or recreated: the
-- existing leads_select / leads_update / messages_select keep working as-is.

-- The PM -> clients linkage is a two-table join, too expensive to inline in a
-- policy that runs per row. Wrapping it in a STABLE security definer function
-- that returns the whole set at once means the policy can call it inside
-- `(select ...)` and get a single InitPlan evaluation, the same shape as the
-- other helpers in migration 001.
--
-- Returns an array rather than a set so the policy can use `= any(...)`, which
-- keeps it to one evaluation. A `client_id in (select ...)` subquery would be
-- re-checked per row.
create or replace function public.get_pm_client_ids()
returns uuid[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(array_agg(distinct pc.client_id), '{}'::uuid[])
  from public.pm_clients pc
  join public.pm_user_configs puc
    on pc.asana_project_id = any(puc.asana_project_gids)
  where puc.user_id = auth.uid()
    and pc.client_id is not null;
$$;

create policy leads_select_pm on public.leads
  for select to authenticated
  using (
    (select public.get_user_role()) = 'pm'
    -- The ::uuid[] cast is load-bearing. Without it Postgres reads
    -- `any ((select ...))` as the subquery form of ANY, which expects a set of
    -- scalars, and the function returns one row holding an array -- it fails
    -- with "operator does not exist: uuid = uuid[]". The cast forces the array
    -- form while keeping the call inside `(select ...)`, so it still resolves
    -- to a single InitPlan evaluation.
    and client_id = any ((select public.get_pm_client_ids())::uuid[])
  );

-- PMs could already move leads before the cutover: the policy this change
-- replaces was `USING (true)` for every authenticated user. Granting update on
-- their own linked clients preserves that capability while removing the
-- cross-tenant hole. `stage <> 'derivado'` matches leads_update: reaching
-- `derivado` stays the derive flow's job.
create policy leads_update_pm on public.leads
  for update to authenticated
  using (
    (select public.get_user_role()) = 'pm'
    -- The ::uuid[] cast is load-bearing. Without it Postgres reads
    -- `any ((select ...))` as the subquery form of ANY, which expects a set of
    -- scalars, and the function returns one row holding an array -- it fails
    -- with "operator does not exist: uuid = uuid[]". The cast forces the array
    -- form while keeping the call inside `(select ...)`, so it still resolves
    -- to a single InitPlan evaluation.
    and client_id = any ((select public.get_pm_client_ids())::uuid[])
  )
  with check (
    (select public.get_user_role()) = 'pm'
    -- The ::uuid[] cast is load-bearing. Without it Postgres reads
    -- `any ((select ...))` as the subquery form of ANY, which expects a set of
    -- scalars, and the function returns one row holding an array -- it fails
    -- with "operator does not exist: uuid = uuid[]". The cast forces the array
    -- form while keeping the call inside `(select ...)`, so it still resolves
    -- to a single InitPlan evaluation.
    and client_id = any ((select public.get_pm_client_ids())::uuid[])
    and stage <> 'derivado'
  );

create policy messages_select_pm on public.messages
  for select to authenticated
  using (
    (select public.get_user_role()) = 'pm'
    -- The ::uuid[] cast is load-bearing. Without it Postgres reads
    -- `any ((select ...))` as the subquery form of ANY, which expects a set of
    -- scalars, and the function returns one row holding an array -- it fails
    -- with "operator does not exist: uuid = uuid[]". The cast forces the array
    -- form while keeping the call inside `(select ...)`, so it still resolves
    -- to a single InitPlan evaluation.
    and client_id = any ((select public.get_pm_client_ids())::uuid[])
  );
