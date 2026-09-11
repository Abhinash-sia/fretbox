import { useMutation } from '@tanstack/react-query';
import { aiApi } from '../api/ai-api';
import { FaqQueryInput, FaqQueryResult } from '../types/ai';

export function useFaqQueryMutation() {
  return useMutation<FaqQueryResult, Error, FaqQueryInput>({
    mutationFn: (input: FaqQueryInput) => aiApi.queryFaq(input),
  });
}
