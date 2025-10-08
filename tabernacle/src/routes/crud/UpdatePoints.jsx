import React, { useState, useMemo } from "react";
import {
  useGetParticipantsQuery,
  useGetAllRoundsQuery,
  useGetAchievementRoundQuery,
  usePostUpsertParticipantAchievementMutation,
  useGetAchievementsQuery,
} from "../../api/apiSlice";
import StandardButton from "../../components/Button";
import LoadingSpinner from "../../components/LoadingSpinner";
import Modal from "../../components/Modal";

import { SimpleSelect } from "../crud/CrudComponents";

const AchievementList = ({ earnedAchievements }) => {
  const [deleteTarget, setDeleteTarget] = useState();
  const [postUpsertParticipantAchievement] =
    usePostUpsertParticipantAchievementMutation();

  if (earnedAchievements.length === 0) {
    return "No achievements found for this round";
  }

  const handleDelete = async () => {
    try {
      await postUpsertParticipantAchievement({
        id: deleteTarget,
        deleted: true,
      });
      setDeleteTarget(undefined);
    } catch (err) {
      console.error("Failed to delete achievement: ", err);
    }
  };

  return (
    <div className="space-y-2">
      {earnedAchievements.map(({ id, full_name, earned_points }) => (
        <div
          key={id}
          className="flex items-center justify-between border border-gray-200 rounded px-4 py-2"
        >
          <div className="flex flex-col">
            <span className="font-medium">{full_name}</span>
            <span className="text-sm text-gray-500">
              {earned_points ?? 0} point{earned_points === 1 ? "" : "s"}
            </span>
          </div>

          <i
            onClick={() => setDeleteTarget(id)}
            className="fa-solid fa-trash text-gray-400 hover:text-red-400 cursor-pointer"
          />
        </div>
      ))}
      <Modal
        isOpen={!!deleteTarget}
        closeModal={() => setDeleteTarget(undefined)}
        action={() => handleDelete()}
        title="Are you sure you want to delete this achievement?"
        actionTitle="Confirm"
        closeTitle="Cancel"
      />
    </div>
  );
};

const AchievementGrid = ({
  earnedAchievements,
  selectedParticipant,
  selectedRound,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState();
  const { data: achievements } = useGetAchievementsQuery();
  const [postUpsertParticipantAchievement] =
    usePostUpsertParticipantAchievementMutation();

  const handleInsert = async () => {
    try {
      await postUpsertParticipantAchievement({
        participant_id: selectedParticipant,
        achievement_id: selectedAchievement,
        round_id: selectedRound,
      });
      setIsOpen(false);
    } catch (err) {
      console.error("Failed to delete achievement: ", err);
    }
  };

  const data = useMemo(() => {
    if (!achievements) return [];
    return achievements.data.map(({ full_name, id }) => ({
      value: id,
      label: full_name,
    }));
  }, [achievements]);

  return (
    <div className="py-4">
      <div className="flex justify-start mb-2">
        <StandardButton title="Add" action={() => setIsOpen(true)} />
      </div>

      <AchievementList earnedAchievements={earnedAchievements} />
      <Modal
        isOpen={isOpen}
        closeModal={() => setIsOpen(false)}
        action={() => handleInsert()}
        body={
          <div className="py-2 z-40">
            <SimpleSelect
              placeholder="Select Achievement"
              options={data}
              onChange={(obj) => setSelectedAchievement(obj.value)}
              classes="grow"
            />
          </div>
        }
        title="Add achievement"
        actionTitle="Confirm"
        closeTitle="Cancel"
        disableConfirm={!selectedAchievement}
      />
    </div>
  );
};

export default function Page() {
  const [selectedParticipant, setSelectedParticipant] = useState();
  const [selectedRound, setSelectedRound] = useState();

  const { data: participants, isLoading: participantsLoading } =
    useGetParticipantsQuery();
  const { data: rounds } = useGetAllRoundsQuery(
    {
      participant_id: selectedParticipant,
    },
    { skip: !selectedParticipant }
  );

  const canFetch = selectedParticipant && selectedRound;
  const { data: earnedAchievements } = useGetAchievementRoundQuery(
    {
      participant_id: selectedParticipant,
      round_id: selectedRound,
    },
    { skip: !canFetch }
  );

  const participantsList = useMemo(() => {
    return participants.map(({ name, id }) => ({ label: name, value: id }));
  }, [participants]);

  const roundsList = useMemo(() => {
    if (!rounds) return [];
    return rounds.map(({ round_number, starts_at, id }) => ({
      label: `${starts_at} - Round ${round_number}`,
      value: id,
    }));
  }, [rounds]);

  if (participantsLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-2 md:p-4 mx-auto">
      <div className="text-sm text-gray-500 italic md:w-1/2 mb-1">
        Select a player and then a round to add or remove new achievements for
        them
      </div>
      <div className="flex gap-2">
        <SimpleSelect
          placeholder="Select Participant"
          options={participantsList}
          onChange={(obj) => {
            setSelectedParticipant(obj.value);
          }}
          classes="min-w-[240px] shrink-0"
        />
        {selectedParticipant && (
          <SimpleSelect
            placeholder="Select Round"
            options={roundsList}
            onChange={(obj) => setSelectedRound(obj.value)}
            classes="grow"
          />
        )}
      </div>
      {earnedAchievements && (
        <AchievementGrid
          earnedAchievements={earnedAchievements}
          selectedParticipant={selectedParticipant}
          selectedRound={selectedRound}
        />
      )}
    </div>
  );
}
