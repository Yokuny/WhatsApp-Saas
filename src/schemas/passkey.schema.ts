import { z } from "zod";

const base62Chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const codeParamSchema = z.object({
  code: z
    .string()
    .length(8, { message: "O código deve ter exatamente 8 caracteres" })
    .regex(new RegExp(`^[${base62Chars}]+$`), {
      message: "O código contém caracteres inválidos",
    }),
});

export type CodeParam = z.infer<typeof codeParamSchema>;
