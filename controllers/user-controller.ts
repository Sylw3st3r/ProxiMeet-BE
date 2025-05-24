import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  addUser,
  findUserByEmail,
  findUserById,
  findUserByPasswordResetToken,
  findUserByToken,
  resetPassword,
  setPasswordResetToken,
  verifyUser,
} from "../utils/db/users";
import HttpError from "../models/error";
import { sendPasswordResetEmail, sendVerificationEmail } from "../utils/email";
import { Response, NextFunction, Request } from "express";
import * as yup from "yup";
import { generateToken } from "../utils/token";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/auth";
import {
  getRefreshToken,
  revokeToken,
  saveRefreshToken,
} from "../utils/db/refresh_tokens";

export async function signupController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const signupSchema = yup.object({
    body: yup.object({
      firstName: yup.string().required("First name is required"),
      lastName: yup.string().required("Last name is required"),
      email: yup.string().required("Email is required").email("Invalid email"),
      password: yup.string().required("Password is required"),
      matchingPassword: yup
        .string()
        .required("Matching password is required")
        .test("passwords-match", "Passwords do not match", function (value) {
          return this.parent.password === value;
        }),
    }),
  });

  try {
    // Validation of the request data
    const validated = await signupSchema.validate(
      {
        body: req.body,
      },
      { abortEarly: false }
    );

    // If validation is successful, we extract the data
    const {
      body: { firstName, lastName, email, password, matchingPassword },
    } = validated;

    // Check if address email is taken
    const user = findUserByEmail(email);
    if (user) {
      return next(new Error("User with such email already exists!"));
    }

    // Hash the password
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 12);
    } catch (err) {
      return next(new Error());
    }

    const token = generateToken();
    const tokenExpiresAt = Math.floor(Date.now() / 1000) + 3600;

    const { lastInsertRowid } = addUser(
      firstName,
      lastName,
      email,
      hashedPassword,
      token,
      tokenExpiresAt
    );

    const newestUser = findUserById(lastInsertRowid);

    if (newestUser) {
      sendVerificationEmail(email, token);
      res.status(201).json({});
    } else {
      throw new Error();
    }
  } catch (err) {
    // Handle validation errors
    if (err instanceof yup.ValidationError) {
      return next(new HttpError(err.errors.join(", "), 422));
    }
    return next(new Error("Something went wrong! Please try again later."));
  }
}

export async function signinController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const signinSchema = yup.object({
    body: yup.object({
      email: yup.string().required("Email is required").email("Invalid email"),
      password: yup.string().required("Password is required"),
    }),
  });

  try {
    // Validation of the request data
    const validated = await signinSchema.validate(
      {
        body: req.body,
      },
      { abortEarly: false }
    );

    // If validation is successful, we extract the data
    const {
      body: { email, password },
    } = validated;

    // Check if such user exists
    const user = findUserByEmail(email);

    if (!user) {
      return next(new Error("Could not find user with such email!"));
    }

    if (!user.verified) {
      return next(new Error("User is not verified!"));
    }

    let isValidPassword;

    isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return next(new HttpError("Invalid password!", 401));
    }

    // Generate token
    let token = generateAccessToken(user.id);
    let refreshToken = generateRefreshToken(user.id);

    saveRefreshToken(user.id, refreshToken);

    res.status(200).json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      token: token,
      refreshToken,
    });
  } catch (err) {
    // Handle validation errors
    if (err instanceof yup.ValidationError) {
      return next(new HttpError(err.errors.join(", "), 422));
    }
    return next(new Error("Something went wrong! Please try again later."));
  }
}

export async function verifyUserController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const verificationSchema = yup.object({
    body: yup.object({
      token: yup.string().required("Token is required"),
    }),
  });

  try {
    // Validation of the request data
    const validated = await verificationSchema.validate(
      {
        body: req.body,
      },
      { abortEarly: false }
    );

    // If validation is successful, we extract the data
    const {
      body: { token },
    } = validated;

    const user = findUserByToken(token);

    if (!user) {
      return next(
        new HttpError("User with this token does not exist!", 422, false)
      );
    }

    if (user.verified) {
      res.status(200).json({});
    }

    const now = Math.floor(Date.now() / 1000);
    if (user.token_expires_at === null || user.token_expires_at < now) {
      return next(
        new HttpError(
          "Token has expired! Please try to sign up again!",
          422,
          true
        )
      );
    }

    verifyUser(user.id);

    res.status(200).json({});
  } catch (err) {
    // Handle validation errors
    if (err instanceof yup.ValidationError) {
      return next(new HttpError(err.errors.join(", "), 422));
    }
    return next(new Error("Something went wrong! Please try again later."));
  }
}

