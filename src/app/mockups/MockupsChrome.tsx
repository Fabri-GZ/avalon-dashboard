'use client'

import { useEffect, useState } from 'react'
import { LuMoon as Moon, LuSun as Sun } from 'react-icons/lu'
import { Button } from '@/components/ui/button'

// Design-only sandbox. Routes under `/mockups` are static drafts used to agree
// on a design before any SDD cycle starts — they never read Supabase, never
// call a Server Action and are not registered in `ROUTE_SECTION_MAP`.
//
// The theme toggle writes the same `.dark` class on `documentElement` the real
// dashboard uses (`Sidebar.jsx` / `UserMenu.jsx`), so what renders here is the
// production token set, not an approximation.

export function MockupsChrome({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const root = document.documentElement
    const previous = root.classList.contains('dark')
    root.classList.toggle('dark', theme === 'dark')
    return () => {
      root.classList.toggle('dark', previous)
    }
  }, [theme])

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/90 px-5 py-3 backdrop-blur">
        <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-semibold tracking-wide text-secondary-foreground">
          MOCKUP
        </span>
        <p className="hidden text-sm text-muted-foreground sm:block">Boceto de diseño — no lee datos reales</p>
        <Button
          size="sm"
          variant="outline"
          className="ml-auto"
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          aria-label={theme === 'light' ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'}
        >
          {theme === 'light' ? <Moon className="size-3.5" /> : <Sun className="size-3.5" />}
          {theme === 'light' ? 'Oscuro' : 'Claro'}
        </Button>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
    </div>
  )
}
