import { z } from "zod";

export const ConfigRequestSchema = z.object({
  value: z.string(),
  key: z.string(),
});
export type ConfigRequest = z.infer<typeof ConfigRequestSchema>;
