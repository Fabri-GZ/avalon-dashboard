/**
 * Formats a date into a human-readable relative time string in Spanish.
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return "Sin datos";
  
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return "Fecha inválida";
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  
  if (diffInSeconds < 0) return "en el futuro";
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  if (diffInSeconds < 60) {
    return "hace unos segundos";
  }
  
  if (diffInMinutes < 60) {
    return `hace ${diffInMinutes} ${diffInMinutes === 1 ? 'minuto' : 'minutos'}`;
  }
  
  if (diffInHours < 24) {
    return `hace ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`;
  }
  
  if (diffInDays < 30) {
    if (diffInDays === 1) return "hace 1 día";
    return `hace ${diffInDays} días`;
  }
  
  if (diffInMonths < 12) {
    if (diffInMonths === 1) return "hace 1 mes";
    return `hace ${diffInMonths} meses`;
  }
  
  if (diffInYears === 1) return "hace 1 año";
  return `hace ${diffInYears} años`;
}
