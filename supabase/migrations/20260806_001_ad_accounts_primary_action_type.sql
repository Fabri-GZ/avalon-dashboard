-- Explicit per-account override for the report's primary conversion. Detection
-- infers it from the highest-spend campaign's Meta objective, which is wrong for
-- accounts running two conversion models at once. Null = keep auto-detecting, so
-- all existing accounts are unaffected until seeded one by one.
--
-- No CHECK constraint on purpose: the valid vocabulary lives in ACTION_TYPE_META
-- inside compute.js, which is not in this repo and does not deploy with the DB.
-- An invalid value is surfaced in reports.manifest instead of rejected here.

alter table public.ad_accounts
  add column primary_action_type text;
