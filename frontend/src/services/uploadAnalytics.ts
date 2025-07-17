import { supabase } from '../lib/supabase';
import { MediaFile } from '../types/upload';

interface UploadAnalyticsEvent {
  event_type: 'upload_started' | 'upload_completed' | 'upload_failed' | 'file_deleted' | 'file_viewed';
  file_id?: string;
  file_type?: string;
  file_size?: number;
  bucket?: string;
  folder?: string;
  compression_ratio?: number;
  upload_duration?: number;
  error_message?: string;
  metadata?: Record<string, any>;
}

class UploadAnalyticsService {
  private async trackEvent(event: UploadAnalyticsEvent) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const eventData = {
        user_id: user.id,
        event_type: 'media_upload',
        event_action: event.event_type,
        event_data: {
          file_id: event.file_id,
          file_type: event.file_type,
          file_size: event.file_size,
          bucket: event.bucket,
          folder: event.folder,
          compression_ratio: event.compression_ratio,
          upload_duration: event.upload_duration,
          error_message: event.error_message,
          ...event.metadata
        },
        created_at: new Date().toISOString()
      };

      await supabase
        .from('analytics_events')
        .insert(eventData);

    } catch (error) {
      console.warn('Failed to track upload analytics:', error);
    }
  }

  // Track upload start
  async trackUploadStarted(files: File[], bucket: string, folder: string) {
    for (const file of files) {
      await this.trackEvent({
        event_type: 'upload_started',
        file_type: file.type,
        file_size: file.size,
        bucket,
        folder,
        metadata: {
          original_filename: file.name,
          file_count: files.length
        }
      });
    }
  }

  // Track successful upload
  async trackUploadCompleted(
    originalFile: File, 
    uploadedFile: MediaFile, 
    uploadDuration: number,
    compressionRatio?: number
  ) {
    await this.trackEvent({
      event_type: 'upload_completed',
      file_id: uploadedFile.id,
      file_type: uploadedFile.type,
      file_size: uploadedFile.size,
      bucket: uploadedFile.bucket,
      folder: uploadedFile.folder,
      compression_ratio: compressionRatio,
      upload_duration: uploadDuration,
      metadata: {
        original_size: originalFile.size,
        optimized_size: uploadedFile.size,
        width: uploadedFile.metadata?.width,
        height: uploadedFile.metadata?.height,
        duration: uploadedFile.metadata?.duration
      }
    });
  }

  // Track upload failure
  async trackUploadFailed(
    file: File, 
    bucket: string, 
    folder: string, 
    error: string,
    uploadDuration?: number
  ) {
    await this.trackEvent({
      event_type: 'upload_failed',
      file_type: file.type,
      file_size: file.size,
      bucket,
      folder,
      upload_duration: uploadDuration,
      error_message: error,
      metadata: {
        original_filename: file.name
      }
    });
  }

  // Track file deletion
  async trackFileDeleted(file: MediaFile) {
    await this.trackEvent({
      event_type: 'file_deleted',
      file_id: file.id,
      file_type: file.type,
      file_size: file.size,
      bucket: file.bucket,
      folder: file.folder,
      metadata: {
        file_age_days: Math.floor(
          (Date.now() - new Date(file.uploadedAt).getTime()) / (1000 * 60 * 60 * 24)
        )
      }
    });
  }

  // Track file view/access
  async trackFileViewed(file: MediaFile, viewType: 'gallery' | 'editor' | 'preview' = 'gallery') {
    await this.trackEvent({
      event_type: 'file_viewed',
      file_id: file.id,
      file_type: file.type,
      bucket: file.bucket,
      folder: file.folder,
      metadata: {
        view_type: viewType
      }
    });
  }

  // Get upload statistics
  async getUploadStats(userId: string, timeRange: 'day' | 'week' | 'month' = 'month') {
    try {
      const startDate = new Date();
      switch (timeRange) {
        case 'day':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
      }

      const { data, error } = await supabase
        .from('analytics_events')
        .select('event_action, event_data, created_at')
        .eq('user_id', userId)
        .eq('event_type', 'media_upload')
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      const stats = {
        totalUploads: 0,
        successfulUploads: 0,
        failedUploads: 0,
        deletedFiles: 0,
        totalSize: 0,
        averageCompressionRatio: 0,
        averageUploadDuration: 0,
        bucketStats: {} as Record<string, { count: number; size: number }>,
        typeStats: {} as Record<string, { count: number; size: number }>
      };

      let compressionRatios: number[] = [];
      let uploadDurations: number[] = [];

      data.forEach(event => {
        const eventData = event.event_data;
        
        switch (event.event_action) {
          case 'upload_started':
            stats.totalUploads++;
            break;
          case 'upload_completed':
            stats.successfulUploads++;
            if (eventData.file_size) stats.totalSize += eventData.file_size;
            if (eventData.compression_ratio) compressionRatios.push(eventData.compression_ratio);
            if (eventData.upload_duration) uploadDurations.push(eventData.upload_duration);
            
            // Bucket stats
            if (eventData.bucket) {
              if (!stats.bucketStats[eventData.bucket]) {
                stats.bucketStats[eventData.bucket] = { count: 0, size: 0 };
              }
              stats.bucketStats[eventData.bucket].count++;
              stats.bucketStats[eventData.bucket].size += eventData.file_size || 0;
            }
            
            // Type stats
            if (eventData.file_type) {
              const fileCategory = eventData.file_type.split('/')[0];
              if (!stats.typeStats[fileCategory]) {
                stats.typeStats[fileCategory] = { count: 0, size: 0 };
              }
              stats.typeStats[fileCategory].count++;
              stats.typeStats[fileCategory].size += eventData.file_size || 0;
            }
            break;
          case 'upload_failed':
            stats.failedUploads++;
            break;
          case 'file_deleted':
            stats.deletedFiles++;
            break;
        }
      });

      // Calculate averages
      stats.averageCompressionRatio = compressionRatios.length > 0 
        ? compressionRatios.reduce((a, b) => a + b, 0) / compressionRatios.length 
        : 0;
      
      stats.averageUploadDuration = uploadDurations.length > 0
        ? uploadDurations.reduce((a, b) => a + b, 0) / uploadDurations.length
        : 0;

      return stats;
    } catch (error) {
      console.error('Failed to get upload stats:', error);
      return null;
    }
  }

  // Get performance metrics
  async getPerformanceMetrics(userId: string) {
    try {
      const { data, error } = await supabase
        .from('analytics_events')
        .select('event_data, created_at')
        .eq('user_id', userId)
        .eq('event_type', 'media_upload')
        .eq('event_action', 'upload_completed')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const metrics = {
        averageUploadSpeed: 0, // MB/s
        compressionEfficiency: 0, // %
        successRate: 0, // %
        popularFormats: {} as Record<string, number>,
        peakUploadTimes: {} as Record<string, number> // Hour of day
      };

      let totalSpeed = 0;
      let totalCompression = 0;
      let speedCount = 0;
      let compressionCount = 0;

      data.forEach(event => {
        const eventData = event.event_data;
        
        // Calculate upload speed (MB/s)
        if (eventData.file_size && eventData.upload_duration) {
          const sizeMB = eventData.file_size / (1024 * 1024);
          const durationS = eventData.upload_duration / 1000;
          totalSpeed += sizeMB / durationS;
          speedCount++;
        }

        // Track compression efficiency
        if (eventData.compression_ratio) {
          totalCompression += eventData.compression_ratio;
          compressionCount++;
        }

        // Track popular formats
        if (eventData.file_type) {
          metrics.popularFormats[eventData.file_type] = 
            (metrics.popularFormats[eventData.file_type] || 0) + 1;
        }

        // Track peak upload times
        const hour = new Date(event.created_at).getHours();
        metrics.peakUploadTimes[hour] = (metrics.peakUploadTimes[hour] || 0) + 1;
      });

      metrics.averageUploadSpeed = speedCount > 0 ? totalSpeed / speedCount : 0;
      metrics.compressionEfficiency = compressionCount > 0 ? totalCompression / compressionCount : 0;

      return metrics;
    } catch (error) {
      console.error('Failed to get performance metrics:', error);
      return null;
    }
  }
}

export const uploadAnalytics = new UploadAnalyticsService();