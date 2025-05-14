const eventsDataAccess = require("../db/events");
const Error = require("../models/error");

const addEvent = async (req, res, next) => {
  const { name, location, description } = req.body;
  const image = req.file.filename;
  const { userId } = req.tokenData;

  try {
    eventsDataAccess.addEvent(userId, name, description, location, image);
  } catch (err) {
    res.status(500).json({
      error: "Failed to add event",
      details: err.message,
    });
  }

  res.status(201).json({
    name,
    location,
    description,
    image,
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

const getAllEvents = async (req, res, next) => {
  res.status(200).json({
    events: eventsDataAccess.getAllEvents(),
  });
};

const getAllUserEvents = async (req, res, next) => {
  const { userId } = req.tokenData;

  res.status(200),
    json({
      events: eventsDataAccess.getAllUserEvents(userId),
    });
};

exports.addEvent = addEvent;
exports.getEvent = getEvent;
exports.getAllEvents = getAllEvents;
exports.getAllUserEvents = getAllUserEvents;
