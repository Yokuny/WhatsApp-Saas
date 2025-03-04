import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";

import * as respository from "../repositories/user.repository";
import { createSignupPasskey, markAsUsed, passkeyByOriginalId } from "../services/passkey.service";
import { env, transporter } from "../config";
import { returnMessage, returnData } from "../helpers/responsePattern.helper";
import type { ServiceRes } from "../helpers/responsePattern.helper";
import type {
  SignUp,
  SignIn,
  ClinicUser,
  PartialUser,
  UserUpdate,
  PasswordUpdate,
  UserInvite,
  NewClinicUser,
  SignupPasskey,
} from "../models";
import { CustomError } from "../models/error.type";
import { getUserRole, addNewClinicUser } from "./clinic.service";

export const getUserByEmail = async (email: string) => {
  return await respository.getUserByEmail(email);
};

export const getUserById = async (id: string) => {
  const user = await respository.getUserById(id);
  if (!user) throw new CustomError("Usuário não encontrado", 404);

  return user;
};

export const emailValidation = async (data: { email: string }): Promise<ServiceRes> => {
  const userFound = await getUserByEmail(data.email);
  if (userFound) throw new CustomError("Usuário já existe", 409);

  const newUser = {
    name: "empty",
    email: data.email,
    password: "empty",
  } as SignUp;

  const userData = await respository.registerEmail(newUser);

  const signupPasskey = {
    originalId: userData._id.toString(),
    email: data.email,
    type: "signup",
  } as SignupPasskey;

  const passCode = await createSignupPasskey(signupPasskey);

  await transporter.sendMail({
    from: env.ZOHO_USER,
    to: data.email,
    subject: "DentalEase - Confirme seu Cadastro",
    html: `
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
        <h2 style="color: #3797f0;">Bem-vindo a DentalEase!</h2>
        <p>Para concluir seu cadastro, clique no botão abaixo:</p>

        <a href="https://www.dentalease.com.br/auth/${passCode}"
           style="display: inline-block; padding: 10px 20px; margin: 20px 0; font-size: 16px;
                  color: #fff; background-color: #007bff; text-decoration: none; border-radius: 5px;">
          Confirmar Cadastro
        </a>
        <br>
        <p>Se o botão não funcionar, copie e cole o link abaixo em seu navegador:</p>
        <p><a href="https://www.dentalease.com.br/auth/${passCode}">
          https://www.dentalease.com.br/auth/${passCode}
        </a></p>
        <br>
        <p>Se você não solicitou este cadastro, ignore este e-mail.</p>
        <p>Atenciosamente, <br><strong>Equipe DentalEase</strong></p>
      </div>
    `,
    text: `Bem-vindo ao DentalEase! Para concluir seu cadastro, acesse o link abaixo:
    https://www.dentalease.com.br/auth/${passCode}
    Se você não solicitou este cadastro, ignore este e-mail.

    Atenciosamente,
    Equipe DentalEase`,
  });

  return returnMessage("Email de cadastro enviado, acesse o email para concluir o cadastro");
};

export const signup = async (id: string, data: SignUp): Promise<ServiceRes> => {
  const passkeyFound = await passkeyByOriginalId(id);
  if (passkeyFound.used) throw new CustomError("Código já utilizado", 409);
  if (passkeyFound.email !== data.email) throw new CustomError("Email não corresponde ao código", 403);

  const user = await getUserByEmail(data.email);
  if (!user) throw new CustomError("Usuário não encontrado", 404);
  if (user.name !== "empty" && user.password !== "empty") {
    throw new CustomError("Usuário já existe", 409);
  }

  await markAsUsed(passkeyFound.code);

  const cryptPassword = await bcrypt.hash(data.password, 10);

  const newUser = {
    ...data,
    password: cryptPassword,
  };

  await respository.signup(id, newUser);
  return returnMessage("Usuário criado com sucesso");
};

export const signin = async (data: SignIn): Promise<ServiceRes> => {
  const user = await getUserByEmail(data.email);
  if (!user) throw new CustomError("Usuário ou senha incorretos", 409);

  const isValidPassword = await bcrypt.compare(data.password, user.password);
  if (!isValidPassword) throw new CustomError("Usuário ou senha incorretos", 403);

  const token = jwt.sign({ user: user._id, clinic: user.clinic || "" }, env.JWT_SECRET, {
    expiresIn: "4d",
  });

  const secureUser = {
    name: user.name,
    email: user.email,
    clinic: user.clinic?.toString(),
    image: user.image,
  } as PartialUser;

  return returnData({ user: secureUser, token });
};

