'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getInitials, getStatusColors, getStatusLabel } from '@/lib/pm/utils'
import { StatusDot } from '@/components/pm/ui/StatusDot'
import type { Client } from '@/lib/pm/types'

export function ClientItem({ client }: { client: Client }) {
  const pathname = usePathname()
  const isActive = pathname.startsWith(`/dashboard/pm/${client.id}`)
  const colors = getStatusColors(client.status)
  const [hovered, setHovered] = useState(false)

  return (
    <Link
      href={`/dashboard/pm/${client.id}`}
      className="flex items-center gap-2.5 px-2.5 py-2 rounded-item transition-all duration-200 ease-in"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: isActive
          ? colors.bgActive
          : hovered
            ? 'rgba(0,0,0,0.04)'
            : colors.bgResting,
      }}
    >
      <span
        className="w-8 h-8 rounded-avatar flex items-center justify-center text-[10px] font-unbounded font-bold flex-shrink-0"
        style={{
          backgroundColor: colors.avatarBg,
          color: colors.avatarText,
        }}
      >
        {getInitials(client.name)}
      </span>

      <div className="flex-1 min-w-0">
        <p className={`text-xs font-poppins truncate ${isActive ? 'font-semibold' : 'font-medium'} text-text`}>
          {client.name}
        </p>
        <p className="text-xs text-text-muted font-poppins">
          {getStatusLabel(client.status)}
        </p>
      </div>

      <StatusDot status={client.status} />
    </Link>
  )
}
