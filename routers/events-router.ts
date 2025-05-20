import multer, { diskStorage } from "multer";
import {
  addEventController,
  deleteEventController,
  editEventController,
  getAllEventsWithinRadiuController,
  getAllUserEventsController,
  getEventController,
  getEventsController,
} from "../controllers/events-controller";
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

eventsRouter.use(checkAuthMiddleware);

eventsRouter.put("/add", upload.single("image"), addEventController);

eventsRouter.get("/all", getEventsController);

eventsRouter.get("/own", getAllUserEventsController);

eventsRouter.get("/near", getAllEventsWithinRadiuController);

eventsRouter.get("/:id", getEventController);

eventsRouter.delete("/delete/:id", deleteEventController);

eventsRouter.patch("/edit/:id", upload.single("image"), editEventController);

export default eventsRouter;
