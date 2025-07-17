import { Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/toaster'
import { AnalyticsProvider } from '@/contexts/AnalyticsContext'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import DashboardPage from '@/pages/DashboardPage'
import EditorPage from '@/pages/EditorPage'
import { AnalyticsPage } from '@/pages/AnalyticsPage'
import { MediaPage } from '@/pages/MediaPage'
import PlansPage from '@/pages/PlansPage'
import WebhookDashboard from '@/pages/WebhookDashboard'

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AnalyticsProvider>
        <div className="min-h-screen bg-background">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/editor" element={<EditorPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/media" element={<MediaPage />} />
            <Route path="/plans" element={<PlansPage />} />
            <Route path="/admin/webhooks" element={<WebhookDashboard />} />
            <Route path="/" element={<LoginPage />} />
          </Routes>
          <Toaster />
        </div>
      </AnalyticsProvider>
    </QueryClientProvider>
  )
}

export default App