import { Response } from 'express';
import { supabaseAdmin } from '@/config/database';
import { AuthenticatedRequest } from '@/types';
import { sendSuccess, sendError, sendNotFound } from '@/utils/response';
import { validateRequest, validatePaginationRequest, quizCreateSchema, quizUpdateSchema } from '@/utils/validation';
import { asyncHandler } from '@/middleware/errorHandler';
import logger from '@/utils/logger';

export const createFunnel = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const validation = validateRequest(quizCreateSchema, req.body);
  
  if (!validation.success) {
    return sendError(res, 'Validation failed', 400, validation.errors);
  }

  const { title, description, is_published } = validation.data!;
  const userId = req.user!.id;

  try {
    const { data, error } = await supabaseAdmin
      .from('quizzes')
      .insert({
        title,
        description,
        is_published,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      logger.error('Create funnel error:', error);
      return sendError(res, error.message, 400);
    }

    return sendSuccess(res, data, 'Funnel created successfully', 201);
  } catch (error) {
    logger.error('Create funnel error:', error);
    return sendError(res, 'Failed to create funnel', 500);
  }
});

export const getFunnels = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const validation = validatePaginationRequest(req.query);
  
  if (!validation.success) {
    return sendError(res, 'Validation failed', 400, validation.errors);
  }

  const { page, limit, sort, order } = validation.data!;
  const userId = req.user!.id;
  const offset = (page - 1) * limit;

  try {
    let query = supabaseAdmin
      .from('quizzes')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .range(offset, offset + limit - 1);

    if (sort) {
      query = query.order(sort, { ascending: order === 'asc' });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error, count } = await query;

    if (error) {
      logger.error('Get funnels error:', error);
      return sendError(res, error.message, 400);
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return sendSuccess(res, {
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    }, 'Funnels retrieved successfully');
  } catch (error) {
    logger.error('Get funnels error:', error);
    return sendError(res, 'Failed to get funnels', 500);
  }
});

export const getFunnelById = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const { id } = req.params;
  const userId = req.user!.id;

  try {
    const { data, error } = await supabaseAdmin
      .from('quizzes')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return sendNotFound(res, 'Funnel not found');
    }

    return sendSuccess(res, data, 'Funnel retrieved successfully');
  } catch (error) {
    logger.error('Get funnel by ID error:', error);
    return sendError(res, 'Failed to get funnel', 500);
  }
});

export const updateFunnel = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const { id } = req.params;
  const userId = req.user!.id;
  
  const validation = validateRequest(quizUpdateSchema, req.body);
  
  if (!validation.success) {
    return sendError(res, 'Validation failed', 400, validation.errors);
  }

  const updateData = validation.data!;

  try {
    const { data, error } = await supabaseAdmin
      .from('quizzes')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) {
      return sendNotFound(res, 'Funnel not found');
    }

    return sendSuccess(res, data, 'Funnel updated successfully');
  } catch (error) {
    logger.error('Update funnel error:', error);
    return sendError(res, 'Failed to update funnel', 500);
  }
});

export const deleteFunnel = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const { id } = req.params;
  const userId = req.user!.id;

  try {
    const { error } = await supabaseAdmin
      .from('quizzes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      logger.error('Delete funnel error:', error);
      return sendError(res, error.message, 400);
    }

    return sendSuccess(res, null, 'Funnel deleted successfully');
  } catch (error) {
    logger.error('Delete funnel error:', error);
    return sendError(res, 'Failed to delete funnel', 500);
  }
});

export const publishFunnel = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const { id } = req.params;
  const userId = req.user!.id;

  try {
    const { data, error } = await supabaseAdmin
      .from('quizzes')
      .update({ 
        is_published: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) {
      return sendNotFound(res, 'Funnel not found');
    }

    return sendSuccess(res, data, 'Funnel published successfully');
  } catch (error) {
    logger.error('Publish funnel error:', error);
    return sendError(res, 'Failed to publish funnel', 500);
  }
});

export const unpublishFunnel = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const { id } = req.params;
  const userId = req.user!.id;

  try {
    const { data, error } = await supabaseAdmin
      .from('quizzes')
      .update({ 
        is_published: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) {
      return sendNotFound(res, 'Funnel not found');
    }

    return sendSuccess(res, data, 'Funnel unpublished successfully');
  } catch (error) {
    logger.error('Unpublish funnel error:', error);
    return sendError(res, 'Failed to unpublish funnel', 500);
  }
});