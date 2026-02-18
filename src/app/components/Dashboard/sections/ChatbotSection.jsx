"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { FiMessageSquare, FiUsers } from "react-icons/fi";
import StatCard from "../StatCard";
import NumberTicker from "../NumberTicker";
import Accordion from "../Accordion";
import { createClient } from '@/app/utils/supabase/client';
import { formatNumber, containerVariants, cardVariants } from "../data/dataProcessors";

const ChatbotSection = ({ client, dateRange }) => {
  const [chatbotData, setChatbotData] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (client?.id) {
      fetchChatbotData();
    }
  }, [client, dateRange]);

  async function fetchChatbotData() {
    try {
      setLoading(true);
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - dateRange);
      const dateFromStr = dateFrom.toISOString().split('T')[0];

      const mockData = {
        conversations: Math.floor(Math.random() * 200) + 100,
        messages: Math.floor(Math.random() * 1000) + 500,
        leadsCaptures: Math.floor(Math.random() * 100) + 50,  
        leadsQualified: Math.floor(Math.random() * 60) + 30,
        leadsConverted: Math.floor(Math.random() * 30) + 15,
        avgResponseTime: "2.3 min",
        satisfactionRate: "92%",
        topQuestions: [
          { question: '¿Cuáles son los precios?', count: 87 },
          { question: '¿Cómo puedo contactarlos?', count: 64 },
          { question: '¿Tienen garantía?', count: 52 },
          { question: '¿Tiempo de entrega?', count: 48 },
          { question: '¿Formas de pago?', count: 41 }
        ]
      };

      setChatbotData(mockData);
    } catch (error) {
      console.error('Error fetching chatbot data:', error);
    } finally {
      setLoading(false);
    }
  }

  const metrics = useMemo(() => {
    if (!chatbotData) return null;

    const qualifiedRate = chatbotData.leadsCaptures > 0 
      ? (chatbotData.leadsQualified / chatbotData.leadsCaptures * 100).toFixed(1)
      : 0;

    const convertedRate = chatbotData.leadsCaptures > 0
      ? (chatbotData.leadsConverted / chatbotData.leadsCaptures * 100).toFixed(1)
      : 0;

    return {
      qualifiedRate,
      convertedRate,
      qualifiedPercentage: chatbotData.leadsCaptures > 0 
        ? (chatbotData.leadsQualified / chatbotData.leadsCaptures * 100).toFixed(0)
        : 0,
      convertedPercentage: chatbotData.leadsCaptures > 0
        ? (chatbotData.leadsConverted / chatbotData.leadsCaptures * 100).toFixed(0)
        : 0
    };
  }, [chatbotData]);

  const recommendations = useMemo(() => {
    if (!chatbotData || !metrics) return [];

    const items = [];

    const responseTime = parseFloat(chatbotData.avgResponseTime);
    if (responseTime < 3) {
      items.push({
        title: "🤖 Tiempo de respuesta excelente",
        content: `El tiempo de respuesta es excelente (${chatbotData.avgResponseTime}). Mantener este nivel de velocidad para garantizar la satisfacción del cliente.`
      });
    } else {
      items.push({
        title: "⏱️ Optimizar tiempo de respuesta",
        content: `El tiempo de respuesta es ${chatbotData.avgResponseTime}. Considerar automatizar más respuestas frecuentes para mejorar la experiencia.`
      });
    }

    if (chatbotData.topQuestions && chatbotData.topQuestions.length > 0) {
      const topQuestion = chatbotData.topQuestions[0];
      items.push({
        title: "💬 Automatización de preguntas frecuentes",
        content: `"${topQuestion.question}" se preguntó ${topQuestion.count} veces. Agregar respuesta destacada o mejorar visibilidad en FAQ.`
      });
    }

    if (parseFloat(metrics.convertedRate) > 20) {
      items.push({
        title: "📈 Conversión superior al promedio",
        content: `La tasa de conversión de ${metrics.convertedRate}% está por encima del promedio. Documentar el proceso para replicar el éxito.`
      });
    } else if (parseFloat(metrics.convertedRate) < 10) {
      items.push({
        title: "🎯 Mejorar cualificación de leads",
        content: `Tasa de conversión de ${metrics.convertedRate}%. Optimizar preguntas de calificación y mejorar seguimiento de leads capturados.`
      });
    }

    return items;
  }, [chatbotData, metrics]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm z-50">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
        
        <div className="relative w-24 h-24 rounded-full border-4 border-primary/20">
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
          <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-primary/60 animate-spin" style={{ animationDirection: "reverse", animationDuration: "1s" }} />
        </div>
      </div>
    </div>
    );
  }

  if (!chatbotData) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center"
      >
        <p className="text-yellow-800 font-medium text-lg">
          No hay datos de chatbot disponibles
        </p>
        <p className="text-yellow-600 mt-2">
          Los datos del chatbot aparecerán aquí una vez que se registren conversaciones
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="chatbot"
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, y: 20 }}
      variants={containerVariants}
      className="space-y-6"
    >
      <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          title="Conversaciones" 
          value={chatbotData.conversations} 
          icon={FiMessageSquare} 
        />
        <StatCard 
          title="Mensajes Enviados" 
          value={chatbotData.messages} 
          icon={FiMessageSquare} 
        />
        <StatCard 
          title="Leads Capturados" 
          value={chatbotData.leadsCaptures} 
          icon={FiUsers} 
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={cardVariants} className="bg-background rounded-xl p-6 border border-primary">
          <h3 className="text-xl font-bold text-primary mb-6">Funnel de Conversión</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Leads Capturados</span>
                <span className="text-muted-foreground font-semibold">
                  <NumberTicker value={chatbotData.leadsCaptures} />
                </span>
              </div>
              <div className="w-full bg-accent-foreground rounded-full h-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="bg-primary h-3 rounded-full"
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Leads Calificados</span>
                <span className="text-muted-foreground font-semibold">
                  <NumberTicker value={chatbotData.leadsQualified} />
                </span>
              </div>
              <div className="w-full bg-accent-foreground rounded-full h-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${metrics.qualifiedPercentage}%` }}
                  transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                  className="bg-primary h-3 rounded-full"
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Leads Convertidos</span>
                <span className="text-muted-foreground font-semibold">
                  <NumberTicker value={chatbotData.leadsConverted} />
                </span>
              </div>
              <div className="w-full bg-accent-foreground rounded-full h-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${metrics.convertedPercentage}%` }}
                  transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
                  className="bg-primary h-3 rounded-full"
                />
              </div>
            </div>
          </div>
          <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <p className="text-sm text-foreground">
              Tasa de conversión: <span className="text-primary font-semibold">{metrics.convertedRate}%</span>
            </p>
          </div>
        </motion.div>

        <motion.div variants={cardVariants} className="bg-background rounded-xl p-6 border border-primary">
          <h3 className="text-xl font-bold text-foreground mb-6">Métricas Clave</h3>
          <div className="space-y-4">
            <motion.div
              whileHover={{ x: 5 }}
              className="flex items-center justify-between p-4 bg-primary/10 rounded-lg"
            >
              <span className="text-foreground">Tiempo de respuesta promedio</span>
              <span className="text-foreground font-semibold">{chatbotData.avgResponseTime}</span>
            </motion.div>
            <motion.div
              whileHover={{ x: 5 }}
              className="flex items-center justify-between p-4 bg-primary/10 rounded-lg"
            >
              <span className="text-foreground">Tasa de satisfacción</span>
              <span className="text-green-500 font-semibold">{chatbotData.satisfactionRate}</span>
            </motion.div>
            <motion.div
              whileHover={{ x: 5 }}
              className="flex items-center justify-between p-4 bg-primary/10 rounded-lg"
            >
              <span className="text-foreground">Total conversaciones</span>
              <span className="text-foreground font-semibold">
                <NumberTicker value={chatbotData.conversations} />
              </span>
            </motion.div>
          </div>
        </motion.div>
      </div>

      <motion.div variants={cardVariants} className="bg-background rounded-xl p-6 border border-primary">
        <h3 className="text-xl font-bold text-foreground mb-4">Preguntas Más Frecuentes</h3>
        <div className="space-y-3">
          {chatbotData.topQuestions.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center bg-background hover:bg-input transition-colors border border-secondary justify-between p-4 rounded-lg cursor-pointer"
            >
              <span className="text-foreground">{item.question}</span>
              <span className="text-primary font-semibold">
                <NumberTicker value={item.count} /> veces
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={cardVariants} className="bg-background rounded-xl p-6 border border-primary">
        <h3 className="text-xl font-bold text-primary mb-4">Recomendaciones IA</h3>
        <Accordion items={recommendations} />
      </motion.div>
    </motion.div>
  );
};

export default ChatbotSection;