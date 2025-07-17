import { Router } from 'express';
import { 
  register, 
  login, 
  logout, 
  refreshToken, 
  getProfile 
} from '@/controllers/authController';
import { authenticateToken } from '@/middleware/auth';
import { authLimiter } from '@/middleware/rateLimiter';

const router = Router();

// Public routes
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh', authLimiter, refreshToken);

// Protected routes
router.post('/logout', authenticateToken, logout);
router.get('/profile', authenticateToken, getProfile);

export default router;