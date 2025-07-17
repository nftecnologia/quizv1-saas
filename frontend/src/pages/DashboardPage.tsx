import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, User, LogOut, Edit, Trash2, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { usePlan } from '@/hooks/usePlan'
import { usePlanGuard } from '@/middleware/planMiddleware'
import PlanLimitNotification from '@/components/plan/PlanLimitNotification'
import { Quiz } from '@/types'

export default function DashboardPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  
  const { user, signOut } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const { getPlanInfo, notifications } = usePlan()
  const planGuard = usePlanGuard()

  const planInfo = getPlanInfo()
  const hasUnseenNotifications = notifications.some(n => !n.seen)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    // Simular carregamento de quizzes
    const mockQuizzes: Quiz[] = [
      {
        id: '1',
        title: 'Quiz de JavaScript',
        description: 'Teste seus conhecimentos em JavaScript',
        user_id: user.id,
        is_public: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        questions: []
      },
      {
        id: '2',
        title: 'Quiz de React',
        description: 'Perguntas sobre React e hooks',
        user_id: user.id,
        is_public: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        questions: []
      }
    ]

    setTimeout(() => {
      setQuizzes(mockQuizzes)
      setLoading(false)
    }, 1000)
  }, [user, navigate])

  const handleCreateQuiz = async () => {
    if (!user) return

    const canCreate = await planGuard.checkFunnel(user.id)
    if (!canCreate.allowed) {
      toast({
        title: "Cannot Create Quiz",
        description: canCreate.message,
        variant: "destructive"
      })
      return
    }

    navigate('/editor')
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      toast({
        title: "Erro ao sair",
        description: "Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const filteredQuizzes = quizzes.filter(quiz =>
    quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quiz.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Quiz App</h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* Plan Info */}
              {planInfo && (
                <div className="flex items-center space-x-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm text-gray-700 capitalize">
                    {planInfo.type} Plan
                  </span>
                </div>
              )}

              {/* Notifications Badge */}
              {hasUnseenNotifications && (
                <PlanLimitNotification showInHeader={true} />
              )}

              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-700">{user?.email}</span>
              </div>

              <Button variant="outline" size="sm" asChild>
                <Link to="/plans">Plans</Link>
              </Button>

              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Plan Notifications */}
        {hasUnseenNotifications && (
          <div className="mb-6">
            <PlanLimitNotification />
          </div>
        )}

        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Meus Quizzes</h2>
            <Button onClick={handleCreateQuiz}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Quiz
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar quizzes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Quizzes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map((quiz) => (
            <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{quiz.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {quiz.description}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/editor?id=${quiz.id}`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>{quiz.is_public ? 'Público' : 'Privado'}</span>
                  <span>
                    {new Date(quiz.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredQuizzes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">
              {searchTerm ? 'Nenhum quiz encontrado' : 'Você ainda não criou nenhum quiz'}
            </p>
            <Button onClick={handleCreateQuiz}>
              <Plus className="h-4 w-4 mr-2" />
              Criar seu primeiro quiz
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}