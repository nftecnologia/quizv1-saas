import React from 'react'
import { Alert, AlertDescription } from '../ui/alert'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Progress } from '@radix-ui/react-progress'
import { usePlan } from '../../hooks/usePlan'
import { 
  AlertTriangle, 
  Crown, 
  X,
  TrendingUp,
  Users
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface PlanLimitNotificationProps {
  onDismiss?: () => void
  showInHeader?: boolean
}

export default function PlanLimitNotification({ 
  onDismiss, 
  showInHeader = false 
}: PlanLimitNotificationProps) {
  const navigate = useNavigate()
  const { 
    notifications,
    getPlanInfo,
    isNearLimit,
    hasReachedLimit,
    markNotificationSeen,
    getRecommendedUpgrade
  } = usePlan()

  const planInfo = getPlanInfo()
  const recommendedPlan = getRecommendedUpgrade()
  const unseenNotifications = notifications.filter(n => !n.seen)

  if (!planInfo || unseenNotifications.length === 0) {
    return null
  }

  const handleUpgrade = () => {
    navigate('/plans')
    if (onDismiss) onDismiss()
  }

  const handleDismiss = (notificationId: string) => {
    markNotificationSeen(notificationId)
  }

  const getNotificationVariant = (type: string) => {
    switch (type) {
      case 'limit_reached':
        return 'destructive'
      case 'limit_warning':
        return 'default'
      case 'plan_expired':
        return 'destructive'
      default:
        return 'default'
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'limit_reached':
      case 'limit_warning':
        return <AlertTriangle className="h-4 w-4" />
      case 'plan_expired':
        return <Crown className="h-4 w-4" />
      default:
        return <TrendingUp className="h-4 w-4" />
    }
  }

  // Para header (versão compacta)
  if (showInHeader) {
    const criticalNotifications = unseenNotifications.filter(n => 
      n.type === 'limit_reached' || n.type === 'plan_expired'
    )

    if (criticalNotifications.length === 0) return null

    return (
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={handleUpgrade}
          className="border-orange-200 bg-orange-50 text-orange-800 hover:bg-orange-100 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-200"
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          {criticalNotifications.length} Limit{criticalNotifications.length > 1 ? 's' : ''} Reached
          <Badge 
            variant="secondary" 
            className="ml-2 bg-orange-200 text-orange-800 dark:bg-orange-800 dark:text-orange-200"
          >
            {criticalNotifications.length}
          </Badge>
        </Button>
      </div>
    )
  }

  // Versão completa para dashboard
  return (
    <div className="space-y-4">
      {unseenNotifications.map((notification) => (
        <Alert 
          key={notification.id}
          variant={getNotificationVariant(notification.type)}
          className="relative"
        >
          <div className="flex items-start gap-3">
            {getNotificationIcon(notification.type)}
            
            <div className="flex-1 space-y-3">
              <AlertDescription className="text-sm">
                {notification.message}
              </AlertDescription>

              {/* Usage Progress for limit notifications */}
              {(notification.type === 'limit_warning' || notification.type === 'limit_reached') && (
                <div className="space-y-2">
                  {(isNearLimit('funnels') || hasReachedLimit('funnels')) && (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium">Funnels</span>
                        <span className="text-xs">
                          {planInfo.usage.funnels_created} / {planInfo.limits.max_funnels || '∞'}
                        </span>
                      </div>
                      <Progress 
                        value={planInfo.percentages.funnels} 
                        className="h-1.5"
                      />
                    </div>
                  )}

                  {(isNearLimit('leads') || hasReachedLimit('leads')) && (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium">Leads (Monthly)</span>
                        <span className="text-xs">
                          {planInfo.usage.leads_collected} / {planInfo.limits.max_leads_per_month || '∞'}
                        </span>
                      </div>
                      <Progress 
                        value={planInfo.percentages.leads} 
                        className="h-1.5"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                {recommendedPlan && (
                  <Button 
                    size="sm" 
                    onClick={handleUpgrade}
                    className="flex-1 sm:flex-none"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade to {recommendedPlan.charAt(0).toUpperCase() + recommendedPlan.slice(1)}
                  </Button>
                )}
                
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleDismiss(notification.id)}
                  className="flex-1 sm:flex-none"
                >
                  Dismiss
                </Button>
              </div>

              {/* Additional Info */}
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {new Date(notification.created_at).toLocaleString()}
              </div>
            </div>

            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDismiss(notification.id)}
              className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Alert>
      ))}

      {/* Plan Overview Card */}
      {(isNearLimit('funnels', 70) || isNearLimit('leads', 70)) && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                Current Plan: {planInfo.type.charAt(0).toUpperCase() + planInfo.type.slice(1)}
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                You're using most of your plan capacity
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {planInfo.usage.funnels_created}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">
                of {planInfo.limits.max_funnels || '∞'} funnels
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {planInfo.usage.leads_collected}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">
                of {planInfo.limits.max_leads_per_month || '∞'} leads/month
              </div>
            </div>
          </div>

          {recommendedPlan && (
            <Button 
              onClick={handleUpgrade}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to {recommendedPlan.charAt(0).toUpperCase() + recommendedPlan.slice(1)} Plan
            </Button>
          )}
        </div>
      )}
    </div>
  )
}