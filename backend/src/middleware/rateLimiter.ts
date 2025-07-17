import rateLimit from 'express-rate-limit';

// Create rate limiter with default memory store (simplified for dev)
const createRateLimiter = (windowMs: number, max: number, message?: string) => {
  return rateLimit({
    windowMs,
    max,
    message: message || 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// General rate limiter
export const generalLimiter = createRateLimiter(
  parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  parseInt(process.env.RATE_LIMIT_MAX || '100')
);

// Strict rate limiter for auth endpoints
export const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts
  'Too many authentication attempts, please try again later'
);

// API rate limiter for authenticated routes
export const apiLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  1000, // 1000 requests per 15 minutes
  'API rate limit exceeded'
);

// Webhook rate limiter
export const webhookLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  60, // 60 requests per minute
  'Webhook rate limit exceeded'
);