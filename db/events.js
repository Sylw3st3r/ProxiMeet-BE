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

const addEvent = (organizerId, name, description, location, image) => {
  db.prepare(
    `
        INSERT INTO event (organizerId, name, description, location, image)
        VALUES (?, ?, ?, ?, ?)
      `
  ).run(Number(organizerId), name, description, location, image);
};

exports.addEvent = addEvent;
exports.getAllEvents = getAllEvents;
exports.getEvent = getEvent;
exports.getAllUserEvents = getAllUserEvents;
