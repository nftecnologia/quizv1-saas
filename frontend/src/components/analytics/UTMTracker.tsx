import React, { useState, useMemo } from 'react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { 
  ExternalLink, 
  Copy, 
  Plus, 
  Trash2, 
  BarChart3,
  TrendingUp,
  Target,
  Eye,
  Users,
  CheckCircle
} from 'lucide-react'
import { useAnalytics } from '../../hooks/useAnalytics'
import { AnalyticsFilter, UTMAnalytics } from '../../types/analytics'
import { MetricsCard } from './charts/MetricsCard'
import { TimeSeriesChart } from './charts/TimeSeriesChart'
import { format, subDays } from 'date-fns'
import { useToast } from '../../hooks/use-toast'

interface UTMCampaign {
  id: string
  name: string
  source: string
  medium: string
  campaign: string
  term?: string
  content?: string
  url: string
  created_at: string
}

interface UTMTrackerProps {
  quizId?: string
  className?: string
}

export function UTMTracker({ quizId, className = '' }: UTMTrackerProps) {
  const { toast } = useToast()
  const [filters, setFilters] = useState<AnalyticsFilter>({
    date_from: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    date_to: format(new Date(), 'yyyy-MM-dd'),
    quiz_id: quizId
  })

  const [showCampaignBuilder, setShowCampaignBuilder] = useState(false)
  const [newCampaign, setNewCampaign] = useState<Partial<UTMCampaign>>({
    name: '',
    source: '',
    medium: '',
    campaign: '',
    term: '',
    content: '',
    url: ''
  })

  // Mock data for campaigns - this would come from your API
  const [campaigns, setCampaigns] = useState<UTMCampaign[]>([
    {
      id: '1',
      name: 'Facebook Ads - Q1',
      source: 'facebook',
      medium: 'cpc',
      campaign: 'spring_promotion',
      term: 'quiz_leads',
      content: 'carousel_ad',
      url: 'https://quiz.app/quiz/123',
      created_at: '2024-01-15'
    },
    {
      id: '2',
      name: 'Google Ads - Brand',
      source: 'google',
      medium: 'cpc',
      campaign: 'brand_awareness',
      term: 'interactive_quiz',
      content: 'text_ad',
      url: 'https://quiz.app/quiz/123',
      created_at: '2024-01-20'
    }
  ])

  const {
    dashboardData,
    isDashboardLoading
  } = useAnalytics(filters)

  const utmData = dashboardData?.utm_performance || []

  // Generate UTM URL
  const generateUTMUrl = (campaign: Partial<UTMCampaign>) => {
    const baseUrl = campaign.url || `${window.location.origin}/quiz/${quizId}`
    const params = new URLSearchParams()
    
    if (campaign.source) params.append('utm_source', campaign.source)
    if (campaign.medium) params.append('utm_medium', campaign.medium)
    if (campaign.campaign) params.append('utm_campaign', campaign.campaign)
    if (campaign.term) params.append('utm_term', campaign.term)
    if (campaign.content) params.append('utm_content', campaign.content)
    
    return `${baseUrl}?${params.toString()}`
  }

  // Calculate campaign performance
  const campaignPerformance = useMemo(() => {
    return campaigns.map(campaign => {
      const performance = utmData.find(utm => 
        utm.utm_source === campaign.source && 
        utm.utm_campaign === campaign.campaign
      )
      
      return {
        ...campaign,
        views: performance?.views || 0,
        conversions: performance?.conversions || 0,
        conversion_rate: performance?.conversion_rate || 0,
        leads: performance?.leads || 0,
        lead_conversion_rate: performance?.lead_conversion_rate || 0,
        cost_per_click: Math.random() * 2 + 0.5, // Mock CPC
        cost_per_lead: Math.random() * 20 + 10 // Mock CPL
      }
    })
  }, [campaigns, utmData])

  // Top performing campaigns
  const topCampaigns = useMemo(() => {
    return [...campaignPerformance]
      .sort((a, b) => b.conversion_rate - a.conversion_rate)
      .slice(0, 3)
  }, [campaignPerformance])

  const handleFilterChange = (key: keyof AnalyticsFilter, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }))
  }

  const handleCampaignChange = (key: keyof UTMCampaign, value: string) => {
    setNewCampaign(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const createCampaign = () => {
    if (!newCampaign.name || !newCampaign.source || !newCampaign.medium || !newCampaign.campaign) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      })
      return
    }

    const campaign: UTMCampaign = {
      id: Date.now().toString(),
      name: newCampaign.name!,
      source: newCampaign.source!,
      medium: newCampaign.medium!,
      campaign: newCampaign.campaign!,
      term: newCampaign.term,
      content: newCampaign.content,
      url: newCampaign.url || `${window.location.origin}/quiz/${quizId}`,
      created_at: new Date().toISOString()
    }

    setCampaigns(prev => [...prev, campaign])
    setNewCampaign({
      name: '',
      source: '',
      medium: '',
      campaign: '',
      term: '',
      content: '',
      url: ''
    })
    setShowCampaignBuilder(false)

    toast({
      title: "Sucesso",
      description: "Campanha UTM criada com sucesso!",
    })
  }

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url)
    toast({
      title: "Copiado!",
      description: "URL copiada para a área de transferência",
    })
  }

  const deleteCampaign = (id: string) => {
    setCampaigns(prev => prev.filter(c => c.id !== id))
    toast({
      title: "Removido",
      description: "Campanha removida com sucesso",
    })
  }

  // Aggregate metrics
  const totalMetrics = useMemo(() => {
    return campaignPerformance.reduce((acc, campaign) => ({
      views: acc.views + campaign.views,
      conversions: acc.conversions + campaign.conversions,
      leads: acc.leads + campaign.leads,
      avgConversionRate: campaignPerformance.length > 0 ? 
        campaignPerformance.reduce((sum, c) => sum + c.conversion_rate, 0) / campaignPerformance.length : 0
    }), { views: 0, conversions: 0, leads: 0, avgConversionRate: 0 })
  }, [campaignPerformance])

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">UTM Tracker</h2>
            <p className="text-gray-600">Gerencie e acompanhe suas campanhas UTM</p>
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
              onClick={() => setShowCampaignBuilder(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Campanha
            </Button>
          </div>
        </div>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricsCard
          title="Total de Visualizações"
          value={totalMetrics.views}
          icon={<Eye className="w-5 h-5" />}
          loading={isDashboardLoading}
        />
        
        <MetricsCard
          title="Total de Conversões"
          value={totalMetrics.conversions}
          icon={<Target className="w-5 h-5" />}
          loading={isDashboardLoading}
        />
        
        <MetricsCard
          title="Taxa Média de Conversão"
          value={totalMetrics.avgConversionRate}
          format="percentage"
          icon={<TrendingUp className="w-5 h-5" />}
          loading={isDashboardLoading}
        />
        
        <MetricsCard
          title="Total de Leads"
          value={totalMetrics.leads}
          icon={<Users className="w-5 h-5" />}
          loading={isDashboardLoading}
        />
      </div>

      {/* Top Performing Campaigns */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Top Campanhas Performando</h3>
        
        <div className="space-y-3">
          {topCampaigns.map((campaign, index) => (
            <div key={campaign.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                  index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                }`}>
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{campaign.name}</div>
                  <div className="text-sm text-gray-600">
                    {campaign.source} • {campaign.medium} • {campaign.campaign}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <div className="font-medium text-gray-900">{campaign.views.toLocaleString('pt-BR')}</div>
                  <div className="text-gray-600">Views</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-900">{campaign.conversions.toLocaleString('pt-BR')}</div>
                  <div className="text-gray-600">Conversões</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-green-600">{campaign.conversion_rate.toFixed(1)}%</div>
                  <div className="text-gray-600">Taxa</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* UTM Performance Chart */}
      <TimeSeriesChart
        data={dashboardData?.time_series || []}
        title="Performance das Campanhas UTM"
        loading={isDashboardLoading}
        metrics={['views', 'completions']}
      />

      {/* Campaign Management */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Campanhas Ativas</h3>
          <span className="text-sm text-gray-600">{campaigns.length} campanhas</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Nome</th>
                <th className="text-left py-2">Fonte</th>
                <th className="text-left py-2">Meio</th>
                <th className="text-left py-2">Campanha</th>
                <th className="text-right py-2">Views</th>
                <th className="text-right py-2">Conversões</th>
                <th className="text-right py-2">Taxa</th>
                <th className="text-center py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {campaignPerformance.map((campaign) => (
                <tr key={campaign.id} className="border-b">
                  <td className="py-3">{campaign.name}</td>
                  <td className="py-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      {campaign.source}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                      {campaign.medium}
                    </span>
                  </td>
                  <td className="py-3">{campaign.campaign}</td>
                  <td className="text-right py-3">{campaign.views.toLocaleString('pt-BR')}</td>
                  <td className="text-right py-3">{campaign.conversions.toLocaleString('pt-BR')}</td>
                  <td className="text-right py-3">{campaign.conversion_rate.toFixed(1)}%</td>
                  <td className="text-center py-3">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(generateUTMUrl(campaign))}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(generateUTMUrl(campaign), '_blank')}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteCampaign(campaign.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Campaign Builder Modal */}
      {showCampaignBuilder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Criar Nova Campanha UTM</h3>
              <Button
                variant="outline"
                onClick={() => setShowCampaignBuilder(false)}
              >
                ×
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="campaign_name">Nome da Campanha *</Label>
                  <Input
                    id="campaign_name"
                    placeholder="Ex: Facebook Ads Q1"
                    value={newCampaign.name || ''}
                    onChange={(e) => handleCampaignChange('name', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="utm_source">Fonte (utm_source) *</Label>
                  <Input
                    id="utm_source"
                    placeholder="Ex: google, facebook, email"
                    value={newCampaign.source || ''}
                    onChange={(e) => handleCampaignChange('source', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="utm_medium">Meio (utm_medium) *</Label>
                  <Input
                    id="utm_medium"
                    placeholder="Ex: cpc, email, social"
                    value={newCampaign.medium || ''}
                    onChange={(e) => handleCampaignChange('medium', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="utm_campaign">Campanha (utm_campaign) *</Label>
                  <Input
                    id="utm_campaign"
                    placeholder="Ex: spring_sale, brand_awareness"
                    value={newCampaign.campaign || ''}
                    onChange={(e) => handleCampaignChange('campaign', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="utm_term">Termo (utm_term)</Label>
                  <Input
                    id="utm_term"
                    placeholder="Ex: quiz_leads, interactive"
                    value={newCampaign.term || ''}
                    onChange={(e) => handleCampaignChange('term', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="utm_content">Conteúdo (utm_content)</Label>
                  <Input
                    id="utm_content"
                    placeholder="Ex: banner_top, text_ad"
                    value={newCampaign.content || ''}
                    onChange={(e) => handleCampaignChange('content', e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="base_url">URL Base</Label>
                <Input
                  id="base_url"
                  placeholder={`${window.location.origin}/quiz/${quizId}`}
                  value={newCampaign.url || ''}
                  onChange={(e) => handleCampaignChange('url', e.target.value)}
                />
              </div>

              {/* URL Preview */}
              {(newCampaign.source || newCampaign.medium || newCampaign.campaign) && (
                <div>
                  <Label>Prévia da URL</Label>
                  <div className="p-3 bg-gray-50 rounded border text-sm break-all">
                    {generateUTMUrl(newCampaign)}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCampaignBuilder(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={createCampaign}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Criar Campanha
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}