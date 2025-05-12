const express = require("express");

const eventsController = require("../controllers/events-controller");
const checkAuth = require("../middleware/check-auth");

const router = express.Router();

router.use(checkAuth);

router.put("/add", eventsController.addEvent);

router.get("/all", eventsController.getAllEvents);

router.get("/:id", eventsController.getEvent);

router.get("/user-events", eventsController.getAllUserEvents);

module.exports = router;
