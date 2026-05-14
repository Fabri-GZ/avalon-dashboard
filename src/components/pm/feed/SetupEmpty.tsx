export function SetupEmpty() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card px-8 py-16 text-center">
      <div className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 11h-6M19 8v6" />
        </svg>
      </div>
      <h2 className="text-base font-semibold text-foreground">
        No tenés clientes asignados
      </h2>
      <p className="max-w-xs text-sm text-muted-foreground">
        Contactá a un admin para que te asigne proyectos en Asana. Una vez
        configurado, vas a ver acá las tareas y reportes pendientes.
      </p>
    </div>
  )
}
