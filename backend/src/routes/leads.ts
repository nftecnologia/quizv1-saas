import { Router } from 'express';
import {
  createLead,
  getLeads,
  getLeadById,
  getLeadsByQuiz,
  updateLead,
  deleteLead,
} from '@/controllers/leadController';
import { authenticateToken, optionalAuth } from '@/middleware/auth';
import { apiLimiter, generalLimiter } from '@/middleware/rateLimiter';

const router = Router();

// Public route for lead creation (from quiz submissions)
router.post('/', generalLimiter, createLead);

// Protected routes
router.use(authenticateToken);
router.use(apiLimiter);

router.get('/', getLeads);
router.get('/:id', getLeadById);
router.get('/quiz/:quizId', getLeadsByQuiz);
router.put('/:id', updateLead);
router.delete('/:id', deleteLead);

export default router;