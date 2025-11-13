/**
 * Document service
 */

import apiClient from './api';
import { Document, DocumentUploadResponse } from '../types/document';

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
   * List documents for current user
   */
  async listDocuments(limit: number = 20, offset: number = 0): Promise<Document[]> {
    const response = await apiClient.get<Document[]>('/documents', {
      params: { limit, offset },
    });
    return response.data;
  }
}

export const documentService = new DocumentService();


