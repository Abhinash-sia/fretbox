import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '../api/ai-api';
import {
  FaqDocument,
  CreateFaqDocumentInput,
  UpdateFaqDocumentInput,
  FaqCategory,
} from '../types/ai';

export const FAQ_DOCUMENTS_QUERY_KEY = ['faq-documents'];

export function useFaqDocuments(category?: FaqCategory) {
  return useQuery<FaqDocument[], Error>({
    queryKey: [...FAQ_DOCUMENTS_QUERY_KEY, category || 'all'],
    queryFn: () => aiApi.getFaqDocuments(category),
  });
}

export function useCreateFaqDocument() {
  const queryClient = useQueryClient();
  return useMutation<FaqDocument, Error, CreateFaqDocumentInput>({
    mutationFn: (input: CreateFaqDocumentInput) => aiApi.createFaqDocument(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FAQ_DOCUMENTS_QUERY_KEY });
    },
  });
}

export function useUpdateFaqDocument() {
  const queryClient = useQueryClient();
  return useMutation<
    FaqDocument,
    Error,
    { id: string; data: UpdateFaqDocumentInput }
  >({
    mutationFn: ({ id, data }) => aiApi.updateFaqDocument(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FAQ_DOCUMENTS_QUERY_KEY });
    },
  });
}

export function useDeleteFaqDocument() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id: string) => aiApi.deleteFaqDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FAQ_DOCUMENTS_QUERY_KEY });
    },
  });
}
