export type ComplaintCategory =
  | 'PLUMBING'
  | 'ELECTRICAL'
  | 'CARPENTRY'
  | 'INTERNET'
  | 'CLEANLINESS'
  | 'ACADEMIC'
  | 'OTHER';

export type ComplaintPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type ComplaintStatus =
  | 'OPEN'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'REOPENED'
  | 'CLOSED'
  | 'CANCELLED';

export interface Complaint {
  _id: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  studentId: string | { _id: string; name?: string; email?: string };
  assignedToStaffId?: string | { _id: string; name?: string; email?: string };
  hostelId?: string | { _id: string; name?: string; code?: string };
  blockId?: string | { _id: string; name?: string };
  roomId?: string | { _id: string; roomNumber?: string };
  notes?: string;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateComplaintInput {
  title: string;
  description: string;
  category: ComplaintCategory;
  priority?: ComplaintPriority;
  hostelId?: string;
  blockId?: string;
  roomId?: string;
}

export type GatePassStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'USED'
  | 'EXPIRED';

export interface GatePass {
  _id: string;
  studentId: string | { _id: string; name?: string; email?: string };
  reason: string;
  destination: string;
  outDateTime: string;
  expectedReturnDateTime: string;
  status: GatePassStatus;
  approvedByWardenId?: string | { _id: string; name?: string };
  rejectionReason?: string;
  passToken?: string;
  qrCodeDataUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGatePassInput {
  reason: string;
  destination: string;
  outDateTime: string;
  expectedReturnDateTime: string;
}

export interface CourseAttendanceSummary {
  courseId: string;
  courseCode: string;
  courseName: string;
  totalSessions: number;
  attendedSessions: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  excusedCount: number;
  percentage: number;
  isLowAttendance: boolean;
}

export interface StudentAttendanceSummary {
  studentId: string;
  overall: {
    totalConductedSessions: number;
    attendedSessions: number;
    percentage: number;
    isLowAttendance: boolean;
    threshold: number;
  };
  courses: CourseAttendanceSummary[];
}

export interface HostelRoomAllocation {
  _id: string;
  studentId: { _id: string; name: string; email: string };
  hostelId: { _id: string; name: string; code: string; category: string };
  blockId: { _id: string; name: string; code: string };
  roomId: { _id: string; roomNumber: string; floorNumber: number; capacity: number };
  status: 'ACTIVE' | 'VACATED';
  allocatedAt: string;
  vacatedAt?: string;
  remarks?: string;
}

export interface MessMenu {
  _id: string;
  hostelId?: { _id: string; name: string };
  date: string;
  mealType: 'BREAKFAST' | 'LUNCH' | 'SNACKS' | 'DINNER';
  items: string[];
  description?: string;
  isPublished: boolean;
  createdAt: string;
}

export interface MessFeedbackInput {
  menuId: string;
  rating: number;
  comments?: string;
}

export interface AppNotification {
  _id: string;
  recipientId: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  isActioned: boolean;
  relatedEntityId?: string;
  createdAt: string;
}

export interface Announcement {
  _id: string;
  title: string;
  content: string;
  scope: string;
  targetRole?: string;
  authorId?: { _id: string; name: string };
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
}

export interface FaqQueryResponse {
  answer: string;
  citations: Array<{ title: string; source: string; content: string }>;
  confidence: number;
}
