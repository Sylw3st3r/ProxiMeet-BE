import { Router } from "express";
import {
  changeAvatarController,
  changeBasicDataController,
  changeEmailController,
  changePasswordController,
} from "../controllers/profile.controller";
import { checkAuthMiddleware } from "../middleware/check-auth";
import { checkPasswordConfirmedMiddleware } from "../middleware/check-password-confirmed";
import multer, { diskStorage } from "multer";

const profileRouter = Router();

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
profileRouter.use(checkAuthMiddleware);

profileRouter.post("/edit/basic", changeBasicDataController);

profileRouter.post(
  "/edit/avatar",
  upload.single("avatar"),
  changeAvatarController
);

profileRouter.post(
  "/edit/password",
  checkPasswordConfirmedMiddleware,
  changePasswordController
);

profileRouter.post(
  "/edit/email",
  checkPasswordConfirmedMiddleware,
  changeEmailController
);

export default profileRouter;
