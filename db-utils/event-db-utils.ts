import Database from "better-sqlite3";
import {
  Event,
  EventWithDistance,
  PaginatedEvents,
  EventWithAttendance,
  PaginatedEventsWithAttendance,
} from "../models/event.model";
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";

const db = Database("event-planer.db");

export function getEvent(id: number): Event | undefined {
  return db.prepare(`SELECT * FROM event WHERE id = ?`).get(id) as
    | Event
    | undefined;
}

export function addEvent(
  organizerId: number,
  name: string,
  description: string,
  image: string,
  lat: number,
  lng: number,
  start: string,
  end: string
): void {
  db.prepare(
    `INSERT INTO event (organizerId, name, description, image, lat, lng, start, end)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(organizerId, name, description, image, lat, lng, start, end);
}

export function editEvent(
  eventId: number,
  name: string,
  description: string,
  image: string,
  lat: number,
  lng: number,
  start: string,
  end: string
): void {
  db.prepare(
    `UPDATE event SET name = ?, description = ?, image = ?, lat = ?, lng = ?, start = ?, end = ?
     WHERE id = ?`
  ).run(name, description, image, lat, lng, start, end, eventId);
}

db.function("radians", (deg: number) => deg * (Math.PI / 180));
db.function("cos", Math.cos);
db.function("sin", Math.sin);
db.function("acos", Math.acos);

export function getEventsWithinRadius(
  lat: number,
  lng: number,
  radius: number,
  unit: "km" | "mi"
): EventWithDistance[] {
  const earthRadius = unit === "km" ? 6371 : 3958.8;

  return db
    .prepare(
      `
    SELECT *, (
      ${earthRadius} * acos(
        cos(radians(?)) * cos(radians(lat)) *
        cos(radians(lng) - radians(?)) +
        sin(radians(?)) * sin(radians(lat))
      )
    ) AS distance
    FROM event
    HAVING distance <= ?
    ORDER BY distance ASC
  `
    )
    .all(lat, lng, lat, radius) as EventWithDistance[];
}

export function getPaginatedEvents(
  search: string,
  page: number,
  pageSize: number,
  userId: number
): PaginatedEventsWithAttendance {
  const rows = db
    .prepare(
      `
    SELECT 
      e.*, 
      CASE 
        WHEN em.user_id IS NOT NULL AND em.left_at IS NULL THEN 1 
        ELSE 0 
      END AS attending
    FROM event e
    LEFT JOIN event_membership em 
      ON e.id = em.event_id AND em.user_id = @userId
    WHERE (e.name LIKE @search OR e.description LIKE @search)
    GROUP BY e.id
    ORDER BY e.id DESC
    LIMIT @limit OFFSET @offset
  `
    )
    .all({
      search: `%${search}%`,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      userId,
    }) as (Event & { attending: number })[];

  const { total } = db
    .prepare(
      `
    SELECT COUNT(*) AS total FROM event
    WHERE (name LIKE @search OR description LIKE @search)
  `
    )
    .get({ search: `%${search}%` }) as { total: number };

  const events: EventWithAttendance[] = rows.map((row) => ({
    ...row,
    attending: !!row.attending,
  }));

  return {
    events,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

export function getOwnPaginatedEvents(
  search: string,
  page: number,
  pageSize: number,
  organizerId: number
): PaginatedEvents {
  const rows = db
    .prepare(
      `
    SELECT * FROM event
    WHERE (name LIKE @search OR description LIKE @search)
    AND organizerId = @organizerId
    ORDER BY id DESC
    LIMIT @limit OFFSET @offset
  `
    )
    .all({
      search: `%${search}%`,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      organizerId,
    }) as Event[];

  const { total } = db
    .prepare(
      `
    SELECT COUNT(*) AS total FROM event
    WHERE (name LIKE @search OR description LIKE @search)
    AND organizerId = @organizerId
  `
    )
    .get({ search: `%${search}%`, organizerId }) as { total: number };

  return {
    events: rows,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

export function checkEventOverlap(
  userId: number,
  newStart: string,
  newEnd: string
): Event[] {
  return db
    .prepare(
      `
    SELECT e.*
    FROM event_membership em
    JOIN event e ON em.event_id = e.id
    WHERE em.user_id = ?
      AND e.start < ?
      AND e.end > ?
  `
    )
    .all(userId, newEnd, newStart) as Event[];
}

export function getAttendance(userId: number, eventId: number) {
  return db
    .prepare(
      `
    SELECT *
    FROM event_membership
    WHERE user_id = ? AND event_id = ? AND left_at IS NULL
  `
    )
    .get(userId, eventId);
}

export function getAllEventsAttendedByUser(userId: number): Event[] {
  return db
    .prepare(
      `
    SELECT e.id, e.name, e.start
    FROM event_membership em
    JOIN event e ON e.id = em.event_id
    WHERE em.user_id = ? AND em.left_at IS NULL
  `
    )
    .all(userId) as Event[];
}

export function addAttendanceForEvent(userId: number, eventId: number): void {
  db.prepare(
    `
    INSERT INTO event_membership (user_id, event_id, joined_at, left_at)
    VALUES (?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), NULL)
    ON CONFLICT(user_id, event_id) DO UPDATE 
      SET left_at = NULL, joined_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    `
  ).run(userId, eventId);
}

export function deleteAttendanceForEvent(
  userId: number,
  eventId: number
): void {
  const leftAt = new Date().toISOString();

  db.prepare(
    `
    UPDATE event_membership
    SET left_at = ?
    WHERE user_id = ? AND event_id = ? AND left_at IS NULL
  `
  ).run(leftAt, userId, eventId);
}

export function deleteEvent(id: number): void {
  db.prepare("DELETE FROM event WHERE id = ?").run(id);
}

export function getScheduledEventsForUser(
  userId: number,
  start: Date,
  range: "day" | "week" | "month" = "day"
): Event[] {
  let startDate, endDate;

  switch (range) {
    case "day":
      startDate = startOfDay(start);
      endDate = endOfDay(start);
      break;
    case "week":
      startDate = startOfWeek(start);
      endDate = endOfWeek(start);
      break;
    case "month":
      startDate = startOfMonth(start);
      endDate = endOfMonth(start);
      break;
    default:
      throw new Error("Invalid range. Use 'day', 'week', or 'month'.");
  }

  const startIso = startDate.toISOString();
  const endIso = endDate.toISOString();

  const stmt = db.prepare(`
    SELECT DISTINCT e.*
    FROM event e
    LEFT JOIN event_membership em ON e.id = em.event_id AND em.left_at IS NULL
    WHERE (e.organizerId = @userId OR em.user_id = @userId)
      AND e.start >= @startIso AND e.start < @endIso
    ORDER BY e.start ASC
  `);

  return stmt.all({ userId, startIso, endIso }) as Event[];
}

export function getEventAttendees(eventId: number): number[] {
  const rows = db
    .prepare(
      `
    SELECT user_id
    FROM event_membership
    WHERE event_id = ? AND left_at IS NULL
  `
    )
    .all(eventId) as { user_id: number }[];

  return rows.map((row) => row.user_id);
}

export function createMessageForGroup(
  eventId: number,
  senderId: number | null,
  message: string
): {
  id: number;
  event_id: number;
  sender: {
    id: number;
    firstName: string;
    lastName: string;
    avatar: string | null;
  } | null;
  message: string;
  timestamp: string;
} {
  const timestamp = new Date().toISOString();

  const result = db
    .prepare(
      `
      INSERT INTO chat_message (event_id, sender_id, message, timestamp)
      VALUES (?, ?, ?, ?)
    `
    )
    .run(eventId, senderId, message, timestamp);

  let sender: {
    id: number;
    firstName: string;
    lastName: string;
    avatar: string | null;
  } | null = null;

  if (senderId !== null) {
    const user = db
      .prepare(
        `
        SELECT firstName, lastName, avatar
        FROM users
        WHERE id = ?
      `
      )
      .get(senderId) as {
      firstName: string;
      lastName: string;
      avatar: string | null;
    } | null;

    if (user) {
      sender = {
        id: senderId,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
      };
    }

    // Mark the message as read for the sender
    db.prepare(
      `
      INSERT INTO message_reads (user_id, message_id, read_at)
      VALUES (?, ?, ?)
      ON CONFLICT(user_id, message_id) DO NOTHING
    `
    ).run(senderId, result.lastInsertRowid, timestamp);
  }

  return {
    id: result.lastInsertRowid as number,
    event_id: eventId,
    sender,
    message,
    timestamp,
  };
}
export function getUnreadEventIds(userId: number): number[] {
  const rows = db
    .prepare(
      `
    SELECT DISTINCT cm.event_id
    FROM chat_message cm
    JOIN event_membership em ON em.event_id = cm.event_id AND em.user_id = ?
    LEFT JOIN message_reads mrs ON cm.id = mrs.message_id AND mrs.user_id = ?
    WHERE mrs.read_at IS NULL
      AND cm.timestamp >= em.joined_at
      AND (
        (em.left_at IS NULL)
        OR
        (em.left_at IS NOT NULL AND cm.timestamp <= em.left_at)
      )
    `
    )
    .all(userId, userId) as { event_id: number }[];

  return rows.map((row) => row.event_id);
}
export function markAllMessagesAsReadForEvent(
  userId: number,
  eventId: number
): void {
  db.prepare(
    `
    INSERT INTO message_reads (user_id, message_id, read_at)
    SELECT ?, cm.id, strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    FROM chat_message cm
    JOIN event_membership em ON cm.event_id = em.event_id AND em.user_id = ?
    WHERE cm.event_id = ?
      AND (
        em.left_at IS NULL OR cm.timestamp <= em.left_at
      )
    ON CONFLICT(user_id, message_id) DO NOTHING
  `
  ).run(userId, userId, eventId);
}

type ChatMessage = {
  id: number;
  event_id: number;
  sender: {
    id: number;
    firstName: string;
    lastName: string;
    avatar: string | null;
  } | null;
  message: string;
};

type GetEventMessagesResult = {
  messages: ChatMessage[];
  hasMore: boolean;
};

export function getEventMessagesForUser(
  userId: number,
  eventId: number,
  messageId?: number
): GetEventMessagesResult {
  let baseQuery = `
    SELECT
      cm.id,
      cm.event_id,
      cm.sender_id,
      cm.message,
      cm.timestamp,
      u.firstName AS sender_firstName,
      u.lastName AS sender_lastName,
      u.avatar AS sender_avatar
    FROM chat_message cm
    JOIN event_membership em ON cm.event_id = em.event_id AND em.user_id = ?
    LEFT JOIN users u ON cm.sender_id = u.id
    WHERE cm.event_id = ?
  `;

  const params: (number | string)[] = [userId, eventId];

  if (messageId) {
    baseQuery += ` AND cm.id < ?`;
    params.push(messageId);
  }

  baseQuery += `
    AND (
      em.left_at IS NULL OR cm.timestamp <= em.left_at
    )
    ORDER BY cm.id DESC
    LIMIT 21
  `;

  const result = db.prepare(baseQuery).all(...params) as {
    id: number;
    event_id: number;
    sender_id: number | null;
    message: string;
    timestamp: string;
    sender_firstName: string;
    sender_lastName: string;
    sender_avatar: string;
  }[];

  const messages = result.reverse().map((row) => ({
    id: row.id,
    event_id: row.event_id,
    sender: row.sender_id
      ? {
          id: row.sender_id,
          firstName: row.sender_firstName,
          lastName: row.sender_lastName,
          avatar: row.sender_avatar,
        }
      : null,
    message: row.message,
    timestamp: row.timestamp,
  }));

  return {
    messages: messages.slice(-20),
    hasMore: result.length > 20,
  };
}

export function getPaginatedAvailableEventsForUser(
  userId: number,
  page: number,
  pageSize: number
): {
  events: {
    event_id: number;
    event_name: string;
    last_message_timestamp: number | null;
  }[];
  currentPage: number;
  totalPages: number;
} {
  // Count total distinct events user was ever part of
  const totalEventsResult = db
    .prepare(
      `
    SELECT COUNT(DISTINCT em.event_id) AS total
    FROM event_membership em
    WHERE em.user_id = ?
  `
    )
    .get(userId) as { total: number };

  const totalPages = Math.ceil(totalEventsResult.total / pageSize);

  // Get paginated events with latest accessible message timestamp
  const events = db
    .prepare(
      `
    SELECT
      e.id AS event_id,
      e.name AS event_name,
      MAX(
        CASE
          WHEN em.left_at IS NULL THEN cm.timestamp
          WHEN cm.timestamp <= em.left_at THEN cm.timestamp
          ELSE NULL
        END
      ) AS last_message_timestamp
    FROM event_membership em
    JOIN event e ON em.event_id = e.id
    LEFT JOIN chat_message cm ON cm.event_id = e.id
    WHERE em.user_id = ?
    GROUP BY e.id
    ORDER BY last_message_timestamp DESC NULLS LAST
    LIMIT ? OFFSET ?
  `
    )
    .all(userId, pageSize, (page - 1) * pageSize) as {
    event_id: number;
    event_name: string;
    last_message_timestamp: number | null;
  }[];

  return {
    events,
    currentPage: page,
    totalPages,
  };
}
