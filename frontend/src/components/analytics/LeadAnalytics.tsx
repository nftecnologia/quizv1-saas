import React, { useState, useMemo } from 'react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Star,
  Download,
  Filter,
  Mail,
  Phone,
  MapPin,
  Calendar
} from 'lucide-react'
import { useAnalytics } from '../../hooks/useAnalytics'
import { AnalyticsFilter } from '../../types/analytics'
import { MetricsCard } from './charts/MetricsCard'
import { TimeSeriesChart } from './charts/TimeSeriesChart'
import { PieChart } from './charts/PieChart'
import { format, subDays } from 'date-fns'

interface LeadAnalyticsProps {
  quizId?: string
  className?: string
}

export function LeadAnalytics({ quizId, className = '' }: LeadAnalyticsProps) {
  const [filters, setFilters] = useState<AnalyticsFilter>({
    date_from: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    date_to: format(new Date(), 'yyyy-MM-dd'),
    quiz_id: quizId
  })

  const [showLeadDetails, setShowLeadDetails] = useState(false)

  const {
    dashboardData,
    isDashboardLoading,
    generateReport,
    isGeneratingReport
  } = useAnalytics(filters)

  const leadData = dashboardData?.lead_analytics

  // Prepare data for charts
  const leadSourcesData = useMemo(() => {
    return leadData?.lead_sources.map(source => ({
      name: source.source || 'Direto',
      value: source.count,
      percentage: source.percentage,
      quality_score: source.quality_score
    })) || []
  }, [leadData?.lead_sources])

  const conversionFunnelData = useMemo(() => {
    return leadData?.lead_conversion_funnel.map(step => ({
      step_name: step.step,
      views: step.leads_entered,
      completions: step.leads_converted,
      conversion_rate: step.conversion_rate
    })) || []
  }, [leadData?.lead_conversion_funnel])

  // Calculate lead quality insights
  const leadQualityInsights = useMemo(() => {
    if (!leadSourcesData.length) return null

    const totalLeads = leadSourcesData.reduce((sum, source) => sum + source.value, 0)
    const avgQuality = leadSourcesData.reduce((sum, source) => 
      sum + (source.quality_score || 0) * source.value, 0) / totalLeads

    const bestQualitySource = leadSourcesData.reduce((best, current) => 
      (current.quality_score || 0) > (best.quality_score || 0) ? current : best
    )

    const highestVolumeSource = leadSourcesData.reduce((highest, current) => 
      current.value > highest.value ? current : highest
    )

    return {
      totalLeads,
      avgQuality,
      bestQualitySource,
      highestVolumeSource
    }
  }, [leadSourcesData])

  const handleFilterChange = (key: keyof AnalyticsFilter, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }))
  }

  const handleExportLeads = async () => {
    try {
      await generateReport('Lead Analytics Report', 'leads', filters)
    } catch (error) {
      console.error('Failed to export leads:', error)
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Análise de Leads</h2>
            <p className="text-gray-600">Acompanhe a geração e qualidade dos seus leads</p>
          </div>

          <div className="flex items-center gap-4">
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
            <Button
              onClick={handleExportLeads}
              disabled={isGeneratingReport}
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricsCard
          title="Total de Leads"
          value={leadData?.total_leads || 0}
          icon={<Users className="w-5 h-5" />}
          loading={isDashboardLoading}
        />
        
        <MetricsCard
          title="Taxa de Conversão"
          value={leadData?.conversion_rate || 0}
          format="percentage"
          icon={<TrendingUp className="w-5 h-5" />}
          loading={isDashboardLoading}
        />
        
        <MetricsCard
          title="Custo por Lead"
          value={leadData?.cost_per_lead || 0}
          format="currency"
          icon={<DollarSign className="w-5 h-5" />}
          loading={isDashboardLoading}
        />
        
        <MetricsCard
          title="Score de Qualidade"
          value={leadQualityInsights?.avgQuality || 0}
          format="number"
          icon={<Star className="w-5 h-5" />}
          loading={isDashboardLoading}
        />
      </div>

      {/* Lead Generation Trend */}
      <TimeSeriesChart
        data={dashboardData?.time_series || []}
        title="Evolução da Geração de Leads"
        loading={isDashboardLoading}
        metrics={['leads']}
        type="area"
      />

      {/* Lead Sources and Quality */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PieChart
          data={leadSourcesData}
          title="Leads por Fonte"
          loading={isDashboardLoading}
        />
        
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Qualidade por Fonte</h3>
          
          {leadSourcesData.length > 0 ? (
            <div className="space-y-3">
              {leadSourcesData
                .sort((a, b) => (b.quality_score || 0) - (a.quality_score || 0))
                .map((source, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{source.name}</div>
                    <div className="text-sm text-gray-600">
                      {source.value.toLocaleString('pt-BR')} leads
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Star className={`w-4 h-4 ${
                      (source.quality_score || 0) >= 8 ? 'text-green-500' :
                      (source.quality_score || 0) >= 6 ? 'text-yellow-500' : 'text-red-500'
                    }`} />
                    <span className="font-medium">
                      {(source.quality_score || 0).toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Nenhum dado disponível
            </div>
          )}
        </Card>
      </div>

      {/* Lead Conversion Funnel */}
      {conversionFunnelData.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Funil de Conversão de Leads</h3>
          
          <div className="space-y-3">
            {conversionFunnelData.map((step, index) => {
              const width = Math.max((step.views / conversionFunnelData[0].views) * 100, 10)
              return (
                <div key={index} className="relative">
                  <div 
                    className="h-10 flex items-center justify-between px-4 rounded bg-blue-500 text-white font-medium"
                    style={{ width: `${width}%`, minWidth: '200px' }}
                  >
                    <span className="text-sm">{step.step_name}</span>
                    <span className="text-sm">{step.views.toLocaleString('pt-BR')}</span>
                  </div>
                  
                  <div className="absolute -right-20 top-1/2 transform -translate-y-1/2 text-xs text-blue-600 font-medium">
                    {step.conversion_rate.toFixed(1)}%
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Lead Quality Analysis */}
      {leadQualityInsights && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Análise de Qualidade dos Leads</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Melhor Fonte por Qualidade</h4>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <Star className="w-6 h-6 text-green-600" />
                  <div>
                    <div className="font-medium text-green-900">
                      {leadQualityInsights.bestQualitySource.name}
                    </div>
                    <div className="text-sm text-green-700">
                      Score: {(leadQualityInsights.bestQualitySource.quality_score || 0).toFixed(1)} • 
                      {leadQualityInsights.bestQualitySource.value.toLocaleString('pt-BR')} leads
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Maior Volume</h4>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="w-6 h-6 text-blue-600" />
                  <div>
                    <div className="font-medium text-blue-900">
                      {leadQualityInsights.highestVolumeSource.name}
                    </div>
                    <div className="text-sm text-blue-700">
                      {leadQualityInsights.highestVolumeSource.value.toLocaleString('pt-BR')} leads • 
                      Score: {(leadQualityInsights.highestVolumeSource.quality_score || 0).toFixed(1)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {leadQualityInsights.totalLeads.toLocaleString('pt-BR')}
                </div>
                <div className="text-sm text-gray-500">Total de Leads</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {leadQualityInsights.avgQuality.toFixed(1)}
                </div>
                <div className="text-sm text-gray-500">Score Médio</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {leadSourcesData.length}
                </div>
                <div className="text-sm text-gray-500">Fontes Ativas</div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Lead Details Toggle */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Detalhes dos Leads</h3>
          <Button
            variant="outline"
            onClick={() => setShowLeadDetails(!showLeadDetails)}
          >
            <Filter className="w-4 h-4 mr-2" />
            {showLeadDetails ? 'Ocultar' : 'Mostrar'} Detalhes
          </Button>
        </div>

        {showLeadDetails && (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              Últimos 50 leads gerados no período selecionado
            </div>

            {/* Mock lead data - this would come from your API */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Nome</th>
                    <th className="text-left py-2">Email</th>
                    <th className="text-left py-2">Fonte</th>
                    <th className="text-left py-2">Data</th>
                    <th className="text-left py-2">Score</th>
                    <th className="text-left py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(10)].map((_, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2">Lead {index + 1}</td>
                      <td className="py-2">lead{index + 1}@email.com</td>
                      <td className="py-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          Google
                        </span>
                      </td>
                      <td className="py-2">{format(subDays(new Date(), index), 'dd/MM/yyyy')}</td>
                      <td className="py-2">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500" />
                          {(8 - index * 0.3).toFixed(1)}
                        </div>
                      </td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          index % 3 === 0 ? 'bg-green-100 text-green-800' :
                          index % 3 === 1 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {index % 3 === 0 ? 'Qualificado' : 
                           index % 3 === 1 ? 'Em análise' : 'Novo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>

      {/* Recommendations */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recomendações</h3>
        
        <div className="space-y-3">
          {leadQualityInsights?.avgQuality && leadQualityInsights.avgQuality < 6 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                <strong>Melhore a qualidade dos leads:</strong> O score médio está baixo. 
                Considere ajustar suas campanhas ou critérios de qualificação.
              </p>
            </div>
          )}
          
          {leadData?.conversion_rate && leadData.conversion_rate < 10 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">
                <strong>Taxa de conversão baixa:</strong> Otimize seu funil de leads 
                para melhorar a conversão de visitantes em leads qualificados.
              </p>
            </div>
          )}
          
          {leadQualityInsights?.totalLeads && leadQualityInsights.totalLeads > 100 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm">
                <strong>Boa geração de leads:</strong> Continue monitorando a qualidade 
                e considere expandir as fontes que estão performando melhor.
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}