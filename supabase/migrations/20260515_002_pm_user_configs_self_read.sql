-- pm_user_configs self-read policy
-- Date: 2026-05-15
--
-- Fix: the "pm sees own pm_clients" policy (migration 20260515_001) does a
-- subquery against pm_user_configs from inside its USING clause. RLS subqueries
-- are evaluated as the caller, and pm_user_configs had RLS enabled with ZERO
-- policies, blocking all authenticated reads. That made the subquery return 0
-- rows for every PM, which collapsed the pm_clients SELECT policy to false
-- and left every PM unable to see any of their own projects.
--
-- Solution: allow each authenticated user to read their own pm_user_configs
-- row. Service role (supabaseAdmin) keeps bypassing RLS as before.

CREATE POLICY "pm reads own config"
  ON public.pm_user_configs FOR SELECT TO authenticated
  USING (user_id = auth.uid());
