import React from "react";

import { Link, useParams, useLocation } from "react-router-dom";

import { formatDateString } from "../../helpers/dateHelpers";
import { useGetLeagueWinnerQuery } from "../../api/apiSlice";
import PageTitle from "../../components/PageTitle";
import LoadingSpinner from "../../components/LoadingSpinner";
import StandardButton from "../../components/Button";

const CommanderImage = ({ imgs }) => {
  if (imgs.length === 0) {
    return (
      <div className="col-span-2 flex bg-slate-100 rounded-l-lg justify-center items-center">
        <i className="fa-solid fa-trophy text-8xl text-slate-400" />
      </div>
    );
  }
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

const formatArtists = (artists) => {
  if (!artists || artists.length === 0) return undefined;
  const [art1, art2] = artists;

  if (!art2) {
    return `Card art by ${art1}`;
  }

  return `Card art by ${art1} & ${art2}`;
};

const PillContent = ({
  date,
  round_number,
  commander,
  total_points,
  artists,
}) => {
  let main, partner;
  if (commander?.includes("+")) {
    const commanders = commander.split("+");
    main = commanders[0];
    partner = commanders[1];
  } else {
    main = commander;
  }
  const artistText = formatArtists(artists);

  return (
    <div className="flex flex-col gap-2 col-span-2">
      <div className="flex flex-col items-center justify-center gap-2 flex-grow text-center">
        <div className="sm:text-lg uppercase text-gray-500">
          Round {round_number} • {date}
        </div>
        <div className="text-sm sm:text-lg  font-semibold px-2">
          {main} {partner}
        </div>
        <span
          className={`${
            commander ? "bg-green-100" : "bg-red-100"
          } sm:text-base font-medium px-2 py-1 rounded-full`}
        >
          {total_points} Points
        </span>
      </div>
      {artistText && (
        <div className="ml-2 text-[8px] text-slate-300 text-left mt-auto">
          {artistText}
        </div>
      )}
    </div>
  );
};

const RoundPill = ({
  round_number,
  starts_at,
  total_points,
  commander,
  commander_img,
}) => {
  const imageUrls = commander_img.map(({ url }) => url);
  const artists = commander_img.map(({ artist }) => artist);

  return (
    <div className="flex flex-col mb-8">
      <div className="grid grid-cols-4 w-full h-48 bg-white border rounded-lg shadow-md overflow-hidden">
        {commander ? (
          <CommanderImage imgs={imageUrls} />
        ) : (
          <div className="col-span-2 flex bg-slate-100 rounded-l-lg justify-center items-center">
            <i className="fa-solid fa-skull text-8xl text-slate-400" />
          </div>
        )}

        <PillContent
          date={formatDateString(starts_at)}
          round_number={round_number}
          commander={commander}
          total_points={total_points}
          artists={artists}
        />
      </div>
    </div>
  );
};

export default function FocusedWinner() {
  const { mm_yy, participant_id } = useParams();
  const location = useLocation();
  const { participant_name } = location.state;
  const { data: winner, isLoading: winnerLoading } = useGetLeagueWinnerQuery({
    mm_yy,
    participant_id,
  });

  if (winnerLoading) return <LoadingSpinner />;

  const { rounds } = winner;

  return (
    <div className="p-4">
      <div className="flex">
        <Link to={"/champions"}>
          <StandardButton title="Back" />
        </Link>
        <PageTitle title={`${mm_yy} Champion, ${participant_name}`} />
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        {rounds.map((round) => (
          <RoundPill key={round.id} {...round} />
        ))}
      </div>
    </div>
  );
}
