export function calculateTotal(data, field) {
  return data.reduce((sum, item) => sum + (Number(item[field]) || 0), 0);
}

export function calculateAverage(data, field) {
  if (data.length === 0) return 0;
  return calculateTotal(data, field) / data.length;
}

export function calculatePercentageChange(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function splitIntoPeriods(data) {
  const midpoint = Math.floor(data.length / 2);
  return {
    previous: data.slice(0, midpoint),
    current: data.slice(midpoint)
  };
}

export function groupByPlatform(socialInsights) {
  const platforms = {};
  
  socialInsights.forEach(insight => {
    const platform = insight.platform || 'Unknown';
    if (!platforms[platform]) {
      platforms[platform] = [];
    }
    platforms[platform].push(insight);
  });
  
  return platforms;
}


export function calculateSocialMetrics(socialInsights) {
  const totalImpressions = calculateTotal(socialInsights, 'impressions');
  const totalReach = calculateTotal(socialInsights, 'reach');
  const totalEngagement = calculateTotal(socialInsights, 'likes') + 
                          calculateTotal(socialInsights, 'comments') + 
                          calculateTotal(socialInsights, 'saves');
  const avgEngagementRate = calculateAverage(socialInsights, 'engagement_rate');

  return {
    totalImpressions,
    totalReach,
    totalEngagement,
    avgEngagementRate,
    totalProfileVisits: calculateTotal(socialInsights, 'profile_visits'),
    totalWebsiteClicks: calculateTotal(socialInsights, 'website_clicks'),
    totalVideoViews: calculateTotal(socialInsights, 'video_views')
  };
}


export function calculateWebsiteMetrics(websiteAnalytics) {
  const totalUsers = calculateTotal(websiteAnalytics, 'users');
  const totalSessions = calculateTotal(websiteAnalytics, 'sessions');
  const totalPageviews = calculateTotal(websiteAnalytics, 'pageviews');
  const avgBounceRate = calculateAverage(websiteAnalytics, 'bounce_rate');
  const avgSessionDuration = calculateAverage(websiteAnalytics, 'avg_session_duration');
  const totalConversions = calculateTotal(websiteAnalytics, 'conversions');

  return {
    totalUsers,
    totalSessions,
    totalPageviews,
    avgBounceRate,
    avgSessionDuration,
    totalConversions,
    totalCtaClicks: calculateTotal(websiteAnalytics, 'cta_clicks')
  };
}


export function prepareChartData(data, dateField = 'date', valueFields = []) {
  return data.map(item => {
    const chartItem = {
      date: item[dateField],
      dateFormatted: new Date(item[dateField]).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: 'short'
      })
    };
    
    valueFields.forEach(field => {
      chartItem[field] = Number(item[field]) || 0;
    });
    
    return chartItem;
  });
}


export function groupDemographics(demographics, groupBy = 'age_range') {
  const grouped = {};
  
  demographics.forEach(demo => {
    const key = demo[groupBy] || 'Unknown';
    if (!grouped[key]) {
      grouped[key] = {
        label: key,
        value: 0,
        count: 0
      };
    }
    grouped[key].value += Number(demo.percentage) || 0;
    grouped[key].count += 1;
  });
  
  Object.keys(grouped).forEach(key => {
    if (grouped[key].count > 1) {
      grouped[key].value = grouped[key].value / grouped[key].count;
    }
  });
  
  return Object.values(grouped);
}


export function getTopTrafficSources(websiteAnalytics, limit = 5) {
  const sources = {};
  
  websiteAnalytics.forEach(item => {
    const source = item.traffic_source || 'Direct';
    if (!sources[source]) {
      sources[source] = 0;
    }
    sources[source] += Number(item.sessions) || 0;
  });
  
  return Object.entries(sources)
    .map(([name, sessions]) => ({ name, sessions }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, limit);
}


export function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

export const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  }
};

export const navigation = [
  { id: 'overview', name: 'Resumen', icon: 'RxDashboard' },
  { id: 'website', name: 'Web', icon: 'FiGlobe' },
  { id: 'ads', name: 'Ads', icon: 'FiDollarSign' },
  { id: 'chatbot', name: 'Bot', icon: 'FiMessageSquare' },
  { id: 'account', name: 'Cuenta', icon: 'FiUser' },
];