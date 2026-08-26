import type { Metadata } from 'next'
import { MockupsChrome } from './MockupsChrome'

// Server layout so the sandbox can declare metadata; the theme toggle needs
// client state and lives in `MockupsChrome`.
//
// `noindex` is the point of this file: /mockups holds design drafts, and a
// draft that outranks the real product in search results is a bug.
export const metadata: Metadata = {
  title: 'Mockups — Avalon Dashboard',
  description: 'Bocetos de diseño internos. No leen datos reales.',
  robots: { index: false, follow: false },
}

export default function MockupsLayout({ children }: { children: React.ReactNode }) {
  return <MockupsChrome>{children}</MockupsChrome>
}
