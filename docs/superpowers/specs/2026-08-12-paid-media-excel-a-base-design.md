# Paid Media: from spreadsheet to database

**Date:** 2026-08-12
**Status:** design approved, not implemented
**Driver:** Ivo (`ivan.avalon3@gmail.com`, role `paid_media`) administers paid media clients,
accounts, budgets and assignments from the dashboard instead of a Google Sheet, and the
report automation reads the same data.

---

## 1. Problem

Paid media's source of truth is a Google Sheet with two tabs:

| Tab | Shape | Columns |
|---|---|---|
| `ESTADO CUENTAS FACEBOOK` | one row per account | NOMBRE CLIENTE, Cuenta, CARGAS, PM, PLATAFORMA, CUENTA, ESTADO, OPERADOR, Detalle, BM, LINEA, PRESUPUESTO MENSUAL, Geolocalizacion, Fecha de entrega, Estrategia, WEB + IG |
| `SOLICITUD DE SALDO` | one row per account, one column per month | NOMBRE CLIENTE, CARGAS, PLATAFORMA, ESTADO, OPERADOR, JULIO, AGOSTO |

Three consequences:

1. **Client data is duplicated per account.** A client with two accounts is two rows, so
   changing its PM is two edits and a chance they diverge. `L ARTISAN` is duplicated
   because it runs on Meta and Google; `Amsterdam` because it has two Meta accounts.
2. **The report pipeline cannot read it.** Anything the report needs (primary conversion,
   currency) has to be set by hand in Supabase by the dev team. That is a support ticket
   for every correction, and the people who know the answer are not the ones with access.
3. **Meta's campaign objectives lie.** Three of three accounts inspected
   (DECOPOINT, GRUPO NORTE, AVALON3) have messaging campaigns tagged `OUTCOME_SALES`, so
   auto-detection picks the wrong primary conversion. AVALON3's July report currently
   reads `Compras: 5 · CPA $627.291` for an account that sells nothing online.

## 2. Verified starting state

Checked against the database on 2026-08-12, not from notes.

| Table | Rows | Notes |
|---|---|---|
| `clients` | 3 | Grupo Norte, Viviera, FZ Motos — after the cleanup below |
| `pm_clients` | 23 | 1 linked to a client (GRUPO NORTE) |
| `ad_accounts` | 22 | 2 have `primary_action_type` set |
| `reports` | 6 | |

**Cleanup already applied (2026-08-12).** `clients` held six junk rows: three invented
"companies" for staff members (`Fabri`, `Lucas`, `Salma`) that existed only to give their
profile a `client_id`, two placeholders (`Usuario-2`, `Usuario-3`) and one test client
(`Openn Pilar`). They were deleted and the staff profiles now carry `client_id = null`,
which is correct: `useClientData.js` only reads `profile.client_id` for `client_user`;
`admin_global` and `pm` resolve their client through the switcher and `pm_clients`.

That cleanup also surfaced a data defect worth recording: **three of the four
`pm_clients → clients` links were wrong.** `Amsterdamn` pointed at `Openn Pilar`,
`Las Mercedes` and `Mansilla Cards` at `Salma`. All three are real paid media clients.
Someone picked the wrong entry from a dropdown that listed staff rows as if they were
companies. They were unlinked. Had this gone unnoticed, step 3 of the client promotion
below would have propagated it into the canonical table.

### Existing code that constrains the design

- **The sidebar already supports subsections, by config.** `navigation` in
  `src/app/components/Dashboard/data/dataProcessors.js` takes a `children` array and the
  sidebar renders it; Bot uses it for Insights and CRM. Adding a `Paid Media` parent is
  adding an object to an array.
- **`NAV_ITEMS` in `src/lib/sections.ts` is dead code.** Nothing imports it. It is a
  second, flat nav definition that looks authoritative and is not.
- **`src/app/dashboard/reportes/page.tsx` selects `ad_accounts` with no filter.** Every
  row becomes a row with a "Generar" button.
- **`is_paid_media()` grants read only.** `ad_accounts` has
  `ad_accounts_select_paid_media` (SELECT) and `admin_global can manage` (ALL). There is
  no write policy for `paid_media`.
- **`reports.account_id → ad_accounts(id)` has no `ON DELETE`**, so it defaults to
  `NO ACTION`: Postgres refuses to delete an account that has reports.
