import { supabase } from '../lib/supabase'
import {
  WebhookEvent,
  WebhookPlatform,
  PlanType,
  Transaction,
  HotmartWebhookData,
  EduzzWebhookData,
  StripeWebhookData,
  KirvanoWebhookData,
  MonetizzeWebhookData
} from '../types/subscription'
// Note: crypto is not available in browser, using Web Crypto API instead

interface WebhookConfig {
  platform: WebhookPlatform
  secret: string
  productMappings: Record<string, PlanType>
}

class WebhookService {
  private configs: Map<WebhookPlatform, WebhookConfig> = new Map()

  constructor() {
    this.initializeConfigs()
  }

  private initializeConfigs() {
    // Configurações dos webhooks (normalmente viria de variáveis de ambiente)
    const configs: WebhookConfig[] = [
      {
        platform: 'hotmart',
        secret: import.meta.env.VITE_HOTMART_WEBHOOK_SECRET || '',
        productMappings: {
          'PROD_ID_PRO': 'pro',
          'PROD_ID_ENTERPRISE': 'enterprise'
        }
      },
      {
        platform: 'eduzz',
        secret: import.meta.env.VITE_EDUZZ_WEBHOOK_SECRET || '',
        productMappings: {
          'eduzz_pro_id': 'pro',
          'eduzz_enterprise_id': 'enterprise'
        }
      },
      {
        platform: 'stripe',
        secret: import.meta.env.VITE_STRIPE_WEBHOOK_SECRET || '',
        productMappings: {
          'price_pro_monthly': 'pro',
          'price_enterprise_monthly': 'enterprise'
        }
      },
      {
        platform: 'kirvano',
        secret: import.meta.env.VITE_KIRVANO_WEBHOOK_SECRET || '',
        productMappings: {
          'kirvano_pro': 'pro',
          'kirvano_enterprise': 'enterprise'
        }
      },
      {
        platform: 'monetizze',
        secret: import.meta.env.VITE_MONETIZZE_WEBHOOK_SECRET || '',
        productMappings: {
          'monetizze_pro': 'pro',
          'monetizze_enterprise': 'enterprise'
        }
      }
    ]

    configs.forEach(config => {
      this.configs.set(config.platform, config)
    })
  }

