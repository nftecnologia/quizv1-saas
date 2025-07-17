import { useState, useCallback } from 'react';
import { uploadService } from '../services/uploadService';
import { MediaFile, FileUploadOptions, UploadProgress, UploadResponse } from '../types/upload';
import { useAuth } from './useAuth';

export interface UseFileUploadOptions extends Omit<FileUploadOptions, 'bucket'> {
  bucket: string;
  onUploadComplete?: (files: MediaFile[]) => void;
  onUploadError?: (error: string) => void;
}

export function useFileUpload(options: UseFileUploadOptions) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<MediaFile[]>([]);

  const uploadFiles = useCallback(async (files: File[]) => {
    if (!user) {
      options.onUploadError?.('User not authenticated');
      return;
    }

    setUploading(true);
    setProgress([]);

    try {
      const results = await uploadService.uploadFiles(
        files,
        options,
        (progresses) => setProgress(progresses)
      );

      const successfulUploads = results
        .filter((result): result is UploadResponse & { file: MediaFile } => 
          result.success && !!result.file
        )
        .map(result => result.file);

      const errors = results
        .filter(result => !result.success)
        .map(result => result.error)
        .filter(Boolean);

      if (errors.length > 0) {
        options.onUploadError?.(errors.join(', '));
      }

      if (successfulUploads.length > 0) {
        setUploadedFiles(prev => [...successfulUploads, ...prev]);
        options.onUploadComplete?.(successfulUploads);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      options.onUploadError?.(errorMessage);
    } finally {
      setUploading(false);
    }
  }, [user, options]);

  const uploadSingleFile = useCallback(async (file: File) => {
    return uploadFiles([file]);
  }, [uploadFiles]);

  const clearProgress = useCallback(() => {
    setProgress([]);
  }, []);

  const clearUploadedFiles = useCallback(() => {
    setUploadedFiles([]);
  }, []);

  return {
    uploadFiles,
    uploadSingleFile,
    uploading,
    progress,
    uploadedFiles,
    clearProgress,
    clearUploadedFiles
  };
}

export function useMediaGallery(bucket?: string, folder?: string) {
  const { user } = useAuth();
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFiles = useCallback(async (limit = 50, offset = 0) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const userFiles = await uploadService.getUserFiles(
        user.id,
        bucket,
        folder,
        limit,
        offset
      );

      if (offset === 0) {
        setFiles(userFiles);
      } else {
        setFiles(prev => [...prev, ...userFiles]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load files';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, bucket, folder]);

  const deleteFile = useCallback(async (fileId: string) => {
    try {
      const success = await uploadService.deleteFile(fileId);
      if (success) {
        setFiles(prev => prev.filter(file => file.id !== fileId));
      }
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete file';
      setError(errorMessage);
      return false;
    }
  }, []);

  const searchFiles = useCallback(async (query: string) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const searchResults = await uploadService.searchFiles(
        user.id,
        query,
        bucket
      );
      setFiles(searchResults);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, bucket]);

  const refresh = useCallback(() => {
    loadFiles();
  }, [loadFiles]);

  return {
    files,
    loading,
    error,
    loadFiles,
    deleteFile,
    searchFiles,
    refresh
  };
}