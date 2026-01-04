import { useFormContext, Controller } from "react-hook-form";
import { CheckBoxInput, MultiSelector } from "../../components/FormInputs";

import { useScorecardInfoCtx } from "./ScorecardCTX";

const PLAYER_ACHIEVEMENT_MAP = [
  { key: 1, label: "Did anyone bring a snack to share?", slug: "bring-snack" },
  {
    key: 2,
    label: "Did anyone use a decklist that has been shared on Discord?",
    slug: "submit-to-discord",
  },
  {
    key: 3,
    label: "Did anyone lend a deck to another league participant?",
    slug: "lend-deck",
  },
  {
    key: 4,
    label: "Did anyone who did not win knock out other players?",
    slug: "knock-out",
  },
  // TODO: add to backend w/ slug
  {
    key: 5,
    label:
      "Did anyone participate with a booster pack purchased for more than $10?",
    slug: "money-pack",
  },
];

export default function PlayerFields() {
  const { control } = useFormContext();
  const { participants } = useScorecardInfoCtx();
  return (
    <>
      {PLAYER_ACHIEVEMENT_MAP.map(({ label, slug, key }) => (
        <MultiSelector
          key={key}
          name={slug}
          control={control}
          placeholder={label}
          options={participants || []}
          classes="mb-2"
          getOptionLabel={(option) => option.name}
          getOptionValue={(option) => String(option.id)}
        />
      ))}
      <Controller
        name="end-draw"
        control={control}
        defaultValue={false}
        render={({ field }) => (
          <CheckBoxInput
            {...field}
            checked={field.value}
            label="Did the game end in a draw?"
            classes="flex justify-between items-center mb-2"
          />
        )}
      />
    </>
  );
}
