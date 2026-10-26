'use server'

import { requireReportsAccess } from '@/lib/reportes/auth'
import type { EnqueueErrorCode } from '@/lib/reportes/types'

// Matches the DB check on report_texts.edited_text (char_length <= 10000).
const MAX_TEXT_LENGTH = 10_000

export type ReportActionError = EnqueueErrorCode | 'unauthorized' | 'invalid_value' | 'db_error'

interface SaveTextResult {
  success: boolean
  error?: ReportActionError
}

// Saves a human edit of one draft section. Goes through the RLS user client on
// purpose (D2): the column grant limits the write to `edited_text` and the
// `report_texts_stamp_edit` trigger stamps edited_by/edited_at and enforces
// `draft_ready`, so none of that can be spoofed from here. `null` or blank
// clears the edit and the AI text applies again.
export async function saveReportTextAction(
  textId: string,
  editedText: string | null,
): Promise<SaveTextResult> {
  if (typeof textId !== 'string' || !textId) return { success: false, error: 'invalid_value' }
  if (editedText !== null && typeof editedText !== 'string') {
    return { success: false, error: 'invalid_value' }
  }
  if (editedText !== null && editedText.length > MAX_TEXT_LENGTH) {
    return { success: false, error: 'invalid_value' }
  }

  const access = await requireReportsAccess()
  if (!access.ok) return { success: false, error: 'unauthorized' }

  // The trigger normalizes blank to null; sending null for blank keeps intent explicit.
  const value = editedText === null || editedText.trim() === '' ? null : editedText

  const { data, error } = await access.supabase
    .from('report_texts')
    .update({ edited_text: value })
    .eq('id', textId)
    .select('id')

  if (error) {
    // 42501 = trigger refused (report no longer draft_ready) or RLS denial.
    if (error.code === '42501') return { success: false, error: 'not_editable' }
    if (error.code === '23514') return { success: false, error: 'invalid_value' }
    console.error('[report-actions] saveReportText error:', error)
    return { success: false, error: 'db_error' }
  }
  // Zero rows: unknown id or filtered out by RLS.
  if (!data || data.length === 0) return { success: false, error: 'not_found' }

  return { success: true }
}
