-- Allow authenticated users to UPDATE the stage field on gn_leads.
-- WITH CHECK prevents setting stage to 'derivado' regardless of caller (defense-in-depth).
-- The primary guard is in updateStageAction (server-side), this is the DB backstop.

CREATE POLICY "authenticated users can update lead stage"
  ON gn_leads
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (stage <> 'derivado');
