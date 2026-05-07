# Roles & Permissions — Manual Verification Checklist

**Date**: 2026-05-07
**Change**: roles-and-permissions (Batch 2)

---

## Pre-requisites

- [ ] Migrations `20260507_001` through `20260507_004` applied to Supabase
- [ ] `section_permissions` table has exactly 34 rows
- [ ] RLS enabled on `avalon_services`, `grupo_norte_leads`, `section_permissions`

---

## 1. admin_global

- [ ] Login as `admin_global` → lands on `/dashboard/overview` (NOT `/onboarding`)
- [ ] Sidebar shows: Resumen, Web, Ads, Redes, Bot, Comercial, Proyectos, Cuenta
- [ ] CompanySwitcher visible in sidebar header
- [ ] CompanySwitcher dropdown contains "Agregar Cliente" and "Invitar Usuario"
- [ ] Navigate to `/admin/invite-user` → invite form renders
- [ ] Navigate to `/dashboard/commercial` → accessible (no redirect)
- [ ] Navigate to `/dashboard/pm` → accessible (no redirect)
- [ ] Navigate to `/dashboard/social` → accessible (no redirect)

---

## 2. client_user (with services: website, ads)

- [ ] Login as `client_user` → lands on `/dashboard/overview` (NOT `/onboarding`, assuming onboarding complete)
- [ ] Sidebar shows: Resumen, Web, Ads, Cuenta (social and chatbot hidden — not in services)
- [ ] CompanySwitcher NOT visible
- [ ] Navigate directly to `/dashboard/commercial` → redirected to `/dashboard/overview`
- [ ] Navigate directly to `/dashboard/pm` → redirected to `/dashboard/overview`
- [ ] Navigate directly to `/admin/invite-user` → redirected to `/dashboard/overview`
- [ ] `social` and `chatbot` sections NOT in DOM (not rendered, not just hidden)

---

## 3. comercial

- [ ] Login as `comercial` → lands on `/dashboard/commercial` (NOT `/onboarding`)
- [ ] Sidebar shows: Comercial, Cuenta, Ajustes only
- [ ] CompanySwitcher NOT visible
- [ ] Navigate to `/dashboard/overview` → redirected to `/dashboard/commercial`
- [ ] Navigate to `/dashboard/website` → redirected to `/dashboard/commercial`
- [ ] Navigate to `/admin/invite-user` → redirected to `/dashboard/commercial`

---

## 4. pm

- [ ] Login as `pm` → lands on `/dashboard/pm` (NOT `/onboarding`)
- [ ] Sidebar shows: Resumen, Web, Ads, Redes, Bot, Proyectos, Cuenta
- [ ] `commercial` and `admin_clients` NOT in DOM
- [ ] CompanySwitcher visible
- [ ] CompanySwitcher dropdown does NOT show "Agregar Cliente" or "Invitar Usuario"
- [ ] Navigate to `/dashboard/commercial` → redirected to `/dashboard/pm`
- [ ] Navigate to `/admin/invite-user` → redirected to `/dashboard/pm`

---

## 5. cm

- [ ] Login as `cm` → lands on `/dashboard/overview` (NOT `/onboarding`)
- [ ] Sidebar shows: Resumen, Web, Ads, Redes, Bot, Cuenta
- [ ] `commercial`, `pm`, `admin_clients` NOT in DOM
- [ ] CompanySwitcher visible
- [ ] CompanySwitcher dropdown does NOT show "Agregar Cliente" or "Invitar Usuario"
- [ ] Navigate to `/dashboard/commercial` → redirected to `/dashboard/overview`

---

## 6. Invite Flow (end-to-end)

- [ ] Admin sends invite to new email with `role=cm` → email received with magic link
- [ ] Invitee clicks link → lands on `/auth/callback` → `user_profiles` row created with `role=cm`, `client_id=NULL` → redirected to `/dashboard`
- [ ] Admin sends invite with `role=admin_global` → API returns 400 (admin_global is not invitable)
- [ ] Invite to already-registered email → API returns 400 with Supabase error message
- [ ] Invite callback triggered twice for same user → no duplicate `user_profiles` row (upsert with `ignoreDuplicates`)
- [ ] Invited `pm` user accepts link → lands on `/dashboard/pm`

---

## 7. Missing-profile guard

- [ ] Authenticated session with no `user_profiles` row → redirected to `/login?error=no_profile`

---

## 8. RLS Verification

- [ ] `client_user` queries `avalon_services` via anon client → 0 rows returned
- [ ] `pm` queries `avalon_services` via anon client → 0 rows returned
- [ ] Any authenticated role queries `grupo_norte_leads` via anon client → 0 rows (no policies)
- [ ] Service-role client can query `grupo_norte_leads` normally
- [ ] `client_user` can `SELECT` from `section_permissions` → returns rows (policy allows authenticated)

---

## 9. Regression

- [ ] Existing `client_user` login flow still works (no onboarding regressions)
- [ ] `admin/create-client` page still accessible to `admin_global`
- [ ] Settings page (`/dashboard/settings`) still accessible to all roles
- [ ] Logout still works from dashboard
