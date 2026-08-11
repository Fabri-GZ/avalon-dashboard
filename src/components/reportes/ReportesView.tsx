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
import { periodLabel } from '@/lib/reportes/format'
import { ReportesTopbar } from './ReportesTopbar'
import { ReportHistory } from './ReportHistory'
import { ReportSheet } from './ReportSheet'
import { GenerationBlocker } from './GenerationBlocker'
import { GenerationResultModal } from './GenerationResultModal'

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

/**
 * El resultado terminal de una generación, que es lo único que el modal
 * muestra. Un TTL vencido NO produce uno: el job no terminó, solo dejamos de
 * mirarlo.
 */
interface TerminalResult {
  kind: 'done' | 'error'
  report: Report
}

export function ReportesView({ accounts, initialHistory }: Props) {
  const reducedMotion = useReducedMotion()
  const [reports, setReports] = useState<Report[]>(initialHistory)
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [result, setResult] = useState<TerminalResult | null>(null)
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
        // El modal reemplaza al toast para los finales: es la superficie que
        // ofrece "Ver reporte" y "Reintentar". Dejar los dos duplicaba el
        // aviso y el toast se iba solo justo cuando había algo que decidir.
        setResult({ kind: 'done', report })
      },
      onError: (msg, reason) => {
        const jobId = activeJobId
        setActiveJobId(null)

        // Fix C6. Un TTL vencido no es un final: la fila de la DB sigue en
        // `pending`/`running` y el barredor de jobs colgados la resuelve del
        // lado del servidor. Si estampáramos `error` acá, la tabla mostraría
        // un estado que la DB no tiene hasta el próximo refresh — y encima
        // ofrecería "Reintentar" sobre un job que quizás está por terminar
        // bien. Se avisa y se deja la fila como está.
        if (reason === 'timeout') {
          toast.info(msg)
          return
        }

        const failed = reports.find((x) => x.id === jobId)
        setReports((prev) =>
          prev.map((x) => (x.id === jobId ? { ...x, status: 'error', error: msg } : x)),
        )
        if (failed) {
          setResult({ kind: 'error', report: { ...failed, status: 'error', error: msg } })
        } else {
          // La fila no está en memoria (llegó de otra pestaña). No hay a qué
          // ofrecerle "Reintentar", así que el aviso va por toast.
          toast.error(msg)
        }
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

  // El último reporte que de verdad se puede abrir, que no es lo mismo que el
  // último reporte. `latestByAccount` ignora el estado, así que en cuanto se
  // encola uno nuevo pasa a ser la fila `pending` y el link al anterior
  // desaparece de la tabla — justo mientras el usuario espera el reemplazo.
  //
  // El filtro por `report_url` no es defensivo de más: una fila puede quedar en
  // `done` con la URL en null (pasó con DECOPOINT), y ahí el botón abriría un
  // link vacío, que es peor que no ofrecer el botón.
  const lastDoneByAccount = useMemo(() => {
    const map = new Map<string, Report>()
    for (const r of reports) {
      if (r.status !== 'done' || !r.report_url) continue
      const cur = map.get(r.account_id)
      if (!cur || r.created_at > cur.created_at) map.set(r.account_id, r)
    }
    return map
  }, [reports])

  const rows: AccountRow[] = useMemo(() => {
    const q = norm(search)
    return accounts
      .map((account) => ({
        account,
        latest: latestByAccount.get(account.id) ?? null,
        lastDone: lastDoneByAccount.get(account.id) ?? null,
      }))
      .filter(({ account, latest }) => {
        if (q && !norm(account.name).includes(q)) return false
        if (filter === 'todas') return true
        if (filter === 'done') return latest?.status === 'done'
        if (filter === 'error') return latest?.status === 'error'
        if (filter === 'proceso') return latest?.status === 'pending' || latest?.status === 'running'
        return true
      })
  }, [accounts, latestByAccount, lastDoneByAccount, search, filter])

  // La fila que se está generando, para que el blocker pueda nombrar cuenta y
  // período. Sale de `reports` y no de un state aparte porque `handleGenerate`
  // ya la inserta ahí antes de arrancar el polling: duplicarla en otro state
  // sería una segunda fuente de verdad que hay que mantener sincronizada.
  const activeReport = useMemo(
    () => (activeJobId ? (reports.find((r) => r.id === activeJobId) ?? null) : null),
    [activeJobId, reports],
  )

  // Un solo job a la vez en toda la sección: el bloqueo real vive en la DB, así
  // que mientras uno corre no hay ningún trigger de generar/reintentar que
  // tenga sentido. El blocker tapa la pantalla, pero eso solo detiene al mouse
  // — `disabled` es lo que también detiene al teclado.
  const busy = activeJobId !== null

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
          busy={busy}
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

      {activeReport && (
        <GenerationBlocker
          accountName={activeReport.account_name}
          periodLabel={periodLabel(activeReport.period_year, activeReport.period_month)}
        />
      )}

      {result && (
        <GenerationResultModal
          kind={result.kind}
          accountName={result.report.account_name}
          periodLabel={periodLabel(result.report.period_year, result.report.period_month)}
          reportUrl={result.report.report_url}
          message={result.report.error}
          onRetry={() => {
            // El modal se cierra primero: si no, el blocker del job nuevo
            // aparecería debajo de un diálogo que habla del job anterior.
            setResult(null)
            handleGenerate(
              result.report.account_id,
              result.report.period_year,
              result.report.period_month,
            )
          }}
          onClose={() => setResult(null)}
        />
      )}
    </motion.div>
  )
}
