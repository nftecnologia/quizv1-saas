import { Router } from 'express';
import {
  createFunnel,
  getFunnels,
  getFunnelById,
  updateFunnel,
  deleteFunnel,
  publishFunnel,
  unpublishFunnel,
} from '@/controllers/funnelController';
import { authenticateToken } from '@/middleware/auth';
import { apiLimiter } from '@/middleware/rateLimiter';

const router = Router();

// All routes require authentication
router.use(authenticateToken);
router.use(apiLimiter);

// Funnel CRUD routes
router.post('/', createFunnel);
router.get('/', getFunnels);
router.get('/:id', getFunnelById);
router.put('/:id', updateFunnel);
router.delete('/:id', deleteFunnel);

// Funnel publishing routes
router.post('/:id/publish', publishFunnel);
router.post('/:id/unpublish', unpublishFunnel);

export default router;