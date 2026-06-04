CREATE INDEX IF NOT EXISTS idx_gn_leads_last_message_at
  ON public.gn_leads (last_message_at DESC)
  WHERE last_message_at IS NOT NULL;
