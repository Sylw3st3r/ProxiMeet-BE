const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Error = require("../models/error");
const usersDataAccess = require("../data-access/users");

const signup = async (req, res, next) => {
  const { firstName, lastName, email, password, matchingPassword } = req.body;

  // Check if address email is taken
  const user = usersDataAccess.findUser(email);
  if (user) {
    return next(new Error("User with such email already exists!"));
  }

  // Check if passwords match
  if (password !== matchingPassword) {
    return next(new Error());
  }

  // Hash the password
  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    return next(new Error());
  }

  usersDataAccess.addUser(firstName, lastName, email, hashedPassword);

  res.status(201);
};

const signin = async (req, res, next) => {
  const { email, password } = req.body;

  // Check if such user exists
  const user = usersDataAccess.findUser(email);
  if (!user) {
    return next(new Error("Wrong password or address email!"));
  }

  let isValidPassword;

  // Check if password is valid
  try {
    isValidPassword = await bcrypt.compare(password, user.password);
  } catch (err) {
    return next(new Error());
  }

  if (!isValidPassword) {
    return next(new Error("Wrong password or address email!"));
  }

  // Generate token
  let token = jwt.sign({ userId: user.id }, "SECRETKEY", { expiresIn: "1h" });

  res.status(200).json({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    token: token,
  });
};

exports.signup = signup;
exports.signin = signin;
