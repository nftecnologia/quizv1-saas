import { Request, Response, NextFunction } from 'express';
import { sendError } from '@/utils/response';
import logger from '@/utils/logger';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
    headers: req.headers,
  });

  // Handle specific error types
  if (error.name === 'ValidationError') {
    sendError(res, 'Validation failed', 400, { details: error.message });
    return;
  }

  if (error.name === 'UnauthorizedError') {
    sendError(res, 'Unauthorized', 401);
    return;
  }

  if (error.name === 'ForbiddenError') {
    sendError(res, 'Forbidden', 403);
    return;
  }

  if (error.name === 'NotFoundError') {
    sendError(res, 'Resource not found', 404);
    return;
  }

  // Handle Supabase errors
  if (error.message.includes('duplicate key value')) {
    sendError(res, 'Resource already exists', 409);
    return;
  }

  // Default error response
  const isDevelopment = process.env.NODE_ENV === 'development';
  const errorMessage = isDevelopment ? error.message : 'Internal server error';
  const errorDetails = isDevelopment ? { stack: error.stack } : undefined;

  sendError(res, errorMessage, 500, errorDetails);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  sendError(res, `Route ${req.originalUrl} not found`, 404);
};

export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<Response>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};