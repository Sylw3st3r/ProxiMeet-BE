import { Router } from "express";
import {
  signinController,
  signupController,
  verifyUserController,
} from "../controllers/user-controller";

const userRouter = Router();

userRouter.put("/signup", signupController);

userRouter.post("/signin", signinController);

userRouter.get("/verify/:token", verifyUserController);

export default userRouter;
