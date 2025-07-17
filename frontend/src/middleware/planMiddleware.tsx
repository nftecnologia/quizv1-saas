import React from 'react'
import { planService } from '../services/planService'
import { PlanType } from '../types/subscription'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/button'

interface PlanCheckResult {
  allowed: boolean
  message?: string
  upgradeRequired?: boolean
  currentPlan?: PlanType
  requiredPlan?: PlanType
}

class PlanMiddleware {
  // Verificar se usuário pode criar funil
  async checkFunnelCreation(userId: string): Promise<PlanCheckResult> {
    try {
      const result = await planService.canCreateFunnel(userId)
      const plan = await planService.getCurrentPlan(userId)
      
      if (!result.canCreate) {
        return {
          allowed: false,
          message: result.message,
          upgradeRequired: true,
          currentPlan: plan?.plan_type,
          requiredPlan: plan?.plan_type === 'free' ? 'pro' : 'enterprise'
        }
      }

      return { allowed: true }
    } catch (error) {
      return {
        allowed: false,
        message: 'Failed to check funnel creation permissions'
      }
    }
  }

  // Verificar se usuário pode coletar lead
  async checkLeadCollection(userId: string): Promise<PlanCheckResult> {
    try {
      const result = await planService.canCollectLead(userId)
      const plan = await planService.getCurrentPlan(userId)
      
      if (!result.canCollect) {
        return {
          allowed: false,
          message: result.message,
          upgradeRequired: true,
          currentPlan: plan?.plan_type,
          requiredPlan: plan?.plan_type === 'free' ? 'pro' : 'enterprise'
        }
      }

      return { allowed: true }
    } catch (error) {
      return {
        allowed: false,
        message: 'Failed to check lead collection permissions'
      }
    }
  }

  // Verificar se usuário tem acesso a feature específica
  async checkFeatureAccess(userId: string, feature: string): Promise<PlanCheckResult> {
    try {
      const plan = await planService.getCurrentPlan(userId)
      
      if (!plan) {
        return {
          allowed: false,
          message: 'User plan not found'
        }
      }

      const hasAccess = planService.hasFeature(plan.plan_type, feature)
      
      if (!hasAccess) {
        return {
          allowed: false,
          message: `This feature requires a higher plan`,
          upgradeRequired: true,
          currentPlan: plan.plan_type,
          requiredPlan: this.getRequiredPlanForFeature(feature)
        }
      }

      return { allowed: true }
    } catch (error) {
      return {
        allowed: false,
        message: 'Failed to check feature access'
      }
    }
  }

  // Verificar se usuário pode acessar analytics avançados
  async checkAdvancedAnalytics(userId: string): Promise<PlanCheckResult> {
    return this.checkFeatureAccess(userId, 'advanced_analytics')
  }

  // Verificar se usuário pode usar templates premium
  async checkPremiumTemplates(userId: string): Promise<PlanCheckResult> {
    return this.checkFeatureAccess(userId, 'premium_templates')
  }

  // Verificar se usuário pode usar integrações
  async checkIntegrations(userId: string): Promise<PlanCheckResult> {
    return this.checkFeatureAccess(userId, 'integrations')
  }

  // Verificar se usuário pode usar branding customizado
  async checkCustomBranding(userId: string): Promise<PlanCheckResult> {
    return this.checkFeatureAccess(userId, 'custom_branding')
  }

  // Verificar se usuário pode usar white label
  async checkWhiteLabel(userId: string): Promise<PlanCheckResult> {
    return this.checkFeatureAccess(userId, 'white_label')
  }

  // Verificar se usuário pode usar API
  async checkApiAccess(userId: string): Promise<PlanCheckResult> {
    return this.checkFeatureAccess(userId, 'api_access')
  }

  // Verificar se usuário tem suporte prioritário
  async checkPrioritySupport(userId: string): Promise<PlanCheckResult> {
    return this.checkFeatureAccess(userId, 'priority_support')
  }

  // Middleware para incrementar contador com verificação
  async incrementWithCheck(
    userId: string, 
    type: 'funnels' | 'leads'
  ): Promise<PlanCheckResult & { incremented?: boolean }> {
    try {
      if (type === 'funnels') {
        const canCreate = await this.checkFunnelCreation(userId)
        if (!canCreate.allowed) {
          return canCreate
        }
        
        await planService.incrementFunnelCount(userId)
        return { allowed: true, incremented: true }
        
      } else if (type === 'leads') {
        const canCollect = await this.checkLeadCollection(userId)
        if (!canCollect.allowed) {
          return canCollect
        }
        
        await planService.incrementLeadCount(userId)
        return { allowed: true, incremented: true }
      }

      return { allowed: false, message: 'Invalid increment type' }
    } catch (error) {
      return {
        allowed: false,
        message: error instanceof Error ? error.message : 'Failed to increment counter'
      }
    }
  }

