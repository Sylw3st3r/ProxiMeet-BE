import Database from "better-sqlite3";
import {
  Event,
  EventWithDistance,
  PaginatedEvents,
  EventWithAttendance,
  PaginatedEventsWithAttendance,
} from "../../models/event";
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
  return db
    .prepare(
      `
      SELECT * FROM event WHERE id = ?
    `
    )
    .get(id) as Event | undefined;
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
    `
      INSERT INTO event (organizerId, name, description, image, lat, lng, start, end)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
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
    `
      UPDATE event
      SET name = ?, description = ?, image = ?, lat = ?, lng = ?, start = ?, end = ?
      WHERE id = ?
    `
  ).run(name, description, image, lat, lng, start, end, eventId);
}

// Custom SQLite functions
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
      WHERE distance <= ?
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
          WHEN ea.user_id IS NOT NULL THEN 1 
          ELSE 0 
        END AS attending
      FROM event e
      LEFT JOIN event_attendance ea 
        ON e.id = ea.event_id AND ea.user_id = @userId
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

  const countStmt = db.prepare(`
    SELECT COUNT(*) AS total FROM event
    WHERE (name LIKE @search OR description LIKE @search)
  `);

  const { total } = countStmt.get({
    search: `%${search}%`,
  }) as { total: number };

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

  const countStmt = db.prepare(`
    SELECT COUNT(*) AS total FROM event
    WHERE (name LIKE @search OR description LIKE @search)
    AND organizerId = @organizerId
  `);

  const { total } = countStmt.get({
    search: `%${search}%`,
    organizerId,
  }) as { total: number };

  return {
    events: rows,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

// Check if user is attending some events in a time range
export function checkEventOverlap(
  userId: number,
  newStart: string,
  newEnd: string
): Event[] {
  return db
    .prepare(
      `
    SELECT e.*
    FROM event_attendance ea
    JOIN event e ON ea.event_id = e.id
    WHERE ea.user_id = ?
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
    FROM event_attendance
    WHERE user_id = ? AND event_id = ?
  `
    )
    .get(userId, eventId);
}

export function getAllEventsAttendedByUser(userId: number): Event[] {
  return db
    .prepare(
      `
    SELECT e.id, e.name, e.start, ea.intention
    FROM event_attendance ea
    JOIN event e ON e.id = ea.event_id
    WHERE ea.user_id = ?
  `
    )
    .all(userId) as Event[];
}

export function addAttendanceForEvent(userId: number, eventId: number): void {
  db.prepare(
    `
    INSERT OR REPLACE INTO event_attendance (user_id, event_id)
    VALUES (?, ?)
  `
  ).run(userId, eventId);
}

export function deleteAttendanceForEvent(
  userId: number,
  eventId: number
): void {
  db.prepare(
    `
    DELETE FROM event_attendance
    WHERE user_id = ? AND event_id = ?
  `
  ).run(userId, eventId);
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

  // Calculate time range
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
    LEFT JOIN event_attendance ea ON e.id = ea.event_id
    WHERE (e.organizerId = @userId OR ea.user_id = @userId)
      AND e.start >= @startIso AND e.start < @endIso
    ORDER BY e.start ASC
  `);

  return stmt.all({ userId, startIso, endIso }) as Event[];
}
