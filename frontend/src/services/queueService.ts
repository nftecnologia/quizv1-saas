import { webhookService } from './webhookService'

interface QueueJob {
  id: string
  type: 'webhook_processing'
  data: {
    webhookEventId: string
  }
  attempts: number
  maxAttempts: number
  scheduledAt: number
  delay?: number
}

interface QueueConfig {
  redisUrl?: string
  maxConcurrentJobs: number
  retryDelays: number[] // delays em milissegundos
}

class QueueService {
  private config: QueueConfig
  private isProcessing = false
  private redis: any = null

  constructor(config: QueueConfig) {
    this.config = {
      maxConcurrentJobs: 5,
      retryDelays: [1000, 5000, 15000, 60000], // 1s, 5s, 15s, 1min
      ...config
    }
    
    this.initializeRedis()
  }

  private async initializeRedis() {
    // Se Redis URL está disponível, usar Redis real
    if (this.config.redisUrl) {
      try {
        // Simulated Redis connection (em produção usar @upstash/redis)
        console.log('Redis connection would be initialized here')
        // const { Redis } = await import('@upstash/redis')
        // this.redis = new Redis({ url: this.config.redisUrl })
      } catch (error) {
        console.error('Redis initialization failed, falling back to database queue')
      }
    }
    
    // Fallback para queue baseado em banco de dados
    this.startQueueProcessor()
  }

  // Adicionar job à fila
  async addJob(type: string, data: any, options: { delay?: number; maxAttempts?: number } = {}): Promise<string> {
    const job: QueueJob = {
      id: this.generateJobId(),
      type: type as any,
      data,
      attempts: 0,
      maxAttempts: options.maxAttempts || 3,
      scheduledAt: Date.now() + (options.delay || 0),
      delay: options.delay
    }

    if (this.redis) {
      // Usar Redis para fila
      await this.redis.lpush('job_queue', JSON.stringify(job))
      
      // Se tem delay, adicionar ao sorted set para delayed jobs
      if (job.delay && job.delay > 0) {
        await this.redis.zadd('delayed_jobs', job.scheduledAt, job.id)
      }
    } else {
      // Usar banco de dados
      const { supabase } = await import('../lib/supabase')
      
      await supabase
        .from('webhook_jobs')
        .insert({
          id: job.id,
          webhook_event_id: job.data.webhookEventId,
          status: 'pending',
          attempts: 0,
          max_attempts: job.maxAttempts,
          scheduled_at: new Date(job.scheduledAt).toISOString()
        })
    }

    return job.id
  }

  // Processar jobs da fila
  private async startQueueProcessor() {
    if (this.isProcessing) return
    this.isProcessing = true

    // Processar delayed jobs primeiro
    setInterval(() => this.processDelayedJobs(), 5000)
    
    // Processar jobs normais
    setInterval(() => this.processJobs(), 1000)
  }

  private async processDelayedJobs() {
    if (this.redis) {
      const now = Date.now()
      const delayedJobs = await this.redis.zrangebyscore('delayed_jobs', '-inf', now)
      
      for (const jobId of delayedJobs) {
        // Mover job para fila principal
        const jobData = await this.redis.get(`job:${jobId}`)
        if (jobData) {
          await this.redis.lpush('job_queue', jobData)
          await this.redis.del(`job:${jobId}`)
          await this.redis.zrem('delayed_jobs', jobId)
        }
      }
    }
    // Para banco de dados, jobs já têm scheduled_at
  }

  private async processJobs() {
    try {
      const availableSlots = this.config.maxConcurrentJobs
      
      for (let i = 0; i < availableSlots; i++) {
        if (this.redis) {
          await this.processRedisJob()
        } else {
          await this.processDatabaseJob()
        }
      }
    } catch (error) {
      console.error('Queue processing error:', error)
    }
  }

  private async processRedisJob() {
    if (!this.redis) return

    const jobData = await this.redis.rpop('job_queue')
    if (!jobData) return

    try {
      const job: QueueJob = JSON.parse(jobData)
      await this.executeJob(job)
    } catch (error) {
      console.error('Job processing error:', error)
    }
  }

