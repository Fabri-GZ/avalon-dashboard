// Budget formatting and parsing for the paid media account registry.
//
// Single site for currency-aware budget display (replaces the 3 sites that
// used to hardcode `currency: 'USD'`: `ClientesView.tsx` once,
// `ClientDetailSheet.tsx` twice) and for the numeric/free-text input split
// the account form routes through (`monthly_budget` vs
// `monthly_budget_note`).

import type { Currency } from './types'

export function formatBudget(amount: number, currency: Currency): string {
  return amount.toLocaleString('es-AR', { style: 'currency', currency, maximumFractionDigits: 0 })
}

/**
 * es-AR thousands separator for a digits-only string: "1500000" -> "1.500.000".
 * Anything that is not purely digits (free-text note) is returned untouched.
 */
export function formatThousandsInput(raw: string): string {
  const digits = raw.replace(/\./g, '')
  if (!/^\d+$/.test(digits)) return raw
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

export interface ParsedBudget {
  monthly_budget: number | null
  monthly_budget_note: string | null
}

// Routes a single free-form input into the numeric column or the note
// column, never both. `''` clears both. A value is numeric only if the
// whole trimmed string parses as a finite number (`Number()`, not
// `parseFloat`) — '200mil', '400 USD' and 'Sin definir' all fail that check
// and land in the note instead.
export function parseBudgetInput(raw: string): ParsedBudget {
  const trimmed = raw.trim()

  if (trimmed === '') {
    return { monthly_budget: null, monthly_budget_note: null }
  }

  // Dots typed by `formatThousandsInput` are thousands separators, not decimals.
  const normalized = /^\d{1,3}(\.\d{3})+$/.test(trimmed) ? trimmed.replace(/\./g, '') : trimmed
  const asNumber = Number(normalized)
  if (Number.isFinite(asNumber)) {
    return { monthly_budget: asNumber, monthly_budget_note: null }
  }

  return { monthly_budget: null, monthly_budget_note: trimmed }
}
