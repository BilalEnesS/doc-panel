/**
 * Document types
 */

export type DocumentStatus = 'uploading' | 'processing' | 'completed' | 'failed';

export type FileType = 'pdf' | 'image' | 'docx';

export interface Document {
  id: number;
  user_id: number;
  title: string;
  filename: string;
  file_path: string;
  file_type: FileType;
  file_size: number;
  category?: string | null;
  summary?: string | null;
  extracted_text?: string | null;
  status: DocumentStatus;
  created_at: string;
  updated_at?: string | null;
}

export interface DocumentUploadResponse {
  message: string;
  document: Document;
}


