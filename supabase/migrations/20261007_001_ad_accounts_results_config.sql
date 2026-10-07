-- Opt-in per-account "campaign results" report mode. When set, the report
-- aggregates Meta campaign-level `results` per month for the configured
-- indicator(s) instead of auto-detecting a primary conversion. Null = legacy
-- behaviour, so all existing accounts are unaffected until seeded one by one.
--
-- Expected shape:
--   {"mode":"campaign_results",
--    "primaryIndicator":"conversions:donate_website",
--    "secondaryIndicators":["profile_visit_view"]}   -- optional array
--
-- The CHECK validates SHAPE only, not the indicator vocabulary: the valid
-- indicators live in compute.js (n8n), which does not deploy with the DB. An
-- unknown indicator degrades softly in the report instead of being rejected here.
-- Same rationale as 20260806_001_ad_accounts_primary_action_type.sql.

alter table public.ad_accounts
  add column results_config jsonb;

alter table public.ad_accounts
  add constraint ad_accounts_results_config_shape check (
    results_config is null
    or coalesce((
      jsonb_typeof(results_config) = 'object'
      and results_config ->> 'mode' = 'campaign_results'
      and jsonb_typeof(results_config -> 'primaryIndicator') = 'string'
      and length(results_config ->> 'primaryIndicator') > 0
      and (
        not results_config ? 'secondaryIndicators'
        or jsonb_typeof(results_config -> 'secondaryIndicators') = 'array'
      )
    ), false)
  );
