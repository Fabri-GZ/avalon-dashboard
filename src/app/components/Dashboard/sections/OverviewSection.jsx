"use client";

import { motion } from "framer-motion";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FiUsers, FiTrendingUp, FiDollarSign, FiMessageSquare } from "react-icons/fi";
import StatCard from "../StatCard";
import { socialMediaData, websiteData, containerVariants, cardVariants } from "../data/mockData";

const OverviewSection = () => {
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
        <StatCard title="Seguidores Totales" value="16.8K" change={9.8} icon={FiUsers} index={0} />
        <StatCard title="Sesiones Web" value="12.8K" change={12.3} icon={FiTrendingUp} index={1} />
        <StatCard title="Inversión Publicitaria" value="$3,800" change={8.6} icon={FiDollarSign} index={2} />
        <StatCard title="Leads Chatbot" value="89" change={15.2} icon={FiMessageSquare} index={3} />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={cardVariants} className="bg-black rounded-xl p-6 border border-gray-800">
          <h3 className="text-xl font-bold text-white mb-4">Crecimiento de Seguidores</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={socialMediaData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2b2b2b" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#000', border: '1px solid #2b2b2b' }}
                labelStyle={{ color: '#fff' }}
              />
              <Line type="monotone" dataKey="followers" stroke="#A047FF" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div variants={cardVariants} className="bg-black rounded-xl p-6 border border-gray-800">
          <h3 className="text-xl font-bold text-white mb-4">Sesiones Web</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={websiteData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2b2b2b" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#000', border: '1px solid #2b2b2b' }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="sessions" fill="#A047FF" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default OverviewSection;