import { checkAuthMiddleware } from "../middleware/check-auth";
import { Router } from "express";
import {
  getAllNotificationsController,
  markAllNotificationsAsSeenController,
  markSelectedNotificationsAsSeenController,
  markSelectedNotificationsAsUnseenController,
  unseenNotificationsCountController,
} from "../controllers/notifications.controller";

const notificationsRouter = Router();

// Middleware to check if the user is authenticated.
// Additionaly it decodes the token and adds the userId to the request object so that we can easily
// access it in the controller functions. All routes after this middleware will require authentication.
notificationsRouter.use(checkAuthMiddleware);

notificationsRouter.get("/unseen-count", unseenNotificationsCountController);

notificationsRouter.get("/all", getAllNotificationsController);

notificationsRouter.post("/all-seen", markAllNotificationsAsSeenController);

notificationsRouter.post("/seen", markSelectedNotificationsAsSeenController);

notificationsRouter.post(
  "/unseen",
  markSelectedNotificationsAsUnseenController
);

notificationsRouter.post("/all-seen", markAllNotificationsAsSeenController);

export default notificationsRouter;
