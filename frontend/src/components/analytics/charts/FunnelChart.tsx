import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { FunnelStep } from '../../../types/analytics'
import { Card } from '../../ui/card'

interface FunnelChartProps {
  data: FunnelStep[]
  title: string
  height?: number
  loading?: boolean
}

export function FunnelChart({ 
  data, 
  title, 
  height = 400,
  loading 
}: FunnelChartProps) {
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1']

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{data.step_name}</p>
          <p className="text-sm text-gray-600">
            Visualizações: {data.views.toLocaleString('pt-BR')}
          </p>
          <p className="text-sm text-gray-600">
            Conclusões: {data.completions.toLocaleString('pt-BR')}
          </p>
          <p className="text-sm text-gray-600">
            Abandonos: {data.abandons.toLocaleString('pt-BR')}
          </p>
          <p className="text-sm font-medium text-blue-600">
            Taxa de Conversão: {data.conversion_rate.toFixed(1)}%
          </p>
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
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </Card>
    )
  }

  // Prepare data for funnel visualization
  const funnelData = data.map((step, index) => ({
    ...step,
    fill: colors[index % colors.length],
    dropoffRate: index > 0 ? ((data[index - 1].views - step.views) / data[index - 1].views) * 100 : 0
  }))

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      
      {/* Funnel visualization */}
      <div className="mb-6">
        <div className="space-y-2">
          {funnelData.map((step, index) => {
            const width = Math.max((step.views / funnelData[0].views) * 100, 10)
            return (
              <div key={step.step} className="relative">
                <div 
                  className="h-12 flex items-center justify-between px-4 rounded text-white font-medium transition-all hover:opacity-80"
                  style={{ 
                    backgroundColor: step.fill,
                    width: `${width}%`,
                    minWidth: '200px'
                  }}
                >
                  <span className="text-sm">{step.step_name}</span>
                  <span className="text-sm">{step.views.toLocaleString('pt-BR')}</span>
                </div>
                
                {index > 0 && step.dropoffRate > 0 && (
                  <div className="absolute -right-16 top-1/2 transform -translate-y-1/2 text-xs text-red-500 font-medium">
                    -{step.dropoffRate.toFixed(1)}%
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Conversion rates chart */}
      <div className="mb-4">
        <h4 className="text-md font-medium mb-3">Taxas de Conversão por Etapa</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={funnelData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="step_name" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              label={{ value: 'Taxa (%)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="conversion_rate" name="Taxa de Conversão (%)">
              {funnelData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {funnelData.length > 0 ? funnelData[0].views.toLocaleString('pt-BR') : '0'}
          </div>
          <div className="text-sm text-gray-500">Total de Entradas</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {funnelData.length > 0 ? 
              funnelData[funnelData.length - 1].completions.toLocaleString('pt-BR') : '0'}
          </div>
          <div className="text-sm text-gray-500">Conversões Finais</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {funnelData.length > 0 ? 
              ((funnelData[funnelData.length - 1].completions / funnelData[0].views) * 100).toFixed(1) : '0'}%
          </div>
          <div className="text-sm text-gray-500">Taxa Geral</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-red-500">
            {funnelData.reduce((total, step) => total + step.abandons, 0).toLocaleString('pt-BR')}
          </div>
          <div className="text-sm text-gray-500">Total Abandonos</div>
        </div>
      </div>
    </Card>
  )
}