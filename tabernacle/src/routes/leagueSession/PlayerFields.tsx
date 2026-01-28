import { useFormContext, Controller, useWatch } from "react-hook-form";
import { CheckBoxInput, MultiSelector } from "../../components/FormInputs";

import { useScorecardInfoCtx } from "./ScorecardCTX";

const PLAYER_ACHIEVEMENT_MAP = [
  { key: 1, label: "Did anyone bring a snack to share?", slug: "bring-snack" },
  {
    key: 2,
    label: "Did anyone use a decklist that has been shared?",
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
  {
    key: 5,
    label:
      "Did anyone participate with a booster pack purchased for more than $10?",
    slug: "money-pack",
  },
];

const fieldsToReset = [
  { name: "lose-the-game-effect", default: false },
  { name: "zero-or-less-life", default: false },
  { name: "win-the-game-effect", default: false },
  { name: "commander-damage", default: false },
  { name: "last-in-order", default: false },
  { name: "winner-commander", default: { value: undefined, label: undefined } },
  {
    name: "partner-commander",
    default: { value: undefined, label: undefined },
  },
  { name: "winner", default: { value: undefined, label: undefined } },
];

export default function PlayerFields() {
  const { control, resetField, setValue } = useFormContext();
  const { participants } = useScorecardInfoCtx();
  const endDraw = useWatch({ control, name: "end-draw" });
  return (
    <>
      <h2 className="text-lg font-semibold text-zinc-700">General</h2>
      <div className="border-t space-y-2 " />
      {PLAYER_ACHIEVEMENT_MAP.map(({ label, slug, key }) => (
        <div className="mt-2 italic" key={key}>
          <div className="text-sm mt-1">{label}</div>
          <MultiSelector
            key={key}
            name={slug}
            control={control}
            options={participants || []}
            getOptionLabel={(option) => option.name}
            getOptionValue={(option) => String(option.id)}
          />
        </div>
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
            classes="flex justify-between items-center space-y-2"
            onChange={() => {
              setValue("end-draw", !endDraw);
              setValue("winner-achievements", null);
              fieldsToReset.forEach((field) =>
                resetField(field.name, { defaultValue: field.default })
              );
            }}
          />
        )}
      />
    </>
  );
}
