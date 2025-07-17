export interface UserPlan {
  id: string
  user_id: string
  plan_type: PlanType
  status: 'active' | 'cancelled' | 'expired' | 'pending'
  starts_at: string
  expires_at?: string
  current_usage: PlanUsage
  created_at: string
  updated_at: string
}

export interface PlanUsage {
  funnels_created: number
  leads_collected: number
  last_reset_at: string
}

export interface PlanLimits {
  max_funnels: number | null // null = unlimited
  max_leads_per_month: number | null
  features: string[]
}

export interface Transaction {
  id: string
  user_id: string
  platform: WebhookPlatform
  transaction_id: string
  product_id: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  plan_type: PlanType
  webhook_data: Record<string, any>
  processed_at?: string
  created_at: string
}

export interface WebhookEvent {
  id: string
  platform: WebhookPlatform
  event_type: string
  transaction_id?: string
  user_email: string
  raw_data: Record<string, any>
  processed: boolean
  processing_attempts: number
  last_attempt_at?: string
  error_message?: string
  created_at: string
}

export interface WebhookJob {
  id: string
  webhook_event_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  attempts: number
  max_attempts: number
  scheduled_at: string
  processed_at?: string
  error: string | null
  created_at: string
}

export type PlanType = 'free' | 'pro' | 'enterprise'

export type WebhookPlatform = 'hotmart' | 'eduzz' | 'stripe' | 'kirvano' | 'monetizze'

export const PLAN_CONFIGS: Record<PlanType, PlanLimits> = {
  free: {
    max_funnels: 3,
    max_leads_per_month: 100,
    features: ['basic_analytics', 'standard_templates']
  },
  pro: {
    max_funnels: 50,
    max_leads_per_month: 5000,
    features: ['advanced_analytics', 'premium_templates', 'integrations', 'custom_branding']
  },
  enterprise: {
    max_funnels: null,
    max_leads_per_month: null,
    features: ['unlimited_everything', 'priority_support', 'white_label', 'api_access']
  }
}

export interface UpgradeNotification {
  id: string
  user_id: string
  message: string
  type: 'limit_warning' | 'limit_reached' | 'plan_expired' | 'upgrade_available'
  seen: boolean
  created_at: string
}

// Platform-specific webhook data structures
export interface HotmartWebhookData {
  event: string
  data: {
    product: {
      id: number
      name: string
    }
    purchase: {
      transaction: string
      status: string
      approved_date: number
    }
    buyer: {
      email: string
      name: string
    }
  }
}

export interface EduzzWebhookData {
  trans_id: string
  email: string
  status: string
  product_id: string
  product_name: string
  payment_method: string
  value: number
}

export interface StripeWebhookData {
  id: string
  object: string
  type: string
  data: {
    object: {
      id: string
      customer_email: string
      amount_paid: number
      currency: string
      status: string
      subscription: string
    }
  }
}

export interface KirvanoWebhookData {
  transaction_id: string
  email: string
  status: string
  product_id: string
  amount: number
  payment_date: string
}

export interface MonetizzeWebhookData {
  transacao: string
  email: string
  status: string
  produto: string
  valor: number
  data_aprovacao: string
}