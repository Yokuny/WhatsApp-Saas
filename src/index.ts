import express, { Application, Request, Response, json, urlencoded } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import * as route from "./routers";
import { errorHandler } from "./middlewares/errorHandler.middleware";
import { dbConnect, corsOptions } from "./config";

const app: Application = express();

app
  .use(urlencoded({ extended: false }))
  .use(json())
  .use(cookieParser())
  .use(cors(corsOptions))
  .get("/", (_req: Request, res: Response) => res.send("Bem-vindo ao sistema de marketing via whatsapp!"))
  .get("/health", (_req: Request, res: Response) => res.send("OK!"))
  .use("/user", route.userRoute)
  .use("/passkey", route.passkeyRoute)
  .use("/financial", route.financialRoute);

app.use("*", (_req: Request, res: Response) => res.status(404).send({ message: "Rota não encontrada! 🤷‍♂️" }));
app.use(errorHandler);

export function init(): Promise<express.Application> {
  dbConnect();
  return Promise.resolve(app);
}

export default app;
