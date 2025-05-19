import Database from "better-sqlite3";

const db = Database("event-planer.db");

export function saveRefreshToken(userId: number, token: string) {
  return db
    .prepare("INSERT INTO refresh_tokens (user_id, token) VALUES (?, ?)")
    .run(userId, token);
}

export function revokeToken(token: string) {
  db.prepare("DELETE FROM refresh_tokens WHERE token = ?").run(token);
}

export function getRefreshToken(token: string): unknown | undefined {
  return db.prepare("SELECT * FROM refresh_tokens WHERE token = ?").get(token);
}
