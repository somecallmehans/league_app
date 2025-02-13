import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useGetPodsQuery } from "../../api/apiSlice";

import PageTitle from "../../components/PageTitle";
import StandardButton from "../../components/Button";
import LoadingSpinner from "../../components/LoadingSpinner";
import PointsModal from "../leagueSession/PointsModal";

export default function () {
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState();
  const navigate = useNavigate();

  const location = useLocation();
  const { roundId, roundNumber, date, selectedMonth } = location.state;

  const { data: pods, isLoading: podsLoading } = useGetPodsQuery(roundId, {
    skip: !roundId,
  });

  const handleOnClick = (participant, round_points, participant_id) => {
    setSelected({ participant, round_points, participant_id, roundId });
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
      <PageTitle title={`Round ${roundNumber} for ${date}`} />
      <Link to={"/pods"} state={{ selectedMonth }}>
        <StandardButton title="Back" />
      </Link>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4 sm:px-6 pb-8">
        {Object.keys(pods).map((pod_id, index) => {
          const { participants } = pods[pod_id];
          return (
            <div key={pod_id}>
              <div className="flex items-end justify-center content-center text-xl md:text-3xl mb-2">
                <div className="mr-4">Pod {index + 1}</div>
              </div>
              <div className="shadow-lg border border-blue-300 grid grid-cols-1 sm:grid-cols-2 overflow-y-auto">
                {participants.map(
                  (
                    { participant_id, name, total_points, round_points },
                    index
                  ) => (
                    <div
                      key={participant_id}
                      className={`p-4 sm:p-6 border border-blue-300 grid grid-cols-1 overflow-y-auto text-center ${
                        participants.length === 3 && index === 2
                          ? "sm:col-span-2"
                          : ""
                      }`}
                    >
                      <div
                        onClick={() => navigate(`/metrics/${participant_id}/`)}
                      >
                        <span className="hover:text-sky-400 text-lg md:text-2xl">
                          {name}
                        </span>
                      </div>
                      <span className="text-sm md:text-md font-light">
                        <a
                          className="text-sky-700 hover:text-sky-400"
                          onClick={() =>
                            handleOnClick(name, round_points, participant_id)
                          }
                        >
                          {round_points} Points This Round{" "}
                        </a>
                      </span>
                      <span className="text-sm md:text-md font-light">
                        {total_points} Points This Month
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
      <PointsModal
        isOpen={modalOpen}
        closeModal={() => handleClose()}
        selected={selected}
      />
    </div>
  );
}
