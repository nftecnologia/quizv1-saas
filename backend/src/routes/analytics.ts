import { Router } from 'express';
import {
  getDashboardMetrics,
  getQuizAnalytics,
  getLeadAnalytics,
} from '@/controllers/analyticsController';
import { authenticateToken } from '@/middleware/auth';
import { apiLimiter } from '@/middleware/rateLimiter';

const router = Router();

// All routes require authentication
router.use(authenticateToken);
router.use(apiLimiter);

// Analytics routes
router.get('/dashboard', getDashboardMetrics);
router.get('/quiz/:quizId', getQuizAnalytics);
router.get('/leads', getLeadAnalytics);

export default router;