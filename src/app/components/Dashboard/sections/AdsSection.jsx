"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FiDollarSign, FiTrendingUp, FiUsers, FiEye } from "react-icons/fi";
import StatCard from "../StatCard";
import Accordion from "../Accordion";
import {
  groupByPlatform,
  calculateSocialMetrics,
  prepareChartData,
  formatNumber,
  splitIntoPeriods,
  calculatePercentageChange,
  calculateTotal,
  containerVariants,
  cardVariants,
} from "../data/dataProcessors";

import { applyTimeFilter } from "../data/timeFilters";

const AdsSection = ({ client, socialInsights, socialDemographics, timeFilter }) => {

  const metrics = useMemo(() => {
    const filteredSocial = applyTimeFilter(socialInsights, timeFilter);
    const periods = splitIntoPeriods(filteredSocial);
    const current = calculateSocialMetrics(periods.current);
    const previous = calculateSocialMetrics(periods.previous);

    const totalSpent = 3800; 
    const costPerEngagement = current.totalEngagement > 0 ? totalSpent / current.totalEngagement : 0;

    return {
      impressions: {
        value: current.totalImpressions,
        change: calculatePercentageChange(current.totalImpressions, previous.totalImpressions)
      },
      reach: {
        value: current.totalReach,
        change: calculatePercentageChange(current.totalReach, previous.totalReach)
      },
      websiteClicks: {
        value: current.totalWebsiteClicks,
        change: calculatePercentageChange(current.totalWebsiteClicks, previous.totalWebsiteClicks)
      },
      engagement: {
        value: current.totalEngagement,
        change: calculatePercentageChange(current.totalEngagement, previous.totalEngagement)
      },
      costPerEngagement
    };
  }, [socialInsights, timeFilter]);

  const performanceData = useMemo(() => {
    const filteredSocial = applyTimeFilter(socialInsights, timeFilter);
    return prepareChartData(filteredSocial, 'date', ['impressions', 'likes', 'comments', 'saves'], timeFilter);
  }, [socialInsights, timeFilter]);

  const platformMetrics = useMemo(() => {
    const filteredSocial = applyTimeFilter(socialInsights, timeFilter);
    const grouped = groupByPlatform(filteredSocial);
    return Object.keys(grouped).map(platform => {
      const metrics = calculateSocialMetrics(grouped[platform]);
      return {
        platform,
        impressions: metrics.totalImpressions,
        engagement: metrics.totalEngagement,
        reach: metrics.totalReach
      };
    });
  }, [socialInsights, timeFilter]);

  const recommendations = useMemo(() => {
    const items = [];
    
    if (metrics.engagement.change > 10) {
      items.push({
        title: "🚀 Engagement en crecimiento",
        content: `El engagement creció un ${metrics.engagement.change.toFixed(1)}%. Mantener la estrategia actual de contenido y considerar aumentar frecuencia de publicación.`
      });
    } else if (metrics.engagement.change < -5) {
      items.push({
        title: "⚠️ Engagement descendente",
        content: `El engagement bajó un ${Math.abs(metrics.engagement.change).toFixed(1)}%. Revisar tipo de contenido y horarios de publicación para mejorar interacción.`
      });
    }

    if (metrics.reach.change > 15) {
      items.push({
        title: "📈 Alcance excepcional",
        content: `El alcance aumentó ${metrics.reach.change.toFixed(1)}%. Excelente momento para lanzar campañas de conversión aprovechando la audiencia expandida.`
      });
    }

    if (metrics.costPerEngagement < 0.5) {
      items.push({
        title: "💰 Costo por engagement optimizado",
        content: `El costo por engagement está en $${metrics.costPerEngagement.toFixed(2)}, muy por debajo del promedio. Continuar con esta estrategia efectiva.`
      });
    }

    if (items.length < 3) {
      items.push({
        title: "🎯 Análisis de audiencia",
        content: "Revisar datos demográficos para identificar segmentos de mayor engagement y optimizar contenido para estos grupos."
      });
    }

    return items;
  }, [metrics]);


  return (
    <motion.div
      key="ads"
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, y: 20 }}
      variants={containerVariants}
      className="space-y-6"
    >
      <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          title="Impresiones" 
          value={formatNumber(metrics.impressions.value)} 
          change={metrics.impressions.change} 
          icon={FiEye} 
          index={0} 
        />
        <StatCard 
          title="Alcance" 
          value={formatNumber(metrics.reach.value)} 
          change={metrics.reach.change} 
          icon={FiUsers} 
          index={1} 
        />
        <StatCard 
          title="Clicks al Sitio" 
          value={formatNumber(metrics.websiteClicks.value)} 
          change={metrics.websiteClicks.change} 
          icon={FiTrendingUp} 
          index={2} 
        />
        <StatCard 
          title="Engagement" 
          value={formatNumber(metrics.engagement.value)} 
          change={metrics.engagement.change} 
          icon={FiDollarSign} 
          index={3} 
        />
      </motion.div>

      <motion.div
        variants={cardVariants}
        whileHover={{ scale: 1.02 }}
        className="bg-background rounded-xl p-6 border border-secondary"
      >
        <h3 className="text-xl font-bold text-primary mb-4">Rendimiento de Contenido</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--secondary)" />
            <XAxis 
              dataKey="dateFormatted" 
              stroke="var(--muted-foreground)" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              minTickGap={30}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
            />
            <YAxis 
              stroke="var(--muted-foreground)" 
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatNumber(value)}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--secondary)' }}
              labelStyle={{ color: 'var(--muted-foreground)' }}
            />
            <Legend />
            <Line type="monotone" dataKey="impressions" stroke="var(--chart-1)" strokeWidth={2} name="Impresiones" />
            <Line type="monotone" dataKey="likes" stroke="var(--chart-2)" strokeWidth={2} name="Likes" />
            <Line type="monotone" dataKey="comments" stroke="var(--chart-3)" strokeWidth={2} name="Comentarios" />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div variants={cardVariants} className="bg-background rounded-xl p-6 border border-secondary">
        <h3 className="text-xl font-bold text-primary mb-4">Recomendaciones IA</h3>
        <Accordion items={recommendations} />
      </motion.div>
    </motion.div>
  );
};

export default AdsSection;