import crypto from "crypto";
import { ObjectId } from "mongodb";

import * as repository from "../repositories/passkey.repository";
import { getUserById } from "../services/user.service";
import { returnMessage, returnData } from "../helpers/responsePattern.helper";
import type { ServiceRes } from "../helpers/responsePattern.helper";
import type { PasskeyData, SignupPasskey } from "../models/interfaces.type";
import { CustomError } from "../models/error.type";

export const passkeyByOriginalId = async (originalId: string): Promise<PasskeyData> => {
  const passkey = await repository.findByOriginalId(originalId);
  if (!passkey) throw new CustomError("Código inválido ou expirado", 404);

  return passkey;
};

export const markAsUsed = async (code: string): Promise<void> => {
  await repository.markAsUsed(code);
};

export const createSignupPasskey = async (data: SignupPasskey): Promise<string> => {
  const passkeyFound = await repository.findByOriginalId(data.originalId);
  if (passkeyFound) {
    if (!passkeyFound.used) return passkeyFound.code;
    await repository.deleteByOriginalId(data.originalId);
  }

  let code = generateSecureCode();
  let existingCode = await repository.findByCode(code);

  while (existingCode) {
    code = generateSecureCode();
    existingCode = await repository.findByCode(code);
  }

  const passkey: PasskeyData = {
    code,
    originalId: new ObjectId(data.originalId),
    email: data.email,
    type: data.type,
    used: false,
  };

  await repository.createSignupPasskey(passkey);

  return code;
};

export const validatePasskey = async (code: string): Promise<ServiceRes> => {
  const passkey = await repository.findByCode(code);
  if (!passkey) throw new CustomError("Código inválido ou expirado", 404);

  const originalID = passkey.originalId.toString();

  const user = await getUserById(originalID);
  if (user.name !== "empty" && user.password !== "empty") {
    throw new CustomError("Usuário já cadastrado, faça login ou recupere sua senha", 409);
  }

  return returnData({
    id: originalID,
    email: passkey.email,
  });
};

export const cleanupExpiredCodes = async (): Promise<ServiceRes> => {
  const result = await repository.deleteExpiredCodes();
  return returnMessage(`${result.deletedCount} códigos expirados foram removidos`);
};

const generateSecureCode = (): string => {
  const base62 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const buffer = crypto.randomBytes(8);
  let code = "";

  for (let i = 0; i < 8; i++) {
    const index = buffer[i % buffer.length] % 62;
    code += base62[index];
  }

  return code;
};