export const getPartialUserRegister = async (clinicUser: ClinicUser): Promise<ServiceRes> => {
  const user = await getUserById(clinicUser.user);

  return returnData({
    name: user.name,
    email: user.email,
    clinic: user.clinic?.toString(),
    image: user.image,
  } as PartialUser);
};

export const updateUser = async (clinicUser: ClinicUser, data: UserUpdate): Promise<ServiceRes> => {
  const user = await getUserById(clinicUser.user);

  const register = await respository.updateUser(user._id.toString(), data);

  if (register.modifiedCount === 1) return returnMessage("Usuário atualizado com sucesso");
  return returnMessage("Usuário não atualizado");
};

export const changePassword = async (clinicUser: ClinicUser, data: PasswordUpdate): Promise<ServiceRes> => {
  const user = await getUserById(clinicUser.user);

  const matchOldPassword = await bcrypt.compare(data.oldPassword, user.password);
  if (!matchOldPassword) throw new CustomError("Senha incorreta", 403);

  const isValidPassword = await bcrypt.compare(data.newPassword, user.password);
  if (isValidPassword) throw new CustomError("Nova senha não pode ser igual a anterior", 409);

  const cryptPassword = await bcrypt.hash(data.newPassword, 10);
  const register = await respository.changePassword(user._id.toString(), cryptPassword);

  if (register.modifiedCount === 1) return returnMessage("Senha alterada com sucesso");
  return returnMessage("Senha não alterada");
};

export const registerUserEmail = async (data: SignUp) => {
  const userData = await respository.registerEmail(data);
  return userData;
};

export const userInvite = async (clinicUser: ClinicUser, data: UserInvite): Promise<ServiceRes> => {
  const userRole = await getUserRole(clinicUser);
  if (userRole !== "admin") throw new CustomError("É necessário usar uma conta admin para convidar usuários", 403);

  const userFound = await getUserByEmail(data.email);
  if (userFound) throw new CustomError("Este email já possui um cadastro", 409);

  const newUser = {
    name: "empty",
    email: data.email,
    password: "empty",
    clinic: clinicUser.clinic,
  } as SignUp;

  const userData = await registerUserEmail(newUser);

  const newClinicUser = {
    user: new ObjectId(userData._id),
    role: data.role,
  } as NewClinicUser;

  await addNewClinicUser(clinicUser, newClinicUser);

  const signupPasskey = {
    originalId: userData._id.toString(),
    email: data.email,
    type: "signup",
  } as SignupPasskey;

  const passCode = await createSignupPasskey(signupPasskey);

  await transporter.sendMail({
    from: env.ZOHO_USER,
    to: data.email,
    subject: "DentalEase - Confirme seu Cadastro",
    html: `
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
        <h2 style="color: #007bff;">Bem-vindo ao DentalEase!</h2>
        <p>Para concluir seu cadastro, clique no botão abaixo:</p>
        <a href="https://www.dentalease.com.br/auth/${passCode}"
           style="display: inline-block; padding: 10px 20px; margin: 20px 0; font-size: 16px;
                  color: #fff; background-color: #007bff; text-decoration: none; border-radius: 5px;">
          Confirmar Cadastro
        </a>
        <p>Se o botão não funcionar, copie e cole o link abaixo em seu navegador:</p>
        <p><a href="https://www.dentalease.com.br/auth/${passCode}">
          https://www.dentalease.com.br/auth/${passCode}
        </a></p>
        <p>Se você não solicitou este cadastro, ignore este e-mail.</p>
        <p>Atenciosamente, <br><strong>Equipe DentalEase</strong></p>
      </div>
    `,
    text: `Bem-vindo ao DentalEase! Para concluir seu cadastro, acesse o link abaixo:
    https://www.dentalease.com.br/auth/${passCode}
    Se você não solicitou este cadastro, ignore este e-mail.

    Atenciosamente,
    Equipe DentalEase`,
  });

  return returnMessage("Email de convite enviado, acesse o email para concluir o cadastro");
};
