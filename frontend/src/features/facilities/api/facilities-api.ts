import { apiClient } from '@/lib/api/api-client';
import {
  FacilityAsset,
  CreateAssetInput,
  UpdateAssetInput,
  AssetCategory,
  AssetStatus,
  AssetCondition,
} from '../types/facilities';

interface PaginatedAssetsResponse {
  assets: FacilityAsset[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const facilitiesApi = {
  getAssets: async (params?: {
    category?: AssetCategory;
    status?: AssetStatus;
    condition?: AssetCondition;
    hostelId?: string;
    blockId?: string;
    roomId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.status) query.set('status', params.status);
    if (params?.condition) query.set('condition', params.condition);
    if (params?.hostelId) query.set('hostelId', params.hostelId);
    if (params?.blockId) query.set('blockId', params.blockId);
    if (params?.roomId) query.set('roomId', params.roomId);
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());

    return apiClient.get<PaginatedAssetsResponse>(`/facilities?${query.toString()}`);
  },

  getAssetById: async (id: string) => {
    return apiClient.get<FacilityAsset>(`/facilities/${id}`);
  },

  createAsset: async (input: CreateAssetInput) => {
    return apiClient.post<FacilityAsset>('/facilities', input);
  },

  updateAsset: async (id: string, input: UpdateAssetInput) => {
    return apiClient.patch<FacilityAsset>(`/facilities/${id}`, input);
  },

  deleteAsset: async (id: string) => {
    return apiClient.delete<null>(`/facilities/${id}`);
  },
};
