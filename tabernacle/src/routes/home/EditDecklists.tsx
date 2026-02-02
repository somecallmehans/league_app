import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { skipToken } from "@reduxjs/toolkit/query";

import {
  useVerifyDecklistSessionQuery,
  useGetParticipantDecklistsQuery,
  useGetDecklistByIdQuery,
  useUpdateDecklistMutation,
} from "../../api/apiSlice";
import { useCountdown } from "../../hooks";
import LoadingSpinner from "../../components/LoadingSpinner";
import { DecklistCard } from "./Decklists";
import PageTitle from "../../components/PageTitle";
import { DecklistForm } from "./DecklistForm";
import { normalize } from "../leagueSession/ScorecardPage";

export const EditDecklistFormWrapper = () => {
  const { decklist_id } = useParams();
  const navigate = useNavigate();

  const [updateDecklist] = useUpdateDecklistMutation();
  const decklistOrSkip = decklist_id ? { decklist_id } : skipToken;
  const { data: decklist, isLoading: dLoading } =
    useGetDecklistByIdQuery(decklistOrSkip);

  if (dLoading) {
    return <LoadingSpinner />;
  }

  const handleUpdate = async (data: any) => {
    const { picker, code, ...clean } = data;
    const payload = {
      ...clean,
      id: decklist_id,
      commander: clean.commander?.id,
      partner: clean.partner?.id,
      companion: clean.companion?.id,
      achievements: normalize(clean?.achievements) ?? [],
    };

    try {
      await updateDecklist(payload).unwrap();
      navigate(-1);
    } catch (error) {
      console.error("Failed to submit decklist.", error);
    }
  };

  return (
    <DecklistForm
      mode="edit"
      initialValues={decklist}
      onSubmit={handleUpdate}
    />
  );
};

export default function EditDecklistsPage() {
  const navigate = useNavigate();
  const {
    data: verification,
    isLoading,
    isFetching,
    isError,
  } = useVerifyDecklistSessionQuery(undefined, {
    pollingInterval: 15_000,
  });

  const canFetchDecklists = verification?.active === true;

  const { data: decklists } = useGetParticipantDecklistsQuery(
    canFetchDecklists ? undefined : skipToken
  );

  const { minutes, seconds, styles } = useCountdown(verification?.expires_at);
  const checking = isLoading || isFetching;

  useEffect(() => {
    if (checking) return;
    if (isError || verification?.active === false) {
      navigate("/decklists/gatekeeper", { replace: true });
    }
  }, [checking, isError, verification?.active, navigate]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (verification?.active === false) {
    return null;
  }

  return (
    <div className="p-2 md:p-8">
      <div className="flex justify-between items-center">
        <PageTitle title="Edit Decklists" />
        <span className={`text-3xl ${styles}`}>
          {minutes}:{seconds}
        </span>
      </div>
      <details className="w-full md:w-3/4 mb-3">
        <summary className="cursor-pointer text-lg font-medium text-gray-800">
          Click here for page information
        </summary>

        <div className="mt-2 text-xs md:text-sm text-gray-700 space-y-2">
          <p>Select your decklist to edit it's achievements, name, etc.</p>
        </div>
      </details>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5">
        {decklists?.map(
          ({
            id,
            name,
            commander_img,
            partner_img,
            companion_img,
            color,
            points,
            participant_name,
            code,
            achievements,
          }) => (
            <DecklistCard
              key={id}
              name={name}
              commander_img={commander_img}
              partner_img={partner_img}
              companion_img={companion_img}
              color={color}
              points={points}
              participant_name={participant_name}
              code={code}
              url={`${id}`}
              achievements={achievements}
            />
          )
        )}
      </div>
    </div>
  );
}
