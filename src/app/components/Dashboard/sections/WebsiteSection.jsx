"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FiTrendingUp, FiUsers, FiGlobe } from "react-icons/fi";
import StatCard from "../StatCard";
import Accordion from "../Accordion";
import {
  calculateWebsiteMetrics,
  prepareChartData,
  formatNumber,
  splitIntoPeriods,
  calculatePercentageChange,
  getTopTrafficSources,
  containerVariants,
  cardVariants
} from "../data/dataProcessors";

import { applyTimeFilter } from "../data/timeFilters";

const WebsiteSection = ({ client, websiteAnalytics, timeFilter }) => {
  const metrics = useMemo(() => {
    const filteredWebsite = applyTimeFilter(websiteAnalytics, timeFilter);
    const periods = splitIntoPeriods(filteredWebsite);
    const current = calculateWebsiteMetrics(periods.current);
    const previous = calculateWebsiteMetrics(periods.previous);

    return {
      sessions: {
        value: current.totalSessions,
        change: calculatePercentageChange(current.totalSessions, previous.totalSessions)
      },
      users: {
        value: current.totalUsers,
        change: calculatePercentageChange(current.totalUsers, previous.totalUsers)
      },
      pageviews: {
        value: current.totalPageviews,
        change: calculatePercentageChange(current.totalPageviews, previous.totalPageviews)
      },
      bounceRate: {
        value: current.avgBounceRate,
        change: calculatePercentageChange(current.avgBounceRate, previous.avgBounceRate)
      },
      conversions: {
        value: current.totalConversions,
        change: calculatePercentageChange(current.totalConversions, previous.totalConversions)
      }
    };
  }, [websiteAnalytics, timeFilter]);

  const trafficData = useMemo(() => {
    const filteredWebsite = applyTimeFilter(websiteAnalytics, timeFilter);
    return prepareChartData(filteredWebsite, 'date', ['sessions', 'users', 'pageviews'], timeFilter);
  }, [websiteAnalytics, timeFilter]);

  const conversionRate = useMemo(() => {
    return metrics.sessions.value > 0 
      ? ((metrics.conversions.value / metrics.sessions.value) * 100).toFixed(2)
      : 0;
  }, [metrics]);

  const recommendations = useMemo(() => {
    const items = [];

    if (metrics.bounceRate.change < -5) {
      items.push({
        title: "🚀 Optimización de velocidad",
        content: `La tasa de rebote bajó ${Math.abs(metrics.bounceRate.change).toFixed(1)}%. Excelente trabajo en la optimización. Continuar mejorando la experiencia de usuario.`
      });
    } else if (metrics.bounceRate.change > 10) {
      items.push({
        title: "⚠️ Atención: Tasa de rebote alta",
        content: `La tasa de rebote aumentó ${metrics.bounceRate.change.toFixed(1)}%. Revisar velocidad de carga, contenido inicial y experiencia mobile.`
      });
    }

    if (metrics.users.change > 15) {
      items.push({
        title: "📈 Crecimiento excepcional",
        content: `Los usuarios crecieron ${metrics.users.change.toFixed(1)}%. Momento ideal para implementar estrategias de retención y conversión.`
      });
    } else if (metrics.users.change < 0) {
      items.push({
        title: "🔍 Optimización SEO necesaria",
        content: `Los usuarios bajaron ${Math.abs(metrics.users.change).toFixed(1)}%. Revisar estrategia SEO, contenido y canales de adquisición.`
      });
    }

    if (parseFloat(conversionRate) > 3) {
      items.push({
        title: "🎯 Conversiones sobresalientes",
        content: `Tasa de conversión de ${conversionRate}% supera el promedio. Documentar el proceso exitoso para replicarlo.`
      });
    } else if (parseFloat(conversionRate) < 1) {
      items.push({
        title: "💡 Mejorar conversiones",
        content: `Tasa de conversión de ${conversionRate}% tiene potencial de mejora. Optimizar CTAs, formularios y proceso de checkout.`
      });
    }

    if (items.length < 3) {
      items.push({
        title: "📱 Prioridad móvil",
        content: "Revisar analytics por dispositivo y optimizar la experiencia mobile, que representa la mayoría del tráfico web actual."
      });
    }

    return items;
  }, [metrics, conversionRate]);

  if (websiteAnalytics.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center"
      >
        <p className="text-yellow-800 font-medium text-lg">
          No hay datos de analítica web disponibles
        </p>
        <p className="text-yellow-600 mt-2">
          Los datos de tu sitio web aparecerán aquí una vez que se registren en el sistema
        </p>
      </motion.div>
    );
  }
  return (
    <motion.div
      key="website"
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, y: 20 }}
      variants={containerVariants}
      className="space-y-6"
    >
      <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          title="Sesiones" 
          value={formatNumber(metrics.sessions.value)} 
          change={metrics.sessions.change} 
          icon={FiTrendingUp}
        />
        <StatCard 
          title="Usuarios" 
          value={formatNumber(metrics.users.value)} 
          change={metrics.users.change} 
          icon={FiUsers}
        />
        <StatCard 
          title="Vistas de Página" 
          value={formatNumber(metrics.pageviews.value)} 
          change={metrics.pageviews.change} 
          icon={FiGlobe}
        />
        <StatCard 
          title="Tasa de Rebote" 
          value={`${metrics.bounceRate.value.toFixed(1)}%`} 
          change={metrics.bounceRate.change} 
          icon={FiTrendingUp}
        />
      </motion.div>

      <motion.div
        variants={cardVariants}
        whileHover={{ scale: 1.02 }}
        className="bg-background rounded-xl p-6 border border-secondary"
      >
        <h3 className="text-xl font-bold text-primary mb-4">Tráfico Mensual</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={trafficData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--secondary)" />
            <XAxis dataKey="dateFormatted" stroke="var(--muted-foreground)" />
            <YAxis stroke="var(--muted-foreground)" />
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--secondary)' }}
              labelStyle={{ color: 'var(--muted-foreground)' }}
            />
            <Legend />
            <Bar dataKey="sessions" fill="var(--chart-1)" name="Sesiones" />
            <Bar dataKey="users" fill="var(--chart-2)" name="Usuarios" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div variants={cardVariants} className="bg-background rounded-xl p-6 border border-secondary">
        <h3 className="text-xl font-bold text-primary mb-4">Recomendaciones IA</h3>
        <Accordion items={recommendations} />
      </motion.div>
    </motion.div>
  );
};

export default WebsiteSection;