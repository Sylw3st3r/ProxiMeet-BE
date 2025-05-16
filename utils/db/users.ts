import { User } from "../../models/user";
import { generateToken } from "../token";
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

export function verifyUser(id: number): void {
  db.prepare(
    `
    UPDATE users SET verified = 1 WHERE id = ?
  `
  ).run(id);
}

export function addUser(
  firstName: string,
  lastName: string,
  email: string,
  password: string
): { lastInsertRowid: number } {
  const token = generateToken();
  const tokenExpiresAt = Math.floor(Date.now() / 1000) + 3600;

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
