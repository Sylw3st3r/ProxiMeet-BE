const sql = require("better-sqlite3");
const db = sql("event-planer.db");

const getEvent = (id) => {
  return db
    .prepare(
      `
        SELECT * FROM event WHERE id = ?
    `
    )
    .get(Number(id));
};

const addEvent = (organizerId, name, description, image, lat, lng) => {
  db.prepare(
    `
        INSERT INTO event (organizerId, name, description, image, lat, lng)
        VALUES (?, ?, ?, ?, ?, ?)
      `
  ).run(
    Number(organizerId),
    name,
    description,
    image,
    Number(lat),
    Number(lng)
  );
};

const editEvent = (eventId, name, description, image, lat, lng) => {
  db.prepare(
    `
      UPDATE event
      SET name = ?, description = ?, image = ?, lat = ?, lng = ?
      WHERE id = ?
    `
  ).run(name, description, image, Number(lat), Number(lng), Number(eventId));
};

db.function("radians", (deg) => deg * (Math.PI / 180));
db.function("cos", Math.cos);
db.function("sin", Math.sin);
db.function("acos", Math.acos);

const getEventsWithinRadius = (lat, lng, radius, unit) => {
  const earthRadius = unit === "km" ? 6371 : 3958.8; // Kilometers or Miles

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
    .all(Number(lat), Number(lng), Number(lat), Number(radius));
};

function getPaginatedEvents(
  search = "",
  page = 1,
  pageSize = 10,
  organizerId = null
) {
  const rows = db
    .prepare(
      `
    SELECT * FROM event
    WHERE name LIKE @search OR description LIKE @search
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
    });

  const countStmt = db.prepare(`
    SELECT COUNT(*) AS total FROM event
    WHERE name LIKE @search OR description LIKE @search
     ${organizerId !== null ? "AND organizerId = @organizerId" : ""}
  `);
  const { total } = countStmt.get({ search: `%${search}%`, organizerId });

  return {
    events: rows,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

exports.getEventsWithinRadius = getEventsWithinRadius;
exports.getPaginatedEvents = getPaginatedEvents;
exports.addEvent = addEvent;
exports.editEvent = editEvent;
exports.getEvent = getEvent;
