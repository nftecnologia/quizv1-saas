export interface FileUploadOptions {
  maxSize?: number;
  allowedTypes?: string[];
  bucket: string;
  folder?: string;
  compress?: boolean;
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
  url?: string;
}

export interface MediaFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  bucket: string;
  folder: string;
  uploadedAt: string;
  userId: string;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    codec?: string;
  };
}

export interface UploadResponse {
  success: boolean;
  file?: MediaFile;
  error?: string;
}

export interface StorageBucket {
  name: string;
  allowedTypes: string[];
  maxSize: number;
  description: string;
}

export const STORAGE_BUCKETS: Record<string, StorageBucket> = {
  images: {
    name: 'images',
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    maxSize: 10 * 1024 * 1024, // 10MB
    description: 'Imagens otimizadas para quizzes'
  },
  videos: {
    name: 'videos',
    allowedTypes: ['video/mp4', 'video/webm', 'video/mov'],
    maxSize: 50 * 1024 * 1024, // 50MB
    description: 'Vídeos com preview para quizzes'
  },
  documents: {
    name: 'documents',
    allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    maxSize: 25 * 1024 * 1024, // 25MB
    description: 'Documentos e PDFs'
  },
  avatars: {
    name: 'avatars',
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxSize: 5 * 1024 * 1024, // 5MB
    description: 'Fotos de perfil dos usuários'
  }
};

export interface DragDropProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export interface PreviewFile extends File {
  preview?: string;
  id: string;
}