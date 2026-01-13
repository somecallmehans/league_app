import { useFormContext, useWatch, Controller } from "react-hook-form";
import { Selector } from "../../components/FormInputs";

import { useScorecardInfoCtx } from "./ScorecardCTX";

export default function AchievementCart() {
  const { control, getValues, setValue } = useFormContext();
  const { filteredAchievements } = useScorecardInfoCtx();
  const cart = useWatch({ control, name: "winner-achievements" }) ?? [];
  const endDraw = useWatch({ control, name: "end-draw" });
  return (
    <div className="flex flex-col">
      <h2 className="text-lg font-semibold text-zinc-700">Deckbuilding</h2>
      <div className="border-t mb-2" />
      <div className="flex justify-between gap-2 mb-2">
        <Selector
          name="picker"
          options={filteredAchievements || []}
          control={control}
          placeholder="Deck Building Achievements"
          getOptionLabel={(option) => option.name}
          getOptionValue={(option) => String(option.id)}
          containerClasses="grow mt-2"
          isClearable
          onChange={(selected) => {
            if (!selected) {
              setValue("picker", null, {
                shouldDirty: true,
                shouldValidate: false,
              });
              return;
            }

            const curr = getValues("winner-achievements") ?? [];

            setValue(
              "winner-achievements",
              [...curr, { ...(selected as any), tempId: crypto.randomUUID() }],
              { shouldDirty: true, shouldValidate: false }
            );

            setValue("picker", null, {
              shouldDirty: true,
              shouldValidate: false,
            });
          }}
          disabled={endDraw}
        />
      </div>
      <div className="h-64 md:h-full bg-zinc-100 p-4 rounded-lg border drop-shadow-md flex flex-col gap-2">
        {cart.map((c: { tempId: string; name: string | undefined }) => (
          <div
            className="flex justify-between bg-white rounded-lg p-2 shadow-md  items-center"
            key={c.tempId}
          >
            <div className="text-sm">{c.name}</div>
            <span aria-hidden className="flex-1 h-4  mx-1" />
            <i
              className="fa fa-trash text-zinc-500 hover:text-red-500"
              onClick={() => {
                setValue(
                  "winner-achievements",
                  cart.filter((x: any) => x.tempId !== c.tempId)
                );
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
