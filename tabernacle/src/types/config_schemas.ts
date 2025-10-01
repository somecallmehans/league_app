import { z } from "zod";

export interface Config {
  key: string;
  value: unknown;
  description?: string;
  name: string;
}

export type ConfigsTransformed = {
  list: Config[];
  byKey: Record<string, Config>;
};

export const ConfigRequestSchema = z.object({
  value: z.string(),
  key: z.string(),
});
export type ConfigRequest = z.infer<typeof ConfigRequestSchema>;
