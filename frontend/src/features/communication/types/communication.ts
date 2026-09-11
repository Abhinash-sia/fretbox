export type NotificationType =
  | 'announcement'
  | 'complaint'
  | 'gate_pass'
  | 'system'
  | 'academic';

export type PriorityLevel = 'low' | 'normal' | 'high' | 'urgent';

export type DeliveryStatus = 'pending' | 'delivered' | 'failed';

export type AnnouncementStatus = 'draft' | 'published' | 'cancelled' | 'expired';

export interface NotificationItem {
  _id: string;
  recipientId: string;
  announcementId?: string;
  type: NotificationType;
  title: string;
  body: string;
  priority: PriorityLevel;
  deliveryStatus: DeliveryStatus;
  deliveredAt?: string;
  readAt?: string | null;
  actionAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementTarget {
  all?: boolean;
  roles?: string[];
  hostelIds?: string[];
  blockIds?: string[];
}

export interface AnnouncementAuthor {
  _id: string;
  name: string;
  email?: string;
  role: string;
}

export interface AnnouncementItem {
  _id: string;
  title: string;
  body: string;
  createdBy: AnnouncementAuthor | string;
  target: AnnouncementTarget;
  priority: PriorityLevel;
  status: AnnouncementStatus;
  publishAt?: string;
  publishedAt?: string;
  cancelledAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
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

export interface CreateAnnouncementInput {
  title: string;
  body: string;
  target?: AnnouncementTarget;
  priority?: PriorityLevel;
  publishAt?: string;
  expiresAt?: string;
}

export interface UpdateAnnouncementInput {
  title?: string;
  body?: string;
  target?: AnnouncementTarget;
  priority?: PriorityLevel;
  publishAt?: string;
  expiresAt?: string;
}

export type SocketConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

export interface NotificationNewPayload {
  notificationId: string;
  announcementId?: string;
  type: NotificationType;
  title: string;
  body: string;
  priority: PriorityLevel;
  createdAt: string;
}

export interface NotificationReadPayload {
  notificationId: string;
  readAt: string;
}

export interface NotificationActionPayload {
  notificationId: string;
  actionAt: string;
}

export interface AnnouncementPublishedPayload {
  announcementId: string;
  title: string;
  priority: PriorityLevel;
  publishedAt: string;
}
