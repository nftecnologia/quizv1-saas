import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { analyticsService } from '../services/analytics'
import { 
  AnalyticsDashboardData, 
  AnalyticsFilter, 
  QuizMetrics,
  FunnelStep,
  TimeSeriesData,
  LeadAnalytics,
  RealTimeMetrics,
  PerformanceMetrics,
  HeatmapData,
  UTMAnalytics,
  DeviceAnalytics,
  GeographicAnalytics,
  AnalyticsReport,
  ComparisonData
} from '../types/analytics'
import { addDays, subDays, format } from 'date-fns'

export function useAnalytics(filters: AnalyticsFilter = {}) {
  const queryClient = useQueryClient()
  
  // Dashboard data query
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard
  } = useQuery({
    queryKey: ['analytics', 'dashboard', filters],
    queryFn: () => analyticsService.getDashboardData(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // 30 seconds for real-time feel
  })

  // Individual metrics queries for granular control
  const {
    data: quizMetrics,
    isLoading: isMetricsLoading
  } = useQuery({
    queryKey: ['analytics', 'metrics', filters],
    queryFn: () => analyticsService.getQuizMetrics(filters),
    enabled: !!filters.quiz_id,
    staleTime: 2 * 60 * 1000,
  })

  const {
    data: timeSeriesData,
    isLoading: isTimeSeriesLoading
  } = useQuery({
    queryKey: ['analytics', 'timeSeries', filters],
    queryFn: () => analyticsService.getTimeSeriesData(filters),
    staleTime: 5 * 60 * 1000,
  })

  const {
    data: funnelData,
    isLoading: isFunnelLoading
  } = useQuery({
    queryKey: ['analytics', 'funnel', filters],
    queryFn: () => analyticsService.getFunnelAnalysis(filters),
    enabled: !!filters.quiz_id,
    staleTime: 10 * 60 * 1000,
  })

  const {
    data: realTimeMetrics,
    isLoading: isRealTimeLoading
  } = useQuery({
    queryKey: ['analytics', 'realTime'],
    queryFn: () => analyticsService.getRealTimeMetrics(),
    refetchInterval: 10 * 1000, // 10 seconds
    staleTime: 0,
  })

  // Event tracking mutations
  const trackEventMutation = useMutation({
    mutationFn: (params: { 
      eventType: string, 
      eventData?: Record<string, any>, 
      quizId?: string 
    }) => analyticsService.trackEvent(params.eventType as any, params.eventData, params.quizId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
    }
  })

  // Report generation mutation
  const generateReportMutation = useMutation({
    mutationFn: (params: { 
      name: string, 
      type: string, 
      filters: AnalyticsFilter 
    }) => analyticsService.generateReport(params.name, params.type, params.filters)
  })

  // Helper functions
  const trackEvent = useCallback((
    eventType: string, 
    eventData?: Record<string, any>, 
    quizId?: string
  ) => {
    trackEventMutation.mutate({ eventType, eventData, quizId })
  }, [trackEventMutation])

  const trackQuizStart = useCallback((quizId: string) => {
    trackEvent('quiz_start', { timestamp: Date.now() }, quizId)
  }, [trackEvent])

  const trackQuestionAnswered = useCallback((
    quizId: string, 
    questionId: string, 
    answer: any,
    timeSpent: number
  ) => {
    trackEvent('question_answered', {
      question_id: questionId,
      answer,
      time_spent: timeSpent,
      timestamp: Date.now()
    }, quizId)
  }, [trackEvent])

  const trackQuizCompleted = useCallback((
    quizId: string, 
    totalTime: number, 
    score?: number
  ) => {
    trackEvent('quiz_completed', {
      total_time: totalTime,
      score,
      timestamp: Date.now()
    }, quizId)
  }, [trackEvent])

  const trackQuizAbandoned = useCallback((
    quizId: string, 
    lastQuestionId: string, 
    timeSpent: number
  ) => {
    trackEvent('quiz_abandoned', {
      last_question_id: lastQuestionId,
      time_spent: timeSpent,
      timestamp: Date.now()
    }, quizId)
  }, [trackEvent])

  const generateReport = useCallback((
    name: string, 
    type: string, 
    customFilters?: AnalyticsFilter
  ) => {
    const reportFilters = customFilters || filters
    return generateReportMutation.mutateAsync({ name, type, filters: reportFilters })
  }, [generateReportMutation, filters])

  return {
    // Data
    dashboardData,
    quizMetrics,
    timeSeriesData,
    funnelData,
    realTimeMetrics,

    // Loading states
    isDashboardLoading,
    isMetricsLoading,
    isTimeSeriesLoading,
    isFunnelLoading,
    isRealTimeLoading,
    isTrackingEvent: trackEventMutation.isPending,
    isGeneratingReport: generateReportMutation.isPending,

    // Errors
    dashboardError,
    trackingError: trackEventMutation.error,
    reportError: generateReportMutation.error,

    // Actions
    trackEvent,
    trackQuizStart,
    trackQuestionAnswered,
    trackQuizCompleted,
    trackQuizAbandoned,
    generateReport,
    refetchDashboard,

    // Utility
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
    }
  }
}

