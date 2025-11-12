"use client";

import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FiDollarSign, FiTrendingUp, FiUsers } from "react-icons/fi";
import StatCard from "../StatCard";
import Accordion from "../Accordion";
import { adsData, containerVariants, cardVariants } from "../data/mockData";

const AdsSection = () => {
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
        <StatCard title="Inversión Total" value="$3,800" change={8.6} icon={FiDollarSign} />
        <StatCard title="Impresiones" value="210K" change={13.5} icon={FiTrendingUp} />
        <StatCard title="Clicks" value="5.8K" change={13.7} icon={FiUsers} />
        <StatCard title="Conversiones" value="128" change={14.3} icon={FiTrendingUp} />
      </motion.div>

      <motion.div
        variants={cardVariants}
        whileHover={{ scale: 1.02 }}
        className="bg-black rounded-xl p-6 border border-gray-800"
      >
        <h3 className="text-xl font-bold text-white mb-4">Inversión vs Conversiones</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={adsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2b2b2b" />
            <XAxis dataKey="month" stroke="#9ca3af" />
            <YAxis yAxisId="left" stroke="#9ca3af" />
            <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#000', border: '1px solid #2b2b2b' }}
              labelStyle={{ color: '#fff' }}
            />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="spent" stroke="#A047FF" strokeWidth={2} name="Inversión ($)" />
            <Line yAxisId="right" type="monotone" dataKey="conversions" stroke="#10b981" strokeWidth={2} name="Conversiones" />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div variants={cardVariants} className="bg-black rounded-xl p-6 border border-gray-800">
        <h3 className="text-xl font-bold text-white mb-4">Recomendaciones IA</h3>
        <Accordion items={[
          {
            title: "💰 Costo por conversión optimizado",
            content: "El costo por conversión bajó a $29.69. Continuar optimizando las campañas actuales manteniendo esta estrategia efectiva."
          },
          {
            title: "🎯 Remarketing de alto rendimiento",
            content: "Las campañas de remarketing tienen un ROAS de 4.2x. Aumentar presupuesto en 20% para capitalizar este canal rentable."
          },
          {
            title: "📊 Formatos de anuncio innovadores",
            content: "Probar anuncios en video. El formato carrusel está teniendo 35% más CTR que otros formatos estáticos."
          }
        ]} />
      </motion.div>
    </motion.div>
  );
};

export default AdsSection;