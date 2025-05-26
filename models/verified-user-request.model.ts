import { Request } from "express";

export interface VerifiedUserRequest<T = any> extends Request<T> {
  tokenData: {
    userId: number;
  };
}
