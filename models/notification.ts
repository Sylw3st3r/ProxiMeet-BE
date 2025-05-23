export interface Notification {
  id: number;
  subject: string;
  message: string;
  sent_at: string;
}

export interface UserNotification {
  user_id: number;
  notification_id: number;
  seen: boolean;
}

export interface UserNotificationWithDetails {
  id: number;
  subject: string;
  message: string;
  seen: boolean;
}

export interface PaginatedNotifications {
  notifications: UserNotificationWithDetails[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
