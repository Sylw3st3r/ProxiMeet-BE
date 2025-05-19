import Database from "better-sqlite3";
const db = Database("event-planer.db");

db.prepare(
  `
   CREATE TABLE IF NOT EXISTS users (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       firstName TEXT NOT NULL,
       lastName TEXT NOT NULL,
       email TEXT NOT NULL,
       password TEXT NOT NULL,
       verified INTEGER DEFAULT 0,
       verification_token TEXT,
       token_expires_at INTEGER,
       password_reset_token TEXT,
       password_reset_token_expires_at INTEGER
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
       image TEXT NOT NULL,
       lat REAL,
       lng REAL,
       FOREIGN KEY (organizerId) REFERENCES users(id)
    )
`
).run();

db.prepare(
  `
   CREATE TABLE IF NOT EXISTS refresh_tokens (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    token TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`
).run();
