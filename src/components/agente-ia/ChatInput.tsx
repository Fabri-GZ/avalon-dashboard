'use client'

import { KeyboardEvent } from 'react'
import { motion } from 'framer-motion'
import { FiSend } from 'react-icons/fi'
import { Textarea } from '@/components/ui/textarea'
import { useAutoResizeTextarea } from '@/hooks/use-auto-resize-textarea'
import { DepartmentSelector } from './DepartmentTopbar'
import type { Department } from '@/lib/agente-ia/types'

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  department: Department
  onDepartmentChange: (dept: Department) => void
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  department,
  onDepartmentChange,
  disabled = false,
  placeholder = '¿Qué trends querés investigar?',
}: ChatInputProps) {
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 48,
    maxHeight: 200,
  })

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!disabled && value.trim()) onSubmit()
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    onChange(e.target.value)
    adjustHeight()
  }

  const canSubmit = !disabled && value.trim().length > 0

  return (
    <div className="rounded-[22px] border border-border/70 bg-card p-2 shadow-[0_10px_34px_-14px_rgba(20,20,40,0.22)] transition-all duration-200 focus-within:border-primary/40 focus-within:shadow-[0_12px_40px_-14px_rgba(160,71,255,0.28)]">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        rows={1}
        className="min-h-0 resize-none border-0 bg-transparent px-3 pb-1 pt-2 text-sm leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/55"
        style={{ height: 48, overflow: 'hidden' }}
      />

      <div className="flex items-center justify-between gap-2 px-1.5 pb-0.5">
        <DepartmentSelector value={department} onChange={onDepartmentChange} />

        <motion.button
          type="button"
          onClick={() => canSubmit && onSubmit()}
          disabled={!canSubmit}
          whileTap={canSubmit ? { scale: 0.9 } : {}}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
            canSubmit
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'cursor-not-allowed bg-secondary text-muted-foreground/50'
          }`}
          aria-label="Enviar"
        >
          <FiSend className="h-[18px] w-[18px]" />
        </motion.button>
      </div>
    </div>
  )
}
