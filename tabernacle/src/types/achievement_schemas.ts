import { boolean, z } from "zod";

export const AchievementTypeSchema = z.object({
    id: z.number(),
    name: z.string(),
    description: z.string(),
    hex_code: z.string()
})

export interface ParentAchievement {
    id: number;
    name: string;
    point_value: number;
}

export const ParentAchievementSchema = z.object({
    id: z.number(),
    name: z.string(),
    point_value: z.number()
})

export interface Restrictions {
    id: number;
    name: string;
    url: string | null;
}

export const RestrictionsSchema = z.object({
    id: z.number(),
    name: z.string(),
    url: z.string().nullable()
})

export const AchievementRestrictionsSchema = z.array(RestrictionsSchema)

export interface Achievement {
    id: number;
    name: string;
    full_name: string | null;
    deleted: boolean;
    slug: string | null;
    points: number | null;
    point_value: number | null;
    type: z.infer<typeof AchievementTypeSchema> | null;
    type_id: number | null;
    parent: z.infer<typeof ParentAchievementSchema> | null;
    parent_id: number | null;
    restrictions: z.infer<typeof AchievementRestrictionsSchema> | null;
}

export const AchievementSchema: z.ZodType<Achievement> = z.lazy(() =>
    z.object({
      id: z.number(),
      name: z.string(),
      full_name: z.string().nullable(),
      deleted: z.boolean(),
      parent_id: z.number().nullable(),
      slug: z.string().nullable(),
      points: z.number().nullable(),
      point_value: z.number().nullable(),
      type: AchievementTypeSchema.nullable(),
      type_id: z.number().nullable(),
      parent: ParentAchievementSchema.nullable(),
      restrictions: AchievementRestrictionsSchema.nullable()
    })
  );

export const AchievementListResponseSchema = z.array(AchievementSchema);

export type AchievementListResponse = z.infer<typeof AchievementListResponseSchema>;