- **`clientLine` is the agency line, not the client name.** `registry.js` falls back to
  `'Avalon World Agency'` and renders the client name below it. Do not feed the client
  name into it.
- **No test runner exists.** Verification is `pnpm lint` and `npx tsc --noEmit`, plus
  manual checks. Never `pnpm build`.

## 3. Decisions

| # | Decision | Reason |
|---|---|---|
| D1 | The unit Ivo works with is the **client**; accounts hang off it | A client with two accounts must be edited once, not twice |
| D2 | Build on **`ad_accounts` first**, promote the client to a real entity later | `ad_accounts` already holds the 22 real paid media accounts and is clean; `clients` needed repair first, and that repair serves the system, not Ivo |
| D3 | All platforms live in `ad_accounts` with a new `platform` column | One CRUD, and the `id text` PK already accepts a Google customer id |
| D4 | One webhook; the payload carries the platform and the workflow branches | Same pattern the AI agent uses with `department` |
| D5 | The monthly amount is a separate table, one row per account and month | The sheet already keeps history as one column per month; collapsing it to a single overwritten value would lose data they have today |
| D6 | Soft delete with a 45-day purge, restore from a trash view | Recoverable mistakes without unbounded junk |
| D7 | No Excel importer | 22 rows, and the name matching is not reliably automatable |

### Why B and not "make `clients` canonical now"

Making `clients` the company entity is the correct destination and stays on the roadmap.
It is not the starting point because it front-loads work that does not help Ivo: cleaning
junk rows (now done) and sweeping every place that assumes `clients` means "has a login".
That sweep has real risk — no foreign key will flag it — and it has to be done by reading
code. Camino B puts what helps Ivo first and what helps the system second, without
dropping either.

## 4. Data model

### `ad_accounts` — new columns

| Column | Type | Source |
|---|---|---|
| `platform` | text not null default `'meta'`, check in (`meta`,`google`,`tiktok`) | PLATAFORMA |
| `client_name` | text | NOMBRE CLIENTE — **transitional**, promoted to a FK later |
| `funding_method` | text, check in (`linea_credito`,`tarjeta`) | CARGAS |
| `management_status` | text, check in (`nuevo`,`activo`,`pausado`) | ESTADO |
| `pm_name` | text | PM |
| `operator_name` | text | OPERADOR |
| `monthly_budget` | numeric, check `>= 0` | PRESUPUESTO MENSUAL |
| `geo` | text | Geolocalizacion — free text, confirmed |
| `strategy_url` | text | Estrategia — a link to the strategy deck, not prose |
| `notes` | text | Detalle — free-form notes, confirmed |
| `website_url`, `instagram_url` | text | WEB + IG |
| `deleted_at` | timestamptz | soft delete |

Already present and reused: `id` (CUENTA), `name` (Cuenta), `business_id` / `business_name`
(BM), `currency`, `primary_action_type`.

> **`management_status` is not `account_status`.** The latter already exists and is Meta's
> integer status. Merging them would be the expensive mistake.

**`funding_method` is a commercial term, not a bookkeeping detail.** Avalon is an official
Meta partner and can extend a credit line to the client; the alternative is the client
paying the ads with their own card. The credit line is usually the cheaper option for
them, so which one an account is on is worth showing in the registry, not hiding in a
detail field.

**`geo` stays free text** because the real values are instructions, not regions:
`Todo el pais`, `Zona norte + Caba (No pautar en Devoto)`, `CABA+ZONA SUR/ZONA NORTE`,
`Trelew, Chubut`. An enum would lose the exclusions, which are the part that matters
to whoever sets up the campaign.

**`strategy_url` is a URL**, typically a Google Slides deck. It renders as a link, and the
form validates it is one instead of accepting pasted prose.

**`Fecha de entrega` is not modelled.** Ivo confirmed it is barely used. Dropping it also
drops the deadline-alerts idea it would have opened.

`pm_name` and `operator_name` are text, not foreign keys, because the users do not exist:
`user_profiles` has 8 rows and the only `paid_media` is Ivo. A FK would force creating
accounts for people who do not need them yet and would block the slice.

### `ad_account_saldo` — new table

```
ad_account_saldo
  ad_account_id  text  → ad_accounts(id) on delete cascade
  year           int   check (year between 2020 and 2100)
  month          int   check (month between 1 and 12)
  amount         numeric check (amount >= 0)
  primary key (ad_account_id, year, month)
```

