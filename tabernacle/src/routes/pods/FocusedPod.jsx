import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import { useGetPodsQuery } from "../../api/apiSlice";
import { handleNavClick } from "../../helpers/helpers";

import PageTitle from "../../components/PageTitle";
import StandardButton from "../../components/Button";
import LoadingSpinner from "../../components/LoadingSpinner";
import PointsModal from "../leagueSession/PointsModal";
import ColorGrid from "../../components/ColorGrid";

const PointsBlock = ({ children }) => (
  <span className="text-sm md:text-base font-light">{children}</span>
);

const PodSquare = ({ participants, handleOnClick, winnerInfo, submitted }) => {
  const navigate = useNavigate();

  const isWinner = (participant_id) =>
    winnerInfo?.participants?.id === participant_id;

  const setColSize = (idx) =>
    [3, 5].includes(participants.length) && participants.length === idx + 1;

  return participants.map(
    ({ name, participant_id, round_points, total_points }, index) => (
      <div
        key={participant_id}
        className={`p-4 sm:p-6 border grid grid-cols-1 overflow-y-auto text-center ${
          setColSize(index) ? "sm:col-span-2" : ""
        }`}
      >
        <div
          onClick={() => {
            handleNavClick(`individual_metrics_${participant_id}`);
            navigate(`/metrics/${participant_id}/`);
          }}
        >
          <span className="hover:text-sky-400 text-lg md:text-2xl">
            {isWinner(participant_id) && (
              <i className="fa-solid fa-crown text-base pr-2 text-yellow-600" />
            )}
            {name}
            {isWinner(participant_id) && (
              <i className="fa-solid fa-crown text-base pl-2 text-yellow-600" />
            )}
          </span>
        </div>
        <div className="flex justify-center gap-2">
          <PointsBlock>{round_points} Round</PointsBlock> /{" "}
          <PointsBlock>{total_points} Month</PointsBlock>
        </div>
        <ColorGrid
          submitted={submitted}
          show={isWinner(participant_id)}
          colors={winnerInfo?.color?.name}
          containerClasses="mt-2"
          endInDraw={winnerInfo?.name === "END IN DRAW"}
          action={() =>
            handleOnClick(
              name,
              round_points,
              participant_id,
              winnerInfo?.name,
              winnerInfo?.color?.name,
              participant_id === winnerInfo?.participants?.id
            )
          }
        />
      </div>
    )
  );
};

const PodContainer = ({ pods, handleOnClick }) => {
  if (!pods) return null;

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
              <div className="mr-4">Table {index + 1}</div>
            </div>
            <div className="shadow-lg border  grid grid-cols-1 sm:grid-cols-2 overflow-y-auto shadow-md">
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
  const navigate = useNavigate();

  const state = location.state || {};
  const search = location.search || "";

  const { round_id } = useParams();

  useEffect(() => {
    if (!state?.roundId) {
      navigate(`/pods${search}`, { replace: true });
    }
  }, [state, navigate, search]);

  const roundId = location?.state?.roundId;
  const roundNumber = location?.state?.roundNumber;
  const date = location?.state?.date;

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
        <Link
          to={{
            pathname: "/pods",
            search,
          }}
        >
          <StandardButton title="Back" />
        </Link>
        <PageTitle title={`Round ${roundNumber} for ${date}`} />
      </div>
      <div className="text-xs md:text-sm font-light text-gray-800 italic w-full md:w-1/2 mb-2">
        Click a player&apos;s name to view their stats, or the icon below it to
        see the achievements they earned this round.
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
