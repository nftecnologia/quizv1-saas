import { z } from 'zod';

// User validation schemas
export const userRegistrationSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().optional(),
});

export const userLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// Quiz validation schemas
export const quizCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  is_published: z.boolean().default(false),
});

export const quizUpdateSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  is_published: z.boolean().optional(),
});

// Question validation schemas
export const questionCreateSchema = z.object({
  quiz_id: z.string().uuid('Invalid quiz ID'),
  title: z.string().min(1, 'Title is required'),
  type: z.enum(['multiple_choice', 'single_choice', 'text', 'email', 'phone']),
  options: z.array(z.string()).optional(),
  is_required: z.boolean().default(true),
  order: z.number().int().min(0),
});

export const questionUpdateSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  type: z.enum(['multiple_choice', 'single_choice', 'text', 'email', 'phone']).optional(),
  options: z.array(z.string()).optional(),
  is_required: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});

// Lead validation schemas
export const leadCreateSchema = z.object({
  quiz_id: z.string().uuid('Invalid quiz ID'),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().optional(),
  responses: z.record(z.any()),
  score: z.number().optional(),
  tags: z.array(z.string()).optional(),
});

// Pagination validation schema
export const paginationSchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1),
  limit: z.string().transform(val => Math.min(parseInt(val) || 10, 100)),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

// Webhook validation schema
export const webhookSchema = z.object({
  type: z.string(),
  data: z.record(z.any()),
  source: z.string(),
});

// Validation helper function
export const validateRequest = <T>(schema: z.ZodSchema<T>, data: any): { success: boolean; data?: T; errors?: any[] } => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.errors };
    }
    return { success: false, errors: [{ message: 'Validation failed' }] };
  }
};

// Specialized validation for pagination
export const validatePaginationRequest = (data: any): { success: boolean; data?: any; errors?: any[] } => {
  try {
    const validatedData = paginationSchema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.errors };
    }
    return { success: false, errors: [{ message: 'Validation failed' }] };
  }
};