// Hook for comparison analytics
export function useComparisonAnalytics(
  currentFilters: AnalyticsFilter,
  comparisonPeriodDays: number = 30
) {
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const generateComparison = useCallback(async () => {
    setIsLoading(true)
    try {
      // Calculate previous period dates
      const currentEnd = currentFilters.date_to ? new Date(currentFilters.date_to) : new Date()
      const currentStart = currentFilters.date_from ? new Date(currentFilters.date_from) : subDays(currentEnd, comparisonPeriodDays)
      
      const previousEnd = subDays(currentStart, 1)
      const previousStart = subDays(previousEnd, comparisonPeriodDays)

      const previousFilters: AnalyticsFilter = {
        ...currentFilters,
        date_from: format(previousStart, 'yyyy-MM-dd'),
        date_to: format(previousEnd, 'yyyy-MM-dd')
      }

      // Fetch both periods data
      const [currentData, previousData] = await Promise.all([
        analyticsService.getQuizMetrics(currentFilters),
        analyticsService.getQuizMetrics(previousFilters)
      ])

      // Calculate percentage changes
      const calculateChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0
        return ((current - previous) / previous) * 100
      }

      const comparison: ComparisonData = {
        current_period: currentData,
        previous_period: previousData,
        change_percentage: calculateChange(currentData.total_views, previousData.total_views),
        trend: currentData.total_views > previousData.total_views ? 'up' : 
               currentData.total_views < previousData.total_views ? 'down' : 'stable'
      }

      setComparisonData(comparison)
    } catch (error) {
      console.error('Failed to generate comparison:', error)
    } finally {
      setIsLoading(false)
    }
  }, [currentFilters, comparisonPeriodDays])

  useEffect(() => {
    generateComparison()
  }, [generateComparison])

  return {
    comparisonData,
    isLoading,
    regenerate: generateComparison
  }
}

// Hook for real-time analytics
export function useRealTimeAnalytics(refreshInterval: number = 10000) {
  const {
    data: realTimeData,
    isLoading,
    error
  } = useQuery({
    queryKey: ['analytics', 'realTime'],
    queryFn: () => analyticsService.getRealTimeMetrics(),
    refetchInterval: refreshInterval,
    staleTime: 0,
  })

  return {
    realTimeData,
    isLoading,
    error
  }
}

// Hook for performance tracking
export function usePerformanceTracking(quizId?: string) {
  const trackPerformance = useCallback((metric: string, value: number) => {
    analyticsService.trackPerformance(metric, value, quizId)
  }, [quizId])

  const trackLoadTime = useCallback(() => {
    if (typeof window !== 'undefined' && window.performance) {
      const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart
      trackPerformance('page_load_time', loadTime)
    }
  }, [trackPerformance])

  const trackInteraction = useCallback((element: HTMLElement, questionId?: string) => {
    if (quizId) {
      analyticsService.trackInteraction(element, quizId, questionId)
    }
  }, [quizId])

  useEffect(() => {
    // Track initial load time
    if (typeof window !== 'undefined') {
      window.addEventListener('load', trackLoadTime)
      return () => window.removeEventListener('load', trackLoadTime)
    }
  }, [trackLoadTime])

  return {
    trackPerformance,
    trackLoadTime,
    trackInteraction
  }
}