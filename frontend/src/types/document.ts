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

export interface DocumentUpdateRequest {
  title?: string;
  category?: string;
}

export interface DocumentListResponse {
  documents: Document[];
  total: number;
  limit: number;
  offset: number;
}

export interface DocumentListParams {
  limit?: number;
  offset?: number;
  status?: DocumentStatus;
  file_type?: FileType;
  category?: string;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface SemanticSearchRequest {
  query: string;
  limit?: number;
  threshold?: number;
}

export interface SemanticSearchResult {
  document: Document;
  similarity: number;
}

export interface SemanticSearchResponse {
  results: SemanticSearchResult[];
  query: string;
  total: number;
}