  // Obter plano necessário para feature
  private getRequiredPlanForFeature(feature: string): PlanType {
    const featurePlanMap: Record<string, PlanType> = {
      'advanced_analytics': 'pro',
      'premium_templates': 'pro',
      'integrations': 'pro',
      'custom_branding': 'pro',
      'white_label': 'enterprise',
      'api_access': 'enterprise',
      'priority_support': 'enterprise',
      'unlimited_everything': 'enterprise'
    }

    return featurePlanMap[feature] || 'pro'
  }

  // Middleware para verificação geral de plano
  async checkPlanAccess(
    userId: string,
    requirements: {
      feature?: string
      minPlan?: PlanType
      needsFunnelSlot?: boolean
      needsLeadSlot?: boolean
    }
  ): Promise<PlanCheckResult> {
    try {
      const plan = await planService.getCurrentPlan(userId)
      
      if (!plan) {
        return {
          allowed: false,
          message: 'User plan not found'
        }
      }

      // Verificar plano mínimo
      if (requirements.minPlan) {
        const planOrder: Record<PlanType, number> = {
          'free': 0,
          'pro': 1,
          'enterprise': 2
        }

        if (planOrder[plan.plan_type] < planOrder[requirements.minPlan]) {
          return {
            allowed: false,
            message: `This action requires at least ${requirements.minPlan} plan`,
            upgradeRequired: true,
            currentPlan: plan.plan_type,
            requiredPlan: requirements.minPlan
          }
        }
      }

      // Verificar feature específica
      if (requirements.feature) {
        const featureCheck = await this.checkFeatureAccess(userId, requirements.feature)
        if (!featureCheck.allowed) {
          return featureCheck
        }
      }

      // Verificar slot de funil
      if (requirements.needsFunnelSlot) {
        const funnelCheck = await this.checkFunnelCreation(userId)
        if (!funnelCheck.allowed) {
          return funnelCheck
        }
      }

      // Verificar slot de lead
      if (requirements.needsLeadSlot) {
        const leadCheck = await this.checkLeadCollection(userId)
        if (!leadCheck.allowed) {
          return leadCheck
        }
      }

      return { allowed: true }
    } catch (error) {
      return {
        allowed: false,
        message: 'Failed to check plan access'
      }
    }
  }

  // Hook para usar nos componentes React
  createPlanGuard() {
    return {
      checkAndIncrement: this.incrementWithCheck.bind(this),
      checkFeature: this.checkFeatureAccess.bind(this),
      checkFunnel: this.checkFunnelCreation.bind(this),
      checkLead: this.checkLeadCollection.bind(this),
      checkAccess: this.checkPlanAccess.bind(this)
    }
  }
}

export const planMiddleware = new PlanMiddleware()

// Helper function para usar em componentes
export function usePlanGuard() {
  return planMiddleware.createPlanGuard()
}

// HOC para proteger componentes com verificação de plano
export function withPlanGuard<T extends object>(
  Component: React.ComponentType<T>,
  requirements: Parameters<typeof planMiddleware.checkPlanAccess>[1]
) {
  return function PlanGuardedComponent(props: T) {
    const [allowed, setAllowed] = React.useState<boolean | null>(null)
    const [error, setError] = React.useState<string>('')
    const { user } = useAuth() // Assuming you have useAuth hook

    React.useEffect(() => {
      if (!user) {
        setAllowed(false)
        return
      }

      planMiddleware.checkPlanAccess(user.id, requirements)
        .then(result => {
          setAllowed(result.allowed)
          if (!result.allowed) {
            setError(result.message || 'Access denied')
          }
        })
        .catch(() => {
          setAllowed(false)
          setError('Failed to verify access')
        })
    }, [user])

    if (allowed === null) {
      return <div>Checking access...</div>
    }

    if (!allowed) {
      return (
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.href = '/plans'}>
            Upgrade Plan
          </Button>
        </div>
      )
    }

    return <Component {...props} />
  }
}

// Type for plan check result
export type { PlanCheckResult }