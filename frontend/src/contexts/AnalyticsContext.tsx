import React, { createContext, useContext, useEffect, useState } from 'react'
import { analyticsService } from '../services/analytics'
import { useAuth } from '../hooks/useAuth'

interface AnalyticsContextType {
  isInitialized: boolean
  trackEvent: (eventType: string, eventData?: Record<string, any>, quizId?: string) => void
  trackQuizStart: (quizId: string) => void
  trackQuestionAnswered: (quizId: string, questionId: string, answer: any, timeSpent: number) => void
  trackQuizCompleted: (quizId: string, totalTime: number, score?: number) => void
  trackQuizAbandoned: (quizId: string, lastQuestionId: string, timeSpent: number) => void
  trackInteraction: (element: HTMLElement, quizId: string, questionId?: string) => void
  trackPerformance: (metric: string, value: number, quizId?: string) => void
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined)

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    // Initialize analytics when component mounts
    const initializeAnalytics = async () => {
      try {
        // Initialize Google Analytics if configured
        const gaTrackingId = import.meta.env.VITE_GA_TRACKING_ID
        if (gaTrackingId) {
          analyticsService.initializeGoogleAnalytics(gaTrackingId)
        }

        // Initialize Facebook Pixel if configured
        const fbPixelId = import.meta.env.VITE_FB_PIXEL_ID
        if (fbPixelId) {
          analyticsService.initializeFacebookPixel(fbPixelId)
        }

        // Track initial page view
        await analyticsService.trackEvent('quiz_start', {
          url: window.location.href,
          title: document.title,
          user_id: user?.id
        })

        setIsInitialized(true)
      } catch (error) {
        console.error('Failed to initialize analytics:', error)
      }
    }

    initializeAnalytics()
  }, [user])

  // Track page views on route changes
  useEffect(() => {
    if (isInitialized) {
      analyticsService.trackEvent('quiz_start', {
        url: window.location.href,
        title: document.title,
        user_id: user?.id
      })
    }
  }, [isInitialized, user, window.location.href])

  // Track performance metrics
  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      // Track page load time
      window.addEventListener('load', () => {
        if (window.performance && window.performance.timing) {
          const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart
          analyticsService.trackPerformance('page_load_time', loadTime)
        }
      })

      // Track page visibility changes
      document.addEventListener('visibilitychange', () => {
        analyticsService.trackEvent('page_visibility_change', {
          visibility_state: document.visibilityState,
          timestamp: Date.now()
        })
      })

      // Track scroll depth
      let maxScrollDepth = 0
      const trackScrollDepth = () => {
        const scrollDepth = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100)
        if (scrollDepth > maxScrollDepth) {
          maxScrollDepth = scrollDepth
          if (scrollDepth >= 25 && scrollDepth < 50) {
            analyticsService.trackEvent('scroll_depth', { depth: 25 })
          } else if (scrollDepth >= 50 && scrollDepth < 75) {
            analyticsService.trackEvent('scroll_depth', { depth: 50 })
          } else if (scrollDepth >= 75 && scrollDepth < 100) {
            analyticsService.trackEvent('scroll_depth', { depth: 75 })
          } else if (scrollDepth >= 100) {
            analyticsService.trackEvent('scroll_depth', { depth: 100 })
          }
        }
      }

      let scrollTimeout: NodeJS.Timeout
      window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout)
        scrollTimeout = setTimeout(trackScrollDepth, 100)
      })

      // Track errors
      window.addEventListener('error', (event) => {
        analyticsService.trackEvent('javascript_error', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          timestamp: Date.now()
        })
      })

      // Track unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        analyticsService.trackEvent('promise_rejection', {
          reason: event.reason?.toString() || 'Unknown',
          timestamp: Date.now()
        })
      })
    }
  }, [isInitialized])

  const trackEvent = (eventType: string, eventData?: Record<string, any>, quizId?: string) => {
    if (isInitialized) {
      analyticsService.trackEvent(eventType as any, eventData, quizId)
    }
  }

  const trackQuizStart = (quizId: string) => {
    if (isInitialized) {
      analyticsService.trackEvent('quiz_start', {
        timestamp: Date.now(),
        user_id: user?.id
      }, quizId)

      // Track in Google Analytics if available
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'quiz_start', {
          quiz_id: quizId,
          user_id: user?.id
        })
      }

      // Track in Facebook Pixel if available
      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', 'InitiateCheckout', {
          content_ids: [quizId],
          content_type: 'quiz'
        })
      }
    }
  }

  const trackQuestionAnswered = (quizId: string, questionId: string, answer: any, timeSpent: number) => {
    if (isInitialized) {
      analyticsService.trackEvent('question_answered', {
        question_id: questionId,
        answer,
        time_spent: timeSpent,
        timestamp: Date.now(),
        user_id: user?.id
      }, quizId)
    }
  }

  const trackQuizCompleted = (quizId: string, totalTime: number, score?: number) => {
    if (isInitialized) {
      analyticsService.trackEvent('quiz_completed', {
        total_time: totalTime,
        score,
        timestamp: Date.now(),
        user_id: user?.id
      }, quizId)

      // Track conversion in Google Analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'conversion', {
          quiz_id: quizId,
          value: score || 1,
          currency: 'USD'
        })
      }

      // Track conversion in Facebook Pixel
      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', 'Purchase', {
          content_ids: [quizId],
          content_type: 'quiz',
          value: score || 1,
          currency: 'USD'
        })
      }
    }
  }

  const trackQuizAbandoned = (quizId: string, lastQuestionId: string, timeSpent: number) => {
    if (isInitialized) {
      analyticsService.trackEvent('quiz_abandoned', {
        last_question_id: lastQuestionId,
        time_spent: timeSpent,
        timestamp: Date.now(),
        user_id: user?.id
      }, quizId)
    }
  }

  const trackInteraction = (element: HTMLElement, quizId: string, questionId?: string) => {
    if (isInitialized) {
      analyticsService.trackInteraction(element, quizId, questionId)
    }
  }

  const trackPerformance = (metric: string, value: number, quizId?: string) => {
    if (isInitialized) {
      analyticsService.trackPerformance(metric, value, quizId)
    }
  }

  const value: AnalyticsContextType = {
    isInitialized,
    trackEvent,
    trackQuizStart,
    trackQuestionAnswered,
    trackQuizCompleted,
    trackQuizAbandoned,
    trackInteraction,
    trackPerformance
  }

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  )
}

