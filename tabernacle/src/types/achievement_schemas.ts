import { z } from "zod";
import {
  WinnerSchema,
  UpsertEarnedWinnerInfoSchema,
  UpsertEarnedWinInfoSchema,
} from "./pod_schemas";

export const AchievementTypeSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  hex_code: z.string(),
});

type AchievementType = z.infer<typeof AchievementTypeSchema>;
const EMPTY_TYPE: AchievementType = {
  id: -1,
  name: "",
  description: "",
  hex_code: "",
};

export const AchievementTypeListResponseSchema = z.array(AchievementTypeSchema);
export type AchievementTypeListResponse = z.infer<
  typeof AchievementTypeListResponseSchema
>;

export interface ParentAchievement {
  id: number;
  name: string;
  point_value: number;
}

export const ParentAchievementSchema = z.object({
  id: z.number(),
  name: z.string(),
  point_value: z.number(),
});

export interface Restrictions {
  id: number;
  name: string;
  url: string | null;
}

export const RestrictionsSchema = z.object({
  id: z.number().optional(),
  name: z.string(),
  url: z.string().nullable(),
});

export const AchievementRestrictionsSchema = z.array(RestrictionsSchema);

export interface Achievement {
  id: number;
  name?: string | null;
  full_name?: string | null;
  deleted?: boolean | null;
  slug?: string | null;
  points?: number | null;
  point_value?: number | null;
  type?: z.infer<typeof AchievementTypeSchema> | null;
  type_id?: number | null;
  parent?: z.infer<typeof ParentAchievementSchema> | null;
  parent_id?: number | null;
  restrictions?: z.infer<typeof AchievementRestrictionsSchema> | null;
}

export interface GetAchievement {
  id: number;
  name: string;
  full_name: string;
  slug?: string | null;
  points?: number | null;
  point_value?: number | null;
  type?: z.infer<typeof AchievementTypeSchema> | null;
  type_id?: number | null;
  parent?: z.infer<typeof ParentAchievementSchema> | null;
  parent_id?: number | null;
  restrictions?: z.infer<typeof AchievementRestrictionsSchema> | null;
}

export const AchievementSchema: z.ZodType<GetAchievement> = z.lazy(() =>
  z.object({
    id: z.number(),
    name: z.string(),
    full_name: z.string(),
    parent_id: z.number().nullish(),
    slug: z.string().nullish(),
    points: z.number().nullish(),
    point_value: z.number().nullish(),
    type: AchievementTypeSchema.nullish(),
    type_id: z.number().nullish(),
    parent: ParentAchievementSchema.nullish(),
    restrictions: AchievementRestrictionsSchema.nullish(),
  })
);

export const AchievementListResponseSchema = z.array(AchievementSchema);

export const AchievementObjectResponseSchema = z.object({
  map: z.record(z.string(), z.array(AchievementSchema)),
  data: z.array(AchievementSchema),
  lookup: z.record(z.string(), AchievementSchema),
  parents: z.array(z.number()),
  points_set: z.array(z.number()),
});

export type AchievementListResponse = z.infer<
  typeof AchievementListResponseSchema
>;
export type AchievementObjectResponse = z.infer<
  typeof AchievementObjectResponseSchema
>;

// special version of the achievement schema that has a bunch
// of extra stuff on it. Technically "earned" aka ParticipantAchievement
export const PodAchievementSchema = z.object({
  achievement_id: z.number(),
  achievement_name: z.string(),
  deleted: z.boolean(),
  earned_points: z.number(),
  id: z.number(),
  participant_id: z.number(),
  participant_name: z.string(),
  points: z.number(),
  slug: z.string().nullable(),
});

export const PodAchievementResponseSchema = z.object({
  pod_achievements: z.array(PodAchievementSchema).default([]),
  winning_commander: WinnerSchema.nullable().default(null),
});
export type PodAchievementResponse = z.infer<
  typeof PodAchievementResponseSchema
>;
export const EMPTY_PODACHIEVEMENT: PodAchievementResponse =
  PodAchievementResponseSchema.parse({});

export const EarnedAchievementStubSchema = z.object({
  id: z.number(),
  full_name: z.string(),
  earned_points: z.number(),
});
export const EarnedAchievementStubListResponseSchema = z
  .array(EarnedAchievementStubSchema)
  .default([]);

export type EarnedAchievementSubListResponse = z.infer<
  typeof EarnedAchievementStubListResponseSchema
>;

