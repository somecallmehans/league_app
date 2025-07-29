import React from "react";

const PodRow = ({ participant_id, occurred, data }) => (
  <div className="flex items-center justify-between py-2">
    <div className="flex flex-col">
      <span className="flex justify-start font-medium">{occurred}</span>
      <div className="flex flex-wrap gap-4 justify-start my-2">
        {data.map(({ id, round_number, participants, commander_name }) => (
          <div
            key={id}
            className="rounded border bg-white p-3 shadow-sm space-y-1 grow"
          >
            <div className="text-sm text-left font-medium text-gray-500">
              Round {round_number} - {commander_name}
            </div>
            <div className="flex flex-wrap gap-2">
              {participants.map(({ id, name, winner }) => (
                <span
                  key={id}
                  className={`${
                    winner ? "bg-yellow-400" : "bg-slate-200"
                  } py-1 px-2 rounded text-sm ${
                    +participant_id === id
                      ? "underline decoration-solid font-bold"
                      : ""
                  }`}
                >
                  {winner && <i className="fa-solid fa-trophy mr-1" />}
                  {name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function Page({ pods, participant_id }) {
  return pods.map(([occurred, data]) => (
    <PodRow
      participant_id={participant_id}
      occurred={occurred}
      data={data}
      key={occurred}
    />
  ));
}
