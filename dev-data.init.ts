import Database from "better-sqlite3";
const db = Database("event-planer.db");

const users = [
  {
    firstName: "Alice",
    lastName: "Johnson",
    email: "alice@example.com",
    password: "haslo",
    verified: 1,
  },
  {
    firstName: "Bob",
    lastName: "Smith",
    email: "bob@example.com",
    password: "haslo",
    verified: 1,
  },
  {
    firstName: "Charlie",
    lastName: "Brown",
    email: "charlie@example.com",
    password: "haslo",
    verified: 0,
  },
];

const insertUser = db.prepare(`
    INSERT INTO users (firstName, lastName, email, password, verified)
    VALUES (@firstName, @lastName, @email, @password, @verified)
  `);

const saltRounds = 12;
import bcrypt from "bcryptjs";

const addUser = async (user: any) => {
  user.password = await bcrypt.hash(user.password, saltRounds);
  insertUser.run(user);
};

for (const user of users) {
  addUser(user);
}
