import React from 'react'
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Card } from '../../ui/card'

interface PieChartData {
  name: string
  value: number
  percentage?: number
  color?: string
}

interface PieChartProps {
  data: PieChartData[]
  title: string
  height?: number
  showLegend?: boolean
  showLabels?: boolean
  loading?: boolean
  colors?: string[]
}

const DEFAULT_COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', 
  '#ffb347', '#87ceeb', '#dda0dd', '#98fb98', '#f0e68c'
]

export function PieChart({
  data,
  title,
  height = 300,
  showLegend = true,
  showLabels = true,
  loading,
  colors = DEFAULT_COLORS
}: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  
  const chartData = data.map((item, index) => ({
    ...item,
    percentage: total > 0 ? (item.value / total) * 100 : 0,
    color: item.color || colors[index % colors.length]
  }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            Valor: {data.value.toLocaleString('pt-BR')}
          </p>
          <p className="text-sm text-gray-600">
            Porcentagem: {data.percentage.toFixed(1)}%
          </p>
        </div>
      )
    }
    return null
  }

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null // Don't show labels for slices smaller than 5%
    
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-600">
              {entry.value} ({chartData[index]?.percentage.toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </Card>
    )
  }

  if (chartData.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          Nenhum dado disponível
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={showLabels ? renderCustomLabel : false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend content={<CustomLegend />} />}
        </RechartsPieChart>
      </ResponsiveContainer>

      {/* Summary table */}
      <div className="mt-6 border-t pt-4">
        <div className="space-y-2">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-700">{item.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-900">
                  {item.value.toLocaleString('pt-BR')}
                </span>
                <span className="text-sm text-gray-500 w-12 text-right">
                  {item.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-100">
          <span className="text-sm font-medium text-gray-700">Total</span>
          <span className="text-sm font-bold text-gray-900">
            {total.toLocaleString('pt-BR')}
          </span>
        </div>
      </div>
    </Card>
  )
}