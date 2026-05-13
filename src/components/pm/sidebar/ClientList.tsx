'use client'

import { useState, useEffect } from 'react'
import { ClientItem } from './ClientItem'
import type { Client } from '@/lib/pm/types'

function SearchIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  )
}

export function ClientList({ clients }: { clients: Client[] }) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), 200)
    return () => clearTimeout(id)
  }, [query])

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(debouncedQuery.toLowerCase())
  )

  return (
    <>
      <div className="px-3 pb-2">
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-item bg-surface border border-border text-text-muted">
          <SearchIcon />
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-xs font-poppins bg-transparent outline-none placeholder:text-text-muted text-text"
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-2 flex flex-col gap-1">
        {filtered.map((client) => (
          <ClientItem key={client.id} client={client} />
        ))}
        {filtered.length === 0 && (
          <p className="text-xs text-text-muted font-poppins px-2 py-4 text-center">
            {query ? 'Sin resultados' : 'Sin clientes cargados'}
          </p>
        )}
      </nav>
    </>
  )
}
