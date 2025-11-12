"use client"

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FiTrendingUp, FiUsers, FiDollarSign, FiMessageSquare, FiGlobe, FiLogOut, FiMenu, FiX, FiChevronDown } from "react-icons/fi";
import { RxDashboard } from "react-icons/rx";

// Mock data
const socialMediaData = [
  { month: 'Julio', followers: 12400, engagement: 3.2, reach: 45000 },
  { month: 'Agosto', followers: 13200, engagement: 3.8, reach: 52000 },
  { month: 'Septiembre', followers: 14100, engagement: 4.1, reach: 58000 },
  { month: 'Octubre', followers: 15300, engagement: 4.5, reach: 65000 },
  { month: 'Noviembre', followers: 16800, engagement: 4.8, reach: 72000 },
];

const websiteData = [
  { month: 'Julio', sessions: 8500, users: 6200, pageviews: 24000, bounceRate: 42 },
  { month: 'Agosto', sessions: 9200, users: 6800, pageviews: 28000, bounceRate: 38 },
  { month: 'Septiembre', sessions: 10100, users: 7500, pageviews: 32000, bounceRate: 35 },
  { month: 'Octubre', sessions: 11400, users: 8300, pageviews: 38000, bounceRate: 32 },
  { month: 'Noviembre', sessions: 12800, users: 9400, pageviews: 45000, bounceRate: 30 },
];

const adsData = [
  { month: 'Julio', spent: 2500, impressions: 125000, clicks: 3200, conversions: 68 },
  { month: 'Agosto', spent: 2800, impressions: 145000, clicks: 3800, conversions: 82 },
  { month: 'Septiembre', spent: 3200, impressions: 168000, clicks: 4500, conversions: 95 },
  { month: 'Octubre', spent: 3500, impressions: 185000, clicks: 5100, conversions: 112 },
  { month: 'Noviembre', spent: 3800, impressions: 210000, clicks: 5800, conversions: 128 },
];

const chatbotData = {
  conversations: 342,
  messages: 1876,
  leadsCaptures: 89,
  leadsQualified: 56,
  leadsConverted: 23,
  avgResponseTime: '2.3 min',
  satisfactionRate: '94%',
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
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

const cardVariants = {
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

// Number Ticker Component
const NumberTicker = ({ value, className = "" }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : value;
    if (isNaN(numValue)) {
      setDisplayValue(value);
      return;
    }
    
    const duration = 1000;
    const steps = 30;
    const increment = numValue / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= numValue) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        const suffix = typeof value === 'string' ? value.replace(/[0-9.-]/g, '') : '';
        setDisplayValue(Math.floor(current) + suffix);
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [value]);
  
  return <span className={className}>{displayValue}</span>;
};

// Accordion Component
const Accordion = ({ items }) => {
  const [openIndex, setOpenIndex] = useState(null);
  
  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="border border-gray-800 rounded-lg overflow-hidden"
        >
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full flex items-center justify-between p-4 bg-black hover:bg-[#2b2b2b] transition-colors text-left"
          >
            <span className="text-white font-medium">{item.title}</span>
            <motion.div
              animate={{ rotate: openIndex === index ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <FiChevronDown className="w-5 h-5 text-[#A047FF]" />
            </motion.div>
          </button>
          <AnimatePresence>
            {openIndex === index && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <div className="p-4 bg-[#A047FF]/10 border-t border-[#A047FF]/20">
                  <p className="text-white">{item.content}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, change, icon: Icon, index }) => {
  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.05, borderColor: "rgba(160, 71, 255, 0.5)" }}
      transition={{ duration: 0.2 }}
      className="bg-black rounded-xl p-6 border border-gray-800 cursor-pointer"
    >
      <div className="flex items-center justify-between mb-4">
        <motion.div
          whileHover={{ rotate: 360 }}
          transition={{ duration: 0.5 }}
          className="p-3 rounded-lg bg-[#A047FF]/10"
        >
          <Icon className="w-6 h-6 text-[#A047FF]" />
        </motion.div>
        {change !== undefined && (
          <motion.span
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className={`text-sm font-semibold ${change > 0 ? 'text-green-500' : 'text-red-500'}`}
          >
            {change > 0 ? '+' : ''}{change}%
          </motion.span>
        )}
      </div>
      <h3 className="text-gray-400 text-sm mb-1">{title}</h3>
      <p className="text-2xl font-bold text-white">
        <NumberTicker value={value} />
      </p>
    </motion.div>
  );
};

