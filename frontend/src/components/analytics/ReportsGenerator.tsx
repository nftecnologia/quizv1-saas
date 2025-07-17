import React, { useState, useRef } from 'react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { 
  Download, 
  FileText, 
  Table, 
  Image, 
  Calendar,
  Clock,
  Settings,
  Mail,
  Share2,
  CheckCircle
} from 'lucide-react'
import { useAnalytics } from '../../hooks/useAnalytics'
import { AnalyticsFilter } from '../../types/analytics'
import { format, subDays } from 'date-fns'
import { useToast } from '../../hooks/use-toast'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import Papa from 'papaparse'

interface ReportConfig {
  name: string
  type: 'overview' | 'funnel' | 'leads' | 'utm' | 'custom'
  format: 'pdf' | 'csv' | 'json'
  frequency: 'one-time' | 'daily' | 'weekly' | 'monthly'
  email_recipients: string[]
  include_charts: boolean
  include_raw_data: boolean
  filters: AnalyticsFilter
}

interface ScheduledReport {
  id: string
  name: string
  type: string
  format: string
  frequency: string
  next_run: string
  last_run?: string
  status: 'active' | 'paused' | 'error'
  recipients: string[]
}

interface ReportsGeneratorProps {
  quizId?: string
  className?: string
}