The name is deliberately non-committal. It is unknown whether the sheet's `JULIO` column
means requested, actually loaded, or budgeted for that month — see Open Questions. All
three store identically, so the table is safe to build now.

The columns tab 2 repeats (client, cargas, platform, status, operator) are **not** copied;
they come from the account by join. Half that sheet disappears on its own.

### Security

Add `INSERT` and `UPDATE` policies on `ad_accounts` and `ad_account_saldo` for
`is_paid_media()`. A CRUD without a write policy is a form that fails on save.

**No `DELETE` policy.** Deletion is `deleted_at`, and the purge runs server-side.

## 5. Screens

```
Paid Media                     ← new parent, no href of its own
├── Reportes    /dashboard/reportes              ← existing, unchanged URL
└── Clientes    /dashboard/paid-media/clientes   ← new
```

**Reportes keeps its URL.** Only its position in the sidebar changes. Moving it to
`/dashboard/paid-media/reportes` would break the links already shared and would mean
touching `ROUTE_SECTION_MAP` and `defaultRouteForRole('paid_media')` for no user-visible
gain. The two children living at different path depths is a cosmetic inconsistency and
the cheaper trade.

### The new route needs a section key, or it has no guard

`requiredSectionFor()` matches by prefix against `ROUTE_SECTION_MAP`, and
`/dashboard/paid-media/clientes` matches nothing there — `/dashboard/reportes` is not a
prefix of it. Without an entry the function returns `null`, the middleware's section check
is skipped entirely, and the page renders for any authenticated role. RLS still protects
the rows, but the screen should not be reachable at all.

So the slice adds:

- `SECTIONS.PAID_MEDIA_CLIENTES = 'paid_media_clientes'`
- `{ prefix: '/dashboard/paid-media', section: SECTIONS.PAID_MEDIA_CLIENTES }` in
  `ROUTE_SECTION_MAP`
- a `section_permissions` row for `paid_media` — **added last**

A distinct key rather than reusing `reportes` is what makes the screen a draft: while
there is no `section_permissions` row, the nav hides it and the middleware redirects, so
the work can land in production without Ivo tripping over it. Granting access is then one
insert, on the day it is ready.

**Clientes** — one row per client, grouped by `client_name`. `L ARTISAN` appears once with
two platform chips. Columns: client, platforms, status, operator, PM, budget, account
count. Search plus filters by status, platform and operator. "Nuevo cliente" is the button
that removes Ivo's dependency on the dev team.

**Client detail** — a side sheet reusing `ReportSheet`, already built and proven in
Reportes. Three blocks: client fields, one card per account, and the monthly amount grid.

**Papelera** — deleted records with days remaining and a restore action. Records that have
reports show "se conserva" instead of a countdown, because they are never purged.

**Primary conversion selector** — each option shows how many conversions of that type the
account actually had, and "Automático (detectar)" is a visible choice rather than today's
invisible default:

```
Conversaciones de WhatsApp    1.614 en los últimos 4 meses
Compras en el sitio               5
Leads de formulario               0     ← choosing this leaves the report at zero
Clics al sitio               16.212
Automático (detectar)
```

The counts come from the same `/insights` call the report already makes.

## 6. Data flow

**Writes** go straight to Supabase through Server Actions, with RLS as the only gate. No
intermediate API route: there is nothing to orchestrate.

**The report contract gains exactly one field.** Today the route sends
`account: { id, name, currency, primary_action_type }`; it adds `platform`. The monthly
amount does **not** travel until Ivo says what it means — labelling a top-up request as a
budget in a client-facing report is worse than omitting it.

**The reportes screen filters in the same change that adds the column.** Shipping
`platform` alone gives Ivo a "Generar" button on every Google account that the Meta-only
pipeline cannot serve. Non-Meta accounts show the action disabled with the reason.

**Initial load is a hand-written migration, not a feature.** 22 accounts, and the name
matching is known to be unreliable — `pm_clients` says "Amsterdamn" where the account says
"Amsterdam Importador", which is why `match_confidence` exists and why 8 accounts are
unassigned. Ambiguous matches are confirmed with Ivo before the migration runs.

**Purge** runs in the existing daily Vercel cron (`pg_cron` is not installed):

```sql
delete from public.ad_accounts
 where deleted_at < now() - interval '45 days'
   and not exists (select 1 from public.reports where account_id = ad_accounts.id);
```

The `not exists` is explicit rather than relying on the foreign key to abort, so the job
never errors on rows it was always going to keep.

