import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useGetPodsQuery } from "../../api/apiSlice";

import PageTitle from "../../components/PageTitle";
import StandardButton from "../../components/Button";
import LoadingSpinner from "../../components/LoadingSpinner";
import PointsModal from "../leagueSession/PointsModal";
import ColorGrid from "../../components/ColorGrid";

const PointsBlock = ({ children }) => (
  <span className="text-sm md:text-md font-light">{children}</span>
);

const PodSquare = ({ participants, handleOnClick, winnerInfo, submitted }) => {
  const navigate = useNavigate();

  return participants.map(
    ({ name, participant_id, round_points, total_points }, index) => (
      <div
        key={participant_id}
        className={`p-4 sm:p-6 border border-blue-300 grid grid-cols-1 overflow-y-auto text-center ${
          participants.length === 3 && index === 2 ? "sm:col-span-2" : ""
        }`}
      >
        <div onClick={() => navigate(`/metrics/${participant_id}/`)}>
          <span className="hover:text-sky-400 text-lg md:text-2xl">{name}</span>
        </div>
        <div className="flex justify-center gap-2">
          <PointsBlock>{round_points} Round</PointsBlock> /{" "}
          <PointsBlock>{total_points} Month</PointsBlock>
        </div>
        <ColorGrid
          submitted={submitted}
          show={winnerInfo?.participants?.id === participant_id}
          colors={winnerInfo?.colors?.name}
          containerClasses="mt-2"
          action={() =>
            handleOnClick(
              name,
              round_points,
              participant_id,
              winnerInfo?.name,
              winnerInfo?.colors?.name,
              participant_id === winnerInfo?.participants?.id
            )
          }
        />
      </div>
    )
  );
};

const PodContainer = ({ pods, handleOnClick }) => {
  if (Object.keys(pods).length === 0) {
    return (
      <div className="p-4 mb-4 h-full ">
        <div className="text-3xl">
          No pod information here; the round has not started yet
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4 sm:px-6 pb-8">
      {Object.keys(pods).map((pod_id, index) => {
        const { participants, winner_info, submitted } = pods[pod_id];

        return (
          <div key={pod_id}>
            <div className="flex items-end justify-center content-center text-xl md:text-3xl mb-2">
              <div className="mr-4">Pod {index + 1}</div>
            </div>
            <div className="shadow-lg border border-blue-300 grid grid-cols-1 sm:grid-cols-2 overflow-y-auto">
              <PodSquare
                participants={participants}
                index={index}
                handleOnClick={handleOnClick}
                winnerInfo={winner_info}
                submitted={submitted}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default function () {
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState();

  const location = useLocation();
  const { roundId, roundNumber, date, selectedMonth } = location.state;

  const { data: pods, isLoading: podsLoading } = useGetPodsQuery(roundId, {
    skip: !roundId,
  });

  const handleOnClick = (
    participant,
    round_points,
    participant_id,
    winnerCommander,
    colors,
    isWinner
  ) => {
    setSelected({
      participant,
      round_points,
      participant_id,
      roundId,
      winnerCommander,
      colors,
      isWinner,
    });
    setModalOpen(!modalOpen);
  };

  const handleClose = () => {
    setModalOpen(false);
  };

  if (podsLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="bg-white p-4 mb-4 h-full">
      <div className="flex">
        <Link to={"/pods"} state={{ selectedMonth }}>
          <StandardButton title="Back" />
        </Link>
        <PageTitle title={`Round ${roundNumber} for ${date}`} />
      </div>
      <PodContainer pods={pods} handleOnClick={handleOnClick} />

      <PointsModal
        isOpen={modalOpen}
        closeModal={() => handleClose()}
        selected={selected}
      />
    </div>
  );
}
