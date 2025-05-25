import { User } from "../../models/user";
import Database from "better-sqlite3";

const db = Database("event-planer.db");

export function getUsers(): User[] {
  return db.prepare("SELECT * FROM users").all() as User[];
}

export function findUserByEmail(email: string): User | undefined {
  return db
    .prepare(
      `
      SELECT * FROM users WHERE email = ?
    `
    )
    .get(email) as User | undefined;
}

export function findUserById(id: number): User | undefined {
  return db
    .prepare(
      `
      SELECT * FROM users WHERE id = ?
    `
    )
    .get(id) as User | undefined;
}

export function findUserByToken(token: string): User | undefined {
  return db
    .prepare(
      `
      SELECT * FROM users WHERE verification_token = ?
    `
    )
    .get(token) as User | undefined;
}

export function findUserByPasswordResetToken(token: string): User | undefined {
  return db
    .prepare(
      `
      SELECT * FROM users WHERE password_reset_token = ?
    `
    )
    .get(token) as User | undefined;
}

export function verifyUser(id: number): void {
  db.prepare(
    `
    UPDATE users SET verified = 1 WHERE id = ?
  `
  ).run(id);
}

export function setPasswordResetToken(
  id: number,
  token: string,
  tokenExpiresAt: number
): void {
  db.prepare(
    `
    UPDATE users SET password_reset_token = ?, password_reset_token_expires_at = ? WHERE id = ?
  `
  ).run(token, tokenExpiresAt, id);
}

export function resetPassword(id: number, password: string): void {
  db.prepare(
    `
    UPDATE users SET password_reset_token = NULL, password_reset_token_expires_at = NULL, password = ? WHERE id = ?
  `
  ).run(password, id);
}

export function addUser(
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  token: string,
  tokenExpiresAt: number
): { lastInsertRowid: number } {
  return db
    .prepare(
      `
    INSERT INTO users (firstName, lastName, email, password, verification_token, token_expires_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `
    )
    .run(firstName, lastName, email, password, token, tokenExpiresAt) as {
    lastInsertRowid: number;
  };
}

export function updateUserName(
  id: number,
  firstName: string,
  lastName: string
): void {
  db.prepare(
    `
    UPDATE users SET firstName = ?, lastName = ? WHERE id = ?
  `
  ).run(firstName, lastName, id);
}

export function updateUserEmail(id: number, email: string): void {
  db.prepare(
    `
    UPDATE users SET email = ? WHERE id = ?
  `
  ).run(email, id);
}

export function updateUserPassword(id: number, password: string): void {
  db.prepare(
    `
    UPDATE users SET password = ? WHERE id = ?
  `
  ).run(password, id);
}

export function updateUserAvatar(id: number, avatar: string): void {
  db.prepare(
    `
    UPDATE users SET avatar = ? WHERE id = ?
  `
  ).run(avatar, id);
}
