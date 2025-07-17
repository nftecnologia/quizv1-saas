// API Constants
export const API_VERSION = process.env.API_VERSION || 'v1';
export const API_PREFIX = `/api/${API_VERSION}`;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Forbidden access',
  NOT_FOUND: 'Resource not found',
  VALIDATION_FAILED: 'Validation failed',
  INTERNAL_ERROR: 'Internal server error',
  INVALID_TOKEN: 'Invalid or expired token',
  MISSING_TOKEN: 'Access token required',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
  QUIZ_NOT_FOUND: 'Quiz not found',
  LEAD_NOT_FOUND: 'Lead not found',
  QUIZ_NOT_PUBLISHED: 'Quiz is not published',
  INVALID_CREDENTIALS: 'Invalid credentials',
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  WEAK_PASSWORD: 'Password is too weak',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  REGISTRATION_SUCCESS: 'Registration successful',
  TOKEN_REFRESHED: 'Token refreshed successfully',
  QUIZ_PUBLISHED: 'Quiz published successfully',
  QUIZ_UNPUBLISHED: 'Quiz unpublished successfully',
  LEAD_CREATED: 'Lead created successfully',
  WEBHOOK_PROCESSED: 'Webhook processed successfully',
} as const;

// Redis Keys
export const REDIS_KEYS = {
  USER_SESSION: (userId: string) => `user:session:${userId}`,
  QUIZ_CACHE: (quizId: string) => `quiz:${quizId}`,
  LEAD_CACHE: (leadId: string) => `lead:${leadId}`,
  ANALYTICS_CACHE: (userId: string, period: string) => `analytics:${userId}:${period}`,
  RATE_LIMIT: (ip: string) => `rate_limit:${ip}`,
  WEBHOOK_EVENTS: 'webhook:events',
  ACTIVE_SESSIONS: 'active:sessions',
} as const;

// Cache TTL (in seconds)
export const CACHE_TTL = {
  SHORT: 300, // 5 minutes
  MEDIUM: 1800, // 30 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 24 hours
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  BUCKET_NAME: 'quiz-assets',
} as const;

// Quiz Constants
export const QUIZ = {
  QUESTION_TYPES: ['multiple_choice', 'single_choice', 'text', 'email', 'phone'] as const,
  MAX_QUESTIONS: 50,
  MAX_OPTIONS: 10,
  MAX_TITLE_LENGTH: 255,
  MAX_DESCRIPTION_LENGTH: 1000,
} as const;

// Webhook Events
export const WEBHOOK_EVENTS = {
  LEAD_CREATED: 'lead.created',
  QUIZ_COMPLETED: 'quiz.completed',
  USER_REGISTERED: 'user.registered',
  QUIZ_PUBLISHED: 'quiz.published',
  QUIZ_UNPUBLISHED: 'quiz.unpublished',
} as const;

// Rate Limits
export const RATE_LIMITS = {
  GENERAL: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX: 100,
  },
  AUTH: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX: 5,
  },
  API: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX: 1000,
  },
  WEBHOOK: {
    WINDOW_MS: 60 * 1000, // 1 minute
    MAX: 60,
  },
} as const;

// Environment
export const ENVIRONMENT = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test',
} as const;

// Log Levels
export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
} as const;