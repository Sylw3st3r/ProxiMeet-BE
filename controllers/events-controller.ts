import {
  addEvent,
  deleteEvent,
  editEvent,
  getEvent,
  getEventsWithinRadius,
  getPaginatedEvents,
} from "../utils/db/events";
import HttpError from "../models/error";
import { Response, NextFunction, Request } from "express";
import { VerifiedUserRequest } from "../models/verified-user-request";
import * as yup from "yup";

export async function addEventController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Schema for the add event request data
  const addEventSchema = yup.object({
    body: yup.object({
      name: yup.string().required("Name is required"),
      description: yup.string().required("Description is required"),
      lat: yup
        .number()
        .typeError("Latitude must be a number")
        .required("Latitude is required"),
      lng: yup
        .number()
        .typeError("Longitude must be a number")
        .required("Longitude is required"),
      start: yup
        .string()
        .required("Start date is required")
        .test(
          "is-valid-date",
          "Start must be a valid ISO date string",
          (value) => {
            return !isNaN(Date.parse(value));
          }
        ),
      end: yup
        .string()
        .required("End date is required")
        .test(
          "is-valid-date",
          "End must be a valid ISO date string",
          (value) => {
            return !isNaN(Date.parse(value));
          }
        )
        .test(
          "is-after-start",
          "End date must be after start date",
          function (end) {
            const { start } = this.parent;
            if (!start || !end) return true; // Let other validators handle required
            return Date.parse(end) > Date.parse(start);
          }
        ),
    }),
    tokenData: yup.object({
      userId: yup.number().required("Missing user ID"),
    }),
    file: yup.object({
      filename: yup.string().required("Image is required"),
    }),
  });

  try {
    // Validation of the request data
    const validated = await addEventSchema.validate(
      {
        body: req.body,
        file: req.file,
        tokenData: (req as VerifiedUserRequest).tokenData,
      },
      { abortEarly: false }
    );

    // If validation is successful, we extract the data
    const {
      body: { name, description, lat, lng, start, end },
      tokenData: { userId },
      file: { filename },
    } = validated;

    // Add new event to the database
    addEvent(userId, name, description, filename, lat, lng, start, end);

    // Return the created event
    res.status(201).json({
      name,
      description,
      image: filename,
      lat,
      lng,
      start,
      end,
    });
  } catch (err) {
    // Handle validation errors
    if (err instanceof yup.ValidationError) {
      return next(new HttpError(err.errors.join(", "), 422));
    }
    console.log(err);
    return next(new HttpError("Something went wrong!"));
  }
}

export async function editEventController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Schema for the add event request data
  const editEventSchema = yup.object({
    params: yup.object({
      id: yup.number().required("Event ID is required"),
    }),
    body: yup.object({
      name: yup.string().required("Name is required"),
      description: yup.string().required("Description is required"),
      lat: yup
        .number()
        .typeError("Latitude must be a number")
        .required("Latitude is required"),
      lng: yup
        .number()
        .typeError("Longitude must be a number")
        .required("Longitude is required"),
      start: yup
        .string()
        .required("Start date is required")
        .test(
          "is-valid-date",
          "Start must be a valid ISO date string",
          (value) => {
            return !isNaN(Date.parse(value));
          }
        ),
      end: yup
        .string()
        .required("End date is required")
        .test(
          "is-valid-date",
          "End must be a valid ISO date string",
          (value) => {
            return !isNaN(Date.parse(value));
          }
        )
        .test(
          "is-after-start",
          "End date must be after start date",
          function (end) {
            const { start } = this.parent;
            if (!start || !end) return true; // Let other validators handle required
            return Date.parse(end) > Date.parse(start);
          }
        ),
    }),
    tokenData: yup.object({
      userId: yup.number().required("Missing user ID"),
    }),
    file: yup.object({
      filename: yup.string(),
    }),
  });

  try {
    // Validation of the request data
    const validated = await editEventSchema.validate(
      {
        body: req.body,
        file: req.file,
        params: req.params,
        tokenData: (req as VerifiedUserRequest).tokenData,
      },
      { abortEarly: false }
    );

    // If validation is successful, we extract the data
    const {
      body: { name, description, lat, lng, start, end },
      params: { id },
      tokenData: { userId },
      file: { filename },
    } = validated;

    const event = getEvent(id);

    if (!event) {
      return next(new HttpError("Event with this id doesnt exits!", 422));
    }

    // Check if there was new image passed. If not, use the old one
    const updatedImage = filename || event.image;

    if (event.organizerId !== userId) {
      return next(
        new HttpError(
          "Users id doesnt match the id of organizer! Unauthorized to make a change",
          422
        )
      );
    }

    editEvent(id, name, description, updatedImage, lat, lng, start, end);

    res.status(200).json({
      id,
      name,
      description,
      lat,
      lng,
      start,
      end,
      image: updatedImage,
    });
  } catch (err) {
    // Handle validation errors
    if (err instanceof yup.ValidationError) {
      return next(new HttpError(err.errors.join(", "), 422));
    }
    return next(new HttpError("Something went wrong!"));
  }
}

