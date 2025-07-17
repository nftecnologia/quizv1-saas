import { Router } from 'express';
import { sendSuccess } from '@/utils/response';
import { testConnections } from '@/config/database';

// Import route modules
import authRoutes from './auth';
import funnelRoutes from './funnels';
import leadRoutes from './leads';
import analyticsRoutes from './analytics';
import webhookRoutes from './webhooks';

const router = Router();

// Health check endpoint
router.get('/health', async (_req, res) => {
  try {
    const dbConnected = await testConnections();
    
    sendSuccess(res, {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: dbConnected ? 'connected' : 'disconnected',
    }, 'Service is healthy');
  } catch (error) {
    sendSuccess(res, {
      status: 'error',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: 'disconnected',
    }, 'Service has issues', 503);
  }
});

// API routes
router.use('/auth', authRoutes);
router.use('/funnels', funnelRoutes);
router.use('/leads', leadRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/webhooks', webhookRoutes);

export default router;