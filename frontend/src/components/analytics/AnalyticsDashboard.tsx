import React, { useState, useMemo } from 'react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { 
  Calendar,
  Download,
  Filter,
  RefreshCw,
  TrendingUp,
  Users,
  Eye,
  Target,
  Clock,
  MapPin,
  Smartphone,
  Globe
} from 'lucide-react'
import { useAnalytics, useComparisonAnalytics } from '../../hooks/useAnalytics'
import { AnalyticsFilter } from '../../types/analytics'
import { MetricsCard } from './charts/MetricsCard'
import { TimeSeriesChart } from './charts/TimeSeriesChart'
import { FunnelChart } from './charts/FunnelChart'
import { PieChart } from './charts/PieChart'
import { format, subDays } from 'date-fns'

interface AnalyticsDashboardProps {
  quizId?: string
  showFilters?: boolean
  className?: string
}

export function AnalyticsDashboard({ 
  quizId, 
  showFilters = true,
  className = '' 
}: AnalyticsDashboardProps) {
  const [filters, setFilters] = useState<AnalyticsFilter>({
    date_from: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    date_to: format(new Date(), 'yyyy-MM-dd'),
    quiz_id: quizId
  })

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  const {
    dashboardData,
    isDashboardLoading,
    dashboardError,
    generateReport,
    isGeneratingReport,
    refetchDashboard
  } = useAnalytics(filters)

  const {
    comparisonData,
    isLoading: isComparisonLoading
  } = useComparisonAnalytics(filters)

  // Prepare data for charts
  const deviceData = useMemo(() => {
    return dashboardData?.device_breakdown.map(device => ({
      name: device.device_type === 'mobile' ? 'Mobile' : 
            device.device_type === 'tablet' ? 'Tablet' : 'Desktop',
      value: device.count,
      percentage: device.percentage
    })) || []
  }, [dashboardData?.device_breakdown])

  const geographicData = useMemo(() => {
    return dashboardData?.geographic_data.slice(0, 5).map(geo => ({
      name: geo.country,
      value: geo.count,
      percentage: geo.percentage
    })) || []
  }, [dashboardData?.geographic_data])

  const utmSourceData = useMemo(() => {
    return dashboardData?.utm_performance.map(utm => ({
      name: utm.utm_source || 'Direto',
      value: utm.views,
      conversions: utm.conversions,
      conversion_rate: utm.conversion_rate
    })) || []
  }, [dashboardData?.utm_performance])

  const handleFilterChange = (key: keyof AnalyticsFilter, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }))
  }

  const handleExportReport = async (format: 'pdf' | 'csv') => {
    try {
      await generateReport(
        `Analytics Report - ${format.toUpperCase()}`,
        'overview',
        filters
      )
    } catch (error) {
      console.error('Failed to generate report:', error)
    }
  }

  const resetFilters = () => {
    setFilters({
      date_from: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
      date_to: format(new Date(), 'yyyy-MM-dd'),
      quiz_id: quizId
    })
  }

  if (dashboardError) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erro ao carregar dados de analytics</p>
          <Button onClick={() => refetchDashboard()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar Novamente
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with filters */}
      {showFilters && (
        <Card className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
              <p className="text-gray-600">Acompanhe o desempenho dos seus quizzes</p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
              
              <Button
                variant="outline"
                onClick={() => refetchDashboard()}
                disabled={isDashboardLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isDashboardLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleExportReport('pdf')}
                disabled={isGeneratingReport}
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="mt-6 pt-6 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="date_from">Data Inicial</Label>
                  <Input
                    id="date_from"
                    type="date"
                    value={filters.date_from || ''}
                    onChange={(e) => handleFilterChange('date_from', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="date_to">Data Final</Label>
                  <Input
                    id="date_to"
                    type="date"
                    value={filters.date_to || ''}
                    onChange={(e) => handleFilterChange('date_to', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="utm_source">Fonte UTM</Label>
                  <Input
                    id="utm_source"
                    placeholder="Ex: google, facebook"
                    value={filters.utm_source || ''}
                    onChange={(e) => handleFilterChange('utm_source', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="device_type">Dispositivo</Label>
                  <select
                    id="device_type"
                    className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-md"
                    value={filters.device_type || ''}
                    onChange={(e) => handleFilterChange('device_type', e.target.value)}
                  >
                    <option value="">Todos</option>
                    <option value="mobile">Mobile</option>
                    <option value="tablet">Tablet</option>
                    <option value="desktop">Desktop</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={resetFilters}>
                  Limpar Filtros
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricsCard
          title="Total de Visualizações"
          value={dashboardData?.overview.total_views || 0}
          icon={<Eye className="w-5 h-5" />}
          comparison={comparisonData ? {
            current_period: dashboardData?.overview.total_views || 0,
            previous_period: comparisonData.previous_period.total_views,
            change_percentage: comparisonData.change_percentage,
            trend: comparisonData.trend
          } : undefined}
          loading={isDashboardLoading || isComparisonLoading}
        />
        
        <MetricsCard
          title="Taxa de Conversão"
          value={dashboardData?.overview.conversion_rate || 0}
          format="percentage"
          icon={<Target className="w-5 h-5" />}
          loading={isDashboardLoading}
        />
        
        <MetricsCard
          title="Leads Gerados"
          value={dashboardData?.overview.leads_generated || 0}
          icon={<Users className="w-5 h-5" />}
          loading={isDashboardLoading}
        />
        
        <MetricsCard
          title="Tempo Médio"
          value={dashboardData?.overview.average_time || 0}
          format="time"
          icon={<Clock className="w-5 h-5" />}
          loading={isDashboardLoading}
        />
      </div>

      {/* Time Series Chart */}
      <TimeSeriesChart
        data={dashboardData?.time_series || []}
        title="Tendência de Performance"
        loading={isDashboardLoading}
        metrics={['views', 'starts', 'completions']}
      />

      {/* Funnel Analysis */}
      {dashboardData?.funnel_analysis && dashboardData.funnel_analysis.length > 0 && (
        <FunnelChart
          data={dashboardData.funnel_analysis}
          title="Análise do Funil de Conversão"
          loading={isDashboardLoading}
        />
      )}

      {/* Device and Geographic Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PieChart
          data={deviceData}
          title="Dispositivos"
          loading={isDashboardLoading}
        />
        
        <PieChart
          data={geographicData}
          title="Países (Top 5)"
          loading={isDashboardLoading}
        />
      </div>

      {/* UTM Performance */}
      {utmSourceData.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Performance por Fonte de Tráfego</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Fonte</th>
                  <th className="text-right py-2">Visualizações</th>
                  <th className="text-right py-2">Conversões</th>
                  <th className="text-right py-2">Taxa de Conversão</th>
                </tr>
              </thead>
              <tbody>
                {utmSourceData.map((source, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{source.name}</td>
                    <td className="text-right py-2">{source.value.toLocaleString('pt-BR')}</td>
                    <td className="text-right py-2">{source.conversions.toLocaleString('pt-BR')}</td>
                    <td className="text-right py-2">{source.conversion_rate.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Real-time Metrics */}
      {dashboardData?.real_time && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Métricas em Tempo Real</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {dashboardData.real_time.active_users}
              </div>
              <div className="text-sm text-gray-500">Usuários Ativos</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {dashboardData.real_time.quiz_views_last_hour}
              </div>
              <div className="text-sm text-gray-500">Views (última hora)</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {dashboardData.real_time.completions_last_hour}
              </div>
              <div className="text-sm text-gray-500">Conclusões (última hora)</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {dashboardData.real_time.leads_last_hour}
              </div>
              <div className="text-sm text-gray-500">Leads (última hora)</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}