import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queueService } from '../services/queueService'
import { toast } from './use-toast'

interface WebhookEvent {
  id: string
  platform: string
  event_type: string
  transaction_id?: string
  user_email: string
  processed: boolean
  processing_attempts: number
  error_message?: string
  created_at: string
  raw_data: Record<string, any>
}

interface WebhookJob {
  id: string
  webhook_event_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  attempts: number
  max_attempts: number
  error: string | null
  created_at: string
  processed_at?: string
}

interface WebhookStats {
  total_events: number
  processed_events: number
  failed_events: number
  success_rate: number
  avg_processing_time: number
}

export function useWebhooks() {
  const queryClient = useQueryClient()
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  // Buscar estatísticas da fila
  const {
    data: queueStats,
    isLoading: queueStatsLoading,
    error: queueStatsError
  } = useQuery({
    queryKey: ['queue-stats'],
    queryFn: () => queueService.getQueueStats(),
    refetchInterval: 5000,
    staleTime: 1000
  })

  // Buscar estatísticas de webhooks
  const {
    data: webhookStats,
    isLoading: webhookStatsLoading
  } = useQuery({
    queryKey: ['webhook-stats'],
    queryFn: async (): Promise<WebhookStats> => {
      const { data, error } = await supabase
        .rpc('get_webhook_statistics')

      if (error) throw error

      return data || {
        total_events: 0,
        processed_events: 0,
        failed_events: 0,
        success_rate: 0,
        avg_processing_time: 0
      }
    },
    refetchInterval: 30000,
    staleTime: 10000
  })

  // Buscar eventos de webhook
  const {
    data: webhookEvents,
    isLoading: webhookEventsLoading,
    error: webhookEventsError,
    refetch: refetchEvents
  } = useQuery({
    queryKey: ['webhook-events', selectedPlatform, selectedStatus],
    queryFn: async (): Promise<WebhookEvent[]> => {
      let query = supabase
        .from('webhook_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (selectedPlatform !== 'all') {
        query = query.eq('platform', selectedPlatform)
      }

      if (selectedStatus === 'processed') {
        query = query.eq('processed', true)
      } else if (selectedStatus === 'pending') {
        query = query.eq('processed', false)
      } else if (selectedStatus === 'failed') {
        query = query.not('error_message', 'is', null)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    },
    refetchInterval: 10000,
    staleTime: 5000
  })

  // Buscar jobs de webhook
  const {
    data: webhookJobs,
    isLoading: webhookJobsLoading,
    refetch: refetchJobs
  } = useQuery({
    queryKey: ['webhook-jobs'],
    queryFn: async (): Promise<(WebhookJob & { webhook_event?: any })[]> => {
      const { data, error } = await supabase
        .from('webhook_jobs')
        .select(`
          *,
          webhook_event:webhook_events(
            platform,
            user_email,
            transaction_id,
            event_type
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return data || []
    },
    refetchInterval: 5000,
    staleTime: 2000
  })

  // Mutation para reprocessar webhook
  const reprocessWebhook = useMutation({
    mutationFn: async (webhookEventId: string) => {
      // Criar novo job para reprocessamento
      const { error } = await supabase
        .from('webhook_jobs')
        .insert({
          webhook_event_id: webhookEventId,
          status: 'pending',
          attempts: 0,
          max_attempts: 3,
          scheduled_at: new Date().toISOString()
        })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhook-jobs'] })
      queryClient.invalidateQueries({ queryKey: ['webhook-events'] })
      toast({
        title: "Webhook Reprocessed",
        description: "The webhook has been queued for reprocessing."
      })
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Reprocess",
        description: error.message || "Failed to reprocess webhook",
        variant: "destructive"
      })
    }
  })

  // Mutation para retry de job
  const retryJob = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from('webhook_jobs')
        .update({
          status: 'pending',
          error: null,
          scheduled_at: new Date().toISOString()
        })
        .eq('id', jobId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhook-jobs'] })
      toast({
        title: "Job Retried",
        description: "The job has been scheduled for retry."
      })
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Retry",
        description: error.message || "Failed to retry job",
        variant: "destructive"
      })
    }
  })

  // Mutation para cancelar job
  const cancelJob = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from('webhook_jobs')
        .update({
          status: 'failed',
          error: 'Cancelled by user'
        })
        .eq('id', jobId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhook-jobs'] })
      toast({
        title: "Job Cancelled",
        description: "The job has been cancelled."
      })
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Cancel",
        description: error.message || "Failed to cancel job",
        variant: "destructive"
      })
    }
  })

  // Mutation para limpar jobs antigos
  const cleanupOldJobs = useMutation({
    mutationFn: async (daysOld: number = 7) => {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      const { error, count } = await supabase
        .from('webhook_jobs')
        .delete()
        .in('status', ['completed', 'failed'])
        .lt('created_at', cutoffDate.toISOString())

      if (error) throw error
      return count || 0
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['webhook-jobs'] })
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] })
      toast({
        title: "Cleanup Complete",
        description: `Cleaned up ${count} old jobs.`
      })
    },
    onError: (error: any) => {
      toast({
        title: "Cleanup Failed",
        description: error.message || "Failed to cleanup old jobs",
        variant: "destructive"
      })
    }
  })

  // Buscar detalhes de um webhook específico
  const getWebhookDetails = async (webhookId: string) => {
    const { data, error } = await supabase
      .from('webhook_events')
      .select(`
        *,
        webhook_jobs(*)
      `)
      .eq('id', webhookId)
      .single()

    if (error) throw error
    return data
  }

  // Exportar dados de webhook
  const exportWebhookData = (format: 'csv' | 'json' = 'csv') => {
    if (!webhookEvents) return

    if (format === 'csv') {
      const csv = [
        'Date,Platform,Event Type,User Email,Transaction ID,Status,Error,Processing Attempts',
        ...webhookEvents.map(event => [
          new Date(event.created_at).toISOString(),
          event.platform,
          event.event_type,
          event.user_email,
          event.transaction_id || '',
          event.processed ? 'Processed' : 'Pending',
          event.error_message || '',
          event.processing_attempts.toString()
        ].join(','))
      ].join('\n')

      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `webhook-events-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } else {
      const json = JSON.stringify(webhookEvents, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `webhook-events-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  // Obter estatísticas por plataforma
  const getStatsByPlatform = () => {
    if (!webhookEvents) return {}

    return webhookEvents.reduce((acc, event) => {
      if (!acc[event.platform]) {
        acc[event.platform] = {
          total: 0,
          processed: 0,
          failed: 0,
          success_rate: 0
        }
      }

      acc[event.platform].total++
      if (event.processed) acc[event.platform].processed++
      if (event.error_message) acc[event.platform].failed++
      
      acc[event.platform].success_rate = 
        (acc[event.platform].processed / acc[event.platform].total) * 100

      return acc
    }, {} as Record<string, any>)
  }

  return {
    // Data
    queueStats,
    webhookStats,
    webhookEvents: webhookEvents || [],
    webhookJobs: webhookJobs || [],

    // Loading states
    queueStatsLoading,
    webhookStatsLoading,
    webhookEventsLoading,
    webhookJobsLoading,

    // Error states
    queueStatsError,
    webhookEventsError,

    // Filters
    selectedPlatform,
    setSelectedPlatform,
    selectedStatus,
    setSelectedStatus,

    // Actions
    reprocessWebhook: reprocessWebhook.mutate,
    retryJob: retryJob.mutate,
    cancelJob: cancelJob.mutate,
    cleanupOldJobs: cleanupOldJobs.mutate,
    getWebhookDetails,
    exportWebhookData,
    refetchEvents,
    refetchJobs,

    // Helpers
    getStatsByPlatform,

    // Mutation states
    isReprocessing: reprocessWebhook.isPending,
    isRetrying: retryJob.isPending,
    isCancelling: cancelJob.isPending,
    isCleaningUp: cleanupOldJobs.isPending
  }
}