import { z } from "zod";
import { objectIdMessage, validObjectID } from "../helpers";

const financialStatus = ["canceled", "pending", "partial", "paid", "refund"] as const;

export const financialSchema = z.object({
  Patient: z.string().refine(validObjectID, objectIdMessage()),
  Doctor: z.string().refine(validObjectID, objectIdMessage()).optional(),
  Odontogram: z.string().refine(validObjectID, objectIdMessage()).optional(),
  procedures: z
    .array(
      z.object({
        procedure: z.string(),
        price: z.number().positive(),
        status: z.enum(financialStatus),
      })
    )
    .optional(),
  price: z.number().positive().optional(),
  status: z.enum(financialStatus).default("pending"),
});

export const financialStateSchema = z.object({
  status: z.enum(financialStatus).default("pending"),
});

export type NewFinancial = z.infer<typeof financialSchema>;
export type FinancialState = z.infer<typeof financialStateSchema>;
