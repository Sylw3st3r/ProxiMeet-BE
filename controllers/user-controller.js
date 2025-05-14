const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Error = require("../models/error");
const usersDataAccess = require("../db/users");
const emailService = require("../utils/email");

const signup = async (req, res, next) => {
  const { firstName, lastName, email, password, matchingPassword } = req.body;

  // Check if address email is taken
  const user = usersDataAccess.findUserByEmail(email);
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

  const { lastInsertRowid } = usersDataAccess.addUser(
    firstName,
    lastName,
    email,
    hashedPassword
  );
  const newestUser = usersDataAccess.findUserById(lastInsertRowid);

  emailService.sendVerificationEmail(email, newestUser.verification_token);

  res.status(201).json({});
};

const signin = async (req, res, next) => {
  const { email, password } = req.body;

  // Check if such user exists
  const user = usersDataAccess.findUserByEmail(email);
  if (!user) {
    return next(new Error("Wrong password or address email!"));
  }

  if (!user.verified) {
    console.log(user);
    return next(new Error("Account is not verfied!"));
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

const verify = async (req, res, next) => {
  if (!req.params.token) {
    return next(new Error("No token provided!"));
  }

  const user = usersDataAccess.findUserByToken(req.params.token);

  if (!user) {
    return next(
      new Error({
        message: "No user with such token!",
        generateNewToken: false,
      })
    );
  }

  if (user.verified) {
    res.status(200).json({});
  }

  const now = Math.floor(Date.now() / 1000);
  if (user.token_expires_at < now) {
    return next(
      new Error({
        message: "Verification link has expired. Generate a new one!",
        generateNewToken: true,
      })
    );
  }

  try {
    usersDataAccess.verifyUser(user.id);
  } catch (err) {
    return next(new Error({ message: err.message, generateNewToken: false }));
  }

  res.status(200).json({});
};

exports.signup = signup;
exports.signin = signin;
exports.verify = verify;
