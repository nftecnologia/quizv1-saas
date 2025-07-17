import { supabase } from '../lib/supabase'
import { 
  AnalyticsEvent, 
  AnalyticsFilter, 
  AnalyticsDashboardData,
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
  WebhookPayload
} from '../types/analytics'

class AnalyticsService {
  private sessionId: string
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map()
  
  constructor() {
    this.sessionId = this.generateSessionId()
    this.initializeTracking()
  }

  // Session Management
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private initializeTracking() {
    // Track page views
    this.trackEvent('quiz_start', {
      url: window.location.href,
      title: document.title
    })

    // Track page unload (abandonment)
    window.addEventListener('beforeunload', () => {
      this.trackEvent('quiz_abandoned', {
        url: window.location.href,
        time_spent: Date.now() - this.getSessionStartTime()
      })
    })
  }

  private getSessionStartTime(): number {
    const stored = localStorage.getItem('quiz_session_start')
    if (stored) return parseInt(stored)
    
    const now = Date.now()
    localStorage.setItem('quiz_session_start', now.toString())
    return now
  }

  // UTM Tracking
  private getUTMParameters(): Record<string, string> {
    const params = new URLSearchParams(window.location.search)
    return {
      utm_source: params.get('utm_source') || '',
      utm_medium: params.get('utm_medium') || '',
      utm_campaign: params.get('utm_campaign') || '',
      utm_term: params.get('utm_term') || '',
      utm_content: params.get('utm_content') || ''
    }
  }

  // Device Detection
  private getDeviceInfo() {
    const ua = navigator.userAgent
    let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop'
    
    if (/Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
      deviceType = /iPad|Android(?=.*Tablet)|tablet/i.test(ua) ? 'tablet' : 'mobile'
    }

    return {
      device_type: deviceType,
      browser: this.getBrowserName(ua),
      user_agent: ua
    }
  }

  private getBrowserName(ua: string): string {
    if (ua.includes('Chrome')) return 'Chrome'
    if (ua.includes('Firefox')) return 'Firefox'
    if (ua.includes('Safari')) return 'Safari'
    if (ua.includes('Edge')) return 'Edge'
    return 'Unknown'
  }

  // Event Tracking
  async trackEvent(eventType: AnalyticsEvent['event_type'], eventData: Record<string, any> = {}, quizId?: string) {
    try {
      const utmParams = this.getUTMParameters()
      const deviceInfo = this.getDeviceInfo()
      
      const event: Omit<AnalyticsEvent, 'id' | 'created_at'> = {
        quiz_id: quizId || '',
        user_id: await this.getCurrentUserId(),
        anonymous_id: this.getAnonymousId(),
        event_type: eventType,
        event_data: eventData,
        session_id: this.sessionId,
        ...utmParams,
        ...deviceInfo,
        referrer: document.referrer,
        ip_address: await this.getClientIP()
      }

      const { error } = await supabase
        .from('analytics_events')
        .insert([event])

      if (error) throw error

      // Send to webhooks if configured
      await this.sendWebhookEvent(eventType, quizId || '', eventData)
      
      // Clear relevant cache
      this.clearCacheByPattern('analytics_')
      
    } catch (error) {
      console.error('Failed to track event:', error)
    }
  }

  private async getCurrentUserId(): Promise<string | undefined> {
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id
  }

