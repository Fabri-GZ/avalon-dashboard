'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { formatDate, isOverdue, getInitials } from '@/lib/pm/utils'
import { TaskDetailSheet } from './TaskDetailSheet'
import type { Task } from '@/lib/pm/types'

function CheckIcon({ stroke = 'white' }: { stroke?: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 10 10" fill="none">
      <path d="M1.5 5L3.8 7.5L8.5 2" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function OverdueDateBadge({ date }: { date: string }) {
  return (
    <span className="flex items-center gap-1 ml-2 bg-red-50 text-red-600 font-semibold text-xs font-poppins px-2 py-0.5 rounded-md border border-red-100">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      {date}
    </span>
  )
}

export function TaskCard({ task, sectionName }: { task: Task; sectionName: string }) {
  const [optimisticCompleted, setOptimisticCompleted] = useState(task.completed)
  const [isPending, setIsPending] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const router = useRouter()

  const overdue = isOverdue(task.due_date, optimisticCompleted)

  async function handleToggle() {
    if (isPending) return

    const next = !optimisticCompleted
    setOptimisticCompleted(next)
    setIsPending(true)

    try {
      const res = await fetch(`/api/pm/tasks/${task.asana_task_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: next }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      setIsPending(false)
      router.refresh()
    } catch {
      setIsPending(false)
      setOptimisticCompleted(task.completed)
      toast.error('Error al actualizar la tarea')
    }
  }

  return (
    <>
    <div
      onClick={() => setSheetOpen(true)}
      className={`cursor-pointer flex items-center gap-3 rounded-item px-4 py-3 shadow-card transition-all duration-200 ease-in ${
        isPending ? 'opacity-50' : ''
      } ${
        optimisticCompleted
          ? 'bg-gray-50 opacity-70'
          : 'bg-white hover:shadow-md hover:-translate-y-px'
      }`}
    >
      <div
        onClick={e => { e.stopPropagation(); handleToggle() }}
        role="checkbox"
        aria-checked={optimisticCompleted}
        className={`group/check w-5 h-5 rounded flex-shrink-0 border-[1.5px] flex items-center justify-center transition-all duration-200 ease-in ${
          isPending ? 'cursor-wait' : 'cursor-pointer'
        } ${
          optimisticCompleted
            ? 'bg-brand border-brand hover:bg-brand/80 hover:border-brand/80'
            : 'border-gray-300 hover:border-brand hover:bg-brand/10'
        }`}
      >
        {optimisticCompleted && <CheckIcon />}
        {!optimisticCompleted && !isPending && (
          <span className="opacity-0 group-hover/check:opacity-60 transition-opacity duration-200 ease-in">
            <CheckIcon stroke="#7C3AED" />
          </span>
        )}
      </div>

      <span
        className={`flex-1 min-w-0 max-w-[40%] sm:max-w-none text-sm font-poppins leading-snug truncate ${
          optimisticCompleted ? 'line-through text-text-muted' : 'text-text'
        }`}
      >
        {task.name}
      </span>

      {!task.assignee ? (
        <span className="text-xs text-red-400 font-poppins font-medium flex-shrink-0 hidden sm:inline">Sin responsable</span>
      ) : (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="w-6 h-6 rounded-full bg-purple-100 text-brand text-[10px] font-unbounded font-bold flex items-center justify-center">
            {getInitials(task.assignee)}
          </span>
          <span className="text-xs text-text-secondary font-poppins hidden sm:inline">{task.assignee}</span>
        </div>
      )}

      {task.due_date && (
        overdue
          ? <OverdueDateBadge date={formatDate(task.due_date)} />
          : <span className="text-xs font-poppins ml-2 text-text-muted flex-shrink-0">{formatDate(task.due_date)}</span>
      )}
    </div>

    {sheetOpen && (
      <TaskDetailSheet
        task={task}
        sectionName={sectionName}
        onClose={() => setSheetOpen(false)}
      />
    )}
    </>
  )
}
