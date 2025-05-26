import Database from "better-sqlite3";
import { PaginatedNotifications } from "../models/notification.model";

const db = Database("event-planer.db");

export function notifyUsers(
  subject: string,
  message: string,
  eventId: number
): void {
  const userIds = db
    .prepare(
      `
        SELECT user_id FROM event_attendance WHERE event_id = ?
      `
    )
    .all(eventId);

  if (!userIds.length) {
    return;
  }

  const notification = {
    subject,
    message,
  };

  const result = db
    .prepare(
      `
        INSERT INTO notifications (subject, message)
        VALUES (@subject, @message)
      `
    )
    .run(notification);
  const notificationId = result.lastInsertRowid;

  const insertUserNotification = db.prepare(`
      INSERT INTO user_notifications (user_id, notification_id, seen)
      VALUES (?, ?, 0)
    `);

  const insertAll = db.transaction((userIds) => {
    for (const { user_id } of userIds) {
      insertUserNotification.run(user_id, notificationId);
    }
  });

  insertAll(userIds);
}

export function getUnseenNotificationCount(userId: number): number {
  const result = db
    .prepare(
      `
        SELECT COUNT(*) as count
        FROM user_notifications
        WHERE user_id = ? AND seen = 0
    `
    )
    .get(userId);

  return (result as any).count;
}

export function markAllNotificationsAsSeen(userId: number): void {
  db.prepare(
    `
        UPDATE user_notifications
        SET seen = 1
        WHERE user_id = ? AND seen = 0
    `
  ).run(userId);
}
export function markNotificationsAsSeen(
  userId: number,
  notificationIds: number[]
): void {
  if (!notificationIds.length) {
    return;
  }

  const transaction = db.transaction((ids: number[]) => {
    for (const notificationId of ids) {
      db.prepare(
        `
                UPDATE user_notifications
                SET seen = 1
                WHERE user_id = ? AND notification_id = ?
            `
      ).run(userId, notificationId);
    }
  });

  transaction(notificationIds);
}

export function markNotificationsAsUnseen(
  userId: number,
  notificationIds: number[]
): void {
  if (!notificationIds.length) {
    return;
  }

  const transaction = db.transaction((ids: number[]) => {
    for (const notificationId of ids) {
      db.prepare(
        `
                UPDATE user_notifications
                SET seen = 0
                WHERE user_id = ? AND notification_id = ?
            `
      ).run(userId, notificationId);
    }
  });

  transaction(notificationIds);
}

export function getUserNotifications(
  userId: number,
  search: string = "",
  page: number = 1,
  pageSize: number = 10
): PaginatedNotifications {
  const offset = (page - 1) * pageSize;
  const searchQuery = `%${search}%`;

  const totalResult = db
    .prepare(
      `
          SELECT COUNT(*) as total
          FROM user_notifications
          JOIN notifications ON user_notifications.notification_id = notifications.id
          WHERE user_notifications.user_id = ?
            AND (notifications.subject LIKE ? OR notifications.message LIKE ?)
        `
    )
    .get(userId, searchQuery, searchQuery);

  const total = (totalResult as any).total as number;
  const totalPages = Math.ceil(total / pageSize);

  const notifications = db
    .prepare(
      `
          SELECT notifications.id, notifications.subject, notifications.message, user_notifications.seen
          FROM user_notifications
          JOIN notifications ON user_notifications.notification_id = notifications.id
          WHERE user_notifications.user_id = ?
            AND (notifications.subject LIKE ? OR notifications.message LIKE ?)
          ORDER BY notifications.id DESC
          LIMIT ? OFFSET ?
        `
    )
    .all(userId, searchQuery, searchQuery, pageSize, offset);

  return {
    notifications,
    total,
    page,
    pageSize,
    totalPages,
  } as PaginatedNotifications;
}
