import { Router } from 'express';
import {
  handleWebhook,
  getWebhookEvents,
  retryWebhookEvent,
} from '@/controllers/webhookController';
import { authenticateToken } from '@/middleware/auth';
import { webhookLimiter, apiLimiter } from '@/middleware/rateLimiter';

const router = Router();

// Public webhook endpoint
router.post('/', webhookLimiter, handleWebhook);

// Protected webhook management routes
router.use(authenticateToken);
router.use(apiLimiter);

router.get('/events', getWebhookEvents);
router.post('/events/:id/retry', retryWebhookEvent);

export default router;