import { useFormContext, useWatch } from "react-hook-form";
import { useLazyGetDecklistQuery } from "../../api/apiSlice";
import { Selector, TextInput } from "../../components/FormInputs";

import { type DecklistCodeResponse } from "../../types/decklist_schemas";

import { useScorecardInfoCtx } from "./ScorecardCTX";
import { toast } from "react-toastify";

function isCodeResponse(res: any): res is DecklistCodeResponse {
  return "winner-commander" in res;
}

const CODE_FIELDS = [
  "winner-commander",
  "partner-commander",
  "companion-commander",
  "winner-achievements",
] as const;

function CommanderFields() {
  const { control, getValues, setValue } = useFormContext();
  const { commanderOptions, partnerOptions, companionOptions } =
    useScorecardInfoCtx();
  const selectedWinner = useWatch({ control, name: "winner" });
  const selectedCommander = useWatch({ control, name: "winner-commander" });

  const endInDraw = useWatch({ control, name: "end-draw" });

  return (
    <div>
      <h2 className="text-lg font-semibold text-zinc-700">Deckbuilding</h2>
      <div className="border-t space-y-2 " />
      <div className="mt-2  italic">
        <div className="text-sm  mt-1">Commander</div>
        <Selector
          name="winner-commander"
          placeholder="Winner's Commander"
          control={control}
          options={commanderOptions || []}
          disabled={endInDraw}
          isClearable
          filterOption={(option, input) => {
            if (input.length > 1) {
              return option.label.toLowerCase().includes(input.toLowerCase());
            }
            return option.value === "-1";
          }}
          getOptionLabel={(option) => option.name}
          getOptionValue={(option) => String(option.id)}
          rules={{
            validate: (value) =>
              selectedWinner && !value
                ? "Commander is required when winner is selected"
                : undefined,
          }}
          isOptionDisabled={(o) => o.id === -1}
        />
      </div>

      <div className="mt-2 italic">
        <div className="text-sm  mt-1">Partner (Optional)</div>

        <Selector
          name="partner-commander"
          placeholder="Partner/Background/Companion"
          control={control}
          options={partnerOptions || []}
          disabled={endInDraw || !selectedCommander?.name}
          isClearable
          filterOption={(option, input) => {
            if (input.length > 1) {
              return option.label.toLowerCase().includes(input.toLowerCase());
            }
            return option.value === "-1";
          }}
          getOptionLabel={(option) => option.name}
          getOptionValue={(option) => String(option.id)}
          isOptionDisabled={(o) => o.id === -1}
        />
      </div>

      <div className="mt-2 italic">
        <div className="text-sm  mt-1">Companion (Optional)</div>
        <Selector
          name="companion-commander"
          placeholder="Companion"
          control={control}
          options={companionOptions || []}
          disabled={endInDraw || !selectedCommander?.name}
          isClearable
          getOptionLabel={(option) => option.name}
          getOptionValue={(option) => String(option.id)}
          isOptionDisabled={(o) => o.id === -1}
          onChange={(selected) => {
            const cart = getValues("winner-achievements") ?? [];
            if (!selected) {
              setValue("companion-commander", null, {
                shouldDirty: true,
                shouldValidate: false,
              });
              setValue(
                "winner-achievements",
                cart.filter(({ id }: { id: number }) => id !== 28)
              );
              return;
            }
            if (cart.some(({ id }: { id: number }) => id === 28)) {
              return;
            }

            setValue("winner-achievements", [
              ...cart,
              {
                id: 28,
                name: "Win with a deck that includes one of Ikoria’s “Companions” as a companion",
                tempId: crypto.randomUUID(),
              },
            ]);
          }}
        />
      </div>
    </div>
  );
}

function DecklistCodeField() {
  const { control, getValues, setValue } = useFormContext();
  const mode = useWatch({ control, name: "submissionMode" });
  const selectedWinner = useWatch({ control, name: "winner" }) ?? undefined;
  const [triggerDecklist, { data, isFetching, isError, error }] =
    useLazyGetDecklistQuery();

  const onBlur = async () => {
    const code: string | undefined = getValues("decklist-code")
      ?.trim()
      .toUpperCase();
    if (!code) return;

    try {
      const res = await triggerDecklist({
        code,
        participant_id: undefined,
        round_id: undefined,
      }).unwrap();

      if (isCodeResponse(res)) {
        CODE_FIELDS.forEach((field) => {
          setValue(field, res[field]);
        });
        const curr = getValues("submit-to-discord") ?? [];

        if (
          selectedWinner &&
          !curr.some((x: any) => x.id === selectedWinner.id)
        ) {
          setValue("submit-to-discord", [...curr, selectedWinner]);
        }
      }
    } catch (e) {
      toast.error("Invalid code provided");
    }
  };

  if (mode !== "decklist") return null;

  return (
    <div>
      <h2 className="text-lg font-semibold text-zinc-700">Decklist</h2>
      <div className="border-t mb-2" />
      <div className="mt-2 italic">
        <div className="text-sm mt-1">Decklist Code</div>
        <TextInput
          name="decklist-code"
          control={control}
          type="text"
          placeholder="Add 4 Letter Code (i.e. w/o DL-)"
          classes="text-lg w-full border rounded-lg p-2"
          onBlur={onBlur}
        />
      </div>
    </div>
  );
}

function AchievementCart() {
  const { control, getValues, setValue } = useFormContext();
  const { filteredAchievements } = useScorecardInfoCtx();

  const cart = useWatch({ control, name: "winner-achievements" }) ?? [];
  const endInDraw = useWatch({ control, name: "end-draw" });

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="text-sm  mt-1">Deckbuilding Achievements</div>
      <div className="flex justify-between gap-2 mb-2 shrink-0">
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
          disabled={endInDraw}
        />
      </div>
      <div className="h-full min-h-0 bg-zinc-100 p-4 rounded-lg border drop-shadow-md flex flex-col gap-2 overflow-y-auto">
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

export default function AchievementCartGate() {
  const { control } = useFormContext();
  const mode = useWatch({ control, name: "submissionMode" });
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 space-y-4">
        {(mode === "manual" || !mode) && <CommanderFields />}

        {mode === "decklist" && (
          <div className="space-y-4">
            <DecklistCodeField />
            <CommanderFields />
          </div>
        )}
      </div>

      <div className="h-full min-h-0 mt-2">
        <AchievementCart />
      </div>
    </div>
  );
}