export async function getEventController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Schema for the get event request data
  const getEventSchema = yup.object({
    params: yup.object({
      id: yup.number().required("Event ID is required"),
    }),
  });

  try {
    // Validation of the request data
    const validated = await getEventSchema.validate(
      {
        params: req.params,
      },
      { abortEarly: false }
    );

    // If validation is successful, we extract the data
    const {
      params: { id },
    } = validated;

    const event = getEvent(id);

    if (!event) {
      return next(new HttpError("Event with this id doesnt exits!", 422));
    }

    res.status(200).json({
      event: event,
    });
  } catch (err) {
    // Handle validation errors
    if (err instanceof yup.ValidationError) {
      return next(new HttpError(err.errors.join(", "), 422));
    }
    return next(
      new Error("Something went wrong when trying to access this event")
    );
  }
}

export async function getEventsController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Schema for the add get all user events request data
  const getAllEventsSchema = yup.object({
    query: yup.object({
      search: yup.string(),
      page: yup.number().required("Page is required"),
      limit: yup.number().required("Limit is required"),
    }),
  });

  try {
    // Validation of the request data
    const validated = await getAllEventsSchema.validate(
      {
        query: req.query,
      },
      { abortEarly: false }
    );

    // If validation is successful, we extract the data
    const {
      query: { search, page, limit },
    } = validated;

    const events = getPaginatedEvents(search || "", page, limit);

    res.status(200).json(events);
  } catch (err) {
    // Handle validation errors
    if (err instanceof yup.ValidationError) {
      return next(new HttpError(err.errors.join(", "), 422));
    }
    return next(new Error("Something went wrong when trying to access events"));
  }
}

export async function getAllEventsWithinRadiuController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Schema for the get events within radius request data
  const getEventsWithinRadiusSchema = yup.object({
    query: yup.object({
      unit: yup
        .string()
        .oneOf(["km", "mi"], 'Unit must be either "km" or "mi"')
        .required("Unit is required"),
      radius: yup.number().required("Radius is required"),
      lat: yup
        .number()
        .typeError("Latitude must be a number")
        .required("Latitude is required"),
      lng: yup
        .number()
        .typeError("Longitude must be a number")
        .required("Longitude is required"),
    }),
  });

  try {
    // Validation of the request data
    const validated = await getEventsWithinRadiusSchema.validate(
      {
        query: req.query,
      },
      { abortEarly: false }
    );

    // If validation is successful, we extract the data
    const {
      query: { lat, lng, radius, unit },
    } = validated;

    const events = getEventsWithinRadius(lat, lng, radius, unit);

    res.status(200).json({
      events,
    });
  } catch (err) {
    // Handle validation errors
    if (err instanceof yup.ValidationError) {
      return next(new HttpError(err.errors.join(", "), 422));
    }
    return next(
      new Error(
        "Something went wrong when trying to access events within radius"
      )
    );
  }
}

export async function getAllUserEventsController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Schema for the add get all user events request data
  const getAllUserEventsSchema = yup.object({
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
    const validated = await getAllUserEventsSchema.validate(
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

    const events = getPaginatedEvents(search || "", page, limit, userId);

    res.status(200).json(events);
  } catch (err) {
    // Handle validation errors
    if (err instanceof yup.ValidationError) {
      return next(new HttpError(err.errors.join(", "), 422));
    }
    return next(
      new Error("Something went wrong when trying to access user events")
    );
  }
}

export async function deleteEventController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Schema for the delete event request data
  const deleteEventSchema = yup.object({
    params: yup.object({
      id: yup.number().required("Event ID is required"),
    }),
    tokenData: yup.object({
      userId: yup.number().required("Missing user ID"),
    }),
  });

  try {
    // Validation of the request data
    const validated = await deleteEventSchema.validate(
      {
        params: req.params,
        tokenData: (req as VerifiedUserRequest).tokenData,
      },
      { abortEarly: false }
    );

    // If validation is successful, we extract the data
    const {
      params: { id },
      tokenData: { userId },
    } = validated;

    const event = getEvent(id);

    if (!event) {
      return next(new HttpError("Event with this id doesnt exits!", 422));
    }

    if (event.organizerId !== userId) {
      return next(
        new HttpError(
          "Users id doesnt match the id of organizer! Unauthorized to make a change",
          422
        )
      );
    }

    deleteEvent(id);

    res.status(200).json({});
  } catch (err) {
    // Handle validation errors
    if (err instanceof yup.ValidationError) {
      return next(new HttpError(err.errors.join(", "), 422));
    }
    console.log(err);
    return next(new Error("Something went wrong!"));
  }
}
