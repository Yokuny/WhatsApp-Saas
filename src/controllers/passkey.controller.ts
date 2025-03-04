import { Request, Response, NextFunction } from "express";
import * as service from "../services/passkey.service";
import { respObj } from "../helpers/responsePattern.helper";

export const validatePasskey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.params;
    const resp = await service.validatePasskey(code);

    return res.status(200).json(respObj(resp));
  } catch (err) {
    next(err);
  }
};

export const cleanupExpiredCodes = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const resp = await service.cleanupExpiredCodes();

    return res.status(200).json(respObj(resp));
  } catch (err) {
    next(err);
  }
};
