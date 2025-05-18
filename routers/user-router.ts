import { Router } from "express";
import {
  passwordResetRequestController,
  resetPasswordController,
  signinController,
  signupController,
  verifyUserController,
} from "../controllers/user-controller";

const userRouter = Router();

userRouter.put("/signup", signupController);

userRouter.post("/signin", signinController);

userRouter.post("/verify", verifyUserController);

userRouter.post("/request-password-reset", passwordResetRequestController);

userRouter.post("/password-reset", resetPasswordController);

export default userRouter;
