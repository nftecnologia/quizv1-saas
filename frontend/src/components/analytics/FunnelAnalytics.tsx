import React, { useState, useMemo } from 'react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { 
  TrendingDown, 
  TrendingUp, 
  Clock, 
  Users, 
  Target,
  AlertTriangle,
  CheckCircle,
  ArrowRight
} from 'lucide-react'
import { useAnalytics } from '../../hooks/useAnalytics'
import { AnalyticsFilter, FunnelStep } from '../../types/analytics'
import { FunnelChart } from './charts/FunnelChart'
import { TimeSeriesChart } from './charts/TimeSeriesChart'
import { MetricsCard } from './charts/MetricsCard'
import { format, subDays } from 'date-fns'

interface FunnelAnalyticsProps {
  quizId: string
  className?: string
}

export function FunnelAnalytics({ quizId, className = '' }: FunnelAnalyticsProps) {
  const [filters, setFilters] = useState<AnalyticsFilter>({
    date_from: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    date_to: format(new Date(), 'yyyy-MM-dd'),
    quiz_id: quizId
  })

  const [selectedStep, setSelectedStep] = useState<number | null>(null)

  const {
    funnelData,
    timeSeriesData,
    isFunnelLoading,
    isTimeSeriesLoading
  } = useAnalytics(filters)

  // Calculate funnel insights
  const funnelInsights = useMemo(() => {
    if (!funnelData || funnelData.length === 0) return null

    const totalEntries = funnelData[0]?.views || 0
    const totalCompletions = funnelData[funnelData.length - 1]?.completions || 0
    const overallConversionRate = totalEntries > 0 ? (totalCompletions / totalEntries) * 100 : 0

    // Find the step with highest dropout
    let highestDropoffStep: FunnelStep | null = null
    let highestDropoffRate = 0

    for (let i = 1; i < funnelData.length; i++) {
      const currentStep = funnelData[i]
      const previousStep = funnelData[i - 1]
      const dropoffRate = previousStep.views > 0 ? 
        ((previousStep.views - currentStep.views) / previousStep.views) * 100 : 0

      if (dropoffRate > highestDropoffRate) {
        highestDropoffRate = dropoffRate
        highestDropoffStep = currentStep
      }
    }

    // Find the step with best conversion
    const bestConversionStep = funnelData.reduce((best, current) => 
      current.conversion_rate > best.conversion_rate ? current : best
    )

    // Calculate average time per step
    const avgTimePerStep = funnelData.reduce((sum, step) => sum + step.average_time, 0) / funnelData.length

    return {
      totalEntries,
      totalCompletions,
      overallConversionRate,
      highestDropoffStep,
      highestDropoffRate,
      bestConversionStep,
      avgTimePerStep,
      totalSteps: funnelData.length
    }
  }, [funnelData])

  // Calculate step-by-step performance
  const stepPerformance = useMemo(() => {
    if (!funnelData || funnelData.length === 0) return []

    return funnelData.map((step, index) => {
      const previousStep = index > 0 ? funnelData[index - 1] : null
      const dropoffRate = previousStep ? 
        ((previousStep.views - step.views) / previousStep.views) * 100 : 0
      const dropoffCount = previousStep ? previousStep.views - step.views : 0

      return {
        ...step,
        dropoffRate,
        dropoffCount,
        isProblematic: dropoffRate > 30, // Mark steps with >30% dropout as problematic
        isOptimal: step.conversion_rate > 80 // Mark steps with >80% conversion as optimal
      }
    })
  }, [funnelData])

  const handleFilterChange = (key: keyof AnalyticsFilter, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }))
  }

  const getStepStatus = (step: any) => {
    if (step.isOptimal) return { color: 'text-green-600', icon: CheckCircle }
    if (step.isProblematic) return { color: 'text-red-600', icon: AlertTriangle }
    return { color: 'text-yellow-600', icon: Target }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Análise do Funil</h2>
            <p className="text-gray-600">Análise detalhada da jornada do usuário</p>
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
          </div>
        </div>
      </Card>

      {/* Key Metrics */}
      {funnelInsights && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricsCard
            title="Total de Entradas"
            value={funnelInsights.totalEntries}
            icon={<Users className="w-5 h-5" />}
            loading={isFunnelLoading}
          />
          
          <MetricsCard
            title="Taxa de Conversão Geral"
            value={funnelInsights.overallConversionRate}
            format="percentage"
            icon={<Target className="w-5 h-5" />}
            loading={isFunnelLoading}
          />
          
          <MetricsCard
            title="Maior Taxa de Abandono"
            value={funnelInsights.highestDropoffRate}
            format="percentage"
            subtitle={funnelInsights.highestDropoffStep?.step_name}
            icon={<TrendingDown className="w-5 h-5" />}
            loading={isFunnelLoading}
          />
          
          <MetricsCard
            title="Tempo Médio por Etapa"
            value={funnelInsights.avgTimePerStep}
            format="time"
            icon={<Clock className="w-5 h-5" />}
            loading={isFunnelLoading}
          />
        </div>
      )}

      {/* Funnel Visualization */}
      <FunnelChart
        data={funnelData || []}
        title="Visualização do Funil"
        loading={isFunnelLoading}
      />

      {/* Step-by-Step Analysis */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Análise Detalhada por Etapa</h3>
        
        <div className="space-y-4">
          {stepPerformance.map((step, index) => {
            const StatusIcon = getStepStatus(step).icon
            const statusColor = getStepStatus(step).color
            
            return (
              <div
                key={step.step}
                className={`p-4 border rounded-lg transition-all cursor-pointer ${
                  selectedStep === step.step ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedStep(selectedStep === step.step ? null : step.step)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StatusIcon className={`w-5 h-5 ${statusColor}`} />
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Etapa {step.step}: {step.step_name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {step.views.toLocaleString('pt-BR')} visualizações • 
                        {step.completions.toLocaleString('pt-BR')} conclusões • 
                        {step.conversion_rate.toFixed(1)}% conversão
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {index > 0 && (
                      <div className="text-right">
                        <div className={`text-sm font-medium ${
                          step.dropoffRate > 30 ? 'text-red-600' : 
                          step.dropoffRate > 15 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          -{step.dropoffRate.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500">
                          {step.dropoffCount.toLocaleString('pt-BR')} abandonos
                        </div>
                      </div>
                    )}
                    
                    {index < stepPerformance.length - 1 && (
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedStep === step.step && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm text-gray-500">Tempo Médio</div>
                        <div className="font-medium">
                          {Math.floor(step.average_time / 60)}m {Math.floor(step.average_time % 60)}s
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-500">Taxa de Abandono</div>
                        <div className="font-medium">{step.abandons.toLocaleString('pt-BR')}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-500">Performance</div>
                        <div className={`font-medium ${statusColor}`}>
                          {step.isOptimal ? 'Excelente' : step.isProblematic ? 'Atenção' : 'Adequada'}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-500">Recomendação</div>
                        <div className="text-sm">
                          {step.isProblematic ? 'Otimizar conteúdo' : 
                           step.isOptimal ? 'Manter qualidade' : 'Monitorar performance'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Time Series for Funnel Performance */}
      <TimeSeriesChart
        data={timeSeriesData || []}
        title="Evolução da Performance do Funil"
        loading={isTimeSeriesLoading}
        metrics={['views', 'completions', 'abandons']}
        type="area"
      />

      {/* Recommendations */}
      {funnelInsights && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recomendações de Otimização</h3>
          
          <div className="space-y-4">
            {funnelInsights.overallConversionRate < 10 && (
              <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900">Taxa de Conversão Baixa</p>
                  <p className="text-sm text-red-700">
                    Sua taxa de conversão geral está baixa ({funnelInsights.overallConversionRate.toFixed(1)}%). 
                    Considere revisar o conteúdo e a experiência do usuário.
                  </p>
                </div>
              </div>
            )}

            {funnelInsights.highestDropoffRate > 30 && (
              <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <TrendingDown className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900">Alto Abandono Detectado</p>
                  <p className="text-sm text-yellow-700">
                    A etapa "{funnelInsights.highestDropoffStep?.step_name}" tem alta taxa de abandono 
                    ({funnelInsights.highestDropoffRate.toFixed(1)}%). Revise o conteúdo desta etapa.
                  </p>
                </div>
              </div>
            )}

            {funnelInsights.avgTimePerStep > 120 && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">Tempo por Etapa Elevado</p>
                  <p className="text-sm text-blue-700">
                    O tempo médio por etapa é alto ({Math.floor(funnelInsights.avgTimePerStep / 60)}m). 
                    Considere simplificar as questões ou melhorar a UX.
                  </p>
                </div>
              </div>
            )}

            {funnelInsights.overallConversionRate > 20 && (
              <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">Boa Performance</p>
                  <p className="text-sm text-green-700">
                    Seu funil está performando bem! Continue monitorando e fazendo ajustes finos.
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}