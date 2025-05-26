import { Request, Response, NextFunction } from "express";
import { VerifiedUserRequest } from "../models/verified-user-request";
import { verifyAccessToken } from "../utils/auth";
import HttpError from "../models/error";

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
    const tokenData = verifyAccessToken(token);
    (req as VerifiedUserRequest).tokenData = { userId: tokenData.userId };
    next();
  } catch (error) {
    next(new HttpError("Unauthorized", 403));
  }
}
