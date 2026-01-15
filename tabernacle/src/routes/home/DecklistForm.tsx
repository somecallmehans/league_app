import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  useForm,
  FormProvider,
  useFormContext,
  useWatch,
  Controller,
} from "react-hook-form";

import {
  useGetCommandersQuery,
  usePostDecklistMutation,
} from "../../api/apiSlice";
import { useGoBack, useDecklistCart, useCommanderColors } from "../../hooks";
import {
  TextInput,
  Selector,
  CheckBoxInput,
} from "../../components/FormInputs";
import { textValidate } from "../../components/Modals/SignInModal";
import StandardButton from "../../components/Button";
import { normalize } from "../leagueSession/ScorecardPage";

import ColorGrid from "../../components/ColorGrid";

const pointLookup: Record<number, number> = {
  5: 0,
  4: 1,
  3: 2,
  2: 3,
  1: 4,
  0: 5,
};

const AchievementCart = ({
  colorLength = -1,
}: {
  colorLength: number | undefined;
}) => {
  const { control, setValue, getValues } = useFormContext();
  const { achievements, lookup } = useDecklistCart();
  const cart = useWatch({ control, name: "achievements" }) ?? [];

  const sum = useMemo(() => {
    if (!cart) return [];
    return cart.reduce((acc: number, curr: any) => {
      acc += lookup?.[curr.id];
      return acc;
    }, pointLookup[colorLength] || 0);
  }, [cart, lookup]);

  return (
    <div className="flex flex-col">
      <h2 className="text-lg font-semibold text-zinc-700">
        Deckbuilding Achievements{" "}
        <span className={`text-bold ${sum > 0 ? "text-green-600" : ""}`}>
          {sum}
        </span>{" "}
        Points
      </h2>
      <div className="border-t mb-2" />
      <div className="flex justify-between gap-2 mb-2">
        <Selector
          name="picker"
          options={achievements ?? []}
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

            const curr = getValues("achievements") ?? [];

            setValue(
              "achievements",
              [...curr, { ...(selected as any), tempId: crypto.randomUUID() }],
              { shouldDirty: true, shouldValidate: false }
            );

            setValue("picker", null, {
              shouldDirty: true,
              shouldValidate: false,
            });
          }}
        />
      </div>
      <div className="h-80 overflow-y-auto  bg-zinc-100 p-4 rounded-lg border drop-shadow-md flex flex-col gap-2">
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
                  "achievements",
                  cart.filter((x: any) => x.tempId !== c.tempId)
                );
              }}
            />
          </div>
        ))}
      </div>
      {sum > 0 ? (
        <p className="text-xs italic text-red-600 mt-1">
          Note: the point total above is only representative of deck building +
          color achievements, and not points potentially earned during a match.
        </p>
      ) : (
        <div className="my-4" />
      )}
    </div>
  );
};

