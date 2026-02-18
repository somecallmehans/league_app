import { z } from "zod";
export function safeParseWithFallback<T>(
  schema: z.ZodType<T>,
  data: unknown,
  fallback: T
): T {
  const r = schema.safeParse(data);
  console.log(r);
  return r.success ? r.data : fallback;
}
