import { TaskCard } from '@/components/pm/ui/TaskCard'
import type { SectionWithTasks } from '@/lib/pm/types'

function EmptyIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 12h6M12 9v6"/>
    </svg>
  )
}

export function TasksTab({ sections }: { sections: SectionWithTasks[] }) {
  const visibleSections = sections.filter((s) => s.tasks.length > 0)

  if (visibleSections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-14 h-14 rounded-2xl bg-muted border border-border flex items-center justify-center text-muted-foreground">
          <EmptyIcon />
        </div>
        <div className="text-center">
          <p className="font-bold text-sm text-foreground mb-1">Sin tareas</p>
          <p className="text-xs text-muted-foreground max-w-[220px] leading-relaxed">
            Usá el botón Sincronizar para traer las tareas desde Asana.
          </p>
        </div>
      </div>
    )
  }

  const pendingSections = visibleSections.map((s) => ({
    ...s,
    tasks: s.tasks.filter((t) => !t.completed),
  })).filter((s) => s.tasks.length > 0)

  const completedSections = visibleSections.map((s) => ({
    ...s,
    tasks: s.tasks.filter((t) => t.completed),
  })).filter((s) => s.tasks.length > 0)

  return (
    <div className="space-y-8">
      {pendingSections.length > 0 && (
        <div className="space-y-6">
          {pendingSections.map((section) => (
            <SectionBlock key={section.id} section={section} />
          ))}
        </div>
      )}

      {completedSections.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest font-poppins">
              Completadas
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="space-y-6 opacity-60">
            {completedSections.map((section) => (
              <SectionBlock key={section.id} section={section} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SectionBlock({ section }: { section: SectionWithTasks }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider font-poppins whitespace-nowrap">
          {section.name}
        </span>
        <div className="flex-1 h-px bg-border" />
        <span className="text-[10px] text-muted-foreground font-poppins flex-shrink-0">
          {section.tasks.length}
        </span>
      </div>
      <div className="space-y-1.5">
        {section.tasks.map((task) => (
          <TaskCard key={task.id} task={task} sectionName={section.name} />
        ))}
      </div>
    </div>
  )
}
