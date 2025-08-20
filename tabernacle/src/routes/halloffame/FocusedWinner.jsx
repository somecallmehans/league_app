import React from "react";

import { useParams } from "react-router-dom";

import { formatDateString } from "../../helpers/dateHelpers";
import { useGetLeagueWinnerQuery } from "../../api/apiSlice";
import PageTitle from "../../components/PageTitle";

const CommanderImage = ({ imgs }) => {
  const [img1, img2] = imgs;
  return (
    <div className="col-span-2 overflow-hidden rounded-l-lg">
      <div className="grid grid-cols-2 h-full w-full">
        {imgs.length <= 1 ? (
          <img
            src={img1}
            alt=""
            className="col-span-2 w-full h-full object-cover"
          />
        ) : (
          <>
            <img src={img1} alt="" className="w-full h-full object-cover" />
            <img src={img2} alt="" className="w-full h-full object-cover" />
          </>
        )}
      </div>
    </div>
  );
};

const PillContent = ({ date, round_number, commander, total_points }) => {
  let main, partner;
  if (commander?.includes("+")) {
    const commanders = commander.split("+");
    main = commanders[0];
    partner = commanders[1];
  } else {
    main = commander;
  }

  return (
    <div className="flex flex-col gap-2 text-center justify-center col-span-2">
      <div className="sm:text-lg uppercase text-gray-500">
        Round {round_number} • {date}
      </div>
      <div className="text-sm sm:text-lg  font-semibold px-2">
        {main} {partner}
      </div>
      <div className="mt-1">
        <span
          className={`inline-block bg-green-100 ${
            commander ? "bg-green-100" : "bg-red-100"
          } sm:text-lg font-medium px-2 py-1 rounded-full`}
        >
          {total_points} Points
        </span>
      </div>
    </div>
  );
};

const RoundPill = ({
  round_number,
  created_at,
  total_points,
  commander,
  commander_img,
}) => {
  return (
    <div className="flex flex-col mb-8">
      <div className="grid grid-cols-4 w-full h-48 bg-white border rounded-lg shadow-md overflow-hidden">
        {commander ? (
          <CommanderImage imgs={commander_img.slice(0, 2)} />
        ) : (
          <div className="col-span-2 bg-slate-100 rounded-l-lg" />
        )}
        <PillContent
          date={formatDateString(created_at)}
          round_number={round_number}
          commander={commander}
          total_points={total_points}
        />
      </div>
    </div>
  );
};

export default function FocusedWinner() {
  const { mm_yy, participant_id } = useParams();
  const { data: winner, isLoading: winnerLoading } = useGetLeagueWinnerQuery({
    mm_yy,
    participant_id,
  });

  if (winnerLoading) return null;

  const { rounds } = winner;

  console.log(rounds);

  return (
    <div className="p-4 md:p-8">
      <PageTitle title={`${mm_yy} Champion`} />
      <div className="grid sm:grid-cols-2 gap-2">
        {rounds.map((round) => (
          <RoundPill key={round.id} {...round} />
        ))}
      </div>
    </div>
  );
}