// POST
export const UpsertAchievementResponseSchema = z.object({
  name: z.string(),
  point_value: z.number(),
  restrictions: z.array(RestrictionsSchema),
  achievements: z.array(z.object({ name: z.string() })),
  type: AchievementTypeSchema,
  type_id: z.number().optional(),
});
export type UpsertAchievementResponse = z.infer<
  typeof UpsertAchievementResponseSchema
>;
export const EMPTY_ACHIEVEMENT_RESPONSE: UpsertAchievementResponse = {
  name: "",
  point_value: 0,
  restrictions: [],
  achievements: [],
  type: EMPTY_TYPE,
  type_id: undefined,
};
export type UpsertAchievementRequest = Achievement;

const UpsertEarnedAchievementSchema = z
  .object({
    slug: z.string().optional(),
    achievement_id: z.number().optional(),
    participant_id: z.number(),
    round_id: z.number(),
    session_id: z.number(),
  })
  .refine((v) => v.slug !== undefined || v.achievement_id !== undefined, {
    message: "Provide either slug or achievement_id",
  });

export const UpsertEarnedRequestSchema = z.object({
  new: z.array(UpsertEarnedAchievementSchema),
  update: z.array(UpsertEarnedAchievementSchema),
  winnerInfo: UpsertEarnedWinnerInfoSchema,
  winInfo: UpsertEarnedWinInfoSchema,
});

export type UpsertEarnedRequest = z.infer<typeof UpsertEarnedRequestSchema>;

export const UpsertEarnedSuccessSchema = z.object({
  message: z.literal("success"),
});

export const UpsertEarnedErrorSchema = z.object({
  error: z.string(),
});

export const UpsertEarnedResponseSchema = z.union([
  UpsertEarnedSuccessSchema,
  UpsertEarnedErrorSchema,
]);

export type UpsertEarnedResponse = z.infer<typeof UpsertEarnedResponseSchema>;

export const UpsertPartcipantAchievementRequestSchema = z.object({
  participant_id: z.number(),
  achievement_id: z.number(),
  round_id: z.number(),
});

export type UpsertParticipantAchievementRequest = z.infer<
  typeof UpsertPartcipantAchievementRequestSchema
>;

const IdName = z.object({ id: z.number(), name: z.string() });

const ScoresheetBase = z.object({
  "lend-deck": z.unknown(),
  "money-pack": z.unknown(),
  "bring-snack": z.unknown(),
  "knock-out": z.unknown(),
  "submit-to-discord": z.unknown(),

  "last-in-order": z.boolean(),
  "zero-or-less-life": z.boolean(),
  "win-the-game-effect": z.boolean(),
  "lose-the-game-effect": z.boolean(),
  "commander-damage": z.boolean(),
  "end-draw": z.boolean(),

  winner: z.unknown().optional(),
  "winner-commander": z.unknown().optional(),
  "partner-commander": z.unknown().optional(),
  "winner-achievements": z.unknown(),
});

const IdListFieldsRequest = {
  "lend-deck": z.array(z.number()),
  "money-pack": z.array(z.number()),
  "bring-snack": z.array(z.number()),
  "knock-out": z.array(z.number()),
  "submit-to-discord": z.array(z.number()),
} as const;

const IdListFieldsResponse = {
  "lend-deck": z.array(IdName),
  "money-pack": z.array(IdName),
  "bring-snack": z.array(IdName),
  "knock-out": z.array(IdName),
  "submit-to-discord": z.array(IdName),
} as const;

export const ScoresheetFormRequestSchema = ScoresheetBase.extend({
  ...IdListFieldsRequest,
  winner: z.number().nullable(),
  "winner-commander": z.number().nullable(),
  "partner-commander": z.number().nullable(),
  "winner-achievements": z.array(z.number()).nullable(),
  pod_id: z.number(),
  round_id: z.number(),
});

export type ScoresheetFormRequest = z.infer<typeof ScoresheetFormRequestSchema>;

export const ScoresheetFormResponseSchema = ScoresheetBase.extend({
  ...IdListFieldsResponse,
  winner: IdName.nullable(),
  "winner-commander": z
    .object({ id: z.number(), name: z.string(), color_id: z.number() })
    .nullable(),
  "partner-commander": z
    .object({ id: z.number(), name: z.string(), color_id: z.number() })
    .nullable(),
  "winner-achievements": z.array(IdName),
  meta: z.object({ isSubmitted: z.boolean() }),
});

export type ScoresheetFormResponse = z.infer<
  typeof ScoresheetFormResponseSchema
>;
