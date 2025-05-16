const express = require("express");
const multer = require("multer");

const eventsController = require("../controllers/events-controller");
const checkAuth = require("../middleware/check-auth");

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "images/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

router.use(checkAuth);

router.put("/add", upload.single("image"), eventsController.addEvent);

router.get("/all", eventsController.getEvents);

router.get("/own", eventsController.getAllUserEvents);

router.get("/near", eventsController.getAllEventsWithinRadius);

router.get("/:id", eventsController.getEvent);

router.patch("/edit/:id", upload.single("image"), eventsController.editEvent);

module.exports = router;
