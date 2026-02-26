import { useMemo } from "react";
import { useGetScorecardAchievementOptionsQuery } from "../api/apiSlice";

/** Raw option shape for Selector (getOptionLabel / getOptionValue) */
export type ScorecardAchievementPickerOption =
  | { id: number; name: string }
  | { achievement_id: number; scalable_term_id: number; name: string };

/** Value/label shape for SimpleSelect (react-select) */
export type ScorecardAchievementSelectOption =
  | { value: number; label: string }
  | { value: { achievement_id: number; scalable_term_id: number }; label: string };

export default function useScorecardAchievementOptions() {
  const { data, isLoading } = useGetScorecardAchievementOptionsQuery();

  const options = useMemo<ScorecardAchievementPickerOption[]>(() => {
    if (!data) return [];
    const legacy = data.legacy.map((a) => ({ id: a.id, name: a.name }));
    const scalable = data.scalable.map((a) => ({
      achievement_id: a.achievement_id,
      scalable_term_id: a.scalable_term_id,
      name: a.name,
    }));
    return [...legacy, ...scalable];
  }, [data]);

  const selectOptions = useMemo<ScorecardAchievementSelectOption[]>(() => {
    if (!data) return [];
    const legacy = data.legacy.map(({ id, name }) => ({ value: id, label: name }));
    const scalable = data.scalable.map(
      ({ achievement_id, scalable_term_id, name }) => ({
        value: { achievement_id, scalable_term_id },
        label: name,
      }),
    );
    return [...legacy, ...scalable];
  }, [data]);

  return { data, isLoading, options, selectOptions };
}
