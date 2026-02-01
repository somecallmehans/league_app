import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { skipToken } from "@reduxjs/toolkit/query";

import {
  useVerifyDecklistSessionQuery,
  useGetParticipantDecklistsQuery,
} from "../../api/apiSlice";
import { useCountdown } from "../../hooks";
import LoadingSpinner from "../../components/LoadingSpinner";
import { DecklistCard } from "./Decklists";
import PageTitle from "../../components/PageTitle";

export default function EditDecklistsPage() {
  const navigate = useNavigate();
  const {
    data: verification,
    isLoading,
    isFetching,
    isError,
  } = useVerifyDecklistSessionQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
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

  if (checking) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-2 md:p-8">
      <div className="flex justify-between items-center">
        <PageTitle title="Edit Decklists" />
        {minutes && seconds && (
          <span className={`text-3xl ${styles}`}>
            {minutes}:{seconds}
          </span>
        )}
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
              url={"REPLACE WITH URL TO EDIT"}
              achievements={achievements}
            />
          )
        )}
      </div>
    </div>
  );
}
