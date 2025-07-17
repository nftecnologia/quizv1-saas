import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { planService } from '../services/planService'
import { UserPlan, PlanType, UpgradeNotification, PLAN_CONFIGS } from '../types/subscription'
import { useAuth } from './useAuth'
import { toast } from '../hooks/use-toast'

export function usePlan() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Buscar plano atual
  const {
    data: currentPlan,
    isLoading: planLoading,
    error: planError
  } = useQuery({
    queryKey: ['user-plan', user?.id],
    queryFn: () => user ? planService.getCurrentPlan(user.id) : null,
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000 // 10 minutos
  })

  // Buscar estatísticas de uso
  const {
    data: usageStats,
    isLoading: usageLoading
  } = useQuery({
    queryKey: ['usage-stats', user?.id],
    queryFn: () => user ? planService.getUsageStats(user.id) : null,
    enabled: !!user,
    staleTime: 1 * 60 * 1000, // 1 minuto
    refetchInterval: 5 * 60 * 1000 // Atualizar a cada 5 minutos
  })

  // Buscar notificações
  const {
    data: notifications,
    isLoading: notificationsLoading
  } = useQuery({
    queryKey: ['upgrade-notifications', user?.id],
    queryFn: () => user ? planService.getUpgradeNotifications(user.id) : [],
    enabled: !!user,
    staleTime: 30 * 1000, // 30 segundos
    refetchInterval: 2 * 60 * 1000 // Atualizar a cada 2 minutos
  })

  // Buscar histórico de transações
  const {
    data: transactions,
    isLoading: transactionsLoading
  } = useQuery({
    queryKey: ['transaction-history', user?.id],
    queryFn: () => user ? planService.getTransactionHistory(user.id) : [],
    enabled: !!user,
    staleTime: 10 * 60 * 1000 // 10 minutos
  })

  // Mutation para marcar notificação como vista
  const markNotificationSeen = useMutation({
    mutationFn: (notificationId: string) => 
      planService.markNotificationSeen(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upgrade-notifications', user?.id] })
    }
  })

  // Mutation para incrementar contador de funis
  const incrementFunnelCount = useMutation({
    mutationFn: () => user ? planService.incrementFunnelCount(user.id) : Promise.reject(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usage-stats', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['upgrade-notifications', user?.id] })
    },
    onError: (error: any) => {
      toast({
        title: "Limit Reached",
        description: error.message || "You've reached your funnel limit",
        variant: "destructive"
      })
    }
  })

  // Mutation para incrementar contador de leads
  const incrementLeadCount = useMutation({
    mutationFn: () => user ? planService.incrementLeadCount(user.id) : Promise.reject(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usage-stats', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['upgrade-notifications', user?.id] })
    },
    onError: (error: any) => {
      toast({
        title: "Limit Reached",
        description: error.message || "You've reached your lead limit",
        variant: "destructive"
      })
    }
  })

  // Verificar se pode criar funil
  const canCreateFunnel = async (): Promise<boolean> => {
    if (!user) return false
    
    try {
      const result = await planService.canCreateFunnel(user.id)
      if (!result.canCreate && result.message) {
        toast({
          title: "Cannot Create Funnel",
          description: result.message,
          variant: "destructive"
        })
      }
      return result.canCreate
    } catch (error) {
      return false
    }
  }

  // Verificar se pode coletar lead
  const canCollectLead = async (): Promise<boolean> => {
    if (!user) return false
    
    try {
      const result = await planService.canCollectLead(user.id)
      if (!result.canCollect && result.message) {
        toast({
          title: "Cannot Collect Lead",
          description: result.message,
          variant: "destructive"
        })
      }
      return result.canCollect
    } catch (error) {
      return false
    }
  }

  // Verificar se tem feature específica
  const hasFeature = (feature: string): boolean => {
    if (!currentPlan) return false
    return planService.hasFeature((currentPlan as any).plan_type, feature)
  }

  // Obter informações do plano atual
  const getPlanInfo = () => {
    if (!currentPlan) return null
    
    const plan = currentPlan as any
    const limits = PLAN_CONFIGS[plan.plan_type]
    const usage = plan.current_usage
    
    return {
      type: plan.plan_type,
      status: plan.status,
      limits,
      usage,
      percentages: {
        funnels: limits.max_funnels 
          ? (usage.funnels_created / limits.max_funnels) * 100 
          : 0,
        leads: limits.max_leads_per_month 
          ? (usage.leads_collected / limits.max_leads_per_month) * 100 
          : 0
      },
      features: limits.features,
      expiresAt: plan.expires_at
    }
  }

  // Verificar se está próximo do limite
  const isNearLimit = (type: 'funnels' | 'leads', threshold = 80): boolean => {
    const planInfo = getPlanInfo()
    if (!planInfo) return false
    
    return planInfo.percentages[type] >= threshold
  }

  // Verificar se atingiu o limite
  const hasReachedLimit = (type: 'funnels' | 'leads'): boolean => {
    const planInfo = getPlanInfo()
    if (!planInfo) return false
    
    return planInfo.percentages[type] >= 100
  }

  // Obter próximo plano recomendado
  const getRecommendedUpgrade = (): PlanType | null => {
    if (!currentPlan) return 'pro'
    
    const plan = currentPlan as any
    switch (plan.plan_type) {
      case 'free':
        return 'pro'
      case 'pro':
        return 'enterprise'
      case 'enterprise':
        return null
      default:
        return null
    }
  }

  return {
    // Data
    currentPlan,
    usageStats,
    notifications: notifications || [],
    transactions: transactions || [],
    
    // Loading states
    planLoading,
    usageLoading,
    notificationsLoading,
    transactionsLoading,
    
    // Actions
    markNotificationSeen: markNotificationSeen.mutate,
    incrementFunnelCount: incrementFunnelCount.mutate,
    incrementLeadCount: incrementLeadCount.mutate,
    
    // Helpers
    canCreateFunnel,
    canCollectLead,
    hasFeature,
    getPlanInfo,
    isNearLimit,
    hasReachedLimit,
    getRecommendedUpgrade,
    
    // Mutation states
    isMarkingNotificationSeen: markNotificationSeen.isPending,
    isIncrementingFunnel: incrementFunnelCount.isPending,
    isIncrementingLead: incrementLeadCount.isPending,
    
    // Error states
    planError,
    markNotificationError: markNotificationSeen.error,
    incrementFunnelError: incrementFunnelCount.error,
    incrementLeadError: incrementLeadCount.error
  }
}