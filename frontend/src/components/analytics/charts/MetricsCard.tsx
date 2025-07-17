import React from 'react'
import { Card } from '../../ui/card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { ComparisonData } from '../../../types/analytics'

interface MetricsCardProps {
  title: string
  value: string | number
  subtitle?: string
  comparison?: ComparisonData
  icon?: React.ReactNode
  loading?: boolean
  className?: string
  format?: 'number' | 'percentage' | 'currency' | 'time'
}

export function MetricsCard({
  title,
  value,
  subtitle,
  comparison,
  icon,
  loading,
  className = '',
  format = 'number'
}: MetricsCardProps) {
  const formatValue = (val: string | number) => {
    const numVal = typeof val === 'string' ? parseFloat(val) : val
    
    switch (format) {
      case 'percentage':
        return `${numVal.toFixed(1)}%`
      case 'currency':
        return `R$ ${numVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      case 'time':
        const minutes = Math.floor(numVal / 60)
        const seconds = Math.floor(numVal % 60)
        return `${minutes}m ${seconds}s`
      default:
        return numVal.toLocaleString('pt-BR')
    }
  }

  const getTrendIcon = () => {
    if (!comparison) return null
    
    switch (comparison.trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />
      default:
        return <Minus className="w-4 h-4 text-gray-500" />
    }
  }

  const getTrendColor = () => {
    if (!comparison) return 'text-gray-500'
    
    switch (comparison.trend) {
      case 'up':
        return 'text-green-500'
      case 'down':
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        </div>
      </Card>
    )
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {icon && <span className="text-gray-500">{icon}</span>}
            <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          </div>
          
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {formatValue(value)}
          </div>
          
          {subtitle && (
            <p className="text-sm text-gray-500 mb-2">{subtitle}</p>
          )}
          
          {comparison && (
            <div className="flex items-center gap-1 text-sm">
              {getTrendIcon()}
              <span className={getTrendColor()}>
                {comparison.change_percentage > 0 ? '+' : ''}
                {comparison.change_percentage.toFixed(1)}%
              </span>
              <span className="text-gray-500">vs período anterior</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}