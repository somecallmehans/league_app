import { z } from "zod"


export const RoundSchema = z.object({
    id: z.number(),
    round_number: z.union([z.literal(1), z.literal(2)]),
    deleted: z.boolean(),
    completed: z.boolean()
})
export type Round = z.infer<typeof RoundSchema>;

