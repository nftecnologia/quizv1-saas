import { supabase } from '../lib/supabase'
import { 
  UserPlan, 
  PlanType, 
  PlanUsage, 
  PLAN_CONFIGS, 
  UpgradeNotification 
} from '../types/subscription'

class PlanService {
  // Buscar plano atual do usuário
  async getCurrentPlan(userId: string): Promise<UserPlan | null> {
    const { data, error } = await supabase
      .from('user_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (error || !data) {
      // Se não tem plano, criar plano free
      return await this.createFreePlan(userId)
    }

    return data
  }

  // Criar plano gratuito para novo usuário
  async createFreePlan(userId: string): Promise<UserPlan> {
    const planData = {
      user_id: userId,
      plan_type: 'free' as PlanType,
      status: 'active' as const,
      starts_at: new Date().toISOString(),
      current_usage: {
        funnels_created: 0,
        leads_collected: 0,
        last_reset_at: new Date().toISOString()
      }
    }

    const { data, error } = await supabase
      .from('user_plans')
      .insert(planData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create free plan: ${error.message}`)
    }

    return data
  }

  // Verificar se usuário pode criar novo funil
  async canCreateFunnel(userId: string): Promise<{ canCreate: boolean; message?: string }> {
    const plan = await this.getCurrentPlan(userId)
    if (!plan) {
      return { canCreate: false, message: 'Plan not found' }
    }

    const limits = PLAN_CONFIGS[plan.plan_type]
    
    if (limits.max_funnels === null) {
      return { canCreate: true }
    }

    if (plan.current_usage.funnels_created >= limits.max_funnels) {
      return { 
        canCreate: false, 
        message: `You have reached your funnel limit of ${limits.max_funnels}. Upgrade to create more funnels.` 
      }
    }

    return { canCreate: true }
  }

  // Verificar se usuário pode coletar mais leads
  async canCollectLead(userId: string): Promise<{ canCollect: boolean; message?: string }> {
    const plan = await this.getCurrentPlan(userId)
    if (!plan) {
      return { canCollect: false, message: 'Plan not found' }
    }

    const limits = PLAN_CONFIGS[plan.plan_type]
    
    if (limits.max_leads_per_month === null) {
      return { canCollect: true }
    }

    // Verificar se precisa resetar o contador mensal
    const usage = await this.checkAndResetMonthlyUsage(userId, plan)

    if (usage.leads_collected >= limits.max_leads_per_month) {
      return { 
        canCollect: false, 
        message: `You have reached your monthly lead limit of ${limits.max_leads_per_month}. Upgrade to collect more leads.` 
      }
    }

    return { canCollect: true }
  }

  // Incrementar contador de funis criados
  async incrementFunnelCount(userId: string): Promise<void> {
    const { data: plan } = await supabase
      .from('user_plans')
      .select('current_usage')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (!plan) {
      throw new Error('User plan not found')
    }

    const newUsage = {
      ...plan.current_usage,
      funnels_created: plan.current_usage.funnels_created + 1
    }

    const { error } = await supabase
      .from('user_plans')
      .update({ current_usage: newUsage })
      .eq('user_id', userId)
      .eq('status', 'active')

    if (error) {
      throw new Error(`Failed to increment funnel count: ${error.message}`)
    }

    // Verificar se precisa enviar notificação de limite
    await this.checkLimitWarnings(userId, newUsage)
  }

  // Incrementar contador de leads coletados
  async incrementLeadCount(userId: string): Promise<void> {
    const plan = await this.getCurrentPlan(userId)
    if (!plan) {
      throw new Error('User plan not found')
    }

    // Verificar se precisa resetar o contador mensal
    const usage = await this.checkAndResetMonthlyUsage(userId, plan)

    const newUsage = {
      ...usage,
      leads_collected: usage.leads_collected + 1
    }

    const { error } = await supabase
      .from('user_plans')
      .update({ current_usage: newUsage })
      .eq('user_id', userId)
      .eq('status', 'active')

    if (error) {
      throw new Error(`Failed to increment lead count: ${error.message}`)
    }

    // Verificar se precisa enviar notificação de limite
    await this.checkLimitWarnings(userId, newUsage)
  }

  // Verificar e resetar uso mensal se necessário
  private async checkAndResetMonthlyUsage(userId: string, plan: UserPlan): Promise<PlanUsage> {
    const lastReset = new Date(plan.current_usage.last_reset_at)
    const now = new Date()
    
    // Se passou um mês desde o último reset
    if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
      const resetUsage = {
        funnels_created: plan.current_usage.funnels_created, // Funis não resetam
        leads_collected: 0, // Leads resetam mensalmente
        last_reset_at: now.toISOString()
      }

      await supabase
        .from('user_plans')
        .update({ current_usage: resetUsage })
        .eq('user_id', userId)
        .eq('status', 'active')

      return resetUsage
    }

    return plan.current_usage
  }

  // Verificar avisos de limite
  private async checkLimitWarnings(userId: string, usage: PlanUsage): Promise<void> {
    const plan = await this.getCurrentPlan(userId)
    if (!plan) return

    const limits = PLAN_CONFIGS[plan.plan_type]
    const notifications: Omit<UpgradeNotification, 'id' | 'created_at'>[] = []

    // Verificar limite de funis (80% do limite)
    if (limits.max_funnels && usage.funnels_created >= limits.max_funnels * 0.8) {
      notifications.push({
        user_id: userId,
        message: `You've used ${usage.funnels_created} of ${limits.max_funnels} funnels. Consider upgrading to create more.`,
        type: 'limit_warning',
        seen: false
      })
    }

    // Verificar limite de leads (80% do limite)
    if (limits.max_leads_per_month && usage.leads_collected >= limits.max_leads_per_month * 0.8) {
      notifications.push({
        user_id: userId,
        message: `You've collected ${usage.leads_collected} of ${limits.max_leads_per_month} leads this month. Consider upgrading for more capacity.`,
        type: 'limit_warning',
        seen: false
      })
    }

    // Verificar se atingiu o limite
    if (limits.max_funnels && usage.funnels_created >= limits.max_funnels) {
      notifications.push({
        user_id: userId,
        message: `You've reached your funnel limit. Upgrade to create more funnels.`,
        type: 'limit_reached',
        seen: false
      })
    }

    if (limits.max_leads_per_month && usage.leads_collected >= limits.max_leads_per_month) {
      notifications.push({
        user_id: userId,
        message: `You've reached your monthly lead limit. Upgrade to collect more leads.`,
        type: 'limit_reached',
        seen: false
      })
    }

    // Salvar notificações
    if (notifications.length > 0) {
      await supabase
        .from('upgrade_notifications')
        .insert(notifications)
    }
  }

  // Buscar notificações de upgrade não vistas
  async getUpgradeNotifications(userId: string): Promise<UpgradeNotification[]> {
    const { data, error } = await supabase
      .from('upgrade_notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('seen', false)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch notifications: ${error.message}`)
    }

    return data || []
  }

  // Marcar notificação como vista
  async markNotificationSeen(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('upgrade_notifications')
      .update({ seen: true })
      .eq('id', notificationId)

    if (error) {
      throw new Error(`Failed to mark notification as seen: ${error.message}`)
    }
  }

  // Buscar estatísticas de uso
  async getUsageStats(userId: string): Promise<{
    plan: UserPlan
    limits: typeof PLAN_CONFIGS[PlanType]
    percentages: { funnels: number; leads: number }
  }> {
    const plan = await this.getCurrentPlan(userId)
    if (!plan) {
      throw new Error('User plan not found')
    }

    const limits = PLAN_CONFIGS[plan.plan_type]
    
    const percentages = {
      funnels: limits.max_funnels 
        ? (plan.current_usage.funnels_created / limits.max_funnels) * 100 
        : 0,
      leads: limits.max_leads_per_month 
        ? (plan.current_usage.leads_collected / limits.max_leads_per_month) * 100 
        : 0
    }

    return { plan, limits, percentages }
  }

  // Buscar histórico de transações
  async getTransactionHistory(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch transaction history: ${error.message}`)
    }

    return data || []
  }

  // Verificar se plano expirou
  async checkPlanExpiration(userId: string): Promise<void> {
    const plan = await this.getCurrentPlan(userId)
    if (!plan || !plan.expires_at) return

    const now = new Date()
    const expirationDate = new Date(plan.expires_at)

    if (now > expirationDate) {
      // Downgrade para plano gratuito
      await supabase
        .from('user_plans')
        .update({ 
          status: 'expired',
          updated_at: now.toISOString()
        })
        .eq('id', plan.id)

      // Criar novo plano gratuito
      await this.createFreePlan(userId)

      // Criar notificação
      await supabase
        .from('upgrade_notifications')
        .insert({
          user_id: userId,
          message: 'Your plan has expired. You have been moved to the free plan.',
          type: 'plan_expired',
          seen: false
        })
    }
  }

  // Verificar features disponíveis
  hasFeature(planType: PlanType, feature: string): boolean {
    return PLAN_CONFIGS[planType].features.includes(feature)
  }
}

export const planService = new PlanService()