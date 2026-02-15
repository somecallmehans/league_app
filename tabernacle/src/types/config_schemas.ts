import { z } from "zod";

export interface Config {
  key: string;
  value: string;
  description?: string;
  name: string;
}

export type ConfigsTransformed = {
  list: Config[];
  byKey: Record<string, Config>;
};

export const ConfigRequestSchema = z.object({
  value: z.union([z.string(), z.number()]),
  key: z.string(),
});
export type ConfigRequest = z.infer<typeof ConfigRequestSchema>;
