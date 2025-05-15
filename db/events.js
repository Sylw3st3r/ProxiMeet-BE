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

const getAllEvents = () => {
  return db.prepare("SELECT * FROM event").all();
};

const getAllUserEvents = (organizerId) => {
  return db
    .prepare(
      `
        SELECT * FROM event WHERE organizerId = ?
    `
    )
    .all(Number(organizerId));
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

const getAllEventsInRadius = (lat, lng, radius) => {
  const radiusKm = 50;
  const userLat = 50.07855618144556;
  const userLng = 19.933233261108402;

  return db
    .prepare(
      `
    SELECT *, (
      6371 * acos(
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

exports.getAllEventsInRadius = getAllEventsInRadius;
exports.addEvent = addEvent;
exports.editEvent = editEvent;
exports.getAllEvents = getAllEvents;
exports.getEvent = getEvent;
exports.getAllUserEvents = getAllUserEvents;
