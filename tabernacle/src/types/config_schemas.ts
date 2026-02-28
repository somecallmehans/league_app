import { z } from "zod";

export type ConfigType = "text" | "number" | "select" | "checkbox";

export interface Config {
  key: string;
  value: string;
  description?: string;
  name: string;
  config_type?: ConfigType;
  options?: string[];
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
