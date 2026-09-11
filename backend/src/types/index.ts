export enum UserRole {
  STUDENT = 'student',
  FACULTY = 'faculty',
  SECURITY = 'security',
  WARDEN = 'warden',
  STAFF = 'staff',
  ADMINISTRATOR = 'administrator',
}

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  EXCUSED = 'excused',
}

export enum SessionStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum HostelCategory {
  BOYS = 'boys',
  GIRLS = 'girls',
  COED = 'coed',
}

export enum RoomStatus {
  AVAILABLE = 'available',
  FULL = 'full',
  MAINTENANCE = 'maintenance',
  INACTIVE = 'inactive',
}

export enum AllocationStatus {
  ACTIVE = 'active',
  VACATED = 'vacated',
}

export enum AssetCategory {
  ELECTRICAL = 'electrical',
  PLUMBING = 'plumbing',
  CLEANLINESS = 'cleanliness',
  ROOM = 'room',
  FURNITURE = 'furniture',
  NETWORK = 'network',
  WATER = 'water',
  APPLIANCE = 'appliance',
  SAFETY = 'safety',
  OTHER = 'other',
}

export enum AssetStatus {
  ACTIVE = 'active',
  MAINTENANCE = 'maintenance',
  DAMAGED = 'damaged',
  RETIRED = 'retired',
}

export enum AssetCondition {
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  CRITICAL = 'critical',
}

export enum ComplaintCategory {
  ELECTRICAL = 'electrical',
  PLUMBING = 'plumbing',
  CLEANLINESS = 'cleanliness',
  ROOM = 'room',
  FURNITURE = 'furniture',
  NETWORK = 'network',
  WATER = 'water',
  MESS = 'mess',
  SECURITY = 'security',
  OTHER = 'other',
}

export enum ComplaintPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum ComplaintStatus {
  OPEN = 'open',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  REOPENED = 'reopened',
}

export enum ComplaintAuditAction {
  CREATED = 'created',
  ASSIGNED = 'assigned',
  REASSIGNED = 'reassigned',
  STATUS_CHANGED = 'status_changed',
  PRIORITY_CHANGED = 'priority_changed',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  REOPENED = 'reopened',
  AI_CLASSIFIED = 'ai_classified',
  AI_APPLIED = 'ai_applied',
}

export enum AiClassificationStatus {
  UNAVAILABLE = 'unavailable',
  CLASSIFIED = 'classified',
  NEEDS_REVIEW = 'needs_review',
  APPLIED = 'applied',
  FAILED = 'failed',
}

export interface IAiClassification {
  category: ComplaintCategory;
  priority: ComplaintPriority;
  confidence: number;
  reason: string;
  provider: string;
  model: string;
  status: AiClassificationStatus;
  classifiedAt: Date;
}

export enum MealType {
  BREAKFAST = 'breakfast',
  LUNCH = 'lunch',
  SNACKS = 'snacks',
  DINNER = 'dinner',
}

export enum GatePassStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  USED = 'used',
}

export enum GateEventType {
  EXIT = 'exit',
  ENTRY = 'entry',
}

export enum AnnouncementPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum AnnouncementStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum FaqCategory {
  GENERAL = 'general',
  ACADEMIC = 'academic',
  HOSTEL = 'hostel',
  FACILITIES = 'facilities',
  GATE_PASS = 'gate_pass',
  MESS = 'mess',
  SECURITY = 'security',
}

export interface IFaqDocument {
  _id?: string;
  title: string;
  category: FaqCategory;
  content: string;
  tags?: string[];
  isApproved: boolean;
  targetRoles?: UserRole[];
  createdById?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum NotificationType {
  ANNOUNCEMENT = 'announcement',
  ATTENDANCE = 'attendance',
  COMPLAINT = 'complaint',
  GATE_PASS = 'gate_pass',
  SYSTEM = 'system',
}

export enum NotificationDeliveryStatus {
  PENDING = 'pending',
  DELIVERED = 'delivered',
  FAILED = 'failed',
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_SERVER_ERROR',
    details?: unknown,
    isOperational: boolean = true,
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', code: string = 'NOT_FOUND') {
    super(message, 404, code);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request', code: string = 'BAD_REQUEST', details?: unknown) {
    super(message, 400, code, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required', code: string = 'AUTH_UNAUTHORIZED') {
    super(message, 401, code);
  }
}

export class ForbiddenError extends AppError {
  constructor(
    message: string = 'Access forbidden: Insufficient permissions',
    code: string = 'AUTH_FORBIDDEN',
  ) {
    super(message, 403, code);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists', code: string = 'RESOURCE_EXISTS') {
    super(message, 409, code);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(message, 500, 'INTERNAL_SERVER_ERROR', undefined, false);
  }
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorDetail;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface AppConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  MONGODB_URI: string;
  REDIS_URL: string;
  CORS_ORIGIN: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  AI_COMPLAINT_CONFIDENCE_THRESHOLD?: number;
  AI_AUTO_APPLY?: boolean;
  AI_SERVICE_URL?: string;
  PREDICTION_SERVICE_TIMEOUT_MS?: number;
  PREDICTION_DEFAULT_HISTORY_DAYS?: number;
  PREDICTION_DEFAULT_HORIZON_DAYS?: number;
  PREDICTION_MAX_HORIZON_DAYS?: number;
}

export interface JWTPayload {
  sub: string;
  role: UserRole;
}

export interface AuthUserContext {
  id: string;
  email: string;
  role: UserRole;
}

export interface CourseAttendanceSummary {
  courseId: string;
  courseCode: string;
  courseName: string;
  totalConductedSessions: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  excusedCount: number;
  attendedSessions: number; // present + late
  percentage: number;
  isLowAttendance: boolean;
  threshold: number;
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

export interface MessFeedbackSummary {
  menuId: string;
  averageRating: number;
  totalFeedbackCount: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface AnnouncementTarget {
  all?: boolean;
  roles?: UserRole[];
  programs?: string[];
  academicYears?: string[];
  hostels?: string[];
  hostelBlocks?: string[];
}

export interface AnnouncementStats {
  totalRecipients: number;
  deliveredCount: number;
  pendingCount: number;
  failedCount: number;
  readCount: number;
  actionCount: number;
  readPercentage: number;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUserContext;
    }
  }
}
