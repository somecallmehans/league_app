import { useMemo, useEffect } from "react";
import { toast } from "react-toastify";

import { useNavigate } from "react-router-dom";
import {
  useForm,
  FormProvider,
  useFormContext,
  useWatch,
  Controller,
} from "react-hook-form";

import { usePostDecklistMutation } from "../../api/apiSlice";
import {
  useGoBack,
  useDecklistCart,
  useCommanderColors,
  useCommanderOptions,
} from "../../hooks";
import {
  TextInput,
  Selector,
  CheckBoxInput,
} from "../../components/FormInputs";
import { textValidate } from "../../components/Modals/SignInModal";
import StandardButton from "../../components/Button";
import { normalize } from "../leagueSession/ScorecardPage";

import ColorGrid from "../../components/ColorGrid";

export const pointLookup: Record<number, number> = {
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

  const basePoints = pointLookup[colorLength] ?? 0;

  const sum = useMemo(() => {
    const cartPoints =
      cart?.reduce(
        (acc: number, curr: any) => acc + (lookup?.[curr.id] ?? 0),
        0
      ) ?? 0;

    return basePoints + cartPoints;
  }, [cart, lookup, basePoints]);

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
      <div className="flex flex-col justify-between mb-2">
        <span className="text-sm">Type to search and add achievements</span>
        <Selector
          name="picker"
          options={achievements ?? []}
          control={control}
          placeholder="Deckbuilding Achievements"
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
        <p className="text-xs italic text-blue-600 mt-1">
          Note: the point total above is only representative of deck building +
          color achievements, and not points potentially earned during a match.
        </p>
      ) : (
        <div className="my-4" />
      )}
    </div>
  );
};

export type DecklistFormValues = {
  name: string;
  url: string;
  commander: { id: number; name: string; color_id: number } | null;
  partner: { id: number; name: string; color_id: number } | null;
  companion: { id: number; name: string; color_id: number } | null;
  achievements: Array<{ id: number; name: string; tempId?: string }>;
  give_credit: boolean;

  code?: string;
};

type DecklistFormMode = "create" | "edit";

interface DecklistFormProps {
  initialValues?: DecklistFormValues;
  mode: DecklistFormMode;
  onSubmit: (values: any) => Promise<void> | void;
  onDelete?: (values: any) => Promise<void> | void;
  wrapperClasses?: string;
}

export function DecklistForm({
  mode,
  initialValues,
  onSubmit,
  onDelete,
  wrapperClasses = "px-4 py-8 md:p-8 h-auto mb-4",
}: DecklistFormProps) {
  const { commanderOptions, partnerOptions, companionOptions } =
    useCommanderOptions();

  const methods = useForm({
    defaultValues: initialValues ?? {
      name: "",
      url: "",
      commander: null,
      partner: null,
      companion: null,
      achievements: [],
      give_credit: false,
      ...(mode === "create" ? { code: "" } : {}),
    },
  });
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    getValues,
    reset,
  } = methods;
  const Back = useGoBack("/");

  const selectedCommander = useWatch({ control, name: "commander" });
  const selectedPartner = useWatch({ control, name: "partner" });

  const { colorLength, colorName } = useCommanderColors(
    selectedCommander?.color_id,
    selectedPartner?.color_id
  );

  useEffect(() => {
    if (mode === "edit" && initialValues) {
      reset(initialValues, { keepDirty: false });
    }
  }, [mode, initialValues, reset]);

  const showCode = mode === "create";

  return (
    <div className={`${wrapperClasses}`}>
      <Back />
      <details className="w-full md:w-3/4 my-2">
        <summary className="cursor-pointer text-lg font-medium text-gray-800">
          Click here for submission instructions
        </summary>

        <div className="mt-2 text-xs md:text-sm text-gray-700 space-y-2">
          <p>
            Enter a name for your deck, paste the decklist link, and select the
            commander(s) used.
          </p>

          <p>
            Search for and choose any <span>deckbuilding achievements</span>{" "}
            your deck earns. Color identity achievements are added
            automatically.
          </p>

          <p>
            Choose whether your name should appear on the decklist page as the
            deck’s creator.
          </p>

          <p>
            To submit the decklist, enter your personal verification code. You
            can get this code by typing{" "}
            <span className="font-semibold">/mycode</span> in the league
            Discord.
          </p>
        </div>
      </details>
      <div className="mx-auto w-full">
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)}>
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
                <div className="text-sm mt-1">Name your decklist</div>
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
                  Share the Moxfield or Archidekt URL for your decklist
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
                  onChange={(selected) => {
                    const cart = getValues("achievements") ?? [];
                    if (!selected) {
                      setValue("companion", null, {
                        shouldDirty: true,
                        shouldValidate: false,
                      });
                      setValue(
                        "achievements",
                        cart.filter(({ id }: { id: number }) => id !== 28)
                      );
                      return;
                    }
                    // TODO Fix this hack that no one
                    // will care about but me lmao
                    if (cart.some(({ id }: { id: number }) => id === 28)) {
                      return;
                    }
                    setValue("achievements", [
                      ...cart,
                      {
                        id: 28,
                        name: 'Win with a deck that includes one of Ikoria\'s "Companions" as a companion',
                        tempId: crypto.randomUUID(),
                      },
                    ]);
                  }}
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
              {showCode ? (
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
              ) : null}
              <StandardButton
                title="Submit"
                type="submit"
                disabled={isSubmitting}
              />
              {!showCode ? (
                <StandardButton
                  title="Delete"
                  type="button"
                  action={onDelete}
                  className="bg-red-500 text-white data-[hover]:bg-red-600"
                />
              ) : null}
            </div>
            {showCode && errors && errors?.code && (
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

export default function DecklistFormWrapper() {
  const [postDecklist] = usePostDecklistMutation();
  const navigate = useNavigate();
  const handleFormSubmit = async (data: any) => {
    const { picker, achievements, ...clean } = data;

    if (achievements.length === 0) {
      toast.error("Must add at least 1 achievement to submit a decklist.");
      return;
    }

    const payload = {
      ...clean,
      code: (clean["code"] ?? "").toUpperCase(),
      commander: clean.commander?.id,
      partner: clean.partner?.id,
      companion: clean.companion?.id,
      achievements: normalize(achievements) ?? [],
    };

    try {
      await postDecklist(payload).unwrap();
      navigate(-1);
    } catch (error) {
      console.error("Failed to submit decklist.", error);
    }
  };
  return <DecklistForm mode="create" onSubmit={handleFormSubmit} />;
}