  private async processDatabaseJob() {
    const { supabase } = await import('../lib/supabase')
    
    // Buscar próximo job pendente
    const { data: jobs, error } = await supabase
      .from('webhook_jobs')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(1)

    if (error || !jobs || jobs.length === 0) return

    const job = jobs[0]
    
    // Verificar se ainda pode tentar
    if (job.attempts >= job.max_attempts) return

    try {
      // Marcar como processando
      await supabase
        .from('webhook_jobs')
        .update({ 
          status: 'processing',
          attempts: job.attempts + 1
        })
        .eq('id', job.id)

      // Processar job
      await webhookService.processWebhookJob(job.id)

    } catch (error) {
      console.error('Database job processing error:', error)
      
      // Se não atingiu limite de tentativas, reagendar
      if (job.attempts < job.max_attempts - 1) {
        const delay = this.config.retryDelays[job.attempts] || 60000
        const nextAttempt = new Date(Date.now() + delay)
        
        await supabase
          .from('webhook_jobs')
          .update({ 
            status: 'pending',
            scheduled_at: nextAttempt.toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('id', job.id)
      } else {
        // Marcar como falhou permanentemente
        await supabase
          .from('webhook_jobs')
          .update({ 
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('id', job.id)
      }
    }
  }

  private async executeJob(job: QueueJob) {
    try {
      switch (job.type) {
        case 'webhook_processing':
          await webhookService.processWebhookJob(job.data.webhookEventId)
          break
        default:
          throw new Error(`Unknown job type: ${job.type}`)
      }
    } catch (error) {
      // Implementar retry logic
      if (job.attempts < job.maxAttempts) {
        const delay = this.config.retryDelays[job.attempts] || 60000
        
        await this.addJob(job.type, job.data, { 
          delay,
          maxAttempts: job.maxAttempts 
        })
      }
      
      throw error
    }
  }

  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Estatísticas da fila
  async getQueueStats(): Promise<{
    pending: number
    processing: number
    completed: number
    failed: number
  }> {
    if (this.redis) {
      // Implementar estatísticas Redis
      const pending = await this.redis.llen('job_queue')
      return { pending, processing: 0, completed: 0, failed: 0 }
    } else {
      const { supabase } = await import('../lib/supabase')
      
      const { data: stats } = await supabase
        .from('webhook_jobs')
        .select('status')
      
      if (!stats) return { pending: 0, processing: 0, completed: 0, failed: 0 }
      
      const counts = stats.reduce((acc, job) => {
        acc[job.status] = (acc[job.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      return {
        pending: counts.pending || 0,
        processing: counts.processing || 0,
        completed: counts.completed || 0,
        failed: counts.failed || 0
      }
    }
  }

  // Limpar jobs antigos
  async cleanupOldJobs(daysOld = 7): Promise<number> {
    const { supabase } = await import('../lib/supabase')
    
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)
    
    const { error, count } = await supabase
      .from('webhook_jobs')
      .delete()
      .in('status', ['completed', 'failed'])
      .lt('created_at', cutoffDate.toISOString())
    
    if (error) {
      throw new Error(`Failed to cleanup old jobs: ${error.message}`)
    }
    
    return count || 0
  }
}

// Inicializar serviço de fila
export const queueService = new QueueService({
  redisUrl: import.meta.env.VITE_UPSTASH_REDIS_REST_URL,
  maxConcurrentJobs: 3,
  retryDelays: [1000, 5000, 15000, 60000] // 1s, 5s, 15s, 1min
})

// Auto-limpeza de jobs antigos (executar diariamente)
if (typeof window === 'undefined') { // Apenas no servidor
  setInterval(async () => {
    try {
      const cleaned = await queueService.cleanupOldJobs(7)
      console.log(`Cleaned up ${cleaned} old jobs`)
    } catch (error) {
      console.error('Failed to cleanup old jobs:', error)
    }
  }, 24 * 60 * 60 * 1000) // 24 horas
}