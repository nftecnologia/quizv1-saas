import React, { useState } from 'react'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Target,
  FileText,
  ExternalLink,
  Settings,
  RefreshCw
} from 'lucide-react'
import { AnalyticsDashboard } from '../components/analytics/AnalyticsDashboard'
import { FunnelAnalytics } from '../components/analytics/FunnelAnalytics'
import { LeadAnalytics } from '../components/analytics/LeadAnalytics'
import { UTMTracker } from '../components/analytics/UTMTracker'
import { ReportsGenerator } from '../components/analytics/ReportsGenerator'
import { useRealTimeAnalytics } from '../hooks/useAnalytics'

type TabType = 'dashboard' | 'funnel' | 'leads' | 'utm' | 'reports'

interface Tab {
  id: TabType
  label: string
  icon: React.ReactNode
  description: string
}

const tabs: Tab[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <BarChart3 className="w-5 h-5" />,
    description: 'Visão geral das métricas e performance'
  },
  {
    id: 'funnel',
    label: 'Funil',
    icon: <TrendingUp className="w-5 h-5" />,
    description: 'Análise detalhada do funil de conversão'
  },
  {
    id: 'leads',
    label: 'Leads',
    icon: <Users className="w-5 h-5" />,
    description: 'Análise de geração e qualidade de leads'
  },
  {
    id: 'utm',
    label: 'UTM Tracker',
    icon: <Target className="w-5 h-5" />,
    description: 'Gerenciamento e tracking de campanhas UTM'
  },
  {
    id: 'reports',
    label: 'Relatórios',
    icon: <FileText className="w-5 h-5" />,
    description: 'Geração e agendamento de relatórios'
  }
]

export function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [selectedQuizId, setSelectedQuizId] = useState<string>('')
  
  const {
    realTimeData,
    isLoading: isRealTimeLoading
  } = useRealTimeAnalytics(30000) // 30 seconds

  const renderTabContent = () => {
    const commonProps = {
      quizId: selectedQuizId || undefined,
      className: "mt-6"
    }

    switch (activeTab) {
      case 'dashboard':
        return <AnalyticsDashboard {...commonProps} />
      case 'funnel':
        return selectedQuizId ? (
          <FunnelAnalytics quizId={selectedQuizId} className="mt-6" />
        ) : (
          <Card className="p-8 text-center mt-6">
            <p className="text-gray-600">Selecione um quiz específico para ver a análise do funil</p>
          </Card>
        )
      case 'leads':
        return <LeadAnalytics {...commonProps} />
      case 'utm':
        return <UTMTracker {...commonProps} />
      case 'reports':
        return <ReportsGenerator {...commonProps} />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
              
              {/* Quiz Selector */}
              <div className="flex items-center gap-2">
                <label htmlFor="quiz-select" className="text-sm text-gray-600">
                  Quiz:
                </label>
                <select
                  id="quiz-select"
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                  value={selectedQuizId}
                  onChange={(e) => setSelectedQuizId(e.target.value)}
                >
                  <option value="">Todos os Quizzes</option>
                  <option value="quiz-1">Quiz de Personalidade</option>
                  <option value="quiz-2">Quiz de Produtos</option>
                  <option value="quiz-3">Quiz Educativo</option>
                </select>
              </div>
            </div>

            {/* Real-time indicators */}
            <div className="flex items-center gap-6">
              {realTimeData && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600">
                      {realTimeData.active_users} usuários online
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    {realTimeData.quiz_views_last_hour} views/hora
                  </div>
                </>
              )}
              
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Configurações
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Description */}
        <div className="mb-6">
          <p className="text-gray-600">
            {tabs.find(tab => tab.id === activeTab)?.description}
          </p>
        </div>

        {/* Quick Stats Bar - Only on Dashboard */}
        {activeTab === 'dashboard' && realTimeData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Usuários Ativos</p>
                  <p className="text-2xl font-bold text-green-600">
                    {realTimeData.active_users}
                  </p>
                </div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Views (última hora)</p>
                <p className="text-2xl font-bold text-blue-600">
                  {realTimeData.quiz_views_last_hour}
                </p>
              </div>
            </Card>
            
            <Card className="p-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Conclusões (última hora)</p>
                <p className="text-2xl font-bold text-purple-600">
                  {realTimeData.completions_last_hour}
                </p>
              </div>
            </Card>
            
            <Card className="p-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Leads (última hora)</p>
                <p className="text-2xl font-bold text-orange-600">
                  {realTimeData.leads_last_hour}
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* Tab Content */}
        {renderTabContent()}
      </div>

      {/* Footer with Quick Actions */}
      <div className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>Analytics QuizV1</span>
              <span>•</span>
              <span>Atualizado em tempo real</span>
              <span>•</span>
              <button className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
                <ExternalLink className="w-3 h-3" />
                Documentação
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                Última atualização: {new Date().toLocaleTimeString('pt-BR')}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={isRealTimeLoading}
              >
                <RefreshCw className={`w-3 h-3 ${isRealTimeLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}