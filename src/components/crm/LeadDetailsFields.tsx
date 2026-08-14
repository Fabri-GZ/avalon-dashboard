import type { IconType } from 'react-icons'
import { getDetailFields } from '@/lib/crm/registry'
import type { Lead } from '@/lib/crm/types'

function Field({ icon: Icon, label, value }: { icon: IconType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        {/* `pre-line` so a field whose `format` returns newlines (Viviera's
            accumulated `notas`) renders as a list instead of one run-on line.
            Single-line values are unaffected. */}
        <span className="whitespace-pre-line text-sm font-medium text-foreground">{value}</span>
      </div>
    </div>
  )
}

// Generic `details` renderer driven entirely by `src/lib/crm/registry.ts` --
// replaces the Grupo-Norte-only field list `LeadInfoPanel` used to render
// directly. A client without a registry entry (or a lead whose fields are all
// empty/hidden) renders nothing here, never an error (design D2).
export function LeadDetailsFields({ lead }: { lead: Lead }) {
  const fields = getDetailFields(lead.client_key)

  const rendered = fields.flatMap((field) => {
    if (field.showWhen && !field.showWhen(lead)) return []
    const raw = lead.details[field.key]
    const value = field.format(raw, lead.details)
    if (!value) return []
    return [{ key: field.key, icon: field.icon, label: field.label, value }]
  })

  if (rendered.length === 0) return null

  return (
    <div className="flex flex-col gap-4 border-t border-border pt-4">
      {rendered.map((field) => (
        <Field key={field.key} icon={field.icon} label={field.label} value={field.value} />
      ))}
    </div>
  )
}