// Dashboard Component
const Dashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { id: 'overview', name: 'Resumen', icon: RxDashboard },
    { id: 'website', name: 'Web', icon: FiGlobe },
    { id: 'ads', name: 'Ads', icon: FiDollarSign },
    { id: 'chatbot', name: 'Bot', icon: FiMessageSquare },
  ];

  const Sidebar = ({ mobile }) => (
    <div className={`${mobile ? 'fixed inset-0 z-50 lg:hidden' : 'hidden lg:flex'}`}>
      {mobile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <motion.div
        initial={mobile ? { x: -80 } : false}
        animate={{ x: 0 }}
        exit={mobile ? { x: -80 } : {}}
        transition={{ type: "spring", damping: 20 }}
        className={`${mobile ? 'fixed left-0 top-0 bottom-0 w-20' : 'w-20'} bg-black border-r border-gray-800 flex flex-col items-center py-6 ${mobile ? 'z-50' : ''}`}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="mb-8"
        >
          <div className="w-12 h-12 bg-[#A047FF] rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-xl">A</span>
          </div>
        </motion.div>
        
        <nav className="flex-1 flex flex-col gap-2 w-full px-2">
          {navigation.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`relative group flex flex-col items-center justify-center gap-1 p-3 rounded-lg transition-all ${
                  activeTab === item.id
                    ? 'bg-[#A047FF] text-white'
                    : 'text-gray-400 hover:bg-[#2b2b2b] hover:text-white'
                }`}
                title={item.name}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{item.name}</span>
                <AnimatePresence>
                  {activeTab === item.id && (
                    <motion.div
                      layoutId="activeTab"
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      exit={{ scaleY: 0 }}
                      className="absolute left-0 top-0 bottom-0 w-1 bg-[#A047FF] rounded-r"
                    />
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </nav>
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onLogout}
          className="flex flex-col items-center justify-center gap-1 p-3 rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-500 transition-colors w-full"
          title="Cerrar Sesión"
        >
          <FiLogOut className="w-5 h-5" />
          <span className="text-xs">Salir</span>
        </motion.button>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#2b2b2b] lg:flex flex-cl">
      <Sidebar mobile={false} />
      <AnimatePresence>
        {sidebarOpen && <Sidebar mobile={true} />}
      </AnimatePresence>
      
      <div className="w-full">
        <motion.header
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", damping: 15 }}
          className="bg-black border-b border-gray-800 p-4 lg:p-6 sticky top-0 z-40"
        >
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <FiMenu className="w-6 h-6" />
            </button>
            <motion.h2
              key={activeTab}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-2xl font-bold text-white"
            >
              {navigation.find(item => item.id === activeTab)?.name}
            </motion.h2>
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-[#A047FF] rounded-full flex items-center justify-center text-white font-semibold">
                CM
              </div>
            </motion.div>
          </div>
        </motion.header>

        <main className="p-4 lg:p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
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
            )}

            {activeTab === 'website' && (
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
                  className="bg-black rounded-xl p-6 border border-gray-800"
                >
                  <h3 className="text-xl font-bold text-white mb-4">Tráfico Mensual</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={websiteData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2b2b2b" />
                      <XAxis dataKey="month" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#000', border: '1px solid #2b2b2b' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Legend />
                      <Bar dataKey="sessions" fill="#A047FF" name="Sesiones" />
                      <Bar dataKey="users" fill="#10b981" name="Usuarios" />
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>

                <motion.div variants={cardVariants} className="bg-black rounded-xl p-6 border border-gray-800">
                  <h3 className="text-xl font-bold text-white mb-4">Recomendaciones IA</h3>
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
            )}

            {activeTab === 'ads' && (
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
            )}

            {activeTab === 'chatbot' && (
              <motion.div
                key="chatbot"
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: 20 }}
                variants={containerVariants}
                className="space-y-6"
              >
                <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatCard title="Conversaciones" value={chatbotData.conversations} icon={FiMessageSquare} />
                  <StatCard title="Mensajes Enviados" value={chatbotData.messages} icon={FiMessageSquare} />
                  <StatCard title="Leads Capturados" value={chatbotData.leadsCaptures} icon={FiUsers} />
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <motion.div variants={cardVariants} className="bg-black rounded-xl p-6 border border-gray-800">
                    <h3 className="text-xl font-bold text-white mb-6">Funnel de Conversión</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-400">Leads Capturados</span>
                          <span className="text-white font-semibold">
                            <NumberTicker value={chatbotData.leadsCaptures} />
                          </span>
                        </div>
                        <div className="w-full bg-[#2b2b2b] rounded-full h-3">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="bg-[#A047FF] h-3 rounded-full"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-400">Leads Calificados</span>
                          <span className="text-white font-semibold">
                            <NumberTicker value={chatbotData.leadsQualified} />
                          </span>
                        </div>
                        <div className="w-full bg-[#2b2b2b] rounded-full h-3">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '63%' }}
                            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                            className="bg-[#A047FF] h-3 rounded-full"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-400">Leads Convertidos</span>
                          <span className="text-white font-semibold">
                            <NumberTicker value={chatbotData.leadsConverted} />
                          </span>
                        </div>
                        <div className="w-full bg-[#2b2b2b] rounded-full h-3">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '26%' }}
                            transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
                            className="bg-[#A047FF] h-3 rounded-full"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 p-4 bg-[#A047FF]/10 border border-[#A047FF]/20 rounded-lg">
                      <p className="text-sm text-gray-300">
                        Tasa de conversión: <span className="text-[#A047FF] font-semibold">25.8%</span>
                      </p>
                    </div>
                  </motion.div>

                  <motion.div variants={cardVariants} className="bg-black rounded-xl p-6 border border-gray-800">
                    <h3 className="text-xl font-bold text-white mb-6">Métricas Clave</h3>
                    <div className="space-y-4">
                      <motion.div
                        whileHover={{ x: 5 }}
                        className="flex items-center justify-between p-4 bg-[#2b2b2b] rounded-lg"
                      >
                        <span className="text-gray-400">Tiempo de respuesta promedio</span>
                        <span className="text-white font-semibold">{chatbotData.avgResponseTime}</span>
                      </motion.div>
                      <motion.div
                        whileHover={{ x: 5 }}
                        className="flex items-center justify-between p-4 bg-[#2b2b2b] rounded-lg"
                      >
                        <span className="text-gray-400">Tasa de satisfacción</span>
                        <span className="text-green-500 font-semibold">{chatbotData.satisfactionRate}</span>
                      </motion.div>
                      <motion.div
                        whileHover={{ x: 5 }}
                        className="flex items-center justify-between p-4 bg-[#2b2b2b] rounded-lg"
                      >
                        <span className="text-gray-400">Total conversaciones</span>
                        <span className="text-white font-semibold">
                          <NumberTicker value={chatbotData.conversations} />
                        </span>
                      </motion.div>
                    </div>
                  </motion.div>
                </div>

                <motion.div variants={cardVariants} className="bg-black rounded-xl p-6 border border-gray-800">
                  <h3 className="text-xl font-bold text-white mb-4">Preguntas Más Frecuentes</h3>
                  <div className="space-y-3">
                    {[
                      { question: '¿Cuáles son los precios?', count: 87 },
                      { question: '¿Cómo puedo contactarlos?', count: 64 },
                      { question: '¿Tienen garantía?', count: 52 },
                      { question: '¿Tiempo de entrega?', count: 48 },
                      { question: '¿Formas de pago?', count: 41 }
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        whileHover={{ x: 5, backgroundColor: "#3b3b3b" }}
                        className="flex items-center justify-between p-4 bg-[#2b2b2b] rounded-lg cursor-pointer"
                      >
                        <span className="text-white">{item.question}</span>
                        <span className="text-[#A047FF] font-semibold">
                          <NumberTicker value={item.count} /> veces
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                <motion.div variants={cardVariants} className="bg-black rounded-xl p-6 border border-gray-800">
                  <h3 className="text-xl font-bold text-white mb-4">Recomendaciones IA</h3>
                  <Accordion items={[
                    {
                      title: "🤖 Tiempo de respuesta excelente",
                      content: "El tiempo de respuesta es excelente (2.3 min). Mantener este nivel de velocidad para garantizar la satisfacción del cliente."
                    },
                    {
                      title: "💬 Automatización de preguntas frecuentes",
                      content: "Agregar respuesta automática sobre precios para reducir consultas repetitivas y optimizar el tiempo del equipo."
                    },
                    {
                      title: "📈 Conversión superior al promedio",
                      content: "La tasa de conversión de 25.8% está por encima del promedio. Documentar el proceso para replicar el éxito."
                    }
                  ]} />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;