import { Router } from "express";
import {
  logoutController,
  passwordResetRequestController,
  refreshController,
  resetPasswordController,
  signinController,
  signupController,
  userDataController,
  verifyUserController,
} from "../controllers/user.controller";

const userRouter = Router();

userRouter.put("/signup", signupController);

userRouter.post("/signin", signinController);

userRouter.post("/verify", verifyUserController);

userRouter.post("/request-password-reset", passwordResetRequestController);

userRouter.post("/password-reset", resetPasswordController);

userRouter.get("/token", refreshController);

userRouter.post("/logout", logoutController);

userRouter.get("/me", userDataController);

export default userRouter;
