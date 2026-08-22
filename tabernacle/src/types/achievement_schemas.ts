import { z } from "zod";
import {
  WinnerSchema,
  UpsertEarnedWinnerInfoSchema,
  UpsertEarnedWinInfoSchema,
} from "./pod_schemas";

export const AchievementTypeSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
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

export const AchievementRaritySchema = z.object({
  id: z.number(),
  name: z.string(),
  hex_code: z.string(),
});

export const AchievementRarityListResponseSchema = z.array(
  AchievementRaritySchema,
);
export type AchievementRarityListResponse = z.infer<
  typeof AchievementRarityListResponseSchema
>;

export const RARITY_ORDER = {
  "Most Popular": 0,
  Uncommon: 1,
  Rare: 2,
  Mythic: 3,
} as const;

const normalizeAchievementTypeName = (name: string) =>
  (name ?? "").trim().toLowerCase().replace(/-/g, " ");

/** Display order for achievement type sections on the public All tab. */
const ACHIEVEMENT_TYPE_ORDER_ALIASES: readonly (readonly string[])[] = [
  ["deck foundation"],
  ["basic check"],
  ["bonus restriction", "bonus restrictions"],
  ["scalable terms", "scalable"],
  ["non deckbuilding", "non deck building"],
];

const ACHIEVEMENT_TYPE_ORDER_INDEX = new Map<string, number>(
  ACHIEVEMENT_TYPE_ORDER_ALIASES.flatMap((aliases, index) =>
    aliases.map((alias) => [alias, index]),
  ),
);

export function getAchievementTypeOrderIndex(typeName: string): number {
  const normalized = normalizeAchievementTypeName(typeName);
  return (
    ACHIEVEMENT_TYPE_ORDER_INDEX.get(normalized) ?? Number.MAX_SAFE_INTEGER
  );
}

export interface AchievementEarningRule {
  key: string;
  name: string;
  hex_code: string;
  rule: string;
}

const ACHIEVEMENT_EARNING_RULE_DEFINITIONS = [
  {
    key: "non-deckbuilding",
    aliases: ["non deckbuilding", "non deck building"],
    displayName: "Non-Deckbuilding",
    rule: "These may be earned any number of times during each monthly league.",
  },
  {
    key: "deckbuilding",
    aliases: ["deckbuilding", "basic check"],
    displayName: "Deckbuilding",
    rule: "When earned, these may not be earned again by the same player using the same color identity, until the following week.",
  },
  {
    key: "foundation",
    aliases: ["deck foundation", "foundation"],
    displayName: "Foundation",
    rule: "No more than one foundation achievement may be earned per win. For all format-related foundation achievements, only the commander banned list applies (i.e. don't worry about banned lists for modern, pioneer, pauper, etc).",
  },
  {
    key: "scalable",
    aliases: ["scalable terms", "scalable"],
    displayName: "Scalable",
    rule: "Individual cards may not qualify for multiple scalable achievements in a single deck. The same tier of scalable achievement may be earned multiple times within the same deck however, if each instance is for a different scalable quality.",
  },
] as const;

export function buildAchievementEarningRules(
  types: AchievementTypeListResponse | undefined,
): AchievementEarningRule[] {
  return ACHIEVEMENT_EARNING_RULE_DEFINITIONS.map((entry) => {
    const match = types?.find((type) => {
      const normalizedName = normalizeAchievementTypeName(type.name);
      return entry.aliases.some((alias) => alias === normalizedName);
    });

    return {
      key: entry.key,
      name: entry.displayName,
      hex_code: match?.hex_code ?? "#9CA3AF",
      rule: entry.rule,
    };
  });
}

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
  rarity?: string | null;
  rarity_id?: number | null;
  rarity_hex?: string | null;
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
  rarity?: string | null;
  rarity_id?: number | null;
  rarity_hex?: string | null;
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
    rarity: z.string().nullish(),
    rarity_id: z.number().nullish(),
    rarity_hex: z.string().nullish(),
    parent: ParentAchievementSchema.nullish(),
    restrictions: AchievementRestrictionsSchema.nullish(),
  }),
);

export const AchievementListResponseSchema = z.array(AchievementSchema);

