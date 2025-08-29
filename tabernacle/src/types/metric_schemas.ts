import { z } from "zod";

const MetricMapSchema = z.record(z.string(), z.number());

const AchievementChartItem = z.object({
  count: z.number(),
  name: z.string(),
  point_value: z.number().nullable(),
});
export const AchievementChartByIdSchema = z.record(
  z.string(),
  AchievementChartItem
);

export const MetricSchema = z.object({
  achievement_chart: z.record(z.string(), AchievementChartItem).default({}),
  big_earner: z
    .object({
      participant__name: z.string(),
      participant_id: z.number(),
      total_points: z.number(),
    })
    .default({ participant__name: "", participant_id: -1, total_points: 0 }),
  big_winners: z
    .array(z.object({ name: z.string(), wins: z.number() }))
    .default([]),
  biggest_burger: MetricMapSchema.default({}),
  color_pie: MetricMapSchema.default({}),
  common_commanders: MetricMapSchema.default({}),
  last_draw: MetricMapSchema.default({}),
  most_draws: MetricMapSchema.default({}),
  most_earned: MetricMapSchema.default({}),
  most_knockouts: MetricMapSchema.default({}),
  most_last_wins: MetricMapSchema.default({}),
  overall_points: MetricMapSchema.default({}),
  snack_leaders: MetricMapSchema.default({}),
  top_winners: MetricMapSchema.default({}),
});

export type Metric = z.infer<typeof MetricSchema>;

export const EMPTY_METRIC: Metric = MetricSchema.parse({});
