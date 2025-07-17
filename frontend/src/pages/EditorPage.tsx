import React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { VisualEditor } from '../components/editor/VisualEditor'

export default function EditorPage() {
  const [searchParams] = useSearchParams()
  const quizId = searchParams.get('id')
  
  const { user } = useAuth()
  const navigate = useNavigate()

  React.useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
  }, [user, navigate])

  if (!user) {
    return null
  }

  return (
    <VisualEditor 
      quizId={quizId || undefined}
      className="w-full h-screen"
    />
  )
}