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
  sender_id: number | null;
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

  return {
    id: result.lastInsertRowid as number,
    event_id: eventId,
    sender_id: senderId,
    message,
    timestamp,
  };
}

export function getTopEventsByUnreadMessages(userId: number): {
  event_id: number;
  event_name: string;
  unread_count: number;
}[] {
  return db
    .prepare(
      `
      SELECT 
        cm.event_id,
        e.name as event_name,
        COUNT(*) as unread_count
      FROM chat_message cm
      JOIN event e ON cm.event_id = e.id
      JOIN event_membership em ON em.event_id = cm.event_id
      LEFT JOIN message_reads mrs
        ON cm.id = mrs.message_id AND mrs.user_id = ?
      WHERE mrs.read_at IS NULL AND em.user_id = ? AND em.left_at IS NULL
      GROUP BY cm.event_id
      ORDER BY unread_count DESC
      LIMIT 20
    `
    )
    .all(userId, userId) as {
    event_id: number;
    event_name: string;
    unread_count: number;
  }[];
}

export function getTotalUnreadMessagesCount(userId: number): number {
  const { unread_count } = db
    .prepare(
      `
    SELECT COUNT(*) AS unread_count
    FROM chat_message cm
    JOIN event_membership em ON em.event_id = cm.event_id AND em.user_id = ?
    LEFT JOIN message_reads mrs ON cm.id = mrs.message_id AND mrs.user_id = ?
    WHERE mrs.read_at IS NULL
      AND (
        (em.left_at IS NULL)
        OR
        (em.left_at IS NOT NULL AND cm.timestamp <= em.left_at)
      )
    `
    )
    .get(userId, userId) as { unread_count: number };

  return unread_count;
}

type ChatMessage = {
  id: number;
  event_id: number;
  sender_id: number | null;
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
  // Base query selecting messages user has access to
  let baseQuery = `
    SELECT cm.id, cm.event_id, cm.sender_id, cm.message, cm.timestamp
    FROM chat_message cm
    JOIN event_membership em ON cm.event_id = em.event_id AND em.user_id = ?
    WHERE cm.event_id = ?
  `;

  const params: (number | string)[] = [userId, eventId];

  if (messageId) {
    // Load messages with id less than messageId (older messages)
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
    sender_id: number;
    message: string;
    timestamp: string;
  }[];

  // Reverse the results so that oldest message is first and newest last
  // This keeps the natural ascending order in the UI from top to bottom
  const messages = result.reverse();

  return {
    messages: messages.slice(-20),
    hasMore: result.length > 20,
  };
}

export function getEventsByUnreadMessagesForUser(userId: number): {
  event_id: number;
  event_name: string;
  unread_count: number;
}[] {
  return db
    .prepare(
      `
      SELECT 
        cm.event_id,
        e.name AS event_name,
        COUNT(*) AS unread_count
      FROM chat_message cm
      JOIN event e ON cm.event_id = e.id
      JOIN event_membership em ON em.event_id = cm.event_id AND em.user_id = ?
      LEFT JOIN message_reads mrs ON cm.id = mrs.message_id AND mrs.user_id = ?
      WHERE mrs.read_at IS NULL
        AND (
          em.left_at IS NULL
          OR (em.left_at IS NOT NULL AND cm.timestamp <= em.left_at)
        )
      GROUP BY cm.event_id
      ORDER BY unread_count DESC
    `
    )
    .all(userId, userId) as {
    event_id: number;
    event_name: string;
    unread_count: number;
  }[];
}
export function getPaginatedEventsByUnreadMessagesForUser(
  userId: number,
  page: number,
  pageSize: number
): {
  events: {
    event_id: number;
    event_name: string;
    unread_count: number;
  }[];
  currentPage: number;
  totalPages: number;
} {
  const totalUnreadEvents = db
    .prepare(
      `
      SELECT COUNT(DISTINCT cm.event_id) AS total
      FROM chat_message cm
      JOIN event_membership em ON em.event_id = cm.event_id AND em.user_id = ?
      LEFT JOIN message_reads mrs ON cm.id = mrs.message_id AND mrs.user_id = ?
      WHERE mrs.read_at IS NULL
        AND (
          em.left_at IS NULL
          OR (em.left_at IS NOT NULL AND cm.timestamp <= em.left_at)
        )
    `
    )
    .get(userId, userId) as { total: number };

  const totalPages = Math.ceil(totalUnreadEvents.total / pageSize);

  const events = db
    .prepare(
      `
      SELECT 
        cm.event_id,
        e.name AS event_name,
        COUNT(*) AS unread_count
      FROM chat_message cm
      JOIN event e ON cm.event_id = e.id
      JOIN event_membership em ON em.event_id = cm.event_id AND em.user_id = ?
      LEFT JOIN message_reads mrs ON cm.id = mrs.message_id AND mrs.user_id = ?
      WHERE mrs.read_at IS NULL
        AND (
          em.left_at IS NULL
          OR (em.left_at IS NOT NULL AND cm.timestamp <= em.left_at)
        )
      GROUP BY cm.event_id
      ORDER BY unread_count DESC
      LIMIT ? OFFSET ?
    `
    )
    .all(userId, userId, pageSize, (page - 1) * pageSize) as {
    event_id: number;
    event_name: string;
    unread_count: number;
  }[];

  return {
    events,
    currentPage: page,
    totalPages,
  };
}