export function useAnalyticsContext() {
  const context = useContext(AnalyticsContext)
  if (context === undefined) {
    throw new Error('useAnalyticsContext must be used within an AnalyticsProvider')
  }
  return context
}

// Higher-order component for automatic tracking
export function withAnalytics<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  eventType?: string
) {
  return function WithAnalyticsComponent(props: T) {
    const { trackEvent } = useAnalyticsContext()

    useEffect(() => {
      if (eventType) {
        trackEvent(eventType, {
          component_name: WrappedComponent.name,
          timestamp: Date.now()
        })
      }
    }, [trackEvent])

    return <WrappedComponent {...props} />
  }
}

// Hook for component-level analytics
export function useComponentAnalytics(componentName: string) {
  const { trackEvent, trackInteraction, trackPerformance } = useAnalyticsContext()

  const trackComponentEvent = (eventType: string, data?: Record<string, any>) => {
    trackEvent(eventType, {
      component_name: componentName,
      ...data,
      timestamp: Date.now()
    })
  }

  const trackComponentInteraction = (element: HTMLElement, interactionType: string, quizId?: string) => {
    trackEvent('quiz_start', {
      component_name: componentName,
      interaction_type: interactionType,
      element_tag: element.tagName,
      element_id: element.id,
      element_class: element.className,
      timestamp: Date.now()
    }, quizId)
  }

  const trackComponentPerformance = (metric: string, value: number) => {
    trackPerformance(`${componentName}_${metric}`, value)
  }

  return {
    trackComponentEvent,
    trackComponentInteraction,
    trackComponentPerformance
  }
}