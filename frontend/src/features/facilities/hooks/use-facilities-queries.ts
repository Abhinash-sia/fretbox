import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { facilitiesApi } from '../api/facilities-api';
import {
  CreateAssetInput,
  UpdateAssetInput,
  AssetCategory,
  AssetStatus,
  AssetCondition,
} from '../types/facilities';

export function useFacilityAssets(params?: {
  category?: AssetCategory;
  status?: AssetStatus;
  condition?: AssetCondition;
  hostelId?: string;
  blockId?: string;
  roomId?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['facility-assets', params],
    queryFn: () => facilitiesApi.getAssets(params),
  });
}

export function useFacilityAssetDetails(id?: string) {
  return useQuery({
    queryKey: ['facility-asset', id],
    queryFn: () => (id ? facilitiesApi.getAssetById(id) : null),
    enabled: !!id,
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAssetInput) => facilitiesApi.createAsset(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facility-assets'] });
    },
  });
}

export function useUpdateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateAssetInput }) =>
      facilitiesApi.updateAsset(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['facility-assets'] });
      queryClient.invalidateQueries({ queryKey: ['facility-asset', variables.id] });
    },
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => facilitiesApi.deleteAsset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facility-assets'] });
    },
  });
}
