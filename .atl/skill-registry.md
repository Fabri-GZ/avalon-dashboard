# Skill Registry — avalon-dashboard

**Generated**: 2026-05-07  
**Project**: avalon-dashboard  
**Stack**: Next.js 16 + React 19 + Tailwind v4 + Supabase + shadcn/ui + Recharts

---

## Active Skills (User-level: ~/.claude/skills/)

| Skill | Trigger Context |
|-------|----------------|
| `brainstorming` | Before any creative work — creating features, components, adding functionality |
| `sdd-init` | Initialize SDD context in a project |
| `sdd-new` | Start a new SDD change |
| `sdd-explore` | Investigate ideas before committing |
| `sdd-propose` | Create a change proposal |
| `sdd-spec` | Write specifications |
| `sdd-design` | Create technical design document |
| `sdd-tasks` | Break down a change into tasks |
| `sdd-apply` | Implement tasks from a change |
| `sdd-verify` | Validate implementation against specs |
| `sdd-archive` | Archive a completed change |
| `sdd-ff` | Fast-forward all SDD planning phases |
| `sdd-continue` | Continue the next SDD phase |
| `next-best-practices` | Writing/reviewing/refactoring Next.js or React code |
| `vercel-react-best-practices` | React/Next.js performance, RSC, data fetching, optimization |
| `shadcn` | Working with shadcn/ui, components.json, Radix UI |
| `tailwind-design-system` | Building design systems with Tailwind CSS v4 |
| `frontend-design` | Building web components, pages, dashboards (production-grade UI) |
| `impeccable` | Design/redesign/audit/polish frontend interfaces |
| `ui-ux-pro-max` | UI/UX design intelligence, styles, color palettes |
| `writing-plans` | After brainstorming, before implementation — create implementation plan |
| `test-driven-development` | Before implementing any feature or bugfix |
| `receiving-code-review` | When receiving code review feedback |
| `requesting-code-review` | After completing tasks, before merging |
| `branch-pr` | Creating pull requests |
| `issue-creation` | Creating GitHub issues |
| `judgment-day` | Adversarial dual review ("judgment day", "doble review") |
| `skill-creator` | Creating new skills |
| `find-skills` | User asks "is there a skill for X?" |

---

## Compact Rules

### next-best-practices
- Use App Router file conventions (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`)
- Server Components by default; `'use client'` only when needed (event handlers, hooks, browser APIs)
- Fetch in Server Components; pass data down as props — avoid client-side fetching for initial data
- Use `next/image` and `next/font` for optimization
- Async `params`/`searchParams` in page props (Next.js 15+)
- Group routes with `(folder)` — no URL impact

### vercel-react-best-practices  
- Avoid `useEffect` for data fetching — use Server Components or RSC patterns
- Memoize expensive computations with `useMemo`; avoid premature `useCallback`
- Colocate state as close to usage as possible
- Prefer composition over prop drilling; use React Context sparingly
- Dynamic imports (`next/dynamic`) for heavy client components

### shadcn
- Components live in `src/components/ui/` — never modify the generated files directly
- Compose shadcn primitives; extend via `className` + `cva` variants
- `cn()` utility from `src/lib/utils.ts` for conditional classes

### tailwind-design-system (v4)
- CSS-first config in `@layer base` / `@layer components` — no `tailwind.config.js` needed
- Use CSS variables for design tokens
- `tw-animate-css` available for animations

---

## Project Conventions

- **Auth**: Supabase SSR (`@supabase/ssr`) — server/client/middleware utils in `src/app/utils/supabase/`
- **Route groups**: `(auth)` for auth pages, `dashboard` for main app, `admin` for admin
- **Components**: Dashboard components in `src/app/components/Dashboard/`; shadcn primitives in `src/components/ui/`
- **Hooks**: Custom hooks in `src/hooks/` (useAccountData, useAnalyticsData, useClientData, useUserProfile, useSettingsData)
- **API routes**: `src/app/api/` — offboarding, admin/create-client
- **No test runner**: Testing infrastructure not set up. Strict TDD Mode unavailable.
