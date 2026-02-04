import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { skipToken } from "@reduxjs/toolkit/query";

import {
  useGetParticipantDecklistsQuery,
  useGetDecklistByIdQuery,
  useUpdateDecklistMutation,
} from "../../api/apiSlice";
import { useEditDecklistGate } from "../../hooks";
import LoadingSpinner from "../../components/LoadingSpinner";
import { DecklistCard } from "./Decklists";
import PageTitle from "../../components/PageTitle";
import { DecklistForm } from "./DecklistForm";
import { normalize } from "../leagueSession/ScorecardPage";

type WrapperProps = {
  title: string;
  countdown: React.ReactNode;
  children: React.ReactNode;
};

const EditPageWrapper = ({ title, countdown, children }: WrapperProps) => {
  return (
    <div className="p-2 md:p-8">
      <div className="flex justify-between ">
        <PageTitle title={title} />
        {countdown}
      </div>

      {children}
    </div>
  );
};

export const EditDecklistFormWrapper = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { decklist_id } = useParams();
  const { Countdown, initialLoading, isActive } = useEditDecklistGate();
  const navigate = useNavigate();

  const [updateDecklist] = useUpdateDecklistMutation();
  const decklistOrSkip =
    decklist_id && !isDeleting ? { decklist_id } : skipToken;
  const { data: decklist, isLoading: dLoading } =
    useGetDecklistByIdQuery(decklistOrSkip);

  if (dLoading) {
    return <LoadingSpinner />;
  }

  const handleUpdate = async (data: any) => {
    if (!decklist_id) return;
    const { picker, code, ...clean } = data;
    const payload = {
      ...clean,
      id: +decklist_id,
      commander: clean.commander?.id,
      partner: clean.partner?.id,
      companion: clean.companion?.id,
      achievements: normalize(clean?.achievements) ?? [],
    };

    try {
      await updateDecklist(payload).unwrap();
      navigate(-1);
    } catch (error) {
      console.error("Failed to edit decklist.", error);
    }
  };

  const handleDelete = async () => {
    if (!decklist_id) return;
    const payload = {
      id: +decklist_id,
      deleted: true,
    };
    try {
      setIsDeleting(true);
      await updateDecklist(payload).unwrap();
      navigate(-1);
    } catch (error) {
      setIsDeleting(false);
      console.error("Failed to delete decklist.", error);
    }
  };

  if (!initialLoading && !isActive) return null;

  return (
    <EditPageWrapper title="Edit Decklist" countdown={<Countdown />}>
      <DecklistForm
        mode="edit"
        initialValues={decklist}
        onSubmit={handleUpdate}
        onDelete={handleDelete}
        wrapperClasses=""
      />
    </EditPageWrapper>
  );
};

export default function EditDecklistsPage() {
  const { Countdown, initialLoading, isActive } = useEditDecklistGate();

  const { data: decklists, isLoading: dLoading } =
    useGetParticipantDecklistsQuery(isActive ? undefined : skipToken);

  if (!initialLoading && !isActive) return null;

  if (dLoading) {
    return <LoadingSpinner />;
  }

  return (
    <EditPageWrapper title="Edit Decklist" countdown={<Countdown />}>
      <details className="w-full md:w-3/4 mb-3">
        <summary className="cursor-pointer text-lg font-medium text-gray-800">
          Click here for page information
        </summary>

        <div className="mt-2 text-xs md:text-sm text-gray-700 space-y-2">
          <p>Select your decklist to edit its achievements, name, etc.</p>
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
    </EditPageWrapper>
  );
}
