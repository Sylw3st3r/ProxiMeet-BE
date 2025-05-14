const sql = require("better-sqlite3");
const db = sql("event-planer.db");
const generateToken = require("../utils/token").generateToken;

const getUsers = () => {
  return db.prepare("SELECT * FROM users").all();
};

const findUserByEmail = (email) => {
  return db
    .prepare(
      `
        SELECT * FROM users WHERE email = ?
      `
    )
    .get(email);
};

const findUserById = (id) => {
  return db
    .prepare(
      `
        SELECT * FROM users WHERE id = ?
      `
    )
    .get(id);
};

const findUserByToken = (token) => {
  return db
    .prepare(
      `
          SELECT * FROM users WHERE verification_token = ?
        `
    )
    .get(token);
};

const verifyUser = (id) => {
  return db
    .prepare(
      `
    UPDATE users SET verified = 1 WHERE id = ?
`
    )
    .run(id);
};

const addUser = (firstName, lastName, email, password) => {
  const token = generateToken();
  const tokenExpiresAt = Math.floor(Date.now() / 1000) + 3600; // 1 minute from now

  return db
    .prepare(
      `
    INSERT INTO users (firstName, lastName, email, password, verification_token, token_expires_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `
    )
    .run(firstName, lastName, email, password, token, tokenExpiresAt);
};

exports.getUsers = getUsers;
exports.findUserByEmail = findUserByEmail;
exports.findUserById = findUserById;
exports.addUser = addUser;
exports.findUserByToken = findUserByToken;
exports.verifyUser = verifyUser;
