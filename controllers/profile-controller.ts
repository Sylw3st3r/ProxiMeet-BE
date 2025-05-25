import bcrypt from "bcryptjs";
import {
  updateUserAvatar,
  updateUserEmail,
  updateUserName,
  updateUserPassword,
} from "../utils/db/users";
import HttpError from "../models/error";
import { Response, NextFunction, Request } from "express";
import * as yup from "yup";
import { VerifiedUserRequest } from "../models/verified-user-request";

export async function changeBasicDataController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const signupSchema = yup.object({
    body: yup.object({
      firstName: yup.string().required("First name is required"),
      lastName: yup.string().required("Last name is required"),
    }),
    tokenData: yup.object({
      userId: yup.number().required("Missing user ID"),
    }),
  });

  try {
    // Validation of the request data
    const validated = await signupSchema.validate(
      {
        body: req.body,
        tokenData: (req as VerifiedUserRequest).tokenData,
      },
      { abortEarly: false }
    );

    // If validation is successful, we extract the data
    const {
      body: { firstName, lastName },
      tokenData: { userId },
    } = validated;

    updateUserName(userId, firstName, lastName);

    res.status(200).json({ firstName, lastName });
  } catch (err) {
    // Handle validation errors
    if (err instanceof yup.ValidationError) {
      return next(new HttpError(err.errors.join(", "), 422));
    }
    return next(new Error("Something went wrong! Please try again later."));
  }
}

export async function changeEmailController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const signupSchema = yup.object({
    body: yup.object({
      email: yup.string().required("Email is required").email("Invalid email"),
    }),
    tokenData: yup.object({
      userId: yup.number().required("Missing user ID"),
    }),
  });

  try {
    // Validation of the request data
    const validated = await signupSchema.validate(
      {
        body: req.body,
        tokenData: (req as VerifiedUserRequest).tokenData,
      },
      { abortEarly: false }
    );

    // If validation is successful, we extract the data
    const {
      body: { email },
      tokenData: { userId },
    } = validated;

    updateUserEmail(userId, email);

    res.status(201).json({});
  } catch (err) {
    // Handle validation errors
    if (err instanceof yup.ValidationError) {
      return next(new HttpError(err.errors.join(", "), 422));
    }
    return next(new Error("Something went wrong! Please try again later."));
  }
}

export async function changePasswordController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const signupSchema = yup.object({
    body: yup.object({
      password: yup.string().required("Password is required"),
      matchingPassword: yup
        .string()
        .required("Matching password is required")
        .test("passwords-match", "Passwords do not match", function (value) {
          return this.parent.password === value;
        }),
    }),
    tokenData: yup.object({
      userId: yup.number().required("Missing user ID"),
    }),
  });

  try {
    // Validation of the request data
    const validated = await signupSchema.validate(
      {
        body: req.body,
        tokenData: (req as VerifiedUserRequest).tokenData,
      },
      { abortEarly: false }
    );

    // If validation is successful, we extract the data
    const {
      body: { password },
      tokenData: { userId },
    } = validated;

    // Hash the password
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 12);
    } catch (err) {
      return next(new Error());
    }

    updateUserPassword(userId, hashedPassword);

    res.status(201).json({});
  } catch (err) {
    // Handle validation errors
    if (err instanceof yup.ValidationError) {
      return next(new HttpError(err.errors.join(", "), 422));
    }
    return next(new Error("Something went wrong! Please try again later."));
  }
}

export async function changeAvatarController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const signupSchema = yup.object({
    file: yup.object({
      filename: yup.string().required("Image is required"),
    }),
    tokenData: yup.object({
      userId: yup.number().required("Missing user ID"),
    }),
  });

  try {
    // Validation of the request data
    const validated = await signupSchema.validate(
      {
        file: req.file,
        tokenData: (req as VerifiedUserRequest).tokenData,
      },
      { abortEarly: false }
    );

    // If validation is successful, we extract the data
    const {
      file: { filename },
      tokenData: { userId },
    } = validated;

    updateUserAvatar(userId, filename);

    res.status(200).json({ avatar: filename });
  } catch (err) {
    // Handle validation errors
    if (err instanceof yup.ValidationError) {
      return next(new HttpError(err.errors.join(", "), 422));
    }

    console.log(err);

    return next(new Error("Something went wrong! Please try again later."));
  }
}
