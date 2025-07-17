export interface AnalyticsEvent {
  id: string
  quiz_id: string
  user_id?: string
  anonymous_id?: string
  event_type: 'quiz_start' | 'question_answered' | 'quiz_completed' | 'quiz_abandoned' | 'page_view' | 'page_visibility_change' | 'scroll_depth' | 'javascript_error' | 'promise_rejection'
  event_data: Record<string, any>
  session_id: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_term?: string
  utm_content?: string
  user_agent?: string
  ip_address?: string
  referrer?: string
  device_type: 'mobile' | 'tablet' | 'desktop'
  browser?: string
  country?: string
  city?: string
  created_at: string
}

export interface QuizMetrics {
  quiz_id: string
  total_views: number
  total_starts: number
  total_completions: number
  total_abandons: number
  conversion_rate: number
  completion_rate: number
  average_time: number
  bounce_rate: number
  leads_generated: number
  lead_conversion_rate: number
}

export interface FunnelStep {
  step: number
  step_name: string
  question_id?: string
  views: number
  completions: number
  abandons: number
  conversion_rate: number
  average_time: number
}

export interface AnalyticsFilter {
  date_from?: string
  date_to?: string
  quiz_id?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  device_type?: 'mobile' | 'tablet' | 'desktop'
  country?: string
}

export interface TimeSeriesData {
  date: string
  views: number
  starts: number
  completions: number
  abandons: number
  leads: number
}

export interface DeviceAnalytics {
  device_type: string
  count: number
  percentage: number
  conversion_rate: number
}

export interface GeographicAnalytics {
  country: string
  count: number
  percentage: number
  conversion_rate: number
}

export interface UTMAnalytics {
  utm_source: string
  utm_medium?: string
  utm_campaign?: string
  views: number
  conversions: number
  conversion_rate: number
  leads: number
  lead_conversion_rate: number
}

export interface HeatmapData {
  question_id: string
  option_id?: string
  element_type: 'question' | 'option' | 'button' | 'input'
  interactions: number
  time_spent: number
  x_position?: number
  y_position?: number
}

export interface AnalyticsReport {
  id: string
  name: string
  type: 'overview' | 'funnel' | 'leads' | 'utm' | 'custom'
  filters: AnalyticsFilter
  data: any
  generated_at: string
  expires_at?: string
}

export interface LeadAnalytics {
  total_leads: number
  conversion_rate: number
  cost_per_lead?: number
  lead_quality_score?: number
  lead_sources: {
    source: string
    count: number
    percentage: number
    quality_score?: number
  }[]
  lead_conversion_funnel: {
    step: string
    leads_entered: number
    leads_converted: number
    conversion_rate: number
  }[]
}

export interface RealTimeMetrics {
  active_users: number
  quiz_views_last_hour: number
  completions_last_hour: number
  leads_last_hour: number
  top_performing_quizzes: {
    quiz_id: string
    title: string
    views: number
    conversions: number
  }[]
}

export interface PerformanceMetrics {
  avg_load_time: number
  avg_completion_time: number
  bounce_rate: number
  error_rate: number
  mobile_performance_score: number
  desktop_performance_score: number
}

export interface ComparisonData {
  current_period: any
  previous_period: any
  change_percentage: number
  trend: 'up' | 'down' | 'stable'
}

export interface AnalyticsDashboardData {
  overview: QuizMetrics
  time_series: TimeSeriesData[]
  funnel_analysis: FunnelStep[]
  device_breakdown: DeviceAnalytics[]
  geographic_data: GeographicAnalytics[]
  utm_performance: UTMAnalytics[]
  lead_analytics: LeadAnalytics
  real_time: RealTimeMetrics
  performance: PerformanceMetrics
  heatmap_data: HeatmapData[]
}

export interface WebhookPayload {
  event_type: string
  quiz_id: string
  data: Record<string, any>
  timestamp: string
  signature?: string
}

export interface IntegrationSettings {
  google_analytics_id?: string
  facebook_pixel_id?: string
  webhook_url?: string
  webhook_secret?: string
  export_preferences: {
    format: 'csv' | 'pdf' | 'json'
    frequency: 'daily' | 'weekly' | 'monthly'
    email_recipients: string[]
  }
}