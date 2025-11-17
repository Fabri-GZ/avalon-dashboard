"use client";

import { motion } from "framer-motion";
import { FiMessageSquare, FiUsers } from "react-icons/fi";
import StatCard from "../StatCard";
import NumberTicker from "../NumberTicker";
import Accordion from "../Accordion";
import { chatbotData, containerVariants, cardVariants } from "../data/mockData";

const ChatbotSection = () => {
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
        <StatCard title="Conversaciones" value={chatbotData.conversations} icon={FiMessageSquare} />
        <StatCard title="Mensajes Enviados" value={chatbotData.messages} icon={FiMessageSquare} />
        <StatCard title="Leads Capturados" value={chatbotData.leadsCaptures} icon={FiUsers} />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={cardVariants} className="bg-white rounded-xl p-6 border border-[#a047ff]">
          <h3 className="text-xl font-bold text-[#a047ff] mb-6">Funnel de Conversión</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Leads Capturados</span>
                <span className="text-gray-500 font-semibold">
                  <NumberTicker value={chatbotData.leadsCaptures} />
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
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
                <span className="text-gray-600">Leads Calificados</span>
                <span className="text-gray-500 font-semibold">
                  <NumberTicker value={chatbotData.leadsQualified} />
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
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
                <span className="text-gray-600">Leads Convertidos</span>
                <span className="text-gray-500 font-semibold">
                  <NumberTicker value={chatbotData.leadsConverted} />
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
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
            <p className="text-sm text-gray-600">
              Tasa de conversión: <span className="text-[#A047FF] font-semibold">25.8%</span>
            </p>
          </div>
        </motion.div>

        <motion.div variants={cardVariants} className="bg-white rounded-xl p-6 border border-[#a047ff]">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Métricas Clave</h3>
          <div className="space-y-4">
            <motion.div
              whileHover={{ x: 5 }}
              className="flex items-center justify-between p-4 bg-gray-100 rounded-lg"
            >
              <span className="text-gray-500">Tiempo de respuesta promedio</span>
              <span className="text-gray-900 font-semibold">{chatbotData.avgResponseTime}</span>
            </motion.div>
            <motion.div
              whileHover={{ x: 5 }}
              className="flex items-center justify-between p-4 bg-gray-100 rounded-lg"
            >
              <span className="text-gray-500">Tasa de satisfacción</span>
              <span className="text-green-500 font-semibold">{chatbotData.satisfactionRate}</span>
            </motion.div>
            <motion.div
              whileHover={{ x: 5 }}
              className="flex items-center justify-between p-4 bg-gray-100 rounded-lg"
            >
              <span className="text-gray-500">Total conversaciones</span>
              <span className="text-gray-900 font-semibold">
                <NumberTicker value={chatbotData.conversations} />
              </span>
            </motion.div>
          </div>
        </motion.div>
      </div>

      <motion.div variants={cardVariants} className="bg-white rounded-xl p-6 border border-[#a047ff]">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Preguntas Más Frecuentes</h3>
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
              whileHover={{ backgroundColor: "#e8d9ff" }}
              className="flex items-center justify-between p-4 bg-gray-100 rounded-lg cursor-pointer"
            >
              <span className="text-gray-900">{item.question}</span>
              <span className="text-[#A047FF] font-semibold">
                <NumberTicker value={item.count} /> veces
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={cardVariants} className="bg-white rounded-xl p-6 border border-[#a047ff]">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Recomendaciones IA</h3>
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
  );
};

export default ChatbotSection;