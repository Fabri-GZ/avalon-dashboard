/**
 * Line format of the `ideas_mes_siguiente` report text (shared contract with the
 * n8n AI prompt and the render):
 *
 *   ## Escalar
 *   - Idea title [Optional chip]
 *     - Reason
 *
 * Pure module (no React) so it can be ported to the n8n render as is.
 */

export type IdeaCategoryKey = 'escalar' | 'pausar' | 'renovar'

export interface Idea {
  title: string
  chip: string | null
  reasons: string[]
}

export type IdeasDoc = Record<IdeaCategoryKey, Idea[]>

export const IDEAS_SECTION_KEY = 'ideas_mes_siguiente'

/** Fixed categories, in render order. */
export const IDEA_CATEGORIES: readonly { key: IdeaCategoryKey; label: string }[] = [
  { key: 'escalar', label: 'Escalar' },
  { key: 'pausar', label: 'Pausar' },
  { key: 'renovar', label: 'Renovar creatividades' },
]

export const emptyIdeasDoc = (): IdeasDoc => ({ escalar: [], pausar: [], renovar: [] })

const HEADER = /^##\s+(.+)$/
const IDEA = /^-\s+(.+?)(?:\s*\[([^\]]+)\])?$/
const REASON = /^\s+-\s+(.+)$/

function categoryFromLabel(label: string): IdeaCategoryKey | null {
  const wanted = label.trim().toLowerCase()
  if (wanted === 'renovar') return 'renovar'
  return IDEA_CATEGORIES.find((c) => c.label.toLowerCase() === wanted)?.key ?? null
}

export type ParseIdeasResult = { ok: true; doc: IdeasDoc } | { ok: false }

/** Parses the text; `ok: false` when any non-blank line breaks the grammar. */
export function parseIdeas(text: string): ParseIdeasResult {
  const doc = emptyIdeasDoc()
  let category: IdeaCategoryKey | null = null
  let idea: Idea | null = null

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trimEnd()
    if (line.trim() === '') continue

    const header = HEADER.exec(line)
    if (header) {
      category = categoryFromLabel(header[1])
      if (!category) return { ok: false }
      idea = null
      continue
    }

    const reason = REASON.exec(line)
    if (reason) {
      if (!idea) return { ok: false }
      idea.reasons.push(reason[1].trim())
      continue
    }

    const match = IDEA.exec(line)
    if (match && category) {
      idea = { title: match[1].trim(), chip: match[2]?.trim() || null, reasons: [] }
      doc[category].push(idea)
      continue
    }

    return { ok: false }
  }
  return { ok: true, doc }
}

/** Saved in place of a cleared title, so the idea and its reasons are not lost. */
export const UNTITLED_IDEA = 'Sin título'

// A trailing `[...]` in a title would be read back as the chip.
const unbracket = (s: string) => s.replace(/\[/g, '(').replace(/\]/g, ')')

/**
 * Text form of the doc; `parseIdeas` reads it back unchanged. Skips empty
 * categories, blank reasons and ideas left completely empty.
 */
export function serializeIdeas(doc: IdeasDoc): string {
  const blocks: string[] = []
  for (const { key, label } of IDEA_CATEGORIES) {
    const lines: string[] = []
    for (const idea of doc[key]) {
      const chip = unbracket(idea.chip?.trim() ?? '')
      const reasons = idea.reasons.map((r) => r.trim()).filter((r) => r !== '')
      const title = unbracket(idea.title.trim())
      if (title === '' && chip === '' && reasons.length === 0) continue
      const shown = title || UNTITLED_IDEA
      lines.push(chip ? `- ${shown} [${chip}]` : `- ${shown}`)
      for (const reason of reasons) lines.push(`  - ${reason}`)
    }
    if (lines.length > 0) blocks.push([`## ${label}`, ...lines].join('\n'))
  }
  return blocks.join('\n')
}
