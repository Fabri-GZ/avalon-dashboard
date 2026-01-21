"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { FiUsers, FiTrendingUp, FiDollarSign, FiMessageSquare } from "react-icons/fi";
import StatCard from "../StatCard";
import {
  calculateSocialMetrics,
  calculateWebsiteMetrics,
  splitIntoPeriods,
  calculatePercentageChange,
  prepareChartData,
  formatNumber,
  containerVariants,
  cardVariants
} from "../data/dataProcessors";

const OverviewSection = ({ client, socialInsights, websiteAnalytics, socialDemographics, dateRange }) => {

  const metrics = useMemo(() => {
    const socialPeriods = splitIntoPeriods(socialInsights);
    const websitePeriods = splitIntoPeriods(websiteAnalytics);

    const currentSocial = calculateSocialMetrics(socialPeriods.current);
    const previousSocial = calculateSocialMetrics(socialPeriods.previous);

    const currentWebsite = calculateWebsiteMetrics(websitePeriods.current);
    const previousWebsite = calculateWebsiteMetrics(websitePeriods.previous);

    return {
      totalReach: {
        value: currentSocial.totalReach,
        change: calculatePercentageChange(currentSocial.totalReach, previousSocial.totalReach)
      },
      sessions: {
        value: currentWebsite.totalSessions,
        change: calculatePercentageChange(currentWebsite.totalSessions, previousWebsite.totalSessions)
      },
      engagement: {
        value: currentSocial.totalEngagement,
        change: calculatePercentageChange(currentSocial.totalEngagement, previousSocial.totalEngagement)
      },
      users: {
        value: currentWebsite.totalUsers,
        change: calculatePercentageChange(currentWebsite.totalUsers, previousWebsite.totalUsers)
      }
    };
  }, [socialInsights, websiteAnalytics]);

  const socialChartData = useMemo(() => {
    return prepareChartData(socialInsights, 'date', ['reach', 'impressions']);
  }, [socialInsights]);

  const websiteChartData = useMemo(() => {
    return prepareChartData(websiteAnalytics, 'date', ['sessions', 'users']);
  }, [websiteAnalytics]);

  return (
    <motion.div
      key="overview"
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, y: 20 }}
      variants={containerVariants}
      className="space-y-6"
    >
      <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Alcance Total" 
          value={formatNumber(metrics.totalReach.value)} 
          change={metrics.totalReach.change} 
          icon={FiUsers} 
          index={0} 
        />
        <StatCard 
          title="Sesiones Web" 
          value={formatNumber(metrics.sessions.value)} 
          change={metrics.sessions.change} 
          icon={FiTrendingUp} 
          index={1} 
        />
        <StatCard 
          title="Engagement Total" 
          value={formatNumber(metrics.engagement.value)} 
          change={metrics.engagement.change} 
          icon={FiDollarSign} 
          index={2} 
        />
        <StatCard 
          title="Usuarios Web" 
          value={formatNumber(metrics.users.value)} 
          change={metrics.users.change} 
          icon={FiMessageSquare} 
          index={3} 
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={cardVariants} className="bg-background rounded-xl p-6 border border-secondary">
          <h3 className="text-xl font-bold text-primary mb-4">Crecimiento de Seguidores</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={socialChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--secondary)" />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--secondary)' }}
                labelStyle={{ color: 'var(--muted-foreground)' }}
              />
              <Line type="monotone" dataKey="reach" stroke="var(--primary)" strokeWidth={2} name="Alcance"/>
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div variants={cardVariants} className="bg-background rounded-xl p-6 border border-secondary">
          <h3 className="text-xl font-bold text-primary mb-4">Sesiones Web</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={websiteChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dateFormatted" />
              <YAxis width="auto"/>
              <Tooltip />
              <Area type="monotone" dataKey="sessions" fill="var(--accent)" stroke="var(--chart-1)" name="Sesiones" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default OverviewSection;