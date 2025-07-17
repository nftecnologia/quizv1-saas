import { Response } from 'express';
import { supabaseAdmin } from '@/config/database';
import { AuthenticatedRequest } from '@/types';
import { sendSuccess, sendError, sendNotFound } from '@/utils/response';
import { validateRequest, validatePaginationRequest, leadCreateSchema } from '@/utils/validation';
import { asyncHandler } from '@/middleware/errorHandler';
import logger from '@/utils/logger';

export const createLead = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const validation = validateRequest(leadCreateSchema, req.body);
  
  if (!validation.success) {
    return sendError(res, 'Validation failed', 400, validation.errors);
  }

  const { quiz_id, email, phone, responses, score, tags } = validation.data!;

  try {
    // Verify quiz exists and is published
    const { data: quiz, error: quizError } = await supabaseAdmin
      .from('quizzes')
      .select('id, is_published')
      .eq('id', quiz_id)
      .single();

    if (quizError || !quiz || !quiz.is_published) {
      return sendNotFound(res, 'Quiz not found or not published');
    }

    const { data, error } = await supabaseAdmin
      .from('leads')
      .insert({
        quiz_id,
        email,
        phone,
        responses,
        score,
        tags,
      })
      .select()
      .single();

    if (error) {
      logger.error('Create lead error:', error);
      return sendError(res, error.message, 400);
    }

    return sendSuccess(res, data, 'Lead created successfully', 201);
  } catch (error) {
    logger.error('Create lead error:', error);
    return sendError(res, 'Failed to create lead', 500);
  }
});

export const getLeads = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const validation = validatePaginationRequest(req.query);
  
  if (!validation.success) {
    return sendError(res, 'Validation failed', 400, validation.errors);
  }

  const { page, limit, sort, order } = validation.data!;
  const userId = req.user!.id;
  const offset = (page - 1) * limit;

  try {
    let query = supabaseAdmin
      .from('leads')
      .select(`
        *,
        quiz:quizzes!inner(
          id,
          title,
          user_id
        )
      `, { count: 'exact' })
      .eq('quiz.user_id', userId)
      .range(offset, offset + limit - 1);

    if (sort) {
      query = query.order(sort, { ascending: order === 'asc' });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error, count } = await query;

    if (error) {
      logger.error('Get leads error:', error);
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
    }, 'Leads retrieved successfully');
  } catch (error) {
    logger.error('Get leads error:', error);
    return sendError(res, 'Failed to get leads', 500);
  }
});

export const getLeadById = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const { id } = req.params;
  const userId = req.user!.id;

  try {
    const { data, error } = await supabaseAdmin
      .from('leads')
      .select(`
        *,
        quiz:quizzes!inner(
          id,
          title,
          user_id
        )
      `)
      .eq('id', id)
      .eq('quiz.user_id', userId)
      .single();

    if (error || !data) {
      return sendNotFound(res, 'Lead not found');
    }

    return sendSuccess(res, data, 'Lead retrieved successfully');
  } catch (error) {
    logger.error('Get lead by ID error:', error);
    return sendError(res, 'Failed to get lead', 500);
  }
});

export const getLeadsByQuiz = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const { quizId } = req.params;
  const userId = req.user!.id;
  
  const validation = validatePaginationRequest(req.query);
  
  if (!validation.success) {
    return sendError(res, 'Validation failed', 400, validation.errors);
  }

  const { page, limit, sort, order } = validation.data!;
  const offset = (page - 1) * limit;

  try {
    // Verify quiz belongs to user
    const { data: quiz, error: quizError } = await supabaseAdmin
      .from('quizzes')
      .select('id')
      .eq('id', quizId)
      .eq('user_id', userId)
      .single();

    if (quizError || !quiz) {
      return sendNotFound(res, 'Quiz not found');
    }

    let query = supabaseAdmin
      .from('leads')
      .select('*', { count: 'exact' })
      .eq('quiz_id', quizId)
      .range(offset, offset + limit - 1);

    if (sort) {
      query = query.order(sort, { ascending: order === 'asc' });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error, count } = await query;

    if (error) {
      logger.error('Get leads by quiz error:', error);
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
    }, 'Leads retrieved successfully');
  } catch (error) {
    logger.error('Get leads by quiz error:', error);
    return sendError(res, 'Failed to get leads', 500);
  }
});

export const updateLead = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const { id } = req.params;
  const userId = req.user!.id;
  const { tags, notes } = req.body;

  try {
    const { data, error } = await supabaseAdmin
      .from('leads')
      .update({
        tags,
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('quiz.user_id', userId)
      .select(`
        *,
        quiz:quizzes!inner(
          id,
          title,
          user_id
        )
      `)
      .single();

    if (error || !data) {
      return sendNotFound(res, 'Lead not found');
    }

    return sendSuccess(res, data, 'Lead updated successfully');
  } catch (error) {
    logger.error('Update lead error:', error);
    return sendError(res, 'Failed to update lead', 500);
  }
});

export const deleteLead = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const { id } = req.params;
  const userId = req.user!.id;

  try {
    const { error } = await supabaseAdmin
      .from('leads')
      .delete()
      .eq('id', id)
      .eq('quiz.user_id', userId);

    if (error) {
      logger.error('Delete lead error:', error);
      return sendError(res, error.message, 400);
    }

    return sendSuccess(res, null, 'Lead deleted successfully');
  } catch (error) {
    logger.error('Delete lead error:', error);
    return sendError(res, 'Failed to delete lead', 500);
  }
});