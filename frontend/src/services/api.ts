import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth service
export const authService = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) throw error
    return data
  },

  async signUp(email: string, password: string, name: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    })
    
    if (error) throw error
    return data
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },
}

// Quiz service
export const quizService = {
  async getQuizzes(userId: string) {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async getQuiz(id: string) {
    const { data, error } = await supabase
      .from('quizzes')
      .select(`
        *,
        questions:questions(
          *,
          options:question_options(*)
        )
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async createQuiz(quiz: any) {
    const { data, error } = await supabase
      .from('quizzes')
      .insert(quiz)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateQuiz(id: string, quiz: any) {
    const { data, error } = await supabase
      .from('quizzes')
      .update(quiz)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async deleteQuiz(id: string) {
    const { error } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },
}