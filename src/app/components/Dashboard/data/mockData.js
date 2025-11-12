// app/components/Dashboard/data/mockData.js

export const socialMediaData = [
  { month: 'Julio', followers: 12400, engagement: 3.2, reach: 45000 },
  { month: 'Agosto', followers: 13200, engagement: 3.8, reach: 52000 },
  { month: 'Septiembre', followers: 14100, engagement: 4.1, reach: 58000 },
  { month: 'Octubre', followers: 15300, engagement: 4.5, reach: 65000 },
  { month: 'Noviembre', followers: 16800, engagement: 4.8, reach: 72000 },
];

export const websiteData = [
  { month: 'Julio', sessions: 8500, users: 6200, pageviews: 24000, bounceRate: 42 },
  { month: 'Agosto', sessions: 9200, users: 6800, pageviews: 28000, bounceRate: 38 },
  { month: 'Septiembre', sessions: 10100, users: 7500, pageviews: 32000, bounceRate: 35 },
  { month: 'Octubre', sessions: 11400, users: 8300, pageviews: 38000, bounceRate: 32 },
  { month: 'Noviembre', sessions: 12800, users: 9400, pageviews: 45000, bounceRate: 30 },
];

export const adsData = [
  { month: 'Julio', spent: 2500, impressions: 125000, clicks: 3200, conversions: 68 },
  { month: 'Agosto', spent: 2800, impressions: 145000, clicks: 3800, conversions: 82 },
  { month: 'Septiembre', spent: 3200, impressions: 168000, clicks: 4500, conversions: 95 },
  { month: 'Octubre', spent: 3500, impressions: 185000, clicks: 5100, conversions: 112 },
  { month: 'Noviembre', spent: 3800, impressions: 210000, clicks: 5800, conversions: 128 },
];

export const chatbotData = {
  conversations: 342,
  messages: 1876,
  leadsCaptures: 89,
  leadsQualified: 56,
  leadsConverted: 23,
  avgResponseTime: '2.3 min',
  satisfactionRate: '94%',
};

export const navigation = [
  { id: 'overview', name: 'Resumen', icon: 'RxDashboard' },
  { id: 'website', name: 'Web', icon: 'FiGlobe' },
  { id: 'ads', name: 'Ads', icon: 'FiDollarSign' },
  { id: 'chatbot', name: 'Bot', icon: 'FiMessageSquare' },
];

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