import { NextFunction, Request, Response } from "express";
import * as yup from "yup";
import HttpError from "../models/error";
import { VerifiedUserRequest } from "../models/verified-user-request";
import {
  getUnseenNotificationCount,
  getUserNotifications,
  markAllNotificationsAsSeen,
  markNotificationsAsSeen,
  markNotificationsAsUnseen,
} from "../utils/db/notifications";

export async function unseenNotificationsCountController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const unseenNotificationsCountSchema = yup.object({
    tokenData: yup.object({
      userId: yup.number().required("Missing user ID"),
    }),
  });

  try {
    // Validation of the request data
    const validated = await unseenNotificationsCountSchema.validate(
      {
        tokenData: (req as VerifiedUserRequest).tokenData,
      },
      { abortEarly: false }
    );

    // If validation is successful, we extract the data
    const {
      tokenData: { userId },
    } = validated;

    res
      .status(200)
      .json({ unseenNotificationsCount: getUnseenNotificationCount(userId) });
  } catch (err) {
    // Handle validation errors
    if (err instanceof yup.ValidationError) {
      return next(new HttpError(err.errors.join(", "), 422));
    }
    return next(new Error("Something went wrong! Please try again later."));
  }
}

export async function markAllNotificationsAsSeenController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const markAllNotificationsAsSeenSchema = yup.object({
    tokenData: yup.object({
      userId: yup.number().required("Missing user ID"),
    }),
  });

  try {
    // Validation of the request data
    const validated = await markAllNotificationsAsSeenSchema.validate(
      {
        tokenData: (req as VerifiedUserRequest).tokenData,
      },
      { abortEarly: false }
    );

    // If validation is successful, we extract the data
    const {
      tokenData: { userId },
    } = validated;

    markAllNotificationsAsSeen(userId);

    res.status(200).json({});
  } catch (err) {
    // Handle validation errors
    if (err instanceof yup.ValidationError) {
      return next(new HttpError(err.errors.join(", "), 422));
    }
    return next(new Error("Something went wrong! Please try again later."));
  }
}

export async function getAllNotificationsController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const getAllNotificationsSchema = yup.object({
    query: yup.object({
      search: yup.string(),
      page: yup.number().required("Page is required"),
      limit: yup.number().required("Limit is required"),
    }),
    tokenData: yup.object({
      userId: yup.number().required("Missing user ID"),
    }),
  });

  try {
    // Validation of the request data
    const validated = await getAllNotificationsSchema.validate(
      {
        query: req.query,
        tokenData: (req as VerifiedUserRequest).tokenData,
      },
      { abortEarly: false }
    );

    // If validation is successful, we extract the data
    const {
      query: { search, page, limit },
      tokenData: { userId },
    } = validated;

    const notifications = getUserNotifications(
      userId,
      search || "",
      page,
      limit
    );

    res.status(200).json(notifications);
  } catch (err) {
    // Handle validation errors
    if (err instanceof yup.ValidationError) {
      return next(new HttpError(err.errors.join(", "), 422));
    }
    return next(new Error("Something went wrong! Please try again later."));
  }
}

export async function markSelectedNotificationsAsSeenController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const markSelectedNotificationsAsSeenSchema = yup.object({
    body: yup.object({
      notifications: yup
        .array()
        .of(yup.number().required())
        .required("Missing notifications array"),
    }),
    tokenData: yup.object({
      userId: yup.number().required("Missing user ID"),
    }),
  });

  try {
    // Validation of the request data
    const validated = await markSelectedNotificationsAsSeenSchema.validate(
      {
        body: req.body,
        tokenData: (req as VerifiedUserRequest).tokenData,
      },
      { abortEarly: false }
    );

    // If validation is successful, we extract the data
    const {
      body: { notifications },
      tokenData: { userId },
    } = validated;

    markNotificationsAsSeen(userId, notifications);

    res.status(200).json({});
  } catch (err) {
    // Handle validation errors
    if (err instanceof yup.ValidationError) {
      return next(new HttpError(err.errors.join(", "), 422));
    }
    return next(new Error("Something went wrong! Please try again later."));
  }
}

export async function markSelectedNotificationsAsUnseenController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const markSelectedNotificationsAsUnseenSchema = yup.object({
    body: yup.object({
      notifications: yup
        .array()
        .of(yup.number().required())
        .required("Missing notifications array"),
    }),
    tokenData: yup.object({
      userId: yup.number().required("Missing user ID"),
    }),
  });

  try {
    // Validation of the request data
    const validated = await markSelectedNotificationsAsUnseenSchema.validate(
      {
        body: req.body,
        tokenData: (req as VerifiedUserRequest).tokenData,
      },
      { abortEarly: false }
    );

    // If validation is successful, we extract the data
    const {
      body: { notifications },
      tokenData: { userId },
    } = validated;

    markNotificationsAsUnseen(userId, notifications);

    res.status(200).json({});
  } catch (err) {
    // Handle validation errors
    if (err instanceof yup.ValidationError) {
      return next(new HttpError(err.errors.join(", "), 422));
    }
    return next(new Error("Something went wrong! Please try again later."));
  }
}
