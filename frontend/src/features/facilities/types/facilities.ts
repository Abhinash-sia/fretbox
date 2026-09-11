export type AssetCategory =
  | 'electrical'
  | 'plumbing'
  | 'cleanliness'
  | 'room'
  | 'furniture'
  | 'network'
  | 'water'
  | 'appliance'
  | 'safety'
  | 'other';

export type AssetStatus = 'active' | 'maintenance' | 'damaged' | 'retired';
export type AssetCondition = 'good' | 'fair' | 'poor' | 'critical';

export interface FacilityAsset {
  _id: string;
  name: string;
  assetTag: string;
  category: AssetCategory;
  status: AssetStatus;
  condition: AssetCondition;
  hostelId?: {
    _id: string;
    name: string;
    code: string;
  } | string;
  blockId?: {
    _id: string;
    name: string;
    code: string;
  } | string;
  roomId?: {
    _id: string;
    roomNumber: string;
  } | string;
  locationText?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssetInput {
  name: string;
  assetTag: string;
  category: AssetCategory;
  status?: AssetStatus;
  condition?: AssetCondition;
  hostelId?: string;
  blockId?: string;
  roomId?: string;
  locationText?: string;
  notes?: string;
}

export interface UpdateAssetInput {
  name?: string;
  category?: AssetCategory;
  status?: AssetStatus;
  condition?: AssetCondition;
  hostelId?: string;
  blockId?: string;
  roomId?: string;
  locationText?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  notes?: string;
}
