import { useEffect, useRef } from 'react'

interface UseAutoResizeTextareaOptions {
  minHeight?: number
  maxHeight?: number
}

export function useAutoResizeTextarea({
  minHeight = 44,
  maxHeight = 200,
}: UseAutoResizeTextareaOptions = {}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function adjustHeight() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = `${minHeight}px`
    const scrollHeight = el.scrollHeight
    el.style.height = `${Math.min(scrollHeight, maxHeight)}px`
  }

  useEffect(() => {
    adjustHeight()
  })

  return { textareaRef, adjustHeight }
}
