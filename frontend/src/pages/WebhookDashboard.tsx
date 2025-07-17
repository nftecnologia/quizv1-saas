import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queueService } from '../services/queueService'
import { 
  Webhook, 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  RefreshCw,
  Search,
  Filter,
  Download,
  Settings
} from 'lucide-react'

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

export default function WebhookDashboard() {
  const [searchTerm, setSearchTerm] = useState('')
  const [platformFilter, setPlatformFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Buscar estatísticas da fila
  const { data: queueStats, isLoading: statsLoading } = useQuery({
    queryKey: ['queue-stats'],
    queryFn: () => queueService.getQueueStats(),
    refetchInterval: 5000 // Atualizar a cada 5 segundos
  })

  // Buscar eventos de webhook
  const { data: webhookEvents, isLoading: eventsLoading, refetch: refetchEvents } = useQuery({
    queryKey: ['webhook-events', searchTerm, platformFilter, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('webhook_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (searchTerm) {
        query = query.or(`user_email.ilike.%${searchTerm}%,transaction_id.ilike.%${searchTerm}%`)
      }

      if (platformFilter !== 'all') {
        query = query.eq('platform', platformFilter)
      }

      if (statusFilter === 'processed') {
        query = query.eq('processed', true)
      } else if (statusFilter === 'pending') {
        query = query.eq('processed', false)
      } else if (statusFilter === 'failed') {
        query = query.not('error_message', 'is', null)
      }

      const { data, error } = await query

      if (error) throw error
      return data as WebhookEvent[]
    },
    refetchInterval: 10000 // Atualizar a cada 10 segundos
  })

  // Buscar jobs de webhook
  const { data: webhookJobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['webhook-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_jobs')
        .select(`
          *,
          webhook_event:webhook_events(
            platform,
            user_email,
            transaction_id
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return data as (WebhookJob & { webhook_event: any })[]
    },
    refetchInterval: 5000
  })

  const getStatusBadge = (status: string, processed?: boolean, error?: string) => {
    if (error) {
      return <Badge variant="destructive">Failed</Badge>
    }
    
    if (processed) {
      return <Badge variant="default" className="bg-green-600">Processed</Badge>
    }

    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-600">Completed</Badge>
      case 'processing':
        return <Badge variant="default" className="bg-blue-600">Processing</Badge>
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getPlatformBadge = (platform: string) => {
    const colors: Record<string, string> = {
      hotmart: 'bg-orange-500',
      eduzz: 'bg-blue-500',
      stripe: 'bg-purple-500',
      kirvano: 'bg-green-500',
      monetizze: 'bg-red-500'
    }

    return (
      <Badge 
        variant="outline" 
        className={`${colors[platform] || 'bg-gray-500'} text-white border-transparent`}
      >
        {platform}
      </Badge>
    )
  }

  const handleRetryJob = async (jobId: string) => {
    try {
      // Marcar job como pendente novamente
      await supabase
        .from('webhook_jobs')
        .update({ 
          status: 'pending',
          error: null,
          scheduled_at: new Date().toISOString()
        })
        .eq('id', jobId)

      refetchEvents()
    } catch (error) {
      console.error('Failed to retry job:', error)
    }
  }

  const exportWebhookData = () => {
    if (!webhookEvents) return

    const csv = [
      'Date,Platform,Event Type,User Email,Transaction ID,Status,Error',
      ...webhookEvents.map(event => [
        new Date(event.created_at).toISOString(),
        event.platform,
        event.event_type,
        event.user_email,
        event.transaction_id || '',
        event.processed ? 'Processed' : 'Pending',
        event.error_message || ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `webhook-events-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Webhook className="h-8 w-8" />
            Webhook Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Monitor webhook events and processing jobs
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={exportWebhookData} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => refetchEvents()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold">{queueStats?.pending || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Processing</p>
                <p className="text-2xl font-bold">{queueStats?.processing || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-bold">{queueStats?.completed || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Failed</p>
                <p className="text-2xl font-bold">{queueStats?.failed || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Email or Transaction ID"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="platform">Platform</Label>
              <select
                id="platform"
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
              >
                <option value="all">All Platforms</option>
                <option value="hotmart">Hotmart</option>
                <option value="eduzz">Eduzz</option>
                <option value="stripe">Stripe</option>
                <option value="kirvano">Kirvano</option>
                <option value="monetizze">Monetizze</option>
              </select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processed">Processed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Webhook Events */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Recent Webhook Events</CardTitle>
          <CardDescription>
            Latest webhook events received from payment platforms
          </CardDescription>
        </CardHeader>
        <CardContent>
          {eventsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {webhookEvents?.map((event) => (
                <div 
                  key={event.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    {getPlatformBadge(event.platform)}
                    <div>
                      <p className="font-medium">{event.user_email}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {event.event_type} • {event.transaction_id}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(event.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge('', event.processed, event.error_message)}
                    {event.processing_attempts > 0 && (
                      <Badge variant="outline">
                        {event.processing_attempts} attempts
                      </Badge>
                    )}
                  </div>
                </div>
              ))}

              {webhookEvents?.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No webhook events found
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processing Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Processing Jobs</CardTitle>
          <CardDescription>
            Background jobs for processing webhook events
          </CardDescription>
        </CardHeader>
        <CardContent>
          {jobsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {webhookJobs?.map((job) => (
                <div 
                  key={job.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    {job.webhook_event && getPlatformBadge(job.webhook_event.platform)}
                    <div>
                      <p className="font-medium">
                        {job.webhook_event?.user_email || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Transaction: {job.webhook_event?.transaction_id || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Created: {new Date(job.created_at).toLocaleString()}
                        {job.processed_at && (
                          <> • Processed: {new Date(job.processed_at).toLocaleString()}</>
                        )}
                      </p>
                      {job.error && (
                        <p className="text-xs text-red-600 mt-1">
                          Error: {job.error}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(job.status)}
                    <Badge variant="outline">
                      {job.attempts}/{job.max_attempts}
                    </Badge>
                    {job.status === 'failed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRetryJob(job.id)}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {webhookJobs?.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No processing jobs found
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}