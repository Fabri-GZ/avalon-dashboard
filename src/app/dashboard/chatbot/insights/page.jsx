"use client"
import { InsightsDashboard } from '@/components/insights/InsightsDashboard'
import { motion } from 'framer-motion'

export default function ChatbotInsightsPage() {
  return (
    <motion.div
      key="chatbot-insights"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <InsightsDashboard />
    </motion.div>
  )
}
