const jwt = require("jsonwebtoken");

const ACCESS_SECRET = "SECRETKEY";
const REFRESH_SECRET = "REFRESHSECRETKEY";

export function generateAccessToken(id: number) {
  return jwt.sign({ userId: id }, ACCESS_SECRET, { expiresIn: "15m" });
}

export function generateRefreshToken(id: number) {
  return jwt.sign({ userId: id }, REFRESH_SECRET, { expiresIn: "7d" });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, ACCESS_SECRET) as { userId: number };
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, REFRESH_SECRET) as { userId: number };
}
