import multer, { diskStorage } from "multer";
import {
  addEventAttendanceController,
  addEventController,
  checkAttendanceOverlapController,
  deleteEventController,
  editEventController,
  getAllEventsWithinRadiuController,
  getAllUserEventsController,
  getTopEventsByUnreadMessagesController,
  getEventController,
  getEventsController,
  getScheduledEventsController,
  removeEventAttendanceController,
  getGroupChatMessagesController,
  getEventsByUnreadCountController,
} from "../controllers/events.controller";
import { checkAuthMiddleware } from "../middleware/check-auth";
import { Router } from "express";

const eventsRouter = Router();

const storage = diskStorage({
  destination: function (req, file, cb) {
    cb(null, "images/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// Middleware to check if the user is authenticated.
// Additionaly it decodes the token and adds the userId to the request object so that we can easily
// access it in the controller functions. All routes after this middleware will require authentication.
eventsRouter.use(checkAuthMiddleware);

eventsRouter.put("/add", upload.single("image"), addEventController);

eventsRouter.get("/all", getEventsController);

eventsRouter.get("/own", getAllUserEventsController);

eventsRouter.get("/chat/status", getTopEventsByUnreadMessagesController);

eventsRouter.get("/chat/:eventId/messages", getGroupChatMessagesController);

eventsRouter.get("/chat/events", getEventsByUnreadCountController);

eventsRouter.get("/schedule", getScheduledEventsController);

eventsRouter.get("/near", getAllEventsWithinRadiuController);

eventsRouter.get("/:id", getEventController);

eventsRouter.delete("/delete/:id", deleteEventController);

eventsRouter.patch("/edit/:id", upload.single("image"), editEventController);

eventsRouter.post("/overlaping", checkAttendanceOverlapController);

eventsRouter.post("/attend", addEventAttendanceController);

eventsRouter.post("/resign", removeEventAttendanceController);

export default eventsRouter;
