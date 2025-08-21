import { z } from "zod";
import {  RoundSchema } from "./round_schemas";

export const SessionSchema = z.object({
    id: z.number(),
    created_at: z.string(),   
    closed: z.boolean(),
    month_year: z.string(),
    rounds: z.array(RoundSchema),    
    deleted: z.boolean(),
  });
export type Session = z.infer<typeof SessionSchema>;

export const SessionObjectResponseSchema = z.record(z.string(),
    z.array(SessionSchema)
  );

export type SessionObjectResponse = z.infer<typeof SessionObjectResponseSchema>;
