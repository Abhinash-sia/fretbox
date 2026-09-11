import { apiClient } from '@/lib/api/api-client';
import {
  FaqQueryInput,
  FaqQueryResult,
  FaqDocument,
  CreateFaqDocumentInput,
  UpdateFaqDocumentInput,
  FaqCategory,
} from '../types/ai';

export const aiApi = {
  /**
   * Query Campus FAQ Assistant (RAG Pipeline)
   * Sends { question, category?, limit? } as required by backend Zod schema.
   */
  async queryFaq(input: FaqQueryInput): Promise<FaqQueryResult> {
    return apiClient.request<FaqQueryResult>('/faq/query', {
      method: 'POST',
      body: {
        question: input.question,
        ...(input.category ? { category: input.category } : {}),
        ...(input.limit ? { limit: input.limit } : {}),
      },
    });
  },

  /**
   * Get knowledge base documents
   */
  async getFaqDocuments(category?: FaqCategory): Promise<FaqDocument[]> {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await apiClient.request<FaqDocument[] | { documents: FaqDocument[] }>(`/faq/documents${queryString}`);
    return Array.isArray(response) ? response : (response as { documents: FaqDocument[] }).documents || [];
  },

  /**
   * Create a new knowledge base document (Admin / Warden)
   */
  async createFaqDocument(input: CreateFaqDocumentInput): Promise<FaqDocument> {
    return apiClient.request<FaqDocument>('/faq/documents', {
      method: 'POST',
      body: input,
    });
  },

  /**
   * Update an existing knowledge base document (Admin / Warden)
   */
  async updateFaqDocument(id: string, input: UpdateFaqDocumentInput): Promise<FaqDocument> {
    return apiClient.request<FaqDocument>(`/faq/documents/${id}`, {
      method: 'PATCH',
      body: input,
    });
  },

  /**
   * Delete a knowledge base document (Admin / Warden)
   */
  async deleteFaqDocument(id: string): Promise<void> {
    await apiClient.request(`/faq/documents/${id}`, {
      method: 'DELETE',
    });
  },
};
