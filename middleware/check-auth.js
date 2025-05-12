const jwt = require("jsonwebtoken");
const Error = require("../models/error");

module.exports = (req, res, next) => {
  try {
    if (
      !req.headers.authorization ||
      !req.headers.authorization.split(" ")[1]
    ) {
      next(new Error("Unauthorized! No token has been provided!"));
    }
    const token = req.headers.authorization.split(" ")[1];
    const tokenData = jwt.verify(token, "SECRETKEY");
    req.tokenData = { userId: tokenData.userId };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new Error("Unauthorized! Provided token has expired!"));
    } else {
      next(new Error("Unauthorized!"));
    }
  }
};
