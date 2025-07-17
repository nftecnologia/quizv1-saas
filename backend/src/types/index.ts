import { Request } from 'express';
import { User } from '@supabase/supabase-js';

// Use the standard Express Request type with user property
export type AuthenticatedRequest = Request & {
  user?: User;
};

// Export User type for convenience
export { User };

// Ensure all Request properties are properly typed
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

// User types
export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
  updated_at: string;
}

// Quiz/Funnel types
export interface Quiz {
  id: string;
  title: string;
  description?: string;
  is_published: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  quiz_id: string;
  title: string;
  type: 'multiple_choice' | 'single_choice' | 'text' | 'email' | 'phone';
  options?: string[];
  is_required: boolean;
  order: number;
  created_at: string;
  updated_at: string;
}

// Lead types
export interface Lead {
  id: string;
  quiz_id: string;
  email?: string;
  phone?: string;
  responses: Record<string, any>;
  score?: number;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

// Analytics types
export interface QuizAnalytics {
  quiz_id: string;
  total_views: number;
  total_completions: number;
  completion_rate: number;
  average_score: number;
  conversion_rate: number;
  period_start: string;
  period_end: string;
}

// Webhook types
export interface WebhookEvent {
  id: string;
  type: string;
  data: Record<string, any>;
  source: string;
  processed: boolean;
  created_at: string;
}

// Error types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}