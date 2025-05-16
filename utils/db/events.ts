import Database from "better-sqlite3";
import { Event, EventWithDistance, PaginatedEvents } from "../../models/event";

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
  lng: number
): void {
  db.prepare(
    `
      INSERT INTO event (organizerId, name, description, image, lat, lng)
      VALUES (?, ?, ?, ?, ?, ?)
    `
  ).run(organizerId, name, description, image, lat, lng);
}

export function editEvent(
  eventId: number,
  name: string,
  description: string,
  image: string,
  lat: number,
  lng: number
): void {
  db.prepare(
    `
      UPDATE event
      SET name = ?, description = ?, image = ?, lat = ?, lng = ?
      WHERE id = ?
    `
  ).run(name, description, image, lat, lng, eventId);
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
  organizerId: number | null = null
): PaginatedEvents {
  const rows = db
    .prepare(
      `
      SELECT * FROM event
      WHERE (name LIKE @search OR description LIKE @search)
      ${organizerId !== null ? "AND organizerId = @organizerId" : ""}
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
    ${organizerId !== null ? "AND organizerId = @organizerId" : ""}
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
