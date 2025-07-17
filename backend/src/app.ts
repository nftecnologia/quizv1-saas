import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import configurations
import { initSentry, sentryErrorHandler } from '@/config/sentry';
import logger from '@/utils/logger';

// Import middlewares
import { errorHandler, notFoundHandler } from '@/middleware/errorHandler';
import { generalLimiter } from '@/middleware/rateLimiter';

// Import routes
import apiRoutes from '@/routes';

// Create Express app
const app = express();

// Initialize Sentry (must be before other middleware)
initSentry(app);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.sentry.io"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message: string) => {
      logger.info(message.trim());
    },
  },
}));

// Rate limiting
app.use(generalLimiter);

// API routes
app.use(`/api/${process.env.API_VERSION || 'v1'}`, apiRoutes);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    message: 'Quiz Backend API',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// Sentry error handler (must be before other error handlers)
app.use(sentryErrorHandler);

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

export default app;