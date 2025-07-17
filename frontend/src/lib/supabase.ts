import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Helper functions for analytics
export const analyticsQueries = {
  // Get quiz metrics
  getQuizMetrics: (filters: Record<string, any>) => 
    supabase.rpc('get_quiz_metrics', { filters: JSON.stringify(filters) }),

  // Get time series data
  getTimeSeriesData: (filters: Record<string, any>) => 
    supabase.rpc('get_time_series_data', { filters: JSON.stringify(filters) }),

  // Get funnel analysis
  getFunnelAnalysis: (filters: Record<string, any>) => 
    supabase.rpc('get_funnel_analysis', { filters: JSON.stringify(filters) }),

  // Get device analytics
  getDeviceAnalytics: (filters: Record<string, any>) => 
    supabase.rpc('get_device_analytics', { filters: JSON.stringify(filters) }),

  // Get geographic analytics
  getGeographicAnalytics: (filters: Record<string, any>) => 
    supabase.rpc('get_geographic_analytics', { filters: JSON.stringify(filters) }),

  // Get UTM analytics
  getUTMAnalytics: (filters: Record<string, any>) => 
    supabase.rpc('get_utm_analytics', { filters: JSON.stringify(filters) }),

  // Get lead analytics
  getLeadAnalytics: (filters: Record<string, any>) => 
    supabase.rpc('get_lead_analytics', { filters: JSON.stringify(filters) }),

  // Get real-time metrics
  getRealTimeMetrics: () => 
    supabase.rpc('get_real_time_metrics'),

  // Get performance metrics
  getPerformanceMetrics: (filters: Record<string, any>) => 
    supabase.rpc('get_performance_metrics', { filters: JSON.stringify(filters) }),

  // Get heatmap data
  getHeatmapData: (filters: Record<string, any>) => 
    supabase.rpc('get_heatmap_data', { filters: JSON.stringify(filters) })
}

// Database tables for analytics
export const tables = {
  analytics_events: 'analytics_events',
  analytics_reports: 'analytics_reports',
  integration_settings: 'integration_settings',
  quizzes: 'quizzes',
  quiz_responses: 'quiz_responses',
  question_answers: 'question_answers'
}