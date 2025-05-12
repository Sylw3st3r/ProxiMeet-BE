const eventsDataAccess = require("../data-access/events");

const addEvent = async (req, res, next) => {
  const { name, description, location, img } = req.body;
  const { userId } = req.tokenData;

  try {
    eventsDataAccess.addEvent(userId, name, description, location, img);
  } catch (err) {
    res.status(500).json({
      error: "Failed to add event",
      details: err.message,
    });
  }

  res.status(201);
};

const getEvent = async (req, res, next) => {
  try {
    const event = eventsDataAccess.getEvent(req.params.id);
    res.status(200).json({
      event: event,
    });
  } catch (err) {
    res.status(500).json({
      error: "Failed to add event",
      details: err.message,
    });
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
