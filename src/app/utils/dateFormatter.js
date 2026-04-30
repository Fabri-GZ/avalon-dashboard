/**
 * Utility to format dates consistently across the dashboard charts.
 * Optimized for clean and compact display in Recharts.
 */

export const formatDate = (dateValue, type = 'daily') => {
  if (!dateValue) return '';
  
  // Ensure we have a valid Date object
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  
  if (isNaN(date.getTime())) return String(dateValue);

  // Use es-AR for consistent Spanish locale
  const locale = 'es-AR';

  switch (type) {
    case 'daily':
      // Format: dd/MM (e.g., 21/02)
      return date.toLocaleDateString(locale, {
        day: '2-digit',
        month: '2-digit',
      });
    
    case 'monthly':
      // Format: MMM yy (e.g., Feb 24)
      const formattedMonth = date.toLocaleDateString(locale, {
        month: 'short',
        year: '2-digit',
      });
      // Clean up common Spanish month abbreviations (remove dots, capitalize)
      return formattedMonth
        .replace(/\./g, '')
        .replace(/^\w/, (c) => c.toUpperCase());
    
    case 'annual':
      // Format: yyyy (e.g., 2024)
      return date.getFullYear().toString();
      
    default:
      return date.toLocaleDateString(locale);
  }
};

/**
 * Recharts Tick Formatter wrapper
 * Can be used directly in XAxis tickFormatter prop
 */
export const chartTickFormatter = (value, filterType) => {
  return formatDate(value, filterType);
};
