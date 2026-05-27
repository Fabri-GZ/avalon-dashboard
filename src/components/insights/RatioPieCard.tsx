'use client'

import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, Sector, ResponsiveContainer, Label } from 'recharts'
import type { RatioMetric } from '@/lib/insights/types'
import { cardVariants } from './chartTheme'

interface RatioPieCardProps {
  label: string
  ratio: RatioMetric
}

interface ActiveShapeProps {
  cx: number
  cy: number
  innerRadius: number
  outerRadius: number
  startAngle: number
  endAngle: number
  fill: string
  positive: number
  total: number
}

function ActiveShape({
  cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, positive, total,
}: ActiveShapeProps) {
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 4}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <text
        x={cx}
        y={cy + innerRadius + 16}
        textAnchor="middle"
        fill="var(--muted-foreground)"
        fontSize={10}
      >
        {positive} de {total}
      </text>
    </g>
  )
}

export function RatioPieCard({ label, ratio }: RatioPieCardProps) {
  const isEmpty = ratio.total === 0

  const data = [
    { name: ratio.positiveLabel, value: ratio.positive },
    { name: ratio.negativeLabel, value: ratio.negative },
  ]

  return (
    <motion.div
      variants={cardVariants}
      className="bg-card rounded-xl p-5 border border-secondary flex flex-col justify-between min-h-[118px] transition-colors hover:border-border"
    >
      <div className="text-sm font-medium text-muted-foreground">{label}</div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center flex-1 py-2 gap-1">
          <span className="text-2xl font-bold text-muted-foreground tabular-nums">0%</span>
          <span className="text-xs text-muted-foreground">Sin leads en el período</span>
        </div>
      ) : (
        <>
          <div className="relative">
            <ResponsiveContainer width="100%" height={120}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  innerRadius={38}
                  outerRadius={52}
                  cornerRadius={4}
                  paddingAngle={3}
                  startAngle={90}
                  endAngle={-270}
                  activeShape={(props: Record<string, unknown>) => (
                    <ActiveShape
                      cx={props.cx as number}
                      cy={props.cy as number}
                      innerRadius={props.innerRadius as number}
                      outerRadius={props.outerRadius as number}
                      startAngle={props.startAngle as number}
                      endAngle={props.endAngle as number}
                      fill={props.fill as string}
                      positive={ratio.positive}
                      total={ratio.total}
                    />
                  )}
                  stroke="var(--card)"
                  strokeWidth={2}
                >
                  <Cell fill="var(--primary)" />
                  <Cell fill="var(--muted)" />
                  <Label
                    value={`${ratio.rate.toFixed(0)}%`}
                    position="center"
                    fill="var(--foreground)"
                    fontSize={18}
                    fontWeight={700}
                  />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-4 mt-1 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="inline-block w-2 h-2 rounded-full bg-primary" />
              {ratio.positiveLabel}{' '}
              <span className="font-semibold text-foreground tabular-nums">{ratio.positive}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="inline-block w-2 h-2 rounded-full bg-muted-foreground" />
              {ratio.negativeLabel}{' '}
              <span className="font-semibold text-foreground tabular-nums">{ratio.negative}</span>
            </div>
          </div>
        </>
      )}
    </motion.div>
  )
}
