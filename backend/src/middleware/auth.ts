import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '@/config/database';
import { AuthenticatedRequest } from '@/types';
import { sendUnauthorized } from '@/utils/response';
import logger from '@/utils/logger';

interface JwtPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      sendUnauthorized(res, 'Access token required');
      return;
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    
    // Get user from Supabase
    const { data: user, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      logger.error('Token verification failed:', error);
      sendUnauthorized(res, 'Invalid token');
      return;
    }

    req.user = user.user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    sendUnauthorized(res, 'Invalid token');
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const { data: user, error } = await supabase.auth.getUser(token);
      
      if (!error && user) {
        req.user = user.user;
      }
    }

    next();
  } catch (error) {
    logger.error('Optional auth error:', error);
    next();
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendUnauthorized(res, 'Authentication required');
      return;
    }

    // Check if user has required role
    const userRole = req.user.user_metadata?.role || 'user';
    
    if (!roles.includes(userRole)) {
      sendUnauthorized(res, 'Insufficient permissions');
      return;
    }

    next();
  };
};