import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Progress } from '@radix-ui/react-progress'
import { usePlan } from '../hooks/usePlan'
import { PLAN_CONFIGS, PlanType } from '../types/subscription'
import { 
  CheckCircle, 
  XCircle, 
  Crown, 
  Zap, 
  Users,
  BarChart3,
  Palette,
  Smartphone,
  Globe,
  Shield,
  Headphones,
  Code
} from 'lucide-react'

const PLAN_FEATURES = {
  basic_analytics: { icon: BarChart3, label: 'Basic Analytics' },
  advanced_analytics: { icon: BarChart3, label: 'Advanced Analytics' },
  standard_templates: { icon: Palette, label: 'Standard Templates' },
  premium_templates: { icon: Palette, label: 'Premium Templates' },
  integrations: { icon: Globe, label: 'Third-party Integrations' },
  custom_branding: { icon: Smartphone, label: 'Custom Branding' },
  unlimited_everything: { icon: Crown, label: 'Unlimited Everything' },
  priority_support: { icon: Headphones, label: 'Priority Support' },
  white_label: { icon: Shield, label: 'White Label Solution' },
  api_access: { icon: Code, label: 'API Access' }
}

const UPGRADE_INSTRUCTIONS = {
  hotmart: {
    name: 'Hotmart',
    steps: [
      'Access the Hotmart marketplace',
      'Search for "QuizBuilder Pro"',
      'Complete your purchase',
      'Your account will be upgraded automatically'
    ],
    link: 'https://hotmart.com/product/quizbuilder-pro'
  },
  stripe: {
    name: 'Stripe',
    steps: [
      'Click the upgrade button below',
      'You will be redirected to Stripe Checkout',
      'Complete your payment securely',
      'Return to the dashboard with your new plan'
    ],
    link: '/checkout/stripe'
  }
}

export default function PlansPage() {
  const { 
    currentPlan, 
    usageStats, 
    notifications,
    getPlanInfo,
    hasFeature,
    getRecommendedUpgrade,
    planLoading 
  } = usePlan()

  const planInfo = getPlanInfo()

  if (planLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Upgrade your account to unlock more features and higher limits
        </p>
      </div>

      {/* Current Plan Status */}
      {planInfo && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Current Plan: {planInfo.type.charAt(0).toUpperCase() + planInfo.type.slice(1)}
              <Badge variant={planInfo.status === 'active' ? 'default' : 'secondary'}>
                {planInfo.status}
              </Badge>
            </CardTitle>
            <CardDescription>
              Your current usage and limits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Funnels Usage */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Funnels Created</span>
                  <span className="text-sm text-gray-600">
                    {planInfo.usage.funnels_created} / {planInfo.limits.max_funnels || '∞'}
                  </span>
                </div>
                <Progress 
                  value={planInfo.percentages.funnels} 
                  className="h-2"
                />
                {planInfo.percentages.funnels >= 80 && (
                  <p className="text-sm text-orange-600 mt-1">
                    You're approaching your funnel limit
                  </p>
                )}
              </div>

              {/* Leads Usage */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Leads This Month</span>
                  <span className="text-sm text-gray-600">
                    {planInfo.usage.leads_collected} / {planInfo.limits.max_leads_per_month || '∞'}
                  </span>
                </div>
                <Progress 
                  value={planInfo.percentages.leads} 
                  className="h-2"
                />
                {planInfo.percentages.leads >= 80 && (
                  <p className="text-sm text-orange-600 mt-1">
                    You're approaching your monthly lead limit
                  </p>
                )}
              </div>
            </div>

            {/* Expiration Warning */}
            {planInfo.expiresAt && (
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Your plan expires on {new Date(planInfo.expiresAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {(Object.keys(PLAN_CONFIGS) as PlanType[]).map((planType) => {
          const config = PLAN_CONFIGS[planType]
          const isCurrentPlan = currentPlan?.plan_type === planType
          const isRecommended = getRecommendedUpgrade() === planType

          return (
            <Card 
              key={planType} 
              className={`relative ${isCurrentPlan ? 'ring-2 ring-blue-500' : ''} ${isRecommended ? 'ring-2 ring-green-500' : ''}`}
            >
              {isRecommended && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-green-500 text-white">
                    Recommended
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center">
                <CardTitle className="text-2xl capitalize flex items-center justify-center gap-2">
                  {planType === 'free' && <Users className="h-6 w-6" />}
                  {planType === 'pro' && <Zap className="h-6 w-6" />}
                  {planType === 'enterprise' && <Crown className="h-6 w-6" />}
                  {planType}
                </CardTitle>
                <CardDescription>
                  {planType === 'free' && 'Perfect for getting started'}
                  {planType === 'pro' && 'Best for growing businesses'}
                  {planType === 'enterprise' && 'For large organizations'}
                </CardDescription>
                <div className="text-3xl font-bold mt-4">
                  {planType === 'free' && 'Free'}
                  {planType === 'pro' && '$29/mo'}
                  {planType === 'enterprise' && '$99/mo'}
                </div>
              </CardHeader>

              <CardContent>
                {/* Limits */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Funnels</span>
                    <span className="font-medium">
                      {config.max_funnels || 'Unlimited'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Leads/month</span>
                    <span className="font-medium">
                      {config.max_leads_per_month ? config.max_leads_per_month.toLocaleString() : 'Unlimited'}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2 mb-6">
                  {Object.entries(PLAN_FEATURES).map(([key, feature]) => {
                    const hasThisFeature = config.features.includes(key)
                    const Icon = feature.icon
                    
                    return (
                      <div 
                        key={key}
                        className={`flex items-center gap-2 text-sm ${hasThisFeature ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}
                      >
                        {hasThisFeature ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        <Icon className="h-4 w-4" />
                        {feature.label}
                      </div>
                    )
                  })}
                </div>

                {/* Action Button */}
                <Button 
                  className="w-full"
                  variant={isCurrentPlan ? 'outline' : 'default'}
                  disabled={isCurrentPlan}
                >
                  {isCurrentPlan ? 'Current Plan' : `Upgrade to ${planType}`}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Upgrade Instructions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>How to Upgrade</CardTitle>
          <CardDescription>
            Choose your preferred payment method and follow the instructions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(UPGRADE_INSTRUCTIONS).map(([key, instruction]) => (
              <div key={key} className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3">{instruction.name}</h3>
                <ol className="space-y-2 mb-4">
                  {instruction.steps.map((step, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
                <Button className="w-full" variant="outline">
                  Choose {instruction.name}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      {notifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
              Important updates about your plan and usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`p-3 rounded-lg border ${
                    notification.type === 'limit_reached' 
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      : notification.type === 'limit_warning'
                      ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                      : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  }`}
                >
                  <p className="text-sm">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}