export default function DecklistForm() {
  const [postDecklist] = usePostDecklistMutation();
  const navigate = useNavigate();
  const methods = useForm();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = methods;
  const Back = useGoBack("/");
  const { data: commanders, isLoading: commandersLoading } =
    useGetCommandersQuery();
  const selectedCommander = useWatch({ control, name: "commander" });
  const selectedPartner = useWatch({ control, name: "partner" });

  const { colorLength, colorName } = useCommanderColors(
    selectedCommander?.colors_id,
    selectedPartner?.colors_id
  );

  const commanderOptions = useMemo(() => {
    return [
      { id: -1, name: "Type To Select a Primary Commander" },
      ...(commanders?.commanders ?? []),
    ];
  }, [commanders]);

  const partnerOptions = useMemo(() => {
    return [
      { id: -1, name: "Type To Select a Partner/Background/Companion" },
      ...(commanders?.partners ?? []),
    ];
  }, [commanders]);

  const companionOptions = commanders?.companions ?? [];

  const handleFormSubmit = async (data: any) => {
    const { picker, ...clean } = data;

    const payload = {
      ...clean,
      code: clean["code"].toUpperCase(),
      commander: clean.commander?.id,
      partner: clean.partner?.id,
      companion: clean.companion?.id,
      achievements: normalize(clean?.achievements) ?? [],
    };

    try {
      const res = await postDecklist(payload).unwrap();
      console.log(res);
      debugger;
      navigate(-1);
    } catch (error) {
      console.error("Failed to submit decklist.", error);
    }
  };

  return (
    <div className="px-4 py-8 md:p-8 h-auto mb-4">
      <Back />
      <div className="mx-auto h-[50vh]">
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(handleFormSubmit)}>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 h-full">
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-zinc-700">
                    General Info
                  </h2>
                  <ColorGrid
                    colors={colorName}
                    submitted
                    show
                    noHover
                    isSmall
                  />
                </div>
                <div className="border-t mb-2" />
                <div className="text-sm mt-1">
                  Provide a name for your decklist
                </div>
                <TextInput
                  name="name"
                  defaultValue=""
                  placeholder="Deck Name"
                  control={control}
                  type="text"
                  classes="text-sm w-full border rounded-lg p-2 mb-2"
                  errors={errors}
                  rules={{ required: "Required" }}
                />
                <div className="text-sm mt-1">
                  Share a URL for where your decklist lives; Moxfield and
                  Archidekt preferred
                </div>
                <TextInput
                  name="url"
                  defaultValue=""
                  placeholder="URL"
                  control={control}
                  type="text"
                  classes="text-sm w-full border rounded-lg p-2 mb-2"
                  errors={errors}
                  rules={{ required: "Required" }}
                />
                <div className="text-sm mt-1">
                  Select your decklist's commander
                </div>
                <Selector
                  name="commander"
                  placeholder="Commander"
                  control={control}
                  options={commanderOptions}
                  isClearable
                  filterOption={(option, input) => {
                    if (input.length > 1) {
                      return option.label
                        .toLowerCase()
                        .includes(input.toLowerCase());
                    }
                    return option.value === "-1";
                  }}
                  getOptionLabel={(option) => option.name}
                  getOptionValue={(option) => String(option.id)}
                  classes="mb-2"
                />
                <div className="text-sm mt-1">
                  (Optional) Select your decklist's partner/background
                </div>
                <Selector
                  name="partner"
                  placeholder="Partner"
                  control={control}
                  options={partnerOptions}
                  isClearable
                  filterOption={(option, input) => {
                    if (input.length > 1) {
                      return option.label
                        .toLowerCase()
                        .includes(input.toLowerCase());
                    }
                    return option.value === "-1";
                  }}
                  getOptionLabel={(option) => option.name}
                  getOptionValue={(option) => String(option.id)}
                  classes="mb-2"
                  disabled={!selectedCommander}
                />
                <div className="text-sm mt-1">
                  (Optional) Select your decklist's companion
                </div>
                <Selector
                  name="companion"
                  placeholder="Companion"
                  control={control}
                  options={companionOptions}
                  isClearable
                  getOptionLabel={(option) => option.name}
                  getOptionValue={(option) => String(option.id)}
                  classes="mb-2"
                  disabled={!selectedCommander}
                />
              </div>
              <AchievementCart colorLength={colorLength} />
            </div>
            <div className="mt-4 backdrop-blur border-t py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-end md:gap-4">
              <Controller
                name="give_credit"
                control={control}
                defaultValue={false}
                render={({ field }) => (
                  <CheckBoxInput
                    {...field}
                    checked={field.value}
                    label="Do you want named credit for this deck?"
                    classes="flex items-start md:items-center w-full md:w-auto"
                  />
                )}
              />
              <TextInput
                name="code"
                defaultValue=""
                placeholder="User code"
                control={control}
                type="text"
                containerClasses="w-full md:w-48"
                classes="text-sm w-full border rounded-lg p-2"
                rules={{
                  validate: (value) =>
                    textValidate(value as string | undefined),
                }}
              />

              <StandardButton title="Submit" type="submit" />
            </div>
            {errors && errors?.code && (
              <div className="text-sm text-red-500 flex justify-end">
                {errors?.code?.message?.toString()}
              </div>
            )}
          </form>
        </FormProvider>
      </div>
    </div>
  );
}
