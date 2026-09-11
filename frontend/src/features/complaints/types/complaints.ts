export type ComplaintCategory =
  | 'electrical'
  | 'plumbing'
  | 'cleanliness'
  | 'room'
  | 'furniture'
  | 'network'
  | 'water'
  | 'mess'
  | 'security'
  | 'other';

export type ComplaintPriority = 'low' | 'medium' | 'high' | 'urgent';

export type ComplaintStatus =
  | 'open'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'closed'
  | 'reopened';

export interface ComplaintUserRef {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export interface Complaint {
  _id: string;
  ticketNumber?: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  studentId: ComplaintUserRef;
  assignedToStaffId?: ComplaintUserRef;
  hostelId?: {
    _id: string;
    name: string;
    code: string;
  };
  blockId?: {
    _id: string;
    name: string;
    code: string;
  };
  roomId?: {
    _id: string;
    roomNumber: string;
  };
  assetId?: {
    _id: string;
    name: string;
    assetTag: string;
  };
  preferredTimeSlot?: string;
  resolutionNotes?: string;
  resolutionTimeMinutes?: number;
  aiClassification?: {
    category: ComplaintCategory;
    priority: ComplaintPriority;
    confidence: number;
    reason: string;
    status: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ComplaintAssignment {
  _id: string;
  complaintId: string;
  assignedToStaffId: ComplaintUserRef;
  assignedByUserId: ComplaintUserRef;
  notes?: string;
  assignedAt: string;
  unassignedAt?: string;
  isActive: boolean;
}

export interface ComplaintAudit {
  _id: string;
  complaintId: string;
  performedByUserId: ComplaintUserRef;
  action: string;
  notes?: string;
  createdAt: string;
}

export interface ComplaintDetailsResponse {
  complaint: Complaint;
  assignments: ComplaintAssignment[];
  audits: ComplaintAudit[];
}

export interface ComplaintMetrics {
  total: number;
  statusCounts: Record<ComplaintStatus, number>;
  priorityCounts: Record<ComplaintPriority, number>;
  categoryCounts: Record<string, number>;
  averageResolutionTimeHours: number;
  ageingBuckets: {
    pendingUnder24h: number;
    pending24to72h: number;
    pendingOver72h: number;
  };
}

export interface CreateComplaintInput {
  title: string;
  description: string;
  category: ComplaintCategory;
  priority?: ComplaintPriority;
  hostelId?: string;
  blockId?: string;
  roomId?: string;
  assetId?: string;
  preferredTimeSlot?: string;
}

export interface AssignComplaintInput {
  assignedToStaffId: string;
  notes?: string;
}

export interface UpdateComplaintStatusInput {
  status: ComplaintStatus;
  notes?: string;
  resolutionNotes?: string;
}
