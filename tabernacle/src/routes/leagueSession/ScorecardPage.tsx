import { useForm, Controller } from "react-hook-form";

import { useScorecardInfo } from "../../hooks";

import {
  CheckBoxInput,
  MultiSelector,
  Selector,
} from "../../components/FormInputs";
import StandardButton from "../../components/Button";

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

export default function ScorecardPage() {
  const { filteredAchievements } = useScorecardInfo();
  const { control, handleSubmit, getValues, setValue, watch } = useForm();

  const cart = watch("winner-achievements") ?? [];

  const handleFormSubmit = (data: any) => {
    const { picker, ...clean } = data;
    console.log(clean);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="p-8 flex gap-2">
      <div className="w-1/2">
        {PLAYER_ACHIEVEMENT_MAP.map(({ label, slug, key }) => (
          <MultiSelector
            key={key}
            name={slug}
            control={control}
            placeholder={label}
            // TODO
            options={[]}
            classes="mb-2"
            getOptionLabel={(option: {
              name: string;
              participant_id: number;
            }) => option.name}
            getOptionValue={(option: {
              name: string;
              participant_id: number;
            }) => String(option.participant_id)}
          />
        ))}
        <Selector
          name="winner"
          placeholder="Winner"
          control={control}
          // TODO
          options={[]}
          classes="mb-2"
          disabled={false}
          defaultValue={undefined}
          // TODO
          rules={{}}
          isClearable={true}
          getOptionLabel={(option: { name: string; participant_id: number }) =>
            option.name
          }
          getOptionValue={(option: { name: string; participant_id: number }) =>
            String(option.participant_id)
          }
          // TODO
          filterOption={() => false}
        />
        <Selector
          name="winner-commander"
          placeholder="Winner's Commander"
          control={control}
          options={[
            {
              id: -1,
              name: "Type To Select a Commander",
              disabled: true,
            },
            // TODO
            // ...commanders.commanders,
          ]}
          classes="mb-2"
          disabled={false}
          isClearable
          // TODO
          filterOption={
            (option: unknown, input: unknown) => false
            //{
            // if (input.length > 1) {
            //   return option.label.toLowerCase().includes(input.toLowerCase());
            // }
            // return option.value === "notOption";
            //}
          }
          getOptionLabel={(option: { name: string; id: number }) => option.name}
          getOptionValue={(option: { name: string; id: number }) =>
            String(option.id)
          }
          rules={
            {
              // validate: (value) =>
              //   selectedWinner && !value
              //     ? "Commander is required when winner is selected"
              //     : undefined,
            }
          }
          isOptionDisabled={(o) => o.id === -1}
        />
        <Selector
          name="partner-commander"
          placeholder="Partner/Background/Companion"
          control={control}
          options={[
            {
              id: -1,
              name: "Type To Select a Partner/Background/Companion",
              disabled: true,
            },
            // TODO
            // ...commanders.partners,
          ]}
          classes="mb-2"
          // TODO
          disabled={/*endInDraw || !winnerCommander?.name*/ false}
          isClearable
          // TODO
          filterOption={
            (option: unknown, input: unknown) => false //{
            // if (input.length > 1) {
            //   return option.label.toLowerCase().includes(input.toLowerCase());
            // }
            // return option.value === "notOption";
            //}
          }
          getOptionLabel={(option: { name: string }) => option.name}
          getOptionValue={(option: { id: number }) => String(option.id)}
          rules={{}}
          isOptionDisabled={(o) => o.id === -1}
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
                classes="flex justify-between items-center mb-2"
                checked={!!field.value}
                disabled={false}
                label={label}
              />
            )}
          />
        ))}
      </div>
      <div className="w-1/2 flex flex-col gap-2">
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
        <div className="h-full bg-zinc-100 p-4 rounded-lg border drop-shadow-md flex flex-col gap-2">
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
        <div className="mt-2 flex justify-end">
          <StandardButton title="Submit" type="submit" />
        </div>
      </div>
    </form>
  );
}
