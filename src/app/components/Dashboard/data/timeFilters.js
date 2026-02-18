export function groupByDay(data, dateField = 'date') {
  return data.sort((a, b) => new Date(a[dateField]) - new Date(b[dateField]));
}

export function groupByMonth(data, dateField = 'date') {
  const grouped = {};
  
  data.forEach(item => {
    const date = new Date(item[dateField]);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!grouped[monthKey]) {
      grouped[monthKey] = {
        date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`,
        items: []
      };
    }
    grouped[monthKey].items.push(item);
  });
  
  return Object.values(grouped).map(group => {
    const aggregated = { date: group.date };
    const firstItem = group.items[0];
    
    Object.keys(firstItem).forEach(key => {
      if (typeof firstItem[key] === 'number' || !isNaN(Number(firstItem[key]))) {
        if (key === 'bounce_rate' || key === 'engagement_rate' || key === 'avg_session_duration') {
          aggregated[key] = group.items.reduce((sum, item) => sum + (Number(item[key]) || 0), 0) / group.items.length;
        } else if (key !== 'id' && key !== 'client_id') {
          aggregated[key] = group.items.reduce((sum, item) => sum + (Number(item[key]) || 0), 0);
        }
      } else if (key === 'platform' || key === 'traffic_source' || key === 'region' || key === 'age_range' || key === 'gender' || key === 'country' || key === 'city') {
        aggregated[key] = firstItem[key];
      }
    });
    
    return aggregated;
  }).sort((a, b) => new Date(a.date) - new Date(b.date));
}


export function groupByYear(data, dateField = 'date') {
  const grouped = {};
  
  data.forEach(item => {
    const date = new Date(item[dateField]);
    const yearKey = date.getFullYear().toString();
    
    if (!grouped[yearKey]) {
      grouped[yearKey] = {
        date: `${yearKey}-01-01`,
        items: []
      };
    }
    grouped[yearKey].items.push(item);
  });
  
  return Object.values(grouped).map(group => {
    const aggregated = { date: group.date };
    const firstItem = group.items[0];
    
    Object.keys(firstItem).forEach(key => {
      if (typeof firstItem[key] === 'number' || !isNaN(Number(firstItem[key]))) {
        if (key === 'bounce_rate' || key === 'engagement_rate' || key === 'avg_session_duration') {
          aggregated[key] = group.items.reduce((sum, item) => sum + (Number(item[key]) || 0), 0) / group.items.length;
        } else if (key !== 'id' && key !== 'client_id') {
          aggregated[key] = group.items.reduce((sum, item) => sum + (Number(item[key]) || 0), 0);
        }
      } else if (key === 'platform' || key === 'traffic_source' || key === 'region' || key === 'age_range' || key === 'gender' || key === 'country' || key === 'city') {
        aggregated[key] = firstItem[key];
      }
    });
    
    return aggregated;
  }).sort((a, b) => new Date(a.date) - new Date(b.date));
}


export function applyTimeFilter(data, filterType, dateField = 'date') {
  if (!data || data.length === 0) return [];
  
  switch (filterType) {
    case 'daily':
      return groupByDay(data, dateField);
    case 'monthly':
      return groupByMonth(data, dateField);
    case 'annual':
      return groupByYear(data, dateField);
    default:
      return data;
  }
}


export function formatDateByFilter(dateString, filterType) {
  const date = new Date(dateString);
  
  switch (filterType) {
    case 'daily':
      return date.toLocaleDateString('es-AR', { 
        day: '2-digit', 
        month: 'short',
        year: 'numeric'
      });
    case 'monthly':
      return date.toLocaleDateString('es-AR', { 
        month: 'short', 
        year: 'numeric' 
      });
    case 'annual':
      return date.getFullYear().toString();
    default:
      return dateString;
  }
}