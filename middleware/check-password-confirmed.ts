import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { VerifiedUserRequest } from "../models/verified-user-request";
import bcrypt from "bcryptjs";
import HttpError from "../models/error";
import { findUserById } from "../utils/db/users";
import * as yup from "yup";

export async function checkPasswordConfirmedMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Schema for the add event request data
    const passwordConfirmationSchema = yup.object({
      body: yup.object({
        confirmationPassword: yup
          .string()
          .required("Confirmation password is required"),
      }),
      tokenData: yup.object({
        userId: yup.number().required("Missing user ID"),
      }),
    });

    // Validation of the request data
    const validated = await passwordConfirmationSchema.validate(
      {
        body: req.body,
        tokenData: (req as VerifiedUserRequest).tokenData,
      },
      { abortEarly: false }
    );

    // If validation is successful, we extract the data
    const {
      body: { confirmationPassword },
      tokenData: { userId },
    } = validated;

    const user = findUserById(userId);

    if (!user) {
      return next(new HttpError("User not found!", 404));
    }

    const isValidPassword = await bcrypt.compare(
      confirmationPassword,
      user.password
    );

    if (!isValidPassword) {
      return next(new HttpError("Invalid password confirmation!", 401));
    }

    next();
  } catch (error) {
    console.log("AAA");
    next(new HttpError("Something went wrong!"));
  }
}
