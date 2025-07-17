import { Response } from 'express';
import { ApiResponse } from '@/types';

export const sendSuccess = <T>(
  res: Response,
  data?: T,
  message?: string,
  statusCode: number = 200
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  error: string,
  statusCode: number = 500,
  details?: any
): Response => {
  const response: ApiResponse = {
    success: false,
    error,
    timestamp: new Date().toISOString(),
  };

  if (details) {
    response.data = details;
  }

  return res.status(statusCode).json(response);
};

export const sendValidationError = (
  res: Response,
  errors: any[],
  message: string = 'Validation failed'
): Response => {
  return sendError(res, message, 400, { errors });
};

export const sendNotFound = (
  res: Response,
  message: string = 'Resource not found'
): Response => {
  return sendError(res, message, 404);
};

export const sendUnauthorized = (
  res: Response,
  message: string = 'Unauthorized'
): Response => {
  return sendError(res, message, 401);
};

export const sendForbidden = (
  res: Response,
  message: string = 'Forbidden'
): Response => {
  return sendError(res, message, 403);
};