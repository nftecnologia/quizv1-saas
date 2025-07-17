export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Quiz {
  id: string
  title: string
  description?: string
  user_id: string
  is_public: boolean
  created_at: string
  updated_at: string
  questions: Question[]
}

export interface Question {
  id: string
  quiz_id: string
  type: 'multiple_choice' | 'true_false' | 'open_text'
  title: string
  description?: string
  required: boolean
  order: number
  options: QuestionOption[]
  created_at: string
  updated_at: string
}

export interface QuestionOption {
  id: string
  question_id: string
  text: string
  is_correct: boolean
  order: number
  created_at: string
  updated_at: string
}

export interface QuizResponse {
  id: string
  quiz_id: string
  user_id?: string
  anonymous_id?: string
  answers: QuestionAnswer[]
  score?: number
  completed_at: string
  created_at: string
}

export interface QuestionAnswer {
  id: string
  response_id: string
  question_id: string
  selected_option_id?: string
  text_answer?: string
  created_at: string
}

// Re-export subscription types
export * from './subscription'