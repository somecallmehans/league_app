import { useEffect } from "react";
import {
  useForm,
  FormProvider,
  useFormContext,
  useWatch,
} from "react-hook-form";
import { useParams, useNavigate } from "react-router-dom";
import {
  useGetScoresheetsQuery,
  useInsertScoresheetMutation,
  useUpdateScoresheetMutation,
} from "../../api/apiSlice";
import { useGoBack, useScorecardInfo, useCommanderOptions } from "../../hooks";
import { ScorecardInfoContext } from "./ScorecardCTX";

import StandardButton from "../../components/Button";
import WinnerFields from "./WinnerFields";
import PlayerFields from "./PlayerFields";
import AchievementCart from "./AchievementCart";
import { skipToken } from "@reduxjs/toolkit/query";

export const normalize = (items?: { id: number; name: string }[]) =>
  items?.map(({ id }) => id) ?? [];

const SubmissionToggle = () => {
  const { control, setValue, resetField } = useFormContext();

  const mode = useWatch({
    control,
    name: "submissionMode",
    defaultValue: "manual",
  });

  const setMode = (next: "manual" | "decklist") => {
    setValue("submissionMode", next, { shouldDirty: true });

    if (next === "decklist") {
      resetField("winner-commander");
      resetField("partner-commander");
      resetField("companion-commander");
      resetField("winner-achievements");
    } else {
      resetField("decklist-code");
    }
  };

  return (
    <>
      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setMode("manual")}
          className={[
            "px-3 py-1 rounded-full text-sm border",
            mode === "manual"
              ? "bg-zinc-900 text-white"
              : "bg-white text-zinc-700",
          ].join(" ")}
        >
          Manual
        </button>
        <button
          type="button"
          onClick={() => setMode("decklist")}
          className={[
            "px-3 py-1 rounded-full text-sm border",
            mode === "decklist"
              ? "bg-zinc-900 text-white"
              : "bg-white text-zinc-700",
          ].join(" ")}
        >
          Decklist
        </button>
      </div>
      {mode === "decklist" && (
        <span className="text-xs md:w-1/2 mt-2">
          Note: If you select a winner before adding the decklist code, it will
          automatically apply "use a decklist that has been shared" points.
        </span>
      )}
    </>
  );
};

export default function ScorecardPage() {
  const { round_id, pod_id } = useParams();
  const navigate = useNavigate();
  const args = round_id && pod_id ? { round_id, pod_id } : skipToken;
  const { data: scoresheet } = useGetScoresheetsQuery(args);
  const [postScoresheet] = useInsertScoresheetMutation();
  const [putScoresheet] = useUpdateScoresheetMutation();

  const methods = useForm({
    defaultValues: {
      "decklist-code": "",
      submissionMode: "manual",
      ...(scoresheet || {}),
    },
  });
  const {
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = methods;

  const options = useCommanderOptions();
  const info = useScorecardInfo();

  const Back = useGoBack(`/${round_id}`);

  useEffect(() => {
    if (scoresheet) {
      reset(scoresheet);
    }
  }, [scoresheet, reset]);

  const handleFormSubmit = async (data: any) => {
    const { picker, submissionMode, ...clean } = data;
    const payload = {
      ...clean,
      winner: clean["winner"]?.id,
      "bring-snack": normalize(clean["bring-snack"]),
      "submit-to-discord": normalize(clean["submit-to-discord"]),
      "lend-deck": normalize(clean["lend-deck"]),
      "knock-out": normalize(clean["knock-out"]),
      "money-pack": normalize(clean["money-pack"]),
      "winner-commander": clean["winner-commander"]?.id,
      "partner-commander": clean["partner-commander"]?.id,
      "companion-commander": clean["companion-commander"]?.id,
      "winner-achievements": normalize(clean["winner-achievements"]),
      round_id,
      pod_id,
    };

    try {
      if (scoresheet?.meta?.isSubmitted) {
        await putScoresheet(payload).unwrap();
      } else {
        await postScoresheet(payload).unwrap();
      }
      navigate(-1);
    } catch (error) {
      console.error("Failed to submit scoresheet.", error);
    }
  };

  return (
    <div className="p-4 md:p-8 min-h-screen flex flex-col">
      <div className="mx-auto">
        <div className="bg-white border rounded-xl shadow-sm p-4 md:p-6 flex flex-col min-h-0 flex-1">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <Back />

            <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:gap-2">
              {info.participants?.map(({ name }, idx) => (
                <span
                  key={`${name}${idx}`}
                  className="px-3 py-1 text-sm bg-sky-600 text-white rounded-full text-center flex items-center justify-center"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>

          <ScorecardInfoContext.Provider value={{ ...info, ...options }}>
            <FormProvider {...methods}>
              <form
                onSubmit={handleSubmit(handleFormSubmit)}
                className="flex flex-col min-h-0 flex-1"
              >
                <SubmissionToggle />
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 flex-1 min-h-0 items-stretch">
                  <div className="flex flex-col h-full min-h-0">
                    <PlayerFields />
                    <WinnerFields />
                  </div>
                  <div className="flex flex-col h-full min-h-0">
                    <AchievementCart />
                  </div>
                </div>
                <div className="mt-4 bg-white/90 backdrop-blur border-t py-3 flex justify-end">
                  <StandardButton
                    title="Submit"
                    type="submit"
                    disabled={isSubmitting}
                  />
                </div>
              </form>
            </FormProvider>
          </ScorecardInfoContext.Provider>
        </div>
      </div>
    </div>
  );
}
