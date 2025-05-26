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
       avatar TEXT,
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
       start TEXT,
       end TEXT,
       FOREIGN KEY (organizerId) REFERENCES users(id) ON DELETE CASCADE
    )
`
).run();

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS event_attendance (
    user_id INTEGER NOT NULL,
    event_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, event_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES event(id) ON DELETE CASCADE
  )
  `
).run();

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    sent_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`
).run();

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS user_notifications (
    user_id INTEGER NOT NULL,
    notification_id INTEGER NOT NULL,
    seen INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, notification_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE
  );
`
).run();
