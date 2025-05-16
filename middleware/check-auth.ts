import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { VerifiedUserRequest } from "../models/verified-user-request";

export function checkAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (
      !req.headers.authorization ||
      !req.headers.authorization.split(" ")[1]
    ) {
      next(new Error("Unauthorized! No token has been provided!"));
    }
    const authorizationHeader = req.headers.authorization;
    if (!authorizationHeader) {
      next(new Error("Unauthorized! No token has been provided!"));
      return;
    }
    const token = authorizationHeader.split(" ")[1];
    const tokenData = jwt.verify(token, "SECRETKEY") as { userId: number };
    (req as VerifiedUserRequest).tokenData = { userId: tokenData.userId };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new Error("Unauthorized! Provided token has expired!"));
    } else {
      next(new Error("Unauthorized!"));
    }
  }
}
