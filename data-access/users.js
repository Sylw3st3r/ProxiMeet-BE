const sql = require("better-sqlite3");
const db = sql("event-planer.db");

const getUsers = () => {
  return db.prepare("SELECT * FROM users").all();
};

const findUser = (email) => {
  const getUserByEmail = db.prepare(`
        SELECT * FROM users WHERE email = ?
      `);

  return getUserByEmail.get(email);
};

const addUser = (firstName, lastName, email, password) => {
  const insert = db.prepare(`
        INSERT INTO users (firstName, lastName, email, password)
        VALUES (?, ?, ?, ?)
      `);

  insert.run(firstName, lastName, email, password);
};

exports.getUsers = getUsers;
exports.findUser = findUser;
exports.addUser = addUser;
