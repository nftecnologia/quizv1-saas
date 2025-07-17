import { Request, Response } from 'express';
import { supabaseAdmin } from '@/config/database';
import { sendSuccess, sendError } from '@/utils/response';
import { validateRequest, webhookSchema } from '@/utils/validation';
import { asyncHandler } from '@/middleware/errorHandler';
import logger from '@/utils/logger';

export const handleWebhook = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const validation = validateRequest(webhookSchema, req.body);
  
  if (!validation.success) {
    return sendError(res, 'Validation failed', 400, validation.errors);
  }

  const { type, data, source } = validation.data!;

  try {
    // Store webhook event
    const { data: webhookEvent, error: webhookError } = await supabaseAdmin
      .from('webhook_events')
      .insert({
        type,
        data,
        source,
        processed: false,
      })
      .select()
      .single();

    if (webhookError) {
      logger.error('Store webhook event error:', webhookError);
      return sendError(res, webhookError.message, 400);
    }

    // Process webhook based on type
    let processResult = null;

    switch (type) {
      case 'lead.created':
        processResult = await processLeadCreated(data);
        break;
      case 'quiz.completed':
        processResult = await processQuizCompleted(data);
        break;
      case 'user.registered':
        processResult = await processUserRegistered(data);
        break;
      default:
        logger.warn('Unknown webhook type:', type);
        processResult = { success: false, error: 'Unknown webhook type' };
    }

    // Update webhook event as processed
    await supabaseAdmin
      .from('webhook_events')
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
        result: processResult,
      })
      .eq('id', webhookEvent.id);

    return sendSuccess(res, {
      eventId: webhookEvent.id,
      processed: true,
      result: processResult,
    }, 'Webhook processed successfully');
  } catch (error) {
    logger.error('Handle webhook error:', error);
    return sendError(res, 'Failed to process webhook', 500);
  }
});

const processLeadCreated = async (data: any) => {
  try {
    const { quiz_id, email, responses } = data;

    // Validate required fields
    if (!quiz_id || !responses) {
      return { success: false, error: 'Missing required fields' };
    }

    // Create lead in database
    const { data: lead, error } = await supabaseAdmin
      .from('leads')
      .insert({
        quiz_id,
        email,
        responses,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('Create lead from webhook error:', error);
      return { success: false, error: error.message };
    }

    logger.info('Lead created from webhook:', lead.id);
    return { success: true, leadId: lead.id };
  } catch (error) {
    logger.error('Process lead created error:', error);
    return { success: false, error: 'Failed to process lead creation' };
  }
};

const processQuizCompleted = async (data: any) => {
  try {
    const { quiz_id, completion_data } = data;

    // Update quiz analytics
    const { error } = await supabaseAdmin
      .from('quiz_analytics')
      .upsert({
        quiz_id,
        total_completions: completion_data.total_completions || 1,
        last_completed_at: new Date().toISOString(),
      });

    if (error) {
      logger.error('Update quiz analytics error:', error);
      return { success: false, error: error.message };
    }

    logger.info('Quiz completion processed:', quiz_id);
    return { success: true, quizId: quiz_id };
  } catch (error) {
    logger.error('Process quiz completed error:', error);
    return { success: false, error: 'Failed to process quiz completion' };
  }
};

const processUserRegistered = async (data: any) => {
  try {
    const { user_id, email, metadata } = data;

    // Create user profile
    const { error } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: user_id,
        email,
        full_name: metadata?.full_name,
        created_at: new Date().toISOString(),
      });

    if (error) {
      logger.error('Create user profile error:', error);
      return { success: false, error: error.message };
    }

    logger.info('User profile created from webhook:', user_id);
    return { success: true, userId: user_id };
  } catch (error) {
    logger.error('Process user registered error:', error);
    return { success: false, error: 'Failed to process user registration' };
  }
};

export const getWebhookEvents = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const { page = 1, limit = 50 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  try {
    const { data, error, count } = await supabaseAdmin
      .from('webhook_events')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (error) {
      logger.error('Get webhook events error:', error);
      return sendError(res, error.message, 400);
    }

    const totalPages = Math.ceil((count || 0) / Number(limit));

    return sendSuccess(res, {
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        pages: totalPages,
        hasNext: Number(page) < totalPages,
        hasPrev: Number(page) > 1,
      },
    }, 'Webhook events retrieved successfully');
  } catch (error) {
    logger.error('Get webhook events error:', error);
    return sendError(res, 'Failed to get webhook events', 500);
  }
});

export const retryWebhookEvent = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;

  try {
    const { data: event, error } = await supabaseAdmin
      .from('webhook_events')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !event) {
      return sendError(res, 'Webhook event not found', 404);
    }

    // Retry processing
    let processResult = null;

    switch (event.type) {
      case 'lead.created':
        processResult = await processLeadCreated(event.data);
        break;
      case 'quiz.completed':
        processResult = await processQuizCompleted(event.data);
        break;
      case 'user.registered':
        processResult = await processUserRegistered(event.data);
        break;
      default:
        processResult = { success: false, error: 'Unknown webhook type' };
    }

    // Update webhook event
    await supabaseAdmin
      .from('webhook_events')
      .update({
        processed: processResult.success,
        processed_at: new Date().toISOString(),
        result: processResult,
      })
      .eq('id', id);

    return sendSuccess(res, {
      eventId: id,
      processed: processResult.success,
      result: processResult,
    }, 'Webhook event retried successfully');
  } catch (error) {
    logger.error('Retry webhook event error:', error);
    return sendError(res, 'Failed to retry webhook event', 500);
  }
});