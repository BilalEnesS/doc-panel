/**
 * Document service
 */

import apiClient from './api';
import {
  Document,
  DocumentUploadResponse,
  DocumentUpdateRequest,
  DocumentListResponse,
  DocumentListParams,
} from '../types/document';

class DocumentService {
  /**
   * Upload a new document
   */
  async uploadDocument(formData: FormData): Promise<DocumentUploadResponse> {
    const response = await apiClient.post<DocumentUploadResponse>('/documents/upload', formData);
    return response.data;
  }

  /**
   * Get document by ID
   */
  async getDocument(documentId: number): Promise<Document> {
    const response = await apiClient.get<Document>(`/documents/${documentId}`);
    return response.data;
  }

  /**
   * List documents for current user with filtering and sorting
   */
  async listDocuments(params?: DocumentListParams): Promise<DocumentListResponse> {
    // Remove undefined values from params
    const cleanParams = params ? Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== undefined)
    ) : undefined;
    
    const response = await apiClient.get<DocumentListResponse>('/documents', {
      params: cleanParams,
    });
    return response.data;
  }

  /**
   * Update document metadata
   */
  async updateDocument(documentId: number, data: DocumentUpdateRequest): Promise<Document> {
    const response = await apiClient.patch<Document>(`/documents/${documentId}`, data);
    return response.data;
  }

  /**
   * Delete document
   */
  async deleteDocument(documentId: number): Promise<void> {
    await apiClient.delete(`/documents/${documentId}`);
  }

  /**
   * Reprocess OCR for a document
   */
  async reprocessDocument(documentId: number): Promise<Document> {
    const response = await apiClient.post<Document>(`/documents/${documentId}/reprocess`);
    return response.data;
  }
}

export const documentService = new DocumentService();