export function ReportsGenerator({ quizId, className = '' }: ReportsGeneratorProps) {
  const { toast } = useToast()
  const chartRef = useRef<HTMLDivElement>(null)
  
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    name: '',
    type: 'overview',
    format: 'pdf',
    frequency: 'one-time',
    email_recipients: [],
    include_charts: true,
    include_raw_data: false,
    filters: {
      date_from: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
      date_to: format(new Date(), 'yyyy-MM-dd'),
      quiz_id: quizId
    }
  })

  const [newEmail, setNewEmail] = useState('')
  const [showScheduled, setShowScheduled] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  // Mock scheduled reports
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([
    {
      id: '1',
      name: 'Relatório Semanal de Analytics',
      type: 'overview',
      format: 'pdf',
      frequency: 'weekly',
      next_run: '2024-01-22T09:00:00Z',
      last_run: '2024-01-15T09:00:00Z',
      status: 'active',
      recipients: ['admin@quiz.app']
    },
    {
      id: '2',
      name: 'Análise Mensal de Leads',
      type: 'leads',
      format: 'csv',
      frequency: 'monthly',
      next_run: '2024-02-01T10:00:00Z',
      last_run: '2024-01-01T10:00:00Z',
      status: 'active',
      recipients: ['marketing@quiz.app', 'sales@quiz.app']
    }
  ])

  const {
    dashboardData,
    isDashboardLoading,
    generateReport,
    isGeneratingReport
  } = useAnalytics(reportConfig.filters)

  const handleConfigChange = (key: keyof ReportConfig, value: any) => {
    setReportConfig(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleFilterChange = (key: keyof AnalyticsFilter, value: string) => {
    setReportConfig(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [key]: value || undefined
      }
    }))
  }

  const addEmailRecipient = () => {
    if (newEmail && newEmail.includes('@')) {
      setReportConfig(prev => ({
        ...prev,
        email_recipients: [...prev.email_recipients, newEmail]
      }))
      setNewEmail('')
    } else {
      toast({
        title: "Erro",
        description: "Digite um email válido",
        variant: "destructive"
      })
    }
  }

  const removeEmailRecipient = (email: string) => {
    setReportConfig(prev => ({
      ...prev,
      email_recipients: prev.email_recipients.filter(e => e !== email)
    }))
  }

  // Generate PDF Report
  const generatePDFReport = async () => {
    if (!dashboardData) return

    setIsGenerating(true)
    try {
      const pdf = new jsPDF()
      
      // Header
      pdf.setFontSize(20)
      pdf.text('Relatório de Analytics', 20, 30)
      
      pdf.setFontSize(12)
      pdf.text(`Período: ${reportConfig.filters.date_from} a ${reportConfig.filters.date_to}`, 20, 50)
      pdf.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 20, 60)
      
      // Overview Metrics
      let yPosition = 80
      pdf.setFontSize(16)
      pdf.text('Métricas Gerais', 20, yPosition)
      yPosition += 20
      
      pdf.setFontSize(12)
      const metrics = [
        ['Total de Visualizações', dashboardData.overview.total_views.toLocaleString('pt-BR')],
        ['Total de Conversões', dashboardData.overview.total_completions.toLocaleString('pt-BR')],
        ['Taxa de Conversão', `${dashboardData.overview.conversion_rate.toFixed(1)}%`],
        ['Leads Gerados', dashboardData.overview.leads_generated.toLocaleString('pt-BR')],
        ['Taxa de Abandono', `${dashboardData.overview.bounce_rate.toFixed(1)}%`],
        ['Tempo Médio', `${Math.floor(dashboardData.overview.average_time / 60)}m ${Math.floor(dashboardData.overview.average_time % 60)}s`]
      ]
      
      metrics.forEach(([label, value]) => {
        pdf.text(`${label}: ${value}`, 20, yPosition)
        yPosition += 15
      })
      
      // Device Breakdown
      if (dashboardData.device_breakdown.length > 0) {
        yPosition += 20
        pdf.setFontSize(16)
        pdf.text('Dispositivos', 20, yPosition)
        yPosition += 20
        
        pdf.setFontSize(12)
        dashboardData.device_breakdown.forEach(device => {
          pdf.text(`${device.device_type}: ${device.count.toLocaleString('pt-BR')} (${device.percentage.toFixed(1)}%)`, 20, yPosition)
          yPosition += 15
        })
      }
      
      // UTM Performance
      if (dashboardData.utm_performance.length > 0) {
        yPosition += 20
        if (yPosition > 250) {
          pdf.addPage()
          yPosition = 30
        }
        
        pdf.setFontSize(16)
        pdf.text('Performance UTM', 20, yPosition)
        yPosition += 20
        
        pdf.setFontSize(12)
        dashboardData.utm_performance.slice(0, 5).forEach(utm => {
          pdf.text(`${utm.utm_source}: ${utm.views.toLocaleString('pt-BR')} views, ${utm.conversions.toLocaleString('pt-BR')} conversões (${utm.conversion_rate.toFixed(1)}%)`, 20, yPosition)
          yPosition += 15
        })
      }
      
      // Include charts if enabled
      if (reportConfig.include_charts && chartRef.current) {
        const canvas = await html2canvas(chartRef.current)
        const imgData = canvas.toDataURL('image/png')
        
        if (yPosition > 150) {
          pdf.addPage()
          yPosition = 30
        }
        
        pdf.addImage(imgData, 'PNG', 20, yPosition, 170, 100)
      }
      
      // Save PDF
      const fileName = `${reportConfig.name || 'analytics-report'}-${format(new Date(), 'yyyy-MM-dd')}.pdf`
      pdf.save(fileName)
      
      toast({
        title: "Sucesso",
        description: "Relatório PDF gerado com sucesso!",
      })
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast({
        title: "Erro",
        description: "Falha ao gerar relatório PDF",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Generate CSV Report
  const generateCSVReport = () => {
    if (!dashboardData) return

    setIsGenerating(true)
    try {
      let csvData: any[] = []
      
      if (reportConfig.type === 'overview') {
        // Time series data
        csvData = dashboardData.time_series.map(item => ({
          Data: item.date,
          Visualizações: item.views,
          Inicializações: item.starts,
          Conclusões: item.completions,
          Abandonos: item.abandons,
          Leads: item.leads
        }))
      } else if (reportConfig.type === 'utm') {
        // UTM performance data
        csvData = dashboardData.utm_performance.map(utm => ({
          Fonte: utm.utm_source,
          Meio: utm.utm_medium || '',
          Campanha: utm.utm_campaign || '',
          Visualizações: utm.views,
          Conversões: utm.conversions,
          'Taxa de Conversão (%)': utm.conversion_rate.toFixed(2),
          Leads: utm.leads,
          'Taxa de Lead (%)': utm.lead_conversion_rate.toFixed(2)
        }))
      } else if (reportConfig.type === 'funnel') {
        // Funnel data
        csvData = dashboardData.funnel_analysis.map(step => ({
          Etapa: step.step,
          'Nome da Etapa': step.step_name,
          Visualizações: step.views,
          Conclusões: step.completions,
          Abandonos: step.abandons,
          'Taxa de Conversão (%)': step.conversion_rate.toFixed(2),
          'Tempo Médio (s)': step.average_time
        }))
      }
      
      const csv = Papa.unparse(csvData)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `${reportConfig.name || 'analytics-report'}-${format(new Date(), 'yyyy-MM-dd')}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
      
      toast({
        title: "Sucesso",
        description: "Relatório CSV gerado com sucesso!",
      })
      
    } catch (error) {
      console.error('Error generating CSV:', error)
      toast({
        title: "Erro",
        description: "Falha ao gerar relatório CSV",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Generate JSON Report
  const generateJSONReport = () => {
    if (!dashboardData) return

    setIsGenerating(true)
    try {
      const jsonData = {
        report_info: {
          name: reportConfig.name || 'Analytics Report',
          type: reportConfig.type,
          generated_at: new Date().toISOString(),
          period: {
            from: reportConfig.filters.date_from,
            to: reportConfig.filters.date_to
          },
          filters: reportConfig.filters
        },
        data: dashboardData
      }
      
      const dataStr = JSON.stringify(jsonData, null, 2)
      const blob = new Blob([dataStr], { type: 'application/json' })
      const link = document.createElement('a')
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `${reportConfig.name || 'analytics-report'}-${format(new Date(), 'yyyy-MM-dd')}.json`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
      
      toast({
        title: "Sucesso",
        description: "Relatório JSON gerado com sucesso!",
      })
      
    } catch (error) {
      console.error('Error generating JSON:', error)
      toast({
        title: "Erro",
        description: "Falha ao gerar relatório JSON",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const generateReportByFormat = () => {
    switch (reportConfig.format) {
      case 'pdf':
        generatePDFReport()
        break
      case 'csv':
        generateCSVReport()
        break
      case 'json':
        generateJSONReport()
        break
    }
  }

  const scheduleReport = () => {
    if (!reportConfig.name) {
      toast({
        title: "Erro",
        description: "Digite um nome para o relatório",
        variant: "destructive"
      })
      return
    }

    const newScheduledReport: ScheduledReport = {
      id: Date.now().toString(),
      name: reportConfig.name,
      type: reportConfig.type,
      format: reportConfig.format,
      frequency: reportConfig.frequency,
      next_run: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      status: 'active',
      recipients: reportConfig.email_recipients
    }

    setScheduledReports(prev => [...prev, newScheduledReport])
    
    toast({
      title: "Sucesso",
      description: "Relatório agendado com sucesso!",
    })
  }

  const toggleReportStatus = (id: string) => {
    setScheduledReports(prev => prev.map(report => 
      report.id === id 
        ? { ...report, status: report.status === 'active' ? 'paused' : 'active' }
        : report
    ))
  }

  const deleteScheduledReport = (id: string) => {
    setScheduledReports(prev => prev.filter(report => report.id !== id))
    toast({
      title: "Removido",
      description: "Relatório agendado removido",
    })
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gerador de Relatórios</h2>
            <p className="text-gray-600">Crie e agende relatórios personalizados</p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowScheduled(!showScheduled)}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Agendados ({scheduledReports.length})
            </Button>
          </div>
        </div>
      </Card>

      {/* Report Configuration */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Configuração do Relatório</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Settings */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="report_name">Nome do Relatório</Label>
              <Input
                id="report_name"
                placeholder="Ex: Relatório Semanal"
                value={reportConfig.name}
                onChange={(e) => handleConfigChange('name', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="report_type">Tipo de Relatório</Label>
              <select
                id="report_type"
                className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-md"
                value={reportConfig.type}
                onChange={(e) => handleConfigChange('type', e.target.value)}
              >
                <option value="overview">Visão Geral</option>
                <option value="funnel">Análise do Funil</option>
                <option value="leads">Análise de Leads</option>
                <option value="utm">Performance UTM</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>
            
            <div>
              <Label htmlFor="report_format">Formato</Label>
              <select
                id="report_format"
                className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-md"
                value={reportConfig.format}
                onChange={(e) => handleConfigChange('format', e.target.value)}
              >
                <option value="pdf">PDF</option>
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
              </select>
            </div>
            
            <div>
              <Label htmlFor="report_frequency">Frequência</Label>
              <select
                id="report_frequency"
                className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-md"
                value={reportConfig.frequency}
                onChange={(e) => handleConfigChange('frequency', e.target.value)}
              >
                <option value="one-time">Uma vez</option>
                <option value="daily">Diário</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensal</option>
              </select>
            </div>
          </div>

          {/* Filters and Options */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="date_from">Data Inicial</Label>
              <Input
                id="date_from"
                type="date"
                value={reportConfig.filters.date_from || ''}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="date_to">Data Final</Label>
              <Input
                id="date_to"
                type="date"
                value={reportConfig.filters.date_to || ''}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Opções de Conteúdo</Label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={reportConfig.include_charts}
                    onChange={(e) => handleConfigChange('include_charts', e.target.checked)}
                  />
                  <span className="text-sm">Incluir gráficos (PDF apenas)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={reportConfig.include_raw_data}
                    onChange={(e) => handleConfigChange('include_raw_data', e.target.checked)}
                  />
                  <span className="text-sm">Incluir dados brutos</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Email Recipients */}
        {reportConfig.frequency !== 'one-time' && (
          <div className="mt-6 pt-6 border-t">
            <Label>Destinatários de Email</Label>
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="email@exemplo.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addEmailRecipient()}
              />
              <Button onClick={addEmailRecipient}>
                <Mail className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </div>
            
            {reportConfig.email_recipients.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {reportConfig.email_recipients.map((email, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2"
                  >
                    {email}
                    <button
                      onClick={() => removeEmailRecipient(email)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <Button
            onClick={generateReportByFormat}
            disabled={isGenerating || isDashboardLoading}
          >
            <Download className="w-4 h-4 mr-2" />
            {isGenerating ? 'Gerando...' : 'Gerar Agora'}
          </Button>
          
          {reportConfig.frequency !== 'one-time' && (
            <Button
              variant="outline"
              onClick={scheduleReport}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Agendar
            </Button>
          )}
        </div>
      </Card>

      {/* Scheduled Reports */}
      {showScheduled && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Relatórios Agendados</h3>
          
          {scheduledReports.length > 0 ? (
            <div className="space-y-3">
              {scheduledReports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{report.name}</div>
                    <div className="text-sm text-gray-600">
                      {report.type} • {report.format.toUpperCase()} • {report.frequency}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Próxima execução: {format(new Date(report.next_run), 'dd/MM/yyyy HH:mm')}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      report.status === 'active' ? 'bg-green-100 text-green-800' :
                      report.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {report.status === 'active' ? 'Ativo' :
                       report.status === 'paused' ? 'Pausado' : 'Erro'}
                    </span>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleReportStatus(report.id)}
                    >
                      {report.status === 'active' ? 'Pausar' : 'Ativar'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteScheduledReport(report.id)}
                    >
                      Remover
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Nenhum relatório agendado
            </div>
          )}
        </Card>
      )}

      {/* Hidden chart container for PDF generation */}
      {reportConfig.include_charts && (
        <div ref={chartRef} style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          {/* This would contain chart components for PDF capture */}
        </div>
      )}
    </div>
  )
}