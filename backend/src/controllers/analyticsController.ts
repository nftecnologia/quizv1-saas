import { Response } from 'express';
import { supabaseAdmin } from '@/config/database';
import { AuthenticatedRequest } from '@/types';
import { sendSuccess, sendError, sendNotFound } from '@/utils/response';
import { asyncHandler } from '@/middleware/errorHandler';
import logger from '@/utils/logger';

export const getDashboardMetrics = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const userId = req.user!.id;

  try {
    // Get user's quiz IDs first
    const { data: userQuizzes, error: userQuizzesError } = await supabaseAdmin
      .from('funnels')
      .select('id')
      .eq('user_id', userId);

    if (userQuizzesError) {
      logger.error('Get user quizzes error:', userQuizzesError);
      return sendError(res, userQuizzesError.message, 400);
    }

    const quizIds = userQuizzes?.map(q => q.id) || [];

    // Get total quizzes
    const { count: totalQuizzes, error: quizzesError } = await supabaseAdmin
      .from('funnels')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (quizzesError) {
      logger.error('Get quizzes count error:', quizzesError);
      return sendError(res, quizzesError.message, 400);
    }

    // Get total leads
    const { count: totalLeads, error: leadsError } = await supabaseAdmin
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .in('funnel_id', quizIds);

    if (leadsError) {
      logger.error('Get leads count error:', leadsError);
      return sendError(res, leadsError.message, 400);
    }

    // Get published quizzes
    const { count: publishedQuizzes, error: publishedError } = await supabaseAdmin
      .from('funnels')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('published', true);

    if (publishedError) {
      logger.error('Get published quizzes count error:', publishedError);
      return sendError(res, publishedError.message, 400);
    }

    // Get recent leads (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: recentLeads, error: recentError } = await supabaseAdmin
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .in('funnel_id', quizIds)
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (recentError) {
      logger.error('Get recent leads count error:', recentError);
      return sendError(res, recentError.message, 400);
    }

    return sendSuccess(res, {
      totalQuizzes: totalQuizzes || 0,
      totalLeads: totalLeads || 0,
      publishedQuizzes: publishedQuizzes || 0,
      recentLeads: recentLeads || 0,
    }, 'Dashboard metrics retrieved successfully');
  } catch (error) {
    logger.error('Get dashboard metrics error:', error);
    return sendError(res, 'Failed to get dashboard metrics', 500);
  }
});

export const getQuizAnalytics = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const { quizId } = req.params;
  const userId = req.user!.id;

  try {
    // Verify quiz belongs to user
    const { data: quiz, error: quizError } = await supabaseAdmin
      .from('funnels')
      .select('id, title, created_at')
      .eq('id', quizId)
      .eq('user_id', userId)
      .single();

    if (quizError || !quiz) {
      return sendNotFound(res, 'Quiz not found');
    }

    // Get total leads for this quiz
    const { count: totalLeads, error: leadsError } = await supabaseAdmin
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('funnel_id', quizId);

    if (leadsError) {
      logger.error('Get quiz leads count error:', leadsError);
      return sendError(res, leadsError.message, 400);
    }

    // Get leads by day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: leadsData, error: leadsDataError } = await supabaseAdmin
      .from('leads')
      .select('created_at, score')
      .eq('funnel_id', quizId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    if (leadsDataError) {
      logger.error('Get quiz leads data error:', leadsDataError);
      return sendError(res, leadsDataError.message, 400);
    }

    // Process leads by day
    const leadsByDay = leadsData?.reduce((acc: Record<string, number>, lead) => {
      const date = new Date(lead.created_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {}) || {};

    // Calculate average score
    const scoresData = leadsData?.filter(lead => lead.score !== null) || [];
    const averageScore = scoresData.length > 0 
      ? scoresData.reduce((sum, lead) => sum + (lead.score || 0), 0) / scoresData.length
      : 0;

    // Get completion rate (assuming views are tracked separately)
    // For now, we'll use a placeholder calculation
    const completionRate = totalLeads && totalLeads > 0 ? 85 : 0; // Placeholder

    return sendSuccess(res, {
      quiz: {
        id: quiz.id,
        title: quiz.title,
        created_at: quiz.created_at,
      },
      totalLeads: totalLeads || 0,
      averageScore: Math.round(averageScore * 100) / 100,
      completionRate,
      leadsByDay,
      dateRange: {
        start: thirtyDaysAgo.toISOString(),
        end: new Date().toISOString(),
      },
    }, 'Quiz analytics retrieved successfully');
  } catch (error) {
    logger.error('Get quiz analytics error:', error);
    return sendError(res, 'Failed to get quiz analytics', 500);
  }
});

export const getLeadAnalytics = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const userId = req.user!.id;
  const { period = '30d' } = req.query as { period?: string };

  try {
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Get leads data
    const { data: leadsData, error: leadsError } = await supabaseAdmin
      .from('leads')
      .select(`
        created_at,
        email,
        score,
        quiz:funnels!inner(
          id,
          title,
          user_id
        )
      `)
      .eq('quiz.user_id', userId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });

    if (leadsError) {
      logger.error('Get leads analytics error:', leadsError);
      return sendError(res, leadsError.message, 400);
    }

    // Process analytics data
    const totalLeads = leadsData?.length || 0;
    const leadsWithEmail = leadsData?.filter(lead => lead.email) || [];
    const emailCaptureRate = totalLeads > 0 ? (leadsWithEmail.length / totalLeads) * 100 : 0;

    // Group by quiz
    const leadsByQuiz = leadsData?.reduce((acc: Record<string, any>, lead) => {
      const quizTitle = (lead.quiz as any).title;
      if (!acc[quizTitle]) {
        acc[quizTitle] = { count: 0, scores: [] };
      }
      acc[quizTitle].count++;
      if (lead.score !== null) {
        acc[quizTitle].scores.push(lead.score);
      }
      return acc;
    }, {}) || {};

    // Group by day
    const leadsByDay = leadsData?.reduce((acc: Record<string, number>, lead) => {
      const date = new Date(lead.created_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {}) || {};

    return sendSuccess(res, {
      totalLeads,
      emailCaptureRate: Math.round(emailCaptureRate * 100) / 100,
      leadsByQuiz,
      leadsByDay,
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    }, 'Lead analytics retrieved successfully');
  } catch (error) {
    logger.error('Get lead analytics error:', error);
    return sendError(res, 'Failed to get lead analytics', 500);
  }
});