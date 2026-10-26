import { LuPlus, LuTrash2, LuX } from 'react-icons/lu'
import { Button } from '@/components/ui/button'
import {
  IDEA_CATEGORIES,
  type Idea,
  type IdeaCategoryKey,
  type IdeasDoc,
} from '@/lib/reportes/ideas-format'

const INPUT_CLASS =
  'h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50 read-only:opacity-70'

const LABEL_CLASS =
  'mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground'

// Same colors as the final report design.
const DOT_COLOR: Record<IdeaCategoryKey, string> = {
  escalar: 'bg-[#0AD059]',
  pausar: 'bg-[#FC4A1A]',
  renovar: 'bg-[#3533F6]',
}

interface Props {
  value: IdeasDoc
  onChange: (doc: IdeasDoc) => void
  readOnly: boolean
}

/** Structured editor for the monthly ideas: no markup is ever shown to the user. */
export function IdeasEditor({ value, onChange, readOnly }: Props) {
  const setIdeas = (key: IdeaCategoryKey, ideas: Idea[]) => onChange({ ...value, [key]: ideas })

  return (
    <div className="space-y-5">
      {IDEA_CATEGORIES.map(({ key, label }) => {
        const ideas = value[key]
        const updateIdea = (index: number, patch: Partial<Idea>) =>
          setIdeas(key, ideas.map((idea, i) => (i === index ? { ...idea, ...patch } : idea)))

        return (
          <div key={key} className="space-y-3">
            <div className="flex items-center gap-2">
              <span aria-hidden="true" className={`size-2.5 rounded-full ${DOT_COLOR[key]}`} />
              <h3 className="text-sm font-semibold">{label}</h3>
              <span className="text-xs text-muted-foreground">
                {ideas.length} {ideas.length === 1 ? 'idea' : 'ideas'}
              </span>
            </div>

            {ideas.map((idea, index) => {
              const id = `idea-${key}-${index}`
              return (
                <div key={id} className="space-y-3 rounded-lg border border-border bg-background p-3">
                  <div className="flex items-start gap-2">
                    <div className="grid flex-1 gap-3 sm:grid-cols-[2fr_1fr]">
                      <div>
                        <label htmlFor={`${id}-title`} className={LABEL_CLASS}>
                          Idea
                        </label>
                        <input
                          id={`${id}-title`}
                          value={idea.title}
                          readOnly={readOnly}
                          maxLength={200}
                          autoComplete="off"
                          onChange={(e) => updateIdea(index, { title: e.target.value })}
                          className={INPUT_CLASS}
                        />
                      </div>
                      <div>
                        <label htmlFor={`${id}-chip`} className={LABEL_CLASS}>
                          Conjunto o campaña (opcional)
                        </label>
                        <input
                          id={`${id}-chip`}
                          value={idea.chip ?? ''}
                          readOnly={readOnly}
                          maxLength={80}
                          autoComplete="off"
                          onChange={(e) => updateIdea(index, { chip: e.target.value || null })}
                          className={INPUT_CLASS}
                        />
                      </div>
                    </div>
                    {!readOnly && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Quitar idea ${index + 1} de ${label}`}
                        className="mt-5"
                        onClick={() => setIdeas(key, ideas.filter((_, i) => i !== index))}
                      >
                        <LuTrash2 />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {idea.reasons.map((reason, r) => (
                      <div key={`${id}-reason-${r}`} className="flex items-center gap-2">
                        <label htmlFor={`${id}-reason-${r}`} className="sr-only">
                          Motivo {r + 1}
                        </label>
                        <input
                          id={`${id}-reason-${r}`}
                          value={reason}
                          readOnly={readOnly}
                          maxLength={400}
                          autoComplete="off"
                          placeholder="Motivo"
                          onChange={(e) =>
                            updateIdea(index, {
                              reasons: idea.reasons.map((x, i) => (i === r ? e.target.value : x)),
                            })
                          }
                          className={INPUT_CLASS}
                        />
                        {!readOnly && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Quitar motivo ${r + 1}`}
                            onClick={() =>
                              updateIdea(index, { reasons: idea.reasons.filter((_, i) => i !== r) })
                            }
                          >
                            <LuX />
                          </Button>
                        )}
                      </div>
                    ))}
                    {!readOnly && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => updateIdea(index, { reasons: [...idea.reasons, ''] })}
                      >
                        <LuPlus /> Agregar motivo
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}

            {!readOnly && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setIdeas(key, [...ideas, { title: '', chip: null, reasons: [] }])}
              >
                <LuPlus /> Agregar idea
              </Button>
            )}
          </div>
        )
      })}
    </div>
  )
}
