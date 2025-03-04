import nodemailer from "nodemailer";
import { env } from "./env.config";

export const transporter = nodemailer.createTransport({
  host: "smtp.zoho.com",
  port: 465,
  secure: true,
  auth: {
    user: env.ZOHO_USER,
    pass: env.ZOHO_PASS,
  },
});
