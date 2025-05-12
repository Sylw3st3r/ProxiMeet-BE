const sql = require("better-sqlite3");
const db = sql("event-planer.db");

db.prepare(
  `
   CREATE TABLE IF NOT EXISTS users (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       firstName TEXT NOT NULL,
       lastName TEXT NOT NULL,
       email TEXT NOT NULL,
       password TEXT NOT NULL
    )
`
).run();

db.prepare(
  `
   CREATE TABLE IF NOT EXISTS event (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       organizerId INTEGER NOT NULL,
       name TEXT NOT NULL,
       description TEXT NOT NULL,
       location TEXT NOT NULL,
       img TEXT NOT NULL,
       FOREIGN KEY (organizerId) REFERENCES users(id)
    )
`
).run();
