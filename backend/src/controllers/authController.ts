import { Request, Response } from 'express';
import { supabase } from '@/config/database';
import { sendSuccess, sendError } from '@/utils/response';
import { validateRequest, userRegistrationSchema, userLoginSchema } from '@/utils/validation';
import { asyncHandler } from '@/middleware/errorHandler';
import logger from '@/utils/logger';

export const register = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const validation = validateRequest(userRegistrationSchema, req.body);
  
  if (!validation.success) {
    return sendError(res, 'Validation failed', 400, validation.errors);
  }

  const { email, password, full_name } = validation.data!;

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
        },
      },
    });

    if (error) {
      logger.error('Registration error:', error);
      return sendError(res, error.message, 400);
    }

    return sendSuccess(res, {
      user: data.user,
      message: 'Registration successful. Please check your email for verification.',
    }, 'User registered successfully', 201);
  } catch (error) {
    logger.error('Registration error:', error);
    return sendError(res, 'Registration failed', 500);
  }
});

export const login = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const validation = validateRequest(userLoginSchema, req.body);
  
  if (!validation.success) {
    return sendError(res, 'Validation failed', 400, validation.errors);
  }

  const { email, password } = validation.data!;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logger.error('Login error:', error);
      return sendError(res, error.message, 401);
    }

    return sendSuccess(res, {
      user: data.user,
      session: data.session,
    }, 'Login successful');
  } catch (error) {
    logger.error('Login error:', error);
    return sendError(res, 'Login failed', 500);
  }
});

export const logout = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      logger.error('Logout error:', error);
      return sendError(res, error.message, 400);
    }

    return sendSuccess(res, null, 'Logout successful');
  } catch (error) {
    logger.error('Logout error:', error);
    return sendError(res, 'Logout failed', 500);
  }
});

export const refreshToken = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    return sendError(res, 'Refresh token required', 400);
  }

  try {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token,
    });

    if (error) {
      logger.error('Token refresh error:', error);
      return sendError(res, error.message, 401);
    }

    return sendSuccess(res, {
      session: data.session,
    }, 'Token refreshed successfully');
  } catch (error) {
    logger.error('Token refresh error:', error);
    return sendError(res, 'Token refresh failed', 500);
  }
});

export const getProfile = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return sendError(res, 'Access token required', 401);
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return sendError(res, 'Invalid token', 401);
    }

    return sendSuccess(res, {
      user: data.user,
    }, 'Profile retrieved successfully');
  } catch (error) {
    logger.error('Get profile error:', error);
    return sendError(res, 'Failed to get profile', 500);
  }
});