export async function passwordResetRequestController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const passwordResetTokenRequestSchema = yup.object({
    body: yup.object({
      email: yup.string().required("Email is required").email("Invalid email"),
    }),
  });

  try {
    // Validation of the request data
    const validated = await passwordResetTokenRequestSchema.validate(
      {
        body: req.body,
      },
      { abortEarly: false }
    );

    // If validation is successful, we extract the data
    const {
      body: { email },
    } = validated;

    // Check if address email is taken
    const user = findUserByEmail(email);
    if (!user) {
      return next(new Error("User with such email doesn't exists!"));
    }

    const token = generateToken();
    const tokenExpiresAt = Math.floor(Date.now() / 1000) + 3600;

    setPasswordResetToken(user.id, token, tokenExpiresAt);

    sendPasswordResetEmail(email, token);
    res.status(201).json({});
  } catch (err) {
    // Handle validation errors
    if (err instanceof yup.ValidationError) {
      return next(new HttpError(err.errors.join(", "), 422));
    }
    return next(new Error("Something went wrong! Please try again later."));
  }
}

export async function resetPasswordController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const verificationSchema = yup.object({
    body: yup.object({
      token: yup.string().required("Token is required"),
      password: yup.string().required("Password is required"),
      matchingPassword: yup
        .string()
        .required("Matching password is required")
        .test("passwords-match", "Passwords do not match", function (value) {
          return this.parent.password === value;
        }),
    }),
  });

  try {
    // Validation of the request data
    const validated = await verificationSchema.validate(
      {
        body: req.body,
      },
      { abortEarly: false }
    );

    // If validation is successful, we extract the data
    const {
      body: { token, password },
    } = validated;

    const user = findUserByPasswordResetToken(token);

    if (!user) {
      return next(
        new HttpError("User with this token does not exist!", 422, false)
      );
    }

    const now = Math.floor(Date.now() / 1000);
    if (
      user.password_reset_token_expires_at === null ||
      user.password_reset_token_expires_at < now
    ) {
      return next(
        new HttpError(
          "Token has expired! Please request password reset again!",
          422,
          true
        )
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    resetPassword(user.id, hashedPassword);

    res.status(200).json({});
  } catch (err) {
    // Handle validation errors
    if (err instanceof yup.ValidationError) {
      return next(new HttpError(err.errors.join(", "), 422));
    }
    return next(new Error("Something went wrong! Please try again later."));
  }
}

export async function refreshController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const verificationSchema = yup.object({
    body: yup.object({
      refreshToken: yup.string().required("Refresh token is required"),
    }),
  });

  try {
    // Validation of the request data
    const validated = await verificationSchema.validate(
      {
        body: req.body,
      },
      { abortEarly: false }
    );

    // If validation is successful, we extract the data
    const {
      body: { refreshToken },
    } = validated;

    const savedToken = getRefreshToken(refreshToken);

    if (!savedToken) {
      return next(new HttpError("", 422));
    }

    const { userId } = verifyRefreshToken(refreshToken);
    const newAccessToken = generateAccessToken(userId);
    res.status(200).json({ token: newAccessToken });
  } catch (err) {
    // Handle validation errors
    if (err instanceof yup.ValidationError) {
      return next(new HttpError(err.errors.join(", "), 422));
    } else if (err instanceof jwt.TokenExpiredError) {
      revokeToken(req.body.refreshToken);
      return next(new Error("Unauthorized! Provided token has expired!"));
    }
    return next(new Error("Something went wrong! Please try again later."));
  }
}

export async function logoutController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const verificationSchema = yup.object({
    body: yup.object({
      refreshToken: yup.string().required("Refresh token is required"),
    }),
  });

  try {
    // Validation of the request data
    const validated = await verificationSchema.validate(
      {
        body: req.body,
      },
      { abortEarly: false }
    );

    // If validation is successful, we extract the data
    const {
      body: { refreshToken },
    } = validated;

    revokeToken(refreshToken);
    res.status(200).json({});
  } catch (err) {
    // Handle validation errors
    if (err instanceof yup.ValidationError) {
      return next(new HttpError(err.errors.join(", "), 422));
    }
    return next(new Error("Something went wrong! Please try again later."));
  }
}
