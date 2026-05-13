export default function PMPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-20 gap-3">
      <div className="w-14 h-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-card">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 11l3 3L22 4"/>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
      </div>
      <div className="text-center">
        <p className="font-unbounded font-bold text-sm text-text mb-1">Gestión de Proyectos</p>
        <p className="text-xs text-text-muted font-poppins max-w-[240px] leading-relaxed">
          Seleccioná un cliente desde el panel izquierdo para ver sus tareas.
        </p>
      </div>
    </div>
  )
}
