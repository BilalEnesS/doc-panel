/**
 * Document service
 */

import apiClient from './api';
import { DocumentUploadResponse } from '../types/document';

class DocumentService {
  /**
   * Upload a new document
   */
  async uploadDocument(formData: FormData): Promise<DocumentUploadResponse> {
    const response = await apiClient.post<DocumentUploadResponse>('/documents/upload', formData);

    return response.data;
  }
}

export const documentService = new DocumentService();


