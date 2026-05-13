'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { formatDate, getInitials, isOverdue } from '@/lib/pm/utils'
import type { Task } from '@/lib/pm/types'

interface Props {
  task: Task
  sectionName: string
  onClose: () => void
}

export function TaskDetailSheet({ task, sectionName, onClose }: Props) {
  const [isClosing, setIsClosing] = useState(false)
  const overdue = isOverdue(task.due_date, task.completed)

  function handleClose() {
    setIsClosing(true)
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return createPortal(
    <div
      className={`fixed inset-0 z-[60] sm:flex sm:items-center sm:justify-center bg-black/40 ${
        isClosing ? 'animate-backdrop-out' : ''
      }`}
      onClick={handleClose}
    >
      <div
        className={`fixed bottom-0 inset-x-0 bg-white rounded-t-2xl max-h-[92vh] overflow-y-auto
          sm:relative sm:bottom-auto sm:inset-x-auto sm:rounded-xl sm:w-full sm:max-w-[480px] sm:max-h-[85vh]
          ${isClosing
            ? 'animate-sheet-down sm:animate-sheet-fade-out'
            : 'animate-sheet-up sm:animate-sheet-fade'
          }`}
        onClick={e => e.stopPropagation()}
        onAnimationEnd={isClosing ? onClose : undefined}
      >
        {/* Drag handle (mobile only) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 sticky top-0 bg-white">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b border-gray-100">
          <div className="flex-1 min-w-0 pr-3">
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider font-poppins mb-1">
              {sectionName}
            </p>
            <h2 className="font-poppins font-semibold text-base text-text leading-snug">
              {task.name}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-text-muted hover:bg-gray-200 transition-colors duration-200 ease-in mt-0.5"
            aria-label="Cerrar"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            {task.completed ? (
              <Pill color="green">Completada</Pill>
            ) : overdue ? (
              <Pill color="red">Vencida</Pill>
            ) : (
              <Pill color="gray">Pendiente</Pill>
            )}
            {task.field_prioridad && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold font-poppins bg-brand/10 text-brand">
                {task.field_prioridad}
              </span>
            )}
          </div>

          {task.assignee && (
            <Row label="Responsable">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-100 text-brand text-[10px] font-unbounded font-bold flex items-center justify-center flex-shrink-0">
                  {getInitials(task.assignee)}
                </span>
                <span className="text-sm font-poppins text-text">{task.assignee}</span>
              </div>
            </Row>
          )}

          {(task.start_date || task.due_date) && (
            <Row label="Fechas">
              <span className="text-sm font-poppins text-text">
                {task.start_date && task.due_date ? (
                  <>
                    {formatDate(task.start_date)}
                    {' → '}
                    <span className={overdue ? 'text-red-600 font-semibold' : ''}>
                      {formatDate(task.due_date)}
                    </span>
                  </>
                ) : task.due_date ? (
                  <span className={overdue ? 'text-red-600 font-semibold' : ''}>
                    {formatDate(task.due_date)}
                  </span>
                ) : (
                  formatDate(task.start_date)
                )}
              </span>
            </Row>
          )}

          {task.field_areas      && <Row label="Áreas">{task.field_areas}</Row>}
          {task.field_proceso    && <Row label="Proceso">{task.field_proceso}</Row>}
          {task.field_plataforma && <Row label="Plataforma">{task.field_plataforma}</Row>}
          {task.field_aprobado   && <Row label="Aprobado">{task.field_aprobado}</Row>}

          {task.notes && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider font-poppins">
                Notas
              </p>
              <p className="text-sm font-poppins text-text leading-relaxed whitespace-pre-wrap">
                {task.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

function Pill({
  color,
  children,
}: {
  color: 'green' | 'red' | 'gray'
  children: React.ReactNode
}) {
  const badge = { green: 'bg-green-50 text-green-700', red: 'bg-red-50 text-red-600', gray: 'bg-gray-100 text-gray-600' }
  const dot   = { green: 'bg-green-400', red: 'bg-red-400', gray: 'bg-gray-400' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold font-poppins ${badge[color]}`}>
      <span className={`w-1.5 h-1.5 rounded-full inline-block ${dot[color]}`} />
      {children}
    </span>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4">
      <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider font-poppins w-[72px] flex-shrink-0 pt-[3px] leading-tight">
        {label}
      </span>
      <div className="flex-1 text-sm font-poppins text-text">
        {children}
      </div>
    </div>
  )
}
