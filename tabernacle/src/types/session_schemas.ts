import { z } from "zod";
import { RoundSchema } from "./round_schemas";

export const SessionSchema = z.object({
  id: z.number(),
  created_at: z.string(),
  closed: z.boolean(),
  month_year: z.string(),
  rounds: z.array(RoundSchema),
  deleted: z.boolean(),
  session_date: z.string().optional(),
});
export type Session = z.infer<typeof SessionSchema>;

export const EMPTY_SESSION: Session = {
  id: -1,
  created_at: "",
  closed: false,
  month_year: "",
  rounds: [],
  deleted: false,
  session_date: "",
};

export const SessionObjectResponseSchema = z.record(
  z.string(),
  z.array(SessionSchema)
);

export type SessionObjectResponse = z.infer<typeof SessionObjectResponseSchema>;

export const MonthSchema = z.string();
export type Month = z.infer<typeof MonthSchema>;

export const MonthListResponseSchema = z.array(MonthSchema);
export type MonthListResponse = z.infer<typeof MonthListResponseSchema>;

// POST
export type CreateSessionResponse = z.infer<typeof SessionSchema>;