  // Processar webhook recebido
  async processWebhook(
    platform: WebhookPlatform,
    signature: string,
    body: string,
    headers: Record<string, string>
  ): Promise<{ success: boolean; message: string }> {
    try {
      const config = this.configs.get(platform)
      if (!config) {
        throw new Error(`Platform ${platform} not configured`)
      }

      // Verificar assinatura
      if (!this.verifySignature(platform, signature, body, config.secret)) {
        throw new Error('Invalid webhook signature')
      }

      const data = JSON.parse(body)
      
      // Extrair informações baseado na plataforma
      const webhookInfo = this.extractWebhookInfo(platform, data)
      
      if (!webhookInfo) {
        throw new Error('Could not extract webhook information')
      }

      // Salvar evento no banco
      const { data: webhookEvent, error: eventError } = await supabase
        .from('webhook_events')
        .insert({
          platform,
          event_type: webhookInfo.eventType,
          transaction_id: webhookInfo.transactionId,
          user_email: webhookInfo.userEmail,
          raw_data: data,
          processed: false,
          processing_attempts: 0
        })
        .select()
        .single()

      if (eventError) {
        throw new Error(`Failed to save webhook event: ${eventError.message}`)
      }

      // Adicionar job à fila de processamento
      await this.queueProcessingJob(webhookEvent.id)

      return { success: true, message: 'Webhook received and queued for processing' }
    } catch (error) {
      console.error('Webhook processing error:', error)
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  // Verificar assinatura do webhook
  private verifySignature(
    platform: WebhookPlatform,
    signature: string,
    body: string,
    secret: string
  ): boolean {
    try {
      switch (platform) {
        case 'hotmart':
          return this.verifyHotmartSignature(signature, body, secret)
        case 'eduzz':
          return this.verifyEduzzSignature(signature, body, secret)
        case 'stripe':
          return this.verifyStripeSignature(signature, body, secret)
        case 'kirvano':
          return this.verifyKirvanoSignature(signature, body, secret)
        case 'monetizze':
          return this.verifyMonetizzeSignature(signature, body, secret)
        default:
          return false
      }
    } catch (error) {
      console.error('Signature verification error:', error)
      return false
    }
  }

  private verifyHotmartSignature(signature: string, body: string, secret: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex')
    return signature === expectedSignature
  }

  private verifyEduzzSignature(signature: string, body: string, secret: string): boolean {
    const expectedSignature = crypto
      .createHash('md5')
      .update(body + secret)
      .digest('hex')
    return signature === expectedSignature
  }

  private verifyStripeSignature(signature: string, body: string, secret: string): boolean {
    const elements = signature.split(',')
    const timestamp = elements.find(el => el.startsWith('t='))?.split('=')[1]
    const sig = elements.find(el => el.startsWith('v1='))?.split('=')[1]
    
    if (!timestamp || !sig) return false

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(timestamp + '.' + body)
      .digest('hex')
    
    return sig === expectedSignature
  }

  private verifyKirvanoSignature(signature: string, body: string, secret: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex')
    return signature === expectedSignature
  }

  private verifyMonetizzeSignature(signature: string, body: string, secret: string): boolean {
    const expectedSignature = crypto
      .createHash('sha256')
      .update(body + secret)
      .digest('hex')
    return signature === expectedSignature
  }

  // Extrair informações do webhook baseado na plataforma
  private extractWebhookInfo(platform: WebhookPlatform, data: any) {
    switch (platform) {
      case 'hotmart':
        return this.extractHotmartInfo(data as HotmartWebhookData)
      case 'eduzz':
        return this.extractEduzzInfo(data as EduzzWebhookData)
      case 'stripe':
        return this.extractStripeInfo(data as StripeWebhookData)
      case 'kirvano':
        return this.extractKirvanoInfo(data as KirvanoWebhookData)
      case 'monetizze':
        return this.extractMonetizzeInfo(data as MonetizzeWebhookData)
      default:
        return null
    }
  }

  private extractHotmartInfo(data: HotmartWebhookData) {
    if (data.event !== 'PURCHASE_COMPLETE') return null
    
    return {
      eventType: data.event,
      transactionId: data.data.purchase.transaction,
      userEmail: data.data.buyer.email,
      productId: data.data.product.id.toString(),
      status: data.data.purchase.status
    }
  }

  private extractEduzzInfo(data: EduzzWebhookData) {
    if (data.status !== 'ACTIVE') return null
    
    return {
      eventType: 'PURCHASE_COMPLETE',
      transactionId: data.trans_id,
      userEmail: data.email,
      productId: data.product_id,
      status: data.status
    }
  }

  private extractStripeInfo(data: StripeWebhookData) {
    if (data.type !== 'invoice.payment_succeeded') return null
    
    return {
      eventType: data.type,
      transactionId: data.data.object.id,
      userEmail: data.data.object.customer_email,
      productId: data.data.object.subscription,
      status: data.data.object.status
    }
  }

  private extractKirvanoInfo(data: KirvanoWebhookData) {
    if (data.status !== 'paid') return null
    
    return {
      eventType: 'PURCHASE_COMPLETE',
      transactionId: data.transaction_id,
      userEmail: data.email,
      productId: data.product_id,
      status: data.status
    }
  }

  private extractMonetizzeInfo(data: MonetizzeWebhookData) {
    if (data.status !== 'Aprovado') return null
    
    return {
      eventType: 'PURCHASE_COMPLETE',
      transactionId: data.transacao,
      userEmail: data.email,
      productId: data.produto,
      status: data.status
    }
  }

  // Adicionar job à fila de processamento
  private async queueProcessingJob(webhookEventId: string) {
    const { error } = await supabase
      .from('webhook_jobs')
      .insert({
        webhook_event_id: webhookEventId,
        status: 'pending',
        attempts: 0,
        max_attempts: 3,
        scheduled_at: new Date().toISOString()
      })

    if (error) {
      throw new Error(`Failed to queue processing job: ${error.message}`)
    }
  }

  // Processar job da fila
  async processWebhookJob(jobId: string): Promise<void> {
    try {
      // Buscar job
      const { data: job, error: jobError } = await supabase
        .from('webhook_jobs')
        .select(`
          *,
          webhook_event:webhook_events(*)
        `)
        .eq('id', jobId)
        .single()

      if (jobError || !job) {
        throw new Error('Job not found')
      }

      // Marcar como processando
      await supabase
        .from('webhook_jobs')
        .update({ 
          status: 'processing',
          attempts: job.attempts + 1
        })
        .eq('id', jobId)

      const webhookEvent = job.webhook_event

      // Buscar usuário pelo email
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', webhookEvent.user_email)
        .single()

      if (userError || !user) {
        throw new Error(`User not found: ${webhookEvent.user_email}`)
      }

      // Determinar tipo de plano baseado no produto
      const config = this.configs.get(webhookEvent.platform)
      const productId = this.extractWebhookInfo(webhookEvent.platform, webhookEvent.raw_data)?.productId
      
      if (!config || !productId) {
        throw new Error('Invalid webhook configuration or product ID')
      }

      const planType = config.productMappings[productId]
      if (!planType) {
        throw new Error(`Product ${productId} not mapped to any plan`)
      }

      // Criar transação
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          platform: webhookEvent.platform,
          transaction_id: webhookEvent.transaction_id,
          product_id: productId,
          amount: 0, // Seria extraído dos dados do webhook
          currency: 'BRL',
          status: 'completed',
          plan_type: planType,
          webhook_data: webhookEvent.raw_data,
          processed_at: new Date().toISOString()
        })
        .select()
        .single()

      if (transactionError) {
        throw new Error(`Failed to create transaction: ${transactionError.message}`)
      }

      // Atualizar plano do usuário
      await this.updateUserPlan(user.id, planType)

      // Marcar webhook como processado
      await supabase
        .from('webhook_events')
        .update({ processed: true })
        .eq('id', webhookEvent.id)

      // Marcar job como concluído
      await supabase
        .from('webhook_jobs')
        .update({ 
          status: 'completed',
          processed_at: new Date().toISOString()
        })
        .eq('id', jobId)

      // Enviar notificação por email (implementar)
      await this.sendUpgradeNotification(user.email, planType)

    } catch (error) {
      console.error('Job processing error:', error)
      
      // Atualizar job com erro
      await supabase
        .from('webhook_jobs')
        .update({ 
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', jobId)
    }
  }

  // Atualizar plano do usuário
  private async updateUserPlan(userId: string, planType: PlanType) {
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + 1) // 1 mês

    const { error } = await supabase
      .from('user_plans')
      .upsert({
        user_id: userId,
        plan_type: planType,
        status: 'active',
        starts_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        current_usage: {
          funnels_created: 0,
          leads_collected: 0,
          last_reset_at: new Date().toISOString()
        }
      })

    if (error) {
      throw new Error(`Failed to update user plan: ${error.message}`)
    }
  }

  // Enviar notificação de upgrade
  private async sendUpgradeNotification(email: string, planType: PlanType) {
    // Implementar envio de email
    console.log(`Sending upgrade notification to ${email} for plan ${planType}`)
  }
}

export const webhookService = new WebhookService()