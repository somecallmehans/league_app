import { useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { useParams, useNavigate } from "react-router-dom";
import {
  useGetScoresheetsQuery,
  useInsertScoresheetMutation,
  useUpdateScoresheetMutation,
} from "../../api/apiSlice";
import { useGoBack, useScorecardInfo } from "../../hooks";
import { ScorecardInfoContext } from "./ScorecardCTX";

import StandardButton from "../../components/Button";
import WinnerFields from "./WinnerFields";
import PlayerFields from "./PlayerFields";
import AchievementCart from "./AchievementCart";
import { skipToken } from "@reduxjs/toolkit/query";

const normalize = (items?: { id: number; name: string }[]) =>
  items?.map(({ id }) => id) ?? [];

export default function ScorecardPage() {
  const { round_id, pod_id } = useParams();
  const navigate = useNavigate();
  const args = round_id && pod_id ? { round_id, pod_id } : skipToken;
  const { data: scoresheet } = useGetScoresheetsQuery(args);
  const [postScoresheet] = useInsertScoresheetMutation();
  const [putScoresheet] = useUpdateScoresheetMutation();

  const info = useScorecardInfo();

  const Back = useGoBack(`/${round_id}`);

  const methods = useForm({ defaultValues: scoresheet || undefined });
  const {
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = methods;

  useEffect(() => {
    if (scoresheet) {
      reset(scoresheet);
    }
  }, [scoresheet]);

  const handleFormSubmit = async (data: any) => {
    // We also need to strip names from the POST body
    const { picker, ...clean } = data;

    const payload = {
      ...clean,
      winner: clean["winner"]?.id,
      "winner-commander": clean["winner-commander"]?.id,
      "partner-commander": clean["partner-commander"]?.id,
      "bring-snack": normalize(clean["bring-snack"]),
      "submit-to-discord": normalize(clean["submit-to-discord"]),
      "lend-deck": normalize(clean["lend-deck"]),
      "knock-out": normalize(clean["knock-out"]),
      "money-pack": normalize(clean["money-pack"]),
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
      navigate(`/league-session/${round_id}`);
    } catch (error) {
      console.error("Failed to submit scoresheet.", error);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mx-auto">
        <div className="bg-white border rounded-xl shadow-sm p-4 md:p-6">
          <div className="flex items-center">
            <Back />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {info.participants?.map(({ name }, idx) => (
              <span
                key={`${name}${idx}`}
                className="px-3 py-1 text-sm bg-sky-600 text-white rounded-full"
              >
                {name}
              </span>
            ))}
          </div>
          <ScorecardInfoContext.Provider value={info}>
            <FormProvider {...methods}>
              <form onSubmit={handleSubmit(handleFormSubmit)}>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <PlayerFields />
                    <WinnerFields />
                  </div>
                  <AchievementCart />
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
