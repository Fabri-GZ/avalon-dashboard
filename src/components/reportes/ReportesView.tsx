'use client'

import { useMemo, useState } from 'react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { toast } from 'react-toastify'
import { useJobPolling } from '@/hooks/useJobPolling'
import {
  containerVariants as _container,
  cardVariants as _card,
} from '@/app/components/Dashboard/data/dataProcessors'
import type { AccountOption, AccountRow, Report, ReportFilter } from '@/lib/reportes/types'
import { ReportesTopbar } from './ReportesTopbar'
import { ReportHistory } from './ReportHistory'
import { ReportSheet } from './ReportSheet'

const containerVariants = _container as Variants
const cardVariants = _card as Variants

const POLL_SELECT =
  'id, account_id, account_name, period_year, period_month, status, report_url, error, created_at, updated_at'

const norm = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

interface Props {
  accounts: AccountOption[]
  initialHistory: Report[]
}

export function ReportesView({ accounts, initialHistory }: Props) {
  const reducedMotion = useReducedMotion()
  const [reports, setReports] = useState<Report[]>(initialHistory)
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<ReportFilter>('todas')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [preselect, setPreselect] = useState<string | null>(null)

  const upsertLocal = (r: Report) =>
    setReports((prev) => {
      const i = prev.findIndex((x) => x.id === r.id)
      if (i === -1) return [r, ...prev]
      const next = [...prev]
      next[i] = r
      return next
    })

  useJobPolling<Report>(
    activeJobId,
    {
      onDone: (report) => {
        upsertLocal(report)
        setActiveJobId(null)
        toast.success('Reporte listo')
      },
      onError: (msg) => {
        setReports((prev) =>
          prev.map((x) => (x.id === activeJobId ? { ...x, status: 'error', error: msg } : x)),
        )
        setActiveJobId(null)
        toast.error(msg)
      },
    },
    {
      table: 'reports',
      select: POLL_SELECT,
      getDone: (row) => row as unknown as Report,
      getError: (row) => (row.error as string | null) ?? null,
    },
  )

  const latestByAccount = useMemo(() => {
    const map = new Map<string, Report>()
    for (const r of reports) {
      const cur = map.get(r.account_id)
      if (!cur || r.created_at > cur.created_at) map.set(r.account_id, r)
    }
    return map
  }, [reports])

  const rows: AccountRow[] = useMemo(() => {
    const q = norm(search)
    return accounts
      .map((account) => ({ account, latest: latestByAccount.get(account.id) ?? null }))
      .filter(({ account, latest }) => {
        if (q && !norm(account.name).includes(q)) return false
        if (filter === 'todas') return true
        if (filter === 'done') return latest?.status === 'done'
        if (filter === 'error') return latest?.status === 'error'
        if (filter === 'proceso') return latest?.status === 'pending' || latest?.status === 'running'
        return true
      })
  }, [accounts, latestByAccount, search, filter])

  async function handleGenerate(accountId: string, year: number, month: number) {
    if (activeJobId) {
      toast.info('Esperá a que termine el reporte en curso')
      return
    }
    const account = accounts.find((a) => a.id === accountId)

    let res: Response
    try {
      res = await fetch('/api/reportes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, year, month }),
      })
    } catch {
      toast.error('No se pudo conectar con el servidor')
      return
    }

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast.error(data.error ?? 'No se pudo generar el reporte')
      return
    }

    upsertLocal({
      id: data.jobId,
      account_id: accountId,
      account_name: account?.name ?? accountId,
      period_year: year,
      period_month: month,
      status: 'pending',
      report_url: null,
      error: null,
      manifest: null,
      requested_by: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    setActiveJobId(data.jobId)
  }

  function openSheet(accountId: string | null) {
    setPreselect(accountId)
    setSheetOpen(true)
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={reducedMotion ? undefined : containerVariants}
      className="flex flex-col gap-5"
    >
      <ReportesTopbar
        search={search}
        onSearchChange={setSearch}
        filter={filter}
        onFilterChange={setFilter}
        total={rows.length}
      />

      <motion.div variants={reducedMotion ? undefined : cardVariants}>
        <ReportHistory
          rows={rows}
          onNew={() => openSheet(null)}
          onGenerateFor={(id) => openSheet(id)}
          onRetry={(r) => handleGenerate(r.account_id, r.period_year, r.period_month)}
        />
      </motion.div>

      {sheetOpen && (
        <ReportSheet
          accounts={accounts}
          defaultAccountId={preselect}
          onGenerate={handleGenerate}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </motion.div>
  )
}
