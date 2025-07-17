import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { TimeSeriesData } from '../../../types/analytics'
import { Card } from '../../ui/card'

interface TimeSeriesChartProps {
  data: TimeSeriesData[]
  title: string
  height?: number
  showLegend?: boolean
  type?: 'line' | 'area'
  metrics?: ('views' | 'starts' | 'completions' | 'abandons' | 'leads')[]
  loading?: boolean
}

export function TimeSeriesChart({
  data,
  title,
  height = 300,
  showLegend = true,
  type = 'line',
  metrics = ['views', 'starts', 'completions'],
  loading
}: TimeSeriesChartProps) {
  const colors = {
    views: '#8884d8',
    starts: '#82ca9d',
    completions: '#ffc658',
    abandons: '#ff7c7c',
    leads: '#8dd1e1'
  }

  const metricLabels = {
    views: 'Visualizações',
    starts: 'Inicializações',
    completions: 'Conclusões',
    abandons: 'Abandonos',
    leads: 'Leads'
  }

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd/MM')
    } catch {
      return dateString
    }
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">
            {format(parseISO(label), 'dd/MM/yyyy')}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value.toLocaleString('pt-BR')}`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </Card>
    )
  }

  const Chart = type === 'area' ? AreaChart : LineChart

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      
      <ResponsiveContainer width="100%" height={height}>
        <Chart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatDate}
            tick={{ fontSize: 12 }}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend />}
          
          {metrics.map((metric) => {
            if (type === 'area') {
              return (
                <Area
                  key={metric}
                  type="monotone"
                  dataKey={metric}
                  stackId="1"
                  stroke={colors[metric]}
                  fill={colors[metric]}
                  fillOpacity={0.6}
                  name={metricLabels[metric]}
                />
              )
            } else {
              return (
                <Line
                  key={metric}
                  type="monotone"
                  dataKey={metric}
                  stroke={colors[metric]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name={metricLabels[metric]}
                />
              )
            }
          })}
        </Chart>
      </ResponsiveContainer>
    </Card>
  )
}