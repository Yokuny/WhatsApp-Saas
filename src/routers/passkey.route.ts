import { Router } from "express";
import * as controller from "../controllers/passkey.controller";
import { validParams } from "../middlewares";
import { codeParamSchema } from "../schemas/passkey.schema";

const passkeyRoute = Router();

passkeyRoute.get("/:code", validParams(codeParamSchema), controller.validatePasskey);
passkeyRoute.get("/cleanup", controller.cleanupExpiredCodes);

export { passkeyRoute };
