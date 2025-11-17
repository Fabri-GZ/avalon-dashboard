"use client";

import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FiTrendingUp, FiUsers, FiGlobe } from "react-icons/fi";
import StatCard from "../StatCard";
import Accordion from "../Accordion";
import { websiteData, containerVariants, cardVariants } from "../data/mockData";

const WebsiteSection = () => {
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
        <StatCard title="Sesiones" value="12.8K" change={12.3} icon={FiTrendingUp} />
        <StatCard title="Usuarios" value="9.4K" change={13.3} icon={FiUsers} />
        <StatCard title="Vistas de Página" value="45K" change={18.4} icon={FiGlobe} />
        <StatCard title="Tasa de Rebote" value="30%" change={-6.3} icon={FiTrendingUp} />
      </motion.div>

      <motion.div
        variants={cardVariants}
        whileHover={{ scale: 1.02 }}
        className="bg-white rounded-xl p-6 border border-gray-200"
      >
        <h3 className="text-xl font-bold text-[#a047ff] mb-4">Tráfico Mensual</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={websiteData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
              labelStyle={{ color: '#374151' }}
            />
            <Legend />
            <Bar dataKey="sessions" fill="#A047FF" name="Sesiones" />
            <Bar dataKey="users" fill="#ff8fa3" name="Usuarios" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div variants={cardVariants} className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-xl font-bold text-[#a047ff] mb-4">Recomendaciones IA</h3>
        <Accordion items={[
          {
            title: "🚀 Optimización de velocidad",
            content: "La tasa de rebote bajó 6.3%. Continuar optimizando la velocidad de carga y CTAs para mantener esta tendencia positiva."
          },
          {
            title: "📱 Prioridad móvil",
            content: "El 68% del tráfico es móvil. Priorizar optimizaciones mobile-first en el diseño y rendimiento del sitio."
          },
          {
            title: "🔍 Contenido SEO",
            content: "El tráfico orgánico creció 22%. Seguir invirtiendo en contenido SEO de calidad para mantener el crecimiento."
          }
        ]} />
      </motion.div>
    </motion.div>
  );
};

export default WebsiteSection;