## 7. Error handling

**The dangerous failure produces no error.** If Ivo picks a conversion type with zero
volume, `compute.js` short-circuits without a fallback and the report renders entirely in
zeros — no exception, and it looks valid. This cannot be caught server-side, because the
backend has no way to know the choice was wrong. The prevention is the per-option counts
and the visible "Automático" entry.

**Two clients that are the same one.** `client_name` is text, so `L ARTISAN` and
`L. ARTISAN` become two rows in the grouped list, breaking the exact thing this work
fixes. The client field is therefore a combo box autocompleting over existing values;
creating a new one is an explicit action. Free text is what the spreadsheet does, and it
is where "Amsterdamn" came from.

| Failure | Handling |
|---|---|
| Save without a write policy | Policies ship in the same slice as the CRUD |
| Duplicate `act_` | `23505` becomes "esa cuenta ya existe", focus on the field |
| Invalid month/year, negative amount | `CHECK` constraints |
| Deleting an account with reports | Soft delete; the purge skips it |

## 8. Testing

There is no test runner. That is a design constraint with a concrete consequence:

> **Invariants live in the schema, not in application code.** `CHECK`, `PK`, `FK`,
> `NOT NULL`. What the database enforces survives a refactor; there is no suite here to
> catch one that breaks a form validator.

The form validates too, for a decent message, but the constraint is the authority.

Migrations follow the pattern that proved itself during the `clients` cleanup: `begin` →
changes → a control `select` → `rollback`, read the numbers, and only then `commit`. That
is what demonstrated the staff profiles would survive.

Per-slice manual checklist: create a client, add a Google account to it, confirm Reportes
shows it with the action disabled, delete it, restore it from the trash.

Gates: `pnpm lint` and `npx tsc --noEmit`. Never `pnpm build`.

## 9. Slices

This is more than one implementation plan. Slice 1 is the subject of the next plan; the
rest are named so they are not rediscovered later.

**Slice 1 — platform + primary conversion.** The `platform` column, the reportes screen
filter, the write policies, and the primary conversion selector with volume counts. This
is what unblocks correct reports, which is the problem that started all of this. It needs
no new route, so the section-key work belongs to slice 2.

**Slice 2 — the account registry CRUD.** The remaining columns, the new section key and
its `ROUTE_SECTION_MAP` entry, the Clientes list grouped by client, the detail sheet, soft
delete and the trash view. Ships without the `section_permissions` row, so it is invisible
to Ivo until it is ready.

**Slice 3 — monthly amounts.** `ad_account_saldo` and its grid. Blocked on the semantics
question below only for whether it reaches the report; the table and UI are not blocked.

**Slice 4 — client promotion.** In order: insert missing paid media clients into
`clients`; add `ad_accounts.client_id` as a FK; backfill from `client_name`; **sweep by
hand the code that assumes `clients` means "has a login"**; drop `client_name`. The sweep
is its own step because it is the only one with real risk and no foreign key will flag it.

**Slice 5 — PM and operator as real users.** Requires creating accounts for the team.

## 10. Open questions

| # | Question | Blocks |
|---|---|---|
| Q1 | What does the `JULIO` figure mean — requested, loaded, or budgeted for that month? | Only whether it reaches the report. Asked to Ivo. |
| Q5 | Google: what do they measure with — GA4, Google Ads alone? | The Google report generator, not this work. Ivo runs Meta, so this goes to whoever runs Google. |

**Answered 2026-08-13** (Ivo):

- **Q2 — `LINEA` is the credit line**, the same axis as `CARGAS`: Avalon is an official
  Meta partner and extends credit to the client, or the client pays with their own card.
  Modelled by `funding_method`; no separate column.
- **Q3 — `Fecha de entrega` is barely used.** Not modelled.
- **Q4 — all three are free text.** `Geolocalizacion` carries exclusions
  (`Zona norte + Caba (No pautar en Devoto)`), `Estrategia` is a link to a deck, `Detalle`
  is notes.

## 11. Out of scope

- The Google and TikTok report generators. TikTok has a single account and does not
  justify a pipeline.
- Meta pagination (the AVALON3 fix). Separate session; the compute tail must move to
  `.all().flatMap()` first and alone, since it is a no-op today.
- The login redirect bug — see `avalon-dashboard-bug-login-redirect` in the vault.
- Deleting or wiring up the dead `NAV_ITEMS`. Worth doing, unrelated to this goal.
