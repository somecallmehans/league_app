import { useFormContext, useWatch, Controller } from "react-hook-form";
import { CheckBoxInput, Selector } from "../../components/FormInputs";
import { useCommanderColors } from "../../hooks";
import { useScorecardInfoCtx } from "./ScorecardCTX";

import ColorGrid from "../../components/ColorGrid";

const PLAYER_WIN_MAP = [
  {
    key: 1,
    label: "Win while going last in turn order",
    slug: "last-in-order",
  },
  {
    key: 2,
    label: "Win while dealing lethal commander damage",
    slug: "commander-damage",
  },
  {
    key: 3,
    label: "Win via a lose the game effect",
    slug: "lose-the-game-effect",
  },
  {
    key: 4,
    label: "Win via a win the game effect",
    slug: "win-the-game-effect",
  },
  {
    key: 5,
    label: "Win while being at zero or less life",
    slug: "zero-or-less-life",
  },
];

export default function WinnerFields() {
  const { control } = useFormContext();
  const { participants } = useScorecardInfoCtx();
  const endInDraw = useWatch({ control, name: "end-draw" });

  const commander = useWatch({ control, name: "winner-commander" });
  const partner = useWatch({ control, name: "partner-commander" });

  const { colorName } = useCommanderColors(
    commander?.color_id,
    partner?.color_id
  );

  return (
    <>
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-zinc-700">Winner</h2>
        <ColorGrid colors={colorName} submitted show noHover isSmall />
      </div>
      <div className="border-t space-y-2 " />
      <Selector
        name="winner"
        placeholder="Winner"
        control={control}
        options={participants || []}
        classes="space-y-2 "
        disabled={endInDraw}
        rules={{
          validate: (value) =>
            endInDraw || value
              ? undefined
              : "Winner is required if the game didn't end in a draw",
        }}
        isClearable={true}
        getOptionLabel={(option) => option.name}
        getOptionValue={(option) => String(option.id)}
      />
      {PLAYER_WIN_MAP.map(({ label, slug, key }) => (
        <Controller
          key={key}
          name={slug}
          control={control}
          defaultValue={false}
          render={({ field }) => (
            <CheckBoxInput
              {...field}
              classes="flex justify-between items-center space-y-2 "
              checked={!!field.value}
              disabled={endInDraw}
              label={label}
            />
          )}
        />
      ))}
    </>
  );
}
