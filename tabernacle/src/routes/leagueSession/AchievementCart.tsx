import { useFormContext, useWatch, Controller } from "react-hook-form";
import { Selector } from "../../components/FormInputs";
import StandardButton from "../../components/Button";

import { useScorecardInfoCtx } from "./ScorecardCTX";

export default function AchievementCart() {
  const { control, getValues, setValue } = useFormContext();
  const { filteredAchievements } = useScorecardInfoCtx();
  const cart = useWatch({ control, name: "winner-achievements" }) ?? [];

  return (
    <div className="md:w-1/2 flex flex-col gap-2">
      <div className="flex justify-between gap-2">
        <Selector
          name="picker"
          options={filteredAchievements || []}
          control={control}
          placeholder="Deck Building Achievements"
          getOptionLabel={(option) => option.name}
          getOptionValue={(option) => String(option.id)}
          containerClasses="grow"
          isClearable
        />
        <StandardButton
          action={() => {
            const selected = getValues("picker");
            if (!selected) return;

            const curr = getValues("winner-achievements") ?? [];
            setValue("winner-achievements", [
              ...curr,
              { ...selected, tempId: crypto.randomUUID() },
            ]);
            setValue("picker", null, {
              shouldDirty: true,
              shouldValidate: false,
            });
          }}
          type="button"
          title="Add"
        />
      </div>
      <div className="h-64 md:h-full bg-zinc-100 p-4 rounded-lg border drop-shadow-md flex flex-col gap-2">
        {cart.map((c: { tempId: string; name: string | undefined }) => (
          <div className="flex justify-between">
            <div className="text-sm truncate">{c.name}</div>
            <span
              aria-hidden
              className="flex-1 h-4 border-b-2 border-black border-dotted mx-1"
            />
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
