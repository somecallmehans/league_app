import type {
  BaseQueryFn,
  EndpointBuilder,
  FetchArgs,
  FetchBaseQueryError,
  FetchBaseQueryMeta,
} from "@reduxjs/toolkit/query";

export type Tag =
  | "Sessions"
  | "Pods"
  | "Participants"
  | "Achievements"
  | "Earned"
  | "PodsAchievements"
  | "Rounds"
  | "SignedIn"
  | "Configs"
  | "Scoresheet"
  | "Decklists"
  | "PersonalDecklists";

export type BaseBQ = BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError,
  {},
  FetchBaseQueryMeta
>;

export type ApiBuilder = EndpointBuilder<BaseBQ, Tag, "api">;
