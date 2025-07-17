import { supabase } from '../lib/supabase';
import { MediaFile, FileUploadOptions, UploadResponse, UploadProgress } from '../types/upload';

class UploadService {
  private progressCallbacks: Map<string, (progress: UploadProgress) => void> = new Map();

  // Compress image before upload
  private async compressImage(
    file: File,
    quality: number = 0.8,
    maxWidth: number = 1920,
    maxHeight: number = 1080
  ): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }

  // Generate thumbnail for video
  private async generateVideoThumbnail(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      video.onloadedmetadata = () => {
        canvas.width = 320;
        canvas.height = (video.videoHeight / video.videoWidth) * 320;
        
        video.currentTime = 1; // Capture at 1 second
      };

      video.onseeked = () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to generate thumbnail'));
          }
        }, 'image/jpeg', 0.8);
      };

      video.onerror = () => reject(new Error('Failed to load video'));
      video.src = URL.createObjectURL(file);
    });
  }

  // Upload file to Supabase Storage
  async uploadFile(
    file: File,
    options: FileUploadOptions,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResponse> {
    try {
      const fileId = `${Date.now()}-${file.name}`;
      
      if (onProgress) {
        this.progressCallbacks.set(fileId, onProgress);
      }

      // Update progress
      const updateProgress = (progress: number, status: UploadProgress['status'], error?: string, url?: string) => {
        const progressData: UploadProgress = {
          fileName: file.name,
          progress,
          status,
          error,
          url
        };
        
        onProgress?.(progressData);
      };

      updateProgress(0, 'uploading');

      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      // Validate file
      const bucket = options.bucket;
      if (options.maxSize && file.size > options.maxSize) {
        throw new Error(`File size exceeds maximum of ${options.maxSize / (1024 * 1024)}MB`);
      }

      if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
        throw new Error(`File type ${file.type} not allowed`);
      }

      updateProgress(20, 'uploading');

      // Process file (compress if needed)
      let processedFile = file;
      if (options.compress && file.type.startsWith('image/')) {
        processedFile = await this.compressImage(
          file,
          options.quality || 0.8,
          options.maxWidth || 1920,
          options.maxHeight || 1080
        );
      }

      updateProgress(40, 'uploading');

      // Create file path
      const folder = options.folder || 'general';
      const filePath = `${user.id}/${folder}/${fileId}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, processedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      updateProgress(70, 'uploading');

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      updateProgress(80, 'uploading');

      // Generate thumbnail for videos
      let thumbnailUrl: string | undefined;
      if (file.type.startsWith('video/')) {
        try {
          const thumbnail = await this.generateVideoThumbnail(file);
          const thumbnailPath = `${user.id}/${folder}/thumbnails/${fileId}.jpg`;
          
          const { error: thumbError } = await supabase.storage
            .from(bucket)
            .upload(thumbnailPath, thumbnail);

          if (!thumbError) {
            const { data: thumbUrlData } = supabase.storage
              .from(bucket)
              .getPublicUrl(thumbnailPath);
            thumbnailUrl = thumbUrlData.publicUrl;
          }
        } catch (error) {
          console.warn('Failed to generate video thumbnail:', error);
        }
      }

      updateProgress(90, 'uploading');

      // Save file metadata to database
      const mediaFile: Omit<MediaFile, 'id'> = {
        name: file.name,
        type: file.type,
        size: processedFile.size,
        url: urlData.publicUrl,
        thumbnailUrl,
        bucket,
        folder,
        uploadedAt: new Date().toISOString(),
        userId: user.id,
        metadata: file.type.startsWith('image/') ? await this.getImageMetadata(processedFile) : undefined
      };

      const { data: dbData, error: dbError } = await supabase
        .from('media_files')
        .insert(mediaFile)
        .select()
        .single();

      if (dbError) {
        // If database insert fails, clean up uploaded file
        await supabase.storage.from(bucket).remove([filePath]);
        throw dbError;
      }

      updateProgress(100, 'completed', undefined, urlData.publicUrl);

      this.progressCallbacks.delete(fileId);

      return {
        success: true,
        file: dbData as MediaFile
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      if (onProgress) {
        onProgress({
          fileName: file.name,
          progress: 0,
          status: 'error',
          error: errorMessage
        });
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // Get image metadata
  private async getImageMetadata(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight
        });
      };
      img.src = URL.createObjectURL(file);
    });
  }

  // Upload multiple files
  async uploadFiles(
    files: File[],
    options: FileUploadOptions,
    onProgress?: (progresses: UploadProgress[]) => void
  ): Promise<UploadResponse[]> {
    const progresses: UploadProgress[] = files.map(file => ({
      fileName: file.name,
      progress: 0,
      status: 'uploading' as const
    }));

    const updateProgress = (index: number, progress: UploadProgress) => {
      progresses[index] = progress;
      onProgress?.(progresses);
    };

    const uploadPromises = files.map((file, index) =>
      this.uploadFile(file, options, (progress) => updateProgress(index, progress))
    );

    return Promise.all(uploadPromises);
  }

  // Get user's media files
  async getUserFiles(
    userId: string,
    bucket?: string,
    folder?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<MediaFile[]> {
    let query = supabase
      .from('media_files')
      .select('*')
      .eq('userId', userId)
      .order('uploadedAt', { ascending: false })
      .range(offset, offset + limit - 1);

    if (bucket) {
      query = query.eq('bucket', bucket);
    }

    if (folder) {
      query = query.eq('folder', folder);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data as MediaFile[];
  }

  // Delete file
  async deleteFile(fileId: string): Promise<boolean> {
    try {
      // Get file info
      const { data: file, error: fetchError } = await supabase
        .from('media_files')
        .select('*')
        .eq('id', fileId)
        .single();

      if (fetchError || !file) {
        throw new Error('File not found');
      }

      // Extract path from URL
      const url = new URL(file.url);
      const pathParts = url.pathname.split('/');
      const filePath = pathParts.slice(-3).join('/'); // user_id/folder/filename

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(file.bucket)
        .remove([filePath]);

      if (storageError) {
        throw storageError;
      }

      // Delete thumbnail if exists
      if (file.thumbnailUrl) {
        const thumbUrl = new URL(file.thumbnailUrl);
        const thumbPathParts = thumbUrl.pathname.split('/');
        const thumbPath = thumbPathParts.slice(-4).join('/'); // user_id/folder/thumbnails/filename
        
        await supabase.storage
          .from(file.bucket)
          .remove([thumbPath]);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('media_files')
        .delete()
        .eq('id', fileId);

      if (dbError) {
        throw dbError;
      }

      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  // Search files
  async searchFiles(
    userId: string,
    query: string,
    bucket?: string,
    limit: number = 20
  ): Promise<MediaFile[]> {
    let dbQuery = supabase
      .from('media_files')
      .select('*')
      .eq('userId', userId)
      .ilike('name', `%${query}%`)
      .order('uploadedAt', { ascending: false })
      .limit(limit);

    if (bucket) {
      dbQuery = dbQuery.eq('bucket', bucket);
    }

    const { data, error } = await dbQuery;

    if (error) {
      throw error;
    }

    return data as MediaFile[];
  }
}

export const uploadService = new UploadService();