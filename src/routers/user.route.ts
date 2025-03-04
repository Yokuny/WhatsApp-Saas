import { Router } from "express";
import * as controller from "../controllers/user.controller";
import { validBody, validParams, validToken } from "../middlewares";
import { idSchema } from "../schemas/id.schema";
import {
  emailSchema,
  signupSchema,
  signinSchema,
  userUpdateSchema,
  passwordUpdateSchema,
  userInviteSchema,
} from "../schemas/user.schema";

const userRoute = Router();

userRoute.post("/user-email", validBody(emailSchema), controller.emailValidation);
userRoute.put("/signup/:id", validParams(idSchema), validBody(signupSchema), controller.signup);
userRoute.post("/signin", validBody(signinSchema), controller.signin);

userRoute.use(validToken);
userRoute.get("/partial", controller.getPartialUserRegister);
userRoute.put("/update", validBody(userUpdateSchema), controller.updateUser);
userRoute.put("/change-password", validBody(passwordUpdateSchema), controller.changePassword);
userRoute.post("/user-invite", validBody(userInviteSchema), controller.userInvite);

export { userRoute };