/** Same shape as get_achievements/ plus earned_count from most_earned_achievements/ */
export const MostEarnedAchievementSchema = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
  parent_id: z.number().nullish(),
  slug: z.string().nullish(),
  points: z.number().nullish(),
  point_value: z.number().nullish(),
  type: AchievementTypeSchema.nullish(),
  type_id: z.number().nullish(),
  rarity_id: z.number().nullish(),
  parent: ParentAchievementSchema.nullish(),
  restrictions: AchievementRestrictionsSchema.nullish(),
  deleted: z.boolean().nullish(),
  earned_count: z.number(),
  rarity: z.string().nullish(),
  rarity_hex: z.string().nullish(),
});

export const MostEarnedAchievementsResponseSchema = z.array(
  MostEarnedAchievementSchema,
);

export type MostEarnedAchievementsResponse = z.infer<
  typeof MostEarnedAchievementsResponseSchema
>;

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
  type: AchievementTypeSchema.nullish(),
  type_id: z.number().nullish(),
  rarity: z.string().nullish(),
  rarity_id: z.number().nullish(),
  rarity_hex: z.string().nullish(),
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
  type_id: null,
  rarity: null,
  rarity_id: null,
  rarity_hex: null,
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
  scalable_term_id: z.number().optional(),
});

export type UpsertParticipantAchievementRequest = z.infer<
  typeof UpsertPartcipantAchievementRequestSchema
>;

/** Response: legacy has id+name, new adds achievement_id+scalable_term_id */
export const WinnerAchievementItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  achievement_id: z.number().optional(),
  scalable_term_id: z.number().optional(),
});
export type WinnerAchievementItem = z.infer<typeof WinnerAchievementItemSchema>;

const IdName = z.object({ id: z.number(), name: z.string() });

/** Request: legacy uses id, new uses achievement_id + scalable_term_id */
export const WinnerAchievementRequestSchema = z.union([
  z.object({ id: z.number() }),
  z.object({
    achievement_id: z.number(),
    scalable_term_id: z.number(),
  }),
]);
export type WinnerAchievementRequest = z.infer<
  typeof WinnerAchievementRequestSchema
>;

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
  "winner-achievements": z.array(WinnerAchievementRequestSchema).nullable(),
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
  "winner-achievements": z.array(WinnerAchievementItemSchema),
  meta: z.object({ isSubmitted: z.boolean() }),
});

export type ScoresheetFormResponse = z.infer<
  typeof ScoresheetFormResponseSchema
>;

export const ScorecardAchievementOptionLegacySchema = z.object({
  id: z.number(),
  name: z.string(),
});
export const ScorecardAchievementOptionScalableSchema = z.object({
  achievement_id: z.number(),
  scalable_term_id: z.number(),
  name: z.string(),
});
export const ScorecardAchievementOptionsResponseSchema = z.object({
  legacy: z.array(ScorecardAchievementOptionLegacySchema),
  scalable: z.array(ScorecardAchievementOptionScalableSchema),
});
export type ScorecardAchievementOptionsResponse = z.infer<
  typeof ScorecardAchievementOptionsResponseSchema
>;

const ScalableTermInfoSchema = z.object({
  id: z.number(),
  info: z.string(),
});

export const ScalableTermItemSchema = z.object({
  id: z.number(),
  term_display: z.string(),
  type_id: z.number().nullable().optional(),
  info: z.array(ScalableTermInfoSchema).optional().default([]),
});
export const ScalableTermsTypeGroupSchema = z.object({
  id: z.number().nullable(),
  name: z.string(),
  terms: z.array(ScalableTermItemSchema),
});
export const ScalableTermsResponseSchema = z.object({
  types: z.array(ScalableTermsTypeGroupSchema),
});
export type ScalableTermsResponse = z.infer<typeof ScalableTermsResponseSchema>;

export const ScalableTermTypeItemSchema = z.object({
  id: z.number(),
  name: z.string(),
});
export const ScalableTermTypeListSchema = z.array(ScalableTermTypeItemSchema);
export type ScalableTermTypeListResponse = z.infer<
  typeof ScalableTermTypeListSchema
>;
