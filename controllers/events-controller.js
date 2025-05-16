const eventsDataAccess = require("../db/events");
const Error = require("../models/error");

const addEvent = async (req, res, next) => {
  const { name, description, lat, lng } = req.body;
  const image = req.file.filename;
  const { userId } = req.tokenData;

  try {
    eventsDataAccess.addEvent(userId, name, description, image, lat, lng);
  } catch (err) {
    new Error(err.message);
  }

  res.status(201).json({
    name,
    description,
    image,
    lat,
    lng,
  });
};

const editEvent = async (req, res, next) => {
  const eventId = req.params.id;
  const { name, description, image, lat, lng } = req.body;
  const { userId } = req.tokenData;

  if (!eventId) {
    new Error("id");
  }

  const event = eventsDataAccess.getEvent(req.params.id);

  if (!event) {
    new Error("event");
  }

  if (event.organizerId !== Number(userId)) {
    new Error("organizer");
  }

  const updatedImage = req?.file?.filename || image;

  try {
    eventsDataAccess.editEvent(
      eventId,
      name,
      description,
      updatedImage,
      lat,
      lng
    );
  } catch (err) {
    return next(new Error("Failed to edit event"));
  }

  res.status(200).json({
    id: Number(eventId),
    name,
    description,
    image: updatedImage,
  });
};

const getEvent = async (req, res, next) => {
  try {
    const event = eventsDataAccess.getEvent(req.params.id);

    if (!event) {
      return next(new Error("Event with this id doesnt exits!"));
    }

    res.status(200).json({
      event: event,
    });
  } catch (err) {
    return next(
      new Error("Something went wrong when trying to access this event")
    );
  }
};

const getEvents = async (req, res, next) => {
  const search = req.query.search;
  const page = req.query.page;

  try {
    res
      .status(200)
      .json(eventsDataAccess.getPaginatedEvents(search, Number(page), 10));
  } catch (err) {
    return next(new Error(err.message));
  }
};

const getAllEventsWithinRadius = async (req, res, next) => {
  const lat = req.query.lat;
  const lng = req.query.lng;
  const radius = req.query.radius || 20;
  const unit = req.query.unit === "km" ? "km" : "mi";

  if (!lat || !lng) {
    return next(new Error("No latitude or longitude passed!"));
  }

  let events;

  try {
    events = eventsDataAccess.getEventsWithinRadius(lat, lng, radius, unit);
  } catch (err) {
    return next(new Error(err.message));
  }

  res.status(200).json({
    events,
  });
};

const getAllUserEvents = async (req, res, next) => {
  const { userId } = req.tokenData;

  const search = req.query.search;
  const page = req.query.page;
  const limit = req.query.limit;

  try {
    res
      .status(200)
      .json(
        eventsDataAccess.getPaginatedEvents(
          search,
          Number(page),
          Number(limit),
          Number(userId)
        )
      );
  } catch (err) {
    return next(new Error(err.message));
  }
};

exports.addEvent = addEvent;
exports.editEvent = editEvent;
exports.getEvent = getEvent;
exports.getEvents = getEvents;
exports.getAllEventsWithinRadius = getAllEventsWithinRadius;
exports.getAllUserEvents = getAllUserEvents;
