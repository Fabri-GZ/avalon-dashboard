-- pm-clients-seeding: link pm_clients to clients + tighten RLS
-- Date: 2026-05-15

-- 1. Add nullable FK column
ALTER TABLE public.pm_clients
  ADD COLUMN IF NOT EXISTS client_id uuid NULL
  REFERENCES public.clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS pm_clients_client_id_idx
  ON public.pm_clients(client_id)
  WHERE client_id IS NOT NULL;

-- 2. Tighten pm_clients SELECT — drop open policy
DROP POLICY IF EXISTS "pm_clients_select" ON public.pm_clients;

-- 3. admin_global retains full SELECT on pm_clients
CREATE POLICY "admin_global reads all pm_clients"
  ON public.pm_clients FOR SELECT TO authenticated
  USING (is_admin_global());

-- 4. PM sees only their own pm_clients (linked OR unlinked)
CREATE POLICY "pm sees own pm_clients"
  ON public.pm_clients FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pm_user_configs
      WHERE user_id = auth.uid()
        AND pm_clients.asana_project_id = ANY(asana_project_gids)
    )
  );

-- 5. PM SELECT policy on clients — only linked clients via their projects
CREATE POLICY "pm reads linked clients"
  ON public.clients FOR SELECT TO authenticated
  USING (
    get_user_role() = 'pm'
    AND id IN (
      SELECT pc.client_id FROM public.pm_clients pc
      JOIN public.pm_user_configs puc
        ON pc.asana_project_id = ANY(puc.asana_project_gids)
      WHERE puc.user_id = auth.uid()
        AND pc.client_id IS NOT NULL
    )
  );