  private getAnonymousId(): string {
    let anonymousId = localStorage.getItem('quiz_anonymous_id')
    if (!anonymousId) {
      anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('quiz_anonymous_id', anonymousId)
    }
    return anonymousId
  }

  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      return data.ip
    } catch {
      return 'unknown'
    }
  }

  // Cache Management
  private getCacheKey(key: string, filters?: AnalyticsFilter): string {
    const filterString = filters ? JSON.stringify(filters) : ''
    return `${key}_${filterString}`
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key)
    if (!cached) return null
    
    if (Date.now() > cached.timestamp + cached.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return cached.data as T
  }

  private setCache<T>(key: string, data: T, ttlMinutes: number = 5): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    })
  }

  private clearCacheByPattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }

  // Analytics Data Retrieval
  async getDashboardData(filters: AnalyticsFilter = {}): Promise<AnalyticsDashboardData> {
    const cacheKey = this.getCacheKey('dashboard', filters)
    const cached = this.getFromCache<AnalyticsDashboardData>(cacheKey)
    if (cached) return cached

    try {
      const [
        overview,
        timeSeries,
        funnelAnalysis,
        deviceBreakdown,
        geographicData,
        utmPerformance,
        leadAnalytics,
        realTime,
        performance,
        heatmapData
      ] = await Promise.all([
        this.getQuizMetrics(filters),
        this.getTimeSeriesData(filters),
        this.getFunnelAnalysis(filters),
        this.getDeviceAnalytics(filters),
        this.getGeographicAnalytics(filters),
        this.getUTMAnalytics(filters),
        this.getLeadAnalytics(filters),
        this.getRealTimeMetrics(),
        this.getPerformanceMetrics(filters),
        this.getHeatmapData(filters)
      ])

      const dashboardData: AnalyticsDashboardData = {
        overview,
        time_series: timeSeries,
        funnel_analysis: funnelAnalysis,
        device_breakdown: deviceBreakdown,
        geographic_data: geographicData,
        utm_performance: utmPerformance,
        lead_analytics: leadAnalytics,
        real_time: realTime,
        performance,
        heatmap_data: heatmapData
      }

      this.setCache(cacheKey, dashboardData, 5)
      return dashboardData

    } catch (error) {
      console.error('Failed to get dashboard data:', error)
      throw error
    }
  }

  async getQuizMetrics(filters: AnalyticsFilter = {}): Promise<QuizMetrics> {
    const { data, error } = await supabase
      .rpc('get_quiz_metrics', { filters: JSON.stringify(filters) })

    if (error) throw error
    return data[0] || {
      quiz_id: '',
      total_views: 0,
      total_starts: 0,
      total_completions: 0,
      total_abandons: 0,
      conversion_rate: 0,
      completion_rate: 0,
      average_time: 0,
      bounce_rate: 0,
      leads_generated: 0,
      lead_conversion_rate: 0
    }
  }

  async getTimeSeriesData(filters: AnalyticsFilter = {}): Promise<TimeSeriesData[]> {
    const { data, error } = await supabase
      .rpc('get_time_series_data', { filters: JSON.stringify(filters) })

    if (error) throw error
    return data || []
  }

  async getFunnelAnalysis(filters: AnalyticsFilter = {}): Promise<FunnelStep[]> {
    const { data, error } = await supabase
      .rpc('get_funnel_analysis', { filters: JSON.stringify(filters) })

    if (error) throw error
    return data || []
  }

  async getDeviceAnalytics(filters: AnalyticsFilter = {}): Promise<DeviceAnalytics[]> {
    const { data, error } = await supabase
      .rpc('get_device_analytics', { filters: JSON.stringify(filters) })

    if (error) throw error
    return data || []
  }

  async getGeographicAnalytics(filters: AnalyticsFilter = {}): Promise<GeographicAnalytics[]> {
    const { data, error } = await supabase
      .rpc('get_geographic_analytics', { filters: JSON.stringify(filters) })

    if (error) throw error
    return data || []
  }

  async getUTMAnalytics(filters: AnalyticsFilter = {}): Promise<UTMAnalytics[]> {
    const { data, error } = await supabase
      .rpc('get_utm_analytics', { filters: JSON.stringify(filters) })

    if (error) throw error
    return data || []
  }

  async getLeadAnalytics(filters: AnalyticsFilter = {}): Promise<LeadAnalytics> {
    const { data, error } = await supabase
      .rpc('get_lead_analytics', { filters: JSON.stringify(filters) })

    if (error) throw error
    return data[0] || {
      total_leads: 0,
      conversion_rate: 0,
      lead_sources: [],
      lead_conversion_funnel: []
    }
  }

  async getRealTimeMetrics(): Promise<RealTimeMetrics> {
    const { data, error } = await supabase
      .rpc('get_real_time_metrics')

    if (error) throw error
    return data[0] || {
      active_users: 0,
      quiz_views_last_hour: 0,
      completions_last_hour: 0,
      leads_last_hour: 0,
      top_performing_quizzes: []
    }
  }

  async getPerformanceMetrics(filters: AnalyticsFilter = {}): Promise<PerformanceMetrics> {
    const { data, error } = await supabase
      .rpc('get_performance_metrics', { filters: JSON.stringify(filters) })

    if (error) throw error
    return data[0] || {
      avg_load_time: 0,
      avg_completion_time: 0,
      bounce_rate: 0,
      error_rate: 0,
      mobile_performance_score: 0,
      desktop_performance_score: 0
    }
  }

  async getHeatmapData(filters: AnalyticsFilter = {}): Promise<HeatmapData[]> {
    const { data, error } = await supabase
      .rpc('get_heatmap_data', { filters: JSON.stringify(filters) })

    if (error) throw error
    return data || []
  }

  // Report Generation
  async generateReport(name: string, type: string, filters: AnalyticsFilter): Promise<AnalyticsReport> {
    const data = await this.getDashboardData(filters)
    
    const report: Omit<AnalyticsReport, 'id'> = {
      name,
      type: type as any,
      filters,
      data,
      generated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    }

    const { data: savedReport, error } = await supabase
      .from('analytics_reports')
      .insert([report])
      .select()
      .single()

    if (error) throw error
    return savedReport
  }

  // Webhook Integration
  private async sendWebhookEvent(eventType: string, quizId: string, data: Record<string, any>) {
    try {
      const { data: settings } = await supabase
        .from('integration_settings')
        .select('webhook_url, webhook_secret')
        .single()

      if (!settings?.webhook_url) return

      const payload: WebhookPayload = {
        event_type: eventType,
        quiz_id: quizId,
        data,
        timestamp: new Date().toISOString()
      }

      await fetch(settings.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(settings.webhook_secret && {
            'X-Webhook-Secret': settings.webhook_secret
          })
        },
        body: JSON.stringify(payload)
      })
    } catch (error) {
      console.error('Failed to send webhook:', error)
    }
  }

  // Google Analytics Integration
  initializeGoogleAnalytics(trackingId: string) {
    if (typeof window === 'undefined') return

    // Load Google Analytics
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`
    document.head.appendChild(script)

    // Initialize gtag
    const gtag = function(...args: any[]) {
      ((gtag as any).q = (gtag as any).q || []).push(args)
    }
    ;(gtag as any).q = (gtag as any).q || []
    ;(window as any).gtag = gtag
    ;(window as any).gtag('js', new Date())
    ;(window as any).gtag('config', trackingId)
  }

  // Facebook Pixel Integration
  initializeFacebookPixel(pixelId: string) {
    if (typeof window === 'undefined') return

    // Load Facebook Pixel
    const script = document.createElement('script')
    script.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${pixelId}');
      fbq('track', 'PageView');
    `
    document.head.appendChild(script)
  }

  // Performance Tracking
  trackPerformance(metric: string, value: number, quizId?: string) {
    this.trackEvent('quiz_start', {
      metric,
      value,
      timestamp: Date.now()
    }, quizId)
  }

  // Heatmap Tracking
  trackInteraction(element: HTMLElement, quizId: string, questionId?: string) {
    const rect = element.getBoundingClientRect()
    const data = {
      element_type: element.tagName.toLowerCase(),
      element_id: element.id,
      question_id: questionId,
      x_position: rect.left + rect.width / 2,
      y_position: rect.top + rect.height / 2,
      timestamp: Date.now()
    }

    this.trackEvent('quiz_start', data, quizId)
  }
}

// Global instance
export const analyticsService = new AnalyticsService()

// TypeScript declarations for global objects
declare global {
  interface Window {
    gtag: {
      (...args: any[]): void
      q?: any[]
    } & {
      q?: any[]
    }
    fbq?: (...args: any[]) => void
  }
}