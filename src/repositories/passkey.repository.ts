import { Passkey } from "../database/passkey.database";
import { ObjectId } from "mongodb";
import type { PasskeyData } from "../models";

export const createSignupPasskey = async (data: PasskeyData) => {
  return await Passkey.create(data);
};

export const findByCode = async (code: string) => {
  return await Passkey.findOne({ code, used: false });
};

export const findByOriginalId = async (originalId: string | ObjectId) => {
  return await Passkey.findOne({ originalId });
};

export const markAsUsed = async (code: string) => {
  return await Passkey.updateOne({ code }, { used: true });
};

export const deleteExpiredCodes = async () => {
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  return await Passkey.deleteMany({ createdAt: { $lt: oneDayAgo } });
};

export const deleteByOriginalId = async (originalId: string | ObjectId) => {
  return await Passkey.deleteOne({ originalId